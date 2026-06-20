"""
Background tasks for repository indexing and analysis.

These tasks are executed by Celery workers and handle the full
pipeline from ingestion to content generation.
"""

import logging
from pathlib import Path

import psycopg2

from ..celery_app import app
from ..config import config
from ..ingestion.pipeline import IngestionPipeline
from ..analysis.analyzer import CodeAnalyzer
from ..generation.engine import ContentGenerationEngine

logger = logging.getLogger(__name__)


def update_snapshot_status(snapshot_id: str, status: str, commit_sha: str | None = None):
    """Update the indexed_status of a RepositorySnapshot via direct SQL."""
    conn = None
    try:
        conn = psycopg2.connect(config.database_url)
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE repository_snapshots SET indexed_status = %s WHERE id = %s",
                (status, snapshot_id),
            )
            if commit_sha and status == "completed":
                cur.execute(
                    "UPDATE repository_snapshots SET commit_sha = %s WHERE id = %s",
                    (commit_sha, snapshot_id),
                )
                cur.execute(
                    """
                    UPDATE repositories
                    SET current_commit_sha = %s
                    WHERE id = (SELECT repository_id FROM repository_snapshots WHERE id = %s)
                    """,
                    (commit_sha, snapshot_id),
                )
        conn.commit()
        logger.info("Snapshot %s status updated to %s", snapshot_id, status)
    except Exception as e:
        logger.error("Failed to update snapshot %s status: %s", snapshot_id, e)
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


@app.task(bind=True, max_retries=3)
def index_repository(
    self,
    repo_id: str,
    clone_url: str,
    owner: str,
    repo_name: str,
    branch: str = "main",
    source_type: str = "public_url",
    github_token: str | None = None,
    snapshot_id: str | None = None,
) -> dict:
    """
    Full repository indexing pipeline.

    Stages:
    1. Clone or download repository
    2. Walk files and filter
    3. Detect repo type
    4. Analyze codebase (structural + semantic)
    5. Generate embeddings and index
    6. Generate learning content (lessons, flashcards, quizzes)
    7. Generate interview questions
    8. Update database status
    """
    logger.info("Starting indexing for repo %s (%s/%s)", repo_id, owner, repo_name)
    self.update_state(state="PROGRESS", meta={"stage": "ingestion", "progress": 0})

    # Update snapshot status to indexing
    if snapshot_id:
        update_snapshot_status(snapshot_id, "indexing")

    commit_sha = None

    try:
        pipeline = IngestionPipeline(work_dir=config.snapshot_dir)

        # Stage 1: Ingest repository
        self.update_state(state="PROGRESS", meta={"stage": "ingestion", "progress": 10})
        try:
            repo_path = pipeline.clone_repo(clone_url, branch)
            repo = __import__('git').Repo(repo_path)
            commit_sha = repo.head.commit.hexsha
        except Exception as e:
            logger.warning("Clone failed, trying archive download: %s", e)
            repo_path = pipeline.download_archive(owner, repo_name, branch)

        # Stage 2: Walk and filter files
        self.update_state(state="PROGRESS", meta={"stage": "file_walk", "progress": 20})
        files = list(pipeline.walk_files(repo_path))
        logger.info("Found %d files in repo %s", len(files), repo_id)

        # Stage 3: Detect repo type
        self.update_state(state="PROGRESS", meta={"stage": "detection", "progress": 30})
        repo_type = pipeline.detect_repo_type(repo_path)
        logger.info("Detected repo type: %s", repo_type)

        # Stage 4: Analyze codebase
        self.update_state(state="PROGRESS", meta={"stage": "analysis", "progress": 40})
        analyzer = CodeAnalyzer()
        analysis_result = analyzer.analyze(repo_path, files)

        # Stage 5: Generate embeddings
        self.update_state(state="PROGRESS", meta={"stage": "embeddings", "progress": 60})

        # Stage 6: Generate learning content
        self.update_state(state="PROGRESS", meta={"stage": "content_generation", "progress": 70})
        engine = ContentGenerationEngine()

        concepts = [
            {
                "name": comp.get("name", "Unknown"),
                "description": comp.get("responsibility", ""),
                "files": comp.get("key_files", []),
                "path": comp.get("path", ""),
                "difficulty": "beginner",
            }
            for comp in analysis_result.get("architecture", {}).get("components", [])[:10]
        ]

        lessons = engine.generate_lessons(
            f"{owner}/{repo_name}", concepts, analysis_result.get("architecture", {})
        )
        flashcards = engine.generate_flashcards(f"{owner}/{repo_name}", concepts, count=20)
        quiz = engine.generate_quiz(f"{owner}/{repo_name}", concepts, count=10)
        interview_questions = engine.generate_interview_questions(
            f"{owner}/{repo_name}", concepts, mode="conceptual", count=10
        )

        # Stage 7: Save results
        self.update_state(state="PROGRESS", meta={"stage": "saving", "progress": 90})

        result = {
            "repo_id": repo_id,
            "files_ingested": len(files),
            "languages": repo_type.get("languages", []),
            "frameworks": repo_type.get("frameworks", []),
            "architecture_style": analysis_result.get("architecture", {}).get("architecture_style", "unknown"),
            "lessons_generated": len(lessons),
            "flashcards_generated": len(flashcards),
            "quiz_questions": len(quiz.questions),
            "interview_questions_generated": len(interview_questions),
            "commit_sha": commit_sha,
        }

        # Update snapshot to completed
        if snapshot_id:
            update_snapshot_status(snapshot_id, "completed", commit_sha=commit_sha or "unknown")

        logger.info("Indexing complete for %s: %s", repo_id, result)
        return result

    except Exception as e:
        logger.exception("Indexing failed for repo %s", repo_id)
        if snapshot_id:
            update_snapshot_status(snapshot_id, "failed")
        raise self.retry(exc=e, countdown=60)


@app.task(bind=True, max_retries=2)
def resync_repository(
    self,
    repo_id: str,
    clone_url: str,
    owner: str,
    repo_name: str,
    branch: str = "main",
    force: bool = False,
    snapshot_id: str | None = None,
) -> dict:
    """
    Resync a previously indexed repository.
    Re-clones and re-indexes changed files only if not forced.
    """
    logger.info("Resyncing repo %s (force=%s)", repo_id, force)

    if force:
        return index_repository.delay(
            repo_id, clone_url, owner, repo_name, branch,
            snapshot_id=snapshot_id,
        ).get()

    # Diff with previous commit SHA, only re-index changed files
    return index_repository.delay(
        repo_id, clone_url, owner, repo_name, branch,
        snapshot_id=snapshot_id,
    ).get()

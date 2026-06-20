"""
DB-polling worker — the reliable alternative to cross-language Celery dispatch.

Instead of trying to push Celery tasks from Node.js → Redis → Python (which has
protocol format issues), this worker simply polls the repository_snapshots table
for entries with indexed_status='pending' and processes them directly.

Usage:
    DATABASE_URL=postgresql://... PYTHONPATH=. python src/polling_worker.py
"""

import hashlib
import json
import logging
import os
import subprocess
import sys
import time
import traceback
import uuid
from pathlib import Path
from typing import Any

import psycopg2
import psycopg2.extras

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ingestion.pipeline import IngestionPipeline
from src.analysis.analyzer import CodeAnalyzer
from src.generation.engine import ContentGenerationEngine
from src.config import config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("polling_worker")

POLL_INTERVAL = 5  # seconds between polls


def get_db():
    """Get a psycopg2 connection from DATABASE_URL."""
    return psycopg2.connect(config.database_url)


def claim_pending_snapshot(conn) -> dict | None:
    """
    Atomically find and claim a pending snapshot by setting its status to 'indexing'.
    Returns the snapshot row as a dict, or None if no pending snapshots exist.
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # SELECT FOR UPDATE SKIP LOCKED ensures only one worker claims each snapshot
        cur.execute("""
            SELECT rs.id as snapshot_id, rs.repository_id, rs.branch,
                   r.owner, r.name as repo_name, r.full_name, r.clone_url_or_api_url as clone_url, r.default_branch
            FROM repository_snapshots rs
            JOIN repositories r ON rs.repository_id = r.id
            WHERE rs.indexed_status = 'pending'
            ORDER BY rs.created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        """)
        row = cur.fetchone()
        if not row:
            return None

        # Claim it by setting to indexing
        cur.execute(
            "UPDATE repository_snapshots SET indexed_status = 'indexing' WHERE id = %s",
            (row["snapshot_id"],),
        )
        conn.commit()
        logger.info("Claimed snapshot %s for repo %s", row["snapshot_id"], row["full_name"])
        return dict(row)


def update_snapshot_status(conn, snapshot_id: str, status: str, commit_sha: str | None = None):
    """Update the indexed_status of a snapshot."""
    with conn.cursor() as cur:
        if commit_sha and status == "completed":
            cur.execute(
                "UPDATE repository_snapshots SET indexed_status = %s, commit_sha = %s WHERE id = %s",
                (status, commit_sha, snapshot_id),
            )
            # Also update repo's current_commit_sha
            cur.execute(
                """
                UPDATE repositories
                SET current_commit_sha = %s
                WHERE id = (SELECT repository_id FROM repository_snapshots WHERE id = %s)
                """,
                (commit_sha, snapshot_id),
            )
        else:
            cur.execute(
                "UPDATE repository_snapshots SET indexed_status = %s WHERE id = %s",
                (status, snapshot_id),
            )
        conn.commit()
        logger.info("Snapshot %s status → %s", snapshot_id, status)


def persist_results(conn, snapshot_id: str, files: list, repo_type: dict,
                    concepts: list[dict], lessons: list, flashcards: list,
                    quiz, interview_questions: list):
    """
    Persist all generated analysis and content to the database.
    Uses a single transaction — all or nothing.
    """
    with conn.cursor() as cur:
        # 1. Files
        logger.info("[%s] Persisting %d files...", snapshot_id, len(files))
        for f in files:
            content_hash = hashlib.sha256(f.path.encode()).hexdigest()
            cur.execute(
                """INSERT INTO files (id, snapshot_id, path, language, size_bytes, hash, summary, is_ignored, raw_storage_path)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT DO NOTHING""",
                (str(uuid.uuid4()), snapshot_id, f.path, f.language, f.size_bytes,
                 content_hash, None, f.is_ignored, f.raw_path),
            )

        # 2. Concepts — from architecture analysis
        # Note: PostgreSQL text[] columns need Python lists, NOT JSON strings
        concept_ids = {}
        logger.info("[%s] Persisting %d concepts...", snapshot_id, len(concepts))
        for i, c in enumerate(concepts):
            cid = str(uuid.uuid4())
            concept_ids[c["name"]] = cid
            ctype = c.get("conceptType", c.get("concept_type", "module"))
            tag_list = c.get("tags", c.get("files", []))
            if isinstance(tag_list, str):
                tag_list = [tag_list]
            if not tag_list:
                tag_list = [c.get("path", c["name"])]
            cur.execute(
                """INSERT INTO concepts (id, snapshot_id, name, concept_type, description, difficulty, tags)
                   VALUES (%s, %s, %s, %s, %s, %s, %s::text[])""",
                (cid, snapshot_id, c["name"], ctype, c["description"],
                 c.get("difficulty", "beginner"), tag_list),
            )

        # 3. Lessons
        logger.info("[%s] Persisting %d lessons...", snapshot_id, len(lessons))
        for lesson in lessons:
            lid = str(uuid.uuid4())
            concept_id = concept_ids.get(
                getattr(lesson, 'concept_name', None) or
                (lesson.concept_id if hasattr(lesson, 'concept_id') else None)
            )
            cur.execute(
                """INSERT INTO lessons (id, snapshot_id, concept_id, title, description,
                   order_index, difficulty, estimated_minutes, lesson_content_markdown, track)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (lid, snapshot_id, concept_id,
                 lesson.title, lesson.description, lesson.order_index,
                 lesson.difficulty, lesson.estimated_minutes,
                 lesson.content_markdown, lesson.track),
            )

        # 4. Flashcards — tags is text[] (PostgreSQL array, not JSON)
        logger.info("[%s] Persisting %d flashcards...", snapshot_id, len(flashcards))
        for fc in flashcards:
            fc_tags = fc.tags if isinstance(fc.tags, list) else [fc.tags]
            if not fc_tags:
                fc_tags = ["general"]
            cur.execute(
                """INSERT INTO flashcards (id, snapshot_id, front_text, back_text, tags, difficulty)
                   VALUES (%s, %s, %s, %s, %s::text[], %s)""",
                (str(uuid.uuid4()), snapshot_id, fc.front_text, fc.back_text,
                 fc_tags, fc.difficulty),
            )

        # 5. Quiz
        logger.info("[%s] Persisting quiz (%d questions)...", snapshot_id, len(quiz.questions))
        qid = str(uuid.uuid4())
        cur.execute(
            """INSERT INTO quizzes (id, snapshot_id, title, quiz_type, payload_json)
               VALUES (%s, %s, %s, %s, %s)""",
            (qid, snapshot_id, quiz.title, quiz.quiz_type,
             json.dumps({"questions": quiz.questions})),
        )

        # 6. Interview questions — skipped (require interview_id foreign key)
        # These will be generated on-demand when a user starts an interview session
        logger.info("[%s] Skipping interview questions (requires interview session)", snapshot_id)

        conn.commit()
        logger.info("[%s] ✅ All content persisted to database", snapshot_id)


def process_snapshot(snapshot: dict) -> bool:
    """
    Run the full indexing pipeline for a claimed snapshot.
    Returns True on success, False on failure.
    """
    snapshot_id = snapshot["snapshot_id"]
    clone_url = snapshot["clone_url"]
    owner = snapshot["owner"]
    repo_name = snapshot["repo_name"]
    branch = snapshot["branch"] or snapshot["default_branch"] or "main"

    conn = get_db()
    commit_sha = None

    try:
        pipeline = IngestionPipeline(work_dir=config.snapshot_dir)

        # Stage 1: Ingest repository
        logger.info("[%s] Cloning %s/%s (branch=%s)...", snapshot_id, owner, repo_name, branch)
        try:
            repo_path = pipeline.clone_repo(clone_url, branch)
            import git
            repo_obj = git.Repo(repo_path)
            commit_sha = repo_obj.head.commit.hexsha
            logger.info("[%s] Cloned successfully, commit=%s", snapshot_id, commit_sha[:8])
        except Exception as e:
            logger.warning("[%s] Clone failed, trying archive download: %s", snapshot_id, e)
            repo_path = pipeline.download_archive(owner, repo_name, branch)
            logger.info("[%s] Downloaded archive successfully", snapshot_id)

        # Stage 2: Walk and filter files
        files = list(pipeline.walk_files(repo_path))
        logger.info("[%s] Found %d files", snapshot_id, len(files))

        # Stage 2.5: Build knowledge graph with graphify (AST-only = zero LLM tokens)
        graph_path = None
        try:
            logger.info("[%s] Building knowledge graph with graphify...", snapshot_id)
            result = subprocess.run(
                ["graphify", "extract", ".", "--no-cluster"],
                capture_output=True, text=True, timeout=300,
                cwd=str(repo_path),
            )
            if result.returncode == 0:
                expected = os.path.join(str(repo_path), "graphify-out", "graph.json")
                if os.path.exists(expected):
                    graph_path = expected
                    logger.info("[%s] ✅ Knowledge graph built (%s)", snapshot_id, expected)
                else:
                    logger.warning("[%s] graphify ran but no graph.json found", snapshot_id)
            else:
                logger.warning("[%s] graphify failed: %s", snapshot_id, result.stderr[:200])
        except FileNotFoundError:
            logger.warning("[%s] graphify not installed — skipping graph", snapshot_id)
        except Exception as e:
            logger.warning("[%s] graphify error: %s", snapshot_id, e)

        # Stage 3: Detect repo type
        repo_type = pipeline.detect_repo_type(repo_path)
        logger.info("[%s] Detected: languages=%s, frameworks=%s",
                    snapshot_id, repo_type.get("languages", []), repo_type.get("frameworks", []))

        # Stage 4: Analyze codebase
        analyzer = CodeAnalyzer()
        analysis_result = analyzer.analyze(repo_path, files)

        # ArchitectureSummary is a dataclass — convert to dict for safe access downstream
        arch = analysis_result.get("architecture", {})
        if hasattr(arch, 'architecture_style'):
            import dataclasses
            arch_dict = dataclasses.asdict(arch)
            arch_style = arch_dict.get("architecture_style", "unknown")
            arch_components = arch_dict.get("components", [])
        else:
            arch_dict = arch if isinstance(arch, dict) else {}
            arch_style = arch_dict.get("architecture_style", "unknown")
            arch_components = arch_dict.get("components", [])

        analysis_result["architecture"] = arch_dict

        logger.info("[%s] Architecture style: %s, %d components",
                    snapshot_id, arch_style, len(arch_components))

        # Stage 5: Generate learning content
        engine = ContentGenerationEngine()
        concepts = [
            {
                "name": comp.get("name", "Unknown") if isinstance(comp, dict) else getattr(comp, "name", "Unknown"),
                "description": comp.get("responsibility", "") if isinstance(comp, dict) else getattr(comp, "responsibility", ""),
                "files": comp.get("key_files", []) if isinstance(comp, dict) else getattr(comp, "key_files", []),
                "path": comp.get("path", "") if isinstance(comp, dict) else getattr(comp, "path", ""),
                "difficulty": "beginner",
            }
            for comp in (arch_components[:10] if arch_components else [])
        ]

        lessons = engine.generate_lessons(
            f"{owner}/{repo_name}", concepts, analysis_result.get("architecture", {})
        )
        flashcards = engine.generate_flashcards(f"{owner}/{repo_name}", concepts, count=20)
        quiz = engine.generate_quiz(f"{owner}/{repo_name}", concepts, count=10)
        interview_questions = engine.generate_interview_questions(
            f"{owner}/{repo_name}", concepts, mode="conceptual", count=10,
        )

        # Stage 6: PERSIST everything to the database
        persist_results(conn, snapshot_id, files, repo_type, concepts,
                       lessons, flashcards, quiz, interview_questions)

        # Store graph path if generated
        if graph_path:
            with get_db() as gconn:
                with gconn.cursor() as cur:
                    cur.execute(
                        "UPDATE repository_snapshots SET graph_json_path = %s WHERE id = %s",
                        (graph_path, snapshot_id),
                    )
                gconn.commit()
            logger.info("[%s] Graph path stored in DB", snapshot_id)

        # Stage 7: Update status to completed
        update_snapshot_status(conn, snapshot_id, "completed", commit_sha=commit_sha or "unknown")

        logger.info("[%s] ✅ INDEXING COMPLETE: %d files, %d lessons, %d flashcards, %d quiz Qs, %d interview Qs",
                    snapshot_id, len(files), len(lessons), len(flashcards),
                    len(quiz.questions), len(interview_questions))
        return True

    except Exception as e:
        logger.error("[%s] ❌ INDEXING FAILED: %s", snapshot_id, e)
        traceback.print_exc()
        try:
            conn.rollback()
        except Exception:
            pass
        update_snapshot_status(conn, snapshot_id, "failed")
        return False
    finally:
        conn.close()


def main():
    """Main polling loop."""
    logger.info("═══════════════════════════════════════════")
    logger.info("  DB Polling Worker starting")
    logger.info("  Database: %s", config.database_url.split("@")[-1])
    logger.info("  Poll interval: %ds", POLL_INTERVAL)
    logger.info("═══════════════════════════════════════════")

    while True:
        try:
            conn = get_db()

            # Check for a pending snapshot
            snapshot = claim_pending_snapshot(conn)
            conn.close()

            if snapshot:
                logger.info("─" * 50)
                logger.info("Processing: %s (%s/%s)",
                            snapshot["snapshot_id"], snapshot["owner"], snapshot["repo_name"])
                process_snapshot(snapshot)
                logger.info("─" * 50)
            else:
                # No pending snapshots — idle
                pass

        except Exception as e:
            logger.error("Polling error: %s", e)
            time.sleep(POLL_INTERVAL)
            continue

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()

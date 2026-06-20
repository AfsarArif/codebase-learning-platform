"""
Code analysis engine.

Performs structural analysis (file tree, dependencies), semantic analysis
(file/function summaries via LLM), and architecture inference.
"""

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ..config import config
from ..ingestion.pipeline import IngestedFile
from ..embeddings.provider import get_embedding_provider

logger = logging.getLogger(__name__)


@dataclass
class FileSummary:
    """Summary of a single source file."""

    path: str
    language: str | None
    purpose: str
    key_symbols: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    role_in_architecture: str = ""


@dataclass
class ArchitectureSummary:
    """High-level architecture summary of a repository."""

    project_purpose: str
    tech_stack: dict
    architecture_style: str
    architecture_description: str
    components: list[dict] = field(default_factory=list)
    data_flow: list[dict] = field(default_factory=list)
    entry_points: list[dict] = field(default_factory=list)
    service_boundaries: list[str] = field(default_factory=list)
    integration_points: list[str] = field(default_factory=list)


class CodeAnalyzer:
    """
    Analyzes a repository's codebase to extract structural and semantic understanding.

    Uses a combination of heuristic analysis (file extensions, config files, AST)
    and LLM-based semantic summarization.
    """

    def __init__(self, llm_client: Any | None = None):
        self.llm = llm_client
        self.embedder = get_embedding_provider()

    def analyze(self, repo_path: Path, files: list[IngestedFile]) -> dict:
        """
        Run full analysis on a repository.

        Returns a dictionary containing:
        - repo_type: detected languages, frameworks, tools
        - file_summaries: summaries of key files
        - architecture: ArchitectureSummary
        - dependency_graph: module dependency information
        """
        logger.info("Starting analysis of %s (%d files)", repo_path, len(files))

        # Detect repository type
        from ..ingestion.pipeline import IngestionPipeline
        pipeline = IngestionPipeline()
        repo_type = pipeline.detect_repo_type(repo_path)

        # Build file summary statistics
        lang_counts: dict[str, int] = {}
        for f in files:
            if f.language:
                lang_counts[f.language] = lang_counts.get(f.language, 0) + 1

        # Generate architecture summary (heuristic pass)
        architecture = self._infer_architecture(
            repo_path, files, repo_type
        )

        return {
            "repo_type": repo_type,
            "language_counts": lang_counts,
            "architecture": architecture,
            "total_files": len(files),
        }

    def _infer_architecture(
        self,
        repo_path: Path,
        files: list[IngestedFile],
        repo_type: dict,
    ) -> ArchitectureSummary:
        """Infer the architecture style and components from file structure."""

        # Determine architecture style from directory structure
        dirs = set()
        for f in files:
            parts = Path(f.path).parts
            if len(parts) > 1:
                dirs.add(parts[0])

        style = self._guess_architecture_style(dirs, repo_path)

        # Build a basic architecture summary from heuristics
        return ArchitectureSummary(
            project_purpose=f"Repository analyzed from directory structure. Primary languages: {', '.join(repo_type.get('languages', ['unknown']))}.",
            tech_stack=repo_type,
            architecture_style=style,
            architecture_description=f"Inferred {style} architecture based on directory layout.",
            components=[
                {"name": d, "responsibility": "Directory in project root", "path": d, "key_files": [], "dependencies": []}
                for d in sorted(dirs)[:20]
            ],
            data_flow=[],
            entry_points=self._find_entry_points(files),
            service_boundaries=list(dirs),
            integration_points=[],
        )

    def _guess_architecture_style(self, dirs: set[str], repo_path: Path) -> str:
        """Guess the architecture style from directory names."""
        dirs_lower = {d.lower() for d in dirs}

        # Check for monorepo patterns
        if "apps" in dirs_lower and "packages" in dirs_lower:
            return "monorepo"

        # Check for MVC
        if dirs_lower & {"models", "views", "controllers"}:
            return "MVC"

        # Check for layered architecture
        layered_indicators = {"routes", "controllers", "services", "repositories", "models"}
        if len(dirs_lower & layered_indicators) >= 3:
            return "layered"

        # Check for microservices
        if "services" in dirs_lower or dirs_lower & {"docker-compose.yml", "k8s", "kubernetes"}:
            return "microservices"

        # Check for Next.js / full-stack
        if "pages" in dirs_lower or "app" in dirs_lower:
            if any(d.startswith("api") for d in dirs_lower):
                return "Next.js full-stack"

        # Check for event-driven
        if dirs_lower & {"events", "handlers", "listeners", "consumers", "workers"}:
            return "event-driven"

        return "modular monolith"

    def _find_entry_points(self, files: list[IngestedFile]) -> list[dict]:
        """Find likely entry points in the codebase."""
        entry_patterns = [
            ("main.go", "Go CLI entry point"),
            ("main.rs", "Rust entry point"),
            ("app.py", "Python app entry point"),
            ("manage.py", "Django management entry point"),
            ("src/index.ts", "TypeScript entry point"),
            ("src/index.js", "JavaScript entry point"),
            ("server.js", "Node.js server entry point"),
            ("src/App.tsx", "React app entry point"),
            ("pages/index.tsx", "Next.js page entry"),
            ("app/page.tsx", "Next.js App Router entry"),
            ("Dockerfile", "Docker build entry point"),
        ]

        entries = []
        file_paths = {f.path for f in files}
        for pattern, desc in entry_patterns:
            if pattern in file_paths:
                entries.append({"path": pattern, "type": self._entry_type(pattern), "description": desc})

        return entries

    def _entry_type(self, path: str) -> str:
        if path.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs")):
            return "http" if any(x in path for x in ["page", "route", "server"]) else "cli"
        if path.endswith((".py", ".go", ".rs")):
            return "cli"
        if "Dockerfile" in path:
            return "http"
        return "cli"

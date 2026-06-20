"""
Repository ingestion pipeline.

Handles cloning/fetching repositories, filtering files,
detecting languages, and preparing code for analysis.
"""

import hashlib
import os
import tempfile
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

import git
import httpx

logger = logging.getLogger(__name__)


@dataclass
class IngestedFile:
    """A file that has been ingested from a repository."""

    path: str
    language: str | None
    size_bytes: int
    content_hash: str
    is_binary: bool
    is_ignored: bool
    raw_path: str  # local path to raw content


class IngestionPipeline:
    """
    Pipeline for ingesting a GitHub repository.

    Supports cloning via git and downloading archives.
    """

    # Directories always excluded
    ALWAYS_IGNORE = {
        "node_modules", ".git", "__pycache__", ".venv", "venv",
        ".next", "dist", "build", ".turbo", ".cache", "coverage",
        ".nyc_output", ".idea", ".vscode",
    }

    # Binary extensions to skip
    BINARY_EXTENSIONS = {
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".bmp",
        ".woff", ".woff2", ".ttf", ".eot", ".otf",
        ".mp3", ".mp4", ".avi", ".mov", ".webm",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".zip", ".tar", ".gz", ".rar", ".7z", ".jar", ".war",
        ".exe", ".dll", ".so", ".dylib", ".wasm", ".class",
        ".pyc", ".pyo", ".o", ".obj", ".a", ".lib",
    }

    # Language detection by extension
    LANGUAGE_MAP = {
        ".ts": "typescript", ".tsx": "typescript",
        ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript",
        ".py": "python", ".pyi": "python",
        ".java": "java",
        ".go": "go",
        ".rs": "rust",
        ".rb": "ruby",
        ".php": "php",
        ".c": "c", ".h": "c",
        ".cpp": "cpp", ".hpp": "cpp", ".cc": "cpp",
        ".cs": "csharp",
        ".swift": "swift",
        ".kt": "kotlin", ".kts": "kotlin",
        ".scala": "scala",
        ".css": "css", ".scss": "scss", ".less": "less",
        ".html": "html", ".htm": "html",
        ".vue": "vue", ".svelte": "svelte",
        ".sql": "sql",
        ".yaml": "yaml", ".yml": "yaml",
        ".json": "json",
        ".md": "markdown", ".mdx": "markdown",
        ".toml": "toml",
        ".xml": "xml",
        ".sh": "shell", ".bash": "shell",
        ".dockerfile": "dockerfile",
    }

    def __init__(self, work_dir: str | None = None):
        self.work_dir = work_dir or tempfile.mkdtemp(prefix="repo_ingest_")

    def clone_repo(self, clone_url: str, branch: str = "main") -> Path:
        """
        Clone a git repository to the working directory.

        Returns the path to the cloned repository.
        """
        repo_name = clone_url.rstrip("/").split("/")[-1].replace(".git", "")
        target_path = Path(self.work_dir) / repo_name

        if target_path.exists():
            logger.info("Repository already exists at %s, pulling latest", target_path)
            repo = git.Repo(target_path)
            repo.remotes.origin.pull()
        else:
            logger.info("Cloning %s to %s", clone_url, target_path)
            git.Repo.clone_from(
                clone_url,
                target_path,
                branch=branch,
                depth=1,  # Shallow clone for speed
            )

        return target_path

    def download_archive(self, owner: str, repo: str, branch: str = "main") -> Path:
        """
        Download a repository archive from GitHub API.

        Returns the path to the extracted archive.
        """
        import zipfile
        import io

        url = f"https://api.github.com/repos/{owner}/{repo}/zipball/{branch}"
        target_path = Path(self.work_dir) / f"{owner}_{repo}"

        if target_path.exists():
            logger.info("Archive already extracted at %s", target_path)
            return target_path

        logger.info("Downloading archive from %s", url)
        response = httpx.get(url, follow_redirects=True, timeout=120)
        response.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            # GitHub wraps in owner-repo-<sha>/ directory
            zf.extractall(self.work_dir)
            # Find the extracted directory
            extracted_dirs = [
                d for d in Path(self.work_dir).iterdir()
                if d.is_dir() and d.name != target_path.name
            ]
            if extracted_dirs:
                extracted_dirs[0].rename(target_path)

        return target_path

    def walk_files(self, repo_path: Path, max_files: int = 10000) -> Iterator[IngestedFile]:
        """
        Walk the repository directory and yield IngestedFile objects,
        skipping ignored and binary files.
        """
        count = 0
        for file_path in repo_path.rglob("*"):
            if file_path.is_dir():
                # Skip ignored directories
                if any(seg in self.ALWAYS_IGNORE for seg in file_path.parts):
                    continue
                continue

            if count >= max_files:
                logger.warning("Reached max file limit (%d)", max_files)
                break

            relative_path = str(file_path.relative_to(repo_path))
            ext = file_path.suffix.lower()
            is_binary = ext in self.BINARY_EXTENSIONS
            language = self.LANGUAGE_MAP.get(ext)

            try:
                stat = file_path.stat()
                size_bytes = stat.st_size
            except OSError:
                continue

            # Skip large files
            if size_bytes > 1_000_000:  # 1 MB
                continue

            # Compute content hash
            try:
                content = file_path.read_bytes()
                content_hash = hashlib.sha256(content).hexdigest()
            except (OSError, PermissionError):
                continue

            # Detect if binary by checking for null bytes
            if not is_binary and b"\x00" in content[:8000]:
                is_binary = True

            if is_binary:
                continue

            count += 1
            yield IngestedFile(
                path=relative_path,
                language=language,
                size_bytes=size_bytes,
                content_hash=content_hash,
                is_binary=is_binary,
                is_ignored=False,
                raw_path=str(file_path),
            )

    def detect_repo_type(self, repo_path: Path) -> dict:
        """
        Detect repository type by examining config files.

        Returns a dictionary with language, framework, build tool, and package manager info.
        """
        detectors = {
            "package.json": self._detect_node,
            "pyproject.toml": self._detect_python,
            "requirements.txt": self._detect_python,
            "go.mod": self._detect_go,
            "Cargo.toml": self._detect_rust,
            "pom.xml": self._detect_java_maven,
            "build.gradle": self._detect_java_gradle,
            "Gemfile": self._detect_ruby,
            "composer.json": self._detect_php,
        }

        result = {
            "languages": [],
            "frameworks": [],
            "build_tools": [],
            "package_manager": None,
        }

        for config_file, detector_fn in detectors.items():
            config_path = repo_path / config_file
            if config_path.exists():
                try:
                    detected = detector_fn(config_path)
                    if detected:
                        result["languages"].extend(detected.get("languages", []))
                        result["frameworks"].extend(detected.get("frameworks", []))
                        result["build_tools"].extend(detected.get("build_tools", []))
                        if detected.get("package_manager"):
                            result["package_manager"] = detected["package_manager"]
                except Exception:
                    pass

        return result

    def _detect_node(self, path: Path) -> dict | None:
        import json
        try:
            data = json.loads(path.read_text())
            frameworks = []
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            if "next" in deps:
                frameworks.append("Next.js")
            if "react" in deps:
                frameworks.append("React")
            if "express" in deps:
                frameworks.append("Express")
            if "fastify" in deps:
                frameworks.append("Fastify")
            if "nestjs" in deps or "@nestjs/core" in deps:
                frameworks.append("NestJS")
            if "vue" in deps:
                frameworks.append("Vue")
            if "svelte" in deps:
                frameworks.append("Svelte")
            if "tailwindcss" in deps:
                frameworks.append("Tailwind CSS")
            return {
                "languages": ["javascript", "typescript"],
                "frameworks": frameworks,
                "build_tools": ["npm", "node"],
                "package_manager": data.get("packageManager", "npm"),
            }
        except Exception:
            return None

    def _detect_python(self, path: Path) -> dict | None:
        frameworks = []
        try:
            content = path.read_text()
            if "django" in content.lower():
                frameworks.append("Django")
            if "flask" in content.lower():
                frameworks.append("Flask")
            if "fastapi" in content.lower():
                frameworks.append("FastAPI")
            if "celery" in content.lower():
                frameworks.append("Celery")
            if "pytest" in content.lower():
                frameworks.append("pytest")
        except Exception:
            pass
        return {
            "languages": ["python"],
            "frameworks": frameworks,
            "build_tools": ["pip", "setuptools"],
            "package_manager": "pip",
        } if frameworks else None

    def _detect_go(self, path: Path) -> dict | None:
        return {"languages": ["go"], "frameworks": [], "build_tools": ["go"], "package_manager": "go modules"}

    def _detect_rust(self, path: Path) -> dict | None:
        return {"languages": ["rust"], "frameworks": [], "build_tools": ["cargo"], "package_manager": "cargo"}

    def _detect_java_maven(self, path: Path) -> dict | None:
        return {"languages": ["java"], "frameworks": [], "build_tools": ["maven"], "package_manager": "maven"}

    def _detect_java_gradle(self, path: Path) -> dict | None:
        return {"languages": ["java", "kotlin"], "frameworks": [], "build_tools": ["gradle"], "package_manager": "gradle"}

    def _detect_ruby(self, path: Path) -> dict | None:
        return {"languages": ["ruby"], "frameworks": [], "build_tools": ["bundler"], "package_manager": "bundler"}

    def _detect_php(self, path: Path) -> dict | None:
        return {"languages": ["php"], "frameworks": [], "build_tools": ["composer"], "package_manager": "composer"}

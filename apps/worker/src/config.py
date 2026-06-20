"""Worker service configuration."""

import os
from dataclasses import dataclass, field


@dataclass
class WorkerConfig:
    """Configuration for the worker service, loaded from environment variables."""

    # Database
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/codebase_learning"
        )
    )

    # Redis / Queue
    redis_url: str = field(
        default_factory=lambda: os.getenv("REDIS_URL", "redis://localhost:6379/0")
    )
    celery_broker_url: str = field(
        default_factory=lambda: os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    )

    # LLM Provider
    llm_provider: str = field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "anthropic")
    )
    openai_api_key: str | None = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY")
    )
    anthropic_api_key: str | None = field(
        default_factory=lambda: os.getenv("ANTHROPIC_API_KEY")
    )
    deepseek_api_key: str | None = field(
        default_factory=lambda: os.getenv("DEEPSEEK_API_KEY")
    )

    # Embedding Provider
    embedding_provider: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_PROVIDER", "openai")
    )

    # Vector DB
    vector_db_url: str = field(
        default_factory=lambda: os.getenv(
            "VECTOR_DB_URL",
            "postgresql://postgres:postgres@localhost:5432/codebase_learning",
        )
    )

    # GitHub
    github_client_id: str | None = field(
        default_factory=lambda: os.getenv("GITHUB_CLIENT_ID")
    )
    github_client_secret: str | None = field(
        default_factory=lambda: os.getenv("GITHUB_CLIENT_SECRET")
    )

    # Storage
    snapshot_dir: str = field(
        default_factory=lambda: os.getenv("SNAPSHOT_DIR", "./snapshots")
    )

    # Limits
    max_file_size_bytes: int = 1_000_000  # 1 MB
    max_files_per_repo: int = 10000
    chunk_size_chars: int = 4000
    chunk_overlap_chars: int = 200

    # Performance
    embedding_batch_size: int = 100
    analysis_concurrency: int = 4


config = WorkerConfig()

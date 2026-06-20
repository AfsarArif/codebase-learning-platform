"""Celery application setup for background job processing."""

from celery import Celery
from .config import config

app = Celery(
    "codebase_learning",
    broker=config.celery_broker_url,
    backend=config.redis_url,
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # 55 min soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

# Auto-discover tasks
app.autodiscover_tasks(["src.tasks"])

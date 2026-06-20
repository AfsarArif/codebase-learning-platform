"""
Embedding provider abstraction.

Supports OpenAI, Anthropic, and local embedding models.
"""

import logging
from abc import ABC, abstractmethod

from ..config import config

logger = logging.getLogger(__name__)


class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers."""

    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        ...

    @abstractmethod
    def embed_query(self, query: str) -> list[float]:
        """Generate a single embedding for a query."""
        ...


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embedding provider using text-embedding-3-small or ada-002."""

    def __init__(self, api_key: str | None = None, model: str = "text-embedding-3-small"):
        self.api_key = api_key or config.openai_api_key
        self.model = model

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Batch embed texts using OpenAI API."""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)

            response = client.embeddings.create(
                model=self.model,
                input=texts,
            )
            return [d.embedding for d in response.data]
        except Exception as e:
            logger.error("OpenAI embedding failed: %s", e)
            raise

    def embed_query(self, query: str) -> list[float]:
        embeddings = self.embed([query])
        return embeddings[0]


class AnthropicEmbeddingProvider(EmbeddingProvider):
    """Anthropic embedding provider (placeholder — currently delegates to voyage or fallback)."""

    def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError(
            "Anthropic does not currently provide embeddings. Use OpenAI or VoyageAI."
        )

    def embed_query(self, query: str) -> list[float]:
        raise NotImplementedError(
            "Anthropic does not currently provide embeddings."
        )


class DummyEmbeddingProvider(EmbeddingProvider):
    """Dummy provider for local development without API keys."""

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate deterministic dummy embeddings based on text hash."""
        import hashlib
        embeddings = []
        for text in texts:
            # Create a deterministic 256-dim embedding from text hash
            h = hashlib.sha256(text.encode()).digest()
            vec = [float(b) / 255.0 for b in h[:256]]
            embeddings.append(vec)
        return embeddings

    def embed_query(self, query: str) -> list[float]:
        embeddings = self.embed([query])
        return embeddings[0]


def get_embedding_provider() -> EmbeddingProvider:
    """Factory function to get the configured embedding provider."""
    provider = config.embedding_provider.lower()

    if provider == "openai":
        return OpenAIEmbeddingProvider()
    elif provider == "anthropic":
        return AnthropicEmbeddingProvider()
    else:
        logger.warning("Unknown embedding provider '%s', using dummy provider", provider)
        return DummyEmbeddingProvider()

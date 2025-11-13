"""
Embedding service for generating vector embeddings using OpenAI
"""

import logging
from typing import Optional
import numpy as np

from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings"""

    def __init__(self):
        """Initialize embedding service"""
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized")
        else:
            logger.warning("OpenAI API key not configured. Embeddings will not be generated.")

    async def generate_embedding(self, text: str) -> Optional[list[float]]:
        """
        Generate embedding for text using OpenAI

        Args:
            text: Text to generate embedding for

        Returns:
            Embedding vector (1536 dimensions) or None if OpenAI is not configured
        """
        if not self.client:
            logger.warning("OpenAI client not available. Cannot generate embedding.")
            return None

        if not text or not text.strip():
            logger.warning("Empty text provided for embedding generation")
            return None

        try:
            # Truncate text if too long (OpenAI has token limits)
            # text-embedding-ada-002 has a limit of 8191 tokens
            # Approximate: 1 token ≈ 4 characters, so max ~32k characters
            max_chars = 30000
            if len(text) > max_chars:
                text = text[:max_chars]
                logger.info(f"Text truncated to {max_chars} characters for embedding")

            response = self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )

            embedding = response.data[0].embedding
            logger.info(f"Generated embedding of dimension {len(embedding)}")
            return embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}", exc_info=True)
            return None

    def is_available(self) -> bool:
        """Check if embedding service is available"""
        return self.client is not None


embedding_service = EmbeddingService()


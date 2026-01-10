# AI package
from .gemini_client import (
    GeminiClient,
    get_ai_client,
    ExtractionResult,
    QuestionGenerationResult,
    ExtractedEntity,
    ExtractedRelation
)

__all__ = [
    "GeminiClient",
    "get_ai_client",
    "ExtractionResult",
    "QuestionGenerationResult",
    "ExtractedEntity",
    "ExtractedRelation"
]

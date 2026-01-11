"""
Knowledge Extraction Pipeline

Transforms unstructured user responses into structured entities and relationships.
Uses AI for extraction but enforces schema validation.
"""

from typing import List, Tuple, Optional
from uuid import UUID, uuid4
from datetime import datetime

from app.models import (
    KnowledgeEntity, EntityType, ConfidenceLevel,
    Response, GraphEdge, RelationType
)
from app.ai import get_ai_client, ExtractionResult, ExtractedEntity, ExtractedRelation


# =============================================================================
# CONFIDENCE MAPPING
# =============================================================================

def score_to_level(score: float) -> ConfidenceLevel:
    """Convert numeric confidence to qualitative level."""
    if score >= 0.8:
        return ConfidenceLevel.HIGH
    elif score >= 0.6:
        return ConfidenceLevel.MEDIUM
    elif score >= 0.3:
        return ConfidenceLevel.LOW
    else:
        return ConfidenceLevel.UNVERIFIED


# =============================================================================
# ENTITY PROCESSOR
# =============================================================================

class EntityProcessor:
    """Processes and validates extracted entities."""
    
    @staticmethod
    def normalize_name(name: str) -> str:
        """Normalize entity names for consistency."""
        # Remove extra whitespace
        name = " ".join(name.split())
        # Title case for consistency
        return name.strip()
    
    @staticmethod
    def create_entity(
        extracted: ExtractedEntity,
        process_id: UUID,
        response_id: UUID
    ) -> Optional[KnowledgeEntity]:
        """
        Create a validated KnowledgeEntity from AI extraction result.
        
        Returns None if validation fails.
        """
        try:
            entity_type = EntityType(extracted.entity_type.lower())
        except ValueError:
            return None
        
        if not extracted.name or len(extracted.name.strip()) < 2:
            return None
        
        confidence = score_to_level(extracted.confidence)
        
        entity = KnowledgeEntity(
            id=uuid4(),
            process_id=process_id,
            entity_type=entity_type,
            name=EntityProcessor.normalize_name(extracted.name),
            description=extracted.description,
            confidence=confidence,
            confidence_score=extracted.confidence,
            source_response_ids=[response_id],
            attributes=extracted.attributes
        )
        
        return entity


# =============================================================================
# RELATION PROCESSOR
# =============================================================================

class RelationProcessor:
    """Processes and validates extracted relationships."""
    
    @staticmethod
    def create_edge(
        extracted: ExtractedRelation,
        source_node_id: UUID,
        target_node_id: UUID,
        response_id: UUID,
        graph_version: int = 1
    ) -> Optional[GraphEdge]:
        """
        Create a validated GraphEdge from AI extraction result.
        """
        try:
            relation_type = RelationType(extracted.relation_type.lower())
        except ValueError:
            return None
        
        confidence = score_to_level(extracted.confidence)
        
        edge = GraphEdge(
            id=uuid4(),
            graph_version=graph_version,
            source_node_id=source_node_id,
            target_node_id=target_node_id,
            relation_type=relation_type,
            label=extracted.label,
            confidence=confidence,
            source_response_ids=[response_id],
            conditions=extracted.conditions
        )
        
        return edge


# =============================================================================
# EXTRACTION PIPELINE
# =============================================================================

class ExtractionPipeline:
    """
    Main extraction pipeline that orchestrates:
    1. AI-based knowledge extraction
    2. Schema validation
    3. Entity deduplication
    4. Confidence scoring
    5. Relation mapping
    """
    
    def __init__(self):
        self.ai_client = None  # Lazy init
    
    async def extract_from_response(
        self,
        response: Response,
        process_id: UUID,
        context: str = ""
    ) -> Tuple[List[KnowledgeEntity], List[Tuple[str, str, ExtractedRelation]]]:
        """
        Extract knowledge from a user response.
        
        Args:
            response: The Response object containing user text
            process_id: The process this belongs to
            context: Previous context for better extraction
            
        Returns:
            Tuple of (entities, pending_relations)
            pending_relations are (source_name, target_name, relation) tuples
            that need to be resolved to actual node IDs later
        """
        if self.ai_client is None:
            self.ai_client = get_ai_client()
        
        # Call AI for extraction
        extraction_result = await self.ai_client.extract_knowledge(
            user_response=response.raw_text,
            context=context
        )
        
        # Process entities
        entities = []
        for extracted in extraction_result.entities:
            entity = EntityProcessor.create_entity(
                extracted=extracted,
                process_id=process_id,
                response_id=response.id
            )
            if entity:
                entities.append(entity)
        
        # Prepare relations (will need entity resolution)
        pending_relations = [
            (rel.source_entity, rel.target_entity, rel)
            for rel in extraction_result.relations
        ]
        
        # Update response with extraction metadata
        response.extracted_entities = [e.id for e in entities]
        response.needs_clarification = len(extraction_result.ambiguities) > 0
        if extraction_result.ambiguities:
            response.clarification_reason = "; ".join(extraction_result.ambiguities)
        
        # Set quality scores
        if entities:
            response.clarity_score = min(1.0, len(entities) / 3)
            response.completeness_score = sum(e.confidence_score for e in entities) / len(entities)
        
        return entities, pending_relations
    
    def resolve_relations(
        self,
        pending_relations: List[Tuple[str, str, ExtractedRelation]],
        entity_lookup: dict,  # name (lowercase) -> entity_id
        response_id: UUID,
        graph_version: int
    ) -> List[GraphEdge]:
        """
        Resolve pending relations to actual edges.
        
        Args:
            pending_relations: List of (source_name, target_name, relation) tuples
            entity_lookup: Dictionary mapping entity names to their IDs
            response_id: Source response ID
            graph_version: Current graph version
            
        Returns:
            List of created GraphEdge objects
        """
        edges = []
        
        for source_name, target_name, relation in pending_relations:
            source_key = source_name.lower().strip()
            target_key = target_name.lower().strip()
            
            if source_key in entity_lookup and target_key in entity_lookup:
                edge = RelationProcessor.create_edge(
                    extracted=relation,
                    source_node_id=entity_lookup[source_key],
                    target_node_id=entity_lookup[target_key],
                    response_id=response_id,
                    graph_version=graph_version
                )
                if edge:
                    edges.append(edge)
        
        return edges


# =============================================================================
# BATCH PROCESSING
# =============================================================================

class BatchExtractor:
    """
    Handles batch extraction from multiple responses.
    Useful for processing meeting transcripts or documents.
    """
    
    def __init__(self):
        self.pipeline = ExtractionPipeline()
    
    async def process_transcript(
        self,
        text_chunks: List[str],
        process_id: UUID
    ) -> Tuple[List[KnowledgeEntity], List[GraphEdge]]:
        """
        Process a transcript split into chunks.
        Maintains context across chunks for better extraction.
        """
        all_entities: List[KnowledgeEntity] = []
        all_pending_relations = []
        entity_lookup = {}
        context = ""
        
        for i, chunk in enumerate(text_chunks):
            # Create a synthetic response
            response = Response(
                id=uuid4(),
                question_id=uuid4(),  # Synthetic
                session_id=uuid4(),   # Synthetic
                raw_text=chunk
            )
            
            entities, pending = await self.pipeline.extract_from_response(
                response=response,
                process_id=process_id,
                context=context
            )
            
            # Merge entities
            for entity in entities:
                key = entity.name.lower()
                if key not in entity_lookup:
                    entity_lookup[key] = entity.id
                    all_entities.append(entity)
            
            all_pending_relations.extend([
                (s, t, r, response.id) for s, t, r in pending
            ])
            
            # Update context
            if entities:
                context += f"\nChunk {i+1}: Found {', '.join(e.name for e in entities)}"
        
        # Resolve all relations
        all_edges = []
        for source_name, target_name, relation, response_id in all_pending_relations:
            source_key = source_name.lower().strip()
            target_key = target_name.lower().strip()
            
            if source_key in entity_lookup and target_key in entity_lookup:
                edge = RelationProcessor.create_edge(
                    extracted=relation,
                    source_node_id=entity_lookup[source_key],
                    target_node_id=entity_lookup[target_key],
                    response_id=response_id,
                    graph_version=1
                )
                if edge:
                    all_edges.append(edge)
        
        return all_entities, all_edges


# Singleton instances
_pipeline: Optional[ExtractionPipeline] = None
_batch_extractor: Optional[BatchExtractor] = None

def get_extraction_pipeline() -> ExtractionPipeline:
    """Get or create the extraction pipeline singleton."""
    global _pipeline
    if _pipeline is None:
        _pipeline = ExtractionPipeline()
    return _pipeline

def get_batch_extractor() -> BatchExtractor:
    """Get or create the batch extractor singleton."""
    global _batch_extractor
    if _batch_extractor is None:
        _batch_extractor = BatchExtractor()
    return _batch_extractor

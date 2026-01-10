"""
SOP & Decision Generator

Converts process graphs into structured Standard Operating Procedures.
Features:
- Topological ordering of steps
- Decision tree flattening
- Source citation for traceability
- Explainability markers (inferred vs confirmed)
"""

from typing import Dict, List, Optional, Set, Tuple, Any
from uuid import UUID, uuid4
from datetime import datetime
from collections import deque

from app.models import (
    KnowledgeEntity, EntityType, SOPStep, SOPVersion,
    GraphEdge, RelationType, ConfidenceLevel
)
from app.graph import ProcessGraph


# =============================================================================
# STEP ORDERING
# =============================================================================

class StepOrderer:
    """
    Orders graph nodes into a linear sequence of SOP steps.
    Uses topological sort with special handling for decision branches.
    """
    
    def __init__(self, graph: ProcessGraph):
        self.graph = graph
        self.entities = graph.entities
    
    def get_ordered_steps(self) -> List[Tuple[KnowledgeEntity, Optional[str]]]:
        """
        Return entities in execution order.
        Second element is the branch label if coming from a decision.
        """
        visited: Set[UUID] = set()
        ordered: List[Tuple[KnowledgeEntity, Optional[str]]] = []
        
        # Start from root nodes
        roots = self.graph.get_roots()
        if not roots:
            # No clear roots - just iterate all
            roots = [e.id for e in self.entities.values() if e.entity_type == EntityType.TASK]
        
        queue = deque([(r, None) for r in roots])  # (entity_id, branch_label)
        
        while queue:
            current_id, branch = queue.popleft()
            
            if current_id in visited:
                continue
            
            entity = self.entities.get(current_id)
            if not entity:
                continue
            
            visited.add(current_id)
            ordered.append((entity, branch))
            
            # Get outgoing edges
            edges = self.graph.get_all_edges()
            outgoing = [e for e in edges if e.source_node_id == current_id]
            
            for edge in outgoing:
                label = edge.label if entity.entity_type == EntityType.DECISION else None
                queue.append((edge.target_node_id, label))
        
        return ordered


# =============================================================================
# SOP GENERATOR
# =============================================================================

class SOPGenerator:
    """
    Generates Standard Operating Procedures from process graphs.
    """
    
    def generate(
        self,
        graph: ProcessGraph,
        include_exceptions: bool = True,
        include_systems: bool = True,
        detail_level: str = "standard"
    ) -> SOPVersion:
        """
        Generate a full SOP from the process graph.
        
        Args:
            graph: The process graph to convert
            include_exceptions: Include exception handling steps
            include_systems: Include system/tool references
            detail_level: "brief", "standard", or "detailed"
        """
        orderer = StepOrderer(graph)
        ordered = orderer.get_ordered_steps()
        
        steps: List[SOPStep] = []
        step_number = 0
        
        # Collect metadata
        roles_involved: Set[str] = set()
        systems_referenced: Set[str] = set()
        artifacts_produced: Set[str] = set()
        
        # Entity type to role mapping (for responsibility assignment)
        role_map = self._build_role_map(graph)
        
        for entity, branch_label in ordered:
            step_number += 1
            
            # Determine responsible role
            responsible = role_map.get(entity.id)
            if responsible:
                roles_involved.add(responsible)
            
            # Check entity type
            is_decision = entity.entity_type == EntityType.DECISION
            is_exception = entity.attributes.get("is_exception", False)
            
            if is_exception and not include_exceptions:
                continue
            
            # Track systems
            if entity.entity_type == EntityType.SYSTEM:
                systems_referenced.add(entity.name)
                if not include_systems:
                    continue
            
            # Track artifacts
            if entity.entity_type == EntityType.ARTIFACT:
                artifacts_produced.add(entity.name)
            
            # Build description based on detail level
            description = self._build_description(entity, detail_level)
            
            # Check if this step is confirmed or inferred
            notes = []
            if entity.confidence == ConfidenceLevel.UNVERIFIED:
                notes.append("⚠️ This step was inferred and needs confirmation")
            elif entity.confidence == ConfidenceLevel.LOW:
                notes.append("⚡ Low confidence - verify with process owner")
            
            if branch_label:
                notes.append(f"This step follows when: {branch_label}")
            
            step = SOPStep(
                step_number=step_number,
                title=entity.name,
                description=description,
                responsible_role=responsible,
                source_node_ids=[entity.id],
                is_decision_point=is_decision,
                is_exception_handler=is_exception,
                notes=notes
            )
            
            # For decision points, add branches
            if is_decision:
                branches = self._get_decision_branches(graph, entity.id)
                if branches:
                    step.branches = branches
            
            steps.append(step)
        
        # Calculate coverage and confidence
        total_entities = len(graph.entities)
        covered_entities = len([s for s in steps if s.source_node_ids])
        coverage = covered_entities / total_entities if total_entities > 0 else 0
        
        confidence_scores = [
            e.confidence_score for e in graph.entities.values()
        ]
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
        
        # Build final SOP
        sop = SOPVersion(
            process_id=graph.process_id,
            version_number=1,  # Caller should manage versioning
            title=self._generate_title(graph),
            purpose=self._generate_purpose(graph),
            scope=self._generate_scope(graph),
            steps=steps,
            roles_involved=list(roles_involved),
            systems_referenced=list(systems_referenced),
            artifacts_produced=list(artifacts_produced),
            coverage_score=coverage,
            confidence_score=avg_confidence,
            source_graph_version=graph.current_version,
            generation_params={
                "include_exceptions": include_exceptions,
                "include_systems": include_systems,
                "detail_level": detail_level
            }
        )
        
        return sop
    
    def _build_role_map(self, graph: ProcessGraph) -> Dict[UUID, str]:
        """Build a map of task ID -> responsible role name."""
        role_map = {}
        
        for edge in graph.get_all_edges():
            if edge.relation_type == RelationType.OWNED_BY:
                owner = graph.get_entity(edge.target_node_id)
                if owner:
                    role_map[edge.source_node_id] = owner.name
        
        # Also check entity attributes
        for entity_id, entity in graph.entities.items():
            if entity_id not in role_map:
                owner = entity.attributes.get("owner") or entity.attributes.get("responsible")
                if owner:
                    role_map[entity_id] = str(owner)
        
        return role_map
    
    def _build_description(self, entity: KnowledgeEntity, detail_level: str) -> str:
        """Build step description based on detail level."""
        base = entity.description or f"Perform {entity.name}"
        
        if detail_level == "brief":
            return base[:100] + "..." if len(base) > 100 else base
        
        if detail_level == "detailed":
            extras = []
            if entity.attributes.get("duration_estimate"):
                extras.append(f"Expected duration: {entity.attributes['duration_estimate']}")
            if entity.attributes.get("prerequisites"):
                extras.append(f"Prerequisites: {entity.attributes['prerequisites']}")
            if entity.attributes.get("tools"):
                extras.append(f"Tools needed: {entity.attributes['tools']}")
            
            if extras:
                return f"{base}\n\n" + "\n".join(extras)
        
        return base
    
    def _get_decision_branches(
        self,
        graph: ProcessGraph,
        decision_id: UUID
    ) -> Optional[Dict[str, int]]:
        """Get the branches from a decision node."""
        branches = {}
        edges = graph.get_all_edges()
        
        for edge in edges:
            if edge.source_node_id == decision_id and edge.label:
                # For now, we can't easily map to step numbers since
                # steps are generated dynamically. Return labels as keys.
                branches[edge.label] = 0  # Placeholder
        
        return branches if branches else None
    
    def _generate_title(self, graph: ProcessGraph) -> str:
        """Generate SOP title from graph metadata."""
        # Find the first trigger or task as title basis
        for entity in graph.entities.values():
            if entity.entity_type == EntityType.TRIGGER:
                return f"Standard Operating Procedure: {entity.name}"
        
        # Fallback to first task
        for entity in graph.entities.values():
            if entity.entity_type == EntityType.TASK:
                return f"Standard Operating Procedure: {entity.name}"
        
        return "Standard Operating Procedure"
    
    def _generate_purpose(self, graph: ProcessGraph) -> str:
        """Generate purpose section."""
        tasks = [e for e in graph.entities.values() if e.entity_type == EntityType.TASK]
        artifacts = [e for e in graph.entities.values() if e.entity_type == EntityType.ARTIFACT]
        
        if artifacts:
            return f"This procedure documents the steps required to produce: {', '.join(a.name for a in artifacts[:3])}"
        elif tasks:
            return f"This procedure documents the workflow for: {tasks[0].name}"
        else:
            return "This procedure documents the standard workflow for this process."
    
    def _generate_scope(self, graph: ProcessGraph) -> str:
        """Generate scope section."""
        roles = [e for e in graph.entities.values() if e.entity_type == EntityType.ROLE]
        
        if roles:
            return f"This procedure applies to: {', '.join(r.name for r in roles)}"
        else:
            return "This procedure applies to all personnel involved in this process."


# =============================================================================
# EXPORT FORMATS
# =============================================================================

class SOPExporter:
    """Exports SOP to various formats."""
    
    @staticmethod
    def to_markdown(sop: SOPVersion) -> str:
        """Export SOP to Markdown format."""
        lines = [
            f"# {sop.title}",
            "",
            f"**Version:** {sop.version_number}",
            f"**Generated:** {sop.generated_at.strftime('%Y-%m-%d %H:%M')}",
            "",
            "## Purpose",
            sop.purpose,
            "",
            "## Scope",
            sop.scope,
            "",
            "## Roles & Responsibilities",
        ]
        
        for role in sop.roles_involved:
            lines.append(f"- {role}")
        
        lines.extend(["", "## Procedure", ""])
        
        for step in sop.steps:
            prefix = "⚡" if step.is_decision_point else "📋"
            lines.append(f"### Step {step.step_number}: {prefix} {step.title}")
            lines.append("")
            lines.append(step.description)
            
            if step.responsible_role:
                lines.append(f"\n**Responsible:** {step.responsible_role}")
            
            if step.notes:
                lines.append("\n**Notes:**")
                for note in step.notes:
                    lines.append(f"- {note}")
            
            if step.is_decision_point and step.branches:
                lines.append("\n**Branches:**")
                for condition, next_step in step.branches.items():
                    lines.append(f"- If {condition}: Go to Step {next_step or 'TBD'}")
            
            lines.append("")
        
        if sop.systems_referenced:
            lines.extend(["## Systems & Tools", ""])
            for sys in sop.systems_referenced:
                lines.append(f"- {sys}")
        
        lines.extend([
            "",
            "---",
            f"*Coverage: {sop.coverage_score:.0%} | Confidence: {sop.confidence_score:.0%}*"
        ])
        
        return "\n".join(lines)
    
    @staticmethod
    def to_json(sop: SOPVersion) -> Dict[str, Any]:
        """Export SOP to JSON format."""
        return sop.model_dump()


# Singleton
_generator: Optional[SOPGenerator] = None

def get_sop_generator() -> SOPGenerator:
    """Get or create the SOP generator singleton."""
    global _generator
    if _generator is None:
        _generator = SOPGenerator()
    return _generator

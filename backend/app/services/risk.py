"""
Risk & Dependency Analyzer

Implements algorithms to detect:
- Single-person dependencies
- Undocumented decision points
- Orphaned tasks
- Brittle chains
- Circular dependencies
- Bottlenecks

Each finding includes explanation of WHY it's a risk.
"""

from typing import List, Dict, Set, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime
from collections import defaultdict

from app.models import (
    RiskFinding, RiskCategory, RiskSeverity,
    KnowledgeEntity, EntityType, GraphEdge, RelationType, GraphNode,
    ConfidenceLevel
)


# =============================================================================
# GRAPH ANALYSIS UTILITIES
# =============================================================================

class GraphAnalyzer:
    """Utility class for graph analysis operations."""
    
    @staticmethod
    def build_adjacency(
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> Dict[UUID, List[UUID]]:
        """Build adjacency list from nodes and edges."""
        adj = defaultdict(list)
        for edge in edges:
            adj[edge.source_node_id].append(edge.target_node_id)
        return dict(adj)
    
    @staticmethod
    def build_reverse_adjacency(
        edges: List[GraphEdge]
    ) -> Dict[UUID, List[UUID]]:
        """Build reverse adjacency (incoming edges)."""
        rev_adj = defaultdict(list)
        for edge in edges:
            rev_adj[edge.target_node_id].append(edge.source_node_id)
        return dict(rev_adj)
    
    @staticmethod
    def find_cycles(adj: Dict[UUID, List[UUID]]) -> List[List[UUID]]:
        """Find all cycles in the graph using DFS."""
        cycles = []
        visited = set()
        rec_stack = set()
        path = []
        
        def dfs(node: UUID) -> bool:
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in adj.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    # Found a cycle
                    cycle_start = path.index(neighbor)
                    cycles.append(path[cycle_start:].copy())
                    return False
            
            path.pop()
            rec_stack.remove(node)
            return False
        
        for node in adj.keys():
            if node not in visited:
                dfs(node)
        
        return cycles
    
    @staticmethod
    def compute_longest_path(
        start_nodes: List[UUID],
        adj: Dict[UUID, List[UUID]]
    ) -> int:
        """Compute longest path length from start nodes."""
        memo = {}
        
        def dfs(node: UUID, visited: Set[UUID]) -> int:
            if node in visited:
                return 0  # Cycle protection
            if node in memo:
                return memo[node]
            
            visited.add(node)
            max_len = 0
            for neighbor in adj.get(node, []):
                max_len = max(max_len, 1 + dfs(neighbor, visited))
            visited.remove(node)
            
            memo[node] = max_len
            return max_len
        
        return max(dfs(start, set()) for start in start_nodes) if start_nodes else 0


# =============================================================================
# RISK DETECTION RULES
# =============================================================================

class RiskRule:
    """Base class for risk detection rules."""
    
    category: RiskCategory
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        """Detect risks of this category. Override in subclasses."""
        raise NotImplementedError


class SinglePointOfFailureRule(RiskRule):
    """Detect roles that are sole owners of critical tasks."""
    
    category = RiskCategory.SINGLE_POINT_OF_FAILURE
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        findings = []
        
        # Map roles to tasks they own
        role_to_tasks: Dict[str, List[str]] = defaultdict(list)
        
        for edge in edges:
            if edge.relation_type == RelationType.OWNED_BY:
                task_entity = entities.get(edge.source_node_id)
                role_entity = entities.get(edge.target_node_id)
                
                if task_entity and role_entity:
                    role_to_tasks[role_entity.name].append(task_entity.name)
        
        # Also check entities with owner in attributes
        for entity in entities.values():
            if entity.entity_type == EntityType.TASK:
                owner = entity.attributes.get("owner") or entity.attributes.get("responsible")
                if owner:
                    role_to_tasks[str(owner)].append(entity.name)
        
        # Find roles that own multiple critical tasks with no backup
        for role, tasks in role_to_tasks.items():
            if len(tasks) >= 3:  # Threshold for "too many dependencies"
                findings.append(RiskFinding(
                    id=uuid4(),
                    process_id=list(entities.values())[0].process_id if entities else uuid4(),
                    category=self.category,
                    severity=RiskSeverity.HIGH,
                    title=f"Single Point of Failure: {role}",
                    description=f"'{role}' is solely responsible for {len(tasks)} tasks: {', '.join(tasks[:3])}{'...' if len(tasks) > 3 else ''}",
                    explanation=f"If {role} is unavailable (vacation, illness, leaves company), these {len(tasks)} tasks cannot be performed. This creates operational risk and potential bottlenecks.",
                    affected_node_ids=[],  # Would need lookup
                    recommendation=f"Cross-train at least one other person on {role}'s responsibilities. Document procedures thoroughly.",
                    effort_estimate="medium"
                ))
        
        return findings


class UndocumentedDecisionRule(RiskRule):
    """Detect decision points without clear conditions."""
    
    category = RiskCategory.UNDOCUMENTED_DECISION
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        findings = []
        
        for entity_id, entity in entities.items():
            if entity.entity_type == EntityType.DECISION:
                conditions = entity.attributes.get("conditions", [])
                
                # Check if decision has outgoing edges with conditions
                decision_edges = [
                    e for e in edges
                    if e.source_node_id == entity_id and e.relation_type == RelationType.DECIDES
                ]
                
                edges_with_conditions = [e for e in decision_edges if e.conditions or e.label]
                
                if not conditions and len(edges_with_conditions) < 2:
                    findings.append(RiskFinding(
                        id=uuid4(),
                        process_id=entity.process_id,
                        category=self.category,
                        severity=RiskSeverity.MEDIUM,
                        title=f"Undocumented Decision: {entity.name}",
                        description=f"Decision point '{entity.name}' lacks explicit conditions for branching.",
                        explanation="Without documented criteria, decision-making becomes subjective and inconsistent. Different people may make different choices given the same inputs, leading to unpredictable outcomes.",
                        affected_node_ids=[entity_id],
                        recommendation="Define explicit, measurable conditions for each possible outcome (e.g., 'If amount > $10,000: require manager approval').",
                        effort_estimate="low"
                    ))
        
        return findings


class OrphanedTaskRule(RiskRule):
    """Detect tasks with no owner or trigger."""
    
    category = RiskCategory.ORPHANED_TASK
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        findings = []
        
        # Build edge maps
        owned_tasks = {e.source_node_id for e in edges if e.relation_type == RelationType.OWNED_BY}
        triggered_tasks = {e.target_node_id for e in edges if e.relation_type == RelationType.TRIGGERS}
        dependent_tasks = {e.target_node_id for e in edges if e.relation_type == RelationType.DEPENDS_ON}
        
        for entity_id, entity in entities.items():
            if entity.entity_type == EntityType.TASK:
                issues = []
                
                # Check for owner
                has_owner = entity_id in owned_tasks or entity.attributes.get("owner")
                if not has_owner:
                    issues.append("no assigned owner")
                
                # Check for trigger/dependency (how does this task start?)
                has_trigger = entity_id in triggered_tasks or entity_id in dependent_tasks
                if not has_trigger:
                    issues.append("no trigger or upstream dependency")
                
                if issues:
                    severity = RiskSeverity.HIGH if len(issues) == 2 else RiskSeverity.MEDIUM
                    findings.append(RiskFinding(
                        id=uuid4(),
                        process_id=entity.process_id,
                        category=self.category,
                        severity=severity,
                        title=f"Orphaned Task: {entity.name}",
                        description=f"Task '{entity.name}' has {' and '.join(issues)}.",
                        explanation="Tasks without clear ownership may never be completed. Tasks without triggers may never be initiated. This leads to process delays or complete failure.",
                        affected_node_ids=[entity_id],
                        recommendation=f"Assign an owner to '{entity.name}' and clarify what event or preceding task triggers it.",
                        effort_estimate="low"
                    ))
        
        return findings


class BrittleChainRule(RiskRule):
    """Detect long dependency chains that are fragile."""
    
    category = RiskCategory.BRITTLE_CHAIN
    THRESHOLD = 5  # Chains longer than this are flagged
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        findings = []
        
        # Build dependency graph
        adj = GraphAnalyzer.build_adjacency(nodes, edges)
        rev_adj = GraphAnalyzer.build_reverse_adjacency(edges)
        
        # Find start nodes (no incoming edges)
        all_targets = {e.target_node_id for e in edges}
        all_sources = {e.source_node_id for e in edges}
        start_nodes = [n.id for n in nodes if n.id not in all_targets and n.id in all_sources]
        
        if not start_nodes:
            return findings
        
        # Find longest chain
        longest = GraphAnalyzer.compute_longest_path(start_nodes, adj)
        
        if longest >= self.THRESHOLD:
            findings.append(RiskFinding(
                id=uuid4(),
                process_id=list(entities.values())[0].process_id if entities else uuid4(),
                category=self.category,
                severity=RiskSeverity.MEDIUM,
                title=f"Brittle Chain Detected ({longest} steps)",
                description=f"The process has a dependency chain of {longest} sequential steps.",
                explanation="Long sequential chains are fragile: a failure at any point stops everything downstream. They also increase total cycle time and make parallel work impossible.",
                affected_node_ids=[],
                recommendation="Look for opportunities to parallelize independent tasks. Add checkpoints or fallback paths for critical steps.",
                effort_estimate="high"
            ))
        
        return findings


class CircularDependencyRule(RiskRule):
    """Detect circular dependencies that cause deadlock."""
    
    category = RiskCategory.CIRCULAR_DEPENDENCY
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        findings = []
        
        adj = GraphAnalyzer.build_adjacency(nodes, edges)
        cycles = GraphAnalyzer.find_cycles(adj)
        
        for cycle in cycles:
            cycle_names = []
            for node_id in cycle:
                entity = entities.get(node_id)
                if entity:
                    cycle_names.append(entity.name)
            
            if cycle_names:
                findings.append(RiskFinding(
                    id=uuid4(),
                    process_id=list(entities.values())[0].process_id if entities else uuid4(),
                    category=self.category,
                    severity=RiskSeverity.CRITICAL,
                    title="Circular Dependency Detected",
                    description=f"Cycle found: {' → '.join(cycle_names)} → {cycle_names[0]}",
                    explanation="Circular dependencies create deadlock: each task waits for another, so nothing can complete. This will cause the process to hang indefinitely.",
                    affected_node_ids=cycle,
                    recommendation="Break the cycle by removing one dependency or restructuring the process to eliminate the loop.",
                    effort_estimate="medium"
                ))
        
        return findings


class BottleneckRule(RiskRule):
    """Detect nodes that are bottlenecks (high in-degree)."""
    
    category = RiskCategory.BOTTLENECK
    THRESHOLD = 4  # More than this many incoming edges = bottleneck
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        findings = []
        
        # Count incoming edges
        in_degree: Dict[UUID, int] = defaultdict(int)
        for edge in edges:
            in_degree[edge.target_node_id] += 1
        
        for node_id, count in in_degree.items():
            if count >= self.THRESHOLD:
                entity = entities.get(node_id)
                if entity:
                    findings.append(RiskFinding(
                        id=uuid4(),
                        process_id=entity.process_id,
                        category=self.category,
                        severity=RiskSeverity.MEDIUM,
                        title=f"Bottleneck: {entity.name}",
                        description=f"'{entity.name}' has {count} incoming dependencies.",
                        explanation="This task/checkpoint must wait for many other things to complete before it can proceed. Any delay in upstream tasks cascades here, and this node becomes a queue that slows the entire process.",
                        affected_node_ids=[node_id],
                        recommendation="Consider parallelizing this step or splitting it into sub-tasks that can complete independently.",
                        effort_estimate="high"
                    ))
        
        return findings


class LowConfidenceChainRule(RiskRule):
    """Detect chains with many low-confidence entities."""
    
    category = RiskCategory.BRITTLE_CHAIN  # Reuse category
    
    def detect(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> List[RiskFinding]:
        findings = []
        
        low_conf_count = sum(
            1 for e in entities.values()
            if e.confidence_score < 0.5
        )
        total = len(entities)
        
        if total > 0 and low_conf_count / total > 0.3:
            findings.append(RiskFinding(
                id=uuid4(),
                process_id=list(entities.values())[0].process_id if entities else uuid4(),
                category=RiskCategory.BRITTLE_CHAIN,
                severity=RiskSeverity.MEDIUM,
                title="High Uncertainty in Process Model",
                description=f"{low_conf_count} of {total} elements have low confidence scores.",
                explanation="Many parts of this process are not well-documented or confirmed. Decisions based on this model may be incorrect.",
                affected_node_ids=[e.id for e in entities.values() if e.confidence_score < 0.5],
                recommendation="Review and validate the low-confidence elements with domain experts before finalizing.",
                effort_estimate="medium"
            ))
        
        return findings


# =============================================================================
# RISK ANALYZER (Orchestrator)
# =============================================================================

class RiskAnalyzer:
    """
    Main risk analysis orchestrator.
    Runs all detection rules and aggregates findings.
    """
    
    def __init__(self):
        self.rules: List[RiskRule] = [
            SinglePointOfFailureRule(),
            UndocumentedDecisionRule(),
            OrphanedTaskRule(),
            BrittleChainRule(),
            CircularDependencyRule(),
            BottleneckRule(),
            LowConfidenceChainRule(),
        ]
    
    def analyze(
        self,
        entities: Dict[UUID, KnowledgeEntity],
        nodes: List[GraphNode],
        edges: List[GraphEdge],
        categories: Optional[List[RiskCategory]] = None,
        min_severity: RiskSeverity = RiskSeverity.LOW
    ) -> List[RiskFinding]:
        """
        Run all risk detection rules and return findings.
        
        Args:
            entities: Map of entity ID to entity
            nodes: List of graph nodes
            edges: List of graph edges
            categories: Optional filter for risk categories
            min_severity: Minimum severity to include
            
        Returns:
            List of RiskFinding objects
        """
        all_findings = []
        severity_order = [RiskSeverity.LOW, RiskSeverity.MEDIUM, RiskSeverity.HIGH, RiskSeverity.CRITICAL]
        min_idx = severity_order.index(min_severity)
        
        for rule in self.rules:
            if categories and rule.category not in categories:
                continue
            
            findings = rule.detect(entities, nodes, edges)
            
            # Filter by severity
            for finding in findings:
                if severity_order.index(finding.severity) >= min_idx:
                    all_findings.append(finding)
        
        # Sort by severity (critical first)
        all_findings.sort(
            key=lambda f: severity_order.index(f.severity),
            reverse=True
        )
        
        return all_findings


# Singleton
_analyzer: Optional[RiskAnalyzer] = None

def get_risk_analyzer() -> RiskAnalyzer:
    """Get or create the risk analyzer singleton."""
    global _analyzer
    if _analyzer is None:
        _analyzer = RiskAnalyzer()
    return _analyzer

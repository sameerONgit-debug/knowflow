"""
Process Graph Engine

Manages the process knowledge graph with:
- In-memory graph storage (NetworkX)
- Version control with snapshots
- Diff computation between versions
- Graph traversal and analysis
"""

from typing import Dict, List, Optional, Set, Tuple, Any
from uuid import UUID, uuid4
from datetime import datetime
from collections import defaultdict
import copy

import networkx as nx

from app.models import (
    KnowledgeEntity, EntityType, GraphNode, GraphEdge,
    GraphVersion, GraphDiff, RelationType
)


# =============================================================================
# GRAPH STORE
# =============================================================================

class ProcessGraph:
    """
    Represents a versioned process graph.
    Uses NetworkX for graph operations with custom metadata.
    """
    
    def __init__(self, process_id: UUID):
        self.process_id = process_id
        self.current_version = 0
        
        # The actual graph
        self.graph = nx.DiGraph()
        
        # Entity storage (nodes)
        self.entities: Dict[UUID, KnowledgeEntity] = {}
        
        # Version history
        self.versions: Dict[int, GraphVersion] = {}
        self.snapshots: Dict[int, Dict[str, Any]] = {}  # version -> serialized graph
    
    def add_entity(self, entity: KnowledgeEntity) -> GraphNode:
        """
        Add an entity to the graph.
        Creates a node wrapper for graph operations.
        """
        self.entities[entity.id] = entity
        
        # Add to NetworkX graph
        self.graph.add_node(
            str(entity.id),
            entity_type=entity.entity_type.value,
            name=entity.name,
            confidence=entity.confidence_score
        )
        
        node = GraphNode(
            entity_id=entity.id,
            graph_version=self.current_version,
            in_degree=0,
            out_degree=0
        )
        
        return node
    
    def add_edge(self, edge: GraphEdge) -> bool:
        """
        Add an edge (relationship) to the graph.
        Returns False if source or target don't exist.
        """
        source_id = str(edge.source_node_id)
        target_id = str(edge.target_node_id)
        
        if not self.graph.has_node(source_id) or not self.graph.has_node(target_id):
            return False
        
        self.graph.add_edge(
            source_id,
            target_id,
            edge_id=str(edge.id),
            relation_type=edge.relation_type.value,
            label=edge.label,
            conditions=edge.conditions
        )
        
        return True
    
    def remove_entity(self, entity_id: UUID) -> bool:
        """Remove an entity and all its edges."""
        str_id = str(entity_id)
        if not self.graph.has_node(str_id):
            return False
        
        self.graph.remove_node(str_id)
        self.entities.pop(entity_id, None)
        return True
    
    def get_entity(self, entity_id: UUID) -> Optional[KnowledgeEntity]:
        """Get an entity by ID."""
        return self.entities.get(entity_id)
    
    def get_all_entities(self) -> List[KnowledgeEntity]:
        """Get all entities in the graph."""
        return list(self.entities.values())
    
    def get_all_edges(self) -> List[GraphEdge]:
        """Get all edges in the graph as GraphEdge objects."""
        edges = []
        for source, target, data in self.graph.edges(data=True):
            edge = GraphEdge(
                id=UUID(data.get('edge_id', str(uuid4()))),
                graph_version=self.current_version,
                source_node_id=UUID(source),
                target_node_id=UUID(target),
                relation_type=RelationType(data.get('relation_type', 'depends_on')),
                label=data.get('label'),
                conditions=data.get('conditions', [])
            )
            edges.append(edge)
        return edges
    
    def create_snapshot(self, change_summary: str = "") -> GraphVersion:
        """
        Create a new version snapshot.
        """
        self.current_version += 1
        
        # Store serialized snapshot
        self.snapshots[self.current_version] = {
            'nodes': list(self.graph.nodes(data=True)),
            'edges': list(self.graph.edges(data=True)),
            'entities': {str(k): v.model_dump() for k, v in self.entities.items()}
        }
        
        version = GraphVersion(
            process_id=self.process_id,
            version_number=self.current_version,
            node_count=self.graph.number_of_nodes(),
            edge_count=self.graph.number_of_edges(),
            change_summary=change_summary
        )
        
        self.versions[self.current_version] = version
        return version
    
    def compute_diff(self, from_version: int, to_version: int) -> GraphDiff:
        """
        Compute differences between two versions.
        """
        if from_version not in self.snapshots or to_version not in self.snapshots:
            return GraphDiff(from_version=from_version, to_version=to_version, summary="Invalid versions")
        
        old_snap = self.snapshots[from_version]
        new_snap = self.snapshots[to_version]
        
        old_nodes = {n[0] for n in old_snap['nodes']}
        new_nodes = {n[0] for n in new_snap['nodes']}
        
        old_edges = {(e[0], e[1]) for e in old_snap['edges']}
        new_edges = {(e[0], e[1]) for e in new_snap['edges']}
        
        nodes_added_ids = new_nodes - old_nodes
        nodes_removed_ids = old_nodes - new_nodes
        
        edges_added_ids = new_edges - old_edges
        edges_removed_ids = old_edges - new_edges
        
        diff = GraphDiff(
            from_version=from_version,
            to_version=to_version,
            summary=f"+{len(nodes_added_ids)} nodes, -{len(nodes_removed_ids)} nodes, +{len(edges_added_ids)} edges, -{len(edges_removed_ids)} edges"
        )
        
        return diff
    
    # =========================================================================
    # GRAPH ANALYSIS
    # =========================================================================
    
    def get_roots(self) -> List[UUID]:
        """Get nodes with no incoming edges (process start points)."""
        roots = []
        for node in self.graph.nodes():
            if self.graph.in_degree(node) == 0:
                roots.append(UUID(node))
        return roots
    
    def get_leaves(self) -> List[UUID]:
        """Get nodes with no outgoing edges (process end points)."""
        leaves = []
        for node in self.graph.nodes():
            if self.graph.out_degree(node) == 0:
                leaves.append(UUID(node))
        return leaves
    
    def get_path(self, from_id: UUID, to_id: UUID) -> Optional[List[UUID]]:
        """Find path between two nodes."""
        try:
            path = nx.shortest_path(self.graph, str(from_id), str(to_id))
            return [UUID(p) for p in path]
        except nx.NetworkXNoPath:
            return None
    
    def get_downstream(self, entity_id: UUID) -> List[UUID]:
        """Get all nodes downstream (reachable) from this node."""
        try:
            descendants = nx.descendants(self.graph, str(entity_id))
            return [UUID(d) for d in descendants]
        except nx.NetworkXError:
            return []
    
    def get_upstream(self, entity_id: UUID) -> List[UUID]:
        """Get all nodes upstream (that lead to) this node."""
        try:
            ancestors = nx.ancestors(self.graph, str(entity_id))
            return [UUID(a) for a in ancestors]
        except nx.NetworkXError:
            return []
    
    def compute_centrality(self) -> Dict[UUID, float]:
        """Compute betweenness centrality for all nodes."""
        centrality = nx.betweenness_centrality(self.graph)
        return {UUID(k): v for k, v in centrality.items()}
    
    def to_visualization_format(self) -> Dict[str, Any]:
        """
        Export graph to a format suitable for visualization (React Flow, D3, etc.)
        """
        nodes = []
        for entity_id, entity in self.entities.items():
            node_data = self.graph.nodes.get(str(entity_id), {})
            nodes.append({
                'id': str(entity_id),
                'type': entity.entity_type.value,
                'label': entity.name,
                'data': {
                    'description': entity.description,
                    'confidence': entity.confidence_score,
                    'attributes': entity.attributes
                }
            })
        
        edges = []
        for source, target, data in self.graph.edges(data=True):
            edges.append({
                'id': data.get('edge_id', f"{source}-{target}"),
                'source': source,
                'target': target,
                'type': data.get('relation_type', 'depends_on'),
                'label': data.get('label', ''),
                'data': {
                    'conditions': data.get('conditions', [])
                }
            })
        
        return {
            'nodes': nodes,
            'edges': edges,
            'meta': {
                'version': self.current_version,
                'nodeCount': len(nodes),
                'edgeCount': len(edges)
            }
        }


# =============================================================================
# GRAPH STORE (Multi-process)
# =============================================================================

class GraphStore:
    """
    Manages multiple process graphs.
    In production, this would be backed by Neo4j or similar.
    """
    
    def __init__(self):
        self.graphs: Dict[UUID, ProcessGraph] = {}
    
    def create_graph(self, process_id: UUID) -> ProcessGraph:
        """Create a new graph for a process."""
        graph = ProcessGraph(process_id)
        self.graphs[process_id] = graph
        return graph
    
    def get_graph(self, process_id: UUID) -> Optional[ProcessGraph]:
        """Get the graph for a process."""
        return self.graphs.get(process_id)
    
    def delete_graph(self, process_id: UUID) -> bool:
        """Delete a process graph."""
        if process_id in self.graphs:
            del self.graphs[process_id]
            return True
        return False


# Singleton
_store: Optional[GraphStore] = None

def get_graph_store() -> GraphStore:
    """Get or create the graph store singleton."""
    global _store
    if _store is None:
        _store = GraphStore()
    return _store

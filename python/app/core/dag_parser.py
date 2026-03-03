"""
DAG Parser - UPDATED with Conditional Branching Support
Handles conditional edges and provides branch information to executor
"""

from typing import List, Dict, Optional, Set, Tuple
from collections import defaultdict, deque
from app.schemas.workflow_schema import WorkflowNode, WorkflowEdge


class DAGParseError(Exception):
    """Raised when DAG parsing or validation fails"""
    pass


class DAGParser:
    """
    Parses workflow nodes and edges into a validated DAG with conditional support
    """
    
    def __init__(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]):
        """Initialize parser with workflow components"""
        self.nodes = {node.id: node for node in nodes}
        self.edges = edges
        self.adjacency_list: Dict[str, List[str]] = defaultdict(list)
        self.in_degree: Dict[str, int] = defaultdict(int)
        
        # NEW: Track conditional edges separately
        self.conditional_edges: Dict[str, Dict[str, List[str]]] = defaultdict(
            lambda: {'true': [], 'false': [], 'default': []}
        )
        
    def parse(self) -> Tuple[List[str], Dict[str, WorkflowNode]]:
        """Parse and validate the workflow DAG"""
        self._build_graph()
        self._validate_graph()
        
        if self._has_cycle():
            raise DAGParseError("Workflow contains circular dependencies (cycle detected)")
        
        execution_order = self._topological_sort()
        
        return execution_order, self.nodes
    
    def _build_graph(self) -> None:
        """Build adjacency list and track conditional edges"""
        # Initialize in-degree for all nodes
        for node_id in self.nodes:
            self.in_degree[node_id] = 0
        
        # Build adjacency list and track conditional edges
        for edge in self.edges:
            source = edge.source
            target = edge.target
            label = edge.label or 'default'
            
            self.adjacency_list[source].append(target)
            self.in_degree[target] += 1
            
            # NEW: Track conditional edges by label
            source_node = self.nodes.get(source)
            if source_node and source_node.type == 'conditional':
                self.conditional_edges[source][label].append(target)
    
    def _validate_graph(self) -> None:
        """Validate graph integrity"""
        for edge in self.edges:
            if edge.source not in self.nodes:
                raise DAGParseError(
                    f"Edge references non-existent source node: {edge.source}"
                )
            if edge.target not in self.nodes:
                raise DAGParseError(
                    f"Edge references non-existent target node: {edge.target}"
                )
        
        # Check for duplicate edges (same source-target, ignore label)
        edge_set = set()
        for edge in self.edges:
            edge_tuple = (edge.source, edge.target)
            if edge_tuple in edge_set:
                raise DAGParseError(
                    f"Duplicate edge detected: {edge.source} -> {edge.target}"
                )
            edge_set.add(edge_tuple)
        
        # NEW: Validate conditional edges
        self._validate_conditional_edges()
    
    def _validate_conditional_edges(self) -> None:
        """Validate conditional node edge labels"""
        for node_id, node in self.nodes.items():
            if node.type == 'conditional':
                edges = self.conditional_edges[node_id]
                
                # Warn if conditional has non-labeled edges
                if edges['default'] and (edges['true'] or edges['false']):
                    print(f"⚠️  Warning: Conditional node {node_id} has both labeled and unlabeled edges")
    
    def _has_cycle(self) -> bool:
        """Detect cycles using DFS with coloring"""
        color = {node_id: 0 for node_id in self.nodes}
        
        def dfs(node_id: str) -> bool:
            color[node_id] = 1
            
            for neighbor in self.adjacency_list[node_id]:
                if color[neighbor] == 1:
                    return True
                if color[neighbor] == 0 and dfs(neighbor):
                    return True
            
            color[node_id] = 2
            return False
        
        for node_id in self.nodes:
            if color[node_id] == 0:
                if dfs(node_id):
                    return True
        
        return False
    
    def _topological_sort(self) -> List[str]:
        """Perform topological sort using Kahn's algorithm"""
        in_degree_copy = self.in_degree.copy()
        
        queue = deque([
            node_id for node_id, degree in in_degree_copy.items() 
            if degree == 0
        ])
        
        execution_order = []
        
        while queue:
            current = queue.popleft()
            execution_order.append(current)
            
            for neighbor in self.adjacency_list[current]:
                in_degree_copy[neighbor] -= 1
                
                if in_degree_copy[neighbor] == 0:
                    queue.append(neighbor)
        
        if len(execution_order) != len(self.nodes):
            raise DAGParseError(
                f"Topological sort incomplete: processed {len(execution_order)}/{len(self.nodes)} nodes"
            )
        
        return execution_order
    
    def get_dependencies(self, node_id: str) -> List[str]:
        """Get direct dependencies (parent nodes) for a given node"""
        dependencies = []
        for edge in self.edges:
            if edge.target == node_id:
                dependencies.append(edge.source)
        return dependencies
    
    # NEW METHODS for conditional branching
    
    def get_conditional_targets(self, node_id: str, branch: str) -> List[str]:
        """
        Get target nodes for a specific conditional branch
        
        Args:
            node_id: Conditional node ID
            branch: Branch to get targets for ('true' or 'false')
        
        Returns:
            List of target node IDs for this branch
        """
        node = self.nodes.get(node_id)
        if not node or node.type != 'conditional':
            return []
        
        return self.conditional_edges[node_id].get(branch, [])
    
    def is_on_conditional_branch(self, node_id: str, parent_id: str, branch: str) -> bool:
        """
        Check if a node is on a specific conditional branch
        
        Args:
            node_id: Node to check
            parent_id: Parent conditional node
            branch: Branch label to check
        
        Returns:
            True if node is on this branch
        """
        targets = self.get_conditional_targets(parent_id, branch)
        return node_id in targets
    
    def has_conditional_parent(self, node_id: str) -> Tuple[bool, Optional[str]]:
        """
        Check if node has a conditional parent
        
        Args:
            node_id: Node to check
        
        Returns:
            Tuple of (has_conditional_parent, conditional_parent_id)
        """
        dependencies = self.get_dependencies(node_id)
        
        for dep_id in dependencies:
            dep_node = self.nodes.get(dep_id)
            if dep_node and dep_node.type == 'conditional':
                return True, dep_id
        
        return False, None
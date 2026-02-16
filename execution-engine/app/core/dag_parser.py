"""
DAG Parser
Responsibility: Parse workflow into directed acyclic graph and validate
- Build adjacency list from nodes and edges
- Detect cycles using DFS
- Perform topological sort using Kahn's algorithm
- Validate graph integrity (no orphan edges, all nodes reachable)
"""

from typing import List, Dict, Set, Tuple
from collections import defaultdict, deque
from app.schemas.workflow_schema import WorkflowNode, WorkflowEdge


class DAGParseError(Exception):
    """Raised when DAG parsing or validation fails"""
    pass


class DAGParser:
    """
    Parses workflow nodes and edges into a validated DAG
    
    This class is stateless and can be reused across executions.
    Future enhancement: Cache parsed DAGs by workflow hash.
    """
    
    def __init__(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]):
        """
        Initialize parser with workflow components
        
        Args:
            nodes: List of workflow nodes
            edges: List of workflow edges
        """
        self.nodes = {node.id: node for node in nodes}
        self.edges = edges
        self.adjacency_list: Dict[str, List[str]] = defaultdict(list)
        self.in_degree: Dict[str, int] = defaultdict(int)
        
    def parse(self) -> Tuple[List[str], Dict[str, WorkflowNode]]:
        """
        Parse and validate the workflow DAG
        
        Returns:
            Tuple of (topological_order, node_map)
            
        Raises:
            DAGParseError: If DAG is invalid (cycles, missing nodes, etc.)
        """
        # Step 1: Build adjacency list
        self._build_graph()
        
        # Step 2: Validate graph integrity
        self._validate_graph()
        
        # Step 3: Detect cycles
        if self._has_cycle():
            raise DAGParseError("Workflow contains circular dependencies (cycle detected)")
        
        # Step 4: Perform topological sort
        execution_order = self._topological_sort()
        
        return execution_order, self.nodes
    
    def _build_graph(self) -> None:
        """
        Build adjacency list and calculate in-degrees
        
        Adjacency list: node_id -> [dependent_node_ids]
        In-degree: node_id -> number of incoming edges
        """
        # Initialize in-degree for all nodes
        for node_id in self.nodes:
            self.in_degree[node_id] = 0
        
        # Build adjacency list
        for edge in self.edges:
            source = edge.source
            target = edge.target
            
            self.adjacency_list[source].append(target)
            self.in_degree[target] += 1
    
    def _validate_graph(self) -> None:
        """
        Validate graph integrity
        
        Checks:
        1. All edge sources/targets reference existing nodes
        2. No duplicate edges
        
        Raises:
            DAGParseError: If validation fails
        """
        # Check for missing nodes in edges
        for edge in self.edges:
            if edge.source not in self.nodes:
                raise DAGParseError(
                    f"Edge references non-existent source node: {edge.source}"
                )
            if edge.target not in self.nodes:
                raise DAGParseError(
                    f"Edge references non-existent target node: {edge.target}"
                )
        
        # Check for duplicate edges
        edge_set = set()
        for edge in self.edges:
            edge_tuple = (edge.source, edge.target)
            if edge_tuple in edge_set:
                raise DAGParseError(
                    f"Duplicate edge detected: {edge.source} -> {edge.target}"
                )
            edge_set.add(edge_tuple)
    
    def _has_cycle(self) -> bool:
        """
        Detect cycles using DFS with coloring
        
        White (0): Unvisited
        Gray (1): Currently visiting
        Black (2): Visited
        
        Returns:
            True if cycle exists, False otherwise
        """
        # Color map: 0 = white, 1 = gray, 2 = black
        color = {node_id: 0 for node_id in self.nodes}
        
        def dfs(node_id: str) -> bool:
            """DFS helper to detect back edges (cycles)"""
            color[node_id] = 1  # Mark as gray (visiting)
            
            for neighbor in self.adjacency_list[node_id]:
                if color[neighbor] == 1:  # Back edge found (cycle)
                    return True
                if color[neighbor] == 0 and dfs(neighbor):  # Recurse on white nodes
                    return True
            
            color[node_id] = 2  # Mark as black (visited)
            return False
        
        # Check all nodes (handles disconnected components)
        for node_id in self.nodes:
            if color[node_id] == 0:
                if dfs(node_id):
                    return True
        
        return False
    
    def _topological_sort(self) -> List[str]:
        """
        Perform topological sort using Kahn's algorithm
        
        Algorithm:
        1. Start with nodes that have no dependencies (in-degree = 0)
        2. Process each node, removing its edges
        3. Add newly zero-degree nodes to queue
        4. Repeat until all nodes processed
        
        Returns:
            List of node IDs in topological order
            
        Raises:
            DAGParseError: If topological sort fails (shouldn't happen after cycle check)
        """
        # Copy in-degree (don't modify original)
        in_degree_copy = self.in_degree.copy()
        
        # Queue of nodes with no dependencies
        queue = deque([
            node_id for node_id, degree in in_degree_copy.items() 
            if degree == 0
        ])
        
        execution_order = []
        
        while queue:
            # Process node with no dependencies
            current = queue.popleft()
            execution_order.append(current)
            
            # Remove edges from current node
            for neighbor in self.adjacency_list[current]:
                in_degree_copy[neighbor] -= 1
                
                # If neighbor now has no dependencies, add to queue
                if in_degree_copy[neighbor] == 0:
                    queue.append(neighbor)
        
        # Verify all nodes were processed
        if len(execution_order) != len(self.nodes):
            # This should not happen if cycle detection worked correctly
            raise DAGParseError(
                f"Topological sort incomplete: processed {len(execution_order)}/{len(self.nodes)} nodes"
            )
        
        return execution_order
    
    def get_dependencies(self, node_id: str) -> List[str]:
        """
        Get direct dependencies (parent nodes) for a given node
        
        Args:
            node_id: Node to find dependencies for
            
        Returns:
            List of node IDs that this node depends on
        """
        dependencies = []
        for edge in self.edges:
            if edge.target == node_id:
                dependencies.append(edge.source)
        return dependencies
"""
Execution Context
Responsibility: Manage execution state and data flow between nodes
- Store node outputs in memory
- Provide inputs to dependent nodes
- Track execution metadata
- Designed for easy migration to Redis in Phase 3
"""

from typing import Any, Dict, Optional, List
from datetime import datetime


class ExecutionContext:
    """
    In-memory execution context for workflow runs
    
    Stores node outputs and provides inputs to dependent nodes.
    
    Phase 3 Migration Path:
    - Replace dict storage with Redis hash
    - Add TTL for context expiration
    - Enable multi-worker access
    - Add distributed locking
    """
    
    def __init__(self, workflow_id: str, initial_data: Optional[Dict[str, Any]] = None):
        """
        Initialize execution context
        
        Args:
            workflow_id: ID of workflow being executed
            initial_data: Optional initial context data (e.g., user inputs)
        """
        self.workflow_id = workflow_id
        self.started_at = datetime.utcnow()
        
        # Core storage: node_id -> output_data
        self._node_outputs: Dict[str, Any] = {}
        
        # Metadata storage
        self._metadata: Dict[str, Any] = {
            "workflow_id": workflow_id,
            "started_at": self.started_at.isoformat(),
            "nodes_executed": [],
        }
        
        # Initialize with any provided data
        if initial_data:
            self._node_outputs["__initial__"] = initial_data
    
    def set_node_output(self, node_id: str, output: Any) -> None:
        """
        Store output from a node execution
        
        Args:
            node_id: Node that produced the output
            output: Output data (can be any JSON-serializable type)
        """
        self._node_outputs[node_id] = output
        self._metadata["nodes_executed"].append(node_id)
    
    def get_node_output(self, node_id: str) -> Optional[Any]:
        """
        Retrieve output from a previously executed node
        
        Args:
            node_id: Node to get output from
            
        Returns:
            Node output data, or None if node hasn't executed
        """
        return self._node_outputs.get(node_id)
    
    def get_node_inputs(self, node_id: str, dependencies: List[str]) -> Dict[str, Any]:
        """
        Gather inputs for a node from its dependencies
        
        This method collects outputs from all parent nodes and makes them
        available to the current node.
        
        Args:
            node_id: Node that needs inputs
            dependencies: List of parent node IDs
            
        Returns:
            Dictionary mapping dependency node IDs to their outputs
            
        Example:
            If node3 depends on node1 and node2:
            {
                "node1": {"result": "hello"},
                "node2": {"result": "world"}
            }
        """
        inputs = {}
        
        for dep_id in dependencies:
            dep_output = self.get_node_output(dep_id)
            if dep_output is not None:
                inputs[dep_id] = dep_output
        
        # Include initial context if no dependencies
        if not dependencies and "__initial__" in self._node_outputs:
            inputs["__initial__"] = self._node_outputs["__initial__"]
        
        return inputs
    
    def has_node_executed(self, node_id: str) -> bool:
        """
        Check if a node has been executed
        
        Args:
            node_id: Node to check
            
        Returns:
            True if node has executed and stored output
        """
        return node_id in self._node_outputs
    
    def get_all_outputs(self) -> Dict[str, Any]:
        """
        Get all node outputs
        
        Returns:
            Dictionary of all node outputs (excluding initial data)
        """
        return {
            k: v for k, v in self._node_outputs.items() 
            if k != "__initial__"
        }
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get execution metadata
        
        Returns:
            Execution metadata (workflow ID, timestamps, etc.)
        """
        return self._metadata.copy()
    
    def clear(self) -> None:
        """
        Clear all context data
        
        Useful for cleanup after execution completes.
        In Phase 3, this would delete Redis keys.
        """
        self._node_outputs.clear()
        self._metadata["nodes_executed"].clear()
    
    def __repr__(self) -> str:
        """String representation for debugging"""
        return (
            f"ExecutionContext(workflow_id={self.workflow_id}, "
            f"nodes_executed={len(self._metadata['nodes_executed'])})"
        )


class ContextManager:
    """
    Manages multiple execution contexts
    
    In Phase 3:
    - This becomes a Redis connection pool manager
    - Each context is a Redis hash with TTL
    - Supports concurrent workflow executions
    """
    
    def __init__(self):
        """Initialize context manager"""
        self._contexts: Dict[str, ExecutionContext] = {}
    
    def create_context(
        self, 
        workflow_id: str, 
        initial_data: Optional[Dict[str, Any]] = None
    ) -> ExecutionContext:
        """
        Create a new execution context
        
        Args:
            workflow_id: Workflow ID
            initial_data: Optional initial context data
            
        Returns:
            New ExecutionContext instance
        """
        context = ExecutionContext(workflow_id, initial_data)
        self._contexts[workflow_id] = context
        return context
    
    def get_context(self, workflow_id: str) -> Optional[ExecutionContext]:
        """
        Get existing execution context
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            ExecutionContext if exists, None otherwise
        """
        return self._contexts.get(workflow_id)
    
    def delete_context(self, workflow_id: str) -> bool:
        """
        Delete execution context
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            True if deleted, False if didn't exist
        """
        if workflow_id in self._contexts:
            del self._contexts[workflow_id]
            return True
        return False
    
    def cleanup_old_contexts(self, max_age_seconds: int = 3600) -> int:
        """
        Clean up old execution contexts
        
        In Phase 3, Redis TTL will handle this automatically.
        
        Args:
            max_age_seconds: Maximum age before cleanup
            
        Returns:
            Number of contexts cleaned up
        """
        now = datetime.utcnow()
        to_delete = []
        
        for workflow_id, context in self._contexts.items():
            age = (now - context.started_at).total_seconds()
            if age > max_age_seconds:
                to_delete.append(workflow_id)
        
        for workflow_id in to_delete:
            del self._contexts[workflow_id]
        
        return len(to_delete)


# Global context manager instance
# In Phase 3, this becomes a Redis connection pool
context_manager = ContextManager()
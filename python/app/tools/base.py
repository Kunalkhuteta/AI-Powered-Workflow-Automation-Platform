"""
Base Tool
Responsibility: Define tool interface and registry
- Abstract base class for all tools
- Tool registry for dynamic tool loading
- Consistent execute() interface
- Extensible for Phase 3 (HTTP tools, database tools, etc.)
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from app.core.context import ExecutionContext


class BaseTool(ABC):
    """
    Abstract base class for all workflow tools
    
    All tools must implement the execute() method.
    Tools are stateless and can be reused across executions.
    
    Phase 3 Extensions:
    - Add retry logic
    - Add timeout handling
    - Add input/output validation schemas
    - Add cost tracking
    """
    
    def __init__(self):
        """Initialize tool (override for tool-specific setup)"""
        self.tool_name = self.__class__.__name__
    
    @abstractmethod
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        """
        Execute the tool logic
        
        Args:
            node_id: ID of the node being executed
            config: Node-specific configuration from workflow
            inputs: Inputs from parent nodes
            context: Execution context for reading/writing data
            
        Returns:
            Tool output (will be stored in context)
            
        Raises:
            ToolExecutionError: If execution fails
        """
        pass
    
    def validate_config(self, config: Dict[str, Any]) -> None:
        """
        Validate tool configuration (optional override)
        
        Args:
            config: Node configuration to validate
            
        Raises:
            ValueError: If configuration is invalid
        """
        pass
    
    def __repr__(self) -> str:
        """String representation"""
        return f"{self.tool_name}()"


class ToolExecutionError(Exception):
    """Raised when tool execution fails"""
    
    def __init__(self, tool_name: str, node_id: str, message: str):
        self.tool_name = tool_name
        self.node_id = node_id
        self.message = message
        super().__init__(f"Tool '{tool_name}' failed on node '{node_id}': {message}")


class ToolRegistry:
    """
    Registry for managing available tools
    
    Maps node types to tool implementations.
    Enables dynamic tool loading and swapping.
    
    Usage:
        registry = ToolRegistry()
        registry.register("llm", LLMTool())
        tool = registry.get("llm")
    """
    
    def __init__(self):
        """Initialize empty registry"""
        self._tools: Dict[str, BaseTool] = {}
    
    def register(self, node_type: str, tool: BaseTool) -> None:
        """
        Register a tool for a node type
        
        Args:
            node_type: Node type identifier (e.g., "llm", "logger")
            tool: Tool instance to handle this node type
        """
        if not isinstance(tool, BaseTool):
            raise TypeError(f"Tool must be instance of BaseTool, got {type(tool)}")
        
        self._tools[node_type.lower()] = tool
    
    def get(self, node_type: str) -> Optional[BaseTool]:
        """
        Get tool for a node type
        
        Args:
            node_type: Node type to get tool for
            
        Returns:
            Tool instance if registered, None otherwise
        """
        return self._tools.get(node_type.lower())
    
    def has_tool(self, node_type: str) -> bool:
        """
        Check if tool is registered for node type
        
        Args:
            node_type: Node type to check
            
        Returns:
            True if tool is registered
        """
        return node_type.lower() in self._tools
    
    def get_registered_types(self) -> list:
        """
        Get all registered node types
        
        Returns:
            List of registered node type names
        """
        return list(self._tools.keys())
    
    def unregister(self, node_type: str) -> bool:
        """
        Remove a tool from registry
        
        Args:
            node_type: Node type to unregister
            
        Returns:
            True if tool was removed, False if didn't exist
        """
        if node_type.lower() in self._tools:
            del self._tools[node_type.lower()]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all registered tools"""
        self._tools.clear()
    
    def __repr__(self) -> str:
        """String representation"""
        types = ', '.join(self._tools.keys())
        return f"ToolRegistry(registered_types=[{types}])"


# Global tool registry instance
# Tools are registered at application startup
tool_registry = ToolRegistry()
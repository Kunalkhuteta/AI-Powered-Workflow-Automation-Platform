"""
Workflow Schemas
Responsibility: Define and validate workflow data structures
- Pydantic models for type safety and validation
- Clear separation of input/output schemas
- Prepared for future extensions (retry config, timeouts, etc.)
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, validator


class WorkflowNode(BaseModel):
    """
    Individual node in the workflow graph
    
    Attributes:
        id: Unique node identifier
        type: Node type (determines which tool to use)
        config: Node-specific configuration (prompts, params, etc.)
        data: Additional metadata (optional, for UI state)
    """
    id: str = Field(..., description="Unique node identifier")
    type: str = Field(..., description="Node type (llm, logger, http, etc.)")
    config: Dict[str, Any] = Field(default_factory=dict, description="Node configuration")
    data: Optional[Dict[str, Any]] = Field(default=None, description="UI metadata")

    @validator('id')
    def validate_id(cls, v):
        if not v or not v.strip():
            raise ValueError("Node ID cannot be empty")
        return v.strip()

    @validator('type')
    def validate_type(cls, v):
        if not v or not v.strip():
            raise ValueError("Node type cannot be empty")
        return v.strip().lower()


class WorkflowEdge(BaseModel):
    """
    Edge connecting two nodes in the workflow graph
    
    Attributes:
        id: Unique edge identifier (optional for now)
        source: Source node ID
        target: Target node ID
        sourceHandle: Source output handle (for future multi-output support)
        targetHandle: Target input handle (for future multi-input support)
    """
    id: Optional[str] = Field(None, description="Edge identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    sourceHandle: Optional[str] = Field(None, description="Source output handle")
    targetHandle: Optional[str] = Field(None, description="Target input handle")

    @validator('source', 'target')
    def validate_node_refs(cls, v):
        if not v or not v.strip():
            raise ValueError("Source and target cannot be empty")
        return v.strip()


class WorkflowRequest(BaseModel):
    """
    Request payload for workflow execution
    
    Attributes:
        workflowId: Database workflow ID (for tracking)
        nodes: List of workflow nodes
        edges: List of workflow edges
        initialContext: Optional initial data to inject into context
    """
    workflowId: str = Field(..., description="Workflow database ID")
    nodes: List[WorkflowNode] = Field(..., min_items=1, description="Workflow nodes")
    edges: List[WorkflowEdge] = Field(default_factory=list, description="Workflow edges")
    initialContext: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Initial execution context"
    )

    @validator('nodes')
    def validate_nodes(cls, v):
        if not v:
            raise ValueError("Workflow must have at least one node")
        
        # Check for duplicate node IDs
        node_ids = [node.id for node in v]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("Duplicate node IDs found")
        
        return v


class NodeExecutionResult(BaseModel):
    """
    Result of a single node execution
    
    Attributes:
        nodeId: Node that was executed
        status: Execution status
        output: Node output data
        error: Error message if failed
        executionTime: Time taken to execute (seconds)
    """
    nodeId: str
    status: Literal["success", "failed", "skipped"]
    output: Optional[Any] = None
    error: Optional[str] = None
    executionTime: Optional[float] = None


class ExecutionResponse(BaseModel):
    """
    Complete workflow execution response
    
    Attributes:
        workflowId: Workflow that was executed
        status: Overall execution status
        executionOrder: Order in which nodes were executed (topological)
        nodeResults: Results for each executed node
        totalExecutionTime: Total time taken
        failedNode: Node ID that caused failure (if any)
        error: Error message if workflow failed
    """
    workflowId: str
    status: Literal["success", "failed", "partial"]
    executionOrder: List[str]
    nodeResults: Dict[str, NodeExecutionResult]
    totalExecutionTime: float
    failedNode: Optional[str] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
"""
Workflow Schemas - UPDATED with Conditional Branching Support
Added 'label' field to WorkflowEdge for conditional branch routing
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, validator


class WorkflowNode(BaseModel):
    """Individual node in the workflow graph"""
    id: str = Field(..., description="Unique node identifier")
    type: str = Field(..., description="Node type (llm, logger, http, conditional, etc.)")
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
    Edge connecting two nodes - UPDATED for conditional branching
    
    Attributes:
        source: Source node ID
        target: Target node ID
        label: Branch label ('true', 'false', 'default') for conditional routing
        id: Optional unique edge identifier
        sourceHandle: Source output handle
        targetHandle: Target input handle
    """
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    label: Optional[str] = Field(
        default="default", 
        description="Branch label: 'true', 'false', or 'default'"
    )
    id: Optional[str] = Field(None, description="Edge identifier")
    sourceHandle: Optional[str] = Field(None, description="Source output handle")
    targetHandle: Optional[str] = Field(None, description="Target input handle")

    @validator('source', 'target')
    def validate_node_refs(cls, v):
        if not v or not v.strip():
            raise ValueError("Source and target cannot be empty")
        return v.strip()

    @validator('label')
    def validate_label(cls, v):
        """Validate and normalize edge labels"""
        if v is None or v == '':
            return 'default'
        
        v = v.lower().strip()
        
        # Accept common variations
        if v in ['true', 'yes', '1', 'success']:
            return 'true'
        elif v in ['false', 'no', '0', 'fail', 'failure']:
            return 'false'
        elif v in ['default', 'normal', '']:
            return 'default'
        
        # If unknown, default to 'default' (backward compatible)
        return 'default'


class WorkflowRequest(BaseModel):
    """Request payload for workflow execution"""
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
        
        node_ids = [node.id for node in v]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("Duplicate node IDs found")
        
        return v


class NodeExecutionResult(BaseModel):
    """Result of a single node execution"""
    nodeId: str
    status: Literal["success", "failed", "skipped"]
    output: Optional[Any] = None
    error: Optional[str] = None
    executionTime: Optional[float] = None
    skippedReason: Optional[str] = Field(
        None,
        description="Why node was skipped (e.g., 'Not on active conditional branch')"
    )


class ExecutionResponse(BaseModel):
    """Complete workflow execution response"""
    workflowId: str
    status: Literal["success", "failed", "partial"]
    executionOrder: List[str]
    nodeResults: Dict[str, NodeExecutionResult]
    totalExecutionTime: float
    failedNode: Optional[str] = None
    error: Optional[str] = None
    skippedNodes: Optional[List[str]] = Field(
        default_factory=list,
        description="Nodes skipped due to conditional branching"
    )


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
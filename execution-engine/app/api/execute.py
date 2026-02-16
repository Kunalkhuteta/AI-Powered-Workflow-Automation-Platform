"""
Execution API
Responsibility: HTTP endpoints for workflow execution
- POST /execute - Execute workflow
- GET /health - Health check
- Simple, focused API for Phase 2
"""

from fastapi import APIRouter, HTTPException
from app.schemas.workflow_schema import WorkflowRequest, ExecutionResponse
from app.core.executor import executor

router = APIRouter()


@router.post("/execute", response_model=ExecutionResponse)
async def execute_workflow(request: WorkflowRequest):
    """
    Execute a workflow
    
    Request Body:
        workflowId: Workflow database ID
        nodes: List of workflow nodes
        edges: List of workflow edges
        initialContext: Optional initial data
    
    Returns:
        Execution response with node results
    
    Raises:
        HTTPException: If execution fails critically
    """
    try:
        # Execute workflow
        result = await executor.execute_workflow(request)
        
        return result
        
    except Exception as e:
        # Catch-all for unexpected errors
        # Executor already handles most errors gracefully
        raise HTTPException(
            status_code=500,
            detail=f"Execution engine error: {str(e)}"
        )


@router.get("/history/{workflow_id}")
async def get_execution_history(workflow_id: str, limit: int = 10):
    """
    Get execution history for a workflow
    
    Args:
        workflow_id: Workflow ID to get history for
        limit: Maximum number of records (default: 10)
    
    Returns:
        List of execution records
    """
    history = executor.get_execution_history(workflow_id, limit)
    
    return {
        "workflow_id": workflow_id,
        "executions": history,
        "count": len(history)
    }


@router.get("/stats")
async def get_execution_stats():
    """
    Get execution statistics
    
    Returns:
        Execution statistics (total runs, success rate, etc.)
    """
    history = executor.get_execution_history(limit=1000)
    
    total = len(history)
    successful = sum(1 for h in history if h["status"] == "success")
    failed = total - successful
    
    avg_time = (
        sum(h["execution_time"] for h in history) / total
        if total > 0 else 0
    )
    
    return {
        "total_executions": total,
        "successful": successful,
        "failed": failed,
        "success_rate": successful / total if total > 0 else 0,
        "average_execution_time": avg_time
    }
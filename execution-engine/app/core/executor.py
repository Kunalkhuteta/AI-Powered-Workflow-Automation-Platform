"""
Workflow Executor
Responsibility: Orchestrate workflow execution
- Parse DAG using DAGParser
- Execute nodes in topological order
- Manage execution context
- Handle errors gracefully
- Return structured results
- Designed for easy Phase 3 enhancement (async, retry, parallel)
"""

from typing import Dict, Any, List
import time
from datetime import datetime

from app.core.dag_parser import DAGParser, DAGParseError
from app.core.context import ExecutionContext, context_manager
from app.tools.base import tool_registry, ToolExecutionError
from app.schemas.workflow_schema import (
    WorkflowRequest,
    ExecutionResponse,
    NodeExecutionResult,
    WorkflowNode
)


class WorkflowExecutor:
    """
    Main workflow execution engine
    
    Responsibilities:
    1. Parse workflow into DAG
    2. Validate graph structure
    3. Execute nodes in topological order
    4. Manage execution context
    5. Handle failures gracefully
    
    Phase 3 Enhancements:
    - Parallel execution for independent nodes
    - Retry logic with exponential backoff
    - Timeout handling
    - Execution checkpointing
    - Resume from failure
    """
    
    def __init__(self):
        """Initialize executor"""
        self.execution_history: List[Dict[str, Any]] = []
    
    async def execute_workflow(self, request: WorkflowRequest) -> ExecutionResponse:
        """
        Execute a complete workflow
        
        Args:
            request: Workflow execution request
            
        Returns:
            Execution response with results
        """
        workflow_id = request.workflowId
        start_time = time.time()
        
        try:
            # Step 1: Parse and validate DAG
            parser = DAGParser(request.nodes, request.edges)
            execution_order, node_map = parser.parse()
            
            # Step 2: Create execution context
            context = context_manager.create_context(
                workflow_id=workflow_id,
                initial_data=request.initialContext
            )
            
            # Step 3: Execute nodes in topological order
            node_results = await self._execute_nodes(
                execution_order=execution_order,
                node_map=node_map,
                parser=parser,
                context=context
            )
            
            # Step 4: Calculate total execution time
            total_time = time.time() - start_time
            
            # Step 5: Build success response
            response = ExecutionResponse(
                workflowId=workflow_id,
                status="success",
                executionOrder=execution_order,
                nodeResults=node_results,
                totalExecutionTime=total_time
            )
            
            # Step 6: Store execution history
            self._record_execution(request, response)
            
            return response
            
        except DAGParseError as e:
            # DAG validation failed
            return self._build_error_response(
                workflow_id=workflow_id,
                error=f"DAG validation failed: {str(e)}",
                start_time=start_time
            )
            
        except ToolExecutionError as e:
            # Tool execution failed
            return self._build_error_response(
                workflow_id=workflow_id,
                error=str(e),
                failed_node=e.node_id,
                start_time=start_time
            )
            
        except Exception as e:
            # Unexpected error
            return self._build_error_response(
                workflow_id=workflow_id,
                error=f"Unexpected error: {str(e)}",
                start_time=start_time
            )
        
        finally:
            # Cleanup: In Phase 3, context stays in Redis for debugging
            # For now, we keep it for potential re-runs
            pass
    
    async def _execute_nodes(
        self,
        execution_order: List[str],
        node_map: Dict[str, WorkflowNode],
        parser: DAGParser,
        context: ExecutionContext
    ) -> Dict[str, NodeExecutionResult]:
        """
        Execute nodes in topological order
        
        Args:
            execution_order: List of node IDs in execution order
            node_map: Map of node ID to node object
            parser: DAG parser (for getting dependencies)
            context: Execution context
            
        Returns:
            Dictionary of node results
        """
        results = {}
        
        for node_id in execution_order:
            # Get node and its dependencies
            node = node_map[node_id]
            dependencies = parser.get_dependencies(node_id)
            
            # Execute node
            result = await self._execute_single_node(
                node=node,
                dependencies=dependencies,
                context=context
            )
            
            results[node_id] = result
            
            # Stop execution if node failed
            if result.status == "failed":
                raise ToolExecutionError(
                    tool_name="unknown",
                    node_id=node_id,
                    message=result.error or "Node execution failed"
                )
        
        return results
    
    async def _execute_single_node(
        self,
        node: WorkflowNode,
        dependencies: List[str],
        context: ExecutionContext
    ) -> NodeExecutionResult:
        """
        Execute a single node
        
        Args:
            node: Node to execute
            dependencies: List of parent node IDs
            context: Execution context
            
        Returns:
            Node execution result
        """
        node_id = node.id
        start_time = time.time()
        
        try:
            # Step 1: Get appropriate tool for node type
            tool = tool_registry.get(node.type)
            
            if tool is None:
                raise ValueError(
                    f"No tool registered for node type: {node.type}. "
                    f"Available types: {tool_registry.get_registered_types()}"
                )
            
            # Step 2: Gather inputs from dependencies
            inputs = context.get_node_inputs(node_id, dependencies)
            
            # Step 3: Execute tool
            output = tool.execute(
                node_id=node_id,
                config=node.config,
                inputs=inputs,
                context=context
            )
            
            # Step 4: Store output in context
            context.set_node_output(node_id, output)
            
            # Step 5: Calculate execution time
            execution_time = time.time() - start_time
            
            # Step 6: Return success result
            return NodeExecutionResult(
                nodeId=node_id,
                status="success",
                output=output,
                executionTime=execution_time
            )
            
        except Exception as e:
            # Node execution failed
            execution_time = time.time() - start_time
            
            return NodeExecutionResult(
                nodeId=node_id,
                status="failed",
                error=str(e),
                executionTime=execution_time
            )
    
    def _build_error_response(
        self,
        workflow_id: str,
        error: str,
        failed_node: str = None,
        start_time: float = None
    ) -> ExecutionResponse:
        """
        Build error response
        
        Args:
            workflow_id: Workflow ID
            error: Error message
            failed_node: Node that failed (optional)
            start_time: Execution start time
            
        Returns:
            Error execution response
        """
        total_time = time.time() - start_time if start_time else 0
        
        return ExecutionResponse(
            workflowId=workflow_id,
            status="failed",
            executionOrder=[],
            nodeResults={},
            totalExecutionTime=total_time,
            failedNode=failed_node,
            error=error
        )
    
    def _record_execution(
        self,
        request: WorkflowRequest,
        response: ExecutionResponse
    ) -> None:
        """
        Record execution in history
        
        Phase 2: Store in memory
        Phase 3: Store in MongoDB
        
        Args:
            request: Original request
            response: Execution response
        """
        record = {
            "workflow_id": request.workflowId,
            "timestamp": datetime.utcnow().isoformat(),
            "status": response.status,
            "execution_time": response.totalExecutionTime,
            "nodes_executed": len(response.nodeResults),
        }
        
        self.execution_history.append(record)
        
        # Phase 3: Persist to database
        # await mongodb.executions.insert_one(record)
    
    def get_execution_history(
        self,
        workflow_id: str = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get execution history
        
        Args:
            workflow_id: Filter by workflow ID (optional)
            limit: Maximum number of records
            
        Returns:
            List of execution records
        """
        history = self.execution_history
        
        if workflow_id:
            history = [
                record for record in history
                if record["workflow_id"] == workflow_id
            ]
        
        return history[-limit:]


# Global executor instance
executor = WorkflowExecutor()
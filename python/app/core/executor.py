"""
Workflow Executor - ULTIMATE FIX
Auto-populates edge labels from sourceHandle to ensure branching works
"""

from typing import Dict, Any, List, Set, Tuple, Optional
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
    """Main workflow execution engine with conditional branching"""
    
    def __init__(self):
        self.execution_history: List[Dict[str, Any]] = []
        self.active_branches: Dict[str, str] = {}
    
    async def execute_workflow(self, request: WorkflowRequest) -> ExecutionResponse:
        """Execute workflow with conditional branching"""
        workflow_id = request.workflowId
        start_time = time.time()
        
        try:
            # CRITICAL FIX: Normalize edges before parsing
            normalized_edges = self._normalize_edges(request.edges, request.nodes)
            
            parser = DAGParser(request.nodes, normalized_edges)
            execution_order, node_map = parser.parse()
            
            context = context_manager.create_context(
                workflow_id=workflow_id,
                initial_data=request.initialContext
            )
            
            self.active_branches = {}
            
            node_results, skipped_nodes = await self._execute_nodes_with_branching(
                execution_order=execution_order,
                node_map=node_map,
                parser=parser,
                context=context,
                edges=normalized_edges
            )
            
            total_time = time.time() - start_time
            
            response = ExecutionResponse(
                workflowId=workflow_id,
                status="success",
                executionOrder=execution_order,
                nodeResults=node_results,
                totalExecutionTime=total_time,
                skippedNodes=skipped_nodes
            )
            
            self._record_execution(request, response)
            return response
            
        except DAGParseError as e:
            return self._build_error_response(workflow_id, f"DAG validation failed: {str(e)}", start_time=start_time)
        except ToolExecutionError as e:
            return self._build_error_response(workflow_id, str(e), failed_node=e.node_id, start_time=start_time)
        except Exception as e:
            import traceback
            print(f"❌ Executor error: {traceback.format_exc()}")
            return self._build_error_response(workflow_id, f"Unexpected error: {str(e)}", start_time=start_time)
    
    def _normalize_edges(self, edges: List, nodes: List) -> List:
        """
        CRITICAL FIX: Ensure edges from conditional nodes have proper labels
        
        This fixes the issue where edges have sourceHandle but not label
        """
        # Build node type map
        node_types = {}
        for node in nodes:
            node_types[node.id] = node.type
        
        normalized = []
        for edge in edges:
            edge_dict = edge.dict() if hasattr(edge, 'dict') else edge.__dict__
            
            # Check if source is conditional or loop
            source_type = node_types.get(edge_dict.get('source'))
            
            if source_type == 'conditional':
                # Get sourceHandle
                source_handle = edge_dict.get('sourceHandle', '')
                
                # Auto-populate label from sourceHandle if missing
                if not edge_dict.get('label') and source_handle:
                    if 'true' in str(source_handle).lower():
                        edge_dict['label'] = 'true'
                        print(f"🔧 Auto-set edge label: {edge_dict['source']} → {edge_dict['target']} = 'true'")
                    elif 'false' in str(source_handle).lower():
                        edge_dict['label'] = 'false'
                        print(f"🔧 Auto-set edge label: {edge_dict['source']} → {edge_dict['target']} = 'false'")
            
            elif source_type == 'loop':
                source_handle = edge_dict.get('sourceHandle', '')
                
                if not edge_dict.get('label') and source_handle:
                    if 'body' in str(source_handle).lower():
                        edge_dict['label'] = 'loop_body'
                        print(f"🔧 Auto-set edge label: {edge_dict['source']} → {edge_dict['target']} = 'loop_body'")
                    elif 'done' in str(source_handle).lower():
                        edge_dict['label'] = 'loop_done'
                        print(f"🔧 Auto-set edge label: {edge_dict['source']} → {edge_dict['target']} = 'loop_done'")
            
            # Create edge object with updated dict
            normalized.append(type('Edge', (), edge_dict)())
        
        return normalized
    
    async def _execute_nodes_with_branching(
        self,
        execution_order: List[str],
        node_map: Dict[str, WorkflowNode],
        parser: DAGParser,
        context: ExecutionContext,
        edges: List
    ) -> Tuple[Dict[str, NodeExecutionResult], List[str]]:
        """Execute nodes with conditional branching"""
        
        results = {}
        skipped_nodes = []
        
        for node_id in execution_order:
            node = node_map[node_id]
            
            # Check if should skip
            should_skip, skip_reason = self._should_skip_node(
                node_id=node_id,
                node_map=node_map,
                parser=parser,
                edges=edges
            )
            
            if should_skip:
                print(f"⏭️  Skipping {node_id}: {skip_reason}")
                skipped_nodes.append(node_id)
                
                results[node_id] = NodeExecutionResult(
                    nodeId=node_id,
                    status="skipped",
                    skippedReason=skip_reason,
                    executionTime=0.0
                )
                continue
            
            # Execute node
            dependencies = parser.get_dependencies(node_id)
            result = await self._execute_single_node(
                node=node,
                dependencies=dependencies,
                context=context
            )
            
            results[node_id] = result
            print(f"[Executed {node_id}] ✅")
            
            # Track branching (conditional or loop)
            if node.type == 'conditional' and result.status == 'success':
                self._track_branch(node_id, result.output)
            elif node.type == 'loop' and result.status == 'success':
                self._track_loop_branch(node_id, result.output)
            
            if result.status == "failed":
                raise ToolExecutionError(
                    tool_name="unknown",
                    node_id=node_id,
                    message=result.error or "Node execution failed"
                )
        
        return results, skipped_nodes
    
    def _should_skip_node(
        self,
        node_id: str,
        node_map: Dict[str, WorkflowNode],
        parser: DAGParser,
        edges: List
    ) -> Tuple[bool, str]:
        """Determine if node should be skipped due to conditional branching"""
        
        # Get parent nodes
        dependencies = parser.get_dependencies(node_id)
        
        if not dependencies:
            return False, ""
        
        # Check each parent
        for parent_id in dependencies:
            parent_node = node_map.get(parent_id)
            
            if not parent_node or parent_node.type not in ['conditional', 'loop']:
                continue
            
            # Parent is conditional or loop - check if we should skip
            active_branch = self.active_branches.get(parent_id)
            
            if not active_branch:
                continue
            
            # Get edge branch
            edge_branch = self._get_edge_branch(parent_id, node_id, edges)
            
            print(f"🔍 Node {node_id}: parent={parent_id}, active={active_branch}, edge={edge_branch}")
            
            # Skip if edge doesn't match active branch
            if edge_branch and edge_branch != active_branch:
                # For loops, 'loop_body' and 'loop_done' are the valid labels
                return True, f"Not on active '{active_branch}' branch (edge is '{edge_branch}')"
        
        return False, ""
    
    def _get_edge_branch(self, source: str, target: str, edges: List) -> Optional[str]:
        """Get branch from edge using ALL available fields"""
        for edge in edges:
            edge_source = getattr(edge, 'source', None)
            edge_target = getattr(edge, 'target', None)
            
            if edge_source == source and edge_target == target:
                # Method 1: Check label (set by normalize_edges)
                label = getattr(edge, 'label', None)
                if label:
                    label_str = str(label).lower()
                    if label_str in ['true', 'false', 'loop_body', 'loop_done']:
                        return label_str
                
                # Method 3: Check for loop handles
                source_handle = getattr(edge, 'sourceHandle', None)
                if source_handle:
                    handle = str(source_handle).lower()
                    if 'body' in handle:
                        return 'loop_body'
                    elif 'done' in handle:
                        return 'loop_done'
                
                # No branch info
                return None
        
        return None
    
    def _track_branch(self, node_id: str, output: Any) -> None:
        """Track which branch was taken (for conditionals)"""
        if isinstance(output, dict) and 'branch_taken' in output:
            branch = output['branch_taken']
            self.active_branches[node_id] = branch
            print(f"✅ Conditional {node_id}: Branch '{branch}' active")

    def _track_loop_branch(self, node_id: str, output: Any) -> None:
        """Track loop branch based on completion"""
        if isinstance(output, dict) and output.get('type') == 'loop_result':
            # In a DAG engine, we typically go to 'done' after processing
            # or 'body' if we want to signal success. 
            # For this engine, we'll signal 'loop_done' as the primary path
            # and 'loop_body' if the user wants to branch on items.
            if output.get('iterations_completed', 0) > 0:
                self.active_branches[node_id] = 'loop_body'
                # Special: if both exist, usually 'done' is also active eventually
                # but for DAG branching, we pick one per execution pass
            else:
                self.active_branches[node_id] = 'loop_done'
            print(f"✅ Loop {node_id}: Branch '{self.active_branches[node_id]}' active")
    
    async def _execute_single_node(
        self,
        node: WorkflowNode,
        dependencies: List[str],
        context: ExecutionContext
    ) -> NodeExecutionResult:
        """Execute a single node"""
        node_id = node.id
        start_time = time.time()
        
        try:
            tool = tool_registry.get(node.type)
            
            if tool is None:
                raise ValueError(f"No tool for type: {node.type}")
            
            inputs = context.get_node_inputs(node_id, dependencies)
            
            output = tool.execute(
                node_id=node_id,
                config=node.config,
                inputs=inputs,
                context=context
            )
            
            context.set_node_output(node_id, output)
            
            execution_time = time.time() - start_time
            
            return NodeExecutionResult(
                nodeId=node_id,
                status="success",
                output=output,
                executionTime=execution_time
            )
            
        except Exception as e:
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
        """Build error response"""
        total_time = time.time() - start_time if start_time else 0
        
        return ExecutionResponse(
            workflowId=workflow_id,
            status="failed",
            executionOrder=[],
            nodeResults={},
            totalExecutionTime=total_time,
            failedNode=failed_node,
            error=error,
            skippedNodes=[]
        )
    
    def _record_execution(self, request: WorkflowRequest, response: ExecutionResponse) -> None:
        """Record execution"""
        record = {
            "workflow_id": request.workflowId,
            "timestamp": datetime.utcnow().isoformat(),
            "status": response.status,
            "execution_time": response.totalExecutionTime,
            "nodes_executed": len([r for r in response.nodeResults.values() if r.status == "success"]),
            "nodes_skipped": len(response.skippedNodes) if response.skippedNodes else 0,
        }
        self.execution_history.append(record)
    
    def get_execution_history(self, workflow_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get execution history"""
        history = self.execution_history
        if workflow_id:
            history = [r for r in history if r["workflow_id"] == workflow_id]
        return history[-limit:]


# Global instance
executor = WorkflowExecutor()
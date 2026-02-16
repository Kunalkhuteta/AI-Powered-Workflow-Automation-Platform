/**
 * Workflow Executor Component
 * Debug UI for workflow execution monitoring
 */

import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { apiService } from '../services/api';
import ExecutionPanel from './ExecutionPanel';
import './WorkflowExecutor.css';

const WorkflowExecutor = ({ workflowId }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [nodeStates, setNodeStates] = useState({});

  // Load workflow on mount
  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const response = await apiService.getWorkflow(workflowId);
      const wf = response.data;
      setWorkflow(wf);

      // Convert workflow nodes to React Flow format
      const flowNodes = wf.nodes.map((node, index) => ({
        id: node.id,
        type: 'default',
        data: { 
          label: `${node.type}\n${node.id}`,
          config: node.config,
          nodeType: node.type,
        },
        position: node.data?.position || { x: 100 + index * 200, y: 100 },
        style: getNodeStyle('idle'),
      }));

      // Convert workflow edges to React Flow format
      const flowEdges = wf.edges.map((edge) => ({
        id: edge.id || `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: false,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);

      // Initialize all nodes as idle
      const initialStates = {};
      wf.nodes.forEach((node) => {
        initialStates[node.id] = 'idle';
      });
      setNodeStates(initialStates);

    } catch (error) {
      console.error('Failed to load workflow:', error);
      addLog('error', `Failed to load workflow: ${error.message}`);
    }
  };

  // Execute workflow
  const handleExecute = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setExecutionResult(null);
    setExecutionLogs([]);

    addLog('info', 'Starting workflow execution...');

    // Reset all nodes to idle
    updateAllNodeStates('idle');

    try {
      const result = await apiService.executeWorkflow(workflowId);
      
      addLog('success', 'Workflow execution completed');
      setExecutionResult(result.data);

      // Update node states based on results
      if (result.data.status === 'success') {
        processExecutionSuccess(result.data);
      } else {
        processExecutionFailure(result.data);
      }

    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      addLog('error', `Execution failed: ${errorMsg}`);
      updateAllNodeStates('failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Process successful execution
  const processExecutionSuccess = (result) => {
    const { executionOrder, nodeResults } = result;

    // Simulate execution flow (in Phase 3, use WebSocket for real-time)
    let delay = 0;
    executionOrder.forEach((nodeId, index) => {
      setTimeout(() => {
        updateNodeState(nodeId, 'running');
        addLog('info', `Executing node: ${nodeId}`);

        setTimeout(() => {
          const nodeResult = nodeResults[nodeId];
          if (nodeResult.status === 'success') {
            updateNodeState(nodeId, 'success');
            addLog('success', `Node ${nodeId} completed`, nodeResult.output);
          } else {
            updateNodeState(nodeId, 'failed');
            addLog('error', `Node ${nodeId} failed: ${nodeResult.error}`);
          }
        }, 500);
      }, delay);

      delay += 600;
    });
  };

  // Process failed execution
  const processExecutionFailure = (result) => {
    const { failedNode, error } = result;
    
    if (failedNode) {
      updateNodeState(failedNode, 'failed');
      addLog('error', `Node ${failedNode} failed: ${error}`);
    }
  };

  // Update single node state
  const updateNodeState = (nodeId, state) => {
    setNodeStates((prev) => ({ ...prev, [nodeId]: state }));
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, style: getNodeStyle(state) }
          : node
      )
    );
  };

  // Update all node states
  const updateAllNodeStates = (state) => {
    const newStates = {};
    nodes.forEach((node) => {
      newStates[node.id] = state;
    });
    setNodeStates(newStates);
    setNodes((nds) =>
      nds.map((node) => ({ ...node, style: getNodeStyle(state) }))
    );
  };

  // Add execution log
  const addLog = (level, message, data = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    setExecutionLogs((prev) => [...prev, logEntry]);
  };

  // Get node style based on state
  const getNodeStyle = (state) => {
    const baseStyle = {
      padding: '10px 20px',
      borderRadius: '8px',
      border: '2px solid',
      fontSize: '12px',
      fontWeight: 'bold',
    };

    switch (state) {
      case 'idle':
        return { ...baseStyle, borderColor: '#d1d5db', background: '#f9fafb', color: '#6b7280' };
      case 'running':
        return { ...baseStyle, borderColor: '#fbbf24', background: '#fef3c7', color: '#92400e' };
      case 'success':
        return { ...baseStyle, borderColor: '#10b981', background: '#d1fae5', color: '#065f46' };
      case 'failed':
        return { ...baseStyle, borderColor: '#ef4444', background: '#fee2e2', color: '#991b1b' };
      default:
        return baseStyle;
    }
  };

  // React Flow handlers
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  if (!workflow) {
    return <div className="loading">Loading workflow...</div>;
  }

  return (
    <div className="workflow-executor">
      <div className="executor-header">
        <h1>{workflow.name}</h1>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`execute-button ${isExecuting ? 'executing' : ''}`}
        >
          {isExecuting ? 'Executing...' : 'Run Workflow'}
        </button>
      </div>

      <div className="executor-content">
        <div className="flow-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        <ExecutionPanel
          logs={executionLogs}
          result={executionResult}
          isExecuting={isExecuting}
        />
      </div>
    </div>
  );
};

export default WorkflowExecutor;
/**
 * Enhanced WorkflowExecutor - Full Theme Support
 * Uses CSS classes instead of inline styles for dark/light mode
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { apiService } from '../services/api';
import '../styles/executor.css';

const WorkflowExecutor = ({ workflowId: propWorkflowId }) => {
  const [searchParams] = useSearchParams();
  const workflowId = propWorkflowId || searchParams.get('id');
  
  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    } else {
      setLoading(false);
      addLog('error', 'No workflow ID provided');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const addLog = (level, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { level, message, timestamp }]);
  };

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      addLog('info', `Loading workflow ${workflowId}...`);
      
      const response = await apiService.getWorkflow(workflowId);
      const workflowData = response.data?.data || response.data;
      
      if (!workflowData || !Array.isArray(workflowData.nodes)) {
        throw new Error('Invalid workflow structure');
      }

      setWorkflow(workflowData);
      
      const flowNodes = workflowData.nodes.map(node => ({
        id: node.id,
        type: 'default',
        position: node.data?.position || { x: 100, y: 100 },
        data: {
          label: (
            <div className="executor-node-label">
              <div className="executor-node-type">{node.type.toUpperCase()}</div>
              <div className="executor-node-id">{node.id}</div>
            </div>
          ),
        },
        className: 'executor-flow-node',
      }));

      const flowEdges = (workflowData.edges || []).map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        label: edge.label && edge.label !== 'default' ? edge.label.toUpperCase() : undefined,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      addLog('success', `Loaded "${workflowData.name}"`);
      
    } catch (error) {
      addLog('error', `Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateNodeStatus = (nodeId, status) => {
    setNodes(prev =>
      prev.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            className: `executor-flow-node node-status-${status}`,
          };
        }
        return node;
      })
    );
  };

  const executeWorkflow = async () => {
    if (isExecuting || !workflowId) return;

    setIsExecuting(true);
    setResults(null);
    setLogs([]);
    addLog('info', '▶️ Starting execution...');

    nodes.forEach(node => updateNodeStatus(node.id, 'idle'));

    try {
      const response = await apiService.post(`/workflows/${workflowId}/execute`);
      const result = response.data?.data || response.data;

      if (result.executionOrder) {
        for (const nodeId of result.executionOrder) {
          updateNodeStatus(nodeId, 'running');
          addLog('info', `Executing: ${nodeId}`);
          await new Promise(r => setTimeout(r, 800));
          updateNodeStatus(nodeId, 'success');
          addLog('success', `✓ ${nodeId} completed`);
        }
      }

      setResults(result);
      addLog('success', '✅ Workflow completed!');
      addLog('info', `Time: ${result.totalExecutionTime?.toFixed(2)}s`);

    } catch (error) {
      addLog('error', `❌ Failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) return <div className="executor-loading">⏳ Loading...</div>;
  if (!workflowId) return <div className="executor-loading">❌ No workflow ID</div>;
  if (!workflow) return <div className="executor-loading">❌ Failed to load</div>;

  return (
    <div className="executor-container">
      {/* Header */}
      <div className="executor-header">
        <div className="executor-header-info">
          <h2>{workflow.name}</h2>
          <p>{workflow.description}</p>
        </div>
        <button 
          onClick={executeWorkflow} 
          disabled={isExecuting}
          className={`executor-run-btn ${isExecuting ? 'executing' : ''}`}
        >
          {isExecuting ? '⏳ Executing...' : '▶️ Run Workflow'}
        </button>
      </div>

      {/* Main Content */}
      <div className="executor-body">
        {/* Graph Panel */}
        <div className="executor-graph-panel">
          <h3 className="executor-panel-title">📊 Workflow Graph</h3>
          <div className="executor-graph-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>

        {/* Results Panel */}
        <div className="executor-results-panel">
          {/* Tab Buttons */}
          <div className="executor-tabs">
            <button
              onClick={() => setActiveTab('logs')}
              className={`executor-tab ${activeTab === 'logs' ? 'active' : ''}`}
            >
              📋 Logs
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={!results}
              className={`executor-tab ${activeTab === 'results' ? 'active' : ''} ${!results ? 'disabled' : ''}`}
            >
              ✅ Results
            </button>
          </div>

          {/* Tab Content */}
          <div className="executor-tab-content">
            {activeTab === 'logs' && (
              <div className="executor-logs">
                {logs.length === 0 ? (
                  <p className="executor-empty-message">
                    No logs yet. Click "Run Workflow" to start.
                  </p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`executor-log-entry log-${log.level}`}>
                      <span className="log-timestamp">{log.timestamp}</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'results' && results && (
              <div className="executor-results">
                <div className="executor-result-summary">
                  <div className="result-stat">
                    <strong>Status:</strong>
                    <span className={`result-status status-${results.status}`}>
                      {results.status}
                    </span>
                  </div>
                  <div className="result-stat">
                    <strong>Time:</strong>
                    <span>{results.totalExecutionTime?.toFixed(2)}s</span>
                  </div>
                  <div className="result-stat">
                    <strong>Nodes:</strong>
                    <span>{results.executionOrder?.length || 0}</span>
                  </div>
                </div>

                {results.nodeResults && (
                  <div className="executor-node-results">
                    <h4>Node Outputs:</h4>
                    {Object.entries(results.nodeResults).map(([nodeId, result]) => (
                      <div key={nodeId} className="executor-node-output">
                        <div className="node-output-header">
                          <strong>{nodeId}</strong>
                          <span className={`node-output-status status-${result.status}`}>
                            {result.status}
                          </span>
                        </div>
                        {result.output && (
                          <pre className="node-output-data">
                            {JSON.stringify(result.output, null, 2)}
                          </pre>
                        )}
                        {result.error && (
                          <div className="node-output-error">
                            {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowExecutor;
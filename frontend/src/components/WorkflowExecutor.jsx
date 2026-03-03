/**
 * Enhanced WorkflowExecutor - Better UI, Full Logs, Working Canvas
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
            <div style={{ padding: '10px' }}>
              <div style={{ fontWeight: 'bold' }}>{node.type.toUpperCase()}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>{node.id}</div>
            </div>
          ),
        },
        style: {
          background: '#fff',
          border: '2px solid #ddd',
          borderRadius: '8px',
        },
      }));

      const flowEdges = (workflowData.edges || []).map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
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
          const colors = {
            idle: { border: '#ddd', bg: '#fff' },
            running: { border: '#f59e0b', bg: '#fef3c7' },
            success: { border: '#10b981', bg: '#d1fae5' },
            error: { border: '#ef4444', bg: '#fee2e2' },
          };
          
          return {
            ...node,
            style: {
              ...node.style,
              border: `2px solid ${colors[status].border}`,
              background: colors[status].bg,
            },
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

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>⏳ Loading...</div>;
  if (!workflowId) return <div style={{padding: '40px', textAlign: 'center'}}>❌ No workflow ID</div>;
  if (!workflow) return <div style={{padding: '40px', textAlign: 'center'}}>❌ Failed to load</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ 
        padding: '20px', 
        borderBottom: '2px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>{workflow.name}</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>{workflow.description}</p>
        </div>
        <button 
          onClick={executeWorkflow} 
          disabled={isExecuting}
          style={{
            padding: '12px 24px',
            background: isExecuting ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {isExecuting ? '⏳ Executing...' : '▶️ Run Workflow'}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '2px solid #e5e7eb' }}>
          <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            📊 Workflow Graph
          </h3>
          <div style={{ height: 'calc(100% - 60px)' }}>
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

        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('logs')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'logs' ? 'white' : '#f3f4f6',
                borderBottom: activeTab === 'logs' ? '3px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📋 Logs
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={!results}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'results' ? 'white' : '#f3f4f6',
                borderBottom: activeTab === 'results' ? '3px solid #3b82f6' : 'none',
                cursor: results ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                opacity: results ? 1 : 0.5
              }}
            >
              ✅ Results
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {activeTab === 'logs' && (
              <div>
                {logs.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
                    No logs yet. Click "Run Workflow" to start.
                  </p>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        margin: '4px 0',
                        borderRadius: '6px',
                        background: 
                          log.level === 'error' ? '#fee2e2' :
                          log.level === 'success' ? '#d1fae5' :
                          '#f3f4f6',
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ color: '#666', marginRight: '8px' }}>{log.timestamp}</span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'results' && results && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                    <strong>Status:</strong> <span style={{ color: '#10b981' }}>{results.status}</span>
                  </div>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                    <strong>Time:</strong> {results.totalExecutionTime?.toFixed(2)}s
                  </div>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                    <strong>Nodes:</strong> {results.executionOrder?.length || 0}
                  </div>
                </div>

                {results.nodeResults && (
                  <div>
                    <h4 style={{ marginBottom: '12px' }}>Node Outputs:</h4>
                    {Object.entries(results.nodeResults).map(([nodeId, result]) => (
                      <div key={nodeId} style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <strong>{nodeId}</strong>
                        </div>
                        <pre style={{ padding: '12px', margin: 0, fontSize: '12px', overflow: 'auto' }}>
                          {JSON.stringify(result.output, null, 2)}
                        </pre>
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
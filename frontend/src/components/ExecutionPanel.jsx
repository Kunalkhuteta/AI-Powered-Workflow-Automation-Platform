/**
 * Execution Panel Component
 * Displays execution logs and results
 */

import { useState } from 'react';
import '../styles/ExecutionPanel.css';

const ExecutionPanel = ({ logs, result, isExecuting }) => {
  const [activeTab, setActiveTab] = useState('logs');

  return (
    <div className="execution-panel">
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs {logs.length > 0 && `(${logs.length})`}
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'logs' && (
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="empty-state">No execution logs yet</div>
            ) : (
              <div className="logs-list">
                {logs.map((log, index) => (
                  <div key={index} className={`log-entry log-${log.level}`}>
                    <span className="log-timestamp">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="log-level">{log.level.toUpperCase()}</span>
                    <span className="log-message">{log.message}</span>
                    {log.data && (
                      <pre className="log-data">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isExecuting && (
              <div className="executing-indicator">
                <span className="spinner"></span> Executing...
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-container">
            {!result ? (
              <div className="empty-state">
                No execution results yet. Run the workflow to see results.
              </div>
            ) : (
              <div className="results-content">
                <div className="result-header">
                  <span className={`status-badge status-${result.status}`}>
                    {result.status}
                  </span>
                  <span className="execution-time">
                    {result.totalExecutionTime.toFixed(2)}s
                  </span>
                </div>

                <div className="execution-order">
                  <h3>Execution Order:</h3>
                  <div className="order-list">
                    {result.executionOrder.map((nodeId, index) => (
                      <span key={nodeId} className="order-item">
                        {index + 1}. {nodeId}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="node-results">
                  <h3>Node Results:</h3>
                  {Object.entries(result.nodeResults).map(([nodeId, nodeResult]) => (
                    <div key={nodeId} className="node-result">
                      <div className="node-result-header">
                        <strong>{nodeId}</strong>
                        <span className={`node-status status-${nodeResult.status}`}>
                          {nodeResult.status}
                        </span>
                        {nodeResult.executionTime && (
                          <span className="node-time">
                            {nodeResult.executionTime.toFixed(3)}s
                          </span>
                        )}
                      </div>
                      {nodeResult.output && (
                        <pre className="node-output">
                          {JSON.stringify(nodeResult.output, null, 2)}
                        </pre>
                      )}
                      {nodeResult.error && (
                        <div className="node-error">{nodeResult.error}</div>
                      )}
                    </div>
                  ))}
                </div>

                {result.error && (
                  <div className="execution-error">
                    <h3>Error:</h3>
                    <p>{result.error}</p>
                    {result.failedNode && (
                      <p>Failed at node: <strong>{result.failedNode}</strong></p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionPanel;
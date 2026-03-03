/**
 * HTTP Node - Professional Design
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const HTTPNode = ({ data, selected }) => {
  const method = data.config?.method || 'GET';
  const methodColors = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444'
  };

  return (
    <div className={`pro-node http-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon http-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">HTTP Request</div>
        <div className="node-subtitle">
          {data.config?.url ? 
            new URL(data.config.url).hostname : 
            'Configure endpoint'
          }
        </div>
      </div>
      
      <div 
        className="node-badge" 
        style={{ backgroundColor: methodColors[method], color: 'white' }}
      >
        {method}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default HTTPNode;
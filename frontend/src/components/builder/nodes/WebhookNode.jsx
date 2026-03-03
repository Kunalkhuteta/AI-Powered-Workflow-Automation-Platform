/**
 * WebhookNode.jsx - Visual node for webhook/API calls
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

const WebhookNode = ({ data, selected }) => {
  const config = data.config || {};
  const method = config.method || 'POST';
  const url = config.url || 'No URL set';
  
  // Get domain from URL
  const getDomain = (urlString) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return 'Set webhook URL';
    }
  };
  
  // Method colors
  const methodColors = {
    'GET': '#22c55e',
    'POST': '#3b82f6',
    'PUT': '#f59e0b',
    'DELETE': '#ef4444',
    'PATCH': '#8b5cf6'
  };
  
  return (
    <div className={`pro-node webhook-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon webhook-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Webhook</div>
        <div className="node-subtitle">
          {getDomain(url)}
        </div>
      </div>
      
      <div 
        className="node-badge" 
        style={{
          background: `${methodColors[method]}20`,
          color: methodColors[method],
          borderColor: `${methodColors[method]}40`
        }}
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

export default WebhookNode;
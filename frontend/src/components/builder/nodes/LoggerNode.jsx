/**
 * Logger Node - Professional Design
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const LoggerNode = ({ data, selected }) => {
  const levelIcons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠',
    error: '✕'
  };
  
  const level = data.config?.level || 'info';

  return (
    <div className={`pro-node logger-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon logger-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Logger</div>
        <div className="node-subtitle">
          {data.config?.message || 'Log output'}
        </div>
      </div>
      
      <div className={`node-badge badge-${level}`}>
        {levelIcons[level]} {level.toUpperCase()}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default LoggerNode;
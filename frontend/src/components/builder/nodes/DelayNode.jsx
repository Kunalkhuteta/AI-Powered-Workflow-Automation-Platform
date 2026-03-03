/**
 * DelayNode.jsx - Visual node for delay/wait functionality
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

const DelayNode = ({ data, selected }) => {
  const config = data.config || {};
  const duration = config.duration || 1;
  const unit = config.unit || 'seconds';
  
  return (
    <div className={`pro-node delay-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon delay-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Delay</div>
        <div className="node-subtitle">
          {duration} {unit}
        </div>
      </div>
      
      <div className="node-badge badge-info">⏱️ WAIT</div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default DelayNode;
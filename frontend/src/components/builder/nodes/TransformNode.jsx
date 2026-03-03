/**
 * Transform Node - Professional Design
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const TransformNode = ({ data, selected }) => {
  const operations = {
    extract: '↓',
    map: '→',
    filter: '⊘',
    merge: '⊕',
    flatten: '⬊',
    parse: '{ }',
    stringify: '" "'
  };
  
  const operation = data.config?.operation || 'extract';

  return (
    <div className={`pro-node transform-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon transform-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="15" y1="15" x2="21" y2="21"/>
          <line x1="4" y1="4" x2="9" y2="9"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Transform</div>
        <div className="node-subtitle">
          {operations[operation]} {operation.charAt(0).toUpperCase() + operation.slice(1)}
        </div>
      </div>
      
      <div className="node-badge badge-purple">
        {data.config?.fields?.length || 0} fields
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default TransformNode;
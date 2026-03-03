/**
 * Conditional Node - Professional Design with TRUE/FALSE branches
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const ConditionalNode = ({ data, selected }) => {
  return (
    <div className={`pro-node conditional-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon conditional-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Conditional</div>
        <div className="node-subtitle">
          {data.config?.operator || '=='} condition
        </div>
      </div>
      
      <div className="conditional-branches">
        <div className="branch-label branch-true">
          <span className="branch-icon">✓</span> TRUE
        </div>
        <div className="branch-label branch-false">
          <span className="branch-icon">✕</span> FALSE
        </div>
      </div>
      
      {/* TRUE Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="true"
        className="node-handle node-handle-source handle-true"
        style={{ left: '30%' }}
      />
      
      {/* FALSE Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="false"
        className="node-handle node-handle-source handle-false"
        style={{ left: '70%' }}
      />
    </div>
  );
};

export default ConditionalNode;
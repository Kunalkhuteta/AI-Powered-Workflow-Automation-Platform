/**
 * LLM Node - Professional Design
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const LLMNode = ({ data, selected }) => {
  return (
    <div className={`pro-node llm-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon llm-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 10h.01M12 10h.01M16 10h.01"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">AI Model</div>
        <div className="node-subtitle">
          {data.config?.prompt ? 
            data.config.prompt.substring(0, 25) + '...' : 
            'Configure prompt'
          }
        </div>
      </div>
      
      <div className="node-badge">{data.config?.temperature || '0.7'}°</div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default LLMNode;
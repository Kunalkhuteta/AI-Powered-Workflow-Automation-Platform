/**
 * EmailNode.jsx - Visual node for email operations
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

const EmailNode = ({ data, selected }) => {
  const config = data.config || {};
  const provider = config.provider || 'smtp';
  const to = config.to || 'Not configured';
  const subject = config.subject || 'No subject';
  
  // Get first recipient for display
  const firstRecipient = Array.isArray(to) ? to[0] : to.split(',')[0];
  
  return (
    <div className={`pro-node email-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon email-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Email</div>
        <div className="node-subtitle">
          {firstRecipient.length > 20 ? firstRecipient.substring(0, 17) + '...' : firstRecipient}
        </div>
      </div>
      
      <div className="node-badge badge-info">
        📧 {provider.toUpperCase()}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default EmailNode;
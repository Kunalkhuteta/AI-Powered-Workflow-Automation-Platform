/**
 * SMSNode.jsx - Visual node for SMS messages
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

const SMSNode = ({ data, selected }) => {
  const config = data.config || {};
  const to = config.to || 'Not configured';
  const message = config.message || 'No message';
  
  // Get first recipient for display
  const firstRecipient = Array.isArray(to) ? to[0] : to.split(',')[0];
  
  return (
    <div className={`pro-node sms-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon sms-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">SMS</div>
        <div className="node-subtitle">
          {firstRecipient.substring(0, 15)}...
        </div>
      </div>
      
      <div className="node-badge" style={{
        background: '#10b98120',
        color: '#059669',
        borderColor: '#10b98140'
      }}>
        📱 TWILIO
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default SMSNode;
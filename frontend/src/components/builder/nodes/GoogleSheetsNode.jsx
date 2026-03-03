/**
 * GoogleSheetsNode.jsx - Visual node for Google Sheets operations
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

const GoogleSheetsNode = ({ data, selected }) => {
  const config = data.config || {};
  const operation = config.operation || 'read';
  const spreadsheetId = config.spreadsheet_id || 'Not configured';
  
  // Operation styles
  const operationStyles = {
    'read': { color: '#22c55e', icon: '📖', label: 'READ' },
    'write': { color: '#3b82f6', icon: '✍️', label: 'WRITE' },
    'append': { color: '#f59e0b', icon: '➕', label: 'APPEND' },
    'update': { color: '#8b5cf6', icon: '🔄', label: 'UPDATE' },
    'clear': { color: '#ef4444', icon: '🗑️', label: 'CLEAR' },
    'create_sheet': { color: '#06b6d4', icon: '📄', label: 'CREATE' }
  };
  
  const style = operationStyles[operation] || operationStyles['read'];
  
  return (
    <div className={`pro-node sheets-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon sheets-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Google Sheets</div>
        <div className="node-subtitle">
          {spreadsheetId.substring(0, 12)}...
        </div>
      </div>
      
      <div 
        className="node-badge" 
        style={{
          background: `${style.color}20`,
          color: style.color,
          borderColor: `${style.color}40`
        }}
      >
        {style.icon} {style.label}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default GoogleSheetsNode;
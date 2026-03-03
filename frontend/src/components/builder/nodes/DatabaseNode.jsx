/**
 * DatabaseNode.jsx - Visual node for database operations
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

const DatabaseNode = ({ data, selected }) => {
  const config = data.config || {};
  const operation = config.operation || 'query';
  const dbType = config.connection?.type?.toUpperCase() || 'SQL';
const dbName = config.connection?.database;
const table = config.table || dbName || 'Database';
  
  // Operation colors and icons
  const operationStyles = {
    'select': { color: '#22c55e', icon: '🔍', label: 'SELECT' },
    'insert': { color: '#3b82f6', icon: '➕', label: 'INSERT' },
    'update': { color: '#f59e0b', icon: '✏️', label: 'UPDATE' },
    'delete': { color: '#ef4444', icon: '🗑️', label: 'DELETE' },
    'query': { color: '#8b5cf6', icon: '⚡', label: 'QUERY' }
  };
  
  const style = operationStyles[operation] || operationStyles['query'];
  
  return (
    <div className={`pro-node database-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon database-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">Database</div>
        <div className="node-subtitle">
          {table.length > 20 ? table.substring(0, 17) + '...' : table}
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

export default DatabaseNode;
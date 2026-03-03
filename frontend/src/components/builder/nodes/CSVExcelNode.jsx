/**
 * CSVExcelNode.jsx - Visual node for CSV/Excel operations
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

const CSVExcelNode = ({ data, selected }) => {
  const config = data.config || {};
  const operation = config.operation || 'read_csv';
  
  // Determine file type
  const isExcel = operation.includes('excel');
  const isRead = operation.includes('read');
  
  // Operation styles
  const getStyle = () => {
    if (isRead) {
      return { color: '#22c55e', icon: '📄', label: isExcel ? 'EXCEL' : 'CSV' };
    } else {
      return { color: '#3b82f6', icon: '📝', label: isExcel ? 'EXCEL' : 'CSV' };
    }
  };
  
  const style = getStyle();
  
  return (
    <div className={`pro-node csv-excel-node ${selected ? 'selected' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="node-handle node-handle-target"
      />
      
      <div className="node-icon csv-excel-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      
      <div className="node-content">
        <div className="node-title">CSV/Excel</div>
        <div className="node-subtitle">
          {isRead ? 'Parse file' : 'Generate file'}
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

export default CSVExcelNode;
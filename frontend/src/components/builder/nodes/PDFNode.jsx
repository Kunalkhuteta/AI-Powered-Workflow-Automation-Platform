import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const PDFNode = ({ data, selected }) => {
  const actions = {
    extract_text: { icon: '📝', label: 'Extract Text' },
    generate: { icon: '✨', label: 'Generate PDF' }
  };

  const action = data.config?.action || 'extract_text';
  const op = actions[action] || actions.extract_text;

  return (
    <div className={`pro-node pdf-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle node-handle-target"
      />

      <div className="node-icon" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 15v-4" />
          <path d="M12 15v-4" />
          <path d="M15 15v-4" />
          <path d="M9 13h6" />
        </svg>
      </div>

      <div className="node-content">
        <div className="node-title">PDF Tool</div>
        <div className="node-subtitle">
          {op.icon} {op.label}
        </div>
      </div>

       <div className="node-details">
         <span className="file-name" style={{fontSize: '0.75rem', color: '#666', border: '1px solid #ddd', padding: '2px 4px', borderRadius: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block'}} title={data.config?.filename || 'No file selected'}>
            {data.config?.filename || 'No file selected'}
         </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default PDFNode;

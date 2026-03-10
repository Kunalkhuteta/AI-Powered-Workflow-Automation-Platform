import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const FileOpsNode = ({ data, selected }) => {
  const actions = {
    read: { icon: '📖', label: 'Read' },
    write: { icon: '✏️', label: 'Write' },
    upload: { icon: '⬆️', label: 'Upload' },
    download: { icon: '⬇️', label: 'Download' },
    delete: { icon: '❌', label: 'Delete' },
  };

  const action = data.config?.action || 'read';
  const op = actions[action] || actions.read;

  return (
    <div className={`pro-node file-ops-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle node-handle-target"
      />

      <div className="node-icon" style={{ backgroundColor: '#eab30820', color: '#eab308' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      </div>

      <div className="node-content">
        <div className="node-title">File Operations</div>
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

export default FileOpsNode;

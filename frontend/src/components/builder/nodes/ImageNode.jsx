import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const ImageNode = ({ data, selected }) => {
  const actions = {
    resize: { icon: '📏', label: 'Resize' },
    crop: { icon: '✂️', label: 'Crop' },
    filter: { icon: '🎨', label: 'Filter' }
  };

  const action = data.config?.action || 'resize';
  const op = actions[action] || actions.resize;

  return (
    <div className={`pro-node image-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle node-handle-target"
      />

      <div className="node-icon" style={{ backgroundColor: '#f43f5e20', color: '#f43f5e' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
           <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
           <circle cx="8.5" cy="8.5" r="1.5" />
           <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>

      <div className="node-content">
        <div className="node-title">Image Tool</div>
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

export default ImageNode;

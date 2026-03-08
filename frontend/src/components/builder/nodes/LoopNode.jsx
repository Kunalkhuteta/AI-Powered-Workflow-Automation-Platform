/**
 * Loop Node - Professional Design with iteration visual
 * Supports forEach, for, and while loops for batch processing
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const LoopNode = ({ data, selected }) => {
  const loopTypes = {
    forEach: '∀',
    for: '⟳',
    while: '↻',
    map: '⇉',
  };

  const loopType = data.config?.loop_type || 'forEach';

  return (
    <div className={`pro-node loop-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle node-handle-target"
      />

      <div className="node-icon loop-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      </div>

      <div className="node-content">
        <div className="node-title">Loop</div>
        <div className="node-subtitle">
          {loopTypes[loopType]} {loopType.charAt(0).toUpperCase() + loopType.slice(1)} Iterator
        </div>
      </div>

      <div className="loop-info-bar">
        <div className="loop-info-item">
          <span className="loop-info-icon">📦</span>
          <span>{data.config?.batch_size || 1} batch</span>
        </div>
        <div className="loop-info-item">
          <span className="loop-info-icon">🔄</span>
          <span>{data.config?.max_iterations || '∞'} max</span>
        </div>
      </div>

      <div className="loop-branches-container">
        <div className="loop-body-label">
          <span className="branch-icon">⟳</span> BODY
        </div>
        <div className="loop-done-label">
          <span className="branch-icon">✓</span> DONE
        </div>
      </div>

      {/* Loop Body Handle - Output to children nodes */}
      <Handle
        type="source"
        position={Position.Right}
        id="loop_body"
        className="node-handle node-handle-source handle-loop-body"
        style={{ top: '50%' }}
      />

      {/* Done Handle - Output to after-loop nodes */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop_done"
        className="node-handle node-handle-source handle-loop-done"
      />
    </div>
  );
};

export default LoopNode;

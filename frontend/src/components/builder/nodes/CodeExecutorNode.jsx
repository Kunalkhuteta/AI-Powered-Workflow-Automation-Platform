/**
 * Code Executor Node - Professional Design
 * Run custom Python or JavaScript code with full flexibility
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const CodeExecutorNode = ({ data, selected }) => {
  const language = data.config?.language || 'python';

  const langDisplay = {
    python: { label: 'Python', icon: '🐍', badge: 'PY' },
    javascript: { label: 'JavaScript', icon: '⚡', badge: 'JS' },
  };

  const lang = langDisplay[language] || langDisplay.python;

  return (
    <div className={`pro-node code-executor-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle node-handle-target"
      />

      <div className="node-icon code-executor-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
          <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2"/>
        </svg>
      </div>

      <div className="node-content">
        <div className="node-title">Code Executor</div>
        <div className="node-subtitle">
          {lang.icon} {lang.label}
          {data.config?.code
            ? ` • ${data.config.code.split('\n').length} lines`
            : ' • No code yet'}
        </div>
      </div>

      <div className="code-preview-bar">
        <div className="code-lang-badge" data-lang={language}>
          {lang.badge}
        </div>
        <div className="code-preview-text">
          {data.config?.code
            ? data.config.code.substring(0, 40).replace(/\n/g, ' ') + '...'
            : 'Write your code...'}
        </div>
      </div>

      <div className="node-badge badge-code">
        {data.config?.timeout || 30}s
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default CodeExecutorNode;

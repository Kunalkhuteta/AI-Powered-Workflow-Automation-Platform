/**
 * AI Vision Node - Professional Design
 * Image analysis, OCR, object detection, and visual AI
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../../../styles/nodes.css';

const AIVisionNode = ({ data, selected }) => {
  const operations = {
    analyze: { icon: '🔍', label: 'Analyze' },
    ocr: { icon: '📝', label: 'OCR' },
    detect: { icon: '🎯', label: 'Detect' },
    classify: { icon: '🏷️', label: 'Classify' },
    describe: { icon: '💬', label: 'Describe' },
    compare: { icon: '⚖️', label: 'Compare' },
  };

  const operation = data.config?.operation || 'analyze';
  const op = operations[operation] || operations.analyze;

  return (
    <div className={`pro-node vision-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle node-handle-target"
      />

      <div className="node-icon vision-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>

      <div className="node-content">
        <div className="node-title">AI Vision</div>
        <div className="node-subtitle">
          {op.icon} {op.label}
          {data.config?.image_source === 'url'
            ? ' • URL'
            : data.config?.image_source === 'base64'
            ? ' • Base64'
            : ' • Input'}
        </div>
      </div>

      <div className="vision-capabilities">
        <div className={`vision-cap ${operation === 'analyze' ? 'active' : ''}`} title="Analyze">🔍</div>
        <div className={`vision-cap ${operation === 'ocr' ? 'active' : ''}`} title="OCR">📝</div>
        <div className={`vision-cap ${operation === 'detect' ? 'active' : ''}`} title="Detect">🎯</div>
        <div className={`vision-cap ${operation === 'classify' ? 'active' : ''}`} title="Classify">🏷️</div>
      </div>

      <div className="node-badge badge-vision">
        {data.config?.model || 'gpt-4o'}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  );
};

export default AIVisionNode;

import React from 'react';

// Templates data with REAL sample data in prompts
const workflowTemplates = [
  {
    id: 'invoice-processor',
    name: 'Invoice Processor',
    icon: '📄',
    description: 'Extract and validate invoice data automatically',
    nodes: [
      {
        id: 'node_1',
        type: 'llm',
        config: { 
          prompt: 'Extract invoice number, date, amount, and vendor from this invoice:\n\nINVOICE #INV-2024-1234\nDate: January 15, 2024\nFrom: Acme Corporation\n123 Business St, New York, NY 10001\nBill To: Your Company Inc.\n\nServices Rendered:\n- Consulting Services: $2,500.00\n- Software License: $1,200.00\nSubtotal: $3,700.00\nTax (8%): $296.00\nTotal Due: $3,996.00\n\nPayment Terms: Net 30', 
          temperature: 0.3, 
          max_tokens: 300 
        },
        data: { label: 'Extract Data', position: { x: 100, y: 100 } },
      },
      {
        id: 'node_2',
        type: 'llm',
        config: { 
          prompt: 'Validate this invoice data. Check if all required fields are present, amounts are valid, and math is correct. List any issues found.', 
          temperature: 0.2, 
          max_tokens: 200 
        },
        data: { label: 'Validate', position: { x: 400, y: 100 } },
      },
      {
        id: 'node_3',
        type: 'logger',
        config: { message: 'Invoice processing complete', level: 'success' },
        data: { label: 'Log Result', position: { x: 700, y: 100 } },
      },
    ],
    edges: [
      { source: 'node_1', target: 'node_2' },
      { source: 'node_2', target: 'node_3' },
    ],
  },
  {
    id: 'email-responder',
    name: 'Email Auto-Responder',
    icon: '✉️',
    description: 'Analyze emails and generate responses',
    nodes: [
      {
        id: 'node_1',
        type: 'llm',
        config: { 
          prompt: 'Analyze the sentiment and intent of this customer email:\n\nSubject: Issue with Recent Order #12345\n\nHi Support Team,\n\nI received my order yesterday but the product appears to be damaged. The box was dented and when I opened it, I found scratches on the device. I\'ve been a loyal customer for 3 years and this is the first time I\'ve had an issue.\n\nCould you please help me resolve this? I need the product for an important presentation next week.\n\nThanks,\nSarah', 
          temperature: 0.5, 
          max_tokens: 200 
        },
        data: { label: 'Analyze Email', position: { x: 100, y: 100 } },
      },
      {
        id: 'node_2',
        type: 'llm',
        config: { 
          prompt: 'Generate a professional, empathetic response to this customer based on the analysis. Acknowledge the issue, apologize, and offer a solution.', 
          temperature: 0.7, 
          max_tokens: 400 
        },
        data: { label: 'Generate Response', position: { x: 400, y: 100 } },
      },
      {
        id: 'node_3',
        type: 'logger',
        config: { message: 'Email response generated', level: 'info' },
        data: { label: 'Log', position: { x: 700, y: 100 } },
      },
    ],
    edges: [
      { source: 'node_1', target: 'node_2' },
      { source: 'node_2', target: 'node_3' },
    ],
  },
];

const TemplatesPanel = ({ onClose, onImport }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Workflow Templates</h2>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div className="templates-grid">
          {workflowTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-icon">{template.icon}</div>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <button
                onClick={() => onImport(template)}
                className="btn btn-primary"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplatesPanel;
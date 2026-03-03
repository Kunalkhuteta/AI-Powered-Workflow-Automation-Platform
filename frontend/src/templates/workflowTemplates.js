export const workflowTemplates = [
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
          prompt: 'Extract invoice number, date, amount, and vendor from the invoice data',
          temperature: 0.3,
          max_tokens: 300,
        },
        data: {
          label: 'Extract Data',
          position: { x: 100, y: 100 },
        },
      },
      {
        id: 'node_2',
        type: 'llm',
        config: {
          prompt: 'Validate the extracted invoice data. Check if all required fields are present and amounts are valid.',
          temperature: 0.2,
          max_tokens: 200,
        },
        data: {
          label: 'Validate',
          position: { x: 400, y: 100 },
        },
      },
      {
        id: 'node_3',
        type: 'logger',
        config: {
          message: 'Invoice processing complete',
          level: 'success',
        },
        data: {
          label: 'Log Result',
          position: { x: 700, y: 100 },
        },
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
    description: 'Analyze emails and generate appropriate responses',
    nodes: [
      {
        id: 'node_1',
        type: 'llm',
        config: {
          prompt: 'Analyze the sentiment and intent of this email',
          temperature: 0.5,
          max_tokens: 200,
        },
        data: {
          label: 'Analyze Email',
          position: { x: 100, y: 100 },
        },
      },
      {
        id: 'node_2',
        type: 'llm',
        config: {
          prompt: 'Generate a professional response to this email based on the analysis',
          temperature: 0.7,
          max_tokens: 400,
        },
        data: {
          label: 'Generate Response',
          position: { x: 400, y: 100 },
        },
      },
      {
        id: 'node_3',
        type: 'logger',
        config: {
          message: 'Email response generated',
          level: 'info',
        },
        data: {
          label: 'Log',
          position: { x: 700, y: 100 },
        },
      },
    ],
    edges: [
      { source: 'node_1', target: 'node_2' },
      { source: 'node_2', target: 'node_3' },
    ],
  },
  {
    id: 'content-generator',
    name: 'Content Generator',
    icon: '✍️',
    description: 'Research topic and generate blog content',
    nodes: [
      {
        id: 'node_1',
        type: 'http',
        config: {
          url: 'https://api.example.com/research',
          method: 'GET',
        },
        data: {
          label: 'Research Topic',
          position: { x: 100, y: 100 },
        },
      },
      {
        id: 'node_2',
        type: 'llm',
        config: {
          prompt: 'Write a comprehensive blog post based on this research',
          temperature: 0.8,
          max_tokens: 1000,
        },
        data: {
          label: 'Write Content',
          position: { x: 400, y: 100 },
        },
      },
      {
        id: 'node_3',
        type: 'llm',
        config: {
          prompt: 'Create 3 social media posts to promote this blog',
          temperature: 0.9,
          max_tokens: 300,
        },
        data: {
          label: 'Social Posts',
          position: { x: 700, y: 100 },
        },
      },
    ],
    edges: [
      { source: 'node_1', target: 'node_2' },
      { source: 'node_2', target: 'node_3' },
    ],
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    icon: '🔄',
    description: 'Fetch, transform, and process data',
    nodes: [
      {
        id: 'node_1',
        type: 'http',
        config: {
          url: 'https://api.example.com/data',
          method: 'GET',
        },
        data: {
          label: 'Fetch Data',
          position: { x: 100, y: 100 },
        },
      },
      {
        id: 'node_2',
        type: 'llm',
        config: {
          prompt: 'Transform this data into a structured format',
          temperature: 0.3,
          max_tokens: 500,
        },
        data: {
          label: 'Transform',
          position: { x: 400, y: 100 },
        },
      },
      {
        id: 'node_3',
        type: 'logger',
        config: {
          message: 'Data pipeline complete',
          level: 'success',
        },
        data: {
          label: 'Complete',
          position: { x: 700, y: 100 },
        },
      },
    ],
    edges: [
      { source: 'node_1', target: 'node_2' },
      { source: 'node_2', target: 'node_3' },
    ],
  },
  {
    id: 'lead-qualifier',
    name: 'Lead Qualifier',
    icon: '🎯',
    description: 'Score and categorize sales leads',
    nodes: [
      {
        id: 'node_1',
        type: 'llm',
        config: {
          prompt: 'Analyze this lead information and extract key signals',
          temperature: 0.4,
          max_tokens: 300,
        },
        data: {
          label: 'Extract Signals',
          position: { x: 100, y: 100 },
        },
      },
      {
        id: 'node_2',
        type: 'llm',
        config: {
          prompt: 'Score this lead from 1-10 and categorize as Hot/Warm/Cold',
          temperature: 0.3,
          max_tokens: 200,
        },
        data: {
          label: 'Score Lead',
          position: { x: 400, y: 100 },
        },
      },
      {
        id: 'node_3',
        type: 'logger',
        config: {
          message: 'Lead scored and qualified',
          level: 'info',
        },
        data: {
          label: 'Log Result',
          position: { x: 700, y: 100 },
        },
      },
    ],
    edges: [
      { source: 'node_1', target: 'node_2' },
      { source: 'node_2', target: 'node_3' },
    ],
  },
];
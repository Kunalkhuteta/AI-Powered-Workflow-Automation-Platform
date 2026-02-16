/**
 * API Service
 * Handles all backend communication
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const apiService = {
  // Auth
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Workflows
  getWorkflows: async () => {
    const response = await api.get('/api/workflows');
    return response.data;
  },

  getWorkflow: async (id) => {
    const response = await api.get(`/api/workflows/${id}`);
    return response.data;
  },

  createWorkflow: async (workflowData) => {
    const response = await api.post('/api/workflows', workflowData);
    return response.data;
  },

  updateWorkflow: async (id, workflowData) => {
    const response = await api.put(`/api/workflows/${id}`, workflowData);
    return response.data;
  },

  // Execution
  executeWorkflow: async (id, initialContext = {}) => {
    const response = await api.post(`/api/workflows/${id}/execute`, {
      initialContext,
    });
    return response.data;
  },

  getExecutionStatus: async (id) => {
    const response = await api.get(`/api/workflows/${id}/execution/status`);
    return response.data;
  },

  getExecutionHistory: async (id, limit = 10) => {
    const response = await api.get(`/api/workflows/${id}/execution/history`, {
      params: { limit },
    });
    return response.data;
  },
};

export default api;
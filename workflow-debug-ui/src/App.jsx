/**
 * Main App Component
 * Simple workflow selector and executor
 */

import { useState, useEffect } from 'react';
import WorkflowExecutor from './components/WorkflowExecutor';
import { apiService } from './services/api';
import './App.css';

function App() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      loadWorkflows();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await apiService.login(email, password);
      setIsLoggedIn(true);
      loadWorkflows();
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await apiService.getWorkflows();
      setWorkflows(response.data);
      if (response.data.length > 0) {
        setSelectedWorkflowId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Workflow Debug UI</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="empty-container">
        <h2>No workflows found</h2>
        <p>Create a workflow in the backend first</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="workflow-selector">
        <label>Select Workflow:</label>
        <select
          value={selectedWorkflowId || ''}
          onChange={(e) => setSelectedWorkflowId(e.target.value)}
        >
          {workflows.map((wf) => (
            <option key={wf._id} value={wf._id}>
              {wf.name}
            </option>
          ))}
        </select>
      </div>

      {selectedWorkflowId && <WorkflowExecutor workflowId={selectedWorkflowId} />}
    </div>
  );
}

export default App;
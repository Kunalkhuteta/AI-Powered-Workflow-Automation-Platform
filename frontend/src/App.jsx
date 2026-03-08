/**
 * App.jsx - FINAL WORKING VERSION
 * Simple theme toggle without ThemeProvider complexity
 */

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import WorkflowExecutor from "./components/WorkflowExecutor";
import WorkflowBuilder from "./components/builder/Workflowbuilder";
import { apiService } from "./services/api";

// Import CSS
import "./styles/theme.css";
import "./styles/nodes.css";
import "./styles/login.css";
import "./styles/App.css";
import "./styles/builder.css";
import "./styles/executor.css";

// Initialize theme immediately
const initTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", initTheme);

// Simple Theme Toggle - No Provider Needed
const ThemeToggle = () => {
  const [theme, setTheme] = useState(initTheme);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
};

// Login Component
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await apiService.login(email, password);
      onLogin();
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your workflow automation platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <svg
                className="input-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg
                className="input-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="button-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <a href="/signup">Create one</a>
          </p>
        </div>
      </div>

      <div className="login-features">
        <div className="feature-pill">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          No credit card required
        </div>
        <div className="feature-pill">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Free forever plan
        </div>
        <div className="feature-pill">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Get started in seconds
        </div>
      </div>
    </div>
  );
};

// Workflow List Component
function WorkflowList() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWorkflows();
      const workflowsList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setWorkflows(workflowsList);
      if (workflowsList.length > 0) {
        setSelectedWorkflowId(workflowsList[0]._id);
      }
    } catch (error) {
      console.error("Failed to load workflows:", error);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading workflows...</div>;
  }

  if (workflows.length === 0) {
    return (
      <div className="empty-container">
        <h2>No workflows found</h2>
        <p>
          Create a workflow using the <Link to="/builder">Visual Builder</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="workflow-selector">
        <label>Select Workflow:</label>
        <select
          value={selectedWorkflowId || ""}
          onChange={(e) => setSelectedWorkflowId(e.target.value)}
        >
          {workflows.map((wf) => (
            <option key={wf._id} value={wf._id}>
              {wf.name}
            </option>
          ))}
        </select>
        <div className="workflow-actions">
          <Link to="/builder" className="builder-link">
            🎨 Create New
          </Link>
          {selectedWorkflowId && (
            <Link
              to={`/builder/${selectedWorkflowId}`}
              className="builder-link"
            >
              ✏️ Edit
            </Link>
          )}
        </div>
      </div>
      {selectedWorkflowId && (
        <WorkflowExecutor workflowId={selectedWorkflowId} />
      )}
    </div>
  );
}

// Main App
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="app-nav">
          <div className="nav-brand">
            <div className="nav-logo">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2>Workflow Platform</h2>
          </div>
          <div className="nav-links">
            <Link to="/executor">▶️ Executor</Link>
            <Link to="/builder">🎨 Builder</Link>
            <ThemeToggle />
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </nav>

        <Routes>
          <Route path="/executor" element={<WorkflowList />} />
          <Route path="/builder" element={<WorkflowBuilder />} />
          <Route path="/builder/:id" element={<WorkflowBuilder />} />
          <Route path="/" element={<Navigate to="/builder" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

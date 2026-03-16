/**
 * App.jsx - ULTRA-PROFESSIONAL VERSION
 * Minimalist, clean, systematic design
 */

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import WorkflowExecutor from "./components/WorkflowExecutor";
import WorkflowBuilder from "./components/builder/Workflowbuilder";
import { apiService } from "./services/api";

// Import CSS
import "./styles/theme.css";
import "./styles/nodes.css";
import "./styles/login.css";
import "./styles/app.css";
import "./styles/builder.css";
import "./styles/executor.css";

// Initialize theme
const initTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", initTheme);

// Professional Theme Toggle
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
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// Professional Auth Component
const AuthScreen = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await apiService.login(email, password);
        setSuccess("Welcome back! Redirecting...");
        setTimeout(() => onLogin(), 800);
      } else {
        await apiService.register(name, email, password);
        setSuccess("Account created successfully!");
        setTimeout(() => onLogin(), 1200);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `${mode === "login" ? "Login" : "Registration"} failed. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      setError("");
      setSuccess("");
      setName("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
          <p>
            {mode === "login"
              ? "Sign in to continue to your workspace"
              : "Get started with your new account"}
          </p>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => toggleMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-toggle-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => toggleMode("register")}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="login-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {mode === "register" && (
            <div className="form-group" style={{ animation: "fadeIn 0.4s ease-out" }}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required={mode === "register"}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="button-spinner"></span>
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Create Account"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="login-features">
        <div className="feature-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Free Forever
        </div>
        <div className="feature-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          No Credit Card
        </div>
        <div className="feature-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Setup in 30s
        </div>
      </div>
    </div>
  );
};

// Professional Navigation
const Navigation = ({ onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/executor") {
      return location.pathname === "/executor";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <div className="nav-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2>Workflow Platform</h2>
      </div>
      <div className="nav-links">
        <Link to="/builder" className={isActive("/builder") ? "active" : ""}>
          Builder
        </Link>
        <Link to="/executor" className={isActive("/executor") ? "active" : ""}>
          Executor
        </Link>
        <div className="nav-divider"></div>
        <ThemeToggle />
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
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
      const workflowsList = Array.isArray(response.data) ? response.data : response.data?.data || [];
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
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading workflows...</p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2>No workflows yet</h2>
        <p>Create your first workflow to get started with automation</p>
        <Link to="/builder" className="btn btn-primary">
          Create Workflow
        </Link>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="workflow-selector">
        <label>Workflow</label>
        <select value={selectedWorkflowId || ""} onChange={(e) => setSelectedWorkflowId(e.target.value)}>
          {workflows.map((wf) => (
            <option key={wf._id} value={wf._id}>
              {wf.name}
            </option>
          ))}
        </select>
        <div className="workflow-actions">
          <Link to="/builder" className="btn btn-secondary">
            New
          </Link>
          {selectedWorkflowId && (
            <Link to={`/builder/${selectedWorkflowId}`} className="btn btn-secondary">
              Edit
            </Link>
          )}
        </div>
      </div>
      {selectedWorkflowId && <WorkflowExecutor workflowId={selectedWorkflowId} />}
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
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navigation onLogout={handleLogout} />
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
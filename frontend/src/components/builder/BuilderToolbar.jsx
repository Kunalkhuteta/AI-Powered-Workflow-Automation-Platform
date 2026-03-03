/**
 * BuilderToolbar - WITHOUT ThemeProvider
 * Simple theme toggle that works standalone
 */

import React, { useState } from 'react';

const BuilderToolbar = ({
  workflowName,
  onNameChange,
  onNew,
  onSave,
  onTemplates,
  onExecute,
  isSaving,
  canExecute,
}) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="pro-toolbar">
      {/* Left Section - Workflow Info */}
      <div className="toolbar-left">
        <div className="toolbar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        
        <div className="workflow-name-container">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            className="workflow-name-input"
            placeholder="Untitled Workflow"
            spellCheck="false"
          />
          <div className="workflow-status">
            {isSaving ? (
              <span className="status-badge saving">
                <span className="status-dot"></span> Saving...
              </span>
            ) : (
              <span className="status-badge saved">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="toolbar-right">
        <div className="toolbar-actions">
          <button 
            onClick={onNew} 
            className="toolbar-btn btn-secondary"
            title="Create new workflow (Ctrl+N)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>New</span>
          </button>

          <button 
            onClick={onTemplates} 
            className="toolbar-btn btn-secondary"
            title="Browse templates"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Templates</span>
          </button>

          <div className="toolbar-divider"></div>

          <button 
            onClick={onSave} 
            className="toolbar-btn btn-primary"
            disabled={isSaving}
            title="Save workflow (Ctrl+S)"
          >
            {isSaving ? (
              <>
                <span className="btn-spinner"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>Save</span>
              </>
            )}
          </button>

          <button 
            onClick={onExecute}
            className="toolbar-btn btn-success"
            disabled={!canExecute}
            title="Run workflow (Ctrl+Enter)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span>Run</span>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Simple Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default BuilderToolbar;
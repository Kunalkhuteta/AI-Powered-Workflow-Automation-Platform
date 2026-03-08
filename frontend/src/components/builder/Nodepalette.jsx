/**
 * Professional Node Palette - Enhanced Design
 * Better organization, search, and visual hierarchy
 */

import React, { useState } from "react";
import "../../styles/node-palette.css";

const NodePalette = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState("all");

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const nodeCategories = [
    {
      id: "ai",
      label: "AI & Logic",
      icon: "🤖",
      nodes: [
        {
          type: "llm",
          label: "AI Model",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h.01M12 10h.01M16 10h.01" />
            </svg>
          ),
          description: "Process text with AI language models",
          color: "#3b82f6",
        },
        {
          type: "conditional",
          label: "Conditional",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          ),
          description: "Branch based on conditions",
          color: "#f59e0b",
        },
        {
          type: "delay",
          label: "Delay",
          icon: "⏱️",
          description: "Pause workflow execution",
          color: "#6366f1",
          category: "Utilities",
        },
        {
          type: "webhook",
          label: "Webhook",
          icon: "🔗",
          description: "Call external APIs and webhooks",
          color: "#06b6d4",
          category: "Integration",
        },
        {
          type: "database",
          label: "Database",
          icon: "🗄️",
          description: "Execute SQL queries and database operations",
          color: "#7c3aed",
          category: "Data",
        },
        {
          type: "loop",
          label: "Loop",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          ),
          description: "Iterate arrays, process lists, batch ops",
          color: "#f97316",
        },
        {
          type: "code_executor",
          label: "Code Executor",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          ),
          description: "Run custom Python or JavaScript code",
          color: "#14b8a6",
        },
        {
          type: "ai_vision",
          label: "AI Vision",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ),
          description: "Image analysis, OCR, and visual AI",
          color: "#ec4899",
        },
      ],
    },
    {
      id: "data",
      label: "Data & Transform",
      icon: "🔄",
      nodes: [
        {
          type: "transform",
          label: "Transform",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          ),
          description: "Manipulate JSON data",
          color: "#a855f7",
        },
        {
          type: "google_sheets",
          label: "Google Sheets",
          icon: "📊",
          description: "Read/write Google Sheets",
          color: "#0f9d58",
        },
        {
          type: "csv_excel",
          label: "CSV/Excel",
          icon: "📄",
          description: "Process CSV and Excel files",
          color: "#1e88e5",
        },
      ],
    },
    {
      id: "integration",
      label: "Integration",
      icon: "🌐",
      nodes: [
        {
          type: "http",
          label: "HTTP Request",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ),
          description: "Call external APIs",
          color: "#10b981",
        },
      ],
    },
    {
      id: "communication",
      label: "Communication",
      icon: "💬",
      nodes: [
        {
          type: "email",
          label: "Email",
          icon: "📧",
          description: "Send emails via SMTP or SendGrid",
          color: "#ea4335",
        },
        {
          type: "slack",
          label: "Slack",
          icon: "💬",
          description: "Post messages to Slack",
          color: "#4A154B",
        },
        {
          type: "sms",
          label: "SMS",
          icon: "📱",
          description: "Send SMS via Twilio",
          color: "#059669",
        },
      ],
    },
    {
      id: "utility",
      label: "Utilities",
      icon: "🛠️",
      nodes: [
        {
          type: "logger",
          label: "Logger",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
          description: "Log data and messages",
          color: "#6b7280",
        },
      ],
    },
  ];

  // Flatten all nodes for search
  const allNodes = nodeCategories.flatMap((cat) =>
    cat.nodes.map((node) => ({ ...node, category: cat.label })),
  );

  // Filter nodes based on search
  const filteredNodes = searchQuery
    ? allNodes.filter(
        (node) =>
          node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allNodes;

  return (
    <div className="pro-node-palette">
      {/* Header */}
      <div className="palette-header">
        <h3>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Nodes
        </h3>
      </div>

      {/* Search */}
      <div className="palette-search">
        <svg
          className="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery("")}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Nodes List */}
      <div className="palette-content">
        {searchQuery ? (
          // Search Results
          <div className="palette-category">
            <div className="category-header">
              <span className="category-title">
                Search Results ({filteredNodes.length})
              </span>
            </div>
            <div className="category-nodes">
              {filteredNodes.length === 0 ? (
                <div className="no-results">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <p>No nodes found</p>
                  <small>Try a different search term</small>
                </div>
              ) : (
                filteredNodes.map((node) => (
                  <div
                    key={node.type}
                    className="palette-node"
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    style={{ "--node-color": node.color }}
                  >
                    <div
                      className="node-icon-wrapper"
                      style={{ backgroundColor: node.color + "20" }}
                    >
                      {node.icon}
                    </div>
                    <div className="node-info">
                      <div className="node-label">{node.label}</div>
                      <div className="node-description">{node.description}</div>
                      <div className="node-category-tag">{node.category}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Categories
          nodeCategories.map((category) => (
            <div key={category.id} className="palette-category">
              <div
                className="category-header"
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id,
                  )
                }
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-title">{category.label}</span>
                <span className="category-count">{category.nodes.length}</span>
              </div>

              <div className="category-nodes">
                {category.nodes.map((node) => (
                  <div
                    key={node.type}
                    className="palette-node"
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    style={{ "--node-color": node.color }}
                  >
                    <div
                      className="node-icon-wrapper"
                      style={{ backgroundColor: node.color + "20" }}
                    >
                      {node.icon}
                    </div>
                    <div className="node-info">
                      <div className="node-label">{node.label}</div>
                      <div className="node-description">{node.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Tips */}
      <div className="palette-tips">
        <div className="tip">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Drag nodes to canvas</span>
        </div>
      </div>
    </div>
  );
};

export default NodePalette;

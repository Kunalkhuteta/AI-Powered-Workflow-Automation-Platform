/**
 * NodeConfigPanel.jsx - Node Configuration Form
 *
 * Allows users to edit node settings (prompt, temperature, etc.)
 */

import React, { useState, useEffect } from "react";
import "../../styles/config-panel.css";

const NodeConfigPanel = ({ node, onClose, onUpdate, onDelete }) => {
const [config, setConfig] = useState(() => ({
  connection: {},           
  ...node.data.config,
}));  const [errors, setErrors] = useState({});


useEffect(() => {
  setConfig({
    connection: {},         
    ...node.data.config,
  });
}, [node]);
  /**
   * Handle form field change
   */
  const handleChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate configuration
   */
  const validate = () => {
    const newErrors = {};

    if (node.type === "llm") {
      if (!config.prompt || config.prompt.trim() === "") {
        newErrors.prompt = "Prompt is required";
      }
      if (config.temperature < 0 || config.temperature > 2) {
        newErrors.temperature = "Temperature must be between 0 and 2";
      }
      if (config.max_tokens < 1) {
        newErrors.max_tokens = "Max tokens must be positive";
      }
    }

    if (node.type === "http") {
      if (!config.url || config.url.trim() === "") {
        newErrors.url = "URL is required";
      }
    }

    if (node.type === "logger") {
      if (!config.message || config.message.trim() === "") {
        newErrors.message = "Message is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle save
   */
  const handleSave = () => {
    if (validate()) {
      onUpdate(node.id, config);
      onClose();
    }
  };

  /**
   * Handle delete with confirmation
   */
  const handleDelete = () => {
    if (window.confirm("Delete this node?")) {
      onDelete(node.id);
    }
  };

  /**
   * Render form fields based on node type
   */
  const renderFields = () => {
    switch (node.type) {
      case "llm":
        return (
          <>
            <div className="form-group">
              <label htmlFor="prompt">Prompt *</label>
              <textarea
                id="prompt"
                value={config.prompt || ""}
                onChange={(e) => handleChange("prompt", e.target.value)}
                placeholder="Enter your prompt..."
                rows={6}
                className={errors.prompt ? "error" : ""}
              />
              {errors.prompt && (
                <span className="error-text">{errors.prompt}</span>
              )}
              <small>What should the AI do?</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="temperature">Temperature</label>
                <input
                  type="number"
                  id="temperature"
                  value={config.temperature || 0.7}
                  onChange={(e) =>
                    handleChange("temperature", parseFloat(e.target.value))
                  }
                  min="0"
                  max="2"
                  step="0.1"
                  className={errors.temperature ? "error" : ""}
                />
                {errors.temperature && (
                  <span className="error-text">{errors.temperature}</span>
                )}
                <small>0 = focused, 2 = creative</small>
              </div>

              <div className="form-group">
                <label htmlFor="max_tokens">Max Tokens</label>
                <input
                  type="number"
                  id="max_tokens"
                  value={config.max_tokens || 500}
                  onChange={(e) =>
                    handleChange("max_tokens", parseInt(e.target.value))
                  }
                  min="1"
                  max="2000"
                  className={errors.max_tokens ? "error" : ""}
                />
                {errors.max_tokens && (
                  <span className="error-text">{errors.max_tokens}</span>
                )}
                <small>Maximum response length</small>
              </div>
            </div>
          </>
        );

      case "http":
        return (
          <>
            <div className="form-group">
              <label htmlFor="url">URL *</label>
              <input
                type="text"
                id="url"
                value={config.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://api.example.com/data"
                className={errors.url ? "error" : ""}
              />
              {errors.url && <span className="error-text">{errors.url}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="method">Method</label>
              <select
                id="method"
                value={config.method || "GET"}
                onChange={(e) => handleChange("method", e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="headers">Headers (JSON)</label>
              <textarea
                id="headers"
                value={JSON.stringify(config.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleChange("headers", headers);
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={3}
                placeholder='{"Authorization": "Bearer token"}'
              />
              <small>Optional HTTP headers</small>
            </div>
          </>
        );

      case "logger":
        return (
          <>
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                value={config.message || ""}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="Enter log message..."
                rows={4}
                className={errors.message ? "error" : ""}
              />
              {errors.message && (
                <span className="error-text">{errors.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="level">Log Level</label>
              <select
                id="level"
                value={config.level || "info"}
                onChange={(e) => handleChange("level", e.target.value)}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </>
        );

      case "conditional":
        return (
          <>
            <div className="form-group">
              <label>Left Value</label>
              <input
                type="text"
                value={config.left_value || ""}
                onChange={(e) => handleChange("left_value", e.target.value)}
                placeholder="{{node_1.output}}"
              />
              <small>Use {`{{node_id.field}}`} for dynamic values</small>{" "}
            </div>

            <div className="form-group">
              <label>Operator</label>
              <select
                value={config.operator || "=="}
                onChange={(e) => handleChange("operator", e.target.value)}
              >
                <option value="==">Equals (==)</option>
                <option value="!=">Not Equals (!=)</option>
                <option value=">">Greater Than (&gt;)</option>
                <option value="<">Less Than (&lt;)</option>
                <option value=">=">Greater or Equal (&gt;=)</option>
                <option value="<=">Less or Equal (&lt;=)</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </select>
            </div>

            <div className="form-group">
              <label>Right Value</label>
              <input
                type="text"
                value={config.right_value || ""}
                onChange={(e) => handleChange("right_value", e.target.value)}
                placeholder="success"
              />
            </div>

            <div className="form-group">
              <label>True Output (JSON)</label>
              <textarea
                value={JSON.stringify(
                  config.true_output || { result: true },
                  null,
                  2,
                )}
                onChange={(e) => {
                  try {
                    handleChange("true_output", JSON.parse(e.target.value));
                  } catch {}
                }}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>False Output (JSON)</label>
              <textarea
                value={JSON.stringify(
                  config.false_output || { result: false },
                  null,
                  2,
                )}
                onChange={(e) => {
                  try {
                    handleChange("false_output", JSON.parse(e.target.value));
                  } catch {}
                }}
                rows={3}
              />
            </div>
          </>
        );

      case "transform":
        return (
          <>
            <div className="form-group">
              <label>Operation</label>
              <select
                value={config.operation || "extract"}
                onChange={(e) => handleChange("operation", e.target.value)}
              >
                <option value="extract">Extract Fields</option>
                <option value="map">Map/Transform</option>
                <option value="filter">Filter Array</option>
                <option value="merge">Merge Objects</option>
                <option value="flatten">Flatten</option>
                <option value="parse">Parse JSON</option>
                <option value="stringify">Stringify</option>
              </select>
            </div>

            {config.operation === "extract" && (
              <div className="form-group">
                <label>Fields to Extract (comma-separated)</label>
                <input
                  type="text"
                  value={config.fields?.join(", ") || ""}
                  onChange={(e) =>
                    handleChange(
                      "fields",
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  placeholder="name, email, status"
                />
              </div>
            )}

            {config.operation === "map" && (
              <div className="form-group">
                <label>Field Mapping (JSON)</label>
                <textarea
                  value={JSON.stringify(config.mapping || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      handleChange("mapping", JSON.parse(e.target.value));
                    } catch {}
                  }}
                  rows={4}
                  placeholder='{"newField": "oldField"}'
                />
              </div>
            )}

            <div className="form-group">
              <label>Source Node (optional)</label>
              <input
                type="text"
                value={config.source_node || ""}
                onChange={(e) => handleChange("source_node", e.target.value)}
                placeholder="node_1"
              />
              <small>Leave empty to use all inputs</small>
            </div>
          </>
        );

      case "delay":
        return (
          <>
            <div className="form-group">
              <label>Duration</label>
              <input
                type="number"
                value={config.duration || 1}
                onChange={(e) =>
                  handleChange("duration", parseFloat(e.target.value))
                }
                placeholder="1"
                min="0.001"
                step="0.001"
              />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select
                value={config.unit || "seconds"}
                onChange={(e) => handleChange("unit", e.target.value)}
              >
                <option value="milliseconds">Milliseconds</option>
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reason (optional)</label>
              <input
                type="text"
                value={config.reason || ""}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Rate limiting, waiting for process, etc."
              />
              <small>Description of why you're adding a delay</small>
            </div>

            <div className="config-note">
              <strong>⚠️ Max delay:</strong> 1 hour (3600 seconds)
            </div>
          </>
        );

      case "webhook":
        return (
          <>
            <div className="form-group">
              <label>Webhook URL *</label>
              <input
                type="url"
                value={config.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://hooks.zapier.com/..."
                required
              />
              <small>External webhook or API endpoint</small>
            </div>

            <div className="form-group">
              <label>HTTP Method</label>
              <select
                value={config.method || "POST"}
                onChange={(e) => handleChange("method", e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="form-group">
              <label>Request Body (JSON)</label>
              <textarea
                value={
                  typeof config.body === "string"
                    ? config.body
                    : JSON.stringify(config.body || {}, null, 2)
                }
                onChange={(e) => {
                  try {
                    handleChange("body", JSON.parse(e.target.value));
                  } catch {
                    handleChange("body", e.target.value);
                  }
                }}
                rows={6}
                placeholder={`{
  "message": "{{node_1.output}}",
  "status": "success"
}`}
              />
              <small>Use {`{{node_id.field}}`} for dynamic values</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.include_inputs || false}
                  onChange={(e) =>
                    handleChange("include_inputs", e.target.checked)
                  }
                />
                Include all node inputs in request
              </label>
            </div>

            <div className="form-group">
              <label>Headers (JSON, optional)</label>
              <textarea
                value={
                  typeof config.headers === "string"
                    ? config.headers
                    : JSON.stringify(config.headers || {}, null, 2)
                }
                onChange={(e) => {
                  try {
                    handleChange("headers", JSON.parse(e.target.value));
                  } catch {
                    handleChange("headers", {});
                  }
                }}
                rows={3}
                placeholder={`{
  "Authorization": "Bearer token",
  "X-Custom-Header": "value"
}`}
              />
            </div>

            <div className="form-group">
              <label>Timeout (seconds)</label>
              <input
                type="number"
                value={config.timeout || 30}
                onChange={(e) =>
                  handleChange("timeout", parseInt(e.target.value))
                }
                min="1"
                max="300"
              />
            </div>
          </>
        );

      case "database":
        return (
          <>
            {/* Connection Settings */}
            <div className="form-section">
              <h4>Database Connection</h4>

              <div className="form-group">
                <label>Database Type *</label>
                <select
                  value={config.connection?.type || "postgresql"}
                  onChange={(e) =>
                    handleChange("connection", {
                      ...(config.connection || {}),
                      type: e.target.value,
                    })
                  }
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                </select>
              </div>

              <div className="form-group">
                <label>Host *</label>
                <input
                  type="text"
                  value={config.connection?.host || ""}
                  onChange={(e) =>
                    handleChange("connection", {
                      ...(config.connection || {}),
                      host: e.target.value,
                    })
                  }
                  placeholder="localhost or IP address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Port</label>
                <input
                  type="number"
                  value={
                    config.connection?.port ||
                    (config.connection?.type === "mysql" ? 3306 : 5432)
                  }
                  onChange={(e) =>
                    handleChange("connection", {
                      ...(config.connection || {}),
                      port: parseInt(e.target.value),
                    })
                  }
                  placeholder={
                    config.connection?.type === "mysql" ? "3306" : "5432"
                  }
                />
              </div>

              <div className="form-group">
                <label>Database Name *</label>
                <input
                  type="text"
                  value={config.connection?.database || ""}
                  onChange={(e) =>
                    handleChange("connection", {
                      ...(config.connection || {}),
                      database: e.target.value,
                    })
                  }
                  placeholder="my_database"
                  required
                />
              </div>

              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={config.connection?.user || ""}
                  onChange={(e) =>
                    handleChange("connection", {
                      ...(config.connection || {}),
                      user: e.target.value,
                    })
                  }
                  placeholder="database_user"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={config.connection?.password || ""}
                  onChange={(e) =>
                    handleChange("connection", {
                      ...(config.connection || {}),
                      password: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  required
                />
                <small>
                  ⚠️ Stored securely - consider using environment variables
                </small>
              </div>
            </div>

            {/* Operation Settings */}
            <div className="form-section">
              <h4>Operation</h4>

              <div className="form-group">
                <label>Operation Type *</label>
                <select
                  value={config.operation || "select"}
                  onChange={(e) => handleChange("operation", e.target.value)}
                >
                  <option value="select">SELECT - Read data</option>
                  <option value="insert">INSERT - Add records</option>
                  <option value="update">UPDATE - Modify records</option>
                  <option value="delete">DELETE - Remove records</option>
                  <option value="query">QUERY - Custom SQL</option>
                </select>
              </div>

              {/* SELECT Operation */}
              {config.operation === "select" && (
                <>
                  <div className="form-group">
                    <label>Table Name *</label>
                    <input
                      type="text"
                      value={config.table || ""}
                      onChange={(e) => handleChange("table", e.target.value)}
                      placeholder="users"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Columns (comma-separated)</label>
                    <input
                      type="text"
                      value={config.columns?.join(", ") || "*"}
                      onChange={(e) =>
                        handleChange(
                          "columns",
                          e.target.value.split(",").map((s) => s.trim()),
                        )
                      }
                      placeholder="id, name, email or * for all"
                    />
                  </div>

                  <div className="form-group">
                    <label>WHERE Conditions (JSON)</label>
                    <textarea
                      value={JSON.stringify(config.where || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          handleChange("where", JSON.parse(e.target.value));
                        } catch {}
                      }}
                      rows={3}
                      placeholder={`{
  "status": "active",
  "role": "admin"
}`}
                    />
                    <small>Leave empty for no filter</small>
                  </div>

                  <div className="form-group">
                    <label>Limit</label>
                    <input
                      type="number"
                      value={config.limit || ""}
                      onChange={(e) =>
                        handleChange("limit", parseInt(e.target.value))
                      }
                      placeholder="100"
                    />
                  </div>

                  <div className="form-group">
                    <label>Order By</label>
                    <input
                      type="text"
                      value={config.order_by || ""}
                      onChange={(e) => handleChange("order_by", e.target.value)}
                      placeholder="created_at DESC"
                    />
                  </div>
                </>
              )}

              {/* INSERT Operation */}
              {config.operation === "insert" && (
                <>
                  <div className="form-group">
                    <label>Table Name *</label>
                    <input
                      type="text"
                      value={config.table || ""}
                      onChange={(e) => handleChange("table", e.target.value)}
                      placeholder="users"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Data to Insert (JSON) *</label>
                    <textarea
                      value={JSON.stringify(config.data || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          handleChange("data", JSON.parse(e.target.value));
                        } catch {}
                      }}
                      rows={6}
                      placeholder={`{
  "name": "{{node_1.name}}",
  "email": "{{node_1.email}}",
  "status": "active"
}

Or array for multiple:
[
  {"name": "User1", "email": "user1@example.com"},
  {"name": "User2", "email": "user2@example.com"}
]`}
                      required
                    />
                    <small>Use {`{{node_id.field}}`} for dynamic values</small>
                  </div>
                </>
              )}

              {/* UPDATE Operation */}
              {config.operation === "update" && (
                <>
                  <div className="form-group">
                    <label>Table Name *</label>
                    <input
                      type="text"
                      value={config.table || ""}
                      onChange={(e) => handleChange("table", e.target.value)}
                      placeholder="users"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Data to Update (JSON) *</label>
                    <textarea
                      value={JSON.stringify(config.data || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          handleChange("data", JSON.parse(e.target.value));
                        } catch {}
                      }}
                      rows={4}
                      placeholder={`{
  "status": "inactive",
  "updated_at": "NOW()"
}`}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>WHERE Conditions (JSON) *</label>
                    <textarea
                      value={JSON.stringify(config.where || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          handleChange("where", JSON.parse(e.target.value));
                        } catch {}
                      }}
                      rows={3}
                      placeholder={`{
  "id": "{{node_1.user_id}}"
}`}
                      required
                    />
                    <small>
                      ⚠️ Required for safety - prevents updating all rows
                    </small>
                  </div>
                </>
              )}

              {/* DELETE Operation */}
              {config.operation === "delete" && (
                <>
                  <div className="form-group">
                    <label>Table Name *</label>
                    <input
                      type="text"
                      value={config.table || ""}
                      onChange={(e) => handleChange("table", e.target.value)}
                      placeholder="users"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>WHERE Conditions (JSON) *</label>
                    <textarea
                      value={JSON.stringify(config.where || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          handleChange("where", JSON.parse(e.target.value));
                        } catch {}
                      }}
                      rows={3}
                      placeholder={`{
  "id": "{{node_1.user_id}}"
}`}
                      required
                    />
                    <small>
                      ⚠️ Required for safety - prevents deleting all rows
                    </small>
                  </div>
                </>
              )}

              {/* CUSTOM QUERY Operation */}
              {config.operation === "query" && (
                <div className="form-group">
                  <label>SQL Query *</label>
                  <textarea
                    value={config.query || ""}
                    onChange={(e) => handleChange("query", e.target.value)}
                    rows={8}
                    placeholder={`SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.name
ORDER BY order_count DESC
LIMIT 10`}
                    required
                  />
                  <small>
                    ⚠️ Use parameterized queries for safety. Supports{" "}
                    {`{{placeholders}}`}
                  </small>
                </div>
              )}
            </div>

            <div className="config-note">
              <strong>💡 Tips:</strong>
              <ul>
                <li>Test connection with a simple SELECT first</li>
                <li>Always use WHERE clauses for UPDATE/DELETE</li>
                {/* <li>Use {{`{{node_id.field}}`}} for dynamic values</li> */}
                <li>Limit results to avoid memory issues</li>
              </ul>
            </div>
          </>
        );

      default:
        return <p>Unknown node type</p>;
    }
  };

  return (
    <div className="node-config-panel">
      <div className="panel-header">
        <h3>⚙️ Configure {node.type.toUpperCase()} Node</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">
        <div className="node-info">
          <strong>Node ID:</strong> {node.id}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {renderFields()}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              🗑️ Delete
            </button>
            <div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                💾 Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeConfigPanel;

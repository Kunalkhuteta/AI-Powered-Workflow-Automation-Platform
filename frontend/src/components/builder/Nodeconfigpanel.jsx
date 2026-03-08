/**
 * NodeConfigPanel.jsx - FULLY EDITABLE Node Configuration Form
 * Every field is now properly editable with better JSON handling
 */

import React, { useState, useEffect } from "react";
import "../../styles/config-panel.css";

const NodeConfigPanel = ({ node, onClose, onUpdate, onDelete }) => {
  const [config, setConfig] = useState({});
  const [errors, setErrors] = useState({});
  const [jsonErrors, setJsonErrors] = useState({});

  // Initialize config when node changes
  useEffect(() => {
    const initialConfig = {
      connection: {},
      smtp_config: {},
      ...node.data.config,
    };
    setConfig(initialConfig);
    setJsonErrors({});
  }, [node]);

  /**
   * Handle form field change - Works for ALL field types
   */
  const handleChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear errors
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (jsonErrors[field]) {
      setJsonErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle JSON field changes with validation
   */
  const handleJsonChange = (field, textValue) => {
    try {
      const parsed = JSON.parse(textValue);
      handleChange(field, parsed);
      setJsonErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } catch (err) {
      // Store the text value temporarily
      handleChange(field + '_text', textValue);
      setJsonErrors((prev) => ({
        ...prev,
        [field]: `Invalid JSON: ${err.message}`,
      }));
    }
  };

  /**
   * Get display value for JSON fields
   */
  const getJsonDisplayValue = (field) => {
    // Check if there's a temporary text value
    if (config[field + '_text']) {
      return config[field + '_text'];
    }
    // Otherwise stringify the actual value
    const value = config[field];
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  };

  /**
   * Validate configuration
   */
  const validate = () => {
    const newErrors = {};

    // Check for JSON errors
    if (Object.keys(jsonErrors).length > 0) {
      return false;
    }

    if (node.type === "llm") {
      if (!config.prompt || config.prompt.trim() === "") {
        newErrors.prompt = "Prompt is required";
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
    // Clean up temporary text fields before saving
    const cleanConfig = { ...config };
    Object.keys(cleanConfig).forEach(key => {
      if (key.endsWith('_text')) {
        delete cleanConfig[key];
      }
    });

    if (validate()) {
      onUpdate(node.id, cleanConfig);
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
                  value={config.temperature ?? 0.7}
                  onChange={(e) =>
                    handleChange("temperature", parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="2"
                  step="0.1"
                />
                <small>0 = focused, 2 = creative</small>
              </div>

              <div className="form-group">
                <label htmlFor="max_tokens">Max Tokens</label>
                <input
                  type="number"
                  id="max_tokens"
                  value={config.max_tokens ?? 500}
                  onChange={(e) =>
                    handleChange("max_tokens", parseInt(e.target.value) || 500)
                  }
                  min="1"
                  max="2000"
                />
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
                value={getJsonDisplayValue('headers')}
                onChange={(e) => handleJsonChange('headers', e.target.value)}
                rows={3}
                placeholder='{"Authorization": "Bearer token"}'
                className={jsonErrors.headers ? "error" : ""}
              />
              {jsonErrors.headers && (
                <span className="error-text">{jsonErrors.headers}</span>
              )}
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
              <small>Use {`{{node_id.field}}`} for dynamic values</small>
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
                value={getJsonDisplayValue('true_output') || JSON.stringify({ result: true }, null, 2)}
                onChange={(e) => handleJsonChange('true_output', e.target.value)}
                rows={3}
                className={jsonErrors.true_output ? "error" : ""}
              />
              {jsonErrors.true_output && (
                <span className="error-text">{jsonErrors.true_output}</span>
              )}
            </div>

            <div className="form-group">
              <label>False Output (JSON)</label>
              <textarea
                value={getJsonDisplayValue('false_output') || JSON.stringify({ result: false }, null, 2)}
                onChange={(e) => handleJsonChange('false_output', e.target.value)}
                rows={3}
                className={jsonErrors.false_output ? "error" : ""}
              />
              {jsonErrors.false_output && (
                <span className="error-text">{jsonErrors.false_output}</span>
              )}
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
                  value={Array.isArray(config.fields) ? config.fields.join(", ") : config.fields || ""}
                  onChange={(e) =>
                    handleChange(
                      "fields",
                      e.target.value.split(",").map((s) => s.trim()).filter(s => s)
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
                  value={getJsonDisplayValue('mapping') || '{}'}
                  onChange={(e) => handleJsonChange('mapping', e.target.value)}
                  rows={4}
                  placeholder='{"newField": "oldField"}'
                  className={jsonErrors.mapping ? "error" : ""}
                />
                {jsonErrors.mapping && (
                  <span className="error-text">{jsonErrors.mapping}</span>
                )}
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
                value={config.duration ?? 1}
                onChange={(e) =>
                  handleChange("duration", parseFloat(e.target.value) || 1)
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
          </>
        );

      case "webhook":
        return (
          <>
            <div className="form-group">
              <label>Webhook URL *</label>
              <input
                type="text"
                value={config.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://hooks.zapier.com/..."
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
                value={getJsonDisplayValue('body') || '{}'}
                onChange={(e) => handleJsonChange('body', e.target.value)}
                rows={6}
                placeholder={`{
  "message": "{{node_1.output}}",
  "status": "success"
}`}
                className={jsonErrors.body ? "error" : ""}
              />
              {jsonErrors.body && (
                <span className="error-text">{jsonErrors.body}</span>
              )}
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
                value={getJsonDisplayValue('headers') || '{}'}
                onChange={(e) => handleJsonChange('headers', e.target.value)}
                rows={3}
                placeholder={`{
  "Authorization": "Bearer token"
}`}
                className={jsonErrors.headers ? "error" : ""}
              />
              {jsonErrors.headers && (
                <span className="error-text">{jsonErrors.headers}</span>
              )}
            </div>

            <div className="form-group">
              <label>Timeout (seconds)</label>
              <input
                type="number"
                value={config.timeout ?? 30}
                onChange={(e) =>
                  handleChange("timeout", parseInt(e.target.value) || 30)
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
                  placeholder="localhost"
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
                      port: parseInt(e.target.value) || 5432,
                    })
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
                  placeholder="postgres"
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
                />
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Columns (comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(config.columns) ? config.columns.join(", ") : config.columns || "*"}
                      onChange={(e) =>
                        handleChange(
                          "columns",
                          e.target.value.split(",").map((s) => s.trim()).filter(s => s)
                        )
                      }
                      placeholder="id, name, email or * for all"
                    />
                  </div>

                  <div className="form-group">
                    <label>WHERE Conditions (JSON)</label>
                    <textarea
                      value={getJsonDisplayValue('where') || '{}'}
                      onChange={(e) => handleJsonChange('where', e.target.value)}
                      rows={3}
                      placeholder={`{
  "status": "active"
}`}
                      className={jsonErrors.where ? "error" : ""}
                    />
                    {jsonErrors.where && (
                      <span className="error-text">{jsonErrors.where}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Limit</label>
                    <input
                      type="number"
                      value={config.limit || ""}
                      onChange={(e) =>
                        handleChange("limit", parseInt(e.target.value) || "")
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Data to Insert (JSON or placeholder) *</label>
                    <textarea
                      value={getJsonDisplayValue('data') || '{}'}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        // If it's a placeholder, store as string
                        if (val.startsWith('{{') && val.endsWith('}}')) {
                          handleChange('data', val);
                        } else {
                          handleJsonChange('data', e.target.value);
                        }
                      }}
                      rows={6}
                      placeholder={`{{node_1}}

Or JSON:
{
  "name": "{{node_1.name}}",
  "email": "{{node_1.email}}"
}`}
                      className={jsonErrors.data ? "error" : ""}
                    />
                    {jsonErrors.data && (
                      <span className="error-text">{jsonErrors.data}</span>
                    )}
                    <small>Use {`{{node_id}}`} or JSON with placeholders</small>
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Data to Update (JSON) *</label>
                    <textarea
                      value={getJsonDisplayValue('data') || '{}'}
                      onChange={(e) => handleJsonChange('data', e.target.value)}
                      rows={4}
                      placeholder={`{
  "status": "inactive"
}`}
                      className={jsonErrors.data ? "error" : ""}
                    />
                    {jsonErrors.data && (
                      <span className="error-text">{jsonErrors.data}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>WHERE Conditions (JSON) *</label>
                    <textarea
                      value={getJsonDisplayValue('where') || '{}'}
                      onChange={(e) => handleJsonChange('where', e.target.value)}
                      rows={3}
                      placeholder={`{
  "id": 1
}`}
                      className={jsonErrors.where ? "error" : ""}
                    />
                    {jsonErrors.where && (
                      <span className="error-text">{jsonErrors.where}</span>
                    )}
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
                    />
                  </div>

                  <div className="form-group">
                    <label>WHERE Conditions (JSON) *</label>
                    <textarea
                      value={getJsonDisplayValue('where') || '{}'}
                      onChange={(e) => handleJsonChange('where', e.target.value)}
                      rows={3}
                      placeholder={`{
  "id": 1
}`}
                      className={jsonErrors.where ? "error" : ""}
                    />
                    {jsonErrors.where && (
                      <span className="error-text">{jsonErrors.where}</span>
                    )}
                  </div>
                </>
              )}

              {/* QUERY Operation */}
              {config.operation === "query" && (
                <div className="form-group">
                  <label>SQL Query *</label>
                  <textarea
                    value={config.query || ""}
                    onChange={(e) => handleChange("query", e.target.value)}
                    rows={8}
                    placeholder={`SELECT * FROM users WHERE status = 'active'`}
                  />
                </div>
              )}
            </div>
          </>
        );

      case "google_sheets":
        return (
          <>
            <div className="form-group">
              <label>Credentials (File path or JSON)</label>
              <textarea
                value={getJsonDisplayValue('credentials') || ''}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  // If it's a file path
                  if (val.endsWith('.json') && !val.startsWith('{')) {
                    handleChange('credentials', val);
                  } else {
                    handleJsonChange('credentials', e.target.value);
                  }
                }}
                rows={8}
                placeholder={`C:\\temp\\google-credentials.json

Or paste JSON`}
                className={jsonErrors.credentials ? "error" : ""}
              />
              {jsonErrors.credentials && (
                <span className="error-text">{jsonErrors.credentials}</span>
              )}
            </div>

            <div className="form-group">
              <label>Spreadsheet ID *</label>
              <input
                type="text"
                value={config.spreadsheet_id || ""}
                onChange={(e) => handleChange("spreadsheet_id", e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
            </div>

            <div className="form-group">
              <label>Operation</label>
              <select
                value={config.operation || "read"}
                onChange={(e) => handleChange("operation", e.target.value)}
              >
                <option value="read">Read Data</option>
                <option value="write">Write Data</option>
                <option value="append">Append Rows</option>
                <option value="update">Update Cells</option>
                <option value="clear">Clear Range</option>
              </select>
            </div>

            <div className="form-group">
              <label>Range (A1 notation)</label>
              <input
                type="text"
                value={config.range || ""}
                onChange={(e) => handleChange("range", e.target.value)}
                placeholder="Sheet1!A1:D10"
              />
            </div>

            {(config.operation === 'write' || config.operation === 'append' || config.operation === 'update') && (
              <div className="form-group">
                <label>Values (JSON array)</label>
                <textarea
                  value={getJsonDisplayValue('values') || '[]'}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (val.startsWith('{{') && val.endsWith('}}')) {
                      handleChange('values', val);
                    } else {
                      handleJsonChange('values', e.target.value);
                    }
                  }}
                  rows={4}
                  placeholder={`[["Value1", "Value2"]]

Or use placeholder:
{{node_1.rows}}`}
                  className={jsonErrors.values ? "error" : ""}
                />
                {jsonErrors.values && (
                  <span className="error-text">{jsonErrors.values}</span>
                )}
              </div>
            )}
          </>
        );

      case "csv_excel":
        return (
          <>
            <div className="form-group">
              <label>Operation</label>
              <select
                value={config.operation || "read_csv"}
                onChange={(e) => handleChange("operation", e.target.value)}
              >
                <option value="read_csv">Read CSV</option>
                <option value="write_csv">Write CSV</option>
                <option value="read_excel">Read Excel</option>
                <option value="write_excel">Write Excel</option>
              </select>
            </div>

            {(config.operation === "read_csv" ||
              config.operation === "read_excel") && (
              <div className="form-group">
                <label>File Path</label>
                <input
                  type="text"
                  value={config.file_path || ""}
                  onChange={(e) => handleChange("file_path", e.target.value)}
                  placeholder="C:\\temp\\file.csv"
                />
              </div>
            )}

            {(config.operation === "write_csv" ||
              config.operation === "write_excel") && (
              <>
                <div className="form-group">
                  <label>Data (JSON array or placeholder)</label>
                  <textarea
                    value={getJsonDisplayValue('data') || '[]'}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val.startsWith('{{') && val.endsWith('}}')) {
                        handleChange('data', val);
                      } else {
                        handleJsonChange('data', e.target.value);
                      }
                    }}
                    rows={8}
                    placeholder={`[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "age": 25}
]

Or: {{node_1.rows}}`}
                    className={jsonErrors.data ? "error" : ""}
                  />
                  {jsonErrors.data && (
                    <span className="error-text">{jsonErrors.data}</span>
                  )}
                </div>

                {config.operation === "write_excel" && (
                  <div className="form-group">
                    <label>Sheet Name</label>
                    <input
                      type="text"
                      value={config.sheet_name || ""}
                      onChange={(e) =>
                        handleChange("sheet_name", e.target.value)
                      }
                      placeholder="Sheet1"
                    />
                  </div>
                )}
              </>
            )}
          </>
        );

      case "email":
        return (
          <>
            <div className="form-group">
              <label>Email Provider</label>
              <select
                value={config.provider || "smtp"}
                onChange={(e) => handleChange("provider", e.target.value)}
              >
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
              </select>
            </div>

            {config.provider === "smtp" && (
              <>
                <div className="form-group">
                  <label>SMTP Host</label>
                  <input
                    type="text"
                    value={config.smtp_config?.host || ""}
                    onChange={(e) =>
                      handleChange("smtp_config", {
                        ...(config.smtp_config || {}),
                        host: e.target.value,
                      })
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>SMTP Port</label>
                  <input
                    type="number"
                    value={config.smtp_config?.port ?? 587}
                    onChange={(e) =>
                      handleChange("smtp_config", {
                        ...(config.smtp_config || {}),
                        port: parseInt(e.target.value) || 587,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={config.smtp_config?.username || ""}
                    onChange={(e) =>
                      handleChange("smtp_config", {
                        ...(config.smtp_config || {}),
                        username: e.target.value,
                      })
                    }
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={config.smtp_config?.password || ""}
                    onChange={(e) =>
                      handleChange("smtp_config", {
                        ...(config.smtp_config || {}),
                        password: e.target.value,
                      })
                    }
                    placeholder="app password"
                  />
                </div>
              </>
            )}

            {config.provider === "sendgrid" && (
              <div className="form-group">
                <label>SendGrid API Key</label>
                <input
                  type="password"
                  value={config.sendgrid_api_key || ""}
                  onChange={(e) =>
                    handleChange("sendgrid_api_key", e.target.value)
                  }
                  placeholder="SG.xxxxx"
                />
              </div>
            )}

            <div className="form-group">
              <label>From Email *</label>
              <input
                type="email"
                value={config.from_email || ""}
                onChange={(e) => handleChange("from_email", e.target.value)}
                placeholder="noreply@example.com"
              />
            </div>

            <div className="form-group">
              <label>To Email *</label>
              <input
                type="email"
                value={config.to || ""}
                onChange={(e) => handleChange("to", e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                value={config.subject || ""}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Email Subject"
              />
            </div>

            <div className="form-group">
              <label>Body *</label>
              <textarea
                value={config.body || ""}
                onChange={(e) => handleChange("body", e.target.value)}
                rows={6}
                placeholder="Email body content..."
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.html || false}
                  onChange={(e) => handleChange("html", e.target.checked)}
                />
                HTML Email
              </label>
            </div>
          </>
        );

      case "slack":
        return (
          <>
            <div className="form-group">
              <label>Bot Token *</label>
              <input
                type="password"
                value={config.token || ""}
                onChange={(e) => handleChange("token", e.target.value)}
                placeholder="xoxb-your-bot-token"
              />
            </div>

            <div className="form-group">
              <label>Channel *</label>
              <input
                type="text"
                value={config.channel || ""}
                onChange={(e) => handleChange("channel", e.target.value)}
                placeholder="#general"
              />
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                value={config.message || ""}
                onChange={(e) => handleChange("message", e.target.value)}
                rows={4}
                placeholder="Your message here..."
              />
            </div>

            <div className="form-group">
              <label>Bot Username (optional)</label>
              <input
                type="text"
                value={config.username || ""}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Workflow Bot"
              />
            </div>

            <div className="form-group">
              <label>Icon Emoji (optional)</label>
              <input
                type="text"
                value={config.icon_emoji || ""}
                onChange={(e) => handleChange("icon_emoji", e.target.value)}
                placeholder=":robot_face:"
              />
            </div>
          </>
        );

      case "sms":
        return (
          <>
            <div className="form-group">
              <label>Twilio Account SID *</label>
              <input
                type="text"
                value={config.account_sid || ""}
                onChange={(e) => handleChange("account_sid", e.target.value)}
                placeholder="ACxxxxxxxxxxxxx"
              />
            </div>

            <div className="form-group">
              <label>Twilio Auth Token *</label>
              <input
                type="password"
                value={config.auth_token || ""}
                onChange={(e) => handleChange("auth_token", e.target.value)}
                placeholder="Auth token"
              />
            </div>

            <div className="form-group">
              <label>From Number *</label>
              <input
                type="tel"
                value={config.from_number || ""}
                onChange={(e) => handleChange("from_number", e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="form-group">
              <label>To Number *</label>
              <input
                type="tel"
                value={config.to || ""}
                onChange={(e) => handleChange("to", e.target.value)}
                placeholder="+1987654321"
              />
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                value={config.message || ""}
                onChange={(e) => handleChange("message", e.target.value)}
                rows={3}
                placeholder="Your SMS message..."
                maxLength={1600}
              />
              <small>Max 1600 characters</small>
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

        {Object.keys(jsonErrors).length > 0 && (
          <div className="error-banner">
            ⚠️ Fix JSON errors before saving
          </div>
        )}

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
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={Object.keys(jsonErrors).length > 0}
              >
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
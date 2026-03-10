/**
 * WorkflowBuilder.jsx - CORRECTED VERSION
 * Fixes: Auth redirect issue, execute workflow, save workflow
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import toast, { Toaster } from "react-hot-toast";

import NodePalette from "./Nodepalette";
import NodeConfigPanel from "./Nodeconfigpanel";
import BuilderToolbar from "./BuilderToolbar";
import TemplatesPanel from "./TemplatesPanel";
import { apiService } from "../../services/api";
import "../../styles/builder.css";
import "../../styles/node-palette.css";
import "../../styles/toolbar.css";

import LLMNode from "./nodes/LLMNode";
import HTTPNode from "./nodes/HTTPNode";
import LoggerNode from "./nodes/LoggerNode";
import ConditionalNode from "./nodes/ConditionalNode";
import TransformNode from "./nodes/TransformNode";
import DelayNode from "./nodes/DelayNode";
import WebhookNode from "./nodes/WebhookNode";
import DatabaseNode from "./nodes/DatabaseNode";
import GoogleSheetsNode from "./nodes/GoogleSheetsNode";
import CSVExcelNode from "./nodes/CSVExcelNode";
import EmailNode from "./nodes/EmailNode";
import SlackNode from "./nodes/SlackNode";
import SMSNode from "./nodes/SMSNode";
import LoopNode from "./nodes/LoopNode";
import CodeExecutorNode from "./nodes/CodeExecutorNode";
import AIVisionNode from "./nodes/AIVisionNode";
import FileOpsNode from "./nodes/FileOpsNode";
import PDFNode from "./nodes/PDFNode";
import ImageNode from "./nodes/ImageNode";

const nodeTypes = {
  llm: LLMNode,
  http: HTTPNode,
  logger: LoggerNode,
  conditional: ConditionalNode, // Add
  transform: TransformNode,
  delay: DelayNode,
  webhook: WebhookNode,
  database: DatabaseNode,
  google_sheets: GoogleSheetsNode,
  csv_excel: CSVExcelNode,
  email: EmailNode,
  slack: SlackNode,
  sms: SMSNode,
  loop: LoopNode,
  code_executor: CodeExecutorNode,
  ai_vision: AIVisionNode,
  file_ops: FileOpsNode,
  pdf: PDFNode,
  image: ImageNode,
};

const WorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowId, setWorkflowId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { id: routeWorkflowId } = useParams();
  const navigate = useNavigate();

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const nodeIdCounter = useRef(1);

  const setNodeIdCounterFromNodes = (nodesList) => {
    const maxId = (nodesList || []).reduce((max, node) => {
      const match = String(node.id).match(/node_(\d+)$/);
      const num = match ? parseInt(match[1], 10) : null;
      return num && num > max ? num : max;
    }, 0);
    nodeIdCounter.current = maxId + 1;
  };

  useEffect(() => {
    const loadWorkflow = async (id) => {
      setIsLoading(true);
      try {
        const response = await apiService.getWorkflow(id);
        const wf = response.data?.data || response.data;
        if (!wf) throw new Error("Workflow not found");

        setWorkflowId(wf._id || id);
        setWorkflowName(wf.name || "Untitled Workflow");

        const loadedNodes = (wf.nodes || []).map((node) => ({
          id: node.id,
          type: node.type,
          position: node.data?.position || { x: 100, y: 100 },
          data: {
            label:
              node.data?.label || `${(node.type || "").toUpperCase()} Node`,
            config: node.config || node.data?.config || {},
          },
        }));

        const loadedEdges = (wf.edges || []).map((edge, idx) => ({
          id: edge.id || `edge-${edge.source}-${edge.target}-${idx}`,
          source: edge.source,
          target: edge.target,
          label: edge.label || "default",
          data: { label: edge.label || "default" },
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        }));

        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setNodeIdCounterFromNodes(loadedNodes);
      } catch (err) {
        console.error("Failed to load workflow", err);
        toast.error(err.response?.data?.message || "Failed to load workflow");
        navigate("/builder", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    if (routeWorkflowId) {
      loadWorkflow(routeWorkflowId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeWorkflowId]);

  const getNodeId = () => {
    const id = `node_${nodeIdCounter.current}`;
    nodeIdCounter.current += 1;
    return id;
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getNodeId(),
        type,
        position,
        data: {
          label: `${type.toUpperCase()} Node`,
          config: getDefaultConfig(type),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success(`${type.toUpperCase()} node added!`);
    },
    [reactFlowInstance, setNodes],
  );

  const getDefaultConfig = (type) => {
    switch (type) {
      case "llm":
        return { prompt: "", temperature: 0.7, max_tokens: 500 };

      case "http":
        return { url: "", method: "GET", headers: {}, body: {} };

      case "logger":
        return { message: "", level: "info" };

      case "conditional":
        return {
          left_value: "",
          operator: "==",
          right_value: "",
          true_output: { result: true },
          false_output: { result: false },
        };

      case "transform":
        return {
          operation: "extract",
          fields: [],
          mapping: {},
          source_node: "",
        };

      case "delay":
        return { duration: 1, unit: "seconds", reason: "" };

      case "webhook":
        return {
          url: "",
          method: "POST",
          body: {},
          headers: {},
          timeout: 30,
          include_inputs: false,
        };

      case "database":
        return {
          connection: {
            // ← this was the crash culprit
            type: "postgresql",
            host: "",
            port: 5432,
            database: "",
            user: "",
            password: "",
          },
          operation: "select",
          table: "",
          columns: ["*"],
          where: {},
          limit: null,
          order_by: "",
        };

      case "google_sheets":
        return {
          spreadsheet_id: "",
          sheet_name: "",
          operation: "read",
          range: "A1:Z1000",
        };

      case "csv_excel":
        return {
          operation: "read",
          file_path: "",
          delimiter: ",",
          has_header: true,
        };

      case "email":
        return { to: "", subject: "", body: "", from: "" };

      case "slack":
        return { channel: "", message: "", webhook_url: "" };

      case "sms":
        return { to: "", message: "", from: "" };

      case "loop":
        return {
          loop_type: "forEach",
          source_array: "",
          variable_name: "item",
          max_iterations: 100,
          batch_size: 1,
          condition: "",
        };

      case "code_executor":
        return {
          language: "python",
          code: "# Write your code here\n# Access input data via 'input_data' variable\n# Return result via 'output' variable\n\noutput = input_data",
          timeout: 30,
          memory_limit: 128,
        };

      case "ai_vision":
        return {
          operation: "analyze",
          image_source: "url",
          image_url: "",
          prompt: "Describe this image in detail",
          model: "", // Let backend decide default based on provider
          confidence_threshold: 0.7,
          ocr_language: "eng",
          max_results: 10,
        };

      case "file_ops":
        return {
          action: "read",
          filename: "",
          content: "",
          source_path: "",
          destination_path: "",
        };

      case "pdf":
        return {
          action: "extract_text",
          filename: "",
          content: "",
          max_pages: 0,
        };

      case "image":
        return {
          action: "resize",
          filename: "",
          output_filename: "",
          width: 800,
          height: 600,
          filter_type: "grayscale",
        };

      default:
        return {}; // ← always return an object, never undefined
    }
  };

  /**
   * UPDATED: Auto-label edges from conditional nodes
   */
  const onConnect = useCallback(
    (params) => {
      // Find the source node
      const sourceNode = nodes.find((n) => n.id === params.source);

      // Determine edge label
      let edgeLabel = "default";
      let edgeStyle = {};
      let edgeLabelStyle = {};

      if (sourceNode && sourceNode.type === "conditional") {
        // Check which handle was used
        const handleId = params.sourceHandle || "";

        if (handleId === "true" || handleId.includes("true")) {
          edgeLabel = "true";
          edgeStyle = { stroke: "#10b981", strokeWidth: 2 };
          edgeLabelStyle = {
            fill: "#10b981",
            fontWeight: 600,
            fontSize: "12px",
          };
        } else if (handleId === "false" || handleId.includes("false")) {
          edgeLabel = "false";
          edgeStyle = { stroke: "#ef4444", strokeWidth: 2 };
          edgeLabelStyle = {
            fill: "#ef4444",
            fontWeight: 600,
            fontSize: "12px",
          };
        } else {
          // Auto-assign based on existing edges
          const existingEdges = edges.filter((e) => e.source === params.source);
          if (existingEdges.length === 0) {
            edgeLabel = "true";
            edgeStyle = { stroke: "#10b981", strokeWidth: 2 };
            edgeLabelStyle = { fill: "#10b981", fontWeight: 600 };
          } else if (existingEdges.length === 1) {
            edgeLabel = "false";
            edgeStyle = { stroke: "#ef4444", strokeWidth: 2 };
            edgeLabelStyle = { fill: "#ef4444", fontWeight: 600 };
          } else {
            toast.warn("Conditional node already has both branches");
            return; // Don't add more than 2 edges
          }
        }
      }

      // Create new edge with label
      const newEdge = {
        id: `${params.source}-${params.sourceHandle || "main"}-${params.target}-${params.targetHandle || "main"}-${Date.now()}`,
        ...params,
        label: edgeLabel.toUpperCase(),
        style: edgeStyle,
        labelStyle: edgeLabelStyle,
        data: { label: edgeLabel }, // Store label in data
      };

      setEdges((eds) => addEdge(newEdge, eds));

      if (edgeLabel !== "default") {
        toast.success(`Connected to ${edgeLabel.toUpperCase()} branch`);
      } else {
        toast.success("Nodes connected!");
      }
    },
    [setEdges, nodes, edges],
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  }, []);

  const updateNodeConfig = (nodeId, newConfig) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, config: newConfig },
          };
        }
        return node;
      }),
    );
    toast.success("Node updated!");
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
    setShowConfigPanel(false);
    setSelectedNode(null);
    toast.success("Node deleted!");
  };

  /**
   * CORRECTED: Save workflow without auth redirect
   */
  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Add at least one node to save");
      return;
    }

    setIsSaving(true);

    try {
      const formattedNodes = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        config: node.data.config,
        data: {
          position: node.position,
          label: node.data.label,
        },
      }));

      // UPDATED: Include edge labels
      const formattedEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.data?.label || edge.label || "default",
      }));

      const workflowData = {
        name: workflowName,
        description: "Created with visual builder",
        nodes: formattedNodes,
        edges: formattedEdges,
      };

      console.log("Saving workflow:", workflowData);

      let response;
      if (workflowId) {
        response = await apiService.put(
          `/workflows/${workflowId}`,
          workflowData,
        );
        toast.success("Workflow updated!");
      } else {
        response = await apiService.post("/workflows", workflowData);
        const newId = response.data?.data?._id || response.data?._id;
        console.log("Workflow saved with ID:", newId);
        setWorkflowId(newId);
        // Update URL so users can share/edit this workflow
        navigate(`/builder/${newId}`, { replace: true });
        toast.success("Workflow saved successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const importTemplate = (template) => {
    setWorkflowName(template.name);
    setWorkflowId(null);

    const templateNodes = template.nodes.map((node, index) => ({
      id: `node_${index + 1}`,
      type: node.type,
      position: node.data?.position || { x: 100 + index * 250, y: 100 },
      data: {
        label: node.data?.label || `${node.type.toUpperCase()} Node`,
        config: node.config,
      },
    }));

    const templateEdges = template.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
    }));

    setNodes(templateNodes);
    setEdges(templateEdges);
    nodeIdCounter.current = templateNodes.length + 1;
    setShowTemplates(false);
    toast.success("Template imported!");
  };

  const createNew = () => {
    if (nodes.length > 0) {
      if (!window.confirm("Clear current workflow?")) return;
    }

    setNodes([]);
    setEdges([]);
    setWorkflowName("Untitled Workflow");
    setWorkflowId(null);
    nodeIdCounter.current = 1;
    navigate("/builder", { replace: true });
    toast.success("New workflow created!");
  };

  /**
   * CORRECTED: Execute workflow - redirect to executor
   */
  const executeWorkflow = () => {
    if (!workflowId) {
      toast.error("Please save workflow first before running");
      return;
    }

    toast.success("Opening executor...");
    setTimeout(() => {
      window.location.href = `/executor?id=${workflowId}`;
    }, 500);
  };

  return (
    <div className="workflow-builder">
      <Toaster position="top-right" />

      {isLoading && (
        <div className="builder-loading-overlay">
          <div className="builder-loading-content">
            <div className="builder-spinner" />
            <span>Loading workflow...</span>
          </div>
        </div>
      )}

      <BuilderToolbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        onNew={createNew}
        onSave={saveWorkflow}
        onTemplates={() => setShowTemplates(true)}
        onExecute={executeWorkflow}
        isSaving={isSaving}
        canExecute={!!workflowId}
      />

      <div className="builder-content">
        <NodePalette />

        <div className="builder-canvas" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {showConfigPanel && selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => {
              setShowConfigPanel(false);
              setSelectedNode(null);
            }}
            onUpdate={updateNodeConfig}
            onDelete={deleteNode}
          />
        )}
      </div>

      {showTemplates && (
        <TemplatesPanel
          onClose={() => setShowTemplates(false)}
          onImport={importTemplate}
        />
      )}
    </div>
  );
};

export default WorkflowBuilder;

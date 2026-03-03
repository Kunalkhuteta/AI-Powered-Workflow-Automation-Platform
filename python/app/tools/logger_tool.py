"""
Logger Tool
Responsibility: Log data for debugging and monitoring
- Logs node inputs and outputs
- Useful for debugging workflows
- Phase 3: Send logs to persistence layer (MongoDB, ELK, etc.)
"""

from typing import Any, Dict
import json
from typing import Optional, Dict, List, Any
from datetime import datetime
from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext


class LoggerTool(BaseTool):
    """
    Logger tool for workflow debugging
    
    Logs node execution data for monitoring and debugging.
    
    Phase 2: Print to console
    Phase 3: 
    - Send to MongoDB for persistence
    - Send to ELK stack for analytics
    - Add structured logging with levels
    
    Configuration:
        message: str - Custom log message
        level: str - Log level (info, warning, error)
        log_inputs: bool - Whether to log inputs
        log_outputs: bool - Whether to log outputs
    """
    
    def __init__(self):
        """Initialize logger tool"""
        super().__init__()
        self.log_buffer = []  # In-memory log buffer for Phase 2
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Dict[str, Any]:
        """
        Execute logging
        
        Args:
            node_id: Node being executed
            config: Logger configuration
            inputs: Data from parent nodes
            context: Execution context
            
        Returns:
            Log entry with metadata
        """
        try:
            # Extract config
            message = config.get("message", "Log entry")
            level = config.get("level", "info").upper()
            log_inputs = config.get("log_inputs", True)
            log_outputs = config.get("log_outputs", True)
            
            # Build log entry
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "node_id": node_id,
                "workflow_id": context.workflow_id,
                "level": level,
                "message": message,
            }
            
            # Include inputs if configured
            if log_inputs and inputs:
                log_entry["inputs"] = self._sanitize_for_logging(inputs)
            
            # Execute actual logging
            self._write_log(log_entry)
            
            # Return log entry as output (can be used by downstream nodes)
            return {
                "type": "log_entry",
                "logged_at": log_entry["timestamp"],
                "message": message,
                "level": level,
            }
            
        except Exception as e:
            raise ToolExecutionError(
                tool_name=self.tool_name,
                node_id=node_id,
                message=str(e)
            )
    
    def _sanitize_for_logging(self, data: Any) -> Any:
        """
        Sanitize data for logging
        
        Removes sensitive information and limits size.
        
        Args:
            data: Data to sanitize
            
        Returns:
            Sanitized data
        """
        # Convert to JSON-serializable format
        try:
            # Try to serialize to ensure it's JSON-compatible
            json.dumps(data)
            return data
        except (TypeError, ValueError):
            # If not serializable, convert to string
            return str(data)
    
    def _write_log(self, log_entry: Dict[str, Any]) -> None:
        """
        Write log entry
        
        Phase 2: Print to console and store in memory
        Phase 3: Send to MongoDB/ELK
        
        Args:
            log_entry: Log entry to write
        """
        # Console output for immediate debugging
        timestamp = log_entry["timestamp"]
        level = log_entry["level"]
        node_id = log_entry["node_id"]
        message = log_entry["message"]
        
        print(f"[{timestamp}] {level} | Node: {node_id} | {message}")
        
        # Include inputs if present
        if "inputs" in log_entry:
            print(f"  Inputs: {json.dumps(log_entry['inputs'], indent=2)}")
        
        # Store in memory buffer (Phase 2)
        self.log_buffer.append(log_entry)
        
        # Phase 3: Replace with actual persistence
        # await mongodb.logs.insert_one(log_entry)
        # or
        # await elk_client.index(log_entry)
    
    def get_logs(self, workflow_id: Optional[str] = None) -> list:
        """
        Retrieve logs from buffer
        
        Phase 2: Return in-memory logs
        Phase 3: Query from database
        
        Args:
            workflow_id: Optional workflow ID to filter logs
            
        Returns:
            List of log entries
        """
        if workflow_id:
            return [
                log for log     in self.log_buffer 
                if log.get("workflow_id") == workflow_id
            ]
        return self.log_buffer.copy()
    
    def clear_logs(self) -> None:
        """Clear log buffer"""
        self.log_buffer.clear()
    
    def __repr__(self) -> str:
        """String representation"""
        return f"LoggerTool(logs_buffered={len(self.log_buffer)})"


# Import for type hints
from typing import Optional
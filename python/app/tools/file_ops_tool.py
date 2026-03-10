"""
File Operations Tool
Responsibility: Read, write, upload, and download files locally (simulating cloud storage)
"""

import os
import shutil
from typing import Any, Dict
from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext

class FileOpsTool(BaseTool):
    """
    Tool for basic file operations.
    Supports reading text files, writing text files, and copying files.
    """

    def __init__(self):
        super().__init__()
        # Ensure a base directory exists for safe operations
        self.base_dir = os.path.join(os.getcwd(), "data", "storage")
        os.makedirs(self.base_dir, exist_ok=True)

    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        
        action = config.get("action", "read")
        filename = config.get("filename", "")
        
        # Replace placeholders if needed
        if filename and isinstance(filename, str):
            filename = context.replace_placeholders(filename)
            
        if not filename:
             raise ToolExecutionError(self.tool_name, node_id, "Filename is required")
             
        filepath = os.path.join(self.base_dir, filename)
        
        # Security: Prevent path traversal
        if not os.path.abspath(filepath).startswith(os.path.abspath(self.base_dir)):
            raise ToolExecutionError(self.tool_name, node_id, "Invalid filename: Path traversal detected")

        try:
            if action == "read":
                if not os.path.exists(filepath):
                    raise ToolExecutionError(self.tool_name, node_id, f"File not found: {filename}")
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                return {"action": "read", "filename": filename, "content": content}

            elif action == "write":
                content = config.get("content", "")
                if isinstance(content, str):
                    content = context.replace_placeholders(content)
                
                # Check inputs mapping if content empty
                if not content and "content" in inputs:
                     content = inputs["content"]
                     
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(str(content))
                return {"action": "write", "filename": filename, "status": "success", "bytes_written": len(str(content))}

            elif action == "delete":
                if not os.path.exists(filepath):
                    return {"action": "delete", "filename": filename, "status": "not_found"}
                os.remove(filepath)
                return {"action": "delete", "filename": filename, "status": "success"}

            # Simulate upload/download by copying from/to another local path
            elif action == "upload":
                source_path = config.get("source_path", "")
                if isinstance(source_path, str):
                    source_path = context.replace_placeholders(source_path)
                    
                if not source_path or not os.path.exists(source_path):
                     raise ToolExecutionError(self.tool_name, node_id, f"Source file not found: {source_path}")
                     
                shutil.copy2(source_path, filepath)
                return {"action": "upload", "filename": filename, "status": "success"}
                
            elif action == "download":
                dest_path = config.get("destination_path", "")
                if isinstance(dest_path, str):
                    dest_path = context.replace_placeholders(dest_path)
                    
                if not dest_path:
                    raise ToolExecutionError(self.tool_name, node_id, "Destination path required for download")
                    
                if not os.path.exists(filepath):
                    raise ToolExecutionError(self.tool_name, node_id, f"File not found: {filename}")
                    
                # Ensure dest directory exists
                os.makedirs(os.path.dirname(os.path.abspath(dest_path)), exist_ok=True)
                shutil.copy2(filepath, dest_path)
                return {"action": "download", "filename": filename, "status": "success", "destination": dest_path}

            else:
                raise ToolExecutionError(self.tool_name, node_id, f"Unsupported action: {action}")

        except Exception as e:
            if isinstance(e, ToolExecutionError):
                raise e
            raise ToolExecutionError(self.tool_name, node_id, f"File operation failed: {str(e)}")

    def validate_config(self, config: Dict[str, Any]) -> None:
        if "action" not in config:
            raise ValueError("File Operations tool requires 'action' in config")
        if "filename" not in config:
            raise ValueError("File Operations tool requires 'filename' in config")

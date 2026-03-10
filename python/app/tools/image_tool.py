"""
Image Tool
Responsibility: Image manipulation (resize, crop, filters)
"""

import os
from typing import Any, Dict
from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext

try:
    from PIL import Image, ImageFilter, ImageOps
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

class ImageTool(BaseTool):
    """
    Tool for image operations using Pillow.
    """

    def __init__(self):
        super().__init__()
        self.base_dir = os.path.join(os.getcwd(), "data", "storage")
        os.makedirs(self.base_dir, exist_ok=True)

    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        
        if not HAS_PIL:
            raise ToolExecutionError(
                self.tool_name, node_id, 
                "Pillow library not installed. Run: pip install Pillow"
            )

        action = config.get("action", "resize")
        filename = config.get("filename", "")
        
        if filename and isinstance(filename, str):
            filename = context.replace_placeholders(filename)
            
        if not filename:
             raise ToolExecutionError(self.tool_name, node_id, "Filename is required")
             
        filepath = os.path.join(self.base_dir, filename)
        
        if not os.path.abspath(filepath).startswith(os.path.abspath(self.base_dir)):
            raise ToolExecutionError(self.tool_name, node_id, "Invalid filename: Path traversal detected")

        if not os.path.exists(filepath):
            raise ToolExecutionError(self.tool_name, node_id, f"File not found: {filename}")

        out_filename = config.get("output_filename", f"edited_{filename}")
        if out_filename and isinstance(out_filename, str):
            out_filename = context.replace_placeholders(out_filename)
            
        out_filepath = os.path.join(self.base_dir, out_filename)
        
        if not os.path.abspath(out_filepath).startswith(os.path.abspath(self.base_dir)):
             raise ToolExecutionError(self.tool_name, node_id, "Invalid output filename: Path traversal detected")

        try:
            with Image.open(filepath) as img:
                # Need to convert RGBA to RGB for saving as JPEG usually, but preserving format if possible
                if img.mode in ('RGBA', 'P') and out_filepath.lower().endswith(('.jpg', '.jpeg')):
                    img = img.convert('RGB')
                    
                if action == "resize":
                    width = int(config.get("width", img.width))
                    height = int(config.get("height", img.height))
                    edited_img = img.resize((width, height))
                    
                elif action == "crop":
                    left = int(config.get("left", 0))
                    top = int(config.get("top", 0))
                    right = int(config.get("right", img.width))
                    bottom = int(config.get("bottom", img.height))
                    edited_img = img.crop((left, top, right, bottom))
                    
                elif action == "filter":
                    filter_type = config.get("filter_type", "grayscale")
                    if filter_type == "grayscale":
                        edited_img = ImageOps.grayscale(img)
                    elif filter_type == "blur":
                        edited_img = img.filter(ImageFilter.BLUR)
                    elif filter_type == "contour":
                        edited_img = img.filter(ImageFilter.CONTOUR)
                    elif filter_type == "sharpen":
                        edited_img = img.filter(ImageFilter.SHARPEN)
                    else:
                        edited_img = img
                else:
                    raise ToolExecutionError(self.tool_name, node_id, f"Unsupported action: {action}")

                edited_img.save(out_filepath)
                
            return {
                "action": action, 
                "original_file": filename, 
                "output_file": out_filename,
                "status": "success",
                "width": edited_img.width,
                "height": edited_img.height
            }

        except Exception as e:
            if isinstance(e, ToolExecutionError):
                raise e
            raise ToolExecutionError(self.tool_name, node_id, f"Image operation failed: {str(e)}")

    def validate_config(self, config: Dict[str, Any]) -> None:
        if "action" not in config:
            raise ValueError("Image tool requires 'action' in config")
        if "filename" not in config:
            raise ValueError("Image tool requires 'filename' in config")

"""
PDF Tool
Responsibility: Generate PDFs from text and extract text from existing PDFs
"""

import os
from typing import Any, Dict
from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    import PyPDF2
    HAS_PDF_LIBS = True
except ImportError:
    HAS_PDF_LIBS = False

class PDFTool(BaseTool):
    """
    Tool for PDF operations: generate and extract_text.
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
        
        if not HAS_PDF_LIBS:
            raise ToolExecutionError(
                self.tool_name, node_id, 
                "PDF libraries not installed. Run: pip install reportlab PyPDF2"
            )

        action = config.get("action", "extract_text")
        filename = config.get("filename", "")
        
        if filename and isinstance(filename, str):
            filename = context.replace_placeholders(filename)
            
        if not filename:
             raise ToolExecutionError(self.tool_name, node_id, "Filename is required")
             
        filepath = os.path.join(self.base_dir, filename)
        
        if not os.path.abspath(filepath).startswith(os.path.abspath(self.base_dir)):
            raise ToolExecutionError(self.tool_name, node_id, "Invalid filename: Path traversal detected")

        try:
            if action == "generate":
                text = config.get("content", "")
                if isinstance(text, str):
                    text = context.replace_placeholders(text)
                
                if not text and "content" in inputs:
                    text = inputs["content"]
                    
                # Basic PDF Generation using reportlab
                c = canvas.Canvas(filepath, pagesize=letter)
                width, height = letter
                
                # Simple text wrapping for basic generation
                textobject = c.beginText()
                textobject.setTextOrigin(40, height - 40)
                textobject.setFont("Helvetica", 12)
                
                lines = str(text).split('\n')
                for line in lines:
                    textobject.textLine(line)
                    
                c.drawText(textobject)
                c.save()
                
                return {"action": "generate", "filename": filename, "status": "success", "file_path": filepath}

            elif action == "extract_text":
                if not os.path.exists(filepath):
                    raise ToolExecutionError(self.tool_name, node_id, f"File not found: {filename}")
                    
                text_content = ""
                with open(filepath, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    num_pages = len(reader.pages)
                    
                    # Extract up to max_pages or all if not specified
                    max_pages = int(config.get("max_pages", 0))
                    limit = min(max_pages, num_pages) if max_pages > 0 else num_pages
                        
                    for i in range(limit):
                        page = reader.pages[i]
                        text_content += page.extract_text() + "\n\n"
                        
                return {"action": "extract_text", "filename": filename, "content": text_content.strip()}

            else:
                raise ToolExecutionError(self.tool_name, node_id, f"Unsupported action: {action}")

        except Exception as e:
            if isinstance(e, ToolExecutionError):
                raise e
            raise ToolExecutionError(self.tool_name, node_id, f"PDF operation failed: {str(e)}")

    def validate_config(self, config: Dict[str, Any]) -> None:
        if "action" not in config:
            raise ValueError("PDF tool requires 'action' in config")
        if "filename" not in config:
            raise ValueError("PDF tool requires 'filename' in config")

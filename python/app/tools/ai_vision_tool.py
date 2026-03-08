"""
AI Vision Tool - Image analysis, OCR, object detection, and visual AI
Uses OpenAI-compatible API (supports GPT-4o, Hugging Face, etc.)
"""

from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext
from typing import Any, Dict, List, Optional
import time
import os
import re
import json
import base64


class AIVisionTool(BaseTool):
    """
    AI Vision tool for image analysis and visual AI tasks
    
    Operations:
    - analyze: General image analysis with custom prompt
    - ocr: Extract text from images
    - detect: Object detection with bounding boxes
    - classify: Image classification
    - describe: Generate detailed image description
    - compare: Compare two images
    
    Config:
        operation: Vision operation to perform
        image_source: 'url', 'base64', or 'input'
        image_url: Direct URL to image
        base64_data: Base64 encoded image data
        input_node: Reference to image data from previous node
        prompt: Custom prompt for analysis
        model: Vision model to use (default: gpt-4o)
        confidence_threshold: Min confidence for detection/classification
        ocr_language: Language for OCR
        max_results: Max objects to detect
        include_bounding_boxes: Include bbox coordinates
    """
    
    def __init__(self):
        super().__init__()
        self.tool_name = "AIVisionTool"
        self.mock_enabled = os.getenv("MOCK_LLM", "false").lower() == "true"
        self.provider = os.getenv("LLM_PROVIDER", "huggingface").lower()
        self.client = None
        
        if not self.mock_enabled:
            self._init_client()
    
    def _init_client(self):
        """Initialize the vision API client"""
        try:
            from openai import OpenAI
            
            if self.provider == "huggingface":
                api_key = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
                if api_key:
                    self.client = OpenAI(
                        base_url="https://router.huggingface.co/v1",
                        api_key=api_key,
                    )
                    self.default_model = os.getenv(
                        "HUGGINGFACE_MODEL",
                        "MiniMaxAI/MiniMax-M2.5:novita"
                    )
                    print(f"✅ AI Vision: Hugging Face client initialized")
                else:
                    print("⚠️ AI Vision: No API key, using mock mode")
                    self.mock_enabled = True
            else:
                api_key = os.getenv("OPENAI_API_KEY")
                if api_key:
                    self.client = OpenAI(api_key=api_key)
                    self.default_model = "gpt-4o"
                    print(f"✅ AI Vision: OpenAI client initialized")
                else:
                    print("⚠️ AI Vision: No API key, using mock mode")
                    self.mock_enabled = True
                    
        except ImportError:
            print("⚠️ AI Vision: openai package not installed, using mock mode")
            self.mock_enabled = True
        except Exception as e:
            print(f"⚠️ AI Vision init error: {e}, using mock mode")
            self.mock_enabled = True
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        """Execute vision analysis"""
        print(f"👁️ AIVision [{node_id}]: Starting")
        print(f"👁️ Available inputs: {list(inputs.keys())}")
        
        try:
            operation = config.get('operation', 'analyze')
            
            # Use configured default if node config is empty or generic 'gpt-4o' while using HF
            model = config.get('model', '')
            if not model or (model == 'gpt-4o' and self.provider == 'huggingface'):
                model = getattr(self, 'default_model', 'gpt-4o')
            
            # Resolve image data
            image_data = self._resolve_image(config, inputs, context)
            
            print(f"👁️ Operation: {operation}, Model: {model}")
            
            start_time = time.time()
            
            if self.mock_enabled:
                result = self._mock_vision(operation, config)
            else:
                result = self._call_vision_api(operation, image_data, config, model)
            
            execution_time = time.time() - start_time
            
            response = {
                'type': 'vision_result',
                'operation': operation,
                'result': result,
                'model': model,
                'execution_time': execution_time,
                'mock_mode': self.mock_enabled,
                'metadata': {
                    'operation': operation,
                    'model': model,
                    'execution_time': execution_time,
                    'mock_mode': self.mock_enabled,
                }
            }
            
            print(f"✅ AIVision [{node_id}]: Completed in {execution_time:.2f}s")
            return response
            
        except Exception as e:
            print(f"❌ AIVision error: {e}")
            raise ToolExecutionError(
                tool_name=self.tool_name,
                node_id=node_id,
                message=str(e)
            )
    
    def _resolve_image(self, config: Dict, inputs: Dict, context: ExecutionContext) -> Dict:
        """Resolve image data from config or inputs"""
        source = config.get('image_source', 'url')
        
        if source == 'url':
            url = config.get('image_url', '')
            # Resolve placeholders
            url = self._resolve_placeholder(url, inputs)
            if not url:
                raise ValueError("Image URL is required")
            return {'type': 'url', 'url': url}
            
        elif source == 'base64':
            data = config.get('base64_data', '')
            data = self._resolve_placeholder(data, inputs)
            if not data:
                raise ValueError("Base64 image data is required")
            # Strip data URL prefix if present
            if 'base64,' in data:
                data = data.split('base64,')[1]
            return {'type': 'base64', 'data': data}
            
        elif source == 'input':
            input_ref = config.get('input_node', '')
            input_ref = self._resolve_placeholder(input_ref, inputs)
            
            # Try to find image data from inputs
            if isinstance(input_ref, str) and input_ref:
                # It's resolved data
                if input_ref.startswith('http'):
                    return {'type': 'url', 'url': input_ref}
                elif len(input_ref) > 100:  # Likely base64
                    return {'type': 'base64', 'data': input_ref}
            
            # Search inputs for image data
            for key, value in inputs.items():
                if isinstance(value, dict):
                    for field in ['image_url', 'url', 'image']:
                        if field in value and value[field]:
                            return {'type': 'url', 'url': str(value[field])}
                    for field in ['image_data', 'base64', 'data']:
                        if field in value and value[field] and len(str(value[field])) > 100:
                            return {'type': 'base64', 'data': str(value[field])}
            
            raise ValueError("Could not resolve image from input")
        
        raise ValueError(f"Unknown image source: {source}")
    
    def _resolve_placeholder(self, value: Any, inputs: Dict) -> Any:
        """Resolve {{node_id.field}} placeholders"""
        if not isinstance(value, str) or '{{' not in value:
            return value
        
        pattern = r'\{\{([^}]+)\}\}'
        matches = re.findall(pattern, value)
        
        if not matches:
            return value
        
        # Single placeholder
        if value.strip() == f"{{{{{matches[0]}}}}}":
            return self._get_nested_value(inputs, matches[0].strip())
        
        # Multiple placeholders
        result = value
        for match in matches:
            resolved = self._get_nested_value(inputs, match.strip())
            result = result.replace(f"{{{{{match}}}}}", str(resolved) if resolved is not None else '')
        
        return result
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """Get nested value using dot notation"""
        parts = path.split('.')
        current = data
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
                if current is None:
                    return None
            else:
                return None
        return current
    
    def _call_vision_api(self, operation: str, image_data: Dict, config: Dict, model: str) -> Dict:
        """Call the vision API"""
        
        # Build the prompt based on operation
        prompt = self._build_vision_prompt(operation, config)
        
        # Build image content
        if image_data['type'] == 'url':
            image_content = {
                "type": "image_url",
                "image_url": {"url": image_data['url']}
            }
        else:
            image_content = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image_data['data']}"
                }
            }
        
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    image_content
                ]
            }
        ]
        
        # Handle compare operation — add second image
        if operation == 'compare':
            url2 = config.get('image_url_2', '')
            if url2:
                messages[0]["content"].append({
                    "type": "image_url",
                    "image_url": {"url": url2}
                })
        
        try:
            completion = self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1000,
                temperature=0.3,
            )
            
            response_text = ""
            message = completion.choices[0].message
            
            if hasattr(message, 'content') and message.content:
                response_text = message.content
            elif hasattr(message, 'reasoning_content') and message.reasoning_content:
                response_text = message.reasoning_content
            
            if not response_text:
                response_text = "[No response from vision model]"
            
            # Parse the response based on operation
            return self._parse_vision_response(operation, response_text, config)
            
        except Exception as e:
            print(f"❌ Vision API error: {e}")
            raise Exception(f"Vision API call failed: {str(e)}")
    
    def _build_vision_prompt(self, operation: str, config: Dict) -> str:
        """Build prompt based on operation type"""
        custom_prompt = config.get('prompt', '')
        
        if operation == 'analyze':
            base = custom_prompt or "Analyze this image in detail. Describe what you see, including objects, text, colors, and any notable features."
            return base
        
        elif operation == 'ocr':
            lang = config.get('ocr_language', 'eng')
            lang_names = {
                'eng': 'English', 'spa': 'Spanish', 'fra': 'French',
                'deu': 'German', 'chi_sim': 'Chinese', 'jpn': 'Japanese',
                'kor': 'Korean', 'hin': 'Hindi', 'ara': 'Arabic',
                'auto': 'any language'
            }
            lang_name = lang_names.get(lang, lang)
            return f"""Extract ALL text from this image. The text is in {lang_name}.
Return the extracted text exactly as it appears in the image.
Format the response as:
{{
    "extracted_text": "the full text found",
    "lines": ["line 1", "line 2", ...],
    "confidence": 0.0 to 1.0,
    "language": "{lang}"
}}"""
        
        elif operation == 'detect':
            threshold = config.get('confidence_threshold', 0.7)
            max_results = config.get('max_results', 10)
            include_bbox = config.get('include_bounding_boxes', False)
            
            bbox_instruction = ""
            if include_bbox:
                bbox_instruction = ', "bounding_box": {"x": 0-1, "y": 0-1, "width": 0-1, "height": 0-1}'
            
            return f"""Detect all objects in this image. List up to {max_results} objects.
Only include objects with confidence above {threshold}.
Format as JSON:
{{
    "objects": [
        {{"name": "object name", "confidence": 0.0 to 1.0{bbox_instruction}}}
    ],
    "total_objects": number
}}"""
        
        elif operation == 'classify':
            threshold = config.get('confidence_threshold', 0.7)
            return f"""Classify this image into categories. Include confidence scores.
Only include categories with confidence above {threshold}.
Format as JSON:
{{
    "categories": [
        {{"label": "category name", "confidence": 0.0 to 1.0}}
    ],
    "primary_category": "most likely category"
}}"""
        
        elif operation == 'describe':
            base = custom_prompt or "Provide a detailed, comprehensive description of this image."
            return base
        
        elif operation == 'compare':
            base = custom_prompt or "Compare these two images. Describe the similarities and differences."
            return base
        
        return custom_prompt or "Analyze this image."
    
    def _parse_vision_response(self, operation: str, response_text: str, config: Dict) -> Dict:
        """Parse the vision API response"""
        
        # Try to extract JSON from response
        json_data = self._extract_json(response_text)
        
        if operation == 'ocr':
            if json_data:
                return {
                    'extracted_text': json_data.get('extracted_text', response_text),
                    'lines': json_data.get('lines', response_text.split('\n')),
                    'confidence': json_data.get('confidence', 0.8),
                    'language': json_data.get('language', config.get('ocr_language', 'eng')),
                    'raw_response': response_text,
                }
            return {
                'extracted_text': response_text,
                'lines': response_text.split('\n'),
                'confidence': 0.8,
                'language': config.get('ocr_language', 'eng'),
                'raw_response': response_text,
            }
        
        elif operation == 'detect':
            if json_data:
                return {
                    'objects': json_data.get('objects', []),
                    'total_objects': json_data.get('total_objects', len(json_data.get('objects', []))),
                    'raw_response': response_text,
                }
            return {
                'objects': [],
                'total_objects': 0,
                'description': response_text,
                'raw_response': response_text,
            }
        
        elif operation == 'classify':
            if json_data:
                return {
                    'categories': json_data.get('categories', []),
                    'primary_category': json_data.get('primary_category', ''),
                    'raw_response': response_text,
                }
            return {
                'categories': [],
                'primary_category': '',
                'description': response_text,
                'raw_response': response_text,
            }
        
        elif operation in ('analyze', 'describe', 'compare'):
            return {
                'description': response_text,
                'raw_response': response_text,
            }
        
        return {
            'text': response_text,
            'raw_response': response_text,
        }
    
    def _extract_json(self, text: str) -> Optional[Dict]:
        """Try to extract JSON from response text"""
        # Try direct parse
        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            pass
        
        # Try to find JSON block in text
        json_patterns = [
            r'```json\s*([\s\S]*?)\s*```',
            r'```\s*([\s\S]*?)\s*```',
            r'\{[\s\S]*\}',
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    return json.loads(match.strip())
                except (json.JSONDecodeError, TypeError):
                    continue
        
        return None
    
    def _mock_vision(self, operation: str, config: Dict) -> Dict:
        """Mock vision response for testing"""
        time.sleep(0.2)
        
        if operation == 'analyze':
            return {
                'description': '[Mock] The image shows a professional workspace with a laptop, notebook, and coffee cup on a wooden desk. The lighting is warm and natural.',
                'raw_response': '[Mock analysis response]',
            }
        
        elif operation == 'ocr':
            return {
                'extracted_text': '[Mock] Invoice #INV-2024-001\nDate: March 8, 2026\nTotal: $1,500.00\nVendor: Acme Corp',
                'lines': [
                    'Invoice #INV-2024-001',
                    'Date: March 8, 2026',
                    'Total: $1,500.00',
                    'Vendor: Acme Corp'
                ],
                'confidence': 0.95,
                'language': config.get('ocr_language', 'eng'),
                'raw_response': '[Mock OCR response]',
            }
        
        elif operation == 'detect':
            return {
                'objects': [
                    {'name': 'laptop', 'confidence': 0.98},
                    {'name': 'coffee cup', 'confidence': 0.95},
                    {'name': 'notebook', 'confidence': 0.92},
                    {'name': 'pen', 'confidence': 0.87},
                    {'name': 'desk', 'confidence': 0.96},
                ],
                'total_objects': 5,
                'raw_response': '[Mock detection response]',
            }
        
        elif operation == 'classify':
            return {
                'categories': [
                    {'label': 'workspace', 'confidence': 0.94},
                    {'label': 'office', 'confidence': 0.89},
                    {'label': 'technology', 'confidence': 0.82},
                ],
                'primary_category': 'workspace',
                'raw_response': '[Mock classification response]',
            }
        
        elif operation == 'describe':
            return {
                'description': '[Mock] A well-organized professional workspace featuring a silver laptop open on a wooden desk, accompanied by a black leather notebook, a blue ballpoint pen, and a white ceramic coffee cup filled with espresso.',
                'raw_response': '[Mock description response]',
            }
        
        elif operation == 'compare':
            return {
                'description': '[Mock] The two images show the same workspace at different times of day. The first image has natural daylight, while the second shows artificial evening lighting. The laptop position has changed slightly.',
                'similarities': ['Same workspace', 'Same desk', 'Same laptop'],
                'differences': ['Lighting conditions', 'Laptop position', 'Coffee cup present/absent'],
                'raw_response': '[Mock comparison response]',
            }
        
        return {
            'text': f'[Mock] Vision analysis for operation: {operation}',
            'raw_response': '[Mock response]',
        }
    
    def validate_config(self, config: Dict[str, Any]) -> None:
        """Validate vision configuration"""
        operation = config.get('operation', 'analyze')
        valid_ops = ['analyze', 'ocr', 'detect', 'classify', 'describe', 'compare']
        if operation not in valid_ops:
            raise ValueError(f"Invalid operation: {operation}. Must be one of: {valid_ops}")

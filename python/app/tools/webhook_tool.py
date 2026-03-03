"""
Webhook Tool - Trigger External Systems
Send HTTP requests to external webhooks and APIs
"""

from app.tools.base import BaseTool
from typing import Any, Dict, Optional
import requests
import json
from datetime import datetime


class WebhookTool(BaseTool):
    """
    Webhook tool for triggering external systems
    
    Use Cases:
    - Send data to external APIs
    - Trigger Zapier/Make.com workflows
    - Notify external systems (Slack, Discord, etc.)
    - Post to webhook endpoints
    - Integration with third-party services
    
    Config:
        url: Webhook URL to call
        method: HTTP method (POST, GET, PUT, DELETE)
        body: Request body (JSON object or template string)
        headers: Custom HTTP headers (optional)
        timeout: Request timeout in seconds (default: 30)
        include_inputs: Whether to include node inputs in body (default: false)
    """
    
    def __init__(self):
        super().__init__()
        self.name = "webhook"
        self.description = "Send HTTP requests to external webhooks and APIs"
    
    def execute(self, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Execute webhook call
        
        Returns:
            Response from webhook including status, data, and timing
        """
        try:
            # Get configuration
            url = config.get('url')
            method = config.get('method', 'POST').upper()
            body = config.get('body', {})
            headers = config.get('headers', {})
            timeout = config.get('timeout', 30)
            include_inputs = config.get('include_inputs', False)
            
            # Validate URL
            if not url:
                raise ValueError("Webhook URL is required")
            
            if not url.startswith(('http://', 'https://')):
                raise ValueError("URL must start with http:// or https://")
            
            # Prepare body
            request_body = self._prepare_body(body, inputs, include_inputs)
            
            # Prepare headers
            request_headers = self._prepare_headers(headers)
            
            # Record start time
            start_time = datetime.utcnow()
            
            print(f"🔗 Webhook: {method} {url}")
            
            # Make HTTP request
            response = self._make_request(
                method=method,
                url=url,
                body=request_body,
                headers=request_headers,
                timeout=timeout
            )
            
            # Record end time
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            # Parse response
            response_data = self._parse_response(response)
            
            return {
                'success': response.ok,
                'status_code': response.status_code,
                'status_text': response.reason,
                'url': url,
                'method': method,
                'response': response_data,
                'headers': dict(response.headers),
                'duration_seconds': duration,
                'timestamp': start_time.isoformat(),
                'message': f"{method} request to {url} completed with status {response.status_code}"
            }
            
        except requests.exceptions.Timeout:
            raise Exception(f"Webhook request timed out after {timeout} seconds")
        except requests.exceptions.ConnectionError:
            raise Exception(f"Failed to connect to webhook URL: {url}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Webhook request failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Webhook execution failed: {str(e)}")
    
    def _prepare_body(self, body: Any, inputs: Dict[str, Any], include_inputs: bool) -> Optional[Dict]:
        """
        Prepare request body
        
        Handles:
        - JSON objects
        - Template strings with {{placeholders}}
        - Including previous node inputs
        """
        if not body and not include_inputs:
            return None
        
        # Start with configured body
        if isinstance(body, dict):
            request_body = body.copy()
        elif isinstance(body, str):
            # Try to parse as JSON
            try:
                request_body = json.loads(body)
            except json.JSONDecodeError:
                request_body = {'message': body}
        else:
            request_body = {}
        
        # Include inputs if requested
        if include_inputs:
            request_body['workflow_inputs'] = inputs
        
        # Resolve placeholders
        request_body = self._resolve_placeholders(request_body, inputs)
        
        return request_body
    
    def _prepare_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """Prepare HTTP headers"""
        default_headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Workflow-Engine/1.0'
        }
        
        # Merge with custom headers
        if headers:
            default_headers.update(headers)
        
        return default_headers
    
    def _make_request(
        self, 
        method: str, 
        url: str, 
        body: Optional[Dict],
        headers: Dict[str, str],
        timeout: int
    ) -> requests.Response:
        """Make HTTP request"""
        
        if method == 'GET':
            response = requests.get(
                url,
                params=body,
                headers=headers,
                timeout=timeout
            )
        elif method == 'POST':
            response = requests.post(
                url,
                json=body,
                headers=headers,
                timeout=timeout
            )
        elif method == 'PUT':
            response = requests.put(
                url,
                json=body,
                headers=headers,
                timeout=timeout
            )
        elif method == 'DELETE':
            response = requests.delete(
                url,
                headers=headers,
                timeout=timeout
            )
        elif method == 'PATCH':
            response = requests.patch(
                url,
                json=body,
                headers=headers,
                timeout=timeout
            )
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        return response
    
    def _parse_response(self, response: requests.Response) -> Any:
        """Parse response body"""
        try:
            # Try to parse as JSON
            return response.json()
        except json.JSONDecodeError:
            # Return as text if not JSON
            return {'text': response.text}
    
    def _resolve_placeholders(self, data: Any, inputs: Dict[str, Any]) -> Any:
        """
        Resolve {{placeholder}} syntax in data
        
        Example: "{{node_1.output}}" -> actual value from node_1
        """
        if isinstance(data, dict):
            return {k: self._resolve_placeholders(v, inputs) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._resolve_placeholders(item, inputs) for item in data]
        elif isinstance(data, str):
            # Find all {{placeholder}} patterns
            import re
            pattern = r'\{\{([^}]+)\}\}'
            matches = re.findall(pattern, data)
            
            if not matches:
                return data
            
            # If entire string is a placeholder, return the value directly
            if data.strip() == f"{{{{{matches[0]}}}}}":
                return self._get_nested_value(inputs, matches[0].strip())
            
            # Otherwise, replace all placeholders in the string
            result = data
            for match in matches:
                value = self._get_nested_value(inputs, match.strip())
                result = result.replace(f"{{{{{match}}}}}", str(value))
            
            return result
        else:
            return data
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """
        Get nested value from dict using dot notation
        
        Example: "node_1.output.status" -> data['node_1']['output']['status']
        """
        keys = path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            else:
                return None
        
        return current
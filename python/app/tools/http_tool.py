"""
HTTP Tool
Responsibility: Make HTTP requests to external APIs
- Supports GET, POST, PUT, DELETE
- Handles authentication (API keys, Bearer tokens)
- JSON request/response handling
- Timeout and error handling
"""

from typing import Any, Dict
import time
import requests
from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext


class HTTPTool(BaseTool):
    """
    HTTP request tool for calling external APIs
    
    Configuration:
        url: str - The URL to call
        method: str - HTTP method (GET, POST, PUT, DELETE)
        headers: dict - Request headers (optional)
        body: dict - Request body for POST/PUT (optional)
        auth_type: str - Authentication type: 'bearer', 'api_key', 'basic' (optional)
        auth_value: str - Authentication value (optional)
        timeout: int - Request timeout in seconds (default: 30)
    """
    
    def __init__(self):
        """Initialize HTTP tool"""
        super().__init__()
        self.default_timeout = 30
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Dict[str, Any]:
        """
        Execute HTTP request
        
        Args:
            node_id: Node being executed
            config: Node configuration
            inputs: Data from parent nodes
            context: Execution context
            
        Returns:
            HTTP response data
        """
        try:
            # Validate configuration
            self.validate_config(config)
            
            # Extract config
            url = config.get("url")
            method = config.get("method", "GET").upper()
            headers = config.get("headers", {})
            body = config.get("body", {})
            timeout = config.get("timeout", self.default_timeout)
            
            # Add authentication if specified
            headers = self._add_authentication(headers, config)
            
            # Replace placeholders in URL and body with input data
            url = self._replace_placeholders(url, inputs)
            body = self._replace_placeholders_dict(body, inputs)
            
            # Make request
            start_time = time.time()
            response = self._make_request(method, url, headers, body, timeout)
            execution_time = time.time() - start_time
            
            # Parse response
            response_data = self._parse_response(response)
            
            # Return structured response
            return {
                "type": "http_response",
                "status_code": response.status_code,
                "data": response_data,
                "headers": dict(response.headers),
                "metadata": {
                    "url": url,
                    "method": method,
                    "execution_time": execution_time,
                    "success": response.ok
                }
            }
            
        except Exception as e:
            raise ToolExecutionError(
                tool_name=self.tool_name,
                node_id=node_id,
                message=str(e)
            )
    
    def validate_config(self, config: Dict[str, Any]) -> None:
        """Validate HTTP configuration"""
        if "url" not in config or not config["url"]:
            raise ValueError("HTTP node requires 'url' in config")
        
        method = config.get("method", "GET").upper()
        if method not in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
            raise ValueError(f"Invalid HTTP method: {method}")
    
    def _add_authentication(
        self, 
        headers: Dict[str, str], 
        config: Dict[str, Any]
    ) -> Dict[str, str]:
        """Add authentication to headers"""
        auth_type = config.get("auth_type", "").lower()
        auth_value = config.get("auth_value", "")
        
        if not auth_type or not auth_value:
            return headers
        
        headers = headers.copy()
        
        if auth_type == "bearer":
            headers["Authorization"] = f"Bearer {auth_value}"
        elif auth_type == "api_key":
            headers["Authorization"] = auth_value
        elif auth_type == "basic":
            import base64
            encoded = base64.b64encode(auth_value.encode()).decode()
            headers["Authorization"] = f"Basic {encoded}"
        
        return headers
    
    def _replace_placeholders(self, text: str, inputs: Dict[str, Any]) -> str:
        """Replace {{nodeId.field}} placeholders with actual values"""
        if not isinstance(text, str):
            return text
        
        for node_id, data in inputs.items():
            if isinstance(data, dict):
                for key, value in data.items():
                    placeholder = f"{{{{{node_id}.{key}}}}}"
                    if placeholder in text:
                        text = text.replace(placeholder, str(value))
        
        return text
    
    def _replace_placeholders_dict(
        self, 
        data: Dict[str, Any], 
        inputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Replace placeholders in dictionary values"""
        if not isinstance(data, dict):
            return data
        
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = self._replace_placeholders(value, inputs)
            elif isinstance(value, dict):
                result[key] = self._replace_placeholders_dict(value, inputs)
            else:
                result[key] = value
        
        return result
    
    def _make_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        body: Dict[str, Any],
        timeout: int
    ) -> requests.Response:
        """Make the actual HTTP request"""
        # Ensure Content-Type is set for POST/PUT
        if method in ["POST", "PUT", "PATCH"] and body:
            if "Content-Type" not in headers:
                headers["Content-Type"] = "application/json"
        
        # Make request
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=body, timeout=timeout)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=body, timeout=timeout)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=timeout)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=body, timeout=timeout)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        # Raise exception for 4xx/5xx status codes
        response.raise_for_status()
        
        return response
    
    def _parse_response(self, response: requests.Response) -> Any:
        """Parse response body"""
        content_type = response.headers.get("Content-Type", "")
        
        if "application/json" in content_type:
            try:
                return response.json()
            except:
                return {"text": response.text}
        else:
            return {"text": response.text}
    
    def __repr__(self) -> str:
        return "HTTPTool()"
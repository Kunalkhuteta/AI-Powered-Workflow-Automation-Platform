"""
Transform Tool - JSON/Data Manipulation (Enhanced)
Extract, transform, and manipulate JSON data with placeholder support
"""

from app.tools.base import BaseTool
from app.core.context import ExecutionContext
from typing import Any, Dict, List
import json
import re


class TransformTool(BaseTool):
    """
    Transform tool for JSON/data manipulation
    
    Operations:
    - extract: Extract specific fields from JSON
    - map: Rename/remap fields
    - filter: Filter array items
    - merge: Merge multiple objects
    - stringify: Convert to JSON string
    - parse: Parse JSON string
    """
    
    def __init__(self):
        super().__init__()
        self.tool_name = "TransformTool"
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        """
        Execute data transformation
        
        Args:
            node_id: Current node ID
            config: Transform configuration
            inputs: Input data from previous nodes
            context: Execution context
        
        Returns:
            Transformed data
        """
        print(f"🔵 Transform [{node_id}]: Starting")
        print(f"🔵 Available inputs: {list(inputs.keys())}")
        
        try:
            operation = config.get('operation', 'extract')
            
            # Get input data with placeholder support
            input_data = self._get_input_data(config, inputs)
            
            print(f"🔵 Transform: operation={operation}, input_type={type(input_data).__name__}")
            
            # Execute operation
            if operation == 'extract':
                result = self._extract(input_data, config.get('fields', []))
            
            elif operation == 'map':
                result = self._map_fields(input_data, config.get('mapping', {}))
            
            elif operation == 'filter':
                result = self._filter(input_data, config.get('condition', {}))
            
            elif operation == 'merge':
                result = self._merge(input_data)
            
            elif operation == 'stringify':
                result = json.dumps(input_data, indent=2)
            
            elif operation == 'parse':
                result = json.loads(input_data) if isinstance(input_data, str) else input_data
            
            else:
                result = input_data
            
            response = {
                'result': result,
                'operation': operation,
                'input_type': type(input_data).__name__,
                'output_type': type(result).__name__
            }
            
            print(f"✅ Transform: Completed - output_type={type(result).__name__}")
            return response
            
        except Exception as e:
            print(f"❌ Transform error: {e}")
            raise Exception(f"Transform failed: {str(e)}")
    
    def _get_input_data(self, config: Dict, inputs: Dict) -> Any:
        """Get input data from config or resolve from inputs"""
        
        # Direct data in config
        if 'data' in config:
            return config['data']
        
        # Resolve from specific source node
        if 'source_node' in config:
            source = config['source_node']
            # Handle {{node_id}} pattern
            if source.startswith('{{') and source.endswith('}}'):
                source = source[2:-2].strip()
            
            if source in inputs:
                return inputs[source]
            else:
                print(f"⚠️  Source node '{source}' not found")
                return {}
        
        # Use all inputs
        return inputs
    
    def _extract(self, data: Any, fields: List[str]) -> Dict[str, Any]:
        """Extract specific fields from data with nested support"""
        
        if not isinstance(data, dict):
            print(f"⚠️  Extract requires dict input, got {type(data).__name__}")
            return {}
        
        result = {}
        for field in fields:
            # Support nested fields: "user.name"
            if '.' in field:
                parts = field.split('.')
                value = data
                for part in parts:
                    if isinstance(value, dict):
                        value = value.get(part)
                    else:
                        value = None
                        break
                if value is not None:
                    result[field] = value
            else:
                # Simple field
                if field in data:
                    result[field] = data[field]
        
        return result
    
    def _map_fields(self, data: Any, mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Rename/remap fields
        
        Example mapping: {"new_name": "old_name"}
        """
        if not isinstance(data, dict):
            return data
        
        result = {}
        for new_key, old_key in mapping.items():
            if old_key in data:
                result[new_key] = data[old_key]
        
        return result
    
    def _filter(self, data: Any, condition: Dict) -> List:
        """Filter array items based on condition"""
        
        if not isinstance(data, list):
            print(f"⚠️  Filter requires list input")
            return []
        
        field = condition.get('field')
        operator = condition.get('operator', '==')
        value = condition.get('value')
        
        result = []
        for item in data:
            if isinstance(item, dict) and field in item:
                if self._check_condition(item[field], operator, value):
                    result.append(item)
        
        return result
    
    def _check_condition(self, left: Any, operator: str, right: Any) -> bool:
        """Check if condition is met (simplified)"""
        try:
            if operator == '==':
                return str(left) == str(right)
            elif operator == '>':
                return float(left) > float(right)
            elif operator == '<':
                return float(left) < float(right)
            else:
                return False
        except:
            return False
    
    def _merge(self, data: Any) -> Dict:
        """Merge multiple dictionaries"""
        
        result = {}
        
        if isinstance(data, dict):
            # Merge all values if they're dicts
            for value in data.values():
                if isinstance(value, dict):
                    result.update(value)
        elif isinstance(data, list):
            # Merge all items if they're dicts
            for item in data:
                if isinstance(item, dict):
                    result.update(item)
        
        return result
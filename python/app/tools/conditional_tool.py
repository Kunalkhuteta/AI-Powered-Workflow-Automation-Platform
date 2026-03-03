"""
Conditional Tool - If/Else Logic with Smart Branching
Enables branching logic in workflows based on conditions
"""

from app.tools.base import BaseTool
from app.core.context import ExecutionContext
from typing import Any, Dict
import re


class ConditionalTool(BaseTool):
    """
    Conditional tool for if/else logic in workflows
    
    Config:
        left_value: value or {{placeholder}} to compare
        operator: comparison operator (==, !=, >, <, >=, <=, contains, etc.)
        right_value: value to compare against
        true_output: data to output if condition is true
        false_output: data to output if condition is false
    """
    
    def __init__(self):
        super().__init__()
        self.tool_name = "ConditionalTool"
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        """
        Execute conditional logic with placeholder resolution
        
        Args:
            node_id: ID of current node
            config: Node configuration
            inputs: Outputs from previous nodes
            context: Execution context
        
        Returns:
            Conditional result with branch taken
        """
        print(f"🔵 Conditional [{node_id}]: Starting")
        print(f"🔵 Available inputs: {list(inputs.keys())}")
        
        try:
            # Extract and resolve configuration values
            left_value = self._resolve_value(config.get('left_value', ''), inputs, context)
            operator = config.get('operator', '==')
            right_value = self._resolve_value(config.get('right_value', ''), inputs, context)
            
            print(f"🔵 Conditional: left='{left_value}', op='{operator}', right='{right_value}'")
            
            # Evaluate condition
            result = self._evaluate_condition(left_value, operator, right_value)
            
            print(f"🔵 Conditional: result={result}")
            
            # Get output based on result
            if result:
                output_data = config.get('true_output', {'result': True})
                branch = 'true'
            else:
                output_data = config.get('false_output', {'result': False})
                branch = 'false'
            
            # Store which branch to take in context
            context.set_node_output(f"{node_id}_branch", branch)
            
            response = {
                'condition_result': result,
                'branch_taken': branch,
                'output': output_data,
                'evaluation': {
                    'left': left_value,
                    'operator': operator,
                    'right': right_value,
                    'result': result
                },
                '__conditional_branch': branch  # Special flag for executor
            }
            
            print(f"✅ Conditional: Completed - branch={branch}")
            return response
            
        except Exception as e:
            print(f"❌ Conditional error: {e}")
            raise Exception(f"Conditional evaluation failed: {str(e)}")
    
    def _resolve_value(self, value: Any, inputs: Dict[str, Any], context: ExecutionContext) -> Any:
        """
        Resolve {{placeholder}} from inputs or context
        
        Supports:
        - {{node_id.field}} - Access node output field
        - {{node_id.field.nested}} - Nested access
        - Regular values - Return as-is
        
        Examples:
        - {{node_1.text}} → inputs['node_1']['text']
        - {{node_2.result.amount}} → inputs['node_2']['result']['amount']
        - "success" → "success" (no resolution needed)
        """
        if not isinstance(value, str):
            return value
        
        # Check if it's a placeholder pattern
        if '{{' not in value:
            return value
        
        # Find all {{...}} patterns
        pattern = r'\{\{([^}]+)\}\}'
        matches = re.findall(pattern, value)
        
        if not matches:
            return value
        
        # If entire value is ONE placeholder, return resolved value directly
        if value.strip() == f"{{{{{matches[0]}}}}}":
            resolved = self._get_nested_value(inputs, matches[0].strip())
            print(f"✅ Resolved {value} → {resolved}")
            return resolved
        
        # If value contains multiple placeholders or text, replace all
        result = value
        for match in matches:
            resolved = self._get_nested_value(inputs, match.strip())
            result = result.replace(f"{{{{{match}}}}}", str(resolved) if resolved is not None else '')
        
        print(f"✅ Resolved {value} → {result}")
        return result
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """
        Get nested value using dot notation
        
        Examples:
        - "node_1" → data['node_1']
        - "node_1.text" → data['node_1']['text']
        - "node_2.result.amount" → data['node_2']['result']['amount']
        """
        parts = path.split('.')
        current = data
        
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
                if current is None:
                    print(f"⚠️  Path '{path}' not found at '{part}'")
                    return None
            else:
                print(f"⚠️  Path '{path}' - '{part}' is not a dict")
                return None
        
        return current
    
    def _evaluate_condition(self, left: Any, operator: str, right: Any) -> bool:
        """Evaluate condition based on operator"""
        
        try:
            # Handle None values
            if left is None:
                left = ''
            if right is None:
                right = ''
            
            # Convert to strings for string operations
            left_str = str(left).lower()
            right_str = str(right).lower()
            
            if operator == '==':
                return left_str == right_str
            
            elif operator == '!=':
                return left_str != right_str
            
            elif operator == '>':
                try:
                    return float(left) > float(right)
                except (ValueError, TypeError):
                    return False
            
            elif operator == '<':
                try:
                    return float(left) < float(right)
                except (ValueError, TypeError):
                    return False
            
            elif operator == '>=':
                try:
                    return float(left) >= float(right)
                except (ValueError, TypeError):
                    return False
            
            elif operator == '<=':
                try:
                    return float(left) <= float(right)
                except (ValueError, TypeError):
                    return False
            
            elif operator == 'contains':
                return right_str in left_str
            
            elif operator == 'not_contains':
                return right_str not in left_str
            
            elif operator == 'starts_with':
                return left_str.startswith(right_str)
            
            elif operator == 'ends_with':
                return left_str.endswith(right_str)
            
            elif operator == 'is_empty':
                return left == '' or left == [] or left == {} or left is None
            
            elif operator == 'is_not_empty':
                return left != '' and left != [] and left != {} and left is not None
            
            else:
                raise ValueError(f"Unsupported operator: {operator}")
                
        except Exception as e:
            print(f"❌ Evaluation error: {e}")
            return False
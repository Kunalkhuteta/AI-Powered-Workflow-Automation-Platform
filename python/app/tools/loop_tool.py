"""
Loop Tool - Iterate over arrays, process lists, batch operations
Supports: forEach, for, while, map loop types
"""

from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext
from typing import Any, Dict, List
import re
import json
import copy


class LoopTool(BaseTool):
    """
    Loop tool for iterating over data in workflows
    
    Loop Types:
    - forEach: Iterate over each item in an array
    - for: Fixed number of iterations (start, end, step)
    - while: Loop until condition is false
    - map: Transform each item and collect results
    
    Config:
        loop_type: Type of loop (forEach, for, while, map)
        source_array: {{node_id.field}} reference to array data
        variable_name: Name for current item variable (default: 'item')
        max_iterations: Safety limit (default: 100)
        batch_size: Process N items at once (default: 1)
        condition: While loop condition expression
        start/end/step: For loop range parameters
        continue_on_error: Skip failed items (default: false)
        collect_results: Collect outputs into array (default: true)
    """
    
    def __init__(self):
        super().__init__()
        self.tool_name = "LoopTool"
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        """Execute loop logic"""
        print(f"🔁 Loop [{node_id}]: Starting")
        print(f"🔁 Available inputs: {list(inputs.keys())}")
        
        try:
            loop_type = config.get('loop_type', 'forEach')
            max_iterations = config.get('max_iterations', 100)
            batch_size = config.get('batch_size', 1)
            variable_name = config.get('variable_name', 'item')
            continue_on_error = config.get('continue_on_error', False)
            collect_results = config.get('collect_results', True)
            
            print(f"🔁 Loop type: {loop_type}, max_iter: {max_iterations}, batch: {batch_size}")
            
            if loop_type == 'forEach':
                result = self._execute_for_each(
                    config, inputs, context, node_id,
                    max_iterations, batch_size, variable_name,
                    continue_on_error, collect_results
                )
            elif loop_type == 'for':
                result = self._execute_for_range(
                    config, inputs, context, node_id,
                    max_iterations, variable_name,
                    continue_on_error, collect_results
                )
            elif loop_type == 'while':
                result = self._execute_while(
                    config, inputs, context, node_id,
                    max_iterations, variable_name,
                    continue_on_error, collect_results
                )
            elif loop_type == 'map':
                result = self._execute_map(
                    config, inputs, context, node_id,
                    max_iterations, batch_size, variable_name,
                    continue_on_error
                )
            else:
                raise ValueError(f"Unknown loop type: {loop_type}")
            
            print(f"✅ Loop [{node_id}]: Completed - {result['iterations_completed']} iterations")
            return result
            
        except Exception as e:
            print(f"❌ Loop error: {e}")
            raise ToolExecutionError(
                tool_name=self.tool_name,
                node_id=node_id,
                message=str(e)
            )
    
    def _resolve_source_array(self, config: Dict, inputs: Dict, context: ExecutionContext) -> List:
        """Resolve the source array from config placeholder or inputs"""
        source = config.get('source_array', '')
        
        if not source:
            # Try to use first input that is a list
            for key, value in inputs.items():
                if isinstance(value, list):
                    print(f"🔁 Auto-detected array from input '{key}' ({len(value)} items)")
                    return value
                elif isinstance(value, dict):
                    # Check if output contains a list
                    if 'result' in value and isinstance(value['result'], list):
                        return value['result']
                    if 'output' in value and isinstance(value['output'], list):
                        return value['output']
                    if 'items' in value and isinstance(value['items'], list):
                        return value['items']
                    if 'data' in value and isinstance(value['data'], list):
                        return value['data']
            return []
        
        # Resolve {{node_id.field}} placeholder
        resolved = self._resolve_placeholder(source, inputs, context)
        
        if isinstance(resolved, list):
            return resolved
        elif isinstance(resolved, dict):
            # Try common array fields
            for field in ['result', 'output', 'items', 'data', 'rows']:
                if field in resolved and isinstance(resolved[field], list):
                    return resolved[field]
            # Return dict values as list
            return list(resolved.values())
        elif isinstance(resolved, str):
            # Try to parse as JSON array
            try:
                parsed = json.loads(resolved)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
            # Split by comma as last resort
            return [item.strip() for item in resolved.split(',') if item.strip()]
        
        return []
    
    def _resolve_placeholder(self, value: Any, inputs: Dict, context: ExecutionContext) -> Any:
        """Resolve {{node_id.field}} placeholders"""
        if not isinstance(value, str):
            return value
        
        if '{{' not in value:
            return value
        
        pattern = r'\{\{([^}]+)\}\}'
        matches = re.findall(pattern, value)
        
        if not matches:
            return value
        
        # Single placeholder — return resolved value directly
        if value.strip() == f"{{{{{matches[0]}}}}}":
            return self._get_nested_value(inputs, matches[0].strip())
        
        # Multiple placeholders — string substitution
        result = value
        for match in matches:
            resolved = self._get_nested_value(inputs, match.strip())
            result = result.replace(f"{{{{{match}}}}}", str(resolved) if resolved is not None else '')
        
        return result
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """Get nested value using dot notation: node_1.output.field"""
        parts = path.split('.')
        current = data
        
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
                if current is None:
                    return None
            elif isinstance(current, list):
                try:
                    current = current[int(part)]
                except (ValueError, IndexError):
                    return None
            else:
                return None
        
        return current
    
    def _execute_for_each(
        self, config, inputs, context, node_id,
        max_iterations, batch_size, variable_name,
        continue_on_error, collect_results
    ) -> Dict:
        """Execute forEach loop over array items"""
        source_array = self._resolve_source_array(config, inputs, context)
        total_items = len(source_array)
        
        print(f"🔁 forEach: {total_items} items, batch_size={batch_size}")
        
        results = []
        errors = []
        iterations = 0
        
        # Process in batches
        for i in range(0, total_items, batch_size):
            if iterations >= max_iterations:
                print(f"⚠️ Max iterations ({max_iterations}) reached")
                break
            
            batch = source_array[i:i + batch_size]
            
            try:
                if batch_size == 1:
                    item = batch[0]
                else:
                    item = batch
                
                # Store current item in context for downstream nodes
                loop_state = {
                    'index': i,
                    'item': item,
                    'is_first': i == 0,
                    'is_last': i + batch_size >= total_items,
                    'total': total_items,
                    'batch_index': i // batch_size,
                    variable_name: item,
                }
                context.set_node_output(f"{node_id}_loop", loop_state)
                
                if collect_results:
                    results.append({
                        'index': i,
                        'item': item,
                        'processed': True,
                    })
                
            except Exception as e:
                error_info = {'index': i, 'error': str(e)}
                errors.append(error_info)
                if not continue_on_error:
                    raise
            
            iterations += 1
        
        return {
            'type': 'loop_result',
            'loop_type': 'forEach',
            'iterations_completed': iterations,
            'total_items': total_items,
            'results': results,
            'output': source_array,  # Alias for compatibility
            'result': source_array,  # Alias for compatibility
            'errors': errors,
            'items': source_array,
            'has_errors': len(errors) > 0,
        }
    
    def _execute_for_range(
        self, config, inputs, context, node_id,
        max_iterations, variable_name,
        continue_on_error, collect_results
    ) -> Dict:
        """Execute for loop with start/end/step"""
        start = config.get('start', 0)
        end = config.get('end', 10)
        step = config.get('step', 1)
        
        if step <= 0:
            step = 1
        
        print(f"🔁 for: range({start}, {end}, {step})")
        
        results = []
        errors = []
        iterations = 0
        
        i = start
        while i < end:
            if iterations >= max_iterations:
                print(f"⚠️ Max iterations ({max_iterations}) reached")
                break
            
            try:
                loop_state = {
                    'index': iterations,
                    'value': i,
                    'is_first': i == start,
                    'is_last': i + step >= end,
                    variable_name: i,
                }
                context.set_node_output(f"{node_id}_loop", loop_state)
                
                if collect_results:
                    results.append({
                        'index': iterations,
                        'value': i,
                        'processed': True,
                    })
                
            except Exception as e:
                errors.append({'index': iterations, 'value': i, 'error': str(e)})
                if not continue_on_error:
                    raise
            
            i += step
            iterations += 1
        
        return {
            'type': 'loop_result',
            'loop_type': 'for',
            'iterations_completed': iterations,
            'total_items': iterations,
            'start': start,
            'end': end,
            'step': step,
            'results': results,
            'output': [r['value'] for r in results], # Alias for compatibility
            'result': [r['value'] for r in results], # Alias for compatibility
            'errors': errors,
            'has_errors': len(errors) > 0,
        }
    
    def _execute_while(
        self, config, inputs, context, node_id,
        max_iterations, variable_name,
        continue_on_error, collect_results
    ) -> Dict:
        """Execute while loop until condition is false"""
        condition_expr = config.get('condition', '')
        
        print(f"🔁 while: condition='{condition_expr}'")
        
        results = []
        errors = []
        iterations = 0
        
        while iterations < max_iterations:
            try:
                # Evaluate condition
                loop_vars = {
                    'index': iterations,
                    'iteration': iterations,
                    variable_name: iterations,
                }
                
                # Simple condition evaluation
                condition_met = self._evaluate_while_condition(
                    condition_expr, loop_vars, inputs, context, node_id
                )
                
                if not condition_met:
                    print(f"🔁 While condition false at iteration {iterations}")
                    break
                
                loop_state = {
                    'index': iterations,
                    'iteration': iterations,
                    variable_name: iterations,
                }
                context.set_node_output(f"{node_id}_loop", loop_state)
                
                if collect_results:
                    results.append({
                        'index': iterations,
                        'processed': True,
                    })
                
            except Exception as e:
                errors.append({'index': iterations, 'error': str(e)})
                if not continue_on_error:
                    raise
            
            iterations += 1
        
        return {
            'type': 'loop_result',
            'loop_type': 'while',
            'iterations_completed': iterations,
            'total_items': iterations,
            'condition': condition_expr,
            'results': results,
            'output': results, # Alias for compatibility
            'result': results, # Alias for compatibility
            'errors': errors,
            'has_errors': len(errors) > 0,
        }
    
    def _execute_map(
        self, config, inputs, context, node_id,
        max_iterations, batch_size, variable_name,
        continue_on_error
    ) -> Dict:
        """Execute map loop, transforming each item"""
        source_array = self._resolve_source_array(config, inputs, context)
        total_items = len(source_array)
        
        print(f"🔁 map: {total_items} items")
        
        mapped_results = []
        errors = []
        iterations = 0
        
        for i, item in enumerate(source_array):
            if iterations >= max_iterations:
                break
            
            try:
                loop_state = {
                    'index': i,
                    'item': item,
                    'is_first': i == 0,
                    'is_last': i == total_items - 1,
                    'total': total_items,
                    variable_name: item,
                }
                context.set_node_output(f"{node_id}_loop", loop_state)
                
                # For map, collect the transformed items
                mapped_results.append(item)
                
            except Exception as e:
                errors.append({'index': i, 'error': str(e)})
                if not continue_on_error:
                    raise
                mapped_results.append(None)
            
            iterations += 1
        
        return {
            'type': 'loop_result',
            'loop_type': 'map',
            'iterations_completed': iterations,
            'total_items': total_items,
            'results': mapped_results,
            'items': mapped_results,
            'errors': errors,
            'has_errors': len(errors) > 0,
        }
    
    def _evaluate_while_condition(
        self, expr: str, loop_vars: Dict, inputs: Dict,
        context: ExecutionContext, node_id: str
    ) -> bool:
        """Evaluate a while condition expression safely"""
        if not expr:
            return False
        
        # Resolve placeholders
        resolved = expr
        
        # Replace {{loop.index}} style
        for key, value in loop_vars.items():
            resolved = resolved.replace(f"{{{{loop.{key}}}}}", str(value))
            resolved = resolved.replace(f"{{{{{key}}}}}", str(value))
        
        # Resolve {{node_id.field}} placeholders
        pattern = r'\{\{([^}]+)\}\}'
        matches = re.findall(pattern, resolved)
        for match in matches:
            val = self._get_nested_value(inputs, match.strip())
            resolved = resolved.replace(f"{{{{{match}}}}}", str(val) if val is not None else '0')
        
        # Safe evaluation of simple math/comparison expressions
        try:
            # Only allow safe characters
            safe_chars = set('0123456789.+-*/<>=! andornotTrueFalse ')
            test_str = resolved.replace('<=', ' ').replace('>=', ' ').replace('==', ' ').replace('!=', ' ')
            
            if all(c in safe_chars for c in test_str):
                result = eval(resolved, {"__builtins__": {}}, {})
                return bool(result)
            else:
                print(f"⚠️ Unsafe condition expression: {resolved}")
                return False
        except Exception as e:
            print(f"⚠️ Condition evaluation error: {e}")
            return False
    
    def validate_config(self, config: Dict[str, Any]) -> None:
        """Validate loop configuration"""
        loop_type = config.get('loop_type', 'forEach')
        if loop_type not in ['forEach', 'for', 'while', 'map']:
            raise ValueError(f"Invalid loop_type: {loop_type}")

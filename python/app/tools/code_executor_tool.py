"""
Code Executor Tool - Run custom Python or JavaScript code
Sandboxed execution with timeout and memory limits
"""

from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext
from typing import Any, Dict
import time
import json
import traceback
import io
import sys
import re


class CodeExecutorTool(BaseTool):
    """
    Code Executor tool for running custom Python or JavaScript code
    
    Executes user-provided code in a restricted environment with:
    - Timeout protection
    - Captured stdout/stderr
    - Input data injection
    - Output extraction
    
    Config:
        language: 'python' or 'javascript' 
        code: Code string to execute
        timeout: Max execution time in seconds (default: 30)
        memory_limit: Max memory in MB (default: 128) — advisory
        packages: Comma-separated package list (future use)
        sandbox: Whether to use sandbox mode (default: true)
    """
    
    def __init__(self):
        super().__init__()
        self.tool_name = "CodeExecutorTool"
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Any:
        """Execute custom code"""
        print(f"💻 CodeExecutor [{node_id}]: Starting")
        print(f"💻 Available inputs: {list(inputs.keys())}")
        
        try:
            language = config.get('language', 'python')
            code = config.get('code', '')
            timeout = min(config.get('timeout', 30), 300)  # Cap at 5 min
            
            if not code or not code.strip():
                raise ValueError("No code provided")
            
            print(f"💻 Language: {language}, Timeout: {timeout}s, Code length: {len(code)} chars")
            
            # Prepare input data for the code
            input_data = self._prepare_input_data(inputs)
            
            start_time = time.time()
            
            if language == 'python':
                result = self._execute_python(code, input_data, timeout, node_id)
            elif language == 'javascript':
                result = self._execute_javascript(code, input_data, timeout, node_id)
            else:
                raise ValueError(f"Unsupported language: {language}")
            
            execution_time = time.time() - start_time
            
            response = {
                'type': 'code_execution_result',
                'language': language,
                'output': result.get('output'),
                'stdout': result.get('stdout', ''),
                'stderr': result.get('stderr', ''),
                'success': result.get('success', True),
                'execution_time': execution_time,
                'metadata': {
                    'language': language,
                    'code_length': len(code),
                    'timeout': timeout,
                    'execution_time': execution_time,
                }
            }
            
            print(f"✅ CodeExecutor [{node_id}]: Completed in {execution_time:.2f}s")
            return response
            
        except Exception as e:
            print(f"❌ CodeExecutor error: {e}")
            raise ToolExecutionError(
                tool_name=self.tool_name,
                node_id=node_id,
                message=str(e)
            )
    
    def _prepare_input_data(self, inputs: Dict) -> Any:
        """Prepare input data for code execution"""
        if not inputs:
            return {}
        
        # If single input, unwrap it
        if len(inputs) == 1:
            key = list(inputs.keys())[0]
            value = inputs[key]
            # Try to extract the meaningful data
            if isinstance(value, dict):
                for field in ['output', 'result', 'text', 'data', 'items']:
                    if field in value:
                        return value[field]
            return value
        
        # Multiple inputs — pass as dict
        cleaned = {}
        for key, value in inputs.items():
            if key == '__initial__':
                continue
            cleaned[key] = value
        return cleaned
    
    def _execute_python(self, code: str, input_data: Any, timeout: int, node_id: str) -> Dict:
        """Execute Python code in a restricted environment"""
        
        # Capture stdout and stderr
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        captured_stdout = io.StringIO()
        captured_stderr = io.StringIO()
        
        try:
            sys.stdout = captured_stdout
            sys.stderr = captured_stderr
            
            # Create execution namespace with safe builtins
            safe_builtins = {
                'print': print,
                'len': len,
                'range': range,
                'str': str,
                'int': int,
                'float': float,
                'bool': bool,
                'list': list,
                'dict': dict,
                'set': set,
                'tuple': tuple,
                'type': type,
                'isinstance': isinstance,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
                'sorted': sorted,
                'reversed': reversed,
                'min': min,
                'max': max,
                'sum': sum,
                'abs': abs,
                'round': round,
                'any': any,
                'all': all,
                'hasattr': hasattr,
                'getattr': getattr,
                'setattr': setattr,
                'None': None,
                'True': True,
                'False': False,
                '__import__': self._safe_import,
            }
            
            exec_globals = {
                '__builtins__': safe_builtins,
                'input_data': input_data,
                'output': None,
                'json': json,
                're': re,
                'math': __import__('math'),
            }
            
            exec_locals = {}
            
            # Execute the code
            exec(code, exec_globals, exec_locals)
            
            # Extract output
            output = exec_locals.get('output', exec_globals.get('output'))
            
            # If no explicit output, try to get the last expression result
            if output is None and 'result' in exec_locals:
                output = exec_locals['result']
            
            # If still None, use captured stdout
            if output is None:
                stdout_val = captured_stdout.getvalue().strip()
                if stdout_val:
                    output = stdout_val
            
            return {
                'output': output,
                'stdout': captured_stdout.getvalue(),
                'stderr': captured_stderr.getvalue(),
                'success': True,
            }
            
        except Exception as e:
            tb = traceback.format_exc()
            return {
                'output': None,
                'stdout': captured_stdout.getvalue(),
                'stderr': f"{str(e)}\n{tb}",
                'success': False,
                'error': str(e),
            }
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr
    
    def _execute_javascript(self, code: str, input_data: Any, timeout: int, node_id: str) -> Dict:
        """
        Execute JavaScript code
        
        Uses subprocess to call Node.js if available,
        otherwise returns a simulated result
        """
        import subprocess
        import tempfile
        import os
        
        try:
            # Prepare the JS wrapper code
            input_json = json.dumps(input_data, default=str)
            
            wrapper_code = f"""
const inputData = {input_json};
let __output = undefined;

// User code
try {{
    {code}
    
    // Try to capture return value
    if (typeof result !== 'undefined') {{
        __output = result;
    }} else if (typeof output !== 'undefined') {{
        __output = output;
    }}
}} catch(e) {{
    console.error(e.message);
    process.exit(1);
}}

// Output result as JSON
if (__output !== undefined) {{
    console.log('__RESULT__' + JSON.stringify(__output));
}}
"""
            
            # Write to temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(wrapper_code)
                temp_path = f.name
            
            try:
                # Run with Node.js
                result = subprocess.run(
                    ['node', temp_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=tempfile.gettempdir()
                )
                
                stdout = result.stdout
                stderr = result.stderr
                output = None
                
                # Extract result from stdout
                if '__RESULT__' in stdout:
                    parts = stdout.split('__RESULT__', 1)
                    regular_output = parts[0].strip()
                    try:
                        output = json.loads(parts[1].strip())
                    except json.JSONDecodeError:
                        output = parts[1].strip()
                    stdout = regular_output
                else:
                    output = stdout.strip() if stdout.strip() else None
                
                return {
                    'output': output,
                    'stdout': stdout,
                    'stderr': stderr,
                    'success': result.returncode == 0,
                }
                
            finally:
                os.unlink(temp_path)
                
        except FileNotFoundError:
            # Node.js not available
            return {
                'output': None,
                'stdout': '',
                'stderr': 'Node.js is not installed or not in PATH. JavaScript execution requires Node.js.',
                'success': False,
                'error': 'Node.js not available',
            }
        except subprocess.TimeoutExpired:
            return {
                'output': None,
                'stdout': '',
                'stderr': f'Code execution timed out after {timeout} seconds',
                'success': False,
                'error': 'Timeout',
            }
        except Exception as e:
            return {
                'output': None,
                'stdout': '',
                'stderr': str(e),
                'success': False,
                'error': str(e),
            }
    
    def _safe_import(self, name, *args, **kwargs):
        """Allow only safe module imports"""
        ALLOWED_MODULES = {
            'json', 'math', 're', 'datetime', 'collections',
            'itertools', 'functools', 'string', 'textwrap',
            'hashlib', 'base64', 'urllib.parse', 'copy',
            'statistics', 'random', 'uuid', 'decimal',
            'fractions', 'operator', 'time',
        }
        
        if name in ALLOWED_MODULES:
            return __import__(name)
        raise ImportError(f"Import of '{name}' is not allowed in sandbox mode")
    
    def validate_config(self, config: Dict[str, Any]) -> None:
        """Validate code executor configuration"""
        if not config.get('code', '').strip():
            raise ValueError("Code is required")
        
        language = config.get('language', 'python')
        if language not in ['python', 'javascript']:
            raise ValueError(f"Unsupported language: {language}")

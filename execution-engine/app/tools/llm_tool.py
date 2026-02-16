"""
LLM Tool
Responsibility: Execute LLM-based nodes
- Mock implementation for Phase 2
- Structure prepared for Phase 3 (OpenAI, Anthropic, etc.)
- Returns deterministic mock responses for testing
"""

from typing import Any, Dict
import time
from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext


class LLMTool(BaseTool):
    """
    LLM execution tool
    
    Phase 2: Returns mock responses for testing
    Phase 3: Integrate real LLM providers (OpenAI, Anthropic, etc.)
    
    Configuration:
        prompt: str - The prompt to send to LLM
        model: str - Model to use (e.g., "gpt-4", "claude-3")
        temperature: float - Sampling temperature (0-1)
        max_tokens: int - Maximum response tokens
    """
    
    def __init__(self):
        """Initialize LLM tool"""
        super().__init__()
        self.mock_enabled = True  # Phase 2: Always mock
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Dict[str, Any]:
        """
        Execute LLM request
        
        Args:
            node_id: Node being executed
            config: Node configuration with prompt, model, etc.
            inputs: Data from parent nodes
            context: Execution context
            
        Returns:
            LLM response with text and metadata
        """
        try:
            # Validate configuration
            self.validate_config(config)
            
            # Extract config
            prompt = config.get("prompt", "")
            model = config.get("model", "gpt-4")
            temperature = config.get("temperature", 0.7)
            
            # Build full prompt with inputs
            full_prompt = self._build_prompt(prompt, inputs)
            
            # Execute LLM call (mocked for now)
            start_time = time.time()
            response = self._call_llm(full_prompt, model, temperature)
            execution_time = time.time() - start_time
            
            # Return structured response
            return {
                "type": "llm_response",
                "text": response,
                "model": model,
                "prompt": full_prompt,
                "metadata": {
                    "execution_time": execution_time,
                    "input_tokens": len(full_prompt.split()),  # Mock token count
                    "output_tokens": len(response.split()),
                }
            }
            
        except Exception as e:
            raise ToolExecutionError(
                tool_name=self.tool_name,
                node_id=node_id,
                message=str(e)
            )
    
    def validate_config(self, config: Dict[str, Any]) -> None:
        """
        Validate LLM configuration
        
        Args:
            config: Node configuration
            
        Raises:
            ValueError: If configuration is invalid
        """
        if "prompt" not in config or not config["prompt"]:
            raise ValueError("LLM node requires 'prompt' in config")
        
        # Validate temperature if provided
        if "temperature" in config:
            temp = config["temperature"]
            if not isinstance(temp, (int, float)) or temp < 0 or temp > 2:
                raise ValueError("Temperature must be between 0 and 2")
    
    def _build_prompt(self, base_prompt: str, inputs: Dict[str, Any]) -> str:
        """
        Build full prompt by injecting inputs
        
        Supports template variables like {node1.result}
        
        Args:
            base_prompt: Base prompt template
            inputs: Data from parent nodes
            
        Returns:
            Formatted prompt
        """
        # Simple implementation: just concatenate inputs
        # Phase 3: Implement proper template engine
        
        prompt_parts = [base_prompt]
        
        if inputs:
            prompt_parts.append("\n\nContext from previous nodes:")
            for node_id, data in inputs.items():
                if node_id != "__initial__":
                    prompt_parts.append(f"\n{node_id}: {str(data)}")
        
        return "\n".join(prompt_parts)
    
    def _call_llm(self, prompt: str, model: str, temperature: float) -> str:
        """
        Call LLM API (mocked for Phase 2)
        
        Phase 3: Replace with actual API calls
        - OpenAI: openai.ChatCompletion.create()
        - Anthropic: anthropic.messages.create()
        - Add retry logic
        - Add streaming support
        
        Args:
            prompt: Full prompt to send
            model: Model identifier
            temperature: Sampling temperature
            
        Returns:
            LLM response text
        """
        # Phase 2: Return deterministic mock response
        # This allows testing the execution flow
        
        # Simulate API latency
        time.sleep(0.1)
        
        # Generate mock response based on prompt keywords
        if "extract" in prompt.lower():
            return "Mock extraction result: {name: 'John Doe', amount: 1500.00}"
        elif "summarize" in prompt.lower():
            return "Mock summary: This document discusses key points about AI workflows."
        elif "translate" in prompt.lower():
            return "Mock translation: Bonjour, comment allez-vous?"
        elif "analyze" in prompt.lower():
            return "Mock analysis: Sentiment is positive with 85% confidence."
        else:
            return f"Mock LLM response for prompt: '{prompt[:50]}...'"
    
    def __repr__(self) -> str:
        """String representation"""
        mode = "mock" if self.mock_enabled else "live"
        return f"LLMTool(mode={mode})"
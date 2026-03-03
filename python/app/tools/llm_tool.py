"""
LLM Tool - FREE Hugging Face Support
Supports: Hugging Face Router (FREE), Mock mode
Uses OpenAI-compatible interface for Hugging Face
"""

from typing import Any, Dict
import time
import os
from app.tools.base import BaseTool, ToolExecutionError
from app.core.context import ExecutionContext


class LLMTool(BaseTool):
    """
    LLM tool using Hugging Face Router (OpenAI-compatible, FREE)
    
    Environment Variables:
        HUGGINGFACE_API_KEY: FREE API key from huggingface.co
        HUGGINGFACE_MODEL: Model to use (default: MiniMaxAI/MiniMax-M2.5:novita)
        LLM_PROVIDER: "huggingface" (default)
        MOCK_LLM: "true" to use mocks
    """
    
    def __init__(self):
        super().__init__()
        
        self.mock_enabled = os.getenv("MOCK_LLM", "false").lower() == "true"
        self.provider = os.getenv("LLM_PROVIDER", "huggingface").lower()
        
        if not self.mock_enabled:
            if self.provider == "huggingface":
                self._init_huggingface()
            else:
                print(f"⚠️  Unknown provider. Using mock mode.")
                self.mock_enabled = True
    
    def _init_huggingface(self):
        """Initialize Hugging Face Router (OpenAI compatible - FREE)"""
        api_key = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")

        if not api_key:
            print("⚠️  HUGGINGFACE_API_KEY not set. Using mock mode.")
            print("   Get FREE key: https://huggingface.co/settings/tokens")
            self.mock_enabled = True
        else:
            try:
                from openai import OpenAI
                
                self.hf_api_key = api_key
                self.hf_model = os.getenv(
                    "HUGGINGFACE_MODEL",
                    "MiniMaxAI/MiniMax-M2.5:novita"
                )

                self.hf_client = OpenAI(
                    base_url="https://router.huggingface.co/v1",
                    api_key=self.hf_api_key,
                )

                print(f"✅ Hugging Face Router initialized (FREE) - Model: {self.hf_model}")
            except ImportError:
                print("⚠️  openai package not installed. Using mock mode.")
                print("   Install with: pip install openai")
                self.mock_enabled = True
            except Exception as e:
                print(f"⚠️  Hugging Face init failed: {e}. Using mock mode.")
                self.mock_enabled = True
    
    def execute(
        self,
        node_id: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any],
        context: ExecutionContext
    ) -> Dict[str, Any]:
        """Execute LLM request"""
        try:
            self.validate_config(config)
            
            prompt = config.get("prompt", "")
            # ALWAYS use configured HF model (ignore node config for compatibility)
            model = getattr(self, 'hf_model', 'MiniMaxAI/MiniMax-M2.5:novita')
            temperature = config.get("temperature", 0.7)
            max_tokens = config.get("max_tokens", 500)
            
            full_prompt = self._build_prompt(prompt, inputs)
            start_time = time.time()
            
            if self.mock_enabled:
                response_text = self._call_llm_mock(full_prompt)
                input_tokens = len(full_prompt.split())
                output_tokens = len(response_text.split())
            else:
                response_text, input_tokens, output_tokens = self._call_huggingface(
                    full_prompt, model, temperature, max_tokens
                )
            
            execution_time = time.time() - start_time
            
            return {
                "type": "llm_response",
                "text": response_text,
                "model": model,
                "prompt": full_prompt,
                "metadata": {
                    "execution_time": execution_time,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "estimated_cost": 0.0,  # Hugging Face is FREE!
                    "mock_mode": self.mock_enabled,
                    "provider": "huggingface"
                }
            }
            
        except Exception as e:
            raise ToolExecutionError(
                tool_name=self.tool_name,
                node_id=node_id,
                message=str(e)
            )
    
    def validate_config(self, config: Dict[str, Any]) -> None:
        """Validate configuration"""
        if "prompt" not in config or not config["prompt"]:
            raise ValueError("LLM node requires 'prompt' in config")
    
    def _build_prompt(self, base_prompt: str, inputs: Dict[str, Any]) -> str:
        """Build full prompt with inputs"""
        prompt_parts = [base_prompt]
        
        if inputs:
            prompt_parts.append("\n\n### Context from previous nodes:")
            for node_id, data in inputs.items():
                if node_id != "__initial__":
                    if isinstance(data, dict) and "text" in data:
                        prompt_parts.append(f"\n**{node_id}:** {data['text']}")
                    else:
                        prompt_parts.append(f"\n**{node_id}:** {str(data)}")
        
        return "\n".join(prompt_parts)
    
    def _call_huggingface(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> tuple:
        """Call Hugging Face Router (OpenAI compatible)"""

        try:
            completion = self.hf_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            # Extract response text - handle multiple formats
            response_text = ""
            message = completion.choices[0].message
            
            # Try 1: Standard content field
            if hasattr(message, 'content') and message.content:
                response_text = message.content
            
            # Try 2: Reasoning content field (MiniMax model)
            elif hasattr(message, 'reasoning_content') and message.reasoning_content:
                response_text = message.reasoning_content
            
            # Try 3: Text field fallback
            elif hasattr(completion.choices[0], 'text') and completion.choices[0].text:
                response_text = completion.choices[0].text
            
            # Try 4: Reasoning details array
            elif hasattr(message, 'reasoning_details') and message.reasoning_details:
                # Extract text from reasoning details
                texts = [detail.get('text', '') for detail in message.reasoning_details if isinstance(detail, dict)]
                response_text = ' '.join(texts) if texts else ""
            
            # If still empty, log the full response for debugging
            if not response_text:
                print("⚠️  Warning: Empty response from Hugging Face")
                print(f"Message object: {message}")
                response_text = "[No response generated - check model compatibility]"
            else:
                print(f"✅ Got response ({len(response_text)} chars)")

            # Real token usage (if provided)
            usage = completion.usage if hasattr(completion, 'usage') else None
            input_tokens = usage.prompt_tokens if usage else len(prompt.split())
            output_tokens = usage.completion_tokens if usage else len(response_text.split())

            return response_text, input_tokens, output_tokens

        except Exception as e:
            print(f"❌ Hugging Face error: {str(e)}")
            raise Exception(f"Hugging Face Router error: {str(e)}")

    def _call_llm_mock(self, prompt: str) -> str:
        """Mock response for testing"""
        time.sleep(0.1)
        
        prompt_lower = prompt.lower()
        
        if "extract" in prompt_lower and "invoice" in prompt_lower:
            return "Invoice Data: INV-2024-001, Amount: $1,500.00, Vendor: Acme Corp"
        elif "validate" in prompt_lower:
            return "Validation: APPROVED - All fields correct"
        elif "summarize" in prompt_lower:
            return "Summary: Document discusses quarterly performance with 15% growth"
        elif "analyze" in prompt_lower:
            return "Sentiment: POSITIVE (85% confidence)"
        else:
            return f"[Mock Response] Processed: {prompt[:50]}..."
    
    def __repr__(self) -> str:
        mode = "mock" if self.mock_enabled else self.provider
        return f"LLMTool(mode={mode})"
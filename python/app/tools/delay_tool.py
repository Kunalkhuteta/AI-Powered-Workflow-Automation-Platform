"""
Delay Tool - Pause Workflow Execution
Essential for rate limiting, scheduling, and timing control
"""

from app.tools.base import BaseTool
from typing import Any, Dict
import time
from datetime import datetime


class DelayTool(BaseTool):
    """
    Delay tool for pausing workflow execution
    
    Use Cases:
    - Rate limiting API calls
    - Waiting for external processes
    - Scheduling timed actions
    - Polling with intervals
    - Avoiding throttling
    
    Config:
        duration: Wait time (number)
        unit: Time unit ('seconds', 'minutes', 'hours', 'milliseconds')
        reason: Optional description of why waiting
    """
    
    def __init__(self):
        super().__init__()
        self.name = "delay"
        self.description = "Pause workflow execution for a specified duration"
    
    def execute(self, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Execute delay - pause workflow for specified time
        
        Returns:
            Information about the delay including start/end times
        """
        try:
            # Get configuration
            duration = config.get('duration', 1)
            unit = config.get('unit', 'seconds')
            reason = config.get('reason', 'Workflow delay')
            
            # Convert to seconds
            wait_seconds = self._convert_to_seconds(duration, unit)
            
            # Validate duration
            if wait_seconds <= 0:
                raise ValueError("Duration must be positive")
            
            if wait_seconds > 3600:  # 1 hour max
                raise ValueError("Duration cannot exceed 1 hour (3600 seconds)")
            
            # Record start time
            start_time = datetime.utcnow()
            print(f"⏱️  Delay: Waiting {wait_seconds}s - {reason}")
            
            # Execute delay
            time.sleep(wait_seconds)
            
            # Record end time
            end_time = datetime.utcnow()
            actual_duration = (end_time - start_time).total_seconds()
            
            return {
                'delayed': True,
                'duration_seconds': wait_seconds,
                'actual_duration': actual_duration,
                'duration_display': f"{duration} {unit}",
                'reason': reason,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'message': f"Waited {wait_seconds} seconds"
            }
            
        except ValueError as e:
            raise Exception(f"Invalid delay configuration: {str(e)}")
        except Exception as e:
            raise Exception(f"Delay execution failed: {str(e)}")
    
    def _convert_to_seconds(self, duration: float, unit: str) -> float:
        """Convert duration to seconds based on unit"""
        unit = unit.lower().strip()
        
        unit_map = {
            'second': 1,
            'seconds': 1,
            's': 1,
            'minute': 60,
            'minutes': 60,
            'm': 60,
            'min': 60,
            'hour': 3600,
            'hours': 3600,
            'h': 3600,
            'hr': 3600,
            'millisecond': 0.001,
            'milliseconds': 0.001,
            'ms': 0.001,
        }
        
        multiplier = unit_map.get(unit)
        
        if multiplier is None:
            raise ValueError(f"Unknown time unit: {unit}")
        
        return float(duration) * multiplier
"""
SMS Tool - Send Text Messages via Twilio
Mobile notifications and alerts
"""

from app.tools.base import BaseTool
from typing import Any, Dict, List, Optional


class SMSTool(BaseTool):
    """
    SMS tool for sending text messages via Twilio
    
    Use Cases:
    - Send notifications
    - 2FA codes
    - Alerts
    - Reminders
    - Status updates
    - Emergency notifications
    
    Config:
        account_sid: Twilio Account SID
        auth_token: Twilio Auth Token
        from_number: Twilio phone number (E.164 format: +1234567890)
        to: Recipient phone number(s) (string or list)
        message: SMS message text (max 1600 chars)
        media_url: MMS media URL (optional, for images/videos)
    """
    
    def __init__(self):
        super().__init__()
        self.name = "sms"
        self.description = "Send SMS messages via Twilio"
    
    def execute(self, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Send SMS message
        
        Returns:
            SMS sending status and details
        """
        try:
            # Import Twilio
            try:
                from twilio.rest import Client
            except ImportError:
                raise Exception("Twilio library not installed. Run: pip install twilio")
            
            # Get configuration
            account_sid = config.get('account_sid')
            auth_token = config.get('auth_token')
            from_number = config.get('from_number')
            to = config.get('to')
            message = config.get('message')
            
            # Validate
            if not account_sid:
                raise ValueError("Twilio Account SID is required")
            
            if not auth_token:
                raise ValueError("Twilio Auth Token is required")
            
            if not from_number:
                raise ValueError("From number is required")
            
            if not to:
                raise ValueError("Recipient number is required")
            
            if not message:
                raise ValueError("Message is required")
            
            # Resolve placeholders
            to = self._resolve_placeholders(to, inputs)
            message = self._resolve_placeholders(message, inputs)
            
            # Parse recipients
            recipients = self._parse_phone_numbers(to)
            
            # Validate message length
            if len(message) > 1600:
                raise ValueError("Message too long (max 1600 characters)")
            
            print(f"📱 Sending SMS to {len(recipients)} recipient(s)")
            
            # Initialize Twilio client
            client = Client(account_sid, auth_token)
            
            # Send to each recipient
            sent_messages = []
            for recipient in recipients:
                # Prepare message params
                msg_params = {
                    'from_': from_number,
                    'to': recipient,
                    'body': message
                }
                
                # Add media if provided (MMS)
                if config.get('media_url'):
                    media_url = self._resolve_placeholders(config['media_url'], inputs)
                    msg_params['media_url'] = [media_url]
                
                # Send message
                twilio_msg = client.messages.create(**msg_params)
                
                sent_messages.append({
                    'sid': twilio_msg.sid,
                    'to': recipient,
                    'status': twilio_msg.status,
                    'price': twilio_msg.price,
                    'price_unit': twilio_msg.price_unit
                })
            
            return {
                'success': True,
                'from': from_number,
                'to': recipients,
                'message': message,
                'sent_count': len(sent_messages),
                'messages': sent_messages,
                'total_cost': sum(float(msg.get('price') or 0) for msg in sent_messages)
            }
            
        except Exception as e:
            raise Exception(f"SMS sending failed: {str(e)}")
    
    def _parse_phone_numbers(self, numbers: Any) -> List[str]:
        """Parse phone numbers (string or list)"""
        if isinstance(numbers, str):
            # Split by comma or semicolon
            return [num.strip() for num in numbers.replace(';', ',').split(',') if num.strip()]
        elif isinstance(numbers, list):
            return [str(num).strip() for num in numbers if num]
        else:
            return [str(numbers)]
    
    def _resolve_placeholders(self, data: Any, inputs: Dict[str, Any]) -> Any:
        """Resolve {{placeholder}} syntax"""
        if isinstance(data, dict):
            return {k: self._resolve_placeholders(v, inputs) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._resolve_placeholders(item, inputs) for item in data]
        elif isinstance(data, str):
            import re
            pattern = r'\{\{([^}]+)\}\}'
            matches = re.findall(pattern, data)
            
            if not matches:
                return data
            
            if data.strip() == f"{{{{{matches[0]}}}}}":
                return self._get_nested_value(inputs, matches[0].strip())
            
            result = data
            for match in matches:
                value = self._get_nested_value(inputs, match.strip())
                result = result.replace(f"{{{{{match}}}}}", str(value))
            
            return result
        else:
            return data
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """Get nested value using dot notation"""
        keys = path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list) and key.isdigit():
                current = current[int(key)]
            else:
                return None
        
        return current
 

# Export
__all__ = ['SMSTool']
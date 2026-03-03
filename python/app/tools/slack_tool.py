"""
Slack Tool - Send Messages to Slack
Team communication and notifications
"""

from app.tools.base import BaseTool
from typing import Any, Dict, List, Optional
import requests
import json


class SlackTool(BaseTool):
    """
    Slack tool for team communication
    
    Use Cases:
    - Send notifications
    - Post alerts
    - Share updates
    - Workflow status
    - Error notifications
    - Daily reports
    
    Features:
    - Post messages to channels
    - Send direct messages
    - Rich formatting (markdown)
    - Mentions (@user, @channel)
    - Emojis
    - Thread replies
    - File uploads
    - Blocks (advanced formatting)
    
    Config:
        token: Slack Bot Token (starts with xoxb-)
        channel: Channel ID or name (#general, @username, or C1234567890)
        message: Message text
        blocks: Slack blocks for rich formatting (optional)
        thread_ts: Thread timestamp (for replies)
        username: Bot display name (optional)
        icon_emoji: Bot icon emoji (optional, e.g., :robot_face:)
        unfurl_links: Auto-expand links (default: true)
        unfurl_media: Auto-expand media (default: true)
    """
    
    def __init__(self):
        super().__init__()
        self.name = "slack"
        self.description = "Send messages to Slack channels and users"
    
    def execute(self, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Send Slack message
        
        Returns:
            Message posting status and details
        """
        try:
            # Get configuration
            token = config.get('token')
            channel = config.get('channel')
            message = config.get('message')
            
            # Validate
            if not token:
                raise ValueError("Slack token is required")
            
            if not channel:
                raise ValueError("Channel is required")
            
            if not message and not config.get('blocks'):
                raise ValueError("Message or blocks are required")
            
            # Resolve placeholders
            channel = self._resolve_placeholders(channel, inputs)
            message = self._resolve_placeholders(message, inputs)
            
            # Send message
            result = self._send_message(token, channel, message, config, inputs)
            
            return result
            
        except Exception as e:
            raise Exception(f"Slack message failed: {str(e)}")
    
    def _send_message(
        self, 
        token: str, 
        channel: str, 
        message: str,
        config: Dict[str, Any],
        inputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send message to Slack"""
        
        # Prepare payload
        payload = {
            'channel': channel,
            'text': message
        }
        
        # Add optional fields
        if config.get('blocks'):
            blocks = self._resolve_placeholders(config['blocks'], inputs)
            payload['blocks'] = blocks
        
        if config.get('thread_ts'):
            payload['thread_ts'] = config['thread_ts']
        
        if config.get('username'):
            payload['username'] = config['username']
        
        if config.get('icon_emoji'):
            payload['icon_emoji'] = config['icon_emoji']
        
        if 'unfurl_links' in config:
            payload['unfurl_links'] = config['unfurl_links']
        
        if 'unfurl_media' in config:
            payload['unfurl_media'] = config['unfurl_media']
        
        print(f"💬 Sending Slack message to {channel}")
        
        # Make API request
        response = requests.post(
            'https://slack.com/api/chat.postMessage',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            json=payload
        )
        
        result = response.json()
        
        if not result.get('ok'):
            error = result.get('error', 'Unknown error')
            raise Exception(f"Slack API error: {error}")
        
        return {
            'success': True,
            'channel': channel,
            'message': message,
            'timestamp': result.get('ts'),
            'channel_id': result.get('channel'),
            'message_link': f"https://slack.com/app_redirect?channel={result.get('channel')}&message_ts={result.get('ts')}"
        }
    
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
__all__ = ['SlackTool']
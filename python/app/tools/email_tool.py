"""
Email Tool - Send Emails via SendGrid or SMTP
Professional email automation with templates and attachments
"""

from app.tools.base import BaseTool
from typing import Any, Dict, List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64


class EmailTool(BaseTool):
    """
    Email tool for sending emails
    
    Use Cases:
    - Send notifications
    - Send reports
    - Welcome emails
    - Alert emails
    - Transactional emails
    - Bulk emails
    
    Supports:
    - SendGrid API (recommended)
    - SMTP (Gmail, Outlook, custom)
    - HTML templates
    - Plain text
    - Attachments (base64)
    - Multiple recipients
     
    Config:
        provider: Email provider ('sendgrid' or 'smtp')
        sendgrid_api_key: SendGrid API key (if using SendGrid)
        smtp_config: SMTP configuration (if using SMTP)
            - host: SMTP server
            - port: SMTP port (587 for TLS, 465 for SSL)
            - username: SMTP username
            - password: SMTP password
            - use_tls: Whether to use TLS (default: true)
        from_email: Sender email address
        from_name: Sender name (optional)
        to: Recipient email(s) (string or list)
        cc: CC recipients (optional)
        bcc: BCC recipients (optional)
        subject: Email subject
        body: Email body (text or HTML)
        html: Whether body is HTML (default: true)
        attachments: List of attachments (base64 encoded)
    """
    
    def __init__(self):
        super().__init__()
        self.name = "email"
        self.description = "Send emails via SendGrid or SMTP"
    
    def execute(self, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Send email
        
        Returns:
            Email sending status and details
        """
        try:
            # Get provider
            provider = config.get('provider', 'smtp').lower()
            
            # Resolve placeholders in all fields
            config = self._resolve_config(config, inputs)
            
            # Validate required fields
            self._validate_config(config)
            
            # Send email based on provider
            if provider == 'sendgrid':
                result = self._send_sendgrid(config)
            elif provider == 'smtp':
                result = self._send_smtp(config)
            else:
                raise ValueError(f"Unknown email provider: {provider}")
            
            return result
            
        except Exception as e:
            raise Exception(f"Email sending failed: {str(e)}")
    
    def _validate_config(self, config: Dict[str, Any]) -> None:
        """Validate email configuration"""
        required = ['from_email', 'to', 'subject', 'body']
        
        for field in required:
            if not config.get(field):
                raise ValueError(f"Missing required field: {field}")
        
        provider = config.get('provider', 'smtp')
        
        if provider == 'sendgrid':
            if not config.get('sendgrid_api_key'):
                raise ValueError("SendGrid API key is required")
        elif provider == 'smtp':
            smtp_config = config.get('smtp_config', {})
            if not smtp_config.get('host'):
                raise ValueError("SMTP host is required")
            if not smtp_config.get('username'):
                raise ValueError("SMTP username is required")
            if not smtp_config.get('password'):
                raise ValueError("SMTP password is required")
    
    def _send_sendgrid(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Send email via SendGrid API"""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content, Attachment, FileContent, FileName, FileType, Disposition
        except ImportError:
            raise Exception("SendGrid library not installed. Run: pip install sendgrid")
        
        api_key = config['sendgrid_api_key']
        
        # Prepare sender
        from_email_addr = config['from_email']
        from_name = config.get('from_name')
        
        if from_name:
            from_email = Email(from_email_addr, from_name)
        else:
            from_email = Email(from_email_addr)
        
        # Prepare recipients
        to_emails = self._parse_recipients(config['to'])
        
        # Prepare content
        subject = config['subject']
        body = config['body']
        is_html = config.get('html', True)
        
        if is_html:
            content = Content("text/html", body)
        else:
            content = Content("text/plain", body)
        
        print(f"📧 Sending email via SendGrid to {len(to_emails)} recipient(s)")
        
        # Create mail object
        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        
        # Send to each recipient
        sent_count = 0
        for to_email in to_emails:
            mail = Mail(from_email, To(to_email), subject, content)
            
            # Add CC
            if config.get('cc'):
                cc_emails = self._parse_recipients(config['cc'])
                for cc in cc_emails:
                    mail.add_cc(cc)
            
            # Add BCC
            if config.get('bcc'):
                bcc_emails = self._parse_recipients(config['bcc'])
                for bcc in bcc_emails:
                    mail.add_bcc(bcc)
            
            # Add attachments
            if config.get('attachments'):
                for attachment in config['attachments']:
                    att = Attachment()
                    att.file_content = FileContent(attachment['content'])
                    att.file_name = FileName(attachment['filename'])
                    att.file_type = FileType(attachment.get('type', 'application/octet-stream'))
                    att.disposition = Disposition('attachment')
                    mail.add_attachment(att)
            
            # Send
            response = sg.send(mail)
            sent_count += 1
        
        return {
            'success': True,
            'provider': 'sendgrid',
            'from': from_email_addr,
            'to': to_emails,
            'subject': subject,
            'sent_count': sent_count,
            'message': f"Email sent to {sent_count} recipient(s) via SendGrid"
        }
    
    def _send_smtp(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Send email via SMTP"""
        
        smtp_config = config.get('smtp_config', {})
        
        host = smtp_config['host']
        port = smtp_config.get('port', 587)
        username = smtp_config['username']
        password = smtp_config['password']
        use_tls = smtp_config.get('use_tls', True)
        
        # Prepare email
        from_email = config['from_email']
        from_name = config.get('from_name')
        to_emails = self._parse_recipients(config['to'])
        subject = config['subject']
        body = config['body']
        is_html = config.get('html', True)
        
        print(f"📧 Sending email via SMTP ({host}) to {len(to_emails)} recipient(s)")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name} <{from_email}>" if from_name else from_email
        msg['To'] = ', '.join(to_emails)
        
        # Add CC
        if config.get('cc'):
            cc_emails = self._parse_recipients(config['cc'])
            msg['Cc'] = ', '.join(cc_emails)
            to_emails.extend(cc_emails)
        
        # Add BCC (not in headers, just in recipients)
        if config.get('bcc'):
            bcc_emails = self._parse_recipients(config['bcc'])
            to_emails.extend(bcc_emails)
        
        # Add body
        if is_html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        # Add attachments
        if config.get('attachments'):
            for attachment in config['attachments']:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(base64.b64decode(attachment['content']))
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment["filename"]}'
                )
                msg.attach(part)
        
        # Connect and send
        if use_tls:
            server = smtplib.SMTP(host, port)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(host, port)
        
        server.login(username, password)
        server.sendmail(from_email, to_emails, msg.as_string())
        server.quit()
        
        return {
            'success': True,
            'provider': 'smtp',
            'from': from_email,
            'to': to_emails,
            'subject': subject,
            'sent_count': len(to_emails),
            'message': f"Email sent to {len(to_emails)} recipient(s) via SMTP"
        }
    
    def _parse_recipients(self, recipients: Any) -> List[str]:
        """Parse recipient emails (string or list)"""
        if isinstance(recipients, str):
            # Split by comma or semicolon
            return [email.strip() for email in recipients.replace(';', ',').split(',') if email.strip()]
        elif isinstance(recipients, list):
            return [str(email).strip() for email in recipients if email]
        else:
            return [str(recipients)]
    
    def _resolve_config(self, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve placeholders in config"""
        resolved = {}
        
        for key, value in config.items():
            if key == 'smtp_config' and isinstance(value, dict):
                # Don't resolve SMTP config (has passwords)
                resolved[key] = value
            else:
                resolved[key] = self._resolve_placeholders(value, inputs)
        
        return resolved
    
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
__all__ = ['EmailTool']
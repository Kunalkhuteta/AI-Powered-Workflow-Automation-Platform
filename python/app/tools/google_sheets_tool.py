"""
Google Sheets Tool - Read/Write Spreadsheets
Integrate with Google Sheets API for automation
"""

from app.tools.base import BaseTool
from typing import Any, Dict, List, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json


class GoogleSheetsTool(BaseTool):
    """
    Google Sheets tool for spreadsheet automation
    
    Use Cases:
    - Read data from Google Sheets
    - Write data to Google Sheets
    - Append rows to sheets
    - Update specific cells
    - Clear sheet data
    - Create new sheets
    - Batch operations
    
    Config:
        credentials: Service account credentials (JSON)
        spreadsheet_id: Google Sheets ID (from URL)
        operation: Operation type ('read', 'write', 'append', 'update', 'clear')
        range: A1 notation range (e.g., 'Sheet1!A1:D10')
        values: Data to write (for write/append/update operations)
        sheet_name: Sheet name (for create operation)
    """
    
    def __init__(self):
        super().__init__()
        self.name = "google_sheets"
        self.description = "Read and write Google Sheets data"
        self.service = None
    
    def execute(self, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Execute Google Sheets operation
        
        Returns:
            Operation result with data or status
        """
        try:
            # Get configuration
            credentials_json = config.get('credentials')
            spreadsheet_id = config.get('spreadsheet_id')
            operation = config.get('operation', 'read')
            
            # Validate required fields
            if not credentials_json:
                raise ValueError("Service account credentials are required")
            
            if not spreadsheet_id:
                raise ValueError("Spreadsheet ID is required")
            
            # Initialize Google Sheets API
            self._init_service(credentials_json)
            
            # Execute operation
            if operation == 'read':
                result = self._read_data(spreadsheet_id, config, inputs)
            elif operation == 'write':
                result = self._write_data(spreadsheet_id, config, inputs)
            elif operation == 'append':
                result = self._append_data(spreadsheet_id, config, inputs)
            elif operation == 'update':
                result = self._update_data(spreadsheet_id, config, inputs)
            elif operation == 'clear':
                result = self._clear_data(spreadsheet_id, config)
            elif operation == 'create_sheet':
                result = self._create_sheet(spreadsheet_id, config)
            else:
                raise ValueError(f"Unknown operation: {operation}")
            
            return result
            
        except HttpError as e:
            raise Exception(f"Google Sheets API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Google Sheets operation failed: {str(e)}")
    
    def _init_service(self, credentials_json: Any) -> None:
        """Initialize Google Sheets API service"""
    
        # Check if it's a file path
        if isinstance(credentials_json, str):
            # Try as file path first
            if credentials_json.endswith('.json'):
                try:
                    import os
                    if os.path.exists(credentials_json):
                        credentials = service_account.Credentials.from_service_account_file(
                            credentials_json,
                            scopes=['https://www.googleapis.com/auth/spreadsheets']
                        )
                        self.service = build('sheets', 'v4', credentials=credentials)
                        print(f"📊 Connected to Google Sheets API (file: {credentials_json})")
                        return
                except Exception as e:
                    print(f"Failed to load from file: {e}")
            
            # Try parsing as JSON string
            try:
                credentials_dict = json.loads(credentials_json)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON credentials: {str(e)}")
        elif isinstance(credentials_json, dict):
            credentials_dict = credentials_json
        else:
            raise ValueError("Credentials must be JSON string, dict, or file path")
        
        # Create credentials from dict
        credentials = service_account.Credentials.from_service_account_info(
            credentials_dict,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        # Build service
        self.service = build('sheets', 'v4', credentials=credentials)
        print("📊 Connected to Google Sheets API")
    
    def _read_data(self, spreadsheet_id: str, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Read data from Google Sheets"""
        
        range_name = config.get('range', 'Sheet1!A1:Z1000')
        
        # Resolve placeholders
        range_name = self._resolve_placeholders(range_name, inputs)
        
        print(f"📖 Reading from range: {range_name}")
        
        # Call API
        result = self.service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        
        # Convert to list of dicts if has headers
        if values and len(values) > 1:
            headers = values[0]
            rows = []
            for row in values[1:]:
                # Pad row if needed
                while len(row) < len(headers):
                    row.append('')
                rows.append(dict(zip(headers, row)))
            
            return {
                'success': True,
                'operation': 'read',
                'range': range_name,
                'headers': headers,
                'rows': rows,
                'count': len(rows),
                'raw_values': values
            }
        else:
            return {
                'success': True,
                'operation': 'read',
                'range': range_name,
                'rows': [],
                'count': 0,
                'raw_values': values
            }
    
    def _write_data(self, spreadsheet_id: str, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Write data to Google Sheets (overwrites existing)"""
        
        range_name = config.get('range', 'Sheet1!A1')
        values = config.get('values', [])
        
        # Resolve placeholders
        range_name = self._resolve_placeholders(range_name, inputs)
        values = self._resolve_placeholders(values, inputs)
        
        # Convert dict to list of lists if needed
        if isinstance(values, dict):
            values = [[k, v] for k, v in values.items()]
        elif isinstance(values, list) and values and isinstance(values[0], dict):
            # List of dicts to rows
            headers = list(values[0].keys())
            rows = [headers]
            for item in values:
                rows.append([item.get(h, '') for h in headers])
            values = rows
        
        print(f"✍️  Writing {len(values)} rows to {range_name}")
        
        # Call API
        result = self.service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body={'values': values}
        ).execute()
        
        return {
            'success': True,
            'operation': 'write',
            'range': range_name,
            'updated_cells': result.get('updatedCells', 0),
            'updated_rows': result.get('updatedRows', 0),
            'updated_columns': result.get('updatedColumns', 0)
        }
    
    def _append_data(self, spreadsheet_id: str, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Append data to Google Sheets (adds to end)"""
        
        range_name = config.get('range', 'Sheet1!A1')
        values = config.get('values', [])
        
        # Resolve placeholders
        range_name = self._resolve_placeholders(range_name, inputs)
        values = self._resolve_placeholders(values, inputs)
        
        # Convert single dict to row
        if isinstance(values, dict):
            values = [list(values.values())]
        elif isinstance(values, list) and values and isinstance(values[0], dict):
            # List of dicts to rows (without headers)
            headers = list(values[0].keys())
            rows = []
            for item in values:
                rows.append([item.get(h, '') for h in headers])
            values = rows
        
        print(f"➕ Appending {len(values)} rows to {range_name}")
        
        # Call API
        result = self.service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body={'values': values}
        ).execute()
        
        return {
            'success': True,
            'operation': 'append',
            'range': range_name,
            'updated_range': result.get('updates', {}).get('updatedRange', ''),
            'updated_rows': result.get('updates', {}).get('updatedRows', 0)
        }
    
    def _update_data(self, spreadsheet_id: str, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Update specific cells in Google Sheets"""
        
        range_name = config.get('range')
        values = config.get('values', [])
        
        if not range_name:
            raise ValueError("Range is required for update operation")
        
        # Resolve placeholders
        range_name = self._resolve_placeholders(range_name, inputs)
        values = self._resolve_placeholders(values, inputs)
        
        # Ensure values is 2D array
        if not isinstance(values, list):
            values = [[values]]
        elif values and not isinstance(values[0], list):
            values = [values]
        
        print(f"🔄 Updating range: {range_name}")
        
        # Call API
        result = self.service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body={'values': values}
        ).execute()
        
        return {
            'success': True,
            'operation': 'update',
            'range': range_name,
            'updated_cells': result.get('updatedCells', 0)
        }
    
    def _clear_data(self, spreadsheet_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Clear data from Google Sheets range"""
        
        range_name = config.get('range', 'Sheet1!A1:Z1000')
        
        print(f"🗑️  Clearing range: {range_name}")
        
        # Call API
        result = self.service.spreadsheets().values().clear(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        return {
            'success': True,
            'operation': 'clear',
            'range': range_name,
            'cleared_range': result.get('clearedRange', '')
        }
    
    def _create_sheet(self, spreadsheet_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new sheet in the spreadsheet"""
        
        sheet_name = config.get('sheet_name', 'New Sheet')
        
        print(f"➕ Creating sheet: {sheet_name}")
        
        # Call API
        request = {
            'addSheet': {
                'properties': {
                    'title': sheet_name
                }
            }
        }
        
        result = self.service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={'requests': [request]}
        ).execute()
        
        sheet_id = result['replies'][0]['addSheet']['properties']['sheetId']
        
        return {
            'success': True,
            'operation': 'create_sheet',
            'sheet_name': sheet_name,
            'sheet_id': sheet_id
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
__all__ = ['GoogleSheetsTool']
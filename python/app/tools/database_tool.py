"""
Database Tool - PostgreSQL & MySQL Support
Execute SQL queries, CRUD operations, and data management
"""

from app.tools.base import BaseTool
from typing import Any, Dict, List, Optional
import psycopg2
import psycopg2.extras
import pymysql
import pymysql.cursors
from datetime import datetime
import json


class DatabaseTool(BaseTool):
    """
    Database tool for PostgreSQL and MySQL operations
    
    Use Cases:
    - Read data from database tables
    - Insert records
    - Update existing records
    - Delete records
    - Execute custom SQL queries
    - Store workflow results
    - Data validation and checks
    
    Config:
        connection: Database connection details
            - type: 'postgresql' or 'mysql'
            - host: Database host
            - port: Database port (5432 for PG, 3306 for MySQL)
            - database: Database name
            - user: Database user
            - password: Database password
        operation: Operation type ('query', 'insert', 'update', 'delete', 'select')
        query: SQL query (for custom queries)
        table: Table name (for CRUD operations)
        data: Data to insert/update (dict or list of dicts)
        where: WHERE clause conditions (for update/delete)
        columns: Columns to select (for select operation)
    """
    
    def __init__(self):
        super().__init__()
        self.name = "database"
        self.description = "Execute SQL queries and database operations"
        self.connection = None
    
    def execute(self, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Execute database operation
        
        Returns:
            Query results, affected rows, and operation status
        """
        try:
            # Get configuration
            connection_config = config.get('connection', {})
            operation = config.get('operation', 'query')
            
            # Validate connection config
            self._validate_connection(connection_config)
            
            # Connect to database
            self._connect(connection_config)
            
            # Execute operation
            if operation == 'query':
                result = self._execute_query(config, inputs)
            elif operation == 'select':
                result = self._execute_select(config, inputs)
            elif operation == 'insert':
                result = self._execute_insert(config, inputs)
            elif operation == 'update':
                result = self._execute_update(config, inputs)
            elif operation == 'delete':
                result = self._execute_delete(config, inputs)
            else:
                raise ValueError(f"Unknown operation: {operation}")
            
            # Close connection
            self._close()
            
            return result
            
        except psycopg2.Error as e:
            self._close()
            raise Exception(f"PostgreSQL error: {str(e)}")
        except pymysql.Error as e:
            self._close()
            raise Exception(f"MySQL error: {str(e)}")
        except Exception as e:
            self._close()
            raise Exception(f"Database operation failed: {str(e)}")
    
    def _validate_connection(self, config: Dict[str, Any]) -> None:
        """Validate database connection configuration"""
        required = ['type', 'host', 'database', 'user', 'password']
        for field in required:
            if field not in config:
                raise ValueError(f"Missing required connection field: {field}")
        
        db_type = config['type'].lower()
        if db_type not in ['postgresql', 'mysql']:
            raise ValueError(f"Unsupported database type: {db_type}")
    
    def _connect(self, config: Dict[str, Any]) -> None:
        """Establish database connection"""
        db_type = config['type'].lower()
        
        if db_type == 'postgresql':
            self.connection = psycopg2.connect(
                host=config['host'],
                port=config.get('port', 5432),
                database=config['database'],
                user=config['user'],
                password=config['password']
            )
            print(f"🔌 Connected to PostgreSQL: {config['database']}")
            
        elif db_type == 'mysql':
            self.connection = pymysql.connect(
                host=config['host'],
                port=config.get('port', 3306),
                database=config['database'],
                user=config['user'],
                password=config['password'],
                cursorclass=pymysql.cursors.DictCursor
            )
            print(f"🔌 Connected to MySQL: {config['database']}")
    
    def _close(self) -> None:
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def _execute_query(self, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute custom SQL query"""
        query = config.get('query')
        
        if not query:
            raise ValueError("Query is required for 'query' operation")
        
        # Resolve placeholders in query
        query = self._resolve_placeholders(query, inputs)
        
        print(f"🔍 Executing query: {query[:100]}...")
        
        cursor = self.connection.cursor()
        cursor.execute(query)
        
        # Check if query returns data (SELECT) or just affects rows
        if query.strip().upper().startswith('SELECT'):
            if isinstance(cursor, psycopg2.extras.DictCursor) or isinstance(cursor, pymysql.cursors.DictCursor):
                rows = cursor.fetchall()
            else:
                columns = [desc[0] for desc in cursor.description]
                rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            result = {
                'success': True,
                'operation': 'query',
                'rows': rows,
                'count': len(rows),
                'query': query
            }
        else:
            # INSERT, UPDATE, DELETE
            self.connection.commit()
            affected = cursor.rowcount
            
            result = {
                'success': True,
                'operation': 'query',
                'affected_rows': affected,
                'query': query
            }
        
        cursor.close()
        return result
    
    def _execute_select(self, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute SELECT operation"""
        table = config.get('table')
        columns = config.get('columns', ['*'])
        where = config.get('where', {})
        limit = config.get('limit')
        order_by = config.get('order_by')
        
        if not table:
            raise ValueError("Table name is required for SELECT operation")
        
        # Build query
        if isinstance(columns, list):
            columns_str = ', '.join(columns)
        else:
            columns_str = columns
        
        query = f"SELECT {columns_str} FROM {table}"
        
        # Add WHERE clause
        if where:
            where_clause, params = self._build_where_clause(where, inputs)
            query += f" WHERE {where_clause}"
        else:
            params = []
        
        # Add ORDER BY
        if order_by:
            query += f" ORDER BY {order_by}"
        
        # Add LIMIT
        if limit:
            query += f" LIMIT {limit}"
        
        print(f"🔍 SELECT from {table}")
        
        cursor = self.connection.cursor()
        cursor.execute(query, params)
        
        # Fetch results
        if hasattr(cursor, 'fetchall'):
            if isinstance(cursor, psycopg2.extras.RealDictCursor) or isinstance(cursor, pymysql.cursors.DictCursor):
                rows = cursor.fetchall()
            else:
                columns_list = [desc[0] for desc in cursor.description]
                rows = [dict(zip(columns_list, row)) for row in cursor.fetchall()]
        
        cursor.close()
        
        return {
            'success': True,
            'operation': 'select',
            'table': table,
            'rows': rows,
            'count': len(rows)
        }
    
    def _execute_insert(self, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute INSERT operation"""
        table = config.get('table')
        data = config.get('data')
        
        if not table:
            raise ValueError("Table name is required for INSERT operation")
        
        if not data:
            raise ValueError("Data is required for INSERT operation")
        
        # Resolve placeholders
        data = self._resolve_placeholders(data, inputs)
        
        # Handle single record or multiple records
        if isinstance(data, dict):
            records = [data]
        elif isinstance(data, list):
            records = data
        else:
            raise ValueError("Data must be a dict or list of dicts")
        
        cursor = self.connection.cursor()
        inserted_count = 0
        
        for record in records:
            columns = list(record.keys())
            values = list(record.values())
            placeholders = ', '.join(['%s'] * len(values))
            
            query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
            cursor.execute(query, values)
            inserted_count += 1
        
        self.connection.commit()
        cursor.close()
        
        print(f"✅ Inserted {inserted_count} record(s) into {table}")
        
        return {
            'success': True,
            'operation': 'insert',
            'table': table,
            'inserted_rows': inserted_count,
            'data': records
        }
    
    def _execute_update(self, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute UPDATE operation"""
        table = config.get('table')
        data = config.get('data')
        where = config.get('where')
        
        if not table:
            raise ValueError("Table name is required for UPDATE operation")
        
        if not data:
            raise ValueError("Data is required for UPDATE operation")
        
        if not where:
            raise ValueError("WHERE clause is required for UPDATE operation (safety)")
        
        # Resolve placeholders
        data = self._resolve_placeholders(data, inputs)
        
        # Build SET clause
        set_parts = []
        values = []
        for key, value in data.items():
            set_parts.append(f"{key} = %s")
            values.append(value)
        
        # Build WHERE clause
        where_clause, where_params = self._build_where_clause(where, inputs)
        
        query = f"UPDATE {table} SET {', '.join(set_parts)} WHERE {where_clause}"
        all_params = values + where_params
        
        print(f"🔄 UPDATE {table}")
        
        cursor = self.connection.cursor()
        cursor.execute(query, all_params)
        affected = cursor.rowcount
        self.connection.commit()
        cursor.close()
        
        return {
            'success': True,
            'operation': 'update',
            'table': table,
            'affected_rows': affected,
            'data': data
        }
    
    def _execute_delete(self, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute DELETE operation"""
        table = config.get('table')
        where = config.get('where')
        
        if not table:
            raise ValueError("Table name is required for DELETE operation")
        
        if not where:
            raise ValueError("WHERE clause is required for DELETE operation (safety)")
        
        # Build WHERE clause
        where_clause, params = self._build_where_clause(where, inputs)
        
        query = f"DELETE FROM {table} WHERE {where_clause}"
        
        print(f"🗑️  DELETE from {table}")
        
        cursor = self.connection.cursor()
        cursor.execute(query, params)
        affected = cursor.rowcount
        self.connection.commit()
        cursor.close()
        
        return {
            'success': True,
            'operation': 'delete',
            'table': table,
            'deleted_rows': affected
        }
    
    def _build_where_clause(self, where: Dict[str, Any], inputs: Dict[str, Any]) -> tuple:
        """
        Build WHERE clause from conditions dict
        
        Example: {'id': 1, 'status': 'active'} -> "id = %s AND status = %s", [1, 'active']
        """
        conditions = []
        params = []
        
        # Resolve placeholders
        where = self._resolve_placeholders(where, inputs)
        
        for key, value in where.items():
            conditions.append(f"{key} = %s")
            params.append(value)
        
        return ' AND '.join(conditions), params
    
    def _resolve_placeholders(self, data: Any, inputs: Dict[str, Any]) -> Any:
        """Resolve {{placeholder}} syntax in data"""
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
            else:
                return None
        
        return current


# Export
__all__ = ['DatabaseTool']
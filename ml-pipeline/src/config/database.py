import os
import psycopg2
import pandas as pd
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = os.getenv('DB_PORT', '5432')
        self.database = os.getenv('DB_NAME', 'siteanalytics')
        self.user = os.getenv('DB_USER', 'postgres')
        self.password = os.getenv('DB_PASSWORD', 'password')
        
    def get_connection(self):
        """Get a database connection"""
        return psycopg2.connect(
            host=self.host,
            port=self.port,
            database=self.database,
            user=self.user,
            password=self.password
        )
    
    def get_connection_string(self):
        """Get connection string for pandas"""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"

class DataLoader:
    def __init__(self):
        self.db_config = DatabaseConfig()
    
    def load_daily_metrics(self, start_date=None, end_date=None, limit=None):
        """Load daily metrics from database"""
        query = """
        SELECT 
            date,
            page_visits,
            page_views,
            avg_time_on_page,
            bounce_rate,
            unique_visitors
        FROM daily_metrics
        WHERE 1=1
        """
        
        params = []
        if start_date:
            query += " AND date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND date <= %s"
            params.append(end_date)
            
        query += " ORDER BY date ASC"
        
        if limit:
            query += " LIMIT %s"
            params.append(limit)
        
        try:
            with self.db_config.get_connection() as conn:
                df = pd.read_sql_query(query, conn, params=params)
                return df
        except Exception as e:
            print(f"Error loading daily metrics: {e}")
            return pd.DataFrame()
    
    def load_page_visits(self, start_date=None, end_date=None, limit=None):
        """Load raw page visits data"""
        query = """
        SELECT 
            DATE(timestamp) as date,
            COUNT(*) as visits,
            COUNT(DISTINCT visitor_id) as unique_visitors
        FROM page_visits
        WHERE 1=1
        """
        
        params = []
        if start_date:
            query += " AND DATE(timestamp) >= %s"
            params.append(start_date)
        if end_date:
            query += " AND DATE(timestamp) <= %s"
            params.append(end_date)
            
        query += " GROUP BY DATE(timestamp) ORDER BY date ASC"
        
        if limit:
            query += " LIMIT %s"
            params.append(limit)
        
        try:
            with self.db_config.get_connection() as conn:
                df = pd.read_sql_query(query, conn, params=params)
                return df
        except Exception as e:
            print(f"Error loading page visits: {e}")
            return pd.DataFrame()
    
    def get_minimum_data_requirement(self):
        """Check if we have enough data for training (minimum 30 days)"""
        query = """
        SELECT COUNT(DISTINCT date) as days_count
        FROM daily_metrics
        WHERE date >= CURRENT_DATE - INTERVAL '60 days'
        """
        
        try:
            with self.db_config.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query)
                    result = cursor.fetchone()
                    return result[0] if result else 0
        except Exception as e:
            print(f"Error checking data requirements: {e}")
            return 0 
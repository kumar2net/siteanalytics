import sys
import os
import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from config.database import DataLoader
from preprocessing.data_processor import DataProcessor
from models.lstm_model import LSTMModel

class TestDataLoader(unittest.TestCase):
    def setUp(self):
        self.data_loader = DataLoader()
    
    def test_data_loader_initialization(self):
        """Test DataLoader initialization"""
        self.assertIsNotNone(self.data_loader)
        self.assertIsNotNone(self.data_loader.db_config)
    
    def test_minimum_data_requirement(self):
        """Test minimum data requirement check"""
        days_count = self.data_loader.get_minimum_data_requirement()
        self.assertIsInstance(days_count, int)
        self.assertGreaterEqual(days_count, 0)

class TestDataProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = DataProcessor(sequence_length=7, prediction_horizon=7)
    
    def test_processor_initialization(self):
        """Test DataProcessor initialization"""
        self.assertEqual(self.processor.sequence_length, 7)
        self.assertEqual(self.processor.prediction_horizon, 7)
        self.assertFalse(self.processor.is_fitted)
    
    def test_create_sequences(self):
        """Test sequence creation"""
        # Create dummy data
        data = np.array([[1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12], [13], [14]])
        
        X, y = self.processor._create_sequences(data)
        
        # Check shapes
        self.assertEqual(X.shape[1], 7)  # sequence_length
        self.assertEqual(y.shape[1], 7)  # prediction_horizon
        self.assertEqual(X.shape[0], y.shape[0])  # same number of samples
    
    def test_add_features(self):
        """Test feature engineering"""
        # Create dummy dataframe
        dates = pd.date_range('2024-01-01', periods=10, freq='D')
        df = pd.DataFrame({
            'date': dates,
            'page_visits': np.random.randint(10, 100, 10)
        })
        
        df_with_features = self.processor.add_features(df)
        
        # Check that features were added
        expected_features = ['day_of_week', 'day_of_month', 'month', 'is_weekend', 
                           'page_visits_ma7', 'page_visits_ma30', 'page_visits_lag1', 'page_visits_lag7']
        
        for feature in expected_features:
            self.assertIn(feature, df_with_features.columns)

class TestLSTMModel(unittest.TestCase):
    def setUp(self):
        self.model = LSTMModel(sequence_length=7, prediction_horizon=7, model_version='test')
    
    def test_model_initialization(self):
        """Test LSTMModel initialization"""
        self.assertEqual(self.model.sequence_length, 7)
        self.assertEqual(self.model.prediction_horizon, 7)
        self.assertEqual(self.model.model_version, 'test')
        self.assertFalse(self.model.is_trained)
    
    def test_model_building(self):
        """Test model architecture building"""
        model = self.model.build_model(lstm_units=10, dropout_rate=0.1)
        
        self.assertIsNotNone(model)
        self.assertEqual(model.count_params(), self.model.model.count_params())
    
    def test_evaluation_metrics(self):
        """Test evaluation metrics calculation"""
        # Create dummy predictions
        y_true = np.array([[10, 20, 30], [15, 25, 35]])
        y_pred = np.array([[12, 22, 32], [14, 24, 34]])
        
        # Create dummy scaler
        from sklearn.preprocessing import MinMaxScaler
        scaler = MinMaxScaler()
        scaler.fit(y_true.reshape(-1, 1))
        
        metrics = self.model.evaluate(y_true, y_pred, scaler)
        
        # Check that all metrics are present
        expected_metrics = ['mse', 'mae', 'rmse', 'mape', 'r2']
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
            self.assertIsInstance(metrics[metric], (int, float))

class TestIntegration(unittest.TestCase):
    def test_end_to_end_workflow(self):
        """Test basic end-to-end workflow without actual training"""
        # This test verifies that components can work together
        # without requiring actual database connection or training
        
        # Create dummy data
        dates = pd.date_range('2024-01-01', periods=30, freq='D')
        df = pd.DataFrame({
            'date': dates,
            'page_visits': np.random.randint(10, 100, 30)
        })
        
        # Test data processing
        processor = DataProcessor(sequence_length=7, prediction_horizon=7)
        df_with_features = processor.add_features(df)
        
        # Test model initialization
        model = LSTMModel(sequence_length=7, prediction_horizon=7)
        built_model = model.build_model(lstm_units=10, dropout_rate=0.1)
        
        # Verify everything works
        self.assertIsNotNone(df_with_features)
        self.assertIsNotNone(built_model)
        self.assertGreater(len(df_with_features.columns), 3)  # Should have added features

if __name__ == '__main__':
    unittest.main() 
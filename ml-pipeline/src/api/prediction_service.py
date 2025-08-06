import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Optional
import joblib

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config.database import DataLoader
from preprocessing.data_processor import DataProcessor
from models.lstm_model import LSTMModel

class PredictionService:
    def __init__(self, model_dir='models', model_version='v1.0.0'):
        """
        Initialize the prediction service
        
        Args:
            model_dir (str): Directory containing trained models
            model_version (str): Version of the model to load
        """
        self.model_dir = model_dir
        self.model_version = model_version
        
        # Initialize components
        self.data_loader = DataLoader()
        self.data_processor = None
        self.model = None
        self.scaler = None
        
        # Load model and components
        self.load_model()
        
    def load_model(self):
        """Load the trained model and associated components"""
        try:
            # Load model
            model_path = os.path.join(self.model_dir, f'lstm_model_{self.model_version}.h5')
            metadata_path = os.path.join(self.model_dir, f'metadata_{self.model_version}.pkl')
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            # Load metadata
            metadata = joblib.load(metadata_path)
            sequence_length = metadata['sequence_length']
            prediction_horizon = metadata['prediction_horizon']
            
            # Initialize data processor
            self.data_processor = DataProcessor(sequence_length, prediction_horizon)
            
            # Load model
            self.model = LSTMModel(sequence_length, prediction_horizon, self.model_version)
            self.model.load_model(model_path, metadata_path)
            
            # Load scaler (we'll need to refit it with recent data)
            self.scaler = self.data_processor.scaler
            
            logging.info(f"Model loaded successfully: {model_path}")
            
        except Exception as e:
            logging.error(f"Failed to load model: {str(e)}")
            raise
    
    def get_recent_data(self, days_back=30):
        """
        Get recent data for prediction
        
        Args:
            days_back (int): Number of days to look back
            
        Returns:
            DataFrame: Recent daily metrics
        """
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)
        
        df = self.data_loader.load_daily_metrics(
            start_date=start_date,
            end_date=end_date
        )
        
        if df.empty:
            raise ValueError("No recent data available for prediction")
        
        return df
    
    def prepare_prediction_input(self, recent_data):
        """
        Prepare input sequence for prediction
        
        Args:
            recent_data (DataFrame): Recent daily metrics
            
        Returns:
            tuple: (input_sequence, scaler)
        """
        # Add features
        df_with_features = self.data_processor.add_features(recent_data)
        
        # Prepare data and fit scaler
        X_train, y_train, X_test, y_test, scaler = self.data_processor.prepare_data(
            df_with_features, target_column='page_visits'
        )
        
        # Create prediction sequence from recent data
        input_sequence = self.data_processor.create_prediction_sequence(
            df_with_features, target_column='page_visits'
        )
        
        return input_sequence, scaler
    
    def predict_page_visits(self, days_ahead=7) -> Dict:
        """
        Predict page visits for the next N days
        
        Args:
            days_ahead (int): Number of days to predict
            
        Returns:
            Dict: Prediction results with dates and values
        """
        try:
            # Get recent data
            recent_data = self.get_recent_data()
            
            # Prepare input sequence
            input_sequence, scaler = self.prepare_prediction_input(recent_data)
            
            # Make prediction
            prediction_scaled = self.model.predict(input_sequence)
            prediction_original = scaler.inverse_transform(prediction_scaled)
            
            # Get prediction values
            predictions = prediction_original[0][:days_ahead]
            
            # Generate dates for predictions
            start_date = datetime.now().date() + timedelta(days=1)
            prediction_dates = [start_date + timedelta(days=i) for i in range(days_ahead)]
            
            # Format results
            results = {
                'predictions': [
                    {
                        'date': date.strftime('%Y-%m-%d'),
                        'predicted_visits': int(max(0, round(pred)))  # Ensure non-negative
                    }
                    for date, pred in zip(prediction_dates, predictions)
                ],
                'model_version': self.model_version,
                'prediction_date': datetime.now().isoformat(),
                'days_ahead': days_ahead,
                'total_predicted_visits': int(sum(max(0, pred) for pred in predictions))
            }
            
            return results
            
        except Exception as e:
            logging.error(f"Prediction failed: {str(e)}")
            raise
    
    def predict_multiple_metrics(self, metrics: List[str], days_ahead=7) -> Dict:
        """
        Predict multiple metrics (placeholder for future expansion)
        
        Args:
            metrics (List[str]): List of metrics to predict
            days_ahead (int): Number of days to predict
            
        Returns:
            Dict: Predictions for multiple metrics
        """
        results = {}
        
        for metric in metrics:
            if metric == 'page_visits':
                results[metric] = self.predict_page_visits(days_ahead)
            else:
                # Placeholder for other metrics
                results[metric] = {
                    'error': f'Prediction for {metric} not implemented yet'
                }
        
        return results
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if self.model is None:
            return {'error': 'No model loaded'}
        
        return {
            'model_version': self.model_version,
            'sequence_length': self.model.sequence_length,
            'prediction_horizon': self.model.prediction_horizon,
            'is_trained': self.model.is_trained,
            'total_parameters': self.model.model.count_params() if self.model.model else 0
        }
    
    def get_prediction_confidence(self, predictions: List[float]) -> Dict:
        """
        Calculate confidence intervals for predictions (simplified)
        
        Args:
            predictions (List[float]): List of predicted values
            
        Returns:
            Dict: Confidence intervals
        """
        # Simple confidence calculation based on prediction variance
        predictions = np.array(predictions)
        mean_pred = np.mean(predictions)
        std_pred = np.std(predictions)
        
        # 95% confidence interval
        confidence_interval = 1.96 * std_pred
        
        return {
            'mean_prediction': float(mean_pred),
            'std_prediction': float(std_pred),
            'confidence_interval_95': float(confidence_interval),
            'confidence_lower': float(mean_pred - confidence_interval),
            'confidence_upper': float(mean_pred + confidence_interval)
        }
    
    def validate_prediction_request(self, days_ahead: int) -> bool:
        """
        Validate prediction request parameters
        
        Args:
            days_ahead (int): Number of days to predict
            
        Returns:
            bool: True if valid, False otherwise
        """
        if days_ahead <= 0:
            return False
        if days_ahead > 30:  # Limit to 30 days
            return False
        if self.model is None:
            return False
        
        return True 
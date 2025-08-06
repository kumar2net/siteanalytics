#!/usr/bin/env python3

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import argparse
import logging

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config.database import DataLoader
from preprocessing.data_processor import DataProcessor
from models.lstm_model import LSTMModel

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)

class ModelTrainer:
    def __init__(self, sequence_length=7, prediction_horizon=7, model_version='v1.0.0'):
        """
        Initialize the model trainer
        
        Args:
            sequence_length (int): Number of days to use as input sequence
            prediction_horizon (int): Number of days to predict ahead
            model_version (str): Version identifier for the model
        """
        self.sequence_length = sequence_length
        self.prediction_horizon = prediction_horizon
        self.model_version = model_version
        
        # Initialize components
        self.data_loader = DataLoader()
        self.data_processor = DataProcessor(sequence_length, prediction_horizon)
        self.model = LSTMModel(sequence_length, prediction_horizon, model_version)
        
        # Training results
        self.training_results = {}
        
    def check_data_requirements(self):
        """Check if we have enough data for training"""
        days_count = self.data_loader.get_minimum_data_requirement()
        
        logging.info(f"Available data: {days_count} days")
        
        if days_count < 30:
            logging.warning(f"Insufficient data for training. Need at least 30 days, got {days_count}")
            return False
        
        logging.info("Data requirements met for training")
        return True
    
    def load_and_prepare_data(self, days_back=60):
        """
        Load and prepare data for training
        
        Args:
            days_back (int): Number of days to look back for training data
            
        Returns:
            tuple: (X_train, y_train, X_test, y_test, scaler)
        """
        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)
        
        logging.info(f"Loading data from {start_date} to {end_date}")
        
        # Load daily metrics
        df = self.data_loader.load_daily_metrics(
            start_date=start_date,
            end_date=end_date
        )
        
        if df.empty:
            raise ValueError("No data found for the specified date range")
        
        logging.info(f"Loaded {len(df)} days of data")
        
        # Add engineered features
        df = self.data_processor.add_features(df)
        
        # Prepare data for LSTM
        X_train, y_train, X_test, y_test, scaler = self.data_processor.prepare_data(
            df, target_column='page_visits'
        )
        
        logging.info(f"Data prepared:")
        logging.info(f"- Training samples: {len(X_train)}")
        logging.info(f"- Test samples: {len(X_test)}")
        logging.info(f"- Input shape: {X_train.shape}")
        logging.info(f"- Output shape: {y_train.shape}")
        
        return X_train, y_train, X_test, y_test, scaler
    
    def train_model(self, X_train, y_train, X_test, y_test, scaler, 
                   epochs=100, batch_size=32):
        """
        Train the LSTM model
        
        Args:
            X_train, y_train: Training data
            X_test, y_test: Test data
            scaler: Fitted scaler
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
        """
        logging.info("Starting model training...")
        
        # Train the model
        history = self.model.train(
            X_train, y_train,
            X_val=X_test, y_val=y_test,
            epochs=epochs,
            batch_size=batch_size
        )
        
        # Evaluate the model
        evaluation_metrics = self.model.evaluate(X_test, y_test, scaler)
        
        logging.info("Training completed!")
        logging.info(f"Evaluation metrics: {evaluation_metrics}")
        
        # Store results
        self.training_results = {
            'evaluation_metrics': evaluation_metrics,
            'training_history': self.model.get_training_history(),
            'model_version': self.model_version,
            'training_date': datetime.now().isoformat(),
            'data_samples': len(X_train) + len(X_test)
        }
        
        return evaluation_metrics
    
    def save_results(self, model_dir='models'):
        """Save the trained model and results"""
        # Save model
        model_path, metadata_path = self.model.save_model(model_dir)
        
        # Save training results
        results_path = os.path.join(model_dir, f'training_results_{self.model_version}.pkl')
        import joblib
        joblib.dump(self.training_results, results_path)
        
        logging.info(f"Training results saved to {results_path}")
        
        return model_path, metadata_path, results_path
    
    def run_training_pipeline(self, days_back=60, epochs=100, batch_size=32):
        """
        Run the complete training pipeline
        
        Args:
            days_back (int): Number of days to look back for training data
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
        """
        try:
            logging.info("=" * 50)
            logging.info("Starting LSTM Model Training Pipeline")
            logging.info("=" * 50)
            
            # Step 1: Check data requirements
            if not self.check_data_requirements():
                raise ValueError("Insufficient data for training")
            
            # Step 2: Load and prepare data
            X_train, y_train, X_test, y_test, scaler = self.load_and_prepare_data(days_back)
            
            # Step 3: Train model
            evaluation_metrics = self.train_model(
                X_train, y_train, X_test, y_test, scaler,
                epochs=epochs, batch_size=batch_size
            )
            
            # Step 4: Save results
            model_path, metadata_path, results_path = self.save_results()
            
            # Step 5: Print summary
            self.print_training_summary(evaluation_metrics)
            
            logging.info("=" * 50)
            logging.info("Training Pipeline Completed Successfully!")
            logging.info("=" * 50)
            
            return {
                'model_path': model_path,
                'metadata_path': metadata_path,
                'results_path': results_path,
                'evaluation_metrics': evaluation_metrics
            }
            
        except Exception as e:
            logging.error(f"Training pipeline failed: {str(e)}")
            raise
    
    def print_training_summary(self, evaluation_metrics):
        """Print training summary"""
        print("\n" + "=" * 50)
        print("TRAINING SUMMARY")
        print("=" * 50)
        print(f"Model Version: {self.model_version}")
        print(f"Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Sequence Length: {self.sequence_length} days")
        print(f"Prediction Horizon: {self.prediction_horizon} days")
        print("\nEVALUATION METRICS:")
        print(f"  MSE: {evaluation_metrics['mse']:.4f}")
        print(f"  MAE: {evaluation_metrics['mae']:.4f}")
        print(f"  RMSE: {evaluation_metrics['rmse']:.4f}")
        print(f"  MAPE: {evaluation_metrics['mape']:.2f}%")
        print(f"  R²: {evaluation_metrics['r2']:.4f}")
        print("=" * 50)

def main():
    parser = argparse.ArgumentParser(description='Train LSTM model for website analytics')
    parser.add_argument('--sequence-length', type=int, default=7,
                       help='Number of days to use as input sequence')
    parser.add_argument('--prediction-horizon', type=int, default=7,
                       help='Number of days to predict ahead')
    parser.add_argument('--model-version', type=str, default='v1.0.0',
                       help='Model version identifier')
    parser.add_argument('--days-back', type=int, default=60,
                       help='Number of days to look back for training data')
    parser.add_argument('--epochs', type=int, default=100,
                       help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32,
                       help='Batch size for training')
    
    args = parser.parse_args()
    
    # Create trainer
    trainer = ModelTrainer(
        sequence_length=args.sequence_length,
        prediction_horizon=args.prediction_horizon,
        model_version=args.model_version
    )
    
    # Run training pipeline
    results = trainer.run_training_pipeline(
        days_back=args.days_back,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
    
    print(f"\nModel saved to: {results['model_path']}")
    print(f"Training completed successfully!")

if __name__ == "__main__":
    main() 
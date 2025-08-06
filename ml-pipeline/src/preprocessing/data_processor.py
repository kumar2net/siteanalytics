import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

class DataProcessor:
    def __init__(self, sequence_length=7, prediction_horizon=7):
        """
        Initialize data processor for LSTM model
        
        Args:
            sequence_length (int): Number of days to use as input sequence
            prediction_horizon (int): Number of days to predict ahead
        """
        self.sequence_length = sequence_length
        self.prediction_horizon = prediction_horizon
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.is_fitted = False
        
    def prepare_data(self, df, target_column='page_visits'):
        """
        Prepare data for LSTM training
        
        Args:
            df (DataFrame): Input dataframe with date and target column
            target_column (str): Column name to predict
            
        Returns:
            tuple: (X_train, y_train, X_test, y_test, scaler)
        """
        # Ensure we have the required columns
        if 'date' not in df.columns or target_column not in df.columns:
            raise ValueError(f"DataFrame must contain 'date' and '{target_column}' columns")
        
        # Sort by date
        df = df.sort_values('date').reset_index(drop=True)
        
        # Fill missing dates with 0 values
        df = self._fill_missing_dates(df, target_column)
        
        # Extract target values
        target_values = df[target_column].values.reshape(-1, 1)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(target_values)
        self.is_fitted = True
        
        # Create sequences
        X, y = self._create_sequences(scaled_data)
        
        # Split into train and test sets (80/20 split)
        split_index = int(len(X) * 0.8)
        X_train, X_test = X[:split_index], X[split_index:]
        y_train, y_test = y[:split_index], y[split_index:]
        
        return X_train, y_train, X_test, y_test, self.scaler
    
    def _fill_missing_dates(self, df, target_column):
        """Fill missing dates with 0 values"""
        # Create complete date range
        date_range = pd.date_range(start=df['date'].min(), end=df['date'].max(), freq='D')
        
        # Create complete dataframe
        complete_df = pd.DataFrame({'date': date_range})
        complete_df = complete_df.merge(df, on='date', how='left')
        
        # Fill missing values with 0
        complete_df[target_column] = complete_df[target_column].fillna(0)
        
        return complete_df
    
    def _create_sequences(self, data):
        """Create input sequences and target values for LSTM"""
        X, y = [], []
        
        for i in range(len(data) - self.sequence_length - self.prediction_horizon + 1):
            # Input sequence
            X.append(data[i:(i + self.sequence_length)])
            # Target sequence
            y.append(data[(i + self.sequence_length):(i + self.sequence_length + self.prediction_horizon)])
        
        return np.array(X), np.array(y)
    
    def inverse_transform(self, scaled_data):
        """Inverse transform scaled data back to original scale"""
        if not self.is_fitted:
            raise ValueError("Scaler must be fitted before inverse transform")
        
        # Reshape if needed
        if len(scaled_data.shape) == 1:
            scaled_data = scaled_data.reshape(-1, 1)
        
        return self.scaler.inverse_transform(scaled_data)
    
    def create_prediction_sequence(self, recent_data, target_column='page_visits'):
        """
        Create input sequence for prediction from recent data
        
        Args:
            recent_data (DataFrame): Recent data for prediction
            target_column (str): Column name to predict
            
        Returns:
            numpy array: Input sequence for prediction
        """
        if not self.is_fitted:
            raise ValueError("Scaler must be fitted before creating prediction sequence")
        
        # Get the last sequence_length days
        recent_values = recent_data[target_column].tail(self.sequence_length).values.reshape(-1, 1)
        
        # Scale the data
        scaled_sequence = self.scaler.transform(recent_values)
        
        # Reshape for LSTM input (batch_size, sequence_length, features)
        return scaled_sequence.reshape(1, self.sequence_length, 1)
    
    def evaluate_predictions(self, y_true, y_pred):
        """
        Evaluate model predictions
        
        Args:
            y_true (array): True values
            y_pred (array): Predicted values
            
        Returns:
            dict: Evaluation metrics
        """
        # Flatten arrays if needed
        y_true_flat = y_true.flatten()
        y_pred_flat = y_pred.flatten()
        
        # Calculate metrics
        mse = mean_squared_error(y_true_flat, y_pred_flat)
        mae = mean_absolute_error(y_true_flat, y_pred_flat)
        rmse = np.sqrt(mse)
        
        # Calculate MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((y_true_flat - y_pred_flat) / np.maximum(y_true_flat, 1))) * 100
        
        return {
            'mse': mse,
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
    
    def add_features(self, df):
        """
        Add engineered features to the dataset
        
        Args:
            df (DataFrame): Input dataframe
            
        Returns:
            DataFrame: DataFrame with additional features
        """
        df = df.copy()
        
        # Day of week (0=Monday, 6=Sunday)
        df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
        
        # Day of month
        df['day_of_month'] = pd.to_datetime(df['date']).dt.day
        
        # Month
        df['month'] = pd.to_datetime(df['date']).dt.month
        
        # Weekend flag
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Rolling averages
        df['page_visits_ma7'] = df['page_visits'].rolling(window=7, min_periods=1).mean()
        df['page_visits_ma30'] = df['page_visits'].rolling(window=30, min_periods=1).mean()
        
        # Lag features
        df['page_visits_lag1'] = df['page_visits'].shift(1)
        df['page_visits_lag7'] = df['page_visits'].shift(7)
        
        # Fill NaN values
        df = df.fillna(0)
        
        return df 
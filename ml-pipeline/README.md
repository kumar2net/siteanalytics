# Website Analytics ML Pipeline

Machine Learning pipeline for website analytics predictions using LSTM models.

## Features

- **LSTM Time Series Prediction**: Predict page visits for the next 7 days
- **Data Preprocessing**: Automated data cleaning and feature engineering
- **Model Training**: End-to-end training pipeline with validation
- **REST API**: FastAPI-based prediction service
- **Model Versioning**: Track and manage different model versions
- **Performance Monitoring**: Comprehensive evaluation metrics

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL database (same as backend)
- TensorFlow 2.15+
- At least 30 days of analytics data

### Installation

1. **Install dependencies:**
   ```bash
   cd ml-pipeline
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Train the model:**
   ```bash
   python src/training/train_model.py --days-back 60 --epochs 100
   ```

4. **Start the prediction API:**
   ```bash
   python src/api/main.py
   ```

## Project Structure

```
ml-pipeline/
├── src/
│   ├── api/
│   │   ├── main.py              # FastAPI application
│   │   └── prediction_service.py # Prediction service
│   ├── config/
│   │   └── database.py          # Database configuration
│   ├── models/
│   │   └── lstm_model.py        # LSTM model implementation
│   ├── preprocessing/
│   │   └── data_processor.py    # Data preprocessing
│   └── training/
│       └── train_model.py       # Training pipeline
├── models/                      # Saved models
├── data/                        # Data files
├── notebooks/                   # Jupyter notebooks
├── tests/                       # Test files
├── requirements.txt             # Python dependencies
├── env.example                  # Environment template
└── README.md                    # This file
```

## Usage

### Training the Model

```bash
# Basic training with default parameters
python src/training/train_model.py

# Custom training parameters
python src/training/train_model.py \
    --sequence-length 7 \
    --prediction-horizon 7 \
    --model-version v1.0.0 \
    --days-back 60 \
    --epochs 100 \
    --batch-size 32
```

### Making Predictions

#### Via API

```bash
# Start the API server
python src/api/main.py

# Make predictions
curl "http://localhost:5000/predict/page-visits?days_ahead=7"
```

#### Via Python

```python
from src.api.prediction_service import PredictionService

# Initialize service
service = PredictionService()

# Make prediction
predictions = service.predict_page_visits(days_ahead=7)
print(predictions)
```

## API Endpoints

### Health Check
```http
GET /health
```

### Model Information
```http
GET /model/info
```

### Page Visits Prediction
```http
GET /predict/page-visits?days_ahead=7
```

### Advanced Prediction
```http
POST /predict
Content-Type: application/json

{
    "days_ahead": 7,
    "metric": "page_visits"
}
```

### Multiple Metrics Prediction
```http
POST /predict/multiple
Content-Type: application/json

{
    "metrics": ["page_visits"],
    "days_ahead": 7
}
```

## Model Architecture

### LSTM Model
- **Input**: 7 days of page visits data
- **Output**: 7 days of predicted page visits
- **Architecture**: 2 LSTM layers + Dense layers
- **Regularization**: Dropout layers
- **Optimizer**: Adam with learning rate scheduling

### Data Preprocessing
- **Scaling**: MinMaxScaler (0-1 range)
- **Feature Engineering**: Day of week, month, rolling averages
- **Sequence Creation**: Sliding window approach
- **Missing Data**: Zero-filling for missing dates

## Training Process

1. **Data Loading**: Fetch daily metrics from PostgreSQL
2. **Feature Engineering**: Add temporal and statistical features
3. **Data Preprocessing**: Scale and create sequences
4. **Model Training**: Train LSTM with early stopping
5. **Evaluation**: Calculate MSE, MAE, RMSE, MAPE, R²
6. **Model Saving**: Save model and metadata

## Performance Metrics

The model is evaluated using:
- **MSE**: Mean Squared Error
- **MAE**: Mean Absolute Error
- **RMSE**: Root Mean Squared Error
- **MAPE**: Mean Absolute Percentage Error
- **R²**: Coefficient of Determination

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | siteanalytics |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `MODEL_DIR` | Model storage directory | models |
| `MODEL_VERSION` | Model version | v1.0.0 |
| `PORT` | API port | 5000 |

### Training Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `sequence_length` | Input sequence length | 7 days |
| `prediction_horizon` | Prediction horizon | 7 days |
| `epochs` | Training epochs | 100 |
| `batch_size` | Batch size | 32 |
| `learning_rate` | Learning rate | 0.001 |

## Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black src/
flake8 src/
```

### Jupyter Notebooks
```bash
jupyter notebook notebooks/
```

## Monitoring

### Model Performance
- Training logs saved to `training.log`
- Model metrics stored with each version
- API logs for prediction requests

### Data Quality
- Minimum 30 days of data required
- Automatic data validation
- Missing data handling

## Troubleshooting

### Common Issues

1. **Insufficient Data**
   - Ensure at least 30 days of analytics data
   - Check database connection

2. **Model Training Fails**
   - Verify TensorFlow installation
   - Check GPU memory if using GPU
   - Reduce batch size if needed

3. **API Won't Start**
   - Check if model files exist
   - Verify environment variables
   - Check port availability

### Debug Mode
```bash
export DEBUG=True
python src/api/main.py
```

## Future Enhancements

- **Multi-metric Prediction**: Predict page views, bounce rate, etc.
- **Anomaly Detection**: Identify unusual traffic patterns
- **Model Retraining**: Automated retraining with new data
- **A/B Testing**: Compare model versions
- **Advanced Features**: Weather, events, seasonal patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 
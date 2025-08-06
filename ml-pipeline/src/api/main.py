from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
import sys

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from api.prediction_service import PredictionService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Website Analytics ML API",
    description="Machine Learning API for website analytics predictions",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize prediction service
prediction_service = None

@app.on_event("startup")
async def startup_event():
    """Initialize the prediction service on startup"""
    global prediction_service
    try:
        model_dir = os.getenv('MODEL_DIR', 'models')
        model_version = os.getenv('MODEL_VERSION', 'v1.0.0')
        prediction_service = PredictionService(model_dir, model_version)
        logger.info("Prediction service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize prediction service: {e}")
        # Don't raise here - allow the service to start without model

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    days_ahead: int = 7
    metric: str = "page_visits"

class PredictionResponse(BaseModel):
    predictions: List[dict]
    model_version: str
    prediction_date: str
    days_ahead: int
    total_predicted_visits: int

class ModelInfoResponse(BaseModel):
    model_version: str
    sequence_length: int
    prediction_horizon: int
    is_trained: bool
    total_parameters: int

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-prediction-api",
        "model_loaded": prediction_service is not None and prediction_service.model is not None
    }

# Model information endpoint
@app.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    """Get information about the loaded model"""
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    
    try:
        info = prediction_service.get_model_info()
        if 'error' in info:
            raise HTTPException(status_code=503, detail=info['error'])
        return info
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get model information")

# Prediction endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict_page_visits(request: PredictionRequest):
    """
    Predict page visits for the next N days
    
    Args:
        request: Prediction request with days_ahead and metric
        
    Returns:
        Prediction results with dates and values
    """
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    
    try:
        # Validate request
        if not prediction_service.validate_prediction_request(request.days_ahead):
            raise HTTPException(status_code=400, detail="Invalid prediction request")
        
        # Make prediction
        if request.metric == "page_visits":
            result = prediction_service.predict_page_visits(request.days_ahead)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported metric: {request.metric}")
        
        return result
        
    except ValueError as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Simple GET endpoint for quick predictions
@app.get("/predict/page-visits")
async def predict_page_visits_simple(
    days_ahead: int = Query(7, ge=1, le=30, description="Number of days to predict")
):
    """
    Simple GET endpoint for page visits prediction
    
    Args:
        days_ahead: Number of days to predict (1-30)
        
    Returns:
        Prediction results
    """
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    
    try:
        result = prediction_service.predict_page_visits(days_ahead)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")

# Multiple metrics prediction endpoint
@app.post("/predict/multiple")
async def predict_multiple_metrics(
    metrics: List[str] = ["page_visits"],
    days_ahead: int = 7
):
    """
    Predict multiple metrics
    
    Args:
        metrics: List of metrics to predict
        days_ahead: Number of days to predict
        
    Returns:
        Predictions for multiple metrics
    """
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    
    try:
        result = prediction_service.predict_multiple_metrics(metrics, days_ahead)
        return result
    except Exception as e:
        logger.error(f"Multiple metrics prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")

# Model retraining endpoint (for future use)
@app.post("/model/retrain")
async def retrain_model():
    """
    Retrain the model with latest data
    
    Note: This is a placeholder for future implementation
    """
    return {
        "message": "Model retraining endpoint - not implemented yet",
        "status": "placeholder"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Website Analytics ML API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "model_info": "/model/info",
            "predict": "/predict",
            "predict_simple": "/predict/page-visits",
            "predict_multiple": "/predict/multiple"
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port) 
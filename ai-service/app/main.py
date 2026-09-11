from fastapi import FastAPI, HTTPException, status
from app.config import settings
from app.schemas.predict import PredictRequest, PredictResponse
from app.services.forecasting import train_and_evaluate_forecaster

app = FastAPI(
    title="Fretbox AI Service - Demand Prediction & Forecasting",
    description="Local scikit-learn time-series complaint volume forecaster for Fretbox campus administration.",
    version="1.0.0",
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "fretbox-ai-service",
        "version": "1.0.0",
        "minHistoryDays": settings.MIN_HISTORY_DAYS,
    }

@app.post("/predict", response_model=PredictResponse)
def predict_complaint_demand(request: PredictRequest):
    try:
        response = train_and_evaluate_forecaster(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting engine error: {str(e)}",
        )

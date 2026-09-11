from typing import List, Optional
from pydantic import BaseModel, Field

class DailyComplaintRecord(BaseModel):
    date: str = Field(..., description="Date string in YYYY-MM-DD format")
    count: int = Field(..., ge=0, description="Daily complaint count")

class PredictRequest(BaseModel):
    horizonDays: int = Field(7, ge=1, le=30, description="Forecast horizon in days")
    historyDays: int = Field(180, ge=1, le=365, description="Historical data window requested")
    records: List[DailyComplaintRecord] = Field(..., description="Chronological daily complaint records")

class ForecastItem(BaseModel):
    date: str = Field(..., description="Forecasted date in YYYY-MM-DD format")
    predictedComplaints: int = Field(..., ge=0, description="Predicted complaint volume")

class ModelMetrics(BaseModel):
    name: str
    mae: float
    rmse: float

class PredictResponse(BaseModel):
    status: str = Field(..., description="Response status: success or insufficient_data")
    message: Optional[str] = None
    forecast: List[ForecastItem] = Field(default_factory=list)
    model: Optional[ModelMetrics] = None
    baseline: Optional[ModelMetrics] = None
    featuresUsed: List[str] = Field(default_factory=list)
    trainingObservations: int = 0
    testObservations: int = 0
    selectedModel: Optional[str] = None

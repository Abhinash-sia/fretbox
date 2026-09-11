import pytest
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.services.forecasting import (
    prepare_continuous_timeseries,
    create_features,
    calculate_metrics,
    train_and_evaluate_forecaster,
)
from app.schemas.predict import PredictRequest, DailyComplaintRecord

client = TestClient(app)

def generate_mock_records(days: int = 40, start_str: str = "2026-07-01"):
    base = datetime.strptime(start_str, "%Y-%m-%d")
    records = []
    for i in range(days):
        # Skip day 15 to test gap filling
        if i == 15:
            continue
        dt_str = (base + timedelta(days=i)).strftime("%Y-%m-%d")
        count = int(10 + 5 * (i % 7) + (i % 3))
        records.append(DailyComplaintRecord(date=dt_str, count=count))
    return records

def test_prepare_continuous_timeseries():
    records = [{"date": "2026-08-01", "count": 10}, {"date": "2026-08-03", "count": 20}]
    df = prepare_continuous_timeseries(records)
    assert len(df) == 3
    assert df.iloc[0]["complaint_count"] == 10
    assert df.iloc[1]["complaint_count"] == 0
    assert df.iloc[2]["complaint_count"] == 20
    assert df.iloc[1]["date"] == pd.Timestamp("2026-08-02")

def test_feature_engineering_no_future_leakage():
    records = [{"date": (datetime(2026, 8, 1) + timedelta(days=i)).strftime("%Y-%m-%d"), "count": i + 1} for i in range(20)]
    df = prepare_continuous_timeseries(records)
    df_feat = create_features(df)

    # Check lag 1 at index 5 is count at index 4 (5)
    assert df_feat.iloc[5]["lag_1"] == 5
    # Check lag 7 at index 7 is count at index 0 (1)
    assert df_feat.iloc[7]["lag_7"] == 1
    # Check rolling mean 7 at index 7 is mean of indices 0 to 6
    expected_rm7 = np.mean(list(range(1, 8)))
    assert np.isclose(df_feat.iloc[7]["rolling_mean_7"], expected_rm7)

def test_metrics_calculation():
    y_true = np.array([10, 20, 30])
    y_pred = np.array([12, 18, 33])
    mae, rmse = calculate_metrics(y_true, y_pred)
    assert mae == 2.33
    assert rmse == 2.38

def test_insufficient_data_handling():
    records = [DailyComplaintRecord(date="2026-08-01", count=5)]
    req = PredictRequest(horizonDays=7, historyDays=30, records=records)
    res = train_and_evaluate_forecaster(req)
    assert res.status == "insufficient_data"
    assert len(res.forecast) == 0

def test_forecasting_end_to_end():
    records = generate_mock_records(days=45)
    req = PredictRequest(horizonDays=7, historyDays=60, records=records)
    res = train_and_evaluate_forecaster(req)

    assert res.status == "success"
    assert len(res.forecast) == 7
    assert res.model is not None
    assert res.baseline is not None
    assert res.model.mae >= 0
    assert res.baseline.mae >= 0
    for f in res.forecast:
        assert f.predictedComplaints >= 0
        assert isinstance(f.date, str)

def test_fastapi_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_fastapi_predict_endpoint():
    records = generate_mock_records(days=35)
    payload = {
        "horizonDays": 7,
        "historyDays": 60,
        "records": [r.model_dump() for r in records],
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["forecast"]) == 7

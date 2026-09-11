import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import RandomForestRegressor
from app.config import settings
from app.schemas.predict import PredictRequest, PredictResponse, ForecastItem, ModelMetrics

def prepare_continuous_timeseries(records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Parses daily records, fills missing date gaps with complaint_count=0,
    and returns a chronologically sorted DataFrame.
    """
    if not records:
        return pd.DataFrame(columns=["date", "complaint_count"])

    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    df["count"] = df["count"].astype(int)

    # Sort by date
    df = df.sort_values("date").reset_index(drop=True)

    # Reindex to continuous daily date range
    start_date = df["date"].min()
    end_date = df["date"].max()
    full_date_range = pd.date_range(start=start_date, end=end_date, freq="D")

    df_full = pd.DataFrame({"date": full_date_range})
    df_merged = pd.merge(df_full, df, on="date", how="left")
    df_merged["count"] = df_merged["count"].fillna(0).astype(int)
    df_merged = df_merged.rename(columns={"count": "complaint_count"})
    return df_merged

def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers time features & lag/rolling statistics.
    Guarantees NO data leakage by deriving lags strictly from past observations.
    """
    df = df.copy()
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)

    # Lags (strictly historical)
    df["lag_1"] = df["complaint_count"].shift(1)
    df["lag_7"] = df["complaint_count"].shift(7)

    # Rolling means (strictly past observations excluding current)
    df["rolling_mean_7"] = df["complaint_count"].shift(1).rolling(window=7, min_periods=1).mean()
    df["rolling_mean_14"] = df["complaint_count"].shift(1).rolling(window=14, min_periods=1).mean()

    return df

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Tuple[float, float]:
    """
    Calculates MAE and RMSE rounded to 2 decimal places.
    """
    if len(y_true) == 0:
        return 0.0, 0.0

    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    return round(mae, 2), round(rmse, 2)

def train_and_evaluate_forecaster(request: PredictRequest) -> PredictResponse:
    """
    Main forecasting workflow:
    1. Check minimum historical observations requirement (MIN_HISTORY_DAYS).
    2. Build continuous daily time series dataframe.
    3. Feature engineering without data leakage.
    4. Chronological train/test split (80/20).
    5. Evaluate 7-day seasonal naive baseline vs RandomForestRegressor.
    6. Generate iterative multi-step forecast for requested horizon.
    """
    # 1. Continuous Time Series
    records_dict = [{"date": r.date, "count": r.count} for r in request.records]
    df = prepare_continuous_timeseries(records_dict)

    if len(df) < settings.MIN_HISTORY_DAYS:
        return PredictResponse(
            status="insufficient_data",
            message=f"Not enough historical complaint data to generate a reliable forecast. Required at least {settings.MIN_HISTORY_DAYS} daily observations, found {len(df)}.",
            forecast=[],
        )

    # 2. Feature Engineering
    df_featured = create_features(df)

    # Drop early rows with NaN lag_7
    clean_df = df_featured.dropna().reset_index(drop=True)
    if len(clean_df) < 14:
        return PredictResponse(
            status="insufficient_data",
            message="Insufficient continuous observations after lag feature generation.",
            forecast=[],
        )

    feature_cols = [
        "day_of_week",
        "day_of_month",
        "month",
        "is_weekend",
        "lag_1",
        "lag_7",
        "rolling_mean_7",
        "rolling_mean_14",
    ]

    # 3. Chronological Train / Test Split (80% Train, 20% Test)
    split_idx = int(len(clean_df) * 0.8)
    if split_idx == len(clean_df):
        split_idx = len(clean_df) - 1

    train_df = clean_df.iloc[:split_idx]
    test_df = clean_df.iloc[split_idx:]

    X_train = train_df[feature_cols].values
    y_train = train_df["complaint_count"].values
    X_test = test_df[feature_cols].values
    y_test = test_df["complaint_count"].values

    # 4. Baseline Model: 7-day Seasonal Naive Forecast
    # Prediction on test set = lag_7 feature
    baseline_pred = test_df["lag_7"].values
    baseline_mae, baseline_rmse = calculate_metrics(y_test, baseline_pred)

    # 5. ML Model: RandomForestRegressor
    rf = RandomForestRegressor(
        n_estimators=100,
        random_state=settings.RANDOM_STATE,
        max_depth=6,
        min_samples_split=4,
    )
    rf.fit(X_train, y_train)

    ml_pred = rf.predict(X_test)
    ml_pred_clamped = np.clip(np.round(ml_pred), 0, None)
    ml_mae, ml_rmse = calculate_metrics(y_test, ml_pred_clamped)

    # 6. Model Selection: Choose ML if MAE/RMSE is better or equal to baseline
    use_ml_model = ml_mae <= baseline_mae

    # Re-train on full clean dataset for final production forecast
    rf_full = RandomForestRegressor(
        n_estimators=100,
        random_state=settings.RANDOM_STATE,
        max_depth=6,
        min_samples_split=4,
    )
    rf_full.fit(clean_df[feature_cols].values, clean_df["complaint_count"].values)

    # 7. Iterative Multi-step Forecast
    forecast_items: List[ForecastItem] = []
    current_history = df["complaint_count"].tolist()
    last_date = df["date"].max()

    for step in range(1, request.horizonDays + 1):
        next_date = last_date + timedelta(days=step)

        # Build feature vector for next_date using current_history
        dow = next_date.dayofweek
        dom = next_date.day
        month = next_date.month
        is_wknd = 1 if dow >= 5 else 0

        lag1 = current_history[-1]
        lag7 = current_history[-7] if len(current_history) >= 7 else current_history[0]

        rm7 = float(np.mean(current_history[-7:])) if len(current_history) >= 7 else float(np.mean(current_history))
        rm14 = float(np.mean(current_history[-14:])) if len(current_history) >= 14 else float(np.mean(current_history))

        feat_vector = np.array([[dow, dom, month, is_wknd, lag1, lag7, rm7, rm14]])

        if use_ml_model:
            pred_val = rf_full.predict(feat_vector)[0]
        else:
            # Baseline fallback forecast
            pred_val = lag7

        # Clamp prediction >= 0
        clamped_val = max(0, int(round(pred_val)))
        forecast_items.append(
            ForecastItem(
                date=next_date.strftime("%Y-%m-%d"),
                predictedComplaints=clamped_val,
            )
        )

        # Append predicted value to history for next iteration
        current_history.append(clamped_val)

    return PredictResponse(
        status="success",
        message="Demand prediction generated successfully.",
        forecast=forecast_items,
        model=ModelMetrics(name="RandomForestRegressor", mae=ml_mae, rmse=ml_rmse),
        baseline=ModelMetrics(name="7-day-seasonal-naive", mae=baseline_mae, rmse=baseline_rmse),
        featuresUsed=feature_cols,
        trainingObservations=len(train_df),
        testObservations=len(test_df),
        selectedModel="RandomForestRegressor" if use_ml_model else "7-day-seasonal-naive",
    )

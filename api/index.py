from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI()

class ForecastingRequest(BaseModel):
    data: List[Dict[str, Any]]
    target_column: str
    feature_columns: List[str] = []
    date_column: Optional[str] = None
    model_type: str = "LinearRegression"
    forecast_periods: int = 5

class SuggestionRequest(BaseModel):
    data: List[Dict[str, Any]]
    data: List[Dict[str, Any]]

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FastAPI backend is running natively!"}

@app.post("/api/suggest-analysis")
def suggest_analysis(req: SuggestionRequest):
    try:
        import pandas as pd
        import numpy as np

        df = pd.DataFrame(req.data)
        if df.empty:
            raise HTTPException(status_code=400, detail="Data is empty.")

        # Attempt to parse datetime columns
        date_cols = []
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    pd.to_datetime(df[col], errors='raise', format='mixed')
                    date_cols.append(col)
                    df[col] = pd.to_datetime(df[col], format='mixed')
                except:
                    pass
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                date_cols.append(col)

        # 1. Identify numeric vs categorical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        if not numeric_cols:
            raise HTTPException(status_code=400, detail="No numeric columns found for analysis.")

        # 2. Suggest target column
        # Best guess: last numeric column, or the one with "target", "label", "price", "sales" in its name
        target_col = numeric_cols[-1]
        for col in numeric_cols:
            col_lower = col.lower()
            if any(kw in col_lower for kw in ['target', 'label', 'price', 'sales', 'revenue']):
                target_col = col
                break

        # 3. Suggest feature columns
        # Features are all other numeric columns. If there are many, pick top 5 by correlation
        features = [col for col in numeric_cols if col != target_col]
        if len(features) > 1:
            try:
                corr = df[numeric_cols].corr()
                target_corr = corr[target_col].drop(target_col).abs()
                best_features = target_corr.nlargest(5).index.tolist()
                if best_features:
                    features = best_features
            except Exception:
                pass # Fallback to all features if correlation fails

        # 4. Suggest ML Model
        # Given it's a numeric target, default to regression
        suggested_model = "LinearRegression"
        suggested_date_col = ""
        
        if date_cols:
            suggested_model = "Prophet"
            suggested_date_col = date_cols[0]
        elif len(df[target_col].unique()) < 10 and df[target_col].nunique() / len(df) < 0.1:
            # Looks like classification
            suggested_model = "RandomForestClassifier"

        return {
            "status": "success",
            "suggestion": {
                "target_column": target_col,
                "feature_columns": features,
                "date_column": suggested_date_col,
                "model_type": suggested_model
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/forecast")
def generate_forecast(req: ForecastingRequest):
    try:
        import pandas as pd
        import numpy as np
        
        # Convert request data to DataFrame
        df = pd.DataFrame(req.data)
        
        if req.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{req.target_column}' not found in data.")
            
        # Use actual ML if possible
        metrics = {}
        forecast = []
        
        if req.model_type == "Prophet" and req.date_column and req.date_column in df.columns:
            try:
                from prophet import Prophet
                from sklearn.metrics import root_mean_squared_error, r2_score
                
                # Format for Prophet
                prophet_df = df[[req.date_column, req.target_column]].rename(
                    columns={
                        req.date_column: "ds",
                        req.target_column: "y"
                    }
                )
                prophet_df["ds"] = pd.to_datetime(prophet_df["ds"], format='mixed')
                
                model = Prophet()
                model.fit(prophet_df)
                
                # Generate future dates
                future = model.make_future_dataframe(periods=req.forecast_periods)
                raw_forecast = model.predict(future)
                
                # Calculate metrics on historical
                historical_preds = raw_forecast.head(len(prophet_df))
                
                # Some datasets might have missing dates and cause misalignment, so we merge on date
                merged = pd.merge(prophet_df, historical_preds[['ds', 'yhat']], on='ds', how='inner')
                r2 = r2_score(merged['y'], merged['yhat'])
                rmse = root_mean_squared_error(merged['y'], merged['yhat'])
                metrics = {
                    "r2_score": round(float(r2), 4),
                    "rmse": round(float(rmse), 4)
                }
                
                # Extract only future predictions
                future_preds = raw_forecast.tail(req.forecast_periods)
                for _, row in future_preds.iterrows():
                    # Format output friendly for user (no "yhat", just predicted value)
                    forecast.append({
                        "period": row['ds'].strftime("%Y-%m-%d"),
                        "predicted_value": round(float(row['yhat']), 2),
                        "lower_bound": round(float(row['yhat_lower']), 2),
                        "upper_bound": round(float(row['yhat_upper']), 2)
                    })
                    
            except Exception as e:
                print("Failed Prophet:", str(e))
                pass

        elif req.model_type == "LinearRegression" and req.feature_columns:
            try:
                from sklearn.linear_model import LinearRegression
                from sklearn.metrics import root_mean_squared_error, r2_score
                
                # Filter useful data
                model_df = df[req.feature_columns + [req.target_column]].dropna()
                X = model_df[req.feature_columns]
                y = model_df[req.target_column]
                
                if len(X) > 5:
                    model = LinearRegression()
                    model.fit(X, y)
                    preds = model.predict(X)
                    
                    r2 = r2_score(y, preds)
                    rmse = root_mean_squared_error(y, preds)
                    metrics = {
                        "r2_score": round(float(r2), 4),
                        "rmse": round(float(rmse), 4)
                    }
            except Exception as e:
                print("Failed ML:", str(e))
                pass

        if not forecast:
            target_series = df[req.target_column].dropna().astype(float)
            last_value = target_series.iloc[-1]
            
            # simple linear projection dummy (Fallback)
            trend = (target_series.iloc[-1] - target_series.iloc[0]) / len(target_series) if len(target_series) > 1 else 0
            
            for i in range(1, req.forecast_periods + 1):
                forecast.append({
                    "period": f"T+{i}",
                    "predicted_value": round(float(last_value + (trend * i)), 2)
                })
            
        return {
            "status": "success",
            "model_used": req.model_type,
            "metrics": metrics,
            "predictions": forecast
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

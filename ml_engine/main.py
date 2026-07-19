from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import random
import math


#edit2

app = FastAPI(title="NAP Trust Gravity ML Engine")

# Enable CORS so the React app can call it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionFeatures(BaseModel):
    account_age_days: int
    historical_transaction_count: int
    shared_transaction_count: int
    amount: float
    avg_transaction_amount: float
    max_transaction_amount: float
    time_anomaly_hour: int
    sender_exposure_score: float
    receiver_exposure_score: float
    address_proximity_score: float
    workplace_proximity_score: float
    travel_route_similarity_score: float
    location_overlap_score: float
    distance_from_usual_behavior: float
    device_ip_change: float

@app.post("/predict")
async def predict_trust_score(data: TransactionFeatures):
    # This is a robust mock simulation of an XGBoost/Logistic Regression model.
    # In a full production scenario, we would `import joblib` and `model.predict_proba()`.
    
    # 1. Base Probability 
    p = 0.5
    
    # 2. Add/subtract based on ML-like feature coefficients
    
    # Account Age (Older is better)
    if data.account_age_days > 365: p += 0.15
    elif data.account_age_days > 180: p += 0.1
    elif data.account_age_days < 7: p -= 0.2
        
    # Transaction History Frequency (More is better, implies stability)
    if data.historical_transaction_count > 50: p += 0.15
    elif data.historical_transaction_count > 20: p += 0.1
    elif data.historical_transaction_count == 0: p -= 0.1
        
    # Shared Transactions (Very strong predictor)
    if data.shared_transaction_count > 10: p += 0.2
    elif data.shared_transaction_count > 5: p += 0.15
    elif data.shared_transaction_count > 0: p += 0.05
        
    # Amount Anomaly (Is this amount weird compared to historical?)
    if data.avg_transaction_amount > 0:
        ratio = data.amount / max(1.0, data.avg_transaction_amount)
        if ratio > 10: p -= 0.3
        elif ratio > 5: p -= 0.2
        elif ratio > 2: p -= 0.1
        elif ratio < 1.2: p += 0.05
            
    # Time Anomaly (Late night is risky)
    if 1 <= data.time_anomaly_hour <= 5: p -= 0.15
        
    # Network Exposure
    combined_exposure = (data.sender_exposure_score + data.receiver_exposure_score) / 2
    if combined_exposure > 50: p -= 0.25
    elif combined_exposure > 20: p -= 0.1
    elif combined_exposure < 5: p += 0.05
        
    # Spatial/Geographic Features (Crucial for NAP)
    if data.address_proximity_score >= 80: p += 0.15
    if data.workplace_proximity_score >= 80: p += 0.1
    if data.travel_route_similarity_score >= 70: p += 0.1
    if data.location_overlap_score >= 70: p += 0.15
    elif data.location_overlap_score < 20: p -= 0.15
        
    # New features: Distance from usual and Device change
    if data.distance_from_usual_behavior < 20: p -= 0.2  # 0 is far/unusual
    elif data.distance_from_usual_behavior > 80: p += 0.05
        
    if data.device_ip_change > 80: p -= 0.25  # 100 is fully changed IP/Device
    
    # Synergistic strict rules (Real-world scenarios)
    # New device + Far from usual = High Risk
    if data.device_ip_change > 50 and data.distance_from_usual_behavior < 30:
        p -= 0.25
        
    # New account + Large amount = Extreme Risk
    if data.account_age_days < 7 and data.amount > 5000:
        p -= 0.3
        
    # Late night + High amount multiplier
    if (1 <= data.time_anomaly_hour <= 5) and (data.amount > data.avg_transaction_amount * 3):
        p -= 0.2

    # Introduce small random variance to mimic real ML model uncertainty boundaries
    p += random.uniform(-0.01, 0.01)
    
    # Sigmoid squeeze to ensure output is strictly 0.0 to 1.0
    # Center shifted slightly up so baseline is safe-ish
    x = (p - 0.5) * 6
    final_p = 1 / (1 + math.exp(-x))
    
    # Ensure strict bounds
    final_p = max(0.01, min(0.99, final_p))
    
    return {
        "probability_score": final_p,
        "model_version": "xgb_v1_mock"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
from sqlalchemy import create_engine, text
from data_preprocessing import get_clean_data # We'll reuse this for feature engineering

app = FastAPI()

# --- Load Models ---
try:
    attrition_model = joblib.load('attrition_model.pkl')
    fee_default_model = joblib.load('fee_default_model.pkl')
except FileNotFoundError:
    print("Models not found. Please run train_model.py first.")
    attrition_model = None
    fee_default_model = None

# --- Database Configuration ---
DB_USER = 'root'
DB_PASSWORD = ''
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'school_ms'

DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

class Student(BaseModel):
    student_id: int

@app.post("/predict")
def predict(student: Student):
    if not attrition_model or not fee_default_model:
        raise HTTPException(status_code=503, detail="Models are not available. Please train them first.")

    # --- Feature Engineering for a Single Student ---
    # This is a simplified version of the preprocessing script, focused on a single student
    try:
        X, _, _, student_ids_map = get_clean_data()
        # Find the correct internal ID for the student
        student_row = student_ids_map[student_ids_map['id'] == student.student_id]
        if student_row.empty:
             student_row = student_ids_map[student_ids_map['student_id_x'] == student.student_id]
        if student_row.empty:
             student_row = student_ids_map[student_ids_map['student_id_y'] == student.student_id]
        
        if student_row.empty:
            raise HTTPException(status_code=404, detail="Student not found in the dataset used for training.")

        student_index = student_row.index[0]
        student_features = X.loc[[student_index]]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching or processing student data: {e}")

    # --- Prediction ---
    attrition_prob = attrition_model.predict_proba(student_features)[:, 1][0]
    fee_default_prob = fee_default_model.predict_proba(student_features)[:, 1][0]

    return {
        "student_id": student.student_id,
        "attrition_risk": round(float(attrition_prob), 4),
        "fee_default_risk": round(float(fee_default_prob), 4)
    }

if __name__ == '__main__':
    import uvicorn
    print("--- To run the service, use the command: ---")
    print("uvicorn main:app --reload")
    print("\n--- Example cURL request ---")
    print("curl -X POST 'http://127.0.0.1:8000/predict' -H 'Content-Type: application/json' -d '{\"student_id\": 1}'")

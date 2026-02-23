import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import numpy as np

# --- Database Configuration ---
DB_USER = 'root'
DB_PASSWORD = ''
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'school_ms'

DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)

def get_clean_data():
    """
    Connects to the database, loads data, engineers features, and returns
    a clean feature matrix (X) and two target labels (y_attrition, y_fee_default).
    """
    # Load data
    with engine.connect() as connection:
        students_df = pd.read_sql("SELECT * FROM students", connection)
        attendance_df = pd.read_sql("SELECT * FROM attendance", connection)
        exams_df = pd.read_sql("SELECT * FROM exams", connection)
        fees_df = pd.read_sql("SELECT * FROM fee_payments", connection)

    # --- Feature Engineering ---
    df = students_df.copy()

    # 1. Attrition Target Variable
    df['attrition_target'] = (df['status'] == 'withdrawn').astype(int)

    # 2. Attendance Features
    attendance_df['date'] = pd.to_datetime(attendance_df['date'])
    today = datetime.now()

    for days in [30, 60, 90]:
        start_date = today - timedelta(days=days)
        recent_attendance = attendance_df[attendance_df['date'] >= start_date]
        attendance_summary = recent_attendance.groupby('student_id')['present'].mean().reset_index()
        attendance_summary.rename(columns={'present': f'attendance_pct_{days}d'}, inplace=True)
        df = pd.merge(df, attendance_summary, left_on='id', right_on='student_id', how='left')

    # 3. Exam Score Features
    exam_summary = exams_df.groupby('student_id')['score'].agg(['mean', 'std']).reset_index()
    exam_summary.rename(columns={'mean': 'exam_avg_score', 'std': 'exam_std_score'}, inplace=True)
    df = pd.merge(df, exam_summary, left_on='id', right_on='student_id', how='left')

    # 4. Fee Default Features
    fees_df['due_date'] = pd.to_datetime(fees_df['due_date'])
    fees_df['payment_date'] = pd.to_datetime(fees_df['payment_date'])
    fees_df['days_late'] = (fees_df['payment_date'] - fees_df['due_date']).dt.days
    fees_df['is_late'] = (fees_df['days_late'] > 0).astype(int)

    fee_summary = fees_df.groupby('student_id').agg(
        late_payment_freq=('is_late', 'mean'),
        total_due=('amount_due', 'sum'),
        total_paid=('amount_paid', 'sum')
    ).reset_index()

    fee_summary['outstanding_balance_ratio'] = (fee_summary['total_due'] - fee_summary['total_paid']) / fee_summary['total_due']
    df = pd.merge(df, fee_summary[['student_id', 'late_payment_freq', 'outstanding_balance_ratio']], left_on='id', right_on='student_id', how='left')

    # 5. Fee Default Target Variable
    # A student is considered a defaulter if their outstanding balance is > 0 and they have a history of late payments
    df['fee_default_target'] = ((df['outstanding_balance_ratio'] > 0) & (df['late_payment_freq'] > 0.2)).astype(int)

    # --- Data Cleaning & Preprocessing ---
    # Fill missing values
    for col in [f'attendance_pct_{d}d' for d in [30, 60, 90]]:
        df[col].fillna(df[col].mean(), inplace=True)
    df['exam_avg_score'].fillna(df['exam_avg_score'].mean(), inplace=True)
    df['exam_std_score'].fillna(0, inplace=True)
    df['late_payment_freq'].fillna(0, inplace=True)
    df['outstanding_balance_ratio'].fillna(0, inplace=True)

    # Encode categorical variables
    df = pd.get_dummies(df, columns=['class_level'], drop_first=True)

    # Select features
    features = [col for col in df.columns if col.startswith('attendance_pct_') or col.startswith('exam_') or col.startswith('late_payment_') or col.startswith('outstanding_balance_') or col.startswith('class_level_')]

    X = df[features]
    y_attrition = df['attrition_target']
    y_fee_default = df['fee_default_target']

    return X, y_attrition, y_fee_default, df[['id', 'student_id_x', 'student_id_y']]

if __name__ == '__main__':
    X, y_attrition, y_fee_default, _ = get_clean_data()
    print("--- Feature Matrix (X) ---")
    print(X.head())
    print("\n--- Attrition Target (y_attrition) ---")
    print(y_attrition.head())
    print("\n--- Fee Default Target (y_fee_default) ---")
    print(y_fee_default.head())

from data_preprocessing import get_clean_data
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import pandas as pd

def train_and_evaluate(X, y, model_name):
    """
    Trains and evaluates a model for a given prediction task.
    """
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # --- Logistic Regression (Baseline) ---
    lr = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    lr_preds = lr.predict(X_test)
    lr_probs = lr.predict_proba(X_test)[:, 1]

    # --- Random Forest ---
    rf = RandomForestClassifier(class_weight='balanced', n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)
    rf_probs = rf.predict_proba(X_test)[:, 1]

    # --- Evaluation ---
    models = {
        'Logistic Regression': (lr_preds, lr_probs),
        'Random Forest': (rf_preds, rf_probs)
    }

    best_model = None
    best_auc = 0

    print(f"--- Evaluation for {model_name} Prediction ---")
    for name, (preds, probs) in models.items():
        auc = roc_auc_score(y_test, probs)
        precision = precision_score(y_test, preds)
        recall = recall_score(y_test, preds)
        f1 = f1_score(y_test, preds)
        cm = confusion_matrix(y_test, preds)

        print(f"\n--- {name} ---")
        print(f"ROC-AUC: {auc:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1 Score: {f1:.4f}")
        print("Confusion Matrix:")
        print(cm)

        if auc > best_auc:
            best_auc = auc
            best_model = lr if name == 'Logistic Regression' else rf

    # Save the best model
    model_filename = f"{model_name.lower().replace(' ', '_')}_model.pkl"
    joblib.dump(best_model, model_filename)
    print(f"\nBest model ({type(best_model).__name__}) saved as {model_filename}")

if __name__ == '__main__':
    X, y_attrition, y_fee_default, _ = get_clean_data()

    # Ensure we have enough data to stratify
    if y_attrition.nunique() > 1:
        train_and_evaluate(X, y_attrition, 'Attrition')
    else:
        print("Skipping attrition model training: Not enough class diversity.")

    if y_fee_default.nunique() > 1:
        train_and_evaluate(X, y_fee_default, 'Fee Default')
    else:
        print("Skipping fee default model training: Not enough class diversity.")

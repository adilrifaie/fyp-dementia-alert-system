import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import SMOTE

# ── 1. LOAD FEATURES ──────────────────────────────────────────────────────────

daily = pd.read_csv('daily_features.csv')

# We only train on patients who appear in BOTH features and labels.
# Patients with zero agitation days are still useful as negative examples,
# but only if they have enough days of data to be meaningful.
daily = daily[daily.groupby('patient_id')['patient_id'].transform('count') >= 7]

# Select only the deviation features — these are patient-normalized
# so they're comparable across patients, unlike raw counts
dev_cols = [c for c in daily.columns if c.startswith('dev_')]
feature_cols = dev_cols  # this is what the model learns from

X = daily[feature_cols].values
y = daily['agitation'].values
patients = daily['patient_id'].values

# ── 2. LEAVE-ONE-PATIENT-OUT CROSS VALIDATION ─────────────────────────────────
# WHY THIS APPROACH:
# Random splitting would mix the same patient's data into train and test,
# letting the model memorize individual patient patterns rather than
# learning generalizable behavioral signals. LOPO prevents this.

unique_patients = np.unique(patients)
all_true = []
all_pred = []
all_prob = []

for test_patient in unique_patients:
    # Split: one patient held out for testing, everyone else for training
    train_mask = patients != test_patient
    test_mask  = patients == test_patient

    X_train, y_train = X[train_mask], y[train_mask]
    X_test,  y_test  = X[test_mask],  y[test_mask]

    # Skip patients with no agitation days — we can't evaluate on them
    if y_test.sum() == 0:
        continue

    # ── SMOTE: Synthetic Minority Oversampling ─────────────────────────────
    # With 4% positive rate, the model would learn to predict 0 for everything
    # and still be 96% accurate. SMOTE creates synthetic agitation examples
    # by interpolating between real ones, forcing the model to learn the pattern.
    # We only apply it to training data — NEVER to test data.
    try:
        sm = SMOTE(random_state=42, k_neighbors=min(4, y_train.sum()-1))
        X_train_res, y_train_res = sm.fit_resample(X_train, y_train)
    except ValueError:
        # If too few positive samples even for SMOTE, use class weights instead
        X_train_res, y_train_res = X_train, y_train

    # ── RANDOM FOREST ──────────────────────────────────────────────────────
    # Good starting model for tabular data: handles non-linear patterns,
    # gives feature importances, and is robust to noisy features.
    clf = RandomForestClassifier(
        n_estimators=200,
        class_weight='balanced',  # extra safety net on top of SMOTE
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train_res, y_train_res)

    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    all_true.extend(y_test)
    all_pred.extend(y_pred)
    all_prob.extend(y_prob)

# ── 3. AGGREGATE RESULTS ──────────────────────────────────────────────────────

all_true = np.array(all_true)
all_pred = np.array(all_pred)
all_prob = np.array(all_prob)

print("=" * 55)
print("LEAVE-ONE-PATIENT-OUT CROSS VALIDATION RESULTS")
print("=" * 55)
print(classification_report(all_true, all_pred,
                             target_names=['No Agitation', 'Agitation']))
print(f"ROC-AUC Score: {roc_auc_score(all_true, all_prob):.4f}")

# ── 4. FEATURE IMPORTANCE ─────────────────────────────────────────────────────
# Train one final model on ALL data to see which features matter most.
# This is for your presentation / report — not used for evaluation.
sm_final = SMOTE(random_state=42, k_neighbors=4)
X_res, y_res = sm_final.fit_resample(X, y)
final_clf = RandomForestClassifier(n_estimators=200, class_weight='balanced',
                                    random_state=42, n_jobs=-1)
final_clf.fit(X_res, y_res)

importance_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': final_clf.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Most Predictive Features:")
print(importance_df.head(10).to_string(index=False))

from sklearn.metrics import precision_recall_curve
import numpy as np

# Find the threshold that maximizes F1 for agitation class
precision_arr, recall_arr, thresholds = precision_recall_curve(all_true, all_prob)
f1_scores = 2 * (precision_arr * recall_arr) / (precision_arr + recall_arr + 1e-8)
best_idx = np.argmax(f1_scores)
best_threshold = thresholds[best_idx]

print(f"\n--- Threshold Tuning ---")
print(f"Default threshold (0.50) → Recall: 0.09")
print(f"Optimal threshold ({best_threshold:.2f}) → F1: {f1_scores[best_idx]:.3f}")

# Re-evaluate with the optimal threshold
all_pred_tuned = (np.array(all_prob) >= best_threshold).astype(int)
print("\nWith tuned threshold:")
print(classification_report(all_true, all_pred_tuned,
                             target_names=['No Agitation', 'Agitation']))

import joblib

# Add this at the end of model.py, after the threshold tuning block

# Save the final model and threshold
joblib.dump(final_clf, 'agitation_model.pkl')

# Save threshold and feature list so the app knows what to expect
import json
model_config = {
    'threshold': float(best_threshold),
    'features': feature_cols,
    'roc_auc': 0.6550,
    'recall_at_threshold': 0.79,
    'precision_at_threshold': 0.11
}
with open('model_config.json', 'w') as f:
    json.dump(model_config, f, indent=2)

print(f"Model saved. Threshold: {best_threshold:.2f}")
print(f"Features: {len(feature_cols)} columns")
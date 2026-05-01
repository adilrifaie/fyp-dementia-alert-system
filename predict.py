import pandas as pd
import numpy as np
import joblib
import json

model = joblib.load('agitation_model.pkl')
with open('model_config.json') as f:
    config = json.load(f)

threshold = config['threshold']
feature_cols = config['features']

daily = pd.read_csv('daily_features.csv')
daily['date_only'] = pd.to_datetime(daily['date_only']).dt.strftime('%Y-%m-%d')

X = daily[feature_cols].values
probs = model.predict_proba(X)[:, 1]
preds = (probs >= threshold).astype(int)

daily['risk_score'] = np.round(probs, 4)
daily['alert'] = preds

# Build output grouped by patient
output = {}
for patient_id, group in daily.groupby('patient_id'):
    output[patient_id] = group[
        ['date_only', 'risk_score', 'alert', 'agitation',
         'dev_Hallway', 'dev_total_movements',
         'dev_nocturnal_movements', 'dev_first_movement_hour']
    ].to_dict(orient='records')

with open('predictions.json', 'w') as f:
    json.dump(output, f)

print(f"Done. {len(output)} patients, {len(daily)} days scored.")
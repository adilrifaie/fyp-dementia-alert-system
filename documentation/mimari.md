```
Ham Veri (Activity.csv)
         │
         ▼
feature_engineering.py
         │
         ▼
daily_features.csv (2.722 satır — hasta × gün)
         │
         ▼
model.py
         │
         ▼
agitation_model.pkl + model_config.json
         │
         ▼
predict.py → predictions.json (56 hasta, 2.722 gün)
         │
         ▼
Express API (Node.js)
         │
         ├──────────────────────────────┐
         ▼                              ▼
React Arayüzü (Vite)          DementIQ Mobil (React Native + Expo)
     
```
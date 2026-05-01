import pandas as pd
import numpy as np

# ── 1. LOAD AND CLEAN ──────────────────────────────────────────────────────────

activity = pd.read_csv('Activity.csv')
labels = pd.read_csv('Labels.csv')

# Parse dates properly — we need both the full timestamp (for hour extraction)
# and just the date part (for grouping by day)
activity['datetime'] = pd.to_datetime(activity['date'])
activity['date_only'] = activity['datetime'].dt.date
activity['hour'] = activity['datetime'].dt.hour

# Keep only agitation events from labels
agitation = labels[labels['type'] == 'Agitation'].copy()
agitation['date_only'] = pd.to_datetime(agitation['date']).dt.date

# ── 2. BUILD THE DAILY ROOM COUNTS ────────────────────────────────────────────
# This pivots the event-level data into one row per (patient, day),
# with a column for each room showing how many times the sensor fired.

room_counts = (
    activity
    .groupby(['patient_id', 'date_only', 'location_name'])
    .size()
    .unstack(fill_value=0)  # rooms become columns; 0 if no activity that day
    .reset_index()
)

# Rename room columns to be code-friendly
room_counts.columns.name = None
room_cols = [c for c in room_counts.columns if c not in ['patient_id', 'date_only']]

# ── 3. VOLUME AND TEMPORAL FEATURES ───────────────────────────────────────────
# Total movement and split by time of day

# Total movements per patient per day
daily_total = (
    activity
    .groupby(['patient_id', 'date_only'])
    .size()
    .reset_index(name='total_movements')
)

# Nocturnal movements: 10pm (hour 22) through 7am (hour < 7)
# This is clinically one of the strongest agitation-precursor signals
nocturnal = activity[
    (activity['hour'] >= 22) | (activity['hour'] < 7)
].groupby(['patient_id', 'date_only']).size().reset_index(name='nocturnal_movements')

# First movement of the day — a proxy for wake time
# Late first movement can indicate low energy or withdrawal
first_movement = (
    activity
    .groupby(['patient_id', 'date_only'])['hour']
    .min()
    .reset_index(name='first_movement_hour')
)

# Longest gap between consecutive movements (in minutes)
# A patient who freezes for 3 hours mid-day is showing unusual behavior
def longest_gap_minutes(times):
    if len(times) < 2:
        return 0
    times_sorted = times.sort_values()
    gaps = times_sorted.diff().dt.total_seconds().dropna() / 60
    return gaps.max()

longest_gap = (
    activity
    .groupby(['patient_id', 'date_only'])['datetime']
    .apply(longest_gap_minutes)
    .reset_index(name='longest_gap_minutes')
)

# Front/back door activity after 10pm — wandering signal
door_nocturnal = activity[
    (activity['hour'] >= 22) | (activity['hour'] < 7)
][activity['location_name'].isin(['Front Door', 'Back Door'])].groupby(
    ['patient_id', 'date_only']
).size().reset_index(name='nocturnal_door_events')

# ── 4. MERGE ALL DAILY FEATURES ───────────────────────────────────────────────

# Start with room counts as the base (it already has all patient-days)
daily = room_counts.copy()
daily = daily.merge(daily_total, on=['patient_id', 'date_only'], how='left')
daily = daily.merge(nocturnal, on=['patient_id', 'date_only'], how='left')
daily = daily.merge(first_movement, on=['patient_id', 'date_only'], how='left')
daily = daily.merge(longest_gap, on=['patient_id', 'date_only'], how='left')
daily = daily.merge(door_nocturnal, on=['patient_id', 'date_only'], how='left')
daily = daily.fillna(0)  # days with no nocturnal/door activity get 0

# ── 5. WITHIN-SUBJECT NORMALIZATION (DEVIATION FEATURES) ─────────────────────
# This is the most important step conceptually.
# One patient might average 300 movements/day; another might average 80.
# Raw counts make these patients incomparable.
# Instead, we ask: "how different is TODAY from THIS patient's normal?"

# Compute each patient's personal baseline (mean and std per feature)
feature_cols = room_cols + [
    'total_movements', 'nocturnal_movements',
    'first_movement_hour', 'longest_gap_minutes', 'nocturnal_door_events'
]

patient_baseline = daily.groupby('patient_id')[feature_cols].transform('mean')
patient_std = daily.groupby('patient_id')[feature_cols].transform('std').replace(0, 1)

# Z-score deviation: (today's value - patient's average) / patient's std deviation
# A z-score of -2 means "2 standard deviations below normal for this patient"
deviation_cols = {col: f'dev_{col}' for col in feature_cols}
for col, dev_col in deviation_cols.items():
    daily[dev_col] = (daily[col] - patient_baseline[col]) / patient_std[col]

# ── 6. ATTACH LABELS ──────────────────────────────────────────────────────────

# Create a set of (patient_id, date) pairs where agitation occurred
agitation_days = set(zip(agitation['patient_id'], agitation['date_only']))

daily['agitation'] = daily.apply(
    lambda row: 1 if (row['patient_id'], row['date_only']) in agitation_days else 0,
    axis=1
)

# ── 7. SAVE AND INSPECT ───────────────────────────────────────────────────────

daily.to_csv('daily_features.csv', index=False)

print(f"Final dataset shape: {daily.shape}")
print(f"\nClass distribution:")
print(daily['agitation'].value_counts())
print(f"\nPositive rate: {daily['agitation'].mean():.2%}")
print(f"\nSample of deviation features for one patient:")
sample = daily[daily['patient_id'] == daily['patient_id'].iloc[0]][
    ['date_only', 'dev_total_movements', 'dev_nocturnal_movements', 'agitation']
].head(10)
print(sample)
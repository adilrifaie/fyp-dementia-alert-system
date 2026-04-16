const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load predictions once at startup
const predictionsPath = path.join(__dirname, 'predictions.json');
const predictions = JSON.parse(fs.readFileSync(predictionsPath, 'utf-8'));

const patientIds = Object.keys(predictions);

// ── GET /api/patients ─────────────────────────────────────────────────────────
// Returns a summary list of all patients with their alert stats
app.get('/api/patients', (req, res) => {
  const summary = patientIds.map(id => {
    const days = predictions[id];
    const alertDays = days.filter(d => d.alert === 1).length;
    const actualDays = days.filter(d => d.agitation === 1).length;
    const maxRisk = Math.max(...days.map(d => d.risk_score));
    const latestDate = days[days.length - 1].date_only;

    return {
      patient_id: id,
      total_days: days.length,
      alert_days: alertDays,
      actual_agitation_days: actualDays,
      max_risk_score: parseFloat(maxRisk.toFixed(4)),
      latest_date: latestDate,
      // Risk level based on alert frequency
      risk_level: alertDays > 10 ? 'high' : alertDays > 3 ? 'medium' : 'low'
    };
  });

  // Sort by highest alert days first
  summary.sort((a, b) => b.alert_days - a.alert_days);
  res.json(summary);
});

// ── GET /api/patient/:id ──────────────────────────────────────────────────────
// Returns full day-by-day data for one patient
app.get('/api/patient/:id', (req, res) => {
  const data = predictions[req.params.id];
  if (!data) return res.status(404).json({ error: 'Patient not found' });
  res.json(data);
});

// ── GET /api/summary ──────────────────────────────────────────────────────────
// Overall system stats for the dashboard header
app.get('/api/summary', (req, res) => {
  let totalDays = 0, totalAlerts = 0, totalActual = 0;

  patientIds.forEach(id => {
    const days = predictions[id];
    totalDays += days.length;
    totalAlerts += days.filter(d => d.alert === 1).length;
    totalActual += days.filter(d => d.agitation === 1).length;
  });

  res.json({
    total_patients: patientIds.length,
    total_days_monitored: totalDays,
    total_alerts_raised: totalAlerts,
    total_actual_agitation_days: totalActual,
    model_recall: 0.79,
    model_roc_auc: 0.655,
    threshold: 0.13
  });
});

const PORT = 3001;
app.start = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Loaded ${patientIds.length} patients`);
});
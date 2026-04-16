import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import RiskBadge from '../components/RiskBadge'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [patients, setPatients] = useState([])
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/summary').then(r => setSummary(r.data))
    axios.get('/api/patients').then(r => setPatients(r.data))
  }, [])

  const filtered = filter === 'all'
    ? patients
    : patients.filter(p => p.risk_level === filter)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Dementia Behavioral Alert System
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          Home-based agitation risk monitoring — TIHM Dataset
        </p>
      </div>

      {/* Stats row */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Patients monitored', value: summary.total_patients },
            { label: 'Days monitored', value: summary.total_days_monitored.toLocaleString() },
            { label: 'Alerts raised', value: summary.total_alerts_raised },
            { label: 'Model recall', value: `${(summary.model_recall * 100).toFixed(0)}%` },
          ].map(s => (
            <div key={s.label} style={{
              background: '#1e2330', borderRadius: 12,
              padding: '20px 24px', border: '1px solid #2d3348'
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 8, border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: filter === f ? '#3b82f6' : '#1e2330',
            color: filter === f ? '#fff' : '#94a3b8',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 13, alignSelf: 'center' }}>
          {filtered.length} patients
        </span>
      </div>

      {/* Patient table */}
      <div style={{ background: '#1e2330', borderRadius: 12, border: '1px solid #2d3348', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2d3348' }}>
              {['Patient ID', 'Risk level', 'Alert days', 'Actual agitation days', 'Days monitored', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 20px', textAlign: 'left',
                  fontSize: 12, color: '#64748b', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.patient_id}
                onClick={() => navigate(`/patient/${p.patient_id}`)}
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a1f2e' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#262d3f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 14 }}>
                  {p.patient_id}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <RiskBadge level={p.risk_level} />
                </td>
                <td style={{ padding: '14px 20px', fontSize: 14 }}>{p.alert_days}</td>
                <td style={{ padding: '14px 20px', fontSize: 14 }}>{p.actual_agitation_days}</td>
                <td style={{ padding: '14px 20px', fontSize: 14 }}>{p.total_days}</td>
                <td style={{ padding: '14px 20px', color: '#3b82f6', fontSize: 13 }}>View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
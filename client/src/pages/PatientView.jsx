import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, ResponsiveContainer
} from 'recharts'

export default function PatientView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [days, setDays] = useState([])

  useEffect(() => {
    axios.get(`/api/patient/${id}`).then(r => setDays(r.data))
  }, [id])

  const alertCount = days.filter(d => d.alert === 1).length
  const actualCount = days.filter(d => d.agitation === 1).length
  const maxRisk = days.length ? Math.max(...days.map(d => d.risk_score)) : 0

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{
        background: '#1e2330', border: '1px solid #2d3348',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <div style={{ marginBottom: 6, color: '#94a3b8' }}>{label}</div>
        <div>Risk score: <strong style={{ color: '#3b82f6' }}>{(d.risk_score * 100).toFixed(1)}%</strong></div>
        {d.alert === 1 && <div style={{ color: '#fbbf24' }}>⚠ Alert flagged</div>}
        {d.agitation === 1 && <div style={{ color: '#f87171' }}>✕ Actual agitation</div>}
        <div style={{ marginTop: 6, color: '#64748b', fontSize: 12 }}>
          Hallway dev: {d.dev_Hallway?.toFixed(2)} · Nocturnal: {d.dev_nocturnal_movements?.toFixed(2)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

      {/* Back + header */}
      <button onClick={() => navigate('/')} style={{
        background: 'none', border: 'none', color: '#3b82f6',
        cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0
      }}>
        ← Back to dashboard
      </button>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Patient {id}</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
          {days.length} days monitored · April–June 2019
        </p>
      </div>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Alert days', value: alertCount, color: '#fbbf24' },
          { label: 'Actual agitation days', value: actualCount, color: '#f87171' },
          { label: 'Peak risk score', value: `${(maxRisk * 100).toFixed(1)}%`, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#1e2330', borderRadius: 12,
            padding: '18px 22px', border: '1px solid #2d3348'
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Risk timeline chart */}
      <div style={{
        background: '#1e2330', borderRadius: 12,
        padding: '24px', border: '1px solid #2d3348', marginBottom: 24
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Daily agitation risk score</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={days} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
            <XAxis dataKey="date_only" tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={d => d.slice(5)} interval={6} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.13} stroke="#fbbf24" strokeDasharray="4 4"
              label={{ value: 'Alert threshold', fill: '#fbbf24', fontSize: 11 }} />
            <Area type="monotone" dataKey="risk_score"
              stroke="#3b82f6" fill="url(#riskGrad)" strokeWidth={2} dot={false} />
            {/* Red dots on actual agitation days */}
            {days.filter(d => d.agitation === 1).map(d => (
              <ReferenceLine key={d.date_only} x={d.date_only}
                stroke="#f87171" strokeOpacity={0.4} strokeWidth={1} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: '#64748b' }}>
          <span><span style={{ color: '#3b82f6' }}>—</span> Risk score</span>
          <span><span style={{ color: '#fbbf24' }}>- -</span> Alert threshold (13%)</span>
          <span><span style={{ color: '#f87171' }}>|</span> Actual agitation day</span>
        </div>
      </div>

      {/* Feature table */}
      <div style={{
        background: '#1e2330', borderRadius: 12,
        border: '1px solid #2d3348', overflow: 'hidden'
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #2d3348' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Day-by-day behavioral features</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2d3348' }}>
                {['Date', 'Risk', 'Alert', 'Hallway dev', 'Total mov. dev', 'Nocturnal dev', 'Wake hour dev', 'Actual'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#64748b', fontWeight: 600,
                    fontSize: 11, textTransform: 'uppercase'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={d.date_only} style={{
                  borderBottom: i < days.length - 1 ? '1px solid #1a1f2e' : 'none',
                  background: d.agitation === 1 ? '#2a1515' : d.alert === 1 ? '#2a2010' : 'transparent'
                }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{d.date_only}</td>
                  <td style={{ padding: '10px 16px', color: '#3b82f6' }}>
                    {(d.risk_score * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {d.alert === 1 ? <span style={{ color: '#fbbf24' }}>⚠ Yes</span> : <span style={{ color: '#475569' }}>No</span>}
                  </td>
                  <td style={{ padding: '10px 16px', color: d.dev_Hallway > 1 ? '#f87171' : '#94a3b8' }}>
                    {d.dev_Hallway?.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 16px', color: d.dev_total_movements < -1 ? '#f87171' : '#94a3b8' }}>
                    {d.dev_total_movements?.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 16px', color: d.dev_nocturnal_movements > 1 ? '#f87171' : '#94a3b8' }}>
                    {d.dev_nocturnal_movements?.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 16px' }}>{d.dev_first_movement_hour?.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {d.agitation === 1 ? <span style={{ color: '#f87171' }}>✕ Yes</span> : <span style={{ color: '#475569' }}>No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
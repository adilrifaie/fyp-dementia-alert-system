export default function RiskBadge({ level }) {
  const styles = {
    high:   { background: '#3f1a1a', color: '#f87171', border: '1px solid #7f1d1d' },
    medium: { background: '#3f2f0a', color: '#fbbf24', border: '1px solid #78350f' },
    low:    { background: '#0f2f1a', color: '#4ade80', border: '1px solid #14532d' },
  }
  return (
    <span style={{
      ...styles[level],
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {level}
    </span>
  )
}
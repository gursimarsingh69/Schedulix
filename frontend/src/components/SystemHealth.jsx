import { AlertTriangle, CheckCircle, Flame } from 'lucide-react';

export default function SystemHealth({ analysis }) {
  if (!analysis) return null;

  const { bottleneck, alert, severity } = analysis;

  const getStyle = () => {
    if (severity === "high") {
      return { border: "1px solid #ef4444", bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", icon: AlertTriangle, shadow: "0 4px 20px rgba(239, 68, 68, 0.15)" };
    }
    if (severity === "medium") {
      return { border: "1px solid var(--accent-orange)", bg: "var(--accent-orange-dim)", color: "var(--accent-orange)", icon: Flame, shadow: "0 4px 20px rgba(249, 115, 22, 0.15)" };
    }
    return { border: "1px solid var(--border-subtle)", bg: "rgba(255,255,255,0.02)", color: "var(--accent-green)", icon: CheckCircle, shadow: "none" };
  };

  const s = getStyle();
  const Icon = s.icon;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1.2rem',
      padding: '1.2rem 1.5rem',
      borderRadius: '12px',
      border: s.border,
      backgroundColor: s.bg,
      boxShadow: s.shadow,
      marginBottom: '1.5rem',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ padding: '0.6rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
        <Icon size={24} color={s.color} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Heuristic Engine Diagnosis
        </div>
        <div style={{ color: '#fff', fontWeight: 500, fontSize: '1.05rem', marginTop: '4px' }}>
          {alert}
        </div>
      </div>
      {bottleneck !== "None" && (
        <div style={{ marginLeft: 'auto', padding: '0.4rem 1rem', backgroundColor: s.color, color: '#0f0c0b', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {bottleneck} Bound
        </div>
      )}
    </div>
  );
}

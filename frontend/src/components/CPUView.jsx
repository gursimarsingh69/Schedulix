export default function CPUView({ data, idleCores = [] }) {
  if (!data) return null;

  return (
    <div>
      <div className="stat-row">
        <span className="metric-label">Overall Usage</span>
        <span className="metric-value" style={{ fontSize: '1.5rem' }}>{data.overall.toFixed(1)}%</span>
      </div>
      <div className="stat-row">
        <span className="metric-label">Thread Count</span>
        <span style={{ fontWeight: 600 }}>{data.thread_count}</span>
      </div>
      <div className="stat-row">
        <span className="metric-label">Context Switches</span>
        <span style={{ fontWeight: 600 }}>{data.ctx_switches.toLocaleString()}</span>
      </div>

      <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        Per-Core Load
      </div>
      <div className="core-grid">
        {data.cores.map((usage, idx) => {
          const isIdle = idleCores.includes(idx);
          return (
            <div key={idx} className="core-box" style={{ opacity: isIdle ? 0.3 : 1, filter: isIdle ? 'grayscale(80%)' : 'none' }} title={`Core ${idx}: ${usage}%\n${isIdle ? 'IDLE' : 'ACTIVE'}`}>
              <div 
                className={`core-fill ${usage > 85 ? 'high-usage' : ''}`} 
                style={{ height: `${usage}%` }} 
              />
              <span className="core-text">{idx}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
}

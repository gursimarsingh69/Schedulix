import { useState } from 'react';

export default function GPUView({ gpus }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!gpus || gpus.length === 0) return <div>Waiting for GPU data...</div>;

  // Use selected GPU or default to first
  const gpu = gpus[activeIndex >= gpus.length ? 0 : activeIndex];

  return (
    <div>
      {gpus.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          {gpus.map((g, idx) => (
            <button 
              key={g.id} 
              onClick={() => setActiveIndex(idx)}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: activeIndex === idx ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: '1px solid',
                borderColor: activeIndex === idx ? 'var(--border-subtle)' : 'transparent',
                borderRadius: '8px',
                color: activeIndex === idx ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                backdropFilter: activeIndex === idx ? 'blur(4px)' : 'none'
              }}
            >
              {g.name.includes("Simulated") || g.name.includes("iGPU") || g.name.includes("Integrated") ? "iGPU" : "Discrete GPU"}
            </button>
          ))}
        </div>
      )}

      {gpu && (
        <div key={gpu.id} style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {gpu.name}
          </div>
          <div className="stat-row">
            <span className="metric-label">Utilization</span>
            <span className="metric-value neon-text" style={{ fontSize: '1.5rem' }}>{gpu.utilization}%</span>
          </div>
          <div className="stat-row">
            <span className="metric-label">VRAM Usage</span>
            <span style={{ fontWeight: 600 }}>
              {gpu.memory_used.toFixed(0)} MB / {gpu.memory_total.toFixed(0)} MB
            </span>
          </div>
          
          <div style={{ marginTop: '1rem', width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
             <div className="vram-bar" style={{ 
               width: `${(gpu.memory_used / gpu.memory_total) * 100}%`, 
               height: '100%', 
               backgroundColor: 'var(--accent-green)',
               transition: 'width 0.3s ease'
             }} />
          </div>
        </div>
      )}
    </div>
  );
}

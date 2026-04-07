import { useState } from 'react';
import { Play, Activity, Monitor, Coffee } from 'lucide-react';

export default function WorkloadSelector() {
  const [activeProfile, setActiveProfile] = useState("Balanced");
  const [isUpdating, setIsUpdating] = useState(false);

  const profiles = [
    { name: "Balanced", icon: Activity, desc: "Default OS operations" },
    { name: "Gaming", icon: Play, desc: "High frame-rate CPU/GPU switching" },
    { name: "Video Rendering", icon: Monitor, desc: "Heavy GPU saturation" },
    { name: "Web Browsing", icon: Coffee, desc: "Light CPU bursting" }
  ];

  const handleSelect = async (profileName) => {
    setActiveProfile(profileName);
    setIsUpdating(true);
    try {
      await fetch("http://localhost:8000/api/workload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileName })
      });
    } catch (err) {
      console.error("Failed to set workload", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Simulation Engine Profile
        </h3>
        {isUpdating && <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)' }}>Pushing parameters...</span>}
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {profiles.map(p => {
          const Icon = p.icon;
          const isActive = activeProfile === p.name;
          
          return (
            <button
              key={p.name}
              onClick={() => handleSelect(p.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: `1px solid ${isActive ? 'rgba(249, 115, 22, 0.5)' : 'var(--border-subtle)'}`,
                borderTop: `1px solid ${isActive ? 'var(--accent-orange)' : 'var(--border-highlight)'}`,
                backgroundColor: isActive ? 'var(--accent-orange-dim)' : 'rgba(255,255,255,0.02)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                minWidth: '220px',
                boxShadow: isActive ? '0 4px 12px rgba(249, 115, 22, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={{ 
                backgroundColor: isActive ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.05)',
                padding: '0.5rem',
                borderRadius: '8px'
              }}>
                <Icon size={18} color={isActive ? "var(--accent-orange)" : "var(--text-muted)"}/>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '3px' }}>{p.desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
}

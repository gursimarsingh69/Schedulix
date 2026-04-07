import { useState, useEffect } from 'react';
import { Activity, Cpu, MonitorPlay } from 'lucide-react';
import './index.css';
import CPUView from './components/CPUView';
import GPUView from './components/GPUView';
import Timeline from './components/Timeline';
import WorkloadSelector from './components/WorkloadSelector';

function App() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws');
      
      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch(e) {
          console.error("Failed to parse message", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Retry connection every 2s
        reconnectTimer = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity color="var(--accent-orange)" size={24} />
          <h1>Dashboard Overview</h1>
        </div>
        <div className="status-badge">
          <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></div>
          {connected ? 'Live Sync' : 'Connecting...'}
        </div>
      </header>

      <main>
        <WorkloadSelector />
        <div className="grid-layout">
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu color="var(--accent-blue)" size={20} />
                <span>CPU Metrics</span>
              </div>
            </div>
            {data?.cpu ? <CPUView data={data.cpu} /> : <div className="metric-label">Waiting for data...</div>}
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MonitorPlay color="var(--accent-green)" size={20} />
                <span>GPU Metrics</span>
              </div>
            </div>
            {data?.gpu ? <GPUView gpus={data.gpu} /> : <div className="metric-label">Waiting for data...</div>}
          </div>
        </div>

        <div className="card full-width">
          <div className="card-header">
            Execution Timeline Pipeline (Phase 2 Preview)
          </div>
          <Timeline cpuData={data?.cpu} gpuData={data?.gpu} tasks={data?.tasks} />
        </div>
      </main>
    </div>
  );
}

export default App;

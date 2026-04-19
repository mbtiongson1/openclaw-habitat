import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgents } from './hooks/useAgents';
import { BottomNav } from './components/ui/BottomNav';
import { SanctuaryHub } from './components/sanctuary/SanctuaryHub';

// Define the port depending on dev/prod
const WS_URL = import.meta.env.PROD 
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost:3001';

export function App() {
  const ws = useWebSocket(WS_URL);
  const { agents, selectedAgentId, setSelectedAgentId } = useAgents(ws);
  const [activeTab, setActiveTab] = useState<'hub' | 'kitchen' | 'nursery' | 'garden'>('hub');

  if (!ws.connected && agents.length === 0) {
    return (
      <div className="app bg-surface flex flex-col items-center justify-center h-screen color-on-surface">
        <h1 className="text-2xl font-display mb-4">Digital Sanctuary</h1>
        <p className="opacity-70">{ws.reconnecting ? 'Reconnecting to Habitat...' : 'Connecting to Habitat...'}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="app__content">
        {activeTab === 'hub' && (
          <SanctuaryHub agents={agents} onSelectAgent={setSelectedAgentId} />
        )}
        {activeTab === 'kitchen' && (
          <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
            <h2>Kitchen View</h2>
            <p>Coming in Phase 3</p>
          </div>
        )}
        {activeTab === 'nursery' && (
          <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
            <h2>Nursery View</h2>
            <p>Coming in Phase 4</p>
          </div>
        )}
        {activeTab === 'garden' && (
          <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
            <h2>Garden View</h2>
            <p>Coming in Phase 4</p>
          </div>
        )}

        {/* Temporary Agent Detail Overlay */}
        {selectedAgentId && (
          <div className="glass" style={{
            position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
            padding: '24px', zIndex: 1000, minWidth: '300px', boxShadow: 'var(--shadow-float)'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Agent Profile Shell</h3>
            <p><b>ID:</b> {selectedAgentId.split('-')[0]}</p>
            <p>Coming in Phase 3</p>
            <button className="btn btn--primary" style={{ marginTop: '16px' }} onClick={() => setSelectedAgentId(null)}>Close</button>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

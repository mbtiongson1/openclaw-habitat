import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgents } from './hooks/useAgents';
import { BottomNav } from './components/ui/BottomNav';
import { SanctuaryHub } from './components/sanctuary/SanctuaryHub';
import { KitchenView } from './components/kitchen/KitchenView';
import { AgentPage } from './components/agent/AgentPage';
// Define the port depending on dev/prod
const WS_URL = import.meta.env.PROD 
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost:3001';

export function App() {
  const ws = useWebSocket(WS_URL);
  const { agents, selectedAgent, selectedAgentId, setSelectedAgentId, feedAgent } = useAgents(ws);
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
          <KitchenView agents={agents} onFeedAgent={feedAgent} />
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
        {selectedAgent && (
          <AgentPage 
            agent={selectedAgent} 
            onClose={() => setSelectedAgentId(null)} 
            onChat={(agentId, text) => {
              ws.send({ type: 'send_chat', payload: { agentId, text } });
            }}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgents } from './hooks/useAgents';
import { BottomNav } from './components/ui/BottomNav';
import { SanctuaryHub } from './components/sanctuary/SanctuaryHub';
import { KitchenView } from './components/kitchen/KitchenView';
import { AgentPage } from './components/agent/AgentPage';
import { NurseryView } from './components/nursery/NurseryView';
import { GardenView } from './components/garden/GardenView';
import { AgentCreator } from './components/agent/AgentCreator';

// Define the port depending on dev/prod
const WS_URL = import.meta.env.PROD 
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost:3001';

export function App() {
  const ws = useWebSocket(WS_URL);
  const { agents, selectedAgent, selectedAgentId, setSelectedAgentId, feedAgent, createAgent } = useAgents(ws);
  const [activeTab, setActiveTab] = useState<'hub' | 'kitchen' | 'nursery' | 'garden'>('hub');
  const [showCreator, setShowCreator] = useState(false);

  if (!ws.connected && agents.length === 0) {
    return (
      <div className="app bg-surface flex flex-col items-center justify-center h-screen color-on-surface">
        <h1 className="text-2xl font-display mb-4">Digital Sanctuary</h1>
        <p className="opacity-70">{ws.reconnecting ? 'Reconnecting to Habitat...' : 'Connecting to Habitat...'}</p>
        {!ws.connected && !ws.reconnecting && (
          <p className="opacity-50 mt-4 text-sm">Ensure mock server is running: npm run dev:mock</p>
        )}
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
          <NurseryView agents={agents} onSelectAgent={setSelectedAgentId} />
        )}
        {activeTab === 'garden' && (
          <GardenView agents={agents} onSelectAgent={setSelectedAgentId} />
        )}

        {/* Action Button for Agent Creation (only visible in Hub for now) */}
        {activeTab === 'hub' && (
          <button 
            className="btn btn--primary" 
            style={{ position: 'absolute', bottom: '80px', right: 'var(--space-xl)', zIndex: 100, borderRadius: '24px', padding: '12px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            onClick={() => setShowCreator(true)}
          >
            + Create Agent
          </button>
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

        {/* Agent Creator Overlay */}
        {showCreator && (
          <AgentCreator 
            onClose={() => setShowCreator(false)} 
            onCreate={createAgent} 
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

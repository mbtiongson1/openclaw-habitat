import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgents } from './hooks/useAgents';
import { BottomNav } from './components/ui/BottomNav';
import { NurseryView } from './components/nursery/NurseryView';
import { GardenView } from './components/garden/GardenView';
import { AgentCreator } from './components/agent/AgentCreator';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ConnectionBadge } from './components/ui/ConnectionBadge';
import { SettingsModal } from './components/ui/SettingsModal';


// Define the port depending on dev/prod
const WS_URL = import.meta.env.PROD 
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost:3001';

export function App() {
  const ws = useWebSocket(WS_URL);
  const { agents, selectedAgent, selectedAgentId, setSelectedAgentId, feedAgent, createAgent } = useAgents(ws);
  const [activeTab, setActiveTab] = useState<'hub' | 'kitchen' | 'nursery' | 'garden'>('hub');
  const [showCreator, setShowCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!ws.connected && agents.length === 0) {
    return <LoadingScreen reconnecting={ws.reconnecting} />;
  }

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex flex-col pb-24 md:pb-0">
      <ConnectionBadge connected={ws.connected} reconnecting={ws.reconnecting} />
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-surface flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-2xl">grid_view</span>
          <h1 className="font-headline font-bold uppercase tracking-wider text-xl text-on-surface">Digital Sanctuary</h1>
        </div>
        <button 
          className="w-10 h-10 bg-surface-container-highest flex items-center justify-center overflow-hidden hover:bg-surface-variant transition-colors"
          onClick={() => setShowSettings(true)}
        >
          <span className="material-symbols-outlined text-on-surface">settings</span>
        </button>
        <div className="absolute bottom-0 left-0 bg-outline-variant h-[2px] w-full"></div>
      </header>

      <main className="flex-grow p-6 md:p-12 md:pl-32 max-w-7xl mx-auto w-full relative z-10">
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

        {/* Settings Modal Overlay */}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

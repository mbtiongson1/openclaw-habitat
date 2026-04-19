import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgents } from './hooks/useAgents';
import { BottomNav, TabId } from './components/ui/BottomNav';
import { SanctuaryHub } from './components/sanctuary/SanctuaryHub';
import { ZonesView } from './components/sanctuary/ZonesView';
import { AgentsListView } from './components/agent/AgentsListView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsModal } from './components/ui/SettingsModal';
import { AgentCreator } from './components/agent/AgentCreator';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ConnectionBadge } from './components/ui/ConnectionBadge';
import { AgentPage } from './components/agent/AgentPage';

const WS_URL = import.meta.env.PROD 
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost:3001';

export function App() {
  const ws = useWebSocket(WS_URL);
  const { agents, selectedAgent, selectedAgentId, setSelectedAgentId, feedAgent, createAgent } = useAgents(ws);
  const [activeTab, setActiveTab] = useState<TabId>('hub');
  const [showCreator, setShowCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!ws.connected && agents.length === 0) {
    return <LoadingScreen reconnecting={ws.reconnecting} />;
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col bg-grid-pattern relative pb-24 md:pb-0 pt-16 md:pt-20 font-body">
      <ConnectionBadge connected={ws.connected} reconnecting={ws.reconnecting} />
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary-container text-2xl">grid_view</span>
          <h1 className="text-xl font-black text-primary-container tracking-tight uppercase font-headline">Digital Sanctuary</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-outline hover:text-primary transition-colors duration-200 cursor-pointer">notifications</span>
          <div className="text-xs uppercase tracking-wider font-headline text-primary-container font-bold border border-outline-variant px-3 py-1 bg-surface-container-low">
            Health: 99%
          </div>
          <button 
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container transition-colors"
            onClick={() => setShowSettings(true)}
          >
            <span className="material-symbols-outlined text-outline text-xl">settings</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {activeTab === 'hub' && (
          <SanctuaryHub agents={agents} onSelectAgent={setSelectedAgentId} />
        )}
        {activeTab === 'zones' && (
          <ZonesView agents={agents} />
        )}
        {activeTab === 'agents' && (
          <AgentsListView agents={agents} onSelectAgent={setSelectedAgentId} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4">
             <h2 className="text-3xl font-headline font-black text-on-background">Settings</h2>
             <button className="btn btn--primary max-w-xs" onClick={() => setShowSettings(true)}>Open System Config</button>
          </div>
        )}

        {/* Floating Action Button */}
        <button 
          aria-label="Create Agent" 
          className="fixed bottom-24 md:bottom-8 right-6 w-16 h-16 btn-gradient text-on-primary flex items-center justify-center shadow-lg z-40 transition-transform hover:scale-105 active:scale-95 border-none rounded-none cursor-pointer"
          onClick={() => setShowCreator(true)}
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>

        {/* Overlays */}
        {selectedAgent && (
          <AgentPage 
            agent={selectedAgent} 
            onClose={() => setSelectedAgentId(null)} 
            onChat={(agentId, text) => {
              ws.send({ type: 'send_chat', payload: { agentId, text } });
            }}
          />
        )}

        {showCreator && (
          <AgentCreator 
            onClose={() => setShowCreator(false)} 
            onCreate={createAgent} 
          />
        )}

        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

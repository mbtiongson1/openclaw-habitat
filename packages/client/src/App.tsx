import React, { useEffect, useState } from 'react';
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
import { GlobalCommandRail } from './components/controls/GlobalCommandRail';
import { useGlobalCommands } from './hooks/useGlobalCommands';

const WS_URL = import.meta.env.PROD 
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost:3001';

export function App() {
  const ws = useWebSocket(WS_URL);
  const { agents, selectedAgent, selectedAgentId, setSelectedAgentId, feedAgent, createAgent } = useAgents(ws);
  const { commands } = useGlobalCommands();
  const [activeTab, setActiveTab] = useState<TabId>('hub');
  const [showCreator, setShowCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const goToSanctuary = () => setActiveTab('hub');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  if (!ws.connected && agents.length === 0) {
    return <LoadingScreen reconnecting={ws.reconnecting} />;
  }

  return (
    <div className="app-shell bg-surface text-on-surface antialiased min-h-screen flex flex-col bg-grid-pattern relative font-body">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
        <button
          type="button"
          aria-label="Go to Sanctuary"
          className="flex items-center gap-3 min-w-0 text-left text-primary-container transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          onClick={goToSanctuary}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">home</span>
          <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase font-headline truncate">Digital Sanctuary</h1>
        </button>
        <div className="flex items-center gap-4">
          <ConnectionBadge connected={ws.connected} reconnecting={ws.reconnecting} />
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
      <main className="app-main flex-grow w-full relative">
        {activeTab === 'hub' && (
          <SanctuaryHub
            agents={agents}
            ws={ws}
            onSelectAgent={setSelectedAgentId}
            onNavigateAgents={() => setActiveTab('agents')}
          />
        )}
        {activeTab === 'zones' && (
          <ZonesView agents={agents} ws={ws} />
        )}
        {activeTab === 'agents' && (
          <AgentsListView agents={agents} onSelectAgent={setSelectedAgentId} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView />
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
            ws={ws}
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

      <div className="hidden xl:block fixed top-24 right-6 bottom-8 w-72 overflow-y-auto z-30">
        <GlobalCommandRail commands={commands} />
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

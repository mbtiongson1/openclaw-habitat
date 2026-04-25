import React from 'react';
import { type Agent } from '../../hooks/useAgents';
import AgentSVG from '../../svg/AgentSVG';

interface AgentsListViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function AgentsListView({ agents, onSelectAgent }: AgentsListViewProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-headline font-black text-on-background">Agent Operations</h2>
          <p className="text-on-surface-variant">Per-agent characteristics, model strategy, recovery history, and event review.</p>
        </div>
        <div className="text-right">
          <span className="text-5xl font-headline font-bold text-primary">{agents.length}</span>
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-outline">Total Population</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <article
            key={agent.config.id}
            className="bg-surface-container-low/80 shadow-[0_18px_45px_rgba(51,44,34,0.08)] hover:bg-surface-container-high transition-colors group"
          >
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  role="img"
                  aria-label={`${agent.config.name} sprite`}
                  className="w-20 h-20 bg-surface-container-lowest flex items-center justify-center shrink-0 shadow-inner"
                >
                  <AgentSVG
                    size={72}
                    head={agent.config.svgParts.head}
                    body={agent.config.svgParts.body}
                    hands={agent.config.svgParts.hands}
                    feet={agent.config.svgParts.feet}
                    state={agent.state as 'idle' | 'working' | 'sleeping' | 'feeding' | 'social'}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline text-2xl font-bold text-on-background group-hover:text-primary transition-colors truncate">{agent.config.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-headline font-bold uppercase tracking-wider text-outline">
                    <span className="text-primary">{agent.zone}</span>
                    <span>•</span>
                    <span>{agent.state}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Open ${agent.config.name} details`}
                onClick={() => onSelectAgent(agent.config.id)}
                className="inline-flex items-center gap-1 px-3 py-2 bg-primary text-on-primary text-xs font-headline font-bold uppercase tracking-widest hover:opacity-90"
              >
                Open Details
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 pb-5">
              <Metric label="CPU" value={`${Math.round(agent.stats.cpu)}%`} />
              <Metric label="Memory" value={`${Math.round(agent.stats.memory)}%`} />
              <Metric label="Tasks" value={agent.stats.tasksCompleted.toString()} />
              <Metric label="Snacks" value={agent.pendingSnacks.length.toString()} />
            </div>

            <div className="px-5 pb-5 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Capability label="Personality" value={agent.config.personality} icon="psychology" />
                <Capability label="Model Strategy" value="Planning, quick, fallback" icon="alt_route" />
                <Capability label="Recovery History" value="Model fallback events" icon="history" />
                <Capability label="Event History" value="Task and feeding log" icon="receipt_long" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest/80 p-3">
      <div className="text-lg font-headline font-black text-on-background">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-outline font-headline font-bold">{label}</div>
    </div>
  );
}

function Capability({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-start gap-2 bg-surface-container-lowest/80 p-3">
      <span className="material-symbols-outlined text-primary text-lg mt-0.5">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-outline font-headline font-bold">{label}</div>
        <div className="text-sm text-on-surface">{value}</div>
      </div>
    </div>
  );
}

import React from 'react';
import { type Agent } from '../../hooks/useAgents';

interface AgentsListViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function AgentsListView({ agents, onSelectAgent }: AgentsListViewProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-headline font-black text-on-background">Resident Agents</h2>
          <p className="text-on-surface-variant">Real-time status and telemetry for all active sanctuary entities.</p>
        </div>
        <div className="text-right">
          <span className="text-5xl font-headline font-bold text-primary">{agents.length}</span>
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-outline">Total Population</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {agents.map((agent) => (
          <div 
            key={agent.config.id}
            onClick={() => onSelectAgent(agent.config.id)}
            className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center font-headline font-black text-primary">
                {agent.config.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-background group-hover:text-primary transition-colors">{agent.config.name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-headline font-bold uppercase tracking-wider text-outline">
                  <span className="text-primary">{agent.zone}</span>
                  <span>•</span>
                  <span>{agent.state}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-headline font-bold text-primary">98% STABLE</span>
                <div className="w-24 h-1 bg-outline-variant/20">
                  <div className="h-full bg-primary w-[98%]" />
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

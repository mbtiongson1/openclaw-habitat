import React, { useMemo } from 'react';
import AgentSVG from '../../svg/AgentSVG';
import { type Agent } from '../../hooks/useAgents';

interface ZoneRendererProps {
  id: string;
  name: string;
  label: string;
  color: string;
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function ZoneRenderer({ id, name, label, color, agents, onSelectAgent }: ZoneRendererProps) {
  // Memoize positions based on agent count and IDs
  const agentPositions = useMemo(() => {
    const seed = agents.length;
    return agents.map((agent, i) => {
      // Create a deterministic but scattered feel
      const angle = (i / agents.length) * Math.PI * 2 + (seed * 0.5);
      const radius = 20 + (i % 3) * 10;
      return {
        id: agent.config.id,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      };
    });
  }, [agents.length, agents.map(a => a.config.id).join(',')]);

  return (
    <div 
      className="relative flex flex-col group transition-all duration-300 hover:brightness-95" 
      style={{ backgroundColor: color }}
    >
      {/* Background Patterns */}
      <div className="absolute inset-0 bg-floor-pattern opacity-40 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      
      {/* Room Header */}
      <div className="p-3 md:p-5 flex justify-between items-start z-10">
        <h3 className="font-headline text-lg md:text-xl text-primary font-bold tracking-tight">{name}</h3>
        <span className="font-headline text-[10px] uppercase tracking-widest text-outline bg-surface-container-highest/50 px-2 py-1">
          {label}
        </span>
      </div>

      {/* Agent Playground */}
      <div className="flex-grow relative z-10 w-full h-full">
        {agents.map((agent) => {
          const pos = agentPositions.find(p => p.id === agent.config.id);
          return (
            <div
              key={agent.config.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 hover:scale-110 z-10"
              style={{
                left: `${pos?.x || 50}%`,
                top: `${pos?.y || 50}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAgent(agent.config.id);
              }}
            >
              <div className="relative group/agent">
                <AgentSVG
                  size={80}
                  head={agent.config.svgParts.head}
                  body={agent.config.svgParts.body}
                  hands={agent.config.svgParts.hands}
                  feet={agent.config.svgParts.feet}
                  state={agent.state as any}
                />

                
                {/* Agent Detail Hover */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-surface px-2 py-0.5 font-headline font-bold text-[8px] border border-outline opacity-0 group-hover/agent:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest z-50">
                  {agent.config.name} ({agent.state})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

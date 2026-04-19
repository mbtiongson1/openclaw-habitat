import React, { useMemo } from 'react';
import AgentSVG from '../../svg/AgentSVG';
import { type Agent } from '../../hooks/useAgents';

interface ZoneRendererProps {
  id: string;
  name: string;
  color: string;
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function ZoneRenderer({ id, name, color, agents, onSelectAgent }: ZoneRendererProps) {
  // Memoize positions to avoid jumping on every render
  const agentPositions = useMemo(() => {
    return agents.map((agent, i) => {
      // Procedurally scatter agents within the zone
      const numAgents = agents.length;
      const col = i % Math.ceil(Math.sqrt(numAgents));
      const row = Math.floor(i / Math.ceil(Math.sqrt(numAgents)));
      return {
        id: agent.config.id,
        x: 20 + col * 40 + (Math.random() * 10 - 5), // percentage based
        y: 30 + row * 30 + (Math.random() * 10 - 5),
      };
    });
  }, [agents.map(a => a.config.id).join(',')]);

  return (
    <div className="w-full h-full relative p-4 group" style={{ backgroundColor: color }}>
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        <span className="font-headline font-bold text-[10px] text-on-surface opacity-30 uppercase tracking-[0.2em]">{name}</span>
        <div className="w-6 h-6 bg-on-surface text-surface flex items-center justify-center font-headline font-bold text-[10px]">
          {agents.length}
        </div>
      </div>

      <div className="relative w-full h-full overflow-hidden">
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
              onClick={() => onSelectAgent(agent.config.id)}
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
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-surface px-2 py-0.5 font-headline font-bold text-[8px] border border-on-surface opacity-0 group-hover/agent:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
                  {agent.config.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import AgentSVG from '../../svg/AgentSVG';
import { type Agent } from '../../hooks/useAgents';
import './ZoneRenderer.css';

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
    <div className={`zone zone--${id}`} style={{ backgroundColor: color }}>
      <div className="zone__label">
        <span className="zone__name">{name}</span>
        <span className="zone__count">{agents.length}</span>
      </div>

      <div className="zone__agents">
        {agents.map((agent) => {
          const pos = agentPositions.find(p => p.id === agent.config.id);
          return (
            <div
              key={agent.config.id}
              className="zone__agent-wrapper"
              style={{
                left: `${pos?.x || 50}%`,
                top: `${pos?.y || 50}%`,
              }}
              onClick={() => onSelectAgent(agent.config.id)}
            >
              <AgentSVG
                size={72}
                head={agent.config.svgParts.head}
                body={agent.config.svgParts.body}
                hands={agent.config.svgParts.hands}
                feet={agent.config.svgParts.feet}
                state={agent.state as any}
              />
              <div className="zone__agent-name">{agent.config.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

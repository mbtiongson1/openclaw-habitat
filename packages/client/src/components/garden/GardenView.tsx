import React from 'react';
import { type Agent } from '../../hooks/useAgents';
import { HealthGarden } from './HealthGarden';
import AgentSVG from '../../svg/AgentSVG';
import './GardenView.css';

interface GardenViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function GardenView({ agents, onSelectAgent }: GardenViewProps) {
  const gardenAgents = agents.filter(a => a.zone === 'garden');

  return (
    <div className="garden-view fade-in">
      <header className="garden-view__header">
        <h2 className="garden-view__title">The Garden</h2>
        <p className="garden-view__subtitle">A reflection of your habitat's health</p>
      </header>

      <div className="garden-view__scene">
        <HealthGarden agents={agents} />
        
        <div className="garden-view__agents">
          {gardenAgents.map(agent => (
            <div 
              key={agent.config.id} 
              className="garden-agent"
              onClick={() => onSelectAgent(agent.config.id)}
            >
              <AgentSVG
                size={90}
                head={agent.config.svgParts.head}
                body={agent.config.svgParts.body}
                hands={agent.config.svgParts.hands}
                feet={agent.config.svgParts.feet}
                state="social"
              />
              <div className="garden-agent__name">{agent.config.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

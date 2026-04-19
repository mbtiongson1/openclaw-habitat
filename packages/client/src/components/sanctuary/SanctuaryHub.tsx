import React from 'react';
import { ZoneRenderer } from './ZoneRenderer';
import { type Agent } from '../../hooks/useAgents';
import './SanctuaryHub.css';

interface SanctuaryHubProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function SanctuaryHub({ agents, onSelectAgent }: SanctuaryHubProps) {
  const getAgentsInZone = (zoneName: string) => 
    agents.filter(a => a.zone.toLowerCase() === zoneName.toLowerCase());

  return (
    <div className="hub">
      <div className="hub__grid">
        <div className="hub__quadrant">
          <ZoneRenderer
            id="lounge"
            name="Lounge (Working)"
            color="var(--zone-lounge)"
            agents={getAgentsInZone('lounge')}
            onSelectAgent={onSelectAgent}
          />
        </div>
        <div className="hub__quadrant">
          <ZoneRenderer
            id="kitchen"
            name="Kitchen (Feeding)"
            color="var(--zone-kitchen)"
            agents={getAgentsInZone('kitchen')}
            onSelectAgent={onSelectAgent}
          />
        </div>
        <div className="hub__quadrant">
          <ZoneRenderer
            id="nursery"
            name="Nursery (Idle)"
            color="var(--zone-nursery)"
            agents={getAgentsInZone('nursery')}
            onSelectAgent={onSelectAgent}
          />
        </div>
        <div className="hub__quadrant">
          <ZoneRenderer
            id="garden"
            name="Garden (Social)"
            color="var(--zone-garden)"
            agents={getAgentsInZone('garden')}
            onSelectAgent={onSelectAgent}
          />
        </div>
      </div>
    </div>
  );
}

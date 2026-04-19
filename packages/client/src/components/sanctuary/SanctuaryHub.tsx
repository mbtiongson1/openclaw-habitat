import React from 'react';
import { ZoneRenderer } from './ZoneRenderer';
import { type Agent } from '../../hooks/useAgents';

interface SanctuaryHubProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function SanctuaryHub({ agents, onSelectAgent }: SanctuaryHubProps) {
  const getAgentsInZone = (zoneName: string) => 
    agents.filter(a => a.zone.toLowerCase() === zoneName.toLowerCase());

  return (
    <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-80px)] p-4 md:p-8">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
        <div className="border border-on-background/10 overflow-hidden relative group">
          <ZoneRenderer
            id="lounge"
            name="Lounge"
            color="var(--zone-lounge)"
            agents={getAgentsInZone('lounge')}
            onSelectAgent={onSelectAgent}
          />
          <div className="absolute top-2 left-2 bg-on-surface text-[8px] font-headline font-bold text-surface px-1 uppercase tracking-widest z-20">
            Work Zone
          </div>
        </div>
        <div className="border border-on-background/10 overflow-hidden relative group">
          <ZoneRenderer
            id="kitchen"
            name="Kitchen"
            color="var(--zone-kitchen)"
            agents={getAgentsInZone('kitchen')}
            onSelectAgent={onSelectAgent}
          />
          <div className="absolute top-2 left-2 bg-secondary text-[8px] font-headline font-bold text-surface px-1 uppercase tracking-widest z-20">
            Reward Zone
          </div>
        </div>
        <div className="border border-on-background/10 overflow-hidden relative group">
          <ZoneRenderer
            id="nursery"
            name="Nursery"
            color="var(--zone-nursery)"
            agents={getAgentsInZone('nursery')}
            onSelectAgent={onSelectAgent}
          />
          <div className="absolute top-2 left-2 bg-primary text-[8px] font-headline font-bold text-surface px-1 uppercase tracking-widest z-20">
            Resthaven
          </div>
        </div>
        <div className="border border-on-background/10 overflow-hidden relative group">
          <ZoneRenderer
            id="garden"
            name="Garden"
            color="var(--zone-garden)"
            agents={getAgentsInZone('garden')}
            onSelectAgent={onSelectAgent}
          />
          <div className="absolute top-2 left-2 bg-tertiary text-[8px] font-headline font-bold text-surface px-1 uppercase tracking-widest z-20">
            Orchard
          </div>
        </div>
      </div>
    </div>
  );
}

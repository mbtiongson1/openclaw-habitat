import React from 'react';
import { ZoneRenderer } from './ZoneRenderer';
import { type Agent } from '../../hooks/useAgents';

interface SanctuaryHubProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function SanctuaryHub({ agents, onSelectAgent }: SanctuaryHubProps) {
  const getAgentsInZone = (zoneName: string) => 
    agents.filter(a => a.zone.toLowerCase() === zoneName.toLowerCase() || (zoneName === 'lounge' && a.zone.toLowerCase() === 'alpha'));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Text */}
      <div className="hidden md:block">
        <h2 className="font-headline text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-primary mb-2">Sanctuary Floor Plan</h2>
        <p className="font-body text-base text-on-surface-variant max-w-2xl">Monitor and manage agent activity across all architectural zones.</p>
      </div>

      {/* House Floor Plan Canvas */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-3 bg-secondary/90 border-8 border-secondary/90 aspect-[4/5] md:aspect-square w-full max-w-3xl mx-auto relative shadow-2xl overflow-hidden">
        {/* Internal Doorways (Visual Elements) */}
        <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 w-4 md:w-6 h-12 bg-[#f5f3ee] z-20 border-y border-outline-variant/20 shadow-inner"></div>
        <div className="absolute top-1/2 left-[25%] transform -translate-y-1/2 h-4 md:h-6 w-12 bg-[#f5f3ee] z-20 border-x border-outline-variant/20 shadow-inner"></div>
        <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 w-4 md:w-6 h-12 bg-[#ebe8dd] z-20 border-y border-outline-variant/20 shadow-inner"></div>

        {/* Lounge Room (Alpha) */}
        <ZoneRenderer
          id="lounge"
          name="Lounge"
          label="Room Alpha"
          color="#f5f3ee"
          agents={getAgentsInZone('lounge')}
          onSelectAgent={onSelectAgent}
        />

        {/* Kitchen Room (Beta) */}
        <ZoneRenderer
          id="kitchen"
          name="Kitchen"
          label="Room Beta"
          color="var(--surface)"
          agents={getAgentsInZone('kitchen')}
          onSelectAgent={onSelectAgent}
        />

        {/* Nursery Room (Gamma) */}
        <ZoneRenderer
          id="nursery"
          name="Nursery"
          label="Room Gamma"
          color="var(--surface-container-low)"
          agents={getAgentsInZone('nursery')}
          onSelectAgent={onSelectAgent}
        />

        {/* Garden Room (Delta) */}
        <ZoneRenderer
          id="garden"
          name="Garden"
          label="Room Delta"
          color="#ebe8dd"
          agents={getAgentsInZone('garden')}
          onSelectAgent={onSelectAgent}
        />
      </div>
    </div>
  );
}

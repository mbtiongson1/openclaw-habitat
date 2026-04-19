import React from 'react';
import { type Agent } from '../../hooks/useAgents';

interface ZonesViewProps {
  agents: Agent[];
}

export function ZonesView({ agents }: ZonesViewProps) {
  const zones = [
    { id: 'alpha', name: 'Lounge', label: 'Room Alpha', color: 'var(--zone-alpha)' },
    { id: 'beta', name: 'Kitchen', label: 'Room Beta', color: 'var(--zone-beta)' },
    { id: 'gamma', name: 'Nursery', label: 'Room Gamma', color: 'var(--zone-gamma)' },
    { id: 'delta', name: 'Garden', label: 'Room Delta', color: 'var(--zone-delta)' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-4xl font-headline font-black text-on-background">Architectural Zones</h2>
        <p className="text-on-surface-variant">Monitor occupancy and environmental stability across sanctuary nodes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => {
          const zoneAgents = agents.filter(a => a.zone.toLowerCase() === zone.id || a.zone.toLowerCase() === zone.name.toLowerCase());
          return (
            <div key={zone.id} className="bg-surface-container-low border border-outline-variant/30 p-6 flex flex-col gap-4 group hover:bg-surface-container-high transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-outline">{zone.label}</span>
                  <h3 className="text-2xl font-headline font-bold text-primary">{zone.name}</h3>
                </div>
                <div className="bg-primary-fixed text-on-primary-fixed px-3 py-1 font-headline font-bold text-xs">
                  {zoneAgents.length} AGENTS
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-headline font-bold text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">thermostat</span>
                  <span>72°F</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">humidity_low</span>
                  <span>45%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                  <span>STABLE</span>
                </div>
              </div>

              <div className="mt-2 h-1 bg-outline-variant/20 w-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(zoneAgents.length * 20, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

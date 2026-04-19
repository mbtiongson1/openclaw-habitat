import React from 'react';
import { type Agent } from '../../hooks/useAgents';
import AgentSVG from '../../svg/AgentSVG';

interface NurseryViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function NurseryView({ agents, onSelectAgent }: NurseryViewProps) {
  // Only idle/sleeping agents belong in the nursery
  const nurseryAgents = agents.filter(a => a.zone === 'nursery');

  return (
    <div className="flex flex-col gap-8 pb-16 fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-2">The Nursery</h2>
          <p className="font-body text-on-surface-variant text-lg">Agents prioritize resting and memory consolidation here.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 border-b-2 border-secondary">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bedtime</span>
          <span className="font-headline font-bold text-on-surface">SLEEP MODE ACTIVE</span>
        </div>
      </div>

      {nurseryAgents.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant bg-surface-container-low font-body">
          No agents are resting right now.
        </div>
      ) : (
        nurseryAgents.map(agent => {
          const lastSnack = agent.pendingSnacks?.[agent.pendingSnacks.length - 1];
          const dreamText = lastSnack ? `Dreaming about: ${lastSnack.taskDescription}` : 'Restoring cognitive pathways...';

          return (
            <div key={agent.config.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
              {/* Left Column: The Pod */}
              <div className="md:col-span-7 flex flex-col gap-8">
                <div className="bg-surface-container-low w-full relative group cursor-pointer" onClick={() => onSelectAgent(agent.config.id)}>
                  <div className="bg-surface-variant px-6 py-4 flex justify-between items-center">
                    <h3 className="font-headline font-bold text-on-surface tracking-wide uppercase">Incubation Pod</h3>
                    <span className="material-symbols-outlined text-on-surface-variant">info</span>
                  </div>
                  <div className="p-8 aspect-video md:aspect-[4/3] bg-surface-container-lowest relative overflow-hidden flex items-center justify-center">
                    <div className="relative z-10 text-center flex flex-col items-center">
                      <div className="mb-4 relative">
                        <div className="absolute -top-4 right-0 font-body text-xs text-primary animate-bounce z-20 font-bold tracking-widest">
                          ZzZ
                        </div>
                        <AgentSVG
                          size={120}
                          head={agent.config.svgParts.head}
                          body={agent.config.svgParts.body}
                          hands={agent.config.svgParts.hands}
                          feet={agent.config.svgParts.feet}
                          state="idle"
                        />
                      </div>
                      <h4 className="font-headline text-2xl font-bold text-on-surface">{agent.config.name}</h4>
                      <p className="font-body text-on-surface-variant mt-2">{dreamText}</p>
                      
                      <div className="mt-8 w-64 mx-auto">
                        <div className="flex justify-between font-label text-sm text-on-surface-variant mb-2">
                          <span>Recovery</span>
                          <span>84%</span>
                        </div>
                        <div className="h-3 bg-surface-container-high w-full relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '84%' }}></div>
                          {/* Pixel ticks */}
                          {[10,20,30,40,50,60,70,80,90].map(p => (
                            <div key={p} className="absolute top-0 h-full w-[1px] bg-background/50" style={{ left: `${p}%` }}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Controls */}
              <div className="md:col-span-5 flex flex-col gap-8">
                {/* Trait Customization */}
                <div className="bg-surface-container-low w-full flex-grow">
                  <div className="bg-surface-variant px-6 py-4 flex justify-between items-center">
                    <h3 className="font-headline font-bold text-on-surface tracking-wide uppercase">Personality Matrix</h3>
                    <span className="material-symbols-outlined text-on-surface-variant">psychology</span>
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <p className="font-body text-sm text-on-surface-variant mb-2">Adjust core learning traits to shape behavior upon wake.</p>
                    
                    <div className="flex items-center justify-between bg-surface-container-highest p-4 cursor-pointer hover:-translate-y-[2px] transition-transform" style={{ boxShadow: '2px 2px 0px rgba(28,28,21,0.1)' }}>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-tertiary">favorite</span>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface text-sm">Empathetic</h4>
                          <span className="font-body text-xs text-on-surface-variant">Prioritizes user interaction</span>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-primary relative flex items-center px-1">
                        <div className="w-4 h-4 bg-on-primary absolute right-1"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-surface p-4 cursor-pointer hover:-translate-y-[2px] transition-transform" style={{ boxShadow: '2px 2px 0px rgba(28,28,21,0.1)' }}>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-on-surface-variant">analytics</span>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface text-sm">Analytical</h4>
                          <span className="font-body text-xs text-on-surface-variant">Focuses on data logic</span>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-surface-container-high relative flex items-center px-1">
                        <div className="w-4 h-4 bg-outline-variant absolute left-1"></div>
                      </div>
                    </div>
                    
                  </div>
                </div>
                
                <button 
                  className="w-full bg-gradient-to-b from-primary to-primary-container text-on-primary font-headline font-bold text-lg uppercase tracking-wide py-5 hover:-translate-y-[2px] hover:-translate-x-[2px] transition-transform active:translate-x-0 active:translate-y-0 active:shadow-none" 
                  style={{ boxShadow: '2px 2px 0px rgba(28,28,21,1)' }}
                  onClick={(e) => { e.stopPropagation(); onSelectAgent(agent.config.id); }}
                >
                  WAKE AGENT
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

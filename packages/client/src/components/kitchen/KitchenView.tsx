import React, { useState } from 'react';
import { Agent } from '../../hooks/useAgents';
import { FeedingPanel } from './FeedingPanel';

interface KitchenViewProps {
  agents: Agent[];
  onFeedAgent: (agentId: string, snackId: string) => void;
}

export function KitchenView({ agents, onFeedAgent }: KitchenViewProps) {
  const [selectedSnack, setSelectedSnack] = useState<{ agent: Agent; snack: any } | null>(null);

  // Flatten pending snacks from all agents
  const pendingSnacks = agents.flatMap(agent => 
    (agent.pendingSnacks || []).map(snack => ({ agent, snack }))
  ).sort((a, b) => b.snack.timestamp - a.snack.timestamp);

  const getNodeIcon = (nodeType?: string) => {
    switch (nodeType) {
      case 'plan': return 'assignment';
      case 'code_interpreter': return 'terminal';
      case 'critique': return 'rate_review';
      case 'router': return 'alt_route';
      case 'ensemble': return 'groups';
      case 'memory': return 'database';
      case 'tool': return 'build';
      case 'loop': return 'repeat';
      case 'transform': return 'auto_fix_high';
      case 'parallel': return 'reorder';
      default: return 'task';
    }
  };

  const getEmojiForTier = (tier: string) => {
    switch (tier) {
      case 'gold': return '🏆';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '🍬';
    }
  };

  // Unique agents that have snacks
  const agentsInQueue = Array.from(new Set(pendingSnacks.map(ps => ps.agent.config.id)))
    .map(id => agents.find(a => a.config.id === id))
    .filter((a): a is Agent => !!a);

  return (
    <div className="flex flex-col gap-12 pb-24 bg-blueprint min-h-screen font-body animate-in fade-in duration-500">
      {/* Header Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-8">
          <p className="font-headline text-sm uppercase tracking-[0.05em] text-secondary mb-2">Facility Section 4A</p>
          <h1 className="font-headline text-5xl sm:text-6xl lg:text-[72px] font-bold tracking-tight text-on-surface leading-none">The Kitchen</h1>
        </div>
        <div className="md:col-span-4 flex md:justify-end">
          <div className="bg-surface-container-low p-4 border border-outline-variant/10 min-w-[200px] ambient-shadow">
            <p className="font-headline text-xs uppercase tracking-wider text-outline mb-1">Engine Status</p>
            <p className="font-headline text-2xl font-medium text-primary">Active Array</p>
          </div>
        </div>
      </section>

      {/* The Engine Room (Trough & Queues) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-0 bottom-0 w-[1px] bg-outline-variant/10"></div>
          <div className="absolute right-1/4 top-0 bottom-0 w-[1px] bg-outline-variant/10"></div>
        </div>

        {/* Left Queue (Agents awaiting rewards) */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-center">
          {agentsInQueue.map((agent) => (
            <div key={agent.config.id} className="bg-surface-container-low border border-outline-variant/10 p-4 rounded-none hover:bg-surface-container transition-colors duration-200 group relative ambient-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-surface-variant relative overflow-hidden rounded-none border border-outline/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
                </div>
                <div>
                  <p className="font-headline text-sm font-bold text-on-surface">{agent.config.name}</p>
                  <p className="font-headline text-[10px] text-outline uppercase tracking-widest">{agent.zone} Resident</p>
                </div>
              </div>
              <div className="w-full relative">
                <p className="font-headline text-[10px] text-secondary flex justify-between mb-1">
                  <span>Pending Rewards</span> 
                  <span>{agent.pendingSnacks?.length || 0}</span>
                </p>
                <div className="h-4 w-full bg-surface-container-highest border border-outline-variant/20 flex relative overflow-hidden">
                  <div className="h-full bg-primary w-[70%] mix-blend-multiply relative z-10"></div>
                  <div className="w-full h-full flex absolute inset-0 opacity-20">
                     {[...Array(10)].map((_, i) => <div key={i} className="flex-1 border-r border-outline-variant last:border-0" />)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {agentsInQueue.length === 0 && (
             <div className="h-40 border border-dashed border-outline-variant/40 flex items-center justify-center p-6 text-center">
               <p className="text-xs uppercase tracking-widest text-outline/70">No queue active</p>
             </div>
          )}
        </div>

        {/* Central Trough */}
        <div className="lg:col-span-6 bg-surface-container border border-outline-variant/20 p-8 flex flex-col justify-center items-center min-h-[400px] relative ambient-shadow overflow-hidden">
          <p className="absolute top-4 left-4 font-headline text-xs uppercase tracking-wider text-outline">Primary Interface</p>
          <div className="glass-eggshell border border-outline-variant/30 p-12 relative w-full max-w-md flex flex-col items-center justify-center gap-6 group cursor-default">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary-container)_0%,transparent_70%)] opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
            <span className="material-symbols-outlined text-6xl text-primary font-light animate-spin-slow" style={{ fontVariationSettings: "'wght' 200" }}>data_usage</span>
            <div className="text-center z-10">
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Allocation Matrix</h3>
              <p className="font-body text-sm text-secondary">
                {pendingSnacks.length > 0 
                  ? `${pendingSnacks.length} pending data chunks ready for distribution.` 
                  : "All units currently saturated. Engine standby."}
              </p>
            </div>
            {/* Decorative corner markers */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-outline/30"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-outline/30"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-outline/30"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-outline/30"></div>
          </div>
        </div>

        {/* Right Queue (Stats / Log) */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-center">
          <div className="h-full min-h-[200px] border border-outline-variant/40 bg-surface-container-low p-6 flex flex-col justify-between ambient-shadow">
            <div>
              <p className="font-headline text-[10px] text-outline uppercase tracking-widest mb-4">Feed Statistics</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold font-headline text-on-surface">
                  <span>Success Rate</span>
                  <span>99.8%</span>
                </div>
                <div className="flex justify-between text-xs font-bold font-headline text-on-surface">
                  <span>Uptime</span>
                  <span>1,240h</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/20">
               <span className="material-symbols-outlined text-primary text-4xl mb-2">verified_user</span>
               <p className="font-headline text-[10px] uppercase tracking-widest text-primary">Security Locked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Snack Selector Carousel */}
      <section className="border-t border-outline-variant/10 pt-12">
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>deployed_code</span>
          Reserve Allocations
        </h2>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide no-scrollbar">
          {pendingSnacks.map(({ agent, snack }) => (
            <div 
              key={snack.id} 
              className={`min-w-[280px] bg-surface-container-lowest border border-outline-variant/30 snap-start p-6 flex flex-col rounded-none hover:bg-surface-container-low transition-colors duration-200 ambient-shadow group relative overflow-hidden
                ${snack.tier === 'gold' ? 'border-tertiary/40' : ''}
              `}
              onClick={() => setSelectedSnack({ agent, snack })}
            >
              {snack.tier === 'gold' && <div className="absolute inset-0 bg-tertiary opacity-[0.03] pointer-events-none"></div>}
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="material-symbols-outlined text-3xl text-primary">{getNodeIcon(snack.nodeType)}</span>
                <span className={`font-headline text-[10px] px-2 py-1 uppercase tracking-wider 
                  ${snack.tier === 'gold' ? 'text-tertiary bg-tertiary-container/10 border border-tertiary/20' : 'text-on-surface bg-surface-variant'}
                `}>
                  {snack.tier || 'Common'}
                </span>
              </div>
              
              <h3 className="font-headline text-xl font-bold text-on-surface uppercase tracking-tight mb-2 relative z-10">
                {snack.nodeType ? `${snack.nodeType} Chunk` : "Data Chunk"}
              </h3>
              <p className="font-body text-sm text-secondary mb-6 flex-grow relative z-10 line-clamp-2">
                "{snack.taskDescription}" for {agent.config.name}. +{snack.boostValue}% {snack.boostType}.
              </p>
              
              <button className={`${snack.tier === 'gold' ? 'bg-tertiary text-on-tertiary' : 'sage-gradient text-on-primary'} w-full py-3 px-4 font-headline text-sm font-bold rounded-none uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all duration-200 relative z-10`}>
                Extract & Feed
              </button>
            </div>
          ))}
          
          {pendingSnacks.length === 0 && (
            <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-outline-variant opacity-30">
              <p className="font-headline text-sm uppercase tracking-widest font-bold">No allocations available</p>
            </div>
          )}
        </div>
      </section>

      {/* Overlays */}
      {selectedSnack && (
        <FeedingPanel 
          agent={selectedSnack.agent} 
          snack={selectedSnack.snack} 
          onClose={() => setSelectedSnack(null)}
          onConfirm={() => {
            onFeedAgent(selectedSnack.agent.config.id, selectedSnack.snack.id);
            setSelectedSnack(null);
          }}
        />
      )}
    </div>
  );
}

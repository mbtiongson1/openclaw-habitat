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

  const getEmojiForTier = (tier: string) => {
    switch (tier) {
      case 'gold': return '🏆';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '🍬';
    }
  };

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

  return (
    <div className="flex flex-col gap-8 pb-16 fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-2">The Kitchen</h2>
          <p className="font-body text-on-surface-variant text-lg">Reward agents with data snacks for completed tasks.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 border-b-2 border-secondary">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>countertops</span>
          <span className="font-headline font-bold text-on-surface">REWARD HUB ACTIVE</span>
        </div>
      </div>

      {pendingSnacks.length === 0 ? (
        <div className="p-12 text-center text-on-surface-variant bg-surface-container-low font-body border-2 border-dashed border-outline-variant">
          <p className="text-xl mb-2 font-headline font-bold">No snacks available right now.</p>
          <p className="text-sm opacity-60">Snacks appear when agents complete Karpathy-style tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingSnacks.map(({ agent, snack }) => (
            <div 
              key={snack.id} 
              className="bg-surface-container-low cursor-pointer hover:-translate-y-1 transition-transform group"
              style={{ boxShadow: '4px 4px 0px rgba(28,28,21,0.1)' }}
              onClick={() => setSelectedSnack({ agent, snack })}
            >
              <div className="bg-surface-variant px-4 py-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    {getNodeIcon(snack.nodeType)}
                  </span>
                  <span className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">
                    {snack.nodeType || 'Generic Task'}
                  </span>
                </div>
                <span className="text-lg">{getEmojiForTier(snack.tier)}</span>
              </div>
              
              <div className="p-6">
                <p className="font-headline font-bold text-on-surface mb-1">"{snack.taskDescription}"</p>
                <p className="font-body text-xs text-on-surface-variant mb-4 flex items-center gap-1">
                   <span className="material-symbols-outlined text-[14px]">person</span> {agent.config.name}
                </p>
                
                <div className="flex justify-between items-end border-t border-outline-variant pt-4 mt-2">
                  <div className="flex flex-col">
                    <span className="font-label text-[10px] text-on-surface-variant uppercase font-bold">Boost</span>
                    <span className="font-headline font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                      +{snack.boostValue}% {snack.boostType}
                    </span>
                  </div>
                  <div className="bg-primary text-on-primary px-3 py-1 font-headline font-bold text-xs uppercase">
                    Feed
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSnack && (
        <FeedingPanel 
          agent={selectedSnack.agent} 
          snack={selectedSnack.snack} 
          onClose={() => setSelectedSnack(null)}
          onConfirm={() => {
            onFeedAgent(selectedSnack.agent.config.id, selectedSnack.snack.id);
            setSelectedSnack(null); // Will close the modal
          }}
        />
      )}
    </div>
  );
}

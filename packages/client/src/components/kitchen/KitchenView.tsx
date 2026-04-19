import React, { useState } from 'react';
import { Agent } from '../../hooks/useAgents';
import { FeedingPanel } from './FeedingPanel';
import './KitchenView.css';

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

  return (
    <div className="kitchen-view fade-in">
      <header className="kitchen-view__header">
        <h2 className="kitchen-view__title">The Kitchen</h2>
        <p className="kitchen-view__subtitle">Reward agents with data snacks for completed tasks</p>
      </header>

      {pendingSnacks.length === 0 ? (
        <div className="empty-state">
          <p>No snacks available right now.</p>
          <p style={{ fontSize: '0.8rem' }}>Snacks appear when agents complete tasks.</p>
        </div>
      ) : (
        <div className="kitchen-view__snack-grid">
          {pendingSnacks.map(({ agent, snack }) => (
            <div 
              key={snack.id} 
              className="snack-card"
              onClick={() => setSelectedSnack({ agent, snack })}
            >
              <div className="snack-card__header">
                <span className={`snack-card__tier snack-card__tier--${snack.tier}`}>
                  {snack.tier} Snack
                </span>
                <span className="snack-card__emoji">{getEmojiForTier(snack.tier)}</span>
              </div>
              <p className="snack-card__task">"{snack.taskDescription}"</p>
              <div className="snack-card__footer">
                <span>+{snack.boostValue}% {snack.boostType}</span>
                <span className="snack-card__agent">For {agent.config.name}</span>
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

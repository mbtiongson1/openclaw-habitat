import React from 'react';
import { Agent } from '../../hooks/useAgents';
import './FeedingPanel.css';

interface FeedingPanelProps {
  agent: Agent;
  snack: any;
  onClose: () => void;
  onConfirm: () => void;
}

export function FeedingPanel({ agent, snack, onClose, onConfirm }: FeedingPanelProps) {
  return (
    <div className="feeding-panel__overlay z-index-modal">
      <div className="feeding-panel__modal">
        <h3 className="feeding-panel__title">Feed Agent</h3>
        
        <div className="feeding-panel__content">
          <p>
            Give <strong>{agent.config.name}</strong> a {snack.tier} snack for 
            completing "{snack.taskDescription}"?
          </p>
          
          <div className="feeding-panel__boost-preview">
            <span className="emoji">✨</span>
            <div>
              <strong>+{snack.boostValue}% {snack.boostType}</strong>
              <div className="text-secondary">for {snack.boostDurationMinutes} minutes</div>
            </div>
          </div>
        </div>

        <div className="feeding-panel__actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={onConfirm}>Feed Snack</button>
        </div>
      </div>
    </div>
  );
}

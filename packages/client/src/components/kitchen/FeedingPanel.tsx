import React from 'react';
import { Agent } from '../../hooks/useAgents';

interface FeedingPanelProps {
  agent: Agent;
  snack: any;
  onClose: () => void;
  onConfirm: () => void;
}

export function FeedingPanel({ agent, snack, onClose, onConfirm }: FeedingPanelProps) {
  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
      <div 
        className="bg-surface w-full max-w-md border-2 border-on-surface relative overflow-hidden"
        style={{ boxShadow: '8px 8px 0px rgba(28,28,21,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface-variant p-4 border-b-2 border-on-surface flex justify-between items-center">
          <h3 className="font-headline font-bold uppercase tracking-widest text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined">restaurant</span>
            Reward Agent
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4 text-3xl">
              {snack.tier === 'gold' ? '🏆' : snack.tier === 'silver' ? '🥈' : '🥉'}
            </div>
            <p className="font-body text-on-surface text-lg leading-relaxed">
              Give <span className="font-bold underline decoration-secondary decoration-2 underline-offset-4">{agent.config.name}</span> a <span className="font-bold text-primary uppercase">{snack.tier}</span> snack for completing the <span className="italic font-bold text-on-surface-variant">"{snack.nodeType || 'task'}"</span> cycle?
            </p>
          </div>
          
          <div className="bg-surface-container-low p-6 border-2 border-on-surface relative mb-8">
            <div className="absolute -top-3 left-4 bg-surface px-2 font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
              Boost Preview
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <div>
                <strong className="block font-headline text-xl text-on-surface">+{snack.boostValue}% {snack.boostType}</strong>
                <div className="font-body text-sm text-on-surface-variant">Active for {snack.boostDurationMinutes} minutes</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              className="bg-surface border-2 border-on-surface py-4 font-headline font-bold uppercase hover:bg-surface-container-high transition-colors active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
              onClick={onClose}
              style={{ boxShadow: '4px 4px 0px rgba(28,28,21,1)' }}
            >
              Cancel
            </button>
            <button 
              className="bg-primary text-on-primary border-2 border-on-surface py-4 font-headline font-bold uppercase hover:bg-primary-container transition-colors active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
              onClick={onConfirm}
              style={{ boxShadow: '4px 4px 0px rgba(28,28,21,1)' }}
            >
              Feed Snack
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

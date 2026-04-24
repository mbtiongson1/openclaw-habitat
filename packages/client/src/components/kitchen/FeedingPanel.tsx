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
    <div className="fixed inset-0 bg-on-background/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
      <div 
        className="bg-background w-full max-w-md border border-outline-variant/30 relative overflow-hidden ambient-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-surface-container-high p-4 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="font-headline font-bold uppercase tracking-widest text-on-surface flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-primary">deployed_code</span>
            Confirm Allocation
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform p-1">
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-surface-container-low border border-outline-variant/30 flex items-center justify-center mb-6 text-4xl ambient-shadow
               ${snack.tier === 'gold' ? 'border-tertiary/40' : ''}
            `}>
              {snack.tier === 'gold' ? '🏆' : snack.tier === 'silver' ? '🥈' : '🥉'}
            </div>
            <p className="font-body text-on-surface text-lg leading-relaxed">
              Allocate this <span className={`font-bold mt-1 inline-block px-2 py-0.5 uppercase text-xs tracking-widest 
                ${snack.tier === 'gold' ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface'}
              `}>{snack.tier || 'Common'}</span> data chunk to 
              <span className="block font-headline font-black text-2xl text-primary mt-1 tracking-tight">{agent.config.name}</span>
            </p>
          </div>
          
          <div className="bg-surface-container-low p-6 border border-outline-variant/30 relative mb-8 ambient-shadow">
            <div className="absolute -top-3 left-4 bg-background border border-outline-variant/20 px-2 font-headline font-bold text-[10px] uppercase tracking-widest text-outline">
              Efficiency Gain
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <div>
                <strong className="block font-headline text-2xl text-on-surface tracking-tighter">+{snack.boostValue}% {snack.boostType}</strong>
                <div className="font-headline text-[10px] text-outline uppercase tracking-widest">Active Persistence: {snack.boostDurationMinutes} mins</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              className="bg-surface-container-high py-4 font-headline text-sm font-bold uppercase tracking-wider hover:brightness-95 transition-all active:scale-[0.98]"
              onClick={onClose}
            >
              Abstain
            </button>
            <button 
              className="sage-gradient text-on-primary py-4 font-headline text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all active:scale-[0.98] ambient-shadow"
              onClick={onConfirm}
            >
              Authorize
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 -mr-8 -mt-8 rotate-45 border-l border-outline-variant/10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 -ml-8 -mb-8 rotate-45 border-r border-outline-variant/10"></div>
      </div>
    </div>
  );
}

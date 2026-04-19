import React from 'react';
import { type Agent } from '../../hooks/useAgents';
import AgentSVG from '../../svg/AgentSVG';
import './NurseryView.css';

interface NurseryViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

export function NurseryView({ agents, onSelectAgent }: NurseryViewProps) {
  // Only idle/sleeping agents belong in the nursery
  const nurseryAgents = agents.filter(a => a.zone === 'nursery');

  return (
    <div className="nursery-view fade-in">
      <header className="nursery-view__header">
        <h2 className="nursery-view__title">The Nursery</h2>
        <p className="nursery-view__subtitle">Quiet time for idle agents to recharge</p>
      </header>

      {nurseryAgents.length === 0 ? (
        <div className="empty-state">
          <p>No agents are resting right now.</p>
        </div>
      ) : (
        <div className="nursery-view__grid">
          {nurseryAgents.map(agent => {
            // Find their last completed task from pending snacks if available
            const lastSnack = agent.pendingSnacks?.[agent.pendingSnacks.length - 1];
            const dreamText = lastSnack ? `Dreaming about: ${lastSnack.taskDescription}` : 'Dreaming of electric sheep...';

            return (
              <div key={agent.config.id} className="nursery-bed" onClick={() => onSelectAgent(agent.config.id)}>
                <div className="dream-bubble">
                  {dreamText}
                  <div className="z-particle">Z</div>
                  <div className="z-particle">z</div>
                  <div className="z-particle">z</div>
                </div>
                <div className="nursery-bed__agent">
                  <AgentSVG
                    size={100}
                    head={agent.config.svgParts.head}
                    body={agent.config.svgParts.body}
                    hands={agent.config.svgParts.hands}
                    feet={agent.config.svgParts.feet}
                    state="idle"
                  />
                  <div className="nursery-bed__name text-center mt-2">{agent.config.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

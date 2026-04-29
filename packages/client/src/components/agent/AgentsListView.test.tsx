import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AGENT_STATES, ZONES } from '@habitat/shared';
import { AgentsListView } from './AgentsListView';
import { type Agent } from '../../hooks/useAgents';

function createAgent(): Agent {
  return {
    config: {
      id: 'agent-1',
      name: 'Ada',
      personality: 'cautious',
      svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
      installedAt: 1,
    },
    zone: ZONES.LOUNGE,
    state: AGENT_STATES.WORKING,
    stats: { cpu: 38, memory: 44, tasksCompleted: 12, uptimeSeconds: 7200 },
    activeBoosts: [{ type: 'focus', value: 15, expiresAt: Date.now() + 1000 }],
    pendingSnacks: [],
  };
}

describe('AgentsListView', () => {
  it('surfaces per-agent characteristics and modal capabilities', () => {
    const onSelectAgent = vi.fn();
    render(<AgentsListView agents={[createAgent()]} onSelectAgent={onSelectAgent} />);

    expect(screen.getByText('Agent Operations')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /ada sprite/i })).toBeInTheDocument();
    expect(screen.queryByText('AD')).not.toBeInTheDocument();
    expect(screen.getByText('Personality')).toBeInTheDocument();
    expect(screen.getByText('cautious')).toBeInTheDocument();
    expect(screen.getByText('Model Strategy')).toBeInTheDocument();
    expect(screen.getByText('Recovery History')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open ada details/i }));
    expect(onSelectAgent).toHaveBeenCalledWith('agent-1');
  });
});

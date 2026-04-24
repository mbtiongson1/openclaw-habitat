import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AGENT_STATES, ZONES, type Agent } from '@habitat/shared';
import { SanctuaryHub } from './SanctuaryHub';

function createAgent(id: string, name: string, state: Agent['state'], zone: Agent['zone']): Agent {
  return {
    config: {
      id,
      name,
      personality: 'focused',
      svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
      installedAt: 1,
    },
    state,
    zone,
    stats: { cpu: 10, memory: 20, tasksCompleted: 0, uptimeSeconds: 0 },
    activeBoosts: [],
    pendingSnacks: [],
  };
}

describe('SanctuaryHub', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a scalable house plan with required rooms instead of old quadrants', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/zones/task-summaries')) {
        return Response.json({ summaries: [] });
      }
      if (url.includes('/api/tasks') || url.includes('/tasks?')) {
        return Response.json({ tasks: [] });
      }
      if (url.includes('/heartbeats')) {
        return Response.json({ heartbeats: [] });
      }
      return Response.json({});
    });
    vi.stubGlobal('fetch', fetchMock);
    const ws = { subscribe: vi.fn(() => vi.fn()), send: vi.fn(), connected: true, reconnecting: false };
    const agents = [
      createAgent('agent-rest', 'Rest', AGENT_STATES.IDLE, ZONES.NURSERY),
      createAgent('agent-feed', 'Feed', AGENT_STATES.FEEDING, ZONES.KITCHEN),
      createAgent('agent-work', 'Work', AGENT_STATES.WORKING, ZONES.LOUNGE),
      createAgent('agent-garden', 'Garden', AGENT_STATES.SOCIAL, ZONES.GARDEN),
    ];

    render(<SanctuaryHub agents={agents} ws={ws as never} onSelectAgent={vi.fn()} />);

    expect(screen.getByText('Bedroom')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Office')).toBeInTheDocument();
    expect(screen.getByText('Outdoor Garden')).toBeInTheDocument();
    expect(screen.queryByText('Room Alpha')).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });
});

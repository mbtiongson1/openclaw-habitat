import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AGENT_STATES, ZONES, type Agent } from '@habitat/shared';
import { ZonesView } from './ZonesView';

function createAgent(id: string): Agent {
  return {
    config: {
      id,
      name: id,
      personality: 'cautious',
      svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
      installedAt: 1,
    },
    state: AGENT_STATES.WORKING,
    zone: ZONES.LOUNGE,
    stats: { cpu: 20, memory: 30, tasksCompleted: 4, uptimeSeconds: 100 },
    activeBoosts: [],
    pendingSnacks: [],
  };
}

describe('ZonesView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders zone task queues from the sanctuary operations API', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/api/zones/task-summaries')) {
        return Response.json({
          summaries: [{ zone: ZONES.LOUNGE, roomIntent: 'task', agents: 1, activeTasks: 1, queuedTasks: 0, completedTasks: 0, staleHeartbeats: 0 }],
        });
      }
      if (url.includes('/api/zones/Lounge/tasks')) {
        return Response.json({
          tasks: [{ id: 'task-1', title: 'Docker gateway audit', status: 'active', zone: ZONES.LOUNGE, roomIntent: 'task', updatedAt: 1 }],
        });
      }
      if (url.includes('/tasks')) return Response.json({ tasks: [] });
      if (url.includes('/heartbeats')) return Response.json({ heartbeats: [] });
      return Response.json({ tasks: [] });
    }));

    const ws = { subscribe: vi.fn(() => vi.fn()), send: vi.fn(), connected: true, reconnecting: false };
    render(<ZonesView agents={[createAgent('agent-1')]} ws={ws as never} />);

    expect(screen.getByText('Zone Task Flow')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Docker gateway audit')).toBeInTheDocument());
  });
});

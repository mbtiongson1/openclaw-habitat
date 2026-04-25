import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZONES } from '@habitat/shared';
import { AnalyticsView } from './AnalyticsView';

describe('AnalyticsView', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders live gateway, runtime, task, and model operation analytics', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/health') {
        return Response.json({ status: 'ok', uptime: 3600, agents: 3 });
      }
      if (url === '/api/models/runtime') {
        return Response.json({
          runtime: {
            label: 'Host runtime',
            source: 'host',
            cpuPct: 42,
            ramBytes: 4_294_967_296,
            totalRamBytes: 17_179_869_184,
            updatedAt: 1,
          },
        });
      }
      if (url.includes('/api/model-operations')) {
        return Response.json({
          events: [{
            id: 'event-1',
            timestamp: 1,
            eventType: 'quota_exhausted',
            severity: 'warning',
            source: 'runtime_probe',
            message: 'Gemini quota exhausted',
          }],
        });
      }
      if (url === '/api/zones/task-summaries') {
        return Response.json({
          summaries: [{ zone: ZONES.LOUNGE, roomIntent: 'task', agents: 2, activeTasks: 3, queuedTasks: 1, completedTasks: 7, staleHeartbeats: 0 }],
        });
      }
      if (url === '/api/commands') {
        return Response.json({
          commands: [{
            id: 'status',
            command: '/status',
            label: 'Status',
            group: 'visibility',
            sourceLabel: 'GitHub',
            description: 'gateway status',
            enabled: true,
            requiresOptIn: false,
            dangerLevel: 'safe',
          }],
        });
      }
      return Response.json({});
    }));

    render(<AnalyticsView />);

    await waitFor(() => expect(screen.getByText('Docker Gateway')).toBeInTheDocument());
    expect(screen.getAllByText('Host runtime').length).toBeGreaterThan(0);
    expect(screen.getByText('Gemini quota exhausted')).toBeInTheDocument();
    expect(screen.getByText('OpenClaw Command Surface')).toBeInTheDocument();
  });

  it('polls every second and renders bounded historical charts', async () => {
    let cpuPct = 20;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/health') return Response.json({ status: 'ok', uptime: 3600, agents: 3 });
      if (url === '/api/models/runtime') {
        cpuPct += 5;
        return Response.json({
          runtime: {
            label: 'Host runtime',
            source: 'host',
            cpuPct,
            ramBytes: 4_294_967_296,
            totalRamBytes: 17_179_869_184,
            updatedAt: Date.now(),
          },
        });
      }
      if (url.includes('/api/model-operations')) return Response.json({ events: [] });
      if (url === '/api/zones/task-summaries') {
        return Response.json({
          summaries: [{ zone: ZONES.LOUNGE, roomIntent: 'task', agents: 2, activeTasks: 3, queuedTasks: 1, completedTasks: 7, staleHeartbeats: 0 }],
        });
      }
      if (url === '/api/commands') return Response.json({ commands: [] });
      return Response.json({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AnalyticsView />);
    await waitFor(() => expect(screen.getByLabelText('Runtime CPU history chart')).toBeInTheDocument());

    await waitFor(
      () => expect(fetchMock.mock.calls.filter(([url]) => url === '/api/models/runtime').length).toBeGreaterThan(1),
      { timeout: 1800 },
    );
    expect(screen.getAllByText(/60 second history/i)).toHaveLength(4);
    expect(screen.getByLabelText('Task flow history chart')).toBeInTheDocument();
  });
});

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZONES, type AgentHeartbeat, type SanctuaryTask, type ZoneTaskSummary } from '@habitat/shared';
import { useSanctuaryOperations } from './useSanctuaryOperations';
import { useWebSocket } from './useWebSocket';

type Handler = Parameters<ReturnType<typeof useWebSocket>['subscribe']>[0];

function createWs() {
  const handlers = new Set<Handler>();
  return {
    connected: true,
    reconnecting: false,
    send: vi.fn(),
    subscribe: vi.fn((handler: Handler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    }),
    emit: (msg: Parameters<Handler>[0]) => {
      handlers.forEach(handler => handler(msg));
    },
  };
}

function task(overrides: Partial<SanctuaryTask>): SanctuaryTask {
  return {
    id: 'task-1',
    title: 'Task one',
    description: 'Task one',
    agentId: 'agent-1',
    zone: ZONES.LOUNGE,
    roomIntent: 'task',
    status: 'active',
    progressPct: 10,
    priority: 3,
    createdAt: 1_000,
    updatedAt: 1_000,
    steps: [],
    ...overrides,
  };
}

function heartbeat(overrides: Partial<AgentHeartbeat>): AgentHeartbeat {
  return {
    agentId: 'agent-1',
    zone: ZONES.LOUNGE,
    state: 'working',
    roomIntent: 'task',
    status: 'online',
    source: 'mock_gateway',
    lastSeenAt: 2_000,
    ...overrides,
  };
}

function summary(overrides: Partial<ZoneTaskSummary>): ZoneTaskSummary {
  return {
    zone: ZONES.LOUNGE,
    roomIntent: 'task',
    agents: 1,
    activeTasks: 1,
    queuedTasks: 0,
    completedTasks: 0,
    staleHeartbeats: 0,
    ...overrides,
  };
}

describe('useSanctuaryOperations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads tasks, zone tasks, zone summaries, and agent heartbeats from the API', async () => {
    const baseTask = task({ id: 'task-1' });
    const kitchenTask = task({ id: 'task-kitchen', zone: ZONES.KITCHEN, roomIntent: 'feeding' });
    const baseHeartbeat = heartbeat({ agentId: 'agent-1' });
    const baseSummary = summary({ zone: ZONES.LOUNGE });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/tasks?limit=100') return json({ tasks: [baseTask] });
      if (url === `/api/zones/${encodeURIComponent(ZONES.KITCHEN)}/tasks?limit=100`) return json({ tasks: [kitchenTask] });
      if (url === '/api/zones/task-summaries') return json({ summaries: [baseSummary] });
      if (url === '/api/agents/agent-1/heartbeats') return json({ heartbeats: [baseHeartbeat] });
      return json({}, false);
    });
    vi.stubGlobal('fetch', fetchMock);

    const ws = createWs();
    const { result } = renderHook(() => useSanctuaryOperations(ws, {
      agentIds: ['agent-1'],
      zones: [ZONES.KITCHEN],
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toEqual([baseTask]);
    expect(result.current.zoneTasks[ZONES.KITCHEN]).toEqual([kitchenTask]);
    expect(result.current.zoneSummaries).toEqual([baseSummary]);
    expect(result.current.heartbeatsByAgent['agent-1']).toEqual([baseHeartbeat]);
  });

  it('applies task_update and agent_heartbeat websocket messages without refetching everything', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/tasks?limit=100') return json({ tasks: [] });
      if (url === `/api/zones/${encodeURIComponent(ZONES.LOUNGE)}/tasks?limit=100`) return json({ tasks: [] });
      if (url === '/api/zones/task-summaries') return json({ summaries: [] });
      if (url === '/api/agents/agent-1/heartbeats') return json({ heartbeats: [] });
      return json({}, false);
    }));

    const ws = createWs();
    const { result } = renderHook(() => useSanctuaryOperations(ws, {
      agentIds: ['agent-1'],
      zones: [ZONES.LOUNGE],
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    const callsAfterLoad = vi.mocked(fetch).mock.calls.length;

    const nextTask = task({ id: 'task-2', updatedAt: 5_000 });
    const nextHeartbeat = heartbeat({ agentId: 'agent-1', lastSeenAt: 5_000 });
    act(() => {
      ws.emit({ type: 'task_update', payload: nextTask });
      ws.emit({ type: 'agent_heartbeat', payload: nextHeartbeat });
    });

    expect(result.current.tasks).toEqual([nextTask]);
    expect(result.current.zoneTasks[ZONES.LOUNGE]).toEqual([nextTask]);
    expect(result.current.heartbeatsByAgent['agent-1']).toEqual([nextHeartbeat]);
    expect(vi.mocked(fetch).mock.calls).toHaveLength(callsAfterLoad);
  });
});

function json(payload: unknown, ok = true): Response {
  return {
    ok,
    json: async () => payload,
  } as Response;
}

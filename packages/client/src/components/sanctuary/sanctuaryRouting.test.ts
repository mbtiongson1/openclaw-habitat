import { describe, expect, it } from 'vitest';
import { ZONES, type AgentHeartbeat, type SanctuaryTask } from '@habitat/shared';
import {
  getHeartbeatStatus,
  routeAgentToRoom,
  routeTaskToRoom,
} from './sanctuaryRouting';

function task(overrides: Partial<SanctuaryTask>): SanctuaryTask {
  return {
    id: 'task-1',
    title: 'Build habitat status card',
    description: 'Build habitat status card',
    agentId: 'agent-1',
    zone: ZONES.LOUNGE,
    roomIntent: 'task',
    status: 'active',
    progressPct: 25,
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
    lastSeenAt: 10_000,
    ...overrides,
  };
}

describe('sanctuaryRouting', () => {
  it('routes idle and rest states to bedroom rest', () => {
    expect(routeAgentToRoom({ state: 'idle', zone: ZONES.LOUNGE })).toEqual({
      zone: ZONES.NURSERY,
      roomIntent: 'rest',
      roomKind: 'bedroom',
    });

    expect(routeTaskToRoom(task({ roomIntent: 'rest', zone: ZONES.LOUNGE }))).toMatchObject({
      zone: ZONES.NURSERY,
      roomIntent: 'rest',
      roomKind: 'bedroom',
    });
  });

  it('routes feeding and snack work to kitchen feeding', () => {
    expect(routeAgentToRoom({ state: 'feeding', zone: ZONES.LOUNGE })).toEqual({
      zone: ZONES.KITCHEN,
      roomIntent: 'feeding',
      roomKind: 'kitchen',
    });

    expect(routeTaskToRoom(task({ title: 'Award silver snack', roomIntent: 'task' }))).toMatchObject({
      zone: ZONES.KITCHEN,
      roomIntent: 'feeding',
      roomKind: 'kitchen',
    });
  });

  it('routes active task work to office task rooms', () => {
    expect(routeAgentToRoom({ state: 'working', zone: ZONES.LOUNGE })).toEqual({
      zone: ZONES.LOUNGE,
      roomIntent: 'task',
      roomKind: 'office',
    });

    expect(routeTaskToRoom(task({ status: 'active', nodeType: 'planner' }))).toMatchObject({
      zone: ZONES.LOUNGE,
      roomIntent: 'task',
      roomKind: 'office',
    });
  });

  it('routes social and garden work outdoors', () => {
    expect(routeAgentToRoom({ state: 'social', zone: ZONES.LOUNGE })).toEqual({
      zone: ZONES.GARDEN,
      roomIntent: 'garden',
      roomKind: 'garden',
    });

    expect(routeTaskToRoom(task({ title: 'Prune garden queue', zone: ZONES.LOUNGE }))).toMatchObject({
      zone: ZONES.GARDEN,
      roomIntent: 'garden',
      roomKind: 'garden',
    });
  });

  it('marks old heartbeats stale without mutating fresh or offline records', () => {
    expect(getHeartbeatStatus(heartbeat({ lastSeenAt: 10_000 }), 12_000, 5_000)).toBe('online');
    expect(getHeartbeatStatus(heartbeat({ lastSeenAt: 1_000 }), 12_000, 5_000)).toBe('stale');
    expect(getHeartbeatStatus(heartbeat({ status: 'offline', lastSeenAt: 1_000 }), 12_000, 5_000)).toBe('offline');
  });
});

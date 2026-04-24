import {
  AGENT_STATES,
  ZONES,
  type AgentHeartbeat,
  type AgentStateType,
  type SanctuaryRoomIntent,
  type SanctuaryTask,
  type ZoneType,
} from '@habitat/shared';

export type SanctuaryRoomKind = 'bedroom' | 'kitchen' | 'office' | 'garden';

export interface SanctuaryRoomRoute {
  zone: ZoneType;
  roomIntent: SanctuaryRoomIntent;
  roomKind: SanctuaryRoomKind;
}

interface AgentRouteInput {
  state?: AgentStateType | string;
  zone?: ZoneType | string;
  roomIntent?: SanctuaryRoomIntent;
}

const REST_STATES = new Set(['idle', 'rest', 'resting', 'sleeping']);
const FEEDING_STATES = new Set(['feeding', 'snack', 'snacking', 'eating']);
const GARDEN_STATES = new Set(['social', 'garden', 'outdoor', 'outdoors']);
const GARDEN_WORDS = ['garden', 'outdoor', 'social'];
const SNACK_WORDS = ['snack', 'feeding', 'feed', 'kitchen', 'meal'];

export function routeAgentToRoom(agent: AgentRouteInput): SanctuaryRoomRoute {
  if (agent.roomIntent) return routeIntent(agent.roomIntent, agent.zone);

  const state = agent.state?.toLowerCase();
  if (state && REST_STATES.has(state)) return routeIntent('rest');
  if (state && FEEDING_STATES.has(state)) return routeIntent('feeding');
  if (state && GARDEN_STATES.has(state)) return routeIntent('garden');
  if (agent.zone === ZONES.GARDEN) return routeIntent('garden');
  if (agent.zone === ZONES.KITCHEN) return routeIntent('feeding');
  if (agent.zone === ZONES.NURSERY) return routeIntent('rest');
  return routeIntent('task');
}

export function routeTaskToRoom(task: SanctuaryTask): SanctuaryRoomRoute {
  const searchable = [
    task.title,
    task.description,
    task.nodeType,
    task.roomIntent,
    task.zone,
  ].filter(Boolean).join(' ').toLowerCase();

  if (task.roomIntent === 'rest' || task.zone === ZONES.NURSERY) return routeIntent('rest');
  if (task.roomIntent === 'feeding' || includesAny(searchable, SNACK_WORDS)) return routeIntent('feeding');
  if (task.roomIntent === 'garden' || task.roomIntent === 'social' || includesAny(searchable, GARDEN_WORDS)) {
    return routeIntent('garden');
  }
  return routeIntent('task', task.zone);
}

export function routeHeartbeatToRoom(heartbeat: AgentHeartbeat): SanctuaryRoomRoute {
  return routeAgentToRoom({
    state: heartbeat.state,
    zone: heartbeat.zone,
    roomIntent: heartbeat.roomIntent,
  });
}

export function getHeartbeatStatus(
  heartbeat: AgentHeartbeat,
  now = Date.now(),
  staleAfterMs = 30_000
): AgentHeartbeat['status'] {
  if (heartbeat.status === 'offline') return 'offline';
  return now - heartbeat.lastSeenAt > staleAfterMs ? 'stale' : heartbeat.status;
}

function routeIntent(intent: SanctuaryRoomIntent, zone?: ZoneType | string): SanctuaryRoomRoute {
  if (intent === 'rest') return { zone: ZONES.NURSERY, roomIntent: 'rest', roomKind: 'bedroom' };
  if (intent === 'feeding') return { zone: ZONES.KITCHEN, roomIntent: 'feeding', roomKind: 'kitchen' };
  if (intent === 'garden' || intent === 'social') return { zone: ZONES.GARDEN, roomIntent: 'garden', roomKind: 'garden' };
  return {
    zone: isZone(zone) ? zone : ZONES.LOUNGE,
    roomIntent: 'task',
    roomKind: 'office',
  };
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some(term => value.includes(term));
}

function isZone(value: unknown): value is ZoneType {
  return Object.values(ZONES).includes(value as ZoneType);
}

import { ZoneType, AgentStateType } from './constants';

export interface SVGParts {
  head: string;
  body: string;
  hands: string;
  feet: string;
}

export interface AgentStats {
  cpu: number;     // 0-100
  memory: number;  // 0-100
  tasksCompleted: number;
  uptimeSeconds: number;
}

export interface Boost {
  type: string; // e.g., 'processing speed', 'focus'
  value: number; // e.g., 15
  expiresAt: number; // Timestamp
}

export interface SnackReward {
  id: string;
  taskId: string;
  taskDescription: string;
  score: number;
  tier: 'bronze' | 'silver' | 'gold';
  boostType: string;
  boostValue: number;
  boostDurationMinutes: number;
  timestamp: number;
  nodeType?: string;
}

export interface FeedingLogEntry {
  snack: SnackReward;
  notes: string;
  timestamp: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  personality: string;
  svgParts: SVGParts;
  installedAt: number;
}

export interface Agent {
  config: AgentConfig;
  zone: ZoneType;
  state: AgentStateType;
  stats: AgentStats;
  activeBoosts: Boost[];
  pendingSnacks: SnackReward[]; 
}

export interface ZoneTransitionEvent {
  agentId: string;
  fromZone: ZoneType;
  toZone: ZoneType;
  timestamp: number;
}

export interface AgentStateChangeEvent {
  agentId: string;
  newState: AgentStateType;
  timestamp: number;
}

export interface SubAgentTaskCompleteEvent {
  agentId: string;
  taskId: string;
  description: string;
  score: number;
  timestamp: number;
  nodeType?: string;
}

export interface ConfigSnapshot {
  version: string;
  timestamp: number;
  agents: AgentConfig[];
  globalPreferences: any;
}

export type WSMessageType = 
  | 'init_state'
  | 'agent_update'
  | 'zone_transition'
  | 'snack_granted'
  | 'boost_applied';

export interface WSMessageEnvelope<T = any> {
  type: WSMessageType;
  payload: T;
}

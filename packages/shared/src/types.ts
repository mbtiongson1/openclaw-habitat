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

export type ModelOrigin = 'cloud' | 'local';

export type ModelUsabilityStatus =
  | 'usable'
  | 'temporarily_unavailable'
  | 'quota_exhausted'
  | 'not_installed'
  | 'runtime_unreachable';

export interface ModelUsability {
  status: ModelUsabilityStatus;
  reasonCode: string;
  message: string;
  checkedAt: number;
}

export interface ModelAvailability {
  installed: boolean;
  reachable: boolean;
  reason?: string;
}

export interface ModelLinks {
  usageUrl?: string;
  managementUrl?: string;
}

export interface ModelDescriptor {
  id: string;
  displayName: string;
  origin: ModelOrigin;
  providerId: string;
  providerLabel: string;
  family: string;
  contextWindowTokens: number;
  supportsStreaming: boolean;
  availability: ModelAvailability;
  usability: ModelUsability;
  links?: ModelLinks;
}

export type ModelRecommendationReason =
  | 'most_used'
  | 'available_now'
  | 'favorite'
  | 'last_used'
  | 'strategy_slot_match';

export interface ModelRecommendation {
  modelId: string;
  reason: ModelRecommendationReason;
  score: number;
  label: string;
}

export interface ModelUsageCount {
  modelId: string;
  count: number;
}

export interface ModelQuickSwitchState {
  favorites: string[];
  lastUsed: string[];
  mostUsed: ModelUsageCount[];
}

export interface AgentModelTelemetry {
  agentId: string;
  activeModelId: string;
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  tokensPerSecond: number;
  contextUsedTokens: number;
  contextWindowTokens: number;
  contextUsedPct: number;
  workTimeMs: number;
  compute: {
    cpuPct: number;
    ramBytes: number;
    gpuPct?: number;
    vramBytes?: number;
  };
  updatedAt: number;
}

export interface AgentModelStrategy {
  planningModelId: string;
  quickTaskModelId: string;
  fallbackModelId: string;
  switchRules: {
    useQuickTaskForShortTasks: boolean;
    fallbackOnQuota: boolean;
    fallbackOnUnavailable: boolean;
  };
}

export interface RuntimeMetricsSnapshot {
  cpuPct: number;
  ramBytes: number;
  totalRamBytes: number;
  gpuPct?: number;
  vramBytes?: number;
  totalVramBytes?: number;
  source: 'host' | 'provider';
  label: string;
  updatedAt: number;
}

export interface AgentIntelligenceSnapshot {
  agent: Agent;
  telemetry: AgentModelTelemetry;
  strategy: AgentModelStrategy;
  catalog: ModelDescriptor[];
  recommendations: ModelRecommendation[];
  quickSwitch: ModelQuickSwitchState;
  runtime: RuntimeMetricsSnapshot;
}

export interface LocalModelSearchResult {
  id: string;
  displayName: string;
  sizeLabel: string;
  providerId: string;
  installed: boolean;
  pullable: boolean;
}

export interface LocalModelPullJob {
  jobId: string;
  modelId: string;
  progressPct: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
}

export type RecoveryAction = 'use_fallback' | 'retry_check' | 'download_recommended_local_model';

export interface RecoveryOption {
  action: RecoveryAction;
  label: string;
  description: string;
  priority: number;
  modelId?: string;
}

export interface RecoveryResponse {
  result: 'recovery_required';
  reasonCode: string;
  message: string;
  requestedModelId: string;
  recoveryOptions: RecoveryOption[];
}

export type ModelOperationEventType =
  | 'manual_switch'
  | 'automatic_fallback_switch'
  | 'quota_exhausted'
  | 'runtime_unreachable'
  | 'download_start'
  | 'download_complete'
  | 'download_failed'
  | 'strategy_change'
  | 'recovery_retry';

export interface ModelOperationEvent {
  id: string;
  timestamp: number;
  agentId?: string;
  eventType: ModelOperationEventType;
  severity: 'info' | 'warning' | 'error';
  source: 'manual_action' | 'automatic_recovery' | 'runtime_probe' | 'download_job' | 'strategy_update';
  fromModelId?: string;
  toModelId?: string;
  reasonCode?: string;
  message: string;
  metadata?: Record<string, any>;
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
  | 'boost_applied'
  | 'agent_intelligence_init'
  | 'agent_telemetry_update'
  | 'agent_strategy_update'
  | 'model_catalog_update'
  | 'model_recommendations_update'
  | 'model_quick_switch_update'
  | 'local_model_pull_progress';

export interface WSMessageEnvelope<T = any> {
  type: WSMessageType;
  payload: T;
}

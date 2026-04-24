import { type AgentModelTelemetry } from '@habitat/shared';

interface RawOpenclawTelemetryEvent {
  agentId: string;
  modelId?: string;
  tokensIn?: number;
  tokensOut?: number;
  contextUsedTokens?: number;
  contextWindowTokens?: number;
  tokensPerSecond?: number;
  cpuPct?: number;
  ramBytes?: number;
  timestamp?: number;
}

export function mapOpenclawTelemetry(event: RawOpenclawTelemetryEvent): Partial<AgentModelTelemetry> {
  return {
    agentId: event.agentId,
    activeModelId: event.modelId ?? '',
    tokensIn: event.tokensIn ?? 0,
    tokensOut: event.tokensOut ?? 0,
    tokensTotal: (event.tokensIn ?? 0) + (event.tokensOut ?? 0),
    tokensPerSecond: event.tokensPerSecond ?? 0,
    contextUsedTokens: event.contextUsedTokens ?? 0,
    contextWindowTokens: event.contextWindowTokens ?? 0,
    contextUsedPct: event.contextWindowTokens
      ? Number((((event.contextUsedTokens ?? 0) / event.contextWindowTokens) * 100).toFixed(1))
      : 0,
    compute: {
      cpuPct: event.cpuPct ?? 0,
      ramBytes: event.ramBytes ?? 0,
    },
    updatedAt: event.timestamp ?? Date.now(),
  };
}

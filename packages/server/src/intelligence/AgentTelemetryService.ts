import { EventEmitter } from 'events';
import { AGENT_STATES, type Agent, type AgentModelTelemetry, type ModelDescriptor } from '@habitat/shared';

export class AgentTelemetryService extends EventEmitter {
  private telemetry = new Map<string, AgentModelTelemetry>();

  private createInitialTelemetry(agentId: string, model: ModelDescriptor): AgentModelTelemetry {
    return {
      agentId,
      activeModelId: model.id,
      tokensIn: 0,
      tokensOut: 0,
      tokensTotal: 0,
      tokensPerSecond: 0,
      contextUsedTokens: 0,
      contextWindowTokens: model.contextWindowTokens,
      contextUsedPct: 0,
      workTimeMs: 0,
      compute: {
        cpuPct: 0,
        ramBytes: 0,
      },
      updatedAt: Date.now(),
    };
  }

  ensureAgent(agentId: string, model: ModelDescriptor): AgentModelTelemetry {
    if (!this.telemetry.has(agentId)) {
      this.telemetry.set(agentId, this.createInitialTelemetry(agentId, model));
    }
    return this.telemetry.get(agentId)!;
  }

  getTelemetry(agentId: string): AgentModelTelemetry | undefined {
    const telemetry = this.telemetry.get(agentId);
    return telemetry ? { ...telemetry, compute: { ...telemetry.compute } } : undefined;
  }

  setActiveModel(agentId: string, model: ModelDescriptor): AgentModelTelemetry {
    const current = this.ensureAgent(agentId, model);
    const next: AgentModelTelemetry = {
      ...current,
      activeModelId: model.id,
      contextWindowTokens: model.contextWindowTokens,
      contextUsedTokens: Math.min(current.contextUsedTokens, model.contextWindowTokens),
      contextUsedPct: Math.min(100, (Math.min(current.contextUsedTokens, model.contextWindowTokens) / model.contextWindowTokens) * 100),
      updatedAt: Date.now(),
    };
    this.telemetry.set(agentId, next);
    this.emit('telemetry_updated', next);
    return next;
  }

  simulateTick(agent: Agent, model: ModelDescriptor): AgentModelTelemetry {
    const current = this.ensureAgent(agent.config.id, model);
    const now = Date.now();
    const elapsedSeconds = Math.max(1, Math.round((now - current.updatedAt) / 1000));
    const isWorking = agent.state === AGENT_STATES.WORKING;
    const tokenBurst = isWorking ? 60 + Math.round(Math.random() * 110) : 5 + Math.round(Math.random() * 20);
    const tokenInDelta = Math.round(tokenBurst * (0.55 + Math.random() * 0.15) * elapsedSeconds);
    const tokenOutDelta = Math.round(tokenBurst * (0.45 + Math.random() * 0.12) * elapsedSeconds);
    const nextContextUsed = Math.min(
      model.contextWindowTokens,
      Math.max(0, current.contextUsedTokens + tokenInDelta - (isWorking ? 0 : 150))
    );

    const next: AgentModelTelemetry = {
      ...current,
      activeModelId: model.id,
      tokensIn: current.tokensIn + tokenInDelta,
      tokensOut: current.tokensOut + tokenOutDelta,
      tokensTotal: current.tokensTotal + tokenInDelta + tokenOutDelta,
      tokensPerSecond: Number(((tokenInDelta + tokenOutDelta) / elapsedSeconds).toFixed(1)),
      contextUsedTokens: nextContextUsed,
      contextWindowTokens: model.contextWindowTokens,
      contextUsedPct: Number(((nextContextUsed / model.contextWindowTokens) * 100).toFixed(1)),
      workTimeMs: current.workTimeMs + (isWorking ? elapsedSeconds * 1000 : 0),
      compute: {
        cpuPct: Number(agent.stats.cpu.toFixed(1)),
        ramBytes: Math.round((4 + agent.stats.memory / 10) * 1024 * 1024 * 1024),
        gpuPct: model.origin === 'local' ? Math.round(agent.stats.cpu * 0.7) : undefined,
        vramBytes: model.origin === 'local'
          ? Math.round((2 + agent.stats.memory / 20) * 1024 * 1024 * 1024)
          : undefined,
      },
      updatedAt: now,
    };

    this.telemetry.set(agent.config.id, next);
    this.emit('telemetry_updated', next);
    return next;
  }
}

import { EventEmitter } from 'events';
import { type AgentModelStrategy, type ModelDescriptor } from '@habitat/shared';
import { ConfigStore } from '../config/ConfigStore.js';

type StoredStrategies = Record<string, AgentModelStrategy>;

export class AgentStrategyService extends EventEmitter {
  private readonly preferenceKey = 'agentModelStrategies';
  private strategies: StoredStrategies;

  constructor(private readonly configStore: ConfigStore) {
    super();
    this.strategies = this.configStore.getPreference<StoredStrategies>(this.preferenceKey, {});
  }

  private buildDefaultStrategy(catalog: ModelDescriptor[]): AgentModelStrategy {
    const cloudModels = catalog.filter(model => model.origin === 'cloud');
    const localModels = catalog.filter(model => model.origin === 'local');
    const planning = cloudModels[0] ?? catalog[0];
    const quickTask = cloudModels[1] ?? cloudModels[0] ?? localModels[0] ?? catalog[0];
    const fallback = localModels[0] ?? catalog[catalog.length - 1] ?? catalog[0];

    return {
      planningModelId: planning?.id ?? '',
      quickTaskModelId: quickTask?.id ?? planning?.id ?? '',
      fallbackModelId: fallback?.id ?? quickTask?.id ?? planning?.id ?? '',
      switchRules: {
        useQuickTaskForShortTasks: true,
        fallbackOnQuota: true,
        fallbackOnUnavailable: true,
      },
    };
  }

  getStrategy(agentId: string, catalog: ModelDescriptor[]): AgentModelStrategy {
    if (!this.strategies[agentId]) {
      this.strategies[agentId] = this.buildDefaultStrategy(catalog);
      this.configStore.setPreference(this.preferenceKey, this.strategies);
    }
    return this.strategies[agentId];
  }

  setStrategy(agentId: string, strategy: AgentModelStrategy): AgentModelStrategy {
    this.strategies[agentId] = strategy;
    this.configStore.setPreference(this.preferenceKey, this.strategies);
    this.emit('strategy_updated', { agentId, strategy });
    return strategy;
  }
}

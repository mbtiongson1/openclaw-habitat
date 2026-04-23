import { EventEmitter } from 'events';
import {
  AGENT_STATES,
  type Agent,
  type AgentIntelligenceSnapshot,
  type AgentModelStrategy,
  type LocalModelPullJob,
  type LocalModelSearchResult,
  type ModelDescriptor,
  type RecoveryOption,
  type RecoveryResponse,
  type RuntimeMetricsSnapshot,
} from '@habitat/shared';
import { AgentStateManager } from '../bridge/AgentStateManager.js';
import { AgentStrategyService } from './AgentStrategyService.js';
import { AgentTelemetryService } from './AgentTelemetryService.js';
import { ModelCatalogService } from './ModelCatalogService.js';
import { ModelQuickSwitchService } from './ModelQuickSwitchService.js';
import { ModelRecommendationService } from './ModelRecommendationService.js';
import { ModelOperationsLogService } from './ModelOperationsLogService.js';
import { RuntimeMetricsService } from './RuntimeMetricsService.js';

type StrategyIntent = 'planning' | 'quick_task' | 'fallback';

export class AgentIntelligenceService extends EventEmitter {
  constructor(
    private readonly stateManager: AgentStateManager,
    private readonly catalogService: ModelCatalogService,
    private readonly strategyService: AgentStrategyService,
    private readonly quickSwitchService: ModelQuickSwitchService,
    private readonly recommendationService: ModelRecommendationService,
    private readonly telemetryService: AgentTelemetryService,
    private readonly runtimeMetricsService: RuntimeMetricsService,
    private readonly logService: ModelOperationsLogService
  ) {
    super();
    this.wireEvents();
  }

  private wireEvents(): void {
    this.catalogService.on('catalog_updated', (catalog) => {
      this.emit('catalog_updated', catalog);
      for (const agent of this.stateManager.getAll()) {
        this.ensureAgentInitialized(agent.config.id);
        this.emitRecommendationUpdate(agent.config.id);
      }
    });

    this.catalogService.on('pull_progress', (job: LocalModelPullJob) => {
      this.emit('pull_progress', job);
    });

    this.strategyService.on('strategy_updated', ({ agentId, strategy }) => {
      this.emit('strategy_updated', { agentId, strategy });
      this.emitRecommendationUpdate(agentId);
    });

    this.quickSwitchService.on('quick_switch_updated', ({ agentId, quickSwitch }) => {
      this.emit('quick_switch_updated', { agentId, quickSwitch });
      this.emitRecommendationUpdate(agentId);
    });

    this.telemetryService.on('telemetry_updated', (telemetry) => {
      this.emit('telemetry_updated', telemetry);
      this.emitRecommendationUpdate(telemetry.agentId);
    });
  }

  async initialize(): Promise<void> {
    await this.catalogService.refreshCatalog();
    for (const agent of this.stateManager.getAll()) {
      this.ensureAgentInitialized(agent.config.id);
    }
  }

  private getCatalogOrThrow(): ModelDescriptor[] {
    const catalog = this.catalogService.getCatalog();
    if (catalog.length === 0) {
      throw new Error('Model catalog is empty');
    }
    return catalog;
  }

  private ensureAgentInitialized(agentId: string): void {
    const catalog = this.getCatalogOrThrow();
    const strategy = this.strategyService.getStrategy(agentId, catalog);
    const initialModel = this.findBestAvailableModel(strategy.planningModelId, catalog)
      ?? this.findBestAvailableModel(strategy.quickTaskModelId, catalog)
      ?? catalog[0];
    this.telemetryService.ensureAgent(agentId, initialModel);
    this.quickSwitchService.getState(agentId);
  }

  private findBestAvailableModel(modelId: string, catalog: ModelDescriptor[]): ModelDescriptor | undefined {
    const exact = catalog.find(model => model.id === modelId);
    if (exact && exact.availability.installed && exact.availability.reachable) {
      return exact;
    }

    return catalog.find(model => model.availability.installed && model.availability.reachable);
  }

  private resolveModelForIntent(agentId: string, intent: StrategyIntent): ModelDescriptor {
    const catalog = this.getCatalogOrThrow();
    const strategy = this.strategyService.getStrategy(agentId, catalog);
    const preferredId = intent === 'planning'
      ? strategy.planningModelId
      : intent === 'quick_task'
        ? strategy.quickTaskModelId
        : strategy.fallbackModelId;

    const preferred = catalog.find(model => model.id === preferredId);
    if (preferred && preferred.availability.installed && preferred.availability.reachable) {
      return preferred;
    }

    if (strategy.switchRules.fallbackOnUnavailable || strategy.switchRules.fallbackOnQuota) {
      const fallback = catalog.find(model => model.id === strategy.fallbackModelId);
      if (fallback && fallback.availability.installed && fallback.availability.reachable) {
        return fallback;
      }
    }

    return this.findBestAvailableModel(preferredId, catalog) ?? catalog[0];
  }

  private emitRecommendationUpdate(agentId: string): void {
    const catalog = this.catalogService.getCatalog();
    if (catalog.length === 0) return;
    const strategy = this.strategyService.getStrategy(agentId, catalog);
    const quickSwitch = this.quickSwitchService.getState(agentId);
    const recommendations = this.recommendationService.recommend(catalog, quickSwitch, strategy);
    this.emit('recommendations_updated', { agentId, recommendations });
  }

  getSnapshot(agentId: string): AgentIntelligenceSnapshot {
    const agent = this.stateManager.getAgent(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    this.ensureAgentInitialized(agentId);
    const catalog = this.getCatalogOrThrow();
    const telemetry = this.telemetryService.getTelemetry(agentId)!;
    const strategy = this.strategyService.getStrategy(agentId, catalog);
    const quickSwitch = this.quickSwitchService.getState(agentId);

    return {
      agent,
      telemetry,
      strategy,
      catalog,
      recommendations: this.recommendationService.recommend(catalog, quickSwitch, strategy),
      quickSwitch,
      runtime: this.runtimeMetricsService.getSnapshot(),
      recentEvents: this.logService.listAgentEvents(agentId),
    };
  }

  getAllSnapshots(): AgentIntelligenceSnapshot[] {
    return this.stateManager.getAll().map(agent => this.getSnapshot(agent.config.id));
  }

  getCatalog(): ModelDescriptor[] {
    return this.catalogService.getCatalog();
  }

  getRuntimeMetrics(): RuntimeMetricsSnapshot {
    return this.runtimeMetricsService.getSnapshot();
  }

  getStrategy(agentId: string): AgentModelStrategy {
    return this.strategyService.getStrategy(agentId, this.getCatalogOrThrow());
  }

  setStrategy(agentId: string, strategy: AgentModelStrategy): AgentModelStrategy {
    const catalog = this.getCatalogOrThrow();
    const modelIds = new Set(catalog.map(model => model.id));
    for (const modelId of [strategy.planningModelId, strategy.quickTaskModelId, strategy.fallbackModelId]) {
      if (!modelIds.has(modelId)) {
        throw new Error(`Unknown model: ${modelId}`);
      }
    }

    return this.strategyService.setStrategy(agentId, strategy);
  }

  setActiveModel(agentId: string, modelId: string): AgentIntelligenceSnapshot | RecoveryResponse {
    const agent = this.stateManager.getAgent(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const model = this.catalogService.getModel(modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    if (model.usability.status !== 'usable') {
      return {
        result: 'recovery_required',
        reasonCode: model.usability.reasonCode,
        message: model.usability.message,
        requestedModelId: model.id,
        recoveryOptions: this.buildRecoveryOptions(agentId, model),
      };
    }

    const currentTelemetry = this.telemetryService.getTelemetry(agentId);
    const fromModelId = currentTelemetry?.activeModelId;

    this.telemetryService.setActiveModel(agentId, model);
    this.quickSwitchService.markUsed(agentId, model.id);

    this.logService.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      agentId,
      eventType: 'manual_switch',
      severity: 'info',
      source: 'manual_action',
      fromModelId,
      toModelId: model.id,
      message: `Manual switch to ${model.displayName}`,
    });

    return this.getSnapshot(agentId);
  }

  handleModelFailure(agentId: string, currentModelId: string, reasonCode: string) {
    const catalog = this.catalogService.getCatalog();
    const strategy = this.strategyService.getStrategy(agentId, catalog);

    // Only fallback if enabled in strategy
    const shouldFallback = 
      (reasonCode === 'quota_exhausted' && strategy.switchRules.fallbackOnQuota) ||
      (reasonCode === 'runtime_unreachable' && strategy.switchRules.fallbackOnUnavailable);

    if (shouldFallback) {
      const fallback = catalog.find(m => m.id === strategy.fallbackModelId);
      if (fallback && fallback.usability.status === 'usable') {
        this.telemetryService.setActiveModel(agentId, fallback);
        this.logService.append({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          agentId,
          eventType: 'automatic_fallback_switch',
          severity: 'warning',
          source: 'automatic_recovery',
          fromModelId: currentModelId,
          toModelId: fallback.id,
          reasonCode,
          message: `Switched to fallback ${fallback.displayName} due to ${reasonCode}`,
        });
        return { switchedToModelId: fallback.id };
      }
    }

    // Log the failure even if no fallback possible
    this.logService.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      agentId,
      eventType: reasonCode === 'quota_exhausted' ? 'quota_exhausted' : 'runtime_unreachable',
      severity: 'error',
      source: 'runtime_probe',
      fromModelId: currentModelId,
      reasonCode,
      message: `Model failure: ${reasonCode} for ${currentModelId}`,
    });

    return { switchedToModelId: null };
  }

  private buildRecoveryOptions(agentId: string, failedModel: ModelDescriptor): RecoveryOption[] {
    const options: RecoveryOption[] = [];
    const catalog = this.catalogService.getCatalog();
    const strategy = this.strategyService.getStrategy(agentId, catalog);

    // 1. Fallback option (highest priority if usable)
    const fallback = catalog.find(m => m.id === strategy.fallbackModelId);
    if (fallback && fallback.usability.status === 'usable') {
      options.push({
        action: 'use_fallback',
        label: `Use fallback (${fallback.displayName})`,
        description: 'Switch to your pre-configured fallback model immediately.',
        priority: 1,
        modelId: fallback.id,
      });
    }

    // 2. Retry option
    options.push({
      action: 'retry_check',
      label: 'Retry availability check',
      description: 'Re-scan the runtime or provider for status changes.',
      priority: 2,
    });

    // 3. Recommended download (if local model missing)
    if (failedModel.origin === 'local' && !failedModel.availability.installed) {
      options.push({
        action: 'download_recommended_local_model',
        label: `Download ${failedModel.displayName}`,
        description: 'Start a background download and install for this model.',
        priority: 3,
        modelId: failedModel.id,
      });
    }

    return options.sort((a, b) => a.priority - b.priority);
  }

  addFavorite(agentId: string, modelId: string) {
    const model = this.catalogService.getModel(modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }
    return this.quickSwitchService.addFavorite(agentId, modelId);
  }

  removeFavorite(agentId: string, modelId: string) {
    return this.quickSwitchService.removeFavorite(agentId, modelId);
  }

  async searchLocalModels(query: string): Promise<LocalModelSearchResult[]> {
    return this.catalogService.searchLocalModels(query);
  }

  pullLocalModel(modelId: string): LocalModelPullJob {
    return this.catalogService.startLocalPull(modelId);
  }

  simulateAgentCycle(agent: Agent): void {
    this.ensureAgentInitialized(agent.config.id);
    const intent: StrategyIntent = agent.state === AGENT_STATES.WORKING
      ? (Math.random() > 0.45 ? 'planning' : 'quick_task')
      : 'fallback';
    const targetModel = this.resolveModelForIntent(agent.config.id, intent);
    const currentTelemetry = this.telemetryService.getTelemetry(agent.config.id);

    if (currentTelemetry?.activeModelId !== targetModel.id) {
      this.telemetryService.setActiveModel(agent.config.id, targetModel);
      this.quickSwitchService.markUsed(agent.config.id, targetModel.id);
    }

    this.telemetryService.simulateTick(agent, targetModel);
  }
}

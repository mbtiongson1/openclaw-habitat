import test from 'node:test';
import assert from 'node:assert/strict';
import { type ModelDescriptor } from '@habitat/shared';
import { AgentStrategyService } from './AgentStrategyService.js';
import { ModelQuickSwitchService } from './ModelQuickSwitchService.js';
import { ModelRecommendationService } from './ModelRecommendationService.js';

function createConfigStoreStub() {
  const preferences: Record<string, unknown> = {};
  return {
    getPreference<T>(key: string, fallback: T): T {
      return (preferences[key] as T | undefined) ?? fallback;
    },
    setPreference<T>(key: string, value: T): void {
      preferences[key] = value;
    },
  };
}

function createCatalog(): ModelDescriptor[] {
  return [
    {
      id: 'gpt-4o',
      displayName: 'GPT-4o',
      origin: 'cloud',
      providerId: 'openai',
      providerLabel: 'OpenAI',
      family: 'GPT',
      contextWindowTokens: 128_000,
      supportsStreaming: true,
      availability: { installed: true, reachable: true },
      usability: { status: 'usable', reasonCode: 'ok', message: 'ok', checkedAt: Date.now() },
    },
    {
      id: 'gpt-4.1-mini',
      displayName: 'GPT-4.1 Mini',
      origin: 'cloud',
      providerId: 'openai',
      providerLabel: 'OpenAI',
      family: 'GPT',
      contextWindowTokens: 128_000,
      supportsStreaming: true,
      availability: { installed: true, reachable: true },
      usability: { status: 'usable', reasonCode: 'ok', message: 'ok', checkedAt: Date.now() },
    },
    {
      id: 'llama3.1:8b',
      displayName: 'Llama 3.1 8B',
      origin: 'local',
      providerId: 'ollama',
      providerLabel: 'Ollama',
      family: 'Llama',
      contextWindowTokens: 128_000,
      supportsStreaming: true,
      availability: { installed: true, reachable: false, reason: 'Runtime offline' },
      usability: { status: 'runtime_unreachable', reasonCode: 'runtime_unreachable', message: 'offline', checkedAt: Date.now() },
    },
  ];
}

test('quick switch service keeps favorites, recents, and usage counts bounded', () => {
  const service = new ModelQuickSwitchService(createConfigStoreStub() as never);

  service.addFavorite('agent-1', 'gpt-4o');
  service.markUsed('agent-1', 'gpt-4o');
  service.markUsed('agent-1', 'gpt-4.1-mini');
  service.markUsed('agent-1', 'gpt-4o');
  service.markUsed('agent-1', 'llama3.1:8b');

  const state = service.getState('agent-1');
  assert.deepEqual(state.favorites, ['gpt-4o']);
  assert.deepEqual(state.lastUsed, ['llama3.1:8b', 'gpt-4o', 'gpt-4.1-mini']);
  assert.equal(state.mostUsed[0].modelId, 'gpt-4o');
  assert.equal(state.mostUsed[0].count, 2);
});

test('recommendations prefer reachable favorites over unreachable local fallback', () => {
  const configStore = createConfigStoreStub();
  const strategyService = new AgentStrategyService(configStore as never);
  const quickSwitchService = new ModelQuickSwitchService(configStore as never);
  const recommendationService = new ModelRecommendationService();
  const catalog = createCatalog();

  const strategy = strategyService.getStrategy('agent-2', catalog);
  strategyService.setStrategy('agent-2', {
    ...strategy,
    planningModelId: 'gpt-4.1-mini',
    quickTaskModelId: 'gpt-4o',
    fallbackModelId: 'llama3.1:8b',
  });

  quickSwitchService.addFavorite('agent-2', 'gpt-4o');
  quickSwitchService.markUsed('agent-2', 'gpt-4o');
  quickSwitchService.markUsed('agent-2', 'gpt-4o');
  quickSwitchService.markUsed('agent-2', 'gpt-4.1-mini');

  const recommendations = recommendationService.recommend(
    catalog,
    quickSwitchService.getState('agent-2'),
    strategyService.getStrategy('agent-2', catalog),
    'planning'
  );

  assert.equal(recommendations[0].modelId, 'gpt-4o');
  assert.notEqual(recommendations[0].modelId, 'llama3.1:8b');
  assert.equal(recommendations.at(-1)?.modelId, 'llama3.1:8b');
});

test('ollama-installed model is runtime_unreachable when runtime probe fails', async () => {
  // Use a port that is likely not in use to ensure connection failure
  const adapter = new (await import('./adapters.js')).OllamaAdapter('http://127.0.0.1:1');
  const [model] = await adapter.listInstalledModels();
  assert.equal(model.usability.status, 'runtime_unreachable');
  assert.equal(model.availability.reachable, false);
});

test('cloud model is usable when installed, reachable, and quota not exhausted', async () => {
  const { ModelUsabilityService } = await import('./ModelUsabilityService.js');
  const service = new ModelUsabilityService();
  const result = service.evaluate({
    origin: 'cloud',
    installed: true,
    reachable: true,
    quotaExhausted: false,
  });
  assert.equal(result.status, 'usable');
});

test('setActiveModel returns recovery_required for runtime_unreachable model', async () => {
  const { AgentIntelligenceService } = await import('./AgentIntelligenceService.js');
  const { ModelCatalogService } = await import('./ModelCatalogService.js');
  
  // Minimal stubs
  const stateManager = {
    getAgent: () => ({ config: { id: 'agent-1' } }),
    getAll: () => [],
  } as any;
  
  const unreachableModel = {
    id: 'llama3.1:8b',
    usability: { status: 'runtime_unreachable', reasonCode: 'runtime_unreachable', message: 'Offline' }
  } as any;

  const catalogService = {
    getModel: () => unreachableModel,
    getCatalog: () => [unreachableModel],
    on: () => {},
  } as any;

  const strategyService = {
    getStrategy: () => ({ fallbackModelId: 'gpt-4o' }),
    on: () => {},
  } as any;

  const service = new AgentIntelligenceService(
    stateManager,
    catalogService,
    strategyService,
    { on: () => {}, getState: () => ({}) } as any,
    { recommend: () => [] } as any,
    { on: () => {}, ensureAgent: () => {} } as any,
    { getSnapshot: () => ({}) } as any
  );

  const result = service.setActiveModel('agent-1', 'llama3.1:8b');
  // @ts-ignore
  assert.equal(result.result, 'recovery_required');
  // @ts-ignore
  assert.equal(result.reasonCode, 'runtime_unreachable');
});


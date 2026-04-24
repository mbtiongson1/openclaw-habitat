import express from 'express';
import http from 'http';
import { BRIDGE_PORT } from '@habitat/shared';
import { BridgeServer } from './bridge/BridgeServer.js';
import { MockGateway } from './gateway/MockGateway.js';
import { AgentStateManager } from './bridge/AgentStateManager.js';
import { FeedingEngine } from './bridge/FeedingEngine.js';
import { ConfigStore } from './config/ConfigStore.js';
import { createRoutes } from './api/routes.js';
import { AgentIntelligenceService } from './intelligence/AgentIntelligenceService.js';
import { AgentStrategyService } from './intelligence/AgentStrategyService.js';
import { AgentTelemetryService } from './intelligence/AgentTelemetryService.js';
import { ModelCatalogService } from './intelligence/ModelCatalogService.js';
import { ModelQuickSwitchService } from './intelligence/ModelQuickSwitchService.js';
import { ModelRecommendationService } from './intelligence/ModelRecommendationService.js';
import { ModelOperationsLogService } from './intelligence/ModelOperationsLogService.js';
import { RuntimeMetricsService } from './intelligence/RuntimeMetricsService.js';
import { OllamaAdapter, StaticCloudProviderAdapter } from './intelligence/adapters.js';
import { type ModelOperationEvent } from '@habitat/shared';

const app = express();
app.use(express.json());

// Core systems
const configStore = new ConfigStore();
const stateManager = new AgentStateManager(configStore);
const feedingEngine = new FeedingEngine(stateManager);
const modelOperationsLogService = new ModelOperationsLogService(configStore.getStorageDir());
const modelCatalogService = new ModelCatalogService(
  [
    new StaticCloudProviderAdapter('openai', 'OpenAI', [
      { id: 'gpt-4o', displayName: 'GPT-4o', family: 'GPT', contextWindowTokens: 128_000, usageUrl: 'https://platform.openai.com/usage' },
      { id: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini', family: 'GPT', contextWindowTokens: 128_000, usageUrl: 'https://platform.openai.com/usage' },
    ]),
    new StaticCloudProviderAdapter('anthropic', 'Anthropic', [
      { id: 'claude-3-7-sonnet', displayName: 'Claude 3.7 Sonnet', family: 'Claude', contextWindowTokens: 200_000, usageUrl: 'https://console.anthropic.com/settings/usage' },
    ]),
    new StaticCloudProviderAdapter('google', 'Google', [
      { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', family: 'Gemini', contextWindowTokens: 1_000_000, usageUrl: 'https://console.cloud.google.com/' },
    ]),
  ],
  new OllamaAdapter()
);
const intelligenceService = new AgentIntelligenceService(
  stateManager,
  modelCatalogService,
  new AgentStrategyService(configStore),
  new ModelQuickSwitchService(configStore),
  new ModelRecommendationService(),
  new AgentTelemetryService(),
  new RuntimeMetricsService(),
  modelOperationsLogService
);
const mockGateway = new MockGateway(stateManager, intelligenceService);

// REST API
app.use('/api', createRoutes(stateManager, feedingEngine, configStore, intelligenceService, modelOperationsLogService));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), agents: stateManager.getAgentCount() });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket bridge
const bridge = new BridgeServer(server, stateManager, feedingEngine, intelligenceService);

async function bootstrap(): Promise<void> {
  await intelligenceService.initialize();

  // Start mock gateway event loop
  mockGateway.start();

  // Wire events: state manager changes → bridge broadcasts
  stateManager.on('agent_update', (agent) => {
    intelligenceService.getSnapshot(agent.config.id);
    bridge.broadcast({ type: 'agent_update', payload: agent });
  });
  stateManager.on('zone_transition', (event) => {
    bridge.broadcast({ type: 'zone_transition', payload: event });
  });
  feedingEngine.on('snack_granted', (event) => {
    bridge.broadcast({ type: 'snack_granted', payload: event });
  });
  feedingEngine.on('boost_applied', (event) => {
    bridge.broadcast({ type: 'boost_applied', payload: event });
  });

  intelligenceService.on('telemetry_updated', (telemetry) => {
    bridge.broadcast({ type: 'agent_telemetry_update', payload: telemetry });
  });
  intelligenceService.on('strategy_updated', ({ agentId, strategy }) => {
    bridge.broadcast({ type: 'agent_strategy_update', payload: { agentId, strategy } });
  });
  intelligenceService.on('catalog_updated', (catalog) => {
    bridge.broadcast({ type: 'model_catalog_update', payload: { catalog } });
  });
  intelligenceService.on('recommendations_updated', ({ agentId, recommendations }) => {
    bridge.broadcast({ type: 'model_recommendations_update', payload: { agentId, recommendations } });
  });
  intelligenceService.on('quick_switch_updated', ({ agentId, quickSwitch }) => {
    bridge.broadcast({ type: 'model_quick_switch_update', payload: { agentId, quickSwitch } });
  });
  intelligenceService.on('pull_progress', (job) => {
    bridge.broadcast({ type: 'local_model_pull_progress', payload: job });
  });

  modelOperationsLogService.on('event_logged', (event: ModelOperationEvent) => {
    bridge.broadcast({ type: 'model_operation_logged', payload: event });
  });

  // Wire task completions → feeding engine snack generation
  stateManager.on('task_complete', (event: any) => {
    const snack = feedingEngine.grantSnack(event.agentId, event.taskDescription, event.score, event.nodeType);
    console.log(`🍬 Snack granted to ${event.agentId}: ${snack.tier} (score: ${event.score}/10, node: ${event.nodeType || 'none'})`);
  });

  // Decay boosts every 30 seconds
  setInterval(() => feedingEngine.decayBoosts(), 30000);

  server.listen(BRIDGE_PORT, () => {
    console.log(`🏠 Digital Sanctuary bridge running on http://localhost:${BRIDGE_PORT}`);
    console.log(`📡 WebSocket ready on ws://localhost:${BRIDGE_PORT}`);
    console.log(`🎮 Mock gateway active — ${stateManager.getAgentCount()} agents spawned`);
  });
}

void bootstrap();

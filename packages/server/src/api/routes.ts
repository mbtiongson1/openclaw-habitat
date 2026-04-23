import { Router } from 'express';
import {
  ActiveModelSchema,
  AgentConfigSchema,
  AgentModelStrategySchema,
  FeedRequestSchema,
  LocalModelPullSchema,
  ModelOperationsLogFilterSchema,
} from '@habitat/shared';
import { AgentStateManager } from '../bridge/AgentStateManager.js';
import { FeedingEngine } from '../bridge/FeedingEngine.js';
import { ConfigStore } from '../config/ConfigStore.js';
import { AgentIntelligenceService } from '../intelligence/AgentIntelligenceService.js';

export function createRoutes(
  stateManager: AgentStateManager,
  feedingEngine: FeedingEngine,
  configStore: ConfigStore,
  intelligenceService: AgentIntelligenceService,
  operationsLogService: import('../intelligence/ModelOperationsLogService.js').ModelOperationsLogService
): Router {
  const router = Router();

  // --- Agent Routes ---

  /** List all agents */
  router.get('/agents', (_req, res) => {
    res.json({ agents: stateManager.getAll() });
  });

  /** Get single agent */
  router.get('/agents/:id', (req, res) => {
    const agent = stateManager.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent });
  });

  /** Get per-agent intelligence snapshot */
  router.get('/agents/:id/intelligence', (req, res) => {
    try {
      const snapshot = intelligenceService.getSnapshot(req.params.id);
      res.json(snapshot);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Agent not found' });
    }
  });

  /** Create new agent */
  router.post('/agents', (req, res) => {
    const result = AgentConfigSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    const agent = stateManager.createAgent(result.data);
    res.status(201).json({ agent });
  });

  /** Feed an agent a snack */
  router.post('/agents/:id/feed', (req, res) => {
    const parsed = FeedRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const success = feedingEngine.feedAgent(req.params.id, parsed.data.snackId);
    if (!success) {
      return res.status(400).json({ error: 'Feed failed — agent or snack not found' });
    }

    const agent = stateManager.getAgent(req.params.id);
    res.json({ success: true, agent });
  });

  /** Get agent feeding history (markdown) */
  router.get('/agents/:id/feeding-log', (req, res) => {
    const log = feedingEngine.getFeedingLog(req.params.id);
    if (!log) return res.status(404).json({ error: 'No feeding log found' });
    res.type('text/markdown').send(log);
  });

  /** Get recent model events for an agent */
  router.get('/agents/:id/model-events', (req, res) => {
    res.json({ events: operationsLogService.listAgentEvents(req.params.id) });
  });

  /** Chat with agent (stub) */
  router.post('/agents/:id/chat', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    // Stub — echo response
    res.json({
      agentId: req.params.id,
      response: `[Mock] I received: "${text}"`,
      timestamp: Date.now(),
    });
  });

  /** Update per-agent model strategy */
  router.patch('/agents/:id/model-strategy', (req, res) => {
    const parsed = AgentModelStrategySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
      const strategy = intelligenceService.setStrategy(req.params.id, parsed.data);
      res.json({ strategy });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Strategy update failed' });
    }
  });

  /** Override active model */
  router.patch('/agents/:id/active-model', (req, res) => {
    const parsed = ActiveModelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
      const result = intelligenceService.setActiveModel(req.params.id, parsed.data.modelId);
      
      if ('result' in result && result.result === 'recovery_required') {
        return res.status(409).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Active model update failed' });
    }
  });

  /** Mark model as favorite */
  router.post('/agents/:id/model-favorites/:modelId', (req, res) => {
    try {
      const quickSwitch = intelligenceService.addFavorite(req.params.id, req.params.modelId);
      res.status(201).json({ quickSwitch });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add favorite' });
    }
  });

  /** Remove favorite */
  router.delete('/agents/:id/model-favorites/:modelId', (req, res) => {
    try {
      const quickSwitch = intelligenceService.removeFavorite(req.params.id, req.params.modelId);
      res.json({ quickSwitch });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to remove favorite' });
    }
  });

  // --- Model Routes ---

  router.get('/models/catalog', (_req, res) => {
    res.json({ catalog: intelligenceService.getCatalog() });
  });

  router.get('/models/local/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await intelligenceService.searchLocalModels(query);
    res.json({ results });
  });

  router.post('/models/local/pull', (req, res) => {
    const parsed = LocalModelPullSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const job = intelligenceService.pullLocalModel(parsed.data.modelId);
    res.status(202).json({ job });
  });

  router.get('/models/runtime', (_req, res) => {
    res.json({ runtime: intelligenceService.getRuntimeMetrics() });
  });

  /** Global model operations log */
  router.get('/model-operations', (req, res) => {
    const parsed = ModelOperationsLogFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    res.json({ events: operationsLogService.listGlobalEvents(parsed.data) });
  });

  // --- Config Routes ---

  /** List config snapshots */
  router.get('/config/snapshots', (_req, res) => {
    res.json({ snapshots: configStore.listSnapshots() });
  });

  /** Create a config snapshot */
  router.post('/config/snapshots', (_req, res) => {
    const snapshot = configStore.saveSnapshot();
    res.status(201).json({ snapshot });
  });

  /** Restore a config snapshot */
  router.post('/config/snapshots/:ts/restore', (req, res) => {
    const timestamp = parseInt(req.params.ts, 10);
    if (isNaN(timestamp)) return res.status(400).json({ error: 'Invalid timestamp' });

    const success = configStore.restoreSnapshot(timestamp);
    if (!success) return res.status(404).json({ error: 'Snapshot not found' });
    res.json({ success: true, config: configStore.getAll() });
  });

  return router;
}

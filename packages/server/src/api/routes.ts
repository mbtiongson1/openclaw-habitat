import { Router } from 'express';
import { AgentConfigSchema, FeedRequestSchema } from '@habitat/shared';
import { AgentStateManager } from '../bridge/AgentStateManager.js';
import { FeedingEngine } from '../bridge/FeedingEngine.js';
import { ConfigStore } from '../config/ConfigStore.js';

export function createRoutes(
  stateManager: AgentStateManager,
  feedingEngine: FeedingEngine,
  configStore: ConfigStore
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

import express from 'express';
import http from 'http';
import { BRIDGE_PORT } from '@habitat/shared';
import { BridgeServer } from './bridge/BridgeServer.js';
import { MockGateway } from './gateway/MockGateway.js';
import { AgentStateManager } from './bridge/AgentStateManager.js';
import { FeedingEngine } from './bridge/FeedingEngine.js';
import { ConfigStore } from './config/ConfigStore.js';
import { createRoutes } from './api/routes.js';

const app = express();
app.use(express.json());

// Core systems
const configStore = new ConfigStore();
const stateManager = new AgentStateManager(configStore);
const feedingEngine = new FeedingEngine(stateManager);
const mockGateway = new MockGateway(stateManager);

// REST API
app.use('/api', createRoutes(stateManager, feedingEngine, configStore));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), agents: stateManager.getAgentCount() });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket bridge
const bridge = new BridgeServer(server, stateManager, feedingEngine);

// Start mock gateway event loop
mockGateway.start();

// Wire events: state manager changes → bridge broadcasts
stateManager.on('agent_update', (agent) => {
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

// Wire task completions → feeding engine snack generation
stateManager.on('task_complete', (event: any) => {
  const snack = feedingEngine.grantSnack(event.agentId, event.taskDescription, event.score);
  console.log(`🍬 Snack granted to ${event.agentId}: ${snack.tier} (score: ${event.score}/10)`);
});

// Decay boosts every 30 seconds
setInterval(() => feedingEngine.decayBoosts(), 30000);

server.listen(BRIDGE_PORT, () => {
  console.log(`🏠 Digital Sanctuary bridge running on http://localhost:${BRIDGE_PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${BRIDGE_PORT}`);
  console.log(`🎮 Mock gateway active — ${stateManager.getAgentCount()} agents spawned`);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import { AGENT_STATES, ZONES, type Agent, type AgentConfigPatch } from '@habitat/shared';
import { createRoutes } from '../api/routes.js';

function createAgent(): Agent {
  return {
    config: {
      id: 'agent-api',
      name: 'Ada',
      personality: 'cautious',
      svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
      installedAt: 1,
    },
    state: AGENT_STATES.WORKING,
    zone: ZONES.LOUNGE,
    stats: { cpu: 10, memory: 20, tasksCompleted: 0, uptimeSeconds: 0 },
    activeBoosts: [],
    pendingSnacks: [],
  };
}

test('agent config API updates editable characteristics without replacing runtime state', async () => {
  let agent = createAgent();
  const stateManager = {
    getAll: () => [agent],
    getAgent: (id: string) => id === agent.config.id ? agent : undefined,
    getAgentCount: () => 1,
    updateAgentConfig: (id: string, patch: AgentConfigPatch) => {
      if (id !== agent.config.id) return undefined;
      agent = {
        ...agent,
        config: {
          ...agent.config,
          ...patch,
          svgParts: { ...agent.config.svgParts, ...patch.svgParts },
        },
      };
      return agent;
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api', createRoutes(
    stateManager as never,
    { feedAgent: () => true, getFeedingLog: () => '', on: () => {} } as never,
    { listSnapshots: () => [], saveSnapshot: () => ({}), restoreSnapshot: () => false, getAll: () => ({}) } as never,
    {
      getSnapshot: () => ({}),
      setStrategy: () => ({}),
      setActiveModel: () => ({}),
      addFavorite: () => ({}),
      removeFavorite: () => ({}),
      getCatalog: () => [],
      searchLocalModels: () => [],
      pullLocalModel: () => ({}),
      getRuntimeMetrics: () => ({}),
    } as never,
    { listAgentEvents: () => [], listGlobalEvents: () => [] } as never
  ));

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/api/agents/agent-api/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Prime',
        personality: 'creative',
        svgParts: { head: 'square' },
      }),
    });

    assert.equal(response.status, 200);
    const payload = await response.json() as { agent: Agent };
    assert.equal(payload.agent.config.name, 'Ada Prime');
    assert.equal(payload.agent.config.personality, 'creative');
    assert.equal(payload.agent.config.svgParts.head, 'square');
    assert.equal(payload.agent.config.svgParts.body, 'standard');
    assert.equal(payload.agent.stats.cpu, 10);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

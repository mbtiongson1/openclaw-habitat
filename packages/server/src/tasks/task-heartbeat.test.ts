import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import { AGENT_STATES, ZONES, type Agent, type AgentStateType, type ZoneType } from '@habitat/shared';
import { TaskHeartbeatService } from './TaskHeartbeatService.js';
import { OpenClawCommandService } from '../commands/OpenClawCommandService.js';
import { createRoutes } from '../api/routes.js';

function createAgent(id: string, state: AgentStateType = AGENT_STATES.WORKING, zone: ZoneType = ZONES.LOUNGE): Agent {
  return {
    config: {
      id,
      name: id,
      personality: 'focused',
      svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
      installedAt: 1,
    },
    state,
    zone,
    stats: { cpu: 10, memory: 20, tasksCompleted: 0, uptimeSeconds: 0 },
    activeBoosts: [],
    pendingSnacks: [],
  };
}

function createStateManagerStub(agents: Agent[]) {
  return {
    getAll: () => agents,
    getAgent: (id: string) => agents.find(agent => agent.config.id === id),
    getAgentCount: () => agents.length,
  };
}

test('task heartbeat service filters tasks and heartbeats by zone and agent', () => {
  const agents = [
    createAgent('agent-office', AGENT_STATES.WORKING, ZONES.LOUNGE),
    createAgent('agent-kitchen', AGENT_STATES.FEEDING, ZONES.KITCHEN),
  ];
  const service = new TaskHeartbeatService(createStateManagerStub(agents) as never);

  service.recordHeartbeat(agents[0], 1_000);
  service.recordHeartbeat(agents[1], 1_000);
  service.recordTaskCompletion({
    agentId: 'agent-office',
    taskDescription: 'Compile task summary',
    nodeType: 'tool',
    score: 8,
    timestamp: 1_250,
  });

  const loungeTasks = service.listTasks({ zone: ZONES.LOUNGE });
  assert.equal(loungeTasks.length, 1);
  assert.equal(loungeTasks[0].agentId, 'agent-office');
  assert.equal(loungeTasks[0].roomIntent, 'task');

  const kitchenHeartbeat = service.listHeartbeats({ agentId: 'agent-kitchen' });
  assert.equal(kitchenHeartbeat.length, 1);
  assert.equal(kitchenHeartbeat[0].zone, ZONES.KITCHEN);
  assert.equal(kitchenHeartbeat[0].roomIntent, 'feeding');
});

test('task heartbeat service marks old heartbeats stale in zone summaries', () => {
  const agents = [createAgent('agent-resting', AGENT_STATES.IDLE, ZONES.NURSERY)];
  const service = new TaskHeartbeatService(createStateManagerStub(agents) as never, { staleAfterMs: 5_000 });

  service.recordHeartbeat(agents[0], 10_000);
  const summaries = service.listZoneSummaries(16_000);

  const bedroom = summaries.find(summary => summary.zone === ZONES.NURSERY);
  assert.equal(bedroom?.agents, 1);
  assert.equal(bedroom?.staleHeartbeats, 1);
});

test('task and heartbeat API filters by zone, status, and agent', async () => {
  const agents = [createAgent('agent-api', AGENT_STATES.WORKING, ZONES.LOUNGE)];
  const stateManager = createStateManagerStub(agents);
  const taskHeartbeatService = new TaskHeartbeatService(stateManager as never);
  taskHeartbeatService.recordHeartbeat(agents[0], 2_000);
  taskHeartbeatService.recordTaskCompletion({
    agentId: 'agent-api',
    taskDescription: 'API-visible task',
    nodeType: 'router',
    score: 9,
    timestamp: 2_100,
  });

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
    { listAgentEvents: () => [], listGlobalEvents: () => [] } as never,
    taskHeartbeatService
  ));

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const tasksResponse = await fetch(`${baseUrl}/api/tasks?zone=${ZONES.LOUNGE}&status=completed`);
    assert.equal(tasksResponse.status, 200);
    const tasksPayload = await tasksResponse.json() as { tasks: unknown[] };
    assert.equal(tasksPayload.tasks.length, 1);

    const heartbeatResponse = await fetch(`${baseUrl}/api/agents/agent-api/heartbeats`);
    assert.equal(heartbeatResponse.status, 200);
    const heartbeatPayload = await heartbeatResponse.json() as { heartbeats: unknown[] };
    assert.equal(heartbeatPayload.heartbeats.length, 1);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('command service exposes grouped safe shell descriptors with dangerous commands disabled', () => {
  const service = new OpenClawCommandService();
  const commands = service.listDescriptors();

  assert(commands.some(command => command.id === 'model-status' && command.group === 'model'));
  assert(commands.some(command => command.id === 'status' && command.group === 'visibility'));

  const bash = commands.find(command => command.id === 'bash');
  assert.equal(bash?.enabled, false);
  assert.equal(bash?.requiresOptIn, true);
  assert.equal(bash?.dangerLevel, 'dangerous');
});

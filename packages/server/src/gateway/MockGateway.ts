import { AGENT_STATES, type AgentStateType } from '@habitat/shared';
import { AgentStateManager } from '../bridge/AgentStateManager.js';

const STATES = Object.values(AGENT_STATES);
const MOCK_TASKS = [
  'CSV parsing batch',
  'Log file rotation',
  'API endpoint stress test',
  'Database migration check',
  'Image thumbnail generation',
  'Email template compilation',
  'Security audit scan',
  'Dependency update check',
  'Cache invalidation sweep',
  'Config validation pass',
];

/**
 * MockGateway simulates Openclaw agent events for development.
 * Follows the code_interpreter pattern: sandboxed, deterministic simulation.
 */
export class MockGateway {
  private stateManager: AgentStateManager;
  private intervals: NodeJS.Timeout[] = [];

  constructor(stateManager: AgentStateManager) {
    this.stateManager = stateManager;
  }

  start(): void {
    // Seed 3 initial agents
    this.stateManager.seedMockAgents(3);

    // State change loop (every 5-10 seconds, randomly change an agent's state)
    const stateLoop = setInterval(() => {
      const agents = this.stateManager.getAll();
      if (agents.length === 0) return;

      const agent = agents[Math.floor(Math.random() * agents.length)];
      const newState = STATES[Math.floor(Math.random() * STATES.length)];
      this.stateManager.updateState(agent.config.id, newState);
    }, 5000 + Math.random() * 5000);

    // Stats update loop (every 3 seconds, jiggle CPU/Memory)
    const statsLoop = setInterval(() => {
      for (const agent of this.stateManager.getAll()) {
        const cpuDelta = (Math.random() - 0.5) * 20;
        const memDelta = (Math.random() - 0.5) * 10;
        this.stateManager.updateStats(agent.config.id, {
          cpu: agent.stats.cpu + cpuDelta,
          memory: agent.stats.memory + memDelta,
          uptimeSeconds: agent.stats.uptimeSeconds + 3,
        });
      }
    }, 3000);

    // Task completion loop (every 15-30 seconds, complete a mock task)
    const taskLoop = setInterval(() => {
      const agents = this.stateManager.getAll();
      if (agents.length === 0) return;

      const agent = agents[Math.floor(Math.random() * agents.length)];
      const task = MOCK_TASKS[Math.floor(Math.random() * MOCK_TASKS.length)];
      const score = Math.floor(Math.random() * 5) + 5; // 5-10 range

      agent.stats.tasksCompleted++;

      // The FeedingEngine will be called from index.ts via events
      // Here we just emit the raw event for the bridge to handle
      this.stateManager.emit('task_complete', {
        agentId: agent.config.id,
        taskDescription: task,
        score,
        timestamp: Date.now(),
      });
    }, 15000 + Math.random() * 15000);

    this.intervals.push(stateLoop, statsLoop, taskLoop);
    console.log('🎮 MockGateway started — simulating agent events');
  }

  stop(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }
}

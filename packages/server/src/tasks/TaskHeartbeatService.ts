import { v4 as uuid } from 'uuid';
import {
  AGENT_STATES,
  ZONES,
  type Agent,
  type AgentHeartbeat,
  type HeartbeatFilter,
  type SanctuaryRoomIntent,
  type SanctuaryTask,
  type SanctuaryTaskFilter,
  type SubAgentTaskCompleteEvent,
  type ZoneTaskSummary,
  type ZoneType,
} from '@habitat/shared';
import { AgentStateManager } from '../bridge/AgentStateManager.js';

interface Options {
  staleAfterMs?: number;
}

type TaskCompleteInput = Omit<SubAgentTaskCompleteEvent, 'taskId' | 'description'> & {
  description?: string;
  taskDescription?: string;
};

function roomIntentForAgent(agent: Agent): SanctuaryRoomIntent {
  if (agent.state === AGENT_STATES.IDLE || (agent.state as string) === 'sleeping') return 'rest';
  if (agent.state === AGENT_STATES.FEEDING) return 'feeding';
  if (agent.zone === ZONES.GARDEN || agent.state === AGENT_STATES.SOCIAL) return 'garden';
  return 'task';
}

function normalizeZone(agent: Agent): ZoneType {
  if (agent.state === AGENT_STATES.IDLE || (agent.state as string) === 'sleeping') return ZONES.NURSERY;
  if (agent.state === AGENT_STATES.FEEDING) return ZONES.KITCHEN;
  if (agent.state === AGENT_STATES.SOCIAL) return ZONES.GARDEN;
  return agent.zone;
}

export class TaskHeartbeatService {
  private readonly tasks = new Map<string, SanctuaryTask>();
  private readonly heartbeats = new Map<string, AgentHeartbeat>();
  private readonly staleAfterMs: number;

  constructor(
    private readonly stateManager: AgentStateManager,
    options: Options = {}
  ) {
    this.staleAfterMs = options.staleAfterMs ?? 30_000;
  }

  recordHeartbeat(agent: Agent, timestamp = Date.now()): AgentHeartbeat {
    const existingTask = this.latestTaskForAgent(agent.config.id);
    const heartbeat: AgentHeartbeat = {
      agentId: agent.config.id,
      zone: normalizeZone(agent),
      state: agent.state,
      roomIntent: roomIntentForAgent(agent),
      activeTaskId: existingTask?.status === 'active' ? existingTask.id : undefined,
      status: 'online',
      source: 'mock_gateway',
      lastSeenAt: timestamp,
    };

    this.heartbeats.set(agent.config.id, heartbeat);
    return heartbeat;
  }

  recordTaskCompletion(event: TaskCompleteInput): SanctuaryTask {
    const agent = this.stateManager.getAgent(event.agentId);
    const zone = agent ? normalizeZone(agent) : ZONES.LOUNGE;
    const roomIntent = agent ? roomIntentForAgent(agent) : 'task';
    const timestamp = event.timestamp ?? Date.now();
    const description = event.taskDescription ?? event.description ?? 'Untitled task';
    const task: SanctuaryTask = {
      id: uuid(),
      title: description,
      description,
      agentId: event.agentId,
      zone,
      roomIntent,
      nodeType: event.nodeType,
      status: 'completed',
      progressPct: 100,
      priority: Math.max(1, Math.min(5, Math.round((event.score ?? 5) / 2))),
      score: event.score,
      createdAt: timestamp,
      updatedAt: timestamp,
      heartbeatAt: timestamp,
      steps: [
        {
          id: uuid(),
          label: event.nodeType ? `${event.nodeType} complete` : 'Task complete',
          status: 'completed',
          updatedAt: timestamp,
        },
      ],
    };

    this.tasks.set(task.id, task);
    return task;
  }

  listTasks(filter: SanctuaryTaskFilter = {}): SanctuaryTask[] {
    const limit = filter.limit ?? 100;
    return Array.from(this.tasks.values())
      .filter(task => !filter.zone || task.zone === filter.zone)
      .filter(task => !filter.status || task.status === filter.status)
      .filter(task => !filter.agentId || task.agentId === filter.agentId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  listHeartbeats(filter: HeartbeatFilter = {}, now = Date.now()): AgentHeartbeat[] {
    const staleAfterMs = filter.staleAfterMs ?? this.staleAfterMs;
    const knownAgents = new Set(this.stateManager.getAll().map(agent => agent.config.id));

    for (const agent of this.stateManager.getAll()) {
      if (!this.heartbeats.has(agent.config.id)) {
        this.recordHeartbeat(agent, now);
      }
    }

    return Array.from(this.heartbeats.values())
      .filter(heartbeat => knownAgents.has(heartbeat.agentId))
      .map(heartbeat => ({
        ...heartbeat,
        status: now - heartbeat.lastSeenAt > staleAfterMs ? 'stale' : heartbeat.status,
      }))
      .filter(heartbeat => !filter.agentId || heartbeat.agentId === filter.agentId)
      .filter(heartbeat => !filter.zone || heartbeat.zone === filter.zone)
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  }

  listZoneSummaries(now = Date.now()): ZoneTaskSummary[] {
    const tasks = this.listTasks({ limit: 500 });
    const heartbeats = this.listHeartbeats({}, now);

    return Object.values(ZONES).map(zone => {
      const zoneTasks = tasks.filter(task => task.zone === zone);
      const zoneHeartbeats = heartbeats.filter(heartbeat => heartbeat.zone === zone);
      return {
        zone,
        roomIntent: this.roomIntentForZone(zone),
        agents: zoneHeartbeats.length,
        activeTasks: zoneTasks.filter(task => task.status === 'active').length,
        queuedTasks: zoneTasks.filter(task => task.status === 'queued').length,
        completedTasks: zoneTasks.filter(task => task.status === 'completed').length,
        staleHeartbeats: zoneHeartbeats.filter(heartbeat => heartbeat.status === 'stale').length,
      };
    });
  }

  private latestTaskForAgent(agentId: string): SanctuaryTask | undefined {
    return Array.from(this.tasks.values())
      .filter(task => task.agentId === agentId)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }

  private roomIntentForZone(zone: ZoneType): SanctuaryRoomIntent {
    if (zone === ZONES.NURSERY) return 'rest';
    if (zone === ZONES.KITCHEN) return 'feeding';
    if (zone === ZONES.GARDEN) return 'garden';
    return 'task';
  }
}

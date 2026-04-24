import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import {
  ZONES,
  AGENT_STATES,
  SVG_HEAD_TYPES,
  SVG_BODY_TYPES,
  SVG_HAND_TYPES,
  SVG_FOOT_TYPES,
  type Agent,
  type AgentConfig,
  type AgentConfigPatch,
  type AgentStats,
  type SVGParts,
  type ZoneType,
  type AgentStateType,
  type ZoneTransitionEvent,
} from '@habitat/shared';
import { ConfigStore } from '../config/ConfigStore.js';

const AGENT_NAMES = ['Luna', 'Cosmo', 'Pixel', 'Byte', 'Nebula'];

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSvgParts(): SVGParts {
  return {
    head: randomPick(SVG_HEAD_TYPES),
    body: randomPick(SVG_BODY_TYPES),
    hands: randomPick(SVG_HAND_TYPES),
    feet: randomPick(SVG_FOOT_TYPES),
  };
}

function stateToZone(state: AgentStateType): ZoneType {
  switch (state) {
    case AGENT_STATES.WORKING: return ZONES.LOUNGE;
    case AGENT_STATES.IDLE: return ZONES.NURSERY;
    case AGENT_STATES.FEEDING: return ZONES.KITCHEN;
    case AGENT_STATES.SOCIAL: return ZONES.GARDEN;
    default: return ZONES.LOUNGE;
  }
}

export class AgentStateManager extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private configStore: ConfigStore;

  constructor(configStore: ConfigStore) {
    super();
    this.configStore = configStore;
  }

  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  createAgent(partial?: Partial<AgentConfig>): Agent {
    const id = partial?.id || uuid();
    const config: AgentConfig = {
      id,
      name: partial?.name || randomPick(AGENT_NAMES) + '-' + id.slice(0, 4),
      personality: partial?.personality || 'creative',
      svgParts: partial?.svgParts || randomSvgParts(),
      installedAt: Date.now(),
    };

    const agent: Agent = {
      config,
      zone: ZONES.LOUNGE,
      state: AGENT_STATES.WORKING,
      stats: { cpu: 20 + Math.random() * 30, memory: 30 + Math.random() * 20, tasksCompleted: 0, uptimeSeconds: 0 },
      activeBoosts: [],
      pendingSnacks: [],
    };

    this.agents.set(id, agent);
    this.emit('agent_update', agent);
    return agent;
  }

  updateAgentConfig(agentId: string, patch: AgentConfigPatch): Agent | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;

    agent.config = {
      ...agent.config,
      name: patch.name ?? agent.config.name,
      personality: patch.personality ?? agent.config.personality,
      svgParts: {
        ...agent.config.svgParts,
        ...patch.svgParts,
      },
    };

    this.emit('agent_update', agent);
    return agent;
  }

  updateState(agentId: string, newState: AgentStateType): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const oldZone = agent.zone;
    agent.state = newState;
    agent.zone = stateToZone(newState);

    if (oldZone !== agent.zone) {
      const transition: ZoneTransitionEvent = {
        agentId,
        fromZone: oldZone,
        toZone: agent.zone,
        timestamp: Date.now(),
      };
      this.emit('zone_transition', transition);
    }

    this.emit('agent_update', agent);
  }

  updateStats(agentId: string, statsDelta: Partial<AgentStats>): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    if (statsDelta.cpu !== undefined) agent.stats.cpu = Math.min(100, Math.max(0, statsDelta.cpu));
    if (statsDelta.memory !== undefined) agent.stats.memory = Math.min(100, Math.max(0, statsDelta.memory));
    if (statsDelta.tasksCompleted !== undefined) agent.stats.tasksCompleted = statsDelta.tasksCompleted;
    if (statsDelta.uptimeSeconds !== undefined) agent.stats.uptimeSeconds = statsDelta.uptimeSeconds;

    this.emit('agent_update', agent);
  }

  /** Seed initial agents for mock mode */
  seedMockAgents(count: number): void {
    for (let i = 0; i < count; i++) {
      const name = AGENT_NAMES[i % AGENT_NAMES.length];
      this.createAgent({ name });
    }
  }
}

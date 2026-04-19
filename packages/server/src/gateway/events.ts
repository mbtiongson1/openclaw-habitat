/**
 * Event transformation layer.
 * Follows the transform node pattern: raw events → domain events.
 *
 * In mock mode, events are already in domain format from MockGateway.
 * When live gateway is implemented, this module will transform
 * raw Openclaw WS events into the normalized Habitat event types.
 */

import { AGENT_STATES, ZONES, type AgentStateType, type ZoneType } from '@habitat/shared';

/** Map Openclaw agent status strings to Habitat states */
export function mapOpenclawStatus(status: string): AgentStateType {
  switch (status.toLowerCase()) {
    case 'running':
    case 'processing':
    case 'executing':
      return AGENT_STATES.WORKING;
    case 'idle':
    case 'standby':
    case 'waiting':
      return AGENT_STATES.IDLE;
    case 'completed':
      return AGENT_STATES.FEEDING; // Completed task → move to kitchen
    default:
      return AGENT_STATES.IDLE;
  }
}

/** Route an agent state to its corresponding zone */
export function stateToZone(state: AgentStateType): ZoneType {
  switch (state) {
    case AGENT_STATES.WORKING: return ZONES.LOUNGE;
    case AGENT_STATES.IDLE: return ZONES.NURSERY;
    case AGENT_STATES.FEEDING: return ZONES.KITCHEN;
    case AGENT_STATES.SOCIAL: return ZONES.GARDEN;
    default: return ZONES.LOUNGE;
  }
}

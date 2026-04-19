import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

export interface Agent {
  config: {
    id: string;
    name: string;
    personality: string;
    svgParts: { head: string; body: string; hands: string; feet: string };
    installedAt: number;
  };
  zone: string;
  state: string;
  stats: { cpu: number; memory: number; tasksCompleted: number; uptimeSeconds: number };
  activeBoosts: { type: string; value: number; expiresAt: number }[];
  pendingSnacks: {
    id: string; taskId: string; taskDescription: string; score: number;
    tier: string; boostType: string; boostValue: number; boostDurationMinutes: number; timestamp: number;
  }[];
}

export function useAgents(ws: ReturnType<typeof useWebSocket>) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = ws.subscribe((msg) => {
      switch (msg.type) {
        case 'init_state':
          setAgents(msg.payload.agents);
          break;
        case 'agent_update':
          setAgents(prev => {
            const idx = prev.findIndex(a => a.config.id === msg.payload.config.id);
            if (idx === -1) return [...prev, msg.payload];
            const next = [...prev];
            next[idx] = msg.payload;
            return next;
          });
          break;
        case 'zone_transition':
          // Already handled by agent_update
          break;
        case 'snack_granted':
          setAgents(prev => {
            const idx = prev.findIndex(a => a.config.id === msg.payload.agentId);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              pendingSnacks: [...next[idx].pendingSnacks, msg.payload.snack],
            };
            return next;
          });
          break;
        case 'boost_applied':
          setAgents(prev => {
            const idx = prev.findIndex(a => a.config.id === msg.payload.agentId);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              activeBoosts: msg.payload.boosts || next[idx].activeBoosts,
            };
            return next;
          });
          break;
      }
    });
    return unsub;
  }, [ws]);

  const selectedAgent = selectedAgentId
    ? agents.find(a => a.config.id === selectedAgentId) || null
    : null;

  const createAgent = useCallback((config: any) => {
    ws.send({ type: 'create_agent', payload: config });
  }, [ws]);

  const feedAgent = useCallback((agentId: string, snackId: string) => {
    ws.send({ type: 'feed_agent', payload: { agentId, snackId } });
  }, [ws]);

  return {
    agents,
    selectedAgent,
    selectedAgentId,
    setSelectedAgentId,
    createAgent,
    feedAgent,
  };
}

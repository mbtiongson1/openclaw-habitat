import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AGENT_STATES, ZONES, type AgentIntelligenceSnapshot } from '@habitat/shared';
import { AgentPage } from './AgentPage';
import { type Agent } from '../../hooks/useAgents';

function createAgent(): Agent {
  return {
    config: {
      id: 'agent-1',
      name: 'Ada',
      personality: 'cautious',
      svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
      installedAt: 1,
    },
    zone: ZONES.LOUNGE,
    state: AGENT_STATES.WORKING,
    stats: { cpu: 20, memory: 30, tasksCompleted: 4, uptimeSeconds: 100 },
    activeBoosts: [],
    pendingSnacks: [],
  };
}

function createSnapshot(agent: Agent): AgentIntelligenceSnapshot {
  const model = {
    id: 'gemini-flash',
    displayName: 'Gemini Flash',
    origin: 'cloud' as const,
    providerId: 'gemini',
    providerLabel: 'Gemini',
    family: 'flash',
    contextWindowTokens: 1_000_000,
    supportsStreaming: true,
    availability: { installed: true, reachable: true },
    usability: { status: 'usable' as const, reasonCode: 'ok', message: 'Ready', checkedAt: 1 },
  };

  return {
    agent: agent as never,
    telemetry: {
      agentId: agent.config.id,
      activeModelId: model.id,
      tokensIn: 100,
      tokensOut: 50,
      tokensTotal: 150,
      tokensPerSecond: 12.5,
      contextUsedTokens: 10_000,
      contextWindowTokens: 1_000_000,
      contextUsedPct: 1,
      workTimeMs: 60000,
      compute: { cpuPct: 20, ramBytes: 1024 },
      updatedAt: 1,
    },
    strategy: {
      planningModelId: model.id,
      quickTaskModelId: model.id,
      fallbackModelId: model.id,
      switchRules: {
        useQuickTaskForShortTasks: true,
        fallbackOnQuota: true,
        fallbackOnUnavailable: true,
      },
    },
    catalog: [model],
    recommendations: [{ modelId: model.id, reason: 'available_now', score: 1, label: 'Available now' }],
    quickSwitch: { favorites: [model.id], lastUsed: [model.id], mostUsed: [{ modelId: model.id, count: 2 }] },
    runtime: {
      cpuPct: 20,
      ramBytes: 1024,
      totalRamBytes: 4096,
      source: 'host',
      label: 'Host runtime',
      updatedAt: 1,
    },
    recentEvents: [],
  };
}

describe('AgentPage characteristics editor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves editable name, personality, and sprite characteristics', async () => {
    const agent = createAgent();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === `/api/agents/${agent.config.id}/intelligence`) {
        return Response.json(createSnapshot(agent));
      }
      if (url === `/api/agents/${agent.config.id}/feeding-log`) {
        return new Response('', { status: 200 });
      }
      if (url === '/api/models/local/search?q=') {
        return Response.json({ results: [] });
      }
      if (url === `/api/agents/${agent.config.id}/config` && init?.method === 'PATCH') {
        return Response.json({ agent: { ...agent, config: { ...agent.config, name: 'Ada Prime' } } });
      }
      return Response.json({});
    });
    vi.stubGlobal('fetch', fetchMock);

    const ws = { subscribe: vi.fn(() => vi.fn()), send: vi.fn(), connected: true, reconnecting: false };
    render(<AgentPage agent={agent} ws={ws as never} onClose={vi.fn()} onChat={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Agent name'), { target: { value: 'Ada Prime' } });
    fireEvent.change(screen.getByLabelText('Personality'), { target: { value: 'creative' } });
    fireEvent.change(screen.getByLabelText('Head shape'), { target: { value: 'square' } });
    fireEvent.click(screen.getByRole('button', { name: /save characteristics/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/agents/${agent.config.id}/config`,
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Ada Prime'),
        })
      );
    });
  });
});

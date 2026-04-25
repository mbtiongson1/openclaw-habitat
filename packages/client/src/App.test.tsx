import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const mocks = vi.hoisted(() => ({
  ws: {
    connected: true,
    reconnecting: false,
    send: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
  setSelectedAgentId: vi.fn(),
  createAgent: vi.fn(),
  feedAgent: vi.fn(),
}));

vi.mock('./hooks/useWebSocket', () => ({
  useWebSocket: () => mocks.ws,
}));

vi.mock('./hooks/useAgents', () => ({
  useAgents: () => ({
    agents: [
      {
        config: {
          id: 'agent-1',
          name: 'Luna',
          personality: 'creative',
          svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
          installedAt: 1,
        },
        zone: 'Garden',
        state: 'social',
        stats: { cpu: 12, memory: 24, tasksCompleted: 8, uptimeSeconds: 120 },
        activeBoosts: [],
        pendingSnacks: [],
      },
    ],
    selectedAgent: null,
    selectedAgentId: null,
    setSelectedAgentId: mocks.setSelectedAgentId,
    feedAgent: mocks.feedAgent,
    createAgent: mocks.createAgent,
  }),
}));

vi.mock('./hooks/useGlobalCommands', () => ({
  useGlobalCommands: () => ({ commands: [] }),
}));

vi.mock('./components/sanctuary/SanctuaryHub', () => ({
  SanctuaryHub: ({ onNavigateAgents }: { onNavigateAgents?: () => void }) => (
    <section>
      <h2>Sanctuary Floor Plan</h2>
      <button type="button" onClick={onNavigateAgents}>Open Agents Metric</button>
    </section>
  ),
}));

vi.mock('./components/sanctuary/ZonesView', () => ({
  ZonesView: () => <h2>Zone Task Flow</h2>,
}));

vi.mock('./components/agent/AgentsListView', () => ({
  AgentsListView: () => <h2>Agent Operations</h2>,
}));

vi.mock('./components/analytics/AnalyticsView', () => ({
  AnalyticsView: () => <h2>System Analytics</h2>,
}));

vi.mock('./components/ui/SettingsModal', () => ({
  SettingsModal: () => null,
}));

vi.mock('./components/agent/AgentCreator', () => ({
  AgentCreator: () => null,
}));

vi.mock('./components/ui/LoadingScreen', () => ({
  LoadingScreen: () => <div>Loading</div>,
}));

vi.mock('./components/agent/AgentPage', () => ({
  AgentPage: () => null,
}));

vi.mock('./components/controls/GlobalCommandRail', () => ({
  GlobalCommandRail: () => null,
}));

describe('App shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  });

  it('uses an explicit sanctuary home control that returns to the sanctuary tab', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open agents metric/i }));
    expect(screen.getByText('Agent Operations')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /go to sanctuary/i }));
    expect(screen.getByText('Sanctuary Floor Plan')).toBeInTheDocument();
  });
});

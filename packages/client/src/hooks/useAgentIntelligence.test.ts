import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentIntelligence } from './useAgentIntelligence';

describe('useAgentIntelligence', () => {
  const wsStub = {
    subscribe: vi.fn(() => () => {}),
  } as any;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('stores recovery prompt state when active-model API returns 409 recovery_required', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ agent: { config: { id: 'agent-1' } }, telemetry: {}, strategy: {}, catalog: [], recommendations: [], quickSwitch: {}, runtime: {} }),
    });

    const { result } = renderHook(() => useAgentIntelligence('agent-1', wsStub));
    
    // Wait for initial load
    await act(async () => {});

    const recoveryPayload = {
      result: 'recovery_required',
      reasonCode: 'quota_exhausted',
      message: 'Quota hit',
      requestedModelId: 'gpt-4o',
      recoveryOptions: [{ action: 'use_fallback', label: 'Use fallback', priority: 1 }],
    };

    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => recoveryPayload,
    });

    await act(async () => {
      await result.current.setActiveModel('gpt-4o');
    });

    // @ts-ignore
    expect(result.current.recoveryState).toEqual(recoveryPayload);
    expect(result.current.switchingModelId).toBe(null);
  });

  it('re-runs local search after pull completion even when the query is empty', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ agent: { config: { id: 'agent-1' } }, telemetry: {}, strategy: {}, catalog: [], recommendations: [], quickSwitch: {}, runtime: {} }),
    });

    let wsCallback: any;
    wsStub.subscribe.mockImplementation((cb: any) => {
      wsCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useAgentIntelligence('agent-1', wsStub));
    await act(async () => {});

    // Mock refresh call
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    // Mock search results
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    // Simulate pull completion
    await act(async () => {
      wsCallback({
        type: 'local_model_pull_progress',
        payload: { modelId: 'llama3.1:8b', status: 'completed' },
      });
    });

    // Should have called refresh and searchLocalModels
    expect(fetch).toHaveBeenCalledWith('/api/agents/agent-1/intelligence');
    expect(fetch).toHaveBeenCalledWith('/api/models/local/search?q=');
  });

  it('adds matching model operation events to the open agent snapshot', async () => {
    let wsCallback: any;
    wsStub.subscribe.mockImplementation((cb: any) => {
      wsCallback = cb;
      return () => {};
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agent: { config: { id: 'agent-1' } },
        telemetry: {},
        strategy: {},
        catalog: [],
        recommendations: [],
        quickSwitch: {},
        runtime: {},
        recentEvents: [],
      }),
    });

    const { result } = renderHook(() => useAgentIntelligence('agent-1', wsStub));
    await act(async () => {});

    await act(async () => {
      wsCallback({
        type: 'model_operation_logged',
        payload: {
          id: 'event-1',
          agentId: 'agent-1',
          timestamp: 10,
          eventType: 'quota_exhausted',
          severity: 'warning',
          source: 'runtime_probe',
          message: 'Fallback applied',
        },
      });
    });

    expect(result.current.snapshot?.recentEvents[0].id).toBe('event-1');
  });

  it('ignores model operation events for other agents', async () => {
    let wsCallback: any;
    wsStub.subscribe.mockImplementation((cb: any) => {
      wsCallback = cb;
      return () => {};
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agent: { config: { id: 'agent-1' } },
        telemetry: {},
        strategy: {},
        catalog: [],
        recommendations: [],
        quickSwitch: {},
        runtime: {},
        recentEvents: [],
      }),
    });

    const { result } = renderHook(() => useAgentIntelligence('agent-1', wsStub));
    await act(async () => {});

    await act(async () => {
      wsCallback({
        type: 'model_operation_logged',
        payload: {
          id: 'event-2',
          agentId: 'agent-2',
          timestamp: 10,
          eventType: 'quota_exhausted',
          severity: 'warning',
          source: 'runtime_probe',
          message: 'Different agent fallback applied',
        },
      });
    });

    expect(result.current.snapshot?.recentEvents).toEqual([]);
  });
});

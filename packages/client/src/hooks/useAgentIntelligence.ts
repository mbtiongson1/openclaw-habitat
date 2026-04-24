import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type {
  AgentIntelligenceSnapshot,
  AgentModelStrategy,
  LocalModelPullJob,
  LocalModelSearchResult,
  ModelOperationEvent,
  ModelQuickSwitchState,
  RecoveryResponse,
} from '@habitat/shared';
import { useWebSocket } from './useWebSocket';

export function useAgentIntelligence(agentId: string | null, ws: ReturnType<typeof useWebSocket>) {
  const [snapshot, setSnapshot] = useState<AgentIntelligenceSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocalModelSearchResult[]>([]);
  const [switchingModelId, setSwitchingModelId] = useState<string | null>(null);
  const [updatingStrategy, setUpdatingStrategy] = useState(false);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  const [pullJobs, setPullJobs] = useState<Record<string, LocalModelPullJob>>({});
  const [recoveryState, setRecoveryState] = useState<RecoveryResponse | null>(null);
  const lastSearchQueryRef = useRef('');

  const searchLocalModels = useCallback(async (query: string) => {
    lastSearchQueryRef.current = query;
    setSearching(true);
    const response = await fetch(`/api/models/local/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      setSearching(false);
      throw new Error('Failed to search local models');
    }
    const payload = await response.json() as { results: LocalModelSearchResult[] };
    startTransition(() => {
      setSearchResults(payload.results);
      setSearching(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!agentId) return;
    const response = await fetch(`/api/agents/${agentId}/intelligence`);
    if (!response.ok) {
      throw new Error('Failed to load agent intelligence');
    }
    const nextSnapshot = await response.json() as AgentIntelligenceSnapshot;
    setSnapshot(nextSnapshot);
  }, [agentId]);

  useEffect(() => {
    if (!agentId) {
      setSnapshot(null);
      return;
    }

    setLoading(true);
    refresh()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId, refresh]);

  useEffect(() => {
    return ws.subscribe((msg) => {
      if (!agentId) return;

      switch (msg.type) {
        case 'agent_intelligence_init': {
          const nextSnapshot = (msg.payload.snapshots as AgentIntelligenceSnapshot[])
            .find(candidate => candidate.agent.config.id === agentId);
          if (nextSnapshot) {
            setSnapshot(nextSnapshot);
          }
          break;
        }
        case 'agent_telemetry_update':
          if (msg.payload.agentId === agentId) {
            setSnapshot(prev => prev ? { ...prev, telemetry: msg.payload } : prev);
            setSwitchingModelId(null);
          }
          break;
        case 'agent_strategy_update':
          if (msg.payload.agentId === agentId) {
            setSnapshot(prev => prev ? { ...prev, strategy: msg.payload.strategy } : prev);
            setUpdatingStrategy(false);
          }
          break;
        case 'model_catalog_update':
          setSnapshot(prev => prev ? { ...prev, catalog: msg.payload.catalog } : prev);
          break;
        case 'model_recommendations_update':
          if (msg.payload.agentId === agentId) {
            setSnapshot(prev => prev ? { ...prev, recommendations: msg.payload.recommendations } : prev);
          }
          break;
        case 'model_quick_switch_update':
          if (msg.payload.agentId === agentId) {
            setSnapshot(prev => prev ? { ...prev, quickSwitch: msg.payload.quickSwitch as ModelQuickSwitchState } : prev);
            setFavoritePendingId(null);
          }
          break;
        case 'local_model_pull_progress':
          setPullJobs(prev => ({ ...prev, [msg.payload.modelId]: msg.payload }));
          if (msg.payload.status === 'completed') {
            void refresh();
            void searchLocalModels(lastSearchQueryRef.current ?? '');
          }
          break;
        case 'model_operation_logged': {
          const event = msg.payload as ModelOperationEvent;
          if (event.agentId === agentId) {
            setSnapshot(prev => prev ? {
              ...prev,
              recentEvents: upsertRecentEvent(prev.recentEvents ?? [], event),
            } : prev);
          }
          break;
        }
      }
    });
  }, [agentId, refresh, searchLocalModels, ws]);

  const setActiveModel = useCallback(async (modelId: string) => {
    if (!agentId) return;
    setSwitchingModelId(modelId);
    setRecoveryState(null);
    const response = await fetch(`/api/agents/${agentId}/active-model`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId }),
    });

    if (response.status === 409) {
      const payload = await response.json() as RecoveryResponse;
      setRecoveryState(payload);
      setSwitchingModelId(null);
      return;
    }

    if (!response.ok) {
      setSwitchingModelId(null);
      throw new Error('Failed to switch model');
    }
    const nextSnapshot = await response.json() as AgentIntelligenceSnapshot;
    setSnapshot(nextSnapshot);
    setSwitchingModelId(null);
  }, [agentId]);

  const updateStrategy = useCallback(async (strategy: AgentModelStrategy) => {
    if (!agentId) return;
    setUpdatingStrategy(true);
    const response = await fetch(`/api/agents/${agentId}/model-strategy`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy),
    });
    if (!response.ok) {
      setUpdatingStrategy(false);
      throw new Error('Failed to update strategy');
    }
    const payload = await response.json() as { strategy: AgentModelStrategy };
    setSnapshot(prev => prev ? { ...prev, strategy: payload.strategy } : prev);
    setUpdatingStrategy(false);
  }, [agentId]);

  const toggleFavorite = useCallback(async (modelId: string, isFavorite: boolean) => {
    if (!agentId) return;
    setFavoritePendingId(modelId);
    const response = await fetch(`/api/agents/${agentId}/model-favorites/${encodeURIComponent(modelId)}`, {
      method: isFavorite ? 'DELETE' : 'POST',
    });
    if (!response.ok) {
      setFavoritePendingId(null);
      throw new Error('Failed to update favorite');
    }
    const payload = await response.json() as { quickSwitch: ModelQuickSwitchState };
    setSnapshot(prev => prev ? { ...prev, quickSwitch: payload.quickSwitch } : prev);
    setFavoritePendingId(null);
  }, [agentId]);

  const pullLocalModel = useCallback(async (modelId: string) => {
    const response = await fetch('/api/models/local/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId }),
    });
    if (!response.ok) {
      throw new Error('Failed to pull local model');
    }
    const payload = await response.json() as { job: LocalModelPullJob };
    setPullJobs(prev => ({ ...prev, [payload.job.modelId]: payload.job }));
  }, []);

  const clearRecovery = useCallback(() => setRecoveryState(null), []);

  return {
    snapshot,
    loading,
    searching,
    searchResults,
    switchingModelId,
    updatingStrategy,
    favoritePendingId,
    pullJobs,
    recoveryState,
    refresh,
    setActiveModel,
    updateStrategy,
    toggleFavorite,
    searchLocalModels,
    pullLocalModel,
    clearRecovery,
  };
}

function upsertRecentEvent(events: ModelOperationEvent[], event: ModelOperationEvent): ModelOperationEvent[] {
  return [event, ...events.filter(existing => existing.id !== event.id)]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25);
}

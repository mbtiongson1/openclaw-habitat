import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ZONES,
  type AgentHeartbeat,
  type SanctuaryTask,
  type SanctuaryTaskStatus,
  type ZoneTaskSummary,
  type ZoneType,
} from '@habitat/shared';
import { routeTaskToRoom } from '../components/sanctuary/sanctuaryRouting';
import { useWebSocket } from './useWebSocket';

type SanctuaryOperationsMessage =
  | { type: 'task_update'; payload: SanctuaryTask }
  | { type: 'agent_heartbeat'; payload: AgentHeartbeat }
  | { type: string; payload: unknown };

export interface SanctuaryOperationsOptions {
  agentIds?: string[];
  zones?: ZoneType[];
  taskLimit?: number;
  heartbeatStaleAfterMs?: number;
}

export interface SanctuaryOperationsState {
  tasks: SanctuaryTask[];
  zoneTasks: Partial<Record<ZoneType, SanctuaryTask[]>>;
  zoneSummaries: ZoneTaskSummary[];
  heartbeatsByAgent: Record<string, AgentHeartbeat[]>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  loadZoneTasks: (zone: ZoneType) => Promise<SanctuaryTask[]>;
  loadAgentHeartbeats: (agentId: string) => Promise<AgentHeartbeat[]>;
}

const DEFAULT_TASK_LIMIT = 100;

export function useSanctuaryOperations(
  ws: ReturnType<typeof useWebSocket>,
  options: SanctuaryOperationsOptions = {}
): SanctuaryOperationsState {
  const taskLimit = options.taskLimit ?? DEFAULT_TASK_LIMIT;
  const heartbeatStaleAfterMs = options.heartbeatStaleAfterMs;
  const zones = useMemo(() => options.zones ?? Object.values(ZONES), [options.zones]);
  const agentIds = useMemo(() => options.agentIds ?? [], [options.agentIds]);
  const zonesKey = zones.join('|');
  const agentIdsKey = agentIds.join('|');

  const [tasks, setTasks] = useState<SanctuaryTask[]>([]);
  const [zoneTasks, setZoneTasks] = useState<Partial<Record<ZoneType, SanctuaryTask[]>>>({});
  const [zoneSummaries, setZoneSummaries] = useState<ZoneTaskSummary[]>([]);
  const [heartbeatsByAgent, setHeartbeatsByAgent] = useState<Record<string, AgentHeartbeat[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const tasksRef = useRef<SanctuaryTask[]>([]);

  const loadTasks = useCallback(async () => {
    const payload = await fetchJson<{ tasks: SanctuaryTask[] }>(`/api/tasks?${query({ limit: taskLimit })}`);
    setTasks(sortTasks(payload.tasks));
    tasksRef.current = sortTasks(payload.tasks);
  }, [taskLimit]);

  const loadZoneTasks = useCallback(async (zone: ZoneType) => {
    const payload = await fetchJson<{ tasks: SanctuaryTask[] }>(
      `/api/zones/${encodeURIComponent(zone)}/tasks?${query({ limit: taskLimit })}`
    );
    const nextTasks = sortTasks(payload.tasks);
    setZoneTasks(prev => ({ ...prev, [zone]: nextTasks }));
    return nextTasks;
  }, [taskLimit]);

  const loadZoneSummaries = useCallback(async () => {
    const payload = await fetchJson<{ summaries: ZoneTaskSummary[] }>('/api/zones/task-summaries');
    setZoneSummaries(payload.summaries);
  }, []);

  const loadAgentHeartbeats = useCallback(async (agentId: string) => {
    const qs = heartbeatStaleAfterMs ? `?${query({ staleAfterMs: heartbeatStaleAfterMs })}` : '';
    const payload = await fetchJson<{ heartbeats: AgentHeartbeat[] }>(
      `/api/agents/${encodeURIComponent(agentId)}/heartbeats${qs}`
    );
    setHeartbeatsByAgent(prev => ({ ...prev, [agentId]: payload.heartbeats }));
    return payload.heartbeats;
  }, [heartbeatStaleAfterMs]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadTasks(),
        loadZoneSummaries(),
        ...zones.map(zone => loadZoneTasks(zone)),
        ...agentIds.map(agentId => loadAgentHeartbeats(agentId)),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load sanctuary operations'));
    } finally {
      setLoading(false);
    }
  }, [agentIdsKey, loadAgentHeartbeats, loadTasks, loadZoneSummaries, loadZoneTasks, zonesKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return ws.subscribe((msg: SanctuaryOperationsMessage) => {
      if (msg.type === 'task_update') {
        applyTaskUpdate(msg.payload as SanctuaryTask);
      }
      if (msg.type === 'agent_heartbeat') {
        applyHeartbeatUpdate(msg.payload as AgentHeartbeat);
      }
    });
  }, [ws]);

  const applyTaskUpdate = useCallback((task: SanctuaryTask) => {
    const previousTask = tasksRef.current.find(existing => existing.id === task.id);
    setTasks(prev => {
      const next = upsertTask(prev, task);
      tasksRef.current = next;
      return next;
    });
    setZoneTasks(prev => {
      const currentZoneTasks = prev[task.zone] ?? [];
      const next = { ...prev, [task.zone]: upsertTask(currentZoneTasks, task) };
      if (previousTask && previousTask.zone !== task.zone) {
        next[previousTask.zone] = (next[previousTask.zone] ?? []).filter(existing => existing.id !== task.id);
      }
      return next;
    });
    setZoneSummaries(prev => updateSummaryForTask(prev, task, previousTask));
  }, []);

  const applyHeartbeatUpdate = useCallback((heartbeat: AgentHeartbeat) => {
    setHeartbeatsByAgent(prev => ({
      ...prev,
      [heartbeat.agentId]: upsertHeartbeat(prev[heartbeat.agentId] ?? [], heartbeat),
    }));
    setZoneSummaries(prev => updateSummaryForHeartbeat(prev, heartbeat));
  }, []);

  return {
    tasks,
    zoneTasks,
    zoneSummaries,
    heartbeatsByAgent,
    loading,
    error,
    refresh,
    loadZoneTasks,
    loadAgentHeartbeats,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json() as Promise<T>;
}

function query(params: Record<string, string | number>): string {
  return new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();
}

function upsertTask(tasks: SanctuaryTask[], task: SanctuaryTask): SanctuaryTask[] {
  return sortTasks([...tasks.filter(existing => existing.id !== task.id), task]);
}

function sortTasks(tasks: SanctuaryTask[]): SanctuaryTask[] {
  return [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);
}

function upsertHeartbeat(heartbeats: AgentHeartbeat[], heartbeat: AgentHeartbeat): AgentHeartbeat[] {
  return [heartbeat, ...heartbeats.filter(existing => existing.agentId !== heartbeat.agentId)]
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

function updateSummaryForTask(
  summaries: ZoneTaskSummary[],
  task: SanctuaryTask,
  previousTask?: SanctuaryTask
): ZoneTaskSummary[] {
  const route = routeTaskToRoom(task);
  const nextSummaries = ensureSummary(summaries, task.zone, route.roomIntent);
  return nextSummaries.map(summary => {
    if (summary.zone !== task.zone) return summary;
    const previousDelta = previousTask && previousTask.zone === task.zone ? statusDelta(previousTask.status, -1) : {};
    const nextDelta = statusDelta(task.status, 1);
    return {
      ...summary,
      activeTasks: Math.max(0, summary.activeTasks + (previousDelta.activeTasks ?? 0) + (nextDelta.activeTasks ?? 0)),
      queuedTasks: Math.max(0, summary.queuedTasks + (previousDelta.queuedTasks ?? 0) + (nextDelta.queuedTasks ?? 0)),
      completedTasks: Math.max(0, summary.completedTasks + (previousDelta.completedTasks ?? 0) + (nextDelta.completedTasks ?? 0)),
    };
  });
}

function updateSummaryForHeartbeat(summaries: ZoneTaskSummary[], heartbeat: AgentHeartbeat): ZoneTaskSummary[] {
  const nextSummaries = ensureSummary(summaries, heartbeat.zone, heartbeat.roomIntent);
  return nextSummaries.map(summary => {
    if (summary.zone !== heartbeat.zone) return summary;
    return {
      ...summary,
      agents: Math.max(summary.agents, 1),
      staleHeartbeats: heartbeat.status === 'stale' ? Math.max(summary.staleHeartbeats, 1) : summary.staleHeartbeats,
    };
  });
}

function ensureSummary(
  summaries: ZoneTaskSummary[],
  zone: ZoneType,
  roomIntent: ZoneTaskSummary['roomIntent']
): ZoneTaskSummary[] {
  if (summaries.some(summary => summary.zone === zone)) return summaries;
  return [
    ...summaries,
    {
      zone,
      roomIntent,
      agents: 0,
      activeTasks: 0,
      queuedTasks: 0,
      completedTasks: 0,
      staleHeartbeats: 0,
    },
  ];
}

function statusDelta(status: SanctuaryTaskStatus, delta: 1 | -1): Partial<ZoneTaskSummary> {
  if (status === 'active') return { activeTasks: delta };
  if (status === 'queued') return { queuedTasks: delta };
  if (status === 'completed') return { completedTasks: delta };
  return {};
}

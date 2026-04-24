import React, { useEffect, useMemo, useState } from 'react';
import {
  type GlobalCommandDescriptor,
  type ModelOperationEvent,
  type RuntimeMetricsSnapshot,
  type ZoneTaskSummary,
} from '@habitat/shared';

interface HealthSnapshot {
  status: string;
  uptime: number;
  agents: number;
}

interface AnalyticsState {
  health: HealthSnapshot | null;
  runtime: RuntimeMetricsSnapshot | null;
  operations: ModelOperationEvent[];
  zoneSummaries: ZoneTaskSummary[];
  commands: GlobalCommandDescriptor[];
}

const EMPTY_STATE: AnalyticsState = {
  health: null,
  runtime: null,
  operations: [],
  zoneSummaries: [],
  commands: [],
};

export function AnalyticsView() {
  const [state, setState] = useState<AnalyticsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchJson<HealthSnapshot>('/health'),
      fetchJson<{ runtime: RuntimeMetricsSnapshot }>('/api/models/runtime'),
      fetchJson<{ events: ModelOperationEvent[] }>('/api/model-operations?limit=8'),
      fetchJson<{ summaries: ZoneTaskSummary[] }>('/api/zones/task-summaries'),
      fetchJson<{ commands: GlobalCommandDescriptor[] }>('/api/commands'),
    ])
      .then(([health, runtimePayload, operationsPayload, zonePayload, commandsPayload]) => {
        if (cancelled) return;
        setState({
          health,
          runtime: runtimePayload.runtime,
          operations: operationsPayload.events ?? [],
          zoneSummaries: zonePayload.summaries ?? [],
          commands: commandsPayload.commands ?? [],
        });
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const taskTotals = useMemo(() => state.zoneSummaries.reduce((totals, summary) => ({
    active: totals.active + summary.activeTasks,
    queued: totals.queued + summary.queuedTasks,
    completed: totals.completed + summary.completedTasks,
    stale: totals.stale + summary.staleHeartbeats,
  }), { active: 0, queued: 0, completed: 0, stale: 0 }), [state.zoneSummaries]);

  const commandGroups = useMemo(() => new Set(state.commands.map(command => command.group)).size, [state.commands]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-5xl font-headline font-black tracking-tighter text-on-background mb-2">System Analytics</h2>
          <p className="text-on-surface-variant max-w-2xl">
            OpenClaw runtime, Docker gateway, model operations, and sanctuary task throughput.
          </p>
        </div>
        <div className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/30 px-3 py-2">
          {loading ? 'Syncing' : 'Live Snapshot'}
        </div>
      </div>

      {error && (
        <div className="border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Docker Gateway"
          icon="dns"
          value={state.health?.status?.toUpperCase() ?? 'PENDING'}
          detail={`${state.health?.agents ?? 0} agents - ${formatUptime(state.health?.uptime ?? 0)} uptime`}
          meter={state.health?.status === 'ok' ? 99 : 10}
        />
        <MetricCard
          title="Runtime CPU"
          icon="memory"
          value={`${Math.round(state.runtime?.cpuPct ?? 0)}%`}
          detail={state.runtime?.label ?? 'Runtime pending'}
          meter={state.runtime?.cpuPct ?? 0}
        />
        <MetricCard
          title="Task Flow"
          icon="task_alt"
          value={`${taskTotals.active} active`}
          detail={`${taskTotals.queued} queued - ${taskTotals.completed} completed`}
          meter={Math.min(100, taskTotals.active * 16 + taskTotals.queued * 8)}
        />
        <MetricCard
          title="Heartbeat Risk"
          icon="monitor_heart"
          value={`${taskTotals.stale} stale`}
          detail={`${state.zoneSummaries.length} zones reporting`}
          meter={Math.min(100, taskTotals.stale * 25)}
          tone={taskTotals.stale > 0 ? 'bg-error' : 'bg-primary'}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-surface-container-lowest border border-outline-variant/20 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/10 pb-4">
            <div>
              <h3 className="text-lg font-headline font-bold text-on-background">Model Operations</h3>
              <p className="text-sm text-on-surface-variant">Recent recovery, quota, runtime, and strategy events.</p>
            </div>
            <span className="material-symbols-outlined text-primary">manage_history</span>
          </div>
          <div className="flex flex-col gap-2">
            {state.operations.length === 0 ? (
              <div className="border border-dashed border-outline-variant/50 p-4 text-sm text-on-surface-variant">
                No model operation events yet.
              </div>
            ) : state.operations.map(event => (
              <article key={event.id} className="bg-surface-container-low border border-outline-variant/20 p-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">{event.eventType}</span>
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-outline">{event.severity}</span>
                  </div>
                  <p className="text-sm text-on-surface mt-1">{event.message}</p>
                </div>
                <span className="text-xs text-on-surface-variant whitespace-nowrap">{formatTime(event.timestamp)}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 p-5 flex flex-col gap-4">
          <div className="border-b border-outline-variant/10 pb-4">
            <h3 className="text-lg font-headline font-bold text-on-background">Runtime Resources</h3>
            <p className="text-sm text-on-surface-variant">{state.runtime?.label ?? 'Runtime pending'}</p>
          </div>
          <ResourceLine label="RAM" value={formatBytes(state.runtime?.ramBytes ?? 0)} max={formatBytes(state.runtime?.totalRamBytes ?? 0)} pct={ramPct(state.runtime)} />
          <ResourceLine label="CPU" value={`${Math.round(state.runtime?.cpuPct ?? 0)}%`} max={state.runtime?.source ?? 'unknown'} pct={state.runtime?.cpuPct ?? 0} />
          <ResourceLine label="GPU" value={state.runtime?.gpuPct === undefined ? 'Cloud-side' : `${state.runtime.gpuPct}%`} max={state.runtime?.vramBytes ? formatBytes(state.runtime.vramBytes) : 'n/a'} pct={state.runtime?.gpuPct ?? 0} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-5 flex flex-col gap-4">
          <div className="border-b border-outline-variant/10 pb-4">
            <h3 className="text-lg font-headline font-bold text-on-background">Zone Throughput</h3>
            <p className="text-sm text-on-surface-variant">Active queues by sanctuary zone.</p>
          </div>
          <div className="flex flex-col gap-3">
            {state.zoneSummaries.map(summary => (
              <ResourceLine
                key={summary.zone}
                label={summary.zone}
                value={`${summary.activeTasks} active`}
                max={`${summary.queuedTasks} queued`}
                pct={Math.min(100, summary.activeTasks * 20 + summary.queuedTasks * 10)}
              />
            ))}
            {state.zoneSummaries.length === 0 && <span className="text-sm text-on-surface-variant">No zone telemetry yet.</span>}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 p-5 flex flex-col gap-4">
          <div className="border-b border-outline-variant/10 pb-4">
            <h3 className="text-lg font-headline font-bold text-on-background">OpenClaw Command Surface</h3>
            <p className="text-sm text-on-surface-variant">{state.commands.length} controls across {commandGroups} groups.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.commands.slice(0, 10).map(command => (
              <span
                key={command.id}
                className={`px-3 py-2 text-xs font-headline font-bold uppercase tracking-widest border ${
                  command.enabled ? 'border-primary/30 text-primary bg-primary/5' : 'border-outline-variant/30 text-on-surface-variant bg-surface-container-low'
                }`}
              >
                {command.command}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json() as Promise<T>;
}

function MetricCard({
  title,
  icon,
  value,
  detail,
  meter,
  tone = 'bg-primary',
}: {
  title: string;
  icon: string;
  value: string;
  detail: string;
  meter: number;
  tone?: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <h3 className="text-xs font-headline uppercase tracking-widest text-on-surface-variant">{title}</h3>
        <span className="material-symbols-outlined text-primary text-opacity-80">{icon}</span>
      </div>
      <div>
        <div className="text-4xl font-headline font-black text-on-background tracking-tight">{value}</div>
        <p className="text-xs text-on-surface-variant mt-1">{detail}</p>
      </div>
      <div className="w-full h-1.5 bg-surface-container mt-auto">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(4, Math.min(100, meter))}%` }} />
      </div>
    </div>
  );
}

function ResourceLine({ label, value, max, pct }: { label: string; value: string; max: string; pct: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-headline font-bold uppercase tracking-widest text-outline">{label}</span>
        <span className="text-on-surface-variant">{value} / {max}</span>
      </div>
      <div className="h-2 bg-surface-container overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

function ramPct(runtime: RuntimeMetricsSnapshot | null): number {
  if (!runtime || runtime.totalRamBytes <= 0) return 0;
  return (runtime.ramBytes / runtime.totalRamBytes) * 100;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function formatUptime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function formatTime(timestamp: number): string {
  if (!timestamp) return 'pending';
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(timestamp);
}

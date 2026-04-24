import React from 'react';
import { ZONES, type ZoneTaskSummary, type ZoneType } from '@habitat/shared';
import { type Agent } from '../../hooks/useAgents';
import { useSanctuaryOperations } from '../../hooks/useSanctuaryOperations';
import { type useWebSocket } from '../../hooks/useWebSocket';

interface ZonesViewProps {
  agents: Agent[];
  ws: ReturnType<typeof useWebSocket>;
}

const ZONE_ORDER: ZoneType[] = [ZONES.LOUNGE, ZONES.KITCHEN, ZONES.NURSERY, ZONES.GARDEN];

const ZONE_META: Record<ZoneType, { label: string; room: string; icon: string; tone: string }> = {
  [ZONES.LOUNGE]: { label: 'Office', room: 'Task routing', icon: 'desktop_windows', tone: 'border-l-primary' },
  [ZONES.KITCHEN]: { label: 'Kitchen', room: 'Feeding queue', icon: 'restaurant', tone: 'border-l-secondary' },
  [ZONES.NURSERY]: { label: 'Bedroom', room: 'Rest and recovery', icon: 'bed', tone: 'border-l-tertiary' },
  [ZONES.GARDEN]: { label: 'Outdoor Garden', room: 'Organic work loop', icon: 'psychiatry', tone: 'border-l-success' },
};

export function ZonesView({ agents, ws }: ZonesViewProps) {
  const agentIds = agents.map(agent => agent.config.id);
  const { zoneTasks, zoneSummaries, heartbeatsByAgent, loading, error } = useSanctuaryOperations(ws, {
    agentIds,
    zones: ZONE_ORDER,
    taskLimit: 12,
    heartbeatStaleAfterMs: 45_000,
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-4xl font-headline font-black text-on-background">Zone Task Flow</h2>
        <p className="text-on-surface-variant">Watch task queues, room routing, and agent heartbeats across the sanctuary.</p>
      </div>

      {error && (
        <div className="border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {ZONE_ORDER.map((zone) => {
          const meta = ZONE_META[zone];
          const summary = findSummary(zoneSummaries, zone);
          const zoneAgents = agents.filter(agent => agent.zone === zone);
          const tasks = zoneTasks[zone] ?? [];
          const heartbeats = zoneAgents
            .flatMap(agent => heartbeatsByAgent[agent.config.id] ?? [])
            .sort((a, b) => b.lastSeenAt - a.lastSeenAt);

          return (
            <section key={zone} className={`bg-surface-container-low border border-outline-variant/30 border-l-4 ${meta.tone} p-5 flex flex-col gap-4`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl mt-1">{meta.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-outline">{meta.label}</span>
                    <h3 className="text-2xl font-headline font-bold text-primary">{zone}</h3>
                    <span className="text-xs text-on-surface-variant">{meta.room}</span>
                  </div>
                </div>
                <div className="bg-primary-fixed text-on-primary-fixed px-3 py-1 font-headline font-bold text-xs">
                  {summary.agents || zoneAgents.length} AGENTS
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Metric label="Active" value={summary.activeTasks} />
                <Metric label="Queued" value={summary.queuedTasks} />
                <Metric label="Done" value={summary.completedTasks} />
                <Metric label="Stale" value={summary.staleHeartbeats} tone={summary.staleHeartbeats > 0 ? 'text-error' : undefined} />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-headline font-bold uppercase tracking-widest text-outline">Tasks</h4>
                  {loading && <span className="text-[10px] font-headline font-bold uppercase text-on-surface-variant">Syncing</span>}
                </div>

                {tasks.length === 0 ? (
                  <div className="border border-dashed border-outline-variant/50 px-3 py-4 text-sm text-on-surface-variant">
                    No tasks queued for this room.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {tasks.slice(0, 4).map(task => (
                      <article key={task.id} className="bg-surface-container border border-outline-variant/30 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="font-headline font-bold text-sm text-on-surface">{task.title}</h5>
                            <p className="text-xs text-on-surface-variant">{task.nodeType ?? task.roomIntent}</p>
                          </div>
                          <span className="text-[10px] font-headline font-bold uppercase text-primary">{task.status}</span>
                        </div>
                        <div className="mt-3 h-1.5 bg-outline-variant/20 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.max(8, task.progressPct ?? (task.status === 'completed' ? 100 : 32))}%` }} />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-outline-variant/20 pt-3">
                {heartbeats.length === 0 ? (
                  <span className="text-xs text-on-surface-variant">No heartbeat events yet.</span>
                ) : heartbeats.slice(0, 3).map(heartbeat => (
                  <span key={`${heartbeat.agentId}-${heartbeat.lastSeenAt}`} className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 text-[11px] font-headline font-bold uppercase text-on-surface-variant">
                    <span className={`w-1.5 h-1.5 rounded-full ${heartbeat.status === 'online' ? 'bg-success' : 'bg-error'}`} />
                    {agentName(agents, heartbeat.agentId)} - {heartbeat.status}
                  </span>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, tone = 'text-on-surface' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-surface-container px-3 py-2">
      <div className={`text-lg font-headline font-black ${tone}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-outline font-headline font-bold">{label}</div>
    </div>
  );
}

function findSummary(summaries: ZoneTaskSummary[], zone: ZoneType): ZoneTaskSummary {
  return summaries.find(summary => summary.zone === zone) ?? {
    zone,
    roomIntent: zone === ZONES.KITCHEN ? 'feeding' : zone === ZONES.NURSERY ? 'rest' : zone === ZONES.GARDEN ? 'garden' : 'task',
    agents: 0,
    activeTasks: 0,
    queuedTasks: 0,
    completedTasks: 0,
    staleHeartbeats: 0,
  };
}

function agentName(agents: Agent[], agentId: string): string {
  return agents.find(agent => agent.config.id === agentId)?.config.name ?? agentId;
}

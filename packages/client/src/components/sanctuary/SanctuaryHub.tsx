import React, { useMemo } from 'react';
import { ZONES, type SanctuaryTask, type ZoneTaskSummary } from '@habitat/shared';
import { type Agent } from '../../hooks/useAgents';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useSanctuaryOperations } from '../../hooks/useSanctuaryOperations';
import { SanctuarySprite } from './SanctuarySprite';
import {
  createSanctuaryHouseLayout,
  type SanctuaryBounds,
  type SanctuaryRoom,
} from './houseLayout';
import { routeAgentToRoom, routeTaskToRoom } from './sanctuaryRouting';
import './SanctuaryHub.css';

interface SanctuaryHubProps {
  agents: Agent[];
  ws: ReturnType<typeof useWebSocket>;
  onSelectAgent: (id: string) => void;
}

type RoomAgentMap = Record<string, Agent[]>;

const ROOM_COLORS: Record<string, string> = {
  bedroom: '#efe8dc',
  kitchen: '#f7efe4',
  office: '#eef2eb',
  'task-room': '#f4f0e8',
  garden: '#dbe8cf',
};

export function SanctuaryHub({ agents, ws, onSelectAgent }: SanctuaryHubProps) {
  const operations = useSanctuaryOperations(ws, {
    agentIds: agents.map(agent => agent.config.id),
    taskLimit: 80,
  });
  const activeTasks = operations.tasks.filter(task => task.status === 'active' || task.status === 'queued');
  const snackCount = agents.reduce((sum, agent) => sum + (agent.pendingSnacks?.length ?? 0), 0);
  const layout = useMemo(() => createSanctuaryHouseLayout({
    agents: agents.map(agent => ({
      id: agent.config.id,
      state: agent.state,
      zone: agent.zone,
      pendingSnacks: agent.pendingSnacks,
    })),
    tasks: operations.tasks,
    activeTaskCount: activeTasks.length,
    snackCount,
    taskRoomCapacity: 4,
  }), [activeTasks.length, agents, operations.tasks, snackCount]);
  const world = useMemo(() => getWorldBounds(layout.rooms), [layout.rooms]);
  const roomAgents = useMemo(() => groupAgentsByRoom(agents, layout.rooms), [agents, layout.rooms]);
  const roomTasks = useMemo(() => groupTasksByRoom(operations.tasks, layout.rooms), [operations.tasks, layout.rooms]);

  return (
    <div className="sanctuary-hub animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sanctuary-hub__header">
        <div>
          <p className="sanctuary-hub__eyebrow">Live Floor Plan</p>
          <h2>Sanctuary Floor Plan</h2>
        </div>
        <div className="sanctuary-hub__summary">
          <Metric label="Agents" value={agents.length} />
          <Metric label="Tasks" value={operations.tasks.length} />
          <Metric label="Heartbeats" value={countHeartbeats(operations.heartbeatsByAgent)} />
        </div>
      </div>

      <section
        className="sanctuary-map"
        style={{ aspectRatio: `${world.width} / ${world.height}` }}
        aria-label="Architected sanctuary house floor plan"
      >
        <div className="sanctuary-map__house-shell" style={toWorldStyle(layout.houseBoundary, world)}>
          <div className="sanctuary-map__roof-line" />
        </div>
        <GardenPath world={world} house={layout.houseBoundary} garden={layout.rooms.find(room => room.id === 'garden')?.bounds} />

        {layout.rooms.map(room => (
          <RoomView
            key={room.id}
            room={room}
            world={world}
            agents={roomAgents[room.id] ?? []}
            tasks={roomTasks[room.id] ?? []}
            summary={findSummary(room, operations.zoneSummaries)}
            onSelectAgent={onSelectAgent}
          />
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="sanctuary-hub__metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function RoomView({
  room,
  world,
  agents,
  tasks,
  summary,
  onSelectAgent,
}: {
  room: SanctuaryRoom;
  world: SanctuaryBounds;
  agents: Agent[];
  tasks: SanctuaryTask[];
  summary?: ZoneTaskSummary;
  onSelectAgent: (id: string) => void;
}) {
  const roomClass = [
    'sanctuary-room',
    `sanctuary-room--${room.kind}`,
    room.insideHouse ? 'sanctuary-room--inside' : 'sanctuary-room--outdoor',
    room.style.natural ? 'sanctuary-room--natural' : '',
  ].filter(Boolean).join(' ');
  const motionRoomId = motionRoomIdForRoom(room);

  return (
    <article
      className={roomClass}
      style={{
        ...toWorldStyle(room.bounds, world),
        '--sanctuary-room-color': ROOM_COLORS[room.kind] ?? ROOM_COLORS['task-room'],
      } as React.CSSProperties}
      aria-label={`${room.name} room`}
    >
      <div className="sanctuary-room__texture" aria-hidden="true" />
      <div className="sanctuary-room__furniture" aria-hidden="true">
        {renderFurniture(room)}
      </div>
      <header className="sanctuary-room__header">
        <div>
          <span>{room.kind.replace('-', ' ')}</span>
          <h3>{room.name}</h3>
        </div>
        <div className="sanctuary-room__counts">
          <span>{agents.length}/{room.capacity}</span>
          {tasks.length > 0 && <span>{tasks.length} tasks</span>}
          {summary && summary.staleHeartbeats > 0 && <span>{summary.staleHeartbeats} stale</span>}
        </div>
      </header>
      <div className="sanctuary-room__agents">
        {agents.map((agent, index) => (
          <SanctuarySprite
            key={agent.config.id}
            agent={agent}
            roomId={motionRoomId}
            occupancyIndex={index}
            onSelectAgent={onSelectAgent}
          />
        ))}
      </div>
    </article>
  );
}

function GardenPath({
  world,
  house,
  garden,
}: {
  world: SanctuaryBounds;
  house: SanctuaryBounds;
  garden?: SanctuaryBounds;
}) {
  if (!garden) return null;
  const x = house.x + house.width * 0.5 - 3;
  const y = house.y + house.height - 1;
  return (
    <div
      className="sanctuary-map__garden-path"
      style={{
        ...toWorldStyle({ x, y, width: 6, height: garden.y - y + 4 }, world),
      }}
      aria-hidden="true"
    />
  );
}

function renderFurniture(room: SanctuaryRoom) {
  if (room.kind === 'bedroom') {
    return (
      <>
        <span className="fixture fixture--bed" />
        <span className="fixture fixture--rug" />
      </>
    );
  }
  if (room.kind === 'kitchen') {
    return (
      <>
        <span className="fixture fixture--counter" />
        <span className="fixture fixture--table" />
      </>
    );
  }
  if (room.kind === 'garden') {
    return (
      <>
        <span className="fixture fixture--pond" />
        <span className="fixture fixture--tree fixture--tree-a" />
        <span className="fixture fixture--tree fixture--tree-b" />
      </>
    );
  }
  return (
    <>
      <span className="fixture fixture--desk" />
      <span className="fixture fixture--console" />
    </>
  );
}

function groupAgentsByRoom(agents: Agent[], rooms: SanctuaryRoom[]): RoomAgentMap {
  const taskRooms = rooms.filter(room => room.role === 'task');
  let taskIndex = 0;

  return agents.reduce<RoomAgentMap>((acc, agent) => {
    const route = routeAgentToRoom(agent);
    let roomId = 'office';
    if (route.roomKind === 'bedroom') roomId = 'bedroom';
    if (route.roomKind === 'kitchen') roomId = 'kitchen';
    if (route.roomKind === 'garden') roomId = 'garden';
    if (route.roomKind === 'office') {
      roomId = taskRooms.length > 0 ? taskRooms[taskIndex % taskRooms.length].id : 'office';
      taskIndex += 1;
    }
    acc[roomId] = [...(acc[roomId] ?? []), agent];
    return acc;
  }, {});
}

function groupTasksByRoom(tasks: SanctuaryTask[], rooms: SanctuaryRoom[]): Record<string, SanctuaryTask[]> {
  const taskRooms = rooms.filter(room => room.role === 'task');
  let taskIndex = 0;

  return tasks.reduce<Record<string, SanctuaryTask[]>>((acc, task) => {
    const route = routeTaskToRoom(task);
    let roomId = 'office';
    if (route.roomKind === 'bedroom') roomId = 'bedroom';
    if (route.roomKind === 'kitchen') roomId = 'kitchen';
    if (route.roomKind === 'garden') roomId = 'garden';
    if (route.roomKind === 'office') {
      roomId = taskRooms.length > 0 ? taskRooms[taskIndex % taskRooms.length].id : 'office';
      taskIndex += 1;
    }
    acc[roomId] = [...(acc[roomId] ?? []), task];
    return acc;
  }, {});
}

function findSummary(room: SanctuaryRoom, summaries: ZoneTaskSummary[]): ZoneTaskSummary | undefined {
  if (room.id === 'bedroom') return summaries.find(summary => summary.zone === ZONES.NURSERY);
  if (room.id === 'kitchen') return summaries.find(summary => summary.zone === ZONES.KITCHEN);
  if (room.id === 'garden') return summaries.find(summary => summary.zone === ZONES.GARDEN);
  return summaries.find(summary => summary.zone === ZONES.LOUNGE);
}

function motionRoomIdForRoom(room: SanctuaryRoom): string {
  if (room.kind === 'bedroom') return 'nursery';
  if (room.kind === 'kitchen') return 'kitchen';
  if (room.kind === 'garden') return 'garden';
  return 'lounge';
}

function getWorldBounds(rooms: SanctuaryRoom[]): SanctuaryBounds {
  const minX = Math.min(...rooms.map(room => room.bounds.x));
  const minY = Math.min(...rooms.map(room => room.bounds.y));
  const maxX = Math.max(...rooms.map(room => room.bounds.x + room.bounds.width));
  const maxY = Math.max(...rooms.map(room => room.bounds.y + room.bounds.height));
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function toWorldStyle(bounds: SanctuaryBounds, world: SanctuaryBounds): React.CSSProperties {
  return {
    left: `${((bounds.x - world.x) / world.width) * 100}%`,
    top: `${((bounds.y - world.y) / world.height) * 100}%`,
    width: `${(bounds.width / world.width) * 100}%`,
    height: `${(bounds.height / world.height) * 100}%`,
  };
}

function countHeartbeats(heartbeatsByAgent: Record<string, unknown[]>): number {
  return Object.values(heartbeatsByAgent).reduce((sum, heartbeats) => sum + heartbeats.length, 0);
}

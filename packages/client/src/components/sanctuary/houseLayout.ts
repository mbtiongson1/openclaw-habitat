export type SanctuaryRoomRole = 'rest' | 'feeding' | 'task' | 'outdoor';
export type SanctuaryRoomKind = 'bedroom' | 'kitchen' | 'office' | 'task-room' | 'garden';
export type SanctuaryGeometry = 'rectilinear' | 'organic';

export interface SanctuaryLayoutAgent {
  id: string;
  state?: string;
  zone?: string;
  pendingSnacks?: readonly unknown[];
}

export interface SanctuaryLayoutTask {
  id: string;
  state?: string;
}

export interface SanctuaryHouseLayoutInput {
  agents?: readonly SanctuaryLayoutAgent[];
  tasks?: readonly SanctuaryLayoutTask[];
  activeTaskCount?: number;
  plannedAgentCapacity?: number;
  plannedTaskCapacity?: number;
  snackCount?: number;
  taskRoomCapacity?: number;
}

export interface SanctuaryBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SanctuaryRoomStyle {
  geometry: SanctuaryGeometry;
  natural: boolean;
}

export interface SanctuaryRoom {
  id: string;
  name: string;
  role: SanctuaryRoomRole;
  kind: SanctuaryRoomKind;
  bounds: SanctuaryBounds;
  weight: number;
  capacity: number;
  insideHouse: boolean;
  style: SanctuaryRoomStyle;
}

export interface SanctuaryHouseLayout {
  houseBoundary: SanctuaryBounds;
  gardenGap: number;
  rooms: SanctuaryRoom[];
}

const DEFAULT_TASK_ROOM_CAPACITY = 4;
const HOUSE_WIDTH = 100;
const BASE_HOUSE_HEIGHT = 72;
const GARDEN_GAP = 8;
const MAX_VISIBLE_TASK_ROOMS = 6;
const MAX_VISUAL_SNACKS = 8;
const MIN_PLANNED_AGENT_CAPACITY = 4;
const MIN_PLANNED_TASK_CAPACITY = 6;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizedState(agent: SanctuaryLayoutAgent) {
  return (agent.state ?? agent.zone ?? '').toLowerCase();
}

function countMatchingAgents(agents: readonly SanctuaryLayoutAgent[], states: readonly string[]) {
  return agents.filter((agent) => states.some((state) => normalizedState(agent).includes(state))).length;
}

function countSnacks(agents: readonly SanctuaryLayoutAgent[], explicitSnackCount?: number) {
  const agentSnacks = agents.reduce((sum, agent) => sum + (agent.pendingSnacks?.length ?? 0), 0);
  return Math.max(0, explicitSnackCount ?? agentSnacks);
}

function createRoom(
  room: Omit<SanctuaryRoom, 'insideHouse' | 'style'> & {
    insideHouse?: boolean;
    style?: Partial<SanctuaryRoomStyle>;
  },
): SanctuaryRoom {
  return {
    ...room,
    insideHouse: room.insideHouse ?? true,
    style: {
      geometry: room.style?.geometry ?? 'rectilinear',
      natural: room.style?.natural ?? false,
    },
  };
}

function splitWidth(totalWidth: number, leftWeight: number, rightWeight: number) {
  const totalWeight = leftWeight + rightWeight;
  return totalWidth * (leftWeight / totalWeight);
}

function plannedAgentCapacityFor(input: SanctuaryHouseLayoutInput, agentCount: number) {
  return Math.max(
    MIN_PLANNED_AGENT_CAPACITY,
    Math.ceil(agentCount * 1.6),
    Math.floor(input.plannedAgentCapacity ?? 0),
  );
}

function plannedTaskCapacityFor(input: SanctuaryHouseLayoutInput, agentCount: number, taskRoomCapacity: number) {
  return Math.max(
    MIN_PLANNED_TASK_CAPACITY,
    Math.ceil(agentCount * 2.5),
    taskRoomCapacity,
    Math.floor(input.plannedTaskCapacity ?? 0),
  );
}

function taskRoomCountForCapacity(plannedTaskCapacity: number, taskRoomCapacity: number) {
  return clamp(Math.ceil(plannedTaskCapacity / taskRoomCapacity), 1, MAX_VISIBLE_TASK_ROOMS);
}

export function createSanctuaryHouseLayout(input: SanctuaryHouseLayoutInput = {}): SanctuaryHouseLayout {
  const agents = input.agents ?? [];
  const taskRoomCapacity = Math.max(1, Math.floor(input.taskRoomCapacity ?? DEFAULT_TASK_ROOM_CAPACITY));
  const explicitTasks = input.tasks?.length ?? 0;
  const restAgents = countMatchingAgents(agents, ['sleep', 'rest', 'idle', 'nursery']);
  const feedingAgents = countMatchingAgents(agents, ['feed', 'eat', 'kitchen']);
  const workingAgents = countMatchingAgents(agents, ['work', 'task', 'office']);
  const snacks = countSnacks(agents, input.snackCount);
  const activeTasks = Math.max(0, input.activeTaskCount ?? explicitTasks);
  const taskPressure = Math.max(activeTasks, explicitTasks) + workingAgents;
  const plannedAgentCapacity = plannedAgentCapacityFor(input, agents.length);
  const plannedTaskCapacity = plannedTaskCapacityFor(input, agents.length, taskRoomCapacity);
  const taskRoomCount = taskRoomCountForCapacity(plannedTaskCapacity, taskRoomCapacity);
  const visualTaskPressure = Math.min(plannedTaskCapacity, taskRoomCount * taskRoomCapacity);
  const roomCapacity = Math.max(taskRoomCapacity, Math.ceil(Math.max(taskPressure, plannedTaskCapacity) / taskRoomCount));

  const bedroomWeight = 1 + plannedAgentCapacity * 0.16 + restAgents * 0.35;
  const kitchenWeight = 1 + feedingAgents * 0.5 + Math.min(snacks, MAX_VISUAL_SNACKS) * 0.18;
  const taskWeight = 1 + visualTaskPressure * 0.28 + plannedAgentCapacity * 0.08;

  const houseHeight = BASE_HOUSE_HEIGHT + clamp(plannedAgentCapacity * 1.6 + taskRoomCount * 5 + visualTaskPressure * 0.45, 0, 46);
  const topRowHeight = clamp(30 + (bedroomWeight + kitchenWeight - 2) * 4, 30, houseHeight * 0.56);
  const taskWingHeight = houseHeight - topRowHeight;
  const bedroomWidth = splitWidth(HOUSE_WIDTH, bedroomWeight, kitchenWeight);
  const kitchenWidth = HOUSE_WIDTH - bedroomWidth;
  const houseBoundary: SanctuaryBounds = { x: 0, y: 0, width: HOUSE_WIDTH, height: houseHeight };

  const rooms: SanctuaryRoom[] = [
    createRoom({
      id: 'bedroom',
      name: 'Bedroom',
      role: 'rest',
      kind: 'bedroom',
      bounds: { x: 0, y: 0, width: bedroomWidth, height: topRowHeight },
      weight: bedroomWeight,
      capacity: Math.max(2, Math.ceil(2 + restAgents * 1.5)),
    }),
    createRoom({
      id: 'kitchen',
      name: 'Kitchen',
      role: 'feeding',
      kind: 'kitchen',
      bounds: { x: bedroomWidth, y: 0, width: kitchenWidth, height: topRowHeight },
      weight: kitchenWeight,
      capacity: Math.max(2, Math.ceil(2 + feedingAgents + snacks / 2)),
    }),
  ];

  const officeWidth = taskRoomCount === 1 ? HOUSE_WIDTH : clamp(34 + plannedAgentCapacity * 0.7, 34, 46);
  const remainingTaskRooms = Math.max(0, taskRoomCount - 1);
  const taskColumns = clamp(Math.ceil(Math.sqrt(remainingTaskRooms)), 1, 2);
  const taskRows = Math.max(1, Math.ceil(remainingTaskRooms / taskColumns));
  const taskGridWidth = HOUSE_WIDTH - officeWidth;
  const cellWidth = remainingTaskRooms === 0 ? HOUSE_WIDTH : taskGridWidth / taskColumns;
  const cellHeight = taskWingHeight / taskRows;

  for (let index = 0; index < taskRoomCount; index += 1) {
    const taskGridIndex = Math.max(0, index - 1);
    const column = taskGridIndex % taskColumns;
    const row = Math.floor(taskGridIndex / taskColumns);
    const tasksInRoom = Math.max(0, Math.min(roomCapacity, taskPressure - index * roomCapacity));
    const roomWeight = taskWeight / taskRoomCount + tasksInRoom * 0.1;

    rooms.push(createRoom({
      id: index === 0 ? 'office' : `task-room-${index + 1}`,
      name: index === 0 ? 'Office' : `Task Room ${index + 1}`,
      role: 'task',
      kind: index === 0 ? 'office' : 'task-room',
      bounds: {
        x: index === 0 ? 0 : officeWidth + column * cellWidth,
        y: index === 0 ? topRowHeight : topRowHeight + row * cellHeight,
        width: index === 0 ? officeWidth : cellWidth,
        height: index === 0 ? taskWingHeight : cellHeight,
      },
      weight: roomWeight,
      capacity: roomCapacity,
    }));
  }

  rooms.push(createRoom({
    id: 'garden',
    name: 'Outdoor Garden',
    role: 'outdoor',
    kind: 'garden',
    bounds: {
      x: -4,
      y: houseBoundary.y + houseBoundary.height + GARDEN_GAP,
      width: HOUSE_WIDTH + 8,
      height: clamp(28 + agents.length * 1.5, 28, 44),
    },
    weight: 1 + agents.length * 0.12,
    capacity: Math.max(4, agents.length + 2),
    insideHouse: false,
    style: { geometry: 'organic', natural: true },
  }));

  return {
    houseBoundary,
    gardenGap: GARDEN_GAP,
    rooms,
  };
}

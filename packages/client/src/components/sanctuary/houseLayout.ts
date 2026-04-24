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

export function createSanctuaryHouseLayout(input: SanctuaryHouseLayoutInput = {}): SanctuaryHouseLayout {
  const agents = input.agents ?? [];
  const taskRoomCapacity = Math.max(1, Math.floor(input.taskRoomCapacity ?? DEFAULT_TASK_ROOM_CAPACITY));
  const explicitTasks = input.tasks?.length ?? 0;
  const restAgents = countMatchingAgents(agents, ['sleep', 'rest']);
  const feedingAgents = countMatchingAgents(agents, ['feed', 'eat', 'kitchen']);
  const workingAgents = countMatchingAgents(agents, ['work', 'task', 'office']);
  const snacks = countSnacks(agents, input.snackCount);
  const activeTasks = Math.max(0, input.activeTaskCount ?? explicitTasks);
  const taskPressure = Math.max(activeTasks, explicitTasks) + workingAgents;
  const taskRoomCount = Math.max(1, Math.ceil(taskPressure / taskRoomCapacity));

  const bedroomWeight = 1 + restAgents * 0.55 + agents.length * 0.08;
  const kitchenWeight = 1 + feedingAgents * 0.5 + snacks * 0.3;
  const taskWeight = 1 + taskPressure * 0.22;

  const houseHeight = BASE_HOUSE_HEIGHT + clamp(agents.length * 2 + taskRoomCount * 4 + taskPressure * 0.8, 0, 46);
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

  const taskColumns = clamp(Math.ceil(Math.sqrt(taskRoomCount)), 1, 3);
  const taskRows = Math.ceil(taskRoomCount / taskColumns);
  const cellWidth = HOUSE_WIDTH / taskColumns;
  const cellHeight = taskWingHeight / taskRows;

  for (let index = 0; index < taskRoomCount; index += 1) {
    const column = index % taskColumns;
    const row = Math.floor(index / taskColumns);
    const tasksInRoom = Math.max(0, Math.min(taskRoomCapacity, taskPressure - index * taskRoomCapacity));
    const roomWeight = taskWeight / taskRoomCount + tasksInRoom * 0.1;

    rooms.push(createRoom({
      id: index === 0 ? 'office' : `task-room-${index + 1}`,
      name: index === 0 ? 'Office' : `Task Room ${index + 1}`,
      role: 'task',
      kind: index === 0 ? 'office' : 'task-room',
      bounds: {
        x: column * cellWidth,
        y: topRowHeight + row * cellHeight,
        width: cellWidth,
        height: cellHeight,
      },
      weight: roomWeight,
      capacity: taskRoomCapacity,
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

import { describe, expect, it } from 'vitest';
import {
  createSanctuaryHouseLayout,
  type SanctuaryHouseLayoutInput,
  type SanctuaryRoom,
} from './houseLayout';

function roomById(rooms: SanctuaryRoom[], id: string) {
  const room = rooms.find((candidate) => candidate.id === id);
  expect(room, `expected room ${id}`).toBeDefined();
  return room as SanctuaryRoom;
}

function area(room: SanctuaryRoom) {
  return room.bounds.width * room.bounds.height;
}

describe('createSanctuaryHouseLayout', () => {
  it('creates required rooms even when there are no agents or tasks', () => {
    const layout = createSanctuaryHouseLayout({ agents: [], tasks: [] });

    expect(layout.houseBoundary.width).toBeGreaterThan(0);
    expect(layout.houseBoundary.height).toBeGreaterThan(0);
    expect(layout.rooms.map((room) => room.id)).toEqual(
      expect.arrayContaining(['bedroom', 'kitchen', 'office', 'garden']),
    );

    expect(roomById(layout.rooms, 'bedroom').role).toBe('rest');
    expect(roomById(layout.rooms, 'kitchen').role).toBe('feeding');
    expect(roomById(layout.rooms, 'office').role).toBe('task');
    expect(roomById(layout.rooms, 'garden').role).toBe('outdoor');
  });

  it('keeps the garden outside the house boundary with natural styling', () => {
    const layout = createSanctuaryHouseLayout({ agents: [], tasks: [] });
    const garden = roomById(layout.rooms, 'garden');
    const houseBottom = layout.houseBoundary.y + layout.houseBoundary.height;

    expect(garden.insideHouse).toBe(false);
    expect(garden.style.geometry).toBe('organic');
    expect(garden.style.natural).toBe(true);
    expect(garden.bounds.y).toBeGreaterThanOrEqual(houseBottom + layout.gardenGap);
  });

  it('scales core room weights from agent states and snacks', () => {
    const base = createSanctuaryHouseLayout({ agents: [], tasks: [] });
    const busy = createSanctuaryHouseLayout({
      agents: [
        { id: 'sleep-1', state: 'sleeping' },
        { id: 'sleep-2', state: 'resting' },
        { id: 'feed-1', state: 'feeding', pendingSnacks: [{ id: 'snack-1' }, { id: 'snack-2' }] },
        { id: 'feed-2', state: 'eating' },
      ],
      tasks: [],
    });

    expect(area(roomById(busy.rooms, 'bedroom'))).toBeGreaterThan(area(roomById(base.rooms, 'bedroom')));
    expect(area(roomById(busy.rooms, 'kitchen'))).toBeGreaterThan(area(roomById(base.rooms, 'kitchen')));
  });

  it('adds and enlarges task rooms when task count exceeds room capacity', () => {
    const input: SanctuaryHouseLayoutInput = {
      agents: [
        { id: 'worker-1', state: 'working' },
        { id: 'worker-2', state: 'tasking' },
      ],
      tasks: Array.from({ length: 13 }, (_, index) => ({ id: `task-${index + 1}` })),
      taskRoomCapacity: 4,
    };

    const layout = createSanctuaryHouseLayout(input);
    const taskRooms = layout.rooms.filter((room) => room.role === 'task');

    expect(taskRooms.length).toBe(4);
    expect(taskRooms.map((room) => room.id)).toEqual(['office', 'task-room-2', 'task-room-3', 'task-room-4']);
    expect(taskRooms.every((room) => room.insideHouse)).toBe(true);
    expect(taskRooms.reduce((sum, room) => sum + room.capacity, 0)).toBeGreaterThanOrEqual(input.tasks?.length ?? 0);
    expect(taskRooms.reduce((sum, room) => sum + area(room), 0)).toBeGreaterThan(
      area(roomById(createSanctuaryHouseLayout({ agents: [], tasks: [] }).rooms, 'office')),
    );
  });
});

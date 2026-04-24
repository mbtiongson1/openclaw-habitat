export type SanctuarySpriteState = 'idle' | 'working' | 'sleeping' | 'feeding' | 'social' | string;

export interface SanctuaryPoint {
  x: number;
  y: number;
}

export interface SanctuaryRoomAnchors {
  entry: SanctuaryPoint;
  rest: SanctuaryPoint;
  work: SanctuaryPoint;
  social: SanctuaryPoint;
  food: SanctuaryPoint;
  roam: SanctuaryPoint[];
}

export interface SanctuaryMotionInput {
  agentId: string;
  roomId: string;
  state: SanctuarySpriteState;
  occupancyIndex?: number;
  reducedMotion?: boolean;
}

export interface SanctuaryMotionPlan {
  agentId: string;
  roomId: string;
  state: SanctuarySpriteState;
  position: SanctuaryPoint;
  path: SanctuaryPoint[];
  durationMs: number;
  delayMs: number;
  facing: 'left' | 'right';
  activity: 'idle' | 'task' | 'rest';
  cssPath: string;
}

const ROOM_ANCHORS: Record<string, SanctuaryRoomAnchors> = {
  lounge: {
    entry: { x: 76, y: 52 },
    rest: { x: 34, y: 68 },
    work: { x: 58, y: 38 },
    social: { x: 44, y: 50 },
    food: { x: 24, y: 34 },
    roam: [{ x: 30, y: 42 }, { x: 48, y: 32 }, { x: 66, y: 58 }, { x: 38, y: 74 }],
  },
  kitchen: {
    entry: { x: 24, y: 54 },
    rest: { x: 70, y: 72 },
    work: { x: 62, y: 38 },
    social: { x: 42, y: 48 },
    food: { x: 74, y: 28 },
    roam: [{ x: 30, y: 62 }, { x: 54, y: 42 }, { x: 76, y: 46 }, { x: 58, y: 76 }],
  },
  nursery: {
    entry: { x: 74, y: 28 },
    rest: { x: 36, y: 70 },
    work: { x: 46, y: 42 },
    social: { x: 62, y: 58 },
    food: { x: 26, y: 36 },
    roam: [{ x: 28, y: 58 }, { x: 44, y: 34 }, { x: 66, y: 44 }, { x: 54, y: 74 }],
  },
  garden: {
    entry: { x: 48, y: 22 },
    rest: { x: 72, y: 66 },
    work: { x: 38, y: 58 },
    social: { x: 54, y: 48 },
    food: { x: 24, y: 74 },
    roam: [{ x: 22, y: 54 }, { x: 42, y: 34 }, { x: 70, y: 44 }, { x: 62, y: 78 }],
  },
};

const ROOM_ALIASES: Record<string, keyof typeof ROOM_ANCHORS> = {
  alpha: 'lounge',
  beta: 'kitchen',
  gamma: 'nursery',
  delta: 'garden',
};

export function normalizeRoomId(roomId: string): keyof typeof ROOM_ANCHORS {
  const key = roomId.trim().toLowerCase();
  return ROOM_ALIASES[key] ?? (key in ROOM_ANCHORS ? key as keyof typeof ROOM_ANCHORS : 'lounge');
}

export function getRoomAnchors(roomId: string): SanctuaryRoomAnchors {
  return ROOM_ANCHORS[normalizeRoomId(roomId)];
}

export function getTaskPath(input: SanctuaryMotionInput): SanctuaryPoint[] {
  const anchors = getRoomAnchors(input.roomId);
  const offset = occupancyOffset(input.agentId, input.occupancyIndex ?? 0);

  if (input.state === 'sleeping') {
    return [offsetPoint(anchors.rest, offset, 0.45)];
  }

  if (input.state === 'feeding') {
    return [
      anchors.entry,
      anchors.food,
      offsetPoint(anchors.food, offset, 0.35),
      anchors.rest,
    ];
  }

  if (input.state === 'social') {
    return [
      anchors.entry,
      anchors.social,
      offsetPoint(anchors.social, offset, 0.4),
      offsetPoint(anchors.rest, offset, 0.25),
    ];
  }

  if (input.state === 'working') {
    return [
      anchors.entry,
      anchors.work,
      offsetPoint(anchors.work, offset, 0.45),
      offsetPoint(anchors.social, offset, 0.25),
    ];
  }

  return getIdleWanderPath(input);
}

export function buildSanctuaryMotion(input: SanctuaryMotionInput): SanctuaryMotionPlan {
  const path = input.state === 'idle' ? getIdleWanderPath(input) : getTaskPath(input);
  const stablePath = path.length > 0 ? path : [getRoomAnchors(input.roomId).rest];
  const position = stablePath[stablePath.length - 1];
  const reducedPath = input.reducedMotion ? [position] : stablePath;
  const first = reducedPath[0];

  return {
    agentId: input.agentId,
    roomId: normalizeRoomId(input.roomId),
    state: input.state,
    position,
    path: reducedPath,
    durationMs: input.reducedMotion ? 0 : 9000 + (hashSeed(input.agentId) % 5000),
    delayMs: input.reducedMotion ? 0 : (hashSeed(`${input.roomId}:${input.agentId}`) % 1600),
    facing: position.x >= first.x ? 'right' : 'left',
    activity: input.state === 'sleeping' ? 'rest' : input.state === 'idle' ? 'idle' : 'task',
    cssPath: toCssPath(reducedPath),
  };
}

function getIdleWanderPath(input: SanctuaryMotionInput): SanctuaryPoint[] {
  const anchors = getRoomAnchors(input.roomId);
  const seed = hashSeed(`${input.roomId}:${input.agentId}:${input.occupancyIndex ?? 0}`);
  const startIndex = seed % anchors.roam.length;
  const offset = occupancyOffset(input.agentId, input.occupancyIndex ?? 0);

  return Array.from({ length: anchors.roam.length }, (_, step) => {
    const point = anchors.roam[(startIndex + step) % anchors.roam.length];
    const jitter = {
      x: (((seed >> (step * 3)) % 9) - 4) + offset.x * 0.45,
      y: (((seed >> (step * 2)) % 7) - 3) + offset.y * 0.45,
    };
    return clampPoint({ x: point.x + jitter.x, y: point.y + jitter.y });
  });
}

function occupancyOffset(agentId: string, occupancyIndex: number): SanctuaryPoint {
  const seed = hashSeed(`${agentId}:${occupancyIndex}`);
  const ring = 5 + (occupancyIndex % 3) * 3;
  const angle = ((seed % 360) * Math.PI) / 180;
  return {
    x: Math.cos(angle) * ring,
    y: Math.sin(angle) * ring,
  };
}

function offsetPoint(point: SanctuaryPoint, offset: SanctuaryPoint, scale: number): SanctuaryPoint {
  return clampPoint({
    x: point.x + offset.x * scale,
    y: point.y + offset.y * scale,
  });
}

function clampPoint(point: SanctuaryPoint): SanctuaryPoint {
  return {
    x: round(clamp(point.x, 8, 92)),
    y: round(clamp(point.y, 16, 88)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function toCssPath(path: SanctuaryPoint[]): string {
  if (path.length === 0) {
    return 'path("M 50 50")';
  }

  const [first, ...rest] = path;
  const commands = [`M ${first.x} ${first.y}`, ...rest.map(point => `L ${point.x} ${point.y}`)];
  if (path.length > 1) {
    commands.push(`L ${first.x} ${first.y}`);
  }
  return `path("${commands.join(' ')}")`;
}

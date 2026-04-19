export const ZONES = {
  LOUNGE: 'Lounge',
  KITCHEN: 'Kitchen',
  NURSERY: 'Nursery',
  GARDEN: 'Garden',
} as const;

export type ZoneType = typeof ZONES[keyof typeof ZONES];

export const AGENT_PERSONALITIES = [
  { id: 'verbose', name: 'Verbose', description: 'Gives detailed, long-form explanations.' },
  { id: 'cautious', name: 'Cautious', description: 'Double-checks everything, high quality threshold.' },
  { id: 'creative', name: 'Creative', description: 'Thinks outside the box, uses more flow nodes.' },
  { id: 'karpathy', name: 'Karpathy', description: 'Expert in AetherLang flow nodes and agent architecture.' },
] as const;

export const SOCKET_PORT = 18789;
export const BRIDGE_PORT = 3001;

// Agent States mapping to zones
export const AGENT_STATES = {
  WORKING: 'working', // Routes to Lounge
  IDLE: 'idle',       // Routes to Nursery
  FEEDING: 'feeding', // Routes to Kitchen
  SOCIAL: 'social'    // Routes to Garden
} as const;

export type AgentStateType = typeof AGENT_STATES[keyof typeof AGENT_STATES];

// SVG Part Types for customization
export const SVG_HEAD_TYPES = ['round', 'square', 'triangle', 'blob', 'star'] as const;
export const SVG_BODY_TYPES = ['standard', 'chunky', 'slim', 'robed'] as const;
export const SVG_HAND_TYPES = ['mitten', 'claw', 'circle', 'pointed'] as const;
export const SVG_FOOT_TYPES = ['boot', 'round', 'spike', 'flipper'] as const;

// Snack Tiers based on FeedingEngine critique scores
export const SNACK_TIERS = {
  BRONZE: 'bronze', // Score 0-5
  SILVER: 'silver', // Score 6-8
  GOLD: 'gold'      // Score 9-10
} as const;

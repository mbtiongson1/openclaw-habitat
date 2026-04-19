export const ZONES = {
  LOUNGE: 'Lounge',
  KITCHEN: 'Kitchen',
  NURSERY: 'Nursery',
  GARDEN: 'Garden',
} as const;

export const AGENT_PERSONALITIES = [
  { id: 'verbose', name: 'Verbose', description: 'Gives detailed, long-form explanations.' },
  { id: 'cautious', name: 'Cautious', description: 'Double-checks everything, high quality threshold.' },
  { id: 'creative', name: 'Creative', description: 'Thinks outside the box, uses more flow nodes.' },
  { id: 'karpathy', name: 'Karpathy', description: 'Expert in AetherLang flow nodes and agent architecture.' },
];

export const SOCKET_PORT = 18789;
export const BRIDGE_PORT = 3001;

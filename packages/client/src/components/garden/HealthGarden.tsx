import React, { useMemo } from 'react';
import { Agent } from '../../hooks/useAgents';

interface HealthGardenProps {
  agents: Agent[];
}

const COLORS = ['#8BAF6A', '#D4A574', '#7BA3C9', '#C9A0DC', '#E8C468', '#E68A8A'];

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(0.6)`}>
      <circle cx="0" cy="0" r="8" fill={color} />
      <circle cx="-10" cy="-10" r="12" fill={color} opacity="0.8" />
      <circle cx="10" cy="-10" r="12" fill={color} opacity="0.8" />
      <circle cx="-10" cy="10" r="12" fill={color} opacity="0.8" />
      <circle cx="10" cy="10" r="12" fill={color} opacity="0.8" />
      <circle cx="0" cy="0" r="10" fill="#E8C468" />
    </g>
  );
}

function Tree({ stage, x, y }: { stage: number; x: number; y: number }) {
  // Cap stage so tree doesn't get infinitely large
  const cappedStage = Math.min(stage, 10);
  const scale = 0.4 + (cappedStage * 0.1);
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="-10" y="0" width="20" height="60" fill="#6F3A00" rx="4" />
      {/* Tree canopy layers */}
      <circle cx="0" cy="-20" r="40" fill="#4A6741" />
      <circle cx="-25" cy="-10" r="30" fill="#334F2B" />
      <circle cx="25" cy="-10" r="30" fill="#334F2B" />
      <circle cx="0" cy="-40" r="35" fill="#8BAF6A" />
      <circle cx="-15" cy="-35" r="25" fill="#A8C789" />
    </g>
  );
}

export function HealthGarden({ agents }: HealthGardenProps) {
  // Calculate total tasks completed across all agents
  const totalTasks = agents.reduce((acc, agent) => acc + (agent.stats?.tasksCompleted || 0), 0);
  
  // Calculate tree size from combined uptime (say, 1 stage per 100 seconds)
  const totalUptime = agents.reduce((acc, agent) => acc + (agent.stats?.uptimeSeconds || 0), 0);
  const treeStage = Math.floor(totalUptime / 100);

  // Procedural flower generation based on tasks
  // Generate stable coordinates using index
  const flowers = useMemo(() => {
    // Generate up to 20 flowers max to not crowd the screen
    const count = Math.min(Math.floor(totalTasks / 5), 20);
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random based on index
      const seed = i * 1.345;
      const x = (Math.sin(seed) * 0.5 + 0.5) * 800; // 0 to 800 viewport range
      const y = (Math.cos(seed * 1.2) * 0.5 + 0.5) * 200 + 400; // bottom half
      const color = COLORS[i % COLORS.length];
      arr.push({ id: i, x, y, color });
    }
    return arr;
  }, [totalTasks]);

  return (
    <div className="health-garden">
      <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A6741" />
            <stop offset="100%" stopColor="#334F2B" />
          </linearGradient>
        </defs>

        {/* Base grass */}
        <rect width="1000" height="600" fill="url(#grassGrad)" />

        {/* Path / Dirt patch in center */}
        <ellipse cx="500" cy="450" rx="400" ry="120" fill="#6F3A00" opacity="0.3" />

        {/* Tree represents uptime */}
        <Tree stage={treeStage} x={500} y={350} />

        {/* Flowers represent tasks */}
        {flowers.map(f => (
          <Flower key={f.id} x={f.x} y={f.y} color={f.color} />
        ))}
      </svg>
    </div>
  );
}

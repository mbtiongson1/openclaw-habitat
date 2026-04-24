import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SanctuarySprite } from './SanctuarySprite';
import {
  buildSanctuaryMotion,
  getRoomAnchors,
  getTaskPath,
} from './spriteMotion';

const agent = {
  config: {
    id: 'agent-iris',
    name: 'Iris',
    personality: 'careful',
    svgParts: { head: 'round', body: 'standard', hands: 'mitten', feet: 'boot' },
    installedAt: 1,
  },
  zone: 'kitchen',
  state: 'working',
  stats: { cpu: 0, memory: 0, tasksCompleted: 0, uptimeSeconds: 0 },
  activeBoosts: [],
  pendingSnacks: [],
};

describe('spriteMotion', () => {
  it('builds deterministic idle wander waypoints inside the requested room', () => {
    const first = buildSanctuaryMotion({
      agentId: 'agent-iris',
      roomId: 'lounge',
      state: 'idle',
      occupancyIndex: 1,
    });
    const repeat = buildSanctuaryMotion({
      agentId: 'agent-iris',
      roomId: 'lounge',
      state: 'idle',
      occupancyIndex: 1,
    });
    const otherAgent = buildSanctuaryMotion({
      agentId: 'agent-lumen',
      roomId: 'lounge',
      state: 'idle',
      occupancyIndex: 1,
    });

    expect(first).toEqual(repeat);
    expect(first.path).toHaveLength(4);
    expect(first.path).not.toEqual(otherAgent.path);
    for (const point of first.path) {
      expect(point.x).toBeGreaterThanOrEqual(8);
      expect(point.x).toBeLessThanOrEqual(92);
      expect(point.y).toBeGreaterThanOrEqual(16);
      expect(point.y).toBeLessThanOrEqual(88);
    }
  });

  it('routes task states through room anchors instead of quadrant scatter', () => {
    const anchors = getRoomAnchors('kitchen');
    const feedingPath = getTaskPath({
      agentId: 'agent-iris',
      roomId: 'kitchen',
      state: 'feeding',
      occupancyIndex: 0,
    });

    expect(feedingPath[0]).toEqual(anchors.entry);
    expect(feedingPath).toContainEqual(anchors.food);
    expect(feedingPath.at(-1)).toEqual(anchors.rest);
  });

  it('collapses motion to a stable affordance when reduced motion is requested', () => {
    const motion = buildSanctuaryMotion({
      agentId: 'agent-iris',
      roomId: 'garden',
      state: 'working',
      occupancyIndex: 2,
      reducedMotion: true,
    });

    expect(motion.path).toEqual([motion.position]);
    expect(motion.durationMs).toBe(0);
  });
});

describe('SanctuarySprite', () => {
  it('renders a clickable agent affordance with id name and state metadata', async () => {
    const onSelectAgent = vi.fn();

    render(
      <SanctuarySprite
        agent={agent}
        roomId="kitchen"
        occupancyIndex={0}
        onSelectAgent={onSelectAgent}
      />
    );

    const button = screen.getByRole('button', { name: /iris working/i });
    expect(button).toHaveAttribute('data-agent-id', 'agent-iris');
    expect(button).toHaveAttribute('data-agent-state', 'working');

    await userEvent.click(button);

    expect(onSelectAgent).toHaveBeenCalledWith('agent-iris');
  });
});

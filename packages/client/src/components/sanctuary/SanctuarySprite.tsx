import React, { useMemo } from 'react';
import AgentSVG from '../../svg/AgentSVG';
import { type Agent } from '../../hooks/useAgents';
import {
  buildSanctuaryMotion,
  type SanctuarySpriteState,
} from './spriteMotion';
import './SanctuarySprite.css';

interface SanctuarySpriteProps {
  agent: Agent;
  roomId: string;
  occupancyIndex?: number;
  reducedMotion?: boolean;
  onSelectAgent: (id: string) => void;
}

const AGENT_SVG_STATES = new Set(['idle', 'working', 'sleeping', 'feeding', 'social']);

export function SanctuarySprite({
  agent,
  roomId,
  occupancyIndex = 0,
  reducedMotion = false,
  onSelectAgent,
}: SanctuarySpriteProps) {
  const motion = useMemo(
    () => buildSanctuaryMotion({
      agentId: agent.config.id,
      roomId,
      state: agent.state as SanctuarySpriteState,
      occupancyIndex,
      reducedMotion,
    }),
    [agent.config.id, agent.state, occupancyIndex, reducedMotion, roomId]
  );
  const svgState = AGENT_SVG_STATES.has(agent.state) ? agent.state : 'idle';

  return (
    <button
      type="button"
      className={`sanctuary-sprite sanctuary-sprite--${motion.activity} sanctuary-sprite--${motion.facing}`}
      style={{
        left: `${motion.position.x}%`,
        top: `${motion.position.y}%`,
        '--sanctuary-sprite-duration': `${motion.durationMs}ms`,
        '--sanctuary-sprite-delay': `${motion.delayMs}ms`,
      } as React.CSSProperties}
      aria-label={`${agent.config.name} ${agent.state}`}
      title={`${agent.config.name} (${agent.state})`}
      data-agent-id={agent.config.id}
      data-agent-name={agent.config.name}
      data-agent-state={agent.state}
      data-room-id={motion.roomId}
      data-motion-path={motion.cssPath}
      onClick={(event) => {
        event.stopPropagation();
        onSelectAgent(agent.config.id);
      }}
    >
      <span className="sanctuary-sprite__shadow" aria-hidden="true" />
      <span className="sanctuary-sprite__body">
        <AgentSVG
          size={76}
          head={agent.config.svgParts.head}
          body={agent.config.svgParts.body}
          hands={agent.config.svgParts.hands}
          feet={agent.config.svgParts.feet}
          state={svgState as 'idle' | 'working' | 'sleeping' | 'feeding' | 'social'}
        />
      </span>
      <span className="sanctuary-sprite__label">
        <span className="sanctuary-sprite__name">{agent.config.name}</span>
        <span className="sanctuary-sprite__state">{agent.state}</span>
      </span>
    </button>
  );
}

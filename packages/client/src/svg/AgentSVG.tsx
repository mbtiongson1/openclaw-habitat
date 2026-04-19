import React from 'react';

interface SVGPartsProps {
  head: string;
  body: string;
  hands: string;
  feet: string;
  state: 'idle' | 'working' | 'sleeping' | 'feeding' | 'social';
  size?: number;
}

const HEAD_COLORS: Record<string, string> = {
  round: '#8BAF6A', square: '#D4A574', triangle: '#7BA3C9', blob: '#C9A0DC', star: '#E8C468',
};

const BODY_COLORS: Record<string, string> = {
  standard: '#F5F0E8', chunky: '#EDE5D8', slim: '#E8E0D0', robed: '#D4CFC4',
};

function Head({ type, size }: { type: string; size: number }) {
  const color = HEAD_COLORS[type] || HEAD_COLORS.round;
  const cx = size / 2;
  const headSize = size * 0.35;

  switch (type) {
    case 'square':
      return <rect x={cx - headSize/2} y={2} width={headSize} height={headSize} fill={color} />;
    case 'triangle':
      return <polygon points={`${cx},2 ${cx - headSize/2},${2 + headSize} ${cx + headSize/2},${2 + headSize}`} fill={color} />;
    case 'blob':
      return <ellipse cx={cx} cy={2 + headSize * 0.55} rx={headSize * 0.55} ry={headSize * 0.45} fill={color} />;
    case 'star':
      const points = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        points.push(`${cx + Math.cos(angle) * headSize * 0.5},${2 + headSize * 0.55 + Math.sin(angle) * headSize * 0.5}`);
        points.push(`${cx + Math.cos(innerAngle) * headSize * 0.25},${2 + headSize * 0.55 + Math.sin(innerAngle) * headSize * 0.25}`);
      }
      return <polygon points={points.join(' ')} fill={color} />;
    default: // round
      return <circle cx={cx} cy={2 + headSize * 0.5} r={headSize * 0.45} fill={color} />;
  }
}

function Eyes({ size, state }: { size: number; state: string }) {
  const cx = size / 2;
  const headSize = size * 0.35;
  const eyeY = 2 + headSize * 0.45;
  const eyeSpacing = headSize * 0.18;

  if (state === 'sleeping') {
    return (
      <g>
        <line x1={cx - eyeSpacing - 3} y1={eyeY} x2={cx - eyeSpacing + 3} y2={eyeY} stroke="var(--on-surface)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={cx + eyeSpacing - 3} y1={eyeY} x2={cx + eyeSpacing + 3} y2={eyeY} stroke="var(--on-surface)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g>
      <circle cx={cx - eyeSpacing} cy={eyeY} r={2} fill="var(--on-surface)" />
      <circle cx={cx + eyeSpacing} cy={eyeY} r={2} fill="var(--on-surface)" />
      {state === 'feeding' && (
        <path d={`M${cx - 4},${eyeY + 5} Q${cx},${eyeY + 9} ${cx + 4},${eyeY + 5}`} stroke="var(--on-surface)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Body({ type, size }: { type: string; size: number }) {
  const color = BODY_COLORS[type] || BODY_COLORS.standard;
  const cx = size / 2;
  const headSize = size * 0.35;
  const bodyTop = headSize + 2;
  const bodyW = size * 0.3;
  const bodyH = size * 0.28;

  switch (type) {
    case 'chunky':
      return <rect x={cx - bodyW * 0.6} y={bodyTop} width={bodyW * 1.2} height={bodyH} rx={2} fill={color} stroke="var(--outline-variant)" />;
    case 'slim':
      return <rect x={cx - bodyW * 0.35} y={bodyTop} width={bodyW * 0.7} height={bodyH * 1.1} fill={color} stroke="var(--outline-variant)" />;
    case 'robed':
      return <path d={`M${cx - bodyW * 0.5},${bodyTop} L${cx - bodyW * 0.7},${bodyTop + bodyH * 1.2} L${cx + bodyW * 0.7},${bodyTop + bodyH * 1.2} L${cx + bodyW * 0.5},${bodyTop} Z`} fill={color} stroke="var(--outline-variant)" />;
    default: // standard
      return <rect x={cx - bodyW * 0.5} y={bodyTop} width={bodyW} height={bodyH} rx={1} fill={color} stroke="var(--outline-variant)" />;
  }
}

function Hands({ type, size }: { type: string; size: number }) {
  const cx = size / 2;
  const bodyW = size * 0.3;
  const bodyTop = size * 0.35 + 2;
  const handY = bodyTop + size * 0.1;

  const leftX = cx - bodyW * 0.5 - 6;
  const rightX = cx + bodyW * 0.5 + 6;
  const r = 4;

  const renderHand = (x: number) => {
    switch (type) {
      case 'claw':
        return <path d={`M${x},${handY - 3} L${x - 2},${handY + 4} M${x},${handY - 3} L${x},${handY + 5} M${x},${handY - 3} L${x + 2},${handY + 4}`} stroke="var(--on-surface)" strokeWidth="1.2" fill="none" />;
      case 'circle':
        return <circle cx={x} cy={handY} r={r - 1} fill="var(--surface-container-highest)" stroke="var(--on-surface-variant)" strokeWidth="0.8" />;
      case 'pointed':
        return <polygon points={`${x},${handY - 4} ${x - 3},${handY + 3} ${x + 3},${handY + 3}`} fill="var(--surface-container-highest)" stroke="var(--on-surface-variant)" strokeWidth="0.8" />;
      default: // mitten
        return <ellipse cx={x} cy={handY} rx={r} ry={r - 1} fill="var(--surface-container-highest)" stroke="var(--on-surface-variant)" strokeWidth="0.8" />;
    }
  };

  return <g>{renderHand(leftX)}{renderHand(rightX)}</g>;
}

function Feet({ type, size }: { type: string; size: number }) {
  const cx = size / 2;
  const footY = size * 0.35 + 2 + size * 0.28;
  const spacing = size * 0.09;

  const renderFoot = (x: number) => {
    switch (type) {
      case 'round':
        return <circle cx={x} cy={footY + 4} r={4} fill="var(--surface-container-high)" stroke="var(--on-surface-variant)" strokeWidth="0.8" />;
      case 'spike':
        return <polygon points={`${x},${footY} ${x - 4},${footY + 8} ${x + 4},${footY + 8}`} fill="var(--surface-container-high)" stroke="var(--on-surface-variant)" strokeWidth="0.8" />;
      case 'flipper':
        return <ellipse cx={x} cy={footY + 4} rx={5} ry={3} fill="var(--surface-container-high)" stroke="var(--on-surface-variant)" strokeWidth="0.8" />;
      default: // boot
        return <rect x={x - 4} y={footY} width={8} height={7} rx={1} fill="var(--surface-container-high)" stroke="var(--on-surface-variant)" strokeWidth="0.8" />;
    }
  };

  return <g>{renderFoot(cx - spacing)}{renderFoot(cx + spacing)}</g>;
}

export function AgentSVG({ head, body, hands, feet, state, size = 64 }: SVGPartsProps) {
  const animClass = state === 'idle' || state === 'working' ? 'agent-idle'
    : state === 'sleeping' ? 'agent-sleep'
    : state === 'feeding' ? 'agent-feed'
    : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`agent-svg ${animClass}`}
      style={{
        animation: state === 'idle' || state === 'working'
          ? 'idle-bob 2s ease-in-out infinite'
          : state === 'sleeping'
          ? 'sleep-breathe 3s ease-in-out infinite'
          : state === 'feeding'
          ? 'glow-pulse 1.5s ease-in-out infinite'
          : 'none',
      }}
    >
      <Feet type={feet} size={size} />
      <Body type={body} size={size} />
      <Hands type={hands} size={size} />
      <Head type={head} size={size} />
      <Eyes size={size} state={state} />
      
      {/* Z's for sleeping */}
      {state === 'sleeping' && (
        <text
          x={size * 0.7}
          y={size * 0.15}
          fontSize="10"
          fill="var(--on-surface-variant)"
          style={{ animation: 'z-float 2s ease-out infinite', opacity: 0.6 }}
        >
          z
        </text>
      )}

      {/* Working indicator */}
      {state === 'working' && (
        <circle cx={size - 6} cy={6} r={4} fill="var(--success)" style={{ animation: 'glow-pulse 1.5s infinite' }} />
      )}
    </svg>
  );
}

export default AgentSVG;

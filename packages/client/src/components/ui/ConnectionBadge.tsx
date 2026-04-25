import React from 'react';

export function ConnectionBadge({ connected, reconnecting }: { connected: boolean; reconnecting: boolean }) {
  let status = 'connected';
  let color = 'var(--success, #8BAF6A)';
  
  if (reconnecting) {
    status = 'reconnecting...';
    color = 'var(--warning, #E8C468)';
  } else if (!connected) {
    status = 'offline';
    color = 'var(--error, #E68A8A)';
  }

  return (
    <div className="connection-badge">
      <span style={{
        width: '8px',
        height: '8px',
        flex: '0 0 auto',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}`
      }} />
      <span className="connection-badge__label" style={{ color: 'var(--on-surface)' }}>{status}</span>
    </div>
  );
}

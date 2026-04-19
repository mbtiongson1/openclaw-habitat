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
    <div style={{
      position: 'fixed',
      top: 'var(--space-md)',
      left: 'var(--space-md)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'var(--surface-container-high)',
      padding: '4px 12px',
      borderRadius: '0px',
      border: '1px solid var(--outline-variant)',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}`
      }} />
      <span style={{ color: 'var(--on-surface)' }}>{status}</span>
    </div>
  );
}

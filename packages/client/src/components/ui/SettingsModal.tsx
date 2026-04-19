import React, { useState, useEffect } from 'react';
import './SettingsModal.css';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/config/snapshots')
      .then(r => r.json())
      .then(d => setSnapshots(d.snapshots || []))
      .catch(console.error);
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config/snapshots', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create snapshot');
      const r = await fetch('/api/config/snapshots');
      const d = await r.json();
      setSnapshots(d.snapshots || []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (ts: string) => {
    if (!confirm('Are you sure you want to restore this snapshot? Current state will be overwritten.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/config/snapshots/${ts}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restore snapshot');
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="settings-overlay fade-in">
      <div className="settings-modal">
        <header className="settings-modal__header">
          <h2>Habitat Settings</h2>
          <button className="icon-btn" onClick={onClose}>×</button>
        </header>
        <div className="settings-modal__content">
          <h3>Configuration Snapshots</h3>
          <p className="opacity-70 mb-4" style={{ fontSize: '0.85rem' }}>Backup or restore your agents and habitat state.</p>
          
          <button className="btn btn--primary mb-4" onClick={handleCreate} disabled={loading}>
             Create New Snapshot
          </button>

          <div className="snapshot-list">
            {snapshots.length === 0 ? (
              <div className="empty-state">No snapshots found.</div>
            ) : (
              snapshots.map(ts => (
                <div key={ts} className="snapshot-item">
                  <span>{new Date(parseInt(ts, 10)).toLocaleString()}</span>
                  <button className="btn btn--outline" onClick={() => handleRestore(ts)} disabled={loading}>
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

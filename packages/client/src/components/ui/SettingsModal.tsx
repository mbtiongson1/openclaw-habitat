import React, { useState, useEffect } from 'react';
import './SettingsModal.css';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [animationIntensity, setAnimationIntensity] = useState(70);
  const [analyticsRefresh, setAnalyticsRefresh] = useState(1);
  const [gardenDensity, setGardenDensity] = useState(65);

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
          <SettingsSection title="Layout" description="Planned house sizing and room density.">
            <ControlRow label="Planned agent capacity" value="Auto: agent count x 1.6" />
            <ControlRow label="Task room capacity" value="4 tasks per room" />
            <ControlRow label="Garden surround mode" value="Wrap house boundary" />
          </SettingsSection>

          <SettingsSection title="Simulation" description="Runtime-only motion and sprite behavior.">
            <label className="settings-control">
              Animation intensity
              <input type="range" min="0" max="100" value={animationIntensity} onChange={event => setAnimationIntensity(Number(event.target.value))} />
              <span>{animationIntensity}%</span>
            </label>
            <ControlRow label="Reduced motion" value="Uses system preference" />
          </SettingsSection>

          <SettingsSection title="Analytics" description="Historical chart refresh and smoothing.">
            <label className="settings-control">
              Refresh interval
              <input type="number" min="1" max="10" value={analyticsRefresh} onChange={event => setAnalyticsRefresh(Number(event.target.value))} />
              <span>{analyticsRefresh}s</span>
            </label>
            <ControlRow label="History window" value="60 samples" />
            <ControlRow label="Chart smoothing" value="Straight line, low overhead" />
          </SettingsSection>

          <SettingsSection title="Heartbeats" description="Visibility and stale-state thresholds.">
            <ControlRow label="Stale threshold" value="30 seconds" />
            <ControlRow label="Warning threshold" value="10 seconds" />
            <ControlRow label="Visible detail" value="Agent, zone, latency, source" />
          </SettingsSection>

          <SettingsSection title="Commands" description="OpenClaw command surface visibility.">
            <ControlRow label="Session controls" value="Visible" />
            <ControlRow label="Power-user commands" value="Disabled until configured" />
            <ControlRow label="Disabled commands" value="Shown with reason" />
          </SettingsSection>

          <SettingsSection title="Assets" description="Sprite, room texture, and garden detail.">
            <label className="settings-control">
              Garden density
              <input type="range" min="0" max="100" value={gardenDensity} onChange={event => setGardenDensity(Number(event.target.value))} />
              <span>{gardenDensity}%</span>
            </label>
            <ControlRow label="Sprite style" value="Editable SVG parts" />
            <ControlRow label="Room texture detail" value="CSS/SVG surfaces" />
          </SettingsSection>

          <SettingsSection title="Configuration Snapshots" description="Backup or restore your agents and habitat state.">
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
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-section">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="settings-section__controls">
        {children}
      </div>
    </section>
  );
}

function ControlRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-control settings-control--row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

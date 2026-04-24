import React, { useState } from 'react';
import { type GlobalCommandDescriptor, type GlobalCommandGroup } from '@habitat/shared';

interface GlobalCommandRailProps {
  commands: GlobalCommandDescriptor[];
}

const GROUP_LABELS: Record<GlobalCommandGroup, string> = {
  session: 'Session Management',
  model: 'Model Control',
  visibility: 'Visibility',
  power_user: 'Power User',
  thinking: 'Thinking',
};

const GROUP_ORDER: GlobalCommandGroup[] = ['session', 'model', 'visibility', 'power_user', 'thinking'];

interface CommandPreview {
  command: GlobalCommandDescriptor;
  executable: boolean;
  message: string;
}

export function GlobalCommandRail({ commands }: GlobalCommandRailProps) {
  const [preview, setPreview] = useState<CommandPreview | null>(null);
  const [loadingCommandId, setLoadingCommandId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const grouped = GROUP_ORDER
    .map(group => ({
      group,
      commands: commands.filter(command => command.group === group),
    }))
    .filter(section => section.commands.length > 0);

  const openPreview = async (command: GlobalCommandDescriptor) => {
    if (!command.enabled) return;
    setLoadingCommandId(command.id);
    setError(null);
    setCopyState('idle');
    try {
      const response = await fetch(`/api/commands/${encodeURIComponent(command.id)}/preview`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Command preview failed');
      const payload = await response.json() as CommandPreview;
      setPreview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Command preview failed');
    } finally {
      setLoadingCommandId(null);
    }
  };

  const copyCommand = () => {
    if (!preview) return;
    void navigator.clipboard?.writeText(commandText(preview.command));
    setCopyState('copied');
  };

  return (
    <aside className="global-command-rail bg-surface-container-lowest border border-outline-variant/30 p-4 flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-headline uppercase tracking-widest text-outline">OpenClaw</p>
        <h2 className="text-lg font-headline font-bold text-primary">Global Controls</h2>
      </div>

      <div className="flex flex-col gap-4">
        {grouped.map(section => (
          <section key={section.group} className="flex flex-col gap-2">
            <h3 className="text-[11px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">
              {GROUP_LABELS[section.group]}
            </h3>
            <div className="flex flex-col gap-2">
              {section.commands.map(command => (
                <button
                  key={command.id}
                  type="button"
                  className={`text-left border border-outline-variant/30 bg-surface-container-low p-3 transition-colors ${
                    command.enabled ? 'hover:bg-surface-container-high cursor-pointer' : 'opacity-60 cursor-not-allowed'
                  }`}
                  disabled={!command.enabled || loadingCommandId === command.id}
                  onClick={() => openPreview(command)}
                  title={`${command.command}${command.argsHint ? ` ${command.argsHint}` : ''}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-headline text-sm font-bold text-on-surface">{command.label}</span>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-primary">
                      {command.command}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{command.description}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-headline uppercase tracking-widest">
                    <span className="text-outline">{command.sourceLabel}</span>
                    {command.requiresOptIn && <span className="text-tertiary">Requires opt-in</span>}
                    {command.dangerLevel === 'dangerous' && <span className="text-error">Guarded</span>}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {(preview || error) && (
        <section className="border border-outline-variant/30 bg-surface-container-low p-3 flex flex-col gap-3" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">
                Command Preview
              </h3>
              {preview && (
                <code className="mt-1 block text-sm font-headline font-bold text-primary">
                  {commandText(preview.command)}
                </code>
              )}
            </div>
            {preview && (
              <span className={`text-[10px] font-headline uppercase tracking-widest ${preview.executable ? 'text-primary' : 'text-tertiary'}`}>
                {preview.executable ? 'Executable' : 'Preview'}
              </span>
            )}
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          {preview && (
            <>
              <p className="text-xs text-on-surface-variant">{preview.message}</p>
              <button
                type="button"
                className="self-start border border-outline-variant/40 px-3 py-2 text-xs font-headline font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-high"
                onClick={copyCommand}
              >
                {copyState === 'copied' ? 'Copied' : 'Copy Command'}
              </button>
            </>
          )}
        </section>
      )}
    </aside>
  );
}

function commandText(command: GlobalCommandDescriptor): string {
  return `${command.command}${command.argsHint ? ` ${command.argsHint}` : ''}`;
}

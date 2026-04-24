import React from 'react';
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

export function GlobalCommandRail({ commands }: GlobalCommandRailProps) {
  const grouped = GROUP_ORDER
    .map(group => ({
      group,
      commands: commands.filter(command => command.group === group),
    }))
    .filter(section => section.commands.length > 0);

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
                  disabled={!command.enabled}
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
    </aside>
  );
}

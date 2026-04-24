import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GlobalCommandRail } from './GlobalCommandRail';

const commands = [
  {
    id: 'model-status',
    command: '/model status',
    label: 'Model Status',
    group: 'model',
    sourceLabel: 'OpenClaw',
    description: 'Show active model.',
    enabled: true,
    requiresOptIn: false,
    dangerLevel: 'safe',
  },
  {
    id: 'bash',
    command: '/bash',
    label: 'Host Shell',
    group: 'power_user',
    sourceLabel: 'GitHub',
    description: 'Run shell command.',
    enabled: false,
    requiresOptIn: true,
    dangerLevel: 'dangerous',
  },
] as const;

describe('GlobalCommandRail', () => {
  it('groups commands and keeps privileged shell actions disabled', () => {
    render(<GlobalCommandRail commands={[...commands]} />);

    expect(screen.getByText('Model Control')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Model Status/i })).toBeEnabled();

    const bashButton = screen.getByRole('button', { name: /Host Shell/i });
    expect(bashButton).toBeDisabled();
    expect(screen.getByText('Requires opt-in')).toBeInTheDocument();
  });
});

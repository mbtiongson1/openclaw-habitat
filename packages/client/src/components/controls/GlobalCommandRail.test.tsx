import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('groups commands and keeps privileged shell actions disabled', () => {
    render(<GlobalCommandRail commands={[...commands]} />);

    expect(screen.getByText('Model Control')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Model Status/i })).toBeEnabled();

    const bashButton = screen.getByRole('button', { name: /Host Shell/i });
    expect(bashButton).toBeDisabled();
    expect(screen.getByText('Requires opt-in')).toBeInTheDocument();
  });

  it('opens an actionable command preview for enabled controls', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/api/commands/model-status/preview');
      expect(init?.method).toBe('POST');
      return Response.json({
        command: commands[0],
        executable: false,
        message: 'Preview ready for /model status',
      });
    }));

    render(<GlobalCommandRail commands={[...commands]} />);
    fireEvent.click(screen.getByRole('button', { name: /Model Status/i }));

    await waitFor(() => expect(screen.getByText('Command Preview')).toBeInTheDocument());
    expect(screen.getAllByText('/model status').length).toBeGreaterThan(1);
    expect(screen.getByText('Preview ready for /model status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy command/i })).toBeEnabled();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsModal } from './SettingsModal';

describe('SettingsModal', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders expanded habitat control sections alongside snapshots', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ snapshots: [] })));

    render(<SettingsModal onClose={vi.fn()} />);

    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Simulation')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Heartbeats')).toBeInTheDocument();
    expect(screen.getByText('Commands')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Configuration Snapshots')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('No snapshots found.')).toBeInTheDocument());
  });
});

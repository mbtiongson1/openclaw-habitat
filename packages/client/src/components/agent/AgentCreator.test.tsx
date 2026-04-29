import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentCreator } from './AgentCreator';

describe('AgentCreator', () => {
  it('renders sprite variant choices and updates the live preview', () => {
    render(<AgentCreator onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByRole('img', { name: /agent sprite preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose head star/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose body robed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose tool scanner/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /choose head star/i }));
    fireEvent.click(screen.getByRole('button', { name: /choose body robed/i }));

    expect(screen.getByText('Head: star')).toBeInTheDocument();
    expect(screen.getByText('Body: robed')).toBeInTheDocument();
  });
});

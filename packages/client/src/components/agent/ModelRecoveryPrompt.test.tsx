import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelRecoveryPrompt } from './ModelRecoveryPrompt';
import { AgentEventLog } from './AgentEventLog';
import { type RecoveryResponse, type ModelOperationEvent } from '@habitat/shared';

describe('ModelRecoveryPrompt', () => {
  const recoveryState: RecoveryResponse = {
    result: 'recovery_required',
    reasonCode: 'quota_exhausted',
    message: 'Quota hit',
    requestedModelId: 'gpt-4o',
    recoveryOptions: [
      { action: 'use_fallback', label: 'Use fallback', description: 'Desc', priority: 1, modelId: 'mistral-nemo:12b' },
      { action: 'retry_check', label: 'Retry', description: 'Desc', priority: 2 },
    ],
  };

  it('renders fallback as the primary recovery action', () => {
    render(
      <ModelRecoveryPrompt
        recoveryState={recoveryState}
        onUseFallback={() => {}}
        onRetry={() => {}}
        onDownload={() => {}}
      />
    );

    const primaryButton = screen.getByRole('button', { name: /use fallback/i });
    expect(primaryButton).toHaveAttribute('data-priority', 'primary');
  });
});

describe('AgentEventLog', () => {
  const events: ModelOperationEvent[] = [
    {
      id: '1',
      timestamp: 1000,
      eventType: 'manual_switch',
      severity: 'info',
      source: 'manual_action',
      message: 'Older event',
    },
    {
      id: '2',
      timestamp: 2000,
      eventType: 'quota_exhausted',
      severity: 'error',
      source: 'runtime_probe',
      message: 'Newer event',
    },
  ];

  it('renders recent events in reverse chronological order', () => {
    render(<AgentEventLog events={events} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Newer event');
    expect(listItems[1]).toHaveTextContent('Older event');
  });
});

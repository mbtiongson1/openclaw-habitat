import React from 'react';
import { type RecoveryResponse, type RecoveryOption } from '@habitat/shared';

interface Props {
  recoveryState: RecoveryResponse;
  onUseFallback: (modelId: string) => void;
  onRetry: () => void;
  onDownload: (modelId: string) => void;
}

export function ModelRecoveryPrompt({ recoveryState, onUseFallback, onRetry, onDownload }: Props) {
  const sortedOptions = [...recoveryState.recoveryOptions].sort((a, b) => a.priority - b.priority);
  const primary = sortedOptions[0];
  const secondary = sortedOptions.slice(1);

  const handleOption = (option: RecoveryOption) => {
    switch (option.action) {
      case 'use_fallback':
        if (option.modelId) onUseFallback(option.modelId);
        break;
      case 'retry_check':
        onRetry();
        break;
      case 'download_recommended_local_model':
        if (option.modelId) onDownload(option.modelId);
        break;
    }
  };

  return (
    <div className="model-recovery-prompt">
      <div className="recovery-header">
        <span className="warning-icon">⚠️</span>
        <h3>{recoveryState.message}</h3>
        <p className="reason-code">Error code: {recoveryState.reasonCode}</p>
      </div>

      <div className="recovery-actions">
        {primary && (
          <button
            className="btn-primary"
            data-priority="primary"
            onClick={() => handleOption(primary)}
          >
            {primary.label}
            <small>{primary.description}</small>
          </button>
        )}

        {secondary.map((option) => (
          <button
            key={option.action}
            className="btn-secondary"
            onClick={() => handleOption(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

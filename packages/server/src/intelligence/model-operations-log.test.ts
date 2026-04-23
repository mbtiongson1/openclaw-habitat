import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelOperationsLogService } from './ModelOperationsLogService.js';
import { type ModelOperationEvent } from '@habitat/shared';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function makeEvent(id: number): ModelOperationEvent {
  return {
    id: `event-${id}`,
    timestamp: Date.now() + id,
    agentId: 'agent-1',
    eventType: 'manual_switch',
    severity: 'info',
    source: 'manual_action',
    message: `Event ${id}`,
  };
}

test('operations log survives reload with bounded retention', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'habitat-log-test-'));
  try {
    const logService = new ModelOperationsLogService(tempDir);
    
    // Add more than the limit (100 per agent, 500 global)
    for (let i = 0; i < 120; i++) {
      logService.append(makeEvent(i));
    }
    
    assert.equal(logService.listAgentEvents('agent-1').length, 100);
    
    // Reload
    const reloaded = new ModelOperationsLogService(tempDir);
    assert.equal(reloaded.listAgentEvents('agent-1').length, 100);
    assert.equal(reloaded.listAgentEvents('agent-1')[0].id, 'event-119'); // Should be reverse chronological
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

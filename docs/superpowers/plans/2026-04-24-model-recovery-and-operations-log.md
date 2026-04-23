# Model Recovery and Operations Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make model usability truthful and enforceable, add structured recovery for unusable models, and persist an auditable model-operations log in both per-agent and global UI surfaces.

**Architecture:** Add a backend-owned usability/recovery layer in the server, then wire all manual and automatic model transitions through it. Persist operational events in a dedicated log service and expose them through REST and websocket updates. Split the client intelligence panel so recovery prompts and recent-events rendering are isolated from the data hook.

**Tech Stack:** TypeScript, Express, ws, React, Vite, node:test/tsx, Vitest + Testing Library for new client tests

---

## File Structure

### Server

- Modify: `packages/shared/src/types.ts`
  - Add `ModelUsability`, `RecoveryOption`, `RecoveryResponse`, `ModelOperationEvent`, and websocket message types.
- Modify: `packages/shared/src/schemas.ts`
  - Add schemas for recovery responses and log filters.
- Create: `packages/server/src/intelligence/ModelUsabilityService.ts`
  - Single source of truth for `usable`, `quota_exhausted`, `not_installed`, `runtime_unreachable`, and `temporarily_unavailable`.
- Create: `packages/server/src/intelligence/ModelOperationsLogService.ts`
  - Append-only bounded log with disk persistence and query helpers.
- Modify: `packages/server/src/intelligence/adapters.ts`
  - Fix Ollama reachability and keep installed-but-unreachable models visible without marking them actionable.
- Modify: `packages/server/src/intelligence/AgentIntelligenceService.ts`
  - Route manual switch attempts and automatic fallback through usability/recovery and log events.
- Modify: `packages/server/src/api/routes.ts`
  - Return `recovery_required` payloads and add event-log endpoints.
- Modify: `packages/server/src/index.ts`
  - Instantiate/wire new services and websocket events.
- Modify: `packages/server/src/intelligence/intelligence.test.ts`
  - Expand server regression coverage.
- Create: `packages/server/src/intelligence/model-operations-log.test.ts`
  - Focused persistence/retention tests.

### Client

- Modify: `packages/client/package.json`
  - Add client test dependencies and scripts.
- Create: `packages/client/src/test/setup.ts`
  - Testing Library setup.
- Create: `packages/client/vitest.config.ts`
  - Vitest config for jsdom.
- Modify: `packages/client/src/hooks/useAgentIntelligence.ts`
  - Handle `recovery_required`, log fetches, prompt state, and post-install refreshes.
- Create: `packages/client/src/components/agent/ModelRecoveryPrompt.tsx`
  - Dedicated recovery-action sheet/modal.
- Create: `packages/client/src/components/agent/AgentEventLog.tsx`
  - Recent-events list used in agent panel and global log view.
- Modify: `packages/client/src/components/agent/AgentPage.tsx`
  - Disable unusable direct actions, mount recovery prompt, mount recent events.
- Modify: `packages/client/src/components/agent/AgentPage.css`
  - Recovery prompt + recent-events styling.
- Create: `packages/client/src/components/agent/ModelRecoveryPrompt.test.tsx`
  - Prompt interaction coverage.
- Create: `packages/client/src/hooks/useAgentIntelligence.test.ts`
  - Hook behavior coverage for recovery and empty-query refresh.

### Docs

- Modify: `design/agent_intelligence_panel/ARCHITECTURE.md`
  - Align the architecture note with the new usability/recovery/log contract after code lands.

---

### Task 1: Make Model Usability Truthful and Testable

**Files:**
- Create: `packages/server/src/intelligence/ModelUsabilityService.ts`
- Modify: `packages/server/src/intelligence/adapters.ts`
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/server/src/intelligence/intelligence.test.ts`

- [ ] **Step 1: Write the failing server tests for unusable-model classification**

```ts
test('ollama-installed model is runtime_unreachable when runtime probe fails', async () => {
  const adapter = new OllamaAdapter('http://127.0.0.1:1');
  const [model] = await adapter.listInstalledModels();
  assert.equal(model.usability.status, 'runtime_unreachable');
  assert.equal(model.availability.reachable, false);
});

test('cloud model is usable when installed, reachable, and quota not exhausted', () => {
  const service = new ModelUsabilityService();
  const result = service.evaluate({
    origin: 'cloud',
    installed: true,
    reachable: true,
    quotaExhausted: false,
  });
  assert.equal(result.status, 'usable');
});
```

- [ ] **Step 2: Run the server tests to confirm the gap**

Run: `npm run test -w packages/server`

Expected: FAIL with at least one assertion showing local models are still treated as reachable/usable when the runtime probe fails.

- [ ] **Step 3: Add shared usability types and implement the new service**

```ts
export interface ModelUsability {
  status:
    | 'usable'
    | 'temporarily_unavailable'
    | 'quota_exhausted'
    | 'not_installed'
    | 'runtime_unreachable';
  reasonCode: string;
  message: string;
  checkedAt: number;
}

export class ModelUsabilityService {
  evaluate(input: {
    origin: 'cloud' | 'local';
    installed: boolean;
    reachable: boolean;
    quotaExhausted?: boolean;
  }): ModelUsability {
    if (!input.installed) return failure('not_installed', 'Model is known but not installed locally');
    if (!input.reachable) return failure('runtime_unreachable', 'Model runtime is unreachable');
    if (input.quotaExhausted) return failure('quota_exhausted', 'Cloud quota is exhausted for this model');
    return success();
  }
}
```

- [ ] **Step 4: Fix the Ollama adapter to stop forcing reachability**

```ts
const modelReachable = reachable;

return Array.from(this.installed).map(id =>
  this.mapLibraryModel(this.findLibraryEntry(id), modelReachable, true)
);
```

- [ ] **Step 5: Re-run the server tests**

Run: `npm run test -w packages/server`

Expected: PASS for the new usability tests and no regression in existing server tests.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/types.ts \
  packages/server/src/intelligence/ModelUsabilityService.ts \
  packages/server/src/intelligence/adapters.ts \
  packages/server/src/intelligence/intelligence.test.ts
git commit -m "fix: add truthful model usability classification"
```

---

### Task 2: Reject Unusable Manual Switches and Return Recovery Payloads

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/schemas.ts`
- Modify: `packages/server/src/intelligence/AgentIntelligenceService.ts`
- Modify: `packages/server/src/api/routes.ts`
- Modify: `packages/server/src/intelligence/intelligence.test.ts`

- [ ] **Step 1: Write failing tests for manual switch rejection**

```ts
test('setActiveModel returns recovery_required for runtime_unreachable model', () => {
  const result = intelligenceService.setActiveModel('agent-1', 'llama3.1:8b');
  assert.equal(result.result, 'recovery_required');
  assert.equal(result.reasonCode, 'runtime_unreachable');
  assert.equal(result.recoveryOptions[0].action, 'use_fallback');
});

test('active-model route returns 409 for recovery_required payload', async () => {
  const response = await request(app)
    .patch('/api/agents/agent-1/active-model')
    .send({ modelId: 'llama3.1:8b' });

  assert.equal(response.status, 409);
  assert.equal(response.body.result, 'recovery_required');
});
```

- [ ] **Step 2: Run server tests and confirm failure**

Run: `npm run test -w packages/server`

Expected: FAIL because `setActiveModel()` currently returns a full snapshot instead of a recovery payload for unusable models.

- [ ] **Step 3: Add recovery types and branch manual-switch behavior**

```ts
export interface RecoveryOption {
  action: 'use_fallback' | 'retry_check' | 'download_recommended_local_model';
  label: string;
  description: string;
  priority: number;
  modelId?: string;
}

export interface RecoveryResponse {
  result: 'recovery_required';
  reasonCode: string;
  message: string;
  requestedModelId: string;
  recoveryOptions: RecoveryOption[];
}
```

```ts
if (model.usability.status !== 'usable') {
  return {
    result: 'recovery_required',
    reasonCode: model.usability.reasonCode,
    message: model.usability.message,
    requestedModelId: model.id,
    recoveryOptions: this.buildRecoveryOptions(agentId, model),
  };
}
```

- [ ] **Step 4: Update the route contract**

```ts
const result = intelligenceService.setActiveModel(req.params.id, parsed.data.modelId);

if ('result' in result && result.result === 'recovery_required') {
  return res.status(409).json(result);
}

return res.json(result);
```

- [ ] **Step 5: Re-run server tests**

Run: `npm run test -w packages/server`

Expected: PASS with new route and service behavior covered.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/types.ts \
  packages/shared/src/schemas.ts \
  packages/server/src/intelligence/AgentIntelligenceService.ts \
  packages/server/src/api/routes.ts \
  packages/server/src/intelligence/intelligence.test.ts
git commit -m "fix: return structured recovery for unusable manual switches"
```

---

### Task 3: Add Automatic Fallback and Persistent Operations Logging

**Files:**
- Create: `packages/server/src/intelligence/ModelOperationsLogService.ts`
- Create: `packages/server/src/intelligence/model-operations-log.test.ts`
- Modify: `packages/server/src/intelligence/AgentIntelligenceService.ts`
- Modify: `packages/server/src/config/ConfigStore.ts`
- Modify: `packages/server/src/index.ts`
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Write failing tests for fallback logging and persistence**

```ts
test('automatic fallback logs a warning event and switches the agent', () => {
  const result = intelligenceService.handleModelFailure('agent-1', 'gpt-4o', 'quota_exhausted');
  assert.equal(result.switchedToModelId, 'mistral-nemo:12b');
  assert.equal(logService.listAgentEvents('agent-1')[0].eventType, 'automatic_fallback_switch');
});

test('operations log survives reload with bounded retention', () => {
  for (let i = 0; i < 120; i++) logService.append(makeEvent(i));
  const reloaded = new ModelOperationsLogService(tempDir);
  assert.equal(reloaded.listAgentEvents('agent-1').length, 100);
});
```

- [ ] **Step 2: Run server tests and confirm failure**

Run: `npm run test -w packages/server`

Expected: FAIL because there is no log service, no persistence, and no automatic fallback handler entrypoint.

- [ ] **Step 3: Implement the log service with bounded retention**

```ts
export class ModelOperationsLogService {
  append(event: ModelOperationEvent): void {
    this.state.agent[event.agentId] = [event, ...(this.state.agent[event.agentId] ?? [])].slice(0, 100);
    this.state.global = [event, ...this.state.global].slice(0, 500);
    this.save();
  }
}
```

- [ ] **Step 4: Add explicit automatic-fallback handling**

```ts
handleModelFailure(agentId: string, currentModelId: string, reasonCode: string) {
  const fallback = this.resolveModelForIntent(agentId, 'fallback');
  if (fallback.usability.status === 'usable') {
    this.telemetryService.setActiveModel(agentId, fallback);
    this.logService.append({
      eventType: 'automatic_fallback_switch',
      severity: 'warning',
      source: 'automatic_recovery',
      fromModelId: currentModelId,
      toModelId: fallback.id,
      reasonCode,
      message: `Switched ${agentId} to fallback model`,
      ...
    });
    return { switchedToModelId: fallback.id };
  }
  ...
}
```

- [ ] **Step 5: Wire websocket emission from the new log service**

```ts
operationsLogService.on('event_logged', (event) => {
  bridge.broadcast({ type: 'model_operation_logged', payload: event });
});
```

- [ ] **Step 6: Re-run server tests**

Run: `npm run test -w packages/server`

Expected: PASS for fallback handling, event persistence, and retention behavior.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/intelligence/ModelOperationsLogService.ts \
  packages/server/src/intelligence/model-operations-log.test.ts \
  packages/server/src/intelligence/AgentIntelligenceService.ts \
  packages/server/src/config/ConfigStore.ts \
  packages/server/src/index.ts \
  packages/shared/src/types.ts
git commit -m "feat: add automatic fallback logging and operations persistence"
```

---

### Task 4: Expose Event Log APIs and Recovery Events

**Files:**
- Modify: `packages/server/src/api/routes.ts`
- Modify: `packages/server/src/bridge/BridgeServer.ts`
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/server/src/intelligence/intelligence.test.ts`

- [ ] **Step 1: Write failing tests for event-log endpoints**

```ts
test('agent model-events endpoint returns recent agent events', async () => {
  const response = await request(app).get('/api/agents/agent-1/model-events');
  assert.equal(response.status, 200);
  assert.equal(response.body.events[0].agentId, 'agent-1');
});

test('global model-operations endpoint supports severity filters', async () => {
  const response = await request(app).get('/api/model-operations?severity=error');
  assert.equal(response.status, 200);
  assert.ok(response.body.events.every((event: any) => event.severity === 'error'));
});
```

- [ ] **Step 2: Run server tests and confirm failure**

Run: `npm run test -w packages/server`

Expected: FAIL because these endpoints and websocket message types do not exist yet.

- [ ] **Step 3: Add the endpoints and websocket contracts**

```ts
router.get('/agents/:id/model-events', (req, res) => {
  res.json({ events: operationsLogService.listAgentEvents(req.params.id) });
});

router.get('/model-operations', (req, res) => {
  res.json({ events: operationsLogService.listGlobalEvents(req.query) });
});
```

```ts
export type WSMessageType =
  | 'model_operation_logged'
  | 'model_recovery_required'
  | 'model_usability_changed'
  | ...;
```

- [ ] **Step 4: Re-run server tests**

Run: `npm run test -w packages/server`

Expected: PASS with API surface covered.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/api/routes.ts \
  packages/server/src/bridge/BridgeServer.ts \
  packages/shared/src/types.ts \
  packages/server/src/intelligence/intelligence.test.ts
git commit -m "feat: expose model operations log APIs and websocket events"
```

---

### Task 5: Add Client Test Harness and Recovery-Aware Hook State

**Files:**
- Modify: `packages/client/package.json`
- Create: `packages/client/vitest.config.ts`
- Create: `packages/client/src/test/setup.ts`
- Modify: `packages/client/src/hooks/useAgentIntelligence.ts`
- Create: `packages/client/src/hooks/useAgentIntelligence.test.ts`

- [ ] **Step 1: Add failing hook tests for recovery payloads and empty-query refresh**

```ts
it('stores recovery prompt state when active-model API returns 409 recovery_required', async () => {
  server.use(
    http.patch('/api/agents/agent-1/active-model', () =>
      HttpResponse.json({ result: 'recovery_required', reasonCode: 'quota_exhausted', recoveryOptions: [...] }, { status: 409 })
    )
  );

  const { result } = renderHook(() => useAgentIntelligence('agent-1', wsStub));
  await act(async () => { await result.current.setActiveModel('gpt-4o'); });
  expect(result.current.recoveryState?.reasonCode).toBe('quota_exhausted');
});

it('re-runs local search after pull completion even when the query is empty', async () => {
  ...
});
```

- [ ] **Step 2: Add the client test toolchain**

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^26.0.0"
  }
}
```

```ts
// packages/client/vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 3: Run the client tests to confirm the hook gap**

Run: `npm run test -w packages/client`

Expected: FAIL because the hook has no recovery-state handling and skips empty-query refresh on completed pulls.

- [ ] **Step 4: Implement recovery-aware hook state**

```ts
const [recoveryState, setRecoveryState] = useState<RecoveryResponse | null>(null);

if (response.status === 409) {
  const payload = await response.json() as RecoveryResponse;
  setRecoveryState(payload);
  setSwitchingModelId(null);
  return;
}

if (msg.payload.status === 'completed') {
  void refresh();
  void searchLocalModels(lastSearchQueryRef.current ?? '');
}
```

- [ ] **Step 5: Re-run client tests**

Run: `npm run test -w packages/client`

Expected: PASS for recovery-state and empty-query-refresh coverage.

- [ ] **Step 6: Commit**

```bash
git add packages/client/package.json \
  packages/client/vitest.config.ts \
  packages/client/src/test/setup.ts \
  packages/client/src/hooks/useAgentIntelligence.ts \
  packages/client/src/hooks/useAgentIntelligence.test.ts
git commit -m "test: add client recovery hook coverage"
```

---

### Task 6: Build Recovery Prompt, Recent Events, and Global Operations UI

**Files:**
- Create: `packages/client/src/components/agent/ModelRecoveryPrompt.tsx`
- Create: `packages/client/src/components/agent/AgentEventLog.tsx`
- Create: `packages/client/src/components/agent/ModelRecoveryPrompt.test.tsx`
- Modify: `packages/client/src/components/agent/AgentPage.tsx`
- Modify: `packages/client/src/components/agent/AgentPage.css`
- Modify: `design/agent_intelligence_panel/ARCHITECTURE.md`

- [ ] **Step 1: Write failing component tests for prompt priority and recent events**

```tsx
it('renders fallback as the primary recovery action', async () => {
  render(
    <ModelRecoveryPrompt
      recoveryState={{
        reasonCode: 'quota_exhausted',
        recoveryOptions: [
          { action: 'use_fallback', label: 'Use configured fallback', priority: 1 },
          { action: 'retry_check', label: 'Retry availability check', priority: 2 },
        ],
      }}
    />
  );

  expect(screen.getByRole('button', { name: /use configured fallback/i })).toHaveAttribute('data-priority', 'primary');
});

it('renders recent events in reverse chronological order', () => {
  render(<AgentEventLog events={[olderEvent, newerEvent]} />);
  expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('quota exhausted');
});
```

- [ ] **Step 2: Run client tests to confirm failure**

Run: `npm run test -w packages/client`

Expected: FAIL because the recovery prompt and event log components do not exist yet.

- [ ] **Step 3: Create isolated UI components**

```tsx
export function ModelRecoveryPrompt({ recoveryState, onUseFallback, onRetry, onDownload }: Props) {
  const [primary, ...secondary] = [...recoveryState.recoveryOptions].sort((a, b) => a.priority - b.priority);
  return (
    <div className="model-recovery-prompt">
      <h3>{recoveryState.message}</h3>
      <button data-priority="primary" onClick={() => handle(primary)}>{primary.label}</button>
      {secondary.map(option => <button key={option.action} onClick={() => handle(option)}>{option.label}</button>)}
    </div>
  );
}
```

```tsx
export function AgentEventLog({ events }: { events: ModelOperationEvent[] }) {
  return (
    <ul className="agent-event-log">
      {events.map(event => (
        <li key={event.id}>
          <strong>{event.message}</strong>
          <span>{event.timestamp}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Integrate the new UI into `AgentPage`**

```tsx
{recoveryState && (
  <ModelRecoveryPrompt
    recoveryState={recoveryState}
    onUseFallback={handleUseFallback}
    onRetry={handleRetryRecovery}
    onDownload={handleDownloadRecoveryModel}
  />
)}

<AgentEventLog events={snapshot?.recentEvents ?? []} />
```

- [ ] **Step 5: Update the architecture note to match the delivered code**

```md
- `PATCH /api/agents/:id/active-model`
  - returns `409 recovery_required` for unusable targets
- `GET /api/agents/:id/model-events`
  - returns recent per-agent operations log entries
```

- [ ] **Step 6: Re-run client tests**

Run: `npm run test -w packages/client`

Expected: PASS for prompt priority and event-log rendering.

- [ ] **Step 7: Run the full verification suite**

Run: `npm run test -w packages/server && npm run test -w packages/client && npm run build`

Expected:
- server tests: PASS
- client tests: PASS
- workspace build: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/components/agent/ModelRecoveryPrompt.tsx \
  packages/client/src/components/agent/AgentEventLog.tsx \
  packages/client/src/components/agent/ModelRecoveryPrompt.test.tsx \
  packages/client/src/components/agent/AgentPage.tsx \
  packages/client/src/components/agent/AgentPage.css \
  design/agent_intelligence_panel/ARCHITECTURE.md
git commit -m "feat: add model recovery prompt and operations log UI"
```

---

## Self-Review Checklist

- Spec coverage
  - Truthful usability classification: Task 1
  - Structured recovery response: Task 2
  - Automatic fallback + logging: Task 3
  - Log endpoints/events: Task 4
  - Client recovery state + stale-search regression: Task 5
  - Recovery prompt + recent/global log UI: Task 6
- Placeholder scan
  - No `TBD`, `TODO`, or deferred implementation placeholders remain.
- Type consistency
  - `ModelUsability`, `RecoveryResponse`, and `ModelOperationEvent` are introduced in shared types before later tasks depend on them.


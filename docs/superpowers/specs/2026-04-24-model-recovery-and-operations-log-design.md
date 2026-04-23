# Model Recovery and Operations Log Design

## Summary

This design fixes the current intelligence-panel correctness gaps around unusable models and adds an auditable recovery flow for quota exhaustion, runtime failures, and local model installation. The core rule is that the backend becomes the source of truth for model usability, while the client renders recovery options and event history from structured server responses.

The design covers:

- truthful model usability classification
- safe handling of manual model switches and active-run failures
- recovery prompts with prioritized actions
- persistent per-agent and global operations logs
- local download/install flows tied into recovery

## Goals

- Prevent users from manually switching an agent onto a model that cannot actually run.
- Accurately distinguish between usable, unavailable, not installed, runtime unreachable, and quota-exhausted model states.
- Automatically recover active runs by switching to fallback models when possible.
- Present a recovery prompt for manual switch attempts that target unusable models.
- Log all operationally significant model events durably so they can be reviewed later per-agent and globally.

## Non-Goals

- A full background job orchestration system for retries, queues, or workflow replays.
- Logging every telemetry change or websocket event.
- Multi-choice install wizards in the first recovery prompt.
- Provider-specific UI branches beyond the existing provider-agnostic metadata model.

## Current Problems

### 1. Manual switches ignore usability

The server currently accepts any known model ID during `PATCH /api/agents/:id/active-model`, even if that model is offline, not installed, or unreachable. The client also renders `Use` and `Switch` actions for all catalog entries.

### 2. Local model reachability is reported incorrectly

The Ollama adapter currently marks installed local models as reachable even if the runtime is down, so the UI cannot trust the availability state it is showing.

### 3. Recovery is implicit instead of explicit

The current system has fallback ideas in strategy and recommendation logic, but no explicit recovery contract for failed manual switches or active-run failures.

### 4. There is no durable operations history

There is currently no persistent audit trail for model failures, automatic recoveries, strategy changes, downloads, or retries.

## Design

## 1. Backend-Owned Model Usability

Introduce an explicit model usability layer in the server. Every model action should pass through a single decision path that classifies the target model into one of these states:

- `usable`
- `temporarily_unavailable`
- `quota_exhausted`
- `not_installed`
- `runtime_unreachable`

The backend owns this classification. The client must not infer actionability from `installed` and `reachable` booleans alone.

### Usability rules

- A model is `usable` only if it is installed when required, reachable through its runtime/provider, and not blocked by quota exhaustion.
- A local model may be installed but still `runtime_unreachable`.
- A cloud model may be known and reachable in principle, but still `quota_exhausted`.
- A known local model that is absent from the host is `not_installed`.

### API representation

Extend model status payloads so each model includes:

- `usability.status`
- `usability.reasonCode`
- `usability.message`
- `usability.checkedAt`
- `usability.recommendedRecovery?`

The existing availability fields can remain for compatibility, but action routing must key off `usability`.

## 2. Execution and Recovery Behavior

Automatic execution failures and manual operator actions behave differently.

### Automatic execution path

When an active run fails because the selected model becomes unusable:

1. The server classifies the failure reason.
2. If the configured fallback model is `usable`, the server switches the agent to fallback immediately.
3. The active run continues on the fallback model.
4. A recovery event is logged.
5. The client receives a non-blocking notice plus the corresponding log/event updates.

If the fallback is also unusable:

1. The server records a failed recovery attempt.
2. The run transitions into an explicit blocked/error state.
3. The client shows a blocking error state instead of pretending the agent recovered.

### Manual switch path

When a user manually switches or explicitly tests a model:

- If the target model is `usable`, the switch succeeds normally.
- If the target model is not `usable`, the server must reject the direct switch and return a structured recovery response rather than silently changing intent.

This avoids cases where a user thinks they selected one model but the system quietly used another.

## 3. Recovery Prompt Contract

The recovery prompt is backend-driven. The client opens it from a structured server response rather than hardcoding recovery logic locally.

### Recovery response shape

When a manual switch cannot proceed, the API should return something like:

- `result: "recovery_required"`
- `reasonCode`
- `message`
- `requestedModelId`
- `recoveryOptions[]`

Each recovery option includes:

- `action`
- `label`
- `description`
- `priority`
- `modelId?`
- `jobId?`

### Recovery prompt priority

For quota/API exhaustion on a cloud model, prioritize:

1. `use_fallback`
2. `retry_check`
3. `download_recommended_local_model`

For local runtime failure:

1. `use_fallback` if usable
2. `retry_check`
3. `download_recommended_local_model` only if a different installable local model is a valid recovery path

### Prompt behavior

- Show the actual failure reason in operator-friendly text.
- Keep the first prompt narrow: one primary recovery path, one secondary retry path, and at most one recommended download option.
- Do not present a large browsing menu in the first recovery sheet.
- If the user wants deeper selection, that belongs in a follow-up browse flow, not the initial interruption.

## 4. Recommended Download Flow

When the prompt offers `download_recommended_local_model`, it should recommend one local model, not many.

### Recommendation constraints

The recommended download must be:

- local
- installable
- aligned with the current slot intent (`planning`, `quick_task`, or `fallback`)
- compatible with the current recovery situation

### Download flow

1. User chooses `download_recommended_local_model`.
2. The existing local pull path starts a job.
3. The recovery prompt transitions into a progress state instead of disappearing.
4. On job completion, the server re-checks usability.
5. If the model is now usable, the UI offers `Switch now`.
6. If it is installed but still unusable, the event is logged and the model remains visible as installed-but-unavailable.

This keeps the operator in a single recovery path without losing context.

## 5. Persistent Operations Log

Add a dedicated `ModelOperationsLogService` on the server.

### Events to log

Only operationally significant events are included in v1:

- manual model switches
- automatic fallback switches
- quota/API-budget exhaustion failures
- model unavailable/runtime unreachable failures
- retry actions
- local model download start
- local model download progress completion/failure
- install completion
- strategy changes

Routine telemetry changes and recommendation reshuffles are not logged.

### Event schema

Each event contains:

- `id`
- `timestamp`
- `scope`
- `agentId?`
- `eventType`
- `severity`
- `source`
- `fromModelId?`
- `toModelId?`
- `reasonCode?`
- `message`
- `metadata`

Recommended enums:

- `scope`: `agent`, `global`, `agent_and_global`
- `severity`: `info`, `warning`, `error`
- `source`: `manual_action`, `automatic_recovery`, `runtime_probe`, `download_job`, `strategy_update`

### Persistence and retention

Persist the log to disk outside the preferences blob, using ConfigStore-adjacent storage.

Retention defaults:

- per-agent recent events: last 100
- global operations log: last 500

On every append:

- write the event
- prune oldest excess entries
- keep startup reload deterministic

The log must survive bridge restarts.

## 6. UI Surfaces

### Per-agent panel

Add a `Recent Events` section to the intelligence panel showing the latest few events for that agent. Each entry should show:

- timestamp
- severity
- event message
- model transition details when relevant

### Global operations view

Add a dedicated global operations log surface, either as:

- a new analytics subsection, or
- a top-level model/runtime log page

It should support basic filtering by:

- severity
- event type
- agent

### Real-time updates

New log entries should be streamed live over websocket so the UI updates immediately after:

- a fallback switch
- a failed switch
- a retry
- a local pull event
- a strategy change

## 7. Endpoint and Event Changes

### REST

Keep existing endpoints but change behavior where needed:

- `PATCH /api/agents/:id/active-model`
  - returns normal success for usable targets
  - returns structured `recovery_required` for unusable targets

Add:

- `GET /api/agents/:id/model-events`
  - returns recent events for a specific agent
- `GET /api/model-operations`
  - returns the global operations log with filters

Existing local model search/pull endpoints remain but must participate in event logging and recovery flows.

### Websocket

Add:

- `model_recovery_required`
- `model_operation_logged`
- `model_usability_changed`

`model_usability_changed` should only fire when runtime probing meaningfully changes model actionability.

## 8. Testing Strategy

### Server tests

Add coverage for:

- unusable models cannot be manually activated
- active-run failures auto-fallback only when fallback is usable
- fallback failure leads to blocked/error state
- Ollama reachability is reported truthfully
- `recovery_required` responses are ranked correctly
- event logs are persisted, pruned, and reloaded correctly

### Client tests

Add coverage for:

- unavailable models do not behave like normal `Use` actions
- the recovery prompt appears with the right primary action
- the local download flow transitions through progress, success, and failure states
- recent events update in the panel
- global log updates live
- empty-query local search refreshes after install

### Regression tests

Explicitly capture the current defects:

- false-positive local model reachability
- manual switching onto unavailable models
- stale post-install local search state

## 9. Rollout Order

Implement in this order:

1. truthful usability classification
2. manual-switch rejection and structured recovery response
3. automatic fallback handling for active runs
4. persistent operations log service
5. per-agent recent events and global log UI
6. prompt polish and follow-up UX

This order removes dangerous behavior first and adds richer recovery UX afterward.

## Open Decisions Resolved

- Active runs auto-fallback when possible.
- Manual switches use a recovery prompt rather than silently switching intent.
- Quota/API exhaustion prompts prioritize fallback first, then download.
- Event logging exists both per-agent and globally.
- Logs are persisted to disk with bounded retention.
- Only operationally significant events are logged in v1.

## Acceptance Criteria

- A manual switch to an unusable model never succeeds silently.
- A local model is never shown as reachable when its runtime is down.
- A quota or availability failure produces a structured recovery path.
- Automatic fallback events are visible and logged.
- Operators can inspect recent per-agent events and a global operations log after restart.

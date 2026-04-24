# Agent Intelligence Panel Architecture

## Overview
The per-agent intelligence panel combines REST bootstrapping with websocket updates.

- REST provides the initial snapshot for a clicked agent.
- Websockets stream telemetry, strategy, recommendation, quick-switch, catalog, and local-pull updates.
- Mock mode simulates the same contracts used by the live bridge so the UI stays identical across development and production wiring.

## Data Sources
- `ModelCatalogService`
  - Merges static cloud provider metadata with Ollama-backed local model metadata.
  - Owns local pull progress events and catalog refreshes.
- `AgentStrategyService`
  - Persists per-agent `planning`, `quickTask`, and `fallback` slots in `ConfigStore.preferences`.
- `ModelQuickSwitchService`
  - Persists favorites, last-used, and most-used state per agent.
- `ModelRecommendationService`
  - Scores catalog entries using availability, favorite boost, recency, usage count, and strategy-slot match.
- `AgentTelemetryService`
  - Maintains near-real-time token, context, work-time, and compute metrics.
- `RuntimeMetricsService`
  - Reports host runtime CPU and RAM metrics for the current Habitat bridge process.
- `ModelUsabilityService`
  - Truthful source of truth for model actionability (usable, quota exhausted, runtime unreachable, etc.).
- `ModelOperationsLogService`
  - Append-only bounded log with disk persistence for operationally significant model events.

## REST API
- `GET /api/agents/:id/intelligence`
  - Returns `AgentIntelligenceSnapshot`.
- `PATCH /api/agents/:id/model-strategy`
  - Persists the 3-slot model strategy.
- `PATCH /api/agents/:id/active-model`
  - Manually switches the active model and updates quick-switch state.
  - Returns `409 recovery_required` for unusable targets.
- `POST /api/agents/:id/model-favorites/:modelId`
  - Adds a favorite model.
- `DELETE /api/agents/:id/model-favorites/:modelId`
  - Removes a favorite model.
- `GET /api/agents/:id/model-events`
  - Returns recent per-agent model operation log entries.
- `GET /api/models/catalog`
  - Returns the merged model catalog.
- `GET /api/models/local/search?q=...`
  - Returns Ollama-first search results for installable local models.
- `POST /api/models/local/pull`
  - Starts a simulated local pull job and emits progress over websocket.
- `GET /api/models/runtime`
  - Returns host runtime resource metrics.
- `GET /api/model-operations`
  - Global model operations log with severity and type filtering.

## Websocket Events
- `agent_intelligence_init`
  - Initial intelligence snapshots sent on websocket connect.
- `agent_telemetry_update`
  - Real-time token, context, active-model, and compute updates.
- `agent_strategy_update`
  - Strategy changes from the UI or future automation.
- `model_catalog_update`
  - Catalog refresh after local pulls or runtime refresh.
- `model_recommendations_update`
  - Updated recommended model strip for a specific agent.
- `model_quick_switch_update`
  - Favorites, recents, and most-used updates for a specific agent.
- `local_model_pull_progress`
  - Pull progress for local-model add flows.
- `model_operation_logged`
  - Live stream of operationally significant model events (fallback, manual switch, failures).
- `model_recovery_required`
  - Non-blocking recovery notice for active-run failures.
- `model_usability_changed`
  - Notifies client of runtime probe status changes.

## Mock vs Live Bridge
- Mock mode
  - `MockGateway` changes agent state/stats and calls `AgentIntelligenceService.simulateAgentCycle`.
  - This drives active model changes, token growth, context changes, and quick-switch recency updates without a live Openclaw runtime.
- Live bridge
  - `OpenclawTelemetryAdapter` exists as the normalization boundary for future raw Openclaw telemetry events.
  - The client contract does not need to change when live Openclaw events replace simulated ones.

## UI Loading and Pending States
- Panel open
  - Uses skeleton cards until `GET /api/agents/:id/intelligence` resolves.
- Manual switch
  - Keeps a per-model pending state until REST + websocket state converge.
- Local search
  - Uses inline spinner while querying `/api/models/local/search`.
- Local pull
  - Shows per-model progress bars driven by `local_model_pull_progress`.

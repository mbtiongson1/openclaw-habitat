---
name: habitat
description: Manage and interact with the OpenClaw Digital Sanctuary (Habitat)
version: 0.5.0
requirements:
  - openclaw-gateway
---

# Digital Sanctuary (Habitat) Skill

This skill allows AI agents to interact with the Digital Sanctuary via the Bridge API.

## Features

- **Agent Management**: Create, list, and view agents.
- **Feeding Loop**: Feed agents different tiers of "Data Snacks" based on task completion quality.
- **Config Management**: Backup and restore habitat configuration via snapshots.
- **Zone Routing**: Understand the spatial states of agents (Lounge = Working, Kitchen = Feeding, Nursery = Idle, Garden = Social).

## API Endpoints

The API is served locally (typically on port 3001).

### Agents
- `GET /api/agents`: List all agents
- `GET /api/agents/:id`: Get a single agent by ID
- `POST /api/agents`: Create a new agent
  - Payload: `{ name, personality, zone, svgParts }`
- `POST /api/agents/:id/feed`: Feed an agent
  - Payload: `{ snackId }`
- `GET /api/agents/:id/feeding-log`: Get feeding history (markdown format)
- `POST /api/agents/:id/chat`: Post a chat message to an agent

### Configuration
- `GET /api/config/snapshots`: List available snapshots
- `POST /api/config/snapshots`: Create a new configuration snapshot
- `POST /api/config/snapshots/:timestamp/restore`: Restore a previous snapshot

## Instructions for Agents

1. **When completing a task**: Evaluate your execution quality (0-10) and request a corresponding "Data Snack" via `POST /api/agents/:id/feed`.
2. **When needing rest**: Route your state to `idle` so the Sanctuary renders you in the Nursery.
3. **When collaborating**: Route your state to `social` to appear in the Garden.

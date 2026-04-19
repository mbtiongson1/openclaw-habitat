# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-04-20

### Added
- Initial project scaffold (monorepo with client/server/shared packages)
- Shared types, constants, and Zod schemas
- MockGateway simulating 1-5 agents with state changes, stat jitter, task completions
- AgentStateManager with router pattern (state → zone assignment)
- FeedingEngine with critique scoring (0-10), snack tiers, markdown logging per agent
- BridgeServer (WebSocket) for real-time PWA communication
- ConfigStore with snapshot/restore system
- REST API: agents CRUD, feeding, chat stub, config snapshots
- AetherLang Karpathy Skill integration (skills/contrario/)
- GitHub Actions: CI, Release, Docker, Skills validation
- Semantic versioning with update_version.py script

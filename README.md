# openclaw-habitat
A Tamagotchi-style mobile interface for Openclaw AI agents. Agents appear as digital pets in a 2D sanctuary with four zones: Lounge (active tasks), Kitchen (rewards/feeding), Nursery (idle/sleep), Garden (social). Real-time Docker status syncs movement. Clicking agents opens chat + status dashboards. Warm isometric design reduces monitoring fatigue.

## Features
- **Sanctuary Hub**: 2D isometric view of your agent "swarm".
- **Real-time Sync**: Live updates via WebSockets and Openclaw Gateway.
- **Feeding Loop**: Reward your agents with "Data Snacks" for performance boosts.
- **Integrated Skills**: Includes the **Karpathy Skill** (AetherLang Omega) for advanced agent node execution (plan, code_interpreter, critique, etc.).

## Setup
1. `npm install`
2. `npm run dev:mock` (for demo) or `npm run dev` (with live Openclaw)

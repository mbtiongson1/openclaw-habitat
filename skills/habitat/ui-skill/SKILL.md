---
name: digital-sanctuary-ui
description: Preview and interaction shortcuts for the Digital Sanctuary Mobile PWA
version: 1.0.0
author: Antigravity
metadata:
  skill_type: local_ui_launcher
  preview_url: http://localhost:5173
  bridge_url: http://localhost:3001
---

# Digital Sanctuary UI Skill

This skill provides shortcuts to view and interact with the Digital Sanctuary frontend.

## Prototype Access

To view the mobile app prototype:
1. Ensure the development environment is running: `npm run dev:mock`
2. Open the following URL in your browser: [http://localhost:5173](http://localhost:5173)

## UI Zones

The sanctuary is divided into four main zones:
- **Lounge (Hub)**: Default view. Displays agents currently working on tasks.
- **Kitchen**: Feeding area. Interact with agents to reward them with "Data Snacks".
- **Nursery**: Rest area. Idle or sleeping agents reside here.
- **Garden**: Social area. Agents interacting with each other appear here.

## Navigation

Use the **Bottom Navigation Bar** to switch between views.
- **Hub Icon**: Go to the main Sanctuary Lounge.
- **Kitchen Icon**: Access the feeding interface.
- **Nursery Icon**: Check on resting agents.
- **Garden Icon**: View social interactions.

## Shortcuts for AI Agents

When asked to "see the app" or "check the prototype":
1. Verify the client is running on port 5173.
2. Use the `browser_subagent` to capture a screenshot or interact with the page.
3. Report the visual state to the user.

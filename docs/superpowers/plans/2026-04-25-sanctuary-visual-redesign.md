# Sanctuary Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the OpenClaw Sanctuary UI into a stable, natural habitat simulation while preserving existing functionality.

**Architecture:** Keep the redesign client-first and component-scoped. Stabilize `houseLayout.ts` as the layout source of truth, add Sanctuary popups and richer room assets inside `components/sanctuary`, make sprite identity reusable across Sanctuary/Agents/Creator, and keep Analytics history in bounded client state fed by existing endpoints.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing CSS/Tailwind styles, inline SVG/CSS assets, existing REST/websocket hooks.

---

### Task 1: Stable House Capacity and Sanctuary Popups

**Files:**
- Modify: `packages/client/src/components/sanctuary/houseLayout.ts`
- Modify: `packages/client/src/components/sanctuary/houseLayout.test.ts`
- Modify: `packages/client/src/components/sanctuary/SanctuaryHub.tsx`
- Modify: `packages/client/src/components/sanctuary/SanctuaryHub.test.tsx`
- Modify: `packages/client/src/components/sanctuary/SanctuaryHub.css`

- [ ] **Step 1: Write failing layout tests**

Add tests proving live task count does not change room count for the same planned capacity, and adding agents increases bedroom/office sizing.

- [ ] **Step 2: Run layout tests and verify failure**

Run: `npm run test -w packages/client -- houseLayout`
Expected: FAIL because current room count follows live task pressure.

- [ ] **Step 3: Implement planned-capacity layout**

Use agent count and optional configured task capacity to compute planned house size. Live tasks may affect badges/capacity overflow, not room count.

- [ ] **Step 4: Write failing Sanctuary interaction tests**

Add tests proving sprite click opens an agent popover, tasks metric opens task popup, heartbeat metric opens heartbeat popup, and agents metric calls tab navigation instead of opening a detail page.

- [ ] **Step 5: Run Sanctuary tests and verify failure**

Run: `npm run test -w packages/client -- SanctuaryHub`
Expected: FAIL because current metric boxes are not buttons and sprite click calls `onSelectAgent`.

- [ ] **Step 6: Implement Sanctuary popups and richer room visuals**

Add local popup state for selected agent, tasks, and heartbeats. Replace metric divs with buttons. Add room-specific fixture classes and garden surround treatment.

- [ ] **Step 7: Verify and commit**

Run: `npm run test -w packages/client -- houseLayout SanctuaryHub`
Commit: `feat: redesign sanctuary layout interactions`

### Task 2: Sprite-First Agents and Creator Customization

**Files:**
- Modify: `packages/client/src/components/agent/AgentsListView.tsx`
- Modify: `packages/client/src/components/agent/AgentsListView.test.tsx`
- Modify: `packages/client/src/components/agent/AgentCreator.tsx`
- Modify: `packages/client/src/components/agent/AgentCreator.css`
- Test: add or extend `packages/client/src/components/agent/AgentCreator.test.tsx`

- [ ] **Step 1: Write failing Agents page test**

Assert each agent card renders a sprite preview with an accessible label instead of initials-only identity.

- [ ] **Step 2: Run test and verify failure**

Run: `npm run test -w packages/client -- AgentsListView`
Expected: FAIL because cards currently render initials.

- [ ] **Step 3: Implement sprite-first agent cards**

Use existing `AgentSVG` with each agent's `svgParts`, softer panels, and less border-heavy metric grouping.

- [ ] **Step 4: Write failing creator customization test**

Assert the creator renders body/head/face/tool variant choices and updates the preview when a variant is selected.

- [ ] **Step 5: Run test and verify failure**

Run: `npm run test -w packages/client -- AgentCreator`
Expected: FAIL because creator currently uses select menus and a single generic preview.

- [ ] **Step 6: Implement creator picker controls**

Replace the Appearance select grid with variant buttons/swatches and a visual picker layout.

- [ ] **Step 7: Verify and commit**

Run: `npm run test -w packages/client -- AgentsListView AgentCreator`
Commit: `feat: add sprite-first agent identity`

### Task 3: Historical Analytics and Habitat Settings

**Files:**
- Modify: `packages/client/src/components/analytics/AnalyticsView.tsx`
- Modify: `packages/client/src/components/analytics/AnalyticsView.test.tsx`
- Modify: `packages/client/src/components/ui/SettingsModal.tsx`
- Modify: `packages/client/src/components/ui/SettingsModal.css`
- Test: add or extend `packages/client/src/components/ui/SettingsModal.test.tsx`

- [ ] **Step 1: Write failing Analytics history test**

Use fake timers to prove Analytics fetches repeatedly, keeps a bounded history, and renders chart labels.

- [ ] **Step 2: Run test and verify failure**

Run: `npm run test -w packages/client -- AnalyticsView`
Expected: FAIL because Analytics fetches only once and has no charts.

- [ ] **Step 3: Implement chart-led Analytics**

Add a 1-second polling loop, bounded samples, inline SVG sparkline charts, and softer borderless chart panels.

- [ ] **Step 4: Write failing Settings test**

Assert the modal renders Layout, Simulation, Analytics, Heartbeats, Commands, Assets, and Configuration Snapshots sections.

- [ ] **Step 5: Run test and verify failure**

Run: `npm run test -w packages/client -- SettingsModal`
Expected: FAIL because only snapshots exist.

- [ ] **Step 6: Implement expanded Habitat Settings**

Add runtime-only controls for capacity, garden density, animation intensity, analytics refresh, heartbeat thresholds, command visibility, and asset detail.

- [ ] **Step 7: Verify and commit**

Run: `npm run test -w packages/client -- AnalyticsView SettingsModal`
Commit: `feat: add habitat analytics and settings`

### Task 4: App Shell, Zones Spacing, and Final Verification

**Files:**
- Modify: `packages/client/src/App.tsx`
- Modify: `packages/client/src/styles/global.css`
- Modify: `packages/client/src/components/sanctuary/ZonesView.tsx`
- Modify: `packages/client/src/components/sanctuary/ZonesView.test.tsx`

- [ ] **Step 1: Write failing app-shell test or update existing navigation expectations**

Assert the brand control has `aria-label="Go to Sanctuary"` and activates the Sanctuary tab.

- [ ] **Step 2: Implement clear home control and spacing polish**

Replace ambiguous grid icon with a home control. Tune `.app-main`, bottom nav spacing, and Zones margins.

- [ ] **Step 3: Run full client/server verification**

Run:
- `npm run test -w packages/client`
- `npm run test -w packages/server`
- `npm run build`

- [ ] **Step 4: Browser smoke review**

Start dev server and inspect Sanctuary, Agents, Zones, Analytics, Agent Creator, and Settings at desktop and mobile widths.

- [ ] **Step 5: Commit final polish**

Commit: `fix: polish sanctuary visual redesign`

# Sanctuary Visual Redesign Design

## Summary

This design turns the current OpenClaw Sanctuary UI from a functional blueprint prototype into a more natural habitat simulation interface. The current functionality stays intact, but the presentation, interaction model, and supporting settings are redesigned around a home-like 2D sanctuary with a surrounding garden, sprite-first agent identity, modal/popup interactions, and historical analytics.

The redesign addresses the annotated browser feedback from April 25, 2026:

- agent clicks should open a popup, not a full page takeover
- bedroom, kitchen, office, task rooms, and garden should look like recognizable places
- the garden should feel like the outdoor environment around the house
- house sizing should be planned from capacity and agent count, not reflow every moment from live task churn
- metrics should be clickable entry points
- agents should show sprites throughout the UI
- analytics should use refreshed historical charts, not only large numbers and bars
- habitat settings should expose meaningful controls
- spacing and margins should feel calmer and less cramped

## Goals

- Preserve the existing Sanctuary, Agents, Zones, Analytics, and Settings functionality.
- Replace the harsh grid-and-border presentation with a warmer simulation UI that still feels operational.
- Make the Sanctuary floor plan look like a house with rooms and an outdoor garden.
- Use stable house sizing that changes intentionally when capacity changes, not continuously as websocket task counts change.
- Make sprite identity visible in the Sanctuary, Agents page, and agent creation flow.
- Add popup behavior for agent details, tasks, and heartbeat summaries.
- Add historical chart panels that refresh every second in Analytics.
- Expand Habitat Settings with controls that are meaningful for OpenClaw operations and the simulation UI.

## Non-Goals

- A full real-time game engine.
- Persistent server-side storage for generated sprite art in this pass.
- Photorealistic interior rendering.
- Replacing the current agent/task/heartbeat APIs.
- Adding arbitrary command execution beyond the existing global command descriptor shell.

## Design Direction

The target is "Habitat Simulation UI": a top-down home-and-yard view with operational controls integrated into the environment. It should feel like a managed digital house rather than a dashboard pasted over a floor plan.

The visual language should use:

- warm off-white walls and subtly varied floor textures
- natural greens for the garden and active states
- soft shadows and lower-contrast dividers instead of heavy borders
- furniture and room props as editable SVG/CSS assets, with optional PNG-style texture layers for floors and surfaces
- enough whitespace around panels to avoid the current cramped mobile and desktop views

Cards should be used for repeated items and modals only. Primary page sections should feel like unframed layouts or soft panels, not nested cards.

## Sanctuary View

### Stable House Sizing

The house layout should be based on a planned capacity expression rather than live task pressure alone.

Use a stable sizing model:

```text
plannedAgentCapacity = max(4, ceil(agentCount * 1.6))
plannedTaskCapacity = max(6, ceil(agentCount * 2.5), configuredTaskCapacity)
houseSizeScore = plannedAgentCapacity + ceil(plannedTaskCapacity / 4)
bedroomAreaWeight = 1 + ceil(plannedAgentCapacity * 0.35)
kitchenAreaWeight = 1 + ceil(plannedAgentCapacity * 0.25)
officeAreaWeight = 1 + ceil(plannedTaskCapacity * 0.20)
taskRoomCount = clamp(ceil(plannedTaskCapacity / roomTaskCapacity), 1, 6)
```

Live task counts may affect badges, queue density, and subtle activity states, but they should not constantly add/remove rooms or cause the house to jump around. Room count should change only when planned capacity changes, such as after adding agents or adjusting Habitat Settings.

### Floor Plan Composition

The house should have three conceptual areas:

- living/rest wing: bedroom and future rest rooms
- work wing: office plus task rooms
- utility wing: kitchen and feeding area

The garden should be outside the house boundary and should wrap around or visually surround the house. It should not be a single bottom strip. It can include paths, shrubs, planters, stones, grass texture, and outdoor work/rest spots.

### Room Assets

Each room type should have recognizable props:

- Bedroom: bed, pillow, blanket, rug, small side table, warm floor texture.
- Kitchen: counter, drawers, cabinet wall, table, circular/oval eating surface, tile or laminate floor texture.
- Office: desk, monitor, chair, wall shelf, task board.
- Task rooms: workbench/table, queue trays, tool board, task surface.
- Garden: grass texture, path, planters, shrubs, stepping stones, outdoor table/bench.

Assets should be editable repo-native components where practical. SVG/React components are preferred for furniture and props. Small PNG-style textures may be added only when they make surfaces feel less flat and remain local, versioned assets.

### Metrics Interactions

The Sanctuary summary metrics should become large, explicit buttons:

- Agents count opens the Agents page.
- Tasks count opens a task queue popup.
- Heartbeats count opens a heartbeat panel popup.

Each metric should have accessible labels and hover/focus states that make it obvious it is interactive.

### Agent Interaction

Clicking an agent sprite in the Sanctuary should open a compact agent popover near the clicked sprite. It should not open the full Agent page.

The popover should show:

- sprite and name
- current room/zone and state
- model strategy summary
- current task or heartbeat status
- quick actions such as "Open full details", "Send chat", or "Feed" if available

The full Agent page can still exist, but it should be reached through an explicit action in the popover or from the Agents tab.

## App Shell

The top-left grid icon should no longer be ambiguous. Replace it with an explicit Sanctuary/Home control:

- use a home-like icon or label pairing
- add `aria-label="Go to Sanctuary"`
- clicking it switches to the Sanctuary tab and scrolls to the top

Navigation should feel less cramped on mobile:

- increase content breathing room above and below page headings
- reduce oversized headings when viewport height is limited
- avoid bottom nav covering important content
- ensure floating action button does not obscure room labels, charts, or lists

## Agents Page

Agent cards should be sprite-first rather than initials-first.

Each agent card should include:

- editable sprite preview
- name, state, room/zone
- CPU, memory, task, snack metrics
- personality and model strategy
- recovery/event summary
- clear "Open details" action

The visual structure should be less bordered and more spacious. Use soft panels, row grouping, and larger gaps instead of many hard table-like lines.

## Agent Creator and Sprite Customization

The agent creator should become a sprite customization flow inspired by game character pickers.

It should support:

- body color variants
- head/accessory variants
- face variants
- tool/prop variants
- live preview
- selection swatches/buttons

The implementation should remain editable and deterministic. Generate variants from SVG/React data structures first. If generated PNG previews are added later, they should be treated as optional visual assets, not the source of truth.

The creator should still collect name and personality, but the first step should communicate agent identity visually rather than showing a single generic preview.

## Analytics View

Analytics should become historical and chart-led.

Add 1-second refreshing client-side history buffers for:

- runtime CPU
- runtime memory
- task active/queued/completed counts
- heartbeat stale count or risk
- agent population/activity if useful

Chart behavior:

- refresh every second while the Analytics tab is mounted
- keep a bounded rolling window, such as the last 60 samples
- render lightweight inline SVG charts or simple canvas charts without adding a heavy charting dependency unless needed
- show current values as labels next to charts, not as the only visual

The view should remove unnecessary borders. Use section spacing, subtle backgrounds, and chart fills/lines to create structure.

## Settings Modal

Habitat Settings should become a real control surface. Keep configuration snapshots, but add these sections:

- Layout: planned agent capacity, task room capacity, garden surround mode, room density.
- Simulation: animation intensity, sprite scale, idle movement, reduced motion.
- Analytics: refresh interval, history window, chart smoothing.
- Heartbeats: stale threshold, warning threshold, visible heartbeat detail.
- Commands: show/hide command groups, power-user command visibility, disabled-command display.
- Assets: sprite style, room texture detail, garden density.

Settings can be local UI settings in this pass unless an existing API already supports persistence. Any setting without persistence should be clearly treated as runtime-only in code, not presented as saved server configuration.

## Zones View

The Zones page should get more generous margins and a calmer task-flow layout.

It should:

- use wider spacing and softer section boundaries
- keep task rows readable on mobile
- avoid huge clipped headings
- make each zone feel like a task queue panel instead of a dense dashboard card

No new zone API is required for this pass.

## Data Flow

The redesign should reuse existing data sources:

- `useAgents` for agent state and stats
- `useSanctuaryOperations` for tasks and heartbeats
- current analytics endpoints for health, runtime, model operations, zone summaries, and commands
- current websocket updates for live changes

New client-only state may be added for:

- active Sanctuary popup type
- selected agent popover
- rolling analytics samples
- sprite customization choices
- runtime-only habitat UI settings

## Accessibility

- All clickable metrics must be buttons with labels.
- Agent sprites must have accessible names and popup controls.
- Popups and modals must trap focus where appropriate or at least return focus on close.
- Sprite customization swatches need text labels, not color-only meaning.
- Reduced motion settings should disable or soften sprite movement and chart animation.

## Testing

Add or update tests for:

- stable house sizing does not change room count from live task churn alone
- planned capacity increases bedroom, kitchen, and office sizes
- agent sprite click opens a popover instead of the full Agent page
- metric clicks route to Agents or open Tasks/Heartbeats popups
- Agents page renders sprite previews
- Agent Creator renders sprite customization variants and updates preview
- Analytics keeps a bounded rolling history and refreshes samples
- Settings renders the new Habitat Settings sections
- Zones spacing/layout smoke coverage where practical

Run before completion:

- `npm run test -w packages/client`
- `npm run test -w packages/server`
- `npm run build`
- browser smoke check on Sanctuary, Agents, Zones, Analytics, Agent Creator, and Settings at desktop and mobile widths

## Implementation Notes

This should be implemented as a major visual redesign branch, not as small patches to the previous integrated branch. Keep the existing branch `ux/sanctuary-integrated` as the stable checkpoint and do the redesign in `ux/sanctuary-visual-redesign`.

Recommended implementation order:

1. stabilize layout sizing model and Sanctuary popup interactions
2. add richer room/garden assets and visual treatment
3. make Agents and Agent Creator sprite-first
4. convert Analytics to chart-led history view
5. expand Habitat Settings
6. tune Zones spacing and app-shell navigation
7. run full tests and visual smoke review

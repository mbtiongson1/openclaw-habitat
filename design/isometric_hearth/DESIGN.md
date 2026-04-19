```markdown
# Design System Document: The Architectural Sanctuary

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Architect’s Blueprint"**

This design system is a sophisticated dialogue between the nostalgic precision of high-fidelity pixel art and the breathless clarity of modern editorial design. We are moving away from the "app-like" genericism of rounded buttons and flat cards. Instead, we treat the screen as a physical site—a structural environment where elements are built, not just placed.

The aesthetic utilizes "Organic Brutalism": the rigidity of 0px border radii and architectural lines softened by a warm, domestic palette of mossy greens and sun-bleached woods. By blending 'Nano Banana' inspired high-contrast sprites with expansive white space, we create a "House Sanctuary" that feels both playful and premium. We break the grid through intentional layering, where isometric sprites overlap clean typographic blocks, bridging the gap between a 2D game world and a high-end architectural digest.

---

## 2. Colors: Tonal Domesticity
Our palette avoids the sterile whites of tech. We use `background: #fdf9ee` as our canvas—a warm, paper-like foundation.

### The "No-Line" Rule
To maintain a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.** We define boundaries through structural shifts in tone.
- **Surface Hierarchy:** Use the `surface-container` tiers to define "rooms" or functional zones. 
- **Nesting:** Place a `surface-container-highest` element inside a `surface-container-low` zone to create focus. This tonal shift acts as a "floor change," indicating a transition in the UI without a single line being drawn.

### Signature Textures & Gradients
While the UI is clean, CTAs must feel "built." Use a subtle vertical gradient from `primary` (#334f2b) to `primary_container` (#4a6741) to give buttons a weighted, three-dimensional presence. For "Nano Banana" energy, use `secondary` (#934b19) sparingly as a high-contrast accent—reminiscent of polished mahogany or terra cotta.

### Glassmorphism
For floating overlays (modals or tooltips), use a semi-transparent `surface` with a heavy backdrop-blur (12px–20px). This simulates "frosted glass panels," allowing the isometric greenery of the "Sanctuary" to peak through while maintaining legibility.

---

## 3. Typography: Tech-Meets-Home
Typography is the scaffolding of the system. We pair the geometric, technical edge of **Space Grotesk** with the humanist, approachable nature of **Manrope**.

- **Display & Headlines (Space Grotesk):** These should feel like blueprints. The high x-height and technical terminals provide an "architectural" feel. Use `display-lg` for heroic moments, often overlapping with isometric sprites to break the vertical flow.
- **Body & Labels (Manrope):** This is our "homey" touch. Manrope is highly legible and warm, perfect for descriptions of house upgrades or sanctuary stats.
- **The Contrast Rule:** Always set headlines in `on_surface` (#1c1c15) for maximum "ink-on-paper" contrast against the warm background.

---

## 4. Elevation & Depth: Structural Layering
We reject the standard "drop shadow." Depth in this system is achieved through **Tonal Layering** and **Ambient Occlusion.**

- **The Layering Principle:** Treat the UI as a series of stacked architectural plates. 
    - *Base:* `surface`
    - *Furniture/Cards:* `surface_container_low`
    - *Active Interactive Elements:* `surface_container_highest`
- **Ambient Shadows:** Only when an object must "float" (like a drag-and-drop sprite), use an extra-diffused shadow. The color must be a tinted `on_surface` at 6% opacity, with a blur value of at least 24px.
- **The "Ghost Border" Fallback:** If a layout feels too bleed-heavy, use a "Ghost Border"—the `outline_variant` (#c3c8bd) at **15% opacity**. This provides a whisper of a boundary without breaking the "No-Line" rule.

---

## 5. Components

### Buttons (Architectural Blocks)
- **Primary:** Rectangular (0px radius). Background is the `primary` to `primary_container` gradient. Text is `on_primary` (#ffffff) in `label-md` uppercase.
- **Secondary:** `surface_container_highest` with a `primary` Ghost Border. 
- **The "Step" Interaction:** On hover, the button should not grow; it should shift 2px up and 2px left, with a 2px `on_surface` solid offset shadow appearing behind it, mimicking a tactile pixel-art "press."

### Cards & Sanctuary Slots
- **Rule:** No borders. Cards are defined by `surface_container_low`. 
- **Header:** Use a `surface_variant` header bar to separate title from content.
- **Spacing:** Use aggressive padding (24px+) to allow the "homey" atmosphere to breathe.

### Input Fields
- Flat rectangles using `surface_container_highest`. 
- Instead of a highlight border on focus, use a 2px solid bottom bar of `secondary`. This feels like a structural "shelf" for the text.

### Progress Bars (The Growth Meter)
- Representing gamified "Sanctuary" progress.
- Track: `surface_container_high`.
- Fill: `primary` (Moss Green).
- **Detail:** Add a 1px vertical "pixel tick" every 10% to reference the isometric sprite aesthetic.

### Tooltips
- Rich tooltips only. Background: `surface` (90% opacity) with backdrop-blur. 
- Use the `tertiary` (#6f3a00) for "Key Value" text to bring in that warm, wooden highlight.

---

## 6. Do’s and Don’ts

### Do:
- **Overlap Sprites:** Let isometric pixel art (trees, furniture, walls) break the boundaries of containers. This makes the UI feel like a window into a world, not just a dashboard.
- **Use Intentional Asymmetry:** If a text block is on the left, let a sprite "sit" on the right edge of the screen, partially cut off, to create a sense of a larger world.
- **Respect the 0px Radius:** Every corner must be sharp. If you need a "softer" feel, use a stepped pixel corner (2px x 2px cuts) manually in the asset.

### Don't:
- **Don't use 100% Black:** Always use `on_surface` (#1c1c15) for text and lines to keep the "warmth" intact.
- **Don't use standard icons:** Wherever possible, replace functional icons (Home, Settings, User) with high-contrast, pixel-art "Nano Banana" style sprites.
- **Don't use Divider Lines:** If you feel the need to separate content, increase the vertical margin or shift the background tone. Lines are a failure of the layout's structural integrity.

### Accessibility Note:
While we utilize tonal shifts, ensure the contrast between `surface` and `surface_container` tiers meets WCAG AA standards for non-text contrast where it defines functional boundaries. Typography must always remain in high-contrast `on_surface` or `primary` tones.```
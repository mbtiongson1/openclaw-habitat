# Design System Strategy: The Digital Sanctuary

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **The Digital Sanctuary**. 

While traditional AI management tools feel cold, sterile, and overly "utilitarian," this system reimagines the dashboard as a living, breathing ecosystem—a digital home where high-tech utility meets the tactile comfort of a life-simulation game. We are moving away from the "SaaS template" look. Instead of rigid grids, we embrace **Organic Asymmetry**. 

By utilizing overlapping "islands" of content, exaggerated roundedness, and a depth-first layout strategy, we create a UI that feels "squishy," approachable, and premium. It’s not just a tool; it’s a residence for digital intelligence.

## 2. Colors: The Pastel Tech Palette
The palette is rooted in soft, nature-inspired pastels, balanced by sophisticated "Twilight" neutrals to ensure the UI feels high-end rather than juvenile.

*   **Primary (Mint Green - `#0e6848`):** Represents growth and vitality. Use `primary_container` (`#9deec4`) for large interactive surfaces to keep the UI "light."
*   **Secondary (Lavender - `#585979`):** Provides a calm, meditative contrast. Use this for secondary actions and "evening" mode states.
*   **Tertiary (Buttery Yellow - `#655c1c`):** Used sparingly for "delight" moments—status updates, notifications, or a "sunshine" effect on agent profiles.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning. 
Boundaries must be defined through background color shifts or tonal transitions. To separate a sidebar from a main feed, place a `surface_container_low` (`#f2f1ec`) element against the `background` (`#f8f6f2`). Use white space as a structural element, not a line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of "Frosted Glass" tiles.
*   **Base:** `surface` (`#f8f6f2`)
*   **Mid-Level Sectioning:** `surface_container_low`
*   **Interactive Cards:** `surface_container_lowest` (Pure `#ffffff`) to create a "lifted" effect.

### The "Glass & Gradient" Rule
To elevate the "Kawaii" aesthetic into "High-End Tech," use glassmorphism for floating panels (e.g., Modals or Command Bars).
*   **Formula:** `surface_container_lowest` at 70% opacity + `backdrop-blur: 24px`.
*   **Signature Textures:** Apply a subtle linear gradient from `primary` to `primary_container` on main CTAs to give them a 3D, "touchable" soul.

## 3. Typography: Warm Precision
We pair **Plus Jakarta Sans** (Display) with **Be Vietnam Pro** (Body) to strike a balance between geometric modernism and friendly legibility.

*   **Display (Plus Jakarta Sans):** Large, bold, and expressive. Used for Agent Names and major Dashboard headers. The wide apertures of this font feel "open" and "honest."
*   **Body & Titles (Be Vietnam Pro):** A highly legible sans-serif with a warm, humanist touch. It ensures that complex AI logs or instructions feel conversational and easy to digest.
*   **Hierarchy Note:** Use aggressive scale jumps. A `display-lg` (3.5rem) title next to `body-md` text creates a sophisticated, editorial contrast that breaks the monotony of standard app layouts.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and ambient light, mimicking the soft shadows of a clay-render 3D environment.

*   **The Layering Principle:** Instead of shadows, use "Surface Nests." An agent’s status chip (`tertiary_container`) should sit directly on a `surface_container_lowest` card. The color shift provides enough contrast for the eye to perceive depth.
*   **Ambient Shadows:** For floating elements (like a "Add Agent" FAB), use an extra-diffused shadow:
    *   *Shadow:* `0px 20px 40px rgba(46, 47, 45, 0.06)`. 
    *   The shadow should be a low-opacity tint of `on_surface`, never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use `outline_variant` at **15% opacity**. It should be felt, not seen.

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`round-full`). Gradient of `primary_dim` to `primary`. White text (`on_primary`).
*   **Secondary:** Pill-shaped. `secondary_container` background with `on_secondary_container` text. No border.
*   **Interaction:** On hover, buttons should "squish" (a slight scale down to 0.98 and a subtle increase in shadow spread).

### Cards & Lists
*   **No Dividers:** Forbid the use of `hr` lines. Use 24px - 32px of vertical white space to separate items.
*   **The "Island" Card:** Cards use `round-lg` (2rem) or `round-xl` (3rem). Content inside should be padded generously (at least 32px) to maintain the "cozy" feel.

### Input Fields
*   **Style:** Background-filled using `surface_container_high`. 
*   **Shape:** `round-md` (1.5rem). 
*   **Focus State:** A 2px "Ghost Border" of `primary` at 30% opacity and a subtle glow.

### Agent "Habitat" Cards (Custom Component)
Special containers for AI agents that use a subtle background pattern (dots or soft waves) in `outline_variant` at 5% opacity. These cards act as the "Home" for each AI, featuring a high-quality 3D avatar that overlaps the top-left edge of the card, breaking the bounding box.

### Tooltips
*   **Style:** `secondary` background with `round-sm` (0.5rem). Use a small "beak" to point to the element. The lavender tone makes help text feel like a "gentle whisper" rather than a system warning.

## 6. Do's and Don'ts

### Do:
*   **Use Intentional Asymmetry:** Let some cards be wider than others. Let 3D icons "peak" out of their containers.
*   **Embrace the "Squish":** Use high rounding values (`round-xl`) for almost everything.
*   **Prioritize Breathing Room:** If a layout feels "busy," add 16px of padding. Then add 16px more.

### Don't:
*   **Don't use Dark Mode Defaults:** This system is built for "The Digital Sanctuary." If a dark mode is needed, use `secondary_dim` as the base, not pure black.
*   **Don't use 1px Lines:** No dividers, no thin borders. Let the colors do the work.
*   **Don't use sharp corners:** Even a 4px radius is too sharp. Minimum radius is `round-sm` (0.5rem).
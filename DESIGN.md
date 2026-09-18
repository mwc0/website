---
name: matthew.quest
description: A desktop of draggable terminal windows for browser games and small utilities
colors:
  phosphor-green: "#00cc00"
  ink: "#0a0b0a"
  panel: "#131513"
  panel-deep: "#101210"
  well: "#0d0f0d"
  bar-focus: "#161a17"
  text: "#eef2ef"
  text-dim: "#8b968f"
  text-faint: "#78817b"
  border: "rgba(255, 255, 255, 0.09)"
  border-strong: "rgba(255, 255, 255, 0.18)"
  warn: "#e2c14c"
  danger: "#ff6b5e"
  accent-ink: "#06110a"
  warn-ink: "#06110a"
typography:
  display:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "clamp(30px, 4.6vw, 50px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "14px"
    fontWeight: 500
  body:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.02em"
  micro:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "8px"
  lg: "14px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.phosphor-green}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "13px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "13px 20px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
    padding: "32px"
  input:
    backgroundColor: "{colors.well}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  nav-tab:
    rounded: "{rounded.pill}"
    padding: "4px 14px"
---

# Design System: matthew.quest

## Overview

**Creative North Star: "The Desktop Utility"**

Every surface on matthew.quest is a window on a desktop, not a page in a document. Games, tools, and the hero terminal live inside `.console` panels with a title bar, drag handle, and resize corners; the games and tools pages are both explicitly desktops you open icons onto. Even where a panel is pinned in place (the hero terminal), it keeps the console chrome so the metaphor reads consistently whether or not that instance actually moves.

The voice is utilitarian first: the terminal look is a byproduct of clarity and function, not a costume laid over an ordinary site. One typeface, IBM Plex Mono, carries every role from the 50px hero title down to an 11px hint, because a desktop utility doesn't switch fonts to seem friendlier. Color is restrained and functional, phosphor green marks what's active, live, or actionable, and almost nothing else carries color at rest.

Two themes exist, dark (the default, and the system's true identity) and light (a "daylight" mode for the same interface, not a redesign). Every token below is the dark canonical value; the light theme swaps panel/background/text roles to a paper-and-ink palette while keeping the same green as its accent, just deepened for contrast on white.

**Key Characteristics:**
- Single monospace voice across every text role, no display/body font pairing.
- Windows, not sections: draggable, resizable `.console` panels are the primary layout unit, and a new game or tool is an icon plus a window rather than a new page.
- Flat at rest; shadow and lift are earned by interaction, not applied by default.
- Phosphor green is scarce and meaningful: live status, the active tab, a correct Wordle tile, a focused input border.
- Dark is the native theme; light is a faithful token-for-token remap, not a separate design.

## Colors

Almost monochrome at rest. Panels, wells, and borders are graduated shades of near-black (dark) or near-white (light); phosphor green is the only saturated color that appears outside state feedback (warn amber, danger red).

### Primary
- **Phosphor Green** (`#00cc00` dark / `#007f00` light): the single accent. Used for the primary button, the active nav tab and its soft-fill background, focus rings on inputs, the live-presence dot, the terminal cursor, and the "correct" Wordle tile. Never used decoratively; its presence always means active, live, correct, or actionable.

### Neutral
- **Ink** (`#0a0b0a` dark / `#f1f2ee` light): page background.
- **Panel** (`#131513` dark / `#ffffff` light): the surface of every `.console` and card.
- **Panel Deep** (`#101210` dark / `#f6f7f4` light): console title bars and other slightly-recessed panel headers.
- **Well** (`#0d0f0d` dark / `#f8f9f6` light): sunken surfaces, inputs, selects, icon glyph tiles, game boards.
- **Bar Focus** (`#161a17` dark / `#eceee9` light): a focused window's title bar, one step lighter than Panel Deep.
- **Text** (`#eef2ef` dark / `#121613` light): primary reading color.
- **Text Dim** (`#8b968f` dark / `#56605a` light): secondary copy, descriptions, muted labels.
- **Text Faint** (`#78817b` dark / `#667069` light): the quietest tier, hints and disabled-adjacent text.
- **Border** (`rgba(255,255,255,0.09)` dark / `rgba(16,24,18,0.11)` light) and **Border Strong** (`rgba(255,255,255,0.18)` dark / `rgba(16,24,18,0.22)` light): hairline dividers and emphasized outlines, always translucent over the surface rather than a flat hex.

### State
- **Warn** (`#e2c14c` dark / `#e2b53c` light): the "present" Wordle tile and cautionary states.
- **Danger** (`#ff6b5e` dark / `#c8352a` light): the window-close control and destructive/error states.

### Named Rules
**The Scarcity Rule.** Phosphor Green appears only where something is live, correct, active, or actionable. A screen with green everywhere has lost the signal it exists to give.

**The Paired-Theme Rule.** Every color role has one dark value and one light value, chosen so the *role* (background / panel / text / border) reads identically in both themes. Never introduce a color that exists in only one theme.

## Typography

**Display / Body / Label Font:** IBM Plex Mono (with system monospace fallback)

**Character:** One typeface for the whole system. Hierarchy comes from size, weight, and color, not from switching families. This is a working terminal, not a marketing page borrowing terminal styling.

### Hierarchy
- **Display** (700, `clamp(30px, 4.6vw, 50px)`, 1.1 line-height, −0.045em tracking): the site name only (`matthew.quest`). The tight negative tracking corrects for how wide mono runs at display size.
- **Headline** (700, 22px): panel titles (`games`, `tools`), always lowercase as written, never title-cased.
- **Title** (500, 14px, `{typography.title}`): a step down from Headline for sub-headings inside a panel — the showcase game-name list, the leaderboard title.
- **Body** (400, 13px, 1.6 line-height): descriptions, converter output, general copy.
- **Label** (400, 12px, 0.02em tracking): buttons, nav tabs, form labels, game HUD stats.
- **Micro** (400, 11px, `{typography.micro}`): hints, footer links, the smallest supporting text. A few instances sit at 11.5px or 12.5px where a component's own rhythm (e.g. the hero terminal's line-height) called for a half-step; these are marked in code as intentional, not drawn from the shared scale.

Two components carry their own fluid, container-scaled type outside this hierarchy — the game-result overlay title and the Wordle tile letter — because their size is driven by their own responsive layout, not the page's text scale. Both are marked in code as intentional exceptions.

### Named Rules
**The One-Voice Rule.** No second font family is introduced for any role, including code samples, numerals, or "friendly" copy. If a new surface needs a different feel, it comes from weight, size, or color, not a new typeface.

## Layout

Content is capped and centered at `1180px` on the homepage. A `56px` fixed header (`--header-h`) sits above everything at `z-index: 9000`; page content pads top to clear it rather than scrolling under it.

The homepage hero is a two-column grid (title/CTAs beside the live terminal) that collapses to one column under `860px`. The showcase section below it is an intentionally asymmetric two-column grid (`1.4fr` / `1fr`), panels align to their own content height rather than stretching to match each other.

Games and tools are both blank desktops, built from the same code: icons sit top-left in a fixed-width column, and windows the user opens are positioned absolutely and float free, bounded by the header and a soft rubber-band resistance at the viewport edges rather than a hard stop. A new game or tool is an icon and a `.console`, never a new page layout. The graph-paper grid backdrop marks a desktop and appears on those two pages only.

## Elevation & Depth

Flat at rest, lifted on interaction. A resting `.console` — including ones that never move, like the hero terminal and the converter — has only a hairline border and zero shadow. The moment a window is picked up and floated it earns real depth. Elevation is proof of interaction, not decoration applied everywhere by default.

### Shadow Vocabulary
- **Panel** (`0 30px 80px -30px rgba(0,0,0,0.75)` dark, softened to `rgba(24,34,26,0.28)` at a lower spread in light): reserved for a static-but-elevated surface that sits above the page without being a floated window (e.g. a future popover or tooltip) — not applied to resting `.console` panels.
- **Float** (`0 40px 90px -20px rgba(0,0,0,0.85)` dark): a window the instant it's picked up off the desktop.
- **Lifted** (`0 60px 120px -24px rgba(0,0,0,0.9)`, plus a 1px strong-border ring): the deepest tier, the active/dragging state of a floated window.

### Named Rules
**The Earned-Depth Rule.** A shadow's size is proportional to how far a surface has been lifted by the user's own action. Nothing gets the Float or Lifted treatment just for being important.

## Shapes

Two radii cover almost everything: `8px` (`--radius-md`) for buttons, inputs, and small controls, and `14px` (`--radius-lg`) for panels and console windows. A smaller `6px` (`{rounded.sm}`) step appears where a full 8px reads too heavy for the element's own scale: the leaderboard row and the floating-window scrollbar thumb. A third form, the full pill (`999px`), is reserved for toggle-like controls, the theme switch and the nav tab group, so "this is a mode switch" has one consistent silhouette across the site. Circles (`border-radius: 50%`) are used only for literal dots: window-bar dots and the live-presence indicator. A handful of smaller one-off radii (1-5px, 10px) exist on individual micro-elements — game glyph icons, the on-screen keyboard key, the desktop-icon tile — scaled to that element rather than drawn from the shared set; each is marked in code as an intentional exception rather than left to read as drift.

## Components

### Buttons
- **Shape:** 8px radius (`{rounded.md}`), never pill.
- **Primary:** solid Phosphor Green fill, ink-colored text (`--accent-ink`), `13px 20px` padding.
- **Hover / Focus:** primary brightens (`filter: brightness(1.1)`); all buttons scale to 0.97 on press. No color-shift hover on primary, brightness is the only feedback.
- **Secondary / Ghost:** transparent background, `--border-strong` outline, text in `--text`; hover swaps border and text to Phosphor Green.

### Cards / Containers (`.console`, `.showcase__panel`)
- **Corner Style:** 14px radius (`{rounded.lg}`).
- **Background:** Panel (`--bg-panel`).
- **Shadow Strategy:** none at rest; see Elevation.
- **Border:** 1px hairline (`--border`).
- **Internal Padding:** 32px for showcase panels; console bodies use 28px horizontal with asymmetric 8px bottom (the console footer/last child restores full padding).

### Inputs / Fields
- **Style:** Well background (`--bg-well`), 1px hairline border, 8px radius, mono type.
- **Focus:** border shifts to Phosphor Green, no glow or outline ring.
- **Read-only:** text itself turns Phosphor Green (the converter's output field) instead of changing the background, marking it as a result rather than an editable field.
- **Text size floor:** the converter's numeric input is set at 16px rather than Body's 13px — below 16px, iOS Safari zooms the viewport on focus. Any future text input keeps this floor; it's a platform constraint, not a scale step.

### Navigation (`.site-tabs`, `.site-tab`)
- **Style:** pill-shaped tab group, 3px inset padding, each tab a smaller pill inside it.
- **Default:** dim text, transparent background.
- **Active (`aria-current="page"`):** Phosphor Green text over its own soft-tint background, not a full solid fill, an accent wash, not a badge.
- **Hover:** text brightens to full `--text`, no background change.

### Window (signature component: `.console` as a floatable OS window)
Every game, the hero terminal, and the converter live in the same shell: a title bar with three dots (only the leftmost, close, is ever functional and is the only one that carries color, `--danger`) and a monospace title. At rest it's pinned; once dragged it "floats" (`position: fixed`), gains the Float shadow, and springs back to its bounds on release with a critically-damped, no-overshoot motion rather than a hard snap or a bouncy ease. This window chrome is the site's most identity-defining component; any new surface that needs a contained panel should consider becoming a `.console` before inventing a new container.

## Do's and Don'ts

### Do:
- **Do** keep every text role in IBM Plex Mono; a second family breaks the One-Voice Rule.
- **Do** treat Phosphor Green as a status signal (live, active, correct) and keep it off purely decorative surfaces.
- **Do** use the 8px/14px/pill radius set exclusively; don't introduce a fourth corner value.
- **Do** keep panels flat at rest and let shadow depth communicate that a window has been physically lifted.
- **Do** give both themes matching role coverage: a new color needs a dark and a light value before it ships.

### Don't:
- **Don't** add a serif or a distinct display sans; the terminal identity depends on the single mono voice.
- **Don't** apply the Float or Lifted shadow tiers to a resting element; they are earned by interaction only.
- **Don't** give a resting panel a saturated fill color; the palette outside state feedback stays near-monochrome.
- **Don't** invent a second navigation shape; the pill-tab pattern is the one selector/switch silhouette site-wide.

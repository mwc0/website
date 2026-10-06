---
name: matthew.quest
description: A lit schematic at night. Browser games and small tools on a midnight field, under one beam of light.
colors:
  midnight: "#04050d"
  field-lift: "#080a18"
  panel: "#0b0d1d"
  panel-bar: "#0f1226"
  well: "#060813"
  ink-light: "#a4b4ff"
  line: "rgba(164, 180, 255, 0.11)"
  line-strong: "rgba(164, 180, 255, 0.24)"
  guide: "rgba(164, 180, 255, 0.1)"
  tick: "rgba(164, 180, 255, 0.6)"
  tint: "rgba(164, 180, 255, 0.06)"
  tint-strong: "rgba(164, 180, 255, 0.15)"
  text: "#e8ecff"
  text-dim: "#9aa3c8"
  text-faint: "#7d86ad"
  periwinkle: "#93a4ff"
  lit: "#eef1ff"
  lit-ink: "#0a0d24"
  ok: "#5fd9a3"
  ok-ink: "#04130c"
  warn: "#f0c35a"
  warn-ink: "#1a1303"
  danger: "#ff7a6e"
  light-paper: "#eceffa"
  light-field-lift: "#f6f7fd"
  light-panel: "#ffffff"
  light-panel-bar: "#f3f5fc"
  light-well: "#f0f2fb"
  light-ink: "#26348c"
  light-line: "rgba(38, 52, 140, 0.13)"
  light-line-strong: "rgba(38, 52, 140, 0.28)"
  light-text: "#12173a"
  light-text-dim: "#4a5384"
  light-text-faint: "#5a6392"
  light-indigo: "#3d4dd6"
  light-lit: "#151a40"
  light-lit-ink: "#ffffff"
  light-ok: "#0c7f4d"
  light-warn: "#e0ad2e"
  light-danger: "#c4372b"
typography:
  display:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 11.5vw, 6rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
  desk-title:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 8vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4.2vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  lede:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.45
  title:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  ui:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  label:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  readout:
    fontFamily: "Azeret Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "clamp(20px, 2.5vw, 28px)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  ratio:
    fontFamily: "Azeret Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "22px"
    fontWeight: 500
    letterSpacing: "-0.02em"
  field:
    fontFamily: "Azeret Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "16px"
    fontWeight: 400
  data:
    fontFamily: "Azeret Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
  engraving:
    fontFamily: "Azeret Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
  micro:
    fontFamily: "Azeret Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "56px"
  section: "104px"
components:
  button-lit:
    backgroundColor: "{colors.lit}"
    textColor: "{colors.lit-ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "44px"
  button-glass:
    backgroundColor: "rgba(164, 180, 255, 0.035)"
    textColor: "{colors.text}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "44px"
  plate:
    backgroundColor: "{colors.field-lift}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "28px"
  tile:
    backgroundColor: "rgba(164, 180, 255, 0.12)"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    size: "44px"
  window:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.well}"
    textColor: "{colors.text}"
    typography: "{typography.field}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
  segment-active:
    backgroundColor: "rgba(164, 180, 255, 0.15)"
    textColor: "{colors.text}"
    typography: "{typography.engraving}"
    rounded: "{rounded.xs}"
    padding: "6px 12px"
  nav-tab:
    textColor: "{colors.text-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "26px"
---

# Design System: matthew.quest

## Overview

**Creative North Star: "The Lit Schematic"**

The site is a technical drawing seen at night. The field is midnight navy, almost black. One beam of light falls from the arrow mark at the top centre of the page, and everything is drawn in that light: text is blue-white, lines are the same light at a tenth of its strength, and the brightest things on any page are the wordmark and the one lit button. Thin registration lines run along the edges of important boxes, overshoot the corners, and fade, with a tick dot where they cross. They are the site's signature: they say this was measured and placed.

The home page shows the work rather than describing it. The three games play themselves in a fan of cards under the beam, the four tools run live readouts, and the scores panel reads the real Snake board. The games and tools pages are desktops: an empty field with a column of icon tiles, where each game or tool opens in a window that can be dragged, resized and stacked.

Two voices, strictly separated. Host Grotesk speaks for the site: headings, copy, buttons, navigation. Azeret Mono is used only for data and for the labels on an instrument: a score, a timestamp, a hex value, the word above an input inside a window.

Dark is the native theme. Light is the same drawing on drafting paper: the ink turns indigo, the beam becomes a faint wash, and the lit button inverts to solid ink. Every token below is the dark value; the `light-` keys are its counterpart.

**Key Characteristics:**
- Light is the material. One ink colour (`164 180 255`) at different strengths draws every line, tick, tint and plate.
- Registration frames mark the things that matter: the wordmark, the tools grid, the closing heading, a desktop's title.
- Demonstration over description. If the page can run the thing, it runs the thing.
- Sans for voice, mono for measurement. Never the other way round.
- Page chrome is pill-shaped; controls inside a window are squared.
- Flat at rest. Shadow is for layers that really overlap: the middle fan card, a floating window.

## Colors

A cool monochrome with almost no second hue. Periwinkle is the light source seen directly; everything else is that light on a dark field. Green, amber and red exist only as state.

### Primary
- **Periwinkle** (`#93a4ff` dark / `#3d4dd6` light, as *Indigo*): the accent. Game stats, the converter's result, the snake, a focused field's border, an open icon's tile. It marks a value the site produced or a thing that is active.

### Neutral
- **Midnight** (`#04050d` / `#eceffa`): the page field.
- **Field Lift** (`#080a18` / `#f6f7fd`): the body of a glass plate.
- **Panel** (`#0b0d1d` / `#ffffff`) and **Panel Bar** (`#0f1226` / `#f3f5fc`): a window's body and its title bar.
- **Well** (`#060813` / `#f0f2fb`): anything sunk in: inputs, game stages, segmented tracks.
- **Ink Light** (`rgb(164 180 255)` / `rgb(38 52 140)`): never used solid. It is the base that `line` (11%), `line-strong` (24%), `guide` (10%), `tick` (60%), `tint` (6%) and `tint-strong` (15%) are all mixed from, so every hairline and wash shares one hue.
- **Text** (`#e8ecff` / `#12173a`), **Text Dim** (`#9aa3c8` / `#4a5384`), **Text Faint** (`#7d86ad` / `#5a6392`): reading, secondary, and quietest. All three clear 4.5:1 on the field in both themes. The home page's Colour plate measures this live.
- **Lit** (`#eef1ff` / `#151a40`) with **Lit Ink** (`#0a0d24` / `#ffffff`): the primary button, and the primary action inside a window.

### State
- **Ok** (`#5fd9a3` / `#0c7f4d`): a correct Wordle tile, a passed contrast grade, a copied value, the live-presence dot.
- **Warn** (`#f0c35a` / `#e0ad2e`): a present Wordle tile, the snake's food.
- **Danger** (`#ff7a6e` / `#c4372b`): an invalid field, a failed grade, the close button's hover.

### Named Rules
**The One Light Rule.** A new line, border, wash or tick is the ink colour at some alpha, never a new grey or a new hex. If it needs to be stronger, raise the alpha.

**The Paired-Theme Rule.** Every colour role has a dark value and a light value. The game stages (`.snake__stage`, `.tunnel__stage`) re-declare the dark set, so they stay dark screens set into a light page; any new token must be added to that shared block as well.

**The Canvas Rule.** `--bg`, `--bg-well`, `--accent`, `--warn` and `--danger` are read by the game canvases and must stay six-digit hex.

## Typography

**Voice:** Host Grotesk (400, 500). **Measurement:** Azeret Mono (400, 500, 600).

**Character:** A plain, slightly wide grotesk set at medium weight with tight tracking, against a mono that only appears where something is being counted or labelled. Headings are sentence case and end with a full stop when they are a statement.

### Hierarchy
- **Display** (500, `clamp(2.75rem, 11.5vw, 6rem)`, line-height 1, −0.04em): the wordmark on the home page. The only lit text: a vertical gradient from white to periwinkle.
- **Desk Title** (500, `clamp(2.5rem, 8vw, 4.5rem)`, −0.04em): the name of a desktop in its empty state.
- **Headline** (500, `clamp(1.75rem, 4.2vw, 2.75rem)`, 1.1, −0.03em): section headings. Solid ink, balanced wrapping.
- **Lede** (400, 18px, 1.45): the line under the wordmark.
- **Title** (500, 18px or 16px, −0.01em): plate and card names.
- **Body** (400, 16px, 1.55): copy. Measure capped near 52ch in the ledger, 46ch under headings.
- **UI** (500, 14px): buttons, plate descriptions at 400.
- **Label** (13px): navigation, rail labels, window titles, hints.
- **Readout** (mono 500, `clamp(20px, 2.5vw, 28px)`, −0.02em, tabular): a value a tool has produced, on the home page.
- **Ratio** (mono 500, 22px): the contrast ratio in the Colour window.
- **Field** (mono 400, 16px): text inputs. 16px is a floor: below it iOS Safari zooms on focus.
- **Data** (mono, 13px), **Engraving** (mono, 12px), **Micro** (mono, 11px): leaderboard rows, labels and notes inside windows, the smallest sublabels.

Three sizes sit outside the ramp because their own box drives them: the game overlay title, the Wordle tile letter, and the arcade initials entry. Each is marked in the stylesheet.

### Named Rules
**The Two Voices Rule.** Mono is for data and instrument labels: numbers, codes, timestamps, and the lowercase words above controls inside a window. It is never used for headings, body copy, navigation or buttons on the page.

**The Engraving Rule.** Inside a window, labels and hints are lowercase, like markings on an instrument. Outside a window, everything is sentence case.

**The One Lit Word Rule.** Gradient text is used once, on the home page wordmark. Every other heading is solid ink.

## Layout

The home page is centred. Content sits in a `1120px` column with a `24px` gutter (`18px` under 720px). The hero stacks down the beam's axis: framed wordmark and actions, the fan of three game cards, the presence pill, then the rail of seven icon tiles joined by wires. Sections below it are `104px` apart and each has a different shape: an asymmetric four-plate grid (7/5 then 5/7 of twelve columns), a two-column ledger with a sticky scores plate, and a closing pair of cards.

The header is `60px`, fixed, and clear over the top of the page; it frosts once content scrolls under it. Name on the left, arrow mark dead centre, tabs and theme switch on the right. Under 640px the mark moves left to lead the name, and under 400px the name hides.

The games and tools pages do not scroll. Icon tiles run down the left edge (a wrapped row under 720px). The desktop's title sits framed in the centre with a one-line hint, and fades once any window is open. Windows are positioned by `desktop.js`: cascaded on wide screens, full-width below the icon row on narrow ones.

Registration frames collapse their overshoot from around `96–140px` to `18–24px` on small screens so they never cause horizontal scroll.

## Elevation & Depth

Depth comes from light first and shadow second. Every raised surface carries an **edge light**: a one-pixel inset highlight along its top edge, as if the beam were catching it. Plates, tiles and buttons have that and nothing else at rest.

Shadow is reserved for layers that physically overlap something.

### Shadow Vocabulary
- **Edge Light** (`inset 0 1px 0 rgb(164 180 255 / 0.12)`; white at 90% in light): on every plate, tile, window, glass button and active segment.
- **Float** (`0 36px 80px -24px rgb(0 0 0 / 0.9)`): the middle fan card, and any open window.
- **Lifted** (`0 56px 110px -28px rgb(0 0 0 / 0.95)` plus a 1px ring at 40% ink): a window while it is being dragged.

### Named Rules
**The Overlap Rule.** If a surface is not sitting on top of another surface, it gets no drop shadow. A hairline and the edge light are enough.

**The No Halo Rule.** No coloured glows. The beam is the only light effect, and there is one per page.

## Shapes

Four radii and a pill. `18px` for plates and windows. `12px` for icon tiles, game stages and the demo screens inside cards. `8px` for inputs, in-window buttons, Wordle tiles and segmented tracks. `6px` for the smallest parts: keyboard keys, segments, badges, leaderboard rows. `999px` for page chrome: the header tabs, the theme switch, the hero buttons, the presence pill.

The split is deliberate: **pills belong to the page, squares belong to the instrument.** A control inside a window is never a pill, and a page-level action is never squared.

Circles are literal dots only: the presence dot, a rail node, an open icon's indicator, and the converter's round swap button.

## Components

### Registration frame (`.frame`)
The signature. Add the class to a box and it gets a tick dot on each corner and guide lines along its four edges that overshoot by `--fx` / `--fy` and fade to nothing. It is built from the element's two pseudo-elements, so a framed element cannot also use them. On load or reveal the lines draw outward from the centre. Use it for the one thing in a region that matters most; a page with frames on everything has no frames.

### Beam (`.beam-light`) and dot field (`.dot-field`)
One beam per page, anchored at the top centre under the header mark: three overlapping conic cones, blurred and faded with distance. The dot field is a 26px dot grid masked to the beam's footprint. Both are decorative, `aria-hidden`, and never repeated further down a page.

### Glass plate (`.plate`)
- **Shape:** 18px radius, 1px `line` border.
- **Surface:** Field Lift with a faint top-down highlight, the edge light, and a rivet dot inset 9px from each corner.
- **As a link:** the border strengthens and the plate rises 3–4px on hover. With `data-glow`, a soft patch of light follows the pointer.
- **Trace (`.trace`):** a point of light circling the border. Used once, on the middle fan card.

### Icon tile (`.tile`)
44px, 12px radius, a top-lit gradient of the ink colour, 1px `line-strong` border. Holds one 20px icon from `images/icons.svg`. All icons share one 1.5px stroke with round caps; add new ones to that sprite in the same weight. The same tile is the rail item on the home page and the desktop icon, and carries a shared `view-transition-name` (`data-vt`) so it flies between the two pages.

### Buttons
- **Lit (`.btn--lit`):** Lit fill, Lit Ink text, 44px pill. One per view. Brightens slightly on hover; its arrow slides 3px.
- **Glass (`.btn--glass`):** plate tint, `line-strong` border, text in Text.
- **In-window (`.score-entry__btn`, `.tunnel__btn`, a lone `.tool__pill`):** 8px radius, tint fill, `line-strong` border, edge light. The primary one takes the Lit fill.
- All buttons press to `scale: 0.97`.

### Window (`.console`, `.window`)
An opaque Panel surface with a `line-strong` border and 18px radius. The 44px title bar holds the item's icon, its name in sentence case, and a close button on the right that turns Danger on hover. The bar is the drag handle. A focused window has a brighter border and title; an unfocused one stays fully opaque. Opening scales the window out of its icon; dragging adds the Lifted shadow; release past the edge springs back without overshoot.

### Inputs (`.tool__input`, `.converter__input`, `.converter__select`)
Well fill, 1px `line` border, 8px radius, mono at 16px. Focus swaps the border to Periwinkle and adds a 3px `accent-soft` ring; there is no outline. A read-only result is shown by colouring its text Periwinkle. An invalid field takes a Danger border and a note beneath it that says what would be valid; `Readout.invalid()` sets the class and `aria-invalid` together.

### Segmented track (`.converter__tabs`, `.tool__pills`)
A Well track with a 3px inset and 8px radius; the chosen segment is `tint-strong` with the edge light and full-strength text. Buttons carry `aria-pressed`. It is a choice of mode, never a tab list.

### Readout rows (`.tool__rows`)
A `<dl>` of quiet label against value, hairline between rows, where the value is the copy button. Copying flashes the row Ok and announces itself. A row with nothing to show sits disabled at an em dash.

### Navigation (`.site-tabs`)
A pill track holding two pill tabs. The current page's tab is `tint-strong` with the edge light. The theme switch beside it is the same construction with a sliding thumb.

### Rail (`.rail`)
The seven tiles in a row, each wired to the next with a hairline and a small hollow node. A pulse of light crosses the wires one after another, left to right. Under 820px it becomes two rows, games above tools, each wired separately.

## Do's and Don'ts

### Do:
- **Do** build every line, border and wash from the ink colour at an alpha. One light.
- **Do** keep mono for data and for labels inside windows, and Host Grotesk for everything a person reads as prose.
- **Do** show a thing working before describing it. A new game or tool earns a live demo on the home page, not a paragraph.
- **Do** give a new tool or game an icon in `images/icons.svg` at the shared 1.5px stroke, a tile, and a window. Not a new page layout.
- **Do** add a dark and a light value for any new colour, and add it to the shared stage block.
- **Do** keep reveal motion optional: content is visible by default, and each section has its own gesture.

### Don't:
- **Don't** add a second beam, a coloured glow, or a glowing shadow. The beam is the only light effect.
- **Don't** use gradient text anywhere but the home page wordmark.
- **Don't** put a kicker or eyebrow label above a heading. Headings stand alone.
- **Don't** frame everything. A registration frame marks the most important box in a region.
- **Don't** give a resting plate or tile a drop shadow, or let an unfocused window go translucent.
- **Don't** use a pill inside a window, or a squared button on the page.
- **Don't** bring back the terminal costume: no `.sh` titles, no traffic-light dots, no mono headings.

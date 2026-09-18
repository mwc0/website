# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences held equally: visitors who use the site as a real, repeat-use destination (playing Snake/Wordle/Driftwalk, or reaching for the converter), and anyone evaluating it as a demonstration of the owner's build and design craft. Neither audience is secondary; design and product decisions should satisfy both at once rather than trading one off for the other.

## Product Purpose

matthew.quest is a personal site combining small browser games (Snake, Wordle, Driftwalk) and a unit/currency converter, all running client-side with no account system. It exists both as something people genuinely return to and as a portfolio piece for its owner.

## Positioning

A hand-built, personality-driven alternative to generic game-aggregator or converter-utility sites: everything is original, single-purpose, fast, and free of the ad/account/monetization friction those categories usually carry.

## Operating Context

- Static site, no server-rendering; deployed via GitHub Pages at the custom domain `matthew.quest` (see `CNAME`).
- Supabase Realtime Presence powers the live "people here right now" indicator; Supabase also backs the Snake leaderboard. These are the only server-side dependencies in the product.
- Google Analytics (gtag.js) is attached site-wide for traffic visibility.
- Games run in draggable, resizable desktop-style windows (`common.js`), a shared interaction pattern across the games page and the homepage hero terminal.
- Both a dark and light theme are supported, toggled per-visitor and persisted via `localStorage`, defaulting to system preference.

## Capabilities and Constraints

- Three games: Snake (with a global high-score leaderboard), Wordle (unlimited daily plays, no daily-limit gate), and Driftwalk (an endless tunnel runner).
- One tool: a converter for length, weight, temperature, and currency, with currency using live exchange rates and a hardcoded fallback table if the fetch fails.
- No user accounts, no login, no persistent user data beyond a browser-local Snake best score and a leaderboard initials entry.
- No backend beyond Supabase's presence/leaderboard usage; no stated intent to add more server-side surface, but this isn't a hard constraint the owner flagged, just the current state.
- No stated constraint against ads, monetization, or changing the game/tool set — the owner explicitly left these open rather than fixing them.

## Brand Commitments

- Name/domain: `matthew.quest`. Owner referred to as "matthew" in the hero terminal's `guest@matthew.quest` framing.
- Design must not read as "AI-generated": no generic/templated/cookie-cutter aesthetics (stock gradients, default component look, overused icon sets, predictable layouts). Aim for professional, unique, deliberately-crafted choices. (Recorded standing instruction; see `CLAUDE.md`.)

## Evidence on Hand

- No testimonials, case studies, press, or external evidence exist. None should be invented.
- Visual/interaction system already implemented in code (dark-first terminal aesthetic, IBM Plex Mono throughout, green accent, draggable console-style windows) — this is incumbent evidence for future design work, not yet separately documented in a DESIGN.md.

## Product Principles

1. Craft over volume: a small, polished set of games/tools beats a larger generic one.
2. No friction: no accounts, no paywalls, no forced ads, instant play/use.
3. Genuinely useful, not just decorative: the converter and games must work correctly and fast, not merely look good.
4. Never read as templated or AI-generated; every design choice should feel deliberately made for this site.
5. Serve the returning visitor and the evaluating visitor at once — neither is the "real" audience at the other's expense.

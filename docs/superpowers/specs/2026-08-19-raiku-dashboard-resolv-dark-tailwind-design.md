# Raiku Dashboard White Brutalist + Tailwind Design

**Date:** 2026-08-19  
**Status:** Revised from the dark direction after the user's latest screenshot feedback. Implementation not started for this revision.

## Goal

Restyle the Raiku dashboard as a white brutalist analytics document inspired by the supplied Performance screenshot: rigid rectangular panels, near-black rules, compact grotesk typography, repeated chart/card geometry, large intentional empty states, and a fixed bottom notice. Preserve Raiku-specific data and behavior; do not copy the source brand, author, logo, wording, or metric semantics.

## Visual system

### Canvas and tokens

```css
--page: #f4f3ef;
--surface: #ffffff;
--surface-muted: #e8e7e2;
--ink: #111111;
--muted: #66645f;
--rule: #171717;
--accent: #3458d4;
--gap: 16px;
--page-gutter: 16px;
--radius: 0px;
```

- Page background: warm off-white, never black.
- Panels: white or pale gray, flat, no gradients, no shadows.
- Borders: solid `1px` near-black; use `2px` only for major section separators.
- Panel radius: `0–2px`; controls can be `0–4px`, not soft SaaS pills.
- Accent: restrained blue for active states, links, source marks, and chart focus.
- Text: black/near-black primary, gray secondary. Verify normal text at WCAG AA.

### Font

Use a compact neutral grotesk/system sans for the interface:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Use a monospace stack only for addresses, tabular data, timestamps, and empty-state instructions:

```css
font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

Type hierarchy:

| Element | Size | Weight | Treatment |
| --- | ---: | ---: | --- |
| Dashboard title | 18–20px | 600–700 | plain, left aligned |
| Section title | 14–16px | 600 | slab/header bar |
| Panel title | 11–13px | 600 | compact, top-left |
| Primary metric | 26–44px | 700–800 | tabular numerals |
| Supporting label | 10–12px | 400–500 | readable muted gray |
| Empty state | 10–12px | 400 | compact mono/sans |
| Mobile body | 12–14px | 400–500 | never below 12px |

Typography should feel technical and blunt, not decorative. Avoid rounded display fonts, excessive letter spacing, and all-monospace body copy.

## Layout

### Desktop frame

- Use a wide edge-aligned shell with `16px` page gutter; do not over-center it in a narrow floating container.
- Header is a shallow full-width slab, approximately `64–68px` tall.
- Header and dashboard panels share the same left/right boundaries.
- Header-to-grid and row gaps are `16–18px`.

```text
[Raiku Dashboard title + metadata]                 [utility controls]

[Performance / analytics section bar]

[summary card] [summary card] [summary card]

[large chart/result panel 2fr] [narrow panel 1fr]

[large chart/result panel 2fr] [narrow panel 1fr]

[methodology / data / tables]
```

### Summary row

Three equal cards: `grid-template-columns: repeat(3, minmax(0, 1fr))`, `16px` gap. Each has a compact top-left title, a centered metric/empty state, and a small source/freshness marker near the bottom-left.

### Analytical rows

Repeated `2fr 1fr` rows with identical gutters and aligned vertical rules. Adapt current data to this geometry:

- Large left: points accrual / holder growth / total supply trend.
- Narrow right: top-10 concentration / APY / coverage / latest snapshot.
- Next row: top holders / new holders or another data-backed comparison.

Do not invent fake metrics or fake “Run” behavior. If a chart has data, show it; if a panel is intentionally deferred, use an original empty message such as “Run analysis to populate this panel.”

### Performance section

Add a full-width `Performance` section bar using pale gray fill, solid black border, and compact title. Existing network insights, lookup, tables, and methodology become the content under this section, using the same rectangular panel system.

## Panel anatomy and states

Each panel keeps stable dimensions between states:

1. Compact title in the top-left.
2. Optional action/status at top-right.
3. Main metric, chart, table, or centered empty state.
4. Source/freshness/coverage marker near the bottom-left.

Empty state rules:

- Preserve panel height and border.
- Center visible instruction text.
- Use `role="status"`/`aria-live` where appropriate.
- Never communicate empty data solely with whitespace.

Loaded chart rules:

- Black axes and rules.
- One restrained blue series/accent.
- Sparse straight grid lines.
- Thick/blocky marks over soft gradients.
- Tooltip and text summary remain available.

## Header and controls

- Left: `Raiku Dashboard` / `rkuSOL Analytics`, timestamp, network, coverage.
- Right: quiet utility controls, Data/source control, and a clear primary refresh/analyze action only when wired to real behavior.
- Use rectangular outlined buttons; primary action is solid black with white text or accent-filled if needed.
- Icon-only buttons need accessible labels, visible focus, and 44px touch targets.
- Existing lookup and external links remain functional; no fake controls.

## Responsive behavior

- `>=1024px`: three equal summary cards, repeated `2fr 1fr` rows.
- `768–1023px`: reduce gutter/padding; summary can become two columns; retain chart split when readable.
- `<700px`: all grids become one column; summary, large panel, narrow panel stack in data order.
- `<420px`: full-width buttons, 12–14px body text, no shell overflow; only tables may scroll horizontally.
- Notice bar stacks text/actions on mobile.
- Respect `prefers-reduced-motion`.

## Tailwind boundary

- Add Tailwind v4 and `@tailwindcss/vite`.
- Use Tailwind utilities for component layout, surfaces, spacing, borders, typography, responsive behavior, and states.
- Keep `global.css` small: Tailwind import, base reset, theme variables, focus/reduced-motion rules, and Recharts selectors only.
- Keep components modular: `AppShell`, `TopBar`, `ProtocolInfo`, `MetricCard`, `MetricGroup`, chart cards, lookup, tables, methodology/notice.
- Do not change snapshot JSON or data-pipeline scripts.

## Acceptance criteria

1. Desktop visibly matches the screenshot's brutalist geometry: shallow section bar, three-card row, repeated `2fr 1fr` analytical rows, rigid borders, large empty/chart fields.
2. Background is white/off-white; no dark-theme canvas remains.
3. Tailwind v4 is active in Vite and the old large light-theme CSS is reduced to base/theme/chart rules.
4. Existing charts, data, lookup, tables, links, loading/error states, and snapshot behavior remain functional.
5. Mobile stacks cleanly with readable type and no shell overflow.
6. Tests, build, and browser QA pass with no runtime console errors.

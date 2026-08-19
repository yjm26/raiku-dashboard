# Raiku Dashboard Resolv-Style Dark + Tailwind Design

**Date:** 2026-08-19  
**Status:** Design approved by the user's direct instruction to continue with this screenshot direction. Implementation not started for this redesign.

## Goal

Replace the current light/card-heavy presentation with a restrained dark protocol-analytics interface inspired by the supplied Resolv Labs screenshot: near-black canvas, flat charcoal panels, thin borders, compact technical typography, a one-third/two-thirds desktop grid, and a clear primary action hierarchy. Do not copy Resolv branding, copy, logo, or metric semantics.

## Current context

- Repository: `yjm26/raiku-dashboard`
- Active implementation branch: `feat/raiku-react-vite`
- Current shipped baseline: React/Vite dashboard with Recharts, normalized `public/data/dashboard.json`, wallet lookup, holder tables, and existing tests.
- Existing UI styling is concentrated in `src/styles/global.css` and `src/styles/tokens.css`.
- The data pipeline and snapshot contract remain unchanged.

## Visual direction

### Canvas and palette

Use a warm near-black canvas rather than pure black:

```css
--color-canvas: #0d0e0c;
--color-surface-1: #1c1d1b;
--color-surface-2: #111210;
--color-surface-3: #20211f;
--color-border: #292a27;
--color-border-strong: #353632;
--color-text-primary: #e5e5e2;
--color-text-secondary: #a8aaa5;
--color-text-muted: #737570;
--color-text-disabled: #5b5d59;
--color-accent: #647ff1;
--color-accent-hover: #8198ff;
--color-button-light: #e6e7e3;
--color-button-light-text: #171815;
```

Rules:

- No gradients, glassmorphism, or decorative shadows.
- Use borders and spacing for hierarchy.
- Use blue sparingly for active state, links, chart focus, and status indicators.
- Use warm off-white for primary text and muted gray for metadata.
- All normal text must retain WCAG AA contrast; screenshot density must not justify unreadable type.

### Geometry

- Content panels: square or nearly square, `0–2px` radius.
- Buttons, pills, and status chips: `5–8px` radius or pill where appropriate.
- Default border: `1px solid var(--color-border)`.
- No floating-card shadows.
- Use Tailwind utility classes as the primary styling mechanism; keep only global reset/theme and small Recharts overrides in CSS.

## Layout

### Desktop shell

At approximately `1280px`:

- Max content width: `1145px` to `1180px`.
- Outer horizontal padding: `16–32px` depending on viewport.
- Header at the top, followed by a two-column dashboard grid.
- Left column: approximately `32.5%` / `300–370px`.
- Right column: remaining `67.5%`.
- Grid gap: `16px`.

```text
header: title + metadata                         utility actions

main grid:
  left: identity panel
        information panel
  right: metric row (2fr 1fr 1fr)
         main chart/result panel

performance section: full width
```

### Left information column

Add a Raiku-specific `ProtocolInfo` component:

1. Identity panel: Raiku mark/name, charcoal surface, generous internal spacing, roughly `100px` desktop height.
2. Information panel: short Raiku/rkuSOL explanation, methodology links, and data-source links. Use concise paragraphs rather than a copied protocol essay. It may grow naturally on mobile.

### Right analytics column

- Three compact summary/result cards in a `2fr 1fr 1fr` grid.
- One large chart panel below spanning the full column.
- Preserve the current Recharts data and interactions, but restyle chart grid, axis labels, tooltip, and series for the dark palette.
- Empty and loading states should be centered and intentional, not blank.

### Performance section

Add a full-width section heading and keep the existing insights/table content below it. The heading uses `surface-1`, compact padding, and a restrained `14px` title. Performance cards use the same flat panel system.

## Header and controls

- Title: `Raiku Dashboard` / `rkuSOL Analytics`, compact `16–20px`, medium weight.
- Metadata below: network, snapshot time, coverage/status.
- Right actions: quiet icon/utility controls, share/export affordance if available, a `Data` control, and one light primary action for refresh/analyze.
- Existing wallet lookup remains functional and is not replaced by a fake Run flow.
- External links remain `target="_blank"` with `rel="noreferrer"`.
- Icon-only controls require `aria-label`, visible focus, and a `44px` touch target on mobile.

## Typography and density

- Use a compact sans stack; use monospace only for addresses, numeric metadata, and chart empty-state copy.
- Desktop metadata may be `10–12px`; mobile body text must be at least `12px`.
- Labels use uppercase or tracked small caps sparingly.
- Keep padding dense (`8–16px`) but preserve large chart whitespace.
- Numbers use tabular numerals and consistent formatting.

## Responsive behavior

- `>=1024px`: two-column shell, metric row `2fr 1fr 1fr`, full-width performance grid.
- `768–1023px`: reduce margins, allow header actions to wrap, collapse metric row if chart would become too narrow.
- `<768px`: one-column order: header, primary actions, identity/info, metrics, chart, performance, tables.
- `<420px`: stack all metric cards and buttons; body text `12–14px`; no accidental horizontal overflow.
- Data tables may use intentional horizontal scrolling; the shell must not.
- Use `prefers-reduced-motion` and avoid animated transitions that communicate essential data.

## Tailwind migration boundary

- Add Tailwind v4 using `tailwindcss` and `@tailwindcss/vite`.
- Add the Vite Tailwind plugin.
- Replace the current large global component stylesheet with Tailwind utility classes in React components and a small `global.css` containing the Tailwind import, base reset, CSS theme tokens, focus/reduced-motion rules, and Recharts-specific selectors.
- Keep components modular: `AppShell`, `TopBar`, `ProtocolInfo`, `MetricCard`, `MetricGroup`, chart cards, lookup, tables, and methodology note.
- Do not migrate data-pipeline scripts or change the JSON contract.
- Do not add another UI framework.

## Accessibility and states

- Keep semantic `header`, `main`, `aside`, `section`, `table`, and heading hierarchy.
- Loading, empty, and error chart states use visible text plus `role="status"`/`aria-live` where appropriate.
- Focus rings must be visible against the dark canvas.
- Chart colors cannot be the only differentiator; labels/tooltips remain available.
- Clipboard fallback and retry behavior remain covered.

## Acceptance criteria

1. The rendered desktop layout visibly follows the screenshot's dark protocol-dashboard structure: header, left info column, right metric/chart column, performance section.
2. Panels are flat charcoal/black with thin borders and minimal radius; no white dashboard cards remain.
3. Tailwind v4 is active in the Vite build and the large light-theme stylesheet is removed/reduced to base/theme/chart rules.
4. Existing data, lookup, chart, table, and external-link behavior remains functional.
5. Mobile collapses without horizontal shell overflow and preserves primary controls.
6. Tests and production build pass.
7. Browser QA confirms no runtime console errors and the app visibly renders the dark redesign.

# Raiku Dashboard React/Vite Redesign

**Date:** 2026-08-19  
**Status:** Design approved by user; implementation not started

## Goal

Replace the current monolithic static dashboard presentation with a modular React/Vite application that preserves the existing Raiku/rkuSOL data pipeline and functionality while delivering a polished, light, Dune-inspired analytics experience.

The redesign is visual and structural. It must not change the meaning of the existing metrics or silently turn estimated points into official data.

## Constraints

- Keep the existing Node data collection/update scripts as the source of truth:
  - `src/fetch_holders.mjs`
  - `src/crawl_firstseen.mjs`
  - `src/classify_pda.mjs`
  - `src/update_daily.mjs`
- Do not hardcode the old `C:/Deepseek-workspace/raiku-github` path in the new pipeline.
- Keep the dashboard deployable as static assets on GitHub Pages.
- Keep Solana/Raiku data provenance and the points estimate disclaimer visible.
- Keep wallet addresses and external explorer links safe and escaped.
- Preserve current features: KPI metrics, wallet search, top holders, new holders, holder growth, points accrual, all-holders table, points leaderboard, methodology, and disclaimer.

## Architecture

```text
existing data scripts
        |
        v
repository data/*.json
        |
        v
Vite public/data/dashboard.json (or equivalent generated static asset)
        |
        v
React UI components + typed view model
        |
        v
static dist/ output for GitHub Pages
```

### Build and data strategy

Use React + Vite with a static build. The data generator should produce a normalized dashboard snapshot consumed by the app at runtime from a static JSON file. The app must also support a development fallback to the checked-in data files where practical, but production should have one predictable data URL.

The update workflow should be:

1. Run the existing data update pipeline.
2. Normalize/copy the resulting data into the Vite public data location.
3. Run `npm run build`.
4. Publish `dist/` through the existing GitHub Pages mechanism.

Do not introduce a server, database, authentication, or Next.js unless a later requirement explicitly needs one.

## Visual system

### Theme

Light, calm, analytical, and editorial rather than dark or developer-console-like.

- Page canvas: warm pale gray/white.
- Cards: white with subtle border and restrained shadow.
- Primary text: deep navy/charcoal.
- Muted text: readable cool gray, never low-contrast.
- Primary accent: one blue for links, selected tabs, and key values.
- Green: positive/live states only.
- Amber: concentration/warning only.
- Avoid rainbow status colors and decorative gradients unless they communicate data.

### Typography

Use a clear sans-serif hierarchy with a monospace treatment only for wallet addresses and technical identifiers. Numeric columns use tabular figures. Avoid all-caps labels as the dominant hierarchy; use compact labels with sufficient contrast.

### Motion

Use only small, purposeful interaction feedback: button press scale, tab state transitions, and subtle chart/card entry. Keep interaction transitions below 300ms, use ease-out/custom curves, and respect `prefers-reduced-motion`. Do not animate keyboard-driven table/search interactions.

## Page structure

### 1. Top bar

- Product mark/name: Raiku / rkuSOL Analytics.
- Current network/status indicator.
- Snapshot timestamp.
- Solscan/token external link.
- Responsive collapse that keeps status and the primary external link accessible.

### 2. Hero and search

- Title: `rkuSOL Holder & Points`.
- One-line explanation of the dashboard and the points estimate.
- Token address shown as a compact copyable/external-linked identifier.
- Prominent wallet search with clear result, loading, empty, and invalid-address states.
- Keep mixed Indonesian/English helper text out of the polished UI; use consistent English labels unless later requested otherwise.

### 3. Summary metrics

Use deliberate hierarchy rather than eight identical cards:

Primary group:

- rkuSOL supply/cap
- holders
- real wallets
- total estimated points

Secondary group:

- APY
- daily points
- official holders
- top-10 concentration

Each card needs a label, value, short context line, and semantic treatment. The daily-points metric must never fall into an accidental orphan row.

### 4. Insight charts

Prioritize charts that explain the data:

- Points accrual: cumulative estimate, with latest-value context.
- Holder growth: holder count over time, with readable date density.
- Holder distribution/concentration: use a restrained visualization and a clear top-10/others summary; avoid a crowded rainbow donut legend.

Chart containers must size to the plot and remain useful at desktop and mobile widths. Do not reserve large empty vertical regions for sparse series.

### 5. Supporting insight cards

- Top holders: show rank, address, type, balance, and concentration; emphasize the first few rows and reduce noise in repetitive badges.
- New holders: show the recent cohort with a count and readable dates.

### 6. Data tables

Provide a clear data section with tabs:

- All Holders.
- Points Leaderboard.

Requirements:

- Search/filter controls are visible and understandable.
- Numeric columns align and format consistently.
- Address cells are abbreviated visually but copyable and link to Solscan.
- Type badges are restrained and meaningful.
- Table rows have enough height and hover/focus states.
- Desktop supports the full table; mobile uses intentional horizontal scrolling and preserves the most useful columns.
- Loading, empty, and error states are explicit.

### 7. Methodology and footer

Keep the points formula, first-acquisition definition, data coverage, source references, estimate disclaimer, and non-affiliation statement visible but visually subordinate. Make the distinction between on-chain facts and estimated points explicit.

## Component boundaries

Suggested components (names may change during implementation):

- `AppShell`
- `TopBar`
- `DashboardHeader`
- `WalletSearch`
- `MetricGroup` / `MetricCard`
- `InsightGrid`
- `PointsAccrualChart`
- `HolderGrowthChart`
- `DistributionCard`
- `TopHoldersCard`
- `NewHoldersCard`
- `DataSection`
- `HoldersTable`
- `PointsTable`
- `MethodologyNote`
- `ExternalLink`
- `CopyAddressButton`

Data formatting and dashboard calculations should live in utilities/view-model modules, not inside JSX templates.

## Interaction states

Every interactive surface must define:

- initial/loading state
- successful state
- empty/no-match state
- invalid input state
- recoverable error state
- keyboard focus state
- reduced-motion behavior where animated

Wallet search should match full addresses case-insensitively and display a concise result card with balance, first seen, days held, and estimated points. It must not claim official points.

Tabs must update the visible table without reloading the page and must preserve accessible selected state.

## Accessibility and responsive behavior

- Semantic headings and landmarks.
- Keyboard-accessible buttons, tabs, search, and copy controls.
- Visible focus rings.
- Sufficient text/background contrast in the light theme.
- `aria-selected` for tabs and meaningful labels for icon-only controls.
- Responsive breakpoints that intentionally reduce layout complexity:
  - desktop: multi-column insights and full table
  - tablet: two-column metrics and stacked/condensed insights
  - mobile: two-column metrics, one-column charts, scrollable tables, compact top bar

## Testing and verification

Before declaring the migration complete:

1. `npm run build` succeeds from a clean checkout.
2. The static preview serves the built app and loads the real checked-in snapshot.
3. Wallet search works for a known wallet, an unknown wallet, malformed input, and empty input.
4. All Holders and Points Leaderboard tabs switch correctly.
5. External links use the expected Solscan URLs.
6. Charts render with the current data and remain readable at desktop and mobile widths.
7. No old dark-theme tokens, hardcoded old workspace paths, or raw unescaped data remain in the new UI.
8. `prefers-reduced-motion` disables nonessential movement.
9. Existing update scripts still run or fail with a clear, actionable error.
10. GitHub Pages/static deployment path is documented and verified with the built artifact.

## Out of scope

- Backend/API service.
- Wallet connection or transaction signing.
- New points methodology.
- Changing Solana data acquisition logic.
- Authentication, user accounts, alerts, or real-time websockets.
- Rebuilding the dashboard as Next.js.

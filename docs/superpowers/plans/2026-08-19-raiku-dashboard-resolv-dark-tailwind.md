# Raiku White Brutalist Tailwind Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Raiku React/Vite dashboard into a white brutalist analytics matrix matching the supplied Performance screenshot's geometry, typography, panel states, and repeated chart rows while migrating UI styling to Tailwind v4.

**Architecture:** Preserve the current snapshot/data contract and component boundaries. Add Tailwind v4 through `@tailwindcss/vite`; move layout/surfaces/typography/responsive styles into component utility classes; retain only base tokens, focus/reduced-motion rules, and Recharts selectors in `global.css`. Add a dedicated `ProtocolInfo` component and compose summary cards plus repeated `2fr 1fr` analytical rows.

**Tech Stack:** React, Vite, Tailwind CSS v4, `@tailwindcss/vite`, Recharts, Vitest, Testing Library.

## Global constraints

- Page background: `#f4f3ef` or white; never near-black.
- Panels: `#ffffff`/`#e8e7e2`, solid `1px` near-black rules, no gradients, no shadows, `0–2px` radius.
- Font: Inter/system grotesk; monospace only for addresses, tabular data, timestamps, and empty states.
- Desktop: shallow header/section slabs, three equal summary cards, repeated `2fr 1fr` rows, `16px` gaps.
- Mobile: one column, body text at least `12px`, no shell overflow.
- Keep charts, lookup, tables, links, snapshot loading/error behavior, and `public/data/dashboard.json` unchanged semantically.
- Do not copy the source screenshot's brand, logo, author, or wording.
- Do not modify data pipeline scripts under `src/*.mjs`.

---

### Task 1: Tailwind v4 foundation and white brutalist tokens

**Files:** `package.json`, `package-lock.json`, `vite.config.js`, `src/styles/tokens.css`, `src/styles/global.css`.

- [ ] Install dependencies:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] Register the plugin:

```js
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', exclude: ['**/node_modules/**', 'src/build_snapshot.test.mjs'] },
});
```

- [ ] Replace light/dark legacy tokens with:

```css
:root {
  --page: #f4f3ef;
  --surface: #ffffff;
  --surface-muted: #e8e7e2;
  --ink: #111111;
  --muted: #66645f;
  --rule: #171717;
  --accent: #3458d4;
  --gap: 16px;
  --radius: 0px;
}
```

- [ ] Replace the large legacy stylesheet with `@import "tailwindcss"`, base reset, `color-scheme: light`, system font stack, visible focus ring, reduced-motion rule, and Recharts-only selectors. Remove old dark canvas, gradients, shadows, and large semantic card stylesheet.

- [ ] Verify:

```bash
npm test -- --run
npm run build
```

- [ ] Commit:

```bash
git add package.json package-lock.json vite.config.js src/styles/tokens.css src/styles/global.css
git commit -m "chore: add tailwind white brutalist foundation"
```

---

### Task 2: Header slab, shell grid, and Raiku protocol information

**Files:** create `src/app/components/ProtocolInfo.jsx`; modify `AppShell.jsx`, `TopBar.jsx`, `App.jsx`, `App.test.jsx`.

- [ ] Add a failing test for `role="complementary"` named `Raiku protocol information`, then run `npm test -- --run src/app/App.test.jsx` and confirm it fails.

- [ ] Implement `ProtocolInfo({ snapshot })`:
  - semantic `<aside aria-label="Raiku protocol information">`;
  - identity slab containing Raiku/rkuSOL Analytics;
  - concise original copy about rkuSOL holders, estimated points, and on-chain sources;
  - underlined Solscan/methodology links;
  - Tailwind utilities: `bg-white border border-[#171717] rounded-none p-5 text-[#111]`.

- [ ] Make `AppShell` a white brutalist page wrapper with `min-h-screen bg-[#f4f3ef] text-[#111]`, `mx-auto w-full px-3 sm:px-4 lg:px-6`, and no shadow.

- [ ] In `App.jsx`, keep `TopBar` first, then compose:

```jsx
<div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,0.5fr)_minmax(0,1fr)]">
  <ProtocolInfo snapshot={snapshot} />
  <main className="app-main min-w-0" aria-busy="false">...</main>
</div>
```

- [ ] Restyle `TopBar` as a shallow full-width slab with title/meta left and compact outlined actions right; retain Solscan link/timestamp and accessible labels.

- [ ] Verify tests/build, then commit:

```bash
npm test -- --run
npm run build
git add src/app/App.jsx src/app/App.test.jsx src/app/components/AppShell.jsx src/app/components/TopBar.jsx src/app/components/ProtocolInfo.jsx
git commit -m "feat: add white brutalist dashboard shell"
```

---

### Task 3: Summary cards, repeated analytical rows, and font treatment

**Files:** `DashboardHeader.jsx`, `MetricCard.jsx`, `MetricGroup.jsx`, `ChartCard.jsx`, `PointsAccrualChart.jsx`, `HolderGrowthChart.jsx`, `InsightGrid.jsx`, `DistributionCard.jsx`, `TopHoldersCard.jsx`, `NewHoldersCard.jsx`, `insights.test.jsx`.

- [ ] Add tests for rectangular bordered cards, `Network insights`, and chart regions.

- [ ] Migrate `MetricGroup` to a summary grid:

```jsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">...</div>
```

Use three equal cards in the top summary band; keep existing data-driven metrics, regrouping only presentation. `MetricCard` uses `min-h-[108px] border border-[#171717] bg-white rounded-none p-3` with compact top-left label, tabular numeric value, and bottom source/detail.

- [ ] Make `ChartCard` a stable result panel: `min-h-[280px] border border-[#171717] bg-white rounded-none p-2`; title top-left, status/action top-right, chart/empty message centered, source line bottom-left.

- [ ] Make `InsightGrid` use repeated rows:

```jsx
<div className="grid gap-4 lg:grid-cols-[2fr_1fr]">...</div>
<div className="grid gap-4 lg:grid-cols-[2fr_1fr]">...</div>
```

Map current data to these rows: large points/holder charts; narrow distribution/coverage; then large top-holder/new-holder panels with a narrow methodology/status panel.

- [ ] Use restrained brutalist chart styling:

```jsx
<CartesianGrid stroke="#d2d0ca" vertical={false} />
<XAxis tick={{ fill: '#66645f', fontSize: 10 }} />
<YAxis tick={{ fill: '#66645f', fontSize: 10 }} />
<Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #171717', color: '#111111', borderRadius: 0 }} />
```

No gradients, glow, or decorative fills.

- [ ] Verify and commit:

```bash
npm test -- --run
npm run build
git add src/app/components
git commit -m "feat: build brutalist metric and chart matrix"
```

---

### Task 4: Performance section, lookup, tables, and notice treatment

**Files:** `WalletSearch.jsx`, `DataSection.jsx`, `HoldersTable.jsx`, `PointsTable.jsx`, `MethodologyNote.jsx`, `App.jsx`, `data-section.test.jsx`, `App.test.jsx`.

- [ ] Add a full-width `Performance` section slab above the insight/data area with `bg-[#e8e7e2] border-y-2 border-[#171717] px-2 py-3` and a `14–16px` heading.

- [ ] Keep lookup behavior unchanged while restyling inputs/buttons as rectangular white/gray controls with black borders, visible focus, and black primary button.

- [ ] Restyle table wrappers as intentional horizontal scroll regions: white surface, black border, compact headers, black dividers, mono/tabular numeric cells, blue underlined external links.

- [ ] Keep the methodology/source note as a rectangular panel with readable 12px mobile body text.

- [ ] Add an optional dismissible `NoticeBar` only if a real consent/status requirement exists; do not add fake cookie consent just to mimic the screenshot. If added, use a fixed bottom white panel with black border, outlined secondary action, solid black primary action, and mobile stacking.

- [ ] Verify lookup, tabs, filter, table, and notice accessibility tests, then commit:

```bash
npm test -- --run
npm run build
git add src/app src/styles
git commit -m "feat: align performance and data panels"
```

---

### Task 5: Responsive/browser QA and final verification

- [ ] Run complete gates:

```bash
npm run test:all
npm run build
git diff --check HEAD
```

- [ ] Run Vite locally:

```bash
npm run dev -- --host 127.0.0.1 --port 8766
```

- [ ] Browser-check desktop and mobile:
  - warm white canvas;
  - shallow title/performance slabs;
  - three equal summary cards;
  - repeated `2fr 1fr` panel rows;
  - rigid black rules and no rounded SaaS cards;
  - readable compact grotesk font and mono data/helper text;
  - charts/lookup/tables still work;
  - no shell horizontal overflow;
  - no console errors.

- [ ] Scan active UI source for stale dark tokens, gradients, shadows, and `transition: all`; confirm Tailwind package/plugin are present.

- [ ] Commit final QA fixes:

```bash
git add package.json package-lock.json vite.config.js src/app src/styles README.md
git commit -m "chore: verify white brutalist tailwind dashboard"
```

- [ ] Only after all local gates pass, push the Vercel-connected branch and verify the deployed title and visible white brutalist layout. Do not claim deployment success from local build output alone.

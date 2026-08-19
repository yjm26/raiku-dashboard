# Raiku Dashboard React/Vite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the rkuSOL dashboard from monolithic static HTML to a modular React/Vite app with a white-base, light Dune-style analytics UI while preserving the existing data pipeline and dashboard features.

**Architecture:** Existing Node scripts continue collecting Solana/Raiku data. A normalized snapshot generator writes `public/data/dashboard.json`; React components load that snapshot and render the dashboard; Vite builds static assets into `dist/` for GitHub Pages. Calculations and formatting live outside JSX in a typed view-model layer.

**Tech Stack:** React, React DOM, Vite, JavaScript/JSX, Recharts, Vitest, Testing Library, existing Node ESM data scripts, GitHub Pages.

## Global Constraints

- The page canvas is white or near-white; no dark theme in the new UI.
- Preserve the existing Node data collection/update scripts as the source of truth.
- Do not hardcode `C:/Deepseek-workspace/raiku-github` or any machine-specific repository path.
- Keep the dashboard deployable as static GitHub Pages assets.
- Keep the points formula and estimate disclaimer visible; never label estimated points as official.
- Preserve KPI metrics, wallet search, top holders, new holders, holder growth, points accrual, all-holders table, points leaderboard, methodology, and disclaimer.
- Use a restrained palette: navy/charcoal text, blue primary accent, green for positive/live states, amber for warnings/concentration.
- Wallet addresses are shortened visually, copyable, and linked to Solscan.
- Use semantic headings/landmarks, keyboard-accessible controls, visible focus states, and `prefers-reduced-motion`.
- Do not add a backend, authentication, wallet connection, transaction signing, or a new points methodology.

---

## Task 1: Scaffold Vite and establish the data contract

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/app/main.jsx`
- Create: `src/app/App.jsx`
- Create: `src/app/data.js`
- Create: `src/app/data.test.js`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Modify: `.gitignore`

**Interfaces:**
- `loadDashboardSnapshot(url = '/data/dashboard.json') -> Promise<DashboardSnapshot>`
- `normalizeSnapshot(raw) -> DashboardSnapshot`
- `formatNumber(value, options) -> string`
- `formatAddress(address, head = 5, tail = 5) -> string`
- `DashboardSnapshot` contains `stats`, `pie`, `topHolders`, `holderTimeline`, `dailyTimeline`, `newHolders`, `realRows`, and `coverage`.

- [ ] **Step 1: Add the Vite package scripts and dependencies**

Create `package.json` with scripts:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "react": "latest",
    "react-dom": "latest",
    "recharts": "latest",
    "vite": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

Run `npm install` and expect a lockfile to be created.

- [ ] **Step 2: Write failing data utility tests**

In `src/app/data.test.js`, cover the actual contract:

```js
import { describe, expect, it } from 'vitest';
import { formatAddress, formatNumber, normalizeSnapshot } from './data.js';

describe('dashboard data utilities', () => {
  it('shortens a wallet without changing the full value', () => {
    expect(formatAddress('Ar1HrwURVUrDRdGPpLDf22iG89XuehvMS8G34LRgkUmi'))
      .toBe('Ar1Hr…gkUmi');
  });

  it('formats numeric dashboard values with tabular-friendly decimals', () => {
    expect(formatNumber(54329.215370439)).toBe('54,329.22');
  });

  it('normalizes a snapshot and supplies empty arrays for optional collections', () => {
    const result = normalizeSnapshot({ stats: { supply: 10 } });
    expect(result.stats.supply).toBe(10);
    expect(result.topHolders).toEqual([]);
    expect(result.coverage).toEqual({ found: 0, total: 0 });
  });
});
```

Run `npm test -- src/app/data.test.js`; expect failure because the utilities do not exist.

- [ ] **Step 3: Implement `src/app/data.js`**

Implement `formatAddress`, `formatNumber`, `normalizeSnapshot`, and `loadDashboardSnapshot`. `normalizeSnapshot` must preserve zero values, default only missing arrays/objects, and reject a non-object snapshot with a clear error. `loadDashboardSnapshot` must call `fetch`, throw on a non-2xx response, parse JSON, and normalize it.

- [ ] **Step 4: Add the Vite entry files and white theme tokens**

`src/app/main.jsx` renders `<App />` into `#root`. `App.jsx` can initially render a semantic `<main>` with a loading placeholder. `src/styles/tokens.css` must define a white base, for example:

```css
:root {
  --color-canvas: #ffffff;
  --color-surface: #ffffff;
  --color-surface-muted: #f7f9fc;
  --color-border: #e5eaf1;
  --color-text: #172033;
  --color-text-muted: #667085;
  --color-blue: #315efb;
  --color-blue-soft: #eef3ff;
  --color-green: #17824b;
  --color-green-soft: #eaf8f0;
  --color-amber: #a76300;
  --color-amber-soft: #fff5df;
  --radius-card: 14px;
  --shadow-card: 0 2px 8px rgb(20 34 58 / 0.04);
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}
```

- [ ] **Step 5: Run tests and commit**

Run `npm test -- src/app/data.test.js` and `npm run build`. Both must pass before committing:

```bash
git add package.json package-lock.json vite.config.js index.html src/app src/styles .gitignore
git commit -m "feat: scaffold raiku dashboard with vite"
```

---

## Task 2: Move the generator to a portable normalized snapshot

**Files:**
- Create: `src/build_snapshot.mjs`
- Modify: `src/paths.mjs`
- Modify: `src/generate_dashboard3.mjs`
- Modify: `src/update_daily.mjs`
- Modify: `README.md`
- Test: `src/build_snapshot.test.mjs`

**Interfaces:**
- `buildSnapshot({ holdersData, firstSeenData, pdaLabels, now }) -> DashboardSnapshot`
- Output file: `public/data/dashboard.json`

- [ ] **Step 1: Write a fixture-based snapshot test**

Create a small fixture with two real holders, one PDA, and one first-seen entry. Assert that `buildSnapshot` returns:

```js
expect(snapshot.stats.realWallets).toBe(2);
expect(snapshot.realRows[0].score).toBeGreaterThan(0);
expect(snapshot.coverage).toEqual({ found: 1, total: 2 });
```

Run `node --test src/build_snapshot.test.mjs`; expect failure before implementation.

- [ ] **Step 2: Extract calculations into `src/build_snapshot.mjs`**

Move the pure calculations currently embedded in `generate_dune.mjs`/`generate_dashboard3.mjs` into `buildSnapshot`. Read source data through paths from `src/paths.mjs`, calculate real rows, PDA share, top-10 share, points, timelines, new holders, and coverage. Accept `now` as an argument so tests are deterministic.

- [ ] **Step 3: Make paths repository-relative**

Update `src/paths.mjs` to derive the repository root from `import.meta.url` and expose paths for `data/`, `public/data/`, and `dist/`. Remove machine-specific absolute paths from generator scripts.

- [ ] **Step 4: Add a snapshot build command**

Make `src/generate_dashboard3.mjs` call `buildSnapshot`, write `public/data/dashboard.json`, and log the output path and byte size. It must no longer emit a full HTML application.

- [ ] **Step 5: Update the daily pipeline**

Update `src/update_daily.mjs` so its final step runs the snapshot generator, then leaves Vite build as a separate explicit command. Document:

```bash
node src/update_daily.mjs
npm run build
```

- [ ] **Step 6: Verify and commit**

Run `node --test src/build_snapshot.test.mjs`, run the update/generator against checked-in data, confirm `public/data/dashboard.json` exists and contains the expected keys, then run `npm run build`.

```bash
git add src public/data README.md
 git commit -m "refactor: generate portable dashboard snapshot"
```

---

## Task 3: Build the white application shell and hierarchy

**Files:**
- Create: `src/app/components/AppShell.jsx`
- Create: `src/app/components/TopBar.jsx`
- Create: `src/app/components/DashboardHeader.jsx`
- Create: `src/app/components/ExternalLink.jsx`
- Create: `src/app/components/CopyAddressButton.jsx`
- Create: `src/app/components/MetricCard.jsx`
- Create: `src/app/components/MetricGroup.jsx`
- Create: `src/app/App.test.jsx`
- Modify: `src/app/App.jsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- `<AppShell>{children}</AppShell>`
- `<DashboardHeader snapshot={snapshot} onSearch={...} />`
- `<MetricGroup primary={...} secondary={...} />`
- `<CopyAddressButton value={address} />`

- [ ] **Step 1: Write App shell tests**

Test that the rendered app exposes a `main` landmark, the title, the white-base layout class, four primary metric labels, and the token link. Test loading and error states separately.

- [ ] **Step 2: Implement the shell**

`App.jsx` loads the snapshot with `useEffect`, renders a loading state while pending, a compact recoverable error state on failure, and the full shell on success. `AppShell` owns the top bar and page container. The initial background must be white, with near-white surfaces only for grouping.

- [ ] **Step 3: Implement hierarchy components**

`DashboardHeader` renders the product title, one-line estimate explanation, token address, snapshot timestamp, and Solscan link. `MetricGroup` renders primary metrics in a dominant row and secondary metrics in a quieter row. Use semantic headings and no accidental orphan card.

- [ ] **Step 4: Implement copy/external-link behavior**

`CopyAddressButton` uses `navigator.clipboard.writeText` when available, exposes an accessible label, and falls back to a visible “Copy unavailable” state without throwing. External links must use `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 5: Verify and commit**

Run `npm test -- src/app/App.test.jsx` and `npm run build`, then commit:

```bash
git add src/app src/styles
 git commit -m "feat: add white raiku dashboard shell"
```

---

## Task 4: Add charts and supporting insight cards

**Files:**
- Create: `src/app/components/InsightGrid.jsx`
- Create: `src/app/components/ChartCard.jsx`
- Create: `src/app/components/PointsAccrualChart.jsx`
- Create: `src/app/components/HolderGrowthChart.jsx`
- Create: `src/app/components/DistributionCard.jsx`
- Create: `src/app/components/TopHoldersCard.jsx`
- Create: `src/app/components/NewHoldersCard.jsx`
- Create: `src/app/components/insights.test.jsx`
- Modify: `src/app/App.jsx`

**Interfaces:**
- `<InsightGrid snapshot={snapshot} />`
- Each chart receives a normalized series and renders a responsive chart with a readable empty state.

- [ ] **Step 1: Write chart/card rendering tests**

Assert that chart cards render their titles and that a snapshot with empty timelines renders “No data available” instead of crashing. Assert that top holders and new holders show formatted values and readable addresses.

- [ ] **Step 2: Implement chart cards with Recharts**

Use `ResponsiveContainer` with `LineChart`/`AreaChart` for points and holders. Use restrained blue fills/lines, readable axes, light gridlines, and a tooltip with formatted values. Normalize sparse timelines so the chart does not reserve a tall empty region.

- [ ] **Step 3: Implement distribution without a rainbow legend**

Use a compact horizontal concentration bar or restrained two-segment chart for top-10 versus others. Show the top-10 percentage as the primary annotation and put detailed top-wallet rows below. Use amber only for concentration emphasis.

- [ ] **Step 4: Implement supporting cards**

Top holders show rank, shortened/copyable address, type, balance, and share. New holders show the count, latest addresses, balances, and dates. Repetitive “Wallet” badges should be plain text or subtle labels.

- [ ] **Step 5: Verify and commit**

Run `npm test -- src/app/components/insights.test.jsx` and `npm run build`, then commit:

```bash
git add src/app
 git commit -m "feat: add light analytics charts and insights"
```

---

## Task 5: Add tables, search, and interaction states

**Files:**
- Create: `src/app/components/WalletSearch.jsx`
- Create: `src/app/components/DataSection.jsx`
- Create: `src/app/components/HoldersTable.jsx`
- Create: `src/app/components/PointsTable.jsx`
- Create: `src/app/components/data-section.test.jsx`
- Create: `src/app/app-state.js`
- Modify: `src/app/App.jsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- `searchWallet(rows, query) -> WalletRow | null`
- `<WalletSearch rows={rows} />`
- `<DataSection rows={rows} />`
- `<HoldersTable rows={rows} />`
- `<PointsTable rows={rows} />`

- [ ] **Step 1: Write interaction tests**

Cover:

```js
expect(searchWallet(rows, fullAddress)).toEqual(rows[0]);
expect(searchWallet(rows, fullAddress.toLowerCase())).toEqual(rows[0]);
expect(searchWallet(rows, 'not-a-wallet')).toBeNull();
```

Render the data section and assert that clicking “Points Leaderboard” sets `aria-selected="true"`, hides the holders table, and shows the points table. Test unknown search results and empty input states.

- [ ] **Step 2: Implement pure search/state helpers**

Keep search case-insensitive and exact against the full address. Keep active tab state local to `DataSection`; do not introduce a global state library.

- [ ] **Step 3: Implement wallet search**

Render a prominent search input with label, submit button, keyboard submission, loading-free immediate local lookup, and result card fields: balance, first seen, days held, estimated points. Use copyable/linkable full address. State the estimate clearly.

- [ ] **Step 4: Implement data tables**

Render accessible table headers, tabular numeric values, clickable Solscan addresses, restrained type labels, hover/focus rows, and horizontal overflow on small screens. Preserve all holders columns on desktop and allow mobile scrolling rather than crushing columns.

- [ ] **Step 5: Add focus/reduced-motion styling**

Add `:focus-visible` rings and a `prefers-reduced-motion: reduce` media query that disables nonessential transforms/transitions. Buttons use a specified transform transition and `scale(0.97)` on active, never `transition: all`.

- [ ] **Step 6: Verify and commit**

Run `npm test -- src/app/components/data-section.test.jsx` and `npm run build`, then commit:

```bash
git add src/app src/styles
 git commit -m "feat: add wallet search and holder data tables"
```

---

## Task 6: Connect the update workflow and static deployment

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `src/update_daily.mjs`
- Modify: `.gitignore`

**Interfaces:**
- `npm run build` produces `dist/` containing `index.html`, JS/CSS assets, and `data/dashboard.json`.
- GitHub Pages deploys `dist/` from the repository workflow.

- [ ] **Step 1: Add build/data verification tests**

Add a Node test or build verification script that asserts after generation/build:

```js
assert.equal(fs.existsSync('public/data/dashboard.json'), true);
assert.equal(fs.existsSync('dist/index.html'), true);
assert.match(fs.readFileSync('dist/index.html', 'utf8'), /rkuSOL Holder/);
```

- [ ] **Step 2: Add an explicit update-and-build command**

Add `npm run update` for `node src/update_daily.mjs` and `npm run update:build` for update followed by `npm run build`. Keep the existing data scripts intact and make failures exit nonzero with the failing command visible.

- [ ] **Step 3: Add GitHub Pages workflow**

The workflow must run on pushes to `main`, use Node, run `npm ci`, generate/update the snapshot from checked-in data or configured public data inputs, run `npm run build`, and deploy `dist/` using the official Pages actions. It must not expose secrets in logs.

- [ ] **Step 4: Update README**

Document local development, build, preview, update/build workflow, static data location, GitHub Pages deployment, Solscan link behavior, estimated points disclaimer, and known first-seen coverage limitations.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test
npm run build
npm run preview
```

Check the preview manually and commit:

```bash
git add .github package.json package-lock.json README.md src public .gitignore
 git commit -m "ci: build and deploy raiku dashboard with vite"
```

---

## Task 7: Full verification and visual QA

**Files:**
- Modify: any files needed to fix verified failures only
- Test: existing unit/component/build tests

- [ ] **Step 1: Run the full automated checks**

Run `npm test` and `npm run build`. Expected: all tests pass and Vite emits a clean `dist/` build without warnings that indicate broken imports.

- [ ] **Step 2: Run the local preview**

Run `npm run preview -- --host 127.0.0.1` and open the built app. Verify the real snapshot loads, the page background is white, the primary metric hierarchy is clear, charts are proportionate, and no dark-theme tokens remain.

- [ ] **Step 3: Exercise interactive states**

Verify a known wallet, unknown wallet, malformed input, empty input, both tabs, copy address, external Solscan links, chart tooltip, keyboard navigation, visible focus, and reduced-motion mode.

- [ ] **Step 4: Check responsive layouts**

At desktop, tablet, and mobile widths verify: primary/secondary metric grouping, one-column charts, readable tables with intentional horizontal scrolling, compact top bar, and no accidental overflow outside table containers.

- [ ] **Step 5: Check repository hygiene**

Run searches for old dark tokens (`--bg: #0b0b0f`, `--panel: #15151d`) and machine-specific paths (`C:/Deepseek-workspace`). Confirm they do not appear in active React/Vite code. Confirm `git diff --check` is clean.

- [ ] **Step 6: Commit final fixes and report**

Commit only verified fixes, record the final build/test output, and report the deployed artifact path or GitHub Pages URL after independently verifying it.

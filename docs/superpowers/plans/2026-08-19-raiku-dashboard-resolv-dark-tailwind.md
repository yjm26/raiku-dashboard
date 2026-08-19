# Raiku Resolv-Style Dark Tailwind Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing React/Vite Raiku dashboard into a dark Resolv-inspired protocol analytics layout and migrate the UI styling to Tailwind v4 without changing the data pipeline or snapshot contract.

**Architecture:** Keep the existing React component/data boundaries and Recharts data flow. Add Tailwind v4 through `@tailwindcss/vite`; use utility classes in components for layout and surfaces, with a small `global.css` for Tailwind import, base tokens, focus/reduced-motion rules, and Recharts selectors. Add a dedicated `ProtocolInfo` component and compose the dashboard as a header plus one-third/two-thirds grid.

**Tech Stack:** React, Vite, Tailwind CSS v4, `@tailwindcss/vite`, Recharts, Vitest, Testing Library.

## Global Constraints

- Canvas is near-black: `#0d0e0c`; surfaces are flat charcoal; no gradients or card shadows.
- Panels use `1px` subtle borders and `0–2px` radius; controls may use `5–8px` radius.
- Desktop shell is approximately `1145–1180px`; primary grid is `32.5% / 67.5%` with `16px` gap.
- Right metrics use `2fr 1fr 1fr`; one large chart panel follows.
- Mobile collapses to one column; body text remains at least `12px`.
- Existing snapshot JSON, data utilities, lookup, tables, links, and chart data remain compatible.
- Normal text and controls must meet WCAG AA contrast; visible keyboard focus is required.
- Do not copy Resolv branding, logos, text, author names, or metric meanings.
- Do not change data-pipeline scripts under `src/*.mjs` except if a build configuration requires no change; this plan is UI-only.

---

### Task 1: Add Tailwind v4 and replace the light theme foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.js`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Test: existing `src/app/App.test.jsx`, `src/app/data.test.js`

**Interfaces:**
- Vite continues to load `src/app/main.jsx`.
- Existing component class names may remain temporarily while Tasks 2–4 migrate them; no component should lose its current behavior.

- [ ] **Step 1: Add Tailwind dependencies**

Run from the isolated worktree:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Expected: `package.json` and `package-lock.json` include both packages; no unrelated dependency removal.

- [ ] **Step 2: Register the Vite plugin**

Update `vite.config.js` so the plugin list is:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', 'src/build_snapshot.test.mjs'],
  },
});
```

- [ ] **Step 3: Define dark design tokens**

Replace the light values in `src/styles/tokens.css` with the exact design values from the spec: canvas `#0d0e0c`, surface values `#1c1d1b`, `#111210`, `#20211f`, border values `#292a27` and `#353632`, warm primary text, muted secondary text, blue accent, button-light colors, radius, and easing variables.

- [ ] **Step 4: Replace the large light component stylesheet**

Rewrite `src/styles/global.css` to contain:

```css
@import "tailwindcss";

@layer base {
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html { min-width: 320px; background: #0d0e0c; }
  body { min-width: 320px; min-height: 100vh; margin: 0; background: #0d0e0c; color: #e5e5e2; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  button, input { font: inherit; }
  :focus-visible { outline: 2px solid #8198ff; outline-offset: 2px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

Keep only small compatibility selectors needed by Recharts and any not-yet-migrated component during the transition. Do not preserve the old light card gradients or shadows.

- [ ] **Step 5: Run the foundation gate**

```bash
npm test -- --run
npm run build
```

Expected: existing tests pass and Vite recognizes Tailwind without CSS processing errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js src/styles/tokens.css src/styles/global.css
git commit -m "chore: add tailwind dark dashboard foundation"
```

---

### Task 2: Build the dark shell, header, and left protocol information column

**Files:**
- Create: `src/app/components/ProtocolInfo.jsx`
- Modify: `src/app/components/AppShell.jsx`
- Modify: `src/app/components/TopBar.jsx`
- Modify: `src/app/App.jsx`
- Modify: `src/app/App.test.jsx`

**Interfaces:**
- `ProtocolInfo({ snapshot }) -> JSX` renders a semantic `<aside>` with identity and information panels.
- `AppShell({ children }) -> JSX` remains the top-level page wrapper and must retain `.app-shell` and `.app-shell--white` test-compatible classes only if existing tests still assert them; the visual class may be renamed after tests are updated.
- `TopBar({ snapshot }) -> JSX` retains the current Solscan link and timestamp behavior.

- [ ] **Step 1: Add failing shell assertions**

Extend `src/app/App.test.jsx` with assertions for:

```js
expect(screen.getByRole('complementary', { name: /raiku protocol/i })).toBeInTheDocument();
expect(screen.getByText('Raiku')).toBeInTheDocument();
expect(screen.getByRole('heading', { name: /network insights/i })).toBeInTheDocument();
```

Run:

```bash
npm test -- --run src/app/App.test.jsx
```

Expected: the new complementary region assertion fails because `ProtocolInfo` does not exist yet.

- [ ] **Step 2: Implement the shell grid**

`AppShell.jsx` should use Tailwind utilities similar to:

```jsx
export default function AppShell({ children }) {
  return (
    <div className="app-shell min-h-screen bg-[#0d0e0c] text-[#e5e5e2]">
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-8">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `ProtocolInfo.jsx`**

Use an `<aside aria-label="Raiku protocol information">` with two flat panels:

- Identity: Raiku mark/name and `rkuSOL Analytics`.
- Information: two or three concise paragraphs explaining rkuSOL, estimated points, data sources, and links to Solscan/methodology.

Use classes with `bg-[#1c1d1b]`, `border border-[#292a27]`, `rounded-[2px]`, `p-5`, `text-[#a8aaa5]`, and underlined links. Avoid copied Resolv text.

- [ ] **Step 4: Restructure the success layout**

In `App.jsx`, keep `TopBar` above the content and wrap the content after it with:

```jsx
<div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,0.485fr)_minmax(0,1fr)]">
  <ProtocolInfo snapshot={snapshot} />
  <main className="app-main min-w-0" aria-busy="false">...</main>
</div>
```

Keep loading/error states full-width and centered using utilities.

- [ ] **Step 5: Restyle `TopBar` with utilities**

Use a compact header: title/meta left, utility actions right. Preserve Solscan behavior and add a light `Analyze`/`Refresh` button only if it is wired to an existing behavior; otherwise use a non-action status element rather than a fake button. Ensure utility controls have accessible labels and focus states.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- --run
npm run build

git add src/app/App.jsx src/app/App.test.jsx src/app/components/AppShell.jsx src/app/components/TopBar.jsx src/app/components/ProtocolInfo.jsx
git commit -m "feat: add dark protocol dashboard shell"
```

---

### Task 3: Migrate metrics, header, cards, charts, and empty states to Tailwind

**Files:**
- Modify: `src/app/components/DashboardHeader.jsx`
- Modify: `src/app/components/MetricCard.jsx`
- Modify: `src/app/components/MetricGroup.jsx`
- Modify: `src/app/components/ChartCard.jsx`
- Modify: `src/app/components/PointsAccrualChart.jsx`
- Modify: `src/app/components/HolderGrowthChart.jsx`
- Modify: `src/app/components/InsightGrid.jsx`
- Modify: `src/app/components/DistributionCard.jsx`
- Modify: `src/app/components/TopHoldersCard.jsx`
- Modify: `src/app/components/NewHoldersCard.jsx`
- Modify: `src/app/components/insights.test.jsx`

**Interfaces:**
- Existing props stay unchanged: `snapshot`, `data`, `rows`, `primary`, `secondary`.
- Recharts keeps the same data keys: `points`, `holders`, and `label`.

- [ ] **Step 1: Add visual contract tests**

Extend `insights.test.jsx` to assert:

```js
expect(document.querySelector('.chart-card')).toHaveClass('border');
expect(screen.getByRole('region', { name: /points accrual/i })).toBeInTheDocument();
expect(screen.getByText(/top 10/i)).toBeInTheDocument();
```

- [ ] **Step 2: Migrate metric/header components**

Use utility classes for:

- Header title: compact `text-base`/`sm:text-lg`, not the previous oversized hero.
- Search: dark input, subtle border, blue focus ring, compact action button.
- Metric cards: `min-h-[100px]`, `border border-[#292a27]`, `bg-[#111210]`, `rounded-[2px]`, `p-2`, compact label, centered body where appropriate.
- Metric grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]`.
- Numeric values: `tabular-nums font-mono` where appropriate.

- [ ] **Step 3: Migrate chart cards**

`ChartCard` should render a flat dark panel with a compact header and `min-h-[300px]`. `PointsAccrualChart` and `HolderGrowthChart` should update Recharts colors:

```jsx
<CartesianGrid stroke="#292a27" vertical={false} />
<XAxis tick={{ fill: '#737570', fontSize: 10 }} />
<YAxis tick={{ fill: '#737570', fontSize: 10 }} />
<Tooltip contentStyle={{ background: '#20211f', border: '1px solid #353632', color: '#e5e5e2' }} />
```

Use blue for points and a restrained secondary accent for holders; do not add gradients.

- [ ] **Step 4: Migrate insight cards**

Apply the same flat panel classes to distribution, top-holder, and new-holder cards. Keep labels, rows, links, and values readable. Remove rounded white-card assumptions.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run
npm run build

git add src/app/components
 git commit -m "feat: migrate dashboard analytics to tailwind dark surfaces"
```

---

### Task 4: Migrate lookup, tables, methodology, and responsive behavior

**Files:**
- Modify: `src/app/components/WalletSearch.jsx`
- Modify: `src/app/components/DataSection.jsx`
- Modify: `src/app/components/HoldersTable.jsx`
- Modify: `src/app/components/PointsTable.jsx`
- Modify: `src/app/components/MethodologyNote.jsx`
- Modify: `src/app/components/data-section.test.jsx`
- Modify: `src/app/App.test.jsx`

**Interfaces:**
- `WalletSearch({ rows })` retains exact matching behavior and not-found status.
- `DataSection({ rows })` retains filter, tabs, and row count.
- Table rows continue to use existing `realRows` fields.

- [ ] **Step 1: Add responsive and dark-surface assertions**

Add DOM assertions for:

```js
expect(screen.getByRole('table')).toBeInTheDocument();
expect(screen.getByRole('tablist')).toBeInTheDocument();
expect(screen.getByRole('textbox', { name: /wallet address/i })).toBeInTheDocument();
```

- [ ] **Step 2: Migrate lookup and tabs**

Use dark inputs (`bg-[#111210]`, `text-[#e5e5e2]`, `placeholder:text-[#737570]`, `border-[#353632]`) and light primary action for the main lookup button only where appropriate. Keep result cards flat and compact.

- [ ] **Step 3: Migrate table styling**

Use a scroll wrapper with `overflow-x-auto`, dark table surface, thin row dividers, muted uppercase headers, tabular numeric cells, and blue underlined address links. Do not cause the overall page to overflow horizontally.

- [ ] **Step 4: Migrate methodology and responsive classes**

Use a full-width `Performance`/methodology section heading with `bg-[#1c1d1b]`, then stack to one column below `768px`. Keep body copy at least `12px` on mobile.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run
npm run build

git add src/app/components src/app/App.test.jsx
git commit -m "feat: polish dark lookup and data surfaces"
```

---

### Task 5: Final browser QA, accessibility checks, and deployment verification

**Files:**
- Modify: `README.md` only if Tailwind/Vercel setup documentation is missing.
- No data-pipeline source changes.

- [ ] **Step 1: Run complete test/build gates**

```bash
npm run test:all
npm run build
git diff --check HEAD
```

Expected: all Vitest tests pass, Node snapshot test passes, Vite build passes, and diff check is clean.

- [ ] **Step 2: Run the local app for browser QA**

```bash
npm run dev -- --host 127.0.0.1 --port 8766
```

Open `http://127.0.0.1:8766/` and verify:

- dark canvas and charcoal panels are visible;
- header actions are aligned;
- left protocol info and right metrics/chart grid appear at desktop width;
- performance/data section follows without white surfaces;
- chart tooltips and lookup still work;
- mobile viewport stacks the layout without shell overflow;
- no console errors occur.

- [ ] **Step 3: Check the Tailwind migration boundary**

Run a source scan limited to UI files and confirm:

```text
No light-theme values such as #ffffff backgrounds remain in active UI component classes.
No transition: all remains.
Tailwind package and @tailwindcss/vite plugin are present.
```

- [ ] **Step 4: Commit any final docs/QA fixes**

```bash
git add README.md src/app src/styles package.json package-lock.json vite.config.js
git commit -m "chore: verify dark tailwind dashboard release"
```

- [ ] **Step 5: Deployment check**

Push the completed branch to the configured Vercel-connected branch only after the local gates pass. Verify the deployed page title and presence of `Raiku Dashboard`, `Network insights`, and the dark canvas; do not claim deployment success from a local build alone.

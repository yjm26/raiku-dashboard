import { useEffect, useState } from 'react';
import { formatNumber, loadDashboardSnapshot } from './data.js';
import AppShell from './components/AppShell.jsx';
import DashboardHeader from './components/DashboardHeader.jsx';
import MetricGroup from './components/MetricGroup.jsx';
import TopBar from './components/TopBar.jsx';
import ProtocolInfo from './components/ProtocolInfo.jsx';
import InsightGrid from './components/InsightGrid.jsx';
import WalletSearch from './components/WalletSearch.jsx';
import DataSection from './components/DataSection.jsx';
import ApyCalculator from './components/ApyCalculator.jsx';
import FaqSection from './components/FaqSection.jsx';

function LoadingState() { return <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-4" aria-busy="true"><div className="w-full border border-rule bg-surface p-6" role="status"><p className="m-0 text-[13px] uppercase text-muted">Raiku / loading</p><h1 className="mt-3 font-serif text-xl">Loading dashboard snapshot</h1><p className="text-[15px] text-muted">Fetching the latest rkuSOL holder data.</p></div></main>; }
function ErrorState({ error, onRetry }) { return <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-4" aria-busy="false"><div className="w-full border border-rule bg-surface p-6" role="alert"><p className="m-0 text-[13px] uppercase text-muted">Snapshot unavailable</p><h1 className="mt-3 font-serif text-xl">Couldn&apos;t load the dashboard snapshot</h1><p className="text-[15px] text-muted">{error.message || 'The snapshot could not be loaded right now.'}</p><button className="mt-4 border border-rule bg-accent px-4 py-2 text-[15px] font-medium text-page" type="button" onClick={onRetry}>Try again</button></div></main>; }

// Compute delta vs previous day from history (sorted by date, oldest first).
// Returns { text, tone } — tone 'up' (green) / 'down' (red) / null.
function deltaFromHistory(history, key, { fmt, invert = false, suffix = '' } = {}) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const sorted = [...history].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const prev = sorted[sorted.length - 2];
  const cur = sorted[sorted.length - 1];
  const prevV = prev?.[key];
  const curV = cur?.[key];
  if (prevV == null || curV == null) return null;
  const diff = curV - prevV;
  if (Math.abs(diff) < 1e-9) return null;
  const sign = invert ? -diff : diff;
  const tone = sign > 0 ? 'up' : 'down';
  const num = fmt ? fmt(diff) : (Math.abs(diff) >= 1000 ? Math.round(diff).toLocaleString() : diff.toFixed(1));
  const arrow = sign > 0 ? '↑' : '↓';
  return { text: `${arrow}${Math.abs(sign) > 1e-9 && !fmt ? (diff > 0 ? '' : '') : ''}${num}${suffix}`, tone };
}

export default function App() {
  const [attempt, setAttempt] = useState(0); const [state, setState] = useState({ status: 'loading', snapshot: null, error: null });
  useEffect(() => { let active = true; setState({ status: 'loading', snapshot: null, error: null }); loadDashboardSnapshot().then((snapshot) => { if (active) setState({ status: 'success', snapshot, error: null }); }).catch((error) => { if (active) setState({ status: 'error', snapshot: null, error: error instanceof Error ? error : new Error('Unknown snapshot error.') }); }); return () => { active = false; }; }, [attempt]);
  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={() => setAttempt((value) => value + 1)} />;
  const { snapshot } = state; const stats = snapshot.stats; const apyValue = Number(stats.apyPct); const apyLabel = stats.apyPct == null || !Number.isFinite(apyValue) ? '—' : `${formatNumber(apyValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const tvlSolValue = Number(stats.tvlSol); const tvlSolLabel = Number.isFinite(tvlSolValue) && tvlSolValue > 0 ? `${formatNumber(tvlSolValue, { maximumFractionDigits: 0 })} SOL` : '—';
  const rateValue = Number(stats.rateSolPerRkuSol); const rateLabel = Number.isFinite(rateValue) && rateValue > 0 ? formatNumber(rateValue, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '—';
  const history = snapshot.history || [];
  const hSupply = deltaFromHistory(history, 'supply', { fmt: (d) => `${d >= 0 ? '+' : ''}${Math.round(d).toLocaleString()}` });
  const hHolders = deltaFromHistory(history, 'holders', { fmt: (d) => `${d >= 0 ? '+' : ''}${Math.round(d)}` });
  const hWallets = deltaFromHistory(history, 'realWallets', { fmt: (d) => `${d >= 0 ? '+' : ''}${Math.round(d)}` });
  const hTvl = deltaFromHistory(history, 'tvlSol', { fmt: (d) => `${d >= 0 ? '+' : ''}${Math.round(d).toLocaleString()}` });
  const primary = [
    { label: 'Supply', value: formatNumber(stats.supply), detail: 'rkuSOL in circulation', tone: 'blue', emphasis: true, hint: 'Total rkuSOL token supply currently in circulation, from on-chain token accounts.', delta: hSupply?.text, deltaTone: hSupply?.tone },
    { label: 'Holders', value: formatNumber(stats.totalOwners, { maximumFractionDigits: 0 }), detail: 'all token accounts', hint: 'Every owner of a rkuSOL token account, including pools and program accounts.', delta: hHolders?.text, deltaTone: hHolders?.tone },
    { label: 'Real wallets', value: formatNumber(stats.realWallets, { maximumFractionDigits: 0 }), detail: 'excluding pools and PDAs', tone: 'green', hint: 'Only System-Program-owned accounts. Pools and program accounts (Sanctum, Jupiter, etc.) and closed accounts are excluded and labeled in the Type column.', delta: hWallets?.text, deltaTone: hWallets?.tone },
    { label: 'Total estimated points', value: formatNumber(stats.totalPoints, { maximumFractionDigits: 0 }), detail: 'across active holders', tone: 'blue', emphasis: true, hint: 'Sum of balance × days held for all active holders. An estimate, not an official Raiku figure.' },
  ];
  const secondary = [{ label: 'APY', value: apyLabel, detail: 'latest reported rate', hint: 'Annual yield reported by the Raiku staking API. Daily yield ≈ APY ÷ 365.' }, { label: 'TVL', value: tvlSolLabel, detail: 'total value locked', tone: 'green', hint: 'Total SOL staked via rkuSOL, from the Raiku staking API.', delta: hTvl?.text, deltaTone: hTvl?.tone }, { label: 'rkuSOL rate', value: rateLabel, detail: 'SOL per rkuSOL', tone: 'blue', hint: 'Exchange rate: 1 rkuSOL = this much SOL. Calculated as TVL ÷ rkuSOL supply. Above 1 means yield has accrued.' }, { label: 'Daily points', value: formatNumber(stats.dailyPoints, { maximumFractionDigits: 0 }), detail: 'estimated daily accrual', tone: 'green', hint: 'Approximate points the whole active-holder set accrues per day.' }, { label: 'Official holders', value: formatNumber(stats.officialHolders, { maximumFractionDigits: 0 }), detail: 'Raiku API reference', hint: 'Holder count reported by the Raiku staking API.' }, { label: 'Top-10 concentration', value: stats.top10Share == null ? '—' : `${formatNumber(stats.top10Share, { maximumFractionDigits: 1 })}%`, detail: 'share of total supply', tone: 'amber', hint: 'Percentage of total supply held by the ten largest accounts.' }];
  return <AppShell><TopBar snapshot={snapshot} /><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(340px,0.62fr)_minmax(0,1.38fr)]"><ProtocolInfo snapshot={snapshot} /><main className="app-main min-w-0" aria-busy="false"><DashboardHeader snapshot={snapshot} /><MetricGroup primary={primary} secondary={secondary} /></main></div><InsightGrid snapshot={snapshot} /><WalletSearch rows={snapshot.realRows} /><DataSection rows={snapshot.realRows} allRows={snapshot.allRows} /><ApyCalculator snapshot={snapshot} /><FaqSection coverage={snapshot.coverage} snapshot={snapshot} /></AppShell>;
}

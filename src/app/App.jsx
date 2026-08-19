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
import MethodologyNote from './components/MethodologyNote.jsx';

function LoadingState() { return <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-4" aria-busy="true"><div className="w-full border border-rule bg-surface p-6" role="status"><p className="m-0 text-[13px] uppercase text-muted">Raiku / loading</p><h1 className="mt-3 font-serif text-xl">Loading dashboard snapshot</h1><p className="text-[15px] text-muted">Fetching the latest rkuSOL holder data.</p></div></main>; }
function ErrorState({ error, onRetry }) { return <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-4" aria-busy="false"><div className="w-full border border-rule bg-surface p-6" role="alert"><p className="m-0 text-[13px] uppercase text-muted">Snapshot unavailable</p><h1 className="mt-3 font-serif text-xl">Couldn&apos;t load the dashboard snapshot</h1><p className="text-[15px] text-muted">{error.message || 'The snapshot could not be loaded right now.'}</p><button className="mt-4 border border-rule bg-accent px-4 py-2 text-[15px] font-medium text-page" type="button" onClick={onRetry}>Try again</button></div></main>; }

export default function App() {
  const [attempt, setAttempt] = useState(0); const [state, setState] = useState({ status: 'loading', snapshot: null, error: null });
  useEffect(() => { let active = true; setState({ status: 'loading', snapshot: null, error: null }); loadDashboardSnapshot().then((snapshot) => { if (active) setState({ status: 'success', snapshot, error: null }); }).catch((error) => { if (active) setState({ status: 'error', snapshot: null, error: error instanceof Error ? error : new Error('Unknown snapshot error.') }); }); return () => { active = false; }; }, [attempt]);
  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={() => setAttempt((value) => value + 1)} />;
  const { snapshot } = state; const stats = snapshot.stats; const apyValue = Number(stats.apyPct); const apyLabel = stats.apyPct == null || !Number.isFinite(apyValue) ? '—' : `${formatNumber(apyValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const primary = [
    { label: 'Supply', value: formatNumber(stats.supply), detail: 'rkuSOL in circulation', tone: 'blue', emphasis: true },
    { label: 'Holders', value: formatNumber(stats.totalOwners, { maximumFractionDigits: 0 }), detail: 'all token accounts' },
    { label: 'Real wallets', value: formatNumber(stats.realWallets, { maximumFractionDigits: 0 }), detail: 'excluding pools and PDAs', tone: 'green' },
    { label: 'Total estimated points', value: formatNumber(stats.totalPoints, { maximumFractionDigits: 0 }), detail: 'across tracked wallets', tone: 'blue', emphasis: true },
  ];
  const secondary = [{ label: 'APY', value: apyLabel, detail: 'latest reported rate' }, { label: 'Daily points', value: formatNumber(stats.dailyPoints, { maximumFractionDigits: 0 }), detail: 'estimated daily accrual', tone: 'green' }, { label: 'Official holders', value: formatNumber(stats.officialHolders, { maximumFractionDigits: 0 }), detail: 'Raiku API reference' }, { label: 'Top-10 concentration', value: stats.top10Share == null ? '—' : `${formatNumber(stats.top10Share, { maximumFractionDigits: 1 })}%`, detail: 'share of total supply', tone: 'amber' }];
  return <AppShell><TopBar snapshot={snapshot} /><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(340px,0.62fr)_minmax(0,1.38fr)]"><ProtocolInfo snapshot={snapshot} /><main className="app-main min-w-0" aria-busy="false"><DashboardHeader snapshot={snapshot} /><MetricGroup primary={primary} secondary={secondary} /></main></div><InsightGrid snapshot={snapshot} /><WalletSearch rows={snapshot.realRows} /><DataSection rows={snapshot.realRows} /><MethodologyNote coverage={snapshot.coverage} /></AppShell>;
}

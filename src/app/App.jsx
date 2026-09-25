import { useEffect, useState } from 'react';
import { formatCompact, formatNumber, leaderboardRows, loadDashboardSnapshot } from './data.js';
import AppShell from './components/AppShell.jsx';
import TopBar from './components/TopBar.jsx';
import DashboardHeader from './components/DashboardHeader.jsx';
import MetricGroup from './components/MetricGroup.jsx';
import WalletSearch from './components/WalletSearch.jsx';
import InsightGrid from './components/InsightGrid.jsx';
import DataSection from './components/DataSection.jsx';
import ApyHistory from './components/ApyHistory.jsx';
import LstComparison from './components/LstComparison.jsx';
import StakePoolCard from './components/StakePoolCard.jsx';
import ApyCalculator from './components/ApyCalculator.jsx';
import ProtocolInfo from './components/ProtocolInfo.jsx';
import FaqSection from './components/FaqSection.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import LoadingState from './components/LoadingState.jsx';

function ErrorState({ error, onRetry }) {
  return <main className="grid min-h-screen place-items-center bg-page px-4 text-ink" aria-busy="false">
    <div className="panel w-full max-w-md p-6" role="alert">
      <h1 className="m-0 text-[18px] font-semibold">Couldn&apos;t load the dashboard snapshot</h1>
      <p className="m-0 mt-2 text-[14px] text-muted">{error.message || 'The snapshot could not be loaded right now.'}</p>
      <button className="btn btn-accent mt-5" type="button" onClick={onRetry}>Try again</button>
    </div>
  </main>;
}

// Change between the two latest daily records (history sorted oldest first).
function dailyChange(history, key) {
  if (history.length < 2) return null;
  const prev = Number(history[history.length - 2]?.[key]);
  const cur = Number(history[history.length - 1]?.[key]);
  return Number.isFinite(prev) && Number.isFinite(cur) ? cur - prev : null;
}

// Last 30 daily values of one history field, for the sparklines.
const recent = (history, key) => history.slice(-30).map((entry) => Number(entry?.[key])).filter(Number.isFinite);

export default function App() {
  const [attempt, setAttempt] = useState(0); const [state, setState] = useState({ status: 'loading', snapshot: null, error: null });
  useEffect(() => { let active = true; setState({ status: 'loading', snapshot: null, error: null }); loadDashboardSnapshot().then((snapshot) => { if (active) setState({ status: 'success', snapshot, error: null }); }).catch((error) => { if (active) setState({ status: 'error', snapshot: null, error: error instanceof Error ? error : new Error('Unknown snapshot error.') }); }); return () => { active = false; }; }, [attempt]);
  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={() => setAttempt((value) => value + 1)} />;
  const { snapshot } = state; const stats = snapshot.stats;
  const history = [...(snapshot.history || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const apyValue = Number(stats.apyPct); const apyLabel = stats.apyPct == null || !Number.isFinite(apyValue) ? '—' : `${formatNumber(apyValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const tvlSolValue = Number(stats.tvlSol); const hasTvl = Number.isFinite(tvlSolValue) && tvlSolValue > 0;
  const tvlUsdValue = Number(stats.tvlUsd ?? (tvlSolValue * Number(stats.solPriceUsd)));
  const rateValue = Number(stats.rateSolPerRkuSol); const rateLabel = Number.isFinite(rateValue) && rateValue > 0 ? `${formatNumber(rateValue, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL` : '—';
  // Same measure as the figure above it (with the ledger: all points earned so far, daily).
  const pointsTrend = (snapshot.dailyTimeline || []).slice(snapshot.ledger ? -30 : -12).map((entry) => entry?.points);
  // With the ledger, wallets that sold out stay on the leaderboard with the points they earned.
  const pointsRows = snapshot.ledger ? leaderboardRows(snapshot.realRows, snapshot.formerHolders) : snapshot.realRows;
  const primary = [
    { label: 'Supply', value: formatNumber(stats.supply, { maximumFractionDigits: 0 }), unit: 'rkuSOL', detail: 'in circulation', hint: 'Total rkuSOL tokens in circulation, from on-chain token accounts. This is the token count (rkuSOL), not the staked value in SOL.', change: dailyChange(history, 'supply'), changeDigits: 2, trend: recent(history, 'supply') },
    { label: 'TVL', value: hasTvl ? formatNumber(tvlSolValue, { maximumFractionDigits: 0 }) : '—', unit: hasTvl ? 'SOL' : null, detail: Number.isFinite(tvlUsdValue) && tvlUsdValue > 0 ? `≈ $${formatCompact(tvlUsdValue, 2)}` : 'total value locked', hint: 'Total SOL staked via rkuSOL, from the Raiku staking API. TVL = supply × rate — different unit (SOL) from supply (rkuSOL), so the numbers differ.', change: dailyChange(history, 'tvlSol'), trend: recent(history, 'tvlSol') },
    { label: 'Real wallets', value: formatNumber(stats.realWallets, { maximumFractionDigits: 0 }), detail: 'excl. pools and programs', hint: 'Personal wallets only. Addresses controlled by programs (pools, lending markets, vaults, multisigs) are excluded and labeled in the holder table.', change: dailyChange(history, 'realWallets'), trend: recent(history, 'realWallets') },
    { label: 'Total estimated points', value: formatNumber(stats.totalPoints, { maximumFractionDigits: 0 }), detail: Number.isFinite(Number(stats.dailyPoints)) ? `+${formatNumber(stats.dailyPoints, { maximumFractionDigits: 0 })} a day` : 'across active holders', hint: snapshot.ledger ? 'Points earned since launch by every wallet: 1 point per rkuSOL per day actually held. Wallets that sold out keep what they earned, so they count here too. An estimate, not an official Raiku figure.' : 'Sum of balance × days held for all active holders. An estimate, not an official Raiku figure.', trend: pointsTrend },
  ];
  const secondary = [
    { label: 'APY', value: apyLabel, hint: 'Annual yield reported by the Raiku staking API. Daily yield ≈ APY ÷ 365.' },
    { label: 'rkuSOL rate', value: rateLabel, hint: 'Exchange rate: 1 rkuSOL = this much SOL, as reported by the Raiku staking API. It rises every epoch as rewards are added.' },
    { label: 'Holders', value: formatNumber(stats.totalOwners, { maximumFractionDigits: 0 }), hint: 'Every owner of a rkuSOL token account, including pools and program accounts.' },
    { label: 'Official holders', value: formatNumber(stats.officialHolders, { maximumFractionDigits: 0 }), hint: 'Holder count reported by the Raiku staking API.' },
    { label: 'Top-10 concentration', value: stats.top10Share == null ? '—' : `${formatNumber(stats.top10Share, { maximumFractionDigits: 1 })}%`, hint: 'Percentage of total supply held by the ten largest accounts.' },
  ];
  return <AppShell>
    <TopBar snapshot={snapshot} />
    <main className="app-main min-w-0" aria-busy="false">
      <DashboardHeader snapshot={snapshot} />
      <MetricGroup primary={primary} secondary={secondary} />
      <WalletSearch rows={pointsRows} includesFormer={Boolean(snapshot.ledger)} />
      <InsightGrid snapshot={snapshot} />
      <DataSection rows={pointsRows} allRows={snapshot.allRows} former={snapshot.ledger ? snapshot.formerHolders || [] : null} />
      <ApyHistory history={history} />
      <LstComparison comparison={snapshot.lstComparison} mint={snapshot.mint} />
      <StakePoolCard pool={snapshot.stakePool} />
      <ApyCalculator snapshot={snapshot} />
      <div className="mt-14 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><ProtocolInfo /><FaqSection coverage={snapshot.coverage} snapshot={snapshot} /></div>
    </main>
    <SiteFooter />
  </AppShell>;
}

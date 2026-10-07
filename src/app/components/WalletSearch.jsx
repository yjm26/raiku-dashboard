import { useState } from 'react';
import Tooltip from './Tooltip.jsx';
import { formatAddress, formatNumber } from '../data.js';
import { searchWallet } from './app-state.js';

const leftOn = (ms) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(ms));

export default function WalletSearch({ rows = [], includesFormer = false, yt = null }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  function submit(event) {
    event.preventDefault();
    // A wallet may hold YT without ever holding rkuSOL itself (bought with SOL on Exponent).
    const ytOnly = searchWallet(yt?.holders || [], query);
    setResult(searchWallet(rows, query) ?? (ytOnly ? { owner: ytOnly.owner, amount: 0, daysHeld: 0, score: 0, rank: null } : null));
    setSearched(true);
  }
  const ytRow = result && yt ? yt.holders.find((row) => row.owner === result.owner) : null;
  const rankHint = includesFormer
    ? 'Among personal wallets since launch, including wallets that left. Other leaderboards may count a different set.'
    : 'Among current personal wallets, by estimated points. Other leaderboards may count a different set.';
  const figures = result ? [
    ['Rank', result.rank ? `#${result.rank}` : '—', false, rankHint],
    ['Wallet', formatAddress(result.owner, 6, 6), true],
    ['Balance', `${formatNumber(result.amount)} rkuSOL`],
    ['Days held', formatNumber(result.daysHeld, { maximumFractionDigits: 1 })],
    ['Estimated points', formatNumber(result.score, { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    result.exitMs ? ['Left on', leftOn(result.exitMs)] : ['Daily points', `+${formatNumber(result.amount)}`],
    ...(ytRow ? [
      ['YT staked', `${formatNumber(ytRow.yt)} YT`, false, 'YT-rkuSOL this wallet has staked on Exponent now.'],
      ['YT points', formatNumber(ytRow.points, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), false, `Estimate: ${yt.pointsPerYtDay} points per staked YT per day, the Raiku boost Exponent lists for YT. Raiku's official points (Polyfeed) showed no YT when checked, so these aren't included in Estimated points or Rank.`],
    ] : []),
  ] : [];

  return <section className="panel mt-10 p-4 sm:p-6" aria-labelledby="lookup-title">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
      <div className="shrink-0 lg:w-60">
        <h2 id="lookup-title" className="m-0 text-[19px] font-medium leading-tight tracking-[-0.012em] text-ink">Look up a wallet</h2>
        <p className="m-0 mt-0.5 text-[13px] text-muted">Rank, balance and estimated points</p>
      </div>
      <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row" role="search">
        <label className="sr-only" htmlFor="wallet-lookup-input">Wallet address</label>
        <input id="wallet-lookup-input" className="field min-w-0 font-mono text-[13px] sm:flex-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Paste a wallet address or part of it" autoComplete="off" spellCheck={false} />
        <button className="btn btn-accent shrink-0" type="submit">Search wallet</button>
      </form>
    </div>
    {searched && (result
      ? <dl className={`m-0 mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule ${figures.length > 6 ? 'sm:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-6'}`} role="status">
        {figures.map(([label, value, mono, hint]) => <div className="min-w-0 bg-surface px-4 py-3" key={label}>
          <dt className="label">{hint ? <Tooltip label={label} hint={hint} floating /> : label}</dt>
          <dd className={`m-0 mt-1 truncate text-[15px] font-medium tabular-nums text-ink ${mono ? 'font-mono text-[14px]' : ''}`}>{value}</dd>
        </div>)}
      </dl>
      : <div className="mt-4 rounded-lg border border-rule bg-surface-muted px-4 py-3" role="status">
        <p className="m-0 text-[14px] text-ink">No matching wallet found in this snapshot.</p>
        <p className="m-0 mt-1 text-[13px] text-muted">{includesFormer
          ? 'No personal wallet with rkuSOL history since launch matches that address. Pools and program accounts are not listed here.'
          : 'The wallet may have unstaked or moved its rkuSOL, or the address belongs to a pool or program. Only current holders are tracked.'}</p>
      </div>)}
  </section>;
}

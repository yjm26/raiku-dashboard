import { useState } from 'react';
import ExternalLink from './ExternalLink.jsx';
import Tooltip from './Tooltip.jsx';
import { formatAddress, formatNumber } from '../data.js';

const RANGES = [['d1', '1 day'], ['d7', '7 days']];
const signed = (value) => `${value >= 0 ? '+' : '−'}${formatNumber(Math.abs(value))}`;

// Personal-wallet flows from the holder ledger: who joined, who sold out, and the biggest changes.
export default function HolderFlowsCard({ flows }) {
  const [range, setRange] = useState('d7');
  const f = flows[range];
  const movers = [...f.topIn.slice(0, 5), ...f.topOut.slice(0, 5)];
  const figures = [
    ['Joined', f.joined.count, signed(f.joined.amount), 'Wallets that held no rkuSOL at the start of the period and hold some now.'],
    ['Left', f.exited.count, signed(-f.exited.amount), 'Wallets that held rkuSOL at the start of the period and hold none now.'],
    ['Net change', signed(f.net), 'rkuSOL', 'Combined change in the rkuSOL held by personal wallets over the period.'],
  ];

  return <section className="panel flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="flows-title">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h3 id="flows-title" className="m-0 text-[15px] font-semibold text-ink">Holder flows</h3>
      <div className="inline-flex rounded-lg border border-rule p-0.5" role="group" aria-label="Period">
        {RANGES.map(([key, label]) => <button key={key} type="button" aria-pressed={range === key} onClick={() => setRange(key)} className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${range === key ? 'bg-surface-muted text-ink' : 'text-muted hover:text-ink'}`}>{label}</button>)}
      </div>
    </header>
    <dl className="m-0 mt-4 grid grid-cols-3 gap-3">
      {figures.map(([label, value, detail, hint]) => <div key={label} className="min-w-0">
        <dt className="text-[12px] text-muted"><Tooltip label={label} hint={hint} placement="bottom" /></dt>
        <dd className="m-0 mt-1 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink">{value}</dd>
        <dd className="m-0 mt-0.5 truncate text-[12px] tabular-nums text-muted">{detail}</dd>
      </div>)}
    </dl>
    <p className="m-0 mt-5 text-[12px] text-muted">Biggest changes</p>
    {movers.length ? <ol className="m-0 mt-1 list-none p-0">
      {movers.map((m) => <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-rule py-2 text-[13px] first:border-t-0" key={m.owner}>
        <ExternalLink href={`https://solscan.io/account/${m.owner}`} icon={false} className="truncate font-mono text-ink underline-offset-4 hover:underline">{formatAddress(m.owner)}</ExternalLink>
        <span className="tabular-nums text-ink">{signed(m.change)}</span>
      </li>)}
    </ol> : <p className="m-0 mt-2 text-[13px] text-muted">No wallet balance changes in this period.</p>}
  </section>;
}

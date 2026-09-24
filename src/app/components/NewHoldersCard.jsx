import ExternalLink from './ExternalLink.jsx';
import { formatAddress, formatNumber } from '../data.js';

function date(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d); }

export default function NewHoldersCard({ rows = [] }) {
  return <section className="panel flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="new-holders-title">
    <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3 id="new-holders-title" className="m-0 text-[15px] font-semibold text-ink">New holders</h3>
      <p className="m-0 text-[13px] text-muted">{rows.length} in the last 7 days</p>
    </header>
    {rows.length ? <ol className="m-0 mt-3 list-none p-0">
      {rows.slice(0, 6).map((row) => <li className="grid grid-cols-[minmax(0,1fr)_auto_3.25rem] items-center gap-3 border-t border-rule py-2.5 text-[13px] first:border-t-0" key={row.owner}>
        <ExternalLink href={`https://solscan.io/account/${row.owner}`} icon={false} className="truncate font-mono text-ink underline-offset-4 hover:underline">{formatAddress(row.owner)}</ExternalLink>
        <span className="tabular-nums text-ink">{formatNumber(row.amount)}</span>
        <span className="text-right text-muted">{date(row.firstMs)}</span>
      </li>)}
    </ol> : <p className="m-0 mt-3 text-[13px] text-muted">No new holders in the last 7 days.</p>}
  </section>;
}

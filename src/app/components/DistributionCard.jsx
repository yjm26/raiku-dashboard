import ExternalLink from './ExternalLink.jsx';
import { formatAddress, formatNumber } from '../data.js';

const KINDS = {
  pool: { label: 'Pool or program', color: 'var(--seg-pool)' },
  wallet: { label: 'Wallet', color: 'var(--seg-wallet)' },
  rest: { label: '', color: 'var(--seg-rest)' },
};

const pct = (value) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;

// Accounts holding at least 1% of supply get their own segment; everyone else shares one.
function buildSegments(snapshot) {
  const stats = snapshot?.stats || {};
  const large = (snapshot?.topHolders || []).filter((row) => Number(row.sharePct) >= 1);
  if (!large.length) return [];
  const segments = large.map((row) => ({
    key: row.owner,
    owner: row.owner,
    name: row.isPda ? row.pdaLabel || 'Pool or program' : formatAddress(row.owner),
    kind: row.isPda ? 'pool' : 'wallet',
    amount: Number(row.amount),
    share: Number(row.sharePct),
  }));
  const restShare = Math.max(0, 100 - segments.reduce((sum, s) => sum + s.share, 0));
  const others = Number(stats.totalOwners) - segments.length;
  const supply = Number(stats.supply);
  if (restShare > 0) {
    segments.push({
      key: 'rest',
      name: others > 0 ? `${formatNumber(others, { maximumFractionDigits: 0 })} other accounts` : 'Other accounts',
      kind: 'rest',
      amount: Number.isFinite(supply) ? (supply * restShare) / 100 : null,
      share: restShare,
    });
  }
  return segments;
}

export default function DistributionCard({ snapshot }) {
  const top = Number(snapshot?.stats?.top10Share || 0);
  const segments = buildSegments(snapshot);
  return <section className="panel flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="distribution-title">
    <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 id="distribution-title" className="m-0 text-[15px] font-semibold text-ink">Holder distribution</h3>
      <p className="m-0 text-[13px] text-muted">Top 10 accounts hold <span className="font-medium text-ink">{pct(top)}</span></p>
    </header>
    {segments.length ? <>
      <div className="mt-5 flex h-6 gap-[2px]" role="img" aria-label={`Share of supply: ${segments.map((s) => `${s.name} ${pct(s.share)}`).join(', ')}`}>
        {segments.map((s) => <span key={s.key} className="min-w-[4px] rounded-[4px]" style={{ flex: `${s.share} 1 0%`, background: KINDS[s.kind].color }} title={`${s.name}: ${pct(s.share)}`} />)}
      </div>
      <table className="mt-4 w-full border-collapse text-[13px]">
        <caption className="sr-only">Largest holders by share of supply</caption>
        <thead className="sr-only"><tr><th scope="col">Holder</th><th scope="col">Type</th><th scope="col">rkuSOL</th><th scope="col">Share</th></tr></thead>
        <tbody>{segments.map((s) => <tr key={s.key} className="border-t border-rule first:border-t-0">
          <td className="w-full max-w-0 py-2.5 pr-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: KINDS[s.kind].color }} aria-hidden="true" />
              {s.owner
                ? <ExternalLink href={`https://solscan.io/account/${s.owner}`} icon={false} className={`truncate text-ink underline-offset-4 hover:underline ${s.kind === 'wallet' ? 'font-mono' : ''}`}>{s.name}</ExternalLink>
                : <span className="truncate text-muted">{s.name}</span>}
            </span>
          </td>
          <td className="hidden whitespace-nowrap py-2.5 pr-6 text-muted sm:table-cell">{KINDS[s.kind].label}</td>
          <td className="whitespace-nowrap py-2.5 pr-3 text-right tabular-nums text-ink">{s.amount == null ? '—' : formatNumber(s.amount)}</td>
          <td className="w-16 whitespace-nowrap py-2.5 text-right tabular-nums text-ink">{pct(s.share)}</td>
        </tr>)}</tbody>
      </table>
    </> : null}
  </section>;
}

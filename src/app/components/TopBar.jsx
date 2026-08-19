import ExternalLink from './ExternalLink.jsx';

function formatSnapshotTime(timestamp) {
  if (!timestamp) return 'Snapshot pending';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Snapshot unavailable';
  return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(date)} UTC`;
}

export default function TopBar({ snapshot }) {
  const mint = snapshot?.mint ?? '';
  const solscanUrl = mint ? `https://solscan.io/token/${mint}` : 'https://solscan.io';
  return <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border border-rule bg-surface px-3 py-3 sm:px-4">
    <div><h1 className="m-0 text-lg font-bold tracking-[-0.04em] sm:text-xl">Raiku Dashboard</h1><div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted"><span>rkuSOL analytics</span><span aria-hidden="true">/</span><span>Solana</span><span aria-hidden="true">/</span><span>{formatSnapshotTime(snapshot?.ts)}</span></div></div>
    <div className="flex items-center gap-2 text-xs"><span className="inline-flex h-8 items-center border border-rule px-2 font-mono text-[10px] uppercase tracking-wide text-muted">live snapshot</span><ExternalLink className="inline-flex h-8 items-center border border-rule px-3 text-ink no-underline transition-colors hover:bg-ink hover:text-white" href={solscanUrl} aria-label="View token on Solscan">Solscan ↗</ExternalLink></div>
  </header>;
}

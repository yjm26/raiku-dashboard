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
  return <header className="flex flex-wrap items-start justify-between gap-3 py-4">
    <div><h1 className="m-0 font-serif text-base font-normal text-[#222] sm:text-lg">Raiku Dashboard</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted"><span>rkuSOL analytics</span><span aria-hidden="true">/</span><span>Solana</span><span aria-hidden="true">/</span><span>{formatSnapshotTime(snapshot?.ts)}</span></div></div>
    <div className="flex items-center gap-2"><span className="inline-flex h-7 items-center border border-rule bg-surface px-2.5 text-[10px] text-muted">live snapshot</span><ExternalLink className="inline-flex h-7 items-center border border-rule bg-surface px-2.5 text-[10px] text-[#333] no-underline hover:bg-surface-muted" href={solscanUrl} aria-label="View token on Solscan">Solscan ↗</ExternalLink></div>
  </header>;
}

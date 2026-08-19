import { useEffect, useState } from 'react';
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
  const [dark, setDark] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem('raiku-theme');
    if (stored) return stored === 'dark';
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage?.setItem('raiku-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return <header className="flex flex-wrap items-start justify-between gap-3 py-4">
    <div><h1 className="m-0 font-serif text-base font-normal text-ink sm:text-lg">Raiku Dashboard</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted"><span>rkuSOL analytics</span><span aria-hidden="true">/</span><span>Solana</span><span aria-hidden="true">/</span><span>{formatSnapshotTime(snapshot?.ts)}</span></div></div>
    <div className="flex items-center gap-2">
      <button type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark((value) => !value)} className="inline-flex h-7 items-center border border-rule bg-surface px-2.5 text-[10px] text-muted hover:bg-surface-muted">{dark ? 'light' : 'dark'}</button>
      <span className="inline-flex h-7 items-center border border-rule bg-surface px-2.5 text-[10px] text-muted">live snapshot</span>
      <ExternalLink className="inline-flex h-7 items-center border border-rule bg-surface px-2.5 text-[10px] text-ink no-underline hover:bg-surface-muted" href={solscanUrl} aria-label="View token on Solscan">Solscan ↗</ExternalLink>
    </div>
  </header>;
}

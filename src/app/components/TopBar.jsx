import { useEffect, useState } from 'react';

function formatSnapshotTime(timestamp) {
  if (!timestamp) return 'Snapshot pending';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Snapshot unavailable';
  return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(date)} UTC`;
}

const GitHubIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>;

const ExternalIcon = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3.5 8.5L8.5 3.5M4 3.5h4.5V8"/></svg>;

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
    <div><h1 className="m-0 font-serif text-3xl font-normal text-ink sm:text-4xl">Raiku Dashboard</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted"><span>rkuSOL analytics</span><span aria-hidden="true">/</span><span>Solana</span><span aria-hidden="true">/</span><span>{formatSnapshotTime(snapshot?.ts)}</span></div></div>
    <div className="flex items-center gap-2">
      <button type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark((value) => !value)} className="inline-flex h-8 w-8 items-center justify-center border border-rule bg-surface text-ink hover:bg-surface-muted">{dark ? '☀' : '☾'}</button>
      <a aria-label="GitHub repository" href="https://github.com/yjm26/raiku-dashboard" target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center border border-rule bg-surface text-ink hover:bg-surface-muted"><GitHubIcon /></a>
      <a aria-label="View token on Solscan" href={solscanUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 border border-rule bg-surface px-2.5 text-[13px] text-ink no-underline hover:bg-surface-muted">Solscan<ExternalIcon /></a>
    </div>
  </header>;
}

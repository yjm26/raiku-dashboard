import { useEffect, useState } from 'react';

const GitHubIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" /></svg>;

const SunIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;

const MoonIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" /></svg>;

const ExternalIcon = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3.5 8.5L8.5 3.5M4 3.5h4.5V8" /></svg>;

function readTheme() {
  try {
    const stored = localStorage.getItem('raiku-theme');
    if (stored) return stored === 'dark';
  } catch {
    // Storage can be blocked; fall back to the system preference.
  }
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

export default function TopBar({ snapshot }) {
  const mint = snapshot?.mint ?? '';
  const solscanUrl = mint ? `https://solscan.io/token/${mint}` : 'https://solscan.io';
  const [dark, setDark] = useState(readTheme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000204' : '#f6f8fa');
    try { localStorage.setItem('raiku-theme', dark ? 'dark' : 'light'); } catch { /* not persisted */ }
  }, [dark]);

  return <header className="flex h-16 items-center justify-between gap-3 border-b border-rule">
    <div className="flex min-w-0 items-center gap-3">
      <img src="/raiku-logo-dark.png" alt="Raiku" width="99" height="15" className="h-[15px] w-auto brightness-0 dark:brightness-100" />
      <span className="hidden h-4 w-px shrink-0 bg-rule-strong sm:block" aria-hidden="true" />
      <span className="hidden truncate text-[13px] font-medium text-muted sm:inline">Holder dashboard</span>
    </div>
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark((value) => !value)} className="btn btn-icon">{dark ? <SunIcon /> : <MoonIcon />}</button>
      <a aria-label="GitHub repository" href="https://github.com/yjm26/raiku-dashboard" target="_blank" rel="noreferrer" className="btn btn-icon"><GitHubIcon /></a>
      <a aria-label="View token on Solscan" href={solscanUrl} target="_blank" rel="noreferrer" className="btn">Solscan<ExternalIcon /></a>
    </div>
  </header>;
}

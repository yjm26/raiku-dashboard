import AppShell from './AppShell.jsx';

// Skeleton of the top of the dashboard, shown while the snapshot loads.
// index.html carries a static copy so it paints before the JS bundle runs.
const HERO = ['Supply', 'TVL', 'Real wallets', 'Total estimated points'];
const FIGURES = ['APY', 'rkuSOL rate', 'Holders', 'Official holders', 'Top-10 concentration'];
const bar = (className) => <span className={`skeleton block ${className}`} />;

export default function LoadingState() {
  return <AppShell>
    <header className="flex h-16 items-center justify-between gap-3 border-b border-rule">
      <div className="flex min-w-0 items-center gap-3">
        <img src="/raiku-logo-dark.png" alt="Raiku" width="99" height="15" className="h-[15px] w-auto brightness-0 dark:brightness-100" />
        <span className="hidden h-4 w-px shrink-0 bg-rule-strong sm:block" aria-hidden="true" />
        <span className="hidden truncate text-[13px] font-medium text-muted sm:inline">Holder dashboard</span>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">{bar('h-9 w-9 rounded-lg')}{bar('h-9 w-9 rounded-lg')}{bar('h-9 w-[92px] rounded-lg')}</div>
    </header>
    <main className="app-main min-w-0" aria-busy="true">
      <p className="sr-only" role="status">Loading dashboard snapshot</p>
      <div aria-hidden="true">
        <div className="pb-7 pt-10 sm:pb-8 sm:pt-14">
          <p className="m-0 text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[48px]">rkuSOL Holder &amp; Points</p>
          <div className="mt-3 flex h-[21px] items-center">{bar('h-3.5 w-64 max-w-full')}</div>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule lg:grid-cols-4">
          {HERO.map((label) => <div key={label} className="flex min-w-0 flex-col bg-surface p-4 sm:p-5">
            <p className="m-0 truncate text-[13px] text-muted">{label}</p>
            <div className="mt-3 h-[26px] sm:h-[34px]">{bar('h-full w-3/4')}</div>
            <div className="mt-2.5 flex h-[19.5px] items-center">{bar('h-3 w-1/2')}</div>
            <div className="mt-auto h-[52px]" />
          </div>)}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5 lg:px-5">
          {FIGURES.map((label) => <div key={label} className="min-w-0">
            <p className="m-0 truncate text-[13px] text-muted">{label}</p>
            <div className="mt-1 flex h-[27px] items-center">{bar('h-[18px] w-20')}</div>
          </div>)}
        </div>
        <div className="panel mt-8 flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-8">
          <div className="shrink-0 lg:w-60">
            <p className="m-0 text-[15px] font-semibold text-ink">Look up a wallet</p>
            <p className="m-0 mt-0.5 text-[13px] text-muted">Rank, balance and estimated points</p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">{bar('h-10 rounded-lg sm:flex-1')}{bar('h-10 rounded-lg sm:w-32')}</div>
        </div>
        <div className="mt-14">
          <p className="m-0 mb-4 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink">Distribution and growth</p>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="panel h-[330px] p-4 sm:p-5">{bar('h-4 w-40')}{bar('mt-7 h-6 w-full')}</div>
            <div className="panel h-[330px] p-4 sm:p-5">{bar('h-4 w-28')}</div>
          </div>
        </div>
      </div>
    </main>
  </AppShell>;
}

import AppShell from './AppShell.jsx';

// Skeleton of the top of the dashboard, shown while the snapshot loads.
// index.html carries a static copy so it paints before the JS bundle runs.
const HERO = ['Supply', 'TVL', 'Real wallets', 'Total estimated points'];
const FIGURES = ['APY', 'rkuSOL rate', 'Holders', 'Official holders', 'Top-10 concentration'];
const bar = (className) => <span className={`skeleton block ${className}`} />;

export default function LoadingState() {
  return <AppShell>
    <header className="-mx-4 flex h-[72px] items-center justify-between gap-3 border-b border-rule px-4 sm:-mx-6 sm:px-6 lg:-mx-14 lg:px-14">
      <div className="flex min-w-0 items-center gap-3">
        <img src="/raiku-logo-dark.png" alt="Raiku" width="112" height="17" className="h-[17px] w-auto opacity-[.86] brightness-0" />
        <span className="hidden h-4 w-px shrink-0 bg-rule-strong sm:block" aria-hidden="true" />
        <span className="label hidden truncate sm:inline">Holder dashboard</span>
      </div>
      <div className="flex items-center gap-2" aria-hidden="true">{bar('h-10 w-10')}{bar('h-10 w-[101px]')}</div>
    </header>
    <main className="app-main min-w-0" aria-busy="true">
      <p className="sr-only" role="status">Loading dashboard snapshot</p>
      <div aria-hidden="true">
        <div className="pb-12 pt-12 sm:pb-14 sm:pt-16">
          <p className="m-0 text-[38px] font-medium leading-none tracking-[-0.03em] text-ink sm:text-[64px]"><em className="font-normal">rkuSOL</em> Holder &amp; Points</p>
          <p className="m-0 mt-6 max-w-[620px] text-[17px] leading-[1.6] tracking-[-0.011em] text-muted">Holders, balances and estimated points for Raiku&apos;s liquid staking token, rebuilt every day from on-chain data.</p>
          <p className="label m-0 mt-5"><span className="skeleton inline-block h-3 w-48 align-middle" /></p>
        </div>
        <div className="crop grid grid-cols-2 gap-px border border-rule-strong bg-rule lg:grid-cols-4">
          {HERO.map((label) => <div key={label} className="flex min-w-0 flex-col bg-surface p-4 sm:p-6">
            <p className="label m-0 truncate">{label}</p>
            <div className="mt-4 h-[28px] sm:h-[36px]">{bar('h-full w-3/4')}</div>
            <div className="mt-2.5 flex h-[19.5px] items-center">{bar('h-3 w-1/2')}</div>
            <div className="mt-auto h-[52px]" />
          </div>)}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:px-6">
          {FIGURES.map((label) => <div key={label} className="min-w-0">
            <p className="label m-0 truncate">{label}</p>
            <div className="mt-1.5 flex h-[30px] items-center">{bar('h-5 w-20')}</div>
          </div>)}
        </div>
        <div className="panel mt-10 flex flex-col gap-3 p-4 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="shrink-0 lg:w-60">
            <p className="m-0 text-[19px] font-medium leading-tight tracking-[-0.012em] text-ink">Look up a wallet</p>
            <p className="m-0 mt-0.5 text-[13px] text-muted">Rank, balance and estimated points</p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">{bar('h-11 sm:flex-1')}{bar('h-11 sm:w-[134px]')}</div>
        </div>
        <div className="mt-20 sm:mt-24">
          <div className="mb-7 grid gap-x-8 gap-y-3 lg:grid-cols-2 lg:items-end"><p className="m-0 text-[28px] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-[36px]">Distribution and growth</p></div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="panel h-[330px] p-4 sm:p-5">{bar('h-5 w-44')}{bar('mt-7 h-6 w-full')}</div>
            <div className="panel h-[330px] p-4 sm:p-5">{bar('h-5 w-32')}</div>
          </div>
        </div>
      </div>
    </main>
  </AppShell>;
}

import ExternalLink from './ExternalLink.jsx';

export default function ProtocolInfo({ snapshot }) {
  const mint = snapshot?.mint ?? '';
  return <aside aria-label="Raiku protocol information" className="grid content-start gap-3">
    <section className="flex min-h-[140px] items-center border border-rule bg-surface-muted px-6 py-5">
      <div>
        <p className="m-0 text-[10px] text-muted">Protocol analytics</p>
        <img src="/raiku-logo.jpg" alt="Raiku" className="mt-2 h-10 w-auto max-w-[280px] object-contain dark:hidden" />
        <h2 className="m-0 mt-2 hidden text-5xl font-bold tracking-[-0.04em] text-ink dark:block">Raiku</h2>
        <p className="m-0 mt-1.5 text-[11px] font-medium text-[#333] dark:text-muted">rkuSOL holder intelligence</p>
      </div>
    </section>
    <section className="border border-rule bg-surface-muted p-5 text-xs leading-6 text-[#303030] dark:text-muted">
      <p className="mt-0">A compact view of rkuSOL supply, holder distribution, and estimated points derived from public on-chain balances.</p>
      <p>Use this dashboard to inspect wallet concentration, holder growth, and the points estimate across real wallets. Values are analytical estimates, not an official Raiku leaderboard.</p>
      <p className="mb-0 text-[11px] text-muted">Source: Solana RPC and Raiku staking data. Coverage is shown in the methodology panel.</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium">
        <ExternalLink aria-label="View token on Solscan" className="text-ink underline underline-offset-2" href={mint ? `https://solscan.io/token/${mint}` : 'https://solscan.io'}>Token on Solscan</ExternalLink>
        <a className="text-ink underline underline-offset-2" href="#methodology">Methodology</a>
      </div>
    </section>
  </aside>;
}

import ExternalLink from './ExternalLink.jsx';

export default function ProtocolInfo({ snapshot }) {
  const mint = snapshot?.mint ?? '';
  return <aside aria-label="Raiku protocol information" className="grid content-start gap-3">
    <section className="flex min-h-[160px] items-center justify-center border border-rule bg-transparent px-4 py-6">
      <img src="/raiku-logo.jpg" alt="Raiku" className="h-12 w-auto max-w-[300px] object-contain dark:hidden" />
      <img src="/raiku-logo-dark.png" alt="Raiku" className="hidden h-12 w-auto max-w-[300px] object-contain dark:block" />
    </section>
    <section className="border border-rule bg-surface-muted p-5 text-[13px] leading-6 text-[#303030] dark:text-muted">
      <p className="mt-0">A compact view of rkuSOL supply, holder distribution, and estimated points derived from public on-chain balances.</p>
      <p>Use this dashboard to inspect wallet concentration, holder growth, and the points estimate across real wallets. Values are analytical estimates, not an official Raiku leaderboard.</p>
      <p className="mb-0 text-[12px] text-muted">Source: Solana RPC and Raiku staking data. Coverage is shown in the methodology panel.</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-medium">
        <ExternalLink aria-label="View token on Solscan" className="text-ink underline underline-offset-2" href={mint ? `https://solscan.io/token/${mint}` : 'https://solscan.io'}>Token on Solscan</ExternalLink>
        <a className="text-ink underline underline-offset-2" href="#methodology">Methodology</a>
      </div>
    </section>
  </aside>;
}

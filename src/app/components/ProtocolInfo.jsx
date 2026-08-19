import ExternalLink from './ExternalLink.jsx';

export default function ProtocolInfo({ snapshot }) {
  const mint = snapshot?.mint ?? '';
  return <aside aria-label="Raiku protocol information" className="grid content-start gap-4">
    <section className="flex min-h-[108px] items-center border border-rule bg-surface-muted p-5"><div><p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Protocol analytics</p><h2 className="m-0 mt-2 text-3xl font-black tracking-[-0.08em]">Raiku</h2><p className="m-0 mt-1 text-xs font-semibold">rkuSOL holder intelligence</p></div></section>
    <section className="border border-rule bg-surface p-5 text-sm leading-6"><p className="mt-0">A compact view of rkuSOL supply, holder distribution, and estimated points derived from public on-chain balances.</p><p>Use this dashboard to inspect wallet concentration, holder growth, and the points estimate across real wallets. Values are analytical estimates, not an official Raiku leaderboard.</p><p className="mb-0 text-xs text-muted">Source: Solana RPC and Raiku staking data. Coverage is shown in the methodology panel.</p><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold"><ExternalLink aria-label="View token on Solscan" href={mint ? `https://solscan.io/token/${mint}` : 'https://solscan.io'}>Token on Solscan</ExternalLink><a className="underline underline-offset-4" href="#methodology">Methodology</a></div></section>
  </aside>;
}

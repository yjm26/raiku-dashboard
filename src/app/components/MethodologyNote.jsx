export default function MethodologyNote({ coverage }) {
  return <section id="methodology" className="mt-4 border-t-2 border-rule bg-surface-muted p-3 text-[13px] leading-5 text-muted" aria-labelledby="methodology-title">
    <h2 id="methodology-title" className="m-0 text-[15px] font-bold uppercase text-ink">Methodology &amp; sources</h2>
    <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
      <p className="m-0"><strong className="text-ink">Estimated points</strong></p>
      <p className="m-0">balance × days held since first acquisition. An analytical estimate, not an official Raiku or Discord figure.</p>
      <p className="m-0"><strong className="text-ink">Coverage</strong></p>
      <p className="m-0">{coverage?.found ?? 0}/{coverage?.total ?? 0} real wallets tracked from public on-chain data.</p>
    </div>
  </section>;
}

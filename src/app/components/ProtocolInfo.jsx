import ExternalLink from './ExternalLink.jsx';

const XIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;

const GlobeIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>;

export default function ProtocolInfo() {
  return <aside aria-labelledby="about-title" className="panel flex min-w-0 flex-col p-5 sm:p-6">
    <img src="/raiku-logo-dark.png" alt="Raiku" width="119" height="18" className="h-[18px] w-auto self-start brightness-0 dark:brightness-100" />
    <h2 id="about-title" className="m-0 mt-7 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink">About rkuSOL</h2>
    <p className="m-0 mt-3 text-[14px] leading-relaxed text-muted">Raiku is a lightweight Solana validator client built for speed. It handles Ahead-Of-Time (AOT) compute reservations and Just-In-Time (JIT) MEV bundle processing, tuned for low latency and high throughput.</p>
    <p className="m-0 mt-3 text-[14px] leading-relaxed text-muted">rkuSOL is Raiku&apos;s liquid staking token. It routes SOL to validators running the Raiku client, and stakers earn a share of validator rewards proportional to their stakeweight. Validators generate income from AOT and JIT transaction types, plus MEV and network rewards.</p>
    <div className="mt-auto flex flex-wrap gap-2 pt-6">
      <ExternalLink aria-label="Raiku on X" className="btn" href="https://x.com/raikucom" icon={false}><XIcon />@raikucom</ExternalLink>
      <ExternalLink aria-label="Raiku website" className="btn" href="https://raiku.com/stake" icon={false}><GlobeIcon />raiku.com</ExternalLink>
    </div>
  </aside>;
}

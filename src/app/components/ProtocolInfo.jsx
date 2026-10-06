import ExternalLink from './ExternalLink.jsx';

const XIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;

const GlobeIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>;

// Where rkuSOL's yield comes from, as stated on raiku.com/stake.
const STREAMS = [
  ['Base', 'SOL staking rewards', 'Earning today.', true],
  ['Variable', 'Validator MEV', 'Earning today.', true],
  ['Planned', 'Additional staker rewards', "Funded by Raiku's execution business. Not live today.", false],
];

export default function ProtocolInfo() {
  return <aside aria-labelledby="about-title" className="panel flex min-w-0 flex-col p-5 sm:p-6">
    <img src="/raiku-logo-dark.png" alt="Raiku" width="119" height="18" className="h-[18px] w-auto self-start opacity-[.86] brightness-0" />
    <h2 id="about-title" className="m-0 mt-7 text-[24px] font-medium leading-tight tracking-[-0.018em] text-ink">About rkuSOL</h2>
    <p className="m-0 mt-3 text-[15px] leading-[1.6] text-muted">rkuSOL is Raiku&apos;s liquid staking token: SOL delegated to validators running Raiku&apos;s client. It can be held, traded or used as collateral across Solana while the stake keeps earning.</p>
    <p className="m-0 mt-3 text-[15px] leading-[1.6] text-muted">Raiku is building Blackline, trading software that runs next to its own validator. The more SOL is staked with Raiku, the more often that validator builds blocks.</p>
    <div className="mt-6 border-t border-rule pt-5">
      <h3 className="m-0 text-[15px] font-medium text-ink">Where the yield comes from</h3>
      <ul className="m-0 mt-2 list-none p-0">
        {STREAMS.map(([kind, name, status, live]) => <li key={name} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-t border-rule py-3 first:border-t-0">
          <span className="label pt-0.5">{kind}</span>
          <span className="min-w-0">
            <span className={`block text-[15px] text-ink ${live ? '' : 'underline decoration-[var(--tick)] decoration-dashed underline-offset-[5px]'}`}>{name}</span>
            <span className="mt-0.5 block text-[13px] text-muted">{status}</span>
          </span>
        </li>)}
      </ul>
    </div>
    <div className="mt-auto flex flex-wrap gap-2 pt-6">
      <ExternalLink aria-label="Raiku on X" className="btn" href="https://x.com/raikucom" icon={false}><XIcon />@raikucom</ExternalLink>
      <ExternalLink aria-label="Raiku website" className="btn" href="https://raiku.com/stake" icon={false}><GlobeIcon />raiku.com</ExternalLink>
    </div>
  </aside>;
}

import { useState } from 'react';
import CopyAddressButton from './CopyAddressButton.jsx';
import ExternalLink from './ExternalLink.jsx';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export default function DashboardHeader({ snapshot, onSearch = () => {} }) {
  const [query, setQuery] = useState('');
  const mint = snapshot?.mint ?? '';
  const solscanUrl = mint ? `https://solscan.io/token/${mint}` : 'https://solscan.io';

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <section className="dashboard-header" aria-labelledby="dashboard-title">
      <div className="dashboard-header__intro">
        <p className="eyebrow">Dashboard · Solana · Raiku liquid staking</p>
        <h1 id="dashboard-title">rkuSOL Holder &amp; Points</h1>
        <p className="dashboard-header__description">
          Explore holder distribution and estimated points accrued from rkuSOL balances over time.
          Points are estimates based on first acquisition and are not official Raiku or Discord figures.
        </p>
      </div>
      <div className="dashboard-header__details">
        <span className="dashboard-header__detail-label">Token</span>
        <CopyAddressButton value={mint} />
        <ExternalLink href={solscanUrl} aria-label="View token on Solscan">View token on Solscan</ExternalLink>
        <span className="dashboard-header__separator" aria-hidden="true">·</span>
        <span>Snapshot {formatDate(snapshot?.ts)}</span>
        <span className="dashboard-header__separator" aria-hidden="true">·</span>
        <span>Launch {formatDate(snapshot?.stats?.launchDate)}</span>
      </div>
      <form className="wallet-search" onSubmit={handleSubmit} role="search">
        <label htmlFor="wallet-search-input">Search a wallet</label>
        <div className="wallet-search__controls">
          <span className="wallet-search__icon" aria-hidden="true">⌕</span>
          <input
            id="wallet-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Paste a wallet address to view balance and estimated points"
          />
          <button type="submit">Search</button>
        </div>
        <p className="wallet-search__hint">Wallet search results will appear here when the lookup is available.</p>
      </form>
    </section>
  );
}

import ExternalLink from './ExternalLink.jsx';

function formatSnapshotTime(timestamp) {
  if (!timestamp) return 'Snapshot pending';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Snapshot unavailable';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date) + ' UTC';
}

export default function TopBar({ snapshot }) {
  const mint = snapshot?.mint ?? '';
  const solscanUrl = mint ? `https://solscan.io/token/${mint}` : 'https://solscan.io';

  return (
    <header className="topbar">
      <a className="topbar__brand" href="/" aria-label="Raiku rkuSOL Analytics home">
        <span className="topbar__mark" aria-hidden="true">r</span>
        <span className="topbar__brand-copy">
          <strong>Raiku</strong>
          <span>rkuSOL Analytics</span>
        </span>
      </a>
      <div className="topbar__meta" aria-label="Dashboard status">
        <span className="status-pill"><span className="status-pill__dot" aria-hidden="true" />Solana · Live</span>
        <span className="topbar__timestamp">{formatSnapshotTime(snapshot?.ts)}</span>
        <ExternalLink className="topbar__link" href={solscanUrl} aria-label="View token on Solscan">Solscan</ExternalLink>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { formatAddress, formatNumber } from '../data.js';
import { searchWallet } from './app-state.js';

export default function WalletSearch({ rows = [] }) {
  const [query, setQuery] = useState(''); const [result, setResult] = useState(null); const [searched, setSearched] = useState(false);
  function submit(event) { event.preventDefault(); setResult(searchWallet(rows, query)); setSearched(true); }
  return <section className="wallet-lookup" aria-labelledby="lookup-title"><div className="section-heading"><div><p className="section-heading__eyebrow">Wallet lookup</p><h2 id="lookup-title">Inspect a holder</h2></div></div><form onSubmit={submit} className="lookup-form"><label htmlFor="wallet-lookup-input">Wallet address</label><div className="lookup-form__controls"><input id="wallet-lookup-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Paste a full Solana wallet address" /><button className="button button--primary" type="submit">Search wallet</button></div></form>{searched && (result ? <div className="lookup-result" role="status"><div><span className="lookup-result__label">Wallet</span><strong className="mono">{formatAddress(result.owner, 8, 8)}</strong></div><div><span className="lookup-result__label">Balance</span><strong>{formatNumber(result.amount)} rkuSOL</strong></div><div><span className="lookup-result__label">Days held</span><strong>{formatNumber(result.daysHeld, { maximumFractionDigits: 1 })}</strong></div><div><span className="lookup-result__label">Estimated points</span><strong>{formatNumber(result.score, { maximumFractionDigits: 0 })}</strong></div></div> : <p className="lookup-empty" role="status">No matching wallet found in this snapshot.</p>)}</section>;
}

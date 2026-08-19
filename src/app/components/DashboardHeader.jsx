import { useState } from 'react';

export default function DashboardHeader({ onSearch = () => {} }) {
  const [query, setQuery] = useState('');
  function handleSubmit(event) { event.preventDefault(); onSearch(query.trim()); }
  return <section className="mb-4" aria-labelledby="dashboard-title"><div className="flex flex-wrap items-end justify-between gap-4"><h2 id="dashboard-title" className="m-0 font-serif text-2xl font-normal text-ink sm:text-3xl">rkuSOL Holder &amp; Points</h2><form className="flex min-w-0 gap-2" onSubmit={handleSubmit} role="search"><label className="sr-only" htmlFor="wallet-search-input">Search a wallet</label><input id="wallet-search-input" className="min-w-0 flex-1 border border-rule bg-surface px-3 py-1.5 text-[13px] outline-none placeholder:text-[#999] focus:ring-2 focus:ring-accent sm:w-72" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search wallet address" /><button className="h-7 border border-[#1b1b1b] bg-[#1b1b1b] px-3 text-[12px] font-medium text-white hover:opacity-90" type="submit">Search</button></form></div></section>;
}

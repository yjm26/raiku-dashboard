import { useMemo, useState } from 'react';
import HoldersTable from './HoldersTable.jsx';
import PointsTable from './PointsTable.jsx';

const PAGE_SIZE = 20;

function usePagedRows(rows, filter, typeFilter, page) {
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let out = rows;
    if (q) out = out.filter((r) => r.owner.toLowerCase().includes(q));
    if (typeFilter !== 'all') {
      out = out.filter((r) => {
        if (typeFilter === 'wallet') return !r.isPda;
        if (typeFilter === 'pool') return r.isPda && r.pdaLabel && !r.pdaLabel.includes('Closed');
        if (typeFilter === 'closed') return r.isPda && r.pdaLabel && r.pdaLabel.includes('Closed');
        return true;
      });
    }
    return out;
  }, [rows, filter, typeFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return { filtered, pageRows, totalPages, safePage };
}

export default function DataSection({ rows = [], allRows = [] }) {
  const [tab, setTab] = useState('holders');
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const rowsSource = tab === 'holders' && allRows.length ? allRows : rows;

  function changePage(next) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  function sortRows(list) {
    if (!sortKey) return list;
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string') return va.localeCompare(vb) * dir;
      return ((va ?? -Infinity) - (vb ?? -Infinity)) * dir;
    });
  }

  const { filtered, pageRows, totalPages, safePage } = usePagedRows(rowsSource, filter, typeFilter, page);
  const sortedPageRows = sortRows(pageRows);

  return (
    <section className="mt-4" aria-labelledby="data-title">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-rule bg-surface-muted px-2 py-2">
        <div>
          <p className="m-0 font-mono text-[12px] uppercase tracking-wide text-muted">Explore the snapshot</p>
          <h2 id="data-title" className="m-0 text-[15px] font-bold uppercase">Holder data</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filter by type" className="border border-rule bg-surface px-2 py-2 font-mono text-[12px] outline-none focus:ring-2 focus:ring-accent" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="all">All types</option>
            <option value="wallet">Wallets</option>
            <option value="pool">Pools / Programs</option>
            <option value="closed">Closed accounts</option>
          </select>
          <input aria-label="Filter holders" className="border border-rule bg-surface px-3 py-2 font-mono text-[13px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} placeholder="Filter address…" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-b border-rule pb-2" role="tablist" aria-label="Holder data views">
        <button role="tab" aria-selected={tab === 'holders'} className={`border px-3 py-2 text-[13px] font-semibold ${tab === 'holders' ? 'border-rule bg-accent text-page' : 'border-transparent text-muted hover:border-rule'}`} onClick={() => setTab('holders')}>All holders</button>
        <button role="tab" aria-selected={tab === 'points'} className={`border px-3 py-2 text-[13px] font-semibold ${tab === 'points' ? 'border-rule bg-accent text-page' : 'border-transparent text-muted hover:border-rule'}`} onClick={() => setTab('points')}>Points leaderboard</button>
        <span className="ml-auto font-mono text-[12px] text-muted">{filtered.length.toLocaleString()} rows · page {safePage}/{totalPages}</span>
      </div>
      {tab === 'holders' ? <HoldersTable rows={sortedPageRows} startRank={(safePage - 1) * PAGE_SIZE} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} /> : <PointsTable rows={sortedPageRows} startRank={(safePage - 1) * PAGE_SIZE} />}
      <nav className="mt-2 flex items-center justify-end gap-2" aria-label="Holder data pagination">
        <button className="border border-rule bg-surface px-3 py-1.5 font-mono text-[13px] disabled:opacity-40" disabled={safePage <= 1} onClick={() => changePage(safePage - 1)}>‹ prev</button>
        <span className="font-mono text-[12px] text-muted">{safePage} / {totalPages}</span>
        <button className="border border-rule bg-surface px-3 py-1.5 font-mono text-[13px] disabled:opacity-40" disabled={safePage >= totalPages} onClick={() => changePage(safePage + 1)}>next ›</button>
      </nav>
    </section>
  );
}

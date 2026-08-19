import { useMemo, useState } from 'react';
import HoldersTable from './HoldersTable.jsx';
import PointsTable from './PointsTable.jsx';

const PAGE_SIZE = 20;

function usePagedRows(rows, filter, page) {
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? rows.filter((r) => r.owner.toLowerCase().includes(q)) : rows;
  }, [rows, filter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return { filtered, pageRows, totalPages, safePage };
}

export default function DataSection({ rows = [] }) {
  const [tab, setTab] = useState('holders');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const { filtered, pageRows, totalPages, safePage } = usePagedRows(rows, filter, page);

  function changePage(next) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  return (
    <section className="mt-4" aria-labelledby="data-title">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-rule bg-surface-muted px-2 py-2">
        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-wide text-muted">Explore the snapshot</p>
          <h2 id="data-title" className="m-0 text-sm font-bold uppercase">Holder data</h2>
        </div>
        <input aria-label="Filter holders" className="border border-rule bg-surface px-3 py-2 font-mono text-xs outline-none placeholder:text-muted focus:ring-2 focus:ring-accent" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} placeholder="Filter address…" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-b border-rule pb-2" role="tablist" aria-label="Holder data views">
        <button role="tab" aria-selected={tab === 'holders'} className={`border px-3 py-2 text-xs font-semibold ${tab === 'holders' ? 'border-rule bg-ink text-white' : 'border-transparent text-muted hover:border-rule'}`} onClick={() => setTab('holders')}>All holders</button>
        <button role="tab" aria-selected={tab === 'points'} className={`border px-3 py-2 text-xs font-semibold ${tab === 'points' ? 'border-rule bg-ink text-white' : 'border-transparent text-muted hover:border-rule'}`} onClick={() => setTab('points')}>Points leaderboard</button>
        <span className="ml-auto font-mono text-[10px] text-muted">{filtered.length.toLocaleString()} rows · page {safePage}/{totalPages}</span>
      </div>
      {tab === 'holders' ? <HoldersTable rows={pageRows} startRank={(safePage - 1) * PAGE_SIZE} /> : <PointsTable rows={pageRows} startRank={(safePage - 1) * PAGE_SIZE} />}
      <nav className="mt-2 flex items-center justify-end gap-2" aria-label="Holder data pagination">
        <button className="border border-rule bg-surface px-3 py-1.5 font-mono text-xs disabled:opacity-40" disabled={safePage <= 1} onClick={() => changePage(safePage - 1)}>‹ prev</button>
        <span className="font-mono text-[10px] text-muted">{safePage} / {totalPages}</span>
        <button className="border border-rule bg-surface px-3 py-1.5 font-mono text-xs disabled:opacity-40" disabled={safePage >= totalPages} onClick={() => changePage(safePage + 1)}>next ›</button>
      </nav>
    </section>
  );
}

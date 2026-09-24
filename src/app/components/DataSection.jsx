import { useMemo, useState } from 'react';
import HoldersTable from './HoldersTable.jsx';
import PointsTable from './PointsTable.jsx';
import SectionHeader from './SectionHeader.jsx';

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

const tabClass = (active) => `-mb-px border-b-2 px-0.5 pb-3 pt-1 text-[14px] font-medium transition-colors ${active ? 'border-accent-line text-ink' : 'border-transparent text-muted hover:text-ink'}`;

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
    <section className="mt-14" aria-labelledby="data-title">
      <SectionHeader id="data-title" title="Holder data">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <select aria-label="Filter by type" className="field h-9 w-auto shrink-0 pr-2 text-[13px]" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="all">All types</option>
            <option value="wallet">Wallets</option>
            <option value="pool">Pools and programs</option>
            <option value="closed">Closed accounts</option>
          </select>
          <input aria-label="Filter holders" className="field h-9 min-w-0 flex-1 font-mono text-[13px] sm:w-64 sm:flex-none" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} placeholder="Filter by address" autoComplete="off" spellCheck={false} />
        </div>
      </SectionHeader>
      <div className="flex flex-wrap items-end justify-between gap-x-4 border-b border-rule">
        <div className="flex gap-6" role="tablist" aria-label="Holder data views">
          <button role="tab" aria-selected={tab === 'holders'} className={tabClass(tab === 'holders')} onClick={() => setTab('holders')}>All holders</button>
          <button role="tab" aria-selected={tab === 'points'} className={tabClass(tab === 'points')} onClick={() => setTab('points')}>Points leaderboard</button>
        </div>
        <span className="pb-3 text-[13px] tabular-nums text-muted">{filtered.length.toLocaleString()} accounts</span>
      </div>
      {tab === 'holders' ? <HoldersTable rows={sortedPageRows} startRank={(safePage - 1) * PAGE_SIZE} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} /> : <PointsTable rows={sortedPageRows} startRank={(safePage - 1) * PAGE_SIZE} />}
      <nav className="mt-3 flex items-center justify-between gap-3" aria-label="Holder data pagination">
        <span className="text-[13px] tabular-nums text-muted">Page {safePage} of {totalPages}</span>
        <div className="flex gap-2">
          <button type="button" className="btn" disabled={safePage <= 1} onClick={() => changePage(safePage - 1)}>Previous</button>
          <button type="button" className="btn" disabled={safePage >= totalPages} onClick={() => changePage(safePage + 1)}>Next</button>
        </div>
      </nav>
    </section>
  );
}

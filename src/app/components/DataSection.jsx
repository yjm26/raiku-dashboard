import { useMemo, useState } from 'react';
import HoldersTable from './HoldersTable.jsx';
import PointsTable from './PointsTable.jsx';
import FormerHoldersTable from './FormerHoldersTable.jsx';
import SectionHeader from './SectionHeader.jsx';

const PAGE_SIZE = 20;

// Filter, then sort the whole list, then page it (sorting only the visible page would mislead).
function usePagedRows(rows, filter, typeFilter, sortKey, sortDir, page) {
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
    if (sortKey) {
      const dir = sortDir === 'desc' ? -1 : 1;
      out = [...out].sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (typeof va === 'string') return va.localeCompare(vb) * dir;
        return ((va ?? -Infinity) - (vb ?? -Infinity)) * dir;
      });
    }
    return out;
  }, [rows, filter, typeFilter, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return { filtered, pageRows, totalPages, safePage };
}

const tabClass = (active) => `-mb-px border-b-2 px-0.5 pb-3 pt-1 text-[14px] font-medium transition-colors ${active ? 'border-accent-line text-ink' : 'border-transparent text-muted hover:text-ink'}`;
const COUNT_LABEL = { holders: 'accounts', points: 'wallets', former: 'former holders' };

export default function DataSection({ rows = [], allRows = [], former = null }) {
  const [tab, setTab] = useState('holders');
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const rowsSource = tab === 'former' ? former || [] : tab === 'holders' && allRows.length ? allRows : rows;

  function changeTab(next) {
    setTab(next);
    setSortKey(null);
    setPage(1);
  }

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

  const { filtered, pageRows, totalPages, safePage } = usePagedRows(rowsSource, filter, tab === 'holders' ? typeFilter : 'all', sortKey, sortDir, page);
  const startRank = (safePage - 1) * PAGE_SIZE;

  return (
    <section className="mt-14" aria-labelledby="data-title">
      <SectionHeader id="data-title" title="Holder data">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {tab === 'holders' ? <select aria-label="Filter by type" className="field h-9 w-auto shrink-0 pr-2 text-[13px]" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="all">All types</option>
            <option value="wallet">Wallets</option>
            <option value="pool">Pools and programs</option>
            <option value="closed">Closed accounts</option>
          </select> : null}
          <input aria-label="Filter holders" className="field h-9 min-w-0 flex-1 font-mono text-[13px] sm:w-64 sm:flex-none" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} placeholder="Filter by address" autoComplete="off" spellCheck={false} />
        </div>
      </SectionHeader>
      <div className="flex flex-wrap items-end justify-between gap-x-4 border-b border-rule">
        <div className="flex gap-6 overflow-x-auto" role="tablist" aria-label="Holder data views">
          <button role="tab" aria-selected={tab === 'holders'} className={tabClass(tab === 'holders')} onClick={() => changeTab('holders')}>All holders</button>
          <button role="tab" aria-selected={tab === 'points'} className={tabClass(tab === 'points')} onClick={() => changeTab('points')}>Points leaderboard</button>
          {former ? <button role="tab" aria-selected={tab === 'former'} className={tabClass(tab === 'former')} onClick={() => changeTab('former')}>Former holders</button> : null}
        </div>
        <span className="pb-3 text-[13px] tabular-nums text-muted">{filtered.length.toLocaleString()} {COUNT_LABEL[tab]}</span>
      </div>
      {tab === 'former' ? <p className="m-0 mt-3 text-[13px] text-muted">Wallets that held rkuSOL at some point since launch and hold none today. Points are what they earned while holding.</p> : null}
      {tab === 'holders' ? <HoldersTable rows={pageRows} startRank={startRank} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
        : tab === 'points' ? <PointsTable rows={pageRows} startRank={startRank} exact={Boolean(former)} />
          : <FormerHoldersTable rows={pageRows} startRank={startRank} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />}
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

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DataSection from './DataSection.jsx';
import HolderFlowsCard from './HolderFlowsCard.jsx';
import WalletSearch from './WalletSearch.jsx';
import { leaderboardRows } from '../data.js';

afterEach(cleanup);

const holders = Array.from({ length: 25 }, (_, i) => ({ owner: `wallet${String(i).padStart(2, '0')}`, amount: i + 1, sharePct: 1, daysHeld: 10, score: (i + 1) * 10, isPda: false }));
const former = [
  { owner: 'gone1', rank: 1, points: 900, daysHeld: 30, peak: 50, firstMs: Date.parse('2026-05-20'), exitMs: Date.parse('2026-06-19') },
  { owner: 'gone2', rank: 2, points: 120, daysHeld: 4, peak: 30, firstMs: Date.parse('2026-08-01'), exitMs: Date.parse('2026-08-05') },
];

describe('holder data', () => {
  it('sorts the whole list, not just the visible page', () => {
    render(<DataSection rows={holders} allRows={holders} />);
    fireEvent.click(screen.getByRole('button', { name: 'rkuSOL' }));
    // Descending by amount: the largest balance (25) comes first even though it sat on page 2.
    const firstRow = screen.getAllByRole('row')[1];
    expect(within(firstRow).getByText('wallet24')).toBeInTheDocument();
  });

  it('lists former holders with the points they earned', () => {
    render(<DataSection rows={holders} allRows={holders} former={former} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Former holders' }));
    expect(screen.getByText('2 former holders')).toBeInTheDocument();
    expect(screen.getByText('gone1')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText('Jun 19, 2026')).toBeInTheDocument();
  });

  it('hides the former holders tab without a ledger', () => {
    render(<DataSection rows={holders} allRows={holders} />);
    expect(screen.queryByRole('tab', { name: 'Former holders' })).not.toBeInTheDocument();
  });
});

describe('leaderboard with former holders', () => {
  const current = [{ owner: 'holder', amount: 5, daysHeld: 20, score: 100, isPda: false }];

  it('ranks wallets that sold out by the points they kept', () => {
    const rows = leaderboardRows(current, former);
    expect(rows.map((r) => [r.owner, r.rank, r.score, r.amount])).toEqual([['gone1', 1, 900, 0], ['gone2', 2, 120, 0], ['holder', 3, 100, 5]]);
  });

  it('finds a former holder in the wallet lookup, with the date it left', () => {
    render(<WalletSearch rows={leaderboardRows(current, former)} includesFormer />);
    fireEvent.change(screen.getByLabelText('Wallet address'), { target: { value: 'gone1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search wallet' }));
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Left on')).toBeInTheDocument();
    expect(screen.getByText('Jun 19, 2026')).toBeInTheDocument();
  });
});

describe('holder flows', () => {
  const flows = {
    d1: { days: 1, joined: { count: 1, amount: 5 }, exited: { count: 0, amount: 0 }, net: 5, topIn: [{ owner: 'newbie', change: 5 }], topOut: [] },
    d7: { days: 7, joined: { count: 3, amount: 40 }, exited: { count: 2, amount: 12.5 }, net: 20, topIn: [{ owner: 'whale', change: 30 }], topOut: [{ owner: 'seller', change: -12.5 }] },
  };

  it('shows the 7-day view by default and switches to 1 day', () => {
    render(<HolderFlowsCard flows={flows} />);
    expect(screen.getAllByText('−12.50')).toHaveLength(2); // "Left" total and the seller's row
    expect(screen.getByText('seller')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '1 day' }));
    expect(screen.getByText('newbie')).toBeInTheDocument();
    expect(screen.queryByText('seller')).not.toBeInTheDocument();
  });
});

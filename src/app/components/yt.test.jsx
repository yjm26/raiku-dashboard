import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DataSection from './DataSection.jsx';
import WalletSearch from './WalletSearch.jsx';

const yt = {
  pointsPerYtDay: 3,
  maturityMs: Date.parse('2026-10-31T10:00:00Z'),
  transactions: 2184,
  holders: [
    { owner: 'WalletYT', yt: 5132.04, ytDays: 92338, points: 277014, firstMs: Date.parse('2026-07-22T00:00:00Z') },
    { owner: 'OnlyYtWallet', yt: 10, ytDays: 20, points: 60, firstMs: Date.parse('2026-08-01T00:00:00Z') },
  ],
};
const rows = [
  { owner: 'WalletYT', amount: 17.23, daysHeld: 55.7, score: 1295.63, isPda: false },
  { owner: 'WalletPlain', amount: 5, daysHeld: 2, score: 10, isPda: false },
];

afterEach(cleanup);

function lookUp(query) {
  fireEvent.change(screen.getByLabelText('Wallet address'), { target: { value: query } });
  fireEvent.click(screen.getByRole('button', { name: 'Search wallet' }));
  return screen.getByRole('status');
}

describe('YT on Exponent', () => {
  it('adds staked YT and YT points to the lookup, apart from the rkuSOL points', () => {
    render(<WalletSearch rows={rows} includesFormer yt={yt} />);
    const result = lookUp('walletyt');
    for (const text of ['#1', '1,295.63', '5,132.04 YT', '277,014.00']) expect(within(result).getByText(text)).toBeInTheDocument();
    expect(within(result).getByText(/aren't included in Estimated points or Rank/)).toBeInTheDocument();
  });

  it('shows no YT figures for a wallet without YT', () => {
    render(<WalletSearch rows={rows} includesFormer yt={yt} />);
    const result = lookUp('walletplain');
    expect(within(result).queryByText('YT staked')).not.toBeInTheDocument();
  });

  it('finds a wallet that only holds YT, without a rank', () => {
    render(<WalletSearch rows={rows} includesFormer yt={yt} />);
    const result = lookUp('onlyytwallet');
    expect(within(result).getByText('—')).toBeInTheDocument();
    expect(within(result).getByText('10.00 YT')).toBeInTheDocument();
  });

  it('lists YT stakers in their own tab', () => {
    render(<DataSection rows={rows} former={[]} yt={yt} />);
    fireEvent.click(screen.getByRole('tab', { name: 'YT on Exponent' }));
    expect(screen.getByText('2 wallets')).toBeInTheDocument();
    expect(screen.getByText('277,014')).toBeInTheDocument();
    expect(screen.getByText(/not part of the points leaderboard/)).toBeInTheDocument();
  });

  it('has no YT tab without YT data', () => {
    render(<DataSection rows={rows} former={[]} />);
    expect(screen.queryByRole('tab', { name: 'YT on Exponent' })).not.toBeInTheDocument();
  });
});

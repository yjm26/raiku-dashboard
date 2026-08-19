import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { searchWallet } from './app-state.js';
import WalletSearch from './WalletSearch.jsx';

const rows = [{ owner: 'WalletABC', amount: 12, daysHeld: 3, score: 36, isPda: false }];

describe('wallet lookup', () => {
  it('matches full addresses case-insensitively, returns rank, and rejects malformed values', () => {
    expect(searchWallet(rows, 'walletabc')).toMatchObject({ ...rows[0], rank: 1 });
    expect(searchWallet(rows, 'not-a-wallet')).toBeNull();
  });
  it('shows a not-found state for an unknown wallet', () => { render(<WalletSearch rows={rows} />); const input = screen.getByLabelText('Wallet address'); fireEvent.change(input, { target: { value: 'missing' } }); fireEvent.click(screen.getByRole('button', { name: 'Search wallet' })); expect(screen.getByText(/No matching wallet/)).toBeInTheDocument(); });
  it('shows rank in the search result', () => {
    render(<WalletSearch rows={rows} />);
    fireEvent.change(screen.getByLabelText('Wallet address'), { target: { value: 'walletabc' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Search wallet' })[0]);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });
});

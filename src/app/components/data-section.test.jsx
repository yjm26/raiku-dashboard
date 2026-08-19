import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { searchWallet } from './app-state.js';
import WalletSearch from './WalletSearch.jsx';

const rows = [{ owner: 'WalletABC', amount: 12, daysHeld: 3, score: 36, isPda: false }];

describe('wallet lookup', () => {
  it('matches full addresses case-insensitively and rejects malformed values', () => { expect(searchWallet(rows, 'walletabc')).toEqual(rows[0]); expect(searchWallet(rows, 'not-a-wallet')).toBeNull(); });
  it('shows a not-found state for an unknown wallet', () => { render(<WalletSearch rows={rows} />); const input = screen.getByLabelText('Wallet address'); fireEvent.change(input, { target: { value: 'missing' } }); fireEvent.click(screen.getByRole('button', { name: 'Search wallet' })); expect(screen.getByText(/No matching wallet/)).toBeInTheDocument(); });
});

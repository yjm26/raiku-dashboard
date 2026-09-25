import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DistributionCard from './DistributionCard.jsx';

afterEach(cleanup);

describe('wallet sizes', () => {
  it('lists wallets and rkuSOL per balance range', () => {
    const holderSizes = [
      { min: 0, max: 1, wallets: 606, amount: 50.69 },
      { min: 1, max: 10, wallets: 112, amount: 358.3 },
      { min: 10, max: 100, wallets: 199, amount: 2991.68 },
      { min: 100, max: 1000, wallets: 9, amount: 1954.3 },
      { min: 1000, max: null, wallets: 2, amount: 55618.15 },
    ];
    render(<DistributionCard snapshot={{ stats: { top10Share: 97.6 }, topHolders: [], holderSizes }} />);
    expect(screen.getByText('928 personal wallets by balance')).toBeInTheDocument();
    const small = screen.getByText('Under 1').closest('tr');
    for (const text of ['606', '65.3%', '50.69', '<0.1%']) expect(within(small).getByText(text)).toBeInTheDocument();
    const large = screen.getByText('1,000+').closest('tr');
    for (const text of ['2', '0.2%', '55,618.15', '91.2%']) expect(within(large).getByText(text)).toBeInTheDocument();
    expect(screen.getByText('100–1,000')).toBeInTheDocument();
  });
});

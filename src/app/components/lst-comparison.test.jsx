import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LstComparison from './LstComparison.jsx';
import DistributionCard from './DistributionCard.jsx';

const RKU = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const comparison = {
  currentEpoch: 1042,
  poolsScanned: 1846,
  epochSeconds: { 1040: 114985, 1041: 114837 },
  rows: [
    { rank: 1, symbol: 'JitoSOL', name: 'Jito Staked SOL', mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', tvlSol: 10378340.21, feePct: 4, apyPct: 4.7512, epoch: 1041 },
    { rank: 26, symbol: 'rkuSOL', name: 'Raiku Staked SOL', mint: RKU, tvlSol: 180737.63, feePct: 2.5, apyPct: 4.9587, epoch: 1041 },
  ],
};

afterEach(cleanup);

describe('LST comparison', () => {
  it('renders nothing without data', () => {
    const { container } = render(<LstComparison comparison={null} mint={RKU} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows rank, SOL staked, fee and APY per token and marks rkuSOL', () => {
    render(<LstComparison comparison={comparison} mint={RKU} />);
    const own = screen.getByText('rkuSOL').closest('tr');
    for (const text of ['26', '180.74K', '2.5%', '4.96%']) expect(within(own).getByText(text)).toBeInTheDocument();
    expect(own).toHaveClass('bg-accent-soft');
    const jito = screen.getByText('JitoSOL').closest('tr');
    for (const text of ['1', '10.38M', '4%', '4.75%']) expect(within(jito).getByText(text)).toBeInTheDocument();
    expect(jito).not.toHaveClass('bg-accent-soft');
    expect(screen.getByText(/rate in epoch 1041 \(32 hours\), annualized/)).toBeInTheDocument();
    expect(screen.getByText(/among all stake pools on the SPL stake-pool programs/)).toBeInTheDocument();
  });

  it('shows the mint when a pool has no registry name', () => {
    render(<LstComparison comparison={{ ...comparison, rows: [{ ...comparison.rows[0], symbol: null, name: null, mint: 'CV6bkrUksMwcEC4jfLTJsbHwF3Y2YurZdWWua95Fpbtd' }] }} mint={RKU} />);
    expect(screen.getByText('CV6bk…Fpbtd')).toBeInTheDocument();
  });
});

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

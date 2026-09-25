import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ApyHistory from './ApyHistory.jsx';
import { apySeries } from '../data.js';

const history = [
  { date: '2026-09-03', apy: 0.05 },
  { date: '2026-09-01', apy: 0.04 },
  { date: '2026-09-02', apy: null },
];

describe('APY history', () => {
  it('orders by date, drops days without APY and converts to percent', () => {
    expect(apySeries(history)).toEqual([{ label: '2026-09-01', apy: 4 }, { label: '2026-09-03', apy: 5 }]);
  });
  it('shows the latest APY and the average over the plotted days', () => {
    render(<ApyHistory history={history} />);
    expect(screen.getByText('5.00%')).toBeInTheDocument();
    expect(screen.getByText('2-day average')).toBeInTheDocument();
    expect(screen.getByText('4.50%')).toBeInTheDocument();
  });
  it('shows an empty state without history', () => {
    render(<ApyHistory />);
    expect(screen.getByText(/no timeline/i)).toBeInTheDocument();
  });
});

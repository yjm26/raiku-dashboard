import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InsightGrid from './InsightGrid.jsx';
import DataSection from './DataSection.jsx';

const snapshot = { stats: { top10Share: 72 }, dailyTimeline: [{ label: 'Jan 1', points: 10 }], holderTimeline: [{ label: 'Jan 1', holders: 2 }], topHolders: [], newHolders: [] };
const rows = [{ owner: 'wallet-one', amount: 10, sharePct: 5, daysHeld: 2, score: 20, isPda: false }];

describe('analytics sections', () => {
  it('renders chart cards and distribution summary', () => { render(<InsightGrid snapshot={snapshot} />); expect(screen.getByText('Points accrual')).toBeInTheDocument(); expect(screen.getByText('Holder growth')).toBeInTheDocument(); expect(screen.getAllByText(/72/).length).toBeGreaterThan(0); });
  it('switches between holder and points tables', async () => { render(<DataSection rows={rows} />); expect(screen.getByText('All holders')).toHaveAttribute('aria-selected', 'true'); fireEvent.click(screen.getByText('Points leaderboard')); await waitFor(() => expect(screen.getByText('Points leaderboard')).toHaveAttribute('aria-selected', 'true')); expect(screen.getByText('Estimated points')).toBeInTheDocument(); });
});

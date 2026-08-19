import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { loadDashboardSnapshot } from './data.js';

vi.mock('./data.js', async () => {
  const actual = await vi.importActual('./data.js');
  return {
    ...actual,
    loadDashboardSnapshot: vi.fn(),
  };
});

const snapshot = {
  ts: '2026-08-19T10:20:11.921Z',
  mint: 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp',
  stats: {
    supply: 182704.920919962,
    totalOwners: 999,
    realWallets: 833,
    officialHolders: 1001,
    top10Share: 97.53548052322107,
    apyPct: '5.40',
    totalPoints: 5571138.815503969,
    dailyPoints: 89098.31577895109,
    launchDate: '2026-05-11T21:00:00.000Z',
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('dashboard shell', () => {
  beforeEach(() => {
    loadDashboardSnapshot.mockResolvedValue(snapshot);
  });

  it('renders a semantic loading main while the snapshot is pending', () => {
    loadDashboardSnapshot.mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/loading dashboard snapshot/i)).toBeInTheDocument();
  });

  it('renders the white dashboard shell and primary metric hierarchy on success', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'rkuSOL Holder & Points' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('app-main');
    expect(document.querySelector('.app-shell')).toHaveClass('app-shell--white');
    expect(screen.getAllByText('Supply').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Holders').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Real wallets').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total estimated points').length).toBeGreaterThan(0);
    const xLink = screen.getByRole('link', { name: /raiku on x/i });
    expect(xLink).toHaveAttribute('href', 'https://x.com/raikucom');
    const websiteLink = screen.getByRole('link', { name: /raiku website/i });
    expect(websiteLink).toHaveAttribute('href', 'https://raiku.com/stake');
    // removed: eyebrow, description, copy-address, solscan link, snapshot line, search form, Snapshot heading
    expect(screen.queryByText(/holder intelligence/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/quiet, data-first view/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/snapshot Aug/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Snapshot' })).not.toBeInTheDocument();
  });

  it('preserves a numeric zero APY in the secondary metrics', async () => {
    loadDashboardSnapshot.mockResolvedValue({ ...snapshot, stats: { ...snapshot.stats, apyPct: 0 } });
    render(<App />);
    await screen.findByRole('heading', { name: 'rkuSOL Holder & Points' });
    expect(screen.getAllByText('0.00%').length).toBeGreaterThan(0);
  });

  it('shows a recoverable error state when the snapshot cannot load', async () => {
    loadDashboardSnapshot.mockRejectedValue(new Error('network unavailable'));

    render(<App />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn't load the dashboard snapshot/i);
    expect(alert).toHaveTextContent(/network unavailable/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('starts loading again when the recoverable error action is pressed', async () => {
    loadDashboardSnapshot.mockRejectedValueOnce(new Error('temporary outage'));

    render(<App />);
    await screen.findByRole('alert');

    loadDashboardSnapshot.mockResolvedValueOnce(snapshot);
    screen.getByRole('button', { name: /try again/i }).click();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'rkuSOL Holder & Points' })).toBeInTheDocument();
    });
    expect(loadDashboardSnapshot).toHaveBeenCalledTimes(2);
  });
});

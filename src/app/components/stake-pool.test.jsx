import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StakePoolCard from './StakePoolCard.jsx';

const pool = {
  fees: { rewardsPct: 2.5, solDepositPct: 0, stakeDepositPct: 0, solWithdrawalPct: 0.1, stakeWithdrawalPct: 0.1 },
  pendingFees: [],
  rate: 1.0181830307023825,
  previousRate: 1.0180036055805481,
  lastUpdateEpoch: 1042,
  validators: [{ voteAccount: 'AVD61fbwxDGuLGCanPWQPxRjdqYk3icssz5u7JH8kbta', activeStakeSol: 180732.15, sharePct: 100, name: 'Raiku', commissionPct: 0, delinquent: false }],
};

// Answers the two RPC calls the countdown makes: 50% through a 432,000-slot epoch at 0.25 s per slot.
function mockRpc() {
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
    const { method } = JSON.parse(init.body);
    const result = method === 'getEpochInfo'
      ? { epoch: 1042, slotIndex: 216000, slotsInEpoch: 432000 }
      : [{ numSlots: 240, samplePeriodSecs: 60 }];
    return { json: async () => ({ jsonrpc: '2.0', id: 1, result }) };
  }));
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('staking pool card', () => {
  it('renders nothing and fetches nothing without pool data', () => {
    mockRpc();
    const { container } = render(<StakePoolCard pool={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows the pool facts and a live countdown', async () => {
    mockRpc();
    render(<StakePoolCard pool={pool} />);
    expect(await screen.findByText('Epoch 1042')).toBeInTheDocument();
    expect(screen.getByText('15h 0m')).toBeInTheDocument(); // 216,000 slots × 0.25 s
    expect(screen.getByText('50% of epoch 1042 done')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('Deposit fee')).toBeInTheDocument();
    expect(screen.getByText('0.1%')).toBeInTheDocument();
    expect(screen.getByText('Raiku')).toBeInTheDocument();
    expect(screen.getByText('+0.0176%')).toBeInTheDocument();
  });

  it('says so when live epoch data is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    render(<StakePoolCard pool={pool} />);
    expect(await screen.findByText(/live epoch data is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
  });
});

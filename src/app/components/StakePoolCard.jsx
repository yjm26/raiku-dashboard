import { useEffect, useRef, useState } from 'react';
import SectionHeader from './SectionHeader.jsx';
import Tooltip from './Tooltip.jsx';
import { epochCountdown, fetchEpochStatus, formatDuration } from '../epoch.js';
import { formatAddress } from '../data.js';

const REFRESH_MS = 10 * 60 * 1000;
const TICK_MS = 30 * 1000;
const pct = (value, digits = 2) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value)}%`;
const same = (a, b) => Math.abs(a - b) < 1e-9;

// Live epoch position: fetched on mount, every 10 minutes, and again once the epoch runs out.
function useEpoch() {
  const [status, setStatus] = useState({ state: 'loading', data: null });
  const [now, setNow] = useState(() => Date.now());
  const load = useRef(() => {});
  const lastLoad = useRef(0);
  useEffect(() => {
    let active = true;
    load.current = () => {
      lastLoad.current = Date.now();
      fetchEpochStatus()
        .then((data) => { if (active) setStatus({ state: 'ready', data }); })
        .catch(() => { if (active) setStatus((prev) => (prev.data ? prev : { state: 'error', data: null })); });
    };
    load.current();
    const refresh = setInterval(() => load.current(), REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => { active = false; clearInterval(refresh); clearInterval(tick); };
  }, []);
  const countdown = status.data ? epochCountdown(status.data, now) : null;
  const ended = countdown ? countdown.secondsLeft <= 0 : false;
  useEffect(() => {
    if (ended && Date.now() - lastLoad.current > 60_000) load.current();
  }, [ended, now]);
  return { state: status.state, countdown };
}

function poolFacts(pool) {
  const { fees } = pool;
  const facts = [{ label: 'Fee on rewards', value: pct(fees.rewardsPct), hint: 'The pool keeps this share of staking rewards each epoch. The rkuSOL rate already reflects it.' }];
  facts.push(...(same(fees.solDepositPct, fees.stakeDepositPct)
    ? [{ label: 'Deposit fee', value: pct(fees.solDepositPct), hint: 'Charged when staking SOL or a stake account into the pool.' }]
    : [{ label: 'SOL deposit fee', value: pct(fees.solDepositPct), hint: 'Charged when staking SOL into the pool.' }, { label: 'Stake deposit fee', value: pct(fees.stakeDepositPct), hint: 'Charged when depositing a stake account into the pool.' }]));
  const redeem = 'Charged when redeeming rkuSOL at the stake pool. Swapping on an exchange uses the market price instead.';
  facts.push(...(same(fees.solWithdrawalPct, fees.stakeWithdrawalPct)
    ? [{ label: 'Withdrawal fee', value: pct(fees.solWithdrawalPct), hint: redeem }]
    : [{ label: 'SOL withdrawal fee', value: pct(fees.solWithdrawalPct), hint: redeem }, { label: 'Stake withdrawal fee', value: pct(fees.stakeWithdrawalPct), hint: redeem }]));

  const validators = pool.validators || [];
  if (validators.length === 1) {
    const [v] = validators;
    facts.push({ label: 'Validator', value: `${v.name || formatAddress(v.voteAccount)}${v.delinquent ? ' (delinquent)' : ''}`, hint: `All of the pool's stake is delegated to this validator, vote account ${formatAddress(v.voteAccount, 6, 6)}.` });
    if (v.commissionPct != null) facts.push({ label: 'Validator commission', value: pct(v.commissionPct), hint: "The validator's cut of staking rewards, taken before rewards reach the pool." });
  } else if (validators.length > 1) {
    facts.push({ label: 'Validators', value: String(validators.length), hint: `The pool's stake is spread across ${validators.length} validators.` });
  }

  if (pool.rate && pool.previousRate) {
    const change = (pool.rate / pool.previousRate - 1) * 100;
    facts.push({ label: 'Last rate increase', value: `${change >= 0 ? '+' : '−'}${pct(Math.abs(change), 4)}`, hint: `The rkuSOL rate went from ${pool.previousRate.toFixed(6)} to ${pool.rate.toFixed(6)} SOL when the pool added rewards in epoch ${pool.lastUpdateEpoch}.` });
  }
  for (const change of pool.pendingFees || []) {
    facts.push({ label: 'Scheduled change', value: `${change.fee} → ${pct(change.pct)}`, hint: change.epochs === 1 ? 'Takes effect after the next epoch boundary.' : 'Takes effect after two epoch boundaries.' });
  }
  return facts;
}

function Countdown({ state, countdown }) {
  if (!countdown) {
    return state === 'error'
      ? <p className="m-0 text-[14px] text-muted" role="status">Live epoch data is unavailable right now.</p>
      : <div aria-hidden="true"><span className="skeleton block h-3.5 w-20" /><span className="skeleton mt-4 block h-[34px] w-40" /><span className="skeleton mt-6 block h-1.5 w-full rounded-full" /></div>;
  }
  const done = Math.min(100, Math.floor(countdown.progress * 100));
  const ended = countdown.secondsLeft <= 0;
  return <div role="timer">
    <p className="m-0 text-[13px] text-muted"><Tooltip label={`Epoch ${countdown.epoch}`} hint={`Solana runs in epochs, currently about ${Math.round(countdown.epochHours)} hours each. Staking rewards are counted per epoch.`} placement="bottom" /></p>
    <p className="m-0 mt-3 text-[34px] font-semibold leading-none tracking-[-0.035em] text-ink">{ended ? 'Now' : <><span className="text-muted">≈ </span>{formatDuration(countdown.secondsLeft)}</>}</p>
    <p className="m-0 mt-2 text-[13px] text-muted">{ended ? `Epoch ${countdown.epoch + 1} is starting` : `until epoch ${countdown.epoch + 1}`}</p>
    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-rule" role="progressbar" aria-label={`Epoch ${countdown.epoch} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={done}>
      <div className="h-full rounded-full bg-[var(--chart-line)]" style={{ width: `${done}%` }} />
    </div>
    <p className="m-0 mt-2 text-[12px] text-muted">{done}% of epoch {countdown.epoch} done</p>
  </div>;
}

export default function StakePoolCard({ pool }) {
  return pool ? <StakePoolPanel pool={pool} /> : null;
}

function StakePoolPanel({ pool }) {
  const { state, countdown } = useEpoch();
  return <section className="mt-14" aria-labelledby="stake-pool-title">
    <SectionHeader id="stake-pool-title" title="Staking pool" aside="Read on-chain from the rkuSOL stake pool" />
    <div className="panel grid overflow-hidden lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="border-b border-rule p-4 sm:p-5 lg:border-b-0 lg:border-r">
        <Countdown state={state} countdown={countdown} />
        <p className="m-0 mt-5 text-[13px] leading-relaxed text-muted">rkuSOL&apos;s rate goes up once per epoch, when the pool adds the rewards of the epoch that just ended. Time left is estimated from recent block times.</p>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-px bg-rule sm:grid-cols-3">
        {poolFacts(pool).map((fact) => <div className="min-w-0 bg-surface px-4 py-4 sm:px-5" key={fact.label}>
          <dt className="text-[12px] text-muted"><Tooltip label={fact.label} hint={fact.hint} placement="bottom" /></dt>
          <dd className="m-0 mt-1.5 truncate text-[17px] font-medium tabular-nums tracking-[-0.01em] text-ink">{fact.value}</dd>
        </div>)}
      </dl>
    </div>
  </section>;
}

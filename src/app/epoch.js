// Live epoch timing from a public Solana RPC that accepts browser requests.
const RPC_URL = 'https://solana-rpc.publicnode.com';

async function call(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body = await response.json();
  if (body.error || !body.result) throw new Error(body.error?.message || `${method} failed`);
  return body.result;
}

/**
 * Current epoch position plus the average slot time over the last ~30 minutes.
 */
export async function fetchEpochStatus() {
  const [info, samples] = await Promise.all([call('getEpochInfo'), call('getRecentPerformanceSamples', [30])]);
  const seconds = samples.reduce((sum, s) => sum + s.samplePeriodSecs, 0);
  const slots = samples.reduce((sum, s) => sum + s.numSlots, 0);
  if (!seconds || !slots) throw new Error('No recent performance samples');
  return { epoch: info.epoch, slotIndex: info.slotIndex, slotsInEpoch: info.slotsInEpoch, slotSeconds: seconds / slots, fetchedAt: Date.now() };
}

/**
 * Project the epoch forward from when it was fetched; stops at the epoch end instead of guessing past it.
 */
export function epochCountdown(status, now = Date.now()) {
  const elapsedSlots = Math.max(0, (now - status.fetchedAt) / 1000 / status.slotSeconds);
  const slotIndex = Math.min(status.slotsInEpoch, status.slotIndex + elapsedSlots);
  return {
    epoch: status.epoch,
    progress: slotIndex / status.slotsInEpoch,
    secondsLeft: (status.slotsInEpoch - slotIndex) * status.slotSeconds,
    epochHours: (status.slotsInEpoch * status.slotSeconds) / 3600,
  };
}

export function formatDuration(seconds) {
  if (seconds < 60) return 'under a minute';
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

// Raiku staking API: official holders, APY, TVL and the pool's exchange rate.
const LSTS_URL = 'https://staking-api.mainnet.raiku.sh/v1/lsts';
const VALIDATOR_URL = 'https://staking-api.mainnet.raiku.sh/v1/validator';

export async function fetchRaikuStats(mint) {
  try {
    const r = await fetch(LSTS_URL, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    const data = await r.json();
    for (const lst of data.lsts || []) {
      if (lst.mint === mint) {
        const pd = lst.provider_data || {};
        return {
          officialHolders: pd.holders,
          tvlLamports: lst.tvl_lamports,
          solValueLamports: lst.sol_value_lamports,
          latestApy: lst.latest_apy,
          avgApy: lst.avg_apy,
          launchDate: pd.launchDate,
          poolAddress: pd.pool?.pool,
        };
      }
    }
  } catch (e) { console.log('raiku stats ERR', e.message); }
  return {};
}

// Raiku's own validator ({ votePubkey, name }), used to name the pool's validator.
export async function fetchRaikuValidator() {
  try {
    const r = await fetch(VALIDATOR_URL, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    const data = await r.json();
    return data?.vote_pubkey && data?.name ? { votePubkey: data.vote_pubkey, name: data.name } : null;
  } catch (e) {
    console.log('raiku validator ERR', e.message);
    return null;
  }
}

// SOL per rkuSOL. The pool's own rate (sol_value) is exact; TVL ÷ supply is only a
// fallback, because the two are sampled at different moments and drift apart.
export function exchangeRate(stats, supplyUi) {
  const solValue = Number(stats?.solValueLamports) / 1e9;
  if (Number.isFinite(solValue) && solValue > 0) return solValue;
  const tvlSol = Number(stats?.tvlLamports) / 1e9;
  return supplyUi && Number.isFinite(tvlSol) && tvlSol > 0 ? tvlSol / supplyUi : null;
}

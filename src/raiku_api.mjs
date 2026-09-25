// Raiku staking API: official holders, APY, TVL and the pool's exchange rate.
const LSTS_URL = 'https://staking-api.mainnet.raiku.sh/v1/lsts';

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
        };
      }
    }
  } catch (e) { console.log('raiku stats ERR', e.message); }
  return {};
}

// SOL per rkuSOL. The pool's own rate (sol_value) is exact; TVL ÷ supply is only a
// fallback, because the two are sampled at different moments and drift apart.
export function exchangeRate(stats, supplyUi) {
  const solValue = Number(stats?.solValueLamports) / 1e9;
  if (Number.isFinite(solValue) && solValue > 0) return solValue;
  const tvlSol = Number(stats?.tvlLamports) / 1e9;
  return supplyUi && Number.isFinite(tvlSol) && tvlSol > 0 ? tvlSol / supplyUi : null;
}

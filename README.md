# rkuSOL Holder & Points Dashboard

Analytics dashboard for **rkuSOL**, the liquid staking token from [Raiku](https://raiku.com/stake) on Solana.

**Live:** [raiku-dashboard.vercel.app](https://raiku-dashboard.vercel.app)

![token](https://img.shields.io/badge/token-rkuSOL-01ffd9)
![solana](https://img.shields.io/badge/chain-Solana-9945FF)
![stack](https://img.shields.io/badge/stack-React%2FVite-lightgrey)

---

## Features

- **On-chain snapshot** — supply, total holders, real wallets (ex-pool/PDA), official holders
- **Estimated points** — total points, daily accrual, per-wallet leaderboard
- **Charts** — points accrual, holder growth since launch
- **Analytics** — top-10 concentration, top holders, new holders (7d), APY, TVL, rkuSOL rate
- **APY calculator** — simulate a stake: rkuSOL received, daily yield, points/day
- **Wallet lookup** — search an address → balance, days held, estimated points, rank

## Data & sources

| Data | Source | Method |
|---|---|---|
| Supply, holders, balances | Solana RPC (`getProgramAccounts` + `getMultipleAccounts`) | Public endpoints, no API key |
| Pool/PDA classification | Curve check + program owner check | Off-curve owner (PDA) or owner != System Program → pool/PDA |
| Balance history (all wallets since launch) | Every transaction touching the rkuSOL mint, plus each wallet token account's own history (some swaps never name the mint) | Rebuilt in `data/ledger.json`; checked daily against on-chain balances |
| Official holders, APY, TVL, rate | [Raiku staking API](https://staking-api.mainnet.raiku.sh/v1/lsts) | `/v1/lsts` filtered by mint; rate = `sol_value_lamports` |
| Staking pool fees, validator | Stake pool account on-chain | Decoded in `src/stake_pool.mjs` |
| SOL price | CoinGecko API | `simple/price` for solana/usd |
| Points | Local calculation | 1 point per rkuSOL per day actually held (from the ledger) |

### Live API (Vercel)

- `api/dashboard.js` — serverless function, fetches fresh on-chain data on each call
- Cache: `s-maxage=86400` + `stale-while-revalidate` → refreshes at most 1×/day (lazy, in background)
- Vercel cron `15 0 * * *` (07:15 WIB) — warms the cache even without visitors
- Frontend loads from `/data/dashboard.json` (static, instant) — no network dependency

## Accuracy & limitations

This dashboard provides **estimates, not official Raiku figures**. Details:

- **Points = 1 per rkuSOL per day actually held**, from each wallet's balance history since launch. A wallet that sells out stops earning but keeps its points; it stays in the total and on the leaderboard ("left") and is listed under Former holders. If a wallet's rebuilt balance ever disagrees with the chain, that wallet falls back to `balance × days held` and the FAQ shows how many.
- **Days held** = total days the wallet held any rkuSOL (gaps with a zero balance don't count).
- **Ledger verification (2026-09-25 backfill)**: 22,513 transactions; every personal wallet's history chains with no gaps, all 952 current balances match the chain, and replaying the history reproduces the balances in all 38 daily snapshots since Aug 19 (one difference: a sale 7 s before a snapshot was stamped).
- **Real wallets vs Holders**: "Holders" counts every token-account owner (including pools/PDAs). "Real wallets" only counts personal wallets: on-curve, System-Program-owned addresses. Program-derived addresses (lending markets, vaults, multisigs) are excluded even when they hold SOL or have no account. Most of the supply sits in pool/program accounts (normal for an LST).
- **Solscan match**: dashboard total holders ≈ Solscan (1001+), since both count all token accounts.
- Data is public on-chain data; verify independently before making decisions.

## Development

```bash
npm install
npm run dev        # local dev server
```

Build & preview:

```bash
npm run build
npm run preview
```

Test:

```bash
npm test           # vitest (unit + component)
npm run test:snapshot
```

## Data pipeline

```
fetch_holders.mjs       → getProgramAccounts (dataSlice + dataSize + memcmp) → all rkuSOL token accounts
                          + getMultipleAccounts → PDA vs real wallet classification
                          + Raiku API /v1/lsts  → official stats (holders, TVL, APY, launchDate)
crawl_firstseen.mjs     → per real wallet: getTokenAccountsByOwner + getSignaturesForAddress(account)
                          → first acquisition (cached in data/firstseen.json — immutable)
classify_pda.mjs        → program owner per PDA → label (Sanctum etc.)
generate_dashboard3.mjs  → combine everything → public/data/dashboard.json
update_daily.mjs          → daily update: re-fetch balances + regenerate snapshot (reuse firstSeen)
npm run build            → separate Vite build → dist/
```

### Daily data update

```bash
node src/update_daily.mjs   # refresh balances + regenerate snapshot
npm run build               # rebuild static site
```

Only needs **1 heavy RPC call** (`getProgramAccounts`) + regenerate. firstSeen does not need re-crawling (history never changes). On Vercel this runs automatically via cron + SWR cache.

## Repo structure

```
├── README.md
├── api/dashboard.js        ← Vercel serverless (live data + cache)
├── vercel.json             ← cron 07:15 WIB
├── public/data/dashboard.json ← normalized snapshot for React
├── src/
│   ├── paths.mjs           ← repository-relative paths
│   ├── build_snapshot.mjs  ← pure deterministic snapshot calculations
│   ├── generate_dashboard3.mjs ← writes public/data/dashboard.json
│   ├── rpc.mjs             ← RPC helper (multi-endpoint, retry)
│   ├── fetch_holders.mjs   ← fetch all holders + classification + Raiku stats
│   ├── crawl_firstseen.mjs ← first acquisition per wallet (one-time)
│   ├── classify_pda.mjs    ← label program-owner PDAs
│   ├── update_daily.mjs    ← refresh data + regenerate snapshot
│   └── app/                ← React frontend (components, data layer)
└── data/
    ├── holders_full.json   ← latest holder snapshot
    ├── firstseen.json      ← first-acquisition cache
    ├── pda_labels.json     ← PDA labels
    └── *.json              ← intermediate results
```

## Deployment (Vercel)

Ready to deploy directly to Vercel:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- Cron is enabled via `vercel.json` (requires Hobby plan or above for cron)

## Disclaimer

This dashboard is **not affiliated with Raiku**. Data is public on-chain data; points are estimates, not official figures. Do not use as a basis for financial decisions.

---

Built by [@eunoiabluu](https://x.com/eunoiabluu) · X: [@eunoiabluu](https://x.com/eunoiabluu) · GitHub: [yjm26/raiku-dashboard](https://github.com/yjm26/raiku-dashboard)

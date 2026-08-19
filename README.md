# rkuSOL Holder & Points Dashboard

Dune-style analytics dashboard untuk **rkuSOL** — liquid staking token dari [Raiku](https://raiku.com/stake), Solana validator client yang mengoptimalkan AOT compute reservations & JIT MEV bundle processing.

**Live:** [raiku-dashboard.vercel.app](https://raiku-dashboard.vercel.app)

![token](https://img.shields.io/badge/token-rkuSOL-01ffd9)
![solana](https://img.shields.io/badge/chain-Solana-9945FF)
![stack](https://img.shields.io/badge/stack-React%2FVite-lightgrey)

---

## Apa ini?

Dashboard publik yang menampilkan:

- **Snapshot on-chain** — supply, total holders, real wallets (ex-pool/PDA), official holders (Raiku API)
- **Points estimasi** — total points, daily accrual, leaderboard per wallet
- **Charts** — points accrual over time, holder growth since launch
- **Analytics** — top-10 concentration, top holders, new holders 7d, APY
- **Wallet lookup** — cari address → balance, days held, estimasi points, **rank**

## Data & sumber

| Data | Sumber | Metode |
|---|---|---|
| Supply, holders, balance | Solana RPC (`getProgramAccounts` + `getMultipleAccounts`) | Public endpoints, no API key |
| Klasifikasi pool/PDA | Program owner check | Owner != System Program → pool/PDA |
| First acquisition | `getSignaturesForAddress` per token account | Cached di `data/firstseen.json` |
| Official holders, APY, TVL | [Raiku staking API](https://staking-api.mainnet.raiku.sh/v1/lsts) | `/v1/lsts` filtered by mint |
| Points | Kalkulasi lokal | `balance × days held` |

### Live API (Vercel)

- `api/dashboard.js` — serverless function, fetch fresh on-chain tiap dipanggil
- Cache: `s-maxage=86400` + `stale-while-revalidate` → refresh maks 1×/hari (lazy, di background)
- Cron Vercel `15 0 * * *` (07:15 WIB) — warm cache walau tanpa visitor
- Frontend fallback: coba `/api/dashboard` → fallback `/data/dashboard.json` (static)

## Akurasi & batasan

Dashboard ini **estimasi, bukan angka resmi Raiku**. Detail:

- **Points = balance saat ini × days held** — mengikuti standar points program Solana (points berhenti saat unstake). Wallet yang sudah unstake (balance 0) **tidak** dihitung — ini by design, konsisten dengan cara kerja kebanyakan program points.
- **Days held** = hari sejak first acquisition wallet (dari histori on-chain per-account). Akurat untuk ~100% real wallets (coverage ditampilkan di UI).
- **Real wallets vs Holders**: "Holders" = semua pemilik token account (termasuk pool/PDA). "Real wallets" = hanya yang owner-nya System Program. `~73% supply` ada di pool/program (normal untuk LST).
- **Solscan match**: total holders dashboard ≈ angka Solscan (1001+), karena keduanya menghitung semua token accounts.
- Data on-chain publik; verifikasi mandiri sebelum mengambil keputusan.

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

## Pipeline data

```
fetch_holders.mjs       → getProgramAccounts (dataSlice + dataSize + memcmp) → semua token account rkuSOL
                          + getMultipleAccounts → klasifikasi PDA vs wallet asli
                          + Raiku API /v1/lsts  → stats resmi (holders, TVL, APY, launchDate)
crawl_firstseen.mjs     → per wallet asli: getTokenAccountsByOwner + getSignaturesForAddress(account)
                          → first acquisition (cached di data/firstseen.json — TIDAK berubah)
classify_pda.mjs        → program owner tiap PDA → label (Sanctum dkk)
generate_dashboard3.mjs  → gabungkan semua → public/data/dashboard.json
update_daily.mjs          → update harian: fetch balance ulang + regenerate snapshot (firstSeen reuse)
npm run build            → Vite build terpisah → dist/
```

### Update data harian

```bash
node src/update_daily.mjs   # refresh balances + regenerate snapshot
npm run build               # rebuild static site
```

Hanya butuh **1 panggilan RPC berat** (`getProgramAccounts`) + regenerate. FirstSeen tidak perlu di-crawl ulang (sejarah tidak berubah). Di Vercel, ini otomatis via cron + SWR cache — tanpa Hermes/Task Scheduler.

## Struktur repo

```
├── README.md
├── api/dashboard.js        ← Vercel serverless (live data + cache)
├── vercel.json             ← cron 07:15 WIB
├── public/data/dashboard.json ← snapshot ter-normalisasi untuk React
├── src/
│   ├── paths.mjs           ← repository-relative paths
│   ├── build_snapshot.mjs  ← pure deterministic snapshot calculations
│   ├── generate_dashboard3.mjs ← write public/data/dashboard.json
│   ├── rpc.mjs             ← RPC helper (multi-endpoint, retry)
│   ├── fetch_holders.mjs   ← ambil semua holder + klasifikasi + Raiku stats
│   ├── crawl_firstseen.mjs ← first acquisition per wallet (sekali saja)
│   ├── classify_pda.mjs    ← label program owner PDA
│   ├── update_daily.mjs    ← refresh data + regenerate snapshot
│   └── app/                ← React frontend (components, data layer)
└── data/
    ├── holders_full.json   ← snapshot holder terakhir
    ├── firstseen.json      ← cache first acquisition
    ├── pda_labels.json     ← label PDA
    └── *.json              ← hasil antara
```

## Deployment (Vercel)

Repo ini siap deploy langsung ke Vercel:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- Cron otomatis aktif via `vercel.json` (butuh Hobby plan ke atas untuk cron)

## Disclaimer

Dashboard ini **tidak berafiliasi dengan Raiku**. Data on-chain publik; estimasi points bukan angka resmi. Jangan gunakan sebagai dasar keputusan finansial.

---

Dibuat oleh [@eunoiabluu](https://x.com/eunoiabluu) — X: [@eunoiabluu](https://x.com/eunoiabluu) · GitHub: [yjm26/raiku-dashboard](https://github.com/yjm26/raiku-dashboard)

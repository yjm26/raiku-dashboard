# rkuSOL Holder & Points Dashboard

Dashboard ala Dune untuk token **rkuSOL** (Raiku Liquid Staking) di Solana.

- **Mint:** `rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp`
- **Output:** `dashboard.html` — buka langsung di browser (self-contained + Chart.js dari CDN)
- **Data:** on-chain (Solana RPC) + Raiku official API (`staking-api.mainnet.raiku.sh`)

## Fitur

| Fitur | Deskripsi |
|---|---|
| KPI cards | rkuSOL cap, total holders, real wallets, official holders, top-10 share, APY, total points, daily points |
| Pie chart | Distribusi top-10 wallet vs Others (real wallets, ex-pool) |
| Daily points | Grafik akumulasi points harian (estimasi) |
| Top holders | 10 besar dengan label pool/program (Sanctum dkk) |
| Holders over time | Pertumbuhan jumlah wallet sejak launch |
| New holders (7d) | Deteksi holder baru (first acquisition ≤ 7 hari) |
| Search address | Paste address → lihat balance, first seen, days held, estimasi points |
| Tabs | All Holders / Points (top 100) |

## Metodologi Points

- **Rumus:** `1 rkuSOL = 1 point per hari` (info Discord Raiku)
- **Score per wallet** = `balance rkuSOL × days held`
- **Days held** = hari sejak **first acquisition** (transaksi rkuSOL pertama wallet itu, dari histori on-chain per-account)
- **Daily points total** = jumlah balance seluruh wallet (bertambah tiap hari)
- ⚠️ **Estimasi, bukan angka resmi Raiku/Discord** — leaderboard resmi bisa berbeda (mungkin pakai balance staking/histori balance yang beda)

### Verifikasi formula (contoh card PolyFeed)

- Card: balance 10.0172, days 33, score 338.63
- `338.63 / 10.0172 = 33.80 hari` → cocok dengan `days held` 33 (dibulatkan)
- Bukan sejak launch (11 Mei): `10.0172 × 99.5 = 997` ≠ 338.63
- **Kesimpulan:** score = balance × days sejak first acquisition wallet

## Pipeline Data

```
fetch_holders.mjs       → getProgramAccounts (dataSlice + dataSize + memcmp) → semua token account rkuSOL
                          + getMultipleAccounts → klasifikasi PDA vs wallet asli
                          + Raiku API /v1/lsts  → stats resmi (holders, TVL, APY, launchDate)
crawl_firstseen.mjs     → per wallet asli: getTokenAccountsByOwner + getSignaturesForAddress(account)
                          → first acquisition (cached di data/firstseen.json — TIDAK berubah)
classify_pda.mjs        → program owner tiap PDA → label (Sanctum dkk)
generate_dashboard.mjs  → gabungkan semua → dashboard.html
update_daily.mjs        → update harian: fetch balance ulang + regenerate (firstSeen reuse)
```

## Update Harian

```powershell
node update_daily.mjs
```

Hanya perlu **1 panggilan RPC berat** (`getProgramAccounts`) + regenerate — cepat. FirstSeen tidak perlu di-crawl ulang (sejarah tidak berubah). Jadwalkan via Task Scheduler / cron.

## Struktur Repo

```
├── dashboard.html          ← hasil akhir (buka di browser)
├── README.md
├── src/
│   ├── rpc.mjs             ← RPC helper (multi-endpoint, retry)
│   ├── fetch_holders.mjs   ← ambil semua holder + klasifikasi + Raiku stats
│   ├── crawl_firstseen.mjs ← first acquisition per wallet (sekali saja)
│   ├── classify_pda.mjs    ← label program owner PDA
│   ├── generate_dashboard.mjs
│   └── update_daily.mjs
└── data/
    ├── holders_full.json   ← snapshot holder terakhir
    ├── firstseen.json      ← cache first acquisition
    ├── pda_labels.json     ← label PDA
    └── *.json              ← hasil antara
```

## Catatan Teknis

- **Endpoints RPC:** helius gratis (`gabriela-...helius-rpc.com`) primary — **publicnode menyembunyikan** sebagian histori signature (return 0 untuk account yang punya histori). mainnet-beta lebih dalam untuk mint.
- **PDA/pool** = address yang owner-nya program (bukan System Program) atau tidak ada di chain → bukan wallet asli. rkuSOL ~73% supply ada di pool/program (Sanctum dkk), normal untuk LST baru.
- `getProgramAccounts` dengan `dataSlice: {offset: 32, length: 40}` + `dataSize: 165` + `memcmp` mint = cara efisien ambil semua holder.

## Disclaimer

Dashboard ini **tidak berafiliasi dengan Raiku**. Data on-chain publik; estimasi points bukan angka resmi. Jangan gunakan sebagai dasar keputusan finansial.

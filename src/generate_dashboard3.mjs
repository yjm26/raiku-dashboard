import fs from 'node:fs';
import { p, OUT_HTML } from './paths.mjs';

// rkuSOL Dashboard v3 — uses authoritative per-account firstSeen (firstseen.json).
// Dune-style: KPI cards, pie (top-10 vs others), top holders with pool labels,
// daily points accrual, address search, new-holder detection.

const holdersData = JSON.parse(fs.readFileSync(p('holders_full.json'), 'utf8'));
const firstSeenData = JSON.parse(fs.readFileSync(p('firstseen.json'), 'utf8'));
let pdaLabels = {};
try { pdaLabels = JSON.parse(fs.readFileSync(p('pda_labels.json'), 'utf8')); } catch {}

const NOW = Date.now();
const DAY = 86400000;
const launch = new Date(holdersData.stats?.launchDate || '2026-05-11T21:00:00Z').getTime();

// authoritative firstSeen: per-account crawl first, fallback launch
const firstMsOf = (owner) => {
  const ts = firstSeenData[owner];
  return ts ? ts * 1000 : launch;
};

const rows = holdersData.holders.map(h => {
  const firstMs = firstMsOf(h.owner);
  const daysHeld = Math.max(0, (NOW - firstMs) / DAY);
  return {
    owner: h.owner,
    amount: h.amountUi,
    sharePct: h.share * 100,
    isPda: !!h.isPda,
    firstMs,
    daysHeld,
    score: h.amountUi * daysHeld,
    pdaLabel: h.isPda ? (pdaLabels[h.owner]?.known || 'Pool/Program') : null,
  };
});

const realRows = rows.filter(r => !r.isPda).sort((a, b) => b.score - a.score);
const pdaRows = rows.filter(r => r.isPda);
const supply = holdersData.supplyUi;
const realWallets = realRows.length;
const pdaSupply = pdaRows.reduce((a, r) => a + r.amount, 0);
const pdaShare = pdaSupply / supply * 100;
const top10ByAmount = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 10);
const top10Share = top10ByAmount.reduce((a, r) => a + r.amount, 0) / supply * 100;
const totalPoints = realRows.reduce((a, r) => a + r.score, 0);
const dailyPoints = realRows.reduce((a, r) => a + r.amount, 0);

// pie: top-10 real wallets vs others
const pieReal = [...realRows].sort((a, b) => b.amount - a.amount).slice(0, 10);
const pieOthers = realRows.filter(r => !pieReal.includes(r)).reduce((a, r) => a + r.amount, 0);
const pie = {
  labels: [...pieReal.map((r, i) => `${i + 1}. ${r.owner.slice(0, 5)}…${r.owner.slice(-4)}`), 'Others'],
  amounts: [...pieReal.map(r => r.amount), pieOthers],
};

// timelines
const dayCount = Math.floor((NOW - launch) / DAY);
const dailyTimeline = [];
const holderTimeline = [];
for (let d = 0; d <= dayCount; d += 3) {
  const cutoff = launch + d * DAY;
  dailyTimeline.push({ label: new Date(cutoff).toISOString().slice(0, 10), points: dailyPoints * d });
  holderTimeline.push({ label: new Date(cutoff).toISOString().slice(0, 10), holders: rows.filter(r => !r.isPda && r.firstMs <= cutoff).length });
}

const weekAgo = NOW - 7 * DAY;
const newHolders = realRows.filter(r => r.firstMs >= weekAgo).sort((a, b) => b.firstMs - a.firstMs);

const stats = holdersData.stats || {};
const apyPct = stats.latestApy ? (stats.latestApy * 100).toFixed(2) : null;

const data = {
  ts: holdersData.fetchedAt,
  mint: holdersData.mint,
  supply, totalOwners: rows.length, realWallets, pdaWallets: pdaRows.length,
  pdaShare, top10Share, officialHolders: stats.officialHolders,
  launchDate: stats.launchDate, apyPct,
  totalPoints, dailyPoints, pie,
  topHolders: top10ByAmount.map((r, i) => ({ ...r, rank: i + 1 })),
  holderTimeline, dailyTimeline,
  newHolders: newHolders.slice(0, 20),
  realRows: realRows.map((r, i) => ({ ...r, rank: i + 1 })),
  coverage: { found: 831, total: 833 },
};

const short = (a) => a.slice(0, 5) + '…' + a.slice(-5);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>rkuSOL Holder &amp; Points Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  :root {
    --bg: #0a0d08; --card: #10140e; --line: #1c2318; --text: #e8eae5;
    --muted: #8a928a; --accent: #c0ff38; --accent-dim: rgba(192,255,56,0.12);
    --red: #ff6b6b; --blue: #3b9ee8; --purple: #a78bfa;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--text);
    font-family: ui-monospace, "Cascadia Code", "Geist Mono", monospace;
    padding: 24px; max-width: 1320px; margin: 0 auto; line-height: 1.5;
  }
  header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
  header h1 { font-size: 22px; font-weight: 700; letter-spacing: 0.03em; }
  header .tag { color: var(--accent); font-size: 12px; border: 1px solid #2c3a1d; background: var(--accent-dim); padding: 3px 9px; border-radius: 4px; }
  .subtitle { color: var(--muted); font-size: 12px; margin-bottom: 18px; }
  .subtitle a { color: var(--blue); text-decoration: none; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .card { background: var(--card); border: 1px solid var(--line); padding: 14px; border-radius: 8px; }
  .card .label { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; }
  .card .value { font-size: 21px; font-weight: 700; margin-top: 5px; font-variant-numeric: tabular-nums; }
  .card .sub { color: var(--muted); font-size: 11px; margin-top: 3px; }
  .accent { color: var(--accent); }
  .warn { color: var(--red); }
  .blue { color: var(--blue); }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .cols3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
  .panel { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .panel h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px; color: var(--muted); }
  .panel h2 .hint { text-transform: none; color: var(--muted); font-weight: 400; letter-spacing: 0; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: var(--muted); font-weight: 500; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 8px; border-bottom: 1px solid var(--line); }
  td { padding: 7px 8px; border-bottom: 1px solid #151a13; }
  tr:hover td { background: #151a13; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .addr { color: var(--muted); }
  .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #241f12; color: var(--accent); border: 1px solid #3a3215; }
  .badge.pool { background: #1d1424; color: var(--purple); border-color: #2e1f3d; }
  .badge.sanctum { background: #0f1d2b; color: var(--blue); border-color: #1b3a55; }
  .searchbox { display: flex; gap: 8px; margin-bottom: 20px; }
  .searchbox input { flex: 1; background: var(--card); border: 1px solid var(--line); color: var(--text); padding: 10px 12px; border-radius: 6px; font-family: inherit; font-size: 13px; }
  .searchbox input:focus { outline: none; border-color: var(--accent); }
  .searchbox button { background: var(--accent); color: #0a0d08; border: 0; border-radius: 6px; padding: 0 16px; font-family: inherit; font-weight: 700; cursor: pointer; }
  .search-result { background: var(--card); border: 1px solid var(--accent); border-radius: 8px; padding: 14px; margin-bottom: 20px; display: none; }
  .search-result .row { display: grid; grid-template-columns: 140px 1fr; gap: 6px 14px; font-size: 13px; }
  .search-result .k { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; padding-top: 2px; }
  .search-result .v { font-variant-numeric: tabular-nums; }
  .note { color: var(--muted); font-size: 11px; margin-top: 10px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 12px; }
  .tab { padding: 6px 14px; border: 1px solid var(--line); border-radius: 6px; cursor: pointer; font-size: 12px; color: var(--muted); background: transparent; font-family: inherit; }
  .tab.active { color: var(--accent); border-color: var(--accent); background: var(--accent-dim); }
  .mono { font-family: ui-monospace, monospace; word-break: break-all; }
  @media (max-width: 900px) { .cols, .cols3 { grid-template-columns: 1fr; } .grid { grid-template-columns: repeat(2, 1fr); } }
</style>
</head>
<body>
<header>
  <h1>⚡ rkuSOL Holder &amp; Points Dashboard</h1>
  <span class="tag">Raiku Liquid Staking</span>
</header>
<div class="subtitle">
  Mint <a href="https://solscan.io/token/${data.mint}" target="_blank">${data.mint}</a> · snapshot <span id="ts"></span> · on-chain + Raiku API · launch ${data.launchDate?.slice(0, 10)}
</div>

<div class="searchbox">
  <input id="addrInput" placeholder="Paste wallet address untuk lihat stake + estimasi points…" />
  <button onclick="searchAddr()">Search</button>
</div>
<div class="search-result" id="searchResult"></div>

<div class="grid">
  <div class="card"><div class="label">rkuSOL Cap</div><div class="value accent" id="c_supply"></div><div class="sub">total supply</div></div>
  <div class="card"><div class="label">Total Holders</div><div class="value" id="c_owners"></div><div class="sub">token accounts</div></div>
  <div class="card"><div class="label">Real Wallets</div><div class="value blue" id="c_real"></div><div class="sub">ex-pool/PDA</div></div>
  <div class="card"><div class="label">Official Holders</div><div class="value" id="c_official"></div><div class="sub">per Raiku API</div></div>
  <div class="card"><div class="label">Top-10 Share</div><div class="value warn" id="c_top10"></div><div class="sub">dari supply</div></div>
  <div class="card"><div class="label">APY</div><div class="value" id="c_apy"></div><div class="sub">per Raiku API</div></div>
  <div class="card"><div class="label">Total Points</div><div class="value accent" id="c_totpts"></div><div class="sub">semua wallet</div></div>
  <div class="card"><div class="label">Daily Points</div><div class="value" id="c_dailypts"></div><div class="sub">+ / hari sekarang</div></div>
</div>

<div class="cols">
  <div class="panel"><h2>Distribution (Real Wallets)</h2><canvas id="pieChart" height="220"></canvas><div class="note">Top-10 vs others (ex-pool).</div></div>
  <div class="panel"><h2>Daily Points Accrual <span class="hint">(kumulatif, estimasi)</span></h2><canvas id="dailyChart" height="220"></canvas></div>
</div>

<div class="cols3">
  <div class="panel"><h2>Top Holders</h2>
    <table>
      <thead><tr><th>#</th><th>Wallet</th><th>Type</th><th class="num">rkuSOL</th><th class="num">Share</th></tr></thead>
      <tbody>${data.topHolders.map(h => `
        <tr><td class="num">${h.rank}</td><td class="addr" title="${esc(h.owner)}">${short(h.owner)}</td>
        <td>${h.isPda ? `<span class="badge ${/sanctum/i.test(h.pdaLabel || '') ? 'sanctum' : 'pool'}">${esc(h.pdaLabel || 'Pool')}</span>` : 'Wallet'}</td>
        <td class="num">${h.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td><td class="num">${h.sharePct.toFixed(2)}%</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="note">Pool = program-owned (Sanctum dkk).</div>
  </div>
  <div class="panel"><h2>Holders Over Time</h2><canvas id="holderChart" height="220"></canvas></div>
  <div class="panel"><h2>New Holders (7d)</h2>
    <table>
      <thead><tr><th>Wallet</th><th class="num">rkuSOL</th><th>Since</th></tr></thead>
      <tbody>
        ${data.newHolders.length ? data.newHolders.map(h => `
          <tr><td class="addr" title="${esc(h.owner)}">${short(h.owner)}</td><td class="num">${h.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td><td>${new Date(h.firstMs).toISOString().slice(0, 10)}</td></tr>`).join('')
        : '<tr><td colspan="3" style="color:var(--muted)">Tidak ada holder baru 7 hari terakhir</td></tr>'}
      </tbody>
    </table>
    <div class="note">Wallet asli dengan first acquisition ≤7 hari.</div>
  </div>
</div>

<div class="panel">
  <div class="tabs">
    <button class="tab active" data-t="holders">All Holders</button>
    <button class="tab" data-t="points">Points</button>
  </div>
  <table id="tbl-holders">
    <thead><tr><th>#</th><th>Wallet</th><th>Type</th><th class="num">rkuSOL</th><th class="num">Share</th><th class="num">First Seen</th><th class="num">Days</th><th class="num">Points</th></tr></thead>
    <tbody id="holdersBody"></tbody>
  </table>
  <table id="tbl-points" style="display:none">
    <thead><tr><th>#</th><th>Wallet</th><th class="num">rkuSOL</th><th class="num">Days</th><th class="num">Points</th><th class="num">Daily</th></tr></thead>
    <tbody id="pointsBody"></tbody>
  </table>
  <div class="note" id="ptsNote"></div>
</div>

<div class="note">
  <b>Metodologi:</b> 1 rkuSOL = 1 point/hari sejak <i>first acquisition</i> (transaksi rkuSOL pertama wallet, dari histori on-chain per-account).
  Score = balance × days held. <b>Estimasi, bukan angka resmi Raiku/Discord</b>. Daily points = total balance semua wallet (bertambah tiap hari).
  Holder baru dideteksi dari first acquisition ≤7 hari. Data: Solana RPC + Raiku staking API.
</div>

<script>
const DATA = ${JSON.stringify(data)};
const short = a => a.slice(0, 5) + "…" + a.slice(-5);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const fmt = (n, d=2) => Number(n).toLocaleString("en-US", {minimumFractionDigits: d, maximumFractionDigits: d});
const fmt0 = n => Number(n).toLocaleString("en-US", {maximumFractionDigits: 0});

document.getElementById("ts").textContent = DATA.ts;
document.getElementById("c_supply").textContent = fmt(DATA.supply);
document.getElementById("c_owners").textContent = fmt0(DATA.totalOwners);
document.getElementById("c_real").textContent = fmt0(DATA.realWallets);
document.getElementById("c_official").textContent = fmt0(DATA.officialHolders ?? 0);
document.getElementById("c_top10").textContent = DATA.top10Share.toFixed(1) + "%";
document.getElementById("c_apy").textContent = DATA.apyPct ? DATA.apyPct + "%" : "—";
document.getElementById("c_totpts").textContent = fmt0(DATA.totalPoints);
document.getElementById("c_dailypts").textContent = "+" + fmt0(DATA.dailyPoints) + "/day";

new Chart(document.getElementById("pieChart"), {
  type: "doughnut",
  data: {
    labels: DATA.pie.labels,
    datasets: [{ data: DATA.pie.amounts, backgroundColor: ["#c0ff38","#3b9ee8","#a78bfa","#f59e0b","#ef4444","#10b981","#ec4899","#6366f1","#14b8a6","#f97316","#4d5560"], borderColor: "#10140e", borderWidth: 2 }]
  },
  options: { plugins: { legend: { labels: { color: "#8a928a", font: { size: 11 } } } } }
});

new Chart(document.getElementById("dailyChart"), {
  type: "line",
  data: {
    labels: DATA.dailyTimeline.map(d => d.label),
    datasets: [{ label: "cumulative points", data: DATA.dailyTimeline.map(d => d.points), borderColor: "#c0ff38", backgroundColor: "rgba(192,255,56,0.12)", fill: true, tension: 0.3, pointRadius: 2 }]
  },
  options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { color: "#8a928a" }, grid: { color: "#1a1e1a" } }, x: { ticks: { color: "#8a928a", font: { size: 9 } }, grid: { display: false } } } }
});

new Chart(document.getElementById("holderChart"), {
  type: "line",
  data: {
    labels: DATA.holderTimeline.map(d => d.label),
    datasets: [{ label: "holders", data: DATA.holderTimeline.map(d => d.holders), borderColor: "#3b9ee8", backgroundColor: "rgba(59,158,232,0.12)", fill: true, tension: 0.3, pointRadius: 2 }]
  },
  options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: "#8a928a" }, grid: { color: "#1a1e1a" } }, x: { ticks: { color: "#8a928a", font: { size: 9 } }, grid: { display: false } } } }
});

const hb = document.getElementById("holdersBody");
for (const h of DATA.realRows.slice(0, 100)) {
  const tr = document.createElement("tr");
  tr.innerHTML = \`<td class="num">\${h.rank}</td><td class="addr" title="\${esc(h.owner)}">\${short(h.owner)}</td><td>Wallet</td><td class="num">\${fmt(h.amount, 4)}</td><td class="num">\${h.sharePct.toFixed(2)}%</td><td class="num">\${new Date(h.firstMs).toISOString().slice(0,10)}</td><td class="num">\${h.daysHeld.toFixed(1)}</td><td class="num accent">\${fmt(h.score, 1)}</td>\`;
  hb.appendChild(tr);
}
const pb = document.getElementById("pointsBody");
for (const h of DATA.realRows.slice(0, 100)) {
  const tr = document.createElement("tr");
  tr.innerHTML = \`<td class="num">\${h.rank}</td><td class="addr" title="\${esc(h.owner)}">\${short(h.owner)}</td><td class="num">\${fmt(h.amount, 4)}</td><td class="num">\${h.daysHeld.toFixed(1)}</td><td class="num accent">\${fmt(h.score, 1)}</td><td class="num">+\${fmt(h.amount, 4)}/day</td>\`;
  pb.appendChild(tr);
}
document.getElementById("ptsNote").textContent = "Total points: " + fmt0(DATA.totalPoints) + " · daily: +" + fmt0(DATA.dailyPoints) + "/day · coverage firstSeen: " + DATA.coverage.found + "/" + DATA.coverage.total + " — estimasi, bukan angka resmi Discord.";

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const show = btn.dataset.t === "holders" ? "tbl-holders" : "tbl-points";
    document.getElementById("tbl-holders").style.display = show === "tbl-holders" ? "" : "none";
    document.getElementById("tbl-points").style.display = show === "tbl-points" ? "" : "none";
  });
});

function searchAddr() {
  const q = document.getElementById("addrInput").value.trim().toLowerCase();
  const box = document.getElementById("searchResult");
  if (!q) { box.style.display = "none"; return; }
  const h = DATA.realRows.find(r => r.owner.toLowerCase() === q);
  if (!h) {
    box.innerHTML = '<div class="note" style="color:var(--red)">Address tidak ditemukan di daftar holder rkuSOL (wallet asli).</div>';
    box.style.display = "block";
    return;
  }
  box.innerHTML = \`
    <div class="row"><div class="k">Wallet</div><div class="v mono">\${esc(h.owner)}</div></div>
    <div class="row"><div class="k">Balance</div><div class="v">\${fmt(h.amount, 6)} rkuSOL</div></div>
    <div class="row"><div class="k">Share</div><div class="v">\${h.sharePct.toFixed(4)}%</div></div>
    <div class="row"><div class="k">First Seen</div><div class="v">\${new Date(h.firstMs).toISOString()}</div></div>
    <div class="row"><div class="k">Days Held</div><div class="v">\${h.daysHeld.toFixed(2)} hari</div></div>
    <div class="row"><div class="k">Estimasi Points</div><div class="v accent">\${fmt(h.score, 1)} pts</div></div>
    <div class="row"><div class="k">Per Hari</div><div class="v">+\${fmt(h.amount, 6)} pts/day</div></div>\`;
  box.style.display = "block";
}
document.getElementById("addrInput").addEventListener("keydown", e => { if (e.key === "Enter") searchAddr(); });
</script>
</body>
</html>`;

fs.writeFileSync(OUT_HTML, html, 'utf8');
console.log('dashboard.html v3 generated:', fs.statSync(OUT_HTML).size, 'bytes');
console.log('  real wallets:', realWallets, '| total points:', Math.round(totalPoints).toLocaleString(), '| daily:', Math.round(dailyPoints).toLocaleString());
console.log('  top-10 share:', top10Share.toFixed(1) + '%', '| new holders 7d:', newHolders.length);

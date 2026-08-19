import fs from 'node:fs';
import path from 'node:path';
import { p, ROOT } from './paths.mjs';

// rkuSOL Dashboard — Dune-style
// Dark theme, blue accent, KPI row, query-panel grid, tabbed queries.

const holdersData = JSON.parse(fs.readFileSync(p('holders_full.json'), 'utf8'));
const firstSeenData = JSON.parse(fs.readFileSync(p('firstseen.json'), 'utf8'));
let pdaLabels = {};
try { pdaLabels = JSON.parse(fs.readFileSync(p('pda_labels.json'), 'utf8')); } catch {}

const NOW = Date.now();
const DAY = 86400000;
const launch = new Date(holdersData.stats?.launchDate || '2026-05-11T21:00:00Z').getTime();

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

const pieReal = [...realRows].sort((a, b) => b.amount - a.amount).slice(0, 10);
const pieOthers = realRows.filter(r => !pieReal.includes(r)).reduce((a, r) => a + r.amount, 0);
const pie = {
  labels: [...pieReal.map((r, i) => `${i + 1}. ${r.owner.slice(0, 5)}…${r.owner.slice(-4)}`), 'Others'],
  amounts: [...pieReal.map(r => r.amount), pieOthers],
};

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
<title>rkuSOL Holder &amp; Points — Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0b0b0f;
    --bg-2: #101016;
    --panel: #15151d;
    --panel-2: #1a1a24;
    --border: #23232f;
    --border-2: #2e2e3d;
    --text: #f5f6fa;
    --muted: #8b8b98;
    --muted-2: #6b6b78;
    --accent: #6c8cff;
    --accent-soft: rgba(108,140,255,0.12);
    --green: #4ade80;
    --red: #f87171;
    --purple: #a78bfa;
    --orange: #fbbf24;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-font-smoothing: antialiased; }
  body {
    background: var(--bg); color: var(--text);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    line-height: 1.5; min-height: 100vh;
  }
  .topbar {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 28px; border-bottom: 1px solid var(--border);
    background: var(--bg-2); position: sticky; top: 0; z-index: 50;
  }
  .topbar .logo { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), #4ade80); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #0b0b0f; }
  .topbar .crumbs { font-size: 13px; color: var(--muted); }
  .topbar .crumbs b { color: var(--text); font-weight: 600; }
  .topbar .right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
  .topbar .pill { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: var(--panel); border: 1px solid var(--border); color: var(--muted); }
  .topbar .pill.live { color: var(--green); border-color: rgba(74,222,128,0.3); background: rgba(74,222,128,0.08); }
  .main { max-width: 1240px; margin: 0 auto; padding: 28px; }
  .dash-header { margin-bottom: 26px; }
  .dash-header .eyebrow { font-size: 12px; color: var(--muted-2); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
  .dash-header h1 { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .dash-header h1 .tag { font-size: 12px; font-weight: 500; color: var(--accent); background: var(--accent-soft); border: 1px solid rgba(108,140,255,0.3); padding: 3px 10px; border-radius: 999px; }
  .dash-header .sub { color: var(--muted); font-size: 13px; margin-top: 6px; }
  .dash-header .sub a { color: var(--accent); text-decoration: none; }
  .dash-header .sub a:hover { text-decoration: underline; }
  .filterbar { display: flex; gap: 8px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
  .filterbar .search { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 8px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; }
  .filterbar .search svg { width: 14px; height: 14px; color: var(--muted-2); }
  .filterbar .search input { flex: 1; background: transparent; border: 0; color: var(--text); padding: 9px 0; font-family: inherit; font-size: 13px; outline: none; }
  .filterbar .search input::placeholder { color: var(--muted-2); }
  .filterbar .btn { background: var(--panel); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 9px 14px; font-family: inherit; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .filterbar .btn:hover { border-color: var(--border-2); }
  .filterbar .btn.primary { background: var(--accent); border-color: var(--accent); color: #0b0b0f; font-weight: 600; }
  .filterbar .btn.primary:hover { filter: brightness(1.1); }
  .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 26px; }
  .kpi { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; }
  .kpi .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px; }
  .kpi .value { font-size: 24px; font-weight: 700; margin-top: 8px; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  .kpi .delta { font-size: 11px; margin-top: 4px; color: var(--muted); }
  .kpi .delta.up { color: var(--green); }
  .kpi .accent { color: var(--accent); }
  .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 20px; overflow: hidden; }
  .panel .phead { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
  .panel .phead .icon { width: 26px; height: 26px; border-radius: 6px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; font-size: 13px; }
  .panel .phead .title { font-size: 14px; font-weight: 600; }
  .panel .phead .desc { font-size: 12px; color: var(--muted); }
  .panel .phead .spacer { flex: 1; }
  .panel .phead .badge { font-size: 11px; padding: 3px 8px; border-radius: 5px; background: var(--panel-2); border: 1px solid var(--border); color: var(--muted); }
  .panel .pbody { padding: 18px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: var(--muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 12px; border-bottom: 1px solid var(--border); }
  td { padding: 9px 12px; border-bottom: 1px solid #1c1c26; font-variant-numeric: tabular-nums; }
  tbody tr:hover { background: var(--panel-2); }
  tbody tr:last-child td { border-bottom: 0; }
  .num { text-align: right; }
  .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
  .addr { color: var(--muted); font-size: 12px; }
  .rank-badge { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 6px; background: var(--panel-2); font-size: 11px; font-weight: 600; color: var(--muted); }
  .rank-badge.top1 { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #0b0b0f; }
  .rank-badge.top2 { background: linear-gradient(135deg, #cbd5e1, #94a3b8); color: #0b0b0f; }
  .rank-badge.top3 { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; }
  .badge { font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 600; letter-spacing: 0.03em; }
  .badge.wallet { background: rgba(74,222,128,0.1); color: var(--green); border: 1px solid rgba(74,222,128,0.25); }
  .badge.pool { background: rgba(167,139,250,0.1); color: var(--purple); border: 1px solid rgba(167,139,250,0.25); }
  .badge.sanctum { background: rgba(108,140,255,0.1); color: var(--accent); border: 1px solid rgba(108,140,255,0.25); }
  .tabs { display: flex; gap: 2px; padding: 6px; background: var(--bg-2); border-radius: 8px; }
  .tabs .tab { padding: 6px 14px; border-radius: 6px; font-size: 13px; color: var(--muted); cursor: pointer; border: 0; background: transparent; font-family: inherit; }
  .tabs .tab.active { background: var(--panel-2); color: var(--text); }
  .note { color: var(--muted-2); font-size: 12px; margin-top: 12px; line-height: 1.6; }
  .note b { color: var(--muted); }
  .search-result { display: none; background: var(--panel-2); border: 1px solid rgba(108,140,255,0.4); border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
  .search-result .row { display: grid; grid-template-columns: 160px 1fr; gap: 4px 16px; padding: 4px 0; font-size: 13px; }
  .search-result .k { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; padding-top: 2px; }
  .search-result .v { font-variant-numeric: tabular-nums; }
  .search-result .v.hl { color: var(--accent); font-weight: 600; }
  .footer { border-top: 1px solid var(--border); margin-top: 30px; padding: 20px 28px; color: var(--muted-2); font-size: 12px; }
  .footer a { color: var(--muted); }
  @media (max-width: 900px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } .main { padding: 16px; } .dash-header h1 { font-size: 24px; } }
</style>
</head>
<body>

<div class="topbar">
  <div class="logo">⛽</div>
  <div class="crumbs">dune.com / <b>yjm26</b> / <b>raiku-dashboard</b></div>
  <div class="right">
    <span class="pill live">● Live</span>
    <span class="pill">fork</span>
    <span class="pill">☆ Star</span>
  </div>
</div>

<div class="main">
  <div class="dash-header">
    <div class="eyebrow">Dashboard · Solana · Raiku Liquid Staking</div>
    <h1>rkuSOL Holder &amp; Points <span class="tag">1 rkuSOL = 1 pt/day</span></h1>
    <div class="sub">
      Token <span class="mono" style="color:var(--muted)">rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp</span> ·
      Snapshot <span id="ts"></span> · launch <span id="launch"></span> ·
      <a href="https://solscan.io/token/rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp" target="_blank">Solscan ↗</a>
    </div>
  </div>

  <div class="filterbar">
    <div class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <input id="addrInput" placeholder="Search wallet address… (cek balance, first seen, estimasi points)"/>
    </div>
    <button class="btn primary" onclick="searchAddr()">Search</button>
  </div>

  <div class="search-result" id="searchResult"></div>

  <div class="kpi-row">
    <div class="kpi"><div class="label">rkuSOL Cap</div><div class="value accent" id="c_supply"></div><div class="delta">total supply</div></div>
    <div class="kpi"><div class="label">Holders</div><div class="value" id="c_holders"></div><div class="delta"><span id="c_holders_sub"></span></div></div>
    <div class="kpi"><div class="label">Real Wallets</div><div class="value" id="c_real"></div><div class="delta up">ex-pool/PDA</div></div>
    <div class="kpi"><div class="label">Official Holders</div><div class="value" id="c_official"></div><div class="delta">per Raiku API</div></div>
    <div class="kpi"><div class="label">Top-10 Share</div><div class="value" id="c_top10"></div><div class="delta" style="color:var(--orange)">concentration</div></div>
    <div class="kpi"><div class="label">APY</div><div class="value" id="c_apy"></div><div class="delta">latest epoch</div></div>
    <div class="kpi"><div class="label">Total Points</div><div class="value accent" id="c_totpts"></div><div class="delta">all wallets</div></div>
    <div class="kpi"><div class="label">Daily Points</div><div class="value" id="c_dailypts"></div><div class="delta up">accruing now</div></div>
  </div>

  <div class="grid-2">
    <div class="panel">
      <div class="phead"><div class="icon">🍩</div><div class="title">Holder Distribution</div><div class="desc">real wallets</div><div class="spacer"></div><span class="badge">top-10 vs others</span></div>
      <div class="pbody"><canvas id="pieChart" height="240"></canvas></div>
    </div>
    <div class="panel">
      <div class="phead"><div class="icon">📈</div><div class="title">Points Accrual</div><div class="desc">cumulative estimate</div><div class="spacer"></div><span class="badge">linear</span></div>
      <div class="pbody"><canvas id="dailyChart" height="240"></canvas></div>
    </div>
  </div>

  <div class="grid-3">
    <div class="panel">
      <div class="phead"><div class="icon">🏆</div><div class="title">Top Holders</div><div class="spacer"></div><span class="badge">by balance</span></div>
      <div class="pbody" style="padding:0">
        <table>
          <thead><tr><th>#</th><th>Wallet</th><th>Type</th><th class="num">rkuSOL</th></tr></thead>
          <tbody id="topHoldersBody"></tbody>
        </table>
      </div>
    </div>
    <div class="panel">
      <div class="phead"><div class="icon">👥</div><div class="title">Holders Over Time</div><div class="spacer"></div><span class="badge">since launch</span></div>
      <div class="pbody"><canvas id="holderChart" height="240"></canvas></div>
    </div>
    <div class="panel">
      <div class="phead"><div class="icon">🆕</div><div class="title">New Holders</div><div class="desc">last 7 days</div><div class="spacer"></div><span class="badge" id="newCount"></span></div>
      <div class="pbody" style="padding:0">
        <table>
          <thead><tr><th>Wallet</th><th class="num">rkuSOL</th><th>Since</th></tr></thead>
          <tbody id="newHoldersBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="phead">
      <div class="icon">📋</div>
      <div class="tabs">
        <button class="tab active" data-t="holders">All Holders</button>
        <button class="tab" data-t="points">Points Leaderboard</button>
      </div>
      <div class="spacer"></div>
      <span class="badge" id="rowCount"></span>
    </div>
    <div class="pbody" style="padding:0">
      <div style="overflow-x:auto">
        <table id="tbl-holders">
          <thead><tr><th>#</th><th>Wallet</th><th>Type</th><th class="num">rkuSOL</th><th class="num">Share</th><th class="num">First Seen</th><th class="num">Days</th><th class="num">Points</th><th class="num">Daily</th></tr></thead>
          <tbody id="holdersBody"></tbody>
        </table>
        <table id="tbl-points" style="display:none">
          <thead><tr><th>#</th><th>Wallet</th><th class="num">rkuSOL</th><th class="num">Days Held</th><th class="num">Points</th><th class="num">Per Day</th></tr></thead>
          <tbody id="pointsBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="note">
    <b>Methodology:</b> 1 rkuSOL = 1 point per day since <i>first acquisition</i> (earliest rkuSOL tx of the wallet, from on-chain history).
    Score = current balance × days held. <b>Estimate, not official Raiku/Discord numbers</b> — official leaderboard may differ.
    Daily points = sum of all wallet balances (accrues each day). New holders detected via first acquisition ≤ 7 days.
    Data: Solana RPC (helius) + Raiku staking API. First-seen coverage: ${data.coverage.found}/${data.coverage.total} wallets.
  </div>
</div>

<div class="footer">
  ⛽ rkuSOL Holder &amp; Points Dashboard · not affiliated with Raiku · data is on-chain public info · estimates only, not financial advice
</div>

<script>
const DATA = ${JSON.stringify(data)};
const short = a => a.slice(0, 5) + "…" + a.slice(-5);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const fmt = (n, d=2) => Number(n).toLocaleString("en-US", {minimumFractionDigits: d, maximumFractionDigits: d});
const fmt0 = n => Number(n).toLocaleString("en-US", {maximumFractionDigits: 0});

document.getElementById("ts").textContent = DATA.ts.slice(0, 16).replace("T", " ") + " UTC";
document.getElementById("launch").textContent = (DATA.launchDate || "").slice(0, 10);
document.getElementById("c_supply").textContent = fmt(DATA.supply);
document.getElementById("c_holders").textContent = fmt0(DATA.totalOwners);
document.getElementById("c_holders_sub").textContent = DATA.pdaWallets + " pool/PDA";
document.getElementById("c_real").textContent = fmt0(DATA.realWallets);
document.getElementById("c_official").textContent = fmt0(DATA.officialHolders ?? 0);
document.getElementById("c_top10").textContent = DATA.top10Share.toFixed(1) + "%";
document.getElementById("c_apy").textContent = DATA.apyPct ? DATA.apyPct + "%" : "—";
document.getElementById("c_totpts").textContent = fmt0(DATA.totalPoints);
document.getElementById("c_dailypts").textContent = "+" + fmt0(DATA.dailyPoints) + "/day";
document.getElementById("newCount").textContent = DATA.newHolders.length + " new";
document.getElementById("rowCount").textContent = DATA.realRows.length + " rows";

// pie
new Chart(document.getElementById("pieChart"), {
  type: "doughnut",
  data: {
    labels: DATA.pie.labels,
    datasets: [{ data: DATA.pie.amounts, backgroundColor: ["#6c8cff","#4ade80","#a78bfa","#fbbf24","#f87171","#22d3ee","#ec4899","#818cf8","#2dd4bf","#fb923c","#3f3f4f"], borderColor: "#15151d", borderWidth: 3 }]
  },
  options: { cutout: "62%", plugins: { legend: { labels: { color: "#8b8b98", font: { size: 11, family: "Inter" }, boxWidth: 10, boxHeight: 10, padding: 14 } } } }
});

// daily points
new Chart(document.getElementById("dailyChart"), {
  type: "line",
  data: {
    labels: DATA.dailyTimeline.map(d => d.label),
    datasets: [{ label: "cumulative points", data: DATA.dailyTimeline.map(d => d.points), borderColor: "#6c8cff", backgroundColor: "rgba(108,140,255,0.10)", fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }]
  },
  options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { color: "#6b6b78", font: { size: 10 } }, grid: { color: "#1c1c26" } }, x: { ticks: { color: "#6b6b78", font: { size: 10 }, maxTicksLimit: 8 }, grid: { display: false } } } }
});

// holders over time
new Chart(document.getElementById("holderChart"), {
  type: "line",
  data: {
    labels: DATA.holderTimeline.map(d => d.label),
    datasets: [{ label: "holders", data: DATA.holderTimeline.map(d => d.holders), borderColor: "#4ade80", backgroundColor: "rgba(74,222,128,0.10)", fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }]
  },
  options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: "#6b6b78", font: { size: 10 } }, grid: { color: "#1c1c26" } }, x: { ticks: { color: "#6b6b78", font: { size: 10 }, maxTicksLimit: 8 }, grid: { display: false } } } }
});

// top holders
const thb = document.getElementById("topHoldersBody");
DATA.topHolders.forEach(h => {
  const tr = document.createElement("tr");
  const cls = h.rank === 1 ? "top1" : h.rank === 2 ? "top2" : h.rank === 3 ? "top3" : "";
  const badge = h.isPda ? \`<span class="badge \${/sanctum/i.test(h.pdaLabel||'') ? 'sanctum' : 'pool'}">\${esc(h.pdaLabel || 'Pool')}</span>\` : '<span class="badge wallet">Wallet</span>';
  tr.innerHTML = \`<td><span class="rank-badge \${cls}">\${h.rank}</span></td><td class="addr mono" title="\${esc(h.owner)}">\${short(h.owner)}</td><td>\${badge}</td><td class="num">\${fmt(h.amount, 2)}</td>\`;
  thb.appendChild(tr);
});

// new holders
const nhb = document.getElementById("newHoldersBody");
if (DATA.newHolders.length) {
  DATA.newHolders.forEach(h => {
    const tr = document.createElement("tr");
    tr.innerHTML = \`<td class="addr mono" title="\${esc(h.owner)}">\${short(h.owner)}</td><td class="num">\${fmt(h.amount, 2)}</td><td class="num" style="color:var(--muted)">\${new Date(h.firstMs).toISOString().slice(0,10)}</td>\`;
    nhb.appendChild(tr);
  });
} else {
  nhb.innerHTML = '<tr><td colspan="3" style="color:var(--muted);padding:16px">No new holders in last 7 days</td></tr>';
}

// all holders + points
const hb = document.getElementById("holdersBody");
DATA.realRows.slice(0, 100).forEach(h => {
  const tr = document.createElement("tr");
  tr.innerHTML = \`<td><span class="rank-badge">\${h.rank}</span></td><td class="addr mono" title="\${esc(h.owner)}">\${short(h.owner)}</td><td><span class="badge wallet">Wallet</span></td><td class="num">\${fmt(h.amount, 4)}</td><td class="num">\${h.sharePct.toFixed(2)}%</td><td class="num" style="color:var(--muted)">\${new Date(h.firstMs).toISOString().slice(0,10)}</td><td class="num">\${h.daysHeld.toFixed(1)}</td><td class="num" style="color:var(--accent);font-weight:600">\${fmt(h.score, 1)}</td><td class="num" style="color:var(--muted)">+\${fmt(h.amount, 2)}/d</td>\`;
  hb.appendChild(tr);
});
const pb = document.getElementById("pointsBody");
DATA.realRows.slice(0, 100).forEach(h => {
  const tr = document.createElement("tr");
  tr.innerHTML = \`<td><span class="rank-badge">\${h.rank}</span></td><td class="addr mono" title="\${esc(h.owner)}">\${short(h.owner)}</td><td class="num">\${fmt(h.amount, 4)}</td><td class="num">\${h.daysHeld.toFixed(1)}</td><td class="num" style="color:var(--accent);font-weight:600">\${fmt(h.score, 1)}</td><td class="num" style="color:var(--muted)">+\${fmt(h.amount, 2)}/d</td>\`;
  pb.appendChild(tr);
});

// tabs
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const show = btn.dataset.t === "holders" ? "tbl-holders" : "tbl-points";
    document.getElementById("tbl-holders").style.display = show === "tbl-holders" ? "" : "none";
    document.getElementById("tbl-points").style.display = show === "tbl-points" ? "" : "none";
  });
});

// search
function searchAddr() {
  const q = document.getElementById("addrInput").value.trim().toLowerCase();
  const box = document.getElementById("searchResult");
  if (!q) { box.style.display = "none"; return; }
  const h = DATA.realRows.find(r => r.owner.toLowerCase() === q);
  if (!h) {
    box.innerHTML = '<div class="note" style="color:var(--red)">Address not found in rkuSOL real-wallet holders.</div>';
    box.style.display = "block"; return;
  }
  box.innerHTML = \`
    <div class="row"><div class="k">Wallet</div><div class="v mono">\${esc(h.owner)}</div></div>
    <div class="row"><div class="k">Balance</div><div class="v">\${fmt(h.amount, 6)} rkuSOL</div></div>
    <div class="row"><div class="k">Share</div><div class="v">\${h.sharePct.toFixed(4)}%</div></div>
    <div class="row"><div class="k">First Seen</div><div class="v">\${new Date(h.firstMs).toISOString()}</div></div>
    <div class="row"><div class="k">Days Held</div><div class="v">\${h.daysHeld.toFixed(2)}</div></div>
    <div class="row"><div class="k">Est. Points</div><div class="v hl">\${fmt(h.score, 1)} pts</div></div>
    <div class="row"><div class="k">Per Day</div><div class="v">+\${fmt(h.amount, 6)} pts/day</div></div>\`;
  box.style.display = "block";
}
document.getElementById("addrInput").addEventListener("keydown", e => { if (e.key === "Enter") searchAddr(); });
</script>
</body>
</html>`;

const outHtml = path.join(ROOT, 'dashboard.html');
const outIndex = path.join(ROOT, 'index.html');
fs.writeFileSync(outHtml, html, 'utf8');
fs.writeFileSync(outIndex, html, 'utf8');
console.log('Dune-style dashboard generated:', fs.statSync(outHtml).size, 'bytes');
console.log('  real wallets:', realWallets, '| total pts:', Math.round(totalPoints).toLocaleString(), '| daily:', Math.round(dailyPoints).toLocaleString());

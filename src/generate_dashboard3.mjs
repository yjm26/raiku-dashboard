import fs from 'node:fs';
import path from 'node:path';
import { buildSnapshot } from './build_snapshot.mjs';
import { OUT_SNAPSHOT, p } from './paths.mjs';

const holdersData = JSON.parse(fs.readFileSync(p('holders_full.json'), 'utf8'));
const firstSeenData = JSON.parse(fs.readFileSync(p('firstseen.json'), 'utf8'));
let pdaLabels = {};
try {
  pdaLabels = JSON.parse(fs.readFileSync(p('pda_labels.json'), 'utf8'));
} catch {
  // PDA labels are optional; the snapshot builder supplies a generic label.
}

const snapshot = buildSnapshot({ holdersData, firstSeenData, pdaLabels });
const output = `${JSON.stringify(snapshot, null, 2)}\n`;
fs.mkdirSync(path.dirname(OUT_SNAPSHOT), { recursive: true });
fs.writeFileSync(OUT_SNAPSHOT, output, 'utf8');

const bytes = fs.statSync(OUT_SNAPSHOT).size;
console.log(`dashboard snapshot generated: ${OUT_SNAPSHOT}`);
console.log(`  bytes: ${bytes}`);
console.log(`  real wallets: ${snapshot.stats.realWallets} | total points: ${Math.round(snapshot.stats.totalPoints).toLocaleString()} | daily: ${Math.round(snapshot.stats.dailyPoints).toLocaleString()}`);
console.log(`  top-10 share: ${snapshot.stats.top10Share.toFixed(1)}% | new holders 7d: ${snapshot.newHolders.length}`);

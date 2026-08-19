import fs from 'node:fs';
import { rpc, sleep } from './rpc.mjs';
import { p } from './paths.mjs';

// Fetch program owner for all PDA holders so we can label them
// (Sanctum pool vs other program) in the dashboard.
const holders = JSON.parse(fs.readFileSync(p('holders_full.json'), 'utf8'));
const pdas = holders.holders.filter(h => h.isPda);
console.log('PDA holders to classify:', pdas.length);

// Known program addresses (mainnet)
const KNOWN = {
  SP12tWFxD9oJsV15avVQdyiRBmdaewyKbAyGepzRzvo: 'SanctumSpl (pool)',
  SPMBzsVUuoHB4Nb2nTvM5RDNpLwG4P7f3fFfLqVjQqo: 'SanctumValidator',
  'SP12tWFxD9oJsV15avVQdyiRBmdaewyKbAyGepzRzvo': 'SanctumSpl',
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
  '11111111111111111111111111111111': 'System Program',
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: 'Whirlpool (DEX)',
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: 'Raydium CLMM',
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: 'Jupiter',
};

async function getProgram(addr) {
  try {
    const info = await rpc('getAccountInfo', [addr, { encoding: 'jsonParsed' }]);
    return info?.value?.owner || null;
  } catch { return null; }
}

(async () => {
  const labels = {};
  for (let i = 0; i < pdas.length; i++) {
    const h = pdas[i];
    const prog = await getProgram(h.owner);
    labels[h.owner] = {
      program: prog,
      known: prog ? (KNOWN[prog] || 'Unknown program') : 'no-account (uninitialized/PDA)',
    };
    if (i % 40 === 0) console.log(`  ${i}/${pdas.length}`);
    await sleep(250);
  }
  // summarize
  const counts = {};
  for (const l of Object.values(labels)) counts[l.known] = (counts[l.known] || 0) + 1;
  console.log('\nLabel distribution:', JSON.stringify(counts, null, 1));
  fs.writeFileSync(p('pda_labels.json'), JSON.stringify(labels, null, 1));
  console.log('saved pda_labels.json');
})();

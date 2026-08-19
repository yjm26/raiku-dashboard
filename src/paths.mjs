import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Central path helper — repo works from any checkout location.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');   // repo root
export const SRC = __dirname;                         // src/
export const DATA = path.join(ROOT, 'data');          // data/
export const OUT_HTML = path.join(ROOT, 'dashboard.html');

export const p = (name) => path.join(DATA, name);

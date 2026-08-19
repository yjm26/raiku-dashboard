import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Central path helper — repo works from any checkout location.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const SRC = __dirname;
export const DATA = path.join(ROOT, 'data');
export const PUBLIC = path.join(ROOT, 'public');
export const PUBLIC_DATA = path.join(PUBLIC, 'data');
export const OUT_SNAPSHOT = path.join(PUBLIC_DATA, 'dashboard.json');
export const DIST = path.join(ROOT, 'dist');

export const p = (name) => path.join(DATA, name);

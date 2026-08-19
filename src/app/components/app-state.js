export function searchWallet(rows = [], query = '') {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  const idx = rows.findIndex((row) => String(row.owner).toLowerCase() === normalized);
  if (idx === -1) return null;
  return { ...rows[idx], rank: idx + 1 };
}

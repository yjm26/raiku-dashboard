export function searchWallet(rows = [], query = '') {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  // Exact match first
  const exactIdx = rows.findIndex((row) => String(row.owner).toLowerCase() === normalized);
  if (exactIdx !== -1) return { ...rows[exactIdx], rank: exactIdx + 1 };
  // Partial match: owner starts with the query, or query is a suffix of owner
  const partialIdx = rows.findIndex((row) => {
    const owner = String(row.owner).toLowerCase();
    return owner.startsWith(normalized) || owner.endsWith(normalized);
  });
  if (partialIdx !== -1) return { ...rows[partialIdx], rank: partialIdx + 1 };
  return null;
}

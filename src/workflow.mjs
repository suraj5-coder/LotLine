import { hash, reconcile, reviewHash, validateCase } from './reconcile.mjs';

// Audit walks independent SKU/lot partitions and sums with exact integer arithmetic.
export function audit(data, draft) {
  if (typeof draft !== 'string' || !/^[a-f0-9]{64}$/.test(draft) || draft.length !== 64) {
    throw new Error('Expected the full lowercase draft SHA-256');
  }

  const { notice, records } = validateCase(data);
  const compareCode = code => [...code].filter(char => char !== '-' && char !== ' ').join('').toUpperCase();
  const byCode = new Map();
  for (const row of records.filter(row => row.sku === notice.sku)) {
    const code = compareCode(row.lot);
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code).push(row.id);
  }

  const confirmed = new Set(byCode.get(compareCode(notice.lot)));
  const pending = new Set(byCode.get(compareCode(notice.questionableLot)));
  const rows = records.map(row => ({
    ...row,
    status: confirmed.has(row.id) ? 'confirmed' : pending.has(row.id) ? 'pending' : 'excluded'
  }));
  const totals = Object.fromEntries(['confirmed', 'pending', 'excluded'].map(status => {
    const subset = rows.filter(row => row.status === status);
    const sum = kind => {
      const value = subset.filter(row => row.kind === kind).reduce((sum, row) => sum + BigInt(row.units), 0n);
      if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Inventory total exceeds the supported range');
      return Number(value);
    };
    return [status, { stock: sum('stock'), shipped: sum('shipped') }];
  }));

  if (reviewHash(notice, rows, totals) !== draft) {
    throw new Error('Audit mismatch. Reconcile again using the current inventory export');
  }
  const receipt = hash(['lotline/audit/v1', draft]);
  return { id: notice.id, draft, receipt, totals, rows };
}

export function finalize(data, draft, receipt, decision) {
  const checked = audit(data, draft);
  if (checked.receipt !== receipt) throw new Error('Audit receipt does not match this draft');
  if (decision === undefined) throw new Error('An operator decision is required to finalize');
  return { result: reconcile(data, decision), review: { draft, receipt } };
}

import { createHash } from 'node:crypto';

const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const invalidLotCharacter = /[^A-Za-z0-9 -]/;
const labelPattern = /^[\p{L}\p{M}\p{N} /().,'_-]+$/u;

function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected an object`);
  }
  return value;
}

function field(value, label, pattern) {
  if (typeof value !== 'string' || !value || value !== value.trim() || !pattern.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function lot(value, label) {
  if (typeof value !== 'string' || invalidLotCharacter.test(value) || !/[A-Za-z0-9]/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

export function validateCase(data) {
  const { notice: input, records } = object(data, 'case');
  object(input, 'notice');
  const notice = {
    id: field(input.id, 'notice ID', idPattern),
    source: field(input.source, 'notice source', labelPattern),
    sku: field(input.sku, 'notice SKU', idPattern),
    lot: lot(input.lot, 'notice lot'),
    questionableLot: lot(input.questionableLot, 'questionable lot')
  };
  if (normalize(notice.lot) === normalize(notice.questionableLot)) {
    throw new Error('The two lot codes must be distinct after normalization');
  }
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('At least one inventory record is required');
  }

  const ids = new Set();
  const validated = records.map((record, index) => {
    object(record, `record at position ${index + 1}`);
    const id = field(record.id, `record ID at position ${index + 1}`, idPattern);
    if (ids.has(id)) throw new Error(`Duplicate record ${id}`);
    ids.add(id);
    const { kind, units } = record;
    if (!['stock', 'shipped'].includes(kind) || !Number.isSafeInteger(units) || units <= 0) {
      throw new Error(`Invalid kind or units in inventory record ${id}`);
    }
    return {
      id,
      sku: field(record.sku, `SKU for ${id}`, idPattern),
      lot: lot(record.lot, `lot for ${id}`),
      destination: field(record.destination, `destination for ${id}`, labelPattern),
      kind,
      units
    };
  });
  return { notice, records: validated };
}

const normalize = lot => lot.toUpperCase().replace(/[ -]/g, '');

function validateDecision(decision) {
  if (decision === undefined) return undefined;
  object(decision, 'decision');
  if (!['include', 'exclude'].includes(decision.scope)) {
    throw new Error('Scope must be include or exclude');
  }
  return {
    scope: decision.scope,
    operator: field(decision.operator, 'operator handle', idPattern),
    reference: field(decision.reference, 'decision evidence', labelPattern)
  };
}

export function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function reviewHash(notice, rows, totals, decision) {
  const sorted = [...rows].sort((a, b) => a.id < b.id ? -1 : Number(a.id > b.id));
  return hash([
    'lotline/review/v2',
    notice,
    sorted.map(({ id, sku, lot, destination, kind, units, status }) =>
      [id, sku, lot, destination, kind, units, status]),
    ['confirmed', 'pending', 'excluded'].map(status => [totals[status].stock, totals[status].shipped]),
    decision ?? null
  ]);
}

export function reconcile(data, inputDecision) {
  const { notice, records } = validateCase(data);
  const decision = validateDecision(inputDecision);
  const target = normalize(notice.lot);
  const questionable = normalize(notice.questionableLot);
  let foundQuestionable = false;
  const totals = {
    confirmed: { stock: 0, shipped: 0 },
    pending: { stock: 0, shipped: 0 },
    excluded: { stock: 0, shipped: 0 }
  };

  const rows = records.map(record => {
    const code = normalize(record.lot);
    let status = 'excluded';
    let reason = record.sku === notice.sku ? 'Other lot' : 'Other SKU';
    if (record.sku === notice.sku && code === target) {
      status = 'confirmed';
      reason = 'Exact normalized lot';
    } else if (record.sku === notice.sku && code === questionable) {
      foundQuestionable = true;
      status = decision ? (decision.scope === 'include' ? 'confirmed' : 'excluded') : 'pending';
      reason = decision ? `Operator chose ${decision.scope}` : 'Supplier scope unclear';
    }

    const total = totals[status][record.kind] + record.units;
    if (!Number.isSafeInteger(total)) throw new Error('Inventory total exceeds the supported range');
    totals[status][record.kind] = total;
    return { ...record, status, reason };
  });

  if (decision && !foundQuestionable) throw new Error('No matching records need a scope decision');
  return {
    id: notice.id, notice, decision, rows, totals,
    digest: reviewHash(notice, rows, totals, decision)
  };
}

const escape = value => value.replace(/_/g, '\\_');

export function actionSheet(result, review) {
  const { id, notice, decision, rows, totals, digest } = result;
  const hasPending = totals.pending.shipped > 0 || totals.pending.stock > 0;
  const state = decision ? 'Operator scope recorded' : hasPending ? 'Scope review pending' : 'Draft · no unresolved lot rows';
  const lines = [
    `## ${escape(id)} · ${state}`,
    '',
    `Source: ${escape(notice.source)} · SKU ${escape(notice.sku)} · lot ${notice.lot}`,
    '',
    decision
      ? `Operator ${escape(decision.operator)} · ${decision.scope} ${notice.questionableLot} · evidence ${escape(decision.reference)}`
      : hasPending
        ? `Ask the operator whether supplier evidence includes ${notice.questionableLot}.`
        : 'The questionable lot has no matching records in this export.',
    '',
    `**Confirmed** · ${totals.confirmed.shipped} shipped / ${totals.confirmed.stock} in stock`,
    `**Pending** · ${totals.pending.shipped} shipped / ${totals.pending.stock} in stock`,
    '',
    '| Record | Lot | Destination | Units | Scope | Evidence / proposed action |',
    '| --- | --- | --- | ---: | --- | --- |'
  ];
  for (const row of rows) {
    const action = {
      confirmed: row.kind === 'stock' ? 'Warehouse · isolate stock' : 'Store ops · trace shipped units',
      pending: 'Operator · verify supplier scope',
      excluded: 'Outside scope'
    }[row.status];
    lines.push(`| ${escape(row.id)} | ${row.lot} | ${escape(row.destination)} | ${row.units} | ${row.status} | ${row.reason} / ${action} |`);
  }
  lines.push('', `Sheet SHA-256: ${digest}`);
  if (review) lines.push(`Reviewed draft SHA-256: ${review.draft}`, `Audit receipt: ${review.receipt}`);
  lines.push('', 'Internal action sheet · actions are proposed for staff review.');
  return lines.join('\n');
}

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { actionSheet, reconcile } from '../src/reconcile.mjs';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/ll-017.json', import.meta.url), 'utf8'));
const decision = scope => ({ scope, operator: 'ops.lead', reference: 'NS-SUP-017-A' });

test('Formatting variants match. Lookalikes remain pending. Other SKUs stay outside scope.', () => {
  const review = reconcile(fixture);
  assert.deepEqual(review.totals, {
    confirmed: { stock: 18, shipped: 36 },
    pending: { stock: 6, shipped: 40 },
    excluded: { stock: 0, shipped: 39 }
  });
  assert.equal(review.rows.find(row => row.id === 'OUT-105').status, 'excluded');
  assert.match(actionSheet(review), /Scope review pending/);
});

test('Either operator decision resolves the same two records with different totals', () => {
  const included = reconcile(fixture, decision('include'));
  const excluded = reconcile(fixture, decision('exclude'));
  assert.deepEqual(included.totals.confirmed, { stock: 24, shipped: 76 });
  assert.deepEqual(excluded.totals.confirmed, { stock: 18, shipped: 36 });
  assert.deepEqual(included.totals.pending, { stock: 0, shipped: 0 });
  assert.deepEqual(excluded.totals.pending, { stock: 0, shipped: 0 });
  assert.notEqual(included.digest, excluded.digest);
  assert.equal(reconcile(fixture, decision('include')).digest, included.digest);
});

test('Invalid decisions and duplicate source records fail closed', () => {
  assert.throws(() => reconcile(fixture, { ...decision('include'), reference: '' }), /evidence/);
  assert.throws(() => reconcile(fixture, decision('maybe')), /Scope/);
  const records = [...fixture.records, fixture.records[0]];
  assert.throws(() => reconcile({ ...fixture, records }), /Duplicate record/);
});

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { actionSheet, reconcile } from '../src/reconcile.mjs';
import { audit, finalize } from '../src/workflow.mjs';

const fixturePath = fileURLToPath(new URL('../fixtures/ll-017.json', import.meta.url));
const cli = fileURLToPath(new URL('../src/lotline.mjs', import.meta.url));
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const decision = { scope: 'include', operator: 'ops.lead', reference: 'NS-SUP-017-A' };
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('Independent audit agrees on every row and quantity', () => {
  const draft = reconcile(fixture);
  const verified = audit(fixture, draft.digest);
  assert.deepEqual(verified.totals, draft.totals);
  assert.deepEqual(verified.rows.map(row => row.status), draft.rows.map(row => row.status));
  assert.deepEqual(verified.rows.filter(row => row.status === 'pending').map(row => row.id), ['OUT-103', 'STK-202']);
  const sheet = finalize(fixture, draft.digest, verified.receipt, decision);
  assert.deepEqual(sheet.result.totals.confirmed, { stock: 24, shipped: 76 });
  assert.match(actionSheet(sheet.result, sheet.review), new RegExp(verified.receipt));
});

test('Audit rejects drift in source data, draft or receipt', () => {
  const { digest } = reconcile(fixture);
  const { receipt } = audit(fixture, digest);
  for (const changed of [
    { ...fixture, notice: { ...fixture.notice, source: 'Updated supplier notice' } },
    ...['units', 'sku', 'lot', 'destination', 'kind'].map(key => {
      const records = structuredClone(fixture.records);
      records[0][key] = { units: 25, sku: 'OTHER-SKU', lot: 'K7-203', destination: 'Another store', kind: 'stock' }[key];
      return { ...fixture, records };
    })
  ]) {
    assert.throws(() => audit(changed, digest), /Audit mismatch/);
    assert.throws(() => finalize(changed, digest, receipt, decision), /Audit mismatch/);
  }
  assert.throws(() => audit(fixture, digest + '\n'), /full lowercase/);
  assert.throws(() => audit(fixture, '0'.repeat(64)), /Audit mismatch/);
  assert.throws(() => finalize(fixture, digest, '0'.repeat(64), decision), /receipt does not match/);
  assert.throws(() => finalize(fixture, digest, receipt), /operator decision is required/);
});

test('Equivalent JSON and record ordering keep the same draft fingerprint', () => {
  const original = reconcile(fixture);
  const reordered = {
    records: [...fixture.records].reverse().map(row => Object.fromEntries(Object.entries(row).reverse())),
    notice: Object.fromEntries(Object.entries(fixture.notice).reverse())
  };
  assert.equal(reconcile(reordered).digest, original.digest);
  assert.equal(audit(reordered, original.digest).receipt, audit(fixture, original.digest).receipt);
});

test('No questionable rows means no operator decision is needed', () => {
  const data = { ...fixture, records: fixture.records.filter(row => row.lot !== 'K7-20Z') };
  const draft = reconcile(data);
  assert.deepEqual(draft.totals.pending, { stock: 0, shipped: 0 });
  assert.match(actionSheet(draft), /no unresolved lot rows/);
  const checked = audit(data, draft.digest);
  assert.throws(() => finalize(data, draft.digest, checked.receipt, decision), /No matching records/);
});

test('Malformed exports, unsafe labels, units and overflow fail before producing a sheet', () => {
  for (const data of [null, [], {}, { ...fixture, records: [] }, { ...fixture, records: [null] }]) {
    assert.throws(() => reconcile(data), /Invalid|inventory record is required/);
  }
  assert.throws(() => reconcile(fixture, null), /Invalid decision/);
  assert.throws(() => reconcile({ ...fixture, notice: { ...fixture.notice, questionableLot: 'k7 202' } }), /distinct/);
  const [first, second] = fixture.records;
  const withFirst = changes => ({ ...fixture, records: [{ ...first, ...changes }, second] });
  for (const units of [0, -1, 0.5, '24', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => reconcile(withFirst({ units })), /Invalid kind or units/);
  }
  assert.throws(() => reconcile(withFirst({ lot: 'K7-202\n' })), /Invalid lot/);
  assert.throws(() => reconcile(withFirst({ destination: 'A | B' })), /Invalid destination/);
  assert.throws(() => reconcile(withFirst({ destination: '@channel' })), /Invalid destination/);
  const overflow = withFirst({ units: Number.MAX_SAFE_INTEGER });
  assert.throws(() => reconcile(overflow), /exceeds/);
  assert.throws(() => audit(overflow, '0'.repeat(64)), /exceeds/);
  const international = reconcile(withFirst({ destination: 'Almacén_Norte' }));
  assert.ok(actionSheet(international).includes('Almacén\\_Norte'));
});

test('CLI runs draft, independent audit and both branches from a clean process', () => {
  const draft = run(fixturePath);
  assert.equal(draft.status, 0, draft.stderr);
  const fingerprint = draft.stdout.match(/Sheet SHA-256: ([a-f0-9]{64})/)[1];
  const checked = run('audit', fixturePath, fingerprint);
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /AUDIT LL-017 PASS/);
  const receipt = checked.stdout.match(/Audit receipt: ([a-f0-9]{64})/)[1];

  for (const [scope, reference, expected] of [
    ['include', 'NS-SUP-017-A', /76 shipped \/ 24 in stock/],
    ['exclude', 'NS-SUP-017-B', /36 shipped \/ 18 in stock/]
  ]) {
    const finalized = run('finalize', fixturePath, fingerprint, receipt, scope, 'ops.lead', reference);
    assert.equal(finalized.status, 0, finalized.stderr);
    assert.match(finalized.stdout, expected);
    assert.match(finalized.stdout, /0 shipped \/ 0 in stock/);
  }

  const mismatch = run('finalize', fixturePath, fingerprint, '0'.repeat(64), 'include', 'ops.lead', 'NS-SUP-017-A');
  assert.equal(mismatch.status, 1);
  assert.equal(mismatch.stdout, '');
  assert.match(mismatch.stderr, /receipt does not match/);
  const missingFile = run('missing-case.json');
  assert.equal(missingFile.status, 1);
  assert.equal(missingFile.stdout, '');
});

test('CLI supports UTF-8 BOM exports and rejects broken JSON', t => {
  const directory = mkdtempSync(join(tmpdir(), 'lotline-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, 'inventory export.json');
  writeFileSync(path, '\uFEFF' + JSON.stringify(fixture));
  assert.equal(run(path).status, 0);
  writeFileSync(path, '{"notice":');
  const bad = run(path);
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, '');
  assert.match(bad.stderr, /LotLine:/);
});

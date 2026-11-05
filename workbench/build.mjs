import { readFileSync, writeFileSync } from 'node:fs';
import { actionSheet, reconcile } from '../src/reconcile.mjs';
import { audit, finalize } from '../src/workflow.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const data = JSON.parse(read('../fixtures/ll-017.json'));
const draft = reconcile(data);
const checked = audit(data, draft.digest);
const outcomes = {};
for (const [scope, reference] of [['include', 'NS-SUP-017-A'], ['exclude', 'NS-SUP-017-B']]) {
  const { result, review } = finalize(data, draft.digest, checked.receipt, {
    scope, operator: 'ops.lead', reference
  });
  outcomes[scope] = { result, sheet: actionSheet(result, review) };
}
const payload = JSON.stringify({ draft, checked, outcomes }).replace(/</g, '\\u003c');
const page = read('./layout.html').replace('/* LOTLINE_DATA */ null', () => payload);
writeFileSync(new URL('./index.html', import.meta.url), page);

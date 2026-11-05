import { readFileSync } from 'node:fs';
import { actionSheet, reconcile } from './reconcile.mjs';
import { audit, finalize } from './workflow.mjs';

function load(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function run(args) {
  const [command, path, draft, receipt, scope, operator, reference] = args;
  if (command === 'audit' && args.length === 3) {
    const checked = audit(load(path), draft);
    const { confirmed, pending } = checked.totals;
    const rows = checked.rows.filter(row => row.status === 'pending');
    return [
      `AUDIT ${checked.id} PASS`,
      `Draft SHA-256: ${checked.draft}`,
      `Audit receipt: ${checked.receipt}`,
      `Confirmed: ${confirmed.shipped} shipped / ${confirmed.stock} in stock`,
      `Pending: ${pending.shipped} shipped / ${pending.stock} in stock`,
      ...rows.map(row => `- ${row.id} · ${row.destination} · ${row.units} ${row.kind}`)
    ].join('\n');
  }
  if (command === 'finalize' && args.length === 7) {
    const { result, review } = finalize(load(path), draft, receipt, { scope, operator, reference });
    return actionSheet(result, review);
  }
  if (command && !['audit', 'finalize'].includes(command) && [1, 4].includes(args.length)) {
    const [file, scope, operator, reference] = args;
    const decision = args.length === 4 ? { scope, operator, reference } : undefined;
    return actionSheet(reconcile(load(file), decision));
  }
  throw new Error([
    'Usage:',
    '  node src/lotline.mjs <case.json> [<include|exclude> <operator> "<evidence>"]',
    '  node src/lotline.mjs audit <case.json> <draft-sha256>',
    '  node src/lotline.mjs finalize <case.json> <draft-sha256> <receipt> <include|exclude> <operator> "<evidence>"'
  ].join('\n'));
}

try {
  console.log(run(process.argv.slice(2)));
} catch (error) {
  console.error(`LotLine: ${error.message}`);
  process.exitCode = 1;
}

# FIX-V2-TABLE-1: Reveal columns between sticky boundaries

## Objective and prerequisites

Correct the table geometry failure in [V2-TABLE](../reports/V2-TABLE.md) and
[defect V2-TABLE-1](../defects/V2-TABLE-1.md). Prerequisite: the completed failed gate diagnostic.
This is the successful-prerequisite exception for correction tasks. Status: `PENDING`.
Do not start another task or sub-agent. No consumer may proceed before independent retest PASS.

## References and entry points

Read application/owner AGENTS, handbook framework-change/coding/build/architecture routes, table README,
[COMMON](../COMMON.md), [EXECUTION](../EXECUTION.md), [CONTRACTS](../CONTRACTS.md),
[SELECT-CONTRACT](../SELECT-CONTRACT.md), [VALIDATION](../VALIDATION.md),
[ENVIRONMENT](../ENVIRONMENT.md), [VERIFY-ENVIRONMENT](../VERIFY-ENVIRONMENT.md),
[L2-TABLE](../reports/L2-TABLE.md), the failed report and its raw evidence.
Product checkpoint: table `c7c9a65fb5497b1e76d809622eb0d3f4e44f1f97`, version `0.3.0`, clean at diagnosis.
Use the parent's returned V2-TABLE tracking commit; its report does not contain its own commit SHA.
Entry points: public `TableColumnAdd.reveal`, `TableFreeze.visibleInnerRect`, supported `colgroup` geometry,
`table/src/column-add.ts`, `table/src/freeze.ts`, table tests/demo and independent V2-TABLE checks.

## Scope and acceptance

At 768 × 900 and 844 × 390, click Add metric, wait for values and click again: only 126/208 px of the metric are
visible because Actions covers its right 82 px. At 390 × 844 only 126/194 available px are used.
`visibleInnerRect()` reads scrolling `col` rectangles while actual frozen cells remain sticky.
Fix the table-owned public geometry/reveal collaboration for both frozen boundaries. Preserve existing consumers,
DOM order, opaque ids, focus/selection, sort, delete/reorder, theme flash and asynchronous replacement/lifecycle.
Do not copy geometry into list/selector, relax assertions, alter fixture widths or implement later external transport.

Add useful regression coverage for colgroup and header-backed shapes, left/right freeze, wide columns, repeated
addition/reset and reveal in both directions. Rebuild table/tracking/application with installed scripts after reading
the current manifests; run owner Node tests, package/public artifact checks and the two V2-TABLE browser drivers.
Use trusted browser input at 1280 × 720, 768 × 900, 390 × 844 and 844 × 390 with Chromium sandbox enabled.
All fitting columns must be wholly within actual sticky boundaries; wider columns maximise visible inner area.
The correction report must give the exact tested SHA/version, assertions, screenshots and reusable reproduction.

## Commands and delivery

Use the owned standalone recipe on a checked-free port; the V2-TABLE verifier's 13762 instance was stopped.
Author port 13752 may still exist: inspect ownership before reusing it. Record any URL override with `PS_TABLE_URL`.
Run from showtime unless the command explicitly enters an owner:

```bash
npm --prefix node_modules/@itrocks/table run build
npm --prefix node_modules/@itrocks/property-select run build
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-TABLE.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-TABLE-reveal.cjs
npm run build
cd node_modules/@itrocks/table
node --test --test-isolation=none test/*.test.mjs
npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-FIX-V2-TABLE-1-pack-cache
```

No install/update, implicit-download npx, vcs-modules, application code/docs/commits or permission/sandbox changes.
Preserve showtime HEAD d7ca948 and its two staged/absent AD files; inspect every owner before edits.
Apply patch versioning immediately from each current HEAD; do not renumber unchanged owners.
Keep fresh correction evidence outside historical V2-TABLE evidence, by adding an output override to the driver if
needed. Never overwrite or relabel the failed gate evidence as a correction result.
Write `reports/FIX-V2-TABLE-1.md`, `evidence/FIX-V2-TABLE-1/`, update PLAN/matrix and review SOLID explicitly.
Inspect complete diffs, stage explicit attributable paths and make authorised local owner commits; no push/tag.

## Calibration and handover

Requested `gpt-6.1-sol` / `high`: scroll/sticky geometry spans public plugin contracts and must preserve
header gestures.
Parent dispatch metadata is authoritative; runtime model/effort cannot be independently attested by the executor.
Return status, actual owner SHAs/versions, validation, report/proofs/limits in at most eight lines.
Author success cannot clear the gate; RETEST-V2-TABLE-1 requires a fresh verifier distinct from this corrector.

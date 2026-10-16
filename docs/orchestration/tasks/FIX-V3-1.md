# FIX-V3-1: Keep ordinary navigation properties complete

## Objective and prerequisite

Correct [V3-01](../defects/V3-01.md). Prerequisite: completed V3 diagnostic report, under the correction exception in
[EXECUTION.md](../EXECUTION.md). Current status: `DONE` (author); independent `RETEST-V3-1` pending.

Read application/owner instructions, handbook routes, owner README, [COMMON.md](../COMMON.md),
[CONTRACTS.md](../CONTRACTS.md), [SELECT-CONTRACT.md](../SELECT-CONTRACT.md),
[VALIDATION.md](../VALIDATION.md), [ENVIRONMENT.md](../ENVIRONMENT.md),
[VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md) and [V3 report](../reports/V3.md).

## Scope and entry points

Owner: `@itrocks/property-select`; primary entry: `src/front/property-select.ts`, `render()` retained-row logic.
Restore ordinary adjacent properties on context changes and after search clearing/errors. Preserve focused result
identity while enriching the same live search, retained actions and final ranking after focus leaves.
No phase 2, new infrastructure, SQL/hydration changes, application code/docs/commits or unrelated refactor.
Never install/update, use implicit-download npx or run vcs-modules.

## Acceptance and tests

Expected root → tags list: `tags.invoices`, `tags.name`, with no obsolete root row. Verify both interfaces at
1280 × 720, 768 × 900, 390 × 844 and 844 × 390. Cover search Clear and recoverable errors, terminal/relation/segment
navigation, main/plus focus, pending enrichment and focused budget eviction.
Run the full selector suite, reduced reproducer, independent numerical bounds and full independent V3 driver:

```bash
npm --prefix node_modules/@itrocks/property-select test
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V3-reproduce.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V3-bounds.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V3.mjs
```

Read current manifest scripts first. Do not overwrite historical V3 evidence: add output-directory overrides to the
verification drivers or preserve the original evidence before supplementary replay.
Keep services and Chromium sandbox permissions intact; use normal escalation when required.
Review SOLID, exports/files and complete staged/unstaged/untracked diffs. Preserve showtime HEAD, two AD index blobs,
working-file absence and the unrelated `config.yaml` change identified in V3 baseline.

## Delivery and calibration

Requested `gpt-6.1-sol` / `high`: focus and asynchronous search rendering share nodes across navigation generations.
Parent records actual dispatch; runtime identity cannot be self-attested. No sub-agent or subsequent task.
Apply handbook versioning at first edit against current HEAD. Record tested checkpoints, commands, expected/observed
results and limits in `reports/FIX-V3-1.md` and `evidence/FIX-V3-1/`; update PLAN/matrix.
Create attributable authorised local owner commits with explicit paths; no own SHA in the report.
Return at most eight lines. Independent RETEST-V3-1 remains mandatory.

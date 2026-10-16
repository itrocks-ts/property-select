# FIX-V7-1: Preserve persistence recovery guidance

## Objective and prerequisite

Correct [V7-01](../defects/V7-01.md), diagnosed by the completed [V7 report](../reports/V7.md).
Status: `DONE / author PASS`; see [the correction report](../reports/FIX-V7-1.md).
The failed-gate correction exception in [EXECUTION.md](../EXECUTION.md) applies.
Read application/owner instructions and the handbook first, then [COMMON.md](../COMMON.md),
[CONTRACTS.md](../CONTRACTS.md), [SELECT-CONTRACT.md](../SELECT-CONTRACT.md), [VALIDATION.md](../VALIDATION.md),
[ENVIRONMENT.md](../ENVIRONMENT.md), [VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md), V7 and the defect.

## Scope and entry points

Owner: `@itrocks/property-select`; inspect `src/front/property-select.ts`, its public view tests and
`@itrocks/list/src/front/selector-state.ts` as the source of generic error information.
Retain distinct operation/persistence state while making the supplied session-ended/reload guidance visible.
Use text rendering and a fallback for unknown errors. Keep session/HTTP ownership in list and existing adapters.
No phase 2, host import, extra infrastructure, application source/docs/commit or unrelated cleanup.

## Acceptance and commands

Reproduce first by copying/adapting `environment/checks/V7.mjs session-regression` to a new evidence destination;
preserve the failed V7 evidence.
Run the eight fresh revoke/expiry scenarios with new output paths. Verify actual 410, visible reload guidance,
unchanged live state/columns, rejection of stale Retry and successful full reload recovery.
Also run browser-status, RETEST-L7-1-browser and the landscape error regression: operation errors survive scroll/save,
storage failure/Retry and clear only at appropriate operation recovery. Preserve ordinary search/loading messages.

Read manifest scripts, rebuild affected owners and application, run owner tests and verify exports/assets.
Use new `evidence/FIX-V7-1/` destinations for every replay; copy/adapt the V7 driver with recorded source hashes if
needed. Never overwrite historical V7 failure evidence. Keep browser sandboxing and normal escalation.
No install/update, implicit-download npx, vcs-modules, push, tag or deployment.

## Delivery and calibration

Requested `gpt-6-astra` / `high`: at least V7's risk profile for generic error presentation versus session lifecycle.
Parent records fresh dispatch; no self-attested runtime identity, no subdelegation or D8.
Apply handbook versioning on first edit against current HEAD. Write `reports/FIX-V7-1.md`, fresh evidence and
PLAN/matrix updates. Inspect complete staged/unstaged/untracked diffs and commit only explicit authorised owner paths.
Preserve showtime HEAD, both AD blobs/absences and foreign configuration. Return at most eight lines.
A distinct RETEST-V7-1 must close the defect and complete the full final matrix.

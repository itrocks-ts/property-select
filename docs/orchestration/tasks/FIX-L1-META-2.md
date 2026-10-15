# FIX-L1-META-2: Acknowledge empty column saves without rendering

## Objective and prerequisites

Correct the reproducible list-suite and real HTTP failure in
[RETEST-L1-META-1](../reports/RETEST-L1-META-1.md), status `NEEDS_FIX`.
This diagnostic prerequisite uses the correction exception in [EXECUTION](../EXECUTION.md).
Current status: `PENDING`. Execute only this correction; no sub-agent or dependent feature.

## References and entry points

Read application/owner AGENTS and handbook routes, list README, [COMMON](../COMMON.md),
[ENVIRONMENT](../ENVIRONMENT.md), [CONTRACTS](../CONTRACTS.md), [SELECT-CONTRACT](../SELECT-CONTRACT.md),
[VALIDATION](../VALIDATION.md), both L1-META/FIX-L1-META-1 reports and the independent retest report.
List checkpoint: `7191d22217a7d087c197134bc09226a34d05fc60` / `0.8.1`.
Framework checkpoint: `3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`.
Entry points: `list/src/list.ts`, `columns.ts`, `persist.ts`, `test/columns.test.mjs` and actual manifest scripts.

## Scope and acceptance

`List.html()` uses the truthiness of `request.request.data.columns` to identify a column-save request.
An explicit empty string therefore continues into feed/data rendering, although the column owner accepts it.
The current and immutable `0.8.0` suites both fail the same existing assertion before Feed executes.
Real `/country?columns=name` returns 204; `/country?columns=` returns 200 with a rendered body.
[Independent reproducer](../evidence/RETEST-L1-META-1/empty-columns.mjs),
[HTTP output](../evidence/RETEST-L1-META-1/empty-columns-http.txt) and
[baseline assertion](../evidence/RETEST-L1-META-1/baseline-columns.txt) are mandatory inputs.

Distinguish explicit column-save intent using the existing request/columns contract. Persist an empty column set and
acknowledge with 204 before feed, filter, sort, template or business reads. Preserve omitted-column list rendering,
nonempty saves, invalid-request behaviour and existing session restoration. Do not weaken the failing test.
Add only focused regression coverage needed beyond the existing cases. Apply the handbook patch on the first edit.
No metadata, SQL projection, policy or application product change is authorised.

Build list and framework with actual scripts; the full list suite, five META tests, projection tests and framework
suite must pass. Use absolute Node paths if the Node 24 discovery issue occurs, retaining the failed invocation.
On a fresh owned framework, verify bare `/country`, offset 0 and valid later feed pages plus the owned status command.
Verify nonempty and empty column saves return 204 with zero business reads and survive the existing session contract.
Keep metadata HTTP/browser abort/stale and zero business-read assertions green in sandboxed Chromium.
The correction does not clear the gate: a distinct fresh verifier runs `RETEST-L1-META-2`.

## Commands, evidence and calibration

Use the public `beforeFrameworkRun` hook and existing owned launcher on a verified available local port.
Keep the synthetic database; stop only processes proven owned by this correction.
No install/update, implicit-download npx, vcs-modules, application edits/commits or permission/sandbox changes.
Preserve showtime HEAD `d7ca948` and both staged/absent AD entries.
Write `reports/FIX-L1-META-2.md`, `evidence/FIX-L1-META-2/`, PLAN and matrix updates with exact argv, URLs,
versions/SHAs, expected/observed assertions, checksums, cleanup and SOLID review. Commit only explicit owner/tracking
paths locally; no own SHA in the report, push, tag or publication.

Requested `gpt-6.1-sol` / `high`; parent records dispatch and executor identity has no independent attestation.
This is a request-intent defect with an existing regression oracle. Evaluate Astra if session/SQL contracts become
ambiguous. Return at most eight lines with status, checkpoints, validation and report/evidence paths.

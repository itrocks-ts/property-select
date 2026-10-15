# FIX-L1-META-1: Restore default list pagination

## Objective and prerequisites

Correct the fresh-framework `/country` failure recorded by [L1-META](../reports/L1-META.md).
Prerequisite: completed L1-META diagnostic, status `NEEDS_FIX`. This is the correction-protocol prerequisite exception.
Current status: `PENDING`. Do not start another feature or a sub-agent.

## References and entry points

Read application/owner AGENTS, handbook framework-change routes and list README, then
[COMMON](../COMMON.md), [EXECUTION](../EXECUTION.md), [ENVIRONMENT](../ENVIRONMENT.md),
[CONTRACTS](../CONTRACTS.md), [SELECT-CONTRACT](../SELECT-CONTRACT.md), [VALIDATION](../VALIDATION.md),
[L1-META report](../reports/L1-META.md) and its [failing assertion](../evidence/L1-META/defect-offset.txt).
Product owner: `@itrocks/list`, initially `005702a6a0cd49740cdea37c2e5150dc80fb670b` / `0.8.0`.
Entry points: `list/src/feed.ts`, list pagination tests and its manifest's actual build/test scripts.
Framework metadata checkpoint: `3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`.

## Scope and acceptance

Missing `request.data.offset` currently becomes `NaN` via unary plus. Existing S07 MySQL search forwards it to the
strict SQL builder and the first list page returns 500 `unsupported-option` after a fresh startup.
Return a valid initial offset without changing explicit pagination, filters, sort, feed or projection contracts.
Do not weaken strict SQL/selection validation, substitute a backend, edit application source or change metadata policy.

Add focused regression coverage for an absent offset and explicit valid offsets. Read actual existing tests/scripts
before invoking them; build and run list and relevant framework tests using installed tools. A fresh real framework
must serve `/country` and `/country?offset=0` with HTTP 200 and both synthetic countries, and the documented owned
status command must pass. Metadata actions must remain available with no business reads for metadata fixtures.
The correction remains unaccepted until the separate fresh verifier passes `RETEST-L1-META-1`.

## Commands and evidence

Use the ownership-checked launcher with `PS_FRAMEWORK_INITIALIZER` documented in L1-META; choose a free owned port and
record it. The L1-META app was stopped; its directory is reusable after checking ownership/PID records. Never stop an
inherited process without owner evidence. The database remains synthetic on 13316; do not stop or reset private data.

No install/update, implicit-download npx, vcs-modules, permission changes or browser sandbox relaxation.
Keep showtime HEAD and the two staged/absent AD files intact. Apply handbook patch versioning on first owner/tracking
edit. Inspect complete owner diffs and commit explicit attributable paths locally only; no push.
Write `reports/FIX-L1-META-1.md`, `evidence/FIX-L1-META-1/`, PLAN and matrix observations, exact successful commands,
expected/observed results, checkpoint SHAs/versions and SOLID review. No own SHA in its report.

## Calibration and handover

Requested `gpt-6.1-sol` / `high`: the correction spans request defaults, real SQL validation and framework startup.
The parent owns dispatch evidence; no independent executor attestation is exposed. A new contract is not expected;
evaluate Astra explicitly if the diagnosis grows into SQL/projection semantics. Return at most eight lines with
status, commits/versions, validation, report/proof paths and remaining limits. Do not clear the gate yourself or start
another task; the separate independent retest owns acceptance.

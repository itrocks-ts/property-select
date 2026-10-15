# RETEST-L1-META-2: Verify metadata, pagination and column-save recovery

## Objective and prerequisites

Independently verify the correction of [FIX-L1-META-2](FIX-L1-META-2.md) after an attributable corrective commit.
Current status: `PENDING`. Use a fresh verifier distinct from both correction authors and the previous verifier.
Do not spawn a sub-agent or start a dependent feature.

## References and entry points

Read application/owner AGENTS and handbook routes, [COMMON](../COMMON.md), [EXECUTION](../EXECUTION.md),
[ENVIRONMENT](../ENVIRONMENT.md), [CONTRACTS](../CONTRACTS.md), [SELECT-CONTRACT](../SELECT-CONTRACT.md),
[VALIDATION](../VALIDATION.md), historical L1-META/FIX reports,
[RETEST-L1-META-1](../reports/RETEST-L1-META-1.md) and the new corrective report and exact diff.
List reference is `7191d22217a7d087c197134bc09226a34d05fc60` / `0.8.1`;
framework remains `3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3` before correction.
Existing fixture/launcher resources may be reused; assertions belong to this verifier.

## Scope and acceptance

Run the full list build/suite with zero failures, five META tests, framework build/suite, existing projection tests
and selector public build/type checks. Retain failed invocations if Node 24 requires absolute test paths.
Replay independent empty/nonempty column-save assertions through public List and real HTTP on a fresh owned server:
both explicit saves return 204 without feed/data/template work; the saved empty set survives the session contract.
An omitted columns parameter still renders the real list. No weakened tests or waiver of the existing failing suite.

Use public `beforeFrameworkRun` and a fresh owned real framework on an available port. Bare `/country` and explicit
offset 0 must return 200 with both synthetic countries, via real sandboxed Chromium navigation/input.
Retain valid later-page/feed semantics and pass the documented owned status command.
Independently replay context/root/full-path metadata, logical inverse/N-N and explicit unknown facts,
presentation beyond initial List, 403 unknown/forbidden/forbidden-ancestor, malformed/ambiguous paths,
no-store JSON, catalogue/advice changes, started network abort and stale HTTP response rejection by the controller.
Observe zero metadata business reads and domain constructions/getters. Confirm public CJS/browser/types/files,
dependency direction and SOLID ownership. No product edits during verification.

Every implemented mandatory observation must pass before clearing the gate. A reproducible failure follows
EXECUTION with another correction/retest; after two failed correction cycles add transversal diagnosis and evaluate
Astra explicitly. Retain historical failed reports. Search, rendered selector, session features and gestures remain
at their named later gates.

## Commands, evidence and calibration

No install/update, implicit-download npx, vcs-modules, application edits/commits or sandbox/permission changes.
Preserve showtime HEAD and both original staged/absent AD entries. Stop only proven owned processes.
Write `reports/RETEST-L1-META-2.md`, independent assertions/results in `evidence/RETEST-L1-META-2/`, PLAN and matrix;
record exact argv, browser/runtime, owner SHAs/versions, URLs, expected/observed results, raw checksums and limits.
Apply the tracking patch on first edit and commit attributable tracking paths locally, without the report's own SHA.
No push, tag or publication.

Requested `gpt-6.1-sol` / `high`; parent records dispatch, with no independent executor identity attestation.
Real request intent, SQL-backed lists, session restoration regression and metadata transport cross owner boundaries.
Evaluate Astra on new SQL/session ambiguity. Return at most eight lines with verdict, checkpoints and proof paths.

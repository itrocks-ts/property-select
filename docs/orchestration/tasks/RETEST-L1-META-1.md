# RETEST-L1-META-1: Verify metadata and control route recovery

## Objective and prerequisites

Independently verify the corrected framework first-page route and L1-META contracts before any dependent feature.
Prerequisite: attributable corrective checkpoint and completed `FIX-L1-META-1` report.
Current status: `PENDING`. The verifier must be distinct from the corrector and must not spawn a sub-agent.

## References and entry points

Read application/owner AGENTS and handbook routes, [COMMON](../COMMON.md), [EXECUTION](../EXECUTION.md),
[ENVIRONMENT](../ENVIRONMENT.md), [CONTRACTS](../CONTRACTS.md), [SELECT-CONTRACT](../SELECT-CONTRACT.md),
[VALIDATION](../VALIDATION.md), [L1-META](../reports/L1-META.md) and the corrective report.
Inspect the exact corrective diffs and versions. Product checkpoints before correction: framework
`3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`, list
`005702a6a0cd49740cdea37c2e5150dc80fb670b` / `0.8.0`.
Use the existing owner fixtures/launcher only as resources; create independent assertions.

## Scope and acceptance

Rebuild affected owners using their actual manifest scripts, run list/framework suites, the five META tests and the
existing framework projection tests. Use absolute Node test paths if Node 24's known node_modules discovery issue
occurs; retain the failed invocation and do not skip actual assertions.

Start a fresh owned real framework on an available port with the public `beforeFrameworkRun` fixture hook.
Exercise `/country` with no query and with explicit `offset=0`, confirm HTTP 200 and both synthetic countries through
real browser input/navigation, and pass the documented owned stack status command. Existing inherited server success
cannot replace a newly loaded runtime. Verify a later valid page/feed retains the corrected pagination semantics.

Drive independent real HTTP/browser checks of context/root/full-path resolution, logical inverse/N-N and explicit
unknown facts, labels/order beyond initial List, unknown-root/forbidden/forbidden-ancestor 403, malformed and ambiguous
paths, no-store JSON and valid advice after catalogue changes. Observe an actually started network abort and stale
response rejection by the real controller. Guard/observe zero metadata business reads and domain constructors/getters.
Keep Chromium's sandbox enabled. Search, rendered selector, session restoration and gestures remain their later gates.

Confirm public CJS/browser/type exports and files, correct dependency direction and SOLID ownership. No product edits
are allowed during independent verification. A reproducible failure appends the next correction/retest under EXECUTION;
do not waive it or proceed. A successful retest clears the failed gate for its rewired consumers while retaining
L1-META's historical failed report and observations.

## Commands, evidence and calibration

No install/update, implicit-download npx, vcs-modules, application edits/commits or sandbox/permission changes.
Use normal escalation for owned service/browser operations; stop only verified owned processes after proof.
Preserve showtime HEAD, its two staged/absent AD files and unrelated owner changes.

Write `reports/RETEST-L1-META-1.md`, independent assertions/results in `evidence/RETEST-L1-META-1/`, and update PLAN and
matrix. Record exact argv, runtime/browser versions, tested owner SHAs/versions, URLs, expected/observed assertions,
raw evidence checksums, limitations and local tracking commit. Apply handbook tracking patch versioning on first edit;
do not change untouched product versions. No own SHA inside its report, no push/tag/publication.

Requested `gpt-6.1-sol` / `high`: independent proof crosses request defaults, SQL-backed lists, metadata authorisation,
composed presentation and browser abort/stale transport. The parent records actual dispatch; executor identity has no
independent attestation. Evaluate Astra if new SQL-contract ambiguity arises. Return at most eight lines with status,
commits/versions, validations and report/proof/defect paths. Do not start another task.

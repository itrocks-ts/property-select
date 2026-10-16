# RETEST-V7-1: Restore recovery and complete final acceptance

## Objective and prerequisites

Independently verify FIX-V7-1 and complete every obligation in [V7](V7.md).
Status: `DONE / independent PASS`. [Report](../reports/RETEST-V7-1.md); all 64 final cases pass.
FIX-V7-1 checkpoint `2083bb37` / 0.7.6; tracking/tests patch 0.7.7. D8 is ready but unexecuted.
Use a fresh verifier distinct from the corrector and earlier V7 agent. No subdelegation or D8.
Read application/owner instructions, handbook routes, [COMMON.md](../COMMON.md), [EXECUTION.md](../EXECUTION.md),
[CONTRACTS.md](../CONTRACTS.md), [SELECT-CONTRACT.md](../SELECT-CONTRACT.md), [VALIDATION.md](../VALIDATION.md),
[ENVIRONMENT.md](../ENVIRONMENT.md), [VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md), all current handovers,
[V7 report](../reports/V7.md), [V7-01](../defects/V7-01.md) and the correction report.

## Acceptance and execution

Reproduce revoke and expiry using native input, an acquired production PUT, HTTP 410 and all visible status text.
Require actual session-ended/reload guidance, stale Retry rejection, preserved live state and full reload recovery.
Independently challenge simultaneous operation/storage failures so L7-02 cannot return.

Rebuild owners and application; independently replay T01–T27, SQL-01–14, META, PORT, PANE and LIFE cases on current
checkpoints. Both interfaces, all four sizes, genuine CDP touch movement/cancellation at both phone sizes,
mouse/keyboard/hybrid, current database values/count/feed/scope, public exports and architecture are mandatory.
The remaining V7 scenarios were not run after the session failure; historical PASS does not close them.

`environment/checks/V7.mjs` orchestrates the existing independent suites with explicit stage arguments.
Create a new retest driver/output destination, retain current SHA/version provenance and source hashes, and preserve
all historical V7 proof. The original V4 test locates the message in `.ps-status`; if the corrected view places it
in a separate visible persistence region, inspect all visible status text while retaining the exact semantic message.
The V7-specific reproducer already does this. Do not merely accept a generic Retry message.
Its 20 unclassified ERR_ABORTED events retain FAIL network status: capture per-request product AbortSignal
attribution or fix unexpected cancellations. Do not exempt them by error string alone.

V3 timing scenarios need fresh sessions because L4 intentionally restores query/context. The V7 wrapper navigates
away before clearing cookies for focus cases. V2 health accepts a metadata ERR_ABORTED only when its product
AbortSignal was observed; all other health failures remain blocking. These harness adaptations are documented in V7.

Use owned services and normal escalation; preserve Chromium sandboxing. No installs/updates, implicit npx,
vcs-modules, application durable changes/commits, push/tag/deployment or unrelated cleanup.
No mandatory NOT_RUN or open defect permits PASS. Physical-phone absence has only the narrow VAL-05 limit.

## Delivery and calibration

Requested `gpt-6-astra` / `high` for the complete session/SQL/pointer final gate. Actual dispatch belongs to the parent;
executor runtime identity cannot be independently attested. Apply tracking patch on first edit.
Write `reports/RETEST-V7-1.md`, new evidence, PLAN/matrix and defect closure only after fresh PASS.
Inspect full pending changes and commit explicit authorised task paths locally. Preserve showtime and foreign config.
On PASS, clear D8's prerequisite; do not execute D8. Return status/SHA/version/tests/limits in at most eight lines.

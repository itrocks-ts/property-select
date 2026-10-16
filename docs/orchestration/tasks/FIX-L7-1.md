# FIX-L7-1: Declare list dependencies and retain recoverable errors

## Objective and prerequisite

Correct [L7-01](../defects/L7-01.md) and [L7-02](../defects/L7-02.md).
Prerequisite: completed [L7 diagnostic report](../reports/L7.md), under the correction exception in
[EXECUTION.md](../EXECUTION.md). Current status: `DONE` / author PASS; see [report](../reports/FIX-L7-1.md).
Independent RETEST-L7-1 remains required.
Read application/owner instructions, handbook routes, owner READMEs, [COMMON.md](../COMMON.md),
[CONTRACTS.md](../CONTRACTS.md), [SELECT-CONTRACT.md](../SELECT-CONTRACT.md), [VALIDATION.md](../VALIDATION.md),
[ENVIRONMENT.md](../ENVIRONMENT.md), [VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md) and the linked defects.

## Scope and observed entry points

Owners: `@itrocks/list` manifest and `@itrocks/property-select` browser view/status lifecycle.
Reproduce undeclared runtime imports from list `cjs/list.js`, `cjs/selector-state.js`, `cjs/persist.js` against its
manifest. Declare direct public dependencies using established owner conventions, without installation.
Reproduce the 844 × 390 failed `note` click in `environment/checks/L7-error.mjs`.
Inspect `src/front/property-select.ts` error/change rendering and controller scroll/flush sequencing.
Preserve the recoverable error during unrelated state persistence and clear it appropriately on retry/recovery.
Add meaningful regression tests in owners; no feature expansion, copied geometry, SQL in list or selector hydration.
No phase 2, new infrastructure package, application source/docs/commit or unrelated cleanup.

## Acceptance and tests

Both defect reproducers must pass, including all three landscape cases and visible errors after scroll/save.
Verify retry creates one column; failure preserves context/query/columns/recents; ordinary loading/search/storage
messages and successful navigation remain correct. Run L7 load/lifecycle/browser assertions, header compatibility,
public exports, owner suites and application build. Repeat the fresh SQL check if changed contracts affect it.

```bash
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L7-architecture.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L7-error.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L7.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L7-build.mjs
```

Preserve historical failed evidence: use `PS_L7_OUTPUT`, `PS_L7_ERROR_OUTPUT`, `PS_L7_ARCHITECTURE_OUTPUT`,
`PS_L7_BUILD_OUTPUT` or archive copies under `evidence/FIX-L7-1/` before running fixed-state assertions.
Use owned launch/stop and normal escalation; keep Chromium sandbox enabled. No install/update, implicit npx,
vcs-modules, push, tag, deployment or destructive cleanup.

## Delivery and calibration

Requested profile: `gpt-6.1-sol` / `high`, at least the failed L7 profile, for cross-module regression correction.
Parent records actual fresh dispatch; runtime identity cannot be self-attested. No subdelegation or V7.
Apply handbook versions immediately against current owner HEADs; preserve an already sufficient pending increment.
Write `reports/FIX-L7-1.md`, fresh evidence, PLAN/matrix updates and explicit-path local owner commits.
Review SOLID/public dependency direction and complete staged/unstaged/untracked diffs before staging.
Preserve showtime HEAD, both AD blobs/absence and foreign config. Return at most eight lines.
A distinct verifier must complete RETEST-L7-1 before V7.

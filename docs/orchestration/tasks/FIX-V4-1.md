# FIX-V4-1: Preserve ended-session responses through autosave

## Objective and prerequisite

Correct [V4-01](../defects/V4-01.md). Prerequisite: completed V4 diagnostic report, under the correction exception in
[EXECUTION.md](../EXECUTION.md). Status: `DONE (author)`; see [report](../reports/FIX-V4-1.md).
Read application/owner instructions, handbook routes, owner READMEs, [COMMON.md](../COMMON.md),
[CONTRACTS.md](../CONTRACTS.md), [SELECT-CONTRACT.md](../SELECT-CONTRACT.md),
[VALIDATION.md](../VALIDATION.md), [ENVIRONMENT.md](../ENVIRONMENT.md),
[VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md), [V4 report](../reports/V4.md) and the linked defect.

## Scope and entry points

Primary owner: `@itrocks/fastify`, request/session bridge and response lifecycle.
Inspect `fastify-file-session-store` public transaction/expiry support, list `SelectorStateAction` and
`HttpStateStore`, and framework composition. Modify only owners needed by the correction; tracking stays in selector.
A production state PUT acquired before revoke/expiry must reach the client as documented HTTP 410 and preserve
obsolete-generation protection. Never swallow arbitrary store failures or accept HTTP 500 as successful behaviour.
No phase 2, new infrastructure package, private data, permanent showtime source/docs/commit or unrelated refactor.
No install/update, implicit-download npx, vcs-modules, push, tag or deployment.

## Acceptance and tests

First reproduce the two strict 410 failures; correct the owner lifecycle and add meaningful regression coverage.
Use actual HTTP actions, not only `inject` or direct handler calls. Preserve successful current-generation writes,
ordinary storage failure visibility, same/distinct-key CAS, tombstone races, concurrent list saves and response
autosave.
Revoke and expire requests already acquired; inspect durable state after process restart with the same fixture secret.
Verify that browser messaging says Reload, full reload recovers, and stale Retry cannot resurrect state.

```bash
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V4-revoke.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V4-contract.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V4.mjs
```

Read current manifest scripts, build/test changed owners and public exports/assets. Keep historical V4 proof intact:
add evidence-output overrides or archive new results under `evidence/FIX-V4-1/` without replacing failed records.
Use the ownership-checked launcher and normal escalation; keep Chromium sandbox enabled.
Complete V4's remaining browser observations or prepare their executable fixture support for independent retest.
Review SOLID, dependency direction and public-port substitution explicitly.

## Delivery and calibration

Requested profile: `gpt-6-astra` / `high`, because session generations, response autosave and HTTP state semantics
cross multiple owners. Parent records actual dispatch; runtime identity cannot be self-attested.
One fresh author, no subdelegation or later task. Apply handbook versions on first edit against each owner HEAD.
Write `reports/FIX-V4-1.md`, `evidence/FIX-V4-1/`, update PLAN/matrix, inspect complete pending diffs and commit only
explicit task paths locally. Preserve showtime HEAD, both AD entries and foreign `config.yaml` fingerprint.
No own commit SHA in the report. Return at most eight lines; distinct RETEST-V4-1 remains mandatory.

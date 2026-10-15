# V2-UI: Independent standalone navigation check

## Objective and prerequisites

Verify the built standalone selector with real browser inputs.

Prerequisites: L2-UI. Current status: `PENDING`.
Do not proceed until each prerequisite has a validated report, attributable checkpoint and no open blocking defect.

## References and entry points

[COMMON.md](../COMMON.md), [EXECUTION.md](../EXECUTION.md), [CONTRACTS.md](../CONTRACTS.md),
[SELECT-CONTRACT.md](../SELECT-CONTRACT.md), [VALIDATION.md](../VALIDATION.md),
[AUDIT.md](../AUDIT.md), [ENVIRONMENT.md](../ENVIRONMENT.md) and
[VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md) are required handovers.
Read the application/owner instructions and applicable handbook routes before edits.

Requirement focus: `T01`, `T02`, `T03`, `T05`, `T06`, `T07`, `T08`, `T25`, `VAL-03`, `VAL-04`, `VAL-06`.
Read the linked source requirements in the matrix; coverage is not limited to the shorthand identifiers here.
Case ranges mean the observations assigned to this stage in
[stage obligations](../VALIDATION.md#stage-obligations); later observations remain NOT_RUN until their named gate.

Observed entry points (owner-relative unless a URL or application path is given):

environment/demo/index.html; delivered selector browser entry; CONTRACTS.md.
New entry points mentioned in the scope are planned outputs, not files claimed to exist at planning time.

## Scope and exclusions

Exercise standalone navigation and ports before introducing later visible features.

Product owners: `@itrocks/property-select`. Tracking stays in `property-select`.
Exclude phase 2, permanent application changes, installs/updates, private data, unrelated refactors and new
infrastructure
packages. Do not replace public ports with private imports, SQL in list, hydration in selector or copied table
geometry.

## Acceptance and tests

T01–T03 and T05–T08 click/keyboard portions PASS; no forbidden host imports, layout shift or duplicate confirmation.
Missing
provider, optional-port omission and disposal are exercised.

Create and run environment/checks/V2-UI.mjs; open standalone URL in real browser.
Review SOLID explicitly: one owner per responsibility, narrow contracts, adapter substitution and correct dependency
direction. Test only actual capabilities; failed/omitted mandatory checks prevent dependent work.

## Commands and evidence

Run from `/home/baptiste/itrocks/showtime`. Read the current manifest scripts before invocation. Commands for new
tests
below become executable deliverables of this task; create them before claiming a passing run. Existing scripts are
inventoried in ENVIRONMENT.md. No `npm install`, `npm update`, implicit-download `npx` or `vcs-modules`.

```bash
git status --short
git ls-files --stage audit-itrocks-dependencies.json audit-itrocks-dependencies.txt
git -C node_modules/@itrocks/property-select status --short
git -C node_modules/@itrocks/property-select diff HEAD -- package.json
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-UI.mjs
git -C node_modules/@itrocks/property-select diff --check
```

Use the ownership-checked start/reset/status/stop commands in ENVIRONMENT.md. Keep service and browser sandbox
permissions unchanged; use the normal escalation mechanism when required. A command failure is evidence, not
permission
to silently substitute a simulated backend or handler call. Record the exact successful command and output location.

Versioned report: `docs/orchestration/reports/V2-UI.md`.
Evidence directory: `docs/orchestration/evidence/V2-UI/`; raw large traces may use `/tmp/property-select/V2-UI/`
with a stable path and checksum recorded in the report. Record expected/observed results and
PASS/FAIL/BLOCKED/NOT_RUN,
tested owner SHAs/versions, commands and any reproducible defect. Update PLAN.json and relevant VALIDATION.md rows.

## Independent browser procedure

Read the scenario-specific itinerary in [VALIDATION.md](../VALIDATION.md) and exercise it independently of the
author.
Baseline URLs: `http://127.0.0.1:13320/` (standalone), `http://127.0.0.1:13319/country` (real framework control).
Integrated graph URL from L2-LIST: `http://127.0.0.1:13319/property-select-invoice`.
V2-HOME uses the generic pane fixture on the real container; V2-TABLE uses the generic table fixture on the
standalone
support server. Their author reports must give exact URLs before verification; missing usable routes fail readiness.
Use static metadata graph plus synthetic invoice/customer/address/city/country/line/tag fixtures, known inverse,
N-N,
unknown cardinality, cycle and invalidated path; never substitute private data.

Use real mouse/keyboard input at 1280 × 720 and narrow 768 × 900. Check responsive shell at 390 × 844 and 844 × 390.
V6/V7 require real `hasTouch: true`, `isMobile: true` input at both phone dimensions, including touch movement and
cancellation through the installed Playwright/CDP transport. V2-UI checks no-hover plus taps; no physical phone is
claimed.
Use trusted input for product gestures, not DOM dispatch or direct handler calls. Fixture controls may inject delay,
errors, metadata changes or state expiry; they must not bypass the interaction being tested.

Exercise standalone navigation and ports before introducing later visible features.
T01–T03 and T05–T08 click/keyboard portions PASS; no forbidden host imports, layout shift or duplicate confirmation.
Missing
provider, optional-port omission and disposal are exercised.

Capture before/after screenshots plus assertions for actions, actual DOM order/column count, restored state and
network/console failures. A screenshot alone does not prove an interaction. Store browser version, viewport/input
mode,
fixture seed, tested checkpoints and exact URL with each result. Verify fresh page reload, dynamic insertion and
cleanup
where the itinerary requires them. Keep SQL evidence separate from browser evidence.
If system interruption cannot be physically generated, run its contract check and report that narrow limit. Physical
phone absence does not waive emulated touch. A verifier must be a fresh agent distinct from the author and
corrector.

## Calibration, version and handover

Requested profile: `gpt-6.1-sol` / `medium`. Real clicks, keyboard and hover/focus must validate the first visible
increment immediately.
The launcher schema advertises this profile and `fork_turns: none`; the parent must preserve actual dispatch
metadata.
An executor has no independent runtime model attestation. Do not claim an effective model from its own declaration.
For Astra unavailability apply orchestration section 3 explicitly; never silently downgrade or reduce validation.
Apply handbook versioning against each current HEAD on the first edit: minor for compatible API/features, patch
for tests/docs/fixes, major only for a breaking contract. Keep an already sufficient pending bump; do not renumber
untouched owners. Tracking reports change property-select documentation and need its patch bump when not already
covered by that delivery. Rebuild and verify public exports/files for all product owners.
Deliver source/tests/exports/assets/documentation only in owners, plus the versioned report, matrix and manifest.
Inspect complete staged/unstaged/untracked diff before staging explicit paths and making authorised local task
commits.
No commit SHA belongs inside its own report. Return status, actual commit SHA(s), versions, validation and limits in
at
most eight lines. On a reproducible defect return NEEDS_FIX and follow the correction/independent-retest sequence in
EXECUTION.md. Do not start another task or sub-agent.

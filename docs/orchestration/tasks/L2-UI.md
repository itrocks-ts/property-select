# L2-UI: Standalone selector browser surface

## Objective and prerequisites

Display and activate the selector in the standalone browser demonstration.

Prerequisites: RETEST-L1-META-2. Current status: `PENDING`.
Do not proceed until each prerequisite has a validated report, attributable checkpoint and no open blocking defect.

## References and entry points

[COMMON.md](../COMMON.md), [EXECUTION.md](../EXECUTION.md), [CONTRACTS.md](../CONTRACTS.md),
[SELECT-CONTRACT.md](../SELECT-CONTRACT.md), [VALIDATION.md](../VALIDATION.md),
[AUDIT.md](../AUDIT.md), [ENVIRONMENT.md](../ENVIRONMENT.md) and
[VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md) are required handovers.
Read the application/owner instructions and applicable handbook routes before edits.

Requirement focus: `UI-04`, `ACT-01`, `ACT-02`, `ACT-03`, `ACT-04`, `ACT-05`, `ACT-06`, `ACT-08`, `NAV-09`,
`DEP-01`, `VAL-03`.
Read the linked source requirements in the matrix; coverage is not limited to the shorthand identifiers here.
Case ranges mean the observations assigned to this stage in
[stage obligations](../VALIDATION.md#stage-obligations); later observations remain NOT_RUN until their named gate.

Observed entry points (owner-relative unless a URL or application path is given):

New src/front/property-select.ts and associated template/style; environment/demo/index.html;
environment/standalone.mjs.
New entry points mentioned in the scope are planned outputs, not files claimed to exist at planning time.

## Scope and exclusions

Implement single-list breadcrumb, main/+ zones, desktop hover/focus reserved space, keyboard and host-neutral
mount/dispose. Deliver static demo assets via allowlisted installed public browser outputs.

Product owners: `@itrocks/property-select`. Tracking stays in `property-select`.
Exclude phase 2, permanent application changes, installs/updates, private data, unrelated refactors and new
infrastructure
packages. Do not replace public ports with private imports, SQL in list, hydration in selector or copied table
geometry.

## Acceptance and tests

T01–T03 and T05–T08 applicable interactions pass, including object intent, no double action and keyboard. Standalone
network
imports exclude framework/home/list/table/reflection adapters.

Build/test selector; create standalone fixture routes and public asset mapping; next V2-UI performs independent
browser checks.
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
npm --prefix node_modules/@itrocks/property-select run build
npm --prefix node_modules/@itrocks/property-select test
git -C node_modules/@itrocks/property-select diff --check
```

Use the ownership-checked start/reset/status/stop commands in ENVIRONMENT.md. Keep service and browser sandbox
permissions unchanged; use the normal escalation mechanism when required. A command failure is evidence, not
permission
to silently substitute a simulated backend or handler call. Record the exact successful command and output location.

Versioned report: `docs/orchestration/reports/L2-UI.md`.
Evidence directory: `docs/orchestration/evidence/L2-UI/`; raw large traces may use `/tmp/property-select/L2-UI/`
with a stable path and checksum recorded in the report. Record expected/observed results and
PASS/FAIL/BLOCKED/NOT_RUN,
tested owner SHAs/versions, commands and any reproducible defect. Update PLAN.json and relevant VALIDATION.md rows.

## Calibration, version and handover

Requested profile: `gpt-6.1-sol` / `medium`. UI consumes stabilised generic ports; navigation decisions are already
fixed.
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

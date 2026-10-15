# L2-TABLE: Table column addition plugin

## Objective and prerequisites

Add/reveal/highlight actual columns through a public generic plugin.

Prerequisites: V2-HOME. Current status: `PENDING`.
Do not proceed until each prerequisite has a validated report, attributable checkpoint and no open blocking defect.

## References and entry points

[COMMON.md](../COMMON.md), [EXECUTION.md](../EXECUTION.md), [CONTRACTS.md](../CONTRACTS.md),
[SELECT-CONTRACT.md](../SELECT-CONTRACT.md), [VALIDATION.md](../VALIDATION.md),
[AUDIT.md](../AUDIT.md), [ENVIRONMENT.md](../ENVIRONMENT.md) and
[VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md) are required handovers.
Read the application/owner instructions and applicable handbook routes before edits.

Requirement focus: `TAB-02`, `TAB-04`, `TAB-05`, `TAB-06`, `DEP-07`.
Read the linked source requirements in the matrix; coverage is not limited to the shorthand identifiers here.

Observed entry points (owner-relative unless a URL or application path is given):

table/src/{table,column-reorder}.ts; table/demo; existing table test/*.test.mjs.
New entry points mentioned in the scope are planned outputs, not files claimed to exist at planning time.

## Scope and exclusions

Add TableColumnAdd public browser entry and click addition/reveal/highlight. Reuse table lifecycle and frozen
boundaries; expose transaction foundation for later external transport. Add standalone generic table fixture.

Product owners: `@itrocks/table`. Tracking stays in `property-select`.
Exclude phase 2, permanent application changes, installs/updates, private data, unrelated refactors and new
infrastructure
packages. Do not replace public ports with private imports, SQL in list, hydration in selector or copied table
geometry.

## Acceptance and tests

Real column header/cells arrive asynchronously; interim state stays distinct; table consumes opaque ids and
callbacks only. Existing header reorder/delete/sort/freeze tests pass.

Build table; existing node table tests plus test/property-select.test.mjs; preserve public generated assets.
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
git -C node_modules/@itrocks/table status --short
git -C node_modules/@itrocks/table diff HEAD -- package.json
npm --prefix node_modules/@itrocks/table run build
node --test node_modules/@itrocks/table/test/property-select.test.mjs
git -C node_modules/@itrocks/property-select diff --check
```

Use the ownership-checked start/reset/status/stop commands in ENVIRONMENT.md. Keep service and browser sandbox
permissions unchanged; use the normal escalation mechanism when required. A command failure is evidence, not
permission
to silently substitute a simulated backend or handler call. Record the exact successful command and output location.

Versioned report: `docs/orchestration/reports/L2-TABLE.md`.
Evidence directory: `docs/orchestration/evidence/L2-TABLE/`; raw large traces may use
`/tmp/property-select/L2-TABLE/`
with a stable path and checksum recorded in the report. Record expected/observed results and
PASS/FAIL/BLOCKED/NOT_RUN,
tested owner SHAs/versions, commands and any reproducible defect. Update PLAN.json and relevant VALIDATION.md rows.

## Calibration, version and handover

Requested profile: `gpt-6.1-sol` / `high`. Async data and plugin/frozen-column lifecycle must remain independent of
list identity and metadata.
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

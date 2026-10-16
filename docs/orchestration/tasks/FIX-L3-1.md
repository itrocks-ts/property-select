# FIX-L3-1: Keep scalar Date metadata out of relation traversal

## Objective and prerequisite

Correct [L3-01](../defects/L3-01.md). Prerequisite: the completed L3 diagnostic report; this is the correction exception
to the successful-prerequisite rule in [EXECUTION.md](../EXECUTION.md). Current status: `DONE` (author); independent
`RETEST-L3-1` remains pending.

Read owner/application instructions, applicable handbook routes, READMEs, [COMMON.md](../COMMON.md),
[CONTRACTS.md](../CONTRACTS.md), [SELECT-CONTRACT.md](../SELECT-CONTRACT.md), [VALIDATION.md](../VALIDATION.md),
[ENVIRONMENT.md](../ENVIRONMENT.md), [VERIFY-ENVIRONMENT.md](../VERIFY-ENVIRONMENT.md) and [L3](../reports/L3.md).

## Scope and entry points

Inspect `reflect/src/relation-fact.ts`, its type abstraction, `reflect-path` runtime/static scalar path handling
and framework `src/property-select-provider.ts`.
The readable reproduction is `environment/models/invoice.ts` (`issuedAt: Date | null`). Fix scalar classification
at its owning abstraction, with narrow regressions for optional/nullable Date and real domain classes.
Property-select owns tracking only unless a concrete selector defect is independently established.
Do not add a Date special case in the selector, hide errors, filter the fixture property or change records, SQL
or rendering.
No phase 2, installs/updates, implicit-download npx, vcs-modules, application code/docs/commits or new infrastructure.

## Acceptance and validation

The root public catalogue reports Date as terminal, direct Date traversal rejects with a documented metadata/path
error rather than HTTP 500, and integrated `country name` finishes without metadata errors.
Keep known inverse/cardinality, domain relations, Date selection/conversion and scalar typed-path restrictions valid.
Run affected owners' current build/test scripts, the full selector test suite and the actual browser reproducer:

```bash
npm --prefix node_modules/@itrocks/property-select test
node node_modules/@itrocks/property-select/test/browser-search.mjs
```

Read owner manifests before running their commands. Use installed tools and the owned service procedure; normal
escalation is required when applicable, never a disabled browser sandbox. Review SOLID and public exports/files.
Preserve showtime HEAD and both AD entries exactly. Apply handbook versions against current HEAD on the first edit.

## Delivery and calibration

Requested `gpt-6.1-sol` / `high`: scalar classification crosses reflection, typed paths and the provider boundary.
Parent records actual launcher metadata; executor cannot attest runtime identity. No sub-agent or next task.
Record expected/observed checks, commands, tested checkpoints and limits in `reports/FIX-L3-1.md`, with evidence in
`evidence/FIX-L3-1/`. Update PLAN/matrix, inspect the complete diff, stage explicit paths and make authorised owner
commits. No own SHA inside the report. Return at most eight lines; independent RETEST-L3-1 remains mandatory.

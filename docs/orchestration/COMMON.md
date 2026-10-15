# Property selector shared handover

## Task references

Tracking repository: `@itrocks/property-select`, installed at
`/home/baptiste/itrocks/showtime/node_modules/@itrocks/property-select`; tracking directory: `docs/orchestration/`. Read
[AUDIT.md](AUDIT.md) for verified initial HEADs, statuses, source locations, commands and unresolved contract gaps. The
audit records task 4.1 only. Environment task 4.2 maintains its own evidence under `environment/`; consult its
current report before relying on environment capabilities. Task 4.3 owns contracts and planning.

Mandatory input documents in the installed, versioned selector checkout:

- [Specifications](../it-rocks-selecteur-relationnel-specifications.md).
- [Dependency contracts](../dependencies.md).
- [Path projection and PHP reference](../select.md).
- [Validation and delivery](../validation.md).
- [Orchestration](../itrocks-property-select-prompt-orchestrateur.md).

Apply all phase 1 requirements, DEP-01 to DEP-11, VAL-01 to VAL-08 and T01 to T27. Phase 2 is excluded. These documents
remain the source of functional requirements; this handover does not replace or reproduce them.

## Instructions and ownership

Read the application `AGENTS.md`, `node_modules/@itrocks/AGENTS.md`, the
[handbook](../../../handbook/AGENTS.md), each affected owner's README and local instructions. Follow
the applicable handbook routes for source, architecture, Markdown, builds and dependency composition. Markdown uses UK
English, sentence case headings and a 120-column limit, with aligned tables if any. Read only relevant architecture
guides before touching their contracts; keep runtime imports on public entries.

Implement in the owning packages. Selector owns navigation/search/suggestions/state serialisation and intentions;
reflection owns type/path/relation facts; table owns DOM/geometry/addition/reorder; list owns business column
adaptation; home owns the generic pane; framework composes server and browser adapters; storage owns neutral projection
contracts; SQL builders own joins/projection/criteria; MySQL executes and reconstructs converted values. Review SOLID
explicitly and preserve substitutability, consumer-owned narrow ports and existing abstractions.

Executors carry out design, implementation, tests and corrections specified by their individual task cards. No task may
start a dependent feature on a failed mandatory prerequisite. Use VAL-07 corrections and independent retest. The parent
controls sequential scheduling; do not delegate or create further agents from an executor task.

## Git checkpoints and delivery

Before any write, check HEAD, staged, unstaged and untracked changes in every repository encountered. Use the audit
baseline and prior task delivery SHAs, then record new owners before modifying them. Preserve the application's two
initial `AD` files, including their index contents and working-file absence: `audit-itrocks-dependencies.json` and
`audit-itrocks-dependencies.txt`. Do not reset, restore, stash, move or commit unrelated changes. Overlapping ambiguous
changes require diagnosis.

Keep all tracking documents, reports, plans, validation records and reusable test resources in the package tracking
directory or their owning framework package. `showtime` is only a local test bench: no durable documents, product
code or commits belong in its repository. Record temporary application setup, reproduction and cleanup in the
package tracking area. Task 4.1 excludes `docs/orchestration/environment/`, which belongs to task 4.2.

Local task commits are authorised by prompt section 6. Stage explicit task paths, review the complete pending diff and
commit only attributable work. No push, tag, publication, deployment or destructive cleanup is authorised. Use concise
imperative commit subjects matching each owner's history. Report proposed commit wording at handover. A report must not
contain its own commit SHA; return that SHA after committing.

Framework version changes follow handbook rules immediately on first edit: patch for documentation/fixes, minor for
compatible features, major for breaking API changes, highest required level against HEAD once per pending delivery.
Synchronise manifests/locks/internal dependencies when necessary; do not renumber untouched packages. The reviewed
planning delivery is `property-select` HEAD `7c0fdadf06f1ef345efdd041cc8c2f9a0d1555a5`, version
`0.0.13`. Task `P04` increments documentation to `0.0.14`; use its returned commit as the next checkpoint.
Unchanged owners retain their versions.

## Local execution and validation

Never run `npm install`, `npm update` or an `npx` command with an implicit download. If an `@itrocks` package is
missing, clone its Git repository directly under `node_modules/@itrocks`; record its checkpoint before modification.
Use installed binaries and existing or explicitly delivered `npm run` scripts.

The application contains real package checkouts in `node_modules/@itrocks`, not source symlinks. Build each owner in
logical dependency order and verify generated server/browser files resolve to the delivered checkout versions. See audit
for actual scripts. No installed Jest was found; scripts alone are not evidence of executable tests. Do not run
`vcs-modules` merely to verify resolution: it can pull, install and replace packages.

Task 4.2 must exercise the existing startup and a real browser, record availability checks, precise commands/ports,
owned process shutdown, test resources and touch emulation in `ENVIRONMENT.md`. Prepare synthetic fixtures and an
isolated MariaDB/MySQL database plus query observation; do not reuse private data as acceptance fixtures. No runtime
URL, browser/touch capability or database was verified by task 4.1.

Before relational columns: compare PHP mechanisms, settle neutral projection/result/options/conversion contracts, extend
reflection/SQL owners, implement `DataSource.select()` and `Mysql.select()`, independently verify real database
execution, then integrate and check `list`. Never replace this chain with `search()` and in-memory graph traversal.
Evaluate Astra for object projection, hydration and graph/count/pagination coherence per orchestration section 3.

Task 4.3 owns contracts, `PLAN.json`, task cards and `VALIDATION.md`. Link all requirements to observable proof and
schedule separate browser checks immediately after visible increments. Each task records its required model, effort,
justification and verifiable launcher settings; do not infer effective configuration from the agent's claim.

Validate both standalone selector and actual framework integration. Browser, keyboard, responsive and emulated touch
checks are required, with independent final acceptance and separate delivery under VAL-08. DOM doubles or compilation do
not establish browser success. Physical-device absence has the narrow VAL-05 treatment only.

Installed Playwright and Chromium provide verified emulated touch input; see the
[touch procedure](ENVIRONMENT.md#browser-procedure-and-touch-input) and
[diagnostic](environment/TOUCH-DIAGNOSTIC.md). IAB does not expose touch input. Use a real touch context and browser
input transport for gestures; preserve the browser sandbox and use the normal tool approval mechanism for launch
if required. The probe does not validate product gesture behaviour. Task 4.2 and its application/standalone ownership
correction pass [independent verification](VERIFY-ENVIRONMENT.md); VAL-01 is complete.

Each report records criteria, exact commands, tested checkpoints, results and evidence/defects paths, limits and version
changes. Maintain the manifest/matrix once created. Return at most eight lines under orchestration section 7: status;
requested/effective profile; repositories and SHAs; versions; validation; report/proof/defect paths; blockers.

## Planning handover

Read [PLAN.json](PLAN.json), [CONTRACTS.md](CONTRACTS.md), [SELECT-CONTRACT.md](SELECT-CONTRACT.md),
[PHP-COMPARISON.md](PHP-COMPARISON.md), [EXECUTION.md](EXECUTION.md) and [VALIDATION.md](VALIDATION.md).
Task cards are the autonomous entry points. A completed planning artifact does not mark product acceptance PASS.
Use the fixed serial order and independent gates; append correction/retest tasks according to EXECUTION.md.

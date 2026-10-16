# L2-LIST projected lists and click integration

## Verdict

Status: `DONE`, `PASS (author)` on 16 October 2026. V2 remains `PENDING`; this report does not replace the independent
integrated gate. VSQL, RETEST-L1-META-2, V2-UI, V2-HOME and RETEST-V2-TABLE-1 prerequisite reports were read and pass.
No sub-agent was launched. Requested profile: `gpt-6-astra` / `high`; the parent retains actual dispatch evidence.
The executor has no independent runtime model or reasoning-effort attestation.

## Checkpoints and ownership

All six owners started clean. Compatible public additions receive minor versions under the handbook; no package was
installed or updated and no `vcs-modules` or implicit-download `npx` command was run.

| Owner             | Base version | Delivered version | Delivered checkpoint                     |
|-------------------|--------------|-------------------|------------------------------------------|
| transformer       | 0.2.4        | 0.3.0             | 311c9fcc9c1825ecf0bc387713e8d52ba369352d |
| core-transformers | 0.2.8        | 0.3.0             | e62b34c51b3ab0e9e316d946fdbb805daef0f149 |
| list              | 0.8.2        | 0.9.0             | ec7e4b071f4ee40113b294587ee794c44adfc8ac |
| framework         | 0.9.3        | 0.10.0            | 7a302cd606ff007276038ada4d12fc0bd2161d54 |
| home              | 0.5.1        | 0.6.0             | 83cc7d76ca374ff0e99073ac0f104b001f01fdf7 |

Property-select advances `75219b9c3be800af8c690dc89bf89756ba449d29` / `0.2.7` to `0.3.0` for the optional view
transport setting, consumer error messages, recipe and tracking. Its delivery SHA is returned after committing;
it is not embedded in its own report. Initial transformer and core-transformers checkpoints were respectively
`97cff93097494efbc651208c395f101bfb823fd6` and `2394456a0c3767134f8b8adb35835eb6754bc0f5`.
The other initial checkpoints are recorded by the prerequisite handovers and the task dispatch.

[Checkpoint evidence](../evidence/L2-LIST/checkpoints.json) records unchanged SQL, reflection, storage and table
owners. Their versions and source remain those validated by VSQL and RETEST-V2-TABLE-1. Showtime remains at
`d7ca948292e28c248bdcc0283724e47c2a82bba4`, with exactly its original two `AD` audit files, original index blobs and
absent working files. The application build only regenerated ignored outputs. No application source, document or
commit was added.

## Implemented contracts

- HTML list, feed and visible-column requests use configured `DataSource.select`. JSON still uses full-entity
  `search`. The list owns path metadata, criteria, representative field declarations and HTML rendering; it contains
  no SQL builder or projection hydration.
- Canonical full paths identify and persist columns. Object fields expand finite representative metadata, including
  nested Country representation, through public reflection. Rendering uses the final property's existing transformer.
  Missing relations are empty; ignored scalar values are explicitly unavailable; missing required representative
  fields and cycles fail. Declared fields are checked against actual `loadedFields` before rendering.
- `resolveTransformer` shares the exact existing resolution/cache with `applyTransformer`, without invoking it.
  Public `storeOutput` identifies the standard object transformer. List rejects undeclared property/type object
  overrides, including nested representative relations, before querying. The optional resolver declares custom fields
  or returns `undefined` for standard metadata. Custom global representative callbacks must declare their fields at
  composition; arbitrary JavaScript callback internals cannot be inferred from function identity.
- A visible-column request uses one `Identifiers` projection intersected with current filters and mandatory scope,
  without count or rendering reads. The adapter checks response paths, row identities and unchanged row DOM before
  insertion. A changed row view rejects the obsolete result. Pending canonical paths share one request.
- Filters support nested form parsing and encoded dotted field names, avoiding collisions between City and City.Name.
  Hidden criteria survive column removal. Object ordering expands representative fields followed by identity;
  storage retains its deterministic root ordering. Save-only requests still return 204 without business queries.
- List owns a narrow consumer adapter, the anchored header command and configuration save ordering. The existing
  table addition plugin owns insertion, reveal, highlight and geometry. Existing selections keep column order and
  keyboard focus. Failed/plural choices explain their refusal and create no column.
- Home announces and replays a structural registration callback. It imports no framework or selector. Framework
  matches configured roots against composed base classes, authorises root/path/representative dependencies, composes
  metadata and pane ports, and disposes detached views. The command becomes available after view mounting.
- The framework serves the published selector template through a dedicated action. The selector accepts an optional
  template URL; the original adjacent-template behaviour remains the default. No broad HTML static allowlist changed.
  The single table header row contains labels and filters, matching the established table addition contract.

The parent authorised the minimal home bridge after inspection found no existing composition announcement. The parent
also authorised the transformer/core-transformers ports after the author review found an undeclared custom object
transformer was not rejected by the initial resolver-only design. Both extensions remain in their owners.

## Validation and evidence

[Build/test commands](../evidence/L2-LIST/commands.json) record exact argv, working directories, exit codes and output
hashes. Versioned text strips trailing whitespace; raw output paths and hashes remain recorded.
[Runtime commands](../evidence/L2-LIST/runtime-commands.json) and the reusable drivers reproduce the integration.
All six owner builds, applicable owner tests and the application build pass. List has 20 passing server tests, including
seven focused projection contracts. Framework has 17 passing tests, including its existing SQL binding contracts and
the dedicated template route. Selector has 14 passing controller contracts. Transformer/core-transformers each add a
public contract test. Home's real Chromium test adds registration/replay coverage to its lifecycle and focus checks.
Offline package dry runs and [entry inventories](../evidence/L2-LIST/exports.json) include server/browser
declarations,
public entries, template and styles for all owners. No new runtime implementation imports private package paths.

[Browser proof](../evidence/L2-LIST/browser.json): **107 assertions PASS**, Chromium `151.0.7922.34`, sandbox enabled.
Mouse/keyboard at 1280 × 720 and 768 × 900; trusted emulated touch at 390 × 844 and 844 × 390. Eight screenshots record
open and closed states; desktop and portrait images were visually inspected. Expected/observed values include:

- 50 initial rows and total 61 under mandatory active scope; feed yields 61 distinct roots.
- City renders `Recipe Paris RECIPE FRANCE`; City.Name renders `Recipe Paris`, with absent relations remaining empty.
- Two rapid City selections execute exactly one bounded SQL projection, including representative joins and scope;
  rendering executes no additional query. Existing selection executes zero queries and preserves order/row selection.
- Added-column highlight, retained selection focus, folded initial pane, open context, close focus and reopen context
  pass. The header command remains within the viewport and stationary while the table scrolls horizontally.
- Object sorting, nested filter count 20, rendered filter value, matching rows, session reload and hidden-filter count
  pass. Reload preserves selected full paths and actual object values.
- A plural path returns the explicit multiple-values message and performs no SQL. The only HTTP error responses are
  the four expected plural 400 responses. No other console warning/error or page exception occurs.
- Navigation/replacement leaves one selector; ordinary `/country` still renders through projection and has no selector.

[List query archive](../evidence/L2-LIST/list-sql.json) records actual forwarded connection queries and bound operands.
The unchanged independent VSQL driver was replayed with only import location/evidence destinations adapted by
[L2-LIST-SQL.mjs](../environment/checks/L2-LIST-SQL.mjs): **14 groups, 1,390 assertions and 110 statements PASS**.
[Fresh results](../evidence/L2-LIST/sql-regression/results.json), SQL and expanded database journal are separate from
the original VSQL evidence. The driver restored the shared synthetic fixture before the final browser run.
This replay is an author regression check, not a new independent gate.

Author iteration exposed and corrected the template transport, dotted form-key collision, early command readiness,
ordinary List route export ambiguity and undeclared custom object representation. The corresponding final contract or
browser checks pass. Chromium initially could not launch under the filesystem sandbox; normal escalation was used
without disabling Chromium's sandbox. The generic status command must use the database's original directory while
pointing at port 13819; using the separate app directory would incorrectly look for a second database socket.

## SOLID and public boundary review

Single responsibilities remain with their owners: transformer resolves conversion; core-transformers identifies its
standard conversion; list plans/render columns; table owns DOM/geometry; selector emits intentions; home owns the pane;
framework composes. List accepts replaceable metadata, pane, column persistence and table ports. The data source is the
public configured adapter, with mandatory scope preserved for projections and counts. No concrete MySQL dependency,
SQL, business-object hydration, table geometry copy or `home → framework` dependency was introduced. API and runtime
entries stay separate from recipe/test resources. The route's default export is explicit alongside public list hooks.

## Reproduction and V2 handover

Run from `/home/baptiste/itrocks/showtime`. The existing synthetic database uses port 13316 and
`/tmp/showtime-property-select-env/mysql.sock`. The owned L2 app uses port 13819 and separate process/session records
under `/tmp/property-select-L2-LIST`. [App ownership](../evidence/L2-LIST/app-owner.json) identifies the final process.
[Status](../evidence/L2-LIST/service-status.txt) confirms database health and ordinary list HTTP 200.

```bash
python3 node_modules/@itrocks/property-select/docs/orchestration/evidence/L2-LIST/run.py
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L2-LIST-SQL.mjs
PS_ENV_DIRECTORY=/tmp/property-select-L2-LIST PS_APP_PORT=13819 \
PS_FRAMEWORK_INITIALIZER=node_modules/@itrocks/property-select/docs/orchestration/environment/list/initialise.mjs \
node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs app
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L2-LIST.mjs
PS_APP_PORT=13819 node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs status
```

The app is already running; do not start a duplicate. To restart or stop only this owned app, use:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-L2-LIST \
node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs stop-app
```

The post-bootstrap initializer binds actual Invoice graph classes and a scoped List subclass to
`http://127.0.0.1:13819/property-select-invoice`. `/property-select-observation/probe/json` is recipe-only query
observation. `/country` is the ordinary control route. No durable showtime configuration is required. V2 should inspect
this recipe and independently challenge the behaviour rather than reuse author verdicts as its oracle.

Selector state is instance-local at this stage; list column/filter configuration retains its existing session storage.
Search, selector session transactions, external drag, edge gestures and later physical-device observations remain
NOT_RUN at their assigned stages. No final combined requirement or phase-1 acceptance is claimed.

Commit subjects: `Expose effective property transformer resolution`; `Expose standard stored-object output`;
`Expose pane registration to configured consumers`; `Add projected list columns with the property selector`;
`Connect list property selection to the shared pane`; `Deliver projected list integration and author evidence`.

# RETEST-L7-1: Independent correction and regression verification

## Verdict and checkpoints

**DONE / independent PASS**, 16 October 2026. [L7-01](../defects/L7-01.md) and [L7-02](../defects/L7-02.md)
are **CLOSED**. All L7 obligations pass on the corrected owners. The failed L7 report/evidence remains unchanged;
this distinct retest clears V7's prerequisite. V7 and D8 were not executed.

Requested profile: `gpt-6.1-sol` / `high`; the parent records fresh dispatch and distinction from the corrector.
The executor cannot independently attest its runtime identity. No sub-agent was created.

[Initial clean owner checkpoints](../evidence/RETEST-L7-1/checkpoints.json):

- Selector `a4c153a2e820f279171b023339fa22cffa54575c`, runtime **0.7.3**; tracking/tests patch **0.7.4**.
- List `258f26c95f0b35df4176ba73225c35df6b56b449` / **0.12.1**.
- Table `5e32fd6d1fe53f4511007f19804ba1a6b42a7ca6` / 0.4.0;
  framework `7211a97419add5165a8ac0f24f96afd5efd1b3fc` / 0.11.0;
  home `6c1797058fa2162bde1c88fa12fb1b3320e7e4cd` / 0.7.0.
- Reflection, storage and SQL checkpoints/versions in the inventory are unchanged. Only selector tracking/tests change.

## Independent observations

**L7-01 / DEP-02 / PORT-10: PASS.** The delivered import audit finds no missing direct dependency, cycle, private
entry or selector host import: [proof](../evidence/RETEST-L7-1/architecture.json).
A separate Acorn AST walk inspects actual CJS/browser import, export and dynamic import/require nodes, including
non-it.rocks packages, across the five delivered owners. Its **287 assertions / 208 runtime imports** verify direct
declarations, public entries, existing exported types/assets and reachable dependency direction/cycles. The public CJS
selector facade loads successfully, and all three corrected list dependencies occur in actual runtime imports:
[independent proof](../evidence/RETEST-L7-1/imports-independent.json).

**L7-02 / QUA-01 / PORT-09: PASS.** The unchanged native landscape reproducer passes in three fresh 844 × 390
contexts: aborted column HTTP leaves the error visible after 600 ms and adds no column:
[results and screenshots](../evidence/RETEST-L7-1/error/results.json).
The original four-size L7 itinerary independently repeats metadata/column failures and successful retries.

The new [independent browser driver](../environment/checks/RETEST-L7-1-browser.mjs) adds **62 assertions** at
1280 × 720, 768 × 900, 390 × 844 and 844 × 390:

- Native inputs create a confirmed deep column/recent destination, retain its remembered branch, return to root and
  enter the non-empty `name` query. An actual column request is fetched, then its browser response is replaced by
  HTTP 503. The visible operation error preserves exact committed columns, branch, depth, query and recents.
- Three native wheel scrolls produce successful state PUTs and increasing durable revisions without clearing the
  operation error. A further native scroll receives a state PUT HTTP 503; the separate storage error exposes Retry.
  Clicking Retry performs successful storage recovery while preserving the operation error and all semantic state.
- A native selection retry adds exactly one column and restores the ordinary limited-search message. Trusted input
  records, response statuses, state snapshots and status mutations are retained. No browser exception occurred.

[Fresh results](../evidence/RETEST-L7-1/independent/results.json) and eight screenshots include the retained-error
and recovered states at every size; the landscape retained-error image was visually inspected.
The public view regression also passes **16 assertions** covering non-empty restored state, repeated saves,
storage recovery, clearing at retry start, navigation/search messages and unknown failures:
[proof](../evidence/RETEST-L7-1/status/results.json).

**Remaining L7 browser/load/lifecycle obligations: PASS**,
[290 assertions](../evidence/RETEST-L7-1/results.json). Both standalone load/lifecycle runs retain 32 native
dispose/remount cycles each and no late template resurrection; bounded catalogue/search, four-size network recovery,
12 dynamic departures and disposal during actual delayed metadata/state responses pass. Forbidden enumeration,
full-path resolution and column projection are refused before SQL. Actual browser script requests retain the
standalone boundary and contain no server/CJS/SQL runtime.

**120-root scope and full entity JSON: PASS.** A new
[independent database/HTTP oracle](../environment/checks/RETEST-L7-1-scope.mjs) performs **69 assertions** after SQL
fixture restoration. It reads all 120 synthetic root records directly and compares all properties of each of the
61 authorised JSON entities: numbers, booleans, date conversion, null/empty strings, alias field, collection arrays,
string identities and nullable relation identities. It also independently challenges out-of-scope and duplicated
visible ids, exact scope intersection and one query with bound scope/ids:
[proof](../evidence/RETEST-L7-1/scope-independent.json). The L7 integration SQL trace is recorded separately.

**Fresh independent SQL: PASS.** The independent VSQL oracle runs against current owners with its distinct
137-root seed: **14 groups, 1,390 observations and 110 statements**, then restores the shared 120-root fixture.
Typed objects, conversions, absence, singular/plural criteria, counts/pages, identity restrictions and zero extra
rendering reads pass: [results](../evidence/RETEST-L7-1/sql/results.json),
[statements](../evidence/RETEST-L7-1/sql/sql.json), [executed journal](../evidence/RETEST-L7-1/sql/mysql-general.log).
Raw journal: `/tmp/property-select/RETEST-L7-1-sql/mysql-general.raw.log`, SHA-256
`ceca8d2ee00d8257831baf9053a405ea8992ea34f525a0fa51f0b2bc077bb42b`.

**Table compatibility and cancellation: PASS.**
[182 header assertions](../evidence/RETEST-L7-1/header/results.json) cover reorder/delete/sort/frozen boundaries,
alignment, selection, keyboard and repeated reset at all four dimensions.
[72 support assertions](../evidence/RETEST-L7-1/support/results.json) cover standalone transport and generic pending
admission/value cancellation, reset and disposal without late DOM resurrection.

**Builds/public inventories and suites: PASS.** The five owner builds, public package dry-run inventories and showtime
build pass. Owner tests: selector 45, table 47, list 29, home one, framework 18: **140 PASS**, zero failure/skip.
[Build results and exact logs](../evidence/RETEST-L7-1/build/results.json).
All three new drivers pass `node --check`; documentation and complete pending changes pass `git diff --check`.

SOLID review: the selector owns presentation/navigation and operation errors; table owns geometry/transactions;
list owns representation, scope and persistence; home owns the generic pane; framework composes narrow public ports.
Substituted metadata/consumer/state ports and generic table fixtures remain usable. There is no SQL/hydration in
selector/list, copied table geometry, framework/home cycle, host import in selector or duplicate navigation model.

## Commands, services and preservation

Run from `/home/baptiste/itrocks/showtime`. Exact successful commands, driver hashes and raw SQL checksum are in
[commands.json](../evidence/RETEST-L7-1/commands.json). The environment uses the existing synthetic MySQL on 13316.
Owned startup/stop commands:

```bash
recipe=node_modules/@itrocks/property-select/docs/orchestration/environment
export PS_ENV_DIRECTORY=/tmp/property-select/RETEST-L7-1-owned
PS_APP_PORT=13981 PS_FRAMEWORK_INITIALIZER="$recipe/checks/V4-fixture.cjs" node "$recipe/control.mjs" app
PS_STANDALONE_PORT=13982 node "$recipe/control.mjs" standalone
node "$recipe/checks/RETEST-L7-1-imports.mjs"
node "$recipe/checks/RETEST-L7-1-browser.mjs"
node "$recipe/checks/RETEST-L7-1-scope.mjs"
node "$recipe/control.mjs" stop-app
node "$recipe/control.mjs" stop-standalone
```

URLs: `http://127.0.0.1:13981/property-select-invoice`, control `/country` and `http://127.0.0.1:13982/`.
Chromium **151.0.7922.34**, Playwright **1.62.1**, `chromiumSandbox: true`. Restricted socket, child-process and browser
execution encountered EPERM; normal `require_escalated` ran the same operations with unchanged permissions.

Harness diagnostics are retained under the fresh retest evidence. Initial wheel tests found no overflow in an
ordinary
768 × 900 list; the final non-empty search supplies actual overflow. Another diagnostic expected an empty status after
success instead of the ordinary limited-search message. Landscape wheel coordinates initially lay outside the visible
part of the list and were clipped into it. These are fixture/assertion corrections; the final exact preservation and
real-PUT assertions remain mandatory. The installed TypeScript root only exposes version information, so Acorn supplies
the separate AST walk. The JSON oracle initially omitted null relation identities; its final full-object expectation
requires the existing explicit nulls. Failed diagnostic evidence remains available and is excluded from PASS counts.

[Pre-stop evidence](../evidence/RETEST-L7-1/services-before-stop.json) records all three URLs at HTTP 200 and owned app
PID 2583285 / standalone PID 2583310. Only these two services were stopped through the ownership-checking controller;
[post-stop evidence](../evidence/RETEST-L7-1/services-after-stop.json) shows both ports closed and MySQL still alive.

[Preservation proof](../evidence/RETEST-L7-1/preservation.json) retains showtime HEAD `d7ca948`, both initial AD index
blobs/working-file absences, the foreign configuration checksum and clean unchanged owners. Historical L7
report/evidence
is untouched. No application durable edit/commit, install/update, implicit npx, vcs-modules, push, tag or deployment.
Physical devices/native keyboard/edge gestures/OS interruptions remain unverified under VAL-05; no automatable L7 case
is omitted. Final combined acceptance and delivery remain the separate V7/D8 tasks.

Commit subject: `Verify L7 corrections and regression coverage`.

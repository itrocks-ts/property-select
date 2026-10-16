# Generic table column addition

## Verdict and checkpoints

**DONE / author PASS**, 16 October 2026. The click, asynchronous data and teardown observations assigned to L2-TABLE
pass. Independent V2-TABLE remains required before list integration. External pointer transport/drop validation remains
L5/V5; no completed combined T18, PORT-04 or DEP-07 verdict is claimed.

Prerequisite [V2-HOME](V2-HOME.md) is PASS with no blocking defect. Initial repositories were clean:

- Table: `46adbb2f85105f3f33545f1b4bea9267d1c7c393`, `0.2.10` → compatible feature `0.3.0`.
  Product delivery: `c7c9a65fb5497b1e76d809622eb0d3f4e44f1f97`.
- Tracking: `863c9d1b03aa4672fa4fbb118f71deaa0319fb91`, `0.2.3` → documentation/test support patch `0.2.4`.

Requested profile: `gpt-6.1-sol` / `high`; the executor cannot independently attest runtime model/effort. Parent
dispatch metadata remains authoritative. No additional agent was launched. No SQL/hydration decision
requiring Astra arose.

## Public contract and ownership

`@itrocks/table/column-add.js` exports `TableColumnAdd`, its options and the callback/transaction types. Configure it
after reorder/freeze plugins and include `column-add.css`. Identifiers are opaque strings; `identify(header)` can adapt
pre-existing headers, with `data-column-id` as the default. Added headers retain that attribute across reset.
The owner [README](../../../../table/README.md#adding-columns) describes signatures, event timing and constraints.

`add()` returns `added` only after inserting/committing a real placeholder column; optional values arrive separately.
Repeated clicks return `existing`, reveal and highlight without moving/reloading/committing again. `onChange` separates
provisional, committed, loaded, error and cancelled observations. Only a committed event permits persistence.
Synchronous creation failure rejects without a column or commit; optional loading failure retains a visible recoverable
column. `retry()` reloads values, not the addition. Callback rendering/data/row identity remain with the consumer.

`begin()` supplies the transaction foundation, including immediate real provisional cells, public `moveTo`, commit,
cancel and asynchronous readiness. Existing-column cancellation restores its original index; late results cannot
recreate cancelled/disposed/removed columns. Header-origin gestures cannot start on provisional cells.
This foundation installs no external pointer transport and is not the planned L5 `beginExternal()` implementation.

Placement reuses reorder's `moveColumn`/shared cell movement. Reveal uses its existing `scrollContainer()` and freeze's
`visibleInnerRect()`. `replaceCell()` preserves an active header gesture across asynchronous rendering. Freeze refresh
recalculates existing sticky rules without resetting unrelated plugins. Addition uses the table reset lifecycle for
abort/flash cleanup. No geometry, SQL, hydration, selector state, routes or session behaviour is copied into consumers.

Supported shape: rectangular table, exactly one header row, no cell spans and at most one column group with one
unspanned `col` per column. Callbacks return detached header/cells for every non-header row, including footer rows.
A changed row view rejects stale positional values; consumers refresh their callback data before retry.

SOLID review: table owns generic DOM, placement, sticky boundaries and visual state. Callback providers own data and
identity policy; notification consumers own persistence. The standalone fixture substitutes synthetic data without any
selector/list/framework/reflection dependency. Plugin composition and narrow public ports preserve dependency direction.
Reset/disposal releases transient resources. Existing reorder/delete/sort/freeze behaviour is covered immediately.

## Checks and evidence

[Browser results](../evidence/L2-TABLE/results.json): **127 PASS assertions**, Chromium `151.0.7922.34`, Playwright
`1.62.1`, Node `24.0.1`, `chromiumSandbox: true`. Four mouse/keyboard contexts run at `1280 × 720`, `768 × 900`,
`390 × 844` and `844 × 390`. The portrait context requests reduced motion; landscape uses a dark colour scheme.
Actual browser input records are trusted. Direct public API calls are identified fixture controls for focus/reveal;
header drag/removal and keyboard addition use browser input. No synthetic DOM dispatch supplies product actions.

- **TAB-02/TAB-04 author PASS:** keyboard append, async actual header/body values, unchanged duplicate position, one
  commit, horizontal reveal, preserved input focus/row selection and visible frozen boundaries.
- **TAB-05 author PASS:** common green/light/theme flash, class cleanup, dark rendering and reduced-motion override.
  Desktop and dark landscape screenshots were visually inspected; eight before/after captures are retained.
- **TAB-06 author PASS:** rapid slow additions deduplicate, creation failure leaves counts unchanged and never commits,
  optional value failure stays visible and retries without another addition.
- **PORT-04/LIFE-03 stage PASS:** provisional cells differ from committed/loading cells; cancellation ignores late
  results, reset preserves identity without duplicate columns/listeners. Node tests also prove abort, teardown,
  existing-column rollback and stale row-view rejection.
- **Regression PASS:** real header reorder/removal, sort click/suppression, frozen-header protection,
  colgroup alignment, one sort listener after reset and active-gesture continuity during
  asynchronous header replacement.
- Browser warnings/errors, exceptions, failed requests and HTTP errors are **empty**.

[Node results](../evidence/L2-TABLE/table-tests.txt): **20 PASS**, including all 14 existing reorder/feed tests and six
new tests in `table/test/property-select.test.mjs`. The application-root command shown in the task card fails in this
Node runtime with `Could not find 'node_modules/...column-reorder.test.mjs, ...'`. Running the same complete suite from
its owner directory succeeds and exposes all individual assertions with `--test-isolation=none`.

[Table build](../evidence/L2-TABLE/table-build.txt) and
[tracking build](../evidence/L2-TABLE/selector-build.txt) pass. The
[public artifact check](../evidence/L2-TABLE/artifacts.json) and
[package inventory](../evidence/L2-TABLE/table-pack.json) verify public JS/declarations/CSS and subpath resolution.
Sources, tests and demo are excluded from the tarball. Generated outputs follow the owner's ignored-file convention;
source, build recipe and CSS allowlist are
committed. [Checksums](../evidence/L2-TABLE/checksums.json) identify the evidence.

A first author browser run exposed a reduced-motion CSS specificity error; the matching selector was corrected and
all final assertions pass. A strengthened reset check exposed a fixture-only sort listener outside plugin lifecycle;
the fixture now provides sorting as a normal plugin and the final reset check passes. Neither diagnostic is an open
product defect. Final product checks run on the clean product commit's identical source/outputs.

## Reproduction and live fixture

Run from `/home/baptiste/itrocks/showtime` with installed tools only:

```bash
npm --prefix node_modules/@itrocks/table run build
npm --prefix node_modules/@itrocks/property-select run build
cd node_modules/@itrocks/table
node --test --test-isolation=none test/*.test.mjs
npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-L2-TABLE-table-npm-cache
cd /home/baptiste/itrocks/showtime
PS_ENV_DIRECTORY=/tmp/property-select-L2-TABLE-author PS_STANDALONE_PORT=13752 \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs standalone
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L2-TABLE.mjs
```

Fixture: **http://127.0.0.1:13752/table-fixture**, intentionally retained for V2-TABLE. Do not launch it twice.
It uses the standalone server's explicit asset allowlist and public table/plugin entries; no database is needed.
The author [driver](../environment/checks/L2-TABLE.mjs) defaults to that URL; override `PS_TABLE_URL` for another owned
port. This fixture is separate from the host-free selector demonstration at `/`.
The source is `table/demo/column-add.{html,scss,ts}` and supplies synthetic opaque ids, two rows and
delay/error controls.

[Service state](../evidence/L2-TABLE/service.json) records HTTP 200 and the retained
[ownership record](../evidence/L2-TABLE/standalone.owner.json). Stop only through the existing identity-checked recipe:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-L2-TABLE-author \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs stop-standalone
```

Fresh-directory `status` reports no MySQL socket as expected. Restricted startup produced no reachable listener and a
namespace-local PID reservation in `/tmp/property-select-L2-TABLE-live`; protected stop correctly refused its unrelated
host PID. Host inspection finds no service with that environment argument. The reservation is retained and was not
removed or used to signal a process. The normal escalation mechanism started the successful separate owned recipe.
Restricted Chromium launch reports `sandbox_host_linux.cc:41` / `Operation not permitted`; the same browser driver
passes through normal escalation with its sandbox enabled. No permission/sandbox configuration changed.

## Preservation and limits

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4` with precisely its two original AD entries. Index blobs
remain `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and `de960a87ea9b4f6eb1cece85ab32596baef11fcd`; both working files
are absent. No durable application code/document/commit, install/update, implicit-download npx, vcs-modules, push,
tag or publication occurred. No inherited listener/database was reset or stopped.

V2-TABLE is NOT_RUN here and must independently use the generic fixture. External transport/drop/persistence,
selector/list composition, relational data and actual touch-product gestures remain at their named gates.
No physical phone, native keyboard or physical system interruption was tested.
Local commit subjects: table `Add generic column addition transactions`; tracking
`Record generic table addition author validation`.

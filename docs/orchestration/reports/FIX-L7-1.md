# FIX-L7-1: Declare dependencies and retain recoverable errors

## Verdict and checkpoints

**DONE / author PASS**, 16 October 2026. Both [L7-01](../defects/L7-01.md) and [L7-02](../defects/L7-02.md)
are corrected and awaiting independent [RETEST-L7-1](../tasks/RETEST-L7-1.md). L7 retains its historical
`NEEDS_FIX` verdict; no independent retest, V7 or D8 was executed by this author.

Requested profile: `gpt-6.1-sol` / `high`; parent records actual fresh dispatch. The executor cannot attest runtime
identity independently. No sub-agent was created. Input owners were clean; all
[starting checkpoints](../evidence/FIX-L7-1/checkpoints.json) were recorded before writing.

- Selector: `e126a1e49c534e349365dbcf0f3d57d1d68cde7e`, **0.7.2 → 0.7.3** for the fix and its tests/tracking.
- List: `912c8acdab38a741b7714b8fa964704741bc9126`, **0.12.0 → 0.12.1**;
  delivered as `258f26c95f0b35df4176ba73225c35df6b56b449`.
- Table `5e32fd6` / 0.4.0, framework `7211a97` / 0.11.0, home `6c17970` / 0.7.0 and all SQL/reflection owners
  retain their initial versions and commits. No pending increment existed in either changed owner.

## Corrections and regression proof

List declares direct runtime dependencies on public `@itrocks/action`, `@itrocks/action-request` and `@itrocks/route`
with the owner's established `latest` ranges. All three already exist locally; no dependency was installed or updated.
Its new `test/dependencies.test.mjs` scans delivered CJS runtime imports and rejects missing direct declarations.
The architecture driver first reproduced all three omissions, then passed with zero missing imports, runtime cycles,
private imports or selector host imports: [before](../evidence/FIX-L7-1/before/architecture.json),
[after](../evidence/FIX-L7-1/architecture.json).

The browser view retains an operation error separately from ordinary loading/search messages. Scroll, suggestions,
configuration and successful state flushes preserve it. Storage failure/retry/recovery uses the existing separate
persistence surface and cannot erase or replace the operation error. Selection retry, a new navigation/query or an
accepted selection outcome clears the old error. Rejected outcomes and unknown error values retain recoverable messages.
No controller, persistence, public API or transport contract changed.

The original landscape driver reproduced the disappearance in all three fresh contexts before the fix:
[baseline](../evidence/FIX-L7-1/before/error-ready/results.json). On the final build all three retain `Failed to fetch`
after 600 ms, with root context and no note column: [proof/screenshots](../evidence/FIX-L7-1/error-final/results.json).
The first fixed screenshot was visually inspected. The existing driver/assertion body is unchanged.

The reusable owner `test/browser-status.mjs` exercises the actual public browser view in Chromium with a substituted
metadata/consumer/store. Its **16 assertions** cover non-empty restored branch/query/recents, repeated scroll/save,
storage failure and native retry/recovery, clearing at selection retry before its delayed completion, successful
selection, ordinary empty search/clear/loading/navigation and generic unknown failures:
[results](../evidence/FIX-L7-1/status-final/results.json).

## Validation

- **290/290 L7 browser/load/lifecycle assertions PASS**, [results](../evidence/FIX-L7-1/results.json).
  Four integrated sizes, 64 standalone remounts, bounded search, network recovery, one column after click retry,
  disposal during pending metadata/state, permissions, scope and full entity JSON retain their assertions.
- **182/182 header compatibility assertions PASS** at all four sizes,
  [results](../evidence/FIX-L7-1/header/results.json); **72/72 transport/lifecycle support assertions PASS**,
  [results](../evidence/FIX-L7-1/support/results.json). These reuse earlier drivers as author regression tools;
  their historical task names do not constitute execution of a new independent retest.
- **Five owner builds, package dry-run inventories/public exports and application build PASS**,
  [results/logs](../evidence/FIX-L7-1/build-final/results.json). Suites: selector 45, table 47, list 29,
  home one and framework 18: **140 tests PASS**, no failure/skip. The final generic-error adjustment is additionally
  rebuilt and tested in [selector-final-tests.txt](../evidence/FIX-L7-1/selector-final-tests.txt), followed by the
  16 status assertions and three final landscape cases.
- No SQL, projection, hydration, scope, metadata or data-source contract changed. A fresh independent SQL oracle is
  therefore not required by this correction; the historical [L7 SQL evidence](../evidence/L7/sql/results.json)
  remains unchanged. The new L7 browser run records its own
  [integration SQL](../evidence/FIX-L7-1/integration-sql.json).

SOLID review: view presentation remains in selector, manifest/import validation in list. Narrow metadata, consumer and
state-store substitutes remain usable. Table owns geometry/transactions, home owns pane restoration and framework owns
composition. No host import, new package, copied geometry, SQL/hydration duplication or second navigation model appears.

## Reproduction and service ownership

From showtime, with canonical synthetic MySQL already running on 13316:

```bash
recipe=node_modules/@itrocks/property-select/docs/orchestration/environment
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-L7-1
PS_ENV_DIRECTORY=/tmp/property-select/FIX-L7-1-runtime PS_APP_PORT=13981 \
  PS_FRAMEWORK_INITIALIZER="$recipe/checks/V4-fixture.cjs" node "$recipe/control.mjs" app
PS_ENV_DIRECTORY=/tmp/property-select/FIX-L7-1-owned PS_STANDALONE_PORT=13982 \
  node "$recipe/control.mjs" standalone
PS_L7_BUILD_OUTPUT="$proof/build-final" node "$recipe/checks/L7-build.mjs"
PS_L7_ARCHITECTURE_OUTPUT="$proof" node "$recipe/checks/L7-architecture.mjs"
PS_L7_ERROR_OUTPUT="$proof/error-final" node "$recipe/checks/L7-error.mjs"
PS_L7_OUTPUT="$proof" node "$recipe/checks/L7.mjs"
PS_STATUS_OUTPUT="$proof/status-final" node node_modules/@itrocks/property-select/test/browser-status.mjs
PS_TABLE_URL=http://127.0.0.1:13982/table-fixture PS_TABLE_OUTPUT="$proof/header" \
  node "$recipe/checks/RETEST-V2-TABLE-1-itinerary.mjs"
PS_V5_SUPPORT_APP=http://127.0.0.1:13981 PS_V5_SUPPORT_DEMO=http://127.0.0.1:13982 \
  PS_V5_SUPPORT_OUTPUT="$proof/support" node "$recipe/checks/V5-support.mjs"
PS_ENV_DIRECTORY=/tmp/property-select/FIX-L7-1-runtime node "$recipe/control.mjs" stop-app
PS_ENV_DIRECTORY=/tmp/property-select/FIX-L7-1-owned node "$recipe/control.mjs" stop-standalone
```

Chromium **151.0.7922.34**, Playwright **1.62.1**, `chromiumSandbox: true` throughout. Restricted child-process/network
execution required normal escalation. An initial restricted app launch left a PID 13 ownership record; the controller
refused its inaccessible identity during stop. That record was left intact and a fresh runtime directory was used;
no unrelated process was signalled. An initial browser-status fixture omitted explicit session mode and could not find
its storage retry; the corrected fixture enables session mode. Initial diagnostic evidence is retained, not counted as
acceptance. A connection-refused run with zero completed cases is likewise excluded from the verdict.

Before shutdown all three recipe URLs answered 200 and canonical MySQL answered ping:
[service identities](../evidence/FIX-L7-1/services-before-stop.json). Only owned app PID 2573067 and standalone
PID 2572890 were stopped through the controller;
[both ports closed and MySQL remained alive](../evidence/FIX-L7-1/services-after-stop.json).

[Preservation proof](../evidence/FIX-L7-1/preservation.json) confirms showtime HEAD `d7ca948`, the two original AD
index blobs and working-file absence, and foreign `config.yaml` checksum unchanged. Historical L7 report/evidence is
unchanged. No application source/docs/commit, install/update, implicit-download npx, vcs-modules, push, tag or
deployment occurred.
Physical devices/native keyboard/edge gestures/OS interruptions remain outside available hardware; this author check
does not replace independent RETEST-L7-1 or final V7/D8 acceptance.

Commit subjects: list `Declare direct list runtime dependencies`;
selector `Keep selection errors visible during state saves`.

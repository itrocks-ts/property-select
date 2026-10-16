# FIX-V7-1: Preserve persistence recovery guidance

## Verdict and checkpoints

**DONE / author PASS**, 16 October 2026. The correction for [V7-01](../defects/V7-01.md) is ready for the distinct
[RETEST-V7-1](../tasks/RETEST-V7-1.md). V7 remains historically **NEEDS_FIX**; the defect remains open pending that
independent gate. This executor performed only FIX-V7-1, with no sub-agent, independent retest or D8.
Requested profile: `gpt-6-astra` / `high`; the parent records dispatch, with no independent runtime attestation here.

Initial selector HEAD: `0767b5c1d405ff970c2849764ec330cde2c47920`, clean, tracking version **0.7.5** and runtime source
from **0.7.3**. First edit increments the package to **0.7.6**, covering this source correction, tests and tracking.
List remains `258f26c95f0b35df4176ba73225c35df6b56b449` / **0.12.1**. All other owners retain their versions and HEADs:
[initial inventory](../evidence/FIX-V7-1/checkpoints.json),
[handover inventory](../evidence/FIX-V7-1/handover-inventory.json).

## Correction and public behaviour

The generic view displays a non-empty `Error.message` supplied through `persistenceError` as a text node beside Retry.
Unknown error objects or empty messages use the translated generic save-failure text. The existing independent
operation message remains unchanged by storage errors, scroll, saves and storage Retry. Operation recovery, navigation
and new query input retain their established clearing behaviour and normal loading/search status.

No HTTP status, session generation or host-specific message is interpreted by the selector. List retains its public
`HttpStateStore` and the ended-session policy. No public signature, controller state or persistence lifecycle changes.
The README documents the separate messages. SOLID review: presentation stays in the view, storage policy in the
adapter; the same narrow state, metadata and consumer ports accept substituted implementations. There is no host import,
new infrastructure, copied SQL, hydration or table geometry.

## Reproduction and fresh browser results

Before changing runtime source, the adapted V7 reproducer recorded all **eight missing-guidance failures**:
[before](../evidence/FIX-V7-1/before/results.json). Its other session assertions passed, including acquired production
PUT 410, stale Retry 410, absent durable state and successful full reload. The initial instrumentation also left one
health assertion failing; its complete 21-event trace is retained. Historical V7 files were not changed.

The initial corrected replay passed [92 assertions](../evidence/FIX-V7-1/after/results.json). The strengthened final
replay passes **141/141 assertions**, with all eight revoke/expiry scenarios at 1280 × 720, 768 × 900, 390 × 844 and
844 × 390: [final results](../evidence/FIX-V7-1/after-final/results.json).
Each case observes a real acquired state PUT rejected with 410, visible `Reload the page` guidance, preserved query,
exact columns, breadcrumb branch and suggestion destinations. Native Retry remains 410, retains guidance and live
state, and cannot resurrect ended durable state. Full reload clears the error, branch and recents and a new query
persists with HTTP 200 in the fresh generation. Input is native mouse/keyboard at every size.

Before/ended/recovered screenshots exist for all eight cases. Portrait revocation and landscape expiry captures were
visually inspected: guidance is legible beside the separate Retry control and ordinary empty-search status.
The isolated session fixture uses 120 synthetic roots and the existing real file-session lifecycle, without
private data.

Additional regressions on the same corrected public view:

- [Public view status](../evidence/FIX-V7-1/status/results.json): **29/29 PASS**. Adapter guidance, empty/unknown error
  fallback, literal HTML-looking text with no created image or handler execution, persistent operation errors during
  repeated saves and storage Retry, non-empty restored branch/query/recents, selection recovery, clear and loading.
- [Existing RETEST-L7-1 browser driver replay](../evidence/FIX-V7-1/error/results.json): **62/62 PASS** across
  four sizes.
  Actual column/storage HTTP 503, native scroll causing durable saves, preserved branch/query/recents/columns,
  independent storage recovery and one successful selection retry. This is author regression evidence only.
- [Landscape error driver replay](../evidence/FIX-V7-1/landscape/results.json): **3/3 PASS**, recoverable operation
  message still visible after 600 ms, root retained and failed note column absent.

Chromium **151.0.7922.34**, Playwright **1.62.1**, `chromiumSandbox: true` throughout. No browser download or bypass.
Physical phones, native keyboards, physical edge gestures and system interruption were not exercised by this fix.
The separate final gate still owns its full applicable touch, SQL, scope and lifecycle matrix.

## Network attribution

The new driver observes each actual product fetch, its original AbortSignal and response without changing the signal,
request or response. It matches browser failure events to a unique fetch using scenario, URL, method and start time;
when Chromium reports start time zero, it uses the recorded request-event timestamp. Document identity prevents fetch
id reuse after reload. The final uniqueness assertion rejects reuse of an observation for several failures.

[Final health review](../evidence/FIX-V7-1/health-review.json): **24/24 individually qualified**, zero unqualified event
and zero page exception. **16** are metadata requests with matching observed product AbortSignals. **Eight** are list
column-save GET requests with both an actual browser HTTP **204** response and a fulfilled fetch reporting **204**;
Chromium reports `ERR_ABORTED` for that bodyless response despite its successful completion. These require both pieces
of response evidence and the precise save route; other failures remain blocking. The sixteen console 410 errors match
the deliberately ended state requests by scenario and URL.

The first fixed run similarly qualifies 22 events (14 metadata cancellations and eight completed saves). The original
V7 twenty events and initial FIX trace remain immutable and unclassified retrospectively: fresh instrumentation
establishes the causes on the reproduced itinerary; it does not invent missing historical signal evidence or introduce
a blanket `ERR_ABORTED` exception. The strengthened final run has no browser-health failure.

## Builds, exports and commands

[Build/test/public inventories](../evidence/FIX-V7-1/build/results.json) all pass: selector **45**, list **29**,
table **47**, home **1**, framework **18** tests, **140 total**, zero failed/skipped tests. All five owner builds,
manifest exports and required packaged JS/declarations/HTML/CSS/assets pass, followed by the showtime build.
The selector additionally passed its first focused [45-test run](../evidence/FIX-V7-1/selector-tests.txt).
The [import/dependency audit](../evidence/FIX-V7-1/architecture/architecture.json) finds no missing dependency, cycle,
private entry or selector host import. No SQL owner or adapter changed; new SQL acceptance belongs to RETEST-V7-1.

From showtime, the author executed these stages in order, with the source fix/build between `before` and `after`:

```bash
checks=node_modules/@itrocks/property-select/docs/orchestration/environment/checks
node "$checks/FIX-V7-1.mjs" before
npm test --prefix node_modules/@itrocks/property-select
node "$checks/FIX-V7-1.mjs" after
node "$checks/FIX-V7-1.mjs" status
node "$checks/FIX-V7-1.mjs" error
node "$checks/FIX-V7-1.mjs" landscape
node "$checks/FIX-V7-1.mjs" build
node "$checks/FIX-V7-1.mjs" after-final
PS_L7_ARCHITECTURE_OUTPUT=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V7-1/architecture \
  node "$checks/L7-architecture.mjs"
```

Each stage records exact commands, environment overrides, archived executed source and source/executed SHA-256.
[Provenance](../evidence/FIX-V7-1/provenance.json) records the unchanged original V7 inputs and delivered sources.
The session driver adds reload/state assertions and health instrumentation to V7; existing landscape/error assertion
bodies are unchanged. Driver import formatting after initial execution is represented by the archived executed files.
Text command logs have trailing whitespace normalised. [Checksums](../evidence/FIX-V7-1/SHA256SUMS) cover fresh
evidence.

## Ownership, preservation and handover

Each browser stage owns app **14081** and standalone **14082**, in a separate
`/tmp/property-select/FIX-V7-1-<stage>-owned` directory, using the V4 initializer and existing synthetic MySQL
**13316**.
The driver checks MySQL, starts each service, verifies readiness and records normal ownership-checked shutdown in
`finally`. All created services were stopped;
[final port/MySQL checks](../evidence/FIX-V7-1/services-after.json) pass. It does not signal inherited services.
The restricted initial database probe and later audit git subprocess were rejected; normal escalation succeeded.
The initial restricted probe evidence remains in `restricted-before`; no sandbox setting was changed.

Showtime HEAD stays `d7ca948292e28c248bdcc0283724e47c2a82bba4`; both AD index blobs/working-file absences and foreign
`config.yaml` are identical [before](../evidence/FIX-V7-1/preservation-before.json) and
[after](../evidence/FIX-V7-1/preservation-after.json). No durable application source/docs/commit, install/update,
implicit-download npx, vcs-modules, push, tag or deployment occurred.

Proposed and authorised local selector commit: `Show persistence recovery guidance`.
Independent RETEST-V7-1 must close V7-01 and complete the final matrix before D8. No final product acceptance is
claimed.

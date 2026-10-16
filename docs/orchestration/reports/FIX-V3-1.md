# Complete ordinary navigation after focused results

## Verdict and checkpoints

**DONE (correction author), 16 October 2026.** The correction for [V3-01](../defects/V3-01.md) passes the eight
reproductions, 193 focused browser assertions, all 138 full V3 assertions and 21 separate numerical assertions.
Independent **RETEST-V3-1 remains mandatory**; the original V3 failure stays historical and L4 remains gated.

Initially clean owner: `f426ab2547111691649ea1b0e574a3beb5afad3b`, version `0.4.4`.
This delivery applies the handbook patch increment to **0.4.5** at the first edit.
The final working source and generated public browser output are fingerprinted in
[commands.json](../evidence/FIX-V3-1/commands.json); replay checkpoints are the base SHA plus those pending changes.
Unchanged owner versions/HEADs and public artifacts are recorded in [review.json](../evidence/FIX-V3-1/review.json).
Requested profile: `gpt-6.1-sol` / `high`; parent dispatch metadata is authoritative.
Effective runtime identity/effort is not independently exposed. No sub-agent or subsequent task was started.

## Correction and boundaries

The view records the current search scope from the committed context path and exact query.
Only a non-idle search that has visited a context can retain a focused result absent from the ranked set.
Navigation loading, Clear, a changed query/context and the zero-visited start of a restarted search break that scope.
The rendering fingerprint includes the query. A normal ranked row loses any obsolete retained marker.

Ordinary root → tags now renders exactly `tags.invoices`, `tags.name`, with no retained root `tags` row.
A focused result in the same search keeps its exact button node through enrichment or budget displacement;
its action remains usable and final rank applies when focus leaves. No public API or controller/search policy changed.

SOLID review: the view owns DOM and focus lifetime; the controller still owns navigation/search and the providers own
metadata. No framework, host, SQL, hydration or pane logic was introduced. Existing delayed/failing/static and actual
HTTP providers remain substitutable; consumer and metadata ports stay narrow and unchanged.
Manifest exports, files allowlist and dependencies are unchanged. Seven distinct export targets exist, public CJS/ESM
imports execute without DOM activation, public TypeScript fixtures pass and offline package inventory succeeds.

## Executed validation

All commands run from `/home/baptiste/itrocks/showtime`, using installed Node/TypeScript/Playwright only.
The three V3 drivers accept optional `PS_V3_OUTPUT`; their default historical destinations are unchanged.
The correction always sets an override, and all original evidence/V3 file hashes remain unchanged.
Exact commands, exits and source hashes: [command index](../evidence/FIX-V3-1/commands.json).

```bash
npm --prefix node_modules/@itrocks/property-select test
PS_V3_OUTPUT=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V3-1/final-reproducer \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V3-reproduce.mjs
PS_V3_OUTPUT=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V3-1/final-bounds \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V3-bounds.mjs
PS_V3_OUTPUT=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V3-1/final-V3 \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V3.mjs
PS_FIX_V3_OUTPUT=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V3-1/focused-all \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/FIX-V3-1.mjs
```

- Full selector suite: **24/24 PASS**, including build and public types; [output](../evidence/FIX-V3-1/test.txt).
- Original reduced driver on final source: **8/8 PASS**; expected/observed exact rows and trusted clicks in
  [reproducer.json](../evidence/FIX-V3-1/final-reproducer/reproducer.json).
- Separate independent numerical driver: **21 PASS**; [bounds.json](../evidence/FIX-V3-1/final-bounds/bounds.json).
- Full independent-driver replay by the corrector: **138/138 PASS**, exit 0;
  [results.json](../evidence/FIX-V3-1/final-V3/results.json). Both interfaces at 1280 × 720, 768 × 900,
  390 × 844 and 844 × 390 cover search, segments, relation navigation, Clear, empty state and trusted input.
  The previously unreached HTTP/cycle/permission/Date/no-business-SQL itinerary completes successfully.
  Delayed and reversed HTTP completion preserve focus/rank and reject obsolete generations.
- New focused author driver: **193/193 PASS**; [source](../environment/checks/FIX-V3-1.mjs),
  [observations](../evidence/FIX-V3-1/focused-all/results.json). At both interfaces and all four dimensions,
  recoverable error/Clear/navigation returns the complete adjacent list, search relation navigation stays local,
  and both main/+ nodes retain exact keyboard focus during pending enrichment. At all four dimensions, the
  standalone one-result budget preserves main/+ action identity, emits the retained path exactly once and applies
  the final rank after blur. The real integration also exercises its default 100-result budget with 101 additional
  synthetic terminal descriptors in the delayed customer HTTP response. Main/+ retention preserves the exact node,
  the retained real tags.name action reaches the expected plural-column HTTP 400 and final ranking applies on blur.
  These supplemental metadata descriptors exercise view budgeting, not server catalogue acceptance; the full V3
  replay uses unmodified real metadata. Existing fixture latency is extended to 800 ms through an exact fixture URL;
  integrated provider errors/delays use actual browser HTTP routing. Product actions use trusted browser input.

Recovered standalone/integrated portrait screenshots were visually inspected: both show invoices and name under tags.
Earlier correction replays are retained separately; `final-*` and `focused-all` cover final product source.
These replays are author evidence, not the distinct independent retest's acceptance.

## Resources, execution adjustments and limits

Installed Playwright 1.62.1 / Chromium 151.0.7922.34, headless with `chromiumSandbox: true` throughout.
Restricted reproduction first failed at child-process `spawnSync node EPERM`; the partially created standalone
reservation was removed through ownership-checked `control.mjs stop-standalone` before approved replay.
No automatic approval rejection or changed permission/sandbox setting remains.
The initial focused harness's wildcard intercepted the product `search.js` as well as the fixture and failed before
any assertion; [preserved record](../evidence/FIX-V3-1/focused-initial-harness/results.json).
The route now names only the exact standalone fixture URL. No product change was needed for that harness error.
Offline npm inventory initially found the default cache read-only; explicit temporary cache under `/tmp` succeeds.

Full V3 uses app 13871 / standalone 13872 in `/tmp/property-select/V3`; reduced driver uses app 13875 / standalone 13874
in `/tmp/property-select/V3-reproduce`; focused driver uses app 13877 / standalone 13878 in
`/tmp/property-select/FIX-V3-1`. All drivers stop only their owned services in `finally`; stop results are in JSON.
[Cleanup assertions](../evidence/FIX-V3-1/cleanup.json) confirm all six task ports and ownership reservations
are closed.
They reuse the isolated synthetic MySQL database on 13316 without reset or data writes.
Mouse/keyboard at phone dimensions establishes responsive behaviour; no touch/physical-device claim is made here.
T11 drag, session restoration, physical keyboard/edge/system behaviour and final acceptance remain their later gates.

Showtime HEAD `d7ca948292e28c248bdcc0283724e47c2a82bba4`, both initial AD index blobs and working-file absences,
and the foreign config fingerprint are unchanged: [baseline](../evidence/FIX-V3-1/baseline.json) and
[review](../evidence/FIX-V3-1/review.json). Config content was not inspected or exposed.
No application code/docs/commit, install/update, implicit-download npx, vcs-modules, push, tag or publication.

Proposed and authorised local owner commit: `Keep adjacent properties complete after navigation`.

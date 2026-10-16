# RETEST-V7-1: Independent final acceptance

## Verdict

**DONE / independent PASS**, 16 October 2026. All **64 mandatory final cases** pass on the corrected sources:
T01–T27, SQL-01–14, META-01–04, PORT-01–10, PANE-01–06 and LIFE-01–03.
[V7-01](../defects/V7-01.md) is **CLOSED**. D8's acceptance prerequisite is cleared; D8 was not executed.
[Case-by-case inventory](../evidence/RETEST-V7-1/coverage.json) maps every case to fresh evidence.

This fresh verifier is distinct from V7 and FIX-V7-1. No subdelegation occurred. Requested profile:
`gpt-6-astra` / `high`; dispatch metadata belongs to the parent. Independent runtime model attestation is unavailable.
No product source was changed. Historical V7 and FIX-V7-1 reports and evidence remain unchanged.

## Checkpoints and environment

Selector runtime: `2083bb37b8f7bdb0e390730135213e0e89be69a7`, **0.7.6**.
Tracking/tests patch: **0.7.7**, applied on the first edit and used for the fresh builds.
[Complete clean initial inventory](../evidence/RETEST-V7-1/checkpoints.json) records all 14 full SHAs and versions.
[Runtime hashes](../evidence/RETEST-V7-1/runtime-hashes.json) identify the unchanged product sources and rebuilt assets.

| Owner                        | Tested HEAD | Version |
| ---------------------------- | ----------- | ------- |
| property-select              | 2083bb37    | 0.7.6   |
| list                         | 258f26c9    | 0.12.1  |
| table                        | 5e32fd6d    | 0.4.0   |
| home                         | 6c179705    | 0.7.0   |
| framework                    | 7211a974    | 0.11.0  |
| reflect                      | 41e6e672    | 0.3.1   |
| reflect-path                 | bc6e4bdd    | 0.3.2   |
| storage                      | a2988630    | 0.3.0   |
| sql-build                    | a267327e    | 0.2.0   |
| sql-join                     | 55db310b    | 0.2.0   |
| mysql                        | 275d7f3b    | 0.3.2   |
| mysql-maintainer             | 89ff36a3    | 0.4.1   |
| fastify                      | aca7bf37    | 0.4.1   |
| fastify-file-session-store   | c6284984    | 0.4.0   |

Node.js 24.0.1; installed Playwright 1.62.1; Chromium 151.0.7922.34 with `chromiumSandbox: true` throughout.
Both standalone and integrated interfaces run at 1280 × 720, 768 × 900, 390 × 844 and 844 × 390.
The final touch suite records eight contexts: both phone dimensions use `hasTouch: true` and `isMobile: true` in
both interfaces; desktop/narrow retain mouse/keyboard contexts. Trusted CDP touch movement, cancellation, pinch,
scroll, diagonal intent, rotation, keyboard and hybrid mouse input are recorded in the fresh touch evidence.

Synthetic MySQL remains on 13316. Owned shared application/standalone services use 14091/14092 and unique
`/tmp/property-select/RETEST-V7-1-*` directories. Other suites retain their isolated recipe ports. Only owned services
are stopped in `finally`; the inherited database remains available. No install, update, download, `vcs-modules`,
push, tag, deployment or application commit ran. Restricted subprocess EPERM used normal escalation.

## Execution and results

From `/home/baptiste/itrocks/showtime`, every stage is independently replayable with:

```bash
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/RETEST-V7-1.mjs <stage>
```

[Stage inventory](../evidence/RETEST-V7-1/stage-summary.json) lists all 28 stages, result files and exact command logs.
Each stage retains the executed source, its SHA-256, original source path/hash and checkpoint inventory.
Final formatting does not alter test semantics; executed driver copies are retained under `executed-sources`.
Two integration snapshots contain blank-line tabs: exact executed bytes are retained as `executed.raw.mjs.gz`;
`execution.json` records both the original hash and the normalised readable snapshot hash.
[Sums](../evidence/RETEST-V7-1/SHA256SUMS) cover the evidence. Log trailing whitespace is normalised.

| Stage                       | Fresh result                           |
| --------------------------- | -------------------------------------- |
| build                       | PASS: five owners, app; 140 tests      |
| foundations                 | PASS: nine owners; 103 test executions |
| architecture                | PASS: dependency/public boundary audit |
| imports                     | PASS: 287 assertions, 208 imports      |
| sql                         | PASS: 14 groups, 1,390 observations    |
| ui                          | PASS: 116 native UI observations       |
| pane                        | PASS: 147 assertions                   |
| table                       | PASS: 182 assertions                   |
| geometry                    | PASS: 2,362 assertions, 168 measures   |
| integration                 | PASS: 261 assertions                   |
| search                      | PASS: 138 assertions                   |
| search-focus                | PASS: 379 assertions                   |
| search-bounds               | PASS: 21 assertions                    |
| state                       | PASS: 84 assertions                    |
| session-regression          | PASS: 149 assertions, eight cases      |
| state-integrated            | PASS: 124 assertions                   |
| state-standalone            | PASS: 94 assertions                    |
| state-races                 | PASS: 23 assertions                    |
| state-revoke                | PASS: 10 assertions                    |
| state-contract              | PASS: 14 assertions                    |
| desktop                     | PASS: 130 assertions                   |
| transport                   | PASS: 72 assertions                    |
| touch                       | PASS: 281 assertions, eight contexts   |
| interruption                | PASS: 10 assertions                    |
| load                        | PASS: 290 assertions                   |
| error                       | PASS: 70 assertions, four sizes        |
| scope                       | PASS: 69 assertions                    |
| review                      | PASS: 54 assertions                    |

All **243 owner test executions** have zero failures, skips or cancellations. Builds include public exports,
CJS/browser entries, declarations, CSS/HTML assets and package inventories. App build passes without durable edits.
The [fresh SQL oracle](../evidence/RETEST-V7-1/sql/results.json) uses 137 independently seeded roots, verifies
110 executed statements and restores the canonical 120-root fixture. Raw journal provenance is recorded in
[raw checksums](../evidence/RETEST-V7-1/raw-checksums.json).

Integrated data assertions compare typed City/Country objects, exact values, nulls, counts, sort and all authorised
feed rows. The [scope replay](../evidence/RETEST-V7-1/scope/scope-independent.json) compares all 61 authorised full
JSON entities against the database and checks bounded visible-id reloads and deduplication. Desktop/touch traces
complete SQL-12's real preview query-count obligation. Plural selection refusal and hidden criteria stay scoped.
Table tests exercise header reorder/removal, freeze, selection, keyboard and repeated reset.

## Recovery and simultaneous errors

[Eight fresh native session cases](../evidence/RETEST-V7-1/session-regression/results.json) cover revoke and expiry
at every required size. Each waits for the production PUT to acquire its session, ends that session and receives 410.
The complete visible text includes `The selector session has ended. Reload the page.`. Stale Retry receives 410;
query, remembered branch, suggestions and exact columns survive. Durable obsolete state remains absent.
A full reload clears the obsolete selector state/error and successfully persists into a fresh generation with 200.
[Portrait recovery guidance](../evidence/RETEST-V7-1/session-regression/390x844-revoke-ended.png) is readable.

[Four-size simultaneous-error challenge](../evidence/RETEST-V7-1/error/results.json) creates a real column 503 and
storage 503 together. Both operation and persistence messages remain visible. Wheel/state save does not erase the
operation error; native storage Retry clears only persistence failure. Retrying selection applies once and restores
ordinary status. Non-empty query/branch/recents and exact columns are preserved. L7-02 remains closed.

## Individual network attribution

[Final network inventory](../evidence/RETEST-V7-1/health-review.json): **428/428** request failures attributed,
**zero unclassified**. There are **357 original product AbortSignals**, **63 completed bodyless HTTP 204 responses**
and **eight explicitly injected fixture aborts**. ERR_ABORTED never passes solely because of its error text.
The eight fixture aborts classify ERR_FAILED only. Expected HTTP 400/410/503 responses remain visible in suite traces.

The observer records context/page/document/fetch identity, URL, method, timing and the original signal without
altering requests, responses or cancellation. Matching is causal and unique. A Chromium zero start time requires
the corresponding fetch rejection time; a completed 204 requires the browser status and the same fulfilled fetch.
The original signal must abort before the failure event. Desktop has 203 attributed failures; touch has 88.
All suites with failures observed under the initial matcher were freshly replayed after correction. Desktop/touch
use the same causal matcher; the later URL-object observation correction affects template fetch recording only.

Diagnostics remain explicitly separate from final PASS: two desktop traces retain FAIL for insufficient matching;
the load URL diagnostic retains FAIL for two template requests recorded with an incorrect URL by the observer.
The original signals and rejections exposed this observer defect; the corrected fresh load run passes 17/17.
The initial simultaneous-error check expected the injected body rather than the adapter's actual recovery message;
the state-race replay used the old status-region locator. Their diagnostic evidence is retained, and fresh replays
check the real adapter message in the visible persistence region. No product requirement was weakened.
The old touch string-only network assertion is replaced by the stricter independent per-request gate, explaining
281 functional assertions versus the historical 282. Earlier observer runs remain archived with their own hashes.

## Architecture, preservation and limits

[Dependency audit](../evidence/RETEST-V7-1/architecture/architecture.json),
[independent AST audit](../evidence/RETEST-V7-1/imports/imports-independent.json) and
[source/preservation review](../evidence/RETEST-V7-1/review/results.json) pass. Responsibilities remain cohesive:
selector navigation/intents, list scope/state adaptation, framework composition/metadata transport, table transaction
and geometry, home pane ownership, SQL graph/build and MySQL typed reconstruction. Narrow metadata/consumer/state
ports support independent adapters; the generic selector imports no host/table/server policy. There is no duplicated
hydration, SQL in list or table geometry in selector. The correction safely displays adapter text in the view owner.

Showtime remains `d7ca948292e28c248bdcc0283724e47c2a82bba4`. Both AD audit index entries and working-tree absences,
plus foreign `config.yaml`, match the [initial preservation record](../evidence/RETEST-V7-1/preservation-before.json).
All 13 other owners remain clean at their recorded SHAs. Product sources are unchanged. Tracking paths alone are
committed locally in the selector owner. [Final preservation](../evidence/RETEST-V7-1/final-preservation.json)
records the final independent check and service ownership state.

The only validation limit is VAL-05: no physical handset, hardware keyboard overlay, OS edge gesture or actual OS
interruption was available. CDP touch is real browser touch emulation; the interruption contract uses a synthetic
blur event and does not claim physical OS coverage. Required browser touch/session/SQL cases are complete.
No mandatory case remains NOT_RUN, no defect remains open for final acceptance, and no D8 delivery is claimed.

Proposed local commit message: `Verify complete selector acceptance`.

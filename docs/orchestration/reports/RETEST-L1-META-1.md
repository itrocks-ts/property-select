# RETEST-L1-META-1 independent metadata and list recovery gate

## Verdict and checkpoints

Status: `NEEDS_FIX`, 16 October 2026. The missing-offset correction and metadata contracts pass independent checks
on a freshly started owned framework. The mandatory full list suite fails an existing empty-column-save assertion;
an independent real HTTP reproduction confirms the product defect. `FIX-L1-META-2` and `RETEST-L1-META-2` are now
required before L2-UI. Historical L1-META remains `NEEDS_FIX`; no dependent feature is unblocked.

Tested owners: list `7191d22217a7d087c197134bc09226a34d05fc60` / `0.8.1`, framework
`3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`, selector runtime from clean starting checkpoint
`81cfa9f52c9287411c258d261e964aae4a87a5e7` / `0.1.2`. This tracking-only delivery applies patch `0.1.3` on
its first edit; product sources and other owners' versions remain unchanged.
[Checkpoints and runtime](../evidence/RETEST-L1-META-1/checkpoints.json).

Requested profile: `gpt-6.1-sol` / `high`; parent owns actual dispatch evidence. The executor has no independent
identity/effort attestation. This verifier is distinct from L1-META and FIX-L1-META-1 executors and launched no agent.
The diagnosis is request intent in List; no new SQL-contract ambiguity justified Astra promotion.

## Independent observations

- **PASS** full list build, framework build/full suite with positive/negative type fixtures, five explicit META tests,
  nine existing projection tests, selector build/public types and fourteen controller tests, unchanged application
  build. [Commands](../evidence/RETEST-L1-META-1/commands-core.json),
  [META](../evidence/RETEST-L1-META-1/metadata.txt),
  [projection](../evidence/RETEST-L1-META-1/projection.txt).
  The full list suite runs every file; feed and existing scoped-list files pass, columns fails as described below.
  The relative Node projection command exhibits the known discovery error; the absolute command executes all nine
  assertions. [Failed invocation](../evidence/RETEST-L1-META-1/projection-relative.txt).
- **PASS** fresh `http://127.0.0.1:13639/country` and `/country?offset=0`: HTTP 200 and both synthetic countries
  rendered in Chromium. A trusted click on a harness anchor navigates back to the actual bare route.
  With `xhr-info: {"visibleRows":1}`, offset 1 yields only Recipe United Kingdom, offset 0 includes Recipe France,
  and offset 2 yields an empty feed. No SQL pagination semantics were weakened.
  [Independent assertions](../evidence/RETEST-L1-META-1/browser.mjs),
  [browser/HTTP proof](../evidence/RETEST-L1-META-1/independent-browser.txt).
- **PASS** documented owned stack status: synthetic database alive and real bare country list HTTP 200.
  [Status](../evidence/RETEST-L1-META-1/owned-status.txt).
- **PASS** independent Chromium `151.0.7922.34`, Playwright from the installed runtime, 1280 × 720,
  `chromiumSandbox: true`: root/context identity; full two-route/deep/cyclic paths; logical inverse and N-N;
  explicit unknown cardinality/inverse/target facts; class/property labels, business order and inherited fields
  beyond initial List; unknown-root, forbidden and forbidden-ancestor 403 with equal JSON payloads;
  malformed/ambiguous/terminal-traversal and unknown-target 400; no-store JSON for every checked response;
  restricted catalogue removes billing and its advice, then normal advice is available again.
  A browser request event establishes the delayed fetch before abort; `net::ERR_ABORTED` and `AbortError` follow.
  A separate delayed actual HTTP 200 completes after newer delivery navigation; the real controller returns false
  for the old navigation and keeps ready/delivery. No page exception occurs.
- **PASS** fixture guards report zero business read/search/count/select attempts and zero domain constructions or
  getter reads. The synthetic general-query journal segment across metadata operations contains zero business SQL.
  The HTTP provider and controller are imported through their real public browser assets.
- **PASS** exact corrective list diff and framework metadata diff inspected, CJS/browser/type exports and files,
  offline package inventory, browser graph, dependency direction and owner/application preservation.
  [Review](../evidence/RETEST-L1-META-1/review.json),
  [list diff](../evidence/RETEST-L1-META-1/list-review.diff),
  [framework diff](../evidence/RETEST-L1-META-1/framework-review.diff).
  Exact unmodified diffs are compressed alongside the readable copies;
  [raw checksums](../evidence/RETEST-L1-META-1/diff-record.json).

## Blocking defect and baseline classification

The full list suite exits 1. Its fourth columns assertion expects a column-save request to return 204 before any
feed or data work, including an empty column list. `List.html()` tests the truthiness of
`request.request.data.columns`, so `columns: ''` continues into `feed.getParams()` and triggers the existing
throwing mock. [Current assertion](../evidence/RETEST-L1-META-1/current-columns.txt),
[full list suite](../evidence/RETEST-L1-META-1/list-test.txt).

An independent archive of immutable list `005702a6a0cd49740cdea37c2e5150dc80fb670b` / `0.8.0`, compiled with the
same installed tools, reproduces the identical assertion and call site. Both `src/list.ts` and
`test/columns.test.mjs` are byte-identical between reference and current HEAD. Thus the feed correction introduced
no column-save regression. [Baseline construction](../evidence/RETEST-L1-META-1/baseline.json),
[baseline suite](../evidence/RETEST-L1-META-1/baseline-test.txt),
[baseline assertion](../evidence/RETEST-L1-META-1/baseline-columns.txt).

The independent real HTTP reproducer strengthens the failure beyond the author's test:

| Request                  | Expected       | Observed             |
| ------------------------ | -------------- | -------------------- |
| `/country?columns=name`  | 204, no render | 204, empty body      |
| `/country?columns=`      | 204, no render | 200, 2642-byte body   |

[Reproducer](../evidence/RETEST-L1-META-1/empty-columns.mjs),
[failed HTTP assertion](../evidence/RETEST-L1-META-1/empty-columns-http.txt).
This is a real public-list failure in the mandatory owner suite. The retest card requires that suite and explicitly
forbids waiving reproducible failures; EXECUTION requires a correction/retest. Pre-existence establishes attribution,
but does not satisfy the gate. No test is skipped, weakened or reclassified as passing.
The metadata/pagination observations above pass separately; the gate remains failed.

PLAN inserts `FIX-L1-META-2` then `RETEST-L1-META-2`, rewires L2-UI and records the failed retest.
Correction belongs to List request-intent handling and existing empty-column/session tests. It must restore 204
before feed/data/template work while preserving omitted/nonempty/invalid request behaviour. A distinct verifier
must then replay the full suites and fresh metadata/control/browser observations.

## Reproduction, environment and ownership

Run from `/home/baptiste/itrocks/showtime` with installed tools only:

```bash
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-L1-META-1
python3 "$proof/run.py" core
python3 "$proof/run.py" baseline
python3 "$proof/run.py" focused
python3 "$proof/run.py" public-pack
python3 "$proof/run.py" start
python3 "$proof/run.py" status
python3 "$proof/run.py" browser
python3 "$proof/run.py" defect
python3 "$proof/run.py" stop
python3 "$proof/review.py"
```

`core`, `baseline` and `defect` deliberately preserve nonzero outcomes while this defect is open; runner completion
is not an all-pass claim. Exact argv, environment, exits and output SHA-256 values are in `commands-*.json`.
The [checksum manifest](../evidence/RETEST-L1-META-1/SHA256SUMS.json) covers raw evidence and reusable assertions.
Runtime: Node `24.0.1`, npm `11.6.4`. No installed dependency or browser was downloaded.

Fresh owned directory `/tmp/property-select-RETEST-L1-META-1` had no app PID/owner records before startup.
Its `mysql.sock` links to the existing synthetic socket; the database was neither reset nor stopped.
The launcher supplies `PS_APP_PORT=13639` and the public `beforeFrameworkRun` fixture
`node_modules/@itrocks/framework/test/metadata-fixture.cjs`.
The final PID was `2240353`; exact arguments, token, boot/start identity and log checksum are preserved in
[environment.json](../evidence/RETEST-L1-META-1/environment.json).
The normal escalation mechanism was needed for local database/browser access. The initial restricted process
was safely cleaned by the owned launcher, then a new host process was started and its identity checked independently.
[Restricted status](../evidence/RETEST-L1-META-1/restricted-owned-status.txt).
The final ownership-checked stop succeeded and removed its PID/owner records.
[Cleanup](../evidence/RETEST-L1-META-1/stop.txt). Inherited apps and the synthetic database remain untouched.

Probe diagnostics are retained: headless Alt+ArrowLeft did not navigate, replaced by a trusted normal-anchor click;
class-view deliberately normalises the class label to lower case; the TypeScript `unknown` field is terminal with no
target and refuses context traversal. Corrected independent expectations follow the respective owner contracts.
Initial offline package probes hit a read-only default cache; a `/tmp` cache worked. `npm --prefix ... pack`
inventoried showtime, so only the corrected explicit-directory `public-pack` records establish package contents.
No product assertion was weakened to address these harness/command diagnostics.

## Ownership, limits and handover

SOLID: Feed retains pagination defaults; List owns column-save request intent; Columns/Persist own configuration
and existing session serialisation. Metadata descriptions, request policy, HTTP serialization and fetch transport
retain distinct owners. The selector depends on neutral metadata ports and has no framework/SQL/table/home runtime
dependency; public composition supplies the provider. No duplicated SQL, business hydration or geometry is added.

Search, rendered selector, persisted selector restoration, gestures and combined later matrix cases remain NOT_RUN.
This gate checks existing list session tests only; it does not claim the later selector session feature.
No physical touch/device assertion belongs to this retest.

Showtime remains `d7ca948292e28c248bdcc0283724e47c2a82bba4` with exactly its two original AD entries,
absent working files and unchanged index blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. List/framework repositories remain clean.
No application source/document/commit, install/update, implicit-download npx, vcs-modules, sandbox/permission change,
push, tag or publication occurred. No product file was edited during verification.

Authorised proposed local tracking commit: `Record independent metadata retest and empty column save defect`.
The report contains no own-commit SHA; the parent receives the final tracking SHA after commit.

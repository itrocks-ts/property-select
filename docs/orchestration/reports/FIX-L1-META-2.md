# FIX-L1-META-2 explicit empty column saves

## Status and checkpoints

Correction status: `DONE`, 16 October 2026. The full list suite and real empty-column HTTP save now pass.
Independent `RETEST-L1-META-2` is still required; historical L1-META and RETEST-L1-META-1 stay `NEEDS_FIX`.
No dependent feature is unblocked by these author observations.

List started clean at `7191d22217a7d087c197134bc09226a34d05fc60` / `0.8.1`; the patch delivery is
`033246001183120bbf3a3f0191d061fe960dcf56` / `0.8.2`, clean after its explicit three-file local commit.
Tracking started clean at `96443912c6a0cd7a7253f506ea109d346f1907cb` / `0.1.3`; first edit applies patch `0.1.4`.
Framework stays clean at `3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`.
[Checkpoints](../evidence/FIX-L1-META-2/checkpoints.json). This report contains no own-commit SHA.

Requested profile: `gpt-6.1-sol` / `high`; dispatch records belong to the parent. This executor has no independent
runtime identity/effort attestation and launched no sub-agent. Astra was evaluated: the existing Columns contract
explicitly distinguishes undefined from an empty value; no SQL/session contract ambiguity or redesign arose.

## Correction and oracle

`List.html()` now checks `columns !== undefined`, matching `Columns.getParams()`. An explicit empty string or array
is a column-save request: the existing Columns owner validates it, Persist saves its empty array, then List returns
204 before feed, filter, sort, query or template processing. Undefined or omitted columns retain normal list rendering.
Columns, Persist, metadata, SQL/projection, policy and application source are unchanged.

The unchanged regression oracle failed before the correction at the expected throwing feed mock.
[Red output](../evidence/FIX-L1-META-2/columns-before.txt),
[exact invocation](../evidence/FIX-L1-META-2/commands-red.json).
The original four tests remain intact. One focused test adds explicit empty arrays/array strings, invalid-column
preservation, saved-empty restoration, and omitted/explicit-undefined requests continuing into normal rendering.
The entire owner suite and all 13 explicit list assertions pass with no skip or weakened assertion.

## Executed checks and reproduction

Run from `/home/baptiste/itrocks/showtime`, using installed tools only:

```bash
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-L1-META-2
python3 "$proof/run.py" core
python3 "$proof/run.py" absolute-list
python3 "$proof/run.py" start
python3 "$proof/run.py" status
python3 "$proof/run.py" browser
python3 "$proof/run.py" defect
python3 "$proof/run.py" stop
python3 "$proof/review.py"
```

Before a fresh launch, establish that port 13649 is free, no app ownership reservation exists, and the synthetic
database is alive. Create `/tmp/property-select-FIX-L1-META-2/mysql.sock` as a link to the existing synthetic socket.
The reused directory retains test session files after cleanup; use another verified directory/port for independent
verification. The runner's exact argv, working directory, environment, output hash and exit are in `commands-*.json`.
Readable build/preflight logs omit trailing blank lines; adjacent `.gz` files preserve exact raw output and hashes.
The core runner returns 1 only because it deliberately retains the known relative Node discovery failure;
its absolute-path retry executes all nine projection assertions successfully.
[Relative failure](../evidence/FIX-L1-META-2/projection-relative.txt).

- **PASS** full list build, manifest test command and 13 individually reported list assertions.
  [Build](../evidence/FIX-L1-META-2/list-build.txt), [suite](../evidence/FIX-L1-META-2/list-test.txt),
  [assertions](../evidence/FIX-L1-META-2/list-assertions.txt).
- **PASS** framework build/full suite and public type fixtures, five explicit META tests and nine projection tests.
  [Framework](../evidence/FIX-L1-META-2/framework-test.txt), [META](../evidence/FIX-L1-META-2/metadata.txt),
  [projection](../evidence/FIX-L1-META-2/projection.txt).
- **PASS** selector build/public types/fourteen controller tests and unchanged application build.
  [Selector](../evidence/FIX-L1-META-2/selector-test.txt),
  [application](../evidence/FIX-L1-META-2/application-build.txt).
- **PASS** fresh real framework `/country` and `/country?offset=0`, both countries rendered in Chromium;
  trusted anchor click returns to the bare route. With `xhr-info: {"visibleRows":1}`, offsets 0, 1 and 2 preserve
  first/later/empty page behaviour. The documented owned status command passes; explicit invalid offset remains 500.
- **PASS** unchanged independent HTTP reproducer: `/country?columns=name` and `/country?columns=` both return 204,
  zero body bytes. [HTTP](../evidence/FIX-L1-META-2/empty-columns-http.txt).
- **PASS** Chromium `151.0.7922.34`, installed Playwright, 1280 × 720 and `chromiumSandbox: true`: nonempty, invalid
  and empty column saves return 204, perform zero `read/search/count/select` calls and zero business SQL, preserve
  invalid selection, and restore the expected columns after full reload. The live request-session probe records
  `[]` after empty save; a distinct browser session retains default `name`.
  [Session/read proof](../evidence/FIX-L1-META-2/columns-browser.txt).
- **PASS** real metadata HTTP/browser replay: permission/refusal/presentation, deep/two-route/cyclic/inverse/N-N
  paths, catalogue/advice changes, a started fetch aborted with `net::ERR_ABORTED`, and a late real HTTP 200 discarded
  after delivery navigation. Zero guarded business reads/constructors/getters, zero metadata business SQL and no page
  exception. [Browser](../evidence/FIX-L1-META-2/metadata-browser.txt).
- **PASS** generated source, public CJS/browser/type exports, all five unchanged metadata SHA-256 values, exact list
  scope, clean product owners, no tracked locks and preserved application/index.
  [Review](../evidence/FIX-L1-META-2/review.json), [checksum manifest](../evidence/FIX-L1-META-2/SHA256SUMS.json).

## Environment and cleanup

The verified available app port was 13649 in `/tmp/property-select-FIX-L1-META-2`; no records existed before launch.
[Preflight](../evidence/FIX-L1-META-2/preflight.json). The restricted local socket preflight returned EPERM before any
launch. Normal tool escalation permitted local database/service/browser access; permissions and browser sandbox were
not changed. The existing synthetic MySQL on 13316 was reused without reset or shutdown.

The existing owned launcher uses public `beforeFrameworkRun`. The tracking-only `fixture.cjs` first loads the existing
metadata fixture, then wraps data-source methods to count calls without changing their result and adds a test probe.
It has no business product logic. A first successful browser run used the unmodified metadata fixture; its command and
proof records are retained with `-initial`. A targeted owned restart then added the stronger call-count probe and all
browser assertions passed again.
[Initial owner](../evidence/FIX-L1-META-2/environment-initial.json),
[final owner and raw log path/hash](../evidence/FIX-L1-META-2/environment.json).

The final `stop-app` verifies exact PID/token/UID/arguments/boot/start identity, stops only this app and removes its
PID/owner files. [Cleanup](../evidence/FIX-L1-META-2/stop.txt). Inherited listeners and the synthetic database remain
available. Only disposable session/log material remains under the correction's `/tmp` directory.

## SOLID, preservation and handover

List owns request intent; Columns owns validation/configuration and Persist owns the existing request-session
serialisation. Feed, filters, sort, templates and data adapters retain their normal responsibilities. The change adds
no dependency, SQL, hydration, metadata policy, session transaction or parallel infrastructure. Existing adapters and
request shapes remain substitutable. Test wrappers observe public storage methods and delegate unchanged behaviour.

This task checks the existing list session contract and reload/isolation, not later selector session transactions,
server-restart durability, search, rendered selector gestures or combined later matrix cases. Those retain their stages.
PLAN marks only this correction DONE and retains the distinct pending RETEST-L1-META-2 prerequisite for L2-UI.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`, with exactly its original two AD entries, absent working
files and staged blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. No application source/document/commit, install/update, implicit-download
npx, vcs-modules, sandbox/permission change, push, tag or publication occurred.

Authorised local commit subjects: list `Acknowledge empty list column saves`;
tracking `Record empty list column save correction`.

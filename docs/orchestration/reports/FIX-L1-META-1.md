# FIX-L1-META-1 default list pagination

## Status and checkpoints

Correction status: `DONE`, 16 October 2026; independent acceptance remains pending `RETEST-L1-META-1`.
The fresh framework control routes and owned status command now pass. L1-META stays `NEEDS_FIX` in the historical
gate, and no dependent feature is unblocked by this author report.

Product owner `list` started clean at `005702a6a0cd49740cdea37c2e5150dc80fb670b` / `0.8.0`; the patch delivery is
`7191d22217a7d087c197134bc09226a34d05fc60` / `0.8.1`, clean after its explicit three-file local commit.
Tracking started clean at `45e61b2dada880b8b315cbe9555f8d6d95b2223b` / `0.1.1` and applies patch `0.1.2` on its
first edit. Framework remains clean at `3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`.
The report contains no own-commit SHA.

Requested profile: `gpt-6.1-sol` / `high`; dispatch evidence belongs to the parent. The executor has no independent
runtime model/effort attestation. No sub-agent was launched. Astra was evaluated: the cause is a request default in
`Feed`, with no SQL/projection/hydration contract change, so no promotion or scope expansion was needed.

## Change and regression coverage

`Feed.getParams()` applies `Feed.DEFAULT_OFFSET` before numeric conversion when the request offset is absent.
It resets a reused feed to the first page and retains explicit offset conversion and viewport limit handling.
The owning regression tests verify an absent offset after a prior page, numeric/string offsets including zero and
the safe-integer boundary, and propagation of invalid explicit values for downstream rejection.

The new absent-offset test failed against the original built feed with `NaN !== 0`; the two explicit-offset tests
already passed. [Red proof](../evidence/FIX-L1-META-1/feed-before-fix.txt).
After rebuilding, all three focused feed tests pass. [Green proof](../evidence/FIX-L1-META-1/feed-test.txt).
Existing filter, scope, sort, feed and JSON assertions also pass unchanged.
[Existing list assertions](../evidence/FIX-L1-META-1/list-scopes-test.txt).

No SQL validation, projection, filter, sort, column, metadata-policy or backend code changes. An explicit invalid
offset still returns 500 with `SelectionError` code `unsupported-option`, preserving the existing strict rejection.

## Executed validation

Exact argv, environment, exits and output hashes are in the evidence directory's `commands-*.json` files.
All commands run from `/home/baptiste/itrocks/showtime` with installed tools. Reusable entry point:

```bash
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-L1-META-1
python3 "$proof/run-checks.py" core
python3 "$proof/run-checks.py" focused
python3 "$proof/baseline.py"
python3 "$proof/run-checks.py" start
python3 "$proof/run-checks.py" integration
python3 "$proof/run-checks.py" browser
python3 "$proof/run-checks.py" stop
python3 "$proof/review.py"
```

`core` records every outcome and returns 1 for the unrelated existing full-list-suite failure described below.
The initial `red` command is a before-rebuild observation, not a command expected to fail after this delivery.
For a fresh run, first verify the port/ownership records and provide the synthetic database socket link described
under environment below. The browser runner uses installed Chromium with `chromiumSandbox: true`.

- **PASS** full list build: server/declarations/templates, browser code, styles/icons.
  [Output](../evidence/FIX-L1-META-1/list-build.txt).
- **PASS** all three feed tests and five existing list scope/filter/feed/JSON tests.
- **PASS** framework build/full suite, nine explicit existing projection/binding assertions and five metadata tests.
  [Framework suite](../evidence/FIX-L1-META-1/framework-test.txt),
  [projection](../evidence/FIX-L1-META-1/projection-test.txt),
  [metadata](../evidence/FIX-L1-META-1/metadata-test.txt).
- **PASS** unchanged application build. [Output](../evidence/FIX-L1-META-1/application-build.txt).
- **PASS** fresh `/country` and `/country?offset=0`: both HTTP 200, both synthetic countries, identical HTML digest.
  Explicit invalid offset still fails. [HTTP proof](../evidence/FIX-L1-META-1/country.json).
- **PASS** documented owned status command: database alive and real framework list HTTP 200.
  [Status](../evidence/FIX-L1-META-1/owned-status.txt).
- **PASS** real Chromium `151.0.7922.34` metadata/transport replay: authorised root/context/deep/cyclic/N-N
  navigation, refusals, catalogue changes, request abort and stale result disposal; no page errors and zero guarded
  business read/search/count/select attempts, constructors or getters.
  [Browser proof](../evidence/FIX-L1-META-1/metadata-browser.json).
- **PASS** generated feed, identical SHA-256 of all five recorded metadata artifacts, exact owner diff, cleanup,
  framework checkpoint and application/index preservation. [Review](../evidence/FIX-L1-META-1/review.json).
- **FAIL, pre-existing** full `npm --prefix node_modules/@itrocks/list test`: the empty column-save test calls its
  throwing feed mock because the unchanged `List.html()` checks the truthiness of `request.data.columns`.
  [Current suite](../evidence/FIX-L1-META-1/list-test.txt). A fresh archive of immutable list `0.8.0` at the starting
  SHA, compiled using the same installed tools, reproduces the identical assertion before any feed implementation
  can execute. [Baseline suite](../evidence/FIX-L1-META-1/baseline-list-test.txt),
  [assertion](../evidence/FIX-L1-META-1/baseline-columns-test.txt),
  [baseline commands](../evidence/FIX-L1-META-1/baseline-list-test.json).
  No assertion was skipped or weakened. This separate column-save defect remains open for orchestration triage.

## Environment and ownership

The new owned directory is `/tmp/property-select-FIX-L1-META-1`; a successful socket bind established that port
`13629` was free before launch, and no app PID/owner record existed. The existing synthetic database remains on
13316 without a reset or shutdown. The directory's `mysql.sock` link points to
`/tmp/showtime-property-select-env/mysql.sock` for the documented status command.
Read-only database readiness was `mysqladmin --no-defaults --socket=... -u root ping`: `mysqld is alive`.

The runner supplies `PS_ENV_DIRECTORY`, `PS_APP_PORT=13629`, `PS_METADATA_URL` and
`PS_FRAMEWORK_INITIALIZER=node_modules/@itrocks/framework/test/metadata-fixture.cjs` through the existing
ownership-checked launcher. The fresh owned app PID was `2234211`; its exact token, arguments, boot/start identity
and raw log hash are in [environment evidence](../evidence/FIX-L1-META-1/environment.json).
Normal tool approval was used for socket/service/browser access after the restricted shell refused local sockets.
No permissions or browser sandbox settings changed.

`run-checks.py stop` calls the documented targeted `stop-app` with that directory. The ownership checks passed,
the owned process stopped and its PID/owner records disappeared.
[Shutdown](../evidence/FIX-L1-META-1/stop.txt). Inherited apps and the database were left running.

## Review, limits and handover

SOLID: `Feed` retains responsibility for request pagination defaults; `Limit` retains the neutral option contract
and the SQL builder retains validation. Existing storage adapters, metadata ports and consumer contracts remain
substitutable. No new dependency, infrastructure abstraction or duplicated query logic is introduced.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4` with exactly the original two AD entries, absent working
files and unchanged index blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. No application source/document/commit, install/update, implicit-download
`npx`, `vcs-modules`, push, tag or publication occurred. Owners have no tracked lockfile to synchronise.

`RETEST-L1-META-1` must independently replay the corrective commit and metadata/control checks. The unrelated
empty-column-save suite failure is explicitly retained; this report does not claim a passing full list suite.
All later product/browser/search/session/gesture gates and combined matrix verdicts retain their previous status.

Authorised local commit subjects: list `Restore the first list page without an offset`;
tracking `Record default list pagination correction`.

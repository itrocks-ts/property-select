# RETEST-L1-META-2 independent recovery verification

## Verdict and checkpoints

**PASS**, 16 October 2026. Independent assertions reproduce the corrected behaviour on a fresh owned framework.
The full list suite has zero failures. Empty and nonempty saves acknowledge 204 before business or rendering work,
and the saved empty column set survives the existing session contract. Pagination and metadata remain valid.
PLAN closes L1-META and RETEST-L1-META-1 through this retest while retaining their historical failing reports and
validation records. L2-UI is ready; this verifier starts no dependent feature and changes no product source.

Tested list: `033246001183120bbf3a3f0191d061fe960dcf56` / `0.8.2`; framework:
`3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`; selector runtime starts from
`78c64549156c55f78ca9ba0a7427c98e8b4dd1ea` / `0.1.4`. The first tracking edit applies patch `0.1.5`.
[Checkpoints](../evidence/RETEST-L1-META-2/checkpoints.json),
[exact list correction](../evidence/RETEST-L1-META-2/list-correction.diff.gz).
The correction changes only the manifest, explicit request-intent condition and focused columns regression.
Existing failing assertions are retained. This report contains no own-commit SHA.

Requested profile: `gpt-6.1-sol` / `high`; parent owns dispatch evidence. Independent executor identity/effort
attestation is unavailable. This verifier is distinct from the correction authors and previous verifier, and launches
no sub-agent. Astra was evaluated: the explicit-value contract, existing session namespace and observed SQL trace
leave no new session/SQL ambiguity or redesign requiring promotion.

## Fresh observations

- **PASS** list full build and manifest suite, all 13 individually reported assertions, five explicit META tests,
  nine existing projection tests, framework build/full suite/public type fixtures, selector build/public types and
  fourteen controller tests, unchanged application build.
  [Commands](../evidence/RETEST-L1-META-2/commands-core.json),
  [list assertions](../evidence/RETEST-L1-META-2/list-assertions.txt),
  [META](../evidence/RETEST-L1-META-2/metadata.txt),
  [projection](../evidence/RETEST-L1-META-2/projection.txt).
- **PASS** independently authored public List assertions: string/array empty values and nonempty/invalid values
  return 204 with zero feed/filter/sort/template calls. The existing session stores the expected columns. Omitted
  and explicit undefined parameters enter normal rendering with the saved empty array.
  [Assertions](../evidence/RETEST-L1-META-2/list.mjs),
  [results](../evidence/RETEST-L1-META-2/independent-list.txt).
- **PASS** fresh `http://127.0.0.1:13659/country` and `/country?offset=0`, HTTP 200 with both synthetic countries.
  Chromium fills and submits an offset form, then clicks an ordinary anchor back to the bare route. With
  `xhr-info: {"visibleRows":1}`, offsets 0, 1 and 2 retain first, later and empty end-page behaviour. Explicit invalid
  offset still returns 500. The documented owned status command passes.
  [Status](../evidence/RETEST-L1-META-2/owned-status.txt).
- **PASS** independent real HTTP saves for `columns=name`, invalid `columns=unknown` and `columns=` all return 204,
  zero body bytes, zero additional read/search/count/select calls and zero business SQL. The session and a full
  browser reload retain the expected columns, including `[]`. A separate Chromium context retains default `name`.
- **PASS** metadata root/context equivalence, full paths through two routes, deep finite cycles, reciprocal inverse
  ids, logical N-N and explicit unknown target/cardinality/inverse facts. Presentation reuses the class/property
  labels and business order and includes inherited/accessible properties beyond the initial List column.
- **PASS** unknown roots, forbidden properties and forbidden ancestors yield equal 403 JSON. Malformed paths,
  ambiguous targets, terminal traversal and unknown context target yield the expected 400 error codes. Every checked
  response is JSON with `Cache-Control: no-store`. Restricted catalogue removes billing and its advice; normal advice
  returns on a later unrestricted request.
- **PASS** public HTTP browser provider: a request event proves a delayed fetch started before abort; Chromium reports
  `net::ERR_ABORTED` and the promise rejects with `AbortError`. A separate delayed real HTTP 200 completes after newer
  delivery navigation; the controller rejects old navigation and remains ready at delivery. Metadata records zero
  guarded business read attempts, domain constructions/getter reads and business SQL. No page exception occurs.
- **PASS** public CJS, browser assets, declarations, offline package inventory, direct runtime dependency declarations,
  neutral selector dependency direction and identical five metadata artifact hashes.
  [Review](../evidence/RETEST-L1-META-2/review.json),
  [public export check](../evidence/RETEST-L1-META-2/public-cjs.txt).

All browser/HTTP assertions above are independently authored in
[browser.mjs](../evidence/RETEST-L1-META-2/browser.mjs), with expected/observed records in
[browser.txt](../evidence/RETEST-L1-META-2/browser.txt). Runtime: Node `24.0.1`, npm `11.6.4`, installed Playwright,
Chromium `151.0.7922.34`, 1280 × 720, `chromiumSandbox: true`. No dependency/browser download occurs.

## Reproduction and diagnostics

Run from `/home/baptiste/itrocks/showtime` using the installed tools:

```bash
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-L1-META-2
python3 "$proof/run.py" core
python3 "$proof/run.py" independent-list
python3 "$proof/run.py" pack
python3 "$proof/run.py" preflight
python3 "$proof/run.py" start
python3 "$proof/run.py" status
python3 "$proof/run.py" browser
python3 "$proof/run.py" review
python3 "$proof/run.py" stop
```

The runner records exact argv, cwd, environment, exits and output hashes in `commands-*.json`.
The exact corrective diff and raw list-build output are gzip-compressed; its readable build log drops trailing blank
lines and the command record retains both raw/compressed hashes.
The relative Node 24 projection-discovery invocation fails as documented; its absolute-path invocation executes all
nine assertions. The first independent List harness incorrectly invoked `PropertyType` as a decorator and stopped
before assertions. That unnecessary annotation was removed; the separate independent-list invocation passes all
unchanged behavioural assertions. The initial failure is retained as `independent-list-initial.txt`, with its original
command/hash in `commands-core.json`. Consequently the recorded initial core group exits 1; every product test and
final independent assertion passes. No product failure is waived or assertion weakened.

The offline inventory includes npm's stderr warning after its JSON; the review reads that leading JSON document.
The initial unrestricted JSON parser diagnostic was a harness issue. The successful review verifies the named owner
inventory and exports directly.
The [checksum manifest](../evidence/RETEST-L1-META-2/SHA256SUMS.json) covers retained raw outputs, command records,
assertions and review resources.

## Environment, ownership and cleanup

Preflight proves port 13659 available and no prior app PID/owner reservation in
`/tmp/property-select-RETEST-L1-META-2`. The existing synthetic database on 13316 is alive and remains unreset.
For a new independent run, choose another unused directory/port and update the runner overrides together.
The directory's `mysql.sock` links to `/tmp/showtime-property-select-env/mysql.sock` for the documented status command.
The owned launcher imports the reused tracking-only column/metadata fixture through public `beforeFrameworkRun`.
It observes public data-source methods and delegates their behaviour; assertions belong to this verifier.
After formatting the assertion scripts, a second owned process replays them successfully; first-run proofs remain
with `-initial` names. An immediate status check during asynchronous startup gets ECONNREFUSED; after the listening
log, status and the complete browser replay pass. The failed readiness check is retained with `-readiness` names.
[Preflight](../evidence/RETEST-L1-META-2/preflight.txt),
[exact process identity, initializer/log hashes](../evidence/RETEST-L1-META-2/environment.json).

The restricted local socket probe returns EPERM before launch. Normal tool escalation allows local service and
sandboxed Chromium access; permissions and browser sandbox settings are unchanged. The ownership-checked targeted
stop verifies exact PID/token/arguments/UID/boot/start identity and removes this app's records.
[Cleanup](../evidence/RETEST-L1-META-2/stop.txt). The post-stop review confirms PID/owner absence. Inherited services
and the synthetic database remain untouched; only disposable session/log material remains in the retest directory.

## Ownership, limits and preservation

SOLID review: List owns request intent, Columns validates configuration, Persist owns the existing request-session
serialisation and Feed owns pagination. Metadata description/policy, action serialization and fetch transport retain
their respective owners. Reflection/path/presentation use public existing ports. Static and HTTP providers substitute
through the selector's neutral metadata contract. The selector adds no framework/table/home/storage dependency.
No SQL builder, hydration, session transaction, geometry or unrelated infrastructure is duplicated.

This closes the implemented metadata and list recovery gate. Search, rendered selector controls, selector session
transactions/restoration and gestures retain their named later gates; combined META/LIFE/PORT cases remain NOT_RUN.
The existing List session reload/isolation observations do not claim later selector persistence or restart durability.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`, with exactly the original two AD entries, absent
working files and staged blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. List/framework stay clean at their tested SHAs. No application
source/docs/commit, install/update, implicit-download npx, vcs-modules, sandbox/permission change, push, tag or
publication occurs. Only the selector tracking package receives documentation/assertions and patch `0.1.5`.

Authorised local commit subject: `Verify metadata and empty column save recovery`.

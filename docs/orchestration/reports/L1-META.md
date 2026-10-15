# L1-META authorised framework metadata

## Verdict and checkpoints

Status: `NEEDS_FIX`, 16 October 2026. Every assigned metadata/provider/HTTP observation passes, but a fresh server
fails the documented environment control route `/country` without an offset. The owned status command fails too.
No dependent feature may start before `FIX-L1-META-1` and a successful independent `RETEST-L1-META-1`.
The failure belongs to existing list pagination; it is not replaced with a fixture backend or waived.

Prerequisites S02–S07, VSQL and L1 have validated reports and attributable commits. Tracking starts clean at
property-select `a2a22bbf91fe0ed9591f0f1496436e0d9654d2d2` / `0.1.0`; this documentation/test-support delivery applies
patch `0.1.1` on its first edit. Framework starts clean at `aff37e0da8272ca63908a57d7ff3abfa80ec177e` / `0.8.1`.
Its compatible public adapter receives `0.9.0`, commit `4c35412b26ca011b503176becdb4df301dc7dbba`.
A subsequent whitespace-only correction is `3ff5f9ff52deba48f7c1e280d28e38c71e795f2b` / `0.9.1`.
A README-width correction is `09e152a1f2c8b7d60d771375609363e1daa77318` / `0.9.2`.
The final application-relative root example correction is `3566dd9352a6ce25df58e6d365f50481e2787eca` / `0.9.3`.
That final version rebuilds and passes framework tests and package inventory; runtime source is unchanged from the
browser-tested `0.9.1` checkpoint. [Artifact record](../evidence/L1-META/final-artifacts.json).
The tracking report contains no own-commit SHA.

Requested profile: `gpt-6.1-sol` / `high`; actual dispatch metadata belongs to the parent. This executor has no
independent runtime model/effort attestation. No sub-agent was launched. The new adapter uses the already validated
reflection/path ports; no projection or hydration redesign requires Astra calibration in this task.

## Delivered contracts

The public framework `property-select` subpath exports `ReflectionMetadataProvider`, root/configuration/policy types,
`createMetadataProvider`, `metadataConfiguration`, `propertySelectDependsOn`, `bindPropertySelect` and typed metadata
errors. Public actions expose `/property-select/context/json`, `/property-select/resolve/json` and
`/property-select/configuration/json` with opaque registered root ids and full root-relative paths. They use actual
`Action`, action `Request.data` and JSON responses through Fastify. No request can name a module or register a root.

The configured root catalogue and each request's policy jointly filter enumeration and every full-path prefix.
Unregistered roots and forbidden properties have the same 403 response. Default roots are empty; configured roots
remain subject to normal action access and the optional request-specific policy. Metadata responses are `no-store`.
Root advice is configuration only, filtered to valid authorised relations, with a catalogue version. Changing grants
between requests changes contexts, resolution and advice without a global user cache. Persisted restoration is L4/V4.

Facts reuse public composed reflection, path resolution, route destinations and presentation owners. Framework
`ReflectClass.propertyNames` enumerates declared types/prototype getter descriptors without domain construction.
Presentation/path owners load after composition, including when the public binding API was imported before bootstrap.
Missing reflection composition fails explicitly. Labels/order reuse class/property display metadata and include fields
beyond `List` columns. Unknown cardinality/inverse/targets remain explicit. Logical inverse/N-N descriptions contain
no physical link table. Canonical opaque relation ids survive inheritance and different traversal paths.
Component/composite facts add only one unambiguous inverse and known singular/plural cardinality pairs.

The public browser `property-select-metadata.js` exports `HttpMetadataProvider` and its options. The normal browser
composition root registers that asset; its dedicated API import has no activation side effect or server imports.
It uses same-origin credentials, forwards abort signals and checks cancellation after JSON parsing. The selector's
existing generation check rejects late results even when the real HTTP request continues. There is no business-value
read, SQL, search ranking, host geometry or session persistence in these adapters.

## Executed validation

Run from `/home/baptiste/itrocks/showtime`; exact argv, exits, output paths and SHA-256 values are in
[commands.json](../evidence/L1-META/commands.json). Reproduce the recorded checks with:

```bash
python3 node_modules/@itrocks/property-select/docs/orchestration/evidence/L1-META/run-checks.py
python3 node_modules/@itrocks/property-select/docs/orchestration/evidence/L1-META/review.py
```

The runner records every outcome, including the known failed control checks; its own completion is not an all-pass
verdict. It requires the owned synthetic server below. No installation or implicit download occurs.

- **PASS** framework build and existing framework suite, including public positive/negative TypeScript fixtures;
  [build](../evidence/L1-META/build.txt), [suite](../evidence/L1-META/framework-test.txt).
- **PASS** five explicit META tests: inherited/optional/collection/inverse/N-N facts; presentation beyond initial List;
  identical enumeration/full-path access; deep/two-route/cyclic/ambiguous paths; grant changes; async policy abort;
  unambiguous versus ambiguous composition facts; no domain constructor/getter reads;
  [assertions](../evidence/L1-META/metadata-test.txt).
- **PASS** nine existing SQL/framework binding assertions on the absolute Node test path;
  [output](../evidence/L1-META/existing-projection-absolute.txt). The card's relative Node command has the previously
  documented Node 24 discovery failure under `node_modules`, retained in
  [relative output](../evidence/L1-META/existing-projection-test.txt); no assertion is skipped.
- **PASS** Chromium `151.0.7922.34`, installed Playwright, `chromiumSandbox: true`, real public assets and Fastify
  requests. Context/root/deep/cyclic/N-N resolution, 403 forbidden/ancestor/unknown-root refusals, malformed/ambiguous
  400 responses, GET-only actions, catalogue/advice changes and serialization pass. A started network request fails
  with `net::ERR_ABORTED`; a separate delayed real HTTP 200 is discarded after a newer navigation commits `delivery`.
  The fixture reports zero guarded business read/search/count/select attempts and zero constructors/getters.
  No page exception occurs; [browser proof](../evidence/L1-META/browser.json).
- **PASS** offline framework package inventory, public CJS/browser/declarations/docs, direct dependency declaration,
  browser graph and application preservation; [inventory](../evidence/L1-META/package-files.json),
  [review](../evidence/L1-META/review.json), [checkpoints](../evidence/L1-META/checkpoints.json).
- **FAIL** fresh `/country` and documented owned stack status, reproduced below. Metadata contracts pass, but this
  required real framework control failure prevents a completed L1-META gate.

META-01–03 provider observations pass; independent V3 and search-cycle observations remain `NOT_RUN`.
META-04 catalogue-change capability passes; persisted branch/query/advice restoration remains `NOT_RUN` until L4/V4.
Rendered selector, pane, list-column integration, keyboard and touch cases retain their later stages.

## Reproducible defect and correction handover

`list` is unchanged at `005702a6a0cd49740cdea37c2e5150dc80fb670b` / `0.8.0`.
`Feed.getParams()` in `list/src/feed.ts` assigns `this.offset = +request.data.offset`; an absent offset becomes `NaN`.
The current S07 MySQL legacy search forwards that offset to the strict projection builder, which rejects it with
`unsupported-option`. The server returns 500 before rendering the country list. `/country?offset=0` returns 200 and
both synthetic countries. This is a fresh-runtime integration defect; the inherited server still serving 13319 does
not establish behaviour of newly loaded code.

Expected: `/country` returns 200 with the normal first synthetic page and a valid zero offset.
Observed: 500 `Internal Server Error`; explicit `offset=0` returns 200 with `Recipe France`.
The [driver](../evidence/L1-META/defect-offset.mjs) intentionally fails its expected-200 assertion;
[output](../evidence/L1-META/defect-offset.txt) and
[owned status failure](../evidence/L1-META/owned-status.txt) preserve the reproducer.

PLAN adds `FIX-L1-META-1` followed by `RETEST-L1-META-1`, rewires L2-UI to that retest and retains the failed task.
Correction owns list pagination and regression tests; the fresh verifier must independently replay the control route,
metadata contracts and browser transport on the corrective commit. No list/MySQL product change is smuggled into this
metadata delivery. The current source is an attributable checkpoint, not a completed integration gate.

## Environment, ownership and SOLID

The inherited canonical app PID has no matching `app.owner.json`; targeted stop correctly refused it and duplicate
start refused its existing reservation. No signal or PID removal occurred. A distinct owned app used port `13619`
and `/tmp/property-select-L1-META`, with the existing synthetic database on 13316. Its `mysql.sock` is only a link to
the canonical synthetic socket for status; L1-META does not own or stop the database. The test-only launcher now
accepts `PS_FRAMEWORK_INITIALIZER`, loading owner fixtures through public `beforeFrameworkRun` after binding.

Successful launch command:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-L1-META PS_APP_PORT=13619 \
PS_FRAMEWORK_INITIALIZER=node_modules/@itrocks/framework/test/metadata-fixture.cjs \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs app
```

Targeted cleanup uses the same documented `control.mjs stop-app` with `PS_ENV_DIRECTORY` set to that directory.
The owned app is stopped after final proof; inherited listeners and the synthetic database remain available.
See [environment](../evidence/L1-META/environment.json) for ownership paths and raw log checksum, and
[cleanup](../evidence/L1-META/cleanup.txt) for the successful targeted stop. No permission or browser sandbox setting
was altered; local service/browser calls used the normal approval mechanism.

SOLID review: provider owns authorised descriptions, configuration/policy binding owns request context, actions own
HTTP serialization and the browser adapter owns fetch transport. Consumer-owned `MetadataProvider` stays in selector;
public reflection/presentation/route ports are reused; SQL/storage/list/table/home responsibilities remain separate.
Static, asynchronous and HTTP providers substitute in the controller; fetch is replaceable. No new infrastructure
package, business-data hydration or duplicated table geometry is introduced.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`, with only its two original AD files, absent working
files and staged blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. No application source/document/commit, install/update, implicit-download
`npx`, `vcs-modules`, push, tag or publication occurred. No lockfile exists in the modified owners.
Authorised local commit wording: framework `Serve authorised property metadata`,
`Keep metadata source whitespace clean`, `Keep metadata binding documentation readable`,
`Document application-relative metadata roots`; tracking `Record metadata adapter and control route regression`.

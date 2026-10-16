# Independent scalar metadata and search retest

## Verdict and checkpoints

**DONE / PASS**, 16 October 2026. Fresh independent checks close [L3-01](../defects/L3-01.md).
The original [L3 failure](L3.md) remains historical. V3 is ready and still owns broader search acceptance;
session, gestures and final acceptance retain their later gates.

The verifier is distinct from the L3 author and FIX-L3-1 corrector; no sub-agent or subsequent task was started.
Requested profile: `gpt-6.1-sol` / `high`; parent dispatch evidence is authoritative.
Independent runtime model/effort attestation is unavailable.

All affected framework repositories were initially clean:

- Reflect `41e6e672f935bf1dd88ec61e2fe0be35c405af9a`, version `0.3.1`.
- Reflect-path `bc6e4bdd17b884d93ecc72451078896c9a119696`, version `0.3.2`.
- Framework `e5d976aafce2c09266381c643d2cfe6788eb0014`, version `0.10.3`.
- Property-select `b1b47f985a6ecea0dba00cc73193618a40074581`, version `0.4.1`.

This tracking/test-only task increments property-select to `0.4.2` on the first edit, then `0.4.3` for the
post-commit evidence-reporter correction described below, following the handbook patch rule.
Product source, exports, dependency declarations and the other owners are unchanged.
[Initial status/index records](../evidence/RETEST-L3-1/baseline.json) retain staged, unstaged and untracked information.

## Independent observations

[Independent driver](../environment/checks/RETEST-L3-1.mjs),
[HTTP/SQL/browser assertions](../evidence/RETEST-L3-1/results.json): **133 PASS**.
The driver uses real public HTTP actions, installed `Mysql.select()` and sandboxed Chromium.
The supplementary scalar root reuses readable owner fixtures through the real composed adapter;
its [initializer](../environment/checks/RETEST-L3-1-initialise.cjs) adds no provider or product behaviour.

- Root `invoice.issuedAt` is terminal, has no target/relation and resolves with its original descriptor.
  Direct context and `getTime`/`toISOString` traversal return HTTP 400 `invalid-path`, never HTTP 500.
- Mandatory, optional and nullable Date values, arrays, generic arrays and record values are terminal and selectable.
  Scalar multiplicity is `one`; Date collections retain `many`. Optional metadata remains optional.
  Singular method traversal rejects with `terminal-traversal`; collection method traversal rejects with
  `unknown-target`, mapped to HTTP 400. No collection has a domain target.
- Seven additional negative public TypeScript paths reject native Date methods, including a nested optional Date.
  Positive scalar, collection, domain and Date value types compile. Existing owner type suites also pass.
- Domain paths, scalar types, nullable values and accumulated multiplicities remain valid.
  One-to-many/many-to-one and N-N reciprocal inverse identities survive through actual HTTP metadata contexts.
  Metadata fixtures report zero constructor/getter reads; business records are not a metadata oracle.
- One real bounded SQL projection returns roots 1–4 as Date instances/null with the expected calendar components.
  Invalid Date-method projection rejects before another SQL statement.
- Trusted browser input fills `country name`. Search finishes **`limited`** under the existing budget with five
  matching complete Country.Name paths, including both customer and delivery-address routes.
  It never requests an `issuedAt` context. Result-segment navigation retains the query and leaves context usable.
- Clearing and selecting `issuedAt` adds one column, displaying `01/01/2026` and an empty nullable cell.
  The `/country` control displays two synthetic rows. Browser warnings/errors, page exceptions, failed metadata
  requests, failing HTTP responses and unexpected request failures are empty.
- A raw Chromium `requestfailed: net::ERR_ABORTED` event accompanies the ordinary list-save navigation.
  Its response is explicitly verified as HTTP **204**, with the exact expected `columns` query; the raw event is
  retained. This successful bodyless response is already documented by [V2](V2.md).
  No metadata failure, unexpected abort or console/page error is excluded from the health assertions.

Both screenshots were visually inspected: the full paths are readable in the search pane, and Date values/nulls
render in the selected column. [Search](../evidence/RETEST-L3-1/integrated-search.png),
[Date selection](../evidence/RETEST-L3-1/date-selected.png).

## Commands and supplementary regression

Commands run from `/home/baptiste/itrocks/showtime`, using installed tools only.
[Exact command records](../evidence/RETEST-L3-1/commands.json) and individual text logs preserve outputs.

```bash
npm --prefix node_modules/@itrocks/reflect run build
npm --prefix node_modules/@itrocks/reflect run build:test
npm --prefix node_modules/@itrocks/reflect-path run build
npm --prefix node_modules/@itrocks/reflect-path run build:test
npm --prefix node_modules/@itrocks/framework test
npm --prefix node_modules/@itrocks/property-select test
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/RETEST-L3-1.mjs
node node_modules/@itrocks/property-select/test/browser-search.mjs
```

Reflect **9 tests**, reflect-path **13 tests**, framework **4 complete test files** plus **6 explicit META tests**,
and property-select **24 tests** pass after rebuilding actual owner outputs.
The seven independent negative type checks pass with installed TypeScript and `--ignoreConfig`; the full invocation
is in the command record. No application rebuild is required for these unchanged application sources.

The unchanged original author browser reproducer passes **41/41**, with fresh redirected evidence, directory and ports:
[observations](../evidence/RETEST-L3-1/author-replay/browser-results.json).
That replay used tracking version `0.4.2`; the final `0.4.3` only corrects independent evidence reporting.
Its environment overrides are recorded in the command record, together with the actual launch/status/stop records.
This supplementary replay does not replace the independently authored assertions.

Initial harness diagnostics remain available. The first expected `invalid-path` for a Date collection method;
the published runtime contract requires explicit rejection and the owner test permits `unknown-target`.
The harness now asserts that exact HTTP 400 classification for collections while retaining the stricter singular check.
An initial progressive-input run cancelled obsolete searches, and early navigation observed the bodyless save event.
The final driver waits for completed work and records response status before asserting browser health.
[Initial expectation](../evidence/RETEST-L3-1/initial-harness-expectation.json),
[input timing](../evidence/RETEST-L3-1/initial-browser-timing.json),
[save diagnostic](../evidence/RETEST-L3-1/bodyless-save-diagnostic.json).
The initial standalone TypeScript invocation required the installed compiler's `--ignoreConfig` option;
the corrected invocation passes without changing any assertions.
The initial evidence reporter compared JSON key order and falsely labelled the successful SQL descriptor assertion
as FAIL. It now uses `isDeepStrictEqual`, matching the unchanged runtime assertion, and the entire independent driver
passes again with all 133 recorded statuses PASS.
[Reporter diagnostic](../evidence/RETEST-L3-1/reporter-order-diagnostic.json).

## Resources, review and preservation

Independent URL: `http://127.0.0.1:13861/property-select-invoice`, control `/country`.
Owned environment: `/tmp/property-select-RETEST-L3-1`; author replay app **13863**, standalone **13864**,
directory `/tmp/property-select-RETEST-L3-1-author`. Both reuse synthetic database **13316**, without reset or writes.
The controller verifies process identity; `finally` stops only owned services. PID/owner records are gone and all
three task-owned listener ports are closed. Inherited services and the database are preserved.

Playwright `1.62.1`, Chromium `151.0.7922.34`, headless with `chromiumSandbox: true`.
Independent input uses mouse and trusted fill at 1280 × 720; the author replay additionally checks 768 × 900,
390 × 844 and 844 × 390. No physical-device or new gesture acceptance is claimed.
The restricted socket probe failed with `listen EPERM`; normal escalation approved the same local check.
Sandbox and permission settings were preserved. No automatic-approval rejection remains.

[Review](../evidence/RETEST-L3-1/review.json) records current public export targets, offline dry-run inventories,
generated CJS/ESM/declaration checksums, exact corrective diff archives and showtime preservation.
Large raw inventories/diffs are retained at `/tmp/property-select-RETEST-L3-1-review/` with their checksums.
SOLID review: reflect owns scalar classification, reflect-path owns traversal/multiplicity/types, framework owns
metadata adaptation and HTTP errors, and storage/transformers retain conversion. Narrow ports, substitution,
domain inverses and dependency direction are preserved. The selector contains no Date workaround or hidden error.
Tests stay outside runtime entries; this delivery changes tracking/test resources only.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4` with its two original `AD` entries.
Index blobs remain `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`; both working files remain absent.
No application code/docs/commit, install/update, implicit-download npx, vcs-modules, push, tag or publication occurred.

Proposed and authorised local commit: `Verify scalar metadata and integrated search recovery`.

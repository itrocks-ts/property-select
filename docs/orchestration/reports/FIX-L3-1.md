# Native Date metadata correction

## Verdict and checkpoints

**DONE / PASS (author)**, 16 October 2026. The correction for [L3-01](../defects/L3-01.md) passes its owner,
real HTTP, database and browser checks. The defect remains blocking until independent `RETEST-L3-1` passes;
V3 and the later gates are not accepted by this author report. L3's original failing evidence is preserved.

All four owners were initially clean. Patch versions were applied against their HEAD on the first edit:

| Owner               | Starting version   | Delivered version   | Corrective commit                            |
| ------------------- | ------------------ | ------------------- | -------------------------------------------- |
| `reflect`           | `0.3.0`            | `0.3.1`             | `41e6e672f935bf1dd88ec61e2fe0be35c405af9a`   |
| `reflect-path`      | `0.3.1`            | `0.3.2`             | `bc6e4bdd17b884d93ecc72451078896c9a119696`   |
| `framework`         | `0.10.0`           | `0.10.3`            | `e5d976aafce2c09266381c643d2cfe6788eb0014`   |
| `property-select`   | `0.4.0`            | `0.4.1`             | Tracking delivery containing this report     |

Starting commits: reflect `8e42bd2009a6ba4e708ae20ca519fc44681ebbb7`, reflect-path
`7d1534eece60d23339f2ad8355d49c8d5074c08d`, framework `7a302cd606ff007276038ada4d12fc0bd2161d54`,
selector `1ddb156fe92edbb7bbae8a43451bbcc47d4eff9d`.
Tests exercised the delivered product source before owner commits; subsequent fixture edits only aligned whitespace.
The final reflect-path declaration build includes the narrower Date exclusion in collection and record element types.
Framework source was committed at `d5024b5ac28c826ca01d576c0f0e3c6911279d53` / `0.10.1`. Two later
documentation-only commits correct line wrapping and apply the handbook patch rule at each new committed HEAD,
ending at `0.10.3`; runtime source/tests are identical. Browser/SQL checks used the `0.10.1` runtime; the full
framework suite passes again at final `0.10.3`. No history was rewritten.
Public exports, generated files and source checkpoints are recorded in [review.json](../evidence/FIX-L3-1/review.json).
Dependencies remain `latest`, and no owner has a tracked lock requiring synchronisation.

Requested profile: `gpt-6.1-sol` / `high`. The parent owns actual dispatch metadata; this executor cannot independently
attest runtime model or reasoning effort. No sub-agent or later task was started.

## Correction and boundary review

`reflect/src/relation-fact.ts` now recognises native `Date` as a terminal within its existing target-fact abstraction.
It retains `TypeType` and its resolved constructor, which conversion consumers need. Nullable/optional union handling,
collection elements, deferred domain targets and explicit declaration facts continue through the existing algorithm.
There is no selector or synthetic-model workaround, new type parser, fixture filtering or record change.

The affected `reflect-path` owner also required a patch: terminal TypeType metadata retains singular multiplicity,
while domain/unresolved relation facts keep their own multiplicity. A Date final path remains selectable, and
`issuedAt.getTime` rejects with `PropertyPathError('terminal-traversal')`. Static path types exclude native Date
methods for direct, optional/nullable, array, generic array and record values. Existing recursive domain paths,
collection multiplicity and ambiguity/unknown errors remain covered.

The framework provider rejects known terminal contexts with `MetadataError('invalid-path')` before enumerating a class.
Its existing HTTP action maps this to `400 { error: 'invalid-path' }`. Unknown targets keep `unknown-target`;
permission checks still precede metadata inspection. The public root catalogue now exposes `issuedAt` as terminal,
without target/relation metadata, and its resolve endpoint remains successful.

SOLID review: reflection owns relation classification, reflect-path owns path multiplicity/types and framework owns
HTTP metadata adaptation. Selection/conversion stay with the existing storage and transformer owners. Narrow public
ports, substitutable reflection contexts, deferred targets, inverse/cardinality metadata and selector error handling
are preserved. No new public export or infrastructure package is needed. Product source in property-select is unchanged.

## Executed validation

Commands run from `/home/baptiste/itrocks/showtime`; complete command records are in
[commands.json](../evidence/FIX-L3-1/commands.json). Every listed final check passes:

- Reflect CJS/ESM build, both existing test build scripts and **9 Node tests**: mandatory/optional/nullable Date and
  Date collections are terminal; CJS/ESM imports, inheritance, real business classes, deferred targets, explicit
  inverse/cardinality and zero constructor/getter reads remain valid.
  [Build](../evidence/FIX-L3-1/reflect-build.txt), [tests](../evidence/FIX-L3-1/reflect-test.txt).
- Reflect-path build, public type checks and **13 Node tests**: scalar dates retain `one`, Date collections retain
  `many`, native traversal rejects, and six negative typed Date-method paths are rejected by TypeScript.
  Existing deep/inverse/N-N/optional/deferred paths pass.
  [Build](../evidence/FIX-L3-1/reflect-path-build.txt), [tests](../evidence/FIX-L3-1/reflect-path-test.txt).
- Framework full `npm test`: build, public fixture types and all **4 test files** pass. Its **6 META contracts** also
  run explicitly, including date context/path rejection, unchanged authorisation and unknown-target behaviour.
  [Full suite](../evidence/FIX-L3-1/framework-test.txt), [META tests](../evidence/FIX-L3-1/metadata-test.txt).
- Full selector `npm test`: build, public TypeScript checks and **24 tests** pass, preserving search ranking,
  cancellation, bounded traversal, inverse policy and state distinctions.
  [Selector suite](../evidence/FIX-L3-1/selector-test.txt).
- The exact original `test/browser-search.mjs` reproducer passes **41/41 assertions** using trusted browser inputs:
  standalone search/focus/navigation/responsive checks, integrated Country.Name and country control all pass.
  Native Date metadata is terminal, with **zero HTTP errors, warnings or page exceptions**.
  [Browser observations](../evidence/FIX-L3-1/reproducer/browser-results.json),
  [command output](../evidence/FIX-L3-1/browser.txt).
- A separate focused author driver passes **18 browser assertions**: root Date descriptor, no automatic Date context
  request, direct date-context and native-method requests return the documented HTTP 400, Date resolve returns 200,
  integrated matching full path remains available, and clicking Date adds its converted column. The first two scoped
  rows render `01/01/2026` and the empty null value. Browser health remains clean.
  [Driver](../environment/checks/FIX-L3-1-browser.mjs),
  [results](../evidence/FIX-L3-1/direct/results.json), [screenshot](../evidence/FIX-L3-1/direct/date-column.png).
  The screenshot was visually inspected: dates are readable and `issued at` has no navigation chevron.
- **6 real SQL assertions** pass through installed `Mysql.select()`: Date selection stays scalar, original roots
  1–4 retain Date instances/components and null, and invalid Date-method projection rejects before another query.
  One bounded read-only statement and the fresh MySQL journal excerpt are retained.
  [Driver](../environment/checks/FIX-L3-1-date.mjs), [results](../evidence/FIX-L3-1/date-sql.json).
- Four offline dry-run package inventories, manifest export targets/generated files, unchanged public entries,
  documentation widths, complete owner diffs and `git diff --check` pass. Tests remain outside published runtime.
  Framework browser outputs still resolve the installed selector. [Review](../evidence/FIX-L3-1/review.json).

The integrated search status is **`limited`**, with five matching Country.Name paths, because the unchanged depth budget
bounds the cyclic domain graph. It finishes without metadata failure. This report does not claim an exhaustive search
or silently relabel limited as complete.

The first framework draft also rejected unresolved metadata as invalid-path. Its existing unknown-target regression
caught that, and the delivered guard preserves unknown-target. An initial relative Node test path was not resolved;
the final runs use the documented absolute path. These corrected author iterations did not weaken assertions.

## Resources, permissions and preservation

Both browser runs use installed Playwright `1.62.1`, Chromium `151.0.7922.34`, headless with
`chromiumSandbox: true`. The original reproducer covers 1280 × 720, 768 × 900, 390 × 844 and 844 × 390;
the focused Date driver uses desktop 1280 × 720. This task makes no physical-device or new touch-gesture claim.

Original reproducer ownership: `/tmp/property-select-FIX-L3-1`, app **13849**, standalone **13850**.
Focused driver ownership: `/tmp/property-select-FIX-L3-1-direct`, app **13851**.
Both use the existing synthetic database **13316**, without reset/schema/data changes. Status probes and exact owned
launch/stop commands are in the browser results. Every owned app/standalone process stops in `finally` through the
identity-checking controller; no inherited service or database process is stopped.

Restricted initial browser launch failed with `spawnSync git EPERM`. The SQL probe rejected localhost with `EPERM`.
Normal `require_escalated` approval allowed those same local checks. The browser sandbox and permission settings were
preserved. No failed automatic approval remained. No npm install/update, implicit-download npx, vcs-modules,
push/tag/publication or application code/docs/commit was performed.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4` with only its original two `AD` entries:
`audit-itrocks-dependencies.json` staged blob `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`audit-itrocks-dependencies.txt` staged blob `de960a87ea9b4f6eb1cece85ab32596baef11fcd`; both working files remain
absent.

Authorised local commit subjects: `Keep native dates out of domain relations` (reflect),
`Treat Date paths as terminal scalars` (reflect-path), `Reject terminal metadata contexts with a path error` (framework)
and `Record scalar Date metadata correction` (tracking). Framework documentation follow-ups are
`Keep scalar metadata documentation within line limits` and `Wrap the documented scalar context response`,
each containing only `package.json` and `docs/property-select.md`.
Independent `RETEST-L3-1` is the next required gate.

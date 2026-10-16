# Independent frozen column reveal retest

## Verdict and tested checkpoints

**PASS**, 16 October 2026. The generic V2-TABLE gate is cleared through this independent retest, and
[V2-TABLE-1](../defects/V2-TABLE-1.md) is closed. L2-LIST is ready; this verifier starts no subsequent task.
The historical failed gate, original assertions and failed evidence remain preserved.

Initial owner checkouts were clean:

- Table: `7537cf58863ad0efc5c3edb2b15a0537d54568df`, `0.3.1`, unchanged throughout verification.
- Tracking: `b1bbb83d5c92ddf3ccf616dfd0530a3628bdf357`, `0.2.6` → `0.2.7` for verifier resources and evidence.
  Runtime sources are unchanged; browser records identify that initial HEAD and the tested pending patch version.
- Showtime: `d7ca948292e28c248bdcc0283724e47c2a82bba4`, `0.0.6`, unchanged with the two original AD entries.

This verifier is distinct from the correction author. Requested profile: `gpt-6.1-sol` / `high`; the parent records
actual dispatch. Effective executor model/effort is not independently attestable. No sub-agent was launched.
No SQL/hydration ambiguity requiring Astra arose in this generic table gate.

## Independent observations

The historical product diff from `c7c9a65fb5497b1e76d809622eb0d3f4e44f1f97` was reviewed in full, together with
manifests, author/failed reports and current public outputs. Freeze now reads rendered sticky cells and removes its
previous managed rules before measuring natural positions; reveal maximises fitting/wide visibility with minimal
movement. The fixture's product source and ordinary widths are unchanged.

All browser runs use installed Chromium **151.0.7922.34**, Playwright **1.62.1**, Node **24.0.1**, and
`chromiumSandbox: true`. Four mouse/keyboard contexts: **1280 × 720**, **768 × 900**, **390 × 844**, **844 × 390**.
Portrait requests reduced motion; full/independent landscape runs request dark colours. The original minimal reproducer
uses its unchanged default light settings. Seed: public opaque ids, synthetic A1..D2 rows, selected first row,
frozen Select/Actions. URL: `http://127.0.0.1:13782/table-fixture`.

- [Historical full replay](../evidence/RETEST-V2-TABLE-1/full/results.json): **182 PASS**, zero failures.
- [Header-backed full itinerary](../evidence/RETEST-V2-TABLE-1/header/results.json): **182 PASS**, zero failures.
- [Exact colgroup identity/order itinerary](../evidence/RETEST-V2-TABLE-1/colgroup-order/results.json): **182 PASS**.
  Original `col` nodes receive test-only identity attributes before interactions. An observer labels newly inserted
  cols once; subsequent reorder/delete assertions compare retained identities with exact expected header/all-row order.
  This supplements the historical colgroup-count assertions without changing layout or product code.
- [Original reproducer](../evidence/RETEST-V2-TABLE-1/reproducer/reveal-reproducer.json): **4 PASS** through ordinary
  Add metric and duplicate clicks. Visible/expected width: desktop `218.140625/218.140625`, narrow `208/208`,
  portrait `194/194`, landscape `208/208` px. The historical 82 px masking is absent.
- [New independent oracle](../evidence/RETEST-V2-TABLE-1/independent-final/results.json): **2,362 PASS** assertions
  and **168 separate raw measurements**, spanning 24 viewport/shape/frozen-side combinations. Both colgroup and header
  configuration, left/right/both freeze, loaded/repeated-reset/wide phases and both reveal directions pass.
  Each header and body row is measured against its own rendered sticky cells and the actual scroll viewport.
  Expected width is the minimum of the target width and available inner width; public bounds are checked only as an
  additional observation. Reveal repeats cause no further scrolling; focus and selected rows remain intact.
- All complete itineraries pass immediate real header/body placeholders, exact order and asynchronous replacement,
  slow rapid duplicates, one commit/load, creation failure without insertion, value failure/retry without recommit,
  provisional cancellation and ignored late responses after reset/disposal. Flash reaches all cells and clears;
  animation/theme/reduced-motion checks pass. Full reload restores the six-column baseline and controls remain usable.
- Native header reorder/delete, frozen-origin protection, one sort listener after repeated reset and asynchronous
  header replacement during a live drag pass at desktop, narrow and landscape sizes in both shapes. The inherited
  itinerary exercises the remaining non-drag cases at portrait size. No portrait/touch drag acceptance is inferred.
- All recorded inputs are trusted browser mouse/keyboard events. Warning/error console entries, page exceptions,
  failed requests and HTTP errors are empty in all complete and independent runs.

The independent oracle deliberately sets only one isolated header's minimum width to 1400 px for the wide case.
Header/frozen-side variants use test-only response transformations. Supplementary public `reveal()` calls and direct
scroll positioning are explicitly labelled in the source; they are distinct from ordinary fixture product clicks.
The fixture controls, retries, resets and header gestures use the browser input pipeline.

Before/flash/after screenshots are retained per full itinerary. Desktop before/after, narrow header-backed after,
portrait reduced-motion flash and dark landscape flash were visually inspected. The latter portrait image shows the
full available 194 px between Select/Actions; text can exceed that available width as expected.
The first independent run retained the same passing measurements with measurement records mixed into its record
count. The final source separates 168 measurements from 2,362 actual assertions and reruns into `independent-final/`;
no criterion or product behaviour changed. The earlier passing evidence remains available under `independent/`.

## Builds and public delivery checks

[Table build](../evidence/RETEST-V2-TABLE-1/table-build.txt),
[tracking build](../evidence/RETEST-V2-TABLE-1/selector-build.txt) and
[application build](../evidence/RETEST-V2-TABLE-1/application-build.txt): **PASS**.
[43 table Node tests](../evidence/RETEST-V2-TABLE-1/table-tests.txt) and
[14 selector tests with public typecheck](../evidence/RETEST-V2-TABLE-1/selector-tests.txt): **PASS**.
[Artifacts](../evidence/RETEST-V2-TABLE-1/artifacts.json),
[public imports](../evidence/RETEST-V2-TABLE-1/public-imports.txt),
[table inventory](../evidence/RETEST-V2-TABLE-1/table-pack.json) and
[selector inventory](../evidence/RETEST-V2-TABLE-1/selector-pack.json): **PASS**.
Public table JS/declarations/CSS are present and packed, source/demo/tests excluded. Selector CJS/browser/type/HTML/CSS
outputs resolve to the owner checkout. Generated outputs retain the established ignored-file convention.
The selector dry-run emits its existing gitignore-fallback advisory; browser health remains empty.

Commands run from showtime unless an owner directory is specified:

```bash
recipe=node_modules/@itrocks/property-select/docs/orchestration
PS_ENV_DIRECTORY=/tmp/property-select-RETEST-V2-TABLE-1 PS_STANDALONE_PORT=13782 \
  node "$recipe/environment/control.mjs" standalone
npm --prefix node_modules/@itrocks/table run build
npm --prefix node_modules/@itrocks/property-select run build
npm run build
npm --prefix node_modules/@itrocks/property-select test
export PS_TABLE_URL=http://127.0.0.1:13782/table-fixture
PS_TABLE_OUTPUT="$recipe/evidence/RETEST-V2-TABLE-1/full" \
  node "$recipe/environment/checks/V2-TABLE.mjs"
PS_TABLE_OUTPUT="$recipe/evidence/RETEST-V2-TABLE-1/reproducer" \
  node "$recipe/environment/checks/V2-TABLE-reveal.cjs"
node "$recipe/environment/checks/RETEST-V2-TABLE-1-header.mjs"
PS_RETEST_SHAPE=colgroup PS_TABLE_OUTPUT="$recipe/evidence/RETEST-V2-TABLE-1/colgroup-order" \
  node "$recipe/environment/checks/RETEST-V2-TABLE-1-itinerary.mjs"
PS_TABLE_OUTPUT="$recipe/evidence/RETEST-V2-TABLE-1/independent-final" \
  node "$recipe/environment/checks/RETEST-V2-TABLE-1.mjs"
cd node_modules/@itrocks/table
node --test --test-isolation=none test/*.test.mjs
npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-RETEST-V2-TABLE-1-pack-cache
```

Selector inventory used its own owner directory with `npm pack --dry-run --json --ignore-scripts` and cache
`/tmp/property-select-RETEST-V2-TABLE-1-selector-pack-cache`. Syntax, whitespace and evidence-checksum checks pass;
[checksums](../evidence/RETEST-V2-TABLE-1/checksums.json) identify executed drivers and retained evidence.

## Ownership, preservation and scope

Existing ownership records were inspected before launch. V2-TABLE 13762 and the corrector 13772 have no live ownership
records; the original author 13752 record remains untouched. A normal approved local port probe confirmed 13782 free.
The fresh launcher directory is `/tmp/property-select-RETEST-V2-TABLE-1`; its
[ownership record](../evidence/RETEST-V2-TABLE-1/standalone.owner.json) identifies the exact process and arguments.
No database is needed. Chromium/server commands used normal escalation with the browser sandbox retained.
The final [HTTP check](../evidence/RETEST-V2-TABLE-1/http.txt) returned 200; identity-checked
[shutdown](../evidence/RETEST-V2-TABLE-1/stop.txt) passed and removed only this instance's PID/owner records:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-RETEST-V2-TABLE-1 \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs stop-standalone
```

Showtime retains staged blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`, both working files absent. No application code/docs/commit,
product edit, installation/update, implicit-download npx, vcs-modules, permission/sandbox change, push or publication.

SOLID review: table owns DOM movement, sticky geometry, reveal and lifecycle. Addition continues using existing narrow
public freeze/reorder ports. Consumer callbacks own identity, data and notifications and remain substitutable.
The correction adds no selector/list/framework/SQL dependency. The verifier derives its independent oracle from DOM
measurements; it supplies no alternate product geometry and accesses no protected product methods.

Combined list/SQL/external transport and genuine touch-product acceptance remain at their later gates. Phone-sized
mouse contexts establish no physical phone or touch acceptance. Native keyboards, physical edge gestures and system
interruptions remain unverified. Proposed local commit: `Confirm frozen column reveal independently`.

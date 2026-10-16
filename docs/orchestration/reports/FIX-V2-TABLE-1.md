# Reveal columns between frozen table edges

## Verdict and checkpoints

**DONE / author PASS**, 16 October 2026. The original V2-TABLE-1 reproduction and the complete author/verifier drivers
pass at all four required sizes. V2-TABLE remains **NEEDS_FIX** until a distinct RETEST-V2-TABLE-1 verifier passes.
L2-LIST remains blocked. This report covers only the correction task.

Initially clean owners:

- Table: `c7c9a65fb5497b1e76d809622eb0d3f4e44f1f97`, `0.3.0` → `0.3.1`.
  Final product tested: **`7537cf58863ad0efc5c3edb2b15a0537d54568df`**, clean after its local commit.
- Tracking: `93139049d0a178dcf4b0a0e3e5f1cbf1f0619fd1`, `0.2.5` → `0.2.6` for test resources, report and matrix.
  Browser records identify that initial tracking HEAD plus the pending `0.2.6` files;
  no tracking runtime source changed.
- Showtime: `d7ca948292e28c248bdcc0283724e47c2a82bba4`, `0.0.6`, unchanged with exactly its initial two AD entries.

Requested profile: `gpt-6.1-sol` / `high`; parent dispatch metadata is authoritative. The executor cannot independently
attest runtime model/effort. No sub-agent was launched. No SQL/hydration ambiguity required Astra.

## Correction and contract review

`TableFreeze.visibleInnerRect()` reads the rendered header cells, falling back to body cells, for horizontal sticky
boundaries. Configuration still comes from the existing colgroup/header/body configuration. Moving one rectangle edge
retains its original opposite edge; header/footer bounds remain coherent. Both left and right freeze work.

Freeze refresh removes its previous applied rules before measuring natural cell positions. The added header-backed
browser coverage exposed stale sticky offsets during addition/loading refresh; measuring natural positions fixes
that case while preserving the public `refresh()`/`refreshStyleSheets()` collaboration.

`TableColumnAdd.reveal()` scrolls fitting columns fully between the actual boundaries. Wider columns use the maximum
available area in either direction and stay still when already covering it. An empty inner area produces no scroll.
Opaque ids, insertion order and notification timing retain their existing contracts. The fixture source and widths
are unchanged. The additional wide case temporarily widens one header in its isolated browser page to exercise the
required over-wide geometry; it does not change the shared fixture.

SOLID review: table owns sticky geometry, DOM movement and reveal. Addition uses the existing narrow public freeze and
reorder ports. Consumer callbacks still own data, identity and notifications. Public signatures remain substitutable;
no geometry is copied into selector/list/framework. Refresh only replaces its own managed rules and leaves other
plugin state intact. No external transport, SQL, hydration or application responsibility was introduced.

## Final validation

Chromium `151.0.7922.34`, installed Playwright `1.62.1`, Node `24.0.1`, `chromiumSandbox: true`. Real trusted mouse and
keyboard input runs at 1280 × 720, 768 × 900, 390 × 844 and 844 × 390. Portrait requests reduced motion and the complete
browser drivers use dark landscape. Each driver writes a separate correction directory; historical V2-TABLE proof is
unchanged. Original visibility assertions remain intact.

- [43 Node tests](../evidence/FIX-V2-TABLE-1/table-tests.txt): PASS, including all existing reorder/feed/addition tests
  and 23 new geometry/refresh cases. Colgroup/header/body shapes, zero/left/right/both and multiple frozen columns,
  header/footer bounds, fitting/wide reveal in both directions and minimal scrolling are covered.
- [Author driver](../evidence/FIX-V2-TABLE-1/author/results.json): **127 PASS**.
- [Original V2 driver](../evidence/FIX-V2-TABLE-1/verifier/results.json): **182 PASS**, zero failed assertions.
  This is an author rerun of the independent driver's assertions, not independent retest acceptance.
- [Original minimal reproducer](../evidence/FIX-V2-TABLE-1/reproducer/reveal-reproducer.json): **4 PASS**.
  Visible/expected: desktop `218.140625/218.140625`, narrow `208/208`, portrait `194/194`, landscape `208/208` px.
- [Additional geometry driver](../evidence/FIX-V2-TABLE-1/geometry/results.json): **144 PASS** across 24 configurations
  combining four sizes, colgroup/header shapes and left/right/both freeze. Loaded, repeated-reset and wide phases
  reveal first/last ordinary columns through trusted clicks on fixture controls calling the public contract.
  Additional checks require positive inner area, correct sticky edges and agreement with the reported public bounds.
- Complete drivers cover exact DOM/colgroup/body order, rapid duplicates, focus/typed value/selection, sort suppression,
  deletion/reorder, active drag during asynchronous header replacement, failure/retry, reset/disposal and late values.
  Flash/theme/reduced-motion assertions pass; browser warning/error, exception, failed-request and HTTP errors
  are empty.
- [Table build](../evidence/FIX-V2-TABLE-1/table-build.txt),
  [tracking build](../evidence/FIX-V2-TABLE-1/selector-build.txt) and
  [application build](../evidence/FIX-V2-TABLE-1/application-build.txt): PASS.
- [Public artifacts](../evidence/FIX-V2-TABLE-1/artifacts.json) and
  [package inventory](../evidence/FIX-V2-TABLE-1/table-pack.json): PASS. Public JS/declarations/CSS resolve to the owner
  and are packed; source/demo/tests are excluded. Generated outputs retain the owner's ignored-file convention.

Portrait reproducer and dark landscape flash screenshots were visually inspected. See
[portrait](../evidence/FIX-V2-TABLE-1/reproducer/reveal-390.png),
[dark landscape](../evidence/FIX-V2-TABLE-1/verifier/landscape-flash.png) and the full per-driver screenshot sets.
[Checksums](../evidence/FIX-V2-TABLE-1/checksums.json) identify fresh evidence and reusable drivers.

The first expanded run exposed the header-backed refresh defect, retained in
[diagnostic measurements](../evidence/FIX-V2-TABLE-1/diagnostic/header-refresh-before-fix.json).
An additional driver assertion initially assumed the desktop table filled its viewport; it now checks the intersection
of the table's natural bounds and the viewport, retaining the required full/maximal column-visibility assertion.
The [driver diagnostic](../evidence/FIX-V2-TABLE-1/diagnostic/geometry-driver-natural-edge.json) is separate from final
PASS evidence. An artifact-inspection helper encountered restricted child-process `git` EPERM; its corrected read-only
run uses the separately verified product SHA and passes. A wrong-working-directory housekeeping attempt changed no file.

## Reproduction and service ownership

Run from showtime using installed scripts only. The recipe checks port availability before starting its owned server:

```bash
recipe=node_modules/@itrocks/property-select/docs/orchestration
PS_ENV_DIRECTORY=/tmp/property-select-FIX-V2-TABLE-1 PS_STANDALONE_PORT=13772 \
  node "$recipe/environment/control.mjs" standalone
npm --prefix node_modules/@itrocks/table run build
npm --prefix node_modules/@itrocks/property-select run build
npm run build
export PS_TABLE_URL=http://127.0.0.1:13772/table-fixture
PS_TABLE_OUTPUT="$recipe/evidence/FIX-V2-TABLE-1/author" \
  node "$recipe/environment/checks/L2-TABLE.mjs"
PS_TABLE_OUTPUT="$recipe/evidence/FIX-V2-TABLE-1/verifier" \
  node "$recipe/environment/checks/V2-TABLE.mjs"
PS_TABLE_OUTPUT="$recipe/evidence/FIX-V2-TABLE-1/reproducer" \
  node "$recipe/environment/checks/V2-TABLE-reveal.cjs"
node "$recipe/environment/checks/FIX-V2-TABLE-1.mjs"
cd node_modules/@itrocks/table
node --test --test-isolation=none test/*.test.mjs
npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-FIX-V2-TABLE-1-pack-cache
```

The final browser commands used normal escalation and retained the sandbox. The original author 13752 ownership record
was inspected; that instance was not reused or signalled. The correction used its own checked-free port **13772** with
`PS_TABLE_URL=http://127.0.0.1:13772/table-fixture` and environment `/tmp/property-select-FIX-V2-TABLE-1`.
[Ownership](../evidence/FIX-V2-TABLE-1/standalone.owner.json) records PID `2294802` and the exact process identity.
The recipe's [identity-checked stop](../evidence/FIX-V2-TABLE-1/stop.txt) passed and removed its PID/owner files:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-FIX-V2-TABLE-1 \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs stop-standalone
```

No database was needed. Inherited services were left intact. No install/update, implicit-download npx, vcs-modules,
permission/sandbox change, application code/docs/commit, push, tag, publication or deployment occurred.
Showtime's staged blobs remain `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`; both working files remain absent.

## Handover and limits

Fresh independent RETEST-V2-TABLE-1 must rerun affected cases on the corrective SHA before clearing V2-TABLE or starting
L2-LIST. External transport, real list integration and product touch gestures remain with their later gates.
Phone-sized contexts here use mouse/keyboard; no physical phone, native keyboard, physical edge gesture or system
interruption is claimed. No open author failure remains in the correction scope.

Local commit subjects: table `Reveal columns between frozen table edges`; tracking
`Record frozen column reveal correction`.

# V2-TABLE-1: Revealed column remains behind frozen cells

## Status and owner

Open, blocking V2-TABLE (`NEEDS_FIX`). Owner: `@itrocks/table`.
Tested commit: `c7c9a65fb5497b1e76d809622eb0d3f4e44f1f97`, version `0.3.0`.
Requirements: TAB-02/TAB-04, DEP-07 and PORT-04 generic addition stage.
No product code was changed during independent verification.

## Minimal reproduction

Start the owned standalone fixture using the [V2-TABLE report](../reports/V2-TABLE.md) command, then run from showtime:

```bash
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-TABLE-reveal.cjs
```

Alternatively open `http://127.0.0.1:13762/table-fixture` in Chromium at 768 × 900, click **Add metric**, wait for
its values, then click **Add metric** again. These are trusted browser clicks; no public method call or DOM dispatch
is needed. The same problem occurs on the first addition and explicit public `reveal()`.

Expected: a fitting column is fully visible between Select and Actions. A wider column uses the maximum available
unfrozen width. Keyboard focus, row selection and column order remain unchanged.

Observed: the metric column's rightmost 82 px remain behind sticky Actions. At 768 px the metric occupies
x=544..752; Actions occupies x=670..752, so only 126 of the available 208 px of the metric are visible.
At 844 px, 126 of 208 px are visible. At 390 px, 126 of the available 194 px are visible.
1280 px passes because the table fits without scrolling.

Evidence: [measurements](../evidence/V2-TABLE/reveal-reproducer.json),
[narrow screenshot](../evidence/V2-TABLE/reveal-768.png),
[landscape screenshot](../evidence/V2-TABLE/reveal-844.png) and
[full independent results](../evidence/V2-TABLE/results.json).
Chromium `151.0.7922.34`, Playwright `1.62.1`, `chromiumSandbox: true`.

## Diagnosis and acceptance for correction

`TableColumnAdd.reveal()` intersects scroll bounds with `TableFreeze.visibleInnerRect()`.
For this supported `colgroup` shape, `visibleInnerRect()` reads layout rectangles of `col` elements, which scroll
with the table, while visible frozen cells stick to the viewport. At 768 px its inner rectangle incorrectly reports
left=-288/right=753; actual sticky boundaries are left=98/right=670.
The source diagnosis identifies the geometry contract mismatch; the corrector must establish the final owner fix.
Reuse table-owned freeze/scroll geometry, without copying it into consumers or changing fixture widths.

Correct both left and right frozen boundaries, including column-group and header-backed configuration, repeated
addition/reset/reorder and columns wider than the available inner width. Keep header deletion, sorting, asynchronous
replacement and focus unchanged. Add a meaningful regression and pass the full independent driver before independent
retest. FIX-V2-TABLE-1 and RETEST-V2-TABLE-1 are scheduled before L2-LIST; only the new verifier can clear this gate.

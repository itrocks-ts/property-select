# Independent generic table validation

## Verdict and checkpoints

**NEEDS_FIX**, 16 October 2026. Independent V2-TABLE has **179 PASS and 3 FAIL assertions** across all four required
viewports. The failures reproduce one blocking geometry defect: a revealed column remains partly hidden behind the
right frozen column. See [V2-TABLE-1](../defects/V2-TABLE-1.md). L2-LIST must wait for RETEST-V2-TABLE-1 PASS.

Initial owner checkouts were clean:

- Table: `c7c9a65fb5497b1e76d809622eb0d3f4e44f1f97`, `0.3.0`; unchanged product source/version.
- Tracking: `ba8de551dc7561fb21a1bd6cffdf7ee6eff3b792`, `0.2.4` → `0.2.5` for checks, evidence and documentation.
- Showtime: `d7ca948292e28c248bdcc0283724e47c2a82bba4`, unchanged with exactly the initial two AD entries.

L2-TABLE's attributable author report and product commit passed readiness. This fresh verifier is distinct from that
author and created independent assertions. Requested profile: `gpt-6.1-sol` / `high`; the parent owns actual dispatch
metadata. The executor has no independent runtime model/effort attestation. No additional agent was launched.
No SQL/hydration ambiguity requiring Astra arose in this generic table gate.

## Results and evidence

The [independent driver](../environment/checks/V2-TABLE.mjs) ran in Chromium `151.0.7922.34`, Playwright `1.62.1`,
Node `24.0.1`, with `chromiumSandbox: true`. Contexts use real trusted mouse and keyboard input at 1280 × 720,
768 × 900, 390 × 844 and 844 × 390. Portrait requests reduced motion; landscape requests dark colours.
Fixture seed: public generic opaque ids, A1..D2 synthetic rows, selected first row, frozen Select/Actions.
URL: `http://127.0.0.1:13762/table-fixture` on an independently owned standalone server.

[Full results](../evidence/V2-TABLE/results.json) record expected/observed values for every assertion, input trust,
viewport settings, exact URL/checkpoints and HTTP responses. [Run output](../evidence/V2-TABLE/browser-run.txt)
ends with exit 1 because the three visibility assertions fail. The collector retains failures and completes all
other checks before failing the gate; no assertion is suppressed.

- **TAB-02/TAB-04 reveal FAIL:** narrow, portrait and landscape leave part of the metric behind Actions.
  The [minimal reproducer](../environment/checks/V2-TABLE-reveal.cjs) also fails using ordinary add/duplicate clicks.
  [Measurements](../evidence/V2-TABLE/reveal-reproducer.json) show 126/208 px visible at 768 and 844 px, and
  126/194 px at 390 px. Desktop passes. Fitting columns must be fully visible; wider columns must use the available
  inner region. This is the single open defect.
- **TAB-02/TAB-06 addition PASS:** real header/body placeholders appear immediately, values load asynchronously,
  rapid duplicates preserve exact order and commit once, duplicate selection never reloads or recommits.
  Checks compare every header/body cell and the colgroup count, including retry and creation failure.
- **TAB-04 focus/selection PASS:** real typed input and activeElement survive public reveal/highlight; keyboard Enter
  retains trigger focus; the selected row stays selected. The public-method observation is identified as a contract
  check, supplementary to trusted activation of the fixture's actual addition controls.
- **TAB-05 PASS:** new/existing flash applies to all three cells, clears its classes, uses green/light theme colours,
  and switches to a static visible outline under reduced motion. Desktop, narrow, portrait and dark landscape
  screenshots were visually inspected. See `<mode>-before.png`, `<mode>-flash.png` and `<mode>-after.png` in evidence.
- **PORT-04 stage portions PASS:** optional value failure preserves a recoverable real column, retry loads values
  without another addition, creation failure changes no cells and emits no commit. A real provisional column cancels
  without late resurrection; late work after reset/disposal is ignored and busy/flash/provisional markers clear.
- **LIFE-03 generic stage PASS:** repeated reset retains ids without duplicates and installs one sort listener.
  Header reorder/delete, colgroup/body alignment, sort suppression, frozen-origin protection and asynchronous header
  replacement during a live drag pass at desktop, narrow and landscape dimensions. Both frozen edges remain sticky.
  Full reload restores the fixture's six-column baseline, then addition remains usable.
- **VAL-04/VAL-06 stage execution PASS:** all contexts and health observations completed; browser warning/error,
  page exceptions, failed requests and HTTP errors are empty. Process/input/evidence records are consultable.
  These process observations do not clear the failed feature gate or combined requirements.

[Twenty owner Node tests](../evidence/V2-TABLE/table-tests.txt) pass, including the existing reorder/feed suite.
[Table build](../evidence/V2-TABLE/table-build.txt),
[tracking build](../evidence/V2-TABLE/selector-build.txt) and
[application build](../evidence/V2-TABLE/application-build.txt) pass. No product source changed during verification.
[Public artifacts](../evidence/V2-TABLE/artifacts.json) and
[table package inventory](../evidence/V2-TABLE/table-pack.json) confirm the JS/declarations/CSS and public resolution.
[Checksums](../evidence/V2-TABLE/checksums.json) identify committed evidence and executed driver sources.

## Reproduction and service ownership

Run from `/home/baptiste/itrocks/showtime`, using installed tools:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-V2-TABLE-independent PS_STANDALONE_PORT=13762 \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs standalone
npm --prefix node_modules/@itrocks/table run build
npm --prefix node_modules/@itrocks/property-select run build
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-TABLE.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-TABLE-reveal.cjs
npm run build
cd node_modules/@itrocks/table
node --test --test-isolation=none test/*.test.mjs
npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-V2-TABLE-pack-cache
```

The exact two browser commands require normal escalation on this host, retain the Chromium sandbox and exit 1 for
the reported defect. Build/test outputs are linked above. The first diagnostic stopped at narrow reveal; the final
collector repeats all dimensions and records the same defect with a width-aware visibility assertion.
A fresh-directory `control.mjs status` reports no MySQL socket; this standalone fixture requires no database.
Restricted curl cannot reach the host listener; the same normal escalation route returns HTTP 200.
Two evidence housekeeping commands initially used the wrong working directory or npm pack prefix; the corrected
owner-directory commands above produced the retained build/test/package outputs. No source changed as a result.

The [ownership record](../evidence/V2-TABLE/standalone.owner.json) identifies this verifier's server.
After final HTTP 200, the identity-checked stop returned `PASS: owned standalone 2292371 stopped`:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-V2-TABLE-independent \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs stop-standalone
```

The minimal reproducer was repeated after a second owned start; both runs reproduced the same measurements.
The final PID/owner records were removed by the recipe; its environment/log directory remains for diagnosis.
The author's port 13752 instance and every inherited listener/database were left untouched.

## Ownership, preservation and limits

SOLID review: table retains responsibility for DOM movement, sticky bounds, flash and lifecycle; callback consumers
own values/identity and persistence notifications. Generic fixture callbacks substitute for business consumers without
selector/list/framework/reflection dependencies. The addition plugin reuses public reorder/freeze ports. The defect
exposes an incorrect geometry result in that narrow public collaboration; correction belongs in table.
No alternative geometry, SQL, hydration, pane or routing implementation was introduced by this verifier.

Showtime's staged blobs remain `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`; both working files remain absent.
No application code/docs/commit, installation/update, implicit-download npx, vcs-modules, push/tag or publication.
Tracking changes are reviewable and attributable; proposed local commit: `Record independent table validation failure`.

Combined PORT-04, T18, TAB and DEP-07 acceptance stays unfinished. External transport, list integration, persistence,
SQL values and product touch gestures remain at their named later gates. Phone-sized contexts here use mouse/keyboard;
V6/V7 retain mandatory genuine touch contexts. No physical phone, native keyboard, physical edge gesture or system
interruption is claimed. FIX-V2-TABLE-1 and a fresh independent RETEST-V2-TABLE-1 are required next.

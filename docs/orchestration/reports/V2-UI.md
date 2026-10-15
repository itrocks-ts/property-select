# V2-UI independent standalone verification

## Verdict and checkpoints

**DONE / PASS**, 16 October 2026, independent of the L2-UI author. No blocking product defect was reproduced.
L2-UI is attributable to clean `property-select` HEAD `b274d101e2d250a9318b312f0324a24a00519eb4`, version `0.2.0`.
This tests/documentation delivery applies the handbook patch `0.2.1` on its first edit. No product source changes.
The rebuilt browser outputs retain the tested source hashes in [artifacts.json](../evidence/V2-UI/artifacts.json).
Requested profile: `gpt-6.1-sol` / `medium`; dispatch metadata is the parent's responsibility. The executor has no
independent runtime model/effort attestation and did not launch a sub-agent.

## Independent assertions and observations

The verifier wrote [V2-UI.mjs](../environment/checks/V2-UI.mjs), without executing the author's browser assertions.
The actual public browser view is driven through Playwright mouse, keyboard, touchscreen and CDP input.
Fixture construction and public contract inspection use evaluation; product gestures use trusted browser input.
The exact local URL is `http://127.0.0.1:13721/`, with owned directory `/tmp/property-select-V2-UI`.
The seed is the delivered synthetic static invoice/customer/address/city/country catalogue and cyclic parent relation.
No business records, database, framework route or SQL participates in this gate.

[Results](../evidence/V2-UI/results.json) retain **116 PASS assertions**, expected and observed values, input events,
requests, exact launch arguments/environment identity, browser and Playwright versions. Chromium `151.0.7922.34`,
Playwright `1.62.1`, Node `24.0.1`, `chromiumSandbox: true`.
Desktop `1280 × 720` and narrow `768 × 900` use mouse/keyboard; portrait `390 × 844` and landscape `844 × 390`
use `hasTouch: true`, `isMobile: true`, coarse pointer and no-hover contexts.

- **T01 / PORT-01 PASS**: Exactly one property list, business DOM order, zero table columns, full canonical paths,
  string/segment equivalence, missing provider configuration error, omitted consumer/advice/used paths/translation.
- **T02 PASS**: Customer → Address → City → Country, ancestor return and remembered descendant activation retain
  the complete branch. Reload creates fresh instance state, as documented; persistence belongs to V4.
- **T03 PASS**: Address → Country replaces only City/Country's divergent suffix and retains the shared prefix.
- **T05 / T07 PASS implemented portions**: Relation main navigates; terminal main and object plus each emit once.
  City plus emits exactly `customer.address.city` and leaves Address current. Intention IDs are unique.
  Object data/representation remains VSQL/V2; no column addition is claimed.
- **T06 PASS implemented portions**: Measured row/main boxes and grid columns are identical before/after hover and
  keyboard focus. Desktop plus is revealed; no-hover relation plus is visible and terminal plus is hidden.
- **T08 PASS implemented portions**: Eight relation levels remain reachable, actual mouse wheel/touch movement
  scrolls the breadcrumb and navigation/scroll/cancellation emit no selection. No page horizontal overflow.
- **T25 PASS implemented portions**: Tab follows main/plus sibling order with visible outline. Enter/Space each emit
  once for a terminal; Shift+Tab reaches City plus and Enter selects the object once without navigation.
  Touch selects terminal/object without drag. Pane closure/focus restoration remains V2-HOME/V2/V6.
- **PORT-02 PASS click/disposal portions**: Without consumer, an intention has no automatic outcome. Explicit public
  acknowledgement succeeds once; duplicate and disposed acknowledgements fail. Dynamic insertion mounts one surface,
  repeated mount shares its promise, disposal/remount has one listener, late uncancellable metadata cannot revive DOM.
- **PASS browser health**: No console warning/error, page exception, failed request or HTTP error in the four product
  runs. The request graph uses only standalone demo/catalogue and selector assets; the recursive emitted-module graph
  independently rejects bare/outside/host imports.

Screenshots before/after are retained for each dimension and were visually inspected, including
[desktop](../evidence/V2-UI/desktop-before.png), [narrow](../evidence/V2-UI/narrow-after.png),
[portrait](../evidence/V2-UI/portrait-after.png) and [landscape](../evidence/V2-UI/landscape-before.png).
The horizontally clipped remembered branch is scrollable; the property list and add targets remain within the viewport.
[SHA256SUMS.json](../evidence/V2-UI/SHA256SUMS.json) covers retained evidence and driver sources.

## Commands, ownership and diagnostics

Commands run from `/home/baptiste/itrocks/showtime`, using installed tools only:

```bash
npm run build --prefix node_modules/@itrocks/property-select
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-UI.mjs
node node_modules/@itrocks/property-select/docs/orchestration/evidence/V2-UI/review.mjs
git -C node_modules/@itrocks/property-select diff --check
```

From the property-select directory, the package inventory command is:

```bash
npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-V2-UI-npm-cache
```

[Build output](../evidence/V2-UI/build.txt), [package inventory](../evidence/V2-UI/pack.json) and
[public artifact/import review](../evidence/V2-UI/artifacts.json) pass. ESM/CJS/declarations/template/style are present
in built outputs and published inventory; top-level source/tests and maps are excluded. CJS imports without a DOM.
The first dry-run invocation with npm `--prefix` targeted the application rather than the package; it wrote only a
temporary inventory. The command above ran in the owner and its retained inventory identifies the correct package.

Restricted preflight rejects socket binding with EPERM before launch; the normal escalation mechanism allows the same
script with sandboxed Chromium. [Restricted diagnostic](../evidence/V2-UI/preflight-restricted.json).
One harness diagnostic tried scrolling left from initial scrollLeft zero; it is retained as
[harness-scroll-direction.json](../evidence/V2-UI/harness-scroll-direction.json). The independent assertion now sends
rightward wheel/leftward touch movement and observes increased scrollLeft. No product assertion was removed.

The driver checks the port free and absent PID reservation, calls ownership-checked `control.mjs standalone`, checks
real HTTP 200 and retains [process identity](../evidence/V2-UI/ownership.json). Its `finally` calls
`control.mjs stop-standalone`; [cleanup](../evidence/V2-UI/cleanup.txt) confirms its owned process stopped.
It changes no inherited server or database. Exact argv/output are retained in results and the driver fixes the
PS_ENV_DIRECTORY/PS_STANDALONE_PORT environment. No permission or browser sandbox setting changes.

## SOLID, preservation and limits

The view owns DOM/lifecycle and delegates navigation and intentions to its controller. The provider supplies metadata;
the optional consumer owns confirmation. Public structural ports permit a plain static adapter and observer-only use.
Import direction remains view → selector controller → narrow metadata/intentions contracts. No table geometry,
SQL, hydration, pane ownership or framework imports enter the selector. Verification support contains assertions,
fixture setup and lifecycle commands only; no product implementation.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`, with the two original `AD` entries, absent working
files and index blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. No application code/document/commit, install/update, downloading npx,
vcs-modules, push, tag or publication occurs.

Combined case verdicts remain NOT_RUN until their named integration, search, persistence and drag gates.
Touch movement/cancellation here proves trusted input and no accidental selection; gesture arbitration remains V6.
No physical phone, native keyboard, physical edge gesture or system interruption was tested.
Local authorised commit subject: `Verify standalone selector navigation independently`.

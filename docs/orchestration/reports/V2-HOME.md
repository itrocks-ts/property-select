# Independent generic pane verification

## Verdict and checkpoints

**DONE / PASS**, 16 October 2026. PANE-01–PANE-04 and PANE-06 generic shell observations pass independently of L2-HOME's
implementation and author assertions. No product code changed and no corrective task is required.

Tested home: `857a9f7796feb71816f75aa84d27a08c31f5f44a`, version `0.5.1`, clean before and after validation.
Tracking starts clean at `ae300eace5d7a1b1ed73980b1921b40650238558`, version `0.2.2`; this test/evidence/documentation
delivery receives patch `0.2.3`. L2-HOME's validated author report and attributable checkpoints satisfy readiness.
Requested profile: `gpt-6.1-sol` / `medium`. The executor cannot independently attest runtime model/effort;
actual dispatch metadata belongs to the parent. No additional agent was launched.

## Independent browser observations

The new [driver](../environment/checks/V2-HOME.mjs) runs the actual framework `/pane-fixture` route and public
home browser API. It does not execute the author's driver or substitute a simulated shell. Arbitrary fixture content
consists of
16 breadcrumb links, an editable input and 80 example items. Additional verifier content exercises title/replacement.
The exact URL is `http://127.0.0.1:13741/pane-fixture`.

[Results](../evidence/V2-HOME/results.json): **147 PASS assertions**, Chromium `151.0.7922.34`, Playwright `1.62.1`,
Node `24.0.1`, `chromiumSandbox: true`. Mouse and keyboard run at `1280 × 720` and `768 × 900`; genuine emulated touch
runs at `390 × 844` and `844 × 390`, with `hasTouch: true` and `isMobile: true`. Trusted click, keyboard, touch pointer,
touch movement and cancellation records are retained with each viewport. No DOM dispatch or direct handler invocation
supplies user actions. Public lifecycle calls are identified as fixture contract controls.

- **PANE-01 PASS:** Fresh page has no command/content. Registration immediately reports present/folded. Exactly one
  command sits in the dock after notifications, with the opening icon. Reload returns to the genuine empty state.
- **PANE-02 PASS:** Opening moves that same command before the actual title and reverses its icon. Desktop/narrow main
  shrinks, responds to a real click and scrolls on both axes. Content scrolling, input value and instance survive close,
  reopen and suspension. Captures show the fixed title/command above independently scrolled content.
- **PANE-03 PASS:** Competing owner rejects with `PaneOccupiedError`, retaining content. Two nested tokens release only
  on the final restore. Explicit close during suspension remains closed after idempotent restoration. Removal clears
  content/title, emits the absent state and makes stale tokens/handles unable to reopen or remove a new registration.
  Inactive same-owner replacement retains its handle and updates title/content; active replacement rejects.
- **PANE-04 PASS:** Explicit close and Escape fold and focus the visible command. Mobile main is inert; reverse/forward
  Tab wrap inside the pane. Desktop main remains accessible. Restoration preserves scroll and does not focus the search
  input. Resizing an open pane into mobile moves focus from the hidden main, then restores main access on widening.
- **PANE-06 PASS:** All four dimensions have no document overflow and a visible command target of at least 44 px.
  Mobile pane bounds fill the viewport. Long breadcrumbs scroll using mouse or genuine touch; vertical content scroll
  uses genuine touch on both phone dimensions. Browser touch cancellation leaves the generic pane usable/open.
  Keyboard focus has a visible outline; dark pane text/background contrast is at least 4.5:1; reduced motion has no
  transition. Light desktop, portrait and dark landscape captures were visually inspected, with readable titles and
  accessible closing controls. The sixteen before/after screenshots are retained in the evidence directory.
- Browser warnings/errors, page exceptions, failed requests and HTTP errors are **empty**.

These observations satisfy the shell portion of DEP-08, UI-01/UI-02 and QUA-02 at this gate, plus VAL-04/VAL-06
evidence.
Their combined selector/list/product drag observations stay at the named later gates.
PANE-05 remains NOT_RUN.
No actual table, selector navigation, SQL, session storage or view-navigation composition is claimed here.

## Commands and resource ownership

Run from `/home/baptiste/itrocks/showtime` with the already installed tools:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-V2-HOME-live PS_APP_PORT=13741 \
  PS_FRAMEWORK_INITIALIZER=node_modules/@itrocks/property-select/docs/orchestration/environment/home/fixture.cjs \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs app
npm --prefix node_modules/@itrocks/property-select run build
npm --prefix node_modules/@itrocks/home run build
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-HOME.mjs
PS_ENV_DIRECTORY=/tmp/property-select-V2-HOME-live \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs stop-app
```

Both builds pass; their [selector](../evidence/V2-HOME/selector-build.txt) and
[home](../evidence/V2-HOME/home-build.txt) logs are retained. The successful browser command prints
`PASS: 147 assertions` and writes `docs/orchestration/evidence/V2-HOME/results.json` in property-select.
The public [artifact inspection](../evidence/V2-HOME/artifacts.json) and
[pack inventory](../evidence/V2-HOME/home-pack.json) pass: JS, declarations, CSS, container activation/template and
backend
entry are published; maps, source and tests are excluded.
Pack command from the home checkout:
`npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-V2-HOME-home-npm-cache`.
Both owners' rebuilt public outputs resolve to the delivered checkouts; home browser pane imports no framework module.

Initial status in the fresh directory reports no MySQL socket; this generic recipe performs no business/database reads
and needs no database start/reset. Restricted service startup had no reachable listener; its ownership-checked stop
cleared its reservation. Restricted Chromium startup reports `sandbox_host_linux.cc:41` / `Operation not permitted`.
The normal escalation mechanism then ran the same local launcher and sandboxed browser, with permissions unchanged.
HTTP readiness returned 200. A synchronous resize assertion initially preceded its media-change callback; the driver now
waits for that observable state. A touch tap during ongoing inertial scroll initially failed the closing assertion;
allowing browser scrolling to settle before tapping passes. These were driver timing diagnostics; no product correction
or criterion relaxation occurred. The final retained run executes every required assertion on rebuilt assets.

The [ownership record](../evidence/V2-HOME/app.owner.json) identifies the sole local service created by this gate.
Identity-checked stop reports `PASS: owned app 2276980 stopped`; PID/ownership reservations are absent afterwards.
[Cleanup](../evidence/V2-HOME/cleanup.json) and [checksums](../evidence/V2-HOME/checksums.json) retain final proof.
No inherited listener or database was reset or signalled.

## Boundaries, preservation and limits

SOLID review: home owns generic hosting, responsive layout, focus and lifecycle. Arbitrary content semantics remain in
the fixture/consumer. The narrow public handle supports replacement by a structurally compatible host. The verifier
uses public API and observes real DOM/input without adding product logic. No selector, table geometry, reflection,
SQL, hydration or framework adapter dependency enters the pane browser API. The existing backend composition remains
outside the independent browser service. No infrastructure package or product API change is introduced.

Showtime retains HEAD `d7ca948292e28c248bdcc0283724e47c2a82bba4`, with only its original two AD entries. Their working
files remain absent, and index blobs remain `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. No application code/document/commit, install/update, implicit-download npx,
vcs-modules, push, tag, publication or permission/sandbox alteration occurred.

No physical phone was available. Native keyboard presentation, physical edge gestures and actual system
interruption
remain untested. Browser protocol cancellation and the public restoration/removal contract pass; they do not claim a
physical system interruption. Product drag restoration is V6; list header/PANE-05 and navigation cleanup await
composition.
Local commit subject: `Verify generic pane lifecycle independently`.

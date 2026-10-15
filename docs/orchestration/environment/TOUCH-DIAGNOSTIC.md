# Touch input capability diagnostic

## Scope and verdict

VAL-07 tooling correction: `DONE`, executed on 15 October 2026. Installed Chromium accepts genuine emulated touch input
through Playwright and CDP. Independent verification of this correction is still required before closing task 4.2.
VAL-05 product gestures remain unimplemented and `NOT_RUN`; this report establishes only the required input capability.

Requested profile: `gpt-6.1-sol` / `high`. The agent runtime provides no independent model/effort attestation.
No further agent was created. Package starting HEAD: `276943ad110fe8d1b3dffb06686b7afd52c2bc2d`, initially clean,
version `0.0.6`; correction version: `0.0.7`.
Application HEAD: `d7ca948292e28c248bdcc0283724e47c2a82bba4`; both initial `AD` audit entries are preserved.
No persistent application files or commits, package installations, downloads or server changes were needed.

## Available tools and permission boundary

CUA inventory exposes IAB and MCP Apps only; neither exposes tactile input in the documented surface.
The workspace dependency tool locates Playwright `1.62.1` under:

```text
/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright
```

Its already installed Chromium headless shell reports `151.0.7922.34`. System Chrome `155.0.8059.79` and Firefox `158.0`
are also installed but were not required or exercised. No existing browser profile or debugging endpoint was attached.

A restricted-shell launch with `chromiumSandbox: true` fails before navigation:

```text
FATAL:content/browser/sandbox_host_linux.cc:41
Check failed: . shutdown: Operation not permitted (1)
```

The normal tool `require_escalated` request was accepted for the local probe. The same installed browser launched with
its sandbox explicitly enabled and exited cleanly after the assertions. No permission configuration was changed and no
sandbox-disabling fallback was used. A future rejection is a real permission blocker; do not work around it.

## Reproduction

Run from the package checkout using the existing Node executable:

```bash
node docs/orchestration/environment/touch-probe.mjs
```

For an independent run, set `PS_TOUCH_OUTPUT=/tmp/showtime-property-select-touch-recheck` to retain the original output.
Use the normal tool approval mechanism if Chromium cannot launch inside the restricted shell.
`PS_PLAYWRIGHT_MODULE` can select another existing runtime module path discovered by `load_workspace_dependencies`.
No `npm install`, `npm update`, `npx` or browser installer is involved.

The probe opens the standalone local [HTML fixture](demo/touch-probe.html), without an HTTP listener or framework
dependency.
It launches only its own browser and closes it in `finally`. It observes events through the rendered page's event log;
all page evaluation is read-only. Input comes from `page.touchscreen.tap()` or a page-specific CDP session using
`Input.dispatchTouchEvent`. The installed primary API declarations document `touchStart`, `touchMove`, `touchEnd` and
`touchCancel` in `playwright-core/types/protocol.d.ts`, and taps in `playwright-core/types/types.d.ts`.
The source [probe](touch-probe.mjs) contains no `dispatchEvent`, mouse input or direct product handler calls.

The touch context has `hasTouch: true`, `isMobile: true`, viewport 390 × 844, `maxTouchPoints: 1`, coarse pointer and no
hover. The page viewport matches those dimensions. After resizing to 844 × 390, another real touch tap passes.

## Observed results

All five scenarios pass with `event.isTrusted === true`; all pointer events have `pointerType === 'touch'`:

- Tap: `pointerdown`, `touchstart`, `pointerup`, `touchend`, with no movement.
- Long press: stationary touch held for 753.3 ms, then released; the asserted minimum is 700 ms.
- Drag input: 750 ms initial hold, ten moves and release; 202.2 px displacement over 1083.6 ms.
- Cancellation: `pointercancel` and `touchcancel` follow a real protocol touch start.
- Landscape tap: trusted touch sequence after resizing to 844 × 390.

Browser console warning/error and page exception collection is empty. Node syntax and Git whitespace checks pass.
The [versioned event trace](touch-evidence.json) records every observed event, coordinates, timing and verdict.
The original full output and five PNGs are at `/tmp/showtime-property-select-touch/`; `drag.png` was visually inspected.
The script reproduces these artefacts. Screenshots illustrate the fixture; event assertions establish input transport.

## Limits and next check

The fixture deliberately observes transport without implementing selector or table logic. Long press proves a sustained
touch contact, and drag proves tactile pointer movement; product recognition, scroll arbitration, reordering, rollback,
reopening and persistence must be checked against their future implementation on both required environments.
Protocol cancellation is not a physical system interruption. Native keyboard, edge gestures and physical phone input
remain unverified. These limits do not invalidate the demonstrated emulation capability or waive later gesture tests.

A separate verifier must rerun the probe, inspect its event evidence and confirm the documented launch procedure.
If the normal launch approval is unavailable, record that boundary and keep dependent tactile acceptance blocked.

SOLID review: the test fixture only records input, the driver only transports and checks it, and no product owner or
contract is changed. The package patch covers test support and documentation only.
Proposed local commit: `Verify emulated touch input for validation`.

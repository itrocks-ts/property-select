# L2-UI standalone browser surface

## Verdict and checkpoints

**DONE / author PASS**, 16 October 2026. RETEST-L1-META-2 is validated with no open blocking prerequisite defect.
Independent V2-UI remains **NOT_RUN** and must run immediately before dependent integration.

`property-select` starts clean at `0526f46fad4a3bd402e73e713283aeffafbfe617` / `0.1.5`.
The first edit applies the compatible-feature minor version `0.2.0`; all checks use the rebuilt working delivery.
No other package is changed or renumbered. This report contains no own-commit SHA.
Requested profile: `gpt-6.1-sol` / `medium`; actual dispatch metadata belongs to the parent. The executor has no
independent runtime model/effort attestation and launches no sub-agent. Stabilised ports and native button semantics
require no new SQL/session/gesture arbitration or Astra promotion.

## Delivered behaviour

The public ESM subpath `@itrocks/property-select/front/property-select.js` exports `PropertySelectView`.
Its constructor receives a host element and existing controller options, owns one controller and appends one section.
`mount()` loads the adjacent public HTML template and mounts the controller; repeated mounts share one promise.
`dispose()` aborts pending template/metadata/selection work, unsubscribes, removes its section and releases DOM
references.
Importing the API has no activation side effect. The root public controller and CJS contract are preserved.
HTML and CSS are published through explicit subpaths and copied from their sources during the existing build.

One property list shows the current object. Remembered breadcrumbs retain ancestors and descendants, expose all levels
through horizontal scrolling and mark the current object by `aria-current`, weight and underline.
Metadata labels and business order come from the existing provider/controller. Main and plus buttons are siblings;
the relation chevron follows its name inside the main button. Main activation opens relations or selects terminals;
plus selects the exact object/field path and stops propagation. No current-object header plus is added.
Desktop plus space is permanently reserved and revealed by hover or focus. Without hover only relation plus buttons
are displayed. Native buttons supply Tab, Enter, Space and visible focus without nested interactive controls.
DOM updates preserve matching focused controls, and acknowledgements do not rebuild unchanged property controls.

The synthetic demonstration observes canonical intentions without a consumer, implicit addition or business records.
Mount/Dispose controls exercise host lifecycle. The standalone launcher uses a fixed public-output allowlist;
unknown assets, sources and host adapters receive 404. It has no framework/home/list/table/reflection imports.
Search, shortcut fusion, sessions and recognised drag gestures remain their planned later deliveries.

## Executed validation

All commands run from `/home/baptiste/itrocks/showtime`. The reproducible runner records exact argv, environment,
exit status and output SHA-256 in `evidence/L2-UI/commands-*.json`. Readable logs trim trailing blank lines;
`build.raw.gz` retains the original build output and command records retain its raw SHA-256.

- **PASS** build, public root/browser/view type imports and all fourteen controller contracts:
  [build](../evidence/L2-UI/build.txt), [tests](../evidence/L2-UI/test.txt),
  [commands](../evidence/L2-UI/commands-core.json).
- **PASS** forty author assertions in real Chromium `151.0.7922.34`, installed Playwright, Node `24.0.1`,
  `chromiumSandbox: true`: [expected/observed records and network imports](../evidence/L2-UI/browser.json),
  [command](../evidence/L2-UI/commands-browser.json), [driver](../../../test/browser-ui.mjs).
  T01 single list/static provider; T02 remembered navigation; T03 divergence;
  T05 terminal/relation/plus single action;
  T06 hover/focus invariant boxes and no-hover targets; T07 object intention; T08 long narrow breadcrumb and no selection
  during navigation/scroll; T25 keyboard addition. No browser exception occurs.
- **PASS** desktop `1280 × 720`, narrow `768 × 900`, portrait `390 × 844`, landscape `844 × 390`, theme/reduced-motion
  focus and actual touch taps in a `hasTouch: true`, `isMobile: true` context. Screenshots were visually inspected:
  [desktop](../evidence/L2-UI/desktop.png), [portrait](../evidence/L2-UI/portrait.png).
- **PASS** observer-only defaults; disposal/remount has one surface/listener; double mount returns one promise;
  double disposal during an intentionally uncancellable metadata response cannot revive detached DOM or controller.
  Existing controller tests retain outcome identity, rejection, late response and optional-consumer coverage.
- **PASS** offline package inventory includes ESM/CJS/types/template/style and excludes source/tests/maps:
  [inventory](../evidence/L2-UI/pack.txt),
  [public output hashes and recursive browser import graph](../evidence/L2-UI/review.json).
  The graph contains only selector modules. CJS remains independent of browser APIs.
- **PASS** complete source/test/asset/documentation diff review, `git diff --check`,
  application HEAD/index preservation.
  [Checksum manifest](../evidence/L2-UI/SHA256SUMS.json) covers retained commands, assertions, outputs and screenshots.

The restricted preflight fails with socket EPERM before launching any service; its
[output](../evidence/L2-UI/preflight-restricted.txt) and command record are retained.
Normal escalation permits the same port check, owned launch and sandboxed browser. No permission or sandbox setting
is changed. The first artifact review finds CJS maps included by the broad `cjs` publication entry; the manifest now
uses positive `cjs/*.js` and `cjs/*.d.ts` entries and the unchanged no-maps assertion passes. The subsequent harness
check mistakenly matches the absolute `/home/` directory as a forbidden host module; it now checks package-relative
paths. Both diagnostic outputs are retained as `review-initial.txt` and `review-harness.txt`.
No product assertion is removed or weakened and no defect remains open.

## Reproduction and process ownership

```bash
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/L2-UI
python3 "$proof/run.py" core
python3 "$proof/run.py" preflight
python3 "$proof/run.py" start
python3 "$proof/run.py" status
python3 "$proof/run.py" browser
python3 "$proof/run.py" pack
python3 "$proof/run.py" review
python3 "$proof/run.py" stop
```

The runner sets `PS_ENV_DIRECTORY=/tmp/property-select-L2-UI`, `PS_STANDALONE_PORT=13720` and
`PS_UI_URL=http://127.0.0.1:13720`. Preflight proves an available port and absent PID/owner reservation.
Start/stop use the established ownership-checked `control.mjs standalone` / `stop-standalone` commands.
The stage-specific status driver checks recorded PID/arguments/token and real HTTP 200; the existing framework status
command targets framework/MySQL and is not a standalone health endpoint.
[Owned identity/status](../evidence/L2-UI/owned-status.txt), [cleanup](../evidence/L2-UI/stop.txt).
Only this owned standalone process is stopped. No database reset or inherited process modification occurs.
V2-UI can start this recipe on its recorded port or choose a fresh directory/port and matching browser URL.

## SOLID, preservation and limits

The view owns DOM/lifecycle and maps native activations to the controller. Navigation, path validation, metadata
ordering and intentions retain their existing owners. The public narrow metadata/consumer ports remain substitutable;
the demo supplies plain static data and observes intentions. Template/style and activation are separate concerns.
No pane, geometry, SQL, reflection, hydration, session engine or duplicate host mechanism enters the browser graph.
The static asset server is tracking-only support with explicit public mappings; no new infrastructure package exists.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`, with exactly the original two AD entries, absent
working files and staged blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. No application source/docs/commit, install/update, implicit-download npx,
vcs-modules, push, tag, publication or permission change occurs.

This author delivery proves standalone intentions, navigation and mount/dispose only. Independent V2-UI remains
mandatory. Actual object data, list/table/pane integration, search, persisted state and gestures retain their gates.
No physical phone is available; emulated browser touch input is real and trusted, while native keyboard/edge/system
interruption observations remain later/hardware-dependent.

Authorised local commit subject: `Add standalone property selector browser view`.

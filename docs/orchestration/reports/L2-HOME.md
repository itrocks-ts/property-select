# L2-HOME generic right pane

## Verdict and checkpoints

**DONE / author PASS**, 16 October 2026. Independent V2-HOME is the next mandatory gate.
V2-UI prerequisite is validated at tracking checkpoint `335f3b0f5fe79b187a2450cdfe8a87a016ba7df2`, version `0.2.1`.
Home starts clean at `4e7af0746c50c0288b3baed641a1ce7c63ea16cd`, version `0.4.2`; its compatible browser API uses the
handbook minor `0.5.0`. Browser-tested feature checkpoint: `b2547296456ee65d28cc774dca209ad80a731ab6`.
A manifest-only publication correction delivers `0.5.1` at `857a9f7796feb71816f75aa84d27a08c31f5f44a`; its rebuilt
browser source/assets are identical. The final build/publication checks run on that checkpoint.
Tracking documentation/fixture/evidence uses patch `0.2.2` from its clean `0.2.1` checkpoint.
Requested profile: `gpt-6.1-sol` / `medium`. Runtime identity is not independently attested by this executor.
No further agent was launched; actual dispatch metadata belongs to the parent.

## Product contract and review

Home owns the shell markup, browser API, stylesheet and explicit container activation. Public
`@itrocks/home/right-pane.js` exposes `RightPane`, `rightPaneOf`, `PaneOccupiedError`, `PaneHandle` and `PaneState`.
The backend root remains `Output`. A per-container weak registry provides the shared service without storing detached
views globally. Consumers register arbitrary content, subscribe synchronously and remove their registration on disposal
or navigation. Framework/list composition owns that eventual integration cleanup.

A competing owner rejects. An inactive same-owner registration updates content/title and preserves its handle;
open/suspended replacement rejects. New content starts folded. One command moves between its top-right dock and the
pane header, reversing its chevron. The dock follows notifications in DOM and notifications reserve its right-hand area.
Nested restoration tokens are idempotent and scoped to their exact registration; removal/disposal invalidates them.
Folding retains the content instance and scroll/input state. Explicit state changes during suspension update the final
requested state; token restoration does not focus the content. Explicit close/Escape focuses the visible command.

Desktop main shrinks, remains interactive and scrolls. Mobile fills the viewport, contains keyboard focus and preserves
then restores pre-existing inert values. The shared 600 px breakpoint is extended for coarse-pointer landscape at
heights up to 480 px. System colours and light/dark schemes support theme overrides; the pane adds no animation.

SOLID review: home has the single responsibility of content hosting and shell lifecycle; content semantics remain
consumer-owned. The narrow handle is structurally substitutable. No selector, table geometry, SQL, model hydration,
framework adapter or private import enters its browser API. The container activation imports only that API.
HTML structure, TypeScript behaviour and SCSS presentation stay in their owners. No infrastructure package was added.

## Validation and evidence

[Lifecycle suite](../evidence/L2-HOME/contracts.txt): **PASS**, one real Chromium test with 16 named lifecycle checks
plus mobile modal semantics, keyboard trapping/Escape and disposal assertions. It covers title updates, immediate state
subscription, shared identity, occupancy refusal, nested tokens, scroll restoration and stale handles/tokens.

[Author browser driver](../environment/checks/L2-HOME.mjs): **87 PASS assertions** in the actual framework container,
with browser/input records in [results.json](../evidence/L2-HOME/results.json). Chromium `151.0.7922.34`, Playwright
`1.62.1`, Node `24.0.1`, `chromiumSandbox: true`. Viewports: desktop `1280 × 720`, narrow `768 × 900`, portrait
`390 × 844` and landscape `844 × 390`. Portrait/landscape use `hasTouch`, `isMobile` and genuine trusted touch input.
Product commands use mouse/tap/keyboard; direct public calls exercise only the fixture's lifecycle contract controls.

PANE-01..04 and PANE-06 shell observations pass: empty/folded state, one movable/inverted command, exclusive ownership,
desktop width/interaction/two-axis scrolling, preserved content/scroll, mobile inertness, explicit close focus,
restoration without search focus, invalidated tokens, no viewport overflow, 44 px targets, visible keyboard outlines,
long breadcrumb mouse/touch scrolling, light/dark presentation and zero motion under reduced-motion preference.
Browser warnings/errors, failed requests and HTTP errors are empty. Twelve screenshots are retained; desktop, portrait,
landscape dark and folded layouts were visually inspected. [Artifact review](../evidence/L2-HOME/artifacts.json) and
[package inventory](../evidence/L2-HOME/pack.json) pass; JS/declarations/HTML/CSS are published, maps/source/tests
excluded.
Importing the browser API without a DOM succeeds. No browser runtime import reaches server/framework code.

Commands from the application root, using installed tools:

```bash
npm --prefix node_modules/@itrocks/home run build
node --test /home/baptiste/itrocks/showtime/node_modules/@itrocks/home/test/property-select.test.mjs
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/L2-HOME.mjs
git -C node_modules/@itrocks/home diff --check
git -C node_modules/@itrocks/property-select diff --check
```

The pack command runs in the home checkout:
`npm pack --dry-run --json --ignore-scripts --cache /tmp/property-select-L2-HOME-npm-cache`.
The relative test path from the task card was reported missing by Node's test discovery; its absolute equivalent above
executes the exact delivered suite. A minimal test-only shell initially omitted the base grid height, preventing scroll;
adding that fixture geometry resolved the assertion. Initial inventory exposed the existing CJS source map; the owning
allowlist now explicitly lists CJS declarations, HTML and JS. npm file-pattern precedence defeated the first exclusion;
the final positive allowlist passes. This manifest-only correction receives patch `0.5.1` after the feature commit.
These author diagnostics preceded the retained successful runs.

## Isolated fixture and process ownership

The fixture registers `/pane-fixture` through the installed public route/Action API and the recipe initializer hook.
It is arbitrary content with 16 breadcrumb links and 80 example items, plus a wide/tall main region. No business
records, selector, metadata provider, SQL or simulated backend participates in this generic shell gate.
Exact author URL: `http://127.0.0.1:13731/pane-fixture`. Start from the application root:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-L2-HOME-live PS_APP_PORT=13731 \
  PS_FRAMEWORK_INITIALIZER=node_modules/@itrocks/property-select/docs/orchestration/environment/home/fixture.cjs \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs app
```

The launcher writes identity/ownership evidence, preserved in results.json. HTTP readiness returns 200.
Restricted startup could not provide a reachable listener; its ownership-checked stop cleaned its stale reservation.
The normal tool escalation ran the same installed launcher and sandboxed browser. The initial status command in a fresh
pane-only environment reports no local MySQL socket; this shell fixture needs no database start/reset or business reads.
No permissions or browser sandbox settings were changed. Author resources were stopped using:

```bash
PS_ENV_DIRECTORY=/tmp/property-select-L2-HOME-live \
  node node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs stop-app
```

[Cleanup record](../evidence/L2-HOME/cleanup.json) confirms exit zero and absent reservations; results retain identity.
The verifier can use a fresh owned directory and port; adapt its own driver URL. No inherited listener/database was stopped or reset.

## Preservation and limits

Showtime remains `d7ca948292e28c248bdcc0283724e47c2a82bba4`; its two AD files remain absent in the working tree and retain
index blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and `de960a87ea9b4f6eb1cece85ab32596baef11fcd`.
No application code/document/commit, install/update, implicit-download npx, vcs-modules, push, tag or publication occurs.

Independent V2-HOME remains NOT_RUN. List header/PANE-05, actual selector/list integration, navigation composition and
product drag restoration remain at their scheduled gates. No physical phone, native keyboard, physical edge gesture
or system interruption was tested. This does not waive the successful automated touch checks.
Local commit subjects: home `Host arbitrary content in a responsive right pane`; tracking
`Record generic pane implementation and browser evidence`; publication follow-up
`Publish pane assets without source maps`.

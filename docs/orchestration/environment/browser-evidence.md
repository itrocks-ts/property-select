# Browser environment evidence

Observed on 15 October 2026 using `mcp__cua_repl.js`, with a real Codex In-app Browser tab.

## Framework integration

URL: `http://127.0.0.1:13319/country`, opened after starting the package-owned launcher and reloaded after
its stop/start cycle. Title: `it.rocks application`.

The accessibility tree contains `2 éléments`, a table headed `nom`, and two rows:
`Recipe France` and `Recipe United Kingdom`. The existing create, search, selection and delete controls render.
No product selector, pane or relational-column acceptance is claimed.

Default viewport measured through read-only browser evaluation: 1280 × 720.
Viewport override exercised: 390 × 844; the screenshot shows both synthetic rows and the existing list controls.
The override was reset after observation. Captured browser console warning/error entries: `[]`.
The screenshot is present in the task tool transcript; no image file was exported by this API.

## Standalone support

URL: `http://127.0.0.1:13320/`, title: `Property selector standalone recipe support`.
The browser displays `Standalone recipe support` and the explicit notice that no selector is implemented.
This is launch support for the functional tasks, not a standalone feature validation.

## Input capability inventory

Available browser providers: Codex In-app Browser (`iab`) and Codex MCP Apps (`mcpapps`).
Browser capabilities: `visibility`, `viewport`. Tab capabilities: `pageAssets`, `webmcp`.
The documented viewport API accepts width and height only. The input APIs expose clicks, keyboard and mouse drag,
with no touch context, tap, touch sequence or pointer cancellation emulation API.
No tactile gesture was executed or validated through IAB. Mobile dimensions do not establish touch emulation.
In this sub-agent, explicit IAB visibility requests report `IAB visibility is not supported in a subagent thread`;
background tab creation, navigation, accessibility, screenshots and viewport overrides work.

## Installed Chromium touch input

The separate [touch diagnostic](TOUCH-DIAGNOSTIC.md) exercises the installed Playwright runtime and its Chromium.
Trusted touch and pointer events confirm tap, stationary hold, movement and protocol cancellation, including a landscape
tap. Its [committed event trace](touch-evidence.json) is the input proof; screenshots alone do not establish gestures.
IAB's input limitation remains specific to its API. No selector product acceptance is claimed by the capability probe.

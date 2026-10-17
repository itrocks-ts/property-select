# Build and verification

With the compiler and preparation utility available, `npm run build` creates CJS in `cjs/` and browser ESM and
declarations at the package root. Generated files are ignored. `npm test` rebuilds, checks public TypeScript imports
and runs the Node contract suite.

The reusable `test/fixtures/static-graph.mjs` and non-table recording consumer are test resources outside the
published package. `test/search.test.mjs` covers normalised matching, scope, path identity, known and unknown cycles,
reversed and delayed providers, and a large cyclic graph.

`test/browser-search.mjs` owns local recipe servers, exercises actual browser inputs and records author evidence in
[the L3 report](orchestration/reports/L3.md). `test/browser-ui.mjs` drives the standalone demo through real mouse,
keyboard and emulated touch input; its author evidence and ownership-checked launch recipe are in
[the L2-UI report](orchestration/reports/L2-UI.md).

`test/browser-smoke.mjs` imports the public entry in sandboxed Chromium. Set `PS_PLAYWRIGHT_MODULE` to an existing
Playwright module. The test starts and closes its own ephemeral localhost server.

`test/browser-paths.mjs` checks ordered inline property paths, navigation and selection, equal row heights and
truncation at desktop and mobile viewport widths. It starts and closes its own ephemeral localhost server and uses
`PS_PLAYWRIGHT_MODULE` when supplied.

The standalone demonstration records begin, move, end and cancel intentions without importing `table`, `list`, `home`
or `framework`.

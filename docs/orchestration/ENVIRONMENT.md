# Property selector validation environment

## Scope and checkpoint

Task 4.2 and VAL-01: independently verified `PASS` on 15 October 2026. Application/standalone process ownership,
MySQL shutdown, synthetic SQL, browser navigation and tactile tooling pass.
See the [process ownership correction](environment/PROCESS-OWNERSHIP-CORRECTION.md),
[MySQL shutdown correction](environment/SHUTDOWN-CORRECTION.md) and
[independent verification](VERIFY-ENVIRONMENT.md) for evidence and the completed independent retest.
The existing framework runs against synthetic data on a dedicated MySQL server.
Application startup, owned restart, HTTP availability, real browser navigation, responsive sizing and actual SQL
observation are exercised. No selector, pane, projection API or product acceptance implementation is included.
Touch input is available through the installed Playwright runtime and Chromium, with the browser sandbox enabled.
Tap, stationary hold, movement and cancellation are verified on a standalone input probe. This establishes tooling
capability only; product gesture acceptance remains to be implemented and independently exercised.

Requested profile: `gpt-6.1-sol` / `medium`. The native sub-agent runtime does not expose independent proof of its
model or reasoning effort. No sub-agent was created.

Repository root: `/home/baptiste/itrocks/showtime/node_modules/@itrocks/property-select`.
Infrastructure starting HEAD: `b8e9d4e75d6d0b80dc2c31433fb44644502ea443`, version `0.0.5`;
infrastructure version: `0.0.6`.
Independent ownership retest tested HEAD: `8884e26d84314ea1f3256482ef04e6b83df2613e`; evidence version: `0.0.12`.
Tactile correction starting HEAD: `276943ad110fe8d1b3dffb06686b7afd52c2bc2d`; correction version: `0.0.7`.
The untracked `environment/` resources from the interrupted environment task were inspected, reused and corrected.
The package has no build script or runtime selector exports yet. Files under `docs` are included in its published files.

Application root: `/home/baptiste/itrocks/showtime`, HEAD `d7ca948292e28c248bdcc0283724e47c2a82bba4`, version `0.0.6`.
The initial `AD` entries for `audit-itrocks-dependencies.json` and `audit-itrocks-dependencies.txt` remain intact,
including staged additions and absent working files. No application source, tracking document or commit was created.
Build output is ignored application test material. Other package checkpoints are in [AUDIT.md](AUDIT.md).
Package checkouts under `node_modules/@itrocks` are real Git repositories, not symlinks.

Never execute `npm install` or `npm update` during this work: they can replace these repositories and destroy local
commits. Avoid `npx` commands that may implicitly download or install. Use existing binaries or `npm run` scripts.
If an `@itrocks` package is missing, clone its Git repository directly under `node_modules/@itrocks`.

## Tools and reconstruction

Observed versions: Node.js `24.0.1`, npm `11.6.4`, MySQL Community Server `8.0.46-0ubuntu0.24.04.4` on Linux.
The installed `mariadb` Node driver connects to the isolated MySQL instance. No installation is required.

From the application root, `npm run build` passes server TypeScript, browser TypeScript and Sass compilation.
For a changed framework owner, use `npm --prefix node_modules/@itrocks/OWNER run build`; rebuild dependencies before
consumers and finally rebuild the application. Do not run `vcs-modules` as a verification command.

Existing package build commands are available for `framework`, `home`, `list`, `table`, `reflect`, `reflect-path`,
`storage`, `mysql`, `sql-build` and `sql-join`. Consult their actual manifest scripts before building resources.
Existing test entry points:

- `npm --prefix node_modules/@itrocks/framework test` builds and runs `test/*.test.js`.
- `npm --prefix node_modules/@itrocks/list test` builds its server files and runs `test/**/*.test.mjs`.
- `npm --prefix node_modules/@itrocks/sql-build test` passes type checks and eight tests at this checkpoint.
- `npm --prefix node_modules/@itrocks/sql-join test` passes type checks and eight tests at this checkpoint.
- `node --test node_modules/@itrocks/table/test/*.test.mjs` runs the existing table tests from the application root.
- `reflect` provides `build:test`; `home`, `reflect-path`, `storage` and `mysql` have no `test` script
  at this checkpoint.
- Application `npm test` fails with exit 127 because `jest` is absent. This is an initial tooling limitation.

Only the two SQL package suites and the application build/test baseline were rerun by this continuation.
The other commands above are entry-point inventory, not claims of passed tests.

## Start and check the isolated stack

All commands below run from `/home/baptiste/itrocks/showtime`. Set the task-specific shell variable once:

```bash
recipe=node_modules/@itrocks/property-select/docs/orchestration/environment
node "$recipe/control.mjs" database
mysqladmin --no-defaults --socket=/tmp/showtime-property-select-env/mysql.sock -u root ping
node "$recipe/control.mjs" reset
PS_APP_PORT=13319 node "$recipe/control.mjs" app
PS_APP_PORT=13319 node "$recipe/control.mjs" status
node "$recipe/database-smoke.mjs"
PS_ENV_DIRECTORY=/tmp/showtime-property-select-env-retry PS_STANDALONE_PORT=13320 \
  node "$recipe/control.mjs" standalone
```

`database` initialises an insecure disposable datadir only when absent and starts MySQL bound to `127.0.0.1:13316`.
It refuses an existing PID file; when the server is already alive, skip that command and use `mysqladmin`.
Startup is asynchronous: repeat the readiness command after startup until it succeeds, checking logs on failure.
Do not start against an occupied port or remove a PID file without identifying the recorded process.
The existing isolated database was reused; fixture reset and SQL execution were independently rerun here.

Resources are entirely synthetic: database `property_select_recipe`, local test user `root`, empty password,
Unix socket `/tmp/showtime-property-select-env/mysql.sock`. These are disposable local credentials, not application
credentials. MySQL X Protocol is disabled. Do not expose these listeners externally.

Framework URL: `http://127.0.0.1:13319/country`.
Standalone support URL: `http://127.0.0.1:13320/`.
The runtime configuration hook overrides access, server, database and session configuration before framework binding.
It uses the real application classes and installed framework modules. Free access is confined to this local recipe.
Session files are placed under `/tmp/showtime-property-select-env/sessions` using the framework's application-relative
path convention. No application configuration file is edited.

An inherited listener on `13317` and standalone listener on `13318` were observed. Their application process ownership
could not be established from this continuation; they were left untouched.
Their URLs are not the owned restart proof.
The continuation launched and restarted the framework on `13319` with its own recorded PID, and launched standalone
support on `13320` with a separate PID directory.

Runtime logs and PIDs are under `/tmp/showtime-property-select-env/`; standalone support uses the `-retry` directory.
Environment overrides: `PS_APP_PORT`, `PS_DATABASE_PORT`, `PS_ENV_DIRECTORY`, `PS_STANDALONE_PORT`.
The database smoke script targets the canonical `13316` recipe. Changing database ports also requires adapting that
smoke connection; all delivered proof uses the canonical database port.

## Fixtures and query observation

[fixtures.sql](environment/fixtures.sql) resets only tables in the dedicated synthetic database via its dedicated
socket. It provides the real application `country` list with two countries and a separate `ps_` graph
with four invoices, customers, addresses, cities, countries, invoice lines and N-N tags. The graph includes two address
paths to the same type, cyclic customer parents, absent relations, nullable dates, decimals, booleans and empty versus
null strings.
Future metadata fixtures must describe inverse, unknown-cardinality and invalid-path cases; SQL rows alone do not
provide these metadata contracts.

[database-smoke.mjs](environment/database-smoke.mjs) executes real left joins, a parameter-bound criterion and a limit,
and checks four rows plus driver conversions. This is infrastructure proof using handwritten SQL. It does not validate
`DataSource.select()`, object hydration, count/pagination coherence or relational columns; those await DEP-11 tasks.

MySQL starts with `general_log=1`, writing `/tmp/showtime-property-select-env/queries.log`.
Observe actual executed statements with:

```bash
node "$recipe/control.mjs" queries
mysql --no-defaults --socket=/tmp/showtime-property-select-env/mysql.sock -u root -N \
  -e 'SELECT VERSION(), @@port, @@datadir, @@general_log;'
```

The journal contains the smoke marker, bound criterion expanded by the driver, and actual framework statements:
`SELECT id, name FROM country LIMIT 50` and the separate country count, with MySQL identifier quoting.
A focused synthetic excerpt is preserved in [sql-evidence.txt](environment/sql-evidence.txt).
Never use a private development database for these commands or copy private query logs into reports.

## Browser procedure and touch input

For interactive browser checks, use Codex In-app Browser, operated with `mcp__cua_repl.js`.
Create a tab with `cua.createBrowserTab('iab', URL)` and inspect `getAXState()` or `getScreenshot()`.
The framework list visibly renders both synthetic countries. After rebuilding, reload the tab and observe fresh state.
The standalone page explicitly says it has no selector; functional tasks must implement that demonstration later.
The static support server serves `environment/demo/`, with path traversal protection and local binding only.

Default browser viewport measured 1280 × 720. The documented `viewport` capability successfully set 390 × 844;
the existing list remained visible, and the override was reset. Retrieve capability documentation before using it.
Browser warning/error logs were empty for the checked framework page.

Capability inventory contains only browser `visibility`/`viewport` and tab `pageAssets`/`webmcp`.
Viewport options accept dimensions only. Neither the documented input API nor the available capabilities expose touch
context emulation, taps, touch sequences or pointer cancellation. No touch gesture was generated through IAB.
Native computer APIs
are disabled; MCP Apps is not a separate general-purpose browser. An explicit IAB visibility request is unsupported in
this sub-agent, while background tab operations work.

For tactile validation, use the installed Playwright `1.62.1` and its Chromium `151.0.7922.34` independently of IAB.
The runtime path comes from `load_workspace_dependencies`, without installing packages or browsers. Run:

```bash
node "$recipe/touch-probe.mjs"
```

The restricted shell rejects Chromium startup with `sandbox_host_linux.cc:41`, `shutdown: Operation not permitted`.
The normal `require_escalated` approval mechanism accepted this exact local browser test, which then passed.
Following agents must use that mechanism when necessary; approval remains controlled by the tool reviewer.
Keep `chromiumSandbox: true`. Do not disable the browser sandbox or alter permission settings to make startup pass.
The script launches and closes only its own browser, loads a local synthetic HTML file and touches no existing server.
Its output defaults to `/tmp/showtime-property-select-touch`; override with `PS_TOUCH_OUTPUT` to preserve separate runs.
Use `PS_PLAYWRIGHT_MODULE` to select a module path returned by the runtime dependency tool if that path changes.

The probe creates `hasTouch: true`, `isMobile: true` contexts at 390 × 844 and checks a tap at 844 × 390.
`page.touchscreen.tap()` generates taps. A CDP session uses `Input.dispatchTouchEvent` for `touchStart`, `touchMove`,
`touchEnd` and `touchCancel`; these enter the real browser input pipeline. Observed events are trusted and pointer
events have `pointerType: 'touch'`. No DOM dispatch or direct product handler call supplies the input.
This procedure can operate the actual application or standalone demonstration once product tasks implement them.

The [touch diagnostic](environment/TOUCH-DIAGNOSTIC.md) gives commands, assertions and precise results.
The committed [event evidence](environment/touch-evidence.json) records the executed input sequences.
No physical phone was available or tested. System interruption, edge gestures and native keyboards remain unverified.
Protocol cancellation verifies browser event transport only. Product scroll arbitration and rollback await their tasks.
Other browser observations are in [browser-evidence.md](environment/browser-evidence.md).

## Integrated check, shutdown and continuation

The current integrated infrastructure check is:

```bash
npm run build
PS_APP_PORT=13319 node "$recipe/control.mjs" status
node "$recipe/database-smoke.mjs"
```

Then open both URLs using the real browser procedure above. This check is not the later functional acceptance matrix.
Results are recorded in [test-results.txt](environment/test-results.txt).

Stop only the recorded owned processes, checking their command lines before signalling:

```bash
node "$recipe/control.mjs" stop-app
PS_ENV_DIRECTORY=/tmp/showtime-property-select-env-retry node "$recipe/control.mjs" stop-standalone
```

Both commands require the PID and matching `app.owner.json` or `standalone.owner.json` written by `control.mjs`.
They verify exact launcher/environment/port/token arguments, UID, executable, boot identity and process start ticks
before signalling, then wait for termination and remove their records. Port overrides are needed at launch only;
shutdown uses the recorded port. Missing or mismatched evidence fails without signalling. Existing processes without
these ownership records are left untouched. A repeated stop succeeds after owned records have been removed.
Start refuses an existing PID reservation; stop a verified instance before restarting it.
Run `node "$recipe/process-ownership-regression.mjs"` for the two-environment lifecycle and forged-PID checks.
The application stop/start cycle was executed and followed by an HTTP check and actual browser reload.
Original recipe servers remain running for subsequent tasks; the final verifier's isolated services are stopped.
For full teardown, `control.mjs stop` additionally stops its recorded dedicated MySQL instance and any matching
standalone PID in that directory. Use it only after confirming no following task needs the recipe.
MySQL shutdown uses `mysqladmin --protocol=SOCKET` after checking exact process arguments, UID, datadir, socket,
PID file and server UUID. It waits for the process, socket and PID file to disappear, with bounded timeouts.
A mismatch or inaccessible ownership evidence fails without stopping the database. Repeated full shutdown succeeds
when MySQL has already removed its PID file and socket. No datadir deletion is part of shutdown.
Reset fixtures with `reset` before a new SQL acceptance run.

SOLID review: launch, fixture and evidence resources contain no selector, SQL builder, reflection, table or pane product
logic. The configuration shim is explicitly test-only and calls installed public package entries; it is not a product
adapter. No additional framework owner was edited. Proposed local commit: `Prepare reproducible validation resources`.

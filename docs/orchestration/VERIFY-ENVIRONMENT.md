# Independent environment verification

## Verdict and checkpoints

Task 4.2 independent VAL-07 check: `NEEDS_FIX`, 15 October 2026. The tactile tooling correction passes.
The documented full shutdown fails on the verification-owned MySQL process; see the reproducer below.
Dependent preparation remains gated until that resource-control defect has been corrected and independently retested.

Tested package HEAD: `8df2b70fd11809b37be27297739adee1778f8cc0`, initially clean, version `0.0.7`.
This documentation checkpoint uses `0.0.8`; no product code or product tests were changed.
Application HEAD: `d7ca948292e28c248bdcc0283724e47c2a82bba4`, version `0.0.6`.
Both initial `AD` entries retain their staged objects and absent working files. No application commit was created.
No installation, update, implicit download, additional agent or change to another package was performed.
Requested verification profile: `gpt-6.1-sol` / `high`; the native runtime supplies no independent model/effort
attestation.

## Executed checks

The verifier read the delivered scripts and executed the checks rather than accepting the earlier report's assertions.
The installed workspace dependency runtime supplied Playwright `1.62.1` and Chromium `151.0.7922.34`.
Chromium ran with `chromiumSandbox: true`, through the normal approved elevated execution mechanism.

- `npm run build`: `PASS`, application server, browser and Sass compilation.
- `npm test`: exit `127`, `jest: not found`, confirming the recorded baseline limitation.
- `node --check` on `control.mjs` and `touch-probe.mjs`, and `git diff --check`: `PASS`.
- Existing canonical MySQL socket and port `13316`: dedicated datadir and general logging confirmed;
  delivered fixture reset and `database-smoke.mjs` pass against synthetic rows.
- A new MySQL `8.0.46` datadir under `/tmp/showtime-property-select-verify/data`, socket `mysql.sock`, port `13323`:
  initialisation, readiness, reset, real joins, four roots, absent relations, parameter-bound filtering, decimals,
  dates, null/empty strings and numeric booleans pass. The general log contains these queries and real framework SQL.
- Framework URL `http://127.0.0.1:13321/country`: real application classes display both synthetic countries at
  `1280 × 720`, `390 × 844` and `844 × 390`; the narrow screenshot was visually inspected.
- Standalone URL `http://127.0.0.1:13322/`: real browser navigation passes and explicitly displays the unimplemented
  selector status. This establishes launch support, without claiming a functional standalone selector.
- Delivered `touch-probe.mjs`: independent rerun passes tap, stationary hold, drag, cancellation and landscape tap.
  Its output is `/tmp/showtime-property-select-touch-independent/results.json` with five screenshots.
- A separate verifier performs the same gestures through browser input on the HTTP fixture. All gesture events are
  trusted, pointer events are tactile, hold duration exceeds `780 ms`, drag displacement exceeds `175 px`, and
  cancellation emits `pointercancel`/`touchcancel` without release events. Portrait and landscape capabilities pass.
- A separate no-touch context reports zero touch points, fine pointer and hover. Mouse input produces only trusted
  mouse pointer events; `page.touchscreen.tap()` rejects because `hasTouch` is false. No tactile false positive passes.
- Initial HTTP navigation can emit one mouse `pointermove` at `(0, 0)` before input. The verifier records this startup
  event separately and reloads before each gesture, as the delivered probe does. Strict gesture assertions remain.
- Browser console warning/error, page exceptions and failed-request collections are empty.
- Owned application and standalone shutdown succeed. MySQL administrative shutdown and complete stack restart succeed;
  the independent SQL/browser checks pass again after restart with the same fixtures. Full scripted shutdown fails
  twice on MySQL as described below.

Independent event evidence: [environment/independent-results.json](environment/independent-results.json).
The local verifier source is `/tmp/verify-property-select-environment.cjs`; command:
`node /tmp/verify-property-select-environment.cjs` through the approved browser execution mechanism.
Its SHA-256 is `77a98ed3977d2f12389af38f99aa1fce431c5c41df1cd092d4030fc6e7dd25b3`.
Screenshots, fresh MySQL logs and restart stdout remain under `/tmp/showtime-property-select-verify/`.

## Reproducer and required correction

Owner: environment support in `@itrocks/property-select`, `environment/control.mjs:69`.
On the dedicated verification stack, run from the application root:

```bash
recipe=node_modules/@itrocks/property-select/docs/orchestration/environment
PS_ENV_DIRECTORY=/tmp/showtime-property-select-verify PS_DATABASE_PORT=13323 node "$recipe/control.mjs" database
mysqladmin --no-defaults --socket=/tmp/showtime-property-select-verify/mysql.sock -u root ping
PS_ENV_DIRECTORY=/tmp/showtime-property-select-verify node "$recipe/control.mjs" stop
```

Repeat readiness until MySQL is alive. Starting from an already running verification database, omit `database`.
Expected: the owned server stops and port `13323` closes.
Observed twice: Node exits `1` with `Error: kill EACCES`, `syscall: 'kill'`, at `control.mjs:69`.
The recorded process is the dedicated `mysqld` with the exact verification datadir, port and socket, UID `1000`,
matching the caller's UID. The server remains alive. With app and standalone running, those two processes stop before
the MySQL failure. No unrelated listener is signalled.

An administrative stop of that exact disposable instance succeeds:

```bash
mysqladmin --no-defaults --socket=/tmp/showtime-property-select-verify/mysql.sock -u root shutdown
```

Correct the owned-database shutdown procedure within the existing permissions, retain process/instance ownership
checks, and independently retest complete stop/start. Do not disable safeguards or change a shared database service.
The verifier used administrative shutdown for cleanup; all three verification-owned ports are closed and data retained.
Original recipe listeners and the original dedicated MySQL were left available.

## Scope and limits

VAL-01 browser, isolated resources, reproducible fixture startup and query observation pass; full teardown needs the
correction above. VAL-05 emulation capability passes. Product selector gestures and DEP-11 APIs remain `NOT_RUN` because
they are unimplemented. Physical phone, native keyboard, system interruption and edge gestures remain unverified;
protocol cancellation establishes browser transport only. No phone is required from the user for this tooling check.

SOLID review: the recipe remains test infrastructure using installed framework owners. This verification introduces no
selector, pane, reflection, SQL builder or hydration implementation and changes no package boundary.
Proposed checkpoint commit: `Record independent environment verification defect`.

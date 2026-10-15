# Independent environment verification

## Verdict and checkpoints

Task 4.2 independent VAL-07 checkpoint: `NEEDS_FIX`, 15 October 2026, against the tested HEAD below.
The application/standalone [ownership correction](environment/PROCESS-OWNERSHIP-CORRECTION.md) is now implemented
and passes its author regression; an independent retest is pending. VAL-01 remains gated until that retest.
The owned MySQL shutdown and VAL-05 emulated touch tooling pass; product acceptance remains `NOT_RUN`.
The execution and reproducer below document the independent checkpoint, not a verdict on the pending correction.

Tested package HEAD: `3f6b2001a6b044174bfdc9a8b4f951e040f99c7d`, initially clean, version `0.0.9`.
This documentation checkpoint uses `0.0.10`; no product or launcher source was changed.
Application HEAD: `d7ca948292e28c248bdcc0283724e47c2a82bba4`, version `0.0.6`.
The initial `AD` entries retain staged objects `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`, and both working files remain absent.
No installation, update, implicit download, additional agent or application edit/commit was performed.
Requested profile: `gpt-6.1-sol` / `high`; the runtime supplies no independent model/effort attestation.

## Independent execution

The verifier inspected the implementation and wrote a separate lifecycle driver rather than running the corrector's
regression. Run from the application root through the normal approved local-service/browser execution mechanism:

```bash
node /tmp/verify-property-select-final.mjs
```

The driver creates a new datadir and runs two start/stop cycles. It adapts and reruns the earlier independent
browser/SQL verifier against the new stack. Driver sources, their SHA-256 values, lifecycle output and browser events
are in the
[final evidence](environment/final-independent-results.json).

Final resources: `/tmp/property-select-final-independent-M9yqWL/`;
MySQL `13471`, application `13472`, standalone `13473`.
Fresh server UUID: `963f9c84-c8d0-11f1-9d88-fc3497c07008`. Ports were checked free before launch.
Both cycles end with all three listeners closed, socket/PID file absent and datadir retained.
Listener availability on `13316`–`13323` and `13424`–`13426` is unchanged.

- New MySQL `8.0.46` initialisation, readiness, reset, administrative shutdown and repeated full stop: `PASS`.
- Restart without fixture reset retains UUID and synthetic country rows: `PASS`.
- MySQL datadir/socket/PID/UUID checks and foreign-directory PID refusal on both cycles: `PASS`.
- General journal contains independent joins, expanded bound criteria, real framework selection/count and `shutdown`;
  error log confirms `Shutdown complete`: `PASS`.
- Real SQL checks four invoice roots, absent relations, decimal/date/boolean conversion and null/empty strings: `PASS`.
- Framework browser navigation at `1280 × 720`, `390 × 844`, `844 × 390`, both countries and touch context: `PASS`.
  The narrow screenshot was visually inspected.
- Standalone HTTP/browser navigation displays the unimplemented selector status: `PASS` for launch support.
- Playwright `1.62.1`, Chromium `151.0.7922.34`, `chromiumSandbox: true`, trusted tap, stationary hold, movement,
  cancellation and landscape tap: `PASS`. Mouse/no-touch control and rejected touch API: `PASS`.
- Browser warning/error, page exception and failed-request collections are empty.
- Ordinary unrelated Node PID refusal for application and standalone: `PASS`.
- Another environment's application/standalone PID using the same launcher: `FAIL`; both listeners stop.
- `node --check` for control, regression and touch scripts, and documentation whitespace checks: `PASS`.

Earlier independent application build success and absent-Jest baseline remain applicable. No product source changed,
so these unchanged build checks were not repeated. The first driver run stopped its services but used an incorrect
SQL assertion quoting `id`; the real query is ``SELECT id, `name` FROM `country` LIMIT 50``. The corrected assertion
passed on the final fresh run. First retained datadir: `/tmp/property-select-final-independent-Ij6btN/`, fully stopped.

## Reproducer and required correction

Owner: `environment/control.mjs`, application/standalone shutdown branch, especially line 112.
The guard uses `argumentsText.includes(marker)` without verifying the environment identity.
MySQL correctly rejects the analogous foreign-directory PID.

Use a fresh directory and free port for these disposable test services:

```bash
recipe=node_modules/@itrocks/property-select/docs/orchestration/environment
owner=$(mktemp -d /tmp/property-select-pid-owner-XXXXXX)
foreign=$(mktemp -d /tmp/property-select-pid-foreign-XXXXXX)
PS_ENV_DIRECTORY="$owner" PS_STANDALONE_PORT=13473 node "$recipe/control.mjs" standalone
```

Wait for `http://127.0.0.1:13473/` and `$owner/standalone.pid`, then:

```bash
cp "$owner/standalone.pid" "$foreign/standalone.pid"
PS_ENV_DIRECTORY="$foreign" node "$recipe/control.mjs" stop-standalone
curl --max-time 2 http://127.0.0.1:13473/
```

Expected: reject the mismatched environment and retain its listener. Observed independently twice: exit `0` and the
original listener closes. The same sequence with `app.pid`/`stop-app` against the synthetic framework also fails.
Final failing PIDs: application `2106750`, standalone `2106768`. All were created by this verifier.
No inherited process was used for these negative tests.

Bind application/standalone identity to their exact environment resources before signalling; reject inaccessible or
unknown identity. Preserve repeated stops and the default directory. Add regression cases with two environments using
the same launcher; independently verify targeted and full stop. Retain the existing MySQL guards.

## Scope and limits

VAL-01 startup, browser, fixture reset, query observation and MySQL teardown pass; exclusive ownership of the other
services fails. Dependent preparation must await VAL-07 correction/retest. VAL-05 input capability passes.
The selector, pane and DEP-11 API/hydration acceptance remain unimplemented and `NOT_RUN`.
No physical phone was accessible; native keyboard, edge gestures and system interruption remain unverified.
Protocol cancellation establishes browser transport only. No user device is needed to finish these tooling checks.

SOLID review: infrastructure remains in its environment owner. No selector, reflection, SQL builder, storage or pane
implementation/boundary changes are introduced. Proposed commit: `Record environment process ownership defect`.

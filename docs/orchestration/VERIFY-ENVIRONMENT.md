# Independent environment verification

## Verdict and checkpoints

Task 4.2 independent VAL-07 retest: `PASS`, 15 October 2026. VAL-01 is complete: application and standalone ownership,
MySQL shutdown, synthetic fixtures, query observation, real browser navigation and emulated touch tooling pass.
The selector and DEP-11 product acceptance remain unimplemented and `NOT_RUN`.

Tested package HEAD: `8884e26d84314ea1f3256482ef04e6b83df2613e`, initially clean, version `0.0.11`.
This documentation/evidence delivery uses `0.0.12`; no launcher or product source was changed.
Application HEAD: `d7ca948292e28c248bdcc0283724e47c2a82bba4`, version `0.0.6`.
The initial `AD` entries retain staged objects `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`; both working files remain absent.
No installation, update, implicit download, additional agent or application edit/commit was performed.
Requested profile: `gpt-6.1-sol` / `high`; the runtime supplies no independent model/effort attestation.
No task manifest or validation matrix exists yet; task 4.3 owns their creation.

## Independent execution

The verifier inspected `control.mjs` and its launchers, wrote an independent lifecycle driver, and adapted the separate
independent browser/SQL driver. The corrector's regression was not used as the execution proof.
Run from the application root through the normal approved local-service/browser mechanism:

```bash
node /tmp/property-select-ownership-retest.mjs
```

The driver uses `/tmp/verify-property-select-environment.cjs` as the browser source and adapts only its resource paths
and ports. Both executed driver sources, SHA-256 values, 172 lifecycle/check records and browser/touch event evidence
are preserved in [ownership-independent-results.json](environment/ownership-independent-results.json).
The source inspection covers exact argument/environment matching, UID/executable/boot/start identity, exclusive PID
reservation, pre-signal identity recheck, bounded waits and rejection of inaccessible live-process identity.
No reproducible fail-open or harmful lifecycle race was found. The final identity read and POSIX signal are separate
operations; adversarial PID reuse in that interval is not deterministically injected by this check.

Fresh resources: `/tmp/property-select-ownership-independent-X0rFhO/`; environment directories `a` and `b`.
MySQL uses `13561`; environment `a` uses application `13562` and standalone `13563`; environment `b` uses application
`13564` and standalone `13565`. Both framework instances use only the new synthetic MySQL server.
Ports were checked free before launch. Fresh UUID: `0efd2c2f-c8d2-11f1-a83b-fc3497c07008`.
The restricted shell rejected the initial port availability probe with `listen EPERM` before any service launch.
The normal `require_escalated` mechanism approved the same test; no permission configuration was changed.

## Observed results

- Both environments' real application/standalone HTTP pages and duplicate-launch refusal: `PASS` on both cycles.
- Another environment's PID under local evidence, and copied foreign PID plus evidence: `PASS`; targeted stop rejects
  both for each service, retaining all five listeners and both framework country pages.
- Full stop with foreign application evidence: `PASS`; the foreign application and standalone remain available.
- Missing/malformed evidence and forged arguments, boot identity, directory, executable, service name, PID, port,
  start ticks, token and UID: `PASS`; both services reject every case before signalling.
- An unrelated disposable Node process recorded as either service: `PASS`; refusal leaves it and both stacks alive.
- Normal targeted stop, repeated targeted stop and full/repeated stop: `PASS`; stopping one environment preserves
  the other environment's services. PID and ownership records are removed after owned termination.
- New MySQL initialisation/reset, foreign-directory PID refusal, administrative shutdown and repeated stop: `PASS`.
  Restart preserves the UUID and both synthetic country rows. MySQL PID/socket disappear; its datadir remains.
- General journal includes independent joins, expanded bound criteria, real framework selection/count and `shutdown`;
  error log confirms `Shutdown complete`: `PASS`.
- Real SQL returns four invoice roots with absent relations, decimal/date/boolean conversion and null/empty strings:
  `PASS`. This remains infrastructure SQL, not `DataSource.select()` acceptance.
- Chromium `151.0.7922.34` through installed Playwright `1.62.1`, with `chromiumSandbox: true`: `PASS`.
  Framework navigation at `1280 × 720`, `390 × 844`, `844 × 390` displays both countries; the narrow screenshot was
  visually inspected. Standalone navigation displays its explicit unimplemented selector status.
- Genuine trusted touch tap, stationary hold of 802 ms, movement of 180 px, protocol cancellation and landscape tap:
  `PASS`. Touch pointers use `pointerType: 'touch'`; mouse/no-touch control and rejected touch API also pass.
- Framework navigation in a real touch context: `PASS`. Browser warnings/errors, page exceptions and failed requests
  are empty. Screenshots and raw server logs remain under the fresh resource directory.
- Both complete cycles end with all five owned listeners closed; availability on inherited ports `13316`–`13323`
  and `13424`–`13426` is unchanged. No inherited process was signalled.
- `node --check` for control, author regression and touch scripts, plus documentation whitespace checks: `PASS`.

Earlier independent application build success and absent-Jest baseline remain applicable. No product or launcher source
changed, so those unchanged build checks were not repeated. The verifier's initial resource directory from the rejected
port probe contains no running service. All services from the approved run are stopped; datadir and evidence remain.

## Scope and limits

VAL-01 and the application/standalone VAL-07 correction are complete. VAL-05 input capability passes; selector, pane,
product gestures and DEP-11 API/hydration acceptance remain `NOT_RUN` and must receive their planned independent checks.
No physical phone was accessible. Native keyboard, edge gestures and system interruption remain unverified.
Protocol cancellation establishes browser event transport only. No user device is needed for the tooling verdict.

SOLID review: evidence and lifecycle support stay in the environment owner; no product responsibility or public
framework/storage/SQL/reflection/table/pane boundary changes. Proposed commit: `Confirm isolated environment ownership`.

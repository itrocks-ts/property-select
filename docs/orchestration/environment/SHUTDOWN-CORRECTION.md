# Owned MySQL shutdown correction

## Checkpoint and scope

VAL-07 MySQL correction: independently verified `PASS`; task 4.2 still needs the separate application/standalone
ownership correction in the [current verification report](../VERIFY-ENVIRONMENT.md). Starting package HEAD:
`de8d89a5115288d1569ca0765536d60689ebcf21`, clean, version `0.0.8`; correction version `0.0.9`.
Requested execution profile: `gpt-6.1-sol` / `medium`; the launcher supplies no independent
effective-profile attestation.
No additional agent was created. Application HEAD remains `d7ca948292e28c248bdcc0283724e47c2a82bba4`.
The application's initial two `AD` entries were preserved. No installation, application edit or product change was made.

## Shutdown contract

`control.mjs stop` verifies the recorded MySQL PID, exact datadir/socket/PID-file and local bind arguments, and UID.
It queries the dedicated Unix socket and compares the server datadir, socket, PID file and UUID with local resources.
Only then does it send administrative shutdown over that socket. It never sends a process signal to MySQL.
It waits for process exit (including a terminated zombie), socket removal and PID-file removal before returning success.
Identity lookup, administrative shutdown and termination waits have finite timeouts. Ownership failures preserve the
resources and return an error. An already stopped instance succeeds only when both socket and PID file are absent.
Application and standalone signal checks retain their existing behaviour.

## Executed regression

From the application root:

```bash
node node_modules/@itrocks/property-select/docs/orchestration/environment/shutdown-regression.mjs
```

The regression creates a fresh retained datadir, checks ports `13424`, `13425`, `13426` are free and uses only them.
It starts MySQL, resets synthetic fixtures once, starts the real framework and standalone server, checks HTTP and
fixture availability, and executes complete shutdown. It repeats startup without resetting fixtures and stops again.
Each cycle also records the owned database PID in a different environment directory and asserts that shutdown refuses
that foreign instance while it remains available. Repeated shutdown succeeds. Both PID file and socket are absent;
all three ports close. MySQL error logs contain `Shutdown complete` and general logs contain the shutdown command.
The inherited availability vector on ports `13316`–`13323` is unchanged after both cycles.

Final result: `PASS`, exit `0`. Versioned stdout: [shutdown-results.txt](shutdown-results.txt).
Runtime data and logs: `/tmp/property-select-shutdown-regression-SABY8s/`; no regression service remains running.
The first test run stopped correctly but had a case-sensitive journal assertion for `Shutdown`; the actual SQL entry is
`shutdown`. The regression now checks that actual command. The failed run's datadir remains under
`/tmp/property-select-shutdown-regression-hsQlFK/`, with all its services stopped.
The preliminary isolated datadir `/tmp/showtime-property-select-shutdown-fix/` also remains with its server stopped.

The restricted shell in this execution cannot create IP sockets, connect to Unix sockets or inspect host PIDs in
`/proc`. The standard approved `require_escalated` mechanism ran the real local service tests without changing any
permission configuration. The original `kill EACCES` proof is versioned at checkpoint `de8d89a` in
`VERIFY-ENVIRONMENT.md`;
this namespace did not reproduce that exact errno through the old script, whose missing `/proc` handling returned
success without stopping MySQL. The corrected command fails safely when process ownership cannot be read.

`node --check` on both changed scripts and `git diff --check` pass. This correction changes infrastructure only;
existing browser/touch and SQL product acceptance claims are unaffected. Independent MySQL verification passes.
SOLID review: resource lifecycle stays in the environment owner; no framework boundary or product abstraction changes.
Proposed commit: `Stop isolated MySQL through its verified socket`.

# Application and standalone process ownership correction

## Checkpoint and scope

VAL-07 correction implemented; author regression `PASS`; independent retest pending. Starting package HEAD:
`7107dbb597822aa6980a5a0548e69df11f5acc09`, clean, version `0.0.10`; correction version `0.0.11`.
Requested profile: `gpt-6.1-sol` / `high`; effective model/effort has no independent runtime attestation.
No additional agent was created. Application HEAD remains `d7ca948292e28c248bdcc0283724e47c2a82bba4`,
with its original two `AD` entries preserved. No application source, documentation or commit was created.
No installation, update, implicit package download or permission configuration change was performed.

## Ownership contract

`control.mjs` reserves the service PID path exclusively before launch. The child receives separate exact arguments for
its launcher, absolute environment directory, runtime port and a random per-launch token. The runtime port is consumed
from that argument by the application/standalone launcher. Children do not overwrite PID records.
The controller records PID, full arguments, UID, executable path, Linux boot identity and process start ticks in the
same environment's `app.owner.json` or `standalone.owner.json`. These are local process identity records, not secrets.

Shutdown requires all recorded values and the exact live argument vector to match the requested environment and service.
This rejects foreign records even when copied together and rejects another environment's PID under an owned record.
Missing/malformed evidence, invalid PIDs and inaccessible process identity fail before signalling.
A missing `/proc` entry alone does not establish exit: the controller also checks PID existence, avoiding silent success
when a restricted process namespace hides a live host process. No signal is sent to an unidentified process.
The birth identity is rechecked immediately before `SIGTERM` and while waiting for exit, with a ten-second bound.
A disappearing executable during that wait is retried until stable exit evidence is available; this does not relax
the checks before signalling.
Stopped records are removed only after termination; repeated stop succeeds. Dead PID records can be cleared by stop.
The default environment remains `/tmp/showtime-property-select-env`; inherited instances lacking owner records are
left untouched. Start refuses existing PID reservations, including concurrent starts. Shutdown uses the recorded port,
so callers need not repeat launch port overrides. MySQL retains its dedicated socket/UUID shutdown checks.

## Executed regression

From the application root, using the normal approved local-service execution mechanism:

```bash
node node_modules/@itrocks/property-select/docs/orchestration/environment/process-ownership-regression.mjs
```

The regression creates two fresh environment directories, five free ports, one isolated synthetic MySQL server and two
real framework/standalone pairs. It runs two complete service start/stop cycles, checks both framework country pages
and standalone HTTP pages, and rejects duplicate starts. It copies foreign PID and identity records into the owner,
then copies only foreign PIDs; targeted and full shutdown refuse them without stopping foreign listeners.
Changed port, token, start ticks, UID and executable records, missing ownership records and invalid PIDs are rejected.
Each owned targeted stop completes, repeated stop succeeds, full stop terminates the foreign-owned pair, and restart
preserves synthetic country rows. Final full shutdown stops the owned MySQL through its verified socket.
Inherited availability on ports `13316`–`13323` and `13424`–`13426` is identical before and after both cycles.
All test processes are stopped; synthetic logs and datadirs are retained under the paths printed in the evidence.

Versioned output: [process-ownership-results.txt](process-ownership-results.txt).
The restricted shell returned `listen EPERM`; `require_escalated` approved the local regression without changing
permissions. An initial regression attempt used the foreign environment's nonexistent MySQL socket for `status`;
its services were fully stopped. The corrected test checks that foreign framework page directly over HTTP.
A process-exit race during `/proc` reads was corrected and both suites rerun sequentially, keeping inherited
listener observations stable. `node --check` on changed scripts and `git diff --check` pass.
The existing MySQL regression passes two cycles; output is in
[process-ownership-mysql-results.txt](process-ownership-mysql-results.txt).
No product or browser input code changed; browser/touch product acceptance remains outside this correction.
SOLID review: identity and lifecycle stay within the environment owner, with shared service helpers and no change
to framework, storage, SQL, reflection, table or pane contracts.
Proposed commit: `Verify application and standalone process ownership`.

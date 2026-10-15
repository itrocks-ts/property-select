# L1 tooling observations

No package was installed or updated. Node `24.0.1`, TypeScript `6.0.3`, existing `prepare-module` and installed
Playwright/Chromium were used. Tools were located through the bundled dependency inventory.

The restricted browser smoke exited with `listen EPERM: operation not permitted 127.0.0.1` before Chromium started.
The exact same driver passed through the normal escalation mechanism, with `chromiumSandbox: true`. It binds an
operating-system-assigned localhost port and closes both server and browser in `finally`; no persistent service
record, application route or process is modified.

The first npm pack attempt failed on the read-only default cache (`EROFS` under `/home/baptiste/.npm/_cacache/tmp`).
A temporary cache at `/tmp/property-select/L1/npm-cache` resolved this. Inspection then found that npm's `--prefix`
form of `pack` had inventoried showtime; that output was discarded. The explicit positional package path inventories
`@itrocks/property-select` `0.1.0`, and the review asserts package identity and all required artifact paths.
The dry run creates no archive and performs no network access (`--offline --ignore-scripts`).

The review helper's initial `execFileSync('git', ...)` raised a restricted child-process `EPERM` despite partial stdout.
The helper now checks fresh evidence from three direct Git commands and independently checks working-file absence.
No failed command is counted as passing evidence and no permission or browser sandbox setting was weakened.

# Independent session and suggestions acceptance

## Verdict and checkpoints

**PASS / DONE**, 16 October 2026. The independent retest closes [V4-01](../defects/V4-01.md) and completes every
observation assigned to V4. The historical V4 failure and its evidence remain intact.
L5 is eligible but was not started.
Requested profile: `gpt-6-astra` / `high`; actual dispatch belongs to the parent record, with no executor runtime
attestation. This verifier is distinct from L4, V4 and FIX-V4-1; no subagent was used.

Tested starting selector: `4a0e20283296122b43d0eab87c2f4c8b701ebf7a` / **0.5.2**. This tracking/test delivery increments
it to **0.5.3**, at first edit. No product source changed. Other tested owners retain these checkpoints:

- Fastify: `aca7bf377b0fd543c15004df3ebfb71fd10ab65f` / **0.4.1**.
- File store: `c62849840b82316d6e8b0594d2ba4eb962a1cefe` / **0.4.0**.
- List: `dcc099e285f83ea594a109c4f33b06664879f2e0` / **0.10.0**.
- Framework: `7211a97419add5165a8ac0f24f96afd5efd1b3fc` / **0.11.0**.

[Checkpoints and application preservation](../evidence/RETEST-V4-1/checkpoints.json).

## Fresh acceptance evidence

- Strict production action: **10 PASS**. Both PUTs acquired before revoke/expiry return exactly **410**; obsolete
  generations remain rejected. Actual process stop/start with the same secret/session directory resurrects no state,
  and a current generation accepts a fresh write with 200.
  [Strict results](../evidence/RETEST-V4-1/revocation-pass/revocation.json).
- Preserved independent V4 itinerary: **84 PASS**, both interfaces at all four sizes. Confirmed add/duplicate/rejected
  plural choices, exact column order, full branch/current/query/recents, shortcuts and config changes pass.
  Two real browser sessions isolate state; query variants share the canonical key while other routes/identifying ids
  remain distinct. Same-key reversed completion conflicts, removal tombstones block stale writes and permit fresh
  recreation. Distinct selector/list/autosave writes survive restart.
  [Fresh replay](../evidence/RETEST-V4-1/browser/results.json).
- Extended integrated itinerary: **124 PASS**, completing the corrective browser itinerary independently at all four
  sizes. An acquired browser PUT returns exactly 410; visible text asks to reload. The generic Retry button remains
  present, but stale retries stay 410 and create no state. Full reload recovers a writable generation.
  Actual storage-port failure returns 500, keeps local input and displays Retry; recovery persists the latest query.
  Real list configuration saves return 204, render the exact saved columns after reload and update advice while
  preserving recents. Native wheel position survives fold/reopen and full reload. Removed metadata truncates branch,
  removes advice and reruns the saved query with allowed results only.
  [Results, responses, native inputs and screenshots](../evidence/RETEST-V4-1/integrated-complete/results.json).
- New standalone itinerary: **94 PASS**, all four sizes. A test-only sessionStorage port and recording consumer are
  supplied at the fixture script URL; the actual public selector modules, metadata catalogue and template are served
  by the standalone server. The fixture has no framework/list/table imports. Browser inputs exercise confirmed,
  duplicate and rejected choices, configured limit three, business labels, exact shortcut replacement, full state
  restoration, native scroll, storage failure/Retry, configuration, metadata invalidation and synthetic session end.
  SessionStorage is solely the authorised standalone test port; the integrated adapter remains the real server session.
  [Independent results](../evidence/RETEST-V4-1/standalone/results.json).
- New adversarial challenge: **23 PASS**. Native inputs first establish nonempty four-level remembered branch,
  current ancestor, query, recent and scroll. Revoke and expiry each reject the acquired browser write, leave no durable
  state after restart and reset all six state fields after reload. Additional real production writes finish on either
  side of a delayed response autosave. In both completion orders, the second selector key, actual list-column save and
  nested autosave value survive an actual restart together.
  [Challenge evidence](../evidence/RETEST-V4-1/challenges-complete/results.json).
- Public-port itinerary: **14 PASS** for default six suggestions, translated technical fallback, object/root mapping,
  recent ancestors, non-added outcomes, latest-snapshot conflict recovery, coalescing, allowed persisted fields and
  identical synthetic ids across distinct file stores, including durable nested mutation.
  [Contract evidence](../evidence/RETEST-V4-1/contracts/contracts.json).

These are **325 browser assertions plus 24 contract/HTTP assertions**, with 52 screenshots from completed runs.
The portrait expiry guidance and landscape standalone restored-scroll screenshots were visually inspected.
T04/T14/T16/T17, NAV-06, REC-01–06, STA-01–05, PORT-05/07/08 and META-04 pass. T15/REC-07 click and generic-outcome
portions pass; actual moved/cancelled browser gestures remain V5. PORT-09 storage passes; preview timing remains V5/V6.

## Builds, public surface and boundaries

All five owner builds pass. Fresh suites: file store **9**, Fastify **12**, selector **29** with public TypeScript
checks, list state **2**. [Commands and logs](../evidence/RETEST-V4-1/commands.json).
Every declared export exists and appears in each owner's `npm pack --dry-run --json --ignore-scripts` inventory,
using a disposable cache. [Public resolution and inventories](../evidence/RETEST-V4-1/public-review.json).

SOLID review: selector owns state validation, queue and suggestions behind narrow structural ports; list owns canonical
keys and authorised actions; framework composes the ports; Fastify owns the response lifecycle; file store owns durable
session coordination. The fix detaches only the same stale request session and rethrows, retaining a replacement
session and unrelated failures. No concrete store dependency enters the production bridge. The tests use public
exports and actual actions, without copying product persistence, reflection, SQL or table geometry. No owner boundary
change or reproducible product failure was found.

## Reproduction and environment

Run from showtime with installed Node, Playwright **1.62.1** and Chromium **151.0.7922.34**, `chromiumSandbox: true`.
Both interfaces use mouse/keyboard at **1280 × 720, 768 × 900, 390 × 844 and 844 × 390**; native wheel drives scrolling.
Exact URLs: `http://127.0.0.1:13911/property-select-invoice` and `http://127.0.0.1:13912/state-fixture`.
The existing synthetic database on 13316 is reused without reset. Exact ownership-checked launch/stop outputs are in
JSON; directories are `/tmp/property-select/RETEST-V4-1-*`, secrets remain outside Git. All owned HTTP/browser
processes are stopped. The original V4 and FIX-V4-1 proof directories are unchanged.

```bash
checks=node_modules/@itrocks/property-select/docs/orchestration/environment/checks
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-V4-1
PS_V4_OUTPUT="$proof/revocation-pass" PS_V4_DIRECTORY=/tmp/property-select/RETEST-V4-1-revocation \
  node "$checks/V4-revoke.mjs"
PS_V4_OUTPUT="$proof/contracts" node "$checks/V4-contract.mjs"
PS_V4_OUTPUT="$proof/browser" PS_V4_DIRECTORY=/tmp/property-select/RETEST-V4-1-browser node "$checks/V4.mjs"
node "$checks/RETEST-V4-1-integrated.mjs"
node "$checks/RETEST-V4-1-standalone.mjs"
node "$checks/RETEST-V4-1-challenges.mjs"
```

The restricted initial launch reported `spawnSync EPERM`; normal escalation then encountered its partial owned
reservation. Ownership-checked stop cleared that instance before the successful run. The isolated `status` helper
expected a database socket in that task directory, so it could not check the reused canonical database. No reservation
or permission setting was bypassed. Failed setup evidence remains under `revocation` and `revocation-approved`.
The first expanded driver reset its input log on full reload and failed its final instrumentation assertion despite
30 passing functional observations. Its `integrated` evidence and four screenshots remain; the final driver records
native input across reloads and passes all four sizes. The first `challenges` proof used JSON string order for its
status labels while its structural assertions passed. Two equal state objects were therefore labelled FAIL. The final
`challenges-complete` run uses the same structural comparison for assertions and labels and passes 23 checks. Both
initial harness records and their eight screenshots remain available. No product assertion was weakened.

Browser page exceptions: none. Console errors are the intentionally rejected plural 400, stale-session 410 and injected
storage 500 responses. Integrated request failures are exclusively `net::ERR_ABORTED` during navigation/reload and
superseded metadata work; no unexplained network error was found. Standalone console/network records are empty.
No physical phone, native phone keyboard, system edge interruption, distributed file-store coordination or later
drag/touch acceptance is claimed. Those named later gates remain pending.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`; both AD index blobs and absent files are preserved.
Foreign `config.yaml` SHA-256 remains `67806429869be3aeb65018a1be6c7664f25d9933ca41c9b63826cde8c53647fa`.
No install/update, implicit-download npx, vcs-modules, application source/docs/commit, push, tag or deployment occurred.
Proposed local tracking commit: `Confirm session and suggestions acceptance`.

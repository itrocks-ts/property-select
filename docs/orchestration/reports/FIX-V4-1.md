# Preserve ended-session responses through autosave

## Verdict and checkpoints

**DONE (author), PASS**, 16 October 2026. The correction addresses [V4-01](../defects/V4-01.md).
Independent **RETEST-V4-1 remains PENDING**; V4 retains its historical NEEDS_FIX verdict and L5 stays blocked.
No retest, later feature or subdelegation was started. Requested profile: `gpt-6-astra` / `high`;
parent dispatch metadata is authoritative because the runtime supplies no independent model/effort attestation.

Product owner: `fastify`, base `8ec18b58550a45da1169506f11c3468d2143c0c4` / **0.4.0**;
correction `aca7bf377b0fd543c15004df3ebfb71fd10ab65f` / **0.4.1**.
Tracking owner: `property-select`, base `698f1fd5c0b092c59942774edee139c29fb97c12` / **0.5.1**, updated to **0.5.2**.
Both patches were applied at first edit against their clean HEADs. Generated runtime files remain ignored.

Unchanged owners: file store `c62849840b82316d6e8b0594d2ba4eb962a1cefe` / **0.4.0**;
list `dcc099e285f83ea594a109c4f33b06664879f2e0` / **0.10.0**;
framework `7211a97419add5165a8ac0f24f96afd5efd1b3fc` / **0.11.0**.
[Checkpoints and application fingerprint](../evidence/FIX-V4-1/checkpoints.json).

## Correction and regression

The production state action already catches `SESSION_STALE` and prepares HTTP 410. The request bridge now detaches
that ended request session when its transaction or refresh rejects with that code, then rethrows the same error.
Fastify session response autosave consequently skips the detached session, preserving the action's response and
avoiding renewal of the obsolete cookie. It does not destroy another session or suppress a storage failure.
An identity guard retains a replacement session if regeneration completes while an older operation is pending.
The callback and promise forms of the bridge's `reload()` share this behaviour.

The [owner HTTP regression](../../../../fastify/test/ended-session.test.js) covers actual listening servers:
revoke/expiry across transaction, promise refresh and callback refresh; exact 410 body and no Set-Cookie;
durable reads with a replacement store/server; ordinary transaction and autosave EIO responses remaining 500;
recovery with unchanged previous data; and a late stale operation after same-request regeneration.
The existing unhandled-error behaviour is unchanged. No broad 500-to-410 conversion or swallowed write is introduced.

SOLID and substitution: Fastify owns transport/session response lifecycle; file-store generation and locking remain
in their existing owner. The bridge uses the existing structural transaction/refresh ports and `SESSION_STALE` code,
with no concrete file-store runtime import. List still maps its own public response, `HttpStateStore` still maps 410
to Reload, and framework still supplies the transaction port. Consumer-owned interfaces and dependency direction
are unchanged. The selector remains host-neutral. Test delays/failures use public bindings and actual actions;
there is no copied persistence, SQL, reflection or table algorithm.

## Fresh observations

- Before correction, the strict production-action driver reproduced **2 FAIL / 8 PASS**: acquired revoke and expiry
  PUTs returned 500, expected 410. [Before proof](../evidence/FIX-V4-1/before/revocation.json).
- After correction, the same assertions pass **10/10**: both acquired PUTs return 410, new obsolete-generation PUTs
  return 410, actual process stop/start retains no obsolete state, and a fresh generation accepts writes with 200.
  The same fixture session directory and secret survive restart.
  [After proof](../evidence/FIX-V4-1/after/revocation.json).
- Strict V4 browser replay: **84 PASS**, both standalone and actual invoice route at 1280 × 720, 768 × 900,
  390 × 844 and 844 × 390. Suggestions, confirmed/duplicate/rejected choices, deepest branch/current/query/recents,
  fold/reload and isolation pass. Same-key reversed completion and removal tombstone reject old writes;
  two distinct state keys, real list-column save and delayed nested response autosave all survive process restart.
  Revoke/expiry and full reload pass. [Results and sixteen screenshots](../evidence/FIX-V4-1/browser/results.json).
- Additional actual integrated browser checks: **30 PASS** at 1280 × 720. The browser's own acquired PUT is delayed,
  its session ends, and the response is strictly 410. Visible text says “Reload the page.” Clicking the generic Retry
  button still returns 410 and cannot create state, including after process restart. Full reload clears stale input
  and a current-generation query persists normally, for both revoke and expiry.
- The same additional driver exercises a real state-action storage-port failure: HTTP 500, retained local input,
  visible persistence failure/Retry, and successful Retry after the synthetic failure is removed. Owner tests separately
  cover errors from store transaction and response-autosave methods. No HTTP success is fabricated in the browser.
- Actual list-column configuration save/reload updates used-branch suggestions while preserving recents. Native wheel
  position survives fold/reopen/full reload. Server metadata restriction truncates the remembered branch, removes
  invalid advice and reruns the saved query with allowed results and no removed path.
  [Additional proof and four screenshots](../evidence/FIX-V4-1/additional/results.json).
- Independent public-port driver replay: **14 PASS**. Priority/bound/labels, excluded outcomes, coalescing and latest
  conflict snapshot, persisted fields, store-instance isolation and nested durable mutation remain valid.
  [Contract evidence](../evidence/FIX-V4-1/contracts/contracts.json).
- Suites: Fastify **12 PASS**, file store **9 PASS**, selector **29 PASS** with public type checks, list state **2
PASS**.
  Fastify, file store, selector, list and framework builds pass. Both changed owners' exports resolve and are included
  by `npm pack --dry-run --json --ignore-scripts` using a temporary cache.
  [Commands and logs](../evidence/FIX-V4-1/commands.json), [public review](../evidence/FIX-V4-1/public-review.json).

The expiry guidance screenshot and portrait restored-state screenshot were visually inspected. No page exception
was recorded. V4's console records contain only the four expected plural-selection HTTP 400 messages. Additional
state response tracing records the deliberately induced 410/500 responses; this is not a claim that all console output
was independently audited. No physical-device or future drag/touch behaviour is accepted by this correction.

## Reproduction, resources and handover

Run from `/home/baptiste/itrocks/showtime`, using installed dependencies only. Each driver stops only the application
and standalone processes it started through `control.mjs`, preserving the existing synthetic database on 13316.
Choose a fresh output/directory for independent retest; do not overwrite the original V4 or FIX-V4-1 evidence.

```bash
checks=node_modules/@itrocks/property-select/docs/orchestration/environment/checks
proof=node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V4-1
PS_V4_OUTPUT="$proof/after" PS_V4_DIRECTORY=/tmp/property-select/FIX-V4-1-after \
  node "$checks/V4-revoke.mjs"
PS_V4_OUTPUT="$proof/contracts" node "$checks/V4-contract.mjs"
PS_V4_OUTPUT="$proof/browser" PS_V4_DIRECTORY=/tmp/property-select/FIX-V4-1-browser \
  node "$checks/V4.mjs"
node "$checks/FIX-V4-1-browser.mjs"
```

The additional driver defaults to `evidence/FIX-V4-1/additional` and `/tmp/property-select/FIX-V4-1-additional`;
it also accepts `PS_V4_OUTPUT` and `PS_V4_DIRECTORY`. It extends the existing V4 fixture with an explicit test-only
storage-failure switch; normal production adapters remain installed. The original strict assertions are unchanged.
Historical V4 evidence is byte-for-byte retained. New evidence lives exclusively under `evidence/FIX-V4-1/`.

Browser: installed Playwright **1.62.1**, Chromium **151.0.7922.34**, `chromiumSandbox: true` throughout.
Framework port **13911**; standalone port **13912**. Exact ownership-checked start/stop output is in each JSON.
The restricted initial child-process launch returned EPERM. The normal escalation mechanism then allowed the same
local recipe; its partial owned start was stopped with the ownership checker before retry. Package inventory
subprocesses
also required normal escalation. No browser sandbox or permission setting was disabled.
An initial list test invocation from the application root was not discovered under `node_modules`; running the actual
file from its list-owner directory passed. An inventory harness initially resolved an absolute package directory,
then was corrected to resolve the package's public specifier. Neither harness issue changed acceptance assertions.

All owned HTTP/browser services are stopped. Session secrets remain outside Git in their fixture directories.
No install/update, downloading npx, vcs-modules, push, tag, publication or deployment occurred.
Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`, with both AD index blobs/absent working files and
foreign `config.yaml` SHA-256 `67806429869be3aeb65018a1be6c7664f25d9933ca41c9b63826cde8c53647fa` preserved.
No durable showtime source/document or commit was added.

Remaining limits: this is author evidence. Independent RETEST-V4-1 must challenge the corrected checkpoints and complete
its own V4 observations before clearing the gate. The supplemental observations run at desktop size; the strict replay
covers all four sizes. File-store coordination retains its documented single-process scope.

Local commit subjects: `Preserve ended session responses through autosave` (Fastify: source, regression, README,
manifest)
and `Verify ended session response correction` (selector: tracking, fixture/driver support, evidence, manifest).

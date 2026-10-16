# RETEST-V2-TABLE-1: Independently verify frozen column reveal

## Objective and prerequisites

Verify the corrective checkpoint for [V2-TABLE-1](../defects/V2-TABLE-1.md) before L2-LIST.
Prerequisite: completed FIX-V2-TABLE-1 author report and attributable product commit. Status: `PENDING`.
Use a fresh verifier distinct from the author/corrector. No sub-agent or subsequent task.

## References and entry points

Read application/owner AGENTS and handbook routes, table/property-select READMEs,
[COMMON](../COMMON.md), [EXECUTION](../EXECUTION.md), [CONTRACTS](../CONTRACTS.md),
[SELECT-CONTRACT](../SELECT-CONTRACT.md), [VALIDATION](../VALIDATION.md),
[ENVIRONMENT](../ENVIRONMENT.md), [VERIFY-ENVIRONMENT](../VERIFY-ENVIRONMENT.md),
[L2-TABLE](../reports/L2-TABLE.md), [V2-TABLE](../reports/V2-TABLE.md), its defect and correction report.
Historical failing table checkpoint: `c7c9a65fb5497b1e76d809622eb0d3f4e44f1f97` / `0.3.0`.
Inspect actual corrective diffs, manifests and public outputs before accepting tested checkpoints.
Entry points: table's public addition/freeze/reorder APIs and generic standalone `/table-fixture`.

## Independent itinerary and acceptance

Replay V2-TABLE's full itinerary with independent assertions and new evidence, including real mouse/keyboard input
at 1280 × 720, 768 × 900, 390 × 844 and 844 × 390. Keep `chromiumSandbox: true`.
Use ordinary Add metric/duplicate clicks, measure actual sticky Select/Actions cell rectangles and compare visible
metric width with the minimum of its width and available inner width. The historical metric was obscured by 82 px.
Verify both-direction reveal, colgroup and header-backed configurations, wide columns and focus/row selection.

Repeat real async header/body insertion, exact header/colgroup/all-row order, slow rapid duplicates, creation error,
value error/retry, flash cleanup/theme/reduced motion, provisional cancellation, reset/dispose late-response cleanup,
one sort listener, header reorder/delete/frozen-origin protection and asynchronous replacement during header drag.
Full reload must restore the generic fixture baseline without duplicated listeners. Inspect warnings/errors,
exceptions, failed requests and HTTP errors. Save before/after screenshots and expected/observed assertion records.
Supplementary public contract calls must be identified separately from trusted product interactions.

Rebuild table/tracking/application using actual manifests, run table Node tests from its owner directory and check
public JS/declarations/CSS/package inventory. Do not fix product code during verification. Any reproducible defect
returns NEEDS_FIX and appends the next correction/retest cycle under EXECUTION; do not advance consumers.

## Commands, ownership and delivery

Use the ownership-checked launcher with a fresh verifier directory/port, inspect existing records first and record
exact URLs/overrides. V2-TABLE's owned 13762 server was stopped; do not signal the inherited author instance.
The full V2-TABLE commands are in its report; drivers must write to new retest evidence and preserve failed evidence.
Run both full and minimal reproduce paths against the new corrective SHA; author's results cannot substitute.

No install/update, implicit-download npx, vcs-modules, application edits/commits, permission/sandbox changes or push.
Preserve showtime HEAD d7ca948, both staged AD blobs/absent working files and unrelated owner changes.
Write `reports/RETEST-V2-TABLE-1.md`, `evidence/RETEST-V2-TABLE-1/` and update PLAN/matrix/defect status. Apply a
tracking patch from its current HEAD. Record requested profile and actual tested commits/versions, commands, outcomes,
input mode, seed, URL, browser version, ownership, checksums and explicit SOLID review. Review complete diffs and commit
explicit task paths only. Never put a report's own commit SHA inside itself.

## Calibration and limits

Requested `gpt-6.1-sol` / `high`: independent sticky geometry and asynchronous header regression verification.
Parent records actual dispatch; executor runtime model/effort is not independently attestable.
Combined list/SQL/external transport and genuine touch-product gestures remain later gates; phone-sized mouse
contexts are not physical phone or touch acceptance. Return status, SHAs, versions, validation, proofs and limits
in at most eight lines.

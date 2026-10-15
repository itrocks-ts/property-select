# Sequential execution and evidence

## Authoritative plan and checkpoints

[PLAN.json](PLAN.json) lists all 33 tasks in the required serial order. Tasks `P01`, `P02`, `S01` and `P03` are recorded
preparation work; do not replay them. `P04` is the next task. Planning completion is not independent plan approval.
After a successful independent `P04`, continue automatically with `S02`; no additional user decision is required.

The mandatory chain is `S01` PHP audit → `S02` storage contract → `S03/S04` reflection → `S05/S06` joins/builder →
`S07` MySQL and bindings → independent `VSQL` on real MySQL → integration `L2-LIST` → independent browser `V2`.
The selector core and early generic host pieces are deliberately scheduled after the SQL gate for a single serial
handover; they do not acquire any SQL dependency. A later task's transitive prerequisites are mandatory gates.

Read each task card, its linked contracts and source specifications. Before the first write in each owner, inspect
instructions, HEAD, staged/unstaged/untracked changes and package version. Baselines for unchanged owners remain in
[AUDIT.md](AUDIT.md); delivered changes supersede them through each report's tested checkpoints and parent commit
record.
Preserve showtime HEAD `d7ca948292e28c248bdcc0283724e47c2a82bba4` and these index blobs/working-file absences:

- `audit-itrocks-dependencies.json`: `ff4dc939cce17af3aa7c14d8063034c5cc85b867`.
- `audit-itrocks-dependencies.txt`: `de960a87ea9b4f6eb1cece85ab32596baef11fcd`.

No durable application code, documents or commits; place reusable fixture classes, routes and scripts in tracking or
owner tests and load them with the isolated launcher hook. Do not touch application source to make a recipe convenient.
No `npm install`, `npm update` or implicit-download `npx`. Missing `@itrocks` owners are cloned directly into their
`node_modules/@itrocks` destination and their baseline is recorded before changes.

## Launcher and calibration

One fresh executor per task, no overlapping agents and no subdelegation. The current tool schema exposes
`spawn_agent` with `fork_turns: none`, explicit `model` and `reasoning_effort`, including Astra/high and Sol/high.
The orchestrator records dispatch metadata, not an executor's self-reported effective model. Effective runtime identity
is not independently exposed to this planning agent. This distinction must remain visible in every report.
A tool advertised in a schema is still checked at actual dispatch; an unavailable required profile follows prompt
section 3 rather than being silently replaced.

Astra/high is selected for `S01`, `P03/P04`, `S05/S06/S07`, `VSQL`, `L2-LIST/V2`, `L5/V5`, `L6/V6` and `V7`.
Their concrete risks are documented in each card. Sol/high handles stabilised but nontrivial reflection, selector state,
search, table and cross-module checks. Sol/medium handles routine browser clicks, settled pane/UI implementation and
handover. No mechanical task justifies Luna at this point. No precise unresolved problem warrants xhigh initially;
a diagnostic task can request it with the required explicit reason. Do not trade away required checks for token savings.

Historical environment task `P02` records its initial medium profile and successful corrections/retests from the
existing
reports; this does not retrospectively relabel those separate high-effort executions.

## Build and fixture readiness

Package commands run from the application root, using the installed tools. New tests explicitly listed in cards are
deliverables; they do not exist at planning time. For `property-select`, `L1` creates build/test scripts. `S07`
needs only
existing owner builds and its database driver; it must not try to run a selector build before `L1` creates it.
Use `node --test` for newly introduced `.test.mjs` tests in owners without a test script. Existing SQL TS tests retain
installed `tsx` through their current npm test script. No absent Jest installation is required.
For source/build conventions read the owner's handbook links. Always verify generated public CJS, browser `.js`, types,
HTML/CSS/icons and manifest allowlists; do not commit generated files against the owner's existing convention.

The current environment supplies SQL rows, not a reflected invoice application. `S07` must deliver synthetic model
classes with runtime files, `.d.ts` and readable source required by reflection. Map their stores/columns through the
actual framework conventions and adjust only isolated fixture schema where necessary: existing SQL fixtures use
`id_customer`, while the current TypeScript mapping normally uses `customer_id`. Do not introduce product code to
special-case recipe names. Extend fixtures with declared inverse/N-N/unknown relations, representation dependencies,
invalidated paths, alias collisions and 120 roots with tied sort values. Keep initial four-root cases identifiable.

`L2-LIST` loads those classes through the existing after-composition bootstrap hook and real route/action registration.
Deliver `http://127.0.0.1:13319/property-select-invoice`; preserve `/country` as a control route. Record any routing
constraint and update the card/matrix with the tested route before `V2`. The standalone server serves its own static
provider, consumer, public selector module and styles via an explicit asset allowlist. It must not load framework or
reflection adapters. Generic pane/table fixtures used by `V2-HOME/V2-TABLE` have separate URLs documented by authors.
Do not count those generic host fixtures as the host-free selector demonstration.

Owned recipe ports and touch transport are in [ENVIRONMENT.md](ENVIRONMENT.md). Readiness checks inspect existing owned
records and status before launching. Do not repeatedly start or remove PID files to bypass an occupied listener.
If inherited servers require different owned ports, record exact overrides and amend verification URLs before execution.
Independent verification may create its own isolated ports/datadir through the approved launcher.

## Browser gates and evidence

Each visible delivery is followed immediately by its distinct gate: `L2-UI/V2-UI`, `L2-HOME/V2-HOME`,
`L2-TABLE/V2-TABLE`, `L2-LIST/V2`, `L3/V3`, `L4/V4`, `L5/V5`, `L6/V6`.
Both standalone and real integration are required where their behaviour exists. Real SQL evidence and browser rendering
evidence are separate; a snapshot of generated SQL or a fake DOM cannot replace either.

Browser cards use 1280 × 720 hover/mouse/keyboard, 768 × 900 narrow, 390 × 844 portrait and 844 × 390 landscape.
`V6` and `V7` run genuine touch emulation through the already verified Playwright/Chromium input transport; preserve
`chromiumSandbox: true`. Use normal tool escalation if restricted launch fails. No physical phone is currently
available.
That absence only leaves native keyboard, physical edge gestures and system interruptions unverified; it does not waive
any automatable case. Real browser cancellation and contract cancellation must be identified separately.

Versioned reports live at `reports/<task>.md`, concise assertion records/screenshots at `evidence/<task>/`.
Large traces may remain at `/tmp/property-select/<task>/` with path and checksum in the committed report. Retain inputs,
expected/observed outcome, browser/version, viewport/input, fixture seed, command, URL and tested owner SHA/version.
The author creates a reproducible fixture; the verifier drives inputs and owns its independent assertions.

In VALIDATION.md, `NOT_RUN` means the planned product check has not run. `PASS` is permitted only with linked fresh
proof. Record FAIL/BLOCKED with a reproducer and owner. Update each requirement's verdict only when all its linked cases
pass. Environment-only VAL-01 proof does not validate product gestures, SQL hydration or the final phase.

## Correction protocol

On a reproducible failure, mark the failed gate `NEEDS_FIX` and add `FIX-<gate>-<n>` followed by
`RETEST-<gate>-<n>` to PLAN.json and the serial order. Create autonomous cards from the same required fields:

- The correction depends on the failed gate's completed diagnostic report; this is the only exception to the ordinary
  successful-prerequisite rule. It records exact reproducer, owners, failing assertions and contract impacts.
- The retest depends on the corrective commit and uses a new verifier distinct from the corrector. It reruns affected
  cases and integrations on the corrected SHAs; it cannot accept stale evidence from the previous gate.
- Rewire every blocked consumer to depend on the successful retest, retaining the failed gate in history. The gate is
  cleared only after retest PASS; no feature proceeds on an unresolved failure.
- Use at least the failed task's required risk profile for cross-module corrections. After two failed cycles add a
  transversal diagnostic, explicitly evaluating Astra. xhigh needs a specific difficulty. After three cycles with no
  progress or new testable hypothesis, preserve the reproducer/checkpoint and report the actual blocker.

A failed test is not itself permission to abandon scope, weaken assertions or ask for a product decision. New contract
changes require affected consumers and independent proof to be revisited. Preserve unrelated changes and use normal
approval for external resource limits; never change permission settings or install an orchestrator.

## Final acceptance and delivery

`V7` independently rebuilds and replays the full matrix. `D8` is a separate task checking versions, exports, package
contents, local resolution, documentation and operational restart. D8 creates its small repeatable final smoke driver
`environment/checks/D8.mjs`; V7 may use a new orchestration driver `environment/checks/V7.mjs` to call independent
suites.
Both are planned test support, not existing commands.

D8 starts only after fresh V7 proof with no functional defect or mandatory unexecuted case. If D8 finds a defect, insert
correction/retest tasks and repeat affected acceptance before delivery. Confirm both URLs in a real browser, execute
add/reload smoke, leave the owned application available, and check it still answers at the final report. Record its PID
ownership and stop command; clean only disposable resources no longer needed. Check every owner Git status and preserve
showtime's initial AD entries. No push, tag, publication or deployment belongs to this work.

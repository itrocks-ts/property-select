# Phase 1 validation matrix

## Verdict and reading rules

Planning coverage is complete; product acceptance is **NOT_RUN**. The only completed execution gate is VAL-01,
backed by [VERIFY-ENVIRONMENT.md](VERIFY-ENVIRONMENT.md). VAL-02 plan coverage is independently approved by
[P04](reports/P04.md). [S02](reports/S02.md) passes the neutral storage contract checks; SQL execution and browser
observations remain pending. [S03](reports/S03.md) passes reflection relation-fact checks; typed path resolution
and provider/search observations remain pending.
Overall product cases below remain NOT_RUN until all their stage observations pass, including SQL and browser cases.
No fixture smoke is product proof.

Requirement rows link an implementation, its independent gates and scenario/extra-case oracles. Owner repositories
are mapped in the next table and each PLAN.json entry; task cards give exact entry points and commands. Every applicable
row is also replayed by V7; D8 validates operational delivery separately. Phase 2 is excluded.

Methods: U = unit; C = cross-module contract; I = integration on real services; B = real browser; P = physical device.
For T24, P is conditional on available hardware; B touch emulation is mandatory. Cases with multiple gates require all
relevant observations to pass. Gate proof location is `evidence/<gate>/<case-id>.*`, with verdict and tested checkpoints
in `reports/<gate>.md`. Future paths are evidence destinations, not files asserted to exist.

At execution, add a result entry under each case with expected/observed outcome, PASS/FAIL/BLOCKED/NOT_RUN, exact proof
link and current owner versions/SHAs. A requirement remains NOT_RUN or FAIL until all its linked cases pass. A later
product change invalidates its affected proof and requires independent retest under EXECUTION.md.

## Package ownership key

| Implementation | Owning packages                               |
| -------------- | --------------------------------------------- |
| S02            | storage                                       |
| S03            | reflect                                       |
| S04            | reflect-path                                  |
| S05            | sql-join, framework                           |
| S06            | sql-build                                     |
| S07            | mysql, framework, property-select             |
| L1             | property-select                               |
| L1-META        | framework                                     |
| L2-UI          | property-select                               |
| L2-HOME        | home                                          |
| L2-TABLE       | table                                         |
| L2-LIST        | list, framework, property-select              |
| L3             | property-select                               |
| L4             | selector/list/framework; HTTP/session below   |
| L5             | property-select, table, list, home, framework |
| L6             | property-select, table, home, list            |
| L7             | property-select, list, table, framework       |

L4 additionally owns `fastify` and `fastify-file-session-store` for session transactions, snapshots and generation
checks; `selector` in its compact table row means `property-select`.

All verification reports, plans and reusable recipe evidence belong to `property-select`. `VSQL` verifies the real
`storage/reflect/reflect-path/sql-join/sql-build/mysql/framework` chain; integrated browser gates also verify
`property-select/list/table/home/framework`. Reused presentation, composition, route and session owners are in DEP-10.

## Functional requirements

Source: [V1 sections 1–8](../it-rocks-selecteur-relationnel-specifications.md). Each line below has an individual
oracle.

### ARC requirements

| Requirement | Implementation  | Independent gates | Cases                 |
| ----------- | --------------- | ----------------- | --------------------- |
| ARC-01      | L1              | V2-UI             | T01                   |
| ARC-02      | S03 L1-META     | V3                | T01, META-01, META-02 |
| ARC-03      | L2-LIST         | V2                | T01                   |
| ARC-04      | L1 L4 L5        | V4 V5             | T01                   |
| ARC-05      | L6              | V6                | T27                   |
| ARC-06      | S03 S04 L1-META | V3                | T13, META-01, META-03 |

- **ARC-01**: Generic navigation/search emits intentions without table/data access.
- **ARC-02**: Provider owns authorised type/path/relation facts.
- **ARC-03**: Host owns pane, identity, columns, preview and confirmation.
- **ARC-04**: Existing transport/session components stay behind host ports.
- **ARC-05**: One navigation/interaction model serves desktop and mobile.
- **ARC-06**: Inverse and N-N logical relations are navigable without technical tables.

### API requirements

| Requirement | Implementation | Independent gates | Cases                 |
| ----------- | -------------- | ----------------- | --------------------- |
| API-01      | L1 S04         | V2-UI VSQL        | T01, T11              |
| API-02      | L1             | V2-UI             | T01                   |
| API-03      | S03 L1-META L3 | V3                | T26, META-02, PORT-03 |

- **API-01**: String/segment paths agree; root is navigable only.
- **API-02**: Root, used paths, intentions and applied acknowledgements cross narrow ports.
- **API-03**: Metadata is lazy and authorised; no business-value reads for navigation.

### NAV requirements

| Requirement | Implementation | Independent gates | Cases    |
| ----------- | -------------- | ----------------- | -------- |
| NAV-01      | L1 L2-UI       | V2-UI V2          | T02      |
| NAV-02      | L1 L2-UI       | V2-UI V2          | T02      |
| NAV-03      | L1 L2-UI       | V2-UI V2          | T02, T10 |
| NAV-04      | L1 L2-UI       | V2-UI V2          | T02      |
| NAV-05      | L1 L2-UI       | V2-UI V2          | T03      |
| NAV-06      | L4             | V4                | T04      |
| NAV-07      | L1 L2-UI       | V2-UI V2          | T05      |
| NAV-08      | L3             | V3                | T11      |
| NAV-09      | L2-UI L6       | V2-UI V6          | T08, T24 |

- **NAV-01**: Remembered branch and current depth are independent.
- **NAV-02**: Exactly one object context is displayed.
- **NAV-03**: Ancestor/descendant activation keeps branch and query.
- **NAV-04**: Returning through the remembered relation preserves descendants.
- **NAV-05**: Divergence replaces only the branch suffix.
- **NAV-06**: Shortcut replaces full branch and clears query.
- **NAV-07**: Selection preserves branch, current context and query.
- **NAV-08**: Result navigation targets its real path and preserves valid branch prefixes.
- **NAV-09**: All breadcrumb levels remain accessible without accidental transport.

### UI requirements

| Requirement | Implementation     | Independent gates | Cases    |
| ----------- | ------------------ | ----------------- | -------- |
| UI-01       | L2-HOME L2-LIST L4 | V2 V4 V6          | T27      |
| UI-02       | L2-HOME L2-LIST L4 | V2 V4 V6          | T27      |
| UI-03       | L2-HOME L2-LIST L4 | V2 V4 V6          | T16, T27 |
| UI-04       | L2-UI              | V2-UI             | PORT-01  |

- **UI-01**: Right pane shrinks an interactive desktop main region and starts folded.
- **UI-02**: Mobile pane and anchored header add control stay accessible.
- **UI-03**: Click does not close; fold/reopen preserves context and scroll.
- **UI-04**: Simple breadcrumb/search/suggestions/list with no origin icons or inline help.

### ACT requirements

| Requirement | Implementation   | Independent gates | Cases         |
| ----------- | ---------------- | ----------------- | ------------- |
| ACT-01      | L2-UI L2-LIST L6 | V2-UI V2 V6       | T05           |
| ACT-02      | L2-UI L2-LIST L6 | V2-UI V2 V6       | T05, T07      |
| ACT-03      | L2-UI L2-LIST L6 | V2-UI V2 V6       | T05, T06      |
| ACT-04      | L2-UI L2-LIST L6 | V2-UI V2 V6       | T05, T06      |
| ACT-05      | L2-UI L2-LIST L6 | V2-UI V2 V6       | T05, T06, T24 |
| ACT-06      | L2-UI L2-LIST L6 | V2-UI V2 V6       | T05, T22      |
| ACT-07      | L5               | V5                | T08, T11      |
| ACT-08      | L2-UI L2-LIST L6 | V2-UI V2 V6       | T25, PANE-04  |

- **ACT-01**: Terminal main/+ activation emits one selection.
- **ACT-02**: Relation main navigates; + selects the object itself.
- **ACT-03**: Name and chevron share one action; + is aligned at right.
- **ACT-04**: Hover/focus + reserves space without layout shifts.
- **ACT-05**: No-hover shows + only for relations; hybrid input retains all actions.
- **ACT-06**: No bubbling duplicate or residual click after recognised drag.
- **ACT-07**: Intermediate relation segments navigate/transport their true path; root never drags.
- **ACT-08**: Logical keyboard order, visible focus and valid interactive controls.

### REC requirements

| Requirement | Implementation | Independent gates | Cases        |
| ----------- | -------------- | ----------------- | ------------ |
| REC-01      | L4             | V4                | T14          |
| REC-02      | L4             | V4                | T14          |
| REC-03      | L4             | V4                | T14          |
| REC-04      | L4             | V4                | T14          |
| REC-05      | L4             | V4                | T04, T14     |
| REC-06      | L4             | V4                | T14, PORT-05 |
| REC-07      | L4 L5          | V4 V5             | T15          |

- **REC-01**: Merge recent, used and configured advice in that priority.
- **REC-02**: Terminal maps to parent context; object maps to itself; root excluded.
- **REC-03**: Keep maximal used destinations independently on each branch.
- **REC-04**: Retain recent ancestors and deduplicate full paths stably.
- **REC-05**: Bound destinations to configured limit, six initially; shortcut path is exact.
- **REC-06**: Accept static root advice without learning or a favourites editor.
- **REC-07**: Only confirmed new additions update recents.

### SEA requirements

| Requirement | Implementation | Independent gates | Cases    |
| ----------- | -------------- | ----------------- | -------- |
| SEA-01      | L3             | V3                | T10      |
| SEA-02      | L3             | V3                | T09      |
| SEA-03      | L3             | V3                | T09, T11 |
| SEA-04      | L3             | V3                | T09, T11 |
| SEA-05      | L3             | V3                | T09      |
| SEA-06      | L3             | V3                | PORT-06  |
| SEA-07      | L3             | V3                | T12      |
| SEA-08      | S03 L3         | V3                | T13      |
| SEA-09      | S03 L3         | V3                | T13      |

- **SEA-01**: Search descendants of current context only; no root expansion.
- **SEA-02**: All words match normalised name/label/path fragments, never record values.
- **SEA-03**: Distinct paths to the same type remain distinct results.
- **SEA-04**: One entry per path, final name then root-to-parent path.
- **SEA-05**: Result activation/navigation and immediate clear follow the action contract.
- **SEA-06**: Stable local/depth/name/business ranking and focus across asynchronous arrivals.
- **SEA-07**: Cache, cancel and budgets distinguish loading, empty, error and limited states.
- **SEA-08**: One known inverse cycle return allowed only after N→1/N-N, not 1→N.
- **SEA-09**: Use branch edge history; unknown inverse/cardinality forbids uncertain return.

### STA requirements

| Requirement | Implementation | Independent gates | Cases                 |
| ----------- | -------------- | ----------------- | --------------------- |
| STA-01      | L4             | V4                | T16, PORT-07          |
| STA-02      | L4             | V4                | T16                   |
| STA-03      | L4             | V4                | T16, PORT-07, PORT-08 |
| STA-04      | L4             | V4                | T17, META-04          |
| STA-05      | L4             | V4                | T17                   |

- **STA-01**: Host canonical route key omits query only; selector never parses routes.
- **STA-02**: Session restores branch/current/query/recents/scroll after full reload.
- **STA-03**: Expiry removes state and isolates users; transient data never persists.
- **STA-04**: Invalid paths truncate to valid prefix; invalid advice drops; search reruns.
- **STA-05**: Configuration change refreshes used contexts while preserving session recents.

### DRA requirements

| Requirement | Implementation | Independent gates | Cases                 |
| ----------- | -------------- | ----------------- | --------------------- |
| DRA-01      | L5 L6          | V5 V6             | PORT-02               |
| DRA-02      | L5 L6          | V5 V6             | T22                   |
| DRA-03      | L5 L6          | V5 V6             | T22, T24              |
| DRA-04      | L5 L6          | V5 V6             | T22, T24              |
| DRA-05      | L5 L6          | V5 V6             | T23, LIFE-02          |
| DRA-06      | L5 L6          | V5 V6             | T23                   |
| DRA-07      | L5 L6          | V5 V6             | T23                   |
| DRA-08      | L5 L6          | V5 V6             | T21, LIFE-02, LIFE-03 |

- **DRA-01**: Source transports paths without rendering columns or column thumbnails.
- **DRA-02**: Desktop reuses conventions; touch starts on dominant horizontal left-zone motion.
- **DRA-03**: Distance distinguishes intent; vertical scrolling and locked diagonal decisions work.
- **DRA-04**: Gesture policy preserves vertical scroll/zoom and cancellation cleans up.
- **DRA-05**: Stable path and live pointer controller survive pane folding.
- **DRA-06**: Mobile folds only after recognition; desktop stays open; table autoscroll is reused.
- **DRA-07**: Release restores former mobile pane state without invoking native keyboard.
- **DRA-08**: Outside/cancel/navigation/Escape clean up and never reopen a departed view.

### TAB requirements

| Requirement | Implementation   | Independent gates | Cases         |
| ----------- | ---------------- | ----------------- | ------------- |
| TAB-01      | L2-TABLE L2-LIST | V2-TABLE V2 V6    | T18           |
| TAB-02      | L2-TABLE L2-LIST | V2-TABLE V2 V6    | T15, T18      |
| TAB-03      | L5               | V5                | T15, T18, T20 |
| TAB-04      | L2-TABLE L2-LIST | V2-TABLE V2 V6    | T18           |
| TAB-05      | L2-TABLE L2-LIST | V2-TABLE V2 V6    | T18           |
| TAB-06      | L2-TABLE L2-LIST | V2-TABLE V2 V6    | T15, T18, T26 |
| TAB-07      | L5               | V5                | T19           |
| TAB-08      | L5               | V5                | T19           |
| TAB-09      | L5               | V5                | T19, T26      |
| TAB-10      | L5               | V5                | T19, T21      |
| TAB-11      | L5               | V5                | T20, T21      |
| TAB-12      | L2-TABLE L2-LIST | V2-TABLE V2 V6    | PANE-05       |

- **TAB-01**: Full-path identity prevents duplicate columns without conflating homonyms.
- **TAB-02**: Click adds at end or reveals existing without moving; new addition is confirmed.
- **TAB-03**: Valid drag inserts new or moves existing without adding recents for moves.
- **TAB-04**: Visual reveal/highlight does not steal keyboard focus or row selection.
- **TAB-05**: Same subtle theme-aware green flash cleans up and honours reduced motion.
- **TAB-06**: Pending additions deduplicate rapid actions; failed addition adds no recents.
- **TAB-07**: New drag shows a real provisional column with values, not a floating label.
- **TAB-08**: Preview accent/add indicator uses existing geometry and edge scrolling.
- **TAB-09**: Structure appears immediately; asynchronous data does not block/reload on each move.
- **TAB-10**: Only valid drop commits; previews never persist; late data cannot recreate them.
- **TAB-11**: Outside drop cancels; external existing column returns to original position, never deletes.
- **TAB-12**: Mobile click adds through existing table without an extra placement-selection flow.

### QUA requirements

| Requirement | Implementation | Independent gates | Cases                 |
| ----------- | -------------- | ----------------- | --------------------- |
| QUA-01      | L3 L5 L6 L7    | V3 V5 V6 V7       | T26, PORT-09          |
| QUA-02      | L3 L5 L6 L7    | V3 V5 V6 V7       | T25, PANE-04, PANE-06 |
| QUA-03      | L3 L5 L6 L7    | V3 V5 V6 V7       | T26, PORT-03          |

- **QUA-01**: Metadata/search/preview errors retain usable context; data failure is not a drop decision.
- **QUA-02**: Theme/contrast/targets/focus/motion work; hidden mobile main cannot retain focus.
- **QUA-03**: Large graphs use lazy bounded work and remain responsive without mounting all metadata.

## Dependency requirements

| Requirement | Implementation   | Independent gates | Cases                 |
| ----------- | ---------------- | ----------------- | --------------------- |
| DEP-01      | L1 L2-UI         | V2-UI             | T01, PORT-01, PORT-02 |
| DEP-02      | P04 L7           | V7                | PORT-10               |
| DEP-03      | S03 S04 L1-META  | V3                | META-01..04           |
| DEP-04      | L1 L2-LIST L5    | V2 V5             | PORT-02, T15          |
| DEP-05      | L4               | V4                | PORT-07..09           |
| DEP-06      | L1-META L4       | V4                | PORT-05, T14          |
| DEP-07      | L2-TABLE L5      | V2-TABLE V5       | T18..21               |
| DEP-08      | L2-HOME L6       | V2-HOME V6        | PANE-01..06           |
| DEP-09      | L1-META L2-LIST  | V2 V7             | LIFE-01..03           |
| DEP-10      | L1-META L4       | V4 V7             | META-02, PORT-05/07   |
| DEP-11      | S01..S07 L2-LIST | VSQL V2 V7        | SQL-01..14            |

- **DEP-01**: Core imports no table, host, framework, reflection or storage; real standalone demo exercises generic
ports.
- **DEP-02**: Direct imports match manifests, no npm cycles or private imports; responsibilities remain in owners.
- **DEP-03**: Provider returns authorised metadata and explicit unknown facts; reflection resolves all segments
without values.
- **DEP-04**: Interaction ids/path/pointer samples and applied outcomes follow ordering; only added confirms
recents.
- **DEP-05**: State survives reload, expires per real session, isolates users and handles conflicts/errors without
stale overwrite.
- **DEP-06**: Metadata supplies business labels/order, host supplies translation/advice, selector merges
destinations.
- **DEP-07**: Plugin owns geometry/DOM; external reorder rollback differs from header deletion; no selector imports
in table.
- **DEP-08**: RightPane owns content, state, movable command, focus, responsive layout and safe temporary folding.
- **DEP-09**: Server binding after composition and browser activation are distinct, dynamic insertion/disposal is
idempotent.
- **DEP-10**: Reuse presentation/type/route/session owners; initial columns do not constrain authorised catalogue.
- **DEP-11**: Public DataSource.select delegates to builder and returns typed projection; real SQL and list
rendering prove it.

## Validation protocol requirements

| Requirement | Implement            | Verify           | Current |
| ----------- | -------------------- | ---------------- | ------- |
| VAL-01      | P02                  | P02 retest       | PASS    |
| VAL-02      | P03                  | P04              | PASS    |
| VAL-03      | L2-UI L2-LIST        | V2-UI VSQL V2 V7 | NOT_RUN |
| VAL-04      | L2..L6               | V2..V6 V7        | NOT_RUN |
| VAL-05      | L6                   | V6 V7            | NOT_RUN |
| VAL-06      | All executors        | All gates        | NOT_RUN |
| VAL-07      | Fix/retest as needed | New verifier     | NOT_RUN |
| VAL-08      | V7 D8                | V7 then D8       | NOT_RUN |

- **VAL-01 / ENV-01**: Owned isolated stack, browser/touch capability, synthetic fixtures and query logs were
independently exercised.
- **VAL-02 / PLAN-01**: Exhaustive traceability, executable cards and ordered independent gates pass the plan
reviewer.
- **VAL-03 / T01, SQL, PORT**: Host-free real selector and real framework integration both pass, with separate SQL
proof.
- **VAL-04 / T01..27**: Each visible increment is driven by a fresh independent browser verifier before later
features.
- **VAL-05 / T22..25, PANE-06**: Desktop/narrow/portrait/landscape, genuine touch, hybrid input, focus and reduced
motion pass.
- **VAL-06 / EVIDENCE-01**: Reports give checkpoints, expected/observed outcomes, precise inputs and consultable
evidence.
- **VAL-07 / FIX-01**: Failures block dependants and open owner correction plus independent retest; no weakened
criteria.
- **VAL-08 / DELIVERY-01**: Fresh full acceptance precedes separate live delivery, assets/version checks and usable
URLs.

VAL-01 evidence: [independent environment report](VERIFY-ENVIRONMENT.md) and its linked assertion records.
PLAN-01 evidence: [planning report](reports/P03.md); independent approval: [P04 report](reports/P04.md).
EVIDENCE-01/FIX-01/DELIVERY-01 are process cases specified in [EXECUTION.md](EXECUTION.md); their owners and reports
are the applicable gate, correction/retest and final delivery task. FIX-01 can pass with no product defect found only
after V7 audits the correction protocol and confirms no unresolved failure; it is not a fabricated corrective run.

## T01–T27 execution matrix

| Case | Implementation     | Independent gates | Methods |
| ---- | ------------------ | ----------------- | ------- |
| T01  | L1 L2-UI           | V2-UI V2          | U,C,B   |
| T02  | L1 L2-UI           | V2-UI V2          | U,B     |
| T03  | L1 L2-UI           | V2-UI V2          | U,B     |
| T04  | L4                 | V4                | U,B     |
| T05  | L2-UI L2-LIST      | V2-UI V2          | C,B     |
| T06  | L2-UI L6           | V2-UI V6          | B       |
| T07  | S07 L2-LIST        | VSQL V2           | I,B     |
| T08  | L2-UI L6           | V2-UI V6          | B       |
| T09  | L3                 | V3                | U,B     |
| T10  | L3                 | V3                | U,B     |
| T11  | L3 L5              | V3 V5             | C,B     |
| T12  | L3                 | V3                | C,B     |
| T13  | S03 L3             | V3                | U,C,B   |
| T14  | L4                 | V4                | U,B     |
| T15  | L4 L5              | V4 V5             | C,B     |
| T16  | L4                 | V4                | I,B     |
| T17  | L4                 | V4                | I,B     |
| T18  | L2-LIST            | V2                | I,B     |
| T19  | L5                 | V5                | I,B     |
| T20  | L5                 | V5                | C,B     |
| T21  | L5 L6              | V5 V6             | C,B     |
| T22  | L6                 | V6                | C,B     |
| T23  | L6                 | V6                | I,B     |
| T24  | L6                 | V6                | B,P     |
| T25  | L2-UI L2-HOME L6   | V2-UI V2 V6       | B       |
| T26  | L3 L5 L7           | V3 V5 V7          | U,I,B   |
| T27  | L2-HOME L2-LIST L6 | V2 V6             | B       |

- **T01** — Expected: Mount without hosts; normalise strings/segments; observe explicit intentions and
acknowledgements. Proof: `evidence/<gate>/T01.*`; current verdict: `NOT_RUN`.
- **T02** — Expected: Open Customer→Address→City→Country, return to Address then City; Country stays in remembered
breadcrumb. Proof: `evidence/<gate>/T02.*`; current verdict: `NOT_RUN`.
- **T03** — Expected: Open a sibling relation from Address; retain the shared prefix and replace only the divergent
suffix. Proof: `evidence/<gate>/T03.*`; current verdict: `NOT_RUN`.
- **T04** — Expected: Activate a shortcut from a different branch; full destination replaces branch and search
clears. Proof: `evidence/<gate>/T04.*`; current verdict: `NOT_RUN`.
- **T05** — Expected: Click terminal, relation main and relation +; assert one correct intention/action per input,
unchanged context on add. Proof: `evidence/<gate>/T05.*`; current verdict: `NOT_RUN`.
- **T06** — Expected: Compare bounding boxes at hover/focus; on touch + appears only on relations and hybrid actions
remain usable. Proof: `evidence/<gate>/T06.*`; current verdict: `NOT_RUN`.
- **T07** — Expected: Add customer.address.city as an object; assert target identity/type and existing
representative rendering after reload. Proof: `evidence/<gate>/T07.*`; current verdict: `NOT_RUN`.
- **T08** — Expected: Use a long breadcrumb on narrow/touch screens; scroll and activate remembered levels with no
add/drag. Proof: `evidence/<gate>/T08.*`; current verdict: `NOT_RUN`.
- **T09** — Expected: Search customer country name with reordered/accented/case-varied words; see terminal and
object results by full path. Proof: `evidence/<gate>/T09.*`; current verdict: `NOT_RUN`.
- **T10** — Expected: Search from Address, assert all results descend from it; return to root with the same query
and relaunch. Proof: `evidence/<gate>/T10.*`; current verdict: `NOT_RUN`.
- **T11** — Expected: Find Country through billing/delivery paths; navigate and drag intermediate segment using each
exact full path. Proof: `evidence/<gate>/T11.*`; current verdict: `NOT_RUN`.
- **T12** — Expected: Delay old query, change text/context and release late response; current results remain,
loading/empty/limited differ. Proof: `evidence/<gate>/T12.*`; current verdict: `NOT_RUN`.
- **T13** — Expected: Run known N→1/N-N inverse return, 1→N excluded return, unknown relations and same-type
noncycles with provider traces. Proof: `evidence/<gate>/T13.*`; current verdict: `NOT_RUN`.
- **T14** — Expected: Combine recent ancestor, two maximal used branches and duplicate advice; assert stable
six-or-configured destination limit. Proof: `evidence/<gate>/T14.*`; current verdict: `NOT_RUN`.
- **T15** — Expected: Confirm new add, click duplicate, move existing and abort new drag; only the committed new add
becomes recent. Proof: `evidence/<gate>/T15.*`; current verdict: `NOT_RUN`.
- **T16** — Expected: Set branch/query/scroll, fold/reopen and full reload; expire that actual session and verify
all selector state is forgotten. Proof: `evidence/<gate>/T16.*`; current verdict: `NOT_RUN`.
- **T17** — Expected: Switch saved list config, remove a metadata path and reload; used advice updates, recents
remain, invalid branch truncates. Proof: `evidence/<gate>/T17.*`; current verdict: `NOT_RUN`.
- **T18** — Expected: Click absent/existing columns rapidly; new appends, existing stays at index, both reveal/flash
and retain keyboard focus. Proof: `evidence/<gate>/T18.*`; current verdict: `NOT_RUN`.
- **T19** — Expected: Drag new path through legal positions; a true column appears immediately, receives real data
and commits only at valid drop. Proof: `evidence/<gate>/T19.*`; current verdict: `NOT_RUN`.
- **T20** — Expected: Drag an existing column, validate movement, then repeat and abandon; assert one column and
restoration to original index. Proof: `evidence/<gate>/T20.*`; current verdict: `NOT_RUN`.
- **T21** — Expected: Drop above/below/outside, Escape, touchCancel and depart view with delayed data; no
commit/resurrection and clean listeners. Proof: `evidence/<gate>/T21.*`; current verdict: `NOT_RUN`.
- **T22** — Expected: Trusted vertical touch scrolls; dominant horizontal gesture in left source zone transports
without hold or residual click. Proof: `evidence/<gate>/T22.*`; current verdict: `NOT_RUN`.
- **T23** — Expected: Recognise mobile drag, observe pane folding, edge autoscroll and restore after success/cancel
without search focus. Proof: `evidence/<gate>/T23.*`; current verdict: `NOT_RUN`.
- **T24** — Expected: Test diagonal locked intent, edge zone, long breadcrumb, portrait/landscape and hybrid mouse;
record physical-device limit. Proof: `evidence/<gate>/T24.*`; current verdict: `NOT_RUN`.
- **T25** — Expected: Add terminal/object via keyboard and tap without drag; visible focus returns correctly after
explicit pane closure. Proof: `evidence/<gate>/T25.*`; current verdict: `NOT_RUN`.
- **T26** — Expected: Use 500+ metadata contexts, 120 roots, slow/failing endpoints and overlapping actions; bounded
work and unique columns persist. Proof: `evidence/<gate>/T26.*`; current verdict: `NOT_RUN`.
- **T27** — Expected: Scroll a wide table to both ends; pane/header controls remain visible and open the same pane
on desktop and touch. Proof: `evidence/<gate>/T27.*`; current verdict: `NOT_RUN`.

S03 prerequisite facts for T13: `PASS` for explicit N-1/1-N/N-N inverse/cardinality and unknown defaults;
[owner tests](evidence/S03/reflect-test.txt) and [report](reports/S03.md), reflect
`8e42bd2009a6ba4e708ae20ca519fc44681ebbb7` / `0.3.0`. Automatic branch-return behaviour remains `NOT_RUN` until L3/V3.

## SQL additional cases

Implementation: `S02 S03 S04 S05 S06 S07`. Independent gates: `VSQL V2 V7`. Methods: U,C,I; B for rendered cases.

### SQL-01: Direct and deep scalar paths

Expected: Project number and customer.address.city.name; compare four seed roots, types, order and canonical
descriptors.

Proof: `evidence/<gate>/SQL-01.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-02: Object and representative values

Expected: Project City with nested Country representative fields; assert prototype/id/loaded fields, converted
values and zero rendering queries.

Proof: `evidence/<gate>/SQL-02.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-03: Shared prefix and overlapping projections

Expected: Project city plus city.name and two different address paths; verify consistent object identity/values and
no alias/join collision.

Proof: `evidence/<gate>/SQL-03.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-04: Criteria outside projection

Expected: Filter deliveryAddress.city.name while displaying only number/customer city; check actual bound criterion
and mandatory scope in select/count.

Proof: `evidence/<gate>/SQL-04.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-05: Null, absence and empty results

Expected: Distinguish absent customer, absent address, null city.name, empty note and no matches; a required
descendant under optional parent preserves roots.

Proof: `evidence/<gate>/SQL-05.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

S02 contract observation: `PASS` for separate typed loaded null/undefined, absent relation and ignored scalar cells,
partial object metadata and empty-result descriptors. Public API typecheck:
[evidence](evidence/S02/public-typecheck.txt), `storage` `a298863052d9db37fe28c72e175896bdeec9366d` / `0.3.0`.
Actual row reconstruction and preservation remain `NOT_RUN` until VSQL.

### SQL-06: Aliases, identifiers and invalid input

Expected: Use homonymous fields, long paths, id/p0-like names, invalid/ambiguous paths and injection-looking values;
quoted metadata and bound values stay separate.

Proof: `evidence/<gate>/SQL-06.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-07: Final-property conversion

Expected: Exercise decimal, date, boolean, nullable, empty string and custom nested SQL/READ/SAVE converters, async
conversion, scalar IGNORE versus loaded undefined, object-field IGNORE and conversion rejection.

Proof: `evidence/<gate>/SQL-07.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-08: Stable sorting, count and pages

Expected: Use 120 roots with tied relational sort values; assert root-id tie-breaker, first/next/last pages,
offset/limit zero, empty page and count equality.

Proof: `evidence/<gate>/SQL-08.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-09: Plural projection policy

Expected: Navigate inverse/N-N metadata; selecting/sorting any plural column rejects before SQL, even with one
child; no first-value or multiplied root fallback.

Proof: `evidence/<gate>/SQL-09.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-10: Plural criteria

Expected: Known 1-N/inverse/N-N hidden filters with zero/one/several matches use shared EXISTS semantics;
same-prefix AND conditions share a child; root count/pages stay unique.

Proof: `evidence/<gate>/SQL-10.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-11: Compatibility and configured bindings

Expected: Call dataSource().select via configured engine; preserve existing search/count/functions and
mysql-maintainer composition. Unsupported adapter rejects without search fallback.

Proof: `evidence/<gate>/SQL-11.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

S02 adapter observation: `PASS` for inherited unsupported-selection with zero search fallback and zero connections,
including installed MySQL and maintained MySQL adapters. [Runtime tests](evidence/S02/storage-test.txt) and
[adapter probes](evidence/S02/adapter-compatibility.txt), `storage`
`a298863052d9db37fe28c72e175896bdeec9366d` / `0.3.0`. Configured execution and criteria compatibility remain
`NOT_RUN` until S07/VSQL.

### SQL-12: Bounded reads and visible-row reload

Expected: One projection query plus separate count, zero cell/render reads; Identifiers restricts loaded rows and
scope. Empty ids return none; preview movement reuses pending read.

Proof: `evidence/<gate>/SQL-12.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

S02 option observation: `PASS` for the public readonly `Identifiers` carrier and existing option-port compatibility.
[Runtime tests](evidence/S02/storage-test.txt), `storage` `a298863052d9db37fe28c72e175896bdeec9366d` / `0.3.0`.
Deduplication, bound predicates, scope intersection and actual restricted reads remain `NOT_RUN` until S07/VSQL.

### SQL-13: Object criteria and errors

Expected: Object equality targets id, null means absence; function operands convert by final property;
query/conversion errors retain causes and no fake successful empty cell.

Proof: `evidence/<gate>/SQL-13.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### SQL-14: Independent SQL and browser linkage

Expected: Archive actual SQL/result assertions separately from V2 City/deep-field render, filter/sort/feed/reload
evidence using the exact delivered modules.

Proof: `evidence/<gate>/SQL-14.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

## META additional cases

Implementation: `S03 S04 L1-META`. Independent gates: `VSQL V3 V7`. Methods: U,C,I.

### META-01: Relation facts and typed traversal

Expected: Direct/inherited/optional/collection and logical inverse/N-N descriptions match owner metadata, unknowns
remain explicit; no value getter/read occurs.

Proof: `evidence/<gate>/META-01.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

S03 owner observation: `PASS` for direct/inherited/optional/collection targets, explicit inverse/N-N/unknown facts,
inherited defaults and zero record getter/constructor reads. [Tests](evidence/S03/reflect-test.txt) and
[report](reports/S03.md), reflect `8e42bd2009a6ba4e708ae20ca519fc44681ebbb7` / `0.3.0`.
Typed traversal and provider descriptions remain `NOT_RUN` until S04/L1-META and their independent gates.

### META-02: Permission and presentation

Expected: Both enumerate and resolve full path enforce the same authorisation; labels/order reuse display owners and
include accessible fields beyond initial list columns.

Proof: `evidence/<gate>/META-02.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### META-03: Path ambiguity and cycles

Expected: Resolve two-level/deep paths and multiple routes to same class; ambiguous unions reject; unknown inverse
never permits uncertain automatic return.

Proof: `evidence/<gate>/META-03.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

S03 owner observation: `PASS` for preserving ambiguous candidates with unknown target/multiplicity and for late
resolution of deferred metadata. [Tests](evidence/S03/reflect-test.txt), reflect
`8e42bd2009a6ba4e708ae20ca519fc44681ebbb7` / `0.3.0`. Path errors and automatic cycle decisions remain `NOT_RUN`.

### META-04: Invalidated catalogue

Expected: Change allowed paths between save/restore; truncate branch to valid prefix, discard invalid advice and
rerun query from the validated context.

Proof: `evidence/<gate>/META-04.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

## PORT additional cases

Implementation: `L1 L1-META L2-UI L2-TABLE L3 L4 L5 L7`.
Independent gates: `V2-UI V2-TABLE V3 V4 V5 V7`. Methods: U,C,I,B.

### PORT-01: Standalone contract and presentation

Expected: No forbidden host imports; missing provider is explicit configuration error, optional consumer only
observes, translation fallback is deterministic and UI stays simple.

Proof: `evidence/<gate>/PORT-01.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-02: Intent identity and disposal

Expected: Reject mismatched/duplicate/late outcomes; maintain stable path across begin/move/end/cancel; only an
applied new addition affects recents; dispose cancels work once.

Proof: `evidence/<gate>/PORT-02.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-03: Lazy budgets and errors

Expected: Large static catalogue loads progressively with cached contexts, bounded concurrent
requests/depth/results; abort and stale generations work, errors preserve current context.

Proof: `evidence/<gate>/PORT-03.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-04: Table contract substitutions

Expected: Exercise opaque-id generic consumer independent of selector/list, asynchronous header/cells, transaction
commit/cancel and no persistence of transient columns.

Proof: `evidence/<gate>/PORT-04.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-05: Labels, advice and defaults

Expected: Identity translation fallback, technical label fallback, provider business order, static root advice,
six-result default and configured limit are observable without phase 2 settings.

Proof: `evidence/<gate>/PORT-05.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-06: Search rank and focus

Expected: Reverse network completion order; same metadata yields same rank, selected focus remains,
empty/loading/limited/error states stay distinct.

Proof: `evidence/<gate>/PORT-06.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-07: Canonical key and isolation

Expected: Query variants of the same canonical list route share selector state; route-identifying segments and two
real sessions remain distinct; table namespace is separate.

Proof: `evidence/<gate>/PORT-07.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-08: State sequencing and expiry

Expected: Race same-key and distinct-key writes with list configuration saves and response autosave. Revoke/expire
while writes are pending; remount/reload and inspect durable state after a server restart with the same fixture
secret. Also remove/recreate a selector key while an old write is pending; its tombstone revision rejects the old write.
No lost namespace, skipped nested-state save, stale overwrite or expired-state resurrection. Use two store
instances with identical synthetic session ids to prove cache isolation; retain the two-user browser check.

Proof: `evidence/<gate>/PORT-08.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-09: Storage and preview failures

Expected: Unavailable state store preserves live context and signals error; failed/slow data keeps gesture
responsive, valid drop outcome independent of data completion and retry available.

Proof: `evidence/<gate>/PORT-09.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PORT-10: Public build and architecture

Expected: Check direct runtime imports, npm dependency graph, public CJS/browser exports, types/assets/files, SOLID
and zero server libraries in browser or host imports in selector.

Proof: `evidence/<gate>/PORT-10.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

S02 owner observation: `PASS` for public CJS exports/declarations, package allowlist and neutral dependency direction.
[Build](evidence/S02/storage-build.txt), [typecheck](evidence/S02/public-typecheck.txt),
[package files](evidence/S02/storage-pack.txt) and [SOLID review](reports/S02.md), `storage`
`a298863052d9db37fe28c72e175896bdeec9366d` / `0.3.0`. Browser assets and remaining owners remain `NOT_RUN`.

S03 owner observation: `PASS` for public CJS/ESM relation exports, cross-facade declarations, readonly type fixtures,
package allowlist and neutral dependency direction. [Build](evidence/S03/reflect-build.txt),
[type fixtures](evidence/S03/reflect-build-test.txt), [package files](evidence/S03/reflect-pack.json) and
[SOLID review](reports/S03.md), reflect `8e42bd2009a6ba4e708ae20ca519fc44681ebbb7` / `0.3.0`.
Browser assets and remaining owners remain `NOT_RUN`.

## PANE additional cases

Implementation: `L2-HOME L2-LIST L6`. Independent gates: `V2-HOME V2 V6 V7`. Methods: C,B.

### PANE-01: Empty and folded state

Expected: No content means no pane command; first arbitrary content starts folded; one command is right of
notifications/breadcrumb while closed.

Proof: `evidence/<gate>/PANE-01.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PANE-02: Opened command and desktop layout

Expected: Same command moves left of pane title and reverses icon; main table shrinks but stays interactive and
scrollable.

Proof: `evidence/<gate>/PANE-02.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PANE-03: Occupancy and restoration tokens

Expected: Competing owner registration rejects; temporary fold preserves instance; release restores former state;
removal/navigation invalidates tokens and prevents stale reopening.

Proof: `evidence/<gate>/PANE-03.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PANE-04: Focus and mobile modal region

Expected: Explicit close focuses visible trigger, mobile hidden main is unfocusable, desktop main remains accessible
and drag restoration avoids search focus.

Proof: `evidence/<gate>/PANE-04.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PANE-05: Header control and click flow

Expected: Pinned right header add button opens the one existing pane at every horizontal scroll position; mobile
click adds without a placement dialogue.

Proof: `evidence/<gate>/PANE-05.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### PANE-06: Responsive presentation

Expected: Desktop/narrow/portrait/landscape pass no overflow, long breadcrumb access, comfortable touch targets,
contrast, visible focus, themes and reduced motion.

Proof: `evidence/<gate>/PANE-06.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

## LIFE additional cases

Implementation: `L1 L2-LIST L5 L6 L7`. Independent gates: `V2 V5 V6 V7`. Methods: C,I,B.

### LIFE-01: Activation

Expected: Initial load, fragment insertion and reinsertion mount once; server binding finishes before metadata is
cached and browser composition loads public modules only.

Proof: `evidence/<gate>/LIFE-01.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### LIFE-02: Navigation during operations

Expected: Navigate away during metadata, state or preview load/drag; listeners/pointer/temporary DOM are cleaned, no
stale data/pane recreation.

Proof: `evidence/<gate>/LIFE-02.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.
### LIFE-03: Existing list behaviour

Expected: Retain scoped entity JSON, HTML filtering/sort/feed, header-origin reorder/removal, frozen columns, row
selection and keyboard after repeated reset.

Proof: `evidence/<gate>/LIFE-03.*` and `reports/<gate>.md`. Current verdict: `NOT_RUN`.

## Stage obligations

A gate passes only its observations listed here and in its itinerary. Split case evidence into stage-specific
observations; the overall case remains NOT_RUN until its final required stage passes. This is not permission to skip
an implemented feature or use a simulated replacement for a required browser/database check.

- S02: Neutral projection/error/options contract, public API typecheck, inherited unsupported-adapter rejection
  and adapter compilation. This passes only these storage observations; SQL/hydration/browser cases remain NOT_RUN.
- S03: Neutral relation targets/inverses/cardinalities, unknown defaults, inherited/optional/collection metadata,
  zero getter reads, public CJS/ESM exports and type fixtures. This passes only the reflection-fact portions of
  META-01/META-03 and prerequisite facts for T13; path/provider/search/SQL/browser observations remain NOT_RUN.
- S07/VSQL: SQL-01–SQL-13 storage/SQL observations, including real typed object reconstruction and independent
  representative conversion with zero extra reads. SQL-09 tests reflection navigation facts, not the later UI refusal.
  SQL-12 tests identity-restricted reads; preview movement is V5. SQL-14 requires archived SQL/values now and
  browser linkage at V2. Keep VSQL PASS separate from the unfinished combined SQL-14 case.
- L1-META: META-01–META-03 provider contract/HTTP observations and the ability to change allowed catalogue paths.
  META-04 persisted restoration belongs to L4/V4. VSQL covers only reflection portions of META-01/META-03;
  V3 covers provider permission/presentation and search cycles; V4 completes META-04.
- V2-UI: T01–T03/T05–T08/T25 click, navigation and keyboard portions. T07 here proves object intention only.
  PORT-02 checks click acknowledgements/disposal; its real drag lifecycle is V5 and recents are V4/V5.
- L2-HOME/V2-HOME: PANE-01–PANE-04 and PANE-06 generic shell, with public suspend/restore fixture controls.
  PANE-05 is L2-LIST/V2; product drag restoration is V6. No list header or product drag is required at this stage.
- L2-TABLE/V2-TABLE: PORT-04 click addition, asynchronous data and generic teardown; external transport commit/cancel
  completes at L5/V5. Existing header-origin reorder/removal/freeze remains mandatory immediately.
- V2: SQL-14 browser linkage, object/deep-column data, plural refusal, visible-row reload and PANE-05. L2 navigation
  cases are complete except observations explicitly assigned to later touch/search/drag features.
- V3: T09–T13 search/navigation and PORT-03/06, plus META-01–META-03. T11 intermediate-segment drag is V5.
- L4/V4: T04/T14–T17, PORT-05/07/08, META-04 and PORT-09 storage failure. T15 proves real click add/duplicate and
  generic rejected/cancelled acknowledgements now; actual column movement/drag abandonment completes at V5.
  PORT-09 preview failure and response timing complete at V5/V6.
- L5/V5: T11 drag, T15 actual moved/cancelled outcomes, T19–T21 desktop/contract cancellation, PORT-02/04 transport,
  PORT-09 preview errors and SQL-12 preview query reuse. Touch pointercancel/gesture arbitration completes at V6.
- L6/V6: T21–T24 trusted touch, mobile pane restoration and all remaining touch/hybrid observations. V7 replays all
  completed observations and requires every combined case PASS; D8 independently checks live delivery.

The grouped extra-case implementation/gate headings are unions. In particular PORT-04 is implemented by
L2-TABLE/L5 and verified by V2-TABLE/V5/V7; PORT-06 is implemented by L3 and verified by V3/V7.

## Browser itinerary and fixture readiness

All browser cards supply URLs, commands and dimensions. The scenario definitions above specify input and observations;
execute the applicable itinerary below on the actual delivered exports. Observing a screenshot alone cannot establish
a successful action. Record DOM column order, pending/committed state, query counts and reload results as applicable.

- **V2-UI**: Standalone only: mount static catalogue; run T01/T02/T03/T05/T06/T08/T25 and PORT-01/02. Compare
hover/focus boxes, use real taps for no-hover, inspect imports and dispose/remount. T07 here proves the object
intention only; VSQL/V2 prove its data.
- **V2-HOME**: Real container generic fixture: PANE-01 through PANE-04 and PANE-06 shell. Open empty/content states,
close/reopen, register competing owner, suspend/remove/restore and change viewport. Do not claim list integration
before L2-LIST.
- **V2-TABLE**: Separate generic table fixture: PORT-04 and relevant LIFE-03. Add header/cells asynchronously,
inject failure, reveal/highlight, reorder/remove from header and test frozen boundaries. Confirm teardown leaves no
duplicate DOM/listeners.
- **V2**: Both environments: standalone navigation remains valid; real invoice route runs
T02/T03/T05/T07/T18/T25/T27 and SQL-14. Add City object and City.Country.Name, apply filter/sort/feed, compare
counts/ids, reload and check visible values plus refusal of plural path.
- **V3**: Both environments: T09–T13 and PORT-03/06. Type words quickly, change context, navigate result segments,
clear, force error/empty/limit and release delayed response; inspect metadata request trace for cycle limits and no
record reads.
- **V4**: Both environments, plus two actual framework sessions: T04/T14–T17, PORT-05/07/08/09 and META-04.
Confirm/duplicate/reject choices; fold/reopen, full reload, config switch and expiry; drive controlled delayed
writes and inspect isolated state.
- **V5**: Both environments for source intentions; real table for T19–T21/T15/T26. Use pointer down/move/up through
valid/invalid target zones, horizontal scroll edges and frozen boundary. Escape/cancel/departure during pending data
must roll back; compare order/config/recents after reload.
- **V6**: Both environments, real touch contexts: T22–T24 plus T06/T08/T25/T27 and PANE-06. Tap, stationary hold,
vertical, horizontal, diagonal and cancelled gestures; test edge region and rotate. Repeat mouse/keyboard after
touch/resize. Observe activeElement and no automatic search focus.
- **V7**: Rebuild owners/application, rerun independent SQL driver and all applicable T/additional cases on both
environments. Independently inspect architecture/build artifacts and actual scope enforcement. A stale tested
checkpoint or open defect prevents acceptance.
- **D8**: After V7 PASS, verify versions/assets/local imports and recipe ownership; restart only owned services,
open both URLs, add a terminal and an object, reload and check data/session. Check URL response again at handover
and record PID/stop commands.

## Remaining limits

No product tests, browser interaction, database projection or final delivery has been executed by P03. Its checks only
validate plan structure and coverage. P04 independently approves the repaired contracts and stage obligations;
S02 delivers the neutral storage API; S03 delivers relation facts. Typed paths, SQL execution and consumers
remain pending.
Installed IAB supplies real navigation/viewport checks; verified Playwright supplies touch input. Native phone edge
gestures, physical system interruptions and keyboard behaviour remain conditional on available hardware. All browser
and emulated-touch cases are mandatory. The standalone support currently contains a placeholder; L2-UI replaces it with
the real independent demo. Current handwritten SQL smoke remains infrastructure-only, never evidence for SQL-01–14.

# VSQL independent database verification

## Verdict and checkpoints

Status: `DONE`; all assigned independent database observations `PASS`, 16 October 2026. S02–S07 have validated
reports and attributable checkpoints; no reproducible blocking defect was found. SQL-01–SQL-13 storage portions
and SQL-14 executed SQL archive pass. List UI refusal, preview reuse and browser linkage remain assigned to V2/V5.
DEP-11, VAL-03 and phase 1 as a whole are not yet accepted.

Tracking starts clean at property-select `1e2c5d90fe59bf11e815c7d09be3303ea9eac3ad` / `0.0.20`.
This verification-only delivery applies patch `0.0.21` on the first edit. The package has no build script or runtime
exports yet. Unchanged product owners were rebuilt and remain clean:

- storage `a298863052d9db37fe28c72e175896bdeec9366d` / `0.3.0`.
- reflect `8e42bd2009a6ba4e708ae20ca519fc44681ebbb7` / `0.3.0`.
- reflect-path `7d1534eece60d23339f2ad8355d49c8d5074c08d` / `0.3.1`.
- sql-join `55db310bdf3e92330ec216677c81577f6854e3f0` / `0.2.0`.
- sql-build `a267327e072df4f6ffa855c15eae6a4c5776ee6d` / `0.2.0`.
- mysql `275d7f3b0ae3739e9c1a2b6361fc173d98612581` / `0.3.2`.
- framework `aff37e0da8272ca63908a57d7ff3abfa80ec177e` / `0.8.1`.
- mysql-maintainer `89ff36a3b1a41a60b040c0ed553f867bec0f6086` / `0.4.1`.

Requested profile: `gpt-6-astra` / `high`. The parent owns actual dispatch metadata. No independent runtime model or
reasoning-effort attestation is exposed to this executor. The verifier is distinct from the S05–S07 authors and
launched no sub-agent. Author claims were treated as hypotheses, not expected-result oracles.

## Independent oracle and execution

The new [VSQL driver](../environment/checks/VSQL.mjs) uses the public configured `dataSource().select()` with the
public framework SQL binding and existing metadata fixtures. It resets only the isolated synthetic recipe, then
inserts an independently designed 137-root dataset: five customers in a cycle, four addresses, three cities, two
countries, zero to three lines per root and three N-N tags. Existing author fixture values and assertions are not
used as expected results. Expected values, identities, existence predicates and sorted page slices are computed
from plain verifier-owned records before comparison with returned API values. No expected page is obtained from
an unbounded product query. All fixtures are restored through `control.mjs reset` after recording the evidence.

The database is exclusively `property_select_recipe` on `127.0.0.1:13316`, with its dedicated synthetic socket and
journal. No private database/configuration was read. SQL used directly by this verifier only seeds or removes test
resources; every acceptance selection/count/search uses the public adapter. Query observation wraps and forwards
the real connection; it does not return simulated rows. The server's independent general journal confirms execution.

Run from `/home/baptiste/itrocks/showtime`, with the existing database running:

```bash
node node_modules/.bin/tsc -p node_modules/@itrocks/property-select/docs/orchestration/environment/models/tsconfig.json
node node_modules/@itrocks/property-select/docs/orchestration/environment/checks/VSQL.mjs
python3 node_modules/@itrocks/property-select/docs/orchestration/evidence/VSQL/run-checks.py
```

The first two commands run the focused gate; the final command reproduces ordered owner builds, model compilation,
syntax validation, the gate, `control.mjs queries`, service status and offline package dry runs. Exact argv, cwd,
exit codes, output locations and SHA-256 values are recorded in [commands.json](../evidence/VSQL/commands.json).
The final run passes fourteen groups, 1,390 expected/observed checks and 110 observed statements, including maintenance
recovery attempts and the intentional driver failure. Assertion details are in
[results.json](../evidence/VSQL/results.json), bound statements in [sql.json](../evidence/VSQL/sql.json), and actual
expanded execution in [mysql-general.log](../evidence/VSQL/mysql-general.log), with trailing whitespace removed.
The raw archive is `/tmp/property-select/VSQL/mysql-general.raw.log`, SHA-256
`f9ed73c0d8b18bb2fceceb7c3c73a87ddb73f6492f88dcf56d8cfabc545d78d7`. The archive ends before restoring
fixtures; `queries.txt` separately records the recipe observer after restoration.

## Observed acceptance

- SQL-01: all 137 direct, two-level and deep scalar rows match the independent graph; string/segment descriptors agree.
- SQL-02: City/Country prototypes, ids, converted values, exact loaded fields, identity-only objects, nested expansion
  and constructor-default exclusion pass. Existing representative rendering performs zero additional queries.
- SQL-03: mixed object/descendant values agree; distinct address paths reuse one object per type/id and merge fields.
  Separate requests create separate identities.
- SQL-04–05: hidden delivery-city predicates intersect active scope in selection/count. Missing customer, address and
  city remain distinguishable from terminal null and empty strings. Required country ancestry retains all roots.
  Empty selections/results preserve identities/descriptors.
- SQL-06–07: id/p0 aliases, a 31-edge cycle, hostile bound operands and pre-query invalid/ambiguous/unknown failures
  pass. Decimal/date/boolean/null/empty values, async nested READ/SAVE, scalar/object IGNORE, loaded undefined and
  conversion cause/path propagation pass.
- SQL-08: independently sorted pages contain 50/50/37 roots; repeated first page, 137-root total, empty final page,
  zero limit, explicit descending and object-identity ordering pass. Every page is one actual SQL query bounded to
  50 rows. Invalid/duplicate options reject before execution.
- SQL-09–10: inverse/N-N reflection and accumulated plurality pass; all plural selected/sorted paths reject before
  querying even on a one-child root. Seven hidden inverse/N-N/nested predicates use independent existence oracles,
  including terminal null, shared-child AND and separate branches. Selection/count/full search and 17-row pages agree;
  zero/one/several matching children do not duplicate roots.
- SQL-11: configured MySQL, legacy function count/limited search, legacy zero limit and relation ids pass. Unsupported
  adapters reject with zero search fallback. Maintained MySQL projects and recovers a missing synthetic table for both
  selection and count using the real database.
- SQL-12–13: visible ids are bound/deduplicated and intersect scope in one bounded reload; empty ids return none.
  Entity/id/null relationship criteria and converted function operands agree with independent roots/counts, without
  mutating caller operands. An invalid object operand rejects before SQL; a real missing-table error remains visible.
- SQL-14: actual SQL, bound values and result comparisons are archived. Browser linkage is deliberately `NOT_RUN`
  until V2; preview movement/reuse and list-owned representation closure/refusal are later integration observations.

## Delivery, SOLID and limits

All eight product owner builds and fixture compilation pass. Offline package inventories for mysql, framework,
mysql-maintainer and tracking pass; public CJS/declarations, framework projection subpath and existing browser assets
are present. There is no new product runtime or browser asset in this delivery. The unchanged author unit suites are
not relabelled as independent proof; the new real database driver supplies this gate's assertions.

Source review confirms one owner per responsibility: neutral storage contract, reflection paths, SQL graph/building,
MySQL hydration, framework composition and maintained-adapter recovery. MySQL calls the public builder and its local
hydrator; framework binds narrow existing conversion ports. Tests establish adapter substitution. The test driver
contains no product SQL compiler, hydration implementation or selector/list dependency inversion. No product code was
changed and no owner version was incremented except tracking.

The initial restricted status call could not access the socket. Normal escalation permitted the documented command.
A status call without `PS_APP_PORT=13319` reached the default inactive application port; the correctly configured
command passes and confirms HTTP 200 with the restored country fixture. No service was started, stopped or restarted;
existing process ownership and permission configuration remain unchanged. No install/update, implicit download,
`vcs-modules`, push, tag, publication or application commit occurred.

Showtime remains at `d7ca948292e28c248bdcc0283724e47c2a82bba4`. Only the two original AD entries remain, with absent
working files and unchanged staged blobs `ff4dc939cce17af3aa7c14d8063034c5cc85b867` and
`de960a87ea9b4f6eb1cece85ab32596baef11fcd`. Full pending diffs, untracked evidence, versioning, syntax, package contents
and whitespace were reviewed. See [review](../evidence/VSQL/review.txt) and
[checkpoints](../evidence/VSQL/checkpoints.json).

No blocking VSQL defect remains; L1 may proceed according to the serial plan. The gate guarantees stable pagination
for this fixed dataset, not a transactional snapshot during concurrent writes. Proposed and authorised local commit:
`Verify independent database projections`. No report contains its own commit SHA.

# Property selector initial audit

## Scope and result

Task 4.1, audited on 15 October 2026. Documentation only; no product implementation, package rebuild, server launch,
database access or browser validation was performed. This audit is the handover to environment task 4.2 and planning
task 4.3. It does not validate phase 1.

The five tracked input documents and README were checked using `git ls-files --error-unmatch` in `property-select`. They
are present at `23dd018adfb74756f21d33b179aa16a12ccfd566`. Mandatory references are linked in [COMMON.md](COMMON.md).

Requested profile: `gpt-6.1-sol` / `medium`. The task was received as a native sub-agent. The runtime does not expose an
independently verifiable model or reasoning-effort identity to this agent; configuration is reported by the parent. No
delegation was performed.

Tracking repository: `@itrocks/property-select`, installed at
`/home/baptiste/itrocks/showtime/node_modules/@itrocks/property-select`; tracking directory: `docs/orchestration/`.
All task reports, plans, validation records and reusable test support belong to this package or their owning framework
package. The application checkout is a local test bench only.

## Initial Git state and preservation

Application root: `/home/baptiste/itrocks/showtime`, HEAD `d7ca948292e28c248bdcc0283724e47c2a82bba4`, version `0.0.6`.
Two pre-existing entries have status `AD`: `audit-itrocks-dependencies.json` and `audit-itrocks-dependencies.txt`. They
are staged additions whose working files are absent, not ordinary tracked deletions. Preserve both index entries and
absent working files; do not reset, restore or include them in this task's commit. The application index contains 19,549
added lines for these files; the working diff removes those same lines.

Every package below is a separate, real Git checkout at `node_modules/@itrocks/<name>`, not a symlink. Every listed
checkout was clean, including untracked files, before documentation writes. SHA values are the baseline, not a
declaration that subsequent agents may skip fresh state checks. This documentation delivery changes only
`property-select`, with a patch version from `0.0.4` to `0.0.5`.

- `property-select`: `0.0.4`, HEAD `23dd018adfb74756f21d33b179aa16a12ccfd566`; clean.
- `framework`: `0.6.8`, HEAD `9b9e35972734189b274902e60be450801c453bee`; clean.
- `list`: `0.8.0`, HEAD `005702a6a0cd49740cdea37c2e5150dc80fb670b`; clean.
- `table`: `0.2.10`, HEAD `46adbb2f85105f3f33545f1b4bea9267d1c7c393`; clean.
- `home`: `0.4.2`, HEAD `4e7af0746c50c0288b3baed641a1ce7c63ea16cd`; clean.
- `reflect`: `0.2.7`, HEAD `c5ad9bfeb6b6462680cd984f90d3f0dfc32543ed`; clean.
- `reflect-path`: `0.2.6`, HEAD `abffb9eeb37f54abf982d1760dc2ba1e8a808158`; clean.
- `storage`: `0.2.5`, HEAD `03bcf52167e4a55f335dceede3200241ecd8e23c`; clean.
- `mysql`: `0.2.12`, HEAD `caba2bf09e804cec27d95bd2076e15e5d59a39c6`; clean.
- `sql-build`: `0.1.1`, HEAD `fa3dcb594fffc7481f514a5a528622ce7598c33a`; clean.
- `sql-join`: `0.1.3`, HEAD `833c87fdf2bc1f5b52ed7a06619520a3f76d1978`; clean.
- `property-view`: `0.2.2`, HEAD `67a0ca77821b83be54cc8f143f43b81fe70b5b79`; clean.
- `class-view`: `0.2.2`, HEAD `c4de42eae2d6f3e2758616d6529439eb6e54eeda`; clean.
- `translate`: `0.2.5`, HEAD `d6a13cb7f10bb13e4fd2c98b870d882ea4e9d1a7`; clean.
- `route`: `0.4.0`, HEAD `16b5777e5cab90cee0eff40e01378d5b10869c74`; clean.
- `property-type`: `0.4.0`, HEAD `f2beb261d26d73004ec785fdab8512d1a8cd4819`; clean.
- `composition`: `0.2.3`, HEAD `c47991453d423cac27cc2b9ffcb741983c604ac3`; clean.
- `list-properties`: `0.2.2`, HEAD `3f7bbe72f92d836298d7e5faaad1fec4da3d4b72`; clean.
- `session`: `0.0.3`, HEAD `b2dfe1da53a625af37b99375e9bad961f3b18268`; clean.
- `build`: `0.1.1`, HEAD `f4cabf8946caee4c58586809275a42b3b1cca967`; clean.
- `xtarget`: `0.4.1`, HEAD `fa4ee093a8a8d7f98a9c2307a721be9905334991`; clean.
- `plugin`: `0.1.6`, HEAD `d1a00220edbe9e140aee50b4c616b647c96899dc`; clean.
- `ux-core`: `0.3.2`, HEAD `f394fe84a44725e2f48e31eed51a79aef461cb39`; clean.
- `dev`: `0.10.1`, HEAD `edf364d689a497a6ac2b42fcb19120a756585dde`; clean.
- `handbook`: `0.0.3`, HEAD `80b70c856ebac60cca553bfcd00c66c4c6bb47ab`; clean.
- `action`: `0.3.1`, HEAD `97d1d26fda215dfc48b06d83748253f736f6ce54`; clean.
- `action-request`: `0.1.9`, HEAD `153b3789c62c6089b3a4db5b15e194242dbb841b`; clean.
- `request-response`: `0.1.3`, HEAD `6cbc36ff82d75e32d40e973e319b3e153cb646bd`; clean.
- `template-insight`: `0.1.5`, HEAD `16df2ddcdbb5445197c273e4851e017a18b490ce`; clean.
- `mysql-maintainer`: `0.3.3`, HEAD `f60edbe4e622069bef37deb43b7a1e01578d7190`; clean.
- `rename`: `0.2.2`, HEAD `9c1c210b7af6fe1a650d30ee167d38d684bba436`; clean.
- `store`: `0.1.1`, HEAD `90d48ed7a42c6ca2d7f3ab41614daaefa6d0ccfc`; clean.

The read-only PHP application `/home/baptiste/itrocks/boust` is clean at `a250c0f4c2797524ff6d0641324b8d15a9aa0be4`. Its
separate framework checkout at `/home/baptiste/itrocks/boust/itrocks/framework` is clean at
`439c29e03293a4fec56dee7b82be0b3a95471828`. The application `AGENTS.md` applies; no nested instruction file was found in
that framework checkout.

## Existing components, exports and gaps

Paths in this section are relative to `node_modules/@itrocks/`. They are inspection locations, not private import APIs.
The package entry inventory below records manifest exports; browser file subpaths must be checked separately.

### Selector and metadata

- `property-select` contains licences, README and input documentation only. No `src`, dependencies, scripts, main entry
  or exports exist. Runtime facade, browser assets, ports, build and tests all remain to be created.
- `reflect/src/class.ts` enumerates inherited property metadata; `src/property.ts` exposes `class`, `type`,
  `collectionType`, `defaultValue`, `object` and `value`. There is no generic inverse/cardinality descriptor here.
- `reflect-path/src/property.ts` exports `ReflectPropertyPath` through `src/reflect-path.ts`, with typed string/segment
  paths in `src/types.ts`. The constructor initialises the first property but loops with `key < lastKey`, then builds
  the last property on the previous context. A two-segment path never advances to the first relation's type; longer
  paths also omit the final context advance. This is a source finding requiring a reproducer and owner fix. It currently
  reads `property.value`, expects `TypeType`, and does not establish metadata-only collection traversal, optional union
  handling or validation of every segment. The empty root must be handled by the metadata adapter.
- `property-type` owns union/collection/type facts. `composition` exports `Component`, `Composite` and accessors;
  ownership facts do not establish arbitrary relation inverses or N-N cardinality. The planner must define the missing
  relation metadata in the reflection/metadata owners, retaining explicit unknown values.
- `property-view` supplies display labels/order; `class-view` supplies class presentation. `list-properties` configures
  initial columns, not the full authorised metadata catalogue. Translation remains supplied by the host.

### List, table and pane

- `list/src/columns.ts` selects direct `ListReflectClass.listProperties()`, matches request column names, serialises
  `property.name`, and recreates direct `ReflectProperty` instances. Dotted columns are not supported by this contract.
- `list/src/list.ts` calls `dataSource().search()`, converts returned entities with `columns.propertiesOf()`, and calls
  `count()` separately. `filter.ts`, `sort.ts`, `feed.ts`, `feed.html` and list templates require coordinated review
  when projection results replace entity-based rendering. Do not retain an entity fallback for missing `select()`.
- `list/src/front/build.ts` installs `TableColumnReorder`, freeze, feed and link plugins; saves header `data-property`
  values with a fetch against the form action, and sorts through `xTargetCall`. It has no selector or pane service.
- `list/src/persist.ts` stores parameter serialisations under `request.session.list[routeOf(type)]`. This is the basis
  for a separate selector session namespace, not permission to share state between users or persist active drags.
- `table/src/column-reorder.ts` owns geometry, provisional moves, scrolling and header-origin removal. `start`, `move`,
  `finish`, `target` and pointer lifecycle methods are protected. No external-source addition contract exists. Add the
  plugin and narrow public reorder extensions here; do not call protected methods from `list` or duplicate geometry.
  Preserve header-origin deletion and freeze integration. Selector-origin outside drops must roll back.
- `home/src/container.html` contains breadcrumb, `main` and notifications, with no right pane. `home` must own pane
  structure, responsive styles, one movable open/close control, focus and temporary folding lifecycle. Its current
  dependency on `framework` forbids adding a reverse framework-to-home package dependency for registration.
- `framework/src/dependencies.ts:bind()` wires server ports after composition; `src/front/app.ts` is the separate
  browser activation root. `config.yaml` composes reflection; `build` and `xtarget` provide dynamic
  activation/navigation. The framework must inject a generic pane service into `list` without `list` importing `home` or
  `framework`.
- `session` exports session listing/revocation and `sessionDependsOn`; `SessionStore` has `list()` and `revoke()`, no
  component state read/write interface. DEP-05 needs a request-scoped adapter, transport and expiry/isolation tests.

### Storage and SQL

- `storage/src/data-source.ts` exposes entity CRUD, `search`, `count`, collection operations and options, with no
  `select()`. `Options`, `SearchType`, `Limit`, `Sort` and entity/identifier types are re-exported by `src/storage.ts`.
  Introduce neutral projection and result types here, explicitly distinct from complete `Entity<T>[]`.
- The installed TypeScript scan for `extends DataSource` / `implements DataSource` found only `mysql/src/mysql.ts`.
  Repeat the scan when adding fixtures/doubles; `mysql-maintainer` indirectly extends MySQL via composition and must
  continue to work. Application `config.yaml` replaces `Mysql` with that adapter.
- `Mysql.search()` and `count()` construct root-property SQL directly; `select()` is absent. Value conversions and
  connection execution belong here. The manifest does not yet declare `sql-build`; actual public imports must be added.
- `sql-build` already exports `Select`, `Columns`, `Where`, `Count`, `Tables`, `SqlQuery` and `sqlBuildDependsOn`.
  `Select` shares one `Joins` between columns, tables and criteria and returns `{ sql, values }`. Its options currently
  contain only `aliasPrefix`; list sort/limit/offset need owner extensions.
- `sql-build/src/column-reference.ts` rejects relationship-valued selections. `Columns` generates scalar/path aliases
  but no object expansion or reconstruction metadata. Object projection is a distinct missing feature.
- `sql-join` exposes `Joins`, `Join`, `JoinMode`, `JoinType`, `Subquery` and `sqlJoinDependsOn`. Reuse its path graph.
  `framework/src/sql-join-dependencies.ts` binds class/property/schema facts, including collections and composite
  back-references. A composite search is not a complete inverse relation catalogue.
- Plan one consistent graph for projected paths, criteria on non-projected paths and relational ordering. Optional
  relations, nulls, deterministic aliases, conversions, count and pagination require real database proof. Multiple
  valued paths require an explicit integration limit; no silent first value, aggregation or multiplied root rows.

## PHP reference and TypeScript adaptation

The following mechanisms were inspected read-only in `/home/baptiste/itrocks/boust/itrocks/framework`. A dedicated
comparative contract sub-task must complete scenario-level analysis before implementation; this initial mapping does not
settle signatures.

- `dao/sql/Link.php:select()` takes root, paths, filter and options, delegates query preparation/execution and returns
  list data. Adapt to a neutral `DataSource.select()` facade and parameterised builder results. Do not port double-pass
  options by default or put execution into the selector.
- `dao/sql/Select.php:prepareQuery()` uses the SQL builder and retains its path classes. `prepareFetch()` maps SQL
  aliases to logical columns; `resultToRow()` reconstructs typed objects and attaches identifiers. TypeScript needs an
  explicit projection descriptor and conversion plan owned by SQL/storage adapters, not dotted entity keys in `list`.
- `sql/builder/Columns.php:buildObjectColumns()` expands stored fields plus object id, with path/property aliases.
  Preserve identifiable object values and required representation data; use deterministic collision-free aliases suited
  to existing TypeScript contracts rather than copying PHP's colon syntax or polymorphic fallback.
- `sql/builder/Select.php` shares `Joins` between `Columns`, `Tables` and `Where`. This architecture already exists in
  TypeScript; extend it instead of implementing another graph in MySQL or the list consumer.
- `reflection/Reflection_Property.php` traverses each path segment and resolves element types. Fix and test the
  TypeScript owner with class metadata only, including collections, optional types and inherited/composed classes.
- `tools/List_Data.php` and `Default_List_Data.php` separate column descriptions, row values and root objects. Preserve
  that separation with a TypeScript projection result; selected objects remain typed values.
- `sql/builder/Select_Test.php` names scalar, deep criteria, object, reverse and collection scenarios;
  `dao/mysql/tests/Select_Test.php` exercises execution over model properties. The DEP-11 task must translate relevant
  cases and inspect `sql/builder/Where.php`, `sql/join/Joins.php` and `Join_Test.php` in detail. These tests have not
  been executed in this audit and do not replace isolated MariaDB/MySQL integration tests.

## Manifest entries and local linkage

The following are manifest declarations, not proof that generated assets have been rebuilt or that runtime works. No
registry install, pull, publication or checkout replacement was run. Internal declared ranges generally use `latest`;
local execution resolves the installed checkout and its compiled facade, not unpublished `src` automatically.

- `property-select` has no manifest `exports`; inspect distributed file subpaths before importing.
- `framework` exports: `./cjs/framework.js`.
- `list` exports: `./cjs/list.js`.
- `table` has no manifest `exports`; inspect distributed file subpaths before importing.
- `home` exports: `./cjs/output.js`.
- `reflect` exports: `{"import":"./esm/reflect.js","require":"./cjs/reflect.js"}`.
- `reflect-path` exports: `./cjs/reflect-path.js`.
- `storage` exports: `./cjs/storage.js`.
- `mysql` exports: `./cjs/mysql.js`.
- `sql-build` exports: `./cjs/sql-build.js`.
- `sql-join` exports: `./cjs/sql-join.js`.
- `property-view` exports: `./cjs/property-view.js`.
- `class-view` exports: `./cjs/class-view.js`.
- `translate` exports: `./cjs/translate.js`.
- `route` exports `.` and `./static-routes-plugin`, with separate `esm` import and `cjs` require facades.
- `property-type` exports: `./cjs/property-type.js`.
- `composition` exports: `./cjs/composition.js`.
- `list-properties` exports: `./cjs/list-properties.js`.
- `session` exports: `./cjs/session.js`.
- `build` has no manifest `exports`; inspect distributed file subpaths before importing.
- `xtarget` has no manifest `exports`; inspect distributed file subpaths before importing.
- `plugin` has no manifest `exports`; inspect distributed file subpaths before importing.
- `ux-core` has no manifest `exports`; inspect distributed file subpaths before importing.
- `dev` has no manifest `exports`; inspect distributed file subpaths before importing.
- `handbook` has no manifest `exports`; inspect distributed file subpaths before importing.
- `action` exports: `./cjs/action.js`.
- `action-request` exports: `./cjs/action-request.js`.
- `request-response` exports: `./cjs/index.js`.
- `template-insight` exports: `./cjs/template-insight.js`.
- `mysql-maintainer` exports: `./cjs/mysql-maintainer.js`.
- `rename` exports: `./cjs/rename.js`.
- `store` exports: `./cjs/store.js`.

Browser imports already used by `list` include `@itrocks/table/column-reorder.js`, `table.js`, `feed.js` and
`@itrocks/build/build.js`. `home` loads `framework/app.js` with an import map mapping `@itrocks/` to `/@itrocks/`.
Validate new browser `.js`, declarations, styles, icons, templates and package `files` at delivery, not only server CJS.
`property-select` currently distributes only README, docs and licences, so future runtime output must be added.

Expected modified owners: `property-select`, `reflect`, `reflect-path`, `storage`, `mysql`, `sql-build`, `sql-join`,
`table`, `list`, `home` and `framework`. `property-select` owns tracking and reusable isolated validation resources.
`showtime` is only the local test bench: do not create persistent documents or commits in its repository.
Temporary application setup must be recorded with its reproduction and cleanup commands in the package tracking area.
Potential further owners depend on proven need: relation decorators in `composition` / `property-type`, shared styles in
`ux-core`, and adaptation of `mysql-maintainer`. Presentation, route, session, build and plugin packages are reusable
contracts first; their inspection does not by itself justify changes or version increments.

Required dependency direction: host list -> selector/table; framework -> integration wiring; metadata adapter ->
reflection/presentation. Selector -> its own ports only; table -> plugin contract only; storage -> neutral types.
Existing dependencies needing attention: `list` imports owners such as storage/route beyond its current declaration; add
direct dependencies for imports touched by the implementation. Avoid a broad unrelated dependency cleanup.

## Commands and validation boundaries

Observed tools: Node `v24.0.1`, npm `11.6.4`. `node_modules/.bin/tsc` points to `@typescript/old/bin/tsc`; `tsx`,
`wsbuild`, `vcs-modules` and `dependency-levels` links exist. No local Jest binary exists although the application has
`test: jest`. Do not assume `npm test` is available; VAL-01 must establish the actual test runner and compiler.

Application scripts: `npm run build` runs back/front/SCSS concurrently; `npm start` executes `node app/main`.
`app/main.ts` imports `@itrocks/framework`. `npm run build:watch` starts watchers including `wsbuild`; `npm run
start:watch` uses nodemon. Existing route examples include `/movie` and `/country`, but no URL/port, credentials, usable
database or running process has been verified. Do not use private development data for fixtures.

Package commands below are actual script declarations, not audit test results. Run from the application root using `npm
--prefix node_modules/@itrocks/<package> run <script>`; assess generated files before committing.

### `property-select` commands

No build or test script exists. Plan runtime tooling and tests.

### `framework` commands

- `build`: `npm run build:back && npm run build:front`.
- `test`: `npm run build && node --test test/*.test.js`.

### `list` commands

- `build`: `npm run build:cjs && npm run build:css && npm run build:front`.
- `test`: `npm run build:cjs && node --test "test/**/*.test.mjs"`.

### `table` commands

- `build`: `tsc && sass --no-source-map demo:demo && node ../prepare-module/prepare-module.js`.
- No `test` script is declared.

### `home` commands

- `build`: `tsc && node -e "const fs=require('node:fs'),path=require('node:path');for(const file of
  fs.readdirSync('src'))if(file.endsWith('.html'))fs.copyFileSync(path.join('src',file),path.join('cjs',file))"`.
- No `test` script is declared.

### `reflect` commands

- `build`: `npm run build:cjs && npm run build:esm`.
- `build:test`: `npm run build:test:cjs && npm run build:test:esm`.
- No `test` script is declared.

### `reflect-path` commands

- `build`: `tsc`.
- No `test` script is declared.

### `storage` commands

- `build`: `tsc`.
- No `test` script is declared.

### `mysql` commands

- `build`: `tsc`.
- No `test` script is declared.

### `sql-build` commands

- `build`: `tsc`.
- `test`: `npm run test:types && tsx --test --test-isolation=none test/sql-build.test.ts`.
- `test:types`: `tsc --ignoreConfig --module nodenext --noEmit --types node test/*.test.ts`.

### `sql-join` commands

- `build`: `tsc`.
- `test`: `npm run test:types && tsx --test --test-isolation=none test/sql-join.test.ts`.
- `test:types`: `tsc --ignoreConfig --module nodenext --noEmit --types node test/*.test.ts`.

`table/test/column-reorder.test.mjs` and `test/feed.test.mjs` exist and use Node tests against DOM doubles. After a
successful table build, the explicit check is `node --test node_modules/@itrocks/table/test/*.test.mjs`; this is not
browser validation. `reflect` has build-test scripts and TypeScript test sources, no test runner script. The planner
must supply exact, exercised checks for owners lacking runners.

The handbook's `npx vcs-modules` may install dependencies, replace checkout directories and pull repositories; do not
run it as a harmless linkage check. Existing checkouts need targeted builds. `npx wsbuild` is the available watcher;
`npx dependency-levels` inspects declared ordering. Their help is documented as read-only; none was needed for this
audit.

## Version and commit rules

Read the handbook before each owner intervention. On the first framework package edit, compare its version to `git diff
HEAD -- package.json`: documentation/fix patch, additive feature minor, breaking contract major; use the highest
required increment once per pending delivery. Reassess scope and synchronise dependencies/locks when required. No
package version changes for inspection. This package documentation delivery changes `property-select` from `0.0.4`
to `0.0.5`; `showtime` remains at its initial HEAD and version. Selector history uses short imperative documentation
titles without a mandatory Conventional Commits prefix. Commit only `docs/orchestration/AUDIT.md`,
`docs/orchestration/COMMON.md` and `package.json` in the selector repository for task 4.1.
The `docs/orchestration/environment/` work belongs to task 4.2 and is excluded from this delivery.

## Audit validation report

- PASS: input presence and Git tracking; expected application and selector HEADs; clean package and PHP baselines.
- PASS: repository/manifest/export/script inventory and source inspection of owner boundaries and missing contracts.
- PASS: initial staged and working changes identified for preservation; no runtime product files changed.
- PASS: tracking resides in `property-select`; Markdown links resolve locally and the version follows the patch rule.
- Delivery commit title: `Document property selector audit and shared handover`.
- PASS: SOLID ownership review recorded: narrow consumer-owned ports, substitutable adapters and DataSource results,
  correct dependency direction, reuse of existing joins/reorder/activation/session rather than parallel implementations.
- NOT_RUN: application/package builds, unit suites, SQL execution, browser and touch checks. They belong to later tasks.
- Follow-up: execute VAL-01; define the DEP-11 comparative contract; plan owner changes and independent checks.
- No access blocker was established by this read-only audit. Availability of a test database, browser touch input,
  authentication fixture and live URL remains unverified, not declared available or impossible.

This document is the task report and source evidence index. [COMMON.md](COMMON.md) is the shared handover. No plan or
validation matrix exists yet; task 4.3 owns those artefacts. The local commit SHA is returned after commit.

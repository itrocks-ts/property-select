# PHP projection comparison

## Inspected reference and scope

Task `S01` is completed within planning task `P03`, on 15 October 2026, before the storage contract is implemented.
Read-only application: `/home/baptiste/itrocks/boust`, HEAD `a250c0f4c2797524ff6d0641324b8d15a9aa0be4`.
Framework: `/home/baptiste/itrocks/boust/itrocks/framework`, HEAD `439c29e03293a4fec56dee7b82be0b3a95471828`.
Both remain clean. The application `AGENTS.md` was read; no nested framework instructions were found.
No PHP code, private database, configuration, cache or `update` marker was changed. PHP tests were inspected, not run.

The TypeScript owner checkpoints are recorded in [AUDIT.md](AUDIT.md); a fresh planning check confirmed all eleven
owners clean, with property-select at `77ebcdfd963f6143c4bfa95452bf1b3d6a445af6`, version `0.0.12`.
This comparison settles adaptations in [SELECT-CONTRACT.md](SELECT-CONTRACT.md). It does not assert PHP behavioural
correctness or copy every PHP option into phase 1.

## Selection facade and list data

`dao/sql/Link.php:select()` normalises properties/options, chooses optional double-pass processing, constructs a
`dao/sql/Select`, prepares/executes the query and returns fetched list data. It accepts a class, requested properties,
filter and options. `tools/List_Data.php` separates column metadata, rows, root objects and values;
`Default_List_Data.php` indexes property metadata by path and constructs a `Default_List_Row` per root.

Adaptation: `DataSource.select(type, selections, search, options)` returns column descriptors and projected rows with
explicit root identity, independent from `search(): Entity[]`. No list/SQL implementation inside the selector.
Do not port PHP's implicit object/array result alternatives or double-pass, grouping and aggregate options.

## Object expansion and reconstruction

`sql/builder/Columns.php:buildObjectColumns()` expands stored properties, filters replaced/nonstored properties,
includes foreign identifiers and appends an object identity. Its aliases combine full path and property using `:`.
Linked/abstract-class handling adds PHP-specific fields. `dao/sql/Select.php:prepareQuery()` takes the builder's path
classes; `prepareFetch()` maps result columns to logical cell indexes and target classes. `resultToRow()` creates
objects, assigns values, and attaches identifiers through the link. The code contains a commented full-object reread;
that is not a mechanism to reproduce. A TODO notes the lack of object-map reuse.

Adaptation: the builder returns a typed projection mapping rather than requiring the adapter to parse aliases.
MySQL applies existing SQL/READ transformers with final-property context, creates partial target instances and attaches
id. The result describes loaded fields; root rows are never disguised as entities with dotted property names.
Use a result-local identity map, merge object/descendant projections, and explicitly detect missing joined identities.
PHP's object construction alone does not establish the null-versus-absent distinction required here.
List requests the representative field closure, including nested representative objects, before execution. There must
be no cell-level reads, SQL label formatting or constructor defaults pretending to be loaded values.

## Shared graph, aliases and optional joins

`sql/builder/Select.php` constructs one `Joins` shared by Columns, Tables and Where. It builds options and filters
before
rendering FROM because these can add joins. `sql/join/Joins.php:add()` caches by full path, recursively creates parent
joins and records path-to-class facts. `addFinalize()` allocates aliases and distinguishes object joins.
`sql/join/Join_Test.php:testReverse()` covers reverse object and link-table paths; `testMap()` covers map relations.

TypeScript already shares `Joins` in `sql-build/src/select.ts`; `column-reference.ts` explicitly rejects relationship
values. Extending scalar dotted paths alone is therefore insufficient. Adapt by registering projection, object-field,
criteria and order paths before rendering, with deterministic generated output aliases and explicit mappings.
Preserve optional ancestors through later joins. Full paths, not target classes, identify reused joins.
Logical inverse/N-N metadata lives in reflection; schema bindings supply physical joins without exposing link tables
in the selector. PHP reverse syntax such as `Order_Line(order)` is not a new user-facing TypeScript path grammar.

## Criteria, conversion and pagination

`sql/builder/Where.php:buildWhereColumn()` calls the same joins, resolves object criteria to identities and resolves
scalar parents to their aliases. `getProperty()` locates final property metadata. PHP additionally supports nested
logical arrays, expressions and implicit pattern matching. TypeScript `Where` currently supports flat AND criteria,
equality, null and `SqlFunction`; MySQL separately constructs root criteria and converts root properties.

Adaptation: one TypeScript preparation/compiler path serves selection, search and count. Transform each operand in its
final property's context and preserve the trusted function operator. Values remain driver parameters. Explicit null
uses IS NULL; object comparisons use identity. Do not port PHP literal interpolation or its extra expression language.

PHP's Select options include sorting, limits, grouping, DISTINCT and SQL_CALC_FOUND_ROWS. Collection projection tests
show joined row multiplicity; these examples do not define this project's root-row pagination policy.
Adaptation: singular column projections only for the list, explicit rejection of plural projected/order paths, and
EXISTS scopes for plural criteria. Count and pagination share root semantics. Stable root-id tie-breakers prevent
unstable page boundaries on a fixed fixture. No aggregation or automatic selection of a first child is introduced.

## Scenario correspondence

- `sql/builder/Select_Test.php:testSimpleQuery`, `testJoinQuery`, `testComplexJoinQuery`: translate to direct, deep and
  shared-prefix projection (`SQL-01`, `SQL-03`). Add sibling paths reaching the same class and identifier collisions.
- `testObjectQuery`, `testComplexObjectQuery`: translate to typed object values, explicit identity and mixed
  object/descendant cells (`SQL-02`, `SQL-03`). Add actual conversion and representative-rendering assertions.
- `testWhereDeepQuery`, `testArrayWhereDeepQueryObject`, `testObjectWhereWithNull`: translate only supported flat
  criteria/object/null semantics, including criteria not projected (`SQL-04`, `SQL-05`). Nested PHP logical arrays are
  not a required feature of this TypeScript API.
- `testCollectionJoinQuery`, `testReverseJoinQuery`, `testWhereReverseJoinQuery`, Join `testMap`/`testReverse`: verify
  metadata navigation and physical facts, explicit list projection refusal and plural-filter root identity semantics
  (`SQL-09`, `SQL-10`, `META-01`). Do not copy PHP's multiplied result rows into list pagination.
- `testQuoteSalesmanStoreName`: retain metadata-based quoted identifiers and deterministic aliases (`SQL-06`).
- `dao/mysql/tests/Select_Test.php:everythingProvider()` discovers business classes and creates EXPLAIN queries;
  `testEverything()` succeeds if the query raises no exception. It does not assert hydrated cell values or query counts.
  Our independent `VSQL` must execute SELECT through the public API and assert values, identities, conversions, total,
  page boundaries and reads (`SQL-01`–`SQL-14`). The PHP suite is a structural reference, not the acceptance oracle.

## Review decision

The retained mechanism is path projection → shared SQL builder → parameterised execution → typed values by column.
The adaptations preserve TypeScript package ownership, public ports, conversions and configured data-source selection.
The additional projection descriptor, explicit partial object semantics, plural policy and independent database gate
resolve gaps that the PHP architecture cannot settle for this repository. Astra/high remains appropriate for `S05`,
`S06`, `S07`, `VSQL`, `L2-LIST` and their independent cross-module reviews.

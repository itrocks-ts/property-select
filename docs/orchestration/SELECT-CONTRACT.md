# Path projection contract

## Status and ownership

This is the phase 1 implementation contract, approved for independent plan review, not an available API.
Read [the requirement](../select.md), [PHP comparison](PHP-COMPARISON.md) and [shared rules](COMMON.md).
Tasks `S02`–`S07` implement it; `VSQL` must pass on the isolated database before `L2-LIST`.
Astra/high is selected for SQL planning, reconstruction and independent validation because their invariants cross
reflection, SQL, conversion and pagination. No product code is delivered by planning task `P03`.

`storage` owns neutral inputs/results/errors. `reflect` and `reflect-path` own model resolution. `sql-join` owns the
join graph. `sql-build` owns SQL and its projection mapping. `mysql` executes and reconstructs converted values.
`framework` binds schema and conversion facts. `list` requests representation fields and renders projected values.
Neither `property-select` nor `list` may build SQL or reconstruct database records.

## Public storage API

Export these additions from `@itrocks/storage`, without importing a SQL builder or presentation package.
Keep the existing `PropertyPath` export for sort options unchanged; use `SelectionPath` for this new input.

```ts
type SelectionPath = string | readonly string[]
type Selection = SelectionPath | {
  path: SelectionPath
  objectFields?: readonly SelectionPath[]
}
type ProjectionColumn = {
  path: string
  kind: 'scalar' | 'object'
  objectType?: Type
  objectFields?: readonly string[]
}
type ProjectedObject<T extends object = object> = Partial<T> & { id: Identifier }
type ProjectionCell =
  | { kind: 'value'; value: unknown; loadedFields?: readonly string[] }
  | { kind: 'absent'; at: string }
type ProjectionRow = {
  rootId: Identifier
  cells: readonly ProjectionCell[]
}
type ProjectionResult<T extends object = object> = {
  rootType: Type<T>
  columns: readonly ProjectionColumn[]
  rows: readonly ProjectionRow[]
}

// Method added to DataSource; Type, Identifier, SearchType and Options already exist.
select<T extends object>(
  type: Type<T>, columns: readonly Selection[], search?: SearchType<T>, options?: Options
): Promise<ProjectionResult<T>>
```

`cells[i]` belongs to `columns[i]`; column paths are normalised unique paths in request order.
The root identity is separate from cell values. `columns` is returned even when `rows` is empty.
A scalar cell uses `kind: 'value'`, including a terminal SQL `NULL` represented by `value: null`.
An absent object or absent intermediate relation uses `kind: 'absent'` with its first absent relationship path.
Thus a present address with null city name differs from an absent address. Extra hidden identity columns distinguish
these cases. Invalid/forbidden paths and conversion failures reject; they never produce empty successful cells.
For an object column the value is a `ProjectedObject` with the target prototype and attached storage identity.
`objectType` and `objectFields` describe its type and planned fields; they are server metadata, never JSON class names.
Object value cells also carry actual `loadedFields`, allowing a row-specific transformer to leave a field unloaded.
The cell union intentionally does not claim dynamic field types as compile-time complete domain entities.

Add `SelectionError extends Error` with `code`, optional `path` and `cause`. Codes are `invalid-path`,
`unsupported-selection`, `multiple-values`, `ambiguous-type`, `conversion` and `unsupported-option`.
Authorisation denial uses the host's existing response/error convention, before storage access; it must not reveal a
forbidden property through a different metadata endpoint. A driver failure keeps its original cause.

The base `DataSource.select()` rejects with `SelectionError('unsupported-selection')`; it does not call `search()`.
This compatible addition does not require every existing custom adapter to implement projection immediately. The
configured MySQL adapter and all projection-consuming doubles implement it. Scan all implementations before delivery.
If an executor instead makes the method abstract, that is a breaking API change requiring revised review/versioning.

## Normalisation, defaults and options

- A string and its segment array name the same path. Accept only nonempty metadata property segments, with `.` as
  separator and no empty segments. Do not trim or case-fold technical names. Empty root is invalid for selection.
- An empty column list is valid and returns root identities with empty cells. Duplicate normalised paths are errors;
  conflicting object field descriptions cannot be resolved by silently dropping a selection.
- Omitted criteria mean no restriction. Use existing `SearchType` and `Options`; never accept SQL strings as options.
- Reuse `Sort`, `Reverse` and `Limit(limit, offset)`. `Sort` or an empty `Sort` uses the existing default sort metadata;
  otherwise retain explicit option order. Append ascending root id as a unique tie-breaker unless already included.
  With no sort, order by ascending root id. `Limit` uses nonnegative safe integers and zero-based offset; zero limit
  means no rows, not unlimited. An omitted limit means unbounded selection. Reject offset without a finite limit,
  nonfinite/negative values, contradictory duplicate options and unknown options explicitly.
- Preserve legacy `search()` option behaviour where callers depend on it. Share the path/criteria compiler, without
  silently changing the established meaning of a full entity search or its returned type.
- Sort by a scalar descendant normally. Sort by a singular object path means its identity; `list` expands an object
  heading sort to its representative scalar paths, then identity, before calling storage. No SQL label formatting.
- Add neutral `Identifiers extends Option` with `constructor(readonly ids: readonly Identifier[])` for visible-row
  reloads. Empty ids mean no rows; deduplicate ids, bind each value, intersect with criteria and never bypass scope.
  The builder receives a neutral `rootIds` array and builds the corresponding parameterised predicate.
- No total is embedded in the result. `count(type, sameSearch)` returns the number of matching roots without limit.
  Feed selection and count use identical mandatory scope/criteria. Stable pages are guaranteed for a fixed dataset;
  separate calls do not claim a transactional snapshot during concurrent writes.

## Selected objects and representation

An object column is a partial object value, not a foreign key, label or full root entity. Never add dotted keys to a
business object. Instantiate a projection object with its target prototype without populating unrelated constructor
initialisers. Hydrate only recorded fields and identities. Mark/document partialness through the projection metadata;
consumers must not send these values to `save()` as complete objects.

If `objectFields` is omitted, expand all directly stored scalar properties of the selected type, plus identity.
If supplied, it lists fields relative to the selected object; nested singular paths are allowed. Identity is always
included internally, including identities at intermediate object boundaries. Reject `objectFields` on scalar columns.
The builder records planned paths in `ProjectionColumn.objectFields`; MySQL records actual loaded paths on each object
cell. Do not advertise unselected defaults, including for nested fields.

`list` derives the finite representative field closure through `representativeOf`, `ReflectPropertyPath` and the
existing property/type transformers: direct fields and nested representative relation fields. It passes that closure
as `objectFields`, never as SQL. Standard City plus Country representation must work, including nested conversions.
Provide a narrow, configurable representation-field resolver at the list boundary for a custom output transformer
whose inputs are not described by standard representative metadata. A cyclic or undeclared custom representation
fails explicitly before querying; it cannot trigger lazy reads per cell or fall back silently to an id label.
This limit concerns undeclared custom representations, not ordinary object-valued columns required by V1.

`mysql` converts scalar leaves with the property's declaring/final type and the existing `SQL`/`READ` bindings.
Build the local owner record expected by transformers, then assign its converted property to the projection tree.
Do not pass `customer.address.city.name` as a property name on Invoice to a transformer. Honour async conversion,
`IGNORE`, null/empty distinctions and legitimate `undefined`; conversion errors reject with path context.
`IGNORE` leaves a field unloaded and omits it from that object cell's `loadedFields`, rather than inventing a default
value. It does not change the shared column descriptor or another row's loaded fields.
A required representative field returning `IGNORE` is an explicit unsupported representation at the list boundary.

Use one object per `(target type, id)` within a result when the same identifiable object is selected through multiple
paths, merging selected fields consistently. A mixed object and descendant selection must agree on converted values.
There is no cross-request identity cache. An absent identity produces an absent object; null data fields alone do not.
Projection hydration and representative rendering must execute zero extra database reads after the selection query.

## Builder API and join invariants

Retain existing `Select.build(): SqlQuery` and `Count.build(): SqlQuery`, with `{ sql, values }` and bound parameters.
Add `Select.buildProjection(): ProjectionQuery<ColumnDefinition>` on the public `sql-build` entry. It accepts normalised
selection descriptors through an extended `ColumnSelection`, and returns the same SQL plus an explicit mapping:

```ts
type ProjectionQuery<C = unknown> = SqlQuery & {
  rootIdentityAlias: string
  columns: readonly {
    path: string
    kind: 'scalar' | 'object'
    fields: readonly {
      alias: string
      relativePath: string
      definition?: C
      role: 'value' | 'identity'
    }[]
    presence: readonly { path: string; alias: string }[]
  }[]
}
```

`definition` carries the already-resolved property metadata for values; synthetic id fields use the explicit identity
conversion convention. Object target definitions are obtainable from the shared graph, not inferred from aliases.
Extend builder options with neutral `orderBy: { path: string; descending?: boolean }[]`, `limit?: number` and
`offset?: number`, plus optional `rootIds` for the validated identity restriction. MySQL maps storage options to
these fields; the builder never imports `storage`.
All new exports and dependency hooks are documented in their owning README/dependency documents.

Use one graph for projection, representation fields, criteria and ordering; register all paths before rendering tables.
Projection-only optional relationships use left joins, including every later join below an optional ancestor.
A required descendant must not turn an absent optional ancestor into a missing root row. Criteria intentionally exclude
rows according to their predicate, independently of whether the filtered property is displayed.

Deduplicate joins by full relationship path, never target class. Allocate aliases deterministically by sorted full
path registration, with root `t0`. Generated output aliases use a reserved numeric namespace (`p0`, `p1`, …), mapping
through descriptors instead of parsing strings. Keep separate namespaces for output and table aliases. Validate
metadata names then quote them through the existing dialect hook. Never concatenate user path syntax into SQL.
Existing custom alias support remains valid for the low-level builder; reject duplicate aliases there.

`Where` owns predicate construction; MySQL resolves/transforms operands against the final property and delegates.
Reuse the current flat `AND` map, equality, `null` and `SqlFunction` semantics. Convert the function operand while
preserving its operator. Functions come from the existing trusted function abstraction, not arbitrary request SQL.
Use one preparation helper for `select()`, `search()` and `count()` to avoid root-property conversion divergence.
Object equality uses target identity; null object criteria use absence. Preserve existing supported root functions,
identifier operands and entity criteria through compatibility tests; PHP logical trees are not added by this contract.

## Cardinality and root rows

A singular projection means every traversed relation is singular. A known plural relation anywhere in a projected or
sorted path raises `multiple-values`, before executing SQL. Unresolved target multiplicity raises
`unsupported-selection`; a reflected singular class target is sufficient even
when the opposite-end cardinality or inverse is unknown.
The metadata selector still exposes and navigates those relations, including inverse and N-N logical properties.
`list` explains the unsupported column on selection and leaves columns, navigation and recents unchanged. It never
chooses the first element, aggregates, multiplies root rows or requests an aggregation choice.

Criteria may traverse known plural relations without projecting their values. Compile these as correlated `EXISTS`
scopes using `sql-join` relationship facts; predicates sharing a plural prefix constrain the same related row, as the
existing flat joined `AND` semantics do. Independent plural branches use separate scopes. Nested plural prefixes use
nested scopes. `null` inside a plural scope matches an existing related row with null terminal value; absence of the
collection itself is not silently interpreted as that predicate. Inverse and N-N paths use explicit owner metadata,
including physical link facts supplied by the schema adapter, never names guessed by the selector.

The same criteria compiler serves `Count` and `Select`, so no projected/order joins multiply root rows. Root count,
SQL limit and offset operate on one row per root. Collection projection remains rejected even for a fixture with only
one current child. Test plural criteria with zero, one and several matching children, proving no inflated counts/pages.
If the existing builder's lower-level collection projection remains available, preserve its documented low-level
semantics; the neutral storage selection validates and rejects that shape for V1.

## Real integration gate

`VSQL` creates its own assertions against public `dataSource().select()` and the configured `Mysql`/framework bindings.
It compares independent expected roots/values against executed SQL, not only snapshots or the author's tests.
Use the synthetic invoice graph and query journal from [ENVIRONMENT.md](ENVIRONMENT.md).
Required cases `SQL-01`–`SQL-14` are in [VALIDATION.md](VALIDATION.md), including absent links, object plus descendant,
criteria not displayed, conversions, alias collisions, plural rejection, count/pages, empty results and query counts.
Use at least 120 roots for a 50-row first page and feed continuation, with duplicate sort values and mixed nulls.
One select call uses one bounded projection query; count is a separate query. Rendering adds zero queries. Adding a
visible column projects only loaded row ids (the new neutral `Identifiers` option), respecting mandatory scope;
never read all matching roots to align rows in memory. Repositioning an unchanged preview reuses the pending read.

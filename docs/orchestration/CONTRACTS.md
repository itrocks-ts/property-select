# Selector and host architecture contracts

## Status, boundaries and surfaces

These are new contracts to implement after `P04`, not claims about existing exports. They complete
[DEP-01–DEP-11](../dependencies.md) and [V1](../it-rocks-selecteur-relationnel-specifications.md).
[SELECT-CONTRACT.md](SELECT-CONTRACT.md) is authoritative for database projection.
Use existing `*DependsOn()` conventions for injected functions and explicit per-instance ports for lifecycles.

The new `property-select` public facade exports normalisation, ports and the navigation/search/state controller.
The browser entry `@itrocks/property-select/property-select.js` exports `PropertySelect`; its `build.js` entry is
explicit optional activation. Source belongs in `src/` and `src/front/`; CSS/assets follow the handbook build layout.
Neither entry imports `framework`, `home`, `list`, `table`, SQL, reflection or Node browser-incompatible modules.
The standalone demo imports the delivered browser entry and its own static provider/consumer only.

`reflect` exposes relation facts; `reflect-path` resolves typed paths. The framework owns the authorised server
metadata adapter and HTTP transport composition. `list` owns its consumer adapter and request-scoped state actions.
`table` owns `TableColumnAdd` and external reorder lifecycle. `home` owns `RightPane`. Framework binding is the only
place that chooses these implementations for the list context. No new infrastructure package is needed.

## Paths and metadata port

```ts
type PropertyPath = string | readonly string[]
type RootId = string
type TypeId = string
type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'unknown'
type PropertyDescription = {
  path: string
  name: string
  label: string
  kind: 'terminal' | 'relation'
  target?: TypeId
  order: number
  relation?: { id: string; inverse?: string; cardinality: Cardinality }
}
type ObjectContext = {
  path: string
  type: TypeId
  label: string
  properties: readonly PropertyDescription[]
}
interface MetadataProvider {
  context(root: RootId, path: string, signal?: AbortSignal): Promise<ObjectContext>
  resolve(root: RootId, path: string, signal?: AbortSignal): Promise<PropertyDescription | ObjectContext>
}
```

Normalise arrays and strings once to dot-separated technical segments; empty string/empty array is the root.
Reject empty internal segments, unrecognised paths and terminal traversal; do not mutate case or translate identifiers.
`resolve(root, '')` returns root context, whose shape is distinguished by `properties`. The root is never selectable
or draggable. Properties contain full root-relative paths, never paths relative to the currently displayed object.
`order` is stable provider business order, with path as a deterministic final tie-breaker; fallback labels use names.
Root/type/relation ids are opaque, serialisable and scoped to the authorised catalogue version. Relation ids identify
the declaring relation independently of a traversal path; inverse ids refer to that same canonical edge vocabulary.

Missing provider is a configuration error. Missing used paths or suggestions means empty arrays; translation defaults
to identity text. Permission filtering runs on the server for both context and complete-path resolution. Request
cancellation is advisory: the selector also discards stale results by generation and disposed-instance checks.
Cache facts by root, catalogue version and context within the authorised instance; never cache user access globally.
The provider loads one context at a time. It does not load records or implement search ranking/root expansion.

In `reflect`, add `Relation`/`relationOf` through the established decorator/accessor conventions and a neutral relation
fact exposed by `ReflectProperty`. Facts carry explicit inverse identity and cardinality with `unknown` defaults.
Reuse collection/optional/inherited type metadata for target multiplicity; a collection alone does not establish its
inverse or distinguish one-to-many from many-to-many. The framework merges existing `Component`/`Composite` facts
only where unambiguous, preserving unknowns. Explicit fixture declarations cover inverse and N-N relationships.
Logical relation property names hide technical link tables; physical mapping remains in the schema/SQL adapter.

`reflect-path` exposes a metadata-only `resolvePropertyPath(rootType, path)` returning the canonical path, ordered
`ReflectProperty` segments, final property, target type when relational, optional ancestors and accumulated target
multiplicity (`one`, `many`, `unknown`). It validates each segment through reflection, including two-level paths,
collections, optionals and inheritance; ambiguous multi-target unions are explicit errors. It reads no `property.value`
or domain relation getter. Keep `ReflectPropertyPath` compatible for existing callers and fix its context traversal.
Handle the empty root in the provider; do not manufacture a property for it.

## Intentions and acknowledgements

```ts
type InteractionId = string
type SelectionIntent = { id: InteractionId; root: RootId; path: string }
type PointerSample = { pointerId: number; pointerType: string; clientX: number; clientY: number }
type Outcome = {
  id: InteractionId
  path: string
  status: 'added' | 'existing' | 'moved' | 'cancelled' | 'rejected'
  message?: string
}
interface ConsumerPort {
  select(intent: SelectionIntent, signal: AbortSignal): Promise<Outcome>
  begin(intent: SelectionIntent, sample: PointerSample): void
  move(id: InteractionId, sample: PointerSample): void
  end(id: InteractionId, sample: PointerSample): Promise<Outcome>
  cancel(id: InteractionId, reason: string): void
}
```

Callbacks follow the existing options/event conventions; these method names define their payload semantics.
No payload includes a column, table instance or insertion index. The id is unique per live selector instance/attempt.
One drag transitions idle → pending intention → recognised → ended/cancelled. `begin` fires only after recognition;
`move` cannot precede it; exactly one terminal call follows. Path and root remain fixed until the terminal event.
A click gets its own id. After recognition suppress its residual click; `+` stops line activation propagation.
No consumer means observable intentions only, no implicit confirmation or mutation.

Resolve `select/end` only after the host accepts the operation and updates its committed column state. Only `added`
feeds recents; existing/moved/cancelled/rejected never do. Id/path mismatches, duplicate acknowledgements and results
from disposed generations are ignored/reported, never applied. Rejection shows a recoverable error and retains context.
Host pending-path reservations prevent rapid clicks or click/drag overlap from creating duplicates. Removing/aborting
one pending operation must not release another operation's reservation.

The selector recognises gestures only on its surfaces. It keeps pointer capture on a surviving transport controller;
folding the pane must not remove this controller. The host resolves actual target coordinates independently of the
capture target. Pointer cancellation, Escape, outside drop and view disposal cancel exactly once.

## State and suggestions

```ts
type SelectorState = {
  version: 1
  branch: readonly string[]
  current: number
  query: string
  recent: readonly string[]
  scroll: Readonly<Record<string, { left: number; top: number }>>
}
type StateRecord = { revision: number; state?: SelectorState }
interface StateStore {
  read(key: string, signal?: AbortSignal): Promise<StateRecord>
  write(key: string, state: SelectorState, expectedRevision: number): Promise<StateRecord>
  remove(key: string, expectedRevision: number): Promise<StateRecord>
}
```

`branch` holds relation names from root to the remembered deepest object. `current` is the count of open relation
segments, from zero to branch length. Scroll keys identify selector views/contexts, never tables or business rows.
Recent entries are destination paths. Version, lengths, numeric bounds and all paths are revalidated before restore.
Unknown state versions reset cleanly; invalid branches truncate at the longest valid relation prefix and clamp current.
Relaunch the persisted query from that valid context. Do not persist results, transports, preview columns or requests.

Writes are serialised/coalesced per instance; revisions prevent older HTTP responses/writes replacing newer state.
A never-written key reads `{ revision: 0 }`. Removing a key increments its revision and retains a tombstone without
`state` until that session generation ends; read/remove return that revision. This prevents an old write from
recreating removed state and lets a later mount create fresh state using the tombstone revision.
The host implements compare-and-set for concurrent requests. The framework adapter uses a session-wide transaction
supplied by the HTTP/session owners. A lock per selector key is insufficient: the installed store writes the whole
session, including `session.list` and other selector keys.
L4 must coordinate every write of that session, including response autosave and revoke/expiry, before acknowledging
state. Reload the authoritative snapshot under the lock; preserve unrelated namespaces and await durable save.
The transaction must reject stale generations, including requests already loaded when revoke/expiry occurs.
The existing Fastify request proxy exposes bound `reload`, `save` and `destroy`, but those methods alone do not
provide this transaction. Implement the narrow session lifecycle support in `fastify` and
`fastify-file-session-store`, composed by framework; list and selector remain transport-neutral.
Keep user state in the request/store. A bounded per-session lock registry holds coordination only and is released on
completion. The configured single-process file store is the required deployment here; do not claim distributed locking.
Store snapshots must be copied/serialised at the transaction boundary, with cache identity scoped to the store,
so live nested object mutation cannot skip persistence. Writes and revocation share the same generation check;
response autosave cannot recreate an expired/revoked record. Do not treat a missing reload as a valid old generation.
Revision conflicts trigger reread and reapply the latest local snapshot, never silent overwrite.
A session generation invalidates in-flight writes after expiry/revocation. Errors preserve current local state and show
recoverable persistence failure. Without a store the explicit standalone mode retains only the mounted instance state.

`list` owns a separate request-session namespace, `propertySelect`, keyed by canonical route identity from the router,
with query arguments removed but route-identifying path segments retained. It is distinct from `session.list`.
Framework routes inject per-request session and access policy; no singleton holds a user's state. Session expiration
clears data. The existing `@itrocks/session` listing/revocation API is not used as if it were component storage.

Suggestions merge confirmed recent contexts, maximal used contexts per branch and configured root advice, in that
order. Deduplicate full paths, retain recent ancestors, exclude root and default to at most six destinations.
A configuration reload changes used paths/advice without erasing session recents. Invalid paths disappear gracefully.
The technical limits are component options, not phase 2 UI preferences.

## Search and navigation state

One controller serves all viewport modes. Remember branch and current independently. Ancestor/descendant activation
keeps the whole remembered branch; selecting another relation replaces only the divergent suffix. Shortcuts replace
the whole branch and clear search; normal navigation preserves search; selection changes neither.

Search uses progressive breadth-first traversal from current context only. Initial technical budgets are depth 6,
500 visited path contexts, 100 displayed results and at most 4 pending provider requests; options may tune them without
adding preferences UI. Use installed normalisation utilities for case/accents/spacing and all-word path matching.
Rank by depth, final-name match, business order and full path, independent of response arrival. Preserve active focus
while enriching results. Expose loading, complete/empty, limited and error states distinctly.

Track relation edges per branch. Allow at most one known inverse cycle return after an outgoing many-to-one or
many-to-many relation; exclude the reverse return of one-to-many and uncertain inverses/cardinalities. Distinct paths
to the same type are not cycles. Manual navigation stays available even where automatic exploration stops.

## Table addition and public reorder extension

New browser export: `TableColumnAdd` at `@itrocks/table/column-add.js`, a `Plugin<Table>` configured after
`TableColumnReorder`. It accepts opaque column ids and render/load callbacks from `list`. It never imports the selector,
route, session, reflection or business classes. Extend `TableColumnReorder` with public external transaction methods;
no protected member access from list and no second geometry, insertion or autoscroll implementation.

```ts
type ColumnContent = { header: HTMLTableCellElement; cells: readonly HTMLTableCellElement[] }
type ColumnSource = {
  id: string
  create(): ColumnContent
  load?(signal: AbortSignal): Promise<ColumnContent>
  accept?(signal: AbortSignal): Promise<void>
}
interface ColumnOperation {
  move(sample: PointerSample): void
  finish(sample: PointerSample): Promise<'added' | 'moved' | 'cancelled'>
  cancel(): void
}
// Public plugin methods; sample is a structural type owned by table, not an import from the selector.
add(source: ColumnSource): Promise<'added' | 'existing'>
reveal(id: string): void
highlight(id: string): void
beginExternal(source: ColumnSource, sample: PointerSample): ColumnOperation
```

L2-TABLE delivers `add`, `reveal` and `highlight`, plus `begin(source): ColumnTransaction` as a non-pointer foundation
with `commit`, `cancel`, `moveTo` and `ready`. Its optional `load` callback can be retried through `retry(id)`;
`dispose()` aborts outstanding work and reset invokes it automatically. L5 delivers `beginExternal` through the public
reorder operation, including a held admission phase that keeps the operation exclusive. Current DOM shape is one header row without spans and one optional column group.
See the table owner's README for the delivered callback/notification signatures.

`create()` immediately produces a real header and one placeholder cell per loaded row. `load()` enriches it without
blocking transport, accepts cancellation and carries the current row-view generation in the list closure. Callbacks
supply safe rendered content, not SQL. Identity/row-key alignment belongs to list; DOM placement belongs to table.
`beginExternal` reuses an existing column if its opaque id exists, retaining its original index for rollback.
Plugin commit/cancel notifications distinguish transient from committed changes; only commit invokes list persistence.
Repeated move does not reload values. Late load completions check transaction and view generation before DOM mutation.

`list` reserves normalised paths before asynchronous addition, supplies loaded row ids and handles duplicate selection
with reveal/highlight only. Click appends, drag inserts at the accepted position. Highlight is the same subtle green →
light → theme background sequence for new/existing clicks, with reduced-motion handling and no keyboard focus theft.
A valid drop commits independently of whether optional value loading has finished; a loading failure is a visible
cell error with retry, not a false cancellation. A failed column creation rejects and confirms no addition.
Optional `accept(signal)` validates admission independently of values; list uses its authorised representation check
without selecting rows. Invalid drops cancel immediately, including while admission is pending.
An invalid drop never falls back to append. External-origin cancellation restores an existing column, never deletes it.
Header-origin reorder/removal remains unchanged, including frozen boundaries and sort interactions.

## Pane service and composition

New public browser API `RightPane` lives at `@itrocks/home/right-pane.js`:

```ts
type PaneState = { present: boolean; open: boolean; suspended: boolean }
interface PaneHandle {
  open(): void
  close(): void
  suspend(): { restore(): void }
  subscribe(listener: (state: PaneState) => void): () => void
  remove(): void
}
// RightPane method, owned by home.
register(owner: object, content: HTMLElement, title: string): PaneHandle
```

Only one view owner occupies the pane. A second owner's registration rejects with `PaneOccupiedError` until the current
owner removes its content; no queue/window manager and no silent replacement during drag. Repeated registration by the
same owner updates title/content only while inactive; during active transport it also rejects. Empty content has no
command. New content starts folded. Removal is idempotent and invalidates every outstanding restore token.
`suspend()` folds visually without destroying content or transport; its restore token restores the preceding open/scroll
state only for the same owner/generation. Nested suspensions restore only after the final valid token is released.
Explicit close restores focus to a visible trigger; temporary drag restoration never focuses the search input.

Home owns one movable control: top right after notifications while folded, left of pane title with reversed icon while
open. Desktop shrinks the main region but keeps it interactive. Mobile occupies the available screen and makes hidden
main content unfocusable. The list header add button stays accessible at the right edge during horizontal scrolling and
requests `open()` on this handle; it does not build another pane.

Avoid the existing `home → framework` cycle: home exposes/configures its browser service via its own container script;
framework's browser composition accepts a structurally typed registration callback, injected when that configured
container activates. Framework and list do not import home. List declares only its narrower host port
`mountSelector(content, title): PaneHandle` structurally within list; the composition adapter supplies home handles.
Framework loads selector/list integration only for compatible list views and cleans it on XTarget replacement.
No global instance may retain detached views or request sessions. Bind before metadata caches or query construction.

## Technical transport and tests

Server metadata actions and selector-state actions use existing `Action`, resolved request type, route registry and
response helpers. Publish additive routes through owning configuration; return serialisable descriptions/state only.
Keep class identities server-side. Authorisation and mandatory list scope apply equally to projected reloads and
previews.
The implementation card records final route names and fixture URLs before its browser gate.

All promises define stale/disposal handling above; aborting an HTTP request does not promise cancelling an already
executing database query. Rendering and persistence check generation tokens regardless of abort success.
The generic demo covers omitted optional ports, absent provider, rejected/duplicate confirmations, storage errors,
late metadata and disposal. Integration covers actual routes/session, server permission filtering and dynamic
activation.
See [VALIDATION.md](VALIDATION.md) for exhaustive requirement and scenario coverage.

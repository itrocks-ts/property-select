[![npm version](https://img.shields.io/npm/v/@itrocks/property-select?logo=npm)](https://www.npmjs.org/package/@itrocks/property-select)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/property-select)](https://www.npmjs.org/package/@itrocks/property-select)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/property-select?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/property-select)
[![issues](https://img.shields.io/github/issues/itrocks-ts/property-select)](https://github.com/itrocks-ts/property-select/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# property-select

Interactive property selection through business object relationships.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
The development of this package was also entrusted to an artificial intelligence, based on a detailed feature design.
The generated code does not yet meet the [it.rocks](https://it.rocks) goals of keeping code as clean and optimised as
possible and following the KISS principle. The documentation has not yet been fully reviewed by a human.
If anything seems unclear or incomplete, please feel free to contact the author of this package.*

The selector lets users browse related objects from a business root and search for properties by name or label.
Users can select a field or a related object itself, identified by its full path, such as `customer.address.city`.
Host components receive selection and drag intentions and decide how to use the chosen property.

The public controller runs without it.rocks, a DOM view or a table. It loads metadata lazily, remembers navigation,
emits selection/transport intentions and exports instance state. The browser view provides a single property list and
remembered breadcrumbs and bounded descendant search. An optional session store restores the same navigation model.

## Standalone use

Import from `@itrocks/property-select` in Node.js or `@itrocks/property-select/property-select.js` in a browser.
Both expose the same controller and `normalisePath`. The browser entry has no activation side effect.

```ts
import { PropertySelect } from '@itrocks/property-select/property-select.js'

const name = { kind: 'terminal' as const, label: 'Name', name: 'name', order: 0, path: 'name' }
const selector = new PropertySelect({
	metadata: {
		async context()
		{
			return { label: 'Contact', path: '', properties: [name], type: 'Contact' }
		},
		async resolve(root, path)
		{
			if (path !== 'name')
				throw new Error('Unknown property')
			return name
		}
	},
	root: 'contact',
	stateMode: 'instance'
})
const unsubscribe = selector.subscribe(event => {
	if (event.type === 'select')
		console.log(event.intent.path)
})
await selector.mount()
await selector.select(['name']) // Logs "name"; no consumer means no automatic addition.
unsubscribe()
selector.dispose()
```

The provider implements `MetadataProvider.context(root, path, signal?)` and `resolve(root, path, signal?)`.
It supplies full root-relative paths, stable business order, authorised relation facts and no business records.
`resolve(root, '')` returns an `ObjectContext`; other resolutions return a `PropertyDescription`.
A missing provider throws a configuration error. Provider failures emit an `error` event and retain the last context.
Navigation, search, suggestions and selection reuse loaded contexts, including their property descriptions.
Unchanged configuration and scroll positions do not trigger work; mounting does not write session state.
Cached contexts belong to one root and one authorised provider catalogue snapshot per instance; recreate the
controller when that catalogue changes. Labels fall back to technical names. Equal orders use path as a tie-breaker.

## Browser view

Load `@itrocks/property-select/front/property-select.css` through the host stylesheet mechanism, then create a view:

```ts
import { PropertySelectView } from '@itrocks/property-select/front/property-select.js'

const view = new PropertySelectView(document.querySelector<HTMLElement>('#selector')!, {
	metadata, // The MetadataProvider from the standalone example.
	root: 'contact',
	stateMode: 'instance'
})
await view.mount()
// Observe intentions through view.selector.subscribe(...).
// When the host removes this view:
view.dispose()
```

`PropertySelectView(host: HTMLElement, options: PropertySelectOptions)` owns its `selector: PropertySelect` and appends
one semantic section to the host. `mount(): Promise<boolean>` fetches the adjacent public `property-select.html`
template and mounts the controller. Serve the JS, HTML and CSS at their published relative paths with the correct MIME
types. Repeated mounts share the same promise; failed template loading rejects and disposes the view.
Metadata errors return false and remain observable through `selector`; the host can retry with `selector.mount()`.
`dispose(): void` is idempotent, aborts pending work, removes the owned section and releases its listeners/references.
Create a new view after disposal. No import activates the DOM or registers a global instance.

Clicking a field or relation name, its checkbox or the surrounding checkbox cell toggles the selection. A checkbox in the first cell reflects whether the full path
is used; checking or unchecking requests addition or removal. Used rows have a subtle green background.
A target button on used rows locates the existing column through an addition-only intention without toggling it.
A separate chevron on the right opens a relation. It appears on row hover or keyboard focus and stays visible
on touch devices. All action areas share the light `.action` hover colour. Each parent segment and the right-hand chevron highlights
independently; the final name highlights only its remaining area. The host confirms usage through `usedPaths`.
Native buttons support Enter, Space, Tab and visible focus. The horizontally scrollable breadcrumb separates levels with chevrons and retains remembered
descendants and marks the current object with `aria-current`, bold text and an underline.

The optional third `PropertySelectView` argument is `PropertySelectViewOptions`, with `template?: string` and
`templateUrl?: string | URL`. A supplied template is mounted directly without a fetch.
Hosts that serve HTML through an action can provide its URL; omission fetches the adjacent published template.
Static labels and accessibility attributes come from the template; serve a localised template when needed.
Recoverable consumer errors display their message as text, allowing hosts to explain an unsupported selection.

## Navigation and state

`normalisePath(path: string | readonly string[]): string` preserves identifiers and joins segments with dots.
An empty string or array denotes the root. Empty, dotted or whitespace-containing segments are rejected.

`mount()` and `navigate(path)` return `Promise<boolean>`: true after the context is committed, false on a reported
provider error or superseded request. Navigate through relations only. `activate(path)` navigates a displayed relation
or selects a displayed terminal. `select(path, action?)` selects either kind without changing navigation or query.
Pass `'add'` to request addition only; the consumer must reveal an existing item rather than toggle it.
Root is navigable and cannot be selected or transported.
Invalid configuration/path syntax throws.
`context`, `path` and `status` expose the current object and lifecycle:
`idle`, `loading`, `ready`, `error` or `disposed`.
`branchContexts` exposes the loaded contexts from the root through the remembered branch, including descendants of
the current object, so a reopened view can recover every breadcrumb label.
A context failure preserves the preceding object, branch and current depth. Late responses cannot replace newer work.

`snapshot(): SelectorState` returns a detached, JSON-serialisable version-1 state: remembered `branch`, `current` depth,
`query`, confirmed `recent` destinations and `scroll`. Navigation to a remembered ancestor keeps all descendants;
divergence replaces the suffix. `setQuery(text)` and `setScroll(viewKey, { left, top })` update local state.
`stateMode` defaults to `instance`, retaining state for the mounted instance. Use `stateMode: 'session'` with a
`stateKey` supplied by the host and a `stateStore` implementing the exported `StateStore` port to restore after reload.
`mount()` reads and validates persisted branch/current/query/recents/scroll. Invalid relations truncate the remembered
branch; unknown versions reset. `refresh()` invalidates cached metadata, revalidates the branch and rebuilds
suggestions.
`flushState()` waits for durable writes and retries a failed pending snapshot. `persistenceError` exposes recoverable
storage failure. Per-instance writes coalesce; revision conflicts reread and reapply the newest local snapshot.
`StateConflictError` identifies a compare-and-set conflict; removals retain revision tombstones.
`validateSelectorState(value)` returns a bounded detached state or undefined. Transient intentions/results are excluded.

`usedPaths` and `advice` default to empty arrays. `setConfiguration({ advice?, usedPaths? })` updates them without
clearing local recents. `translate(text)` defaults to identity or calls the supplied translation function.
`usedProperties` exposes a detached list of `UsedProperty` descriptions for configured nested columns, with translated
full labels. Each description includes `segments`, ordered from the first relation through the final property, with
its translated label and full path.
The browser appends these highlighted columns after the direct properties at the root, alphabetically by those labels.
Intermediate path segments include their following chevron and space in one navigation target;
they open the chosen object without selecting a property; the final name and checkbox keep
their usual actions. Used columns are excluded from search results and nested object views; unknown paths are omitted.
Removing a used path leaves its root row unhighlighted for immediate reselection. These temporary rows belong only
to the current view and disappear on refresh, search, relation navigation or disposal; they are never persisted.
`suggestions` exposes `{ path, label }` destinations, ordered by confirmed recents, maximal used contexts per branch,
then advice. Full paths deduplicate entries; translated metadata labels distinguish equal names by ancestry.
`suggestionLimit` defaults to six (1–100).
`shortcut(path)` replaces the complete branch and clears the query. Configuration changes preserve session recents.
The view displays the fused destinations, saves breadcrumb/property scroll and offers Retry after persistence failures.
Persistence errors show the adapter's recovery message as text, with a generic fallback for unknown or empty errors.
They remain separate from operation errors, which survive scrolling, state saves and storage Retry.

## Descendant search

`setQuery(text)` searches metadata below the current object. Every word must match a fragment of a technical name,
label or full path; case, accents and repeated spaces are normalised. Records are never read. Navigation preserves
and reruns the query from the destination. Selection preserves query/context, and the browser Clear button restores
ordinary neighbouring properties immediately.

`search: SearchSnapshot` exposes detached `results`, `status`, `visited`, `limited` and `errors`.
Statuses distinguish `idle`, `loading`, `complete`, `empty`, `limited` and `error`; zero results under a limit are
never reported as definitive absence. Partial results survive recoverable metadata errors. Change the query to retry.
`SearchResult` holds `property`, relative `depth` and root-to-parent `segments` with real paths and labels.
`activate(path)` accepts displayed results as well as ordinary properties; relation/segment navigation keeps valid
remembered prefixes and replaces divergent suffixes. Root segments navigate only.

The optional `search: SearchOptions` constructor option tunes `maxDepth` (default 6, local context is depth 0),
`maxContexts` (500, including the current object), `maxResults` (100) and `maxPending` (4).
Budgets are safe integers; only depth may be zero. Breadth-first scheduling and final ranking do not depend on response
arrival. Rank uses relative depth, number of words matching the final name/label, business order and full path.
The browser retains focused result nodes while enriching; a focused result displaced by the display budget remains
available within that budget until focus leaves, when the final ranking applies. Input and scroll are preserved.

Relation history is branch-local and includes the incoming navigation path. A reciprocal known inverse may return
once after a many-to-one or many-to-many edge; one-to-many, unknown or asymmetric inverse returns are excluded.
Unannotated reverse pairs and repeated unannotated canonical edges stop conservatively. Sibling paths and distinct
self relations remain independent. These restrictions bound automatic exploration; manual navigation stays available.
One authorised instance cache serves navigation and search. Query/context changes and disposal abort obsolete work;
generation checks discard late responses even when providers ignore cancellation. No global root expansion occurs.

## Intentions and lifecycle

`subscribe(listener)` returns an unsubscribe function. Events are `change`, `error`, `select`, `begin`, `move`, `end`,
`cancel` and `outcome`; their payloads are described by exported `SelectorEvent` and `IntentionEvent`.
Changes are observable before asynchronous metadata completes. Unsubscribe/dispose releases listeners.

Provide an optional `ConsumerPort` to apply intentions in another application. `select(intent, signal)` and
`end(id, sample)` return `Promise<Outcome>` after the host commits its operation. Intentions carry an opaque unique
`id`, the fixed `root` and canonical `path`; they carry no column or insertion position. Outcomes distinguish `added`,
`existing`, `removed`, `moved`, `cancelled` and `rejected`. Only `added` updates recent destinations. Rejections emit a
recoverable error. Without a consumer, events remain observable; a host may call `acknowledge(outcome)` explicitly.
Mismatched, premature, duplicate and disposed acknowledgements return false and never apply.

`begin(path, sample, signal?)` returns the recognised `SelectionIntent`, `move(id, sample)` forwards movement and
`end(id, sample)` completes the transport. `cancel(id, reason?)` terminates it once. These methods form the generic
transport contract; surface gesture recognition and pointer capture are supplied by the rendered component.
`PointerSample` contains pointer id/type and client coordinates. Only one live transport is accepted per instance.
`select`/`end` resolve with an accepted outcome or undefined when unconfirmed, stale or failed.
`dispose()` is idempotent: it aborts pending metadata/selection requests, cancels an active transport, discards late
acknowledgements and releases subscriptions. Cancellation is advisory; generation checks remain authoritative.

The remaining exported aliases are `Cardinality`, `InteractionId`, `PropertyPath`, `RootId` and `TypeId`.
The shared metadata, selection, consumer, outcome, pointer and state interfaces are exported from both entries.
Their structural payloads are available in the published TypeScript declarations.

## Licence

Copyright (C) 2026, Baptiste Pillot <baptiste@pillot.fr>.

This package is licensed under the GNU Lesser General Public License, version 3 or any later version
(`LGPL-3.0-or-later`). See [LICENSE](LICENSE) for the LGPL terms and [COPYING](COPYING) for the incorporated GPL terms.

## Source gestures

The rendered view recognises a primary mouse/pen movement of 10 pixels from property names, breadcrumb relations and
search-result relation segments. It transports their fixed full path through the generic consumer port. The root,
shortcuts and checkbox controls do not start transport. A recognised drag suppresses its compatibility click. No column,
thumbnail or insertion indicator is rendered by the selector. Target decisions belong to the consumer.

Pointer capture belongs to the document element so replacing source rows or folding a containing pane preserves the
controller. Pointer cancellation, lost capture, Escape, window blur and disposal cancel the operation once. An optional
abort signal on `begin` also cancels pending metadata resolution, preventing a late begin after the pointer is released.
Target decisions and rollback belong to the consumer. Touch uses the same controller, with no hold timer: after
10 pixels, horizontal movement must dominate vertical movement by at least 1.5 and start within 96 CSS pixels of the
selector's left edge. Otherwise the gesture remains native until release. Recognition stays locked through diagonals.
These are technical recognition constants, not user preferences.

Property names and result path segments declare `touch-action: pan-y pinch-zoom` before contact. Vertical scrolling
and pinch zoom remain native; a second contact abandons pending or active transport. The horizontally scrollable
breadcrumb keeps native touch navigation and mouse/pen transport. Touch users can transport the same object through
its relation row or result segment. Relation controls remain visible on devices with any coarse pointer.
A new primary contact resets residual-click suppression, including contacts outside the selector.

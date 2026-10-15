[![npm version](https://img.shields.io/npm/v/@itrocks/property-select?logo=npm)](https://www.npmjs.org/package/@itrocks/property-select)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/property-select)](https://www.npmjs.org/package/@itrocks/property-select)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/property-select?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/property-select)
[![issues](https://img.shields.io/github/issues/itrocks-ts/property-select)](https://github.com/itrocks-ts/property-select/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# property-select

Interactive property selection through business object relationships.

The selector lets users browse related objects from a business root and search for properties by name or label.
Users can select a field or a related object itself, identified by its full path, such as `customer.address.city`.
Host components receive selection and drag intentions and decide how to use the chosen property.

The public controller runs without it.rocks, a DOM view or a table. It loads metadata lazily, remembers navigation,
emits selection/transport intentions and exports instance state. The browser view provides a single property list and
remembered breadcrumbs. Search, session persistence and framework adapters belong to subsequent deliveries.

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

The main button selects a field or opens a relation; its adjacent `+` selects either path without navigating.
Desktop hover or keyboard focus reveals the reserved `+`; without hover only relation buttons show it.
Native buttons support Enter, Space, Tab and visible focus. The horizontally scrollable breadcrumb retains remembered
descendants and marks the current object with `aria-current`, bold text and an underline.
Search, shortcuts and recognised drag gestures remain separate deliveries.

## Navigation and state

`normalisePath(path: string | readonly string[]): string` preserves identifiers and joins segments with dots.
An empty string or array denotes the root. Empty, dotted or whitespace-containing segments are rejected.

`mount()` and `navigate(path)` return `Promise<boolean>`: true after the context is committed, false on a reported
provider error or superseded request. Navigate through relations only. `activate(path)` navigates a displayed relation
or selects a displayed terminal. `select(path)` selects either kind without changing navigation or query.
Root is navigable and cannot be selected or transported.
Invalid configuration/path syntax throws.
`context`, `path` and `status` expose the current object and lifecycle:
`idle`, `loading`, `ready`, `error` or `disposed`.
A context failure preserves the preceding object, branch and current depth. Late responses cannot replace newer work.

`snapshot(): SelectorState` returns a detached, JSON-serialisable version-1 state: remembered `branch`, `current` depth,
`query`, confirmed `recent` destinations and `scroll`. Navigation to a remembered ancestor keeps all descendants;
divergence replaces the suffix. `setQuery(text)` and `setScroll(viewKey, { left, top })` update local state.
`stateMode` defaults to `instance`; this is mounted-instance state only. Session mode is explicitly rejected.
`StateStore`, `StateRecord` and `SelectorState` define the neutral persistence contract for host adapters; this delivery
does not read, write or restore sessions.

`usedPaths` and `advice` default to empty arrays. `setConfiguration({ advice?, usedPaths? })` updates them without
clearing local recents. `translate(text)` defaults to identity or calls the supplied translation function.
Suggestion fusion and search execution are separate deliveries.

## Intentions and lifecycle

`subscribe(listener)` returns an unsubscribe function. Events are `change`, `error`, `select`, `begin`, `move`, `end`,
`cancel` and `outcome`; their payloads are described by exported `SelectorEvent` and `IntentionEvent`.
Changes are observable before asynchronous metadata completes. Unsubscribe/dispose releases listeners.

Provide an optional `ConsumerPort` to apply intentions in another application. `select(intent, signal)` and
`end(id, sample)` return `Promise<Outcome>` after the host commits its operation. Intentions carry an opaque unique
`id`, the fixed `root` and canonical `path`; they carry no column or insertion position. Outcomes distinguish `added`,
`existing`, `moved`, `cancelled` and `rejected`. Only `added` updates recent destinations. Rejections emit a recoverable
error. Without a consumer, events remain observable; a host may call `acknowledge(outcome)` explicitly.
Mismatched, premature, duplicate and disposed acknowledgements return false and never apply.

`begin(path, sample)` returns the recognised `SelectionIntent`, `move(id, sample)` forwards movement and
`end(id, sample)` completes the transport. `cancel(id, reason?)` terminates it once. These methods form the generic
transport contract; surface gesture recognition and pointer capture are supplied by the rendered component.
`PointerSample` contains pointer id/type and client coordinates. Only one live transport is accepted per instance.
`select`/`end` resolve with an accepted outcome or undefined when unconfirmed, stale or failed.
`dispose()` is idempotent: it aborts pending metadata/selection requests, cancels an active transport, discards late
acknowledgements and releases subscriptions. Cancellation is advisory; generation checks remain authoritative.

The remaining exported aliases are `Cardinality`, `InteractionId`, `PropertyPath`, `RootId` and `TypeId`.
The shared metadata, selection, consumer, outcome, pointer and state interfaces are exported from both entries.
See the [architecture contracts](docs/orchestration/CONTRACTS.md) for their structural payloads.

## Build and verification

With the compiler and preparation utility already available, `npm run build` creates CJS in `cjs/` and browser ESM
and declarations at the package root. Generated files are ignored. `npm test` rebuilds, checks public TypeScript
imports and runs the Node contract suite. The reusable `test/fixtures/static-graph.mjs` and non-table
recording consumer are test resources, outside the published runtime.
The separate `test/browser-ui.mjs` drives the standalone demo through real mouse, keyboard and emulated touch input;
its author evidence and ownership-checked launch recipe are in
[the L2-UI report](docs/orchestration/reports/L2-UI.md).
The separate `test/browser-smoke.mjs` imports the actual public entry in sandboxed Chromium; set
`PS_PLAYWRIGHT_MODULE` to an existing Playwright module. It starts and closes its own ephemeral localhost server.

Read the [functional specifications](docs/it-rocks-selecteur-relationnel-specifications.md), written in French.
They cover navigation, search, suggestions, session state, desktop and touch interactions,
and the first integration with table column selection.
The [orchestration prompt](docs/itrocks-property-select-prompt-orchestrateur.md) describes the preparation and execution
workflow in French.
The [dependency and integration contracts](docs/dependencies.md), also in French, define the package boundaries,
framework bindings and standalone use required by the development plan.
The [validation and autonomous delivery protocol](docs/validation.md), also in French, requires progressive browser
checks, independent verification and correction tasks before delivery.
The [data selection contract](docs/select.md) specifies the storage and SQL work required for related columns.

## Licence

Copyright (C) 2026, Baptiste Pillot <baptiste@pillot.fr>.

This package is licensed under the GNU Lesser General Public License, version 3 or any later version
(`LGPL-3.0-or-later`). See [LICENSE](LICENSE) for the LGPL terms and [COPYING](COPYING) for the incorporated GPL terms.

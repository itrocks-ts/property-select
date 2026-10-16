import { PropertySelect }        from '@itrocks/property-select'
import type { ConsumerPort }     from '@itrocks/property-select'
import type { MetadataProvider } from '@itrocks/property-select'
import type { SearchOptions }    from '@itrocks/property-select'
import type { SearchSnapshot }   from '@itrocks/property-select'
import type { SelectorState }    from '@itrocks/property-select'
import type { StateStore }       from '@itrocks/property-select'
import { PropertySelectView }    from '@itrocks/property-select/front/property-select.js'
import { normalisePath }         from '@itrocks/property-select/property-select.js'
import type { SearchResult }     from '@itrocks/property-select/property-select.js'

declare const consumer: ConsumerPort
declare const host: HTMLElement
declare const metadata: MetadataProvider
declare const store: StateStore

const selector = new PropertySelect({ consumer, metadata, root: 'invoice', stateMode: 'instance' })
const state: SelectorState = selector.snapshot()
void normalisePath(['customer', 'address'])
void store.write('opaque', state, 0)
selector.subscribe(event => {
	if (event.type === 'select')
		void event.intent.path
})

const view = new PropertySelectView(host, { metadata, root: 'invoice' })
void view.mount()
void view.selector.snapshot()
view.dispose()

const budgets: SearchOptions = { maxContexts: 500, maxDepth: 6, maxPending: 4, maxResults: 100 }
const searching = new PropertySelect({ metadata, root: 'invoice', search: budgets })
const searchState: SearchSnapshot = searching.search
const results: readonly SearchResult[] = searchState.results
void results

import { PropertySelectView } from '/assets/front/property-select.js'
import { graphProvider, largeGraph, searchGraph } from '/search-graph.js'

const parameters = new URLSearchParams(location.search)
const graph = parameters.has('focusLimit') ? {
	Invoice: [['slow', 'Slow'], ['fast', 'Fast']], Fast: [['name']], Slow: [['name']]
} : parameters.has('large') ? largeGraph(120) : searchGraph
const reverse = parameters.has('reverse')
const metadata = graphProvider(graph, async path => {
	const delay = path === 'fast' ? 180
		: path === 'customer' ? reverse ? 20 : 180 : path === 'tags' ? reverse ? 180 : 20 : 20
	await new Promise(resolve => setTimeout(resolve, delay))
	if (parameters.has('error') && path === 'customer')
		throw new Error('Synthetic metadata failure')
})
const options = parameters.has('focusLimit') ? { maxResults: 1 } : parameters.has('large') ? { maxContexts: 25, maxResults: 8 } : { maxDepth: 4 }
const view = new PropertySelectView(document.querySelector('#selector'), {
	metadata, root: 'invoice', search: options
})
view.selector.subscribe(event => {
	if (event.type === 'select') {
		const row = document.createElement('li')
		row.textContent = event.intent.path
		document.querySelector('#intentions').append(row)
	}
})
// Read-only observations for browser assertions; all feature actions use real browser input.
window.searchFixture = {
	get calls() { return metadata.calls.map(call => ({ path: call.path, aborted: !!call.signal?.aborted })) },
	get peak() { return metadata.peak },
	get search() { return view.selector.search },
	get state() { return view.selector.snapshot() }
}
void view.mount()

import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { after } from 'node:test'
import test from 'node:test'
import { PropertySelect } from '@itrocks/property-select'
import { graphProvider, largeGraph, searchGraph } from './fixtures/search-graph.mjs'

const proofs = []
after(async () => {
	if (process.env.PS_SEARCH_TEST_EVIDENCE)
		await writeFile(process.env.PS_SEARCH_TEST_EVIDENCE, JSON.stringify(proofs, null, '\t') + '\n')
})

function record(name, selector, metadata)
{
	proofs.push({ name, result: selector.search, path: selector.path, state: selector.snapshot(),
		calls: metadata?.calls.map(call => ({ path: call.path, aborted: !!call.signal?.aborted })) })
}

async function settled(selector)
{
	if (selector.search.status === 'loading')
		await new Promise((resolve, reject) => {
			const timer = setTimeout(() => { off(); reject(new Error('Search did not settle')) }, 3000)
			const off = selector.subscribe(() => {
				if (selector.search.status !== 'loading') {
					clearTimeout(timer)
					off()
					resolve()
				}
			})
		})
	return selector.search
}

function paths(selector)
{
	return selector.search.results.map(result => result.property.path)
}

async function mounted(metadata = graphProvider(), search)
{
	const selector = new PropertySelect({ metadata, root: 'invoice', search })
	await selector.mount()
	return selector
}

test('T09: all words normalise case/accents/spacing and match full labelled paths', async () => {
	const selector = await mounted()
	selector.setQuery(' CÔDE   pAyS CLIENT ')
	await settled(selector)
	assert.ok(paths(selector).includes('customer.address.country.code'))
	assert.ok(paths(selector).includes('customer.billingAddress.city.country.code'))
	assert.ok(paths(selector).every(path => path.includes('customer.') && path.endsWith('.code')))
	const result = selector.search.results.find(result => result.property.path === 'customer.address.country.code')
	assert.deepEqual(result.segments.map(segment => segment.path), ['', 'customer', 'customer.address',
		'customer.address.country'])
	selector.setQuery('client pays')
	await settled(selector)
	assert.ok(selector.search.results.some(result => result.property.kind === 'relation'))
	selector.setQuery('client absentword')
	assert.equal((await settled(selector)).results.length, 0)
	selector.dispose()
})

test('T10: descendants only, navigation preserves the query and cache avoids reloading ancestors', async () => {
	const metadata = graphProvider()
	const selector = await mounted(metadata)
	await selector.navigate('customer.address')
	const before = metadata.calls.length
	selector.setQuery('code')
	await settled(selector)
	assert.ok(paths(selector).length)
	assert.ok(paths(selector).every(path => path.startsWith('customer.address.')))
	assert.ok(metadata.calls.slice(before).every(call => call.path.startsWith('customer.address.')))
	const after = metadata.calls.length
	selector.setQuery('name')
	await settled(selector)
	assert.equal(metadata.calls.length, after)
	record('T10 descendant scope/cache with no ancestor requests', selector, metadata)
	await selector.navigate('')
	await settled(selector)
	assert.equal(selector.snapshot().query, 'name')
	assert.ok(paths(selector).includes('customer.name'))
	selector.dispose()
})

test('T11/NAV-08: distinct paths, terminal/object activation and remembered prefixes', async () => {
	const selector = await mounted()
	selector.setQuery('country')
	await settled(selector)
	assert.ok(paths(selector).includes('customer.address.country'))
	assert.ok(paths(selector).includes('customer.billingAddress.country'))
	await selector.activate('customer.address.country')
	await settled(selector)
	assert.equal(selector.path, 'customer.address.country')
	await selector.navigate('customer')
	await settled(selector)
	assert.deepEqual(selector.snapshot().branch, ['customer', 'address', 'country'])
	await selector.navigate('customer.billingAddress')
	await settled(selector)
	assert.deepEqual(selector.snapshot().branch, ['customer', 'billingAddress'])
	selector.setQuery('code')
	await settled(selector)
	const events = []
	selector.subscribe(event => { if (event.type === 'select') events.push(event.intent.path) })
	await selector.activate('customer.billingAddress.country.code')
	assert.deepEqual(events, ['customer.billingAddress.country.code'])
	assert.equal(selector.path, 'customer.billingAddress')
	assert.equal(selector.snapshot().query, 'code')
	selector.setQuery('')
	assert.equal(selector.search.status, 'idle')
	selector.dispose()
})

test('T12/PORT-03: obsolete queries and context ignore late abort-insensitive responses', async () => {
	const gates = []
	const metadata = graphProvider(searchGraph, path => path === 'customer'
		? new Promise(resolve => gates.push(resolve)) : Promise.resolve())
	const selector = await mounted(metadata, { maxDepth: 1 })
	selector.setQuery('code')
	await new Promise(resolve => setImmediate(resolve))
	assert.equal(selector.search.status, 'loading')
	assert.equal(gates.length, 1)
	selector.setQuery('number')
	await new Promise(resolve => setImmediate(resolve))
	assert.equal(gates.length, 2)
	gates[1]()
	await settled(selector)
	const expected = selector.search
	gates[0]()
	await new Promise(resolve => setImmediate(resolve))
	assert.deepEqual(selector.search, expected)
	assert.ok(metadata.calls.find(call => call.path === 'customer').signal.aborted)
	selector.setQuery('code')
	await selector.navigate('lines')
	await settled(selector)
	assert.equal(selector.path, 'lines')
	assert.equal(paths(selector).some(path => path.startsWith('customer')), false)
	selector.dispose()
	assert.equal(selector.search.status, 'idle')
})

test('T12: loading, empty, complete, error and limited are distinct; errors preserve usable context', async () => {
	const selector = await mounted(graphProvider({ Invoice: [['name']] }))
	selector.setQuery('missing')
	assert.equal((await settled(selector)).status, 'empty')
	selector.setQuery('name')
	assert.equal((await settled(selector)).status, 'complete')
	selector.dispose()
	const failing = await mounted(graphProvider(searchGraph, async path => {
		if (path === 'customer') throw new Error('Synthetic network error')
	}), { maxDepth: 1 })
	failing.setQuery('name')
	assert.equal((await settled(failing)).status, 'error')
	assert.ok(failing.search.errors.includes('Synthetic network error'))
	assert.equal(failing.path, '')
	await failing.navigate('lines')
	assert.equal(failing.path, 'lines')
	failing.dispose()
	const limited = await mounted(graphProvider(), { maxDepth: 0 })
	limited.setQuery('absent')
	assert.equal((await settled(limited)).status, 'limited')
	assert.equal(limited.search.results.length, 0)
	limited.dispose()
})

test('T13: known N-1/N-N return once, 1-N/unknown/asymmetric inverse excluded; manual navigation remains', async () => {
	for (const [outgoing, back, expected] of [
		['many-to-one', 'one-to-many', true], ['many-to-many', 'many-to-many', true],
		['one-to-many', 'many-to-one', false], ['unknown', 'one-to-many', false],
		['many-to-one', 'unknown', false]
	]) {
		const graph = {
			Invoice: [['away', 'Other', outgoing, 'away', 'back'], ['name']],
			Other: [['back', 'Invoice', back, 'back', 'away'], ['name']]
		}
		const metadata = graphProvider(graph)
		const selector = await mounted(metadata)
		selector.setQuery('name')
		await settled(selector)
		assert.equal(paths(selector).includes('away.back.name'), expected, `${outgoing}/${back}`)
		assert.equal(metadata.calls.some(call => call.path === 'away.back.away'), false)
		record(`T13 ${outgoing}/${back}: expected return ${expected}`, selector, metadata)
		await selector.navigate('away.back')
		assert.equal(selector.path, 'away.back')
		selector.dispose()
	}
	for (const inverse of [undefined, 'wrong']) {
		const graph = {
			Invoice: [['away', 'Other', 'many-to-one', 'away', 'back']],
			Other: [['back', 'Invoice', 'one-to-many', 'back', inverse], ['name']]
		}
		const metadata = graphProvider(graph)
		const selector = await mounted(metadata)
		selector.setQuery('name')
		await settled(selector)
		assert.equal(metadata.calls.some(call => call.path === 'away.back'), false)
		record(`T13 uncertain/asymmetric inverse ${inverse}`, selector, metadata)
		selector.dispose()
	}
})

test('T13: incoming edges, sibling paths and distinct self relations', async () => {
	const metadata = graphProvider({
		Invoice: [['children', 'Child', 'one-to-many', 'children', 'owner']],
		Child: [['owner', 'Invoice', 'many-to-one', 'owner', 'children'], ['name']]
	})
	const selector = await mounted(metadata)
	await selector.navigate('children')
	selector.setQuery('name')
	await settled(selector)
	assert.equal(metadata.calls.some(call => call.path === 'children.owner'), false)
	record('T13 incoming one-to-many branch history', selector, metadata)
	selector.dispose()
	const twins = await mounted(graphProvider({
		Invoice: [['first', 'Other'], ['second', 'Other']],
		Other: [['other', 'Other', 'unknown'], ['name']]
	}))
	twins.setQuery('name')
	await settled(twins)
	assert.ok(paths(twins).includes('first.name'))
	assert.ok(paths(twins).includes('second.name'))
	assert.ok(paths(twins).includes('first.other.name'))
	assert.ok(paths(twins).includes('second.other.name'))
	assert.equal(paths(twins).some(path => path.includes('other.other.')), false)
	twins.dispose()
})

test('PORT-06: reversed provider arrivals preserve rank; local depth/name/business/path tie-breaking', async () => {
	const graph = {
		Invoice: [['name'], ['b', 'Other'], ['a', 'Other']],
		Other: [['label'], ['name']]
	}
	const run = async reverse => {
		const metadata = graphProvider(graph, path => new Promise(resolve => setTimeout(resolve,
			path === 'a' ? reverse ? 1 : 15 : path === 'b' ? reverse ? 15 : 1 : 0)))
		const selector = await mounted(metadata)
		selector.setQuery('name')
		await settled(selector)
		const actual = paths(selector)
		assert.ok(metadata.peak <= 4)
		selector.dispose()
		return actual
	}
	assert.deepEqual(await run(false), await run(true))
	assert.deepEqual(await run(false), ['name', 'a.name', 'b.name'])
	const strength = await mounted(graphProvider({ Invoice: [['nameGroup', 'Other']], Other: [['label'], ['name']] }))
	strength.setQuery('name')
	await settled(strength)
	assert.deepEqual(paths(strength), ['nameGroup', 'nameGroup.name', 'nameGroup.label'])
	strength.dispose()
})

test('T12/T26: large cyclic catalogue is bounded by contexts/depth/results and pending providers', async () => {
	const metadata = graphProvider(largeGraph(), () => new Promise(resolve => setTimeout(resolve, 1)))
	const selector = await mounted(metadata, { maxContexts: 19, maxDepth: 6, maxPending: 4, maxResults: 7 })
	selector.setQuery('name')
	const result = await settled(selector)
	assert.equal(result.status, 'limited')
	assert.equal(result.visited, 19)
	assert.equal(result.results.length, 7)
	assert.equal(metadata.calls.length, 19)
	assert.ok(metadata.peak <= 4)
	assert.ok(new Set(paths(selector)).size === 7)
	record('T12/T26 large cyclic bounded provider trace', selector, metadata)
	selector.dispose()
	for (const search of [{ maxDepth: -1 }, { maxPending: 0 }, { maxContexts: 1.5 }, { maxResults: NaN }])
		assert.throws(() => new PropertySelect({ metadata, root: 'invoice', search }), /budget/)
})


test('T12: context replacement and disposal reject late search metadata', async () => {
	const gates = []
	const metadata = graphProvider(searchGraph, path => path === 'customer'
		? new Promise(resolve => gates.push(resolve)) : Promise.resolve())
	const selector = await mounted(metadata)
	selector.setQuery('name')
	await new Promise(resolve => setImmediate(resolve))
	assert.equal(gates.length, 1)
	await selector.navigate('lines')
	await settled(selector)
	const expected = selector.search
	gates[0]()
	await new Promise(resolve => setImmediate(resolve))
	assert.deepEqual(selector.search, expected)
	assert.equal(selector.path, 'lines')
	await selector.navigate('')
	await new Promise(resolve => setImmediate(resolve))
	assert.equal(gates.length, 2)
	assert.equal(selector.search.status, 'loading')
	let events = 0
	selector.subscribe(() => events ++)
	selector.dispose()
	const before = events
	gates[1]()
	await new Promise(resolve => setImmediate(resolve))
	assert.equal(events, before)
	assert.equal(selector.search.status, 'idle')
	record('T12 delayed context and disposed generations', selector, metadata)
})

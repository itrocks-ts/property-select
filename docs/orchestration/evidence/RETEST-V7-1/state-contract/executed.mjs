import { PropertySelect } from '@itrocks/property-select'
import { StateConflictError } from '@itrocks/property-select'
import { FileStore } from '@itrocks/fastify-file-session-store'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { mkdtemp } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { staticProvider } from '../../../../test/fixtures/static-graph.mjs'
const observations = []
function check(name, actual, expected)
{
	observations.push({ name, actual, expected })
	assert.deepEqual(actual, expected, name)
}
const wait = async predicate => {
	for (let i = 0; i < 200; i ++) {
		if (predicate()) return
		await delay(10)
	}
	throw new Error('Unsettled independent contract observation')
}
let status = 'added'
const selector = new PropertySelect({ metadata: staticProvider(), root: 'invoice',
	usedPaths: ['customer.address.street', 'customer.address.city.country.code', 'lines.description', 'tags.name'],
	advice: ['customer.address', 'customer.billingAddress', 'customer.parent', 'customer', 'tags'],
	translate: label => `Business ${label}`,
	consumer: { async select(intent) { return { ...intent, status } }, begin() {}, move() {}, cancel() {},
		async end(intent) { return { ...intent, status } } } })
await selector.mount()
check('six default destinations', selector.suggestions.map(item => item.path),
	['customer.address.city.country', 'lines', 'tags', 'customer.address', 'customer.billingAddress', 'customer.parent'])
check('translated full technical fallback', selector.suggestions[0].label,
	'Business customer › Business address › Business city › Business country')
for (status of ['existing', 'moved', 'cancelled', 'rejected']) {
	await selector.select('customer.address.street')
	check(`${status} cannot create recent`, selector.snapshot().recent, [])
}
status = 'added'
await selector.select('customer.address')
check('object selection records itself', selector.snapshot().recent, ['customer.address'])
await selector.select('number')
check('root terminal creates no root recent', selector.snapshot().recent, ['customer.address'])
await selector.select('customer.name')
await wait(() => selector.suggestions[0]?.path === 'customer')
check('recent ancestor survives maximal branches', selector.suggestions.map(item => item.path).slice(0, 4),
	['customer', 'customer.address', 'customer.address.city.country', 'lines'])
selector.dispose()
let record = { revision: 0 }, release, blocked = false, conflict = false
const writes = []
const store = {
	async read() { return structuredClone(record) },
	async write(_key, state, revision) {
		writes.push(state.query)
		if (blocked) await new Promise(done => { release = done })
		if (conflict) {
			conflict = false
			record = { revision: record.revision + 1 }
			throw new StateConflictError()
		}
		assert.equal(revision, record.revision)
		record = { revision: revision + 1, state: structuredClone(state) }
		return structuredClone(record)
	}
}
const controller = new PropertySelect({ metadata: staticProvider(), root: 'invoice',
	stateMode: 'session', stateKey: 'opaque', stateStore: store })
await controller.mount()
await controller.flushState()
blocked = true
controller.setQuery('old')
await wait(() => !!release)
controller.setQuery('intermediate')
controller.setQuery('latest')
conflict = true
blocked = false
release()
await controller.flushState()
check('conflict retries latest local query', record.state.query, 'latest')
check('intermediate write coalesces', writes.includes('intermediate'), false)
check('persisted fields exclude transient data', Object.keys(record.state).sort(),
	['branch', 'current', 'query', 'recent', 'scroll', 'version'])
controller.dispose()
const root = await mkdtemp('/tmp/property-select-V4-stores-')
const left = new FileStore(root + '/left'), right = new FileStore(root + '/right')
const set = (store, value) => new Promise((yes, no) => store.set('same-synthetic-id', value,
	error => error ? no(error) : yes()))
const get = store => new Promise((yes, no) =>
	store.get('same-synthetic-id', (error, value) => error ? no(error) : yes(value)))
await set(left, { cookie: {}, propertySelect: { marker: 'left' } })
await set(right, { cookie: {}, propertySelect: { marker: 'right' } })
const loaded = await get(left)
loaded.propertySelect.marker = 'changed-left'
await set(left, loaded)
check('same id different stores isolate cache', (await get(right)).propertySelect.marker, 'right')
check('nested mutation is durably saved',
	(await get(new FileStore(root + '/left'))).propertySelect.marker, 'changed-left')
const output = process.env.PS_V4_OUTPUT || 'node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-V7-1/state-contract'
await mkdir(output, { recursive: true })
await writeFile(output + '/contracts.json',
	JSON.stringify({ status: 'PASS', observations }, null, 2) + '\n')
console.log(`PASS ${observations.length} independent contract assertions`)

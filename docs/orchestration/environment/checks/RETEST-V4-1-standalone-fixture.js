// Test-only StateStore and consumer; served by the independent browser driver at the fixture script URL.
import { PropertySelectView } from '/assets/front/property-select.js'
import { StateConflictError } from '/assets/property-select.js'
import { staticProvider } from '/catalogue.js'

const metadata = staticProvider()
const context = metadata.context.bind(metadata)
const host = document.querySelector('#selector')
const read = key => JSON.parse(sessionStorage.getItem(key) || 'null')
const save = (key, value) => sessionStorage.setItem(key, JSON.stringify(value))
metadata.context = async (...args) => {
	const result = await context(...args)
	if (read('invalid') && args[1].startsWith('customer.address')) throw new Error('Removed metadata')
	if (read('invalid') && args[1] === 'customer')
		result.properties = result.properties.filter(item => item.name !== 'address')
	return result
}
const controls = document.createElement('div')
for (const [id, label] of [['fold', 'Fold / reopen'], ['failure', 'Toggle storage failure'],
	['reject', 'Reject next choice'], ['expire', 'End fixture session']]) {
	const button = document.createElement('button')
	button.id = id
	button.textContent = label
	controls.append(button)
}
host.before(controls)
const output = document.createElement('output')
output.id = 'chosen'
host.after(output)
let failing = false
let reject = false
const chosen = new Set(read('chosen') || [])
const render = () => { output.textContent = JSON.stringify([...chosen]) }
render()
const configuration = () => read('configured')
	? { advice: ['customer.billingAddress'], usedPaths: ['customer.address.street'] }
	: { advice: ['customer.address', 'customer.billingAddress'],
		usedPaths: ['customer.name', 'customer.address.city.name', 'customer.billingAddress.country.code'] }
const view = new PropertySelectView(host, {
	...configuration(), metadata, root: 'invoice', stateMode: 'session', stateKey: 'selector', suggestionLimit: 3,
	stateStore: {
		async read(key) { return read(key) || { revision: 0 } },
		async write(key, state, expectedRevision) {
			if (failing) throw new Error('Synthetic standalone storage unavailable')
			const prior = read(key) || { revision: 0 }
			if (prior.revision !== expectedRevision) throw new StateConflictError()
			const next = { revision: expectedRevision + 1, state }
			save(key, next)
			return next
		}
	},
	consumer: {
		async select(intent) {
			const status = reject ? 'rejected' : chosen.has(intent.path) ? 'existing' : 'added'
			reject = false
			if (status === 'added') chosen.add(intent.path)
			save('chosen', [...chosen])
			render()
			return { ...intent, status, message: status === 'rejected' ? 'Synthetic rejected choice' : undefined }
		},
		begin() {}, cancel() {}, move() {}, async end() { throw new Error('No drag fixture') }
	}
})
document.querySelector('#configuration').addEventListener('click', () => {
	save('configured', true)
	view.selector.setConfiguration(configuration())
})
document.querySelector('#invalidate').addEventListener('click', () => {
	save('invalid', true)
	void view.selector.refresh()
})
document.querySelector('#fold').addEventListener('click', () => { host.hidden = !host.hidden })
document.querySelector('#failure').addEventListener('click', () => { failing = !failing })
document.querySelector('#reject').addEventListener('click', () => { reject = true })
document.querySelector('#expire').addEventListener('click', () => {
	sessionStorage.clear()
	location.reload()
})
await view.mount()

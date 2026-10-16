import { PropertySelectView } from '/assets/front/property-select.js'
import { staticProvider }     from './catalogue.js'

const metadata = staticProvider()
const context = metadata.context.bind(metadata)
let invalid = false
metadata.context = async (...args) => {
	const result = await context(...args)
	if (invalid && args[1].startsWith('customer.address')) throw new Error('Removed metadata')
	if (invalid && args[1] === 'customer') result.properties = result.properties.filter(item => item.name !== 'address')
	return result
}
const chosen = new Set()
const view = new PropertySelectView(document.querySelector('#selector'), {
	advice: ['customer.address', 'customer.billingAddress'], metadata, root: 'invoice',
	usedPaths: ['customer.name', 'customer.address.city.name', 'customer.billingAddress.country.code'],
	consumer: {
		async select(intent) {
			const status = chosen.has(intent.path) ? 'existing' : 'added'
			chosen.add(intent.path)
			return { ...intent, status }
		},
		begin() {}, cancel() {}, move() {}, async end() { throw new Error('No transport in this fixture') }
	}
})
document.querySelector('#configuration').addEventListener('click', () => view.selector.setConfiguration({
	advice: ['customer.billingAddress'], usedPaths: ['customer.address.street']
}))
document.querySelector('#invalidate').addEventListener('click', () => {
	invalid = true
	void view.selector.refresh()
})
await view.mount()

// Synthetic metadata only. No records, framework adapter or reflection runtime.
const graph = {
	Address: [['city', 'City'], ['country', 'Country'], ['street']],
	City: [['country', 'Country'], ['name']],
	Country: [['code'], ['name']],
	Customer: [['address', 'Address'], ['billingAddress', 'Address'], ['name'], ['parent', 'Customer']],
	Invoice: [['customer', 'Customer'], ['number']]
}
const labels = {
	address: 'Address', billingAddress: 'Billing address', city: 'City', code: 'Code', country: 'Country',
	customer: 'Customer', name: 'Name', number: 'Number', parent: 'Parent', street: 'Street'
}

export function staticProvider()
{
	return {
		async context(root, path, signal)
		{
			signal?.throwIfAborted()
			if (root !== 'invoice')
				throw new Error('Unknown root')
			let type = 'Invoice'
			for (const name of path ? path.split('.') : []) {
				const target = graph[type]?.find(property => property[0] === name)?.[1]
				if (!target)
					throw new Error('Unknown relation')
				type = target
			}
			return {
				label: type, path, type,
				properties: graph[type].map(([name, target], order) => ({
					kind: target ? 'relation' : 'terminal', label: labels[name], name, order,
					path: path ? `${path}.${name}` : name, target
				}))
			}
		},
		async resolve(root, path, signal)
		{
			if (!path)
				return this.context(root, '', signal)
			const parts = path.split('.')
			const context = await this.context(root, parts.slice(0, -1).join('.'), signal)
			const property = context.properties.find(property => property.path === path)
			if (!property)
				throw new Error('Unknown property')
			return property
		}
	}
}

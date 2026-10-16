// Synthetic authorised catalogue; no domain values or reflection runtime.
export const searchGraph = {
	Address: [
		['city', 'City', 'many-to-one', 'address.city', 'city.addresses', 'Ville'],
		['country', 'Country', 'many-to-one', undefined, undefined, 'Pays'],
		['street', undefined, undefined, undefined, undefined, 'Rue']
	],
	City: [
		['addresses', 'Address', 'one-to-many', 'city.addresses', 'address.city', 'Adresses'],
		['country', 'Country', 'many-to-one', undefined, undefined, 'Pays'],
		['name', undefined, undefined, undefined, undefined, 'Nom']
	],
	Country: [['code', undefined, undefined, undefined, undefined, 'Côde'], ['name']],
	Customer: [
		['address', 'Address', 'many-to-one', undefined, undefined, 'Adresse'],
		['billingAddress', 'Address', 'many-to-one', undefined, undefined, 'Facturation'],
		['name'], ['parent', 'Customer', 'unknown']
	],
	Invoice: [
		['customer', 'Customer', 'many-to-one', undefined, undefined, 'Client'],
		['lines', 'Line', 'one-to-many', 'invoice.lines', 'line.invoice'],
		['number'], ['tags', 'Tag', 'many-to-many', 'invoice.tags', 'tag.invoices']
	],
	Line: [['description'], ['invoice', 'Invoice', 'many-to-one', 'line.invoice', 'invoice.lines']],
	Tag: [['invoices', 'Invoice', 'many-to-many', 'tag.invoices', 'invoice.tags'], ['name']]
}

export function graphProvider(graph = searchGraph, wait = async () => {})
{
	const calls = []
	let pending = 0
	let peak = 0
	return {
		calls,
		get peak() { return peak },
		async context(root, path, signal)
		{
			calls.push({ path, signal })
			pending ++
			peak = Math.max(peak, pending)
			try {
				await wait(path, signal)
				if (root !== 'invoice')
					throw new Error('Unknown root')
				let type = 'Invoice'
				for (const name of path.split('.').filter(Boolean)) {
					const edge = graph[type].find(edge => edge[0] === name)
					if (!edge?.[1])
						throw new Error('Unknown relation')
					type = edge[1]
				}
				return {
					label: type === 'Invoice' ? 'Facture' : type, path, type,
					properties: graph[type].map(([name, target, cardinality, id, inverse, label], order) => ({
						kind: target ? 'relation' : 'terminal', label: label || name, name, order,
						path: path ? `${path}.${name}` : name,
						relation: target ? { cardinality: cardinality || 'unknown', id: id || `${type}.${name}`, inverse }
							: undefined,
						target
					}))
				}
			}
			finally { pending -- }
		},
		async resolve(root, path, signal)
		{
			if (!path)
				return this.context(root, path, signal)
			const parent = path.split('.').slice(0, -1).join('.')
			const context = await this.context(root, parent, signal)
			const property = context.properties.find(property => property.path === path)
			if (!property)
				throw new Error('Unknown property')
			return property
		}
	}
}

export function largeGraph(width = 80)
{
	return {
		Invoice: Array.from({ length: width }, (_, index) => [`branch${index}`, 'Node', 'many-to-one']),
		Node: [['child', 'Node', 'unknown'], ['name'], ['root', 'Invoice', 'unknown']]
	}
}

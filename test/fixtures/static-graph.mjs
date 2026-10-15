import { normalisePath } from '@itrocks/property-select/property-select.js'

// Plain data only: the same type is reachable through multiple paths and explicit inverse/plural edges.
export const graph = {
	Address: [
		['city', 'City', 'many-to-one', 'address.city', 'city.addresses'],
		['country', 'Country', 'many-to-one'],
		['street']
	],
	City: [
		['addresses', 'Address', 'one-to-many', 'city.addresses', 'address.city'],
		['country', 'Country', 'many-to-one'],
		['name']
	],
	Country: [['code'], ['name']],
	Customer: [
		['address', 'Address', 'many-to-one'],
		['billingAddress', 'Address', 'unknown'],
		['name'],
		['parent', 'Customer', 'many-to-one']
	],
	Invoice: [
		['customer', 'Customer', 'many-to-one'],
		['lines', 'Line', 'one-to-many'],
		['number'],
		['tags', 'Tag', 'many-to-many', 'invoice.tags', 'tag.invoices']
	],
	Line: [['description'], ['invoice', 'Invoice', 'many-to-one']],
	Tag: [['invoices', 'Invoice', 'many-to-many', 'tag.invoices', 'invoice.tags'], ['name']]
}

export function staticProvider()
{
	const calls = []
	function typeAt(root, input)
	{
		if (root !== 'invoice')
			throw new Error('Unknown root')
		let type = 'Invoice'
		for (const segment of input ? normalisePath(input).split('.') : []) {
			const edge = graph[type].find(([name]) => name === segment)
			if (!edge?.[1])
				throw new Error('Unknown relation or terminal traversal')
			type = edge[1]
		}
		return type
	}
	return {
		calls,
		async context(root, path, signal)
		{
			calls.push({ kind: 'context', path, signal })
			const type = typeAt(root, path)
			return {
				label: type,
				path,
				properties: graph[type].map(([name, target, cardinality, id, inverse], order) => ({
					kind: target ? 'relation' : 'terminal', label: '', name, order,
					path: path ? `${path}.${name}` : name,
					relation: target ? { cardinality, id: id || `${type}.${name}`, inverse } : undefined,
					target
				})),
				type
			}
		},
		async resolve(root, path, signal)
		{
			calls.push({ kind: 'resolve', path, signal })
			const canonical = normalisePath(path)
			if (!canonical)
				return this.context(root, '', signal)
			const segments = canonical.split('.')
			const context = await this.context(root, segments.slice(0, -1).join('.'), signal)
			const property = context.properties.find(property => property.path === canonical)
			if (!property)
				throw new Error('Unknown property')
			return property
		}
	}
}

export function recordingConsumer(status = 'added')
{
	const calls = []
	const selected = []
	const transports = new Map()
	return {
		calls,
		selected,
		begin(intent, sample)
		{
			calls.push({ intent, sample, type: 'begin' })
			transports.set(intent.id, intent)
		},
		cancel(id, reason)
		{
			calls.push({ id, reason, type: 'cancel' })
			transports.delete(id)
		},
		async end(id, sample)
		{
			const intent = transports.get(id)
			transports.delete(id)
			calls.push({ id, sample, type: 'end' })
			return { id, path: intent.path, status }
		},
		move(id, sample) { calls.push({ id, sample, type: 'move' }) },
		async select(intent, signal)
		{
			calls.push({ intent, signal, type: 'select' })
			selected.push(intent.path)
			return { id: intent.id, path: intent.path, status }
		}
	}
}

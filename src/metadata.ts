import { normalisePath }            from './path.js'
import type { MetadataProvider }    from './ports.js'
import type { ObjectContext }       from './ports.js'
import type { PropertyDescription } from './ports.js'
import type { RootId }              from './ports.js'

export function isContext(value: PropertyDescription | ObjectContext): value is ObjectContext
{
	return 'properties' in value
}

// Validate the port boundary once; adapters may never substitute a relative or unrecognised property path.
export async function loadContext(
	provider: MetadataProvider, root: RootId, path: string, signal: AbortSignal
): Promise<ObjectContext>
{
	const context = await provider.context(root, path, signal)
	if ((context.path !== path) || !Array.isArray(context.properties) || !context.type)
		throw new TypeError(`Invalid metadata context: ${path}`)
	const paths = new Set<string>()
	const properties = context.properties.map(property => {
		const fullPath = normalisePath(property.path)
		const expected = path ? `${path}.${property.name}` : property.name
		if (
			!property.name || (normalisePath([property.name]) !== property.name) || (fullPath !== expected)
			|| paths.has(fullPath) || !['relation', 'terminal'].includes(property.kind)
			|| !Number.isFinite(property.order)
		)
			throw new TypeError(`Invalid metadata property: ${fullPath}`)
		paths.add(fullPath)
		return { ...property, label: property.label || property.name }
	})
	properties.sort((a, b) => (a.order - b.order) || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
	return { ...context, label: context.label || context.type, properties }
}

export async function resolveProperty(
	provider: MetadataProvider, root: RootId, path: string, signal: AbortSignal
): Promise<PropertyDescription>
{
	if (!path)
		throw new TypeError('The root cannot be selected or transported')
	const property = await provider.resolve(root, path, signal)
	if (isContext(property) || (property.path !== path) || !['relation', 'terminal'].includes(property.kind))
		throw new TypeError(`Invalid property resolution: ${path}`)
	return { ...property, label: property.label || property.name }
}

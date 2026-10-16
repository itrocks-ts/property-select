import type { MetadataProvider } from './ports.js'

export type Suggestion = { label: string; path: string }

export async function suggestions(
	metadata: MetadataProvider, root: string,
	recent: readonly string[], used: readonly string[], advice: readonly string[],
	limit: number, signal: AbortSignal, translate: (label: string) => string = label => label
): Promise<Suggestion[]>
{
	const destinations = async (paths: readonly string[], properties = false) => {
		const result: Suggestion[] = []
		for (const path of paths) {
			signal.throwIfAborted()
			try {
				const property = await metadata.resolve(root, path, signal)
				const destination = !('properties' in property) && property.kind === 'terminal'
					? properties ? path.split('.').slice(0, -1).join('.') : '' : path
				if (!destination) continue
				await metadata.context(root, destination, signal)
				const labels: string[] = []
				const segments = destination.split('.')
				for (let depth = 1; depth <= segments.length; depth ++) {
					const edge = await metadata.resolve(root, segments.slice(0, depth).join('.'), signal)
					labels.push(translate(edge.label || segments[depth - 1]))
				}
				// Complete labelled paths distinguish homonyms without exposing identifiers as display text.
				result.push({ label: labels.join(' › '), path: destination })
			}
			catch (error) { if (signal.aborted) throw error }
		}
		return result
	}
	const recentItems = await destinations(recent)
	const usedItems = await destinations(used, true)
	const adviceItems = await destinations(advice)
	const maximal = usedItems.filter(item => !usedItems.some(other => other.path.startsWith(item.path + '.')))
	const result = new Map<string, Suggestion>()
	for (const item of [...recentItems, ...maximal, ...adviceItems])
		if (!result.has(item.path)) result.set(item.path, item)
	return [...result.values()].slice(0, limit)
}

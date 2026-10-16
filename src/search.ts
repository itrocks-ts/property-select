import type { ObjectContext }       from './ports.js'
import type { PropertyDescription } from './ports.js'

export interface SearchOptions
{
	maxContexts?: number
	maxDepth?: number
	maxPending?: number
	maxResults?: number
}

export interface SearchResult
{
	depth: number
	property: PropertyDescription
	segments: readonly { label: string; path: string }[]
}

export interface SearchSnapshot
{
	errors: readonly string[]
	limited: boolean
	results: readonly SearchResult[]
	status: 'idle' | 'loading' | 'complete' | 'empty' | 'limited' | 'error'
	visited: number
}

interface Edge
{
	property: PropertyDescription
	source: string
}

interface Branch
{
	context?: ObjectContext
	depth: number
	edges: readonly Edge[]
	path: string
	returned: boolean
	segments: readonly { label: string; path: string }[]
}

// The installed autocomplete normaliser is private and imports DOM code. Use the same standard Unicode operation.
function normalise(text: string): string
{
	return text.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim()
}

function compare(a: SearchResult, b: SearchResult, words: readonly string[]): number
{
	const strength = (result: SearchResult) => words.filter(word =>
		normalise(`${result.property.name} ${result.property.label}`).includes(word)).length
	return (a.depth - b.depth) || (strength(b) - strength(a)) || (a.property.order - b.property.order)
		|| (a.property.path < b.property.path ? -1 : a.property.path > b.property.path ? 1 : 0)
}

/** Edge history is local to a path; identical target classes on separate branches never collapse. */
function nextBranch(branch: Branch, property: PropertyDescription): Branch | undefined
{
	const relation = property.relation
	let returned = branch.returned
	for (const previous of [...branch.edges].reverse()) {
		const earlier = previous.property.relation
		const inverse = !!earlier?.id && !!relation?.id
			&& ((earlier.inverse === relation.id) || (relation.inverse === earlier.id))
		// An unannotated reverse pair is uncertain. A repeated self edge is uncertain too,
		// but distinct self relations are not rejected merely for sharing a type.
		const reverse = previous.source === property.target && previous.property.target === branch.context!.type
			&& ((previous.source !== previous.property.target) || (earlier?.id === relation?.id))
		if (!inverse && !reverse)
			continue
		if (!inverse || returned || !earlier || !relation || (earlier.inverse !== relation.id)
			|| (relation.inverse !== earlier.id) || (relation.cardinality === 'unknown')
			|| !['many-to-one', 'many-to-many'].includes(earlier.cardinality))
			return undefined
		returned = true
		break
	}
	// Repeating a canonical forward edge without a known inverse is also an uncertain cycle.
	if (relation && branch.edges.some(edge => edge.property.relation?.id === relation.id)
		&& !relation.inverse)
		return undefined
	return {
		depth: branch.depth + 1,
		edges: [...branch.edges, { property, source: branch.context!.type }],
		path: property.path,
		returned,
		segments: [...branch.segments, { label: property.label, path: property.path }]
	}
}

/** Metadata-only progressive BFS. Generation guards remain authoritative when a provider ignores abort. */
export class Search
{

	private abort?: AbortController
	private generation = 0
	private readonly limits: Required<SearchOptions>
	private value: SearchSnapshot = { errors: [], limited: false, results: [], status: 'idle', visited: 0 }

	constructor(
		private readonly load: (path: string, signal: AbortSignal) => Promise<ObjectContext>,
		private readonly changed: () => void,
		private readonly failed: (error: unknown) => void,
		options: SearchOptions = {}
	)
	{
		this.limits = { maxContexts: 500, maxDepth: 6, maxPending: 4, maxResults: 100, ...options }
		for (const [name, value] of Object.entries(this.limits))
			if (!Number.isSafeInteger(value) || (value < (name === 'maxDepth' ? 0 : 1)))
				throw new TypeError(`Invalid search budget: ${name}`)
	}

	get snapshot(): SearchSnapshot
	{
		return structuredClone(this.value)
	}

	cancel(): void
	{
		this.generation ++
		this.abort?.abort()
		this.value = { errors: [], limited: false, results: [], status: 'idle', visited: 0 }
	}

	start(query: string, trail: readonly ObjectContext[]): void
	{
		this.cancel()
		const words = normalise(query).split(' ').filter(Boolean)
		if (!words.length || !trail.length) {
			this.changed()
			return
		}
		const abort = this.abort = new AbortController()
		const generation = this.generation
		this.value.status = 'loading'
		this.changed()
		void this.explore(words, trail, abort.signal, generation)
	}

	private async explore(
		words: readonly string[], trail: readonly ObjectContext[], signal: AbortSignal, generation: number
	): Promise<void>
	{
		const live = () => (generation === this.generation) && !signal.aborted
		const results = new Map<string, SearchResult>()
		const errors: string[] = []
		const context = trail[trail.length - 1]
		let frontier: Branch[] = [{
			context, depth: 0,
			edges: trail.slice(0, -1).map((parent, index) => ({
				property: parent.properties.find(property => property.path === trail[index + 1].path)!,
				source: parent.type
			})),
			path: context.path, returned: false,
			segments: trail.map(item => ({ label: item.label, path: item.path }))
		}]
		let matched = 0
		let visited = 0
		let limited = false
		const trim = () => {
			if (results.size <= this.limits.maxResults)
				return
			limited = true
			const ranked = [...results.values()].sort((a, b) => compare(a, b, words))
			for (const result of ranked.slice(this.limits.maxResults))
				results.delete(result.property.path)
		}
		const publish = (status: SearchSnapshot['status']) => {
			if (!live())
				return
			this.value = {
				errors: [...errors], limited,
				results: [...results.values()].sort((a, b) => compare(a, b, words)).slice(0, this.limits.maxResults),
				status, visited
			}
			this.changed()
		}
		while (frontier.length && live()) {
			const next: Branch[] = []
			const remaining = this.limits.maxContexts - visited
			if (frontier.length > remaining) {
				frontier = frontier.slice(0, remaining)
				limited = true
			}
			for (let offset = 0; offset < frontier.length && live(); offset += this.limits.maxPending) {
				const batch = frontier.slice(offset, offset + this.limits.maxPending)
				visited += batch.length
				// Reserve each batch in business order; responses may enrich results in any order.
				const children = await Promise.all(batch.map(async branch => {
					try {
						branch.context ||= await this.load(branch.path, signal)
						if (!live())
							return []
						const descendants: Branch[] = []
						for (const property of branch.context.properties) {
							const text = normalise([
								...branch.segments.map(segment => segment.label), property.path, property.label, property.name
							].join(' '))
							if (words.every(word => text.includes(word))) {
								matched ++
								results.set(property.path, { depth: branch.depth, property, segments: branch.segments })
								if (results.size > this.limits.maxResults * 2)
									trim()
							}
							if (property.kind !== 'relation')
								continue
							const child = nextBranch(branch, property)
							if (!child)
								continue
							if ((branch.depth < this.limits.maxDepth) && (descendants.length < this.limits.maxContexts))
								descendants.push(child)
							else
								limited = true
						}
						trim()
						publish('loading')
						return descendants
					}
					catch (error) {
						if (live()) {
							errors.push(error instanceof Error ? error.message : String(error))
							this.failed(error)
							publish('loading')
						}
						return []
					}
				}))
				if (!live())
					return
				next.push(...children.flat())
				if (next.length > this.limits.maxContexts) {
					next.length = this.limits.maxContexts
					limited = true
				}
			}
			if ((matched > this.limits.maxResults) || (visited >= this.limits.maxContexts && next.length))
				limited = true
			if ((matched >= this.limits.maxResults && next.length) || (visited >= this.limits.maxContexts)) {
				limited ||= !!next.length
				break
			}
			frontier = next
		}
		publish(errors.length ? 'error' : limited ? 'limited' : results.size ? 'complete' : 'empty')
	}

}

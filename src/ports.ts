
export type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'unknown'
export type InteractionId = string
export type PropertyPath = string | readonly string[]
export type RootId = string
export type TypeId = string

export interface ConsumerPort
{
	begin(intent: SelectionIntent, sample: PointerSample): void
	cancel(id: InteractionId, reason: string): void
	end(id: InteractionId, sample: PointerSample): Promise<Outcome>
	move(id: InteractionId, sample: PointerSample): void
	select(intent: SelectionIntent, signal: AbortSignal): Promise<Outcome>
}

export interface MetadataProvider
{
	context(root: RootId, path: string, signal?: AbortSignal): Promise<ObjectContext>
	resolve(root: RootId, path: string, signal?: AbortSignal): Promise<PropertyDescription | ObjectContext>
}

export interface ObjectContext
{
	label: string
	path: string
	properties: readonly PropertyDescription[]
	type: TypeId
}

export interface Outcome
{
	id: InteractionId
	message?: string
	path: string
	status: 'added' | 'existing' | 'removed' | 'moved' | 'cancelled' | 'rejected'
}

export interface PointerSample
{
	clientX: number
	clientY: number
	pointerId: number
	pointerType: string
}

export interface PropertyDescription
{
	kind: 'terminal' | 'relation'
	label: string
	name: string
	order: number
	path: string
	relation?: { cardinality: Cardinality; id: string; inverse?: string }
	target?: TypeId
}

export interface SelectionIntent
{
	id: InteractionId
	path: string
	root: RootId
}

export interface SelectorState
{
	branch: readonly string[]
	current: number
	query: string
	recent: readonly string[]
	scroll: Readonly<Record<string, { left: number; top: number }>>
	version: 1
}

export interface StateRecord
{
	revision: number
	state?: SelectorState
}

export interface StateStore
{
	read(key: string, signal?: AbortSignal): Promise<StateRecord>
	remove(key: string, expectedRevision: number): Promise<StateRecord>
	write(key: string, state: SelectorState, expectedRevision: number): Promise<StateRecord>
}

import type { LastValue, PropertyPath, PropertyPathArray, PropertyPathString } from '@itrocks/reflect-path'

interface Boundary
{
	date: Date
	dates: Date[]
	domain: { name: string; timestamp?: Date }
	generic: Array<Date>
	map: Record<string, Date>
	nullable: Date | null | undefined
	optional?: Date
}

const paths: PropertyPath<Boundary>[] = ['date', 'dates', 'generic', 'map', 'nullable', 'optional', 'domain.name']
const date: LastValue<Boundary, 'date'> = new Date()
// @ts-expect-error Native methods cannot be selected below a scalar.
const direct: PropertyPathString<Boundary> = 'date.toISOString'
// @ts-expect-error A nullable Date remains terminal.
const nullable: PropertyPath<Boundary> = 'nullable.getTime'
// @ts-expect-error An optional Date remains terminal in tuple paths.
const optional: PropertyPathArray<Boundary> = ['optional', 'getTime']
// @ts-expect-error Date arrays do not expose element methods.
const array: PropertyPath<Boundary> = 'dates.getTime'
// @ts-expect-error Generic arrays do not expose element methods.
const generic: PropertyPath<Boundary> = 'generic.getTime'
// @ts-expect-error Record Date values do not expose native methods.
const record: PropertyPath<Boundary> = 'map.getTime'
// @ts-expect-error A Date nested below a domain object remains terminal.
const nested: PropertyPath<Boundary> = 'domain.timestamp.toISOString'
void [paths, date, direct, nullable, optional, array, generic, record, nested]

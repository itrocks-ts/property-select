import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { models } from '../models/load.mjs'

const require = createRequire(import.meta.url)
const { classViewDependsOn, representativeValueOf } = require('@itrocks/class-view')
const { Mysql } = require('@itrocks/mysql')
const { Mysql: MaintainedMysql } = require('@itrocks/mysql-maintainer')
const { ReflectProperty } = require('@itrocks/reflect')
const { resolvePropertyPath } = require('@itrocks/reflect-path')
const { greater, like } = require('@itrocks/sql-functions')
const { createDataSource, dataSource, DataSource, Identifiers, Limit, Sort } = require('@itrocks/storage')
const { applyTransformer, HTML, IGNORE, OUTPUT, READ, SAVE, SQL, setPropertyTransformer }
	= require('@itrocks/transformer')
const { City, Country, Customer, Invalid, Invoice, Maintenance } = models
const output = new URL('../../evidence/VSQL/', import.meta.url)
const control = fileURLToPath(new URL('../control.mjs', import.meta.url))
const journal = '/tmp/showtime-property-select-env/queries.log'
const config = { engine: '@itrocks/mysql', host: '127.0.0.1', port: 13316,
	user: 'root', password: '', database: 'property_select_recipe' }
const statements = []
const cases = []
const observations = []
let current = ''

// The verifier owns this fixture and computes expectations from plain records, never returned projections.
const countries = [{ id: 1, name: 'Aster' }, { id: 2, name: 'Birch' }]
const cities = [
	{ id: 1, name: 'Amber', country: countries[0] },
	{ id: 2, name: 'Cedar', country: countries[1] },
	{ id: 3, name: null, country: countries[0] }
]
const addresses = Array.from({ length: 4 }, (_, i) =>
	({ id: i + 1, street: `Street ${i + 1}`, city: cities[i] ?? null }))
const customers = Array.from({ length: 5 }, (_, i) =>
	({ id: i + 1, name: `Customer ${i + 1}`, address: addresses[i] ?? null }))
customers.forEach((customer, i) => customer.parent = customers[(i + 1) % customers.length])
const roots = Array.from({ length: 137 }, (_, i) => ({
	id: i + 1, number: `VSQL-${String(i + 1).padStart(3, '0')}`, active: i % 3 !== 0,
	amount: (i * 137 - 500) / 100, issuedAt: i % 4 ? '2026-02-03 04:05:06' : null,
	note: i % 3 === 0 ? null : i % 3 === 1 ? '' : 'memo', p0: `p-${i % 7}`,
	customer: customers[i % 6] ?? null, deliveryAddress: addresses[(i * 3) % 5] ?? null,
	lines: Array.from({ length: i % 4 }, (_, j) => ({ label: j === 2 ? null : `L${j}`, quantity: i % 5 + j })),
	tags: [1, 2, 3].filter(tag => (i + tag) % 3 === 0 || (i % 7 === 0 && tag === 1))
}))
const plainIds = records => records.map(record => record.id)
const resultIds = result => result.rows.map(row => row.rootId)
const check = (label, actual, expected) => {
	observations.push({ case: current, label, expected, observed: actual })
	assert.deepEqual(actual, expected, label)
}
const pathValue = (record, path) => {
	let value = record
	const prefix = []
	for (const segment of path.split('.')) {
		prefix.push(segment)
		value = value[segment]
		if (value === null && prefix.length < path.split('.').length)
			return { kind: 'absent', at: prefix.join('.') }
	}
	return { kind: 'value', value }
}
const value = (row, index = 0) => row.cells[index].value
const expectedIds = predicate => plainIds(roots.filter(predicate))
const run = async (id, fn) => {
	current = id
	const start = statements.length
	try {
		await fn()
		cases.push({ id, status: 'PASS', start, queries: statements.length - start })
	}
	catch (error) {
		cases.push({ id, status: 'FAIL', start, queries: statements.length - start, error: error.stack })
		console.error(id, error)
	}
}
const rejects = async (fn, code) => {
	const before = statements.length
	await assert.rejects(fn, error => error.code === code)
	check(`pre-query rejection ${code}`, statements.length - before, 0)
}
await mkdir(output, { recursive: true })
execFileSync(process.execPath, [control, 'reset'])
createDataSource(config)
const dao = dataSource()
assert.ok(dao instanceof Mysql)
await dao.connect()
const native = dao.connection.query.bind(dao.connection)
// Only the documented disposable recipe schema is touched.
for (const table of ['ps_invoice_ps_tag', 'ps_line', 'ps_invoice', 'ps_customer', 'ps_address', 'ps_city', 'ps_country',
	'ps_tag']) await native(`DELETE FROM \`${table}\``)
const insert = async (table, rows) => {
	for (const row of rows) await native(`INSERT INTO \`${table}\` VALUES (${row.map(() => '?').join(',')})`, row)
}
await insert('ps_country', countries.map(c => [c.id, c.name]))
await insert('ps_city', cities.map(c => [c.id, c.name, c.country.id]))
await insert('ps_address', addresses.map(a => [a.id, a.street, a.city?.id ?? null]))
await insert('ps_customer', customers.map(c => [c.id, c.name, c.address?.id ?? null, c.parent.id]))
await insert('ps_invoice', roots.map(r => [r.id, r.number, r.customer?.id ?? null, r.deliveryAddress?.id ?? null,
	r.active ? 1 : 0, r.amount, r.issuedAt, r.note, r.p0]))
let lineId = 0
await insert('ps_line', roots.flatMap(r => r.lines.map(l => [++ lineId, r.id, l.label, l.quantity])))
await insert('ps_tag', [1, 2, 3].map(id => [id, `Tag ${id}`]))
await insert('ps_invoice_ps_tag', roots.flatMap(r => r.tags.map(id => [r.id, id])))
const journalStart = (await readFile(journal)).length
const observe = connection => {
	const query = connection.query.bind(connection)
	connection.query = async (sql, values) => {
		const entry = { case: current, sql, values }
		statements.push(entry)
		try {
			const result = await query(sql, values)
			entry.rows = result.length
			return result
		}
		catch (error) {
			entry.error = error.code ?? error.message
			throw error
		}
	}
}
observe(dao.connection)
const select = (columns, search = {}, options) => dao.select(Invoice, columns, search, options)
const compare = async (search, predicate, options) => {
	const expected = expectedIds(predicate)
	check('projected roots', resultIds(await select(['number'], search, options)), expected)
	check('same-criteria count', await dao.count(Invoice, search), expected.length)
}
try {
	await run('SQL-01', async () => {
		const paths = ['number', 'customer.name', 'customer.address.city.name', 'deliveryAddress.street']
		const result = await select(paths.map((p, i) => i % 2 ? p.split('.') : p))
		check('root identities', resultIds(result), plainIds(roots))
		check('canonical descriptors', result.columns.map(c => c.path), paths)
		result.rows.forEach((row, i) => check(`cells ${row.rootId}`, row.cells, paths.map(p => pathValue(roots[i], p))))
	})
	await run('SQL-02', async () => {
		const path = 'customer.address.city'
		const result = await select([{ path, objectFields: ['name', 'country.name'] }])
		classViewDependsOn({ propertyOutput: (object, property) =>
			applyTransformer(object[property], object, property, HTML, OUTPUT) })
		setPropertyTransformer(City, 'country', HTML, OUTPUT, country => representativeValueOf(country))
		const before = statements.length
		for (const row of result.rows) {
			const expected = roots[row.rootId - 1].customer?.address?.city
			if (!expected) continue
			const city = value(row)
			assert.ok(city instanceof City && city.country instanceof Country)
			check('city/country identity and values', [city.id, city.name, city.country.id, city.country.name],
				[expected.id, expected.name, expected.country.id, expected.country.name.toUpperCase()])
			check('partial object own keys', Object.keys(city).sort(), ['country', 'id', 'name'])
			check('loaded paths', [...row.cells[0].loadedFields].sort(), ['country.id', 'country.name', 'id', 'name'])
			if (expected.name) {
				const rendered = await representativeValueOf(city)
				assert.ok(rendered.includes(expected.name) && rendered.includes(expected.country.name.toUpperCase()))
			}
		}
		check('representation reads', statements.length - before, 0)
		const identity = await select([{ path, objectFields: [] }], { id: 1 })
		check('identity only', Object.keys(value(identity.rows[0])), ['id'])
		const defaults = await select([path], { id: 1 })
		check('stored scalar defaults only', Object.keys(value(defaults.rows[0])).sort(), ['id', 'name'])
		const nested = await select([{ path, objectFields: ['country'] }], { id: 1 })
		check('nested object expansion', value(nested.rows[0]).country.name, 'ASTER')
		assert.ok(!Object.hasOwn(value(nested.rows[0]), 'name'))
	})
	await run('SQL-03', async () => {
		const result = await select([
			{ path: 'customer.address.city', objectFields: ['name'] }, 'customer.address.city.name',
			{ path: 'deliveryAddress.city', objectFields: ['country.name'] }, 'deliveryAddress.city.country.name'
		])
		const byId = new Map()
		for (const row of result.rows) for (const index of [0, 2]) {
			if (row.cells[index].kind !== 'value') continue
			const city = value(row, index)
			if (byId.has(city.id)) assert.equal(city, byId.get(city.id))
			else byId.set(city.id, city)
			check('mixed descendant agreement', index ? city.country.name : city.name, value(row, index + 1))
		}
		check('identity merged fields', [...byId.values()].every(c => c.country instanceof Country), true)
		const again = await select(['customer.address.city'], { id: 1 })
		assert.notEqual(value(again.rows[0]), byId.get(1))
	})
	await run('SQL-04', async () => {
		const search = { active: true, 'deliveryAddress.city.name': 'Cedar' }
		await compare(search, r => r.active && r.deliveryAddress?.city?.name === 'Cedar')
		assert.ok(statements.at(-1).values.includes('Cedar'))
	})
	await run('SQL-05', async () => {
		const paths = ['customer.address.city.country.name', 'deliveryAddress.city.name', 'note']
		const result = await select(paths)
		check('optional ancestry retains every root', resultIds(result), plainIds(roots))
		for (const row of result.rows) {
			const expected = paths.map(path => pathValue(roots[row.rootId - 1], path))
			if (expected[0].kind === 'value') expected[0].value = expected[0].value.toUpperCase()
			check(`absence/null/empty ${row.rootId}`, row.cells, expected)
		}
		const empty = await select(paths, { number: 'no such number' })
		check('empty rows', empty.rows, [])
		check('empty descriptors', empty.columns.map(c => c.path), paths)
		check('zero-column cells', (await select([])).rows.map(r => r.cells), roots.map(() => []))
	})
	await run('SQL-06', async () => {
		const path = 'customer.' + 'parent.'.repeat(31) + 'name'
		const result = await select(['id', 'p0', path])
		for (const row of result.rows) check('alias and long path', row.cells,
			['id', 'p0', path].map(p => pathValue(roots[row.rootId - 1], p)))
		const payload = "' OR 1=1 --"
		check('bound hostile operand', (await select(['number'], { number: payload })).rows, [])
		assert.ok(statements.at(-1).values.includes(payload) && !statements.at(-1).sql.includes(payload))
		for (const path of ['missing', 'constructor', 'customer..name', 'number.name', 'customer.name;DROP'])
			await rejects(() => select([path]), 'invalid-path')
		await rejects(() => select(['number', ['number']]), 'invalid-path')
		await rejects(() => dao.select(Invalid, ['ambiguous.name']), 'ambiguous-type')
		await rejects(() => dao.select(Invalid, ['unknown']), 'unsupported-selection')
	})
	await run('SQL-07', async () => {
		const result = await select(['amount', 'active', 'issuedAt', 'note'])
		for (const row of result.rows) {
			const r = roots[row.rootId - 1]
			check('decimal boolean note', [value(row), value(row, 1), value(row, 3)], [r.amount, r.active, r.note])
			const date = value(row, 2)
			if (r.issuedAt) {
				assert.ok(date instanceof Date)
				check('date components', [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()],
					[2026, 1, 3, 4])
			}
			else check('null date', date, null)
		}
		setPropertyTransformer(Country, 'name', SQL, SAVE, async (v, o, p) => {
			assert.ok(o instanceof Country)
			assert.equal(p, 'name')
			return typeof v === 'string' ? v[0] + v.slice(1).toLowerCase() : v
		})
		const search = { 'customer.address.city.country.name': 'ASTER' }
		await compare(search, r => r.customer?.address?.city?.country.id === 1)
		check('search conversion', (await dao.search(Invoice, search)).map(r => Number(r.id)),
			expectedIds(r => r.customer?.address?.city?.country.id === 1))
		setPropertyTransformer(City, 'name', SQL, READ, async v => v === 'Amber' ? IGNORE : undefined)
		try {
			const result = await select(['customer.address.city', 'customer.address.city.name'])
			for (const row of result.rows) {
				const city = roots[row.rootId - 1].customer?.address?.city
				if (!city) continue
				const ignored = city.name === 'Amber'
				check('scalar ignored versus undefined', row.cells[1], ignored
					? { kind: 'unloaded', reason: 'ignored' } : { kind: 'value', value: undefined })
				check('object own field', Object.hasOwn(value(row), 'name'), !ignored)
				check('object loaded field', row.cells[0].loadedFields.includes('name'), !ignored)
			}
			const cause = new Error('VSQL conversion sentinel')
			setPropertyTransformer(City, 'name', SQL, READ, () => { throw cause })
			await assert.rejects(() => select(['customer.address.city.name']), error =>
				error.code === 'conversion' && error.path === 'customer.address.city.name' && error.cause === cause)
		}
		finally { setPropertyTransformer(City, 'name', SQL, READ, v => v) }
	})
	await run('SQL-08', async () => {
		const sorted = [...roots].sort((a, b) => {
			const av = a.deliveryAddress?.city?.name ?? ''
			const bv = b.deliveryAddress?.city?.name ?? ''
			return (av < bv ? -1 : av > bv ? 1 : 0) || a.id - b.id
		})
		const order = new Sort(['deliveryAddress.city.name'])
		for (const offset of [0, 50, 100, 137]) {
			const before = statements.length
			const result = await select(['number'], {}, [order, new Limit(50, offset)])
			check(`independent page ${offset}`, resultIds(result), plainIds(sorted.slice(offset, offset + 50)))
			check('one bounded page query', statements.length - before, 1)
			assert.ok(statements.at(-1).rows <= 50 && /LIMIT/.test(statements.at(-1).sql))
		}
		check('fixed-dataset repeated page', resultIds(await select([], {}, [order, new Limit(50)])),
			plainIds(sorted.slice(0, 50)))
		check('total', await dao.count(Invoice), roots.length)
		check('zero limit', (await select([], {}, new Limit(0))).rows, [])
		check('default root order', resultIds(await select([], {}, new Limit(2))), [1, 2])
		const descending = [...roots].sort((a, b) => b.number.localeCompare(a.number))
		check('descending sort', resultIds(await select([], {}, new Sort(['-number']))), plainIds(descending))
		const objectOrder = [...roots].sort((a, b) => (a.customer?.id ?? 0) - (b.customer?.id ?? 0) || a.id - b.id)
		check('object identity sort', resultIds(await select([], {}, new Sort(['customer']))), plainIds(objectOrder))
		for (const options of [new Limit(-1), new Limit(Infinity), new Limit(1, -1), new Limit(1.5),
			[new Limit(1), new Limit(2)], {}, 'LIMIT 1', new Identifiers([NaN])])
			await rejects(() => select([], {}, options), 'unsupported-option')
	})
	await run('SQL-09', async () => {
		check('inverse metadata', new ReflectProperty(Invoice, 'lines').relation.inverse, 'invoice')
		check('N-N metadata', new ReflectProperty(Invoice, 'tags').relation.cardinality, 'many-to-many')
		check('plural path metadata', resolvePropertyPath(Invoice, 'tags.invoices.number').targetMultiplicity, 'many')
		for (const path of ['lines', 'lines.label', 'tags', 'tags.name', 'tags.invoices.number']) {
			await rejects(() => select([path], { id: 2 }), 'multiple-values')
			await rejects(() => select([], {}, new Sort([path])), 'multiple-values')
		}
	})
	await run('SQL-10', async () => {
		const scenarios = [
			[{ 'lines.label': 'L0' }, r => r.lines.some(l => l.label === 'L0')],
			[{ 'lines.label': null }, r => r.lines.some(l => l.label === null)],
			[{ 'lines.label': 'L0', 'lines.quantity': 5 }, r => r.lines.some(l => l.label === 'L0' && l.quantity === 5)],
			[{ 'lines.quantity': greater(2) }, r => r.lines.some(l => l.quantity > 2)],
			[{ 'tags.name': 'Tag 1' }, r => r.tags.includes(1)],
			[{ 'tags.name': 'Tag 1', 'lines.quantity': greater(2) },
				r => r.tags.includes(1) && r.lines.some(l => l.quantity > 2)],
			[{ 'tags.invoices.lines.quantity': 6 },
				r => r.tags.some(tag => roots.some(other =>
					other.tags.includes(tag) && other.lines.some(l => l.quantity === 6)))]
		]
		for (const [search, predicate] of scenarios) {
			await compare(search, predicate)
			const matching = roots.filter(predicate)
			for (const offset of [0, 17, 34, 51, 102])
				check('plural filtered page', resultIds(await select([], search, new Limit(17, offset))),
					plainIds(matching.slice(offset, offset + 17)))
			check('legacy search shares plural semantics', (await dao.search(Invoice, search)).map(r => Number(r.id)),
				plainIds(matching))
		}
	})
	await run('SQL-11', async () => {
		const search = { number: like('VSQL-01%') }
		const expected = roots.filter(r => r.number.startsWith('VSQL-01'))
		check('legacy function count', await dao.count(Invoice, search), expected.length)
		check('legacy limited search', (await dao.search(Invoice, search, new Limit(3))).map(r => Number(r.id)),
			plainIds(expected.slice(0, 3)))
		check('legacy zero limit remains unbounded', (await dao.search(Invoice, {}, new Limit(0))).length, roots.length)
		const entity = (await dao.search(Invoice, { id: 1 }))[0]
		assert.ok(entity instanceof Invoice)
		check('legacy relationship id', Number(entity.customerId), roots[0].customer.id)
		let fallback = 0
		class Unsupported extends DataSource
		{

			search()
			{
				fallback ++
				return []
			}

		}
		await rejects(() => new Unsupported().select(Invoice, ['number']), 'unsupported-selection')
		check('no unsupported fallback', fallback, 0)
		const maintained = new MaintainedMysql(config)
		try {
			await maintained.connect()
			observe(maintained.connection)
			check('maintained projection', resultIds(await maintained.select(Invoice, ['number'], { id: 8 })), [8])
			await native('DROP TABLE IF EXISTS ps_maintenance')
			check('maintained recovery', (await maintained.select(Maintenance, ['name'])).rows, [])
			await native('DROP TABLE ps_maintenance')
			check('maintained count recovery', await maintained.count(Maintenance), 0)
			await native('DROP TABLE ps_maintenance')
		}
		finally { await maintained.close() }
	})
	await run('SQL-12', async () => {
		const visible = [2, 3, 4, 40, 90, 137]
		const before = statements.length
		const result = await select(['customer.address.city'], { active: true }, new Identifiers([...visible, 2]))
		check('restricted scope result', resultIds(result), expectedIds(r => r.active && visible.includes(r.id)))
		check('single reload query', statements.length - before, 1)
		check('deduplicated bound identifiers', statements.at(-1).values.slice(1), visible)
		assert.ok(statements.at(-1).rows <= visible.length && / IN \(/.test(statements.at(-1).sql))
		check('empty identity set', (await select(['number'], {}, new Identifiers([]))).rows, [])
	})
	await run('SQL-13', async () => {
		const customer = Object.assign(Object.create(Customer.prototype), { id: 2 })
		await compare({ customer }, r => r.customer?.id === 2)
		await compare({ customer: 2 }, r => r.customer?.id === 2)
		await compare({ customer: null }, r => r.customer === null)
		const fn = like('ASTER')
		await compare({ 'customer.address.city.country.name': fn }, r => r.customer?.address?.city?.country.id === 1)
		check('caller function operand unchanged', fn.value, 'ASTER')
		await rejects(() => select([], { customer: {} }), 'conversion')
		await assert.rejects(() => dao.select(Invalid, []), error => error.code === 'ER_NO_SUCH_TABLE')
	})
}
finally {
	await dao.close()
	const trace = (await readFile(journal)).subarray(journalStart)
	await mkdir('/tmp/property-select/VSQL', { recursive: true })
	await writeFile('/tmp/property-select/VSQL/mysql-general.raw.log', trace)
	await writeFile(new URL('mysql-general.log', output),
		trace.toString().split('\n').map(line => line.trimEnd()).join('\n'))
	await run('SQL-14', async () => {
		assert.ok(trace.includes('SELECT') && trace.includes('COUNT(*)') && trace.includes('EXISTS'))
		assert.ok(trace.includes('VSQL-01%') && trace.includes('LIMIT 50'))
		check('SQL archive observation', true, true)
	})
	const stringify = data => JSON.stringify(data, (_, v) =>
		typeof v === 'bigint' ? `${v}n` : v === undefined ? { undefined: true } : v, '\t') + '\n'
	await writeFile(new URL('sql.json', output), stringify(statements))
	await writeFile(new URL('results.json', output), stringify({ cases, observations }))
	// Restore the shared synthetic recipe for subsequent tasks, retaining the independent journal above.
	execFileSync(process.execPath, [control, 'reset'])
}
console.log(JSON.stringify(cases, null, 2))
if (cases.some(result => result.status !== 'PASS')) process.exitCode = 1

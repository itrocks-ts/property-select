import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { models } from '../models/load.mjs'

const require = createRequire(import.meta.url)
const { representativeValueOf, classViewDependsOn } = require('@itrocks/class-view')
const { Mysql } = require('@itrocks/mysql')
const { Mysql: MaintainedMysql } = require('@itrocks/mysql-maintainer')
const { ReflectProperty } = require('@itrocks/reflect')
const { resolvePropertyPath } = require('@itrocks/reflect-path')
const { greater, like } = require('@itrocks/sql-functions')
const { createDataSource, dataSource, Identifiers, Limit, Sort, SelectionError } = require('@itrocks/storage')
const { applyTransformer, HTML, OUTPUT, SQL, READ, SAVE, IGNORE, setPropertyTransformer }
	= require('@itrocks/transformer')
const { Address, City, Country, Customer, Invalid, Invoice, Maintenance, Tag } = models
const output = new URL('../../evidence/S07/', import.meta.url)
const journal = '/tmp/showtime-property-select-env/queries.log'
const journalStart = (await readFile(journal)).length
await mkdir(output, { recursive: true })
const config = { engine: '@itrocks/mysql', host: '127.0.0.1', port: 13316,
	user: 'root', password: '', database: 'property_select_recipe' }
createDataSource(config)
const dao = dataSource()
assert.ok(dao instanceof Mysql)
await dao.connect()
const statements = []
const original = dao.connection.query.bind(dao.connection)
dao.connection.query = async (sql, values) => {
	const entry = { sql, values }
	statements.push(entry)
	try {
		const rows = await original(sql, values)
		entry.rows = rows.length
		return rows
	}
	catch (error) { entry.error = error.code; throw error }
}
const cases = []
const run = async (id, check) => {
	const first = statements.length
	try { await check(); cases.push({ id, status: 'PASS', first, queries: statements.length - first }) }
	catch (error) {
		cases.push({ id, status: 'FAIL', first, queries: statements.length - first, error: error.stack })
		console.error(id, error)
	}
}
const ids = result => result.rows.map(row => row.rootId)
const value = (row, index = 0) => row.cells[index].value
const seeds = new Identifiers([1, 2, 3, 4])
const select = (columns, search = {}, options = seeds) => dao.select(Invoice, columns, search, options)
const rejectsWithoutQuery = async (fn, code) => {
	const count = statements.length
	await assert.rejects(fn, error => error instanceof SelectionError && error.code === code)
	assert.equal(statements.length, count)
}
try {
	await run('SQL-01', async () => {
		const result = await select(['number', ['customer', 'address', 'city', 'name']])
		assert.deepEqual(ids(result), [1, 2, 3, 4])
		assert.deepEqual(result.columns.map(c => c.path), ['number', 'customer.address.city.name'])
		assert.deepEqual(result.rows.map(row => value(row)), ['REC-001', 'REC-002', 'REC-003', 'REC-004'])
		assert.equal(value(result.rows[0], 1), 'Recipe Paris')
		assert.equal(value(result.rows[1], 1), 'Recipe London')
		assert.deepEqual(result.rows[2].cells[1], { kind: 'absent', at: 'customer.address' })
		assert.deepEqual(result.rows[3].cells[1], { kind: 'absent', at: 'customer' })
	})
	await run('SQL-02', async () => {
		const result = await select([{ path: 'customer.address.city', objectFields: ['name', 'country.name'] }])
		const city = value(result.rows[0])
		assert.ok(city instanceof City)
		assert.ok(city.country instanceof Country)
		assert.equal(city.id, 1)
		assert.equal(city.country.name, 'RECIPE FRANCE')
		assert.deepEqual(Object.keys(city).sort(), ['country', 'id', 'name'])
		assert.deepEqual(new Set(result.rows[0].cells[0].loadedFields),
			new Set(['id', 'name', 'country.id', 'country.name']))
		classViewDependsOn({ propertyOutput: (object, property) =>
			applyTransformer(object[property], object, property, HTML, OUTPUT) })
		setPropertyTransformer(City, 'country', HTML, OUTPUT, country => representativeValueOf(country))
		const count = statements.length
		assert.match(await representativeValueOf(city), /Recipe Paris.*RECIPE FRANCE/)
		assert.equal(statements.length, count)
		const direct = await select(['customer.address.city'])
		assert.deepEqual(Object.keys(value(direct.rows[0])).sort(), ['id', 'name'])
		const nested = await select([{ path: 'customer.address.city', objectFields: ['country'] }])
		assert.equal(value(nested.rows[0]).country.name, 'RECIPE FRANCE')
		assert.ok(!Object.hasOwn(value(nested.rows[0]), 'name'))
		const identity = await select([{ path: 'customer.address.city', objectFields: [] }])
		assert.deepEqual(Object.keys(value(identity.rows[0])), ['id'])
	})
	await run('SQL-03', async () => {
		const result = await select([{ path: 'customer.address.city', objectFields: ['name'] },
			'customer.address.city.name', { path: 'deliveryAddress.city', objectFields: ['country.name'] }])
		assert.equal(value(result.rows[0]).name, value(result.rows[0], 1))
		assert.equal(value(result.rows[0]), value(result.rows[1], 2))
		assert.equal(value(result.rows[0], 2), value(result.rows[1]))
		assert.equal(value(result.rows[0]).country.name, 'RECIPE FRANCE')
		const again = await select(['customer.address.city'])
		assert.notEqual(value(again.rows[0]), value(result.rows[0]))
	})
	await run('SQL-04', async () => {
		const search = { 'deliveryAddress.city.name': 'Recipe London', number: 'REC-001' }
		const result = await select(['number', 'customer.address.city.name'], search)
		assert.deepEqual(ids(result), [1])
		assert.equal(await dao.count(Invoice, search), 1)
		assert.deepEqual(statements.at(-1).values, ['Recipe London', 'REC-001'])
	})
	await run('SQL-05', async () => {
		const result = await select(['deliveryAddress.city.name', 'customer.address.city.country.name', 'note'])
		assert.equal(value(result.rows[3]), null)
		assert.equal(value(result.rows[2], 2), '')
		assert.equal(value(result.rows[0], 2), null)
		assert.equal(result.rows.length, 4)
		const empty = await select(['number'], { number: 'missing' })
		assert.equal(empty.rows.length, 0)
		assert.equal(empty.columns[0].path, 'number')
		const noColumns = await select([])
		assert.deepEqual(ids(noColumns), [1, 2, 3, 4])
		assert.ok(noColumns.rows.every(row => row.cells.length === 0))
	})
	await run('SQL-06', async () => {
		const path = 'customer.' + 'parent.'.repeat(32) + 'name'
		const result = await select(['id', 'p0', path])
		assert.equal(value(result.rows[0]), 1)
		assert.equal(value(result.rows[0], 1), 'alias')
		assert.equal(value(result.rows[0], 2), 'Recipe Alice')
		const injected = "' OR 1=1 --"
		assert.equal((await select(['number'], { number: injected })).rows.length, 0)
		assert.ok(statements.at(-1).values.includes(injected))
		assert.ok(!statements.at(-1).sql.includes(injected))
		for (const path of ['missing', 'constructor', 'customer..name', 'number.nope']) {
			await rejectsWithoutQuery(() => select([path]), 'invalid-path')
		}
		await rejectsWithoutQuery(() => select(['number', ['number']]), 'invalid-path')
		await rejectsWithoutQuery(() => dao.select(Invalid, ['ambiguous.name']), 'ambiguous-type')
		await rejectsWithoutQuery(() => dao.select(Invalid, ['unknown']), 'unsupported-selection')
	})
	await run('SQL-07', async () => {
		const result = await select(['amount', 'active', 'issuedAt', 'note', 'customer.address.city.country.name'])
		assert.equal(value(result.rows[0]), 12.34)
		assert.equal(value(result.rows[0], 1), true)
		assert.equal(value(result.rows[1], 1), false)
		assert.ok(value(result.rows[0], 2) instanceof Date)
		assert.equal(value(result.rows[2], 2), null)
		assert.equal(value(result.rows[0], 4), 'RECIPE FRANCE')
		const search = { 'customer.address.city.country.name': 'RECIPE FRANCE', number: 'REC-001' }
		assert.deepEqual(ids(await select(['number'], search)), [1])
		assert.equal(await dao.count(Invoice, search), 1)
		assert.equal((await dao.search(Invoice, search)).length, 1)
		setPropertyTransformer(City, 'name', SQL, READ, async value => value === 'Recipe Paris' ? IGNORE : undefined)
		const ignored = await select(['customer.address.city', 'customer.address.city.name'])
		assert.deepEqual(ignored.rows[0].cells[1], { kind: 'unloaded', reason: 'ignored' })
		assert.ok(!Object.hasOwn(value(ignored.rows[0]), 'name'))
		assert.ok(!ignored.rows[0].cells[0].loadedFields.includes('name'))
		assert.deepEqual(ignored.rows[1].cells[1], { kind: 'value', value: undefined })
		assert.ok(Object.hasOwn(value(ignored.rows[1]), 'name'))
		assert.ok(ignored.rows[1].cells[0].loadedFields.includes('name'))
		const cause = new Error('Synthetic conversion failure')
		setPropertyTransformer(City, 'name', SQL, READ, () => { throw cause })
		await assert.rejects(() => select(['customer.address.city.name']), error =>
			error.code === 'conversion' && error.path === 'customer.address.city.name' && error.cause === cause)
		setPropertyTransformer(City, 'name', SQL, READ, value => value)
	})
	await run('SQL-08', async () => {
		const ordering = new Sort(['deliveryAddress.city.name'])
		const all = await select(['number'], {}, ordering)
		assert.equal(all.rows.length, 120)
		const pages = []
		for (const offset of [0, 50, 100]) pages.push(await select(['number'], {}, [ordering, new Limit(50, offset)]))
		assert.deepEqual(pages.map(p => p.rows.length), [50, 50, 20])
		assert.deepEqual(pages.flatMap(ids), ids(all))
		assert.equal(new Set(pages.flatMap(ids)).size, 120)
		assert.equal(await dao.count(Invoice), 120)
		assert.equal((await select(['number'], {}, new Limit(0))).rows.length, 0)
		assert.equal((await select(['number'], {}, new Limit(50, 120))).rows.length, 0)
		assert.deepEqual(ids(await select([], {}, new Limit(2, 0))), [1, 2])
		assert.deepEqual(ids(await select([], {}, [seeds, new Sort(['-number'])])), [4, 3, 2, 1])
		assert.deepEqual(ids(await select([], {}, [seeds, new Sort(['customer'])])), [4, 1, 2, 3])
		assert.deepEqual(ids(await select([], {}, [seeds, new Sort([])])), [1, 2, 3, 4])
		for (const options of [new Limit(-1), new Limit(Infinity), new Limit(1, -1), new Limit(1.5),
			[new Limit(1), new Limit(2)], {}, 'LIMIT 1', new Identifiers([NaN])]) {
			await rejectsWithoutQuery(() => select([], {}, options), 'unsupported-option')
		}
	})
	await run('SQL-09', async () => {
		assert.equal(resolvePropertyPath(Invoice, 'lines.label').targetMultiplicity, 'many')
		assert.equal(new ReflectProperty(Invoice, 'tags').relation.cardinality, 'many-to-many')
		for (const path of ['lines', 'lines.label', 'tags', 'tags.name']) {
			await rejectsWithoutQuery(() => select([path], { id: 2 }), 'multiple-values')
			await rejectsWithoutQuery(() => select([], {}, new Sort([path])), 'multiple-values')
		}
	})
	await run('SQL-10', async () => {
		for (const [search, expected] of [
			[{ 'lines.label': 'Recipe A' }, [1]],
			[{ 'lines.quantity': greater(1) }, [1, 2]],
			[{ 'lines.label': 'Recipe A', 'lines.quantity': 1 }, []],
			[{ 'lines.label': null }, [3]],
			[{ 'tags.name': 'Recipe Red' }, [1, 2]],
			[{ 'tags.name': 'Recipe Blue', 'lines.label': 'Recipe A' }, [1]],
			[{ 'tags.invoices.lines.label': 'Recipe C' }, [1, 2]]
		]) {
			assert.deepEqual(ids(await select(['number'], search, new Limit(50))), expected)
			assert.equal(await dao.count(Invoice, search), expected.length)
		}
		assert.deepEqual(ids(await dao.select(Tag, ['name'], { 'invoices.lines.label': 'Recipe A' })), [1, 2])
	})
	await run('SQL-11', async () => {
		const search = { number: like('REC-00%') }
		assert.equal((await dao.search(Invoice, search, new Limit(2))).length, 2)
		assert.equal(await dao.count(Invoice, search), 9)
		assert.equal(Number((await dao.search(Invoice, { id: 1 }))[0].customerId), 1)
		assert.equal((await dao.search(Invoice, {}, new Limit(0))).length, 120)
		const maintained = new MaintainedMysql(config)
		try {
			assert.equal((await maintained.select(Invoice, ['number'], { id: 1 })).rows.length, 1)
			await original('DROP TABLE IF EXISTS ps_maintenance')
			assert.equal((await maintained.select(Maintenance, ['name'])).rows.length, 0)
			await original('DROP TABLE ps_maintenance')
			assert.equal(await maintained.count(Maintenance), 0)
			await original('DROP TABLE ps_maintenance')
		}
		finally { await maintained.close() }
	})
	await run('SQL-12', async () => {
		const first = statements.length
		const result = await select(['customer.address.city'], { active: true }, new Identifiers([1, 1, 2, 4]))
		assert.deepEqual(ids(result), [1, 4])
		assert.equal(statements.length - first, 1)
		assert.deepEqual(statements.at(-1).values, [1, 1, 2, 4])
		assert.equal((await select(['number'], {}, new Identifiers([]))).rows.length, 0)
	})
	await run('SQL-13', async () => {
		const customer = Object.assign(Object.create(Customer.prototype), { id: 1 })
		assert.deepEqual(ids(await select(['number'], { customer })), [1])
		assert.deepEqual(ids(await select(['number'], { customer: 1 })), [1])
		assert.deepEqual(ids(await select(['number'], { customer: null })), [4])
		const search = { 'customer.address.city.country.name': like('RECIPE FRANCE'), number: 'REC-001' }
		assert.deepEqual(ids(await select(['number'], search)), [1])
		assert.equal(await dao.count(Invoice, search), 1)
		assert.equal(search['customer.address.city.country.name'].value, 'RECIPE FRANCE')
		await rejectsWithoutQuery(() => select([], { customer: {} }), 'conversion')
		await assert.rejects(() => dao.select(Invalid, []), error => error.code === 'ER_NO_SUCH_TABLE')
		const nativeQuery = dao.connection.query
		const cause = new Error('Synthetic driver error')
		dao.connection.query = async () => { throw cause }
		await assert.rejects(() => select(['number']), error => error === cause || error.cause === cause)
		dao.connection.query = nativeQuery
	})
}
finally {
	await dao.close()
	const trace = (await readFile(journal)).subarray(journalStart)
	await writeFile(new URL('mysql-general.log', output), trace)
	cases.push({ id: 'SQL-14', status: trace.includes('SELECT') && trace.includes('ps_invoice')
		&& trace.includes('COUNT(*)') ? 'PASS' : 'FAIL', observation: 'Executed SQL archive; browser linkage NOT_RUN' })
	await writeFile(new URL('sql.json', output), JSON.stringify(statements, (_, value) =>
		typeof value === 'bigint' ? `${value}n` : value, '\t') + '\n')
	await writeFile(new URL('results.json', output), JSON.stringify(cases, null, '\t') + '\n')
}
console.log(JSON.stringify(cases, null, 2))
if (cases.some(result => result.status !== 'PASS')) process.exitCode = 1

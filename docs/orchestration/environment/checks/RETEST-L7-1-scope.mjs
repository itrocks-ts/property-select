import assert            from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve }       from 'node:path'

const require = createRequire(import.meta.url)
const mariadb = require('mariadb')
const app = 'http://127.0.0.1:13981'
const proof = { assertions: [], responses: [], sql: [] }
const check = (name, observed, expected) => {
	proof.assertions.push({ name, observed, expected })
	assert.deepEqual(observed, expected, name)
}
const get = async path => {
	const response = await fetch(app + path)
	const body = await response.json()
	proof.responses.push({ path, status: response.status, body })
	assert.equal(response.status, 200)
	return body
}
const connection = await mariadb.createConnection({ host: '127.0.0.1', port: 13316,
	user: 'root', password: '', database: 'property_select_recipe', dateStrings: true, bigIntAsNumber: true })
try {
	const oracle = 'SELECT * FROM ps_invoice ORDER BY id'
	const roots = await connection.query(oracle)
	proof.sql.push({ sql: oracle, rows: roots })
	check('restored canonical fixture has 120 roots', roots.length, 120)
	const scope = roots.filter(row => row.active === 1)
	const entities = await get('/property-select-invoice/list/json')
	check('entity list identities equal independent database scope',
		entities.map(row => Number(row.id)), scope.map(row => row.id))
	check('scope includes 61 roots', entities.length, 61)
	for (let index = 0; index < scope.length; index ++) {
		const row = scope[index]
		const expected = { active: true, amount: Number(row.amount),
			issuedAt: row.issued_at === null ? null : new Date(row.issued_at).toISOString(), lines: [],
			note: row.note, number: row.number, p0: row.p0, tags: [], id: String(row.id) }
		expected.customerId = row.customer_id === null ? null : String(row.customer_id)
		expected.deliveryAddressId = row.delivery_address_id === null ? null : String(row.delivery_address_id)
		check('complete ordinary entity JSON ' + row.id, entities[index], expected)
	}
	const observation = '/property-select-observation/probe/json'
	const start = (await get(observation)).length
	const ids = [120, 61, 2, 3, 3, 22, 4, 17]
	const visible = await get('/property-select-invoice/list?column=deliveryAddress.city.name&rowIds=' + ids.join(','))
	check('visible identities intersect exact scope and deduplicate', visible.rows.map(row => Number(row.id)),
		scope.filter(row => ids.includes(row.id)).map(row => row.id))
	const trace = (await get(observation)).slice(start)
	check('visible reload executes exactly one query', trace.length, 1)
	check('visible reload binds mandatory scope', trace[0].values[0], 1)
	check('visible reload binds requested identities',
		[...new Set(trace[0].values.slice(1).map(Number))].sort((a, b) => a - b),
		[...new Set(ids)].sort((a, b) => a - b))
	check('visible reload SQL has bound scope and identity predicates', /`active` = \?/.test(trace[0].sql)
		&& / IN \(\?/.test(trace[0].sql), true)
	proof.executedProjection = trace
	proof.status = 'PASS'
}
catch (error) {
	proof.status = 'FAIL'
	proof.failure = error.stack
	throw error
}
finally {
	await connection.end()
	const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-L7-1')
	writeFileSync(output + '/scope-independent.json',
		JSON.stringify(proof, (_key, value) => typeof value === 'bigint' ? String(value) : value, 2) + '\n')
	console.log(proof.status, proof.assertions.length, 'independent scope/entity assertions')
}

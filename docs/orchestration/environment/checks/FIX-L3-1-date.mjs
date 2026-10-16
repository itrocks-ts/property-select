import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { models } from '../models/load.mjs'

const require = createRequire(import.meta.url)
const { Mysql } = require('@itrocks/mysql')
const { resolvePropertyPath } = require('@itrocks/reflect-path')
const { Identifiers } = require('@itrocks/storage')
const { Invoice } = models
const output = new URL('../../evidence/FIX-L3-1/date-sql.json', import.meta.url)
const journal = '/tmp/showtime-property-select-env/queries.log'
const first = readFileSync(journal).length
const results = { checks: [], statements: [] }
function check(name, actual, expected)
{
	assert.deepEqual(actual, expected, name)
	results.checks.push({ name, expected, observed: actual, status: 'PASS' })
}
const dao = new Mysql({ engine: '@itrocks/mysql', host: '127.0.0.1', port: 13316,
	user: 'root', password: '', database: 'property_select_recipe' })
await dao.connect()
const query = dao.connection.query.bind(dao.connection)
dao.connection.query = async (sql, values) => {
	results.statements.push({ sql, values })
	return query(sql, values)
}
try {
	const selected = await dao.select(Invoice, ['issuedAt'], {}, new Identifiers([1, 2, 3, 4]))
	check('Date projection is scalar', selected.columns, [{ kind: 'scalar', path: 'issuedAt' }])
	check('Original synthetic roots', selected.rows.map(row => row.rootId), [1, 2, 3, 4])
	const dates = selected.rows.map(row => row.cells[0].value)
	check('Date instances and terminal null', dates.map(value => value === null ? null : value instanceof Date),
		[true, true, null, true])
	check('Original date components', dates.map(value => value && [value.getFullYear(), value.getMonth(),
		value.getDate(), value.getHours()]), [[2026, 0, 1, 12], [2026, 0, 2, 12], null, [2026, 0, 4, 12]])
	check('Scalar date target multiplicity', resolvePropertyPath(Invoice, 'issuedAt').targetMultiplicity, 'one')
	const before = results.statements.length
	await assert.rejects(() => dao.select(Invoice, ['issuedAt.getTime']), { code: 'invalid-path' })
	check('Invalid scalar traversal executes no query', results.statements.length, before)
	results.status = 'PASS'
}
finally {
	await dao.connection.end()
	results.journal = readFileSync(journal).subarray(first).toString()
	writeFileSync(output, JSON.stringify(results, null, '\t') + '\n')
}
console.log(JSON.stringify({ status: results.status, checks: results.checks.length }))

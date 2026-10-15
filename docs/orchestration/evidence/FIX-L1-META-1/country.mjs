import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const origin = process.env.PS_METADATA_URL ?? 'http://127.0.0.1:13629'
const records = []
for (const path of ['/country', '/country?offset=0']) {
	const response = await fetch(origin + path)
	const html = await response.text()
	const countries = ['Recipe France', 'Recipe United Kingdom'].filter(name => html.includes(name))
	const record = { countries, path, sha256: createHash('sha256').update(html).digest('hex'), status: response.status }
	records.push(record)
	assert.equal(record.status, 200, path)
	assert.deepEqual(countries, ['Recipe France', 'Recipe United Kingdom'], path)
}
const invalid = await fetch(origin + '/country?offset=invalid')
assert.equal(invalid.status, 500, 'An invalid explicit offset must still fail strict validation')
const probeResponse = await fetch(origin + '/property-select-probe/probe/json')
assert.equal(probeResponse.status, 200)
const probe = await probeResponse.json()
assert.deepEqual(probe, { attempts: [], constructions: 0, reads: 0 })
console.log(JSON.stringify({ invalidOffsetStatus: invalid.status, origin, probe, records, status: 'PASS' }, null, 2))

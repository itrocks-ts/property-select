import assert from 'node:assert/strict'

const origin = process.env.PS_METADATA_URL ?? 'http://127.0.0.1:13619'
const bare = await fetch(origin + '/country')
const explicit = await fetch(origin + '/country?offset=0')
const html = await explicit.text()
console.log(JSON.stringify({ bare: { status: bare.status, body: await bare.json() },
	explicit: { status: explicit.status, syntheticCountries: html.includes('Recipe France') }, origin }, null, 2))
assert.equal(bare.status, 200, 'The country control route must work without an explicit pagination parameter')

import assert from 'node:assert/strict'

const origin = process.env.PS_METADATA_URL
const observations = []
for (const value of ['name', '']) {
    const url = origin + '/country?' + new URLSearchParams({ columns: value })
    const response = await fetch(url)
    const html = await response.text()
    observations.push({ url, expected: 204, status: response.status, bodyBytes: Buffer.byteLength(html) })
}
console.log(JSON.stringify(observations, null, 2))
for (const observation of observations) {
    assert.equal(observation.status, 204, 'Explicit column saves must acknowledge without rendering')
}

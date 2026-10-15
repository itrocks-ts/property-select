import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const directory = process.env.PS_ENV_DIRECTORY
const owner = JSON.parse(await readFile(`${directory}/standalone.owner.json`, 'utf8'))
const pid = Number(await readFile(`${directory}/standalone.pid`, 'utf8'))
assert.equal(pid, owner.pid)
const args = (await readFile(`/proc/${pid}/cmdline`, 'utf8')).split('\0').filter(Boolean)
assert.deepEqual(args, owner.args)
assert.ok(args.includes(`--ps-token=${owner.token}`))
const response = await fetch(process.env.PS_UI_URL)
assert.equal(response.status, 200)
assert.ok((await response.text()).includes('id="selector"'))
console.log(JSON.stringify({ pid, owner, status: 'PASS', url: process.env.PS_UI_URL }, null, 2))

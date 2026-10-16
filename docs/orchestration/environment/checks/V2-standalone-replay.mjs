// Replay the earlier independent verifier on current public outputs with isolated resource destinations.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const owner = resolve('node_modules/@itrocks/property-select')
const sourcePath = `${owner}/docs/orchestration/environment/checks/V2-UI.mjs`
const source = readFileSync(sourcePath, 'utf8')
const output = `${owner}/docs/orchestration/evidence/V2/standalone-replay`
const checkpoint = execFileSync('git', ['-C', owner, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const version = JSON.parse(readFileSync(`${owner}/package.json`)).version
const adapted = source.replaceAll('/evidence/V2-UI', '/evidence/V2/standalone-replay')
	.replaceAll('/tmp/property-select-V2-UI', '/tmp/property-select-V2-standalone')
	.replaceAll('13721', '13831')
	.replaceAll('b274d101e2d250a9318b312f0324a24a00519eb4', checkpoint)
	.replaceAll("version: '0.2.1'", `version: '${version}'`)
mkdirSync(output, { recursive: true })
const executable = '/tmp/property-select-V2-standalone-replay.mjs'
writeFileSync(executable, adapted)
writeFileSync(`${output}/source.json`, JSON.stringify({
	sourcePath, sourceSha256: createHash('sha256').update(source).digest('hex'),
	executable, executedSha256: createHash('sha256').update(adapted).digest('hex'),
	changes: ['evidence destination', 'owned directory', 'port 13831', 'current checkpoint/version metadata']
}, null, '\t') + '\n')
execFileSync(process.execPath, [executable], { stdio: 'inherit' })

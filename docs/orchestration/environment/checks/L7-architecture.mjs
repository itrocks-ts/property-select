import { execFileSync }  from 'node:child_process'
import { mkdirSync }     from 'node:fs'
import { readFileSync }  from 'node:fs'
import { readdirSync }   from 'node:fs'
import { writeFileSync } from 'node:fs'
import { dirname }       from 'node:path'
import { resolve }       from 'node:path'

const root = resolve('node_modules/@itrocks')
const output = resolve(process.env.PS_L7_ARCHITECTURE_OUTPUT
	|| root + '/property-select/docs/orchestration/evidence/L7')
const owners = ['framework', 'home', 'list', 'property-select', 'table']
const proof = { owners: [], cycles: [], imports: [], missing: [], privateImports: [], selectorHostImports: [] }
const manifest = owner => JSON.parse(readFileSync(`${root}/${owner}/package.json`))
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
	entry.isDirectory() ? files(directory + '/' + entry.name) : [directory + '/' + entry.name])
const graph = new Map(readdirSync(root).filter(owner => {
	try { manifest(owner); return true }
	catch { return false }
}).map(owner => [owner, Object.keys(manifest(owner).dependencies || {}).filter(name => name.startsWith('@itrocks/'))
	.map(name => name.slice(9))]))
const seen = new Set()
function cycle(owner, branch = [])
{
	if (branch.includes(owner)) { proof.cycles.push([...branch, owner]); return }
	if (seen.has(owner)) return
	for (const dependency of graph.get(owner) || []) cycle(dependency, [...branch, owner])
	seen.add(owner)
}
for (const owner of owners) {
	const directory = root + '/' + owner
	const meta = manifest(owner)
	proof.owners.push({ owner, version: meta.version,
		sha: execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() })
	cycle(owner)
	const delivered = files(directory).filter(file => file.endsWith('.js')
		&& (file.startsWith(directory + '/cjs/') || dirname(file) === directory
			|| (owner === 'property-select' && file.startsWith(directory + '/front/'))))
	for (const file of delivered) {
		const text = readFileSync(file, 'utf8')
		for (const match of text.matchAll(/(?:from\s+|import\s*\(\s*|require\(\s*)['"]([^'"]+)['"]/g)) {
			const specifier = match[1]
			let dependency, entry
			if (specifier.startsWith('@itrocks/')) {
				dependency = specifier.split('/')[1]
				entry = specifier.split('/').slice(2).join('/')
			}
			else if (specifier.startsWith('../')) {
				const target = resolve(dirname(file), specifier)
				if (!target.startsWith(root + '/') || target.startsWith(directory + '/')) continue
				const relative = target.slice(root.length + 1).split('/')
				dependency = relative.shift()
				entry = relative.join('/')
			}
			else continue
			const record = { owner, file: file.slice(directory.length + 1), specifier, dependency, entry }
			proof.imports.push(record)
			if (!meta.dependencies?.['@itrocks/' + dependency]) proof.missing.push(record)
			const exports = manifest(dependency).exports
			if (exports && typeof exports === 'object'
				&& (entry ? !exports['./' + entry] : Object.keys(exports).some(key => key.startsWith('.')) && !exports['.']))
				proof.privateImports.push(record)
			if (owner === 'property-select' && ['framework', 'home', 'list', 'mysql', 'reflect', 'storage',
				'sql-build', 'table'].includes(dependency)) proof.selectorHostImports.push(record)
		}
	}
}
proof.missingOwners = [...new Set(proof.missing.map(item => `${item.owner}:@itrocks/${item.dependency}`))].sort()
proof.status = proof.cycles.length || proof.privateImports.length || proof.missing.length
	|| proof.selectorHostImports.length ? 'FAIL' : 'PASS'
mkdirSync(output, { recursive: true })
writeFileSync(output + '/architecture.json', JSON.stringify(proof, null, 2) + '\n')
console.log(proof.status, proof.missingOwners, 'cycles', proof.cycles.length, 'private', proof.privateImports.length)
if (proof.status !== 'PASS') process.exitCode = 1

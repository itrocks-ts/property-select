import assert             from 'node:assert/strict'
import { existsSync }     from 'node:fs'
import { mkdirSync }      from 'node:fs'
import { readFileSync }   from 'node:fs'
import { readdirSync }    from 'node:fs'
import { writeFileSync }  from 'node:fs'
import { builtinModules } from 'node:module'
import { createRequire }  from 'node:module'
import { dirname }        from 'node:path'
import { resolve }        from 'node:path'

const require = createRequire(import.meta.url)
const acorn = require('acorn')
const root = resolve('node_modules/@itrocks')
const output = root + '/property-select/docs/orchestration/evidence/RETEST-V7-1/imports/imports-independent.json'
const owners = ['property-select', 'list', 'table', 'home', 'framework']
const manifest = name => JSON.parse(readFileSync(`${root}/${name}/package.json`, 'utf8'))
const entries = value => typeof value === 'string' ? [value] : Object.values(value ?? {}).flatMap(entries)
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
	entry.isDirectory() ? files(directory + '/' + entry.name) : [directory + '/' + entry.name])
const proof = { assertions: [], imports: [], exports: [], cycles: [] }
const check = (name, actual) => {
	proof.assertions.push({ name, observed: actual, expected: true })
	assert.equal(actual, true, name)
}
try {
	const graph = new Map()
	for (const name of readdirSync(root)) {
		if (!existsSync(`${root}/${name}/package.json`)) continue
		graph.set(name, Object.keys(manifest(name).dependencies ?? {}).filter(name => name.startsWith('@itrocks/'))
			.map(name => name.slice(9)))
	}
	const visit = (name, branch = []) => {
		if (branch.includes(name)) {
			proof.cycles.push([...branch, name])
			return
		}
		for (const dependency of graph.get(name) ?? []) visit(dependency, [...branch, name])
	}
	for (const owner of owners) {
		visit(owner)
		const directory = `${root}/${owner}`
		const meta = manifest(owner)
		for (const entry of entries(meta.exports)) {
			proof.exports.push({ owner, entry })
			check('export target exists: ' + owner + '/' + entry, existsSync(resolve(directory, entry)))
		}
		const runtime = files(directory).filter(file => file.endsWith('.js')
			&& (file.startsWith(directory + '/cjs/') || dirname(file) === directory
				|| (owner === 'property-select' && file.startsWith(directory + '/front/'))))
		for (const file of runtime) {
			const source = acorn.parse(readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' })
			const imports = []
			const walk = node => {
				if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression']
					.includes(node.type)
					&& node.source?.value) imports.push(node.source.value)
				if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'require'
					&& typeof node.arguments[0]?.value === 'string') imports.push(node.arguments[0].value)
				for (const value of Object.values(node)) {
					if (Array.isArray(value)) for (const child of value) { if (child?.type) walk(child) }
					else if (value?.type) walk(value)
				}
			}
			walk(source)
			for (const specifier of imports) {
				if (specifier.startsWith('node:') || builtinModules.includes(specifier)) continue
				let dependency, entry = ''
				if (specifier.startsWith('.')) {
					const target = resolve(dirname(file), specifier)
					if (target.startsWith(directory + '/')) continue
					check('relative import remains under installed package root', target.startsWith(root + '/'))
					const segments = target.slice(root.length + 1).split('/')
					dependency = '@itrocks/' + segments.shift()
					entry = segments.join('/')
				}
				else {
					dependency = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]
					entry = specifier.slice(dependency.length + 1)
				}
				proof.imports.push({ owner, file: file.slice(directory.length + 1), specifier, dependency, entry })
				check('direct runtime declaration: ' + owner + ':' + dependency, !!meta.dependencies?.[dependency])
				if (!dependency.startsWith('@itrocks/')) continue
				const target = manifest(dependency.slice(9))
				if (target.exports && typeof target.exports === 'object') {
					const subpaths = Object.keys(target.exports).filter(key => key.startsWith('.'))
					check('public entry: ' + specifier, !subpaths.length || !!target.exports[entry ? './' + entry : '.'])
				}
				if (owner === 'property-select') check('selector has no host/server runtime',
					!['framework', 'home', 'list', 'table', 'reflect', 'reflect-path', 'mysql',
						'storage', 'sql-build', 'sql-join']
						.includes(dependency.slice(9)))
			}
		}
	}
	check('reachable declared graph is acyclic', proof.cycles.length === 0)
	check('selector public CJS facade works', typeof require('@itrocks/property-select').PropertySelect === 'function')
	check('all three corrected list imports were encountered', ['action', 'action-request', 'route'].every(name =>
		proof.imports.some(item => item.owner === 'list' && item.dependency === '@itrocks/' + name)))
	proof.status = 'PASS'
}
catch (error) {
	proof.status = 'FAIL'
	proof.failure = error.stack
	throw error
}
finally {
	mkdirSync(dirname(output), { recursive: true })
	writeFileSync(output, JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status, proof.assertions.length, 'AST import/export assertions',
		proof.imports.length, 'runtime imports')
}

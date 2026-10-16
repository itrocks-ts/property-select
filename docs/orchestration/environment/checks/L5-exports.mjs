import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('node_modules/@itrocks')
const output = root + '/property-select/docs/orchestration/evidence/L5'
const required = {
	table: ['column-add.js', 'column-add.d.ts', 'column-add.css', 'column-reorder.js', 'column-reorder.d.ts'],
	'property-select': ['property-select.js', 'property-select.d.ts', 'cjs/property-select.js',
		'front/property-select.js', 'front/property-select.d.ts', 'front/property-select.css',
		'front/property-select.html', 'front/pointer-transport.js', 'front/pointer-transport.d.ts'],
	list: ['property-select.js', 'property-select.d.ts', 'selector-state.js', 'cjs/list.js'],
	home: ['right-pane.js', 'right-pane.d.ts', 'right-pane.css', 'cjs/output.js'],
	framework: ['property-select-list.js', 'property-select-list.d.ts', 'property-select-metadata.js',
		'cjs/property-select.js', 'cjs/property-select-actions.js']
}
const records = []
const targets = value => typeof value === 'string' ? [value] : Object.values(value || {}).flatMap(targets)
for (const [owner, files] of Object.entries(required)) {
	const manifest = JSON.parse(readFileSync(root + '/' + owner + '/package.json'))
	const pack = JSON.parse(readFileSync(output + '/' + owner + '-pack.txt'))[0]
	const packed = new Set(pack.files.map(file => file.path))
	const checked = [...new Set([...files, ...targets(manifest.exports).map(path => path.replace(/^\.\//, ''))])]
	for (const path of checked) assert.ok(packed.has(path), owner + ': missing public package file ' + path)
	records.push({ owner, version: manifest.version, files: checked, status: 'PASS' })
}
writeFileSync(output + '/exports.json', JSON.stringify(records, null, 2) + '\n')
console.log('PASS: public exports and required declarations/assets in five package dry runs')

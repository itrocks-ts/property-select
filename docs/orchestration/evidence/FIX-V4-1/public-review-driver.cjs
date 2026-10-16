const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const output = 'node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V4-1'
const result = []
function files(value) { return typeof value === 'string' ? [value] : Object.values(value).flatMap(files) }
for (const name of ['fastify', 'property-select']) {
 const root = path.resolve('node_modules/@itrocks/' + name)
 const manifest = JSON.parse(fs.readFileSync(root + '/package.json'))
 const pack = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', '/tmp/property-select-FIX-V4-1-npm-cache'], { cwd: root, encoding: 'utf8' }))[0]
 const included = new Set(pack.files.map(file => file.path))
 const exports = files(manifest.exports).map(file => ({ file, exists: fs.existsSync(root + '/' + file), included: included.has(file.replace(/^\.\//,'')) }))
 if (exports.some(file => !file.exists || !file.included)) throw new Error('Missing export ' + name)
 result.push({ name, version: manifest.version, publicEntry: require.resolve('@itrocks/' + name, { paths: [process.cwd()] }), exports, files: [...included] })
}
fs.writeFileSync(output + '/public-review.json', JSON.stringify(result, null, 2) + '\n')
console.log('PASS public exports and pack inventories')

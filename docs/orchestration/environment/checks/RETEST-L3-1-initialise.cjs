const { File } = require('@itrocks/class-file')
const { routes } = require('@itrocks/route')
const fixture = require('../list/fixture.cjs')

module.exports.ready = fixture.ready.then(() => {
	const directory = require('node:path').resolve('node_modules/@itrocks/framework/test/fixtures')
	for (const name of ['address', 'city', 'invoice', 'line', 'metadata', 'tag']) {
		const file = `${directory}/${name}.js`
		for (const type of Object.values(require(file))) {
			if (typeof type === 'function') File(file)(type)
		}
	}
	routes.add('/metadata-invoice', '/node_modules/@itrocks/framework/test/fixtures/metadata:MetadataInvoice')
})

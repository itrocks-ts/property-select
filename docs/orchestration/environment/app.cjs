const { mkdirSync } = require('node:fs')
const path = require('node:path')
const directory = process.argv[2]?.slice('--ps-environment='.length)
const port = Number(process.argv[3]?.slice('--ps-port='.length))
if (!process.argv[2]?.startsWith('--ps-environment=') || !process.argv[3]?.startsWith('--ps-port=')) {
	throw new Error('Launch through control.mjs app')
}
const configuration = require('@itrocks/config')
const scan = configuration.scanConfigFiles

// Override before framework binding constructs the data source or starts HTTP.
configuration.scanConfigFiles = async (...args) => {
	await scan(...args)
	const config = configuration.config
	config.access = { free: '*' }
	config.dataSource = {
		engine: '@itrocks/mysql', host: '127.0.0.1', port: Number(process.env.PS_DATABASE_PORT || 13316),
		user: 'root', password: '', database: 'property_select_recipe'
	}
	config.server = { ...config.server, host: '127.0.0.1', port }
	const sessionPath = path.join(directory, 'sessions')
	config.session = {
		path: path.relative(require('@itrocks/app-dir').appDir, sessionPath), cookie: 'property_select_recipe'
	}
	delete config.secret
	delete config.smtp
	mkdirSync(sessionPath, { recursive: true })
}
require('@itrocks/framework')

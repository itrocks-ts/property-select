const { mkdirSync, writeFileSync } = require('node:fs')
const path = require('node:path')
const directory = process.env.PS_ENV_DIRECTORY || '/tmp/showtime-property-select-env'
const configuration = require('@itrocks/config')
const scan = configuration.scanConfigFiles
writeFileSync(path.join(directory, 'app.pid'), String(process.pid))

// Override before framework binding constructs the data source or starts HTTP.
configuration.scanConfigFiles = async (...args) => {
	await scan(...args)
	const config = configuration.config
	config.access = { free: '*' }
	config.dataSource = {
		engine: '@itrocks/mysql', host: '127.0.0.1', port: Number(process.env.PS_DATABASE_PORT || 13316),
		user: 'root', password: '', database: 'property_select_recipe'
	}
	config.server = { ...config.server, host: '127.0.0.1', port: Number(process.env.PS_APP_PORT || 13317) }
	const sessionPath = path.join(directory, 'sessions')
	config.session = {
		path: path.relative(require('@itrocks/app-dir').appDir, sessionPath), cookie: 'property_select_recipe'
	}
	delete config.secret
	delete config.smtp
	mkdirSync(sessionPath, { recursive: true })
}
require('@itrocks/framework')

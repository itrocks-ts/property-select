import assert                      from 'node:assert/strict'
import { Mysql }                   from '@itrocks/mysql'
import { Mysql as MaintainedMysql } from '@itrocks/mysql-maintainer'
import { DataSource }              from '@itrocks/storage'
import { SelectionError }          from '@itrocks/storage'

class Invoice
{
}

for (const Adapter of [Mysql, MaintainedMysql]) {
	const adapter = new Adapter({ database: 'unused', host: 'unused', password: '', user: 'unused' })
	assert.ok(adapter instanceof DataSource)
	assert.equal(adapter.select, DataSource.prototype.select)
	let connections = 0
	let searches = 0
	adapter.connect = async () => { connections ++; throw new Error('Unexpected connection') }
	adapter.search = async () => { searches ++; throw new Error('Unexpected search fallback') }
	await assert.rejects(adapter.select(Invoice, ['number']), error =>
		(error instanceof SelectionError) && (error.code === 'unsupported-selection')
	)
	assert.equal(connections, 0)
	assert.equal(searches, 0)
	console.log(`${Adapter.name}: unsupported selection; zero connections; zero searches`)
}

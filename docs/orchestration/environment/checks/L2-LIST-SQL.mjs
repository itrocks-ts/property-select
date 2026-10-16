import { readFile, writeFile } from 'node:fs/promises'

// Replay the unchanged independent assertions; redirect only evidence and raw archive paths.
const driver = new URL('./VSQL.mjs', import.meta.url)
const source = (await readFile(driver, 'utf8'))
	.replace('../models/load.mjs', new URL('../models/load.mjs', driver).href)
	.replaceAll('import.meta.url', JSON.stringify(driver.href))
	.replace("../../evidence/VSQL/", "../../evidence/L2-LIST/sql-regression/")
	.replaceAll('/tmp/property-select/VSQL', '/tmp/property-select/L2-LIST-VSQL')
await writeFile('/tmp/L2-LIST-VSQL.mjs', source)
await import('file:///tmp/L2-LIST-VSQL.mjs')

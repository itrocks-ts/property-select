# Independent P04 evidence

## Documentation and preservation checks

The [checker source](checker-source.txt) was written independently for P04; it does not import or invoke the P03
checker. Reproduce from the application root using the installed Python interpreter:

```bash
python3 node_modules/@itrocks/property-select/docs/orchestration/evidence/P04/checker-source.txt
git -C node_modules/@itrocks/property-select diff --check
```

Its checks supplement the semantic source comparison in [the review report](../../reports/P04.md).
Exact execution output is stored in [checker-output.txt](checker-output.txt). All product case verdicts remain NOT_RUN.

## Existing session persistence defect

Public `@itrocks/fastify-file-session-store` version `0.3.0`, owner checkpoint
`338cd8de5e109ab5539b604cf545a4f733d458f6`. Run from showtime with installed Node; this probe writes only a fresh
synthetic temporary directory. It neither starts services nor reads user sessions.

```js
const { FileStore } = require('@itrocks/fastify-file-session-store')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
;(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'property-select-p04-store-'))
  const store = new FileStore(directory)
  const id = 'synthetic-p04-session'
  const state = { propertySelect: { invoice: { revision: 1, state: { query: 'first' } } } }
  const save = () => new Promise((resolve, reject) => store.set(id, state, e => e ? reject(e) : resolve()))
  await save()
  state.propertySelect.invoice.revision = 2
  state.propertySelect.invoice.state.query = 'second'
  await save()
  const disk = JSON.parse(await fs.readFile(path.join(directory, id), 'utf8'))
  console.log({ directory, expectedRevision: 2, persistedRevision: disk.propertySelect.invoice.revision })
})().catch(e => { console.error(e); process.exitCode = 1 })
```

Observed on 15 October 2026 with Node `v24.0.1`:

```text
directory: /tmp/property-select-p04-store-BC4lgN
expectedRevision: 2
persistedRevision: 1
defectReproduced: true
```

The existing `FileStore.set()` caches the live object and compares later serialisation against that same mutated
object, returning before the write. L4 must fix this in its owner and independently test through V4. This observation
is a reproduced baseline defect, not a passing product persistence test or a code correction delivered by P04.

## Capability and boundary inspection

Installed `tsc`, `tsx` and `sass` targets exist. Owner manifests expose the commands recorded in the cards; selector
build/tests and new functional drivers remain explicit future deliverables. The prior independent environment report
and touch input evidence remain the capability proof. No browser or database gate was rerun during this plan review.

Fresh Git checks preserve showtime's original HEAD, both staged blob hashes and absent working files. Twelve other
inspected owner repositories are clean. Only property-select documentation and its patch version change.

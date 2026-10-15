# Maintainer multi-type regression

The query context extension exposed two existing assumptions: `result ||= await update(...)` skipped later types
after the first modification, and link-table detection required exactly two context entries.

Reproducer: the second test in `mysql-maintainer/test/property-select.test.mjs` supplies Root, Related and Other,
with a requested conventional Root/Related link table. Each model update reports a modification.

```bash
node --test --test-isolation=none "$PWD/node_modules/@itrocks/mysql-maintainer/test/property-select.test.mjs"
```

Against maintainer `d760db53a42183e8244414f0c5b7b90e3af48cc2` / `0.4.0`, the new test fails (exit 1): expected
visited `[Root, Related, Other]`, observed `[Root]`. The existing context-isolation test passes. The subsequent link
assertion requires one Root/Related creation within that three-model context.

Correction `89ff36a3b1a41a60b040c0ed553f867bec0f6086` / `0.4.1` evaluates every update, accumulates its result,
and checks pairs against the requested link table. Both focused tests pass, as do the existing maintainer suite and
fresh S07 real database assertions, including missing-table recovery through select/count.
See [commands](commands.json), [focused output](maintainer-projection.txt), [suite](maintainer-test.txt) and
[database output](database-projection.txt). Independent VSQL remains the next mandatory gate.

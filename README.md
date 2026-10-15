[![npm version](https://img.shields.io/npm/v/@itrocks/property-select?logo=npm)](https://www.npmjs.org/package/@itrocks/property-select)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/property-select)](https://www.npmjs.org/package/@itrocks/property-select)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/property-select?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/property-select)
[![issues](https://img.shields.io/github/issues/itrocks-ts/property-select)](https://github.com/itrocks-ts/property-select/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# property-select

Interactive property selection through business object relationships.

The selector lets users browse related objects from a business root and search for properties by name or label.
Users can select a field or a related object itself, identified by its full path, such as `customer.address.city`.
Host components receive selection and drag intentions and decide how to use the chosen property.

Implementation is still to come.

Read the [functional specifications](https://github.com/itrocks-ts/property-select/blob/HEAD/docs/it-rocks-selecteur-relationnel-specifications.md), written in French.
They cover navigation, search, suggestions, session state, desktop and touch interactions,
and the first integration with table column selection.

## Licence

Copyright (C) 2026, Baptiste Pillot <baptiste@pillot.fr>.

This package is licensed under the GNU Lesser General Public License, version 3 or any later version
(`LGPL-3.0-or-later`). See [LICENSE](LICENSE) for the LGPL terms and [COPYING](COPYING) for the incorporated GPL terms.


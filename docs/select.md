# Sélection de données par chemins de propriétés

Ce document précise DEP-11 des [contrats d’intégration](dependencies.md).
La sélection décrite ici reste à implémenter et à vérifier dans les modules propriétaires.
Elle est nécessaire aux colonnes relationnelles de `list`, pas à la recherche de métadonnées du sélecteur.

## 1. Contrat et responsabilités

Ajouter `select()` au contrat `DataSource` de
[`@itrocks/storage`](https://github.com/itrocks-ts/storage), puis l’implémenter dans
[`@itrocks/mysql`](https://github.com/itrocks-ts/mysql), classe `Mysql`.
`list` appelle `dataSource().select()` et ne construit ni adaptateur MySQL, ni requête SQL.
`property-select` reste indépendant du stockage et ne lit aucune valeur métier pendant sa navigation ou sa recherche.

Le contrat prend une classe racine, les chemins de propriétés à retourner, les critères de recherche et les options
utiles de liste. Les chemins interviennent aussi bien dans les résultats demandés que dans les critères.
La signature TypeScript, les types de projection et de résultat, leurs exports et leurs valeurs par défaut sont
stabilisés par la tâche de contrats, avant les consommateurs. Une absence de `select()` ne doit pas être masquée
par une implémentation de secours qui appelle `search()` et parcourt tous les objets en mémoire.

Répartition obligatoire :

- `storage` possède le contrat neutre de sélection et le résultat de projection, distinct du contrat de recherche
  d’entités complètes. Il n’importe ni MySQL ni les types SQL d’un builder concret.
- `Mysql` utilise le builder, exécute la requête paramétrée et convertit les résultats selon les conventions de
  stockage.
  Il ne réimplémente pas la construction de jointures et de chemins dans `select()`.
- [`@itrocks/sql-build`](https://github.com/itrocks-ts/sql-build) possède la construction de la sélection, des critères,
  des alias et des options SQL nécessaires. Il réutilise
  [`@itrocks/sql-join`](https://github.com/itrocks-ts/sql-join) pour les jointures partagées.
- `reflect-path` et `reflect` possèdent la résolution des chemins, des propriétés et des types. Les faits de stockage
  et de schéma proviennent de leurs propriétaires et des liaisons du framework, sans nouvelle introspection parallèle.
- `list` associe chaque chemin aux métadonnées et à la valeur retournée, puis utilise les mécanismes existants de rendu.
  Les représentations d’objets ne sont pas codées dans le générateur SQL.

`Mysql.select()` doit réellement appeler l’API de `sql-build`. Déclarer les dépendances directes correspondant aux
imports publics utilisés et compléter les liaisons du framework conformément aux conventions existantes.
Réutiliser les ports déjà présents ; une injection supplémentaire ne se justifie que pour une dépendance de couche
supérieure ou interchangeable, pas pour dissimuler un import stable sans cycle.

## 2. Comportements requis pour la phase 1

Le même mécanisme de projection doit couvrir :

- une propriété directe, par exemple `number` ;
- un chemin terminal à plusieurs niveaux, par exemple `customer.address.city.name` ;
- un objet lié choisi comme valeur, par exemple `customer.address.city` ;
- plusieurs colonnes utilisant un préfixe commun ou conduisant au même type par des chemins différents ;
- un critère portant sur un chemin absent de la projection, avec les jointures correspondantes ;
- une projection d’objet et une projection terminale sous cet objet dans la même requête.

Un objet sélectionné reste une valeur objet identifiable du type attendu, exploitable par le rendu représentatif
existant. Retourner seulement sa clé étrangère ou une chaîne formatée ne satisfait pas ce contrat.
Prévoir les données nécessaires à sa représentation et leur conversion sans déclencher une lecture par cellule.
Le plan fixe une forme de résultat associant sans ambiguïté colonnes, chemins, valeurs et identité de la ligne racine.
Ne pas faire passer des lignes de projection pour des entités complètes ni ajouter arbitrairement des propriétés
nommées avec des points aux objets métier. Une hydratation partielle éventuelle doit être explicitement définie.

La sélection doit préserver les lignes dont une relation optionnelle est absente quand les critères ne les excluent
pas. Le contrat distingue objet absent, valeur terminale `null`, propriété invalide et erreur de conversion.
Les alias doivent être déterministes et éviter les collisions entre chemins, identifiants et colonnes techniques.
Réutiliser les conversions `SQL`/`READ` et les métadonnées de propriété/type, y compris pour les propriétés imbriquées.

Les critères sont résolus sur les mêmes chemins et le même graphe de jointures que la projection, avec valeurs liées
par paramètres et noms de colonnes issus des métadonnées validées. Un chemin invalide produit une erreur explicite,
pas une colonne vide ou une concaténation de chemin utilisateur dans le SQL.
Préserver le comportement des critères et fonctions de recherche déjà supportés, sans interprétation concurrente
entre `select()`, `search()` et `count()`. Appliquer les conversions des valeurs de critères selon la propriété
finale du chemin et les conventions de stockage, plutôt que traiter le chemin complet comme un champ de la racine.

Prendre en compte tri, limite, décalage et chargement progressif requis par `list`. Si le tri est relationnel,
sa résolution et les jointures appartiennent au builder. Le nombre total utilisé par la liste doit appliquer les
mêmes critères et la même sémantique de lignes ; prévoir les évolutions nécessaires de `count()` chez ses propriétaires.
Tester la stabilité du tri et de la pagination, ainsi que le chargement des colonnes ajoutées pour les lignes visibles.

Les relations inverses et N-N restent navigables selon les spécifications. Le plan distingue leur résolution dans les
chemins de la politique de rendu lorsqu’un chemin produit plusieurs valeurs. Le support initial simplifié ne doit
ni choisir silencieusement la première valeur, ni multiplier les lignes ou fausser le compte sans décision explicite.
Conserver les exclusions de la section 1.3 : agrégations, valeurs multiples et tableaux imbriqués ne sont pas ajoutés
au sélecteur. Documenter et tester la limite de l’intégration pour un chemin multiple ; ne pas déclarer ce cas pris en
charge tant que le tableau ne définit pas sa sémantique. Les colonnes objets et les chemins descendants simples
restent des exigences effectives, pas des limites reportées à une phase ultérieure.

## 3. Points de départ TypeScript constatés

Chemins préfixés par le nom du package, à examiner lors de l’audit :

- `storage/src/data-source.ts` : `DataSource.search()` retourne des entités ; aucun contrat `select()` n’est présent.
  Examiner les autres implémentations et faux `DataSource` impactés avant de modifier cette classe abstraite.
- `mysql/src/mysql.ts` : `search()`, `count()` et leurs helpers utilisent les propriétés et critères de la racine.
  La projection relationnelle nécessite une nouvelle opération ; préserver les contrats existants.
- `sql-build/src/select.ts`, `columns.ts`, `where.ts` : construction existante avec un objet `Joins` partagé.
  `Select.build()` retourne `SqlQuery` avec `sql` et `values` ; réutiliser ce contrat d’exécution paramétrée.
- `sql-build/src/column-reference.ts` : un chemin de relation est refusé à la place d’une colonne scalaire.
  L’expansion d’une colonne objet et sa reconstruction ne sont donc pas acquises par la seule prise en charge des
  points.
- `sql-join/src/joins.ts` et `framework/src/sql-join-dependencies.ts` : jointures et résolution des métadonnées.
- `framework/src/dependencies.ts` : liaisons existantes de `mysql`, `sql-build` et `sql-join`.
- `list/src/list.ts`, `columns.ts`, `filter.ts`, `sort.ts`, `feed.ts` et `feed.html` : lecture des données, métadonnées
  des colonnes, critères, options de pagination, lignes supplémentaires et rendu à adapter au résultat projeté.

Ces chemins sont des points de lecture, pas des imports privés autorisés entre packages.

## 4. Référence PHP dans `../boust`

La référence locale fournie est `../boust/itrocks/framework`, relativement à l’application `showtime`.
La consulter en lecture seule, après ses instructions applicables ; elle ne devient pas une dépendance d’exécution.
L’audit conserve dans son rapport la correspondance des mécanismes PHP/TypeScript et les adaptations retenues,
afin que les tâches suivantes ne dépendent pas d’une conversation ou d’un accès permanent à cette application.

Mécanismes repérés dans ce dépôt :

- `dao/sql/Link.php`, méthode `select()` : classe racine, liste de chemins, filtres, options, préparation de requête,
  exécution et retour de données de liste dont les cellules peuvent contenir des objets.
- `dao/sql/Select.php`, méthodes `prepareQuery()`, `prepareFetch()` et `resultToRow()` : passage au builder,
  correspondance entre colonnes SQL et chemins, puis reconstruction des objets projetés et de leurs identifiants.
- `sql/builder/Select.php` : partage des jointures entre colonnes, tables et critères.
- `sql/builder/Columns.php`, notamment `buildObjectColumns()` : expansion des colonnes objets avec alias par chemin
  et propriétés, ainsi que l’identifiant nécessaire à la reconstruction.
- `sql/builder/Where.php`, `sql/join/Joins.php` et `sql/join/Join_Test.php` : critères par chemins et jointures.
- `reflection/Reflection_Property.php` : constructeur résolvant un chemin depuis sa classe racine jusqu’à la propriété
  et son type final, point de comparaison avec `reflect-path`.
- `tools/List_Data.php` et `tools/Default_List_Data.php` : séparation des métadonnées de colonnes et des valeurs par
  ligne.
- `dao/mysql/tests/Select_Test.php` et `sql/builder/Select_Test.php` : scénarios à étudier pour les tests TypeScript.

Conserver la chaîne fonctionnelle projection par chemins → requête construite → exécution → valeurs typées par colonne.
Une version simplifiée peut réduire les options avancées du PHP, sans copier son architecture monolithique ni imposer
ses classes, sa syntaxe d’alias ou toutes ses optimisations. Justifier les adaptations aux contrats TypeScript
existants.
Ne pas transposer automatiquement ses mécanismes de double passe, d’agrégation ou de polymorphisme hors besoin de phase
1.

## 5. Sous-tâches et validations obligatoires

DEP-11 fait partie de la chaîne de développement et de la matrice de [validation](validation.md).
Prévoir successivement, avant les premières colonnes relationnelles réelles :

1. Audit comparatif PHP/TypeScript et contrat de projection neutre, résultat, options, conversions et limites.
2. Extension de `reflect-path`, `sql-join` et `sql-build` selon les capacités manquantes, avec tests unitaires de
   résolution, de jointures, d’alias, de projection d’objets et de critères portant sur d’autres chemins.
3. Ajout de `DataSource.select()` et de `Mysql.select()`, liaisons et tests de contrat ; adapter les implémentations
   et doubles de test concernés et vérifier la compatibilité de `search()` et `count()`.
4. Vérification indépendante sur une base MySQL/MariaDB de test isolée avec données synthétiques, requêtes réellement
   exécutées, objets reconstruits et conversions contrôlées. Des tests de SQL attendu ou un pilote simulé ne suffisent
   pas.
5. Intégration de `list`, tests de filtres, tri, compte, pagination et chargement progressif, puis vérification
   navigateur
   indépendante des valeurs et du rendu des colonnes objets et terminales imbriquées, après rechargement également.

Calibrer contrats, construction SQL, hydratation, intégration transversale et leur vérification au minimum en
`gpt-6.1-sol` / `high`. Évaluer explicitement `gpt-6-astra` / `high` pour la conception de la projection objet,
sa reconstruction et la cohérence des jointures avec critères, compte et pagination, selon la section 3 du
[prompt d’orchestration](itrocks-property-select-prompt-orchestrateur.md#3-calibrage-des-sous-tâches).
Les ajustements mécaniques sur contrats stabilisés peuvent suivre le calibrage courant du prompt.
Ces tâches et leurs corrections doivent être terminées avant la recette d’ajout de colonnes avec données réelles.

Couvrir aussi relations absentes, résultats vides, alias homonymes, critères sur un chemin non affiché, conversions,
tri/pagination cohérents avec le compte et absence de requête par cellule. Mesurer les lectures sur un jeu de données
représentatif ; ne pas charger tout le graphe puis appliquer projection, filtres ou pagination en mémoire.
Tester les annulations d’aperçu et réponses tardives dans l’intégration sans confondre l’annulation du geste avec
la possibilité technique d’interrompre une requête déjà en cours.

À chaque étape, lire le handbook et les conventions applicables du package modifié, puis contrôler le diff sous
l’angle SOLID : responsabilité unique, contrats limités aux besoins, substitution des implémentations de `DataSource`,
inversion des dépendances aux frontières et réutilisation des abstractions existantes.
La revue indépendante vérifie ces points et l’absence de SQL ou d’hydratation recopiés dans `list` ou `property-select`.

# Dépendances et contrats d’intégration de `@itrocks/property-select`

Ce document définit l’architecture hexagonale à réaliser pour la phase 1 des
[spécifications fonctionnelles](it-rocks-selecteur-relationnel-specifications.md).
Il est une entrée obligatoire de l’audit, du plan et des fiches qui touchent aux contrats ci-dessous.
Le package ne contient pas encore d’implémentation ; les ports décrits ici sont des exigences de conception,
pas des exports disponibles. Le plan stabilisera leurs signatures après inspection des modules propriétaires.

## 1. Frontière du sélecteur

**DEP-01.** `property-select` possède la navigation par chemins, le fil d’Ariane, la liste des propriétés,
la reconnaissance du geste source, la recherche bornée, la fusion des suggestions et la validation de son état local.
Il présente les métadonnées fournies et émet des intentions. Ces comportements doivent fonctionner avec un faux
consommateur et un fournisseur statique, sans démarrer it.rocks.

Il délègue :

- la réflexion des classes, propriétés, types et chemins ainsi que les faits sur les relations ;
- l’accès aux métadonnées autorisées, leur transport et les conventions de libellés et d’ordre métier ;
- l’application d’un choix : colonnes, doublons, focus visuel, aperçu avec données et persistance du tableau ;
- le calcul des cibles de dépôt, l’insertion, le déplacement et le défilement du tableau ;
- le volet de l’application, son implantation, son ouverture et son adaptation à la taille de l’écran ;
- le stockage de session, l’identité de l’utilisateur, les routes et les décisions d’activation du composant.

Le sélecteur ne contient ni requête de données métier, ni moteur SQL, ni résolution de schéma propre à it.rocks,
ni import du framework, de `list`, de `table` ou de `home`.
Il peut avoir une partie serveur indépendante pour servir ses contrats génériques ; les actions, routes et
adaptations it.rocks restent à la frontière d’intégration. Le navigateur ne charge aucune bibliothèque serveur.

## 2. Propriétaires et sens des dépendances

**DEP-02.** Les dépendances npm déclarent les imports réels. Les ports décrivent les comportements fournis par
l’hôte ; ils ne rendent pas automatiquement leurs implémentations obligatoires dans `property-select`.

- [`@itrocks/reflect`](https://github.com/itrocks-ts/reflect) et
  [`@itrocks/reflect-path`](https://github.com/itrocks-ts/reflect-path) possèdent la réflexion et la traversée typée.
  L’adaptateur de métadonnées it.rocks les utilise ; le cœur du sélecteur consomme les descriptions issues de cet
  adaptateur. Les extensions de réflexion nécessaires se développent dans ces propriétaires.
- [`@itrocks/list`](https://github.com/itrocks-ts/list) possède l’adaptateur du consommateur métier : racine,
  chemins utilisés, application des choix, données des colonnes et confirmation des ajouts. Il peut dépendre
  de `property-select` et de `table`, jamais l’inverse.
- [`@itrocks/table`](https://github.com/itrocks-ts/table) possède le nouveau plugin d’ajout de colonnes et les
  mécanismes de déplacement. Ce plugin dépend du plugin existant `TableColumnReorder` du même package ;
  aucun package distinct `@itrocks/reorder` n’est nécessaire. Il ignore le sélecteur et les classes métier.
- [`@itrocks/home`](https://github.com/itrocks-ts/home) possède le volet droit générique du container,
  ses contrôles, son cycle de vie et sa présentation responsive. Il ne décide pas de charger le sélecteur.
- [`@itrocks/framework`](https://github.com/itrocks-ts/framework) est la racine de composition : il choisit les
  adaptateurs, les initialise et décide quel contenu proposer au volet selon le contexte de l’application.

Les contrats sont définis chez leur consommateur : ports du sélecteur dans `property-select`, contrat du volet dans
`home`, contrat d’ajout dans `table`. `list` adapte les événements entre eux ; il reçoit l’accès au volet du framework
sans importer `home` ni le framework. Aucun nouveau cycle de dépendances npm ne doit être introduit.
Le chargement de `home` reste conforme à la configuration du container ; ne pas ajouter une dépendance inverse au
framework simplement pour enregistrer le volet, `home` dépendant déjà du framework dans son manifeste actuel.

## 3. Ports du sélecteur à stabiliser

### 3.1 Métadonnées et résolution des chemins

**DEP-03.** Le port de métadonnées permet, pour une racine opaque et un chemin normalisé :

- d’obtenir le contexte courant et d’énumérer ses propriétés accessibles, sans lire leurs valeurs métier ;
- de résoudre et valider un chemin, notamment pendant la restauration de session ;
- de fournir nom technique, libellé, nature terminale/relationnelle, type cible opaque et ordre métier ;
- de fournir cardinalité et identité de relation inverse lorsqu’elles sont connues, en distinguant l’inconnu ;
- de charger progressivement et d’accepter l’annulation des requêtes obsolètes.

L’adaptateur it.rocks utilise `ReflectClass`, `ReflectProperty` et `ReflectPropertyPath` côté serveur.
Le contrat public reste indépendant de ces classes : chemins chaîne ou segments, descriptions sérialisables,
identifiants de types opaques. Le chemin vide représente la racine sans imposer sa résolution par
`ReflectPropertyPath`. Les métadonnées autorisées sont filtrées côté fournisseur, y compris lors d’une résolution
par chemin complet ; le filtrage visuel ne remplace pas cette vérification.

La recherche progressive, ses budgets, les cycles et le classement appartiennent au sélecteur.
Le fournisseur fournit les faits et les accès différés, sans décider d’un élargissement de recherche à la racine.
Si l’inverse ou la cardinalité manque, conserver une valeur inconnue et appliquer SEA-08/09 ; ne pas déduire ces faits
des noms. L’audit doit déterminer le propriétaire des métadonnées relationnelles manquantes et prévoir son extension.

**Configuration et absence de fournisseur.** Le fournisseur est obligatoire pour ouvrir un sélecteur fonctionnel.
Une absence est une erreur de configuration explicite, pas une liste vide présentée comme un résultat valide.
Un consommateur hors it.rocks peut fournir un catalogue statique ou son propre service de métadonnées.

### 3.2 Consommateur et interaction source

**DEP-04.** Le contrat du consommateur reçoit la racine, les chemins déjà utilisés et les conseils optionnels,
puis échange les intentions décrites par API-02 : sélection, début/suivi/fin de transport, annulation et confirmation.
Le plan doit préciser les charges utiles, les retours asynchrones, l’identité d’une interaction et leur ordre.
Une confirmation distingue un nouvel ajout d’un déplacement, d’un doublon et d’une annulation.
Elle arrive après application effective du choix ; elle seule alimente les récents d’ajout.

Les intentions transportent un chemin stable, pas une colonne, une instance de tableau ou un indice d’insertion.
L’hôte contrôle les effets et renvoie le résultat. Le sélecteur conserve la reconnaissance des gestes sur ses propres
surfaces ; il ne recopie ni les zones de suppression, ni le `touch-action` des en-têtes du tableau.
L’adaptateur assure le relais du pointeur après repli du volet, sans détruire le contrôleur actif.

**Configuration et défauts.** Chemins utilisés et conseils valent des listes vides lorsqu’ils sont omis.
Sans consommateur métier, un hôte de démonstration peut observer les intentions ; aucune mutation implicite n’a lieu,
aucun nouvel ajout n’est confirmé automatiquement et aucun tableau n’est créé.

### 3.3 Stockage d’état de session

**DEP-05.** Un port de stockage lit, écrit et retire l’état sérialisable du sélecteur pour une clé opaque fournie
par l’hôte. Les signatures préciseront les retours asynchrones, les erreurs et la gestion des écritures successives.
La sérialisation et la revalidation des chemins restent dans `property-select` ; le support de stockage,
l’isolation entre utilisateurs et l’expiration sont fournis par l’hôte.

L’adaptateur it.rocks utilise la session de l’application et les conventions de route existantes ; aucune URL,
aucun cookie et aucun identifiant utilisateur ne sont construits dans le sélecteur. Le contexte de session est
fourni par instance ou requête, jamais conservé dans un singleton partagé entre utilisateurs.
Les clés d’état du sélecteur et du tableau restent distinctes même si elles utilisent le même stockage.

**Configuration et défauts.** Sans port, seul l’état de l’instance vivante est disponible ; ce mode autonome doit
être explicite et ne satisfait pas STA-02/03. Pour la phase 1 it.rocks, le port est requis et doit préserver l’état
après rechargement jusqu’à la fin de la session. Une erreur de stockage est signalée sans perdre l’état courant.
Aucun repli silencieux vers des préférences permanentes ou un stockage navigateur non lié à la session.

### 3.4 Présentation et suggestions métier

**DEP-06.** Les libellés métier et l’ordre des propriétés arrivent avec les métadonnées. La traduction des textes
propres au sélecteur passe par une fonction fournie par l’hôte ; son défaut déterministe restitue le texte source.
Les conseils statiques sont fournis avec la configuration de la racine ; aucun moteur de recommandations,
collecteur de statistiques ou éditeur de favoris n’est requis.

La fusion, la déduplication, les destinations maximales par branche et la limite des suggestions restent dans le
sélecteur. Les noms techniques servent de libellés de repli, l’ordre du fournisseur est conservé sans règle fournie.
Ne pas confondre les propriétés proposées pour la navigation avec les seules colonnes initiales de la liste.

## 4. Contrats des modules hôtes

### 4.1 Ajout de colonnes dans `table`

**DEP-07.** Prévoir un plugin d’ajout, activable avec `TableColumnReorder`, selon les conventions de
[`@itrocks/plugin`](https://github.com/itrocks-ts/plugin#using-plugins).
Son nom et son sous-chemin public seront fixés par le plan, sans les présenter ici comme des exports existants.
Le plugin doit permettre à un consommateur de :

- demander l’ajout d’une colonne en fin de tableau par activation, ou à une position pendant un transport ;
- fournir sa structure et ses cellules via des callbacks dont le chargement peut être asynchrone ;
- afficher immédiatement une vraie colonne provisoire et enrichir ses valeurs sans bloquer le geste ;
- déplacer une colonne existante, la rendre visible et lui appliquer la mise en évidence attendue ;
- valider ou annuler une opération, restaurer la position initiale et nettoyer toute ressource provisoire.

`table` possède la géométrie, le défilement aux bords, les colonnes gelées et le DOM.
`list` possède l’identité par chemin, les doublons, les données, leur rendu métier et les écritures de configuration.
Le plugin reçoit des identifiants opaques et des callbacks ; il ne connaît ni les routes ni la session de `list`.
Ses événements distinguent provisoire et validé pour ne jamais sauvegarder l’aperçu comme une colonne définitive.
Un résultat tardif ne recrée pas une opération annulée.

Le transport démarré dans le sélecteur doit annuler hors cible, y compris pour une colonne existante : il ne doit
jamais déclencher la suppression prévue pour un déplacement commencé depuis un en-tête du tableau.
Étendre les points publics de `TableColumnReorder` si nécessaire plutôt que dupliquer son algorithme ou appeler
ses méthodes protégées depuis `list`. Préserver les comportements existants de déplacement/suppression depuis
les en-têtes, ainsi que les interactions de tri et les plugins de colonnes gelées.

### 4.2 Adaptateur métier dans `list`

`list` relie DEP-04 au plugin DEP-07. Il fournit la racine, les chemins utilisés, les données et les confirmations,
et demande au service de volet injecté par le framework d’héberger le sélecteur.
Il doit gérer les chemins relationnels dans les en-têtes, cellules, chargements supplémentaires et état sauvegardé,
avec `reflect-path` pour la résolution plutôt qu’une nouvelle traversée métier locale.
La persistance de configuration et les options de requête restent chez leurs propriétaires existants.
Aucune requête de données de colonne ne part du sélecteur.

Le plan doit notamment vérifier filtres, tri, chargement progressif, valeurs liées, réponses arrivant après une
annulation et configuration contenant déjà des chemins imbriqués. Les agrégations et autres comportements exclus
par la section 1.3 des spécifications ne sont pas réintroduits par cet adaptateur.

### 4.3 Volet droit standard dans `home`

**DEP-08.** Ajouter au container de `home` un volet générique pouvant accueillir un contenu quelconque,
initialement rabattu. Le framework choisit de l’alimenter avec `property-select` lorsque le contexte le permet.
Le contrat du volet couvre contenu, titre, présence effective, ouverture, fermeture, observation de l’état et retrait.
Il doit permettre un repli temporaire pendant un drag puis la restauration du même contenu et du même état.

Comportement attendu :

- Quand le contenu est vide, masquer le volet et sa commande ; aucun bouton sans action n’occupe l’en-tête.
- Quand le volet est rabattu et contient quelque chose, afficher une icône d’ouverture en haut à droite,
  dans la zone du fil d’Ariane, à droite de la zone de notification lorsqu’elle est présente.
- Quand il est ouvert, déplacer cette même commande à gauche de la barre de titre du volet et inverser l’icône
  pour permettre sa fermeture. Une seule commande est visible à la fois.
- Sur ordinateur, le volet réduit la largeur du contenu principal qui reste interactif et défilable.
- Sur smartphone, le volet ouvert occupe tout l’écran ; son titre et sa commande de fermeture restent accessibles.
- Après fermeture explicite, restaurer un focus pertinent ; pendant un drag, préserver le contrôleur du geste
  et ne pas faire apparaître le clavier tactile à la restauration.
- Quand la vue propriétaire disparaît ou retire son contenu, nettoyer son enregistrement et ne pas rouvrir
  un ancien volet à la fin d’un geste ou d’une requête.

Le bouton d’ajout de colonnes propre à la liste demande l’ouverture via le contrat du volet ; il ne crée pas un
second panneau. La décision initiale reste un volet rabattu, y compris après installation du sélecteur.
Le plan précisera les règles d’occupation quand plusieurs contenus se présentent : aucun remplacement silencieux
pendant une interaction active. Il ne doit pas introduire un gestionnaire de fenêtres complet pour cette phase.

`home` possède structure, comportement et styles spécifiques au volet. Réutiliser
[`@itrocks/ux-core`](https://github.com/itrocks-ts/ux-core) pour les conventions de thèmes et de responsive ;
des styles réellement partagés peuvent y être factorisés, sans y transférer la responsabilité du volet.

## 5. Composition par le framework et usage autonome

**DEP-09.** Respecter les conventions de composition existantes : contrats fonctionnels typés et liaison partielle
conservant les défauts pour les fonctions ; ports construits explicitement pour les services avec cycle de vie.
Le plan choisit un point public d’initialisation cohérent avec les entrées `*DependsOn()` existantes.
Si une fonction existante satisfait déjà le contrat, préserver son nom et l’ordre de ses paramètres pour la lier
directement. Ne pas inventer un conteneur d’injection supplémentaire.

Côté serveur, la source des liaisons est `framework/src/dependencies.ts`, fonction `bind()` ;
`framework/src/framework.ts` la déclenche après configuration et composition des exports, avant les serveurs.
L’adaptateur de réflexion doit respecter les compositions existantes de `ReflectClass` et `ReflectProperty`,
sans capturer de métadonnées à l’import avant initialisation.

Côté navigateur, les connexions DOM sont installées depuis l’entrée `framework/src/front/app.ts` et les modules
`build.js` appropriés. Le `bind()` serveur ne manipule pas le DOM et ne suffit pas à configurer le navigateur.
Le framework fournit le service de volet à l’intégration de `list`, qui connecte le sélecteur au plugin de `table`.
Il configure les adaptateurs de métadonnées et de session côté client sans y importer leur implémentation serveur.

L’activation dynamique réutilise [`@itrocks/build`](https://github.com/itrocks-ts/build) et la navigation existante
[`@itrocks/xtarget`](https://github.com/itrocks-ts/xtarget). Prévoir activation après insertion de fragments,
protection contre les doublons, démontage et annulation lors d’un changement de vue.

Pour une application hors it.rocks, la configuration à proposer dans la future API suit ce parcours :

1. Fournir un identifiant racine et un fournisseur de métadonnées, par exemple un catalogue statique en mémoire.
2. Fournir facultativement une traduction et des conseils ; choisir explicitement le mode d’état et son stockage.
3. Monter le composant dans un élément choisi par l’application, sans container `home` imposé.
4. Brancher les intentions sur les actions de cette application et confirmer uniquement les choix appliqués.
5. Nettoyer abonnements, requêtes et transports au démontage.

La recette autonome doit exécuter ce parcours avec un faux consommateur sans `framework`, `home`, `list`, `table`,
ni adaptateur de réflexion it.rocks. Le plan doit livrer un exemple exécutable utilisant les vrais exports créés,
et documenter leurs valeurs par défaut. Le mode sans stockage ne vaut pas validation de la conservation de session.

## 6. Autres modules utiles et points constatés

**DEP-10.** Ces propriétaires complètent les packages principaux sans devenir des imports obligatoires du cœur :

- [`@itrocks/property-view`](https://github.com/itrocks-ts/property-view), avec `displayOf` et `displayOrderOf`,
  fournit les libellés et l’ordre métier à l’adaptateur de métadonnées.
- [`@itrocks/class-view`](https://github.com/itrocks-ts/class-view) et
  [`@itrocks/translate`](https://github.com/itrocks-ts/translate) fournissent les conventions de libellés de classes
  et de traduction. Le rendu des valeurs représentatives reste dans `list`, pas dans la recherche de propriétés.
- [`@itrocks/route`](https://github.com/itrocks-ts/route) fournit les conventions permettant à l’hôte de construire
  une clé canonique ; le sélecteur ne normalise pas lui-même les routes de l’application.
- [`@itrocks/property-type`](https://github.com/itrocks-ts/property-type) décrit les types et collections
  utilisés par la réflexion. [`@itrocks/composition`](https://github.com/itrocks-ts/composition) expose des faits
  de composition à examiner pour les relations ; cela ne garantit pas à lui seul toutes les cardinalités ou inverses.
  Ces dépendances concernent l’adaptateur et leurs propriétaires, pas le contrat sérialisé du sélecteur.
- [`@itrocks/list-properties`](https://github.com/itrocks-ts/list-properties) définit les colonnes initiales de liste,
  pas nécessairement toutes les propriétés navigables. Réutiliser sa configuration sans limiter le catalogue à celle-ci.

Le transport HTTP et le stockage réutilisent la pile existante de l’application, derrière les ports concernés.
Les actions it.rocks s’appuient sur [`@itrocks/action`](https://github.com/itrocks-ts/action),
[`@itrocks/action-request`](https://github.com/itrocks-ts/action-request) et
[`@itrocks/request-response`](https://github.com/itrocks-ts/request-response) ;
le rendu peut réutiliser [`@itrocks/template-insight`](https://github.com/itrocks-ts/template-insight).
Ces modules appartiennent à l’intégration serveur ; ils ne sont pas imposés à une application autonome.
Le module [`@itrocks/session`](https://github.com/itrocks-ts/session) expose actuellement l’énumération et la révocation
des sessions ; son contrat `SessionStore` ne fournit pas une API de lecture/écriture d’état de composant.
Ne pas le brancher tel quel sur DEP-05. La session de requête et la persistance de `list` sont les points de départ
à examiner pour cet adaptateur.

Points d’entrée constatés pour l’audit, chemins préfixés par le nom du package propriétaire :

- `reflect/src/class.ts`, `reflect/src/property.ts` et `reflect-path/src/property.ts` : réflexion et chemins.
  Vérifier chemins de plusieurs segments, collections, types optionnels, héritage et relations inverses sans
  chargement de valeurs métier. Toute capacité manquante donne lieu à une tâche dans son propriétaire.
- `list/src/columns.ts` : sélection de propriétés directes de `ListReflectClass`, sérialisation par nom et
  construction de `ReflectProperty`. Les chemins relationnels ne sont pas pris en charge par ce seul contrat.
- `list/src/front/build.ts` : branchement de `TableColumnReorder`, callbacks de sauvegarde, tri et activation DOM.
- `list/src/persist.ts` : état stocké dans la session de requête via `routeOf(type)`.
- `table/src/column-reorder.ts` : démarrage depuis l’en-tête, déplacement et suppression hors zone ; ses méthodes
  de cycle de vie sont protégées. Un nouveau contrat public est nécessaire pour le transport depuis le sélecteur.
- `home/src/container.html` : fil d’Ariane, contenu principal et notifications ; le volet droit reste à développer.
- `framework/src/dependencies.ts`, `framework/src/front/app.ts` et `framework/config.yaml` : liaisons,
  activation navigateur et composition de la réflexion.

Ces chemins servent à l’audit du code, pas à des imports privés entre packages. Les liens de documentation des
fonctions réellement branchées et les exemples de configuration seront précisés avec leurs exports définitifs.
Ne pas créer un nouveau package de drag, de panneau, de recherche ou de recommandations sans besoin établi par l’audit.

## 7. Prise en compte obligatoire dans le plan

Chaque exigence DEP-01 à DEP-10 doit être reliée à des tâches et des critères de validation, en complément des
exigences fonctionnelles. Le plan doit couvrir les changements dans les dépendances, pas seulement dans le sélecteur.

- **Audit et contrats, avant L1 :** vérifier propriétaires, exports, dépendances et compositions ; arrêter les
  signatures des ports, données, retours, annulations, défauts, activation et destruction des instances.
- **L1 et L3 :** séparer cœur et fournisseur it.rocks ; prévoir les extensions de `reflect` et `reflect-path`
  nécessaires et tester la recherche avec un catalogue indépendant, y compris relations inconnues et cycles.
- **L2 :** développer le volet générique dans `home`, son branchement par le framework, le plugin d’ajout dans `table`
  et l’adaptateur de `list` pour les clics. Le sélecteur doit déjà fonctionner avec un autre hôte.
- **L4 :** raccorder l’état à la session réelle, les libellés et conseils aux fournisseurs existants ; tester
  rechargement, expiration, isolation entre utilisateurs et changement de configuration de liste.
- **L5 et L6 :** étendre le contrat public de déplacement de `table` ; relier le transport, l’aperçu avec données,
  le rollback et le repli/restauration du volet, sans répliquer ces comportements dans `property-select`.
- **L7 :** tester l’usage autonome, les branchements it.rocks, le responsive, le nettoyage, les données tardives et
  l’absence de régression du déplacement/suppression depuis les en-têtes et des listes existantes.

Les lots restent indicatifs. Chaque fiche indique les packages propriétaires modifiés, ses contrats consommés et
fournis, les dépendances logiques et les validations par dépôt. Le manifeste doit ordonner les extensions des modules
avant leurs consommateurs et prévoir leur intégration avant la tâche suivante. Inclure les impacts de version,
les exports et ressources navigateur à livrer ainsi que la documentation des liaisons effectivement réalisées.
La revue du plan vérifie l’absence de dépendance inverse et de fonctionnalité de tableau ou de volet dans le sélecteur.

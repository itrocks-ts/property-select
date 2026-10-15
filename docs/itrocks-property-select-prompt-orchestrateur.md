# Orchestration du développement de `@itrocks/property-select`

Tu es l’orchestrateur du développement complet de la phase 1 de `@itrocks/property-select`.

Références obligatoires :

- [Spécifications fonctionnelles](it-rocks-selecteur-relationnel-specifications.md), exigences V1 et T01 à T27.
- [Dépendances et contrats d’intégration](dependencies.md), exigences DEP-01 à DEP-11.
- [Sélection de données par chemins](select.md), détail obligatoire de DEP-11 et référence PHP dans `../boust`.
- [Validation et livraison autonome](validation.md), exigences VAL-01 à VAL-08.

**Résultat attendu :** un sélecteur générique back+front utilisable hors it.rocks, l’intégration effective à `list` et
`table`, le volet standard de `home` et les branchements du framework, fonctionnels et vérifiés dans le navigateur. La
phase 2 est exclue. Enchaîne préparation, développement, vérifications, corrections et livraison sans demander une
confirmation entre ces étapes. Pour une préparation seule, utiliser le prompt de la [section 12 des
spécifications](it-rocks-selecteur-relationnel-specifications.md#12-prompt-de-préparation-à-donner-à-codex).

## 1. Rôle, autonomie et état initial

Tu déclenches, attends, contrôles et tiens le manifeste. Les sous-agents analysent, conçoivent, codent et vérifient. Ne
charge pas les specs complètes, le code, les diffs ou les journaux dans ton contexte : délègue leur lecture. Lis les
instructions applicables, le manifeste, les retours courts et les informations Git nécessaires.

Avant toute écriture, vérifie que les documents d’entrée sont présents et versionnés. Consigne les `HEAD` et les
modifications initiales, fichiers non suivis inclus, pour chaque dépôt rencontré. Les agents font de même avant leur
première intervention dans un dépôt supplémentaire. Une modification préexistante sans rapport avec le périmètre peut
rester intacte, identifiée dans le suivi ; elle n’autorise ni nettoyage, ni déplacement, ni commit de ce contenu. Une
modification étrangère qui recouvre un fichier nécessaire et ne peut être préservée sans ambiguïté constitue un blocage
réel. Ne pas exiger artificiellement un état propre de toute l’application quand les dépôts et fichiers utiles peuvent
être traités sans toucher au reste.

Les décisions d’implémentation et les corrections conformes aux spécifications sont déléguées sans solliciter
l’utilisateur. Les revues de plan sont des validations par sous-agents, pas des attentes d’approbation humaine. Une
inconnue technique ordinaire doit être examinée puis résolue avec un choix justifié et testé. Les ressources et données
synthétiques de recette locale font partie du chantier autorisé. Respecte les permissions existantes et ne contourne pas
une limite d’accès, une contradiction fonctionnelle réelle ou un besoin de ressource externe indispensable : documente
alors le blocage sans prétendre avoir terminé.

Vérifie les possibilités effectives du lanceur : modèle, effort et contexte sans historique hérité, sans profil qui les
écrase. Préfère les sous-agents natifs ; sinon, uniquement si disponible et autorisé, utilise une nouvelle invocation
`codex exec` sans reprise ni copie d’historique, avec modèle et effort explicites. N’invente pas de paramètre, ne
modifie pas les permissions et n’installe pas d’orchestrateur. Un modèle requis ou une isolation indisponible est un
blocage explicite, pas une substitution silencieuse.

## 2. Exécution strictement successive

Un seul sous-agent actif, une seule tâche par agent, aucune sous-délégation. Attends la terminaison avant le suivant ;
ne réutilise jamais un ancien agent. Utilise la fermeture de contexte si le lanceur la propose, sans inventer d’API.

Transmets uniquement la mission ou la fiche, ses références, `COMMON.md`, le calibrage et les points de contrôle Git.
N’hérite ni conversation ni raisonnement d’un agent précédent. La mémoire commune est dans les dépôts : contrats, code,
tests, manifeste, défauts reproductibles et rapports. Le prochain agent lit ces références directement.

Préfère le même espace de travail et la même branche avec écritures successives. Si des worktrees sont imposés, termine
l’intégration des livraisons et vérifie les liens entre packages avant le consommateur suivant. Les vérificateurs
navigateur sont distincts des auteurs des fonctionnalités qu’ils contrôlent. Les serveurs nécessaires à la recette
peuvent rester actifs entre agents ; leur état est consigné selon VAL-01.

Chaque agent lit les `AGENTS.md` et les liens du handbook pertinents pour chaque package touché avant d’y intervenir.
À chaque livraison, il vérifie les conventions de code, exports, versions, tests et documentation de ces propriétaires.
Le contrôle SOLID est explicite : responsabilité unique, contrats étroits, substitution des adaptateurs, dépendances
dans le bon sens et réutilisation des abstractions existantes. Les revues de plan et de réalisation contrôlent
ces points ; une duplication de SQL, d’hydratation ou de logique de volet dans un mauvais package ouvre une correction.

## 3. Calibrage des sous-tâches

Les tâches de contrat `select()`, jointures, projection SQL, hydratation et leur vérification sont transversales :
les calibrer au minimum en `gpt-6.1-sol` / `high`, avec promotion vers Astra selon les critères ci-dessous.

La qualité et la couverture des validations priment sur l’économie de tokens. L’utilisateur autorise explicitement
`gpt-6-astra` pour les sous-tâches les plus complexes, sans nouvelle demande d’accord. Le planificateur et
l’orchestrateur choisissent le modèle selon le risque réel, dès le premier passage si nécessaire ; un échec préalable
n’est pas requis. Les profils ci-dessous sont des points de départ, pas des plafonds.

Chaque entrée de manifeste a un `model`, un `model_reasoning_effort` et une justification d’une ligne :

- Audit initial et préparation courante de l’environnement : `gpt-6.1-sol` / `medium`.
- Architecture, contrats, planification et revue indépendante du plan : `gpt-6.1-sol` / `high`.
- Travail mécanique local entièrement spécifié, sans arbitrage d’architecture ou d’UX : `gpt-6-luna` / `high`.
- Implémentation courante sur contrats stabilisés : `gpt-6.1-sol` / `medium`.
- Vérification navigateur des clics, recherche, session et volet : `gpt-6.1-sol` / `medium`.
- Gestes tactiles, drag, annulation, concurrence, cycles, rollback, contrats transversaux et leur vérification :
  `gpt-6.1-sol` / `high`.
- Diagnostic de régression, correction complexe et recette finale indépendante : `gpt-6.1-sol` / `high`.
- Vérification de livraison, démarrage final et documentation des commandes : `gpt-6.1-sol` / `medium`.

Utiliser de préférence `gpt-6-astra` / `high` pour les arbitrages transversaux les plus délicats : contrat de projection
et reconstruction des colonnes objets, cohérence réflexion/jointures/critères/pagination, interactions tactiles avec
rollback asynchrone, ou revue indépendante de ces mécanismes. Le planificateur peut aussi affecter Astra à la revue
du plan ou à la recette finale si les risques cumulés le justifient. Évaluer cette promotion explicitement pour DEP-11.

Astra peut passer en `xhigh` lorsqu’une difficulté précise le justifie. Une tâche courante reste sur son profil adapté ;
ne pas fragmenter les tâches ni réduire les contrôles pour économiser les tokens. Consigner le choix, sa justification
et les capacités vérifiées du lanceur dans chaque fiche. Si Astra n’est pas disponible, réexaminer le calibrage avant
lancement : `gpt-6.1-sol` / `xhigh` peut être retenu avec justification et revue indépendante renforcée, sans
substitution
silencieuse ni réduction des critères de réussite. Si aucun profil disponible ne convient, signaler le blocage réel.

`gpt-6.1-sol` / `xhigh` est réservé à une difficulté précise justifiée dans la fiche, jamais systématique. Une
préparation d’environnement comportant un problème transversal passe en `high` par une fiche de diagnostic. La revue
vérifie le calibrage de toutes les tâches, y compris environnement, navigateur, correction et livraison. N’infère pas le
modèle effectif de sa seule déclaration dans le retour d’un agent.

## 4. Préparation : quatre sous-tâches successives

### 4.1 Audit : `gpt-6.1-sol` / `medium`

Lis les documents d’entrée et inspecte les dépôts concernés, sans développer de fonctionnalité produit. Crée le
dossier de suivi, par défaut `docs/property-select/`, avec `AUDIT.md` et `COMMON.md`. Cartographie les composants,
exports, contrats manquants, règles de versions, dépendances locales et commandes réelles. `COMMON.md` référence les
règles communes sans recopier les specs ; il ne transmet pas aux exécutants l’interdiction de concevoir ou coder qui
concerne l’orchestrateur. Identifie les modifications initiales à préserver et les dépôts nécessaires. Committe
uniquement les documents de cette tâche, selon les conventions applicables.

### 4.2 Environnement : `gpt-6.1-sol` / `medium`

Réalise VAL-01 : prépare les ressources de test isolées et les scripts utiles, démarre la pile existante, ouvre une page
avec le véritable outil de navigateur et vérifie les capacités d’émulation tactile. Livre `ENVIRONMENT.md`, les fixtures
de base et une procédure reproductible pour les sous-agents suivants. N’implémente pas le sélecteur pour fabriquer un
résultat de recette anticipé. La démonstration autonome pourra recevoir son implémentation pendant les lots fonctionnels
; son support de lancement doit être prévu dès maintenant. Résous les difficultés locales dans les moyens autorisés, ou
retourne un diagnostic précis pour une tâche dédiée.

Prévoir également la base MySQL/MariaDB isolée de DEP-11, ses fixtures et les moyens de vérifier les requêtes
réellement exécutées, sans utiliser une base de données privée comme jeu de recette.

### 4.3 Contrats et plan : profil `high` selon la section 3

À partir de l’audit et de l’environnement éprouvé, livre les contrats, `PLAN.json`, une fiche par tâche et la matrice
`VALIDATION.md` de VAL-02. Couvre toutes les exigences V1, DEP-01 à DEP-11 et VAL-01 à VAL-08. Les lots L0 à L7 sont
indicatifs ; adapte leur découpage pour avoir des livraisons cohérentes et testables.

Prévois les développements dans les propriétaires : ports et fournisseur de métadonnées, extensions de `reflect` et
`reflect-path`, ajout/déplacement dans `table`, adaptateur de `list`, volet de `home`, session et composition
serveur/navigateur du framework. Ordonne les contrats des dépendances avant leurs consommateurs. Planifie une
démonstration autonome et l’intégration locale réelle, selon VAL-03.

Avant les colonnes relationnelles, planifie successivement l’audit comparatif du PHP dans `../boust`, le contrat
`DataSource.select()`, les extensions de réflexion et de construction SQL, `Mysql.select()`, une vérification
indépendante sur base réelle, puis l’intégration et la recette navigateur de `list`, selon `docs/select.md`.
La préparation doit consigner les mécanismes PHP et leurs adaptations dans le dépôt de suivi.
Ne pas remplacer cette chaîne par `search()` suivi d’un parcours du graphe en mémoire.

Chaque entrée du manifeste précise `id`, titre, fiche, dépendances, packages/dépôts, catégorie de tâche, statut,
`model`, `model_reasoning_effort`, justification et rapport attendu. Chaque fiche précise objectif observable,
références, points d’entrée constatés, périmètre, exclusions, critères d’acceptation, tests, commandes, impact de
version et livrables. Les fiches navigateur précisent en plus les parcours et preuves de VAL-02 et VAL-06.

Insère les vérifications navigateur successives de VAL-04/05 immédiatement après les fonctionnalités concernées, à
partir de L2, avec des dépendances qui empêchent de passer outre un défaut. Prévois enfin une recette indépendante et
une sous-tâche de livraison distincte selon VAL-08. Committe le plan sans implémentation produit.

### 4.4 Revue indépendante du plan : profil `high` selon la section 3

Relis specs, architecture, protocole de validation, audit, environnement, contrats et fiches. Vérifie couverture,
exclusion de la phase 2, responsabilités, ordre des dépendances, calibrage, autonomie des fiches et capacité réelle à
exécuter chaque contrôle. Le plan ne passe pas s’il reporte implicitement les tests navigateur à l’utilisateur ou s’il
ne prévoit qu’une démonstration simulée à la place de l’intégration réelle. Corrige les incohérences documentaires dans
le périmètre ; utilise le cycle de correction de VAL-07 si nécessaire. Une revue réussie déclenche automatiquement
l’implémentation, sans demande de confirmation.

## 5. Réalisation, vérification et corrections

Pour chaque tâche prête du manifeste :

1. Vérifie les prérequis, les `HEAD` attendus, les livraisons des dépendances et l’absence de modification étrangère
   nouvelle dans les fichiers concernés. Préserve l’état initial identifié en section 1.
2. Lance un nouveau sous-agent avec sa fiche, `COMMON.md`, les références utiles et les points de contrôle.
3. L’agent réalise sa tâche et les contrôles requis, y compris les conventions des propriétaires et le contrôle SOLID,
   relit son diff et livre code, tests, versions et rapport cohérents.
   Un vérificateur exécute ses parcours et consigne les résultats ; il ne conclut pas sur la seule lecture des tests.
4. Contrôle le retour, les commits, les dépendances, le rapport et la présence des preuves attendues dans la matrice. Un
   statut `DONE` seul ne suffit pas. Ne recharge pas tous les journaux dans ton contexte.
5. En cas de réussite, passe automatiquement à la tâche prête suivante. En cas de défaut reproductible, applique VAL-07
   : diagnostic si nécessaire, correctif, nouvelle vérification indépendante, puis reprise de la chaîne.

Les corrections conformes au périmètre sont autorisées dans tous les modules propriétaires et dans les tests, fixtures
ou scripts de recette. Insère leurs fiches au manifeste avec les mêmes exigences de calibrage et de suivi. Un défaut
découvert à la recette finale doit être corrigé puis retesté ; il ne devient pas une simple réserve au bilan. Une
modification de contrat impose l’examen des consommateurs et une nouvelle vérification des scénarios affectés.

Ne poursuis pas une fonctionnalité dépendante sur un contrôle obligatoire en échec ou non exécuté. Un échec corrigeable
n’arrête pas le chantier : il ouvre la séquence corrective définie par VAL-07. Arrête seulement pour un blocage réel de
périmètre, permissions, ressource indispensable ou absence de progrès selon ce protocole. Conserve les points de
contrôle et un reproducer, sans masquer les défauts ni inventer de succès.

## 6. Commits, versions et état de travail

Les sous-agents sont autorisés à créer des commits locaux pour les livraisons du chantier, documentation comprise. Aucun
push, tag, publication, déploiement, changement étranger, réécriture d’historique ou nettoyage destructeur implicite.
Respecte les conventions du handbook et de chaque dépôt pour les versions, commits, exports et ressources distribuées.
Les titres suivent les conventions constatées ; ne pas imposer par défaut un préfixe de type Conventional Commits.

Avant de laisser la main, un agent doit rendre son travail attribuable et reprenable. Un résultat incomplet peut être
conservé dans un commit de point de contrôle explicitement signalé comme non validé ; ce commit ne termine pas la tâche.
S’il ne peut être committé, l’agent consigne exactement ses fichiers et leur propriétaire dans le suivi. Le correcteur
suivant peut reprendre ces modifications reconnues ; il ne les traite pas comme des changements étrangers à effacer. Les
modifications préexistantes étrangères restent exclues de ces commits et de ces reprises.

Applique la politique de version du dépôt par rapport à son `HEAD` et aux changements encore non livrés. Une correction
supplémentaire non committée ne provoque pas plusieurs incréments pour la même livraison en attente. Une nouvelle
livraison après commit applique à nouveau la règle du propriétaire. Synchronise les manifestes, verrous et dépendances
internes lorsque nécessaire, sans renuméroter les packages inchangés. Les tests et preuves finales portent sur les
versions et ressources réellement livrées.

## 7. Retours, reprise et clôture

Chaque sous-agent écrit un rapport bref dans le dossier de suivi et actualise le manifeste ou sa matrice selon sa fiche.
Il consigne critères couverts, validations, preuves, défauts, limites et versions avant/après. Ne demande pas à un
fichier de contenir le SHA de son propre commit ; le SHA est renvoyé après coup.

Retour à l’orchestrateur, huit lignes maximum :

- identifiant et statut : `DONE`, `NEEDS_FIX`, `BLOCKED` ou `FAILED` ;
- modèle/effort demandés et configuration effective si vérifiable ;
- dépôts et SHA, en distinguant livraison validée et point de contrôle incomplet ;
- versions avant/après, ou sans changement ;
- validations requises et résultats ;
- chemins du rapport, des preuves et des défauts éventuels ;
- blocage ou limite matérielle éventuelle.

`NEEDS_FIX` déclenche VAL-07. `FAILED` demande un diagnostic de l’échec d’exécution ; ce statut n’autorise ni à sauter
la tâche ni à abandonner une correction possible. `BLOCKED` exige une cause externe ou une impasse documentée. Rapporte
l’avancement en une ligne par tâche ; ne demande pas à l’utilisateur de piloter la succession des agents. En reprise,
confronte manifeste, état réel et points de contrôle avant de reprendre la première tâche non terminée. Ne rejoue pas
une livraison déjà réalisée et ne déclare pas actuelles des preuves invalidées par une correction.

Termine uniquement après les deux sous-tâches de VAL-08 et leur éventuelle séquence corrective. Le bilan donne l’URL
utilisable, les commandes de relance, les versions et commits par dépôt, les environnements réellement testés, le
verdict de la matrice et l’état Git, en distinguant les changements initiaux préservés. L’absence de téléphone physique
est traitée selon VAL-05 ; elle ne transfère pas la recette automatisable à l’utilisateur. Si un blocage réel empêche
d’atteindre cette fin, donne l’état exact et la condition de reprise au lieu d’annoncer un logiciel terminé. Le
lancement unique vise la livraison complète ; il ne dispense jamais de preuves de fonctionnement.

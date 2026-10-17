# Sélecteur relationnel de propriétés pour `@itrocks/property-select`

Spécifications fonctionnelles et cadre de réalisation séquentielle

- **Date :** 15 octobre 2026.
- **Périmètre prévu :** phase 1 : sélecteur générique et première intégration au tableau.
- **Référence :** décisions UX arbitrées avec Baptiste.
- **Destinataire :** Codex pour analyse du dépôt, découpage, puis exécution par tâches successives en contexte neuf.

## 0. Lecture et règles de réalisation

Les sections 1 à 9 définissent la phase 1 ; la section 10 réserve la phase 2, **à ne pas développer maintenant**. Les
sections 11 et 12 fournissent le cadre d'exécution et le prompt de préparation.

Lire aussi les [dépendances et contrats d’intégration](dependencies.md) : ils fixent les responsabilités des
packages, l’usage hors it.rocks et les travaux à inclure dans les modules dépendants. Ils font partie des
exigences de la phase 1, en particulier pour les métadonnées, le tableau, le volet et la session.
Le [contrat de sélection de données](select.md), DEP-11, impose `DataSource.select()`, `Mysql.select()` et
la construction SQL par chemins avant les colonnes relationnelles réelles de `list`.

Les identifiants d'exigences sont stables et servent à relier tâches, code et tests. Les noms techniques proposés sont
descriptifs, pas des noms de classes ou de modules imposés.

**Avant de planifier**, consulter les `AGENTS.md` applicables et inspecter métadonnées, chemins, événements, tests,
panneaux et interactions existants. Le dépôt n'a pas été audité pour ce document : ne pas inventer ses API, packages ou
commandes de test. Réutiliser l'existant, sans refonte générale ni nouvelle dépendance par défaut.

Le [protocole de validation et de livraison autonome](validation.md) fixe les contrôles VAL-01 à VAL-08 :
environnement éprouvé, sous-tâches navigateur successives, corrections et recette finale indépendante.
Il est obligatoire pour le développement complet, en complément des scénarios de la section 9.

Une tâche est **autonome en contexte**, pas nécessairement indépendante techniquement : elle peut dépendre de code déjà
livré, mais jamais d'une conversation avec un agent précédent.

## 1. Objectif, périmètre et architecture

### 1.1 Objectif

Permettre de choisir une propriété depuis une racine métier, à travers des relations directes, inverses ou N-N, sans
afficher tout le graphe. Une propriété choisie peut être terminale ou désigner un objet lié, lui-même exploitable comme
valeur.

Exemples, relativement à une facture ou commande :

```text
client.adresse.ville.pays.code
lignes.remise.type.organismeCollecteur.adresse.ville.pays.code
client.adresse.ville
```

Le dernier chemin sélectionne Ville elle-même, dont la représentation est définie ailleurs dans le framework, par
exemple `Chartres (FR)`.

### 1.2 Frontière de responsabilité

- **ARC-01.** **Couche :** Sélecteur générique ; **Responsabilité :** Navigation, présentation des propriétés,
  recherche, suggestions, état local et intentions de sélection ou de drag. Aucune connaissance des colonnes, lignes,
  cellules ou graphiques.

- **ARC-02.** **Couche :** Fournisseur de métadonnées ; **Responsabilité :** Résoudre les chemins et énumérer les
  propriétés accessibles : identifiant, libellé, caractère terminal/relationnel, cible, ordre métier, cardinalité et
  relation inverse lorsqu'elles sont connues.

- **ARC-03.** **Couche :** Hôte et adaptateur tableau ; **Responsabilité :** Implantation du panneau, clé de session,
  chemins déjà utilisés, ajout/déplacement/focus des colonnes, destinations du drag, aperçu avec données et retour de
  réussite.

- **ARC-04.** **Couche :** Infrastructure partagée ; **Responsabilité :** Transport du geste, session et composants de
  présentation réutilisables selon l'architecture existante. Aucun import du tableau dans le sélecteur.

**ARC-05.** Un seul modèle de navigation et d'interaction dessert les présentations ordinateur et mobile. Ne pas
maintenir deux implémentations fonctionnelles distinctes.

**ARC-06.** Les accès aux relations inverses et N-N passent par les abstractions métier existantes. Ne pas imposer
l'affichage des tables intermédiaires techniques lorsque le framework expose déjà la relation logique.

### 1.3 Hors périmètre

Le rendu des cellules, les agrégations, les valeurs multiples, les tableaux imbriqués et la multiplication des lignes
appartiennent au tableau. Le sélecteur ne demande jamais de choisir une agrégation.

La sauvegarde des configurations de tableaux, l'aide générale inline/latérale et un consommateur graphique/reporting
sont hors périmètre. L'intégration réagit toutefois au chargement d'une configuration existante.

## 2. Chemins, contrats et état de navigation

### 2.1 Identité et contrats minimaux

**API-01.** Une propriété est identifiée par son chemin complet relativement à la racine métier, et non par son libellé
ou sa classe cible. L'API V1 accepte les représentations existantes suivantes, avec normalisation interne unique :

```ts
type PropertyPath = string | readonly string[]
// 'client.adresse.ville' ou ['client', 'adresse', 'ville']
```

La racine correspond à un chemin vide ; son libellé peut apparaître dans l'interface mais n'est pas un segment
technique. Elle est navigable, pas sélectionnable. Le contrat du sélecteur reste indépendant de
`ReflectPropertyPath` ; l’adaptateur it.rocks délègue la réflexion à `reflect-path` et `reflect`, selon
[DEP-03](dependencies.md#31-métadonnées-et-résolution-des-chemins).

**API-02.** L'architecture doit permettre les échanges suivants, via les conventions du dépôt plutôt qu'une nouvelle API
arbitraire :

- **Sens : Hôte → sélecteur**. **Contrat fonctionnel :** Racine, fournisseur de métadonnées, clé d'état, chemins déjà
  utilisés, suggestions métier optionnelles.

- **Sens : Sélecteur → hôte**. **Contrat fonctionnel :** Intention de sélectionner un chemin par activation ;
  début/suivi/fin de drag transportant ce chemin.

- **Sens : Hôte → sélecteur**. **Contrat fonctionnel :** Confirmation d'un nouveau choix effectivement appliqué, pour
  alimenter les récents ; succès ou annulation d'une interaction en cours.

- **Sens : Hôte → sélecteur**. **Contrat fonctionnel :** Mise à jour des chemins utilisés lorsque le contenu ou la
  configuration du consommateur change.

L'intention de sélection ne présume ni ajout de colonne ni déduplication. Le contrat de drag fournit les informations
utiles au mécanisme existant sans confier au sélecteur le calcul d'un emplacement de colonne.

**API-03.** Les métadonnées peuvent être chargées de façon différée. Ne pas charger toute la structure du modèle au
montage, ni les enregistrements métier pour naviguer ou rechercher des propriétés. Réutiliser les règles existantes
d'accès aux métadonnées et données autorisées.

### 2.2 Branche mémorisée et position courante

**NAV-01.** Conserver séparément :

- la branche mémorisée complète, composée de relations ;
- l'indice de l'objet actuellement ouvert dans cette branche ;
- le critère de recherche et les positions de défilement utiles.

Exemple : branche `client.adresse.ville.pays`, objet courant `client.adresse`. Le fil d'Ariane affiche encore Client,
Adresse, Ville et Pays. Adresse est signalée comme niveau courant ; Ville et Pays restent activables.

**NAV-02.** Une seule structure d'objet est affichée à la fois. Ouvrir une relation remplace la liste, sans déplier une
arborescence et sans afficher automatiquement les structures voisines.

- **NAV-03.** **Action :** Activer un ancêtre ou descendant mémorisé ; **Branche et niveau courant :** Conserver toute
  la branche ; déplacer le niveau courant. **Recherche :** Conserver le critère et relancer depuis ce niveau.

- **NAV-04.** **Action :** Descendre par la relation déjà mémorisée ; **Branche et niveau courant :** Conserver
  également ses descendants. **Recherche :** Conserver le critère.

- **NAV-05.** **Action :** Descendre par une autre relation ; **Branche et niveau courant :** Conserver le préfixe
  commun, remplacer la suite divergente. **Recherche :** Conserver le critère.

- **NAV-06.** **Action :** Activer un accès rapide ; **Branche et niveau courant :** Remplacer toute la branche par le
  chemin exact du raccourci ; ouvrir son dernier objet. **Recherche :** Effacer le critère.

- **NAV-07.** **Action :** Sélectionner une propriété ; **Branche et niveau courant :** Ne changer ni branche ni niveau
  courant. **Recherche :** Ne rien modifier.

**NAV-08.** L'ouverture d'un objet depuis un chemin de résultat applique les mêmes règles : conserver la branche si le
chemin visé en est un préfixe ; sinon remplacer sa suite divergente. Ne jamais rattacher artificiellement un résultat
sous un autre objet.

**NAV-09.** Tous les niveaux du fil d'Ariane restent accessibles, y compris sur petit écran. Distinguer le niveau
courant sans dépendre uniquement de la couleur. Le défilement du fil ne doit pas déclencher accidentellement un drag de
propriété.

## 3. Présentation et actions

### 3.1 Implantation

**UI-01.** Dans l'intégration tableau, le sélecteur occupe un panneau latéral droit qui réduit la largeur disponible du
tableau sur ordinateur. Le tableau reste interactif et défilable. Pas de popup modale pour cet usage.
Le volet générique appartient à `home` et son activation au framework, selon
[DEP-08](dependencies.md#43-volet-droit-standard-dans-home) ; il est initialement rabattu.
Le sélecteur est montable dans un autre hôte sans ce volet.

**UI-02.** Sur mobile, ce panneau occupe l'espace disponible comme un écran. Un bouton permet de le masquer ; la vue
principale propose un bouton pour le réafficher. Le bouton d'ajout de colonnes reste accessible à droite de l'en-tête du
tableau, indépendamment de son défilement horizontal. Il demande l’ouverture du volet existant.
La commande du volet n’apparaît que si son contenu est présent ; sa position et son inversion à l’ouverture
suivent [DEP-08](dependencies.md#43-volet-droit-standard-dans-home).

**UI-03.** Un ajout par clic ne ferme jamais automatiquement le panneau. Masquer puis réafficher restaure la navigation,
la recherche et le défilement. Les transitions spécifiques au drag sont définies en section 7.

**UI-04.** Présentation sobre : fil d'Ariane en haut, recherche, accès rapides bornés et liste de propriétés. Pas
d'icônes à gauche pour distinguer relation et terminal, pas d'indicateur d'origine des suggestions, pas d'aide inline.
Le chevron suffit à indiquer la navigation possible ; une différence de style discrète est permise.

### 3.2 Zones de clic

- **ACT-01.** **Propriété :** Terminale ; **Activation de la zone principale :** Émettre une sélection. **Activation du
  `+` :** Même sélection lorsqu'il est affiché. **Drag :** Transporter son chemin.

- **ACT-02.** **Propriété :** Relation ; **Activation de la zone principale :** Ouvrir la structure liée. **Activation
  du `+` :** Émettre une sélection de l'objet lui-même. **Drag :** Transporter le chemin de l'objet.

**ACT-03.** Le nom et son chevron constituent une seule zone de navigation. Le chevron suit le nom, avant la zone
d'ajout. Tous les `+` sont alignés à droite. Il n'y a jamais l'ordre « nom navigable, `+`, chevron navigable » ni une
troisième action indépendante.

**ACT-04. Ordinateur avec survol.** Afficher le `+` contextuellement au survol de la ligne et au focus clavier, pour les
relations et les terminaux. Réserver sa place en permanence pour éviter déplacement du libellé, du chevron ou
modification de hauteur. Le bouton garde une cible confortable même si le symbole est discret.

**ACT-05. Mobile/tactile sans survol.** Le `+` est toujours visible pour les relations uniquement. Aucun `+` pour les
terminaux : leur nom suffit. Ne pas ajouter de `+` d'objet courant dans l'en-tête. Traiter les appareils hybrides sans
laisser une action indispensable accessible uniquement au survol.

**ACT-06.** Une activation du `+` n'ouvre pas la relation et ne déclenche pas un second ajout par propagation à la
ligne. Un drag reconnu ne se termine pas par un clic synthétique provoquant un ajout supplémentaire.

**ACT-07.** Dans les chemins affichés, un segment relationnel s'ouvre par clic et peut être transporté par drag. Pas de
`+` pour chaque segment intermédiaire. La racine n'est jamais transportée. Un objet peut aussi être retrouvé et ajouté
depuis sa ligne relationnelle.

**ACT-08.** Préserver l'usage clavier : ordre logique, focus visible, activation des zones principales et boutons sans
drag. Réutiliser les composants accessibles existants ; éviter toute imbrication invalide de contrôles interactifs.

### 3.3 Colour coding

**COL-01. Reference and maintenance.** COL-01 to COL-07 are the shared colour reference for the selector and its
integration with the table. Use these stable identifiers in implementation tasks and validation scenarios. Any change
to a colour, its meaning or its target state must update this reference and the affected styles and checks together.
The current selector styles are in [`src/front/property-select.scss`](../src/front/property-select.scss).
Colours describe interaction states or functional structure, never the technical origin of a property.
The SVG swatches below are part of this reference and must be updated with the corresponding colour values.

| Swatch                                 | Meaning                           | Rule   | Value (over white) |
| -------------------------------------- | --------------------------------- | ------ | ------------------ |
| ![Colour](colours/navigation.svg) | Selector hover (all actions)       | COL-02 | `#ddd`    |
| ![Colour](colours/used.svg)       | Already used property             | COL-03 | `#2f8943` at 10%    |
| ![Colour](colours/surface.svg)    | Standard background               | COL-04 | `#fff`    |
| ![Colour](colours/text.svg)       | Standard text                     | COL-04 | `#444`    |
| ![Colour](colours/group.svg)      | Functional group heading (future) | COL-06 | `#e8f0fa` |

**COL-02. Selector hover.** All selector rows and navigation controls use the same neutral `#ddd` hover.
Child controls keep the row background. Hover does not encode addition, removal or navigation.
The provisional table column and its addition indicator in TAB-08 remain unchanged.

**COL-03. Already used property.** A property whose full normalised path is already used has a subtle green `color-mix(in srgb, #2f8943 10%, white)` background.
A checkbox in the first cell reflects committed usage and requests addition or removal for either property kind.
The former `+` control is removed.
Its hover follows COL-02, like every other property.

**COL-04. Neutral surfaces.** Standard property backgrounds are white `#fff`, text is `#444`
and separators are `#ddd`. These neutral colours carry no addition, deletion or grouping meaning.

**COL-05. Column confirmation.** The green flash, transition to white and return to the standard background in TAB-05
mean that the requested column has been located or added. This transient confirmation is shared by new and existing
columns; it must not imply that every activation created a column.

**COL-06. Functional group heading (reserved for future use).** Reserve a light blue background `#e8f0fa`, with
readable text, for a heading that names a functional group of properties. Use exactly the same heading colour and
presentation whether the properties belong to the current object or to a related object automatically opened inline
at the current level. Both represent the same functional grouping to the user; the underlying object structure must
not introduce a visual distinction. A group heading is a structural separator, not an addition or used-property state.
This reserves the visual convention only; functional groups and automatically opened inline relations remain future
features described in [P2-D](#p2-d-functional-groups-and-inline-relations).

**COL-07. Themes and accessibility.** The values above define the light-theme reference. Theme variants must preserve
the meanings and the identical treatment of both kinds of functional group in COL-06. Keep labels, checkboxes, the addition
indicator and visible focus so that colour is never the only cue. Apply QUA-02 for contrast and reduced motion.

## 4. Accès rapides : récents, chemins utilisés et conseils

**REC-01.** Afficher une seule liste de destinations d'objets, sans distinction visuelle de provenance. Sources, dans
cet ordre :

1. Contextes des dernières sélections effectivement nouvelles, du plus récent au plus ancien.
2. Contextes dérivés des chemins déjà utilisés par le consommateur.
3. Chemins favoris/conseillés métier fournis pour le type racine, dans leur ordre de configuration.

**REC-02.** Conversion d'une propriété sélectionnée vers une destination d'objet :

- champ terminal : l'objet qui le contient ; `client.adresse.ville.pays.code` donne `client.adresse.ville.pays` ;
- objet lié sélectionné comme valeur : sa propre structure ; `client.adresse.ville` donne ce même chemin.

Ne pas enregistrer tous les niveaux intermédiaires. Ne pas créer de raccourci pour la racine, déjà accessible dans le
fil d'Ariane.

**REC-03.** Pour les chemins déjà utilisés, conserver les destinations maximales **par branche** : supprimer une
destination ancêtre si une destination descendante est présente. Ne pas conserver seulement la profondeur maximale
globale. Exemple : conserver `client.adresse.pays`, `lignes.article.fabricant` et `commercial`, mais écarter
`client.adresse` si son descendant est déjà conservé.

**REC-04.** Ne pas supprimer pour cette raison un contexte réellement récent : un ancêtre venant d'être utilisé reste
prioritaire. Fusionner les sources en dédupliquant par chemin complet et en préservant la priorité de la première
occurrence. L'ordre des colonnes fournit un départage stable aux destinations issues du tableau.

**REC-05.** Borner la liste par une limite technique configurable, sans réglage utilisateur V1 ; valeur initiale
proposée : six destinations. Les libellés peuvent être abrégés mais doivent distinguer les homonymes. L'activation
restaure le chemin complet selon NAV-06.

**REC-06.** En V1, accepter une configuration statique optionnelle de favoris/conseils métier par type racine, notamment
via fichier ou mécanisme existant. Aucun collecteur de statistiques, apprentissage automatique ni éditeur de favoris
utilisateur à développer. Une alimentation extérieure future doit rester possible sans modifier le sélecteur.

**REC-07.** Les récents sont alimentés sur confirmation du consommateur, jamais au simple début d'un drag. Dans le
tableau, un abandon, un déplacement de colonne existante ou un clic sur un doublon n'est pas un nouvel ajout et
n'alimente pas cette liste.

## 5. Recherche de propriétés

### 5.1 Périmètre V1 et correspondance

**SEA-01.** La recherche part exclusivement de l'objet courant et explore ses propriétés et relations descendantes.
**Aucun élargissement automatique à la racine en phase 1.** Revenir à la racine via le fil d'Ariane conserve le critère
et permet d'y relancer la recherche.

Une relation inverse effectivement parcourue reste une étape explicite du chemin depuis le contexte ; elle n'autorise
pas une recherche implicite dans les ancêtres.

**SEA-02.** Rechercher des noms/libellés de propriétés et d'objets liés, pas les valeurs des enregistrements. Accepter
des fragments et plusieurs mots, présents dans le chemin complet, sans imposer leur ordre. Tous les mots doivent
correspondre à au moins un segment ou à la propriété finale. Exemple : `client pays code`. Normaliser casse, espaces et
accents selon les utilitaires disponibles.

**SEA-03.** Les candidats restent limités par SEA-01, même si les mots correspondent à des ancêtres du chemin complet
affiché. Ne pas dédupliquer par classe cible : deux chemins conduisant au même type sont des résultats différents.

### 5.2 Résultats et interactions

**SEA-04.** One logical entry per path, terminal field or related object. Show the ordered property labels from
root to final property on one line, separated by dots. The business root label is excluded, as in table column headers:

```text
Client.Adresse.Ville.Pays.Code
Client.Adresse.Ville
```

Use the same presentation and row height as ordinary properties. Truncate long paths within the available width and
expose the complete label on hover. Intermediate relation segments remain buttons for navigation and drag; the final
property keeps its normal selection or navigation action.

**SEA-05.** Cliquer sur le nom d'un résultat terminal sélectionne ; cliquer sur le nom d'un résultat relationnel ouvre.
Cliquer sur un segment du chemin ouvre ce contexte en conservant la recherche. Le champ de recherche dispose d'un
effacement immédiat pour consulter ensuite les propriétés voisines.

**SEA-06.** Présenter d'abord les résultats de la structure courante, puis les chemins proches et progressivement plus
profonds. À profondeur égale, favoriser une bonne correspondance avec le nom final, puis utiliser l'ordre métier et un
départage stable. Ne pas laisser l'ordre d'arrivée des requêtes déterminer seul l'ordre d'affichage. Préserver le focus
lors de l'enrichissement des résultats.

### 5.3 Exploration bornée et cycles

**SEA-07.** Charger et explorer les métadonnées progressivement, avec cache, annulation des travaux obsolètes et budgets
techniques bornés : profondeur, volume exploré et résultats. Une nouvelle saisie ou un changement de contexte invalide
les réponses précédentes. Les seuils sont réglés lors de l'intégration, sans préférences utilisateur V1.

Distinguer attente, recherche terminée sans résultat, erreur et exploration limitée. Ne pas annoncer une absence de
résultats définitive pendant le chargement ou après une limite atteinte.

**SEA-08.** L'exploration automatique autorise au plus un retour cyclique sur une branche de recherche, seulement
lorsque la relation d'aller concernée est N→1 ou N→N. Ne pas suivre le retour inverse d'une relation d'aller 1→N. Les
relations et leur orientation viennent des métadonnées, pas d'une supposition fondée sur les libellés.

**SEA-09.** Détecter les retours par l'historique relationnel de la branche, pas par un ensemble global de classes
visitées. Deux relations vers la même classe ne sont pas automatiquement un cycle. Si l'inverse ou sa cardinalité est
inconnu, ne pas autoriser un retour automatique incertain. Les budgets restent nécessaires même avec ces règles.

Ces limites concernent la recherche automatique, pas la disponibilité des relations en navigation manuelle. Si les
métadonnées nécessaires manquent, le signaler dans le plan et prévoir un test, sans inventer une cardinalité.

## 6. Conservation pendant la session

**STA-01.** Le sélecteur reçoit une clé opaque de l'hôte. Pour le tableau, elle correspond à son URL canonique **sans
arguments de requête**, obtenue selon le routeur existant. Ne pas supprimer une partie d'URL qui identifie réellement
une route. L'identification du tableau reste hors du composant générique.

**STA-02.** Conserver pendant la session : branche mémorisée, niveau courant, critère, récents et défilements utiles.
L'ouverture/fermeture et le rechargement de page ne perdent pas cet état. Une simple variable en mémoire ne suffit donc
pas à couvrir le rechargement ; réutiliser le stockage et la définition de session de l'application.

**STA-03.** Tout cet état est oublié à la fin de session. Ne pas transformer les récents en préférences permanentes ni
partager un état entre utilisateurs. Ne jamais sérialiser un drag actif, une colonne provisoire, des données de lignes
ou une requête en cours.

**STA-04.** À la restauration, valider les chemins. Si un chemin n'est plus accessible, revenir à son plus long préfixe
encore valide ou à la racine. Écarter les suggestions invalides. Relancer une recherche persistée depuis son contexte
valide, sans restaurer des résultats périmés comme s'ils étaient actuels.

**STA-05.** Après chargement d'une liste sauvegardée, actualiser les chemins utilisés et les suggestions qui en
dérivent. Garder les récents de session. Dans une nouvelle session, seuls les chemins présents et conseils métier
reconstruisent initialement les suggestions.

## 7. Glisser-déposer : geste commun et transitions mobiles

### 7.1 Source générique et reconnaissance

**DRA-01.** Les lignes terminales/relationnelles et les niveaux intermédiaires affichés peuvent fournir un chemin
transportable. Le sélecteur ne rend ni colonne ni vignette de colonne. L'hôte détermine la cible et la représentation
pendant le transport.

**DRA-02.** Sur ordinateur, réutiliser les seuils et conventions du drag existant. Sur mobile, déclencher le transport
lorsque le déplacement horizontal est suffisant et dominant, avec le doigt suffisamment proche du bord gauche du volet.
Pas d'appui long obligatoire ni de poignée supplémentaire.

**DRA-03.** Au début du geste, attendre une distance suffisante pour distinguer les intentions. Un mouvement surtout
vertical reste un défilement de liste. Une intention reconnue reste verrouillée jusqu'à la fin du geste : ne pas
alterner entre scroll et transport au fil des diagonales. Les seuils et la zone gauche sont des paramètres techniques à
tester sur téléphone, pas des réglages utilisateur.

**DRA-04.** Préserver défilement vertical, zoom et gestes de navigation. Avec Pointer Events, définir la politique de
gestes avant leur démarrage ; évaluer notamment `touch-action: pan-y pinch-zoom` sur les surfaces pertinentes, sans
l'imposer aveuglément à tous les conteneurs. Traiter `pointercancel` et les interruptions comme des abandons
[R1](#annexe--références-techniques).

### 7.2 Cycle de vie

**DRA-05.** Le drag transporte un chemin stable jusqu'à validation ou annulation. Masquer le panneau ne doit pas
détruire la source ou le contrôleur qui conserve le pointeur. Une capture du pointeur ne doit pas empêcher de déterminer
la cible réelle du dépôt.

**DRA-06.** Dans l'intégration tableau, le volet mobile se rabat automatiquement uniquement après reconnaissance du
drag. Sur ordinateur, il reste ouvert. Le tableau reprend le même mécanisme de déplacement, d'insertion et de défilement
horizontal aux bords dans les deux présentations.

**DRA-07.** Une fois le doigt ou le pointeur relâché et l'opération stabilisée, restaurer le volet mobile dans son état
précédent, après validation comme après annulation. Animation brève, cohérente avec les panneaux existants. Ne pas
refocaliser automatiquement le champ de recherche au point de faire surgir le clavier tactile.

**DRA-08.** Abandonner proprement en cas de dépôt hors cible, annulation système, navigation quittant l'écran ou Échap
pendant le drag. Nettoyer aperçu, écouteurs et session de transport. Ne pas rouvrir un panneau appartenant à une vue
déjà quittée.

## 8. Intégration au tableau

### 8.1 Sélection par clic et doublons

**TAB-01.** L'identification d'un doublon appartient au tableau et repose sur le chemin complet normalisé. Ne pas
confondre des homonymes ou des chemins différents vers la même classe. Ne pas créer deux colonnes pour le même chemin
dans cette intégration.

- **TAB-02.** **Intention :** Sélection par clic ou activation clavier **Chemin absent :** Ajouter la colonne en
  dernière position, la rendre visible et la mettre en évidence. Confirmer un nouvel ajout au sélecteur. **Chemin déjà
  présent :** Ne rien ajouter ni déplacer. Défiler si nécessaire pour rendre visible la colonne existante et la mettre
  en évidence à son emplacement actuel.

- **TAB-03.** **Intention :** Drag vers un emplacement valide **Chemin absent :** Insérer une nouvelle colonne à cet
  emplacement. Confirmer le nouvel ajout après validation. **Chemin déjà présent :** Déplacer la colonne existante à cet
  emplacement, sans en créer une autre ni alimenter les récents d'ajout.

**TAB-04.** Le « coup de focus » est une mise en évidence visuelle de la colonne, pas un retrait, une modification de
sélection des lignes ou un déplacement forcé du focus clavier hors du sélecteur. Utiliser le défilement nécessaire pour
la rendre visible sans mouvements inutiles.

**TAB-05.** Selon [COL-05](#33-colour-coding), après ajout par clic comme après clic sur une colonne existante,
appliquer le même flash subtil : brillance
verte, transition vers blanc, puis retour au fond standard. Préserver la lisibilité, adapter l'éclaircissement au thème
et respecter les préférences de réduction d'animations du projet. Ne pas laisser un style temporaire attaché à la
colonne.

**TAB-06.** Les activations rapides successives restent cohérentes : vérifier aussi les ajouts déjà en cours pour ne pas
créer de doublon avant la fin d'un chargement. Une erreur d'ajout n'alimente pas les récents.

### 8.2 Aperçu réel pendant le drag

**TAB-07.** Réutiliser l'ergonomie existante du déplacement/suppression de colonnes. Pour une nouvelle propriété,
représenter directement une vraie colonne provisoire dans le tableau, données incluses dès qu'elles sont disponibles.
Pas de petite étiquette flottante à la place de cet aperçu.

**TAB-08.** Selon [COL-02](#33-colour-coding), l'aperçu d'un ajout utilise un accent légèrement vert et un indicateur
d'ajout. Pour une colonne déjà présente, conserver le comportement de déplacement existant. La position d'insertion
et le défilement horizontal sont
ceux du tableau, sans second algorithme dans le sélecteur.

**TAB-09.** Afficher immédiatement la structure de la colonne provisoire ; le chargement de ses valeurs ne bloque ni le
drag ni son déplacement. Réutiliser le chemin normal de chargement/rendu du tableau et limiter les lectures à ce qu'il
charge habituellement pour la vue. Déplacer l'aperçu ne relance pas une lecture identique à chaque position traversée.

**TAB-10.** Une colonne provisoire ne devient définitive qu'au dépôt valide. Elle ne doit pas entrer dans les
configurations sauvegardées, chemins utilisés ou récents pendant son déplacement. Une réponse tardive ne doit pas
recréer un aperçu annulé.

**TAB-11.** Déposer hors du tableau, notamment au-dessus ou en dessous, annule sans ajout. Pour une colonne existante
transportée depuis le sélecteur, l'annulation restaure sa position initiale ; elle ne doit pas déclencher sa
suppression. Réutiliser les zones de dépôt du tableau, sans fallback silencieux « ajouter à la fin » sur une cible
invalide.

### 8.3 Robustesse et limites de l'intégration

**TAB-12.** Sur mobile, l'ajout par clic suivi d'un éventuel repositionnement emploie le tableau existant. Ne pas créer
un parcours supplémentaire « choisir le champ puis choisir l'emplacement ». Les moyens de repositionnement sans drag
relèvent également du tableau, pas du sélecteur.

**QUA-01.** Traiter les erreurs de métadonnées, recherche et aperçu sans perdre le contexte ni bloquer l'interaction.
Une erreur de données n'est ni un dépôt ni une annulation : la validation dépend du geste et de son acceptation par le
tableau, pas de l'achèvement du chargement.

**QUA-02.** Respecter la pile de composants et les conventions de clavier, focus, contrastes, cibles tactiles, thèmes et
animations du dépôt. En panneau mobile ouvert, ne pas laisser le focus errer dans le tableau masqué ; sur ordinateur, le
tableau reste accessible. Après fermeture explicite, le focus revient à un contrôle visible pertinent.

**QUA-03.** Le grand nombre de propriétés ou de résultats ne doit pas imposer le montage de tout le graphe. Employer
chargement différé, annulation et réutilisation des données ; ne pas introduire une infrastructure de virtualisation ou
d'indexation complète si l'existant suffit aux tests de charge représentatifs.

L’accès aux valeurs des colonnes relationnelles repose sur [DEP-11 et son contrat `select()`](select.md).
Les validations de stockage, de construction SQL et de rendu intégré doivent être planifiées dans leurs propriétaires.

## 9. Critères d'acceptation et recette

Préparer des fixtures couvrant Facture/Commande, Client, Adresse, Ville, Pays, Lignes et plusieurs chemins vers un même
type. Ajouter une relation inverse connue, un N-N et une branche cyclique. Tester les contrats génériques avec un faux
consommateur non lié au tableau.

Automatiser les cas vérifiables et exécuter les contrôles dans un navigateur réel, selon
[VAL-01 à VAL-08](validation.md). La recette commence dès les premières interactions intégrées, sans attendre L7.
Distinguer responsive, émulation tactile et appareil physique ; traiter une indisponibilité matérielle selon VAL-05.

- **T01**. **Scénario minimal :** Le sélecteur fonctionne avec un faux consommateur et sans import du tableau ; chaîne
  et segments désignent la même propriété. **Références :** ARC-01 à 04, API-01/02

- **T02**. **Scénario minimal :** Explorer Client → Adresse → Ville → Pays, revenir à Adresse puis Ville ; Pays reste
  disponible. **Références :** NAV-01 à 04

- **T03**. **Scénario minimal :** Depuis Adresse, ouvrir une autre relation ; seule la suite divergente disparaît.
  **Références :** NAV-05

- **T04**. **Scénario minimal :** Un accès rapide remplace la branche entière, ouvre le bon objet et efface la
  recherche. **Références :** NAV-06, REC-05

- **T05**. **Scénario minimal :** Cliquer sur un terminal, sur une relation et sur son `+` produit une seule action,
  conforme au type. **Références :** ACT-01 à 06

- **T06**. **Scénario minimal :** Survol/focus : les `+` ne déplacent aucun élément. Sans survol : `+` visibles
  seulement sur les relations. **Références :** ACT-03 à 05

- **T07**. **Scénario minimal :** Ajouter Ville elle-même fonctionne, sans imposer la sélection d'une de ses propriétés
  ni d'une agrégation. **Références :** ACT-02, section 1.3

- **T08**. **Scénario minimal :** Les ancêtres et descendants du fil sont accessibles sur écran étroit ; naviguer ou
  scroller ne déclenche pas un ajout. **Références :** NAV-09, ACT-07

- **T09**. **Scénario minimal :** `client pays code` retrouve le champ via les segments ; champs et objets liés
  apparaissent dans les résultats. **Références :** SEA-02 à 05

- **T10**. **Scénario minimal :** Depuis Adresse, aucun résultat extérieur à ses chemins descendants n'apparaît ;
  revenir à la racine conserve le critère. **Références :** SEA-01, NAV-03

- **T11**. **Scénario minimal :** Deux chemins vers Pays restent distincts ; clic et drag sur un niveau intermédiaire
  utilisent son vrai chemin. **Références :** API-01, SEA-03/04, ACT-07

- **T12**. **Scénario minimal :** Changer rapidement de saisie/contexte n'affiche pas les anciennes réponses ; limites
  et états vides sont distincts. **Références :** SEA-07

- **T13**. **Scénario minimal :** Vérifier les retours autorisés après N→1/N→N, le retour exclu après 1→N et les mêmes
  classes sans cycle réel. **Références :** SEA-08/09

- **T14**. **Scénario minimal :** Dédupliquer les suggestions ; conserver les maximaux par branche et la priorité d'un
  ancêtre réellement récent. **Références :** REC-01 à 05

- **T15**. **Scénario minimal :** Un abandon, déplacement ou clic sur doublon n'alimente pas les récents ; un ajout
  confirmé le fait. **Références :** REC-07, TAB-02/03

- **T16**. **Scénario minimal :** Masquer, rouvrir et recharger restaure contexte, critère, récents et scroll ; fin de
  session les efface. **Références :** UI-03, STA-01 à 03

- **T17**. **Scénario minimal :** Charger une configuration recalcule ses suggestions ; chemins devenus invalides sont
  écartés proprement. **Références :** STA-04/05

- **T18**. **Scénario minimal :** Clic nouveau : ajout final ; clic existant : pas de mouvement. Dans les deux cas,
  colonne visible et même flash. **Références :** TAB-01 à 06

- **T19**. **Scénario minimal :** Drag nouveau : aperçu réel, données chargées sans bloquer, insertion à la cible ; pas
  de vignette flottante. **Références :** TAB-07 à 10

- **T20**. **Scénario minimal :** Drag existant : une seule colonne déplacée ; abandon : position initiale restaurée,
  aucune suppression. **Références :** TAB-03/11

- **T21**. **Scénario minimal :** Dépôt hors tableau et `pointercancel` ne valident rien ; une réponse tardive ne recrée
  pas l'aperçu. **Références :** DRA-08, TAB-10/11

- **T22**. **Scénario minimal :** Mobile : un geste vertical défile ; un geste horizontal admissible démarre le drag,
  sans appui long ni clic résiduel. **Références :** DRA-02 à 04, ACT-06

- **T23**. **Scénario minimal :** Mobile : volet rabattu pendant le drag, autoscroll du tableau, restauration après
  dépôt ou abandon sans clavier intempestif. **Références :** DRA-06/07

- **T24**. **Scénario minimal :** Tester le geste près du bord physique, le fil d'Ariane long, les diagonales et les
  appareils tactiles avec souris. **Références :** NAV-09, ACT-05, DRA-03/04

- **T25**. **Scénario minimal :** Tous les ajouts sont accessibles sans drag ; focus et activation clavier restent
  cohérents avant/après fermeture. **Références :** ACT-08, QUA-02

- **T26**. **Scénario minimal :** Une grande structure, une erreur réseau et des actions rapprochées ne bloquent pas
  navigation/drag et ne doublonnent pas les colonnes. **Références :** API-03, TAB-06/09, QUA-01/03

- **T27**. **Scénario minimal :** Les boutons du panneau et de l'en-tête restent accessibles avec tableau largement
  défilé, sur desktop et mobile. **Références :** UI-01 à 03

**Fin de phase 1 :** tests pertinents exécutés, contrôles de compilation/types/style du dépôt satisfaits, non-régression
des interactions existantes du tableau et recette responsive documentée. Déclarer les tests non exécutés et leurs
raisons. Ne pas annoncer une validation sur appareil physique lorsqu'elle n'a pas eu lieu.
Les contrôles obligatoires non exécutés et les défauts connus empêchent la clôture, sauf la réserve matérielle
explicitement admise par [VAL-08](validation.md#7-recette-finale-et-remise-en-état-de-livraison).

## 10. Phase 2 : hors du développement actuel

### P2-A. Élargissement de recherche

Depuis un objet profond, présenter d'abord les résultats locaux, puis compléter automatiquement depuis la racine du
consommateur, même si le contexte local contient déjà des résultats. « Global » signifie relatif à cette racine, pas une
recherche indépendante dans toute l'application.

Conserver les résultats locaux prioritaires, dédupliquer par chemin complet et ne pas modifier le fil d'Ariane lors de
l'arrivée des résultats globaux. Ajouter un résultat global ne navigue pas. Ouvrir son objet ou un segment rejoint son
vrai chemin depuis la racine, avec les règles de branche et conservation du critère. Depuis la racine, une seule
recherche suffit.

Cette évolution remplace SEA-01 uniquement lorsqu'elle est explicitement engagée. Aucun élargissement caché, option ou
seconde passe globale dans la V1.

### P2-B. Réglages d'affichage

Panneau accessible par un engrenage, avec les libellés :

```text
Tri : métier / alphabétique
Options : Regroupements métier, Favoris en premier, Conseillés en premier
```

Sans options, utiliser le tri choisi. Si activés : favoris d'abord, puis conseillés non déjà favoris, puis autres
propriétés. Chaque propriété apparaît une seule fois. Les regroupements métier s'appliquent à l'intérieur de ces
ensembles ; le tri choisi s'applique à l'intérieur des catégories. Prévoir un groupe neutre pour les propriétés sans
catégorie.

La V1 conserve simplement l'ordre métier par défaut, sans engrenage ni cases à cocher.

### P2-C. Métadonnées enrichies

Prévoir ultérieurement des décorateurs pour catégoriser les propriétés et déclarer, par classe métier, des chemins
fonctionnellement proches dans un ordre explicite. Ils pourront alimenter les conseils, le classement des recherches ou
les affichages de P2-B. Les noms de décorateurs seront choisis après inspection des conventions du framework.

Ne pas développer maintenant le calcul statistique des habitudes, la détection des colonnes absentes de toutes les
listes sauvegardées ou une gestion supplémentaire de configurations. La source statique V1 reste suffisante.

### P2-D. Functional groups and inline relations

When an object has many properties, introduce separator headings naming functional groups. Also allow selected
relations to open automatically inline at the current level. Present the resulting properties under the same kind of
functional group heading: users need not distinguish properties stored on the current object from those stored on a
related object. Both headings must use the shared blue coding defined by [COL-06](#33-colour-coding).
Keep each property's full path for selection and duplicate detection. These features are reserved for future work;
this specification update does not enable them in phase 1.

## 11. Découpage et exécution par agents en contexte neuf

### 11.1 Préparation dans le dépôt

Le premier passage est un travail d'analyse et de planification, sans implémentation produit :

1. Vérifier l'état du dépôt et lire les instructions applicables. Ne pas effacer, déplacer ou masquer des changements
   préexistants pour obtenir artificiellement un dépôt propre.
2. Cartographier les points d'extension réellement existants : métadonnées, relations inverses, chemins, session,
   panneau, tableau, données et drag.
3. Définir le contrat minimal entre sélecteur, fournisseur et adaptateur, puis les fichiers et commandes de validation
   réellement concernés.
4. Produire un plan ordonné et des fiches de tâches dans l'emplacement documentaire prévu par le projet. Relier chaque
   exigence V1, DEP-01 à DEP-11 et VAL-01 à VAL-08 à au moins une tâche et aux tests utiles. Inclure les
   développements dans les packages propriétaires et ordonner leurs contrats avant leurs consommateurs, selon la
   [prise en compte dans le plan](dependencies.md#7-prise-en-compte-obligatoire-dans-le-plan). Marquer la phase 2
   exclue.

Résoudre les inconnues du dépôt sans rouvrir les arbitrages UX. Documenter toute incompatibilité réelle, son impact et
l'adaptation minimale proposée ; ne pas modifier silencieusement le périmètre.

### 11.2 Pré-découpage indicatif

Pré-découpage à adapter après audit. Scinder les lots si nécessaire ; chaque tâche livre un résultat cohérent et
testable, pas seulement un fichier isolé.

- **L0**. **Livrable cohérent :** Audit, contrats, plan et fiches de tâches ; aucune fonctionnalité développée.
  **Dépendances logiques :** Aucune.

- **L1**. **Livrable cohérent :** Chemins, fournisseur, navigation et événements génériques testés avec faux
  consommateur. **Dépendances logiques :** L0.

- **L2**. **Livrable cohérent :** Liste, fil d'Ariane, boutons et panneau ; première intégration des clics au tableau
  avec doublons/focus. **Dépendances logiques :** L1.

- **L3**. **Livrable cohérent :** Recherche locale, résultats navigables, exploration bornée et cycles. **Dépendances
  logiques :** L1, L2.

- **L4**. **Livrable cohérent :** Suggestions unifiées, état de session, restauration et changement de configuration.
  **Dépendances logiques :** L1 à L3.

- **L5**. **Livrable cohérent :** Transport générique et intégration drag desktop : aperçu réel, déplacement des
  doublons et rollback. **Dépendances logiques :** L2 à L4.

- **L6**. **Livrable cohérent :** Présentation mobile et gestes tactiles ; repli/restauration du volet et tests de
  conflit de gestes. **Dépendances logiques :** L5.

- **L7**. **Livrable cohérent :** Recette transversale, erreurs, charge représentative, clavier, thèmes et
  non-régression. **Dépendances logiques :** Lots précédents.

Tester à chaque tâche. L2 éprouve tôt la séparation générique/tableau ; L7 complète la recette, il ne la commence pas.
Prévoir l’environnement de test avant les développements produit et une sous-tâche de vérification navigateur
après chaque livraison d’interactions, selon [VAL-01/02](validation.md). Une sous-tâche de livraison suit la recette
finale.

### 11.3 Contenu d'une fiche de tâche

Chaque fiche contient uniquement ce qui est nécessaire à son exécution autonome :

```text
Identifiant et titre
Objectif observable
Prérequis : tâches/contrats déjà livrés
Références : sections et identifiants de ce document
Points d'entrée : fichiers et API constatés dans le dépôt
Travail demandé et limites explicites
Critères d'acceptation et tests à ajouter/mettre à jour
Commandes de validation exactes
Parcours navigateur, URL, fixtures, dimensions et preuves, pour les tâches concernées
Modèle, effort, justification et nouvelle vérification après correction
Livrables attendus, y compris documentation technique utile à la suite
```

Ne pas recopier ces spécifications dans chaque fiche. L'agent reçoit titre, description et références à consulter, puis
lit instructions locales et code courant. Aucun prérequis ne doit dépendre d'un « comme discuté précédemment ».

### 11.4 Règles pour l'orchestrateur

- **Exécution strictement séquentielle :** un nouveau sous-agent par tâche, aucun suivant avant terminaison et
  validation du précédent. Pas de sous-délégation récursive.
- **Contexte neuf :** transmettre la fiche et ses références, sans conversations ni raisonnements précédents. Vérifier
  l'absence effective d'héritage d'historique dans le lanceur utilisé ; un nouveau nom d'agent ne la garantit pas. Ne
  pas inventer d'option absente de la version installée.
- **Rôle limité :** l'orchestrateur déclenche, attend, contrôle et rapporte ; il n'implémente pas les fonctionnalités à
  la place du sous-agent. Un défaut ouvre les sous-tâches correctives de
  [VAL-07](validation.md#6-corrections-autonomes-et-nouvelle-vérification), puis une vérification indépendante.
  Les fonctionnalités dépendantes attendent la réussite ; seul un blocage réel arrête le chantier.
- **État reproductible :** démarrer depuis le point de contrôle Git attendu, vérifier les prérequis et l'absence de
  modifications étrangères. À chaque étape, laisser une modification cohérente, validée et attribuable selon les
  conventions de commit du dépôt. Les changements initiaux sans rapport sont identifiés et préservés selon le
  [prompt d’orchestration](itrocks-property-select-prompt-orchestrateur.md#1-rôle-autonomie-et-état-initial).
  Aucun push, déploiement ni nettoyage destructeur implicite.
- **Validation :** examiner le résultat et les tests rapportés ; ne pas confondre compilation réussie et respect des
  critères UX. Les validations impossibles sont signalées, pas déclarées réussies.
- **Mémoire dans le dépôt :** seuls le code, les tests et les contrats/documentations stabilisés servent aux tâches
  suivantes. Retour court : statut, fichiers, contrôles exécutés, limites et référence du point de contrôle éventuel. Ne
  pas faire transiter de longs journaux entre agents.

Modèles, niveaux de raisonnement, lancement et isolation restent des choix d'exécution, à raccorder à l'environnement
existant [R2, R3](#annexe--références-techniques). Ne pas modifier les permissions ni installer un nouvel orchestrateur
pour ce chantier.

## 12. Prompt de préparation à donner à Codex

À utiliser après ajout de ce fichier au dépôt et enregistrement d'un point de contrôle Git propre. Les documents de
planification produits seront à leur tour validés et enregistrés avant de lancer l'orchestrateur.

Pour préparer puis exécuter automatiquement la phase 1, utiliser plutôt le
[prompt d’orchestration](itrocks-property-select-prompt-orchestrateur.md).

```text
Lis docs/it-rocks-selecteur-relationnel-specifications.md, docs/dependencies.md,
docs/select.md, docs/validation.md et les AGENTS.md applicables.
Commence par vérifier que le dépôt est dans un état propre ; sinon arrête-toi et
signale les modifications sans les effacer ni les masquer.

Ta mission actuelle est uniquement de préparer le développement de la phase 1.
Inspecte les implémentations et tests existants, précise les contrats minimaux
sélecteur générique / fournisseur de métadonnées / adaptateur tableau, puis
produis un plan ordonné et des fiches de tâches exécutables successivement par
des sous-agents en contexte neuf. Ne développe pas encore les fonctionnalités.
Tu peux créer les documents de planification dans l'emplacement adapté au dépôt.

Chaque tâche doit être bornée, autonome par sa description et ses références,
expliciter ses dépendances, les fichiers/API réellement concernés, les exigences
et tests couverts, les commandes de validation et ce qui est exclu. Maintiens
une couverture de toutes les exigences V1, DEP-01 à DEP-11 et VAL-01 à VAL-08.
Prévois les développements et liaisons dans les packages propriétaires, ainsi que
la recette hors it.rocks. Le pré-découpage de la section 11 est
indicatif : ajuste-le à l'existant sans modifier les décisions fonctionnelles.

Réutilise les composants et interactions existants. Garde tout comportement de
colonne, aperçu, doublon ou focus hors du sélecteur générique. N'implémente aucune
évolution de phase 2, même partiellement. Ne recopie pas les specs dans les tâches
et ne rends aucune tâche dépendante de cette conversation. Signale seulement les
incompatibilités ou inconnues techniques réellement bloquantes, avec leur impact.

Termine par les chemins des documents produits, l'ordre des tâches et les éventuels
blocages. N'enchaîne pas sur leur exécution pendant ce passage de planification.
```

## Annexe : références techniques

Les décisions produit proviennent des arbitrages utilisateur, non de ces sources. Les références ci-dessous servent
uniquement aux contraintes de gestes et au raccordement des instructions d'agents. Consultées le 15 octobre 2026.

- **[R1] W3C, Pointer Events**, notamment `touch-action`, prise en charge des gestes et `pointercancel` : [Pointer
  Events](https://www.w3.org/TR/pointerevents3/)
- **[R2] OpenAI, Custom instructions with `AGENTS.md`** : [instructions
  personnalisées](https://developers.openai.com/codex/guides/agents-md)
- **[R3] OpenAI, Subagents**, délégation de travaux bornés et instructions de coordination :
  [sous-agents](https://developers.openai.com/codex/agent-configuration/subagents)

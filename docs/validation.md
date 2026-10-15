# Validation et livraison autonome de la phase 1

Ce document complète les [spécifications](it-rocks-selecteur-relationnel-specifications.md) et les [contrats
d’intégration](dependencies.md). Il définit les contrôles obligatoires du [prompt
d’orchestration](itrocks-property-select-prompt-orchestrateur.md). Les validations ci-dessous sont à planifier, pas déjà
exécutées.

## 1. Préparer une recette réellement exécutable

**VAL-01.** Avant les développements produit, une sous-tâche dédiée établit et exerce l’environnement de validation.
Elle livre `ENVIRONMENT.md` dans le dossier de suivi, contenant :

- chemins des dépôts, versions des outils, mode de liaison des packages locaux et commandes de reconstruction ;
- commandes exactes de démarrage, URL, ports, détection de disponibilité et arrêt des seuls processus créés ;
- navigateur et outil de pilotage réellement disponibles, méthode d’émulation tactile et tailles de fenêtres ;
- initialisation reproductible des fixtures, connexion de test éventuelle et remise à zéro des données de test ;
- commandes de tests par package et commande de recette intégrée ;
- base MySQL/MariaDB de test isolée, préparation des données et observation des requêtes pour DEP-11 ;
- état initial des tests, erreurs connues et limites constatées, distincts des défauts introduits par le chantier.

Exécuter un démarrage et une navigation de contrôle, pas seulement écrire ces commandes. Utiliser les outils de
navigateur disponibles ou l’outillage déjà installé du dépôt ; vérifier leurs possibilités avant de leur confier des
tests. Ne pas supposer qu’une exécution de tests DOM fournit un vrai navigateur. Un serveur de test doit pouvoir être
relancé avec les mêmes fixtures par le sous-agent suivant.

Choisir des données synthétiques et des ressources de test isolées. Une base de développement existante n’autorise pas
l’effacement de son contenu. Préparer automatiquement les comptes et données synthétiques lorsque les moyens locaux le
permettent ; ne pas demander de connexion humaine comme étape normale de la recette. Ne pas inscrire de secret dans les
documents, captures, commits ou rapports.

L’absence d’accès à des données privées ne doit pas empêcher de construire une intégration locale représentative avec la
vraie pile du framework. Si un service indispensable manque, rechercher les possibilités locales autorisées et
documentées avant de déclarer le blocage ; ne pas remplacer la recette intégrée par un faux backend sans le dire. Ne pas
élargir les permissions, installer un orchestrateur ou modifier un service partagé pour contourner un blocage.

## 2. Planifier les contrôles avant l’implémentation

**VAL-02.** Le plan livre `VALIDATION.md`, une matrice de couverture reliant :

- chaque exigence V1, DEP-01 à DEP-11 et VAL-01 à VAL-08 ;
- les scénarios T01 à T27 et les cas supplémentaires du volet et des ports ;
- les tâches d’implémentation, de vérification et les packages concernés ;
- la méthode : test unitaire, contrat, intégration, navigateur ou appareil physique ;
- les résultats attendus et les emplacements des preuves, renseignés à l’exécution.

La recette finale ne doit pas être le premier essai dans le navigateur. Après chaque livraison qui modifie une
interaction visible, prévoir une sous-tâche distincte de vérification navigateur, avant les fonctionnalités suivantes.
Un lot purement interne exige les tests appropriés ; il ne nécessite pas une répétition artificielle de toute la
recette. Les contrats stables font l’objet de tests entre modules, en plus des tests isolés de chaque propriétaire.

Chaque fiche de vérification contient l’URL, les fixtures, le parcours, les actions d’entrée, les observations
attendues, les commandes, les dimensions et modes d’entrée concernés, les preuves à produire et les conditions de
réussite. Les données du rapport d’implémentation ne remplacent pas l’exécution indépendante du parcours.

## 3. Deux environnements fonctionnels obligatoires

**VAL-03.** La recette couvre séparément :

1. Une démonstration autonome de `property-select`, avec catalogue statique et consommateur de test, sans chargement de
   `framework`, `home`, `list`, `table` ou adaptateur de réflexion it.rocks. Exercer les intentions et confirmations, la
   configuration des ports, les défauts et le démontage. Un port de stockage de test peut exercer la restauration.
2. Une application locale utilisant les vrais modules `framework`, `home`, `list`, `table`, `reflect` et `reflect-path`,
   les vrais branchements, les routes et la session de test. Exercer le chargement et le rendu des valeurs de colonnes,
   les sauvegardes d’état et le renouvellement des vues. Le seul succès de la démonstration autonome ne suffit pas.

Les fixtures couvrent les racines et relations de la section 9 des spécifications, plusieurs chemins vers un même type,
un inverse connu, une relation N-N, un cycle, une cardinalité inconnue et un chemin devenu invalide. Les contrats de
session sont aussi éprouvés avec deux sessions distinctes, sans partager l’état entre utilisateurs. Les fixtures ne
doivent pas introduire d’agrégation ou de fonctionnalité de phase 2 pour rendre un cas de phase 1 testable.

Avant la vérification intégrée des colonnes relationnelles, exécuter les tests de DEP-11 sur une vraie base
MySQL/MariaDB de recette. Contrôler les valeurs projetées, colonnes objets, relations absentes, critères sur chemins
non projetés, alias, conversions et cohérence tri/compte/pagination. Les tests du SQL généré seuls ne suffisent pas.
La recette navigateur de `list` doit afficher les résultats de `select()` avec les vrais branchements, notamment
une colonne objet et un chemin terminal descendant. Référencer les preuves SQL et celles du navigateur séparément.

## 4. Contrôles navigateur progressifs

**VAL-04.** Démarrer l’application reconstruite, ouvrir les routes réelles et piloter les interactions dans un moteur de
navigateur réel. Les tests de fonctions, les événements appelés directement sur des méthodes ou un DOM simulé complètent
ces contrôles sans les remplacer. Le choix d’outil reste celui effectivement vérifié par VAL-01.

Les vérifications successives portent au minimum sur :

- **Navigation et clics, dès L2 :** terminal, relation, `+`, absence de double ajout, fil d’Ariane conservé et clavier.
  Vérifier aussi le volet `home` : vide donc sans commande, contenu présent et volet rabattu, position de l’icône,
  déplacement et inversion à l’ouverture, titre, fermeture et focus, tableau restant utilisable sur ordinateur.
- **Recherche, après L3 :** contexte local, mots multiples, chemins distincts, navigation depuis un résultat,
  effacement, recherche sans résultat et états de chargement, erreur ou limite. Vérifier les réponses obsolètes.
- **État, après L4 :** suggestions après ajout confirmé, doublon ou annulation, fermeture/réouverture, rechargement réel
  de la page, fin de session et changement de configuration.
- **Drag, après L5 :** nouvelle colonne provisoire avec valeurs, déplacement d’une colonne existante, insertion
  avant/entre/après les colonnes autorisées, défilement aux bords et doublons en cours d’ajout. Vérifier abandon hors
  tableau, Échap, annulation du pointeur et réponse tardive sans recréation d’aperçu. Contrôler le retour à l’ordre
  initial et l’absence de suppression depuis le sélecteur.
- **Responsive et tactile, après L6 :** volet plein écran, commandes accessibles, fil d’Ariane long, défilement vertical
  distinct du geste horizontal, diagonales, repli pendant le drag et restauration sans clavier. Tester aussi souris et
  clavier après changement de taille et émulation tactile.

Exercer les actions avec le mécanisme d’entrée adapté, notamment le transport du pointeur pour le drag. Si une
interruption système ne peut être générée par l’outil, la vérifier au niveau de contrat et signaler la limite spécifique
du contrôle navigateur ; ne pas prétendre l’avoir reproduite physiquement. Observer les erreurs console et les requêtes
échouées quand l’outil les expose ; sinon préciser cette limite et utiliser les journaux serveur ainsi que les
observations disponibles pour diagnostiquer les anomalies.

**VAL-05.** La fiche fixe des dimensions reproductibles : ordinateur avec survol, fenêtre étroite et smartphone avec
émulation tactile. La recette responsive inclut portrait et paysage, débordements, cibles tactiles, contraste, focus
visible et réduction des animations. Ne déclarer testés que les navigateurs et modes réellement exécutés.

L’émulation tactile est obligatoire pour valider automatiquement les gestes de phase 1 ; un simple redimensionnement ne
suffit pas. Tester également un appareil tactile physique s’il est déjà accessible au pilote. Si aucun appareil physique
n’est accessible, terminer les contrôles automatisables et livrer sans solliciter l’utilisateur pour ce contrôle.
Mentionner précisément le risque résiduel des gestes système, du bord d’écran et du clavier natif ; ne pas présenter
l’émulation comme une recette sur téléphone réel. Une absence d’émulation tactile empêche la validation des gestes, même
si la souris fonctionne.

## 5. Preuves et décisions de validation

**VAL-06.** Chaque vérificateur renseigne la matrice et un rapport court avec :

- version ou points de contrôle testés, commandes, URL, fixtures, navigateur, dimensions et modes d’entrée ;
- scénario, résultat attendu, résultat observé et verdict `PASS`, `FAIL`, `BLOCKED` ou `NOT_RUN` ;
- preuves pertinentes : assertions, sortie de test, captures des états visuels et traces disponibles ;
- défauts reproductibles, étapes minimales et packages propriétaires, sans journaux volumineux dans les retours
  d’agents.

Une capture documente un rendu, pas le succès d’une interaction. Pour un déplacement, vérifier aussi l’ordre effectif,
la persistance après rechargement, l’absence de doublon et le nettoyage des états provisoires. Un test désactivé, une
assertion affaiblie ou un parcours omis ne résout pas une anomalie. Les preuves utilisent les données synthétiques et un
emplacement stable défini par le plan ; les traces volumineuses peuvent rester hors Git si leur emplacement est conservé
et consultable. Les rapports de verdict restent versionnés.

## 6. Corrections autonomes et nouvelle vérification

**VAL-07.** Un test échoué produit une tâche de correction dans le périmètre V1, puis une nouvelle tâche de
vérification. Il ne nécessite pas une demande de décision utilisateur et ne permet pas de poursuivre les fonctionnalités
dépendantes tant que le défaut persiste.

Le vérificateur consigne le défaut et retourne `NEEDS_FIX`. L’orchestrateur insère une fiche de correction et une fiche
de nouvelle vérification dans le manifeste, avec dépendances, propriétaires, modèle, effort et périmètre précis. Il peut
déléguer leur rédaction lorsque le diagnostic demande une analyse ; il ne code pas le correctif lui-même. Chaque tâche
utilise un nouveau sous-agent sans historique hérité. Le contrôleur de la nouvelle vérification est distinct de l’auteur
du correctif et relit les preuves sur l’état corrigé.

Chaque livraison vérifie les conventions des packages propriétaires et la répartition SOLID décrite par le prompt.
Les écarts d’architecture sont des défauts à corriger même si le parcours utilisateur semble fonctionner.

Le correcteur reproduit le défaut, ajoute ou ajuste un test de régression utile, corrige dans le module propriétaire,
exécute les contrôles concernés et livre son résultat. Il n’affaiblit pas les critères ni l’architecture pour réussir.
Relancer les vérifications affectées et leurs intégrations ; une modification après recette invalide les preuves
correspondantes et impose leur renouvellement.

Après deux cycles sans résolution d’un même défaut, déléguer un diagnostic transversal selon le calibrage de la
section 3 du prompt, en évaluant Astra pour les difficultés complexes. Une
difficulté identifiée peut justifier une fiche en `xhigh`. Continuer si un diagnostic et un progrès vérifiables
permettent une correction ciblée. Après trois cycles sans progrès et sans nouvelle piste testable, produire un blocage
explicite avec reproducer et état conservé, au lieu de recommencer la même tentative ou d’annoncer un succès. Un simple
test rouge, une correction de plan ou un besoin d’extension conforme à DEP-01 à DEP-11 ne suffit pas à bloquer.

## 7. Recette finale et remise en état de livraison

**VAL-08.** Après les lots fonctionnels et leurs corrections, lancer deux sous-tâches distinctes :

1. Recette finale indépendante avec le profil `high` retenu selon la section 3 du prompt, Astra compris : reconstruire
   les packages et l’application, vérifier les
   branchements livrés, rejouer la matrice fonctionnelle et les parcours navigateur sur les deux environnements,
   contrôler les non-régressions de liste, tri, déplacement/suppression depuis les en-têtes et colonnes gelées.
2. Livraison en `gpt-6.1-sol` / `medium` : vérifier les versions, exports et ressources distribuées, la résolution des
   modules locaux, les commandes reproductibles, la documentation et les points de contrôle de tous les dépôts.
   Redémarrer et ouvrir l’application finale, exécuter un parcours de contrôle avec les modules réellement livrés, puis
   laisser une URL utilisable et les instructions de relance. Vérifier que le serveur répond encore au bilan.

Si l’application existante utilisait déjà un serveur, ne pas l’arrêter ni le remplacer sans nécessité. Un serveur de
recette créé pour la livraison peut rester disponible ; consigner son propriétaire et sa commande d’arrêt. Les autres
ressources temporaires du chantier sont nettoyées sans toucher aux données ni processus préexistants. Si le contrôle de
livraison découvre un défaut, appliquer VAL-07 puis renouveler les validations affectées avant clôture.

La phase 1 n’est terminée que si toutes les exigences applicables ont une preuve et si aucun défaut fonctionnel connu ni
contrôle obligatoire non exécuté ne reste ouvert. Un compte rendu « compilation réussie » n’est pas un verdict final. La
seule réserve matérielle admise sans empêcher la livraison est l’absence de téléphone physique, à condition que les
contrôles navigateur, responsive et tactiles émulés soient réussis et la réserve décrite selon VAL-05. Le bilan
distingue alors « phase 1 validée sur les environnements exécutés » et « téléphone physique non vérifié ».

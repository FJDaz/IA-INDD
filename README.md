# Import Markdown → InDesign

**Le fil rouge d'un programme de formation.** Un plugin **ExtendScript** pour Adobe InDesign qui importe un fichier Markdown et applique automatiquement la **charte de styles réelle du document ouvert** — sans qu'aucun nom de style ne soit codé en dur.

Ce dépôt **est un produit support** de déroulement pour un **module de formation**. C'est le *fil rouge guidé* du programme **« Personnaliser son UI InDesign avec l'IA »**, dont l'énoncé détaillé figure dans [`programme_de_formation_indesign_ia_extendscript.md`](programme_de_formation_indesign_ia_extendscript.md). Le plugin qui s'y construit met en œuvre les étapes de construction d'une fonctionnalité nouvelle **destinée à faire partie intégrante de l'interface d'InDesign**.

---

## Le besoin réel derrière l'exercice

L'interfaçage avec les modèles de langage (LLM) devient **une part de plus en plus prégnante** des métiers de la mise en page : générer, réécrire, structurer, importer du contenu produit ou assisté par IA. Or InDesign est un outil **fermé** : rien n'y relie nativement un document à une source Markdown, à un LLM, à un flux de production textuelle.

Ce module part d'un besoin concret — **importer un Markdown et le conformer au document** — pour apprendre à **construire soi-même la brique manquante**, avec l'IA comme atelier. L'importateur Markdown est le prétexte ; **la compétence transmise est la démarche complète** : cadrer, spécifier, implémenter, mesurer, capitaliser — sur un environnement réel, avec un livrable réel.

---

## La place de ce module dans la formation

Le programme suit une progression volontaire : des briques InDesign à automatiser, vers l'outil métier personnel.

| Module | Contenu | Rôle |
|---|---|---|
| **1 — Remise à niveau** | Styles avancés, styles imbriqués/GREP, Rechercher-Remplacer GREP, tableaux, objets ancrés, variables de texte, gabarits et héritage | Maîtriser les briques InDesign qu'un script doit piloter |
| **2 — Fondations et environnement** | Écosystème LLM, clés API/*providers*, posture **Architecte vs Ouvrier**, installation de VS Code et de l'environnement ExtendScript | Comprendre l'IA et installer l'atelier de travail |
| **3 — Fil rouge guidé** | **Ce dépôt** : cahier des charges de l'importateur Markdown, gestion des erreurs, wiki récursif, sandbox Node.js, mapping de styles, tableaux | Construire un script complet en appliquant la méthode |
| **4 — Atelier personnel** | Cadrage du besoin propre au stagiaire, architecture, implémentation, recette | Transposer la méthode à son propre outil métier |

Autrement dit : le **Module 3 est ce dépôt**. Le stagiaire ne le découvre pas comme une démonstration terminée, mais comme **le journal d'une construction** qu'il est invité à refaire, en comprenant chaque décision.

---

## La progression de la construction

Ce dépôt est organisé comme **le chemin réel d'une construction**, dans l'ordre où les problèmes se sont posés — pas comme un tutoriel idéalisé. Les grandes étapes, telles que les raconte [`atelier_importateur_md.md`](atelier_importateur_md.md) :

1. **Cadrer** — définir ce qu'on veut avant d'écrire une ligne de code.
2. **Poser un principe directeur** — ne jamais coder un nom de style en dur : toujours lire la charte réelle du document.
3. **Essuyer les premiers plantages** — les erreurs de syntaxe sont les plus faciles à corriger : le logiciel les signale lui-même.
4. **Instrumenter** — remplacer les captures d'écran par un journal d'erreurs exploitable.
5. **Corriger un bug de structure** — les styles rangés en dossiers (groupes) exigeaient une traversée récursive.
6. **Soigner le confort de test** — présélection automatique, bouton Réinitialiser.
7. **Franchir le mur** — le texte arrive, mais dans le désordre dès qu'apparaît du gras.
8. **Changer de méthode** — isoler une seule variable (retirer le gras) plutôt qu'un quatrième correctif au hasard.
9. **Vérifier hors InDesign** — reproduire la logique de découpage dans un script autonome (embryon de la **sandbox Node.js**).
10. **Réintroduire une fonctionnalité à la fois** — espaces, séparateurs, puis vrais tableaux InDesign natifs.
11. **Capitaliser** — écrire ce qu'on a appris, pas seulement ce qu'on a fait (naissance du **wiki**).

Ce fil narratif est le cœur pédagogique du dépôt : **la compétence visée n'est pas de connaître le résultat final, mais de savoir traverser ce chemin** — et de reconnaître qu'une bonne partie du temps perdu vient de comportements d'InDesign qui contredisent la documentation communément citée.

---

## Ce que la construction a produit

Au-delà du plugin lui-même, le parcours laisse trois traces réutilisables — c'est la matière que ce dépôt donne à voir, et que le Module 4 invite à reproduire.

### 1. Un wiki de 45 cas vérifiés (`doc/wiki_extendscript_indesign.md`)

Chaque cas suit le même gabarit et porte un **statut de source** explicite :

| Statut | Signification |
|---|---|
| `sourcé` | comportement confirmé par la documentation officielle Adobe ou une spécification (citation verbatim) |
| `mesuré` | comportement constaté en exécution réelle dans InDesign, journal à l'appui |
| `mixte` | une partie sourcée, une partie mesurée (les deux sont distinguées) |

Exemples de cas, tous issus de blocages réels :

- **Cas 07 / 08** — ni `JSON` ni `Array.prototype.indexOf` n'existent en ExtendScript (ES3) : tout code venu du web doit être réécrit.
- **Cas 26** — `Paragraph.index` n'est **pas** un index de paragraphe, mais un offset de caractère. Le nom de la propriété induit en erreur.
- **Cas 42** — un GREP ne peut poser qu'**un seul** style de paragraphe par requête (`appliedParagraphStyle` est scalaire, aucune variante plurielle n'existe dans le DOM) ⇒ *N* niveaux exigent *N* passes. Établi par contre-épreuve réelle, pas par lecture du nom des propriétés.
- **Cas 40** — dans une sonde non interactive, `alert` **et** `confirm` sont tous deux en lecture seule ; la croyance inverse (« `confirm` est écrasable ») a été **corrigée le 29/09/2026** après 8 tentatives dans 4 contextes.
- **Cas 45** — `File.modified` ne bouge pas quand le contenu change dans la même seconde, et `File.read()` normalise les fins de ligne : **ni la date ni la taille ne sont un signal de contenu**.

Le wiki comprend aussi un **index par thème** et un **index par symptôme**, pour partir du problème observé et remonter au cas.

### 2. Un protocole de test qui distingue le réel de la simulation

Le projet applique une règle stricte : **une affirmation n'est valide que si elle est produite par le vrai logiciel, dans les conditions de production**.

- Les vérifications passent par de **vraies exécutions dans InDesign**, via des sondes qui journalisent dans un fichier (le canal clipboard y est peu fiable).
- Ce qui est *simulé* est étiqueté comme tel et ne peut jamais servir de preuve.
- Les conclusions négatives sont conservées : plusieurs cas documentent ce **qui ne marche pas** (voir Cas 37 sur les liens dynamiques), parce qu'une impasse mesurée vaut mieux qu'une hypothèse rassurante.

### 3. Des sondes instrumentées plutôt que des suppositions

Quand une API se comporte de façon inattendue, le projet n'ajoute pas un correctif au hasard : il écrit une **sonde** qui mesure le comportement, journalise son résultat, et alimente le wiki. Les scripts du dossier `tools/` sont ces sondes — elles sont conservées comme trace de la démarche.

---

## État du projet

| Chantier | État |
|---|---|
| Import Markdown + mapping dynamique des styles | **opérationnel** (v1) |
| Lecture de l'identité du document (empreinte du fichier importé) | **opérationnel** |
| Carte du système (menus, liens, storytelling InDesign) | **exploré**, conclusions documentées |
| Panneau UXP | **en exploration** |
| Lien dynamique natif vers une source Markdown | **conclusion négative documentée** (Cas 37) |

**Cap à terme** : l'importateur n'est qu'un premier jalon. La fonctionnalité visée — relier InDesign au contenu produit par ou avec l'IA — est destinée à devenir une **partie intégrante de l'interface d'InDesign**, et non un script qu'on lance à la main. Les chantiers « panneau UXP » et « lien dynamique » de la table ci-dessus sont les premières explorations de cette intégration.

Le projet suit une liste de missions numérotées avec un statut explicite : voir [`COMMUNICATION/ROADMAP.md`](COMMUNICATION/ROADMAP.md). Chaque mission comporte son compte rendu *inline*, avec les preuves d'exécution dans le bloc de la mission.

---

## Stack

- **ExtendScript (ES3)** — le moteur de script historique d'InDesign. Contraintes structurantes : pas de `JSON`, pas d'`Array.indexOf`, pas de `let`/`const`, sources en ASCII pur.
- **Adobe InDesign** — version 21.x testée (macOS, `fr_FR`).
- **UXP** — runtime de plugins moderne, en exploration (voir Cas 38 sur le versionnage `minVersion`/`maxVersion`).

---

## Structure du dépôt

```
import_md.jsx                  Script principal : parsing Markdown, mapping, application des styles
programme_de_formation_...md   Énoncé du programme de formation (Modules 1 à 4)
atelier_importateur_md.md      Récit de l'atelier : la progression de la construction, étape par étape
tools/                         Sondes instrumentées (mesures de comportement InDesign)
uxp/                           Panneau UXP en exploration
doc/
  wiki_extendscript_indesign.md  Base de connaissance : 45 cas + index par thème et par symptôme
  GUIDE_UTILISATION.md           Guide d'installation et d'utilisation du plugin
  architecture/                  Notes d'architecture (dont le patron de wiki récursif)
COMMUNICATION/
  ROADMAP.md                     Registre des missions et de leurs statuts
  mission_*.md                   Spécification et compte rendu de chaque mission
fixtures/                      Jeux de test
```

---

## Documentation

- **[`programme_de_formation_indesign_ia_extendscript.md`](programme_de_formation_indesign_ia_extendscript.md)** — l'énoncé du programme dont ce dépôt est le Module 3 (fil rouge guidé).
- **[`atelier_importateur_md.md`](atelier_importateur_md.md)** — la progression de la construction, racontée dans l'ordre où les problèmes se sont posés.
- **[`doc/wiki_extendscript_indesign.md`](doc/wiki_extendscript_indesign.md)** — la base de connaissance : 45 cas, index par thème, index par symptôme, et en tête la *méthode générale* de développement fiable d'un script ExtendScript.
- **[`COMMUNICATION/ROADMAP.md`](COMMUNICATION/ROADMAP.md)** — les missions, leur statut et leurs comptes rendus.
- **[`doc/GUIDE_UTILISATION.md`](doc/GUIDE_UTILISATION.md)** — installer le script, le lancer, configurer le mapping, dépanner.

---

## Installation rapide

1. Placer `import_md.jsx` dans le dossier Scripts Panel d'InDesign :

   ```
   ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/
   ```

2. Redémarrer InDesign : le script apparaît dans **Fenêtre > Utilitaires > Scripts**.
3. Ouvrir un document disposant d'une charte de styles, sélectionner un bloc de texte, lancer **Import MD**.
4. Associer chaque élément Markdown à un style du document lors de la première utilisation (le mapping est ensuite mémorisé dans le document).

> Les sondes du dossier `tools/` et le panneau `uxp/` contiennent des chemins de projet marqués par un **placeholder** (`/chemin/vers/INDD/IMPORT_MD`) : à adapter à votre installation. Les scripts exécutés depuis le panneau Scripts déduisent eux-mêmes leur dossier de destination.

---

## Limites connues

- **Pas de prévisualisation** : le mapping se configure avant de voir le résultat.
- **Un seul niveau de liste** : les listes imbriquées ne sont pas gérées en v1.
- **ExtendScript est figé** : le moteur reste en ES3, sans perspective d'évolution.
- **Le lien dynamique natif vers un `.md` ne fonctionne pas** — mesuré et documenté (Cas 37), le contrôle de fraîcheur du fichier source reste la seule voie fiable à ce jour.

---

## Licence

Ce code est fourni tel quel, sans garantie. Libre d'utilisation et de modification.

---

**Version** : 1.1 — **Dernière mise à jour** : 2026-09-30

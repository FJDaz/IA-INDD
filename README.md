# Import Markdown → InDesign

Un plugin **ExtendScript** pour Adobe InDesign qui importe un fichier Markdown et applique automatiquement la **charte de styles réelle du document ouvert** — sans qu'aucun nom de style ne soit codé en dur.

Ce dépôt documente autant le **résultat** que la **méthode** employée pour l'obtenir. C'est ce second aspect qui le distingue : chaque affirmation sur le comportement d'InDesign y est rattachée à une mesure réelle, à une source officielle, ou explicitement signalée comme non vérifiée.

---

## Le projet en une phrase

Écrire un script InDesign qui tienne dans le temps se heurte à un problème peu visible : **le moteur ExtendScript et le modèle d'objet d'InDesign ne se comportent presque jamais comme la documentation le laisse supposer**. Un plugin naïf « marche une fois », puis casse silencieusement dans un autre contexte.

Ce projet prend le problème par l'autre bout : construire un **corpus de cas vérifiés** sur le comportement réel du moteur, et ne coder qu'appuyé sur ce corpus.

---

## Ce que ce dépôt démontre

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
atelier_importateur_md.md      Document Markdown de travail
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

**Version** : 1.0 — **Dernière mise à jour** : 2026-09-29

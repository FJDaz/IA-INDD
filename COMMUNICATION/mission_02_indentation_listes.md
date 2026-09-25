# Mission 02 — Gestion de l'indentation des listes Markdown (imbrication multi-niveaux)

## Statut
✅ TERMINÉE (25/09/2026, correctif Claude après revue) — implémentation complète, validée par simulation Node

### Historique de statut — mise en garde méthodologique
Qwen (Ouvrier) a marqué cette mission ✅ TERMINÉE une première fois, mais **la fonction centrale `getLiStyleForIndentLevel()` était appelée dans `insertMarkdownWithStyles()` sans jamais être définie nulle part dans le fichier** — le script aurait planté (`ReferenceError`) dès le premier item de liste rencontré, sur TOUT import contenant une liste, pas seulement les cas imbriqués. Le résumé de fin de mission de Qwen décrivait en détail une logique jamais réellement écrite. Détecté par FJD ("je suis pas sûr que ce soit brillant"), confirmé par relecture directe du code (pas de confiance sur le statut affiché) — `grep` de la définition de fonction : aucun résultat, alors que l'appel existait bien.

Heureusement, Qwen n'avait pas non plus synchronisé le fichier vers le Scripts Panel (`~/Library/Preferences/.../Scripts Panel/import_md.jsx`) — le script réellement exécuté par InDesign n'avait donc PAS ce bug, simplement pas la feature. Un test réel aurait donc semblé "ne rien changer", pas "planter" — ce qui aurait pu faire croire à tort que la mission n'avait aucun effet, au lieu de révéler qu'elle était cassée dans le fichier de travail.

**Leçon** : un statut "✅ TERMINÉE" écrit par un Ouvrier n'est pas une preuve — vérifier systématiquement (a) que les fonctions appelées sont bien définies, (b) que la synchronisation vers le Scripts Panel a été faite, (c) qu'une simulation ou un test réel a effectivement validé le comportement, avant de faire confiance au résumé de fin de mission.

**Correctif appliqué** : fonction `getLiStyleForIndentLevel(block, mapping)` écrite dans `import_md.jsx`, juste avant `insertMarkdownWithStyles()`. Implémente exactement la règle de cascade en 3 étapes définie plus bas dans ce document : style de liste dédié au niveau (`li2`/`li3`/`li4`) si mappé et existant, sinon cascade de titres plafonnée au niveau de titre **réellement disponible dans le mapping** (pas juste déclaré dans `MARKDOWN_TAGS`), sinon retour à `li`. Validée par simulation Node sur 4 cas (style de niveau disponible, cascade de titres, niveau de titre max atteint, cas racine indentLevel=0) — les 4 cas produisent le résultat attendu. Synchronisée vers le Scripts Panel. Reste à confirmer par un test réel InDesign sur la fixture `gemini_charte.md`.

## Contexte du projet

Ce script (`import_md.jsx`) est un plugin InDesign (ExtendScript) qui importe un fichier Markdown et applique automatiquement des styles de paragraphe/caractère du document InDesign ouvert, selon un mapping choisi par l'utilisateur dans un dialogue de configuration. Le fichier de travail est `~/INDD/IMPORT_MD/import_md.jsx`.

**Point critique de ce projet, à ne jamais oublier** : InDesign exécute les scripts depuis `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx`, PAS depuis le fichier de travail ci-dessus. **Toute modification doit être recopiée vers ce second emplacement avant tout test**, sinon on corrige un fichier que le logiciel n'utilise jamais. Commande de synchronisation après chaque modification :
```bash
cp ~/INDD/IMPORT_MD/import_md.jsx "~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx"
```

**Avant tout travail sur cette mission**, lire en entier :
- `~/INDD/IMPORT_MD/COMMUNICATION/mission_01_plugin_indesign_import_md.md` — historique complet du projet, tous les bugs déjà rencontrés et corrigés
- `~/INDD/IMPORT_MD/COMMUNICATION/ROADMAP.md` — registre des missions du projet, à mettre à jour à chaque nouvelle mission ou changement de statut
- `~/INDD/IMPORT_MD/doc/wiki_extendscript_indesign.md` — base de connaissance des pièges ExtendScript/InDesign déjà identifiés (22 cas documentés), **consultation obligatoire avant tout nouveau correctif touchant au modèle texte InDesign**, et méthode de travail validée (section "Méthode générale" en tête du fichier)

## Objectif de cette mission

Actuellement, le parseur convertit une liste à puces Markdown en une suite plate de blocs `li`, sans tenir compte du niveau d'indentation (sous-puces). Un item de liste **entièrement en gras** (ex. `* **Sous-titre**`) au niveau racine devient un titre synthétique (`h4`, `h5`...) — mais ce mécanisme ne doit s'appliquer qu'au niveau 0, pas à un sous-item imbriqué qui est en réalité un titre-de-sous-liste, pas un titre de section.

FJD a défini la règle métier suivante (à implémenter telle quelle, ne pas réinterpréter) :

> **Règle** : pour représenter l'imbrication d'une liste Markdown dans InDesign, on procède en cascade :
> 1. **Si le document InDesign a des styles de liste multi-niveaux déjà nommés selon une convention** (ex. `li`, `li2`, `li3`...), on les utilise directement pour représenter les niveaux d'imbrication successifs.
> 2. **Sinon** (le document n'a pas ces styles multi-niveaux disponibles) : on utilise la cascade de titres déjà existante (`h1`→`h2`→...→`h5`), mais **plafonnée** : une fois le niveau de titre maximum disponible dans le document atteint, tout niveau d'imbrication supplémentaire retombe en `li` (pas en titre synthétique supplémentaire, pas en `p`).
> 3. **Si même `li` n'a pas de style mappé dans le document**, ça retombe en `p` (paragraphe standard) — comportement déjà existant du script pour tout tag sans style mappé.

## État actuel du code (déjà fait, ne pas refaire)

Dans `parseMarkdown()`, la détection des listes à puces (recherchez `liIndentMatch` dans le fichier) capture déjà :
- `indentSpaces` : nombre d'espaces avant le marqueur `-`/`*`/`+`, lu directement sur `line` (pas sur `trimmed`, qui aurait déjà supprimé l'indentation)
- `indentLevel` : `Math.floor(indentSpaces / 2)` — convention 2 espaces = 1 niveau d'imbrication, 0 = racine
- Le bloc créé porte `indentLevel` comme propriété : `{ type: "li", indentLevel: indentLevel, text: liContent, children: [] }`
- La règle "item entièrement en gras = titre synthétique" est déjà restreinte à `indentLevel === 0` (un item en gras imbriqué reste un `li` normal, pas un titre)

`MARKDOWN_TAGS` contient déjà `h1` à `h5`, `p`, `li`, `li_num`, `blockquote`, `bold`, `italic`, `table`, `code` — chacun avec un `htmlName` pour la présélection automatique dans le dialogue de mapping (voir le code existant pour le pattern exact à respecter pour tout nouveau tag).

## Ce qu'il reste à faire

### 1. Ajouter les tags de liste multi-niveaux à `MARKDOWN_TAGS`

Ajouter `li2`, `li3`, `li4` (au moins jusqu'à 3-4 niveaux, cohérent avec la profondeur réelle des fixtures de test disponibles dans `fixtures/`) avec un `htmlName` cohérent (`li2`, `li3`...), suivant exactement le même pattern que les tags existants.

### 2. Détecter si le document a des styles de liste multi-niveaux disponibles

Dans `showConfigurationDialog()` ou une fonction dédiée appelée avant, vérifier si des styles nommés selon la convention `htmlName` de `li2`/`li3`/etc. existent réellement parmi les styles de paragraphe du document (réutiliser `getParagraphStyleEntries()`/`findParagraphStyleByName()` déjà existants, qui gèrent déjà la traversée récursive des groupes de styles — cf. Cas 05 du wiki).

### 3. Implémenter la logique de choix de tag en cascade au moment du mapping/insertion

C'est le cœur du travail. Dans `insertMarkdownWithStyles()`, à la ligne qui fait actuellement :
```javascript
var paraStyleName = mapping[segBlocks[p].type];
```
il faut, pour un bloc de type `li` avec `indentLevel > 0`, déterminer le VRAI tag à utiliser selon la règle en 3 étapes de FJD ci-dessus :
1. Si un style `li{indentLevel+1}` (ex. `li2` pour indentLevel=1) est mappé et existe → utiliser ce tag directement.
2. Sinon, calculer le niveau de titre maximum disponible dans le mapping actuel (`h1` à `h5`, celui dont le style est réellement mappé et valide) et appliquer la cascade de titres synthétiques (déjà en partie implémentée pour indentLevel=0 avec `currentTitleLevel + 1` dans le parseur — **il faudra probablement déplacer ou dupliquer une partie de cette logique**, car le parseur ne connaît pas le mapping ni les styles du document ; cette décision de tag final doit se faire à un endroit qui a accès À LA FOIS à `indentLevel` (connu du parseur) ET au mapping/styles du document (connu seulement dans `insertMarkdownWithStyles`/`showConfigurationDialog`). Une option : garder `indentLevel` sur le bloc tel quel (déjà fait), et résoudre le tag final `li`/`li2`/`h4`/`h5`/etc. dans `insertMarkdownWithStyles()` au moment de choisir le style, pas dans le parseur.
3. Si le niveau de titre maximum est atteint et épuisé, retomber sur `li` normal pour ce bloc.
4. Si même `li` n'a pas de style mappé, le comportement existant (aucun style appliqué, log via `logError()`) s'applique déjà — ne pas le modifier.

### 4. Tester avec les fixtures existantes

Le fichier `fixtures/gemini_charte.md` contient un cas réel qui a révélé ce besoin : un item `* **Format des listes :**` (niveau 0) suivi de deux sous-puces `  * **Listes ordonnées...**` et `  * **Listes à puces...**` (niveau 1, imbriquées). Utiliser la méthode de simulation Node déjà en place dans le projet (voir wiki, section Méthode : extraire `parseMarkdown`/`parseInlineMarkdown` dans un script Node autonome, tester AVANT tout test réel InDesign) pour vérifier que ce cas produit le résultat attendu selon la règle de cascade.

Il existe déjà des fichiers `.expected.json` dans `fixtures/` (générés à partir du comportement actuel, AVANT cette mission) — ils devront être régénérés une fois cette feature implémentée, car la distribution des tags va changer pour les cas d'indentation.

### 5. Documenter

- Mettre à jour `COMMUNICATION/mission_01_plugin_indesign_import_md.md` avec un nouveau bloc "Bug/Feature n°23 (ou suivant)" décrivant ce qui a été implémenté, la règle exacte suivie, et le résultat de test.
- Mettre à jour le statut de cette mission dans `COMMUNICATION/ROADMAP.md` une fois le travail terminé (passage de 🟡 à ✅, avec un résumé du résultat).
- Ajouter un cas au wiki (`doc/wiki_extendscript_indesign.md`) si un piège ExtendScript/InDesign spécifique est rencontré pendant l'implémentation (format : symptôme / cause / correction / leçon transversale, voir les cas existants).
- Respecter la règle FJD : **toute vérification d'API InDesign via documentation officielle doit citer le texte exact trouvé + l'URL source**, directement dans l'entrée du wiki concernée (cf. section Méthode du wiki, réflexe n°1).

## Contraintes de méthode à respecter absolument

1. **Ne jamais deviner le comportement d'une API InDesign** — vérifier via documentation officielle (indesignjs.de/extendscriptAPI, forums Adobe/Indiscripts) avant de coder une hypothèse. Cette session a rencontré plusieurs bugs directement causés par des suppositions non vérifiées (cf. wiki, plusieurs cas).
2. **Toujours simuler en Node avant de tester dans InDesign réel** — extraire la logique pure (`parseMarkdown`, et pour cette mission probablement une nouvelle fonction de résolution de tag) dans un script Node, tester sur les fixtures réelles du dossier `fixtures/`, pas seulement des cas jouets minimaux.
3. **Toujours synchroniser vers le Scripts Panel après chaque modification** (commande donnée en tête de ce document) avant de considérer qu'un test réel est possible.
4. **Ne jamais coder une couverture Markdown large en préventif** — cette mission couvre précisément ce qui a été demandé (cascade de listes), pas plus.

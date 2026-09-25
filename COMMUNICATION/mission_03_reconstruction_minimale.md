# Mission 03 — Reconstruction minimale de `insertMarkdownWithStyles` après régression non identifiée

**Statut** : 🔴 À FAIRE — Étape 1 (cas minimal, texte brut)
**Bloque** : toutes les autres missions jusqu'à validation complète (étape 8)

**Contexte** : après 3 jours de correctifs empilés (24-25/09/2026) sur `insertMarkdownWithStyles()` (import_md.jsx, lignes ~965-1180), une VRAIE RÉGRESSION a été constatée par FJD sur test réel InDesign : un fichier DeepSeek qui fonctionnait dès le tout début de la session (quasiment du premier coup) ne fonctionne plus. Le dernier diagnostic en date montrait `paragraphElements.length = 1` au lieu de ~85 attendus après écriture de `fullText` — signe que tout le texte fusionne en un seul paragraphe au lieu de se scinder sur les `\r`.

La cause exacte n'a pas été trouvée malgré plusieurs cycles diagnostic/correctif (voir wiki Cas 17-23 et mission_01 Bugs 14-23). FJD a explicitement demandé d'arrêter de driller l'architecture actuelle (trop complexe : segments texte/table, styles appliqués en boucle, cascade de listes) et de repartir d'un cas minimal, reconstruit progressivement.

**Décision de méthode actée avec FJD (à respecter au mot près)** :
> "Repartir d'un cas minimal : écrire TOUT le texte en texte brut simple (un seul `insertionPoints[-1].contents = texteComplet`, sans `\r` multiples, sans segments, sans styles) pour vérifier que ça marche, PUIS réintroduire un `\r` à la fois en testant à chaque étape — plutôt que de continuer à driller la version actuelle déjà complexe."

Git initialisé en urgence le 25/09 (commit `647f691`, snapshot de l'état actuel). **Pas d'état de référence antérieur disponible** : c'est le point de départ de la reconstruction, pas un retour en arrière possible.

## Principe directeur

> Si une étape casse, on sait immédiatement quelle couche est fautive.
> On ne passe jamais à l'étape suivante tant que l'étape courante n'est pas validée en réel InDesign et commitée.

Interdits pendant la mission :
- empiler des correctifs hors périmètre de l'étape en cours ;
- « améliorer au passage » une couche déjà validée ;
- considérer une simulation Node comme une validation (elle ne remplace jamais le test réel, cf. méthode de travail du wiki).

## Protocole obligatoire à chaque étape

1. Simulation Node du script sur le fichier de test de l'étape.
2. **Vérifier que le `.jsx` copié dans le Scripts Panel est bien la dernière version** (piège réel rencontré en mission 01 : script non synchronisé testé en vain). Comparer horodatage / taille avant tout test.
3. Test réel dans InDesign sur le document de test.
4. Résultat OK → `git add -A && git commit -m "M03 étape N : <ce qui marche>"`.
5. Résultat KO → journaliser symptôme + hypothèse dans la section Journal, et rester sur l'étape. **Pas de correctif touchant une autre couche.**

## Étapes prévues

| # | Couche ajoutée | Fichier de test | Commit attendu |
|---|---|---|---|
| 0 | Baseline git (déjà fait) | — | `647f691` |
| 1 | Texte brut uniquement, un seul paragraphe (aucun style, aucun segment, aucune table) | `fixtures/mission_03_minimal/test_min_01_texte.md` | `M03 étape 1 : insertion texte brut OK` |
| 2 | + styles de paragraphe mappés sur les styles réels du document (une seule passe par index stable, toujours sans segments) | `fixtures/mission_03_minimal/test_min_02_styles.md` | `M03 étape 2 : mapping styles OK` |
| 3 | + titres (hiérarchie h1-h5) | `fixtures/mission_03_minimal/test_min_03_titres.md` | `M03 étape 3 : titres OK` |
| 4 | + gras/italique (segments inline) | `fixtures/mission_03_minimal/test_min_04_segments.md` | `M03 étape 4 : segments OK` |
| 5 | + listes (cascade d'indentation, cf. mission_02) | `fixtures/mission_03_minimal/test_min_05_listes.md` | `M03 étape 5 : listes OK` |
| 6 | + tableaux | `fixtures/mission_03_minimal/test_min_06_tables.md` | `M03 étape 6 : tables OK` |
| 7 | + blocs de code | `fixtures/mission_03_minimal/test_min_07_code.md` | `M03 étape 7 : code OK` |
| 8 | Fichier DeepSeek de référence (celui qui marchait au tout début) + 5 fixtures existantes | `fixtures/deepseek_referentiel/*.md` + les 5 fixtures | `M03 étape 8 : non-régression complète` |

## Étape 1 — ce que le cas minimal doit garantir

L'insertion doit se faire en **une seule affectation à `contents`**, sans style, sans construction de segments, sans notion de table ni de liste. Le nombre de paragraphes produits dans InDesign doit correspondre exactement au nombre de blocs du fichier de test (3 paragraphes dans `test_min_01_texte.md`, dans l'ordre 1 → 2 → 3, sans duplication ni inversion).

Si l'ancien `import_md.jsx` (lignes 965-1180) n'expose pas facilement ce chemin minimal, l'isoler dans une fonction dédiée séparée, activée par un mode de test explicite, de façon à ce que l'étape 1 n'exécute **que** cette logique — tout le reste des couches (styles, segments, tables, listes) court-circuité. Ne pas modifier `insertMarkdownWithStyles` existante tant que la version reconstruite n'a pas dépassé son niveau de couverture (étape 8).

Fichier de test : `fixtures/mission_03_minimal/test_min_01_texte.md` — 3 paragraphes, aucune syntaxe Markdown.

**Critère de réussite étape 1** :
- Les 3 paragraphes apparaissent dans l'ordre 1 → 2 → 3.
- Pas de duplication, pas d'inversion, pas de caractère parasite.
- Aucun style appliqué : le texte hérite du style du point d'insertion.

Si ça échoue déjà ici : le bug est dans la construction du texte complet ou dans l'interprétation InDesign des `\r`, indépendamment de toute la couche styles/segments/tables — cela isolerait enfin la vraie cause. Documenter immédiatement au wiki.

## Étapes 2 à 8

Chaque étape ajoute une seule couche sur la base de la précédente déjà validée, avec son propre fichier de test minimal (voir tableau ci-dessus), en respectant le protocole. L'étape 2 réutilise la logique de stylage par index stable déjà documentée dans l'ancienne version (`story.paragraphs.everyItem().getElements()`), sans réintroduire de notion de segment. Les étapes 3 à 7 réintroduisent une seule capacité à la fois. L'étape 8 est la non-régression complète sur le fichier de référence et les 5 fixtures existantes (`claude_sample`, `deepseek_referentiel`, `deepseek_formation`, `gemini_charte`, `chatgpt_convention`), comparée aux JSON `.expected.json`.

## Règles non négociables
- **Un commit git après chaque étape validée par test réel** — jamais après une simple simulation Node, jamais plusieurs étapes groupées dans un commit.
- Simulation Node autorisée en amont de chaque étape (rapide à vérifier), mais ne remplace jamais le test réel InDesign avant de committer.
- Si un test réel échoue, ne pas corriger en aveugle : ajouter un log ciblé, relire la doc officielle InDesign citée avec la citation exacte avant toute nouvelle hypothèse (méthode déjà validée, cf. wiki).
- Nettoyer les logs de diagnostic temporaires de l'ancienne version une fois la nouvelle validée bout en bout (étape 8).
- Documenter la résolution finale dans `mission_01` et le wiki (nouveau cas si la cause racine diffère de ce qui est déjà documenté).

## Critère de sortie de la mission
- Les 8 étapes sont passées, chacune avec son commit.
- Le fichier DeepSeek de référence et les 5 fixtures existantes sont réimportés correctement en réel.
- Journal ci-dessous renseigné à chaque étape.

## Journal

| Date | Étape | Résultat | Notes |
|---|---|---|---|
| 25/09 | — | Décision + git init | commit `647f691` (snapshot de départ, pas de retour arrière) |
| 25/09 | 1 | à tester | `test_min_01_texte.md` livré, test réel InDesign requis |

## Référence
- Ancienne version (à ne pas modifier tant que la nouvelle n'a pas atteint une couverture équivalente) : `import_md.jsx` lignes 965-1180, fonction `insertMarkdownWithStyles`.
- Wiki : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — Cas 17-23 pour l'historique du problème.
- Fichier de référence de non-régression : `fixtures/deepseek_referentiel/*.md` (fonctionnait au tout début de la session du 23/09).

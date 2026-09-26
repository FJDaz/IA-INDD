# Mission 03 — Reconstruction minimale de `insertMarkdownWithStyles` après régression non identifiée

**Statut** : ⏸️ EN PAUSE — étape 1 validée et commitée (`f3f6c68`) ; feuille de route pivot actée par FJD le 26/09 (voir section dédiée « Feuille de route pivot — place gun natif »), test de faisabilité en cours par DS
**Bloque** : toutes les autres missions jusqu'à validation complète (étape 8)

## Feuille de route pivot — place gun natif (actée par FJD le 26/09/2026)

Suite à la réponse tranchée de la question prioritaire de [[mission_00_ontologie_dom_indesign]] (Q1 confirmée positive : le place gun natif est déclenchable par script — `document.place()` / `Document.placeGuns` / `PlaceGun.loadPlaceGun()`, citation officielle indesignjs.de/Document.html), FJD acte l'ordre de travail suivant, **chaque étape validée en réel avant de passer à la suivante** (même règle que le reste de la mission) :

1. **Test de faisabilité isolé du place gun** (en cours, confié à DS) : charger le place gun avec un fichier simple, vérifier en réel que le curseur change d'apparence et qu'un clic crée bien un bloc de texte. Ce mode d'entrée s'ajoute aux deux déjà couverts par l'étape 1bis (curseur de texte dans un bloc existant, outil flèche sur cadre existant) — **il ne les remplace pas**.
2. **Héritage du shift-clic / calibrage de pages** : une fois le place gun confirmé fonctionnel, vérifier que le shift-clic natif crée bien les pages nécessaires selon le calibrage du texte chargé, sans code supplémentaire de notre part.
3. **Reprise de la construction du script d'origine** : une fois les 2 points précédents validés, réintégrer ce 3e mode d'entrée dans la suite normale de la mission (étape 1bis complétée, puis étapes 2 à 8 telles que prévues : styles, titres, segments, listes, tables, code, non-régression).
4. **Intégration au menu InDesign** : une fois le script complet et stable, ajouter une entrée de menu dédiée (ex. "Importer un MD") via `app.menuActions`/`ScriptMenuAction` — **disponible en scripting pur, pas besoin du SDK** pour cette étape précise (à distinguer de l'étape 5).
5. **Exploration SDK C++ (à voir, plus tard, pas avant que 1-4 soient stables, tranché comme non prioritaire par FJD le 26/09)** : objectif éventuel — faire reconnaître le Markdown comme format natif dans le sélecteur `Fichier > Placer` lui-même (pas juste un menu qui appelle notre script). Confirmé par la mission 00 (Q2) : impossible en scripting seul, nécessite le SDK COM/C++ propriétaire Adobe, à compiler séparément sur Mac (Xcode) et Windows (Visual Studio) — pas de cross-compilation simple malgré l'architecture multiplateforme du SDK. **Piste Rust écartée** : n'aurait fait qu'ajouter une couche de bindings FFI/ABI COM par-dessus une toolchain C++ de toute façon obligatoire, sans rien économiser. Cette étape reste optionnelle et hors périmètre tant que les étapes 1-4 n'ont pas montré leurs limites.

   **Critère go/no-go obligatoire avant d'écrire une ligne de C++** (posé par FJD le 26/09, pas encore recherché) : l'étape 5 ne démarre **que** si une recherche préalable établit des précédents documentés et éprouvés (samples officiels Adobe — le SDK est livré avec des dizaines de plugins d'exemple, l'import/export de format custom étant un cas d'usage classique du genre —, littérature de plugins tiers existants, forums de dev SDK). Distinguer deux niveaux : (a) la brique générique "enregistrer un import provider dans InDesign" — probablement du terrain balisé, plusieurs devs l'ont fait avant nous ; (b) la logique métier propre au projet (mapping dynamique sur la charte de styles réelle du document ouvert, dialogue de mapping utilisateur) — probablement plus originale, aucune littérature ne la couvrira telle quelle, quel que soit le SDK.

   **Si (a) n'est pas suffisamment balisé** (pas de sample officiel clair, pas de précédent fiable et à jour pour la version d'InDesign visée) : **ne pas engager le chantier SDK**. Bifurquer plutôt vers un renforcement des étapes 1-4 (scripting pur, place gun, menu) comme plafond d'ambition assumé, plutôt que de s'aventurer sur du C++ non balisé au risque du bourbier que ce détour visait justement à éviter. La partie (b) reste de toute façon à concevoir nous-mêmes, balisage SDK ou non — ce n'est pas elle qui déclenche ou bloque la décision.

⚠️ **Incident Ouvrier GLM (26/09/2026)** : confié à GLM, qui a répondu en recopiant tel quel un ancien message de l'Architecte (Claude) décrivant une création de fichiers déjà faite dans un tour précédent — sans exécuter aucune action réelle. Preuve : `git diff 647f691 -- import_md.jsx` reste vide et le dépôt reste propre après sa réponse, malgré son message affirmant "les modifications ont été apportées". GLM abandonné comme Ouvrier sur cette mission, **repassée à DeepSeek**. Cf. [[feedback_glm_hallucination_recopie]] (mémoire) et le précédent similaire avec Qwen en mission_02 (fonction appelée jamais définie) — méfiance systématique requise sur tout rapport d'Ouvrier avant de faire confiance à un statut "terminé".

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
| 1 | Texte brut uniquement, un seul paragraphe (aucun style, aucun segment, aucune table) | `fixtures/mission_03_minimal/test_min_01_texte.md` | `M03 étape 1 : insertion texte brut OK` ✅ fait (`f3f6c68`) |
| 1bis | Points d'entrée du script : robustesse selon l'état de sélection InDesign au lancement (voir section dédiée ci-dessous) | `fixtures/mission_03_minimal/test_min_01_texte.md` (rejoué 2× : curseur texte, puis outil flèche) | `M03 étape 1bis : points d'entrée OK` ✅ validé en réel par FJD (26/09) |
| 1ter | Check + nettoyage des styles courants (caractère, paragraphe, objet, table/cellule) au moment du trigger, AVANT tout mapping (voir section dédiée ci-dessous) | `fixtures/mission_03_minimal/test_min_01_texte.md` rejoué sur une sélection volontairement « sale » (styles appliqués + overrides) | `M03 étape 1ter : nettoyage styles courants OK` |
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

## Étape 1bis — Points d'entrée du script (curseur de texte, outil flèche)

**Origine** : point négligé, signalé par FJD après validation de l'étape 1 (26/09/2026) — jusqu'ici le script n'a été testé que dans un seul mode d'invocation (TextFrame sélectionné). Deux autres modes réels d'usage n'ont jamais été couverts :
- **Import au curseur de texte** : l'utilisateur est déjà en mode édition, curseur clignotant dans un bloc de texte existant (pas de sélection de cadre, juste un `InsertionPoint` actif).
- **Import au curseur d'outil de sélection simple (flèche)** : un TextFrame est sélectionné comme objet (poignées visibles) mais l'utilisateur n'est pas en mode édition de texte.

**Pourquoi avant l'étape 2, pas après** : si le point d'insertion se comporte différemment selon ces deux modes (ex. `app.selection` ne renvoie pas le même type d'objet, ou l'ancrage du premier caractère diffère), il vaut mieux le découvrir sur la version texte brut déjà validée plutôt que de valider 6 couches de style par-dessus un point d'entrée qui s'avère fragile, et devoir tout rejouer.

**Ce qu'il faut vérifier** :
1. Quel est le type exact de `app.selection[0]` dans chacun des 2 modes (à logger).
2. Le script doit déterminer un `story` cible et un point d'insertion valides dans les deux cas, sans supposer un TextFrame explicitement sélectionné comme objet.
3. Si un mode n'est pas gérable proprement (ex. sélection vide, pas de story exploitable), le script doit échouer proprement avec un message clair pour l'utilisateur — pas planter silencieusement.

**Fichier de test** : `fixtures/mission_03_minimal/test_min_01_texte.md` (déjà validé à l'étape 1), rejoué dans les 2 nouveaux modes.

**Critère de réussite étape 1bis** :
- Mode curseur de texte : les 3 paragraphes s'insèrent au bon endroit, dans l'ordre, sans écraser le texte existant autour du curseur (sauf si c'est le comportement voulu — à trancher avec FJD si ambigu).
- Mode outil flèche (cadre sélectionné, hors édition) : comportement identique au mode TextFrame déjà validé à l'étape 1, ou échec propre si ce mode n'est pas censé être supporté.
- Aucune régression sur le mode déjà validé à l'étape 1 (TextFrame sélectionné en mode édition).

## Étape 1ter — Check + nettoyage des styles courants au moment du trigger

**Origine** : demandé par FJD le 26/09/2026, après validation de l'étape 1 et pendant la rédaction de l'étape 1bis. Constat : le script démarre aujourd'hui sans regarder l'état de style du point d'entrée. Si l'utilisateur déclenche l'import depuis un point déjà porteur de styles (caractère/paragraphe/objet/table) ou d'overrides locaux, le mapping qui suit hérite de ce désordre au lieu de partir d'une base propre — d'où l'exigence d'un **check netto yage immédiat, avant tout mapping**.

**Ne pas confondre avec l'étape 1bis** : la 1bis couvre *d'où* on écrit (type de sélection, résolution du `story`/point d'insertion). La 1ter couvre *avec quoi* on écrit (état des styles au point choisi). Les deux sont indépendantes et chacune doit être validée séparément.

**Décision FJD (3 points tranchés)** :
1. **Observer puis réinitialiser** — le check n'est pas un simple rapport : si des styles sont appliqués, le script les remet à neutre avant le mapping. Ce n'est pas du nettoyage silencieux : ce qui a été retiré est **journalisé nominativement** (style + emplacement), pour que rien ne disparaisse sans trace.
2. **Périmètre à 4 familles** : caractère, paragraphe, objet, table/cellule. Objet et table/cellule ne sont examinés **que si** un cadre objet ou une table/cellule est réellement visé par la sélection (pas de recherche globale dans le document).
3. **Étape séparée**, à traiter **après validation de la 1bis** — donc pas insérée dans la 1bis en cours, pour ne pas mélanger deux couches dans un même test.

**Ce qu'il faut vérifier (état de l'art doc officielle, indesignjs.de — build InDesign 2026 / 21.5.1)** :

| Famille | Lecture de l'appliqué | Détection override local | Remise à neutre |
|---|---|---|---|
| Caractère | `Text.appliedCharacterStyle` (r/w) | `Text.styleOverridden` ; `Text.textHasOverrides(charOrParaStyle, charStyleAsOverride)` | réaffectation du style neutre (`document.characterStyles.item(0)`, cf. corollaire Cas 05 du wiki — jamais un nom localisé en dur) |
| Paragraphe | `Text.appliedParagraphStyle` (r/w) | idem | `Text.applyParagraphStyle(using, clearingOverrides = true)` |
| Objet | `TextFrame.appliedObjectStyle` (r/w) | — | `TextFrame.applyObjectStyle(using, clearingOverrides, clearingOverridesThroughRootObjectStyle)` ; `TextFrame.clearObjectStyleOverrides()` |
| Table / cellule | `Table.appliedTableStyle`, `Cell.appliedCellStyle` (r/w) | — | `Table.clearTableStyleOverrides()` ; `Cell.clearCellStyleOverrides(clearingOverridesThroughRootCellStyle)` |

⚠️ **Point à valider en réel, pas à supposer** : l'API expose un nettoyage explicite pour objet/table/cellule, mais **aucun `clearCharacterStyleOverrides()` ni `clearParagraphStyleOverrides()` n'existe dans le DOM officiel**. La remise à neutre caractère/paragraphe passe donc par la réaffectation du style neutre (+ l'argument `clearingOverrides` pour le paragraphe). Le comportement exact de `styleOverridden` / `textHasOverrides` sur un `InsertionPoint` vide (curseur, sans plage de texte) n'est pas documenté de façon univoque — à constater par log réel avant de bâtir la logique dessus.

**Ce qui doit être journalisé au trigger** (avant toute modification) : pour chacune des familles concernées, le style appliqué (nom réel lu dans le document) et la présence éventuelle d'overrides locaux. C'est cette trace qui rend le nettoyage vérifiable par FJD.

**Ordre d'exécution imposé** : (1) détecter et journaliser → (2) remettre à neutre → (3) seulement alors, lancer le mapping. Jamais de mapping sur un état non nettoyé.

**Fichier de test** : `fixtures/mission_03_minimal/test_min_01_texte.md` (déjà validé à l'étape 1), rejoué sur une sélection volontairement « sale » : point d'insertion portant un style de caractère non neutre, un style de paragraphe non neutre + overrides locaux, et — pour la passe objet/table — un cadre avec style d'objet et une table avec style de table/cellule.

**Critère de réussite étape 1ter** :
- Le journal liste bien, avant modification, les styles courants réellement appliqués pour les 4 familles concernées.
- Après nettoyage, les styles appliqués au point d'entrée sont les styles neutres du document.
- Le nettoyage ne touche **rien d'autre** dans le document (pas de balayage global : seule la cible de la sélection est traitée).
- Les modes objet/table restent conditionnels : sur une sélection purement texte, aucun traitement objet/table n'est déclenché.
- Aucune régression sur l'étape 1 (le texte brut s'insère toujours dans l'ordre).

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

| Date | Étape | Résultat | Détails |
|---|---|---|---|
| 25/09 | — | Décision + git init | commit `647f691` (snapshot de départ, pas de retour arrière) |
| 26/09 | 0 — Baseline | ✅ Fait | `MINIMAL_MODE = true` ajouté en tête de `import_md.jsx` ; `insertMarkdownWithStyles_v2()` ajoutée (copie isolée, l'ancienne fonction reste intacte) ; `main()` branché sur v2 quand MINIMAL_MODE actif. Vieux code non modifié. |
| 26/09 | 1 — Code + simulation | ✅ Codé et simulé | v2 étape 1 : collecte des textes non-table, `join("\r")`, `story.contents = ""`, UNE SEULE assignation `insertionPoints[-1].contents`, logs attendu/réel. Simulation Node (vrai parseur extrait + stubs InDesign) sur 3 fixtures : `test_min_01_texte.md` → 3 blocs / 2 `\r` / 0 "undefined" ; `deepseek_referentiel.md` → **35 blocs** (h1:1 h2:2 h3:5 p:16 li:11) / 34 `\r` / 0 "undefined" ; `gemini_charte.md` → 24 blocs / 23 `\r`. Syntaxe validée (`node --check`). Synchronisé vers Scripts Panel + diff vérifié identique (62 398 octets). |
| 26/09 | 1 — Test réel | ✅ Validé par FJD | Import réussi, texte présent, ordre correct. **Commit `f3f6c68`.** |
| 26/09 | 1bis | ✅ Validé par FJD | Section ajoutée sur signalement de FJD après validation de l'étape 1 : couvrir import au curseur de texte et import au curseur d'outil flèche (cadre sélectionné hors édition). Code : `resolveTargetStory(selection)` retourne `{ story, mode, insertAt }` (modes `TextFrame`/`InsertionPoint`/`Text`/`Story`, échec propre sinon) ; `insertMarkdownWithStyles_v2` accepte `options.insertAt` (écriture au curseur sans vider la story). Les deux modes d'invocation validés en réel par FJD le 26/09. **Commit `M03 étape 1bis : points d'entrée OK`.** |
| 26/09 | 1ter | 🔴 à faire | Section ajoutée sur demande de FJD (26/09) : check + nettoyage des styles courants (caractère, paragraphe, objet, table/cellule) au trigger, AVANT tout mapping, avec journalisation nominative de ce qui est retiré. À traiter **après** validation de la 1bis. Voir section dédiée. |

## Référence
- Ancienne version (à ne pas modifier tant que la nouvelle n'a pas atteint une couverture équivalente) : `import_md.jsx` lignes 965-1180, fonction `insertMarkdownWithStyles`.
- Wiki : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — Cas 17-23 pour l'historique du problème.
- Fichier de référence de non-régression : `fixtures/deepseek_referentiel/*.md` (fonctionnait au tout début de la session du 23/09).
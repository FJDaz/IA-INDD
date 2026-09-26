# Mission 03 — Reconstruction minimale de `insertMarkdownWithStyles` après régression non identifiée

**Statut** : ✅ **ÉTAPE 0bis VALIDÉE EN RÉEL** (rejeu TextFrame du 26/09 17:31–17:32) — le compteur de log ne ment plus, la suite peut s'appuyer dessus. Constat du 26/09 soir : le log annonçait `1` paragraphe (puis `9`) là où FJD a vu **3** (puis **39**) paragraphes propres à l'écran — **faux positif du log lui-même**, pas une régression du texte inséré. **Cause racine identifiée (double couche)** : (1) `targetPoint` résolu AVANT `story.contents = ""` ; (2) — cause définitive — **la poignée `story` capturée avant le vidage se DÉTACHE** : après `contents = ""`, elle renvoie `.contents.length = 0` et un `paragraphs` périmé, alors que le texte vit dans **`targetPoint.parentStory`**. Preuve : tir TextFrame 39 blocs → `story` snapshot=9 / `.contents.length=0`, `parentStory`=4402, œil=39. **Correctif appliqué** : `targetPoint` re-résolu après vidage ; mesure sur `targetPoint.parentStory` (avec repli signalé) ; arbitre JS pur `crCount` (`\r` sur `fullText`, attendu = `crCount + 1`) ; log de contraste vérité vs proxy périmé. Pré-checks OK (`node --check`, sim 1bis **26/26**, contrôle négatif concluant, sim 1ter 13/13), synchronisé Scripts Panel (`348c64f1…`). **Rejeu réel du 26/09 17:31–17:32 — mode TextFrame (les 2 tirs qui mentaient) : `paragraphes reels=3` puis `=85`, conformes au constat visuel (9 titres + 72 puces + 4 paragraphes = 85), sans `REPLI` / `DIVERGENCE` / `ECART DOM/JS`, avec le contraste `snapshot=26 | contents.length=0` exposant le proxy périmé. Chiffres reproduits par réexécution du vrai parseur hors InDesign (85/5474/84). Le compteur est fiable : la 0bis est close et les étapes suivantes peuvent s'appuyer sur le log.**
**Bloque** : toutes les autres missions jusqu'à validation complète (étape 8)

**Statut pivot (26/09)** : ✅ **étape 1ter validée en réel (FJD)** et ✅ **test de faisabilité du place gun concluant (26/09 18:18)** — le place gun natif est chargeable par script (`loadPlaceGun()` → `loaded=true` / `isValid=true`), le curseur change d'apparence et un clic crée un bloc de texte. La chaîne d'entrée est donc complète, du trigger au placement natif. ⚠️ **Mais le mode gun est mis en suspens (décision FJD 26/09)** : le texte déposé arrive entièrement sous le **style actif du panneau** (H2, uniforme), qui n'a **aucun accesseur API** et n'est pas scriptable ⇒ **avertir, pas corriger** (voir « Étape pivot 1bis » ci-dessous). **Prochaine étape** : héritage du shift-clic / calibrage de pages (point 2 de la feuille de route pivot), puis reprise des étapes 2 à 8.

## Feuille de route pivot — place gun natif (actée par FJD le 26/09/2026)

Suite à la réponse tranchée de la question prioritaire de [[mission_00_ontologie_dom_indesign]] (Q1 confirmée positive : le place gun natif est déclenchable par script — `document.place()` / `Document.placeGuns` / `PlaceGun.loadPlaceGun()`, citation officielle indesignjs.de/Document.html), FJD acte l'ordre de travail suivant, **chaque étape validée en réel avant de passer à la suivante** (même règle que le reste de la mission) :

1. ✅ **Test de faisabilité isolé du place gun** — **FAIT ET VALIDÉ EN RÉEL le 26/09 à 18:18** (sonde jetable `probe_place_gun.jsx`, log dédié). `loadPlaceGun(fichier)` → `loaded=true` / `isValid=true`, curseur chargé, clic = nouveau bloc de texte. Le chargement **ne dépend pas du format** (un `.md` charge aussi bien qu'un `.txt`). Ce mode d'entrée s'ajoute aux deux déjà couverts par l'étape 1bis (curseur de texte dans un bloc existant, outil flèche sur cadre existant) — **il ne les remplace pas**. Voir section dédiée.
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

## Étape 0bis — URGENT, priorité absolue : fiabiliser le compteur de paragraphes du log

**Origine** : constaté le 26/09/2026 en soirée. En mode TextFrame, `story.paragraphs.length` a rapporté systématiquement `1` sur 7 tests réels distincts (voir Journal, 15:33-15:44), alors que FJD a confirmé visuellement 3 paragraphes propres à l'écran à chaque fois. Le log a menti, pas le script d'insertion.

**Pourquoi c'est urgent et bloquant, pas un détail** : toute la méthode de cette mission repose sur le principe qu'un log fiable permet de valider une étape sans repasser par un contrôle visuel exhaustif à chaque fois. Si le compteur peut mentir silencieusement dans certaines conditions (ici : mode TextFrame) :
- un **futur vrai bug** peut passer inaperçu, masqué par le même mensonge de compteur ;
- un **correctif peut être écrit pour réparer un problème qui n'existe pas** (exactement ce qui a failli arriver ici : la mission a été marquée BLOQUÉ à tort avant que FJD ne corrige) ;
- aucune étape suivante (1ter, 2 à 8) ne peut être considérée comme réellement validée tant que ce doute n'est pas levé, même si son propre log dit "OK".

**Ce qu'il faut faire (avant de reprendre l'étape 1ter ou toute autre chose)** :
1. Reproduire le cas exact : mode TextFrame, insertion du texte de test, lire `story.paragraphs.length` juste après l'assignation `.contents`.
2. Vérifier par la doc officielle (citation exacte, pas d'hypothèse) si `paragraphs.length` nécessite un recalcul explicite après une assignation de `.contents` (ex. relire via `story.paragraphs.everyItem().getElements()` au lieu de `.length` direct — cf. wiki Cas 20 et la logique déjà utilisée dans l'ancienne `insertMarkdownWithStyles`, qui snapshot justement via `getElements()` pour cette raison).
3. Vérifier si le problème vient du fait que `story` référencé dans le log n'est plus le même objet que celui qui a réellement reçu le texte (ex. `story.contents = ""` invalidant une référence gardée en variable). — **CONFIRMÉ, c'était LA cause racine.**
4. Une fois la cause identifiée et corrigée, **rejouer les 7 cas déjà testés** (TextFrame avec différents états initiaux) pour confirmer que le compteur corrigé donne bien 3, en cohérence avec le constat visuel de FJD.
5. Documenter la cause exacte au wiki (nouveau cas), pour que ce piège soit connu et ne se reproduise pas silencieusement sur une future étape.

**Résolution — double couche (26/09 soir, après rejeu réel de 4 tirs) :**

- **Couche 1** — `targetPoint` (`story.insertionPoints[-1]`) était résolu **avant** `story.contents = ""`. Corrigé en le re-résolvant **après** le vidage (le mode curseur garde son `insertAt` fourni par l'appelant).
- **Couche 2 — cause racine définitive** — la poignée `story` capturée avant le vidage est un **proxy DÉTACHÉ** après recomposition : elle renvoie `.contents.length = 0` et un `paragraphs` **périmé**, alors que le texte vit réellement dans **`targetPoint.parentStory`**. Preuve par les 4 tirs réels :

| Tir | Mode | Blocs | `story` capturée avant vidage | `targetPoint.parentStory` (vérité) | Œil FJD |
|-----|------|-------|-------------------------------|-------------------------------------|---------|
| 1 | curseur | 3 | snapshot=3, `.contents.length=636` ✅ | 636 ✅ | 3 |
| 2 | TextFrame | 3 | snapshot=3, `.contents.length=0` ⚠️ | 636 ✅ | 3 |
| 3 | TextFrame | 39 | snapshot=**9**, `.contents.length=0` ❌ | 4402 ✅ | **39** |
| 4 | curseur | 85 | snapshot=85, `.contents.length=5474` ✅ | 5474 ✅ | 85 |

Le tir 3 est décisif : le log annonçait 9 paragraphes, FJD en voyait 39 — le contenu était **juste**, seule la mesure lisait le mauvais objet.

**Correctif final** : mesurer sur `targetPoint.parentStory` (avec repli explicite **et signalé dans le log** si indisponible) ; arbitre JS pur `crCount` (comptage des `\r` sur `fullText`, attendu = `crCount + 1`) ; **log de contraste** affichant côte à côte la vérité (`parentStory`) et la valeur mensongère de la `story` capturée avant vidage.

**Pré-checks** : `node --check` OK ; sim 1bis **26/26** (modélise désormais le DÉTACHEMENT + verrouille le faux positif `REPLI`) ; **contrôle négatif concluant** — le sim ÉCHOUE (3 checks, EXIT=1) si l'ancien code revient ; sim 1ter **13/13** (non-régression). Synchronisé Scripts Panel, `shasum -a 256` identique (`348c64f1ec394dca9bfaecf4f5bd003a8d99670c0e6e17d069280fc69218c09a`, 82 484 octets).

**Critère de sortie de cette étape** : le compteur de log en mode TextFrame donne `3` (pas `1`) sur le même test qui donnait `1` auparavant, confirmé par au moins 2 tests réels supplémentaires. Tant que ce n'est pas fait, tout statut "validé" d'une étape antérieure basé sur ce compteur reste à confirmer par un constat visuel explicite, pas seulement par le log.

**✅ CRITÈRE DE SORTIE REMPLI le 26/09 à 17:31–17:32 (rejeu réel, mode TextFrame — celui qui mentait) :**

| Heure | Blocs | `paragraphes reels` | avant correctif | Contraste (proxy périmé) |
|-------|-------|--------------------|-----------------|--------------------------|
| 17:32:17 | 3 | **3** ✅ | `1` | snapshot=3, `.contents.length=0` |
| 17:32:28 | 85 | **85** ✅ | valeur périmée | snapshot=**26**, `.contents.length=0` |

Les deux tirs affichent `source=targetPoint.parentStory` **sans** `REPLI`, **sans** `DIVERGENCE`, **sans** `ECART DOM/JS`. Le tir à 85 blocs montre le proxy périmé annonçant `snapshot=26` / `.contents.length=0` pendant que la vérité donne `85` et `targetPoint.contents.length=5474` : la couche 2 est neutralisée, pas contournée par chance. Le chiffre du log a en outre été **reproduit par une méthode indépendante** (réexécution du vrai `parseMarkdown` hors InDesign : 3/636/2 et 85/5474/84, exactement les valeurs du log) et **recoupé au comptage visuel** (9 titres + 72 puces + 4 paragraphes = 85). Le compteur ne ment plus : l'étape 0bis est close.

## Étape 1ter — Check + nettoyage des styles courants au moment du trigger

**Origine** : demandé par FJD le 26/09/2026, après validation de l'étape 1 et pendant la rédaction de l'étape 1bis. Constat : le script démarre aujourd'hui sans regarder l'état de style du point d'entrée. Si l'utilisateur déclenche l'import depuis un point déjà porteur de styles (caractère/paragraphe/objet/table) ou d'overrides locaux, le mapping qui suit hérite de ce désordre au lieu de partir d'une base propre — d'où l'exigence d'un **check nettoyage immédiat, avant tout mapping**.

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

## Étape pivot 1 — Test de faisabilité du place gun natif (26/09/2026, ✅ validé en réel)

**But** : répondre par un test réel à la question laissée ouverte par la mission 00 (Q1) — le « curseur chargé » (loaded cursor) est-il déclenchable par script, avec le comportement clic / shift-clic hérité ?

**Moyen** : sonde **jetable**, hors dépôt — `probe_place_gun.jsx` (57 lignes, 100 % ASCII, `node --check` OK), écrite dans le Scripts Panel à côté du précédent `test_place_icml.jsx`. Log dédié `probe_place_gun.log` (distinct de `import_md_errors.log`). **Aucune dépendance à `import_md.jsx`**, donc aucun risque de perturber le plugin en cours.

**Non commitée volontairement** : c'est de la vérification, pas un livrable. Source : `/tmp/probe_place_gun.jsx`.

**Résultat réel (26/09/2026 18:18:17, doc « Sans titre-3 », `selection.length=0`)** :

| Ce qui est testé | Résultat |
|---|---|
| `typeof doc.place` | `function` ✅ |
| `typeof doc.placeGuns` | `object` ✅ |
| `typeof doc.placeGuns[0]` | **`undefined`** ⚠️ |
| `typeof doc.placeGuns.getElements` | `function` ✅ |
| `typeof doc.placeGuns.loadPlaceGun` | `function` ✅ |
| `typeof doc.placeGuns.abortPlaceGun` | `function` ✅ |
| `A` : `doc.place(md)` | **OK** → `loaded=true` ✅ |
| `A-bis` : `abortPlaceGun()` | **OK** → `loaded=false` ✅ |
| `B` : `loadPlaceGun(md)` | **OK** → `loaded=true`, `isValid=true` ✅ |
| `B-bis` : `.txt` de discrimination | **non exécutée** — inutile, le `.md` a chargé le place gun |
| Après l'alerte | `loaded=true` ✅ (l'alerte ne vide pas le place gun) |

**Conclusion — 3 faits actés :**

1. **Le place gun natif est chargeable par script.** Q1 de la mission 00 est confirmée **par l'expérience**, pas seulement par la doc : `loadPlaceGun()` → `loaded=true` / `isValid=true`. Le pivot est fondé sur du réel.
2. **Le curseur change bien d'apparence** et un clic crée un bloc de texte (constat FJD) — exactement le comportement natif décrit dans la mission 00 (clic simple = nouveau bloc dans les marges).
3. **Le chargement est indépendant du format.** Le `.md` charge le place gun aussi bien qu'un `.txt` l'aurait fait. Information importante pour l'option 3 du plan (placer un fichier converti) : le chargement ne bute **pas** sur le Markdown — ce qui dépendra du format, c'est le **mapping de styles natif** (RTF / Tagged Text).

**Ce que le réel a corrigé dans le plan documentaire (3 écarts doc → réel) :**

1. `document.placeGuns` est un **`PlaceGun`**, pas une collection : `doc.placeGuns[0]` renvoie `undefined` (mesuré). L'écriture `document.placeGuns[0].loadPlaceGun(fichier)` qui figurait au ROADMAP était donc **fausse** — il faut utiliser `doc.placeGuns` **directement**.
2. `Document.place()` a bien chargé le place gun ici, mais la doc officielle prévient qu'il « peut charger le place gun **ou** remplacer l'objet sélectionné selon les préférences » → route **non déterministe**. La sonde l'avait encadrée (sautée si une sélection existe) : bonne pratique à conserver.
3. `ContentPlacerObject.load()` (cible de la dépréciation de `placeAndLink`) prend des **`PageItem[]`, pas des fichiers** — ce n'est donc **pas** une route « placer un fichier ». L'option 3 du plan passera par `Document.place()`.

**Ce qui reste à vérifier (point 2 de la feuille de route pivot)** : le **shift-clic** — création automatique des pages nécessaires selon le calibrage du texte chargé, sans code supplémentaire de notre part. Non couvert par cette sonde, qui s'arrête au chargement.

**Leçon de méthode** : la sonde a coûté ~1 minute de conception et a tranché en 4 secondes ce que la doc seule laissait ambigu (`placeGuns[0]`). Le principe du projet — « citer l'extrait exact de la doc **avant** toute hypothèse » — reste vrai, mais ce cas montre qu'il faut **doubler la doc par une mesure** dès que la question tient dans un script de 15 lignes.

## Étape pivot 1bis — Limite du mode gun : avertissement de responsabilité (26/09/2026, ✅ acté par FJD)

**But** : traiter le comportement fautif constaté en mode gun — le texte déposé par l'import natif arrive **entièrement stylisé sous un style unique**, au lieu d'être neutre.

**Fait établi par FJD (26/09)** : « je n'ai que des **H2** en loadedgun, le **H2 sélectionné dans le panneau style de paragraphe** ». Résultat **UNIFORME** ⇒ un **seul** style s'applique à tout le texte ⇒ ce n'est **pas** un interpréteur de balises Markdown (un style unique ne peut pas produire une hiérarchie) mais l'**état du panneau Style de paragraphe**.

**Preuve log (8 tirs sur 8, 19:17 → 21:13)** : chaque tir gun est précédé de sa neutralisation, et les défauts du document valent `[Aucun style]` au moment du `loadPlaceGun` — **et le texte arrive quand même en H2**. ⇒ `textDefaults` est **innocenté** ; le style vient d'un **état du panneau**, qui **n'a aucun accesseur API**. L'import natif n'étant pas scriptable (Q2 = NON, SDK C++ seulement), il n'existe **aucun levier** pour corriger ce comportement depuis le script.

**Deux chemins de placement, à ne plus confondre :**

| | `frame.place(.md)` (script) | clic du gun (UI) |
|---|---|---|
| Nature | placement **programmatique** | placement **interactif** |
| Style obtenu | défauts d'import → **texte brut** (mesuré : 110/110 `[Aucun style]`, marqueurs intacts) | **style actif du panneau** → H2 |

Conséquence : **toute tentative de simulation du gun par `frame.place()` est infidèle** (brut ≠ H2). C'est ce qui invalide la piste du « cadre provisoire » (hack de neutralisation) comme moyen d'observer ou de contourner le comportement du gun.

**Décision FJD (26/09)** : « on met le loadGun en suspens » ⇒ **avertir, pas corriger**. Le mode gun reste disponible mais **encadré par une alerte**.

**Livrable** — dans `import_md.jsx`, branche `mode === "gun"`, **avant** le sélecteur de fichier :
- lecture du style de paragraphe par défaut **AVANT `neutralizeDocumentDefaults`** (après, il vaudrait forcément `[Aucun style]` et l'alerte serait mensongère) ;
- `confirm()` (annulable) nommant le style en route et donnant la **consigne** : basculer sur le style de paragraphe standard (`[Aucun style]`) dans le panneau, puis relancer ;
- **robuste au cas `[Aucun style]`** : si le nom lu est neutre (c'est le cas dès la 2ᵉ exécution), l'alerte renvoie au panneau **sans affirmer de nom** — puisque l'état réel du panneau n'est pas lisible ;
- **Annuler = sortie propre**, le gun n'est pas chargé ; la décision est tracée au log (`ANNULE` / `CONFIRME`) ;
- **scope gun uniquement** : les modes `cadre`/`curseur` sont gouvernés par notre mapping, donc pas d'alerte.

**Vérifications** : `node --check` OK, `U+FFFD = 0` (aucune corruption d'encodage), copie Scripts Panel identique (`diff` + `shasum`). Dépôt : hash `c4702dcc…`, 94276 octets. **Commit `3847d6e`.**

**Reste ouvert (non bloquant)** : le sort du mode gun à terme — soit conservé avec cette alerte, soit remplacé par un **mode `cadre` auto-créateur** (création du cadre + insertion via notre mapping, résultat garanti et neutre). À trancher par FJD.

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
| 26/09 | 0bis — Diagnostic + correctif | ✅ **VALIDÉ EN RÉEL (rejeu TextFrame 17:31–17:32)** | **Cause racine (double couche)** : (1) `targetPoint` (`story.insertionPoints[-1]`) résolu **avant** `story.contents = ""` → référence périmée par la recomposition ; (2) **cause définitive** : la poignée `story` capturée avant le vidage se **DÉTACHE** — elle renvoie `.contents.length = 0` et un `paragraphs` périmé, alors que le texte vit dans **`targetPoint.parentStory`**. Preuve initiale par rejeu réel de 4 tirs (dont tir 3 TextFrame 39 blocs → `story` snapshot=9 / `.contents.length=0`, `parentStory`=4402, œil=39). **Correctif** : `targetPoint` re-résolu après vidage ; mesure sur `targetPoint.parentStory` (repli signalé dans le log) ; **arbitre JS pur** `crCount` (`\r` sur `fullText`, attendu = `crCount + 1`) ; **log de contraste** vérité vs proxy périmé. **3ᵉ défaut corrigé** : le libellé `(REPLI sur story !)` était un **faux positif en mode curseur** (`parentStory === story` y est le cas normal) → conditionné à `!insertAtCursor`. **Pré-checks** : `node --check` OK ; sim 1bis **26/26** (modélise le détachement + verrouille le faux positif) ; **contrôle négatif concluant** (EXIT=1 sur l'ancien code) ; sim 1ter **13/13**. Synchronisé Scripts Panel (`348c64f1…`, 82 484 octets). Doc : wiki **Cas 24** + **addendum** (3ᵉ défaut). **Rejeu réel TextFrame concluant (17:31–17:32)** : 3 blocs → `paragraphes reels=3` (avant : `1`) ; 85 blocs → `=85` (avant : périmé), sans `REPLI`/`DIVERGENCE`/`ECART DOM/JS`, avec contraste `snapshot=26 / contents.length=0` exposant le proxy mort. Chiffres reproduits par réexécution du vrai parseur hors InDesign + recoupés au comptage visuel (9 titres + 72 puces + 4 paragraphes = 85). **Critère de sortie rempli.** |
| 26/09 | 1ter | ✅ **VALIDÉE EN RÉEL (acté par FJD le 26/09)** | Section ajoutée sur demande de FJD (26/09) : check + nettoyage des styles courants (caractère, paragraphe, objet, table/cellule) au trigger, AVANT tout mapping, avec journalisation nominative de ce qui est retiré. **Code écrit, pré-checké (sim 13/13), synchronisé — non commité.** Le rejeu réel du 17:32 montre la 1ter **s'exécuter correctement** : `[paragraphe] applique='H2'` → `[paragraphe] remis a neutre -> 'H2' vers '[Aucun style]' (clearingOverrides=true)` et `[objet] cadre vise -> applique='[Bloc de texte standard]'` → `[objet] remis a neutre '[Sans]' + clearObjectStyleOverrides()`. **Validation actée par FJD le 26/09** au vu du rejeu réel du 17:32. Point laissé ouvert (non bloquant) : l'arbitrage `clearOverrides(OverrideType)` vs réaffectation neutre. Voir section dédiée. |
| 26/09 | pivot 1 — place gun | ✅ **VALIDÉ EN RÉEL (18:18)** | Sonde jetable `probe_place_gun.jsx` (hors dépôt, log dédié `probe_place_gun.log`, 100 % ASCII, `node --check` OK). Mesures réelles : `typeof doc.placeGuns[0]` = **`undefined`** → `placeGuns` est un `PlaceGun`, **pas** une collection (l'écriture `placeGuns[0].loadPlaceGun()` du ROADMAP était fausse) ; `document.place(md)` → `loaded=true` ; `abortPlaceGun()` → `loaded=false` ; `loadPlaceGun(md)` → `loaded=true`, `isValid=true`. Curseur chargé confirmé visuellement, clic = nouveau bloc de texte. **La branche de discrimination `.txt` n'a pas eu à s'exécuter → le chargement ne dépend pas du format** (seul le mapping de styles natif en dépendra). Reste (point 2 du pivot) : le shift-clic / calibrage de pages. Aucun commit (sonde jetable, non livrable). |
| 26/09 | 1 — RÉGRESSION ISOLÉE | 🔴 BLOQUANT | Tests réels multiples (15:33-15:44) montrent un motif net et systématique, extrait du log `import_md_errors.log` : **mode `InsertionPoint` (curseur de texte, `paragraphes avant=0`) → `paragraphs.length=3` après insertion, correct (15:39:11, 15:39:37). Mode `TextFrame` (outil flèche/cadre sélectionné) → `paragraphs.length=1` après insertion, À CHAQUE FOIS, sans exception (15:34:06, 15:34:20, 15:35:18, 15:36:22, 15:40:12, 15:42:43, 15:43:39)**, quel que soit le nombre de paragraphes déjà présents dans le cadre (24, 5, 7, 3 — pas un effet du contenu préexistant). Donc ce n'est pas une régression aléatoire ni liée à un TextFrame « sale » : c'est un bug reproductible, isolé au chemin `mode=TextFrame` de `insertMarkdownWithStyles_v2`, qui fusionne systématiquement le texte en un seul paragraphe. Le commit `f3f6c68` (validation initiale étape 1) a donc probablement été testé uniquement en mode `InsertionPoint`, ou quelque chose a changé le chemin `TextFrame` depuis (probable candidat : le passage à `targetPoint.contents = fullText` avec `targetPoint` recalculé selon `insertAtCursor`, introduit lors du codage de la 1bis — à vérifier, pas à supposer). **À isoler et corriger avant de poursuivre la 1ter ou le pivot place gun** — le socle texte brut n'est plus fiable sur un des deux chemins déjà validés. |

## Référence
- Ancienne version (à ne pas modifier tant que la nouvelle n'a pas atteint une couverture équivalente) : `import_md.jsx` lignes 965-1180, fonction `insertMarkdownWithStyles`.
- Wiki : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — Cas 17-23 pour l'historique du problème.
- Fichier de référence de non-régression : `fixtures/deepseek_referentiel/*.md` (fonctionnait au tout début de la session du 23/09).
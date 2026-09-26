# Mission 03 — Reconstruction minimale de `insertMarkdownWithStyles` après régression non identifiée

**Statut** : ✅ **ÉTAPE 0bis VALIDÉE EN RÉEL** (rejeu TextFrame du 26/09 17:31–17:32) — le compteur de log ne ment plus, la suite peut s'appuyer dessus. Constat du 26/09 soir : le log annonçait `1` paragraphe (puis `9`) là où FJD a vu **3** (puis **39**) paragraphes propres à l'écran — **faux positif du log lui-même**, pas une régression du texte inséré. **Cause racine identifiée (double couche)** : (1) `targetPoint` résolu AVANT `story.contents = ""` ; (2) — cause définitive — **la poignée `story` capturée avant le vidage se DÉTACHE** : après `contents = ""`, elle renvoie `.contents.length = 0` et un `paragraphs` périmé, alors que le texte vit dans **`targetPoint.parentStory`**. Preuve : tir TextFrame 39 blocs → `story` snapshot=9 / `.contents.length=0`, `parentStory`=4402, œil=39. **Correctif appliqué** : `targetPoint` re-résolu après vidage ; mesure sur `targetPoint.parentStory` (avec repli signalé) ; arbitre JS pur `crCount` (`\r` sur `fullText`, attendu = `crCount + 1`) ; log de contraste vérité vs proxy périmé. Pré-checks OK (`node --check`, sim 1bis **26/26**, contrôle négatif concluant, sim 1ter 13/13), synchronisé Scripts Panel (`348c64f1…`). **Rejeu réel du 26/09 17:31–17:32 — mode TextFrame (les 2 tirs qui mentaient) : `paragraphes reels=3` puis `=85`, conformes au constat visuel (9 titres + 72 puces + 4 paragraphes = 85), sans `REPLI` / `DIVERGENCE` / `ECART DOM/JS`, avec le contraste `snapshot=26 | contents.length=0` exposant le proxy périmé. Chiffres reproduits par réexécution du vrai parseur hors InDesign (85/5474/84). Le compteur est fiable : la 0bis est close et les étapes suivantes peuvent s'appuyer sur le log.**
**Bloque** : toutes les autres missions jusqu'à validation complète (étape 8)

**Statut pivot (26/09)** : ✅ **étape 1ter validée en réel (FJD)** et ✅ **test de faisabilité du place gun concluant (26/09 18:18)** — le place gun natif est chargeable par script (`loadPlaceGun()` → `loaded=true` / `isValid=true`), le curseur change d'apparence et un clic crée un bloc de texte. La chaîne d'entrée est donc complète, du trigger au placement natif. ⚠️ **Mais le mode gun est mis en suspens (décision FJD 26/09)** : le texte déposé arrive entièrement sous le **style actif du panneau** (H2, uniforme), qui n'a **aucun accesseur API** et n'est pas scriptable ⇒ **avertir, pas corriger** (voir « Étape pivot 1bis » ci-dessous). **Décision FJD (26/09) : gun CONSERVÉ avec l'alerte (choix A), pas de mode `cadre` auto-créateur.** **Prochaine étape** : héritage du shift-clic / calibrage de pages (point 2 de la feuille de route pivot — **spécifié** ci-dessous, **à exécuter**), puis reprise des étapes 2 à 8 (**spec détaillée** dans la section « Étapes 2 à 8 »).

## Feuille de route pivot — place gun natif (actée par FJD le 26/09/2026)

Suite à la réponse tranchée de la question prioritaire de [[mission_00_ontologie_dom_indesign]] (Q1 confirmée positive : le place gun natif est déclenchable par script — `document.place()` / `Document.placeGuns` / `PlaceGun.loadPlaceGun()`, citation officielle indesignjs.de/Document.html), FJD acte l'ordre de travail suivant, **chaque étape validée en réel avant de passer à la suivante** (même règle que le reste de la mission) :

1. ✅ **Test de faisabilité isolé du place gun** — **FAIT ET VALIDÉ EN RÉEL le 26/09 à 18:18** (sonde jetable `probe_place_gun.jsx`, log dédié). `loadPlaceGun(fichier)` → `loaded=true` / `isValid=true`, curseur chargé, clic = nouveau bloc de texte. Le chargement **ne dépend pas du format** (un `.md` charge aussi bien qu'un `.txt`). Ce mode d'entrée s'ajoute aux deux déjà couverts par l'étape 1bis (curseur de texte dans un bloc existant, outil flèche sur cadre existant) — **il ne les remplace pas**. Voir section dédiée.
2. **Héritage du shift-clic / calibrage de pages** : une fois le place gun confirmé fonctionnel, vérifier que le shift-clic natif crée bien les pages nécessaires selon le calibrage du texte chargé, sans code supplémentaire de notre part. **Spécifié en détail** (voir « Étape pivot 2 » ci-dessous) — sonde en deux temps (préparer / relever), car le geste utilisateur est humain et se produit après la fin du script. **Non encore exécuté.**
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
| 8 | Fichier DeepSeek de référence (celui qui marchait au tout début) + 5 fixtures existantes | `fixtures/deepseek_referentiel.md` + les 5 fixtures | `M03 étape 8 : non-régression complète` |

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

**Décision FJD (26/09)** — le sort du mode gun à terme est **tranché** : le gun est **CONSERVÉ** avec cette alerte (choix A). Pas de mode `cadre` auto-créateur pour l'instant. Le point ci-dessus n'est donc **plus ouvert**.

## Étape pivot 2 — Shift-clic et calibrage de pages (point 2 de la feuille de route)

**Question à trancher** : une fois le place gun chargé par notre script, le **shift-clic** natif d'InDesign crée-t-il bien **automatiquement les pages nécessaires** pour absorber le texte chargé, selon le calibrage du cadre du document — **sans code supplémentaire de notre part** ?

**Pourquoi c'est le point suivant** : cette propriété est ce qui rend la voie « gun » **économique** (pas de gestion de pages à écrire) et ce qui justifie de conserver le gun malgré la limite de style actée en pivot 1bis. Si le shift-clic ne se comporte pas comme la doc le décrit, l'argument tombe et le mode `cadre` auto-créateur redevient une piste sérieuse (décision à re-remonter à FJD).

**Sonde à écrire** (jetable, hors dépôt, comme en pivot 1 — même protocole) :
- document de test à **une seule page**, calibrage tel que le fichier chargé **dépasse** une page ;
- charger le gun avec `doc.placeGuns.loadPlaceGun(<md long>)` (route confirmée `loaded=true` en pivot 1) ;
- **ne pas** déclencher de placement programmatique — le **geste** (clic / shift-clic) est **humain**, il revient à FJD ; le script ne peut que **préparer** l'état (charger le gun) puis **rendre la main** ;
- le script **journalise** l'état avant la main : `placeGuns.loaded`, `doc.pages.length`, calibrage de la marge/colonne, et le nombre de blocs attendus du fichier (via `parseMarkdown`) ;
- **après** le geste, un **second script** (ou un rejeu manuel du log) relève : `doc.pages.length` final, nombre de blocs de texte créés, frames produits.

**Point technique à mesurer, pas à supposer** : le contenu du gun et l'état des pages **après** le clic ne sont observables que par un **second script** — l'exécution script **bloque l'UI** (fait acté en pivot 1bis), donc le geste de l'utilisateur se produit **forcément après** la fin du script. La sonde doit donc être **en deux temps** (préparer / relever), pas en un seul script.

**Ce que la sonde doit répondre (3 mesures)** :
1. **Clic simple** hors marge sur un doc d'une page : le texte débordant crée-t-il des **pages supplémentaires**, ou est-il **perdu/tronqué** ?
2. **Shift-clic** au même endroit : comportement identique, ou **création automatique de pages** ?
3. Dans le cas où des pages sont créées : **combien**, et selon quel **calibrage** (le nombre de pages suit-il bien le volume de texte du fichier chargé) ?

**Critère de réussite du pivot 2** :
- soit le shift-clic **crée les pages manquantes** de façon **automatique et cohérente** avec le volume chargé ⇒ **le point 2 est validé**, le gun reste la voie retenue (avec son alerte, choix A), et on passe au point 3 (reprise des étapes 2 à 8) ;
- soit il **ne crée pas** les pages ⇒ **point 2 invalidé** : re-remonter à FJD l'arbitrage entre (a) garder le gun **avec** une gestion de pages codée par nos soins, ou (b) basculer sur le mode `cadre` auto-créateur (piste déjà évoquée, désormais techniquement justifiée).

**Non commitée** : comme en pivot 1, c'est de la **vérification**, pas un livrable — sauf si FJD demande explicitement de tracer le résultat. Dans tous les cas, **consigner le résultat** ici (section mise à jour + ligne au Journal) avec les **mesures brutes**, jamais une conclusion sans chiffre.

## Décisions actées (26/09/2026)

Deux arbitrages de FJD conditionnent la rédaction des étapes 2 à 8 :

1. **Sort du mode gun = conservé + alerte** (statu quo, déjà en place, commit `3847d6e`). Aucun développement supplémentaire sur le gun au-delà de l'avertissement.
2. **Périmètre du mapping maison = jusqu'aux tables/code inclus.** L'import natif du gun n'est **pas** un substitut à notre mapping : le projet veut **son propre mapping complet**, y compris les couches tables (étape 6) et code (étape 7). Ces deux étapes restent donc **dans le périmètre plein**.

Ces deux décisions **ferment les deux questions jusqu'ici marquées « ouvertes »** dans la spécification des étapes 2 à 8 :

3. **Étape 6 — API de création de table : CONFIRMÉE.** La création de table par API est disponible en ExtendScript et **déjà éprouvée dans la version 1** du script (`insertMarkdownWithStyles`, `import_md.jsx` L1049-1071) : `story.insertionPoints[-1].tables.add({ headerRowCount: 1, bodyRowCount: rowCount - 1, columnCount: columnCount })`, remplissage `newTable.rows[r].cells[cIdx].texts[0].contents`, puis `newTable.appliedTableStyle` (style issu de `findTableStyleByName(mapping["table"])`). L'étape 6 **reprend cette route connue** ; `insertMarkdownWithStyles_v2` la saute aujourd'hui (L1218) et doit la réintégrer. ⇒ **Plus de point de blocage.**
4. **Étape 7 — Code multiligne : TRANCHÉ.** Un bloc de code multiligne produit **un paragraphe par ligne** (sauts `\r`), pas un paragraphe unique à sauts `\n` internes (même prudence que la version 1 sur les positions de caractères). ⇒ **Plus de point à trancher.**

Ces quatre points étant actés, les étapes 2 à 8 sont **entièrement spécifiées et débloquées** ; seul le **pivot 2** (shift-clic / calibrage de pages) reste à constater en réel.

## Étapes 2 à 8

### Préambule commun

Chaque étape ajoute **une seule couche** sur la base de la précédente déjà validée en réel, avec son propre fichier de test minimal, en respectant le protocole (sync Scripts Panel → test réel → commit).

**Le parsing est déjà figé** (parseur réel de l'étape 1) : chaque fixture possède son oracle `fixtures/mission_03_minimal/test_min_NN_*.expected.json`, **généré en exécutant le vrai `parseMarkdown()` hors InDesign** (jamais écrit à la main). Le test réel compare le résultat InDesign à cet oracle.

**Vocabulaire réel des blocs** (tel que le parseur les produit — à ne pas confondre avec la syntaxe Markdown d'entrée) :

| Type de bloc | Source Markdown réelle | Champs |
|---|---|---|
| `h1` / `h2` / `h3` | `# ` / `## ` / `### ` — **seuls niveaux littéraux reconnus** | `text` |
| `h4` / `h5` | **uniquement synthétiques** : une puce **entièrement en gras** (`* **Titre**`) au niveau d'indentation 0, après qu'un vrai titre a été rencontré → niveau `currentTitleLevel + 1`. Un `#### ` littéral **n'est pas un titre** (il tombe en `p` avec le texte `"#### …"`). | `text` |
| `p` | paragraphe (lignes source consécutives fusionnées avec **un espace**) | `text` |
| `li` | `- ` / `* ` / `+ ` | `text`, `indentLevel = floor(espaces / 2)` |
| `li_num` | `1. ` | `text` |
| `blockquote` | `> ` (une ligne = un bloc) | `text` |
| `table` | `\| a \| b \|` (ligne séparatrice ignorée, barres de bord retirées) | `rows` (tableau de tableaux) |
| `code` | bloc ``` ``` ... ``` ``` | `text` (brut, jamais interprété), `language` |

**Principe d'index stable** (base de tout le mapping) : après l'insertion du texte complet en **une seule affectation** (`targetPoint.contents = fullText`), `story.paragraphs.everyItem().getElements()` renvoie les paragraphes **dans l'ordre**. Le **n-ième bloc non-table** correspond au **n-ième paragraphe**. Les blocs `table` sont **hors de ce compte** (ils ne produisent pas de texte — voir étape 6). Ce principe est déjà implémenté et mesuré en réel à l'étape 0bis.

**Un log par étape**, préfixé `M03-etapeN:` (100 % ASCII, tronqué si long), exposant au minimum : le type et l'index de chaque bloc, le style **demandé** par le mapping, le style **réellement appliqué** relu sur le paragraphe, et un compteur `paragraphes attendus / réels`. Un écart doit être visible sans lire le document.

### Tableau récapitulatif

| Étape | Couche ajoutée | Fixture | Oracle (blocs réels) | Commit attendu |
|---|---|---|---|---|
| 2 | Styles de paragraphe mappés (index stable, sans segment) | `test_min_02_styles.md` | 11 blocs : h1:1, p:4, h2:1, h3:1, blockquote:1, li:1, li_num:2 | `M03 étape 2 : mapping styles OK` |
| 3 | Titres (h1→h3 littéraux + h4/h5 synthétiques) | `test_min_03_titres.md` | 15 blocs : h1:1, p:8, h2:2, h3:2, h4:1, li:1 | `M03 étape 3 : titres OK` |
| 4 | Gras / italique (segments inline) | `test_min_04_segments.md` | 9 blocs : h1:1, p:5, li:3 | `M03 étape 4 : segments OK` |
| 5 | Listes (cascade d'indentation) | `test_min_05_listes.md` | 16 blocs : h1:2, h2:1, p:2, li:8 (indentLevel 0/1/2), li_num:3 | `M03 étape 5 : listes OK` |
| 6 | Tableaux | `test_min_06_tables.md` | 6 blocs : h1:1, p:3, table:2 (rows 4×3 et 3×2) | `M03 étape 6 : tables OK` |
| 7 | Blocs de code | `test_min_07_code.md` | 8 blocs : h1:1, p:4, code:3 (`` `` , `javascript`, `markdown`) | `M03 étape 7 : code OK` |
| 8 | Non-régression complète | `fixtures/deepseek_referentiel.md` + 5 fixtures existantes | oracle `.expected.json` respectifs (35 / 32 / 24 / 24 / 85 blocs) | `M03 étape 8 : non-régression complète` |

### Étape 2 — Mapping des styles de paragraphe

**Entrée** : `test_min_02_styles.md` — un bloc de chaque famille mappable (h1, h2, h3, `p`, `blockquote`, `li`, `li_num`), **sans** segment inline (ni gras, ni italique).

**Ce que le parseur doit produire** (vérifié, oracle présent) : 11 blocs dans l'ordre
`h1, p, h2, p, h3, p, blockquote, li, li_num, li_num, p`.

**Ce que l'étape doit faire** :
- insérer tout le texte en **une seule affectation** (acquis étape 1) ;
- pour chaque bloc non-table, en index croissant, appliquer le style de paragraphe **lu dans le mapping du document** (`loadMappingFromDocument()` → clé `MARKDOWN_TAGS` : `h1`→style H1 du doc, `p`→style standard, `blockquote`→style citation, `li`→style puce, `li_num`→style numérotée) ;
- si une clé du mapping est **absente ou pointe un style inexistant**, ne pas échouer : appliquer le style neutre et **journaliser** `M03-etape2: pas de style pour <tag>, neutre applique` ;
- **ne pas** toucher aux segments inline (un `**` dans le texte à ce stade reste **littéral visible** — c'est le comportement attendu de l'étape 2, la couche suivante le traitera).

**Critère de réussite (test réel)** :
- 11 paragraphes produits, dans l'ordre de l'oracle, aucun fusionné ni dupliqué ;
- le style **relu** sur chaque paragraphe correspond au style attendu par le mapping pour son tag ;
- log : `M03-etape2: blocs=11 paragraphes attendus=11 reels=11 ecarts=0`.

**Hors périmètre** : segments, listes imbriquées (l'unique `li` de cette fixture est de niveau 0), tables, code.

### Étape 3 — Titres

**Entrée** : `test_min_03_titres.md`.

**Ce que le parseur doit produire** (vérifié) : 15 blocs — deux `h2`, deux `h3` (pour éprouver la **répétition** et la **remontée** de niveau : h2 → h3 → h2 → h3), **un `h4` synthétique** issu d'une puce `* **…**` au niveau 0, et une **sonde de limite** : la ligne `#### Titre 4 par quatre dieses` **doit tomber en `p`** (texte littéral commençant par `####`), car le parseur ne reconnaît que `#`/`##`/`###`.

**Ce que l'étape doit faire** : mapper `h1`→`h5` sur les styles de titre du document via `MARKDOWN_TAGS` (déjà déclarés, y compris `h4`/`h5` dont le libellé est explicitement *« sous-titre de liste en gras »*), en gardant l'index stable.

**Critère de réussite (test réel)** :
- les 4 titres littéraux (1×h1, 2×h2, 2×h3) et le `h4` synthétique portent chacun le style attendu ;
- la ligne `#### …` apparaît comme **paragraphe standard** avec le texte **littéral** `#### Titre 4 par quatre dieses` (aucun `#` consommé) ;
- log : `M03-etape3: h1=1 h2=2 h3=2 h4_synth=1 derives=0 sonde_#### = p`.

**Point de vigilance** : la sonde `####` documente une **limite connue et assumée** du parseur. Si FJD souhaite un jour les vraies balises `####`/`#####`, c'est une **décision de parsing** (à acter), pas un bug de mapping.

### Étape 4 — Gras / italique (segments inline)

**Entrée** : `test_min_04_segments.md` — du texte **avant et après** chaque marqueur (jamais un paragraphe entièrement en gras, qui serait un titre synthétique), plus du gras/italique **dans des puces**, plus un mot `mot_gras_isole` contenant des underscores (contrôle de la règle `isWordBoundaryChar`).

**Ce que le parseur doit produire** (vérifié) : 9 blocs — h1:1, p:5, li:3 ; chaque bloc non-table porte des `children` issus de `parseInlineMarkdown` (`{text, isBold, isItalic}`) — à ce stade l'oracle ne stocke que `type`/`text` (les `children` sont la matière de **cette** étape).

**Ce que l'étape doit faire** :
- calculer, pour chaque bloc, l'**offset absolu** de chaque segment dans le texte complet (les blocs étant joints par `\r`, un segment à cheval est impossible : les marqueurs inline ne traversent pas un saut de paragraphe) ;
- appliquer le style de caractère mappé (`bold`→style gras, `italic`→style italique de `MARKDOWN_TAGS`) sur la **plage de caractères** correspondante ;
- vérifier la règle underscores : `mot_gras_isole` **ne doit pas** déclencher d'italique (underscore non bord de mot) ;
- ne **pas** toucher aux blocs `code` (leur texte n'est jamais parsé en inline) ni aux `table` (cellules non gérées).

**Critère de réussite (test réel)** :
- toutes les occurrences de `**…**`/`*…*` sont stylées, **aucun marqueur `*` résiduel visible** ;
- les caractères **hors** marqueurs restent en style neutre (pas de débordement sur le mot voisin) ;
- `mot_gras_isole` intact ;
- log : `M03-etape4: segments appliques=N residuels=0 debordements=0`.

### Étape 5 — Listes (cascade d'indentation)

**Entrée** : `test_min_05_listes.md`.

**Ce que le parseur doit produire** (vérifié) : 16 blocs — h1:2, h2:1 (**synthétique**), p:2, li:8 avec `indentLevel` 0/1/2, li_num:3. Les `li` de niveau 3 sont obtenus par **4 espaces** (2 espaces = 1 niveau).

**Ce que l'étape doit faire** — appliquer la cascade **déjà écrite** dans `getLiStyleForIndentLevel(block, mapping)` (ancienne version, à réutiliser telle quelle) :
1. `indentLevel === 0` → style `li` ;
2. sinon, style de liste dédié `li(N+1)` **s'il est mappé et existe** ;
3. sinon, **cascade de titres plafonnée au plus haut niveau de titre réellement disponible dans le mapping** (attention : un `h4`/`h5` déclaré dans `MARKDOWN_TAGS` mais **non mappé** ne compte pas) ;
4. sinon, retomber sur le style `li` racine.

**Critère de réussite (test réel)** :
- les 8 puces portent le style attendu par la cascade (niveau 0 → `li`, niveaux 1 et 2 → selon mapping/cascade) ;
- les 3 items `li_num` portent le style de liste **numérotée** (distinct de la puce) ;
- la puce `* **Section avec sous-titre de liste**` produit bien un **`h2` synthétique** (style de titre), et **non** une puce ;
- log : `M03-etape5: li0=.. li1=.. li2=.. li_num=3 h_synth=1`.

**Note** : aucun `li` de cette fixture n'est entièrement en gras au niveau > 0, donc la cascade « puce grasse imbriquée = puce normale » n'est pas éprouvée ici — à ajouter en fixture de bord si FJD le juge utile.

### Étape 6 — Tableaux

**Entrée** : `test_min_06_tables.md` — deux tableaux de tailles différentes (**4×3** et **3×2**) séparés par un paragraphe.

**Ce que le parseur doit produire** (vérifié) : 6 blocs — h1:1, p:3, **table:2**, avec `rows` respectifs `[[«Colonne A»,«Colonne B»,«Colonne C»],[A1..],[A2..],[A3..]]` et `[[«Cle»,«Sens»],[h1,titre 1],[p,paragraphe]]`.

**Ce que l'étape doit faire** — c'est la **première couche non-texte**, le chemin technique diffère :
- **découper** le flux en segments autour de chaque table (approche déjà documentée dans `insertMarkdownWithStyles`) ;
- écrire le texte avant la table, **créer la table** via l'API InDesign (table insérée dans la story, `Table` + `cells`), écrire le texte après, sans jamais réassigner `insertionPoints[-1]` en boucle ;
- appliquer au **style de table** mappé (`MARKDOWN_TAGS.table`) et laisser le style de cellule par défaut, sauf mapping dédié ultérieur ;
- le **nombre de paragraphes** doit être recalculé : les tables **ne comptent pas** comme paragraphes (l'index stable ne porte que sur les blocs non-table).

**Critère de réussite (test réel)** :
- 2 tables réelles créées, aux bonnes dimensions (4 lignes × 3 colonnes, 3×2), cellules remplies dans le bon ordre ;
- les paragraphes créés entre/autour correspondent aux 4 blocs non-table, **style de table** correct ;
- aucun texte de tableau ne fuit en paragraphes parasites, aucun `|` résiduel visible ;
- log : `M03-etape6: tables=2 dims=4x3,3x2 cellules=18 paragraphes_hors_table=4`.

**Prérequis** : ✅ **LEVÉ (FJD, 26/09)** — la création de table par API **est disponible en ExtendScript** et **déjà éprouvée dans la version 1** du script (`insertMarkdownWithStyles`, `import_md.jsx` L1049-1071) : `story.insertionPoints[-1].tables.add({ headerRowCount: 1, bodyRowCount: rowCount - 1, columnCount: columnCount })`, remplissage par `newTable.rows[r].cells[cIdx].texts[0].contents = …`, puis `newTable.appliedTableStyle = <style mappé>`. **Ce n'est donc PAS un point de blocage** : l'étape 6 reprend cette route connue (elle sera réintroduite dans `insertMarkdownWithStyles_v2`, qui la saute aujourd'hui — `if (blocks[i].type === "table") continue;` L1218).

### Étape 7 — Blocs de code

**Entrée** : `test_min_07_code.md` — trois blocs : un sans langage, un ` ```javascript `, un ` ```markdown ` contenant **des balises Markdown littérales** (`# …`, `- …`) qui ne doivent **jamais** être interprétées, **sauf le motif tableau** (voir ci-dessous).

**Ce que le parseur doit produire** (vérifié) : 8 blocs — h1:1, p:4, **code:3** avec `language` = `""`, `javascript`, `markdown` et `text` = lignes brutes (indentation préservée, aucun trim interne).

**Ce que l'étape doit faire** :
- mapper le bloc `code` sur un style de paragraphe dédié (monospace, `MARKDOWN_TAGS.code`) ;
- préserver les **sauts de ligne internes** du bloc : **un paragraphe par ligne** (sauts `\r`) — décision actée par FJD le 26/09, cf. ci-dessous ;
- **ne jamais** parser l'inline ni les balises Markdown à l'intérieur d'un bloc de code (`#`, `-`, `*`, etc. restent littéraux) — **à l'exception du motif tableau** : si une ou plusieurs lignes consécutives à l'intérieur d'un bloc de code correspondent au motif d'un tableau Markdown (ligne d'en-tête `| … | … |` suivie d'une ligne de séparateurs `| :--- | :---: |`, éventuellement suivie de lignes de données), ce sous-ensemble de lignes doit être **détecté et traité comme une vraie table**, créée via l'API de création de table (même route que l'étape 6 : `story.insertionPoints[-1].tables.add({...})`), et **non affiché comme texte littéral**.

**Origine de ce cas** : réel, pas hypothétique — présent dans `fixtures/gemini_charte.md` lignes 24-26, à l'intérieur du bloc ` ```markdown ` (un tableau d'exemple documentaire, imbriqué dans un bloc de code qui illustre la structure attendue d'un document).

**Critère de réussite (test réel)** :
- 3 blocs de code présents, en style code, contenu exact (lignes dans le bon ordre) ;
- dans le bloc `markdown`, le `#` et la puce `-` restent **du texte**, aucun titre/puce créé ;
- si le bloc de test contient un motif tableau (comme dans `gemini_charte.md`), une vraie table InDesign est créée à cet endroit, pas des lignes `| … |` littérales ;
- log : `M03-etape7: code_blocs=3 lignes=N literaux_intacts=true tables_detectees_dans_code=<0|1|...>`.

**Décision actée (FJD, 26/09)** : un bloc de code multiligne produit **un paragraphe par ligne** (sauts `\r`), pas un paragraphe unique à sauts `\n` internes. Raison : l'ancienne version évitait déjà les `\n` internes pour ne pas désynchroniser le calcul des positions de caractères, et la mesure du nombre de paragraphes (étape 0bis, arbitre `crCount`) reste ainsi cohérente. Conséquence pour le log d'étape : `lignes` compte bien les paragraphes créés.

**Décision actée (FJD, 26/09, complément)** : un motif de tableau Markdown détecté à l'intérieur d'un bloc de code n'est **pas** un cas d'exclusion du parsing — il doit être extrait et rendu comme une vraie table InDesign, exactement comme un tableau hors bloc de code (étape 6). Le reste du bloc de code (lignes qui ne correspondent pas au motif tableau) reste du texte littéral, un paragraphe par ligne.

### Étape 8 — Non-régression complète

**Entrée** : le **fichier de référence** `fixtures/deepseek_referentiel.md` (fichier, 4 214 octets, oracle **35 blocs** : h1:1 h2:2 h3:5 p:16 li:11 — c'est le fichier qui fonctionnait au tout début) **plus les 5 fixtures existantes** avec leurs oracles déjà présents à la racine `fixtures/` :

| Fixture | Oracle (blocs) |
|---|---|
| `claude_sample.md` | `claude_sample.expected.json` — 24 blocs |
| `deepseek_referentiel.md` | `deepseek_referentiel.expected.json` — 35 blocs |
| `deepseek_formation.md` | `deepseek_formation.expected.json` — 85 blocs |
| `gemini_charte.md` | `gemini_charte.expected.json` — 24 blocs |
| `chatgpt_convention.md` | `chatgpt_convention.expected.json` — 32 blocs |

**Ce que l'étape doit faire** : rejouer les 6 fichiers **en réel**, sur les **deux points d'entrée** (curseur de texte et cadre sélectionné), et comparer le résultat (nombre de paragraphes, styles, segments, tables, code) à l'oracle correspondant. C'est aussi le moment du **nettoyage des logs de diagnostic temporaires** (cf. Règles non négociables).

**Critère de réussite (test réel)** :
- 6/6 fichiers importés sans erreur, sans `REPLI`, sans `DIVERGENCE`, sans `ECART DOM/JS` ;
- pour chacun : `paragraphes réels == attendus` (oracle) et styles conformes ;
- aucun log de diagnostic temporaire résiduel dans le livrable ;
- commit final `M03 étape 8 : non-régression complète`.

**Hors périmètre de l'étape 8** : les points 2 à 5 de la feuille de route pivot (shift-clic/calibrage de pages, reprise, menu `app.menuActions`, SDK C++) — suivis séparément.

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
- Fichier de référence de non-régression : `fixtures/deepseek_referentiel.md` (fichier, 4 214 octets — **pas** un dossier ; l'ancien chemin `fixtures/deepseek_referentiel/*.md` était erroné) + les 5 fixtures à la racine `fixtures/` (`claude_sample`, `deepseek_formation`, `gemini_charte`, `chatgpt_convention`) et leurs `.expected.json`.
- Fixtures du chemin minimal : `fixtures/mission_03_minimal/test_min_01_texte.md` → `test_min_07_code.md`, chacune accompagnée de son oracle `*.expected.json` généré par le vrai parseur.
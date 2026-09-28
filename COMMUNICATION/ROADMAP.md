# ROADMAP — Projet IMPORT_MD (plugin InDesign)

Registre actif des missions du projet. Chaque mission a son propre fichier détaillé dans ce dossier (`mission_NN_<nom>.md`) — ce ROADMAP reste un sommaire, pas une duplication du contenu.

Convention : toute nouvelle mission est rédigée ici (entrée + fichier détaillé), jamais laissée en fichier isolé hors de ce registre.

---

## Mission 00 — Base documentaire structurée : ontologie du DOM ExtendScript/InDesign

**Statut** : 🔴 À FAIRE

**Fichier détaillé** : [mission_00_ontologie_dom_indesign.md](mission_00_ontologie_dom_indesign.md)

**Résumé** : chantier fondationnel et rétroactif — numéroté 00 car il aurait dû précéder toutes les autres missions plutôt que d'être découvert après coup. Constituer une base documentaire structurée (ontologie) du DOM ExtendScript/InDesign (objets, propriétés, méthodes, pièges connus, citations exactes de doc officielle) à partir d'une recherche web ciblée, pour que tout Ouvrier futur (quel que soit le modèle) dispose d'un contrat de référence fiable au lieu de redécouvrir les mêmes pièges à chaque mission. Capitalise sur les 22+ bugs déjà rencontrés (mission_01) et la méthode de travail déjà validée (vérification doc officielle avant hypothèse).

**Question prioritaire — répondue le 26/09** : Q1 (curseur chargé/loaded cursor déclenchable par script) confirmée **OUI**, citation officielle `Document.place()`/`Document.placeGuns`/`PlaceGun.loadPlaceGun()` (indesignjs.de/Document.html). Q2 (Markdown ajoutable aux formats du Placer natif par scripting seul) confirmée **NON**, réservé au SDK C++. Détail complet : [m00_question_prioritaire_reponse.md](m00_question_prioritaire_reponse.md). Recherche large sur l'ontologie complète **toujours non lancée** — en attente derrière la feuille de route pivot de la mission 03 (voir ci-dessous).

---

## Mission 01 — Plugin InDesign : import Markdown mappé sur la charte de styles réelle du document

**Statut** : 🟡 EN COURS — base fonctionnelle stable (texte, styles, tableaux, blocs de code), tests réels en cours sur fichiers multi-modèles

**Fichier détaillé** : [mission_01_plugin_indesign_import_md.md](mission_01_plugin_indesign_import_md.md)

**Résumé** : construction du script `import_md.jsx` — importe un fichier Markdown dans InDesign en mappant chaque élément (titres, paragraphes, listes, gras/italique, tableaux, blocs de code) sur les styles réels du document ouvert, sans jamais coder de nom de style en dur. 22 bugs ExtendScript/InDesign rencontrés et corrigés au fil de la session du 23-25/09/2026 (voir wiki pour le détail technique de chacun). Dialogue de mapping avec présélection automatique par convention HTML, bouton Réinitialiser, journal d'erreurs (`import_md_errors.log`).

---

## Mission 02 — Gestion de l'indentation des listes Markdown (imbrication multi-niveaux)

**Statut** : ✅ TERMINÉE (corrigée) — voir mise en garde ci-dessous avant de faire confiance à un statut Ouvrier sans vérification

**Fichier détaillé** : [mission_02_indentation_listes.md](mission_02_indentation_listes.md)

**Résumé** : règle de cascade pour représenter l'imbrication de listes Markdown dans InDesign — styles de liste multi-niveaux du document si disponibles, sinon cascade de titres plafonnée puis retour à `li`, sinon `p`. Révélée par la fixture `gemini_charte.md` (liste à 2 niveaux avec sous-titre en gras imbriqué).

⚠️ **Qwen avait marqué cette mission ✅ TERMINÉE avec une fonction (`getLiStyleForIndentLevel`) appelée mais jamais définie** — aurait fait planter le script sur tout import contenant une liste. Non synchronisé vers le Scripts Panel par Qwen, donc pas encore testé en réel. Détecté par FJD, corrigé et validé par simulation par Claude. Voir le fichier détaillé pour la leçon méthodologique complète.

---

## Mission 03 — Reconstruction minimale de `insertMarkdownWithStyles` après régression non identifiée

**Statut** : ✅ TERMINÉE (28/09/2026) — **étapes 0bis, 1, 1bis, 1ter, 2, 3, 4, 5, 6, 7, 8 ET 9 TOUTES validées en réel** (`647f691`, `f3f6c68`, `14f30fa`, `eb0f063`, `efaa80a`, `6ed8488`, `3a20613`, `3986cbb`, `1e35618`, `a87f684`, `7e090cc`, `3914fe6`). **Non-régression complète (étape 8) validée sur les DEUX points d'entrée** (curseur + cadre), sur les 12 fixtures concaténées en un document unique (`fixtures/mission_03_nonregression_all.md` + oracle) : `blocs 289 / texte 283 / fullText 17863 / crCount 293 / paragraphes 294`, `REPLI=0 DIVERGENCE=0 ECART=0 Object is invalid=0 neutralise=0 erreurs=0`, étape 6 `tables=6 cellules=52 offset_verifie=true`, étape 7 `code_blocs=5 literaux_intacts=true`. **Cause racine émoji traitée** (suppression franche en amont, point de strip unique). **Étape 9 (intégration au menu `Fichier > Importer un MD`) validée en réel par FJD après un vrai redémarrage d'InDesign** (28/09/2026) : entrée créée (index 11, juste après `Importer...`=index 10), clic = `main()` en entier sans duplication, entrée non détruite (idempotente) ; architecture module partagé `import_md_menu.jsx` (`$.evalFile`) + chargeur de démarrage `import_md_loader.jsx` (l'entrée **n'est pas** persistante — recréée à chaque lancement). Documenté au wiki **Cas 36**. Le critère de sortie est satisfait — **reste le protocole de clôture** avant archivage. Détail complet dans le fichier de mission.

**Fichier détaillé** : [mission_03_reconstruction_minimale.md](mission_03_reconstruction_minimale.md)

**Résumé** : après 3 jours de correctifs empilés, régression réelle constatée par FJD (un fichier DeepSeek qui marchait au tout début ne marche plus, cause non identifiée malgré plusieurs cycles diagnostic/correctif). Décision actée avec FJD : arrêter de driller l'architecture actuelle, repartir d'un cas minimal (texte brut sans styles/segments/tables/listes) et réintroduire les couches une à une, avec test réel InDesign + commit git à chaque étape validée. Git initialisé en urgence le 25/09 (commit `647f691`). 26/09 : étape 1 (`MINIMAL_MODE` + `insertMarkdownWithStyles_v2()`) codée par **GLM** (attribution corrigée le 26/09 — initialement créditée à tort à DeepSeek), simulée Node sur 3 fixtures, synchronisée, validée en réel par FJD et commitée. Incident GLM antérieur (recopie hallucinée d'un ancien message, aucune action réelle) puis réussite sur cette même étape une fois relancé correctement — cf. mémoire sur la fragilité de lecture de GLM sur fichiers longs. FJD a signalé après coup deux modes d'invocation jamais testés (curseur de texte, outil flèche) — insérée en étape 1bis. **26/09** : étape 1bis (points d'entrée) codée (`resolveTargetStory`), simulée, synchronisée, **validée en réel par FJD dans les deux modes d'invocation** et commitée (`14f30fa`). Une étape **1ter** a été spécifiée sur demande de FJD (check + nettoyage actif des styles courants — caractère, paragraphe, objet, table/cellule — au trigger, AVANT tout mapping, avec journalisation nominative) ; code à faire après la 1bis.

**Pivot acté le 26/09** — feuille de route en 5 étapes suite à la réponse Q1 positive (mission 00) : (1) test de faisabilité du place gun natif [à faire APRÈS l'étape 1ter — s'ajoute aux modes déjà couverts par l'étape 1bis, ne les remplace pas], (2) héritage du shift-clic/calibrage de pages, (3) reprise de la construction du script d'origine (étapes 1bis à 8), (4) intégration menu InDesign (`app.menuActions`, scripting pur), (5) exploration SDK C++ — **optionnelle, non prioritaire**, soumise à un critère go/no-go strict : ne démarre que si des précédents documentés/éprouvés existent pour la brique générique (import provider), sinon bifurcation vers un renforcement des étapes 1-4 comme plafond assumé. Piste Rust explicitement écartée (aucun gain, toolchain C++ obligatoire de toute façon). Détail complet dans le fichier de mission.

**Prochaine action immédiate** : **protocole de clôture de l'étape 9** (FJD : « puis-je marquer cette mission comme TERMINÉE ? ») puis archivage du premier exercice. L'entrée `Fichier > Importer un MD` est **validée en réel** (28/09/2026, vrai redémarrage) : clic = `main()` sans duplication, entrée idempotente, non-régression du Panneau Scripts OK. Livrables : `import_md.jsx` (modifié), `import_md_menu.jsx` (module partagé, nouveau), `import_md_loader.jsx` (chargeur de démarrage, nouveau), wiki Cas 36. Les étapes 4 à 9 sont closes.

**Ordre de travail acté le 26/09 (FJD)** : après la 1bis validée → **étape 1ter d'abord** (nettoyage des styles au trigger) → puis le test isolé du place gun. Le place gun ne passe pas avant la 1ter. — *Séquence **exécutée intégralement** le 26/09 : 1ter validée en réel par FJD, puis place gun confirmé (18:18).*

**26/09 (nuit)** : **pivot étape 1 close**. La sonde jetable `probe_place_gun.jsx` (hors dépôt, log dédié) a montré en réel que le place gun natif **est chargeable par script** : `loadPlaceGun(<.md>)` → `loaded=true` / `isValid=true`, curseur chargé, clic = nouveau bloc de texte. Deux enseignements du réel : (1) `placeGuns` est un `PlaceGun`, **pas** une collection (`[0]` = `undefined`) ; (2) le chargement **ne dépend pas du format** — la branche `.txt` de discrimination n'a pas été nécessaire, seul le mapping de styles natif dépendra du format. L'étape **1ter** est par ailleurs **validée en réel par FJD**. Reste : point 2 du pivot (shift-clic / calibrage de pages), puis reprise des étapes 2 à 8.

**26/09 (soir)** : **étape 0bis close** — le compteur de log est fiabilisé (cause racine : la poignée `story` capturée avant `contents = ""` se détache et renvoie des valeurs périmées ; la mesure se fait désormais sur `targetPoint.parentStory`, avec arbitre JS pur `crCount`). Validé en réel et recoupé par deux méthodes indépendantes. L'étape **1ter** est codée, pré-checkée (sim 13/13) et synchronisée ; le rejeu réel du 17:32 la montre **s'exécuter correctement** (`[paragraphe] remis a neutre -> 'H2' vers '[Aucun style]'`, `[objet] remis a neutre '[Sans]' + clearObjectStyleOverrides()`) — la validation formelle sur une sélection volontairement « sale » et l'arbitrage `clearOverrides(OverrideType)` vs réaffectation neutre : **FJD a acté la validation de la 1ter le 26/09**, seul l'arbitrage `clearOverrides`/réaffectation reste ouvert (non bloquant). Le verrou « place gun après la 1ter » est levé et le pivot **étape 1 est close** (place gun confirmé le 26/09 à 18:18).

**26/09 (nuit) — étape pivot 1bis close + 1quater (spécifiée)** : **limite du mode gun actée par FJD** (commit `3847d6e`, doc `c0f8402`) — le texte déposé par le gun arrive **entièrement sous le style actif du panneau Style de paragraphe** (H2 uniforme sur **8 tirs sur 8**, alors que `textDefaults` valait `[Aucun style]` ⇒ le style ne vient pas des défauts d'import mais d'un **état d'interface sans accesseur API**). L'import natif n'étant pas scriptable (Q2 = SDK C++ uniquement), aucun levier de correction ⇒ **avertir, pas corriger**. Livrable : alerte `confirm()` dans la branche `mode === "gun"`, style lu **avant** neutralisation, annulable, tracée au log. **Décision FJD (26/09) : gun CONSERVÉ avec l'alerte (choix A)** — pas de mode `cadre` auto-créateur ; le « reste ouvert » du doc est donc **clos**.

**Périmètre du mapping (décision FJD 26/09)** : l'import natif du gun **n'est pas** un substitut à notre mapping — le projet veut **son mapping maison complet**, tables **(étape 6)** et code **(étape 7)** inclus. Ces étapes restent **dans le périmètre plein**.

**Nouveau** : les fixtures du chemin minimal **`fixtures/mission_03_minimal/test_min_01_texte.md` → `test_min_07_code.md`** existent désormais **avec leur oracle** `*.expected.json`, **généré en exécutant le vrai `parseMarkdown()`** hors InDesign (jamais écrit à la main). ~~Découverte en les générant : **`h4`/`h5` ne proviennent pas des balises `####`/`#####`** — le parseur ne reconnaît que `#`/`##`/`###` ; `h4`/`h5` sont **synthétiques** (puce entièrement en gras au niveau 0 sous un titre → niveau `currentTitleLevel + 1`), comme l'annonce leur propre libellé *« sous-titre de liste en gras »*. Une ligne `#### …` tombe donc en **paragraphe littéral**. Les fixtures 02/03 portent une **sonde explicite** de cette limite.~~ **MISE À JOUR (décision FJD 26/09/2026, étape 3)** : la description ci-dessus est **périmée**. La décision FJD est que **`####` et au-delà sont de vrais titres** (H4, H5, H6, H7…). Le parseur reconnaît désormais `^#{1,}` **sans plafond** ; le dialogue propose `h1`→`h9` (`h6`→`h9` en `optional: true`) ; au-delà de `h9` → style neutre + journalisation, sans échec. La **fixture 03 a été réécrite** (vrai h4 + h5 + **sondes H6/H7**), son **oracle régénéré** (21 blocs) et l'oracle `chatgpt_convention` **patché** (bloc #17 `p` → `h4`). La **spécification détaillée des étapes 2 à 8** (blocs par étape, styles, critères de réussite réels, oracle, commits) est **rédigée** dans le fichier de mission, ainsi que la **spécification du point 2 du pivot** (shift-clic / calibrage de pages, sonde en deux temps préparer/relever, le geste utilisateur étant humain et postérieur au script).

**RÉVISION DU 27/09/2026 — OPTION 1 (décision FJD) : la règle « puce entièrement en gras ⇒ titre synthétique » est SUPPRIMÉE.** Constat en réel (import d'un document de formation) : **18 puces légitimes** étaient détournées en faux titres H3. Décision FJD (« option 1 ») : **une puce reste une puce** ; le gras d'une puce sera traité comme du gras *inline* à l'étape 4. Le drapeau `synthetic`, la variable `currentTitleLevel` et le volet `synth` du log ont été **retirés du code** : il n'existe plus qu'**une seule provenance de titre**, le vrai `#`/`##`/`###`…. **Oracles impactés régénérés** (`deepseek_formation` : 18 blocs `h3`/`h4` → `li` ; `gemini_charte` : 1 `h4` → `li` ; `test_min_05_listes` : 1 `h2` → `li`), avec **préservation du saut de ligne final et de l'ordre des clés** pour un diff minimal.

**Avancement étape 2 (26/09)** : **étape 2 (mapping des styles de paragraphe) codée, validée en réel par FJD et commitée** (`efaa80a`, « M03 etape 2 : mapping styles OK »). Le style est appliqué par **relecture** (jamais le nom demandé en aveugle), avec repli sur le style **neutre** = `document.paragraphStyles.item(0)` et journalisation `M03-etape2: pas de style pour <tag>, neutre applique` si la clé manque.

**Avancement étape 3 (27/09)** : code écrit (détection unifiée `/^(#{1,})\s+(.*)$/`, whitelist `/^h\d+$/`, clés `h6`→`h9` optionnelles, compteurs `titres reels`/`maxMappe`/`derives`) — **le drapeau `synthetic` et le volet `synth` du log ont été retirés par l'option 1**. Fixtures/oracles mis à jour, **non-régression hors-ligne 12/12 verte** (`node --check` OK ; FFFD=0 ; libellés de log M03 100 % ASCII ; Panel synchronisée `c8670bba…`). **Test réel FJD à effectuer avant le commit `M03 étape 3 : titres OK`.**

---

## Mission 03bis — Rétro-documentation : URLs manquantes dans le wiki

**Statut** : 🔴 À FAIRE — mission intermédiaire, à la suite du chapitre 1 (mission 03), sans dépendance avec la mission 04 (chapitre 2, reste bloquée indépendamment)

**Fichier détaillé** : [mission_03bis_retrodoc_wiki_urls.md](mission_03bis_retrodoc_wiki_urls.md)

**Résumé** : la méthode générale du wiki (réflexe n°1) impose depuis le 23/09 que toute vérification documentaire donnant lieu à un cas inclue citation exacte + URL source. Constat FJD du 28/09 : sur 34 cas, seuls 2 (Cas 31, 34) respectent la règle. Mission en 2 temps : trier les cas entre "API confirmée par doc externe" (URL due) et "découverte par test réel/log" (URL non pertinente), puis compléter uniquement la première catégorie — sans reconstruire de fausses citations a posteriori.

---

## Mission 04 — Audit : lien dynamique vers le Markdown source (UXP vs update() natif vs solution maison)

**Statut** : 🔴 BLOQUÉE — la clôture de la mission 03 (étapes 4 à 8 + intégration menu natif « Fichier > Importer un MD ») est **acquise** (28/09/2026), mais la mission intermédiaire **03bis** doit passer avant. Ne pas démarrer avant la clôture de 03bis. Ouvre le second chapitre du projet, « Panneau Import MD ».

**Fichier détaillé** : [mission_04_audit_lien_dynamique.md](mission_04_audit_lien_dynamique.md)

**Résumé** : FJD veut qu'InDesign détecte (via son panneau Liens natif si possible) quand le `.md` source a changé, et qu'un clic relance notre pipeline complet (reparsing + mapping), pas juste un import brut. Exploration préalable avec l'Architecte (Claude) : `place()` existe sur `Document`/`InsertionPoint`/`Text` ; `Story.itemLink` et `Link.update()`/`.status` sont scriptables, mais `Link.update()` semble être une boîte noire non pilotable (relance vraisemblablement un import natif brut, écrasant tout mapping fait après coup) — **non confirmé par test réel**. Notre méthode d'insertion actuelle (assignation `.contents`, jamais `place()`) ne crée structurellement aucun `Link`. Piste alternative repérée mais non auditée : **UXP** (framework JS moderne d'Adobe pour panneaux InDesign, pas C++) — pourrait éviter le mur du SDK propriétaire, mais compatibilité avec notre code existant non vérifiée.

---

## Références du projet

- **Wiki technique** : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — base de connaissance des pièges ExtendScript/InDesign (26 cas documentés au 27/09 : Cas 24 « le compteur de diagnostic ment » + addendum sur le faux positif d'alerte, **Cas 25** « une valeur par défaut qui rend service applique un style sans geste de l'utilisateur » — cause racine du style neutralisé du 27/09, **Cas 26** « `Paragraph.index` n'est pas un index de paragraphe »), méthode de travail validée (simulation Node avant test réel, contrôle négatif obligatoire, vérification doc officielle avant hypothèse, arbitre indépendant devant reproduire la *même* transformation que le code, carte en plages pour révéler une distribution de styles)
- **Fixtures de test** : [../fixtures/](../fixtures/) — fichiers `.md` classés par modèle générateur (Claude, DeepSeek ×2, Gemini, ChatGPT) + JSON attendus
- **Script principal** : [../import_md.jsx](../import_md.jsx) — copié systématiquement vers `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx` après chaque modification (InDesign exécute cette seconde copie, jamais le fichier de travail directement)
- **Rôles** : Architecte (Claude) rédige les missions et valide, Ouvrier (DS) exécute — cf. mémoire `project_agent_roles.md`

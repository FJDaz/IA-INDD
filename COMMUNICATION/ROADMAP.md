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

**Statut** : 🟢 DÉBLOQUÉE — socle « pivot gun » **entièrement clos** : étapes 0bis, 1ter **validées en réel**, place gun **confirmé** (18:18) puis sa **limite actée** (pivot 1bis, `3847d6e`) avec **alerte** en place ; **décision FJD : gun conservé (choix A)**. **Point 2 du pivot (shift-clic/calibrage) TRANCHÉ** sur comportement natif documenté d'InDesign (la sonde deux-temps s'étant révélée structurellement inapte, gun ne survivant pas à la fin du script — documentée comme leçon de méthode, pas maquillée). **Spec détaillée des étapes 2 à 8 rédigée** + **7 fixtures minimales et leurs oracles** créés (générés par le vrai parseur). **Prochaine action : reprise des étapes 2 à 8** (code, pas encore écrit). Détail complet dans le fichier de mission.

**Fichier détaillé** : [mission_03_reconstruction_minimale.md](mission_03_reconstruction_minimale.md)

**Résumé** : après 3 jours de correctifs empilés, régression réelle constatée par FJD (un fichier DeepSeek qui marchait au tout début ne marche plus, cause non identifiée malgré plusieurs cycles diagnostic/correctif). Décision actée avec FJD : arrêter de driller l'architecture actuelle, repartir d'un cas minimal (texte brut sans styles/segments/tables/listes) et réintroduire les couches une à une, avec test réel InDesign + commit git à chaque étape validée. Git initialisé en urgence le 25/09 (commit `647f691`). 26/09 : étape 1 (`MINIMAL_MODE` + `insertMarkdownWithStyles_v2()`) codée par **GLM** (attribution corrigée le 26/09 — initialement créditée à tort à DeepSeek), simulée Node sur 3 fixtures, synchronisée, validée en réel par FJD et commitée. Incident GLM antérieur (recopie hallucinée d'un ancien message, aucune action réelle) puis réussite sur cette même étape une fois relancé correctement — cf. mémoire sur la fragilité de lecture de GLM sur fichiers longs. FJD a signalé après coup deux modes d'invocation jamais testés (curseur de texte, outil flèche) — insérée en étape 1bis. **26/09** : étape 1bis (points d'entrée) codée (`resolveTargetStory`), simulée, synchronisée, **validée en réel par FJD dans les deux modes d'invocation** et commitée (`14f30fa`). Une étape **1ter** a été spécifiée sur demande de FJD (check + nettoyage actif des styles courants — caractère, paragraphe, objet, table/cellule — au trigger, AVANT tout mapping, avec journalisation nominative) ; code à faire après la 1bis.

**Pivot acté le 26/09** — feuille de route en 5 étapes suite à la réponse Q1 positive (mission 00) : (1) test de faisabilité du place gun natif [à faire APRÈS l'étape 1ter — s'ajoute aux modes déjà couverts par l'étape 1bis, ne les remplace pas], (2) héritage du shift-clic/calibrage de pages, (3) reprise de la construction du script d'origine (étapes 1bis à 8), (4) intégration menu InDesign (`app.menuActions`, scripting pur), (5) exploration SDK C++ — **optionnelle, non prioritaire**, soumise à un critère go/no-go strict : ne démarre que si des précédents documentés/éprouvés existent pour la brique générique (import provider), sinon bifurcation vers un renforcement des étapes 1-4 comme plafond assumé. Piste Rust explicitement écartée (aucun gain, toolchain C++ obligatoire de toute façon). Détail complet dans le fichier de mission.

**Prochaine action immédiate** : **reprendre les étapes 2 à 8** (mapping des styles de paragraphe en premier, fixture `test_min_02_styles.md`, oracle 11 blocs) — le point 2 du pivot est **tranché**, plus rien ne bloque. Historique de la sonde : la tentative de mesure en deux temps (script charge le gun → geste humain différé → second relevé) s'est révélée **structurellement inapte** — le gun ne survit pas à la fin du script (`loaded` retombe à `false`), donc le geste ne pouvait rien charger ; les chiffres mesurés (pages, caractères) n'étaient pas attribuables au gun et ont été retirés du raisonnement. Le point a été tranché à la place sur le **comportement natif documenté d'InDesign** (citations Adobe FR exactes : « Liaison de blocs de texte », Smart Text Reflow) : le curseur de texte chargé permet nativement de créer des pages, le shift-clic étant l'autoflow standard — réserve signalée : le terme « shift-clic » lui-même n'est nommé sur aucune page Adobe accessible, cette précision relève de la connaissance établie du logiciel. Rappel du verrou levé : ✅ le test du place gun a été exécuté en réel le 26/09 à 18:18 (`probe_place_gun.log`) : `loadPlaceGun(fichier)` → `loaded=true` / `isValid=true`. Mesure notable : `document.placeGuns[0]` renvoie `undefined` — `placeGuns` est un **`PlaceGun` et non une collection**, il faut l'utiliser **directement** (`document.placeGuns.loadPlaceGun(fichier)`).

**Ordre de travail acté le 26/09 (FJD)** : après la 1bis validée → **étape 1ter d'abord** (nettoyage des styles au trigger) → puis le test isolé du place gun. Le place gun ne passe pas avant la 1ter. — *Séquence **exécutée intégralement** le 26/09 : 1ter validée en réel par FJD, puis place gun confirmé (18:18).*

**26/09 (nuit)** : **pivot étape 1 close**. La sonde jetable `probe_place_gun.jsx` (hors dépôt, log dédié) a montré en réel que le place gun natif **est chargeable par script** : `loadPlaceGun(<.md>)` → `loaded=true` / `isValid=true`, curseur chargé, clic = nouveau bloc de texte. Deux enseignements du réel : (1) `placeGuns` est un `PlaceGun`, **pas** une collection (`[0]` = `undefined`) ; (2) le chargement **ne dépend pas du format** — la branche `.txt` de discrimination n'a pas été nécessaire, seul le mapping de styles natif dépendra du format. L'étape **1ter** est par ailleurs **validée en réel par FJD**. Reste : point 2 du pivot (shift-clic / calibrage de pages), puis reprise des étapes 2 à 8.

**26/09 (soir)** : **étape 0bis close** — le compteur de log est fiabilisé (cause racine : la poignée `story` capturée avant `contents = ""` se détache et renvoie des valeurs périmées ; la mesure se fait désormais sur `targetPoint.parentStory`, avec arbitre JS pur `crCount`). Validé en réel et recoupé par deux méthodes indépendantes. L'étape **1ter** est codée, pré-checkée (sim 13/13) et synchronisée ; le rejeu réel du 17:32 la montre **s'exécuter correctement** (`[paragraphe] remis a neutre -> 'H2' vers '[Aucun style]'`, `[objet] remis a neutre '[Sans]' + clearObjectStyleOverrides()`) — la validation formelle sur une sélection volontairement « sale » et l'arbitrage `clearOverrides(OverrideType)` vs réaffectation neutre : **FJD a acté la validation de la 1ter le 26/09**, seul l'arbitrage `clearOverrides`/réaffectation reste ouvert (non bloquant). Le verrou « place gun après la 1ter » est levé et le pivot **étape 1 est close** (place gun confirmé le 26/09 à 18:18).

**26/09 (nuit) — étape pivot 1bis close + 1quater (spécifiée)** : **limite du mode gun actée par FJD** (commit `3847d6e`, doc `c0f8402`) — le texte déposé par le gun arrive **entièrement sous le style actif du panneau Style de paragraphe** (H2 uniforme sur **8 tirs sur 8**, alors que `textDefaults` valait `[Aucun style]` ⇒ le style ne vient pas des défauts d'import mais d'un **état d'interface sans accesseur API**). L'import natif n'étant pas scriptable (Q2 = SDK C++ uniquement), aucun levier de correction ⇒ **avertir, pas corriger**. Livrable : alerte `confirm()` dans la branche `mode === "gun"`, style lu **avant** neutralisation, annulable, tracée au log. **Décision FJD (26/09) : gun CONSERVÉ avec l'alerte (choix A)** — pas de mode `cadre` auto-créateur ; le « reste ouvert » du doc est donc **clos**.

**Périmètre du mapping (décision FJD 26/09)** : l'import natif du gun **n'est pas** un substitut à notre mapping — le projet veut **son mapping maison complet**, tables **(étape 6)** et code **(étape 7)** inclus. Ces étapes restent **dans le périmètre plein**.

**Nouveau** : les fixtures du chemin minimal **`fixtures/mission_03_minimal/test_min_01_texte.md` → `test_min_07_code.md`** existent désormais **avec leur oracle** `*.expected.json`, **généré en exécutant le vrai `parseMarkdown()`** hors InDesign (jamais écrit à la main). Découverte en les générant : **`h4`/`h5` ne proviennent pas des balises `####`/`#####`** — le parseur ne reconnaît que `#`/`##`/`###` ; `h4`/`h5` sont **synthétiques** (puce entièrement en gras au niveau 0 sous un titre → niveau `currentTitleLevel + 1`), comme l'annonce leur propre libellé *« sous-titre de liste en gras »*. Une ligne `#### …` tombe donc en **paragraphe littéral**. Les fixtures 02/03 portent une **sonde explicite** de cette limite. La **spécification détaillée des étapes 2 à 8** (blocs par étape, styles, critères de réussite réels, oracle, commits) est **rédigée** dans le fichier de mission, ainsi que la **spécification du point 2 du pivot** (shift-clic / calibrage de pages, sonde en deux temps préparer/relever, le geste utilisateur étant humain et postérieur au script).

---

## Références du projet

- **Wiki technique** : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — base de connaissance des pièges ExtendScript/InDesign (24 cas documentés au 26/09, dont le Cas 24 « le compteur de diagnostic ment » et son addendum sur le faux positif d'alerte), méthode de travail validée (simulation Node avant test réel, contrôle négatif obligatoire, vérification doc officielle avant hypothèse, arbitre indépendant devant reproduire la *même* transformation que le code)
- **Fixtures de test** : [../fixtures/](../fixtures/) — fichiers `.md` classés par modèle générateur (Claude, DeepSeek ×2, Gemini, ChatGPT) + JSON attendus
- **Script principal** : [../import_md.jsx](../import_md.jsx) — copié systématiquement vers `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx` après chaque modification (InDesign exécute cette seconde copie, jamais le fichier de travail directement)
- **Rôles** : Architecte (Claude) rédige les missions et valide, Ouvrier (DS) exécute — cf. mémoire `project_agent_roles.md`

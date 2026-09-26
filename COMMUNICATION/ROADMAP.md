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

**Statut** : 🟡 EN COURS — étape 1 et 1bis validées en réel par FJD (confirmation visuelle : 3 paragraphes propres dans tous les modes, y compris TextFrame). Le `paragraphs.length=1` rapporté par le log en mode TextFrame le 26/09 après-midi était un **faux positif du compteur de diagnostic**, pas une régression fonctionnelle — corrigé après clarification de FJD. Étape 1ter (styles) codée, à valider. Feuille de route pivot (place gun) actée, en attente.

**Fichier détaillé** : [mission_03_reconstruction_minimale.md](mission_03_reconstruction_minimale.md)

**Résumé** : après 3 jours de correctifs empilés, régression réelle constatée par FJD (un fichier DeepSeek qui marchait au tout début ne marche plus, cause non identifiée malgré plusieurs cycles diagnostic/correctif). Décision actée avec FJD : arrêter de driller l'architecture actuelle, repartir d'un cas minimal (texte brut sans styles/segments/tables/listes) et réintroduire les couches une à une, avec test réel InDesign + commit git à chaque étape validée. Git initialisé en urgence le 25/09 (commit `647f691`). 26/09 : étape 1 (`MINIMAL_MODE` + `insertMarkdownWithStyles_v2()`) codée par **GLM** (attribution corrigée le 26/09 — initialement créditée à tort à DeepSeek), simulée Node sur 3 fixtures, synchronisée, validée en réel par FJD et commitée. Incident GLM antérieur (recopie hallucinée d'un ancien message, aucune action réelle) puis réussite sur cette même étape une fois relancé correctement — cf. mémoire sur la fragilité de lecture de GLM sur fichiers longs. FJD a signalé après coup deux modes d'invocation jamais testés (curseur de texte, outil flèche) — insérée en étape 1bis. **26/09** : étape 1bis (points d'entrée) codée (`resolveTargetStory`), simulée, synchronisée, **validée en réel par FJD dans les deux modes d'invocation** et commitée (`14f30fa`). Une étape **1ter** a été spécifiée sur demande de FJD (check + nettoyage actif des styles courants — caractère, paragraphe, objet, table/cellule — au trigger, AVANT tout mapping, avec journalisation nominative) ; code à faire après la 1bis.

**Pivot acté le 26/09** — feuille de route en 5 étapes suite à la réponse Q1 positive (mission 00) : (1) test de faisabilité du place gun natif [à faire APRÈS l'étape 1ter — s'ajoute aux modes déjà couverts par l'étape 1bis, ne les remplace pas], (2) héritage du shift-clic/calibrage de pages, (3) reprise de la construction du script d'origine (étapes 1bis à 8), (4) intégration menu InDesign (`app.menuActions`, scripting pur), (5) exploration SDK C++ — **optionnelle, non prioritaire**, soumise à un critère go/no-go strict : ne démarre que si des précédents documentés/éprouvés existent pour la brique générique (import provider), sinon bifurcation vers un renforcement des étapes 1-4 comme plafond assumé. Piste Rust explicitement écartée (aucun gain, toolchain C++ obligatoire de toute façon). Détail complet dans le fichier de mission.

**Ordre de travail acté le 26/09 (FJD)** : après la 1bis validée → **étape 1ter d'abord** (nettoyage des styles au trigger) → puis le test isolé du place gun. Le place gun ne passe pas avant la 1ter.

---

## Références du projet

- **Wiki technique** : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — base de connaissance des pièges ExtendScript/InDesign (23 cas documentés au 26/09), méthode de travail validée (simulation Node avant test réel, vérification doc officielle avant hypothèse)
- **Fixtures de test** : [../fixtures/](../fixtures/) — fichiers `.md` classés par modèle générateur (Claude, DeepSeek ×2, Gemini, ChatGPT) + JSON attendus
- **Script principal** : [../import_md.jsx](../import_md.jsx) — copié systématiquement vers `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx` après chaque modification (InDesign exécute cette seconde copie, jamais le fichier de travail directement)
- **Rôles** : Architecte (Claude) rédige les missions et valide, Ouvrier (DS) exécute — cf. mémoire `project_agent_roles.md`

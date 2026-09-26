# ROADMAP — Projet IMPORT_MD (plugin InDesign)

Registre actif des missions du projet. Chaque mission a son propre fichier détaillé dans ce dossier (`mission_NN_<nom>.md`) — ce ROADMAP reste un sommaire, pas une duplication du contenu.

Convention : toute nouvelle mission est rédigée ici (entrée + fichier détaillé), jamais laissée en fichier isolé hors de ce registre.

---

## Mission 00 — Base documentaire structurée : ontologie du DOM ExtendScript/InDesign

**Statut** : 🔴 À FAIRE

**Fichier détaillé** : [mission_00_ontologie_dom_indesign.md](mission_00_ontologie_dom_indesign.md)

**Résumé** : chantier fondationnel et rétroactif — numéroté 00 car il aurait dû précéder toutes les autres missions plutôt que d'être découvert après coup. Constituer une base documentaire structurée (ontologie) du DOM ExtendScript/InDesign (objets, propriétés, méthodes, pièges connus, citations exactes de doc officielle) à partir d'une recherche web ciblée, pour que tout Ouvrier futur (quel que soit le modèle) dispose d'un contrat de référence fiable au lieu de redécouvrir les mêmes pièges à chaque mission. Capitalise sur les 22+ bugs déjà rencontrés (mission_01) et la méthode de travail déjà validée (vérification doc officielle avant hypothèse).

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

**Statut** : 🟡 EN COURS — étape 1 (texte brut) validée en réel et commitée (`f3f6c68`) ; étape 1bis (points d'entrée du script) à faire avant l'étape 2

**Fichier détaillé** : [mission_03_reconstruction_minimale.md](mission_03_reconstruction_minimale.md)

**Résumé** : après 3 jours de correctifs empilés, régression réelle constatée par FJD (un fichier DeepSeek qui marchait au tout début ne marche plus, cause non identifiée malgré plusieurs cycles diagnostic/correctif). Décision actée avec FJD : arrêter de driller l'architecture actuelle, repartir d'un cas minimal (texte brut sans styles/segments/tables/listes) et réintroduire les couches une à une, avec test réel InDesign + commit git à chaque étape validée. Git initialisé en urgence le 25/09 (commit `647f691`). 26/09 : étape 1 (`MINIMAL_MODE` + `insertMarkdownWithStyles_v2()`) codée par **GLM** (attribution corrigée le 26/09 — initialement créditée à tort à DeepSeek), simulée Node sur 3 fixtures, synchronisée, validée en réel par FJD et commitée. Incident GLM antérieur (recopie hallucinée d'un ancien message, aucune action réelle) puis réussite sur cette même étape une fois relancé correctement — cf. mémoire sur la fragilité de lecture de GLM sur fichiers longs. FJD a signalé après coup deux modes d'invocation jamais testés (curseur de texte, outil flèche) — insérée en étape 1bis avant de poursuivre sur les couches de style, pour ne pas devoir rejouer les étapes 2-8 si le point d'insertion s'avère fragile.

---

## Références du projet

- **Wiki technique** : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — base de connaissance des pièges ExtendScript/InDesign (22 cas documentés au 25/09), méthode de travail validée (simulation Node avant test réel, vérification doc officielle avant hypothèse)
- **Fixtures de test** : [../fixtures/](../fixtures/) — fichiers `.md` classés par modèle générateur (Claude, DeepSeek ×2, Gemini, ChatGPT) + JSON attendus
- **Script principal** : [../import_md.jsx](../import_md.jsx) — copié systématiquement vers `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx` après chaque modification (InDesign exécute cette seconde copie, jamais le fichier de travail directement)
- **Rôles** : Architecte (Claude) rédige les missions et valide, Ouvrier (DS) exécute — cf. mémoire `project_agent_roles.md`

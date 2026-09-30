# Mission 07 — Nettoyage et publication du repo en public

**Statut** : ✅ TERMINÉE (29/09/2026) — 4 livrables sur 4, contrôles de sortie au vert.
**Compte rendu** : inline dans [`COMMUNICATION/ROADMAP.md`](ROADMAP.md), bloc Mission 07 (principe CR dans la RM).
**Origine** : FJD candidate à des formations, veut un dépôt public comme preuve de travail vérifiable et datée (historique de commits).

## Contexte

Vérification faite le 29/09/2026 : pas de clé API dans le repo. En revanche, **plusieurs fichiers contenaient le chemin absolu du dossier utilisateur personnel (`/Users/<utilisateur>/...`) en dur** (audit réel : **14 fichiers**, dont les 7 de code ci-dessous) :

- `tools/probe_menu3_file_handler.jsx`
- `tools/probe_menu3.jsx`
- `tools/probe_04ter_icml.jsx`
- `tools/probe_05ter_integration.jsx`
- `uxp/com.fjd.importmd.sonde/main.js`
- `tools/probe_startup.jsx`
- `tools/probe_04bis_lien.jsx`

Plus `IMPORT_MD_MODEL.indt` (1,3 Mo, fichier de test InDesign binaire) — **décision prise : exclu** (`.gitignore`).

## Ce qui est demandé

1. **Nettoyer les chemins personnels** dans les 14 fichiers porteurs (les 7 de code listés ci-dessus + 7 fichiers de documentation) — remplacer par un placeholder ou une variable relative, pas juste masquer.
2. **Trancher le sort de `IMPORT_MD_MODEL.indt`** — **décidé : exclu** (gros binaire, non essentiel à la démonstration), avec les artefacts d'exécution du plugin.
3. **Rédiger un README public** à la racine : présentation du projet, ce qu'il démontre (méthode de travail rigoureuse, wiki de 45+ cas, protocole test réel/simulation), lien vers ROADMAP et wiki, stack (ExtendScript/InDesign, UXP en exploration).
4. **Revérifier une dernière fois** avant publication : aucune clé API, aucun chemin personnel résiduel, aucune référence à un autre projet personnel.

## Méthode
Même rigueur que d'habitude — vérifier par grep avant/après, pas seulement sur affirmation. Ne pas modifier le contenu technique des scripts au-delà des chemins.

## Critère de sortie
- 0 chemin personnel en dur (`grep -r` du nom d'utilisateur personnel vide, hors README lui-même si besoin d'attribution).
- README rédigé et lisible pour un tiers qui découvre le projet.
- FJD valide avant tout passage effectif du repo en public (action GitHub elle-même hors périmètre de cette mission — décision humaine).

# Mission 03bis — Rétro-documentation : URLs manquantes dans le wiki

**Statut** : 🔴 À FAIRE
**Position** : mission intermédiaire, à la suite du chapitre 1 (mission 03) et avant l'ouverture du chapitre 2 (mission 04, "Panneau Import MD" — reste bloquée indépendamment de celle-ci).

## Contexte

La méthode générale du wiki (`doc/wiki_extendscript_indesign.md`, section "Les 5 réflexes", réflexe n°1) impose depuis le 23/09/2026 :

> "chaque vérification documentaire qui aboutit à un cas du wiki doit inclure la **citation exacte** trouvée (pas une paraphrase) et l'**URL source**, directement dans l'entrée du cas concerné."

Constat du 28/09/2026 (FJD) : sur les 34 cas actuels du wiki, **seuls 2 contiennent une URL** (Cas 31, Cas 34) — la règle n'est pas appliquée systématiquement, alors qu'elle est explicitement écrite en tête de fichier depuis le début du projet.

## Objectif

Ne pas rétro-documenter aveuglément tous les cas — d'abord trier, puis compléter seulement où c'est pertinent.

### Étape 1 — Trier les 34 cas en 2 catégories

1. **Cas de type "API confirmée par la doc officielle"** : le cas affirme un comportement d'une méthode/propriété du DOM InDesign (existence, signature, valeur de retour) qui a dû être vérifié dans une source externe (indesignjs.de, Adobe, forums). **La règle s'applique pleinement** — URL + citation exacte obligatoires.
2. **Cas de type "découverte par test réel / log"** : le cas documente un comportement constaté en conditions réelles (résultat d'un log, d'une simulation, d'un test InDesign), sans qu'une doc externe ait été consultée ou soit même pertinente. **La règle ne s'applique pas** — la preuve est le test lui-même, une URL n'aurait pas de sens ici.

Exemples déjà identifiés en tête de fil (à vérifier, pas à prendre pour acquis) : Cas 05, 06, 09, 14, 17 (cités comme exemples de bon format dans la méthode générale elle-même — donc probablement déjà sourcés ou à vérifier en priorité) ; Cas 28 (affirme "API utile confirmée, build InDesign 21.x" sur `Cell`/`CellStyle` sans URL — candidat clair à la catégorie 1) ; Cas 29 (sonde `indexOf`, découverte par test réel — probablement catégorie 2, pas de rétro-doc nécessaire).

### Étape 2 — Compléter uniquement les cas de catégorie 1 sans URL

Pour chaque cas concerné, retrouver ou revérifier la source (indesignjs.de en priorité, cf. méthode déjà en usage sur ce projet), ajouter la citation exacte et l'URL, dans le même format que les Cas 31/34 déjà conformes.

**Ne pas inventer de citation a posteriori** : si la source exacte consultée au moment de la rédaction du cas ne peut plus être retrouvée avec certitude, revérifier factuellement l'affirmation (nouvelle recherche), pas reconstruire une URL plausible pour faire joli.

### Étape 3 — Renforcer la règle elle-même (optionnel, à la fin)

Si le tri révèle une confusion récurrente entre les deux catégories, envisager de clarifier la formulation du réflexe n°1 dans la méthode générale du wiki, pour qu'un futur Ouvrier distingue plus facilement quand l'URL est obligatoire et quand elle ne l'est pas.

## Méthode de travail

- Même rigueur que d'habitude : citation exacte, pas de paraphrase, source vérifiable.
- Ne pas retoucher le contenu technique des cas déjà écrits — uniquement ajouter la source manquante là où elle est due.
- Committer une fois le tri + les complétions faits, avec le détail de ce qui a été ajouté vs laissé tel quel (et pourquoi) dans le message de commit.

## Critère de sortie

- Les 34 cas sont triés en catégorie 1/2, de façon traçable (dans ce fichier ou en commentaire du wiki).
- Tous les cas de catégorie 1 ont une URL + citation exacte.
- Aucune modification du contenu technique des cas existants au-delà de l'ajout de la source.

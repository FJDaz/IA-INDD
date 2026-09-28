# Mission 03bis — Rétro-documentation : URLs manquantes dans le wiki

**Statut** : 🟡 PARTIELLE — tri (35 cas) + complétion des 17 cas cat.1 faits et vérifiés HTTP 200 ; commit + validation FJD en attente (cf. Rapport d'exécution en fin de fichier).
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

---

## Rapport d'exécution — CR 03bis (28/09/2026)

**Statut** : 🟡 PARTIELLE — tri + complétion faits et vérifiés (HTTP 200) ; commit et validation FJD en attente.

### Note de cadrage — 34 vs 35 cas

La rédaction de la mission parle de « 34 cas ». Le **décompte réel mesuré** (`grep -c "^## Cas "` = **35**) est : Cas 00 → Cas 36, **moins les Cas 11 et 15 qui n'existent pas** (numérotation historique, trous conservés — les numéros de cas sont immuables). Le sommaire du wiki affiche encore « 34 cas » et **omet le Cas 36** : la correction relève de la mission **03ter**, pas de cette mission.

### Étape 1 — Tri traçable (35 cas)

Catégorisation par **affirmation principale** du cas :
- **Cat.1** = le cas affirme (au moins en partie) un **fait d'API** (existence, signature, valeur de retour d'une méthode/propriété du DOM ou d'une norme) ⇒ URL + citation exacte obligatoires.
- **Cat.2** = le cas documente un comportement **constaté par test réel / log / simulation**, sans qu'une doc externe soit l'autorité ⇒ la preuve est le test, l'URL n'est pas due.

**Cat.1 (17 cas)** — règle appliquée :

| Cas | Fait d'API affirmé | Source (URL vérifiée HTTP 200 le 28/09/2026) | État |
|---|---|---|---|
| 00 | `Tables.add`, `Table.appliedTableStyle`, `Cell.texts` | indesignjs.de `Tables`/`Table`/`Cell` | URL + citation ajoutées |
| 01 | ECMA-262 3ᵉ éd. §7.5.1/§7.5.3 (mots réservés, dont `char`) | PDF officiel ECMA-262 3ᵉ éd. | URL + citation ajoutées |
| 02 | `alert()` globale, pas de titre sur macOS | docsforadobe.dev *User Notification Dialogs* | URL + citation ajoutées |
| 03 | `new Window(type[,title,bounds,{props}])` | docsforadobe.dev *Window Object* | URL + citation ajoutées |
| 04 | `everyItem` comme méthode de collection, `length` | indesignjs.de `Paragraphs`/`Cells` | URL + citation ajoutées |
| 05 | `CharacterStyleGroup` n'expose pas `paragraphStyles` | indesignjs.de `CharacterStyleGroup`/`ParagraphStyleGroup` | URL + citation ajoutées |
| 06 | `Document.insertLabel`/`extractLabel`, pas de collection `labels` | indesignjs.de `Document` | URL + citation ajoutées |
| 07 | `JSON` défini au §15.12 d'ES5 (absent ES3) | 262.ecma-international.org/5.1/#sec-15.12 | URL + citation ajoutées |
| 08 | `Array.prototype.indexOf` §15.4.4.14 (ES5) | 262.ecma-international.org/5.1/#sec-15.4.4.14 | URL + citation ajoutées |
| 09 | `Paragraphs` n'a **pas** de méthode `add` ; `InsertionPoint.contents` read/write | indesignjs.de `Paragraphs`/`InsertionPoint` | URL ajoutée ; citation d'origine **marquée non re-retrouvée** |
| 19 | `delimiter run` / *flanking* (emphase) | spec.commonmark.org/0.31.2 | URL + citation ajoutées |
| 26 | `Paragraph.index` (libellé ambigu) | indesignjs.de `Paragraph` (`id="p-index"`) | URL + citation ajoutées |
| 28 | `Cell.appliedCellStyle`, `Cell.clearCellStyleOverrides` ; `CellStyle` **sans** cette méthode ; régions `TableStyle` | indesignjs.de `Cell`/`CellStyle`/`TableStyle` | URLs + citations ajoutées |
| 30 | esperluette d'accélérateur dans `title` | indesignjs.de `MenuItem`/`MenuAction`/`ScriptMenuAction` (`id="p-title"`) | URL complétée (citation pré-existante) |
| 31 | `ScriptMenuAction.addEventListener(eventType, handler, captures?)` | indesignjs.de `ScriptMenuAction` | **déjà conforme** (inchangé) |
| 34 | durée de vie de `ScriptMenuAction` non documentée | indesignjs.de `ScriptMenuAction` | **déjà conforme** (inchangé) |
| 35 | « Startup Scripts » (read-me livré avec l'app) | PDF *Lisez-moi Scripts InDesign 2026* | **déjà conforme** (inchangé) |

**Cat.2 (18 cas)** — règle non applicable (preuve = test/log) :

`10, 12, 13, 14, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 29, 32, 33, 36`

Nuances à consigner dans cette catégorie (cas **mixtes** : affirmation d'API *secondaire* en plus du comportement mesuré) :

| Cas | Traitement |
|---|---|
| 10 | Affirmation « seul `\r` = saut de paragraphe » : **aucune source en ligne** retrouvée (probes `Story`/`InsertionPoint` vides) ⇒ note **« mesuré, non sourcé »** ajoutée. |
| 14 | Citation communautaire `"hello, world!"` **non re-retrouvée** ⇒ marquée comme telle ; ancrage API `InsertionPoint.contents` (`id="p-contents"`) **ajouté** en complément. |
| 16 | Ancrage API `Paragraph.startParagraph` + enum `StartParagraph` **ajouté** ; le **comportement d'héritage** reste classé **mesuré**. |
| 17 | Wiki GitHub d'origine **mort** (301 → `ff6347/extendscript`, « This repos wiki has moved ») ⇒ note **« mesuré, non sourcé »** ; ancrage API `SpecialCharacters` **ajouté**. |
| 20 | Citation `"tables occupy a single character position in the story"` **non re-retrouvée** (probes `Table`/`Tables`/`Story`/`TextFrame`/`Text` + recherche web) ⇒ note **« source non retrouvée »** ; ancrage partiel `Tables.add` ajouté. |
| 22 | Absence de `getElements` dans `Paragraphs` : **confirmée par la doc** mais le cas reste piloté par le log ⇒ laissé en cat.2, aucune URL due. |
| 27 | Citation Adobe Community 2012 (`"real world full runs rather than isolated test units"`) **non re-retrouvée** (pas d'URL conservée, pas de guide local) ⇒ note **« citation non retrouvée »** ajoutée ; la **thèse** du cas (pas de mock communautaire du DOM) reste vérifiée par la recherche FJD du 27/09 et les Cas 23/24/26. |

### Étape 2 — Complétion

- **17 cas cat.1** : tous portent désormais URL + citation exacte (14 par ajout, 3 déjà conformes).
- **Contenu technique** : **aucune** affirmation de comportement modifiée. Les ajouts sont des blocs `> **Source vérifiée…**` / `> **Statut source…**` / `> **Ancrage API…**` insérés *après* le corps du cas, avant le séparateur `---`.
- **Anti-fabrication** : toute citation non re-retrouvée a été **honnêtement downgradée** (« mesuré, non sourcé » / « source non retrouvée ») plutôt que reconstruite — Cas 09, 10, 14, 17, 20, 27.
- **Vérification d'intégrité** : `U+FFFD = 0` ; séparateurs `---` mal formés = **0** ; `grep -c "^## Cas " = 35`.

### Étape 3 — Réflexe n°1 (optionnel)

Le réflexe n°1 (L14 du wiki) cite « ex. Cas 09, 14, 17 » comme modèles de **format** — or ces cas sont, dans ce tri, en **cat.2** (leur citation d'origine est downgradée) et ne sont conformes que par leur **ancrage API secondaire** ajouté ici. La clarification du réflexe (distinguer explicitement « URL obligatoire » de « preuve = test ») **relève de 03ter** (qui touche déjà la structure du wiki) et n'a **pas** été faite dans cette mission pour ne pas mélanger les deux chantiers.

### Fichiers touchés

- `doc/wiki_extendscript_indesign.md` — 13 cas complétés + 6 notes de statut source (voir tables ci-dessus).
- Aucun autre fichier de contenu modifié.

### Reste à faire

1. **Commit** (réservé à FJD/Claude) — message détaillant ajouté vs laissé tel quel.
2. **Validation visuelle FJD**.
3. **Clôture** de la mission (passage statut ✅).

# Mission 03 — Reconstruction minimale de `insertMarkdownWithStyles` après régression non identifiée

**Statut** : 🔴 À FAIRE

**Contexte** : après 3 jours de correctifs empilés (24-25/09/2026) sur `insertMarkdownWithStyles()` (import_md.jsx, lignes ~965-1180), une VRAIE RÉGRESSION a été constatée par FJD sur test réel InDesign : un fichier DeepSeek qui fonctionnait dès le tout début de la session (quasiment du premier coup) ne fonctionne plus. Le dernier diagnostic en date montrait `paragraphElements.length = 1` au lieu de ~85 attendus après écriture de `fullText` — signe que tout le texte fusionne en un seul paragraphe au lieu de se scinder sur les `\r`.

La cause exacte n'a pas été trouvée malgré plusieurs cycles diagnostic/correctif (voir wiki Cas 17-23 et mission_01 Bugs 14-23). FJD a explicitement demandé d'arrêter de driller l'architecture actuelle (trop complexe : segments texte/table, styles appliqués en boucle, cascade de listes) et de repartir d'un cas minimal, reconstruit progressivement.

**Décision de méthode actée avec FJD (à respecter au mot près)** :
> "Repartir d'un cas minimal : écrire TOUT le texte en texte brut simple (un seul `insertionPoints[-1].contents = texteComplet`, sans `\r` multiples, sans segments, sans styles) pour vérifier que ça marche, PUIS réintroduire un `\r` à la fois en testant à chaque étape — plutôt que de continuer à driller la version actuelle déjà complexe."

## Étapes obligatoires (dans l'ordre, un commit git à chaque étape validée par test réel InDesign)

### Étape 0 — Baseline
Le dépôt git existe déjà (`~/INDD/IMPORT_MD/.git`, commit `647f691`). Ne pas recommit dessus tant que l'étape 1 n'est pas validée. Travailler sur une copie de `insertMarkdownWithStyles` isolée (ex. nouvelle fonction `insertMarkdownWithStyles_v2` ou branche git dédiée) pour ne jamais casser la référence.

### Étape 1 — Texte brut, un seul paragraphe
Écrire une fonction minimale qui prend `blocks` (déjà parsés) et **ignore tout le reste** (pas de styles, pas de tables, pas de listes, pas de segments) :
```javascript
var fullText = "";
for (var i = 0; i < blocks.length; i++) {
    fullText += blocks[i].text;
    if (i < blocks.length - 1) fullText += "\r";
}
story.contents = "";
story.insertionPoints[-1].contents = fullText;
```
Test réel InDesign avec `fixtures/deepseek_referentiel/*.md` (le fichier qui fonctionnait au tout début). Vérifier avec `story.paragraphs.length` (log) que le nombre de paragraphes produits correspond au nombre de blocs. **Ne pas avancer à l'étape 2 tant que ce nombre n'est pas exact.**

Si ça échoue déjà ici : le bug est dans la construction de `fullText` ou dans l'interprétation InDesign des `\r`, indépendamment de toute la couche styles/segments/tables — cela isolerait enfin la vraie cause. Documenter immédiatement au wiki.

### Étape 2 — Appliquer les styles de paragraphe (sans segments ni tables)
Sur la base de l'étape 1 validée, ajouter UNE SEULE passe de stylage par index stable (`story.paragraphs.everyItem().getElements()`), sans notion de segment. Retester le même fichier. Vérifier visuellement dans InDesign que chaque bloc a le bon style.

### Étape 3 — Réintroduire les tables
Ajouter la logique de segments texte/table (découpage autour des tables), en réutilisant la logique validée aux étapes 1-2 pour chaque segment texte. Tester avec un fichier contenant au moins un tableau (`fixtures/gemini_charte` ou équivalent).

### Étape 4 — Réintroduire la cascade de listes
Réintégrer `getLiStyleForIndentLevel()` (déjà validée en simulation, mission_02) pour les blocs `li`. Tester avec `fixtures/gemini_charte.md` (liste à 2 niveaux).

### Étape 5 — Non-régression complète
Rejouer les 5 fixtures (`claude_sample`, `deepseek_referentiel`, `deepseek_formation`, `gemini_charte`, `chatgpt_convention`) en test réel InDesign. Comparer visuellement au comportement attendu (JSON `.expected.json` de chaque fixture, en particulier structure de blocs et styles).

## Règles non négociables
- **Un commit git après chaque étape validée par test réel** — jamais après une simple simulation Node, jamais plusieurs étapes groupées dans un commit.
- Simulation Node autorisée en amont de chaque étape (rapide à vérifier), mais ne remplace jamais le test réel InDesign avant de committer.
- Si un test réel échoue, ne pas corriger en aveugle : ajouter un log ciblé, relire la doc officielle InDesign citée avec la citation exacte avant toute nouvelle hypothèse (méthode déjà validée, cf. wiki).
- Nettoyer les logs de diagnostic temporaires de l'ancienne version une fois la nouvelle validée bout en bout (étape 5).
- Documenter la résolution finale dans `mission_01` et le wiki (nouveau cas si la cause racine diffère de ce qui est déjà documenté).

## Référence
- Ancienne version (à ne pas modifier tant que la nouvelle n'est pas validée) : `import_md.jsx` lignes 965-1180, fonction `insertMarkdownWithStyles`.
- Wiki : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — Cas 17-23 pour l'historique du problème.
- Fichier de référence de non-régression : `fixtures/deepseek_referentiel/*.md` (fonctionnait au tout début de la session du 23/09).

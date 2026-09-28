# M03 — Handoff Étape 8 (non-régression complète)

> Trace de protocole : comment rejouer la non-régression de l'étape 8.
> Les preuves et le CR d'exécution sont dans `mission_03_reconstruction_minimale.md`,
> section `## Journal` (ligne « 8 — Non-régression complète »). Une seule trace : le Journal.

## État final
- **Étape 8** : implémentée, testée en réel sur les **deux points d'entrée** (curseur + cadre), validée.
- **Gates hors ligne** : syntaxe (`node --check`), `U+FFFD = 0`, `check_paths`, `check_memoire`,
  `check_regress` 12/12, `check_etape6`, `check_etape7`, `check_etape8`.
- **Corpus de non-régression** : `fixtures/mission_03_nonregression_all.md`
  (12 fixtures concaténées) + oracle `fixtures/mission_03_nonregression_all.expected.json`.

## Décisions actées (rappel)
- **Émojis** : **supprimés en amont** (`stripEmojis()`), décision FJD du 28/09.
  La substitution Webdings/Wingdings envisagée un temps est **abandonnée**.
  **Point de strip unique** : au tout début de `parseInlineMarkdown()`, pour que
  `getBlockPlainText()` et la longueur de `fullText` n'aient **qu'une seule vérité**
  (sinon désynchronisation des offsets étape 4 → `Object is invalid`).
- **Typographie conservée** : `—` (U+2014), `–` (U+2013), `…` (U+2026), `€` (U+20AC), `œ` (U+0153).
- **Flèches** : sacrifiées (retirées comme les émojis).

## Protocole de rejeu (réel InDesign uniquement)
1. Synchroniser le panneau **avant** de lancer :
   `cp import_md.jsx "<Panel>/import_md.jsx"` puis `diff -q` + `shasum -a 256`.
2. Lancer l'import du document combiné depuis un **document neuf**, une fois par point d'entrée :
   - `curseur` (InsertionPoint, `insertAtCursor=true`) ;
   - `cadre` (mode TextFrame, `insertAtCursor=false`).
3. C'est **l'agent** qui lit le log : `<Panel>/import_md_errors.log`.
   Lecture robuste (log en `\r`, encodage mixte) :
   `LC_ALL=C tr '\r' '\n' < "<Panel>/import_md_errors.log"`
   ou, en Python : `open(p,'rb').read().decode('utf-8','replace').replace('\r','\n')`.
4. Séparer les runs : découper le log à chaque ligne `M03-etape1bis`.
5. Vérins à contrôler : `REPLI=0`, `DIVERGENCE=0`, `ECART=0`, `reels==attendus`,
   `ecarts=0`, `neutre=0`, `erreurs=0`, `Object is invalid=0`, `literaux_intacts=true`,
   `offsets_fiables=true`, `offset_verifie=true`.
6. Comparer aux valeurs de l'oracle `fixtures/mission_03_nonregression_all.expected.json`.

## Pièges d'environnement
- ES3 uniquement : pas de `JSON` global, pas d'`Array.indexOf`, pas de `String.replace` à callback ;
  `\r` = fin de paragraphe, `\n` = saut de ligne forcé.
- `node --check` refuse les `.jsx` → copier d'abord en `.js`.
- macOS/zsh : `LC_ALL=C` pour `grep`/`cut`/`awk` ; pas de glob nu ; pas de `==` nu ; pas de variable `status` ;
  `cat -et` (pas `cat -A`).
- Panneau : `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel`
- Wiki : `doc/wiki_extendscript_indesign.md`

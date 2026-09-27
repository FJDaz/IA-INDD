# Mission 04 — Audit : lien dynamique vers le Markdown source (UXP vs update() natif vs solution maison)

**Statut** : 🔴 À FAIRE — mission d'AUDIT uniquement, aucun code attendu à ce stade
**Ne touche pas** au périmètre de la mission 03 (étapes 2-8 en cours) — chantier strictement séparé, à traiter après ou en parallèle sans jamais mélanger les deux fils.

## Contexte et objectif

FJD veut, à terme, une feature de suivi de lien : quand le fichier `.md` source est modifié après un premier import, InDesign doit **détecter** ce changement (idéalement via son propre panneau Liens natif, avec l'icône d'alerte standard), et un geste utilisateur (clic sur un bouton de mise à jour) doit **relancer notre pipeline complet** (reparsing + mapping de styles sur la charte réelle du document), pas juste un import brut.

Un échange avec l'Architecte (Claude) a déjà exploré cette question et abouti à trois constats **à vérifier par toi de façon indépendante**, pas à prendre pour acquis :

1. **`place()` existe sur 3 objets** (`Document`, `InsertionPoint`, `Text`) — confirmé par citation exacte de `indesignjs.de` (signature identique sur les 3 : `place(fileName, showingOptions?, withProperties?)`).
2. **`Story.itemLink` existe** et retourne un `Link` si la story provient d'un fichier placé (confirmé par citation exacte). `Link.status`, `Link.update()`, `Link.filePath` sont scriptables.
3. **`Link.update()` semble être une boîte noire** : sa description officielle ("Updates the link if the source file has been changed.") ne documente aucun paramètre ni hook pour lui faire exécuter un traitement custom après coup — elle relance vraisemblablement un import natif brut, écrasant tout mapping de styles fait précédemment. **Ce point n'est PAS confirmé par test réel**, seulement déduit de l'absence de paramètre dans la doc — à vérifier en priorité.

Un point important, à vérifier aussi : **notre méthode d'insertion actuelle (assignation directe à `.contents`, jamais un vrai `place()`) ne peut structurellement pas créer de `Link`** — donc en l'état actuel du script, le panneau Liens ne verra jamais notre import. Pour bénéficier du lien natif, il faudrait faire passer l'insertion par un vrai `place()` (sur le `.md` lui-même ou un fichier intermédiaire), puis réappliquer notre mapping de styles en seconde passe dans la même exécution du script (ExtendScript étant synchrone, l'utilisateur ne verrait jamais le texte brut non stylé à l'écran, à condition de ne pas insérer de dialogue modal entre les deux étapes).

Une piste alternative est apparue en fin d'échange, **non creusée en profondeur, à auditer sérieusement** : **UXP** (Unified Extensibility Platform), le framework moderne d'Adobe pour construire des plugins InDesign en JavaScript/HTML/CSS (pas C++), avec support officiel de panneaux persistants ancrés dans l'interface depuis InDesign v18.5. Si viable, ça éviterait le mur du SDK C++ propriétaire (compilation séparée Mac/Windows, courbe d'apprentissage lourde) qu'on redoutait initialement pour tout panneau custom.

## Ce qui est demandé (audit, pas implémentation)

### 1. Vérifier par test réel si `Link.update()` est vraiment une boîte noire
- Créer un test minimal : placer un fichier texte simple via `place()` dans un TextFrame, styler le texte après coup (mapping simplifié), modifier le fichier source, appeler `Link.update()` par script, observer le résultat.
- Est-ce que le style appliqué après le premier import survit à `update()`, ou est-il écrasé par un ré-import brut ?
- Documenter la réponse avec preuve réelle (log + constat visuel), pas seulement par déduction de la doc.

### 2. Vérifier la compatibilité UXP avec notre code existant
- Un plugin UXP peut-il réutiliser notre `parseMarkdown()`/logique de mapping actuelle (JavaScript proche d'ES5/ES6), ou faut-il tout réécrire dans l'environnement UXP ?
- Un plugin UXP peut-il coexister avec un script ExtendScript classique sur le même document (par exemple : le script `.jsx` actuel continue de faire l'import, un panneau UXP séparé ne fait que le suivi de lien et le déclenchement de mise à jour) ?
- Un panneau UXP peut-il détecter qu'un fichier source a changé sur disque (watcher de fichier, ou lecture de timestamp à l'ouverture du panneau) ?
- Quel est le coût réel de mise en place (uniquement en ampleur de développement, pas en jugement de valeur) : structure de projet UXP, outillage (UXP Developer Tool), courbe d'apprentissage pour quelqu'un qui connaît déjà ExtendScript.

### 3. Vérifier si un mécanisme "maison" (sans UXP, sans `place()`/`Link` natif) est réaliste
- Le script ExtendScript actuel pourrait-il, à chaque lancement, comparer un timestamp/hash du `.md` source (stocké dans les métadonnées du document InDesign, comme le mapping l'est déjà via `saveMappingToDocument()`/`loadMappingFromDocument()`) à l'état du fichier sur disque, et alerter l'utilisateur par une simple boîte de dialogue si le fichier a changé depuis le dernier import ?
- Ce mécanisme n'aurait pas l'icône native du panneau Liens, mais serait scriptable à 100% en ExtendScript pur, sans nouveau framework à apprendre.

### 4. Recommandation
Une fois les 3 points ci-dessus vérifiés (pas avant), formuler une recommandation argumentée : quelle option (lien natif + UXP, lien natif + `update()` malgré ses limites, mécanisme maison en ExtendScript pur) est la plus réaliste pour ce projet, en tenant compte de l'ampleur du chantier déjà en cours (mission 03) et du fait que ce projet est piloté par FJD seul avec des Ouvriers IA, pas une équipe de développement dédiée.

## Méthode de travail attendue
- Même rigueur que sur la mission 03 : vérifier la doc officielle avec citation exacte avant toute affirmation, test réel avant toute conclusion, ne jamais deviner un comportement.
- Si un point ne peut pas être tranché sans un vrai test dans InDesign, le signaler comme tel plutôt que de spéculer.
- Documenter au wiki (nouveau cas) toute découverte réutilisable au-delà de cette mission.
- Ne pas coder de solution définitive — cette mission est un audit qui doit permettre à FJD de choisir une direction, pas un livrable fonctionnel.

## Hors périmètre
- Toute implémentation de la feature elle-même (reportée à une mission 05 une fois la direction choisie).
- Toute modification du code des étapes 2-8 de la mission 03, en cours.

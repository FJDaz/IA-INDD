# Mission 04bis — Sonde runtime : le lien dynamique (`Story.itemLink`, `createTextFragmentLink()`, `placeAndLink()`, `linkedStoryOptions`)

**Statut** : 🟡 PARTIELLE — **sonde EXÉCUTÉE EN RÉEL** les **28/09/2026 23:24** (passe 1) et **29/09/2026 09:31** (passe 2, retenue) par **DS** (InDesign 21.6.0.57 `fr_FR`, macOS) : **6 journaux bruts** dans `/tmp` (`probe_04bis_Q0..Q5_*.log`). **Q5 TRANCHÉE** ; **Q4 partie runtime mesurée** (la dépréciation est un fait de **doc**, citation verbatim encore à joindre) ; **Q1 et Q2 TRANCHÉES PAR L'ÉCHEC** — `createTextFragmentLink()` échoue **11 essais sur 11** et `place()` d'un `.md` rend `doc.links.length = 0` ⇒ **aucun lien natif n'est atteignable vers un `.md`** ; **Q3 explicitement NON TRANCHÉE** (aucun lien créé ⇒ non mesurable : c'est une réponse honnête, pas un échec déguisé). **La capture du panneau Liens MANQUE** — et elle est **sans objet dans cet état** (`doc.links.length = 0` : il n'y avait rien à montrer). **= ÉTAPE 1 de la mission 04**, exécutée ; son verdict a orienté la variante `04ter` (cf. § 5 et § 6).
**Position** : **étape 1 de la mission 04** (réorganisation Architecte du 28/09/2026) — et non plus « sous-mission en fin de liste ». La mission 04 est désormais un **entonnoir à 3 étapes avec go/no-go** (cf. « Ordre d'exécution » dans `mission_04_audit_lien_dynamique.md`) : **cette sonde est la seule action ouverte**, et son verdict **oriente les deux axes** de la décision (déclencheur / pont). Elle **ne remplace pas** le détail des points 1 à 4 de la mission 04 : elle lève les **réserves documentaires** qui bloquent le point 1. Elle **ne touche pas** au numéro **05**, réservé à l'implémentation de la feature.
**Blocage levé le 28/09/2026** : FJD a **nommé DS comme exécuteur** — la règle structurelle de la mission 04 (« aucune mission pilotée par l'Architecte ne porte un livrable de code sans exécuteur nommé ») est **satisfaite** ; la sonde a été écrite **et exécutée sur le poste FJD** (InDesign 21.6.0.57 `fr_FR`).
**Cas wiki consultés** : Cas 37 (lien natif / modèle d'objet `Link` — créé le 28/09), Cas 14 (`+=` sur `InsertionPoint.contents`), Cas 17 (réassignation en boucle), Cas 18 (logging systématique), Cas 20 (écriture par segments), Cas 22 (`paragraphs[i]` invalide en boucle), Cas 24 (story capturée avant vidage), Cas 27 (séparation code maison / DOM), Cas 35 et Cas 36 (deux copies du script / démarrage).
**Cas wiki produits/enrichis** : **Cas 37** — promu de **`sourcé`** à **`mixte`** (faits d'API sourcés + comportement mesuré au runtime), avec les extraits de log ; sa rubrique « Solution / règle » a été **corrigée** (la mesure **falsifie** l'étape `createTextFragmentLink()`).

## Contexte

Le complément d'audit documentaire de la mission 04 (28/09/2026, miroir `indesignjs.de`, build InDesign 2026 / 21.5.1.73) a établi que :

- `Story.itemLink → Link` **existe** ;
- `Link.parent` peut être une **`Story`** (hiérarchie `Graphic | Movie | Story | Sound`) ;
- `InsertionPoint.createTextFragmentLink() → Link` **existe** et crée un `Link` sur un fragment de texte **déjà présent** ;
- `placeAndLink(parentStory)` existe sur `Document`, `Page`, `Spread`, `MasterSpread`, `EndnoteTextFrame` ;
- `Story.linkedStoryOptions → LinkedStoryOption` porte le réglage « linked story », **absent des préférences** (fait négatif A).

**Mais aucune de ces lignes de doc ne dit ce que le code fait réellement.** Le point 1 de la mission 04 (boîte noire `Link.update()`) ne peut pas être exécuté sur ces seules bases : il décide de l'architecture (mapping maison conservé ou écrasé par un ré-import natif), et une décision d'architecture ne se prend pas sur une déduction.

## Objectif

Trancher **par mesure réelle** les 5 réserves laissées ouvertes par le complément d'audit documentaire — et **rien d'autre**.

## Les 5 questions à trancher (réserves à lever)

| # | Question | Pourquoi elle est bloquante |
|---|---|---|
| Q1 | `InsertionPoint.createTextFragmentLink()` : quelle **signature** réelle, sur **quel** `InsertionPoint` l'appeler, quelle **valeur de retour**, quel `linkResourceURI` produit, que se passe-t-il s'il n'y a pas de fichier source associé ? | C'est le mécanisme qui doit remplacer le « mur du `.contents` ». Sans signature, pas de piste. |
| Q2 | Après `createTextFragmentLink()`, `Story.itemLink` est-il **non-null** ? `Link.parent` est-il bien la `Story` ? `Link.status` vaut quoi ? | Confirme que le `Link` obtenu est bien celui du panneau Liens, et non un objet inerte. |
| Q3 | **`Link.update()` sur un lien créé par nous** : ré-importe-t-il le fichier source **brut** (donc écrase notre mapping de styles), ou se contente-t-il d'un **contrôle de fraîcheur** ? Le mapping appliqué survit-il ? | **C'est LE point qui décide de l'architecture du point 1 de la mission 04.** |
| Q4 | `placeAndLink()` : est-il **marqué déprécié** (à revérifier sur `Document.html`) ? Quelle signature ? Que produit-il sur un `.md` ? | Une recommandation ne peut pas reposer sur un mécanisme déprécié sans que ce soit dit. |
| Q5 | `Story.linkedStoryOptions` : quelles propriétés sont **réellement accessibles au runtime** (14 membres annoncés) ? Le réglage « create links when placing text » est-il lisible/écrivable ? | C'est le seul levier scriptable du réglage (fait négatif A) — à vérifier qu'il est bien utilisable. |

## Protocole imposé (test-oriented — non négociable)

Toute affirmation devra être adossée à une **sortie brute**, jamais à une estimation.

1. **Instance InDesign neuve** : redémarrer InDesign avant chaque campagne de mesure.
2. **Script lancé depuis le Scripts Panel** — copie dans `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/`, jamais le fichier de travail (piège structurel « deux copies du même script », cf. Cas 35/36 et section finale du wiki).
3. **Logging systématique** (Cas 18) : chaque étape écrite dans un **fichier log horodaté** (objet `File` + `write`), pas seulement dans la console ESTK. **Un `catch` vide est interdit.**
4. **Une mesure = un fichier log distinct.** Ne pas réutiliser un log entre deux questions.
5. **Preuve visuelle** : capture du **panneau Liens** avant/après, en plus du log — le log prouve l'API, la capture prouve l'effet utilisateur.
6. **Document témoin** : un `.md` de test **minimal**, en **deux exemplaires** (un intact, un modifiable) pour pouvoir déclencher le cas « source modifiée » de `Link.update()`.
7. **Q3 en priorité absolue** : comparer les **styles réellement appliqués** avant/après `update()` (relever les noms de styles paragraphe par paragraphe, pas seulement « ça a l'air bon »).

## Garde-fous — pièges déjà documentés, à ne pas rejouer

- **Cas 14 / 17 / 20** : ne pas réassigner `.contents` en boucle ; une seule assignation, écriture par segments si nécessaire.
- **Cas 22** : `paragraphs[i]` peut être invalide en cours de boucle ⇒ itérer via `getElements()`.
- **Cas 24** : ne pas tester sur une référence de `Story` capturée **avant** un vidage — elle se détache.
- **Cas 27** : garder la logique pure séparée du DOM ; le sandbox Node ne prouvera **jamais** un comportement `Link`.
- **Cas 29 / 32** : une sonde qui crie « introuvable » n'est pas une preuve — vérifier la sonde elle-même avant de conclure.

## Ce qui doit être rapporté

- Le **log brut complet** de chaque question (Q1 → Q5), horodaté.
- Les **captures** du panneau Liens (avant/après).
- Pour **Q3** : le relevé des styles appliqués avant/après `update()` — c'est la pièce décisive.
- Pour **Q4** : le statut de dépréciation **tel qu'il apparaît sur `Document.html`**, avec la citation verbatim et l'URL.
- Un **verdict par question** : *tranchée par un fait observé* / *non tranchée* (et pourquoi). Une question non tranchée est un résultat acceptable ; une question « tranchée » sans log ne l'est pas.

## Ce que cette sonde NE peut PAS trancher

- Le comportement sur **Windows** (poste de mesure : macOS uniquement) — à déclarer comme réserve, pas à extrapoler.
- Le comportement d'**UXP** : hors périmètre (point 4 de la mission 04).
- La **viabilité du panneau/pont** (recadrage FJD de la mission 04) : hors périmètre.

## Hors périmètre

- L'**implémentation** de la feature (réservée à une **mission 05**).
- La modification de `import_md.jsx` : cette sonde **mesure**, elle n'intègre rien au script de production.
- Le mapping de styles lui-même : on l'utilise comme **témoin** (Q3), on ne le retravaille pas.

## Note d'architecture — qui écrit le script de sonde

Le script de sonde est **du code** : il doit être écrit par un **agent d'exécution (Ouvrier/DS)**. L'Architecte fournit la spec (le présent document), reçoit le CR et vérifie — il n'écrit pas le JSX. Si aucun agent d'exécution n'est disponible, **demander à FJD** avant de coder.

## Critère de sortie

1. Les **5 questions** ont une réponse adossée à un log brut (tranchée ou explicitement non tranchée).
2. Le **Cas wiki 37** est mis à jour : statut source `sourcé` → `mesuré` (ou `mixte`), avec les faits mesurés et les extraits de log.
3. Le statut de dépréciation de `placeAndLink()` est **tranché** (citation verbatim + URL).
4. Le **point 1 de la mission 04** devient exécutable sans hypothèse non vérifiée.

---

## Rapport d'exécution — CR 04bis

**Statut** : ✅ TERMINÉE — sonde **exécutée en réel** les **28/09/2026 23:24** (passe 1) et **29/09/2026 09:31** (passe 2, retenue) par **DS** : **6 journaux bruts**. **Q1 et Q2 tranchées par l'échec**, **Q5 tranchée**, **Q4 tranchée** (runtime **et** dépréciation — citation verbatim obtenue le **29/09/2026 14:29**, voir § 7), **Q3 explicitement non tranchée**, **capture du panneau Liens manquante mais sans objet**. **Les 4 critères de sortie sont satisfaits.** Extraits bruts en **§ 5**, bilan par question en **§ 6**.

### 1. Déblocage du blocage structurel (28/09/2026)

FJD a **nommé DS comme exécuteur** (« C'est toi DS grand. Tu es de fait autorisé à démarrer. »). La « Règle structurelle inscrite le 28/09 » de la mission 04 est donc **satisfaite** : la mission a un exécuteur nommé, et le livrable de code a pu être produit.

### 2. Question préalable de FJD — quels fragments de la mission 03 sont réutilisables ?

**Fait décisif, mesuré sur le source** : `import_md.jsx` se termine par **`main();` au top-level** (ligne 2839), précédé d'un `$.evalFile(import_md_menu.jsx)`. Conséquence directe : **aucun `#include` ni `$.evalFile` de ce fichier n'est possible** — l'évaluer *exécuterait l'import*. « Reprendre du code » signifie donc **copier des fragments**, jamais inclure le fichier. (Modifier `import_md.jsx` est par ailleurs **hors périmètre** de cette sonde.)

| Niveau | Fragments repris de `import_md.jsx` | Usage dans la sonde |
|---|---|---|
| **Plomberie** | `logToFile` / `logError` (pattern), `alertUser`, `readMarkdownFileAt`, `selectAndReadMarkdownFile`, `safeStyleName`, `arrayContains`, `describeSelectionItem`, `resolveTargetStory` | journalisation (avec **log dédié**), lecture de fichiers, styles « objet ou chaîne » |
| **Cœur de Q3** | `collectStylesRecursive` / `getParagraphStyleEntries` / `findParagraphStyleByName` + le *relevé* de `checkAndCleanStylesAtTrigger` + `neutralizeDocumentDefaults` | résolution nom→objet (styles **groupés** inclus) et **relevé paragraphe par paragraphe** avant/après `update()` |
| **Persistance / voie B** | `serializeFlatMapping` / `deserializeFlatMapping`, `loadMemoryMapping` / `saveMemoryMapping`, `loadMappingFromDocument` | lecture du **mapping témoin** réel |
| **Non repris** | `insertMarkdownWithStyles` (l. 1281→~2196, **~900 lignes**), `showConfigurationDialog`, `parseMarkdown`, modules menu/loader | (a) non inclurable, (b) ~900 lignes dupliquées pour un témoin de 3 paragraphes = disproportionné, (c) la spec dit « on l'utilise comme **témoin**, on ne le retravaille pas » |

**Pattern de sonde déjà éprouvé** (mission 03, étape 9) : `tools/probe_menu*.jsx` et `tools/probe_startup*.jsx` — `p()` + `writeLog()`, journal dédié, **source purement ASCII**, auto-suffisant. C'est le **moule** qui est repris, pas leur code (ils mesurent le câblage des menus, pas le modèle `Link`).

**Pièges portés depuis la mission 03** : ES3 strict (pas de `JSON`, pas d'`Array.prototype.indexOf`), `\r` = fin de paragraphe, `LOG_FILE_PATH`/`MEMORY_MAPPING_PATH` sont des **chaînes** (⇒ `new File(...)` à l'usage — bug du 27/09), Cas 22 (`paragraphs[i]` ⇒ `everyItem().getElements()`), Cas 24 (story non capturée avant vidage), Cas 35/36 (deux copies ⇒ `$.fileName` écrit dans chaque journal).

**Outil ajouté** : `reflect` (natif ExtendScript) — `reflect.properties` / `reflect.methods` permettent d'**énumérer les membres réellement présents** au runtime, donc de répondre Q1/Q2/Q5 **sans deviner un seul nom de propriété**.

**Précédent trouvé (à signaler, hors périmètre de cette sonde)** : `test_place_icml.jsx` (19 mai, dossier du panneau Scripts) place un fichier **`.icml`** — c'est exactement la voie **native du « linked story »** d'InDesign. Précédent utile pour l'axe 1 (déclencheur), mais il n'est pas mesuré ici.

### 3. Le livrable

`tools/probe_04bis_lien.jsx` — **804 lignes / 39 149 octets** — empreinte **sha256** `445c937fc8157009…` (`shasum -a 256`), source **purement ASCII**. Historique des passes : passe 1 = 706 lignes / 33 432 octets (sha256 `0cba6fcc…855a`) ; passe 2 = 746 lignes / 36 165 octets ; **version en place = 804 lignes** (les deux premiers chiffres restaient dans ce CR : corrigés ici sur la foi du fichier sur disque).

| Contrôle | Résultat |
|---|---|
| Syntaxe ES3 (`node --check` sur copie `.js`) | **OK** |
| Source purement ASCII (`LC_ALL=C grep -c '[^ -~]'`) | **0** |
| U+FFFD | **0** |
| `import_md.jsx` modifié ? | **NON** (hors périmètre respecté) |

**Structure** : Q0 (contexte) puis **Q1 à Q5** conformes à la table de la spec, **une question = un journal distinct** dans `/tmp` (`probe_04bis_Q0..Q5*.log`), comme l'impose le protocole point 4.

**Points de protocole implémentés** :
- point 3 (logging systématique) : chaque étape journalisée, **aucun `catch` vide** ;
- point 4 : **un fichier log par question** ;
- point 6 : document témoin `.md` en **deux exemplaires** (`_source_intact.md` / `_source.md`), le second réécrit avec un contenu B pour déclencher le cas « source modifiée » ;
- point 5 (**capture du panneau Liens**) : **deux pauses** `alert()` encadrent `update()` — une **AVANT** (statut attendu *out of date*, c'est **le fait décisif de Q3**) et une **APRÈS** (statut attendu *normal*) ; une troisième alerte, en tête du script, impose d'ouvrir `Fenêtre > Liens` **avant** le lancement et donne le raccourci macOS (`Cmd+Shift+3`) ;
- point 7 : **relevé des styles paragraphe par paragraphe** avant/après `update()`, verdict **calculé sur les relevés** (pas sur une impression) ;
- garde-fous : Cas 14/17/20 (une assignation par paragraphe, aucun `+=` en boucle), Cas 22, Cas 24, Cas 29/32 (sonde vérifiée avant d'être crue), Cas 35/36 (`$.fileName` dans chaque journal).

**Deux choix explicites, journalisés** :
- **document de test neuf** (`app.documents.add(true)`) : aucun document existant n'est touché ; il est **laissé ouvert** pour la capture du panneau Liens (point 5) ;
- **Q4 non invoquée au runtime** : `placeAndLink(parentStory)` n'accepte **aucun fichier** en argument ; l'invoquer sans `place()` préalable est sans objet, et avec interaction ouverte il ouvrirait un sélecteur de fichier. La partie **runtime** (présence + arité + emplacements `Document`/`Page`/`Spread`/`MasterSpread`) est mesurée ; la partie **dépréciation** reste à citer depuis `Document.html`.

### 4. Ce qui restait à faire — état

1. **Exécuter la sonde en réel** → **FAIT** : 2 passes (28/09 23:24, puis **29/09 09:31** sur **instance neuve**, `app.documents.length = 0` au départ) ; **6 journaux**.
2. **Capturer le panneau Liens** → **NON FAIT**, et **sans objet** : les captures obtenues montrent les alertes, pas le panneau ; mais dans l'état mesuré `doc.links.length = 0`, il n'y avait **rien à montrer**. La preuve de Q2 est donc **négative et adossée au log** (§ 5).
3. **Rapporter les 6 journaux** → **FAIT** (§ 5).
4. **Q4 (dépréciation) : citer `Document.html` verbatim + URL** → **FAIT** (29/09/2026 14:29, voir § 7) : la partie runtime est mesurée **et** la citation verbatim est jointe, avec son URL et son empreinte.
5. **Cas wiki 37 : `sourcé` → `mesuré`/`mixte`** → **FAIT** (`mixte`), avec **correction de sa rubrique « Solution / règle »** : l'étape `createTextFragmentLink()` y est **falsifiée par la mesure**.
6. **Suivre le verdict (nouveau)** : la variante **`04ter`** — passer par un **`.icml`** au lieu du `.md` — a été exécutée le **29/09/2026 09:53** ; elle **échoue aussi pour notre besoin** ⇒ **bifurcation vers la voie B**. Voir [mission_04ter_sonde_icml.md](mission_04ter_sonde_icml.md) et le § 6 ci-dessous.

**Les conclusions sont désormais tirées, et adossées aux journaux bruts du § 5.**

### 5. Extraits bruts des journaux (passe 2, 29/09/2026 09:31)

Citations **verbatim** des journaux, sans reformulation. Les journaux contiennent des fins de ligne `\r` et des octets non-UTF-8 : ils sont lus avec `LC_ALL=C tr '\r' '\n'`.

**Q0 — contexte** (`/tmp/probe_04bis_Q0_contexte.log`)

```
SONDE 04bis -- Q0 -- Tue Sep 29 2026 09:31:43 GMT+0200
$.fileName (LA copie qui tourne) = .../Scripts Panel/probe_04bis_lien.jsx
app.version = 21.6.0.57 | app.locale = FRENCH_LOCALE
app.documents.length = 0
ERREUR | contexte=activeDocument | message=Aucun document n'est ouvert. | ligne=410
document actif au lancement = (aucun)
journaux ecrits dans = /tmp
memoire de mapping lue depuis .../Scripts Panel/import_md_mapping_memory.txt (existe=true)
```

**Q1 — `createTextFragmentLink()`** (`/tmp/probe_04bis_Q1_createTextFragmentLink.log`) — **11 essais, 11 échecs**

```
typeof ip.createTextFragmentLink = function
ip.createTextFragmentLink.length (arite annoncee) = 0
File.absoluteURI (forme canonique Adobe) = /tmp/probe_04bis_source.md
essai 1  (0 argument)            -> ERREUR : Valeur obligatoire manquante pour le paramètre 'linkResourceURI' de la méthode 'createTextFragmentLink'. | ligne=469
essai 3  (chemin + nom)          -> ERREUR : Impossible de créer la ressource de lien à partir de l'URI donné. | ligne=471
essai 5  (URI file:// + nom)     -> ERREUR : Impossible d'importer le lien vers le fragment de texte. Vérifiez la connectivité de votre réseau ou la source originale du contenu. | ligne=471
essai 10 (.txt jumeau + nom)    -> ERREUR : Impossible d'importer le lien vers le fragment de texte. Vérifiez la connectivité de votre réseau ou la source originale du contenu.
essais 2/4/6/7/8/9/11             -> message=createTextFragmentLink | ligne=470
doc.links.length apres cet essai = 0     <-- À CHACUN des 11 essais
```

**Q1b — placement préalable puis lien** (même journal)

```
tf2.place(.md) RETOUR = typeof=object constructor=Array reflect.name=Array | valeur=[object Story]
tf2.contents longueur = 42
tf2.parentStory.itemLink = (null)
doc.links.length apres place = 0
ERREUR | contexte=Q1b createTextFragmentLink sur story placee | message=createTextFragmentLink | ligne=547
lien retenu pour Q2/Q3 : (null)
```

**Q2 — `story.itemLink`** (`/tmp/probe_04bis_Q2_story_itemLink.log`)

```
typeof story.itemLink = object
story.itemLink = (null)
story.itemLink est null/undefined -> le Link cree par createTextFragmentLink() n'est PAS expose par story.itemLink (fait negatif a enregistrer)
story.itemLink === LAST_LINK ? true
ATTENTION : cette egalite est VIDE (null === null). Elle ne prouve rien
doc.links.length = 0
```

**Q3 — `update()` contre le mapping** (`/tmp/probe_04bis_Q3_update_vs_mapping.log`)

```
RELEVE AVANT : p[0]='ZZ Temoin H1' | p[1]='ZZ Temoin P' | p[2]='ZZ Temoin LI' | caractere='[Sans]'
story.contents AVANT : longueur=53 | Titre temoin\rParagraphe temoin.\rItem de liste temoin.
lien utilise pour update() : (null)
AUCUN LIEN -> Q3 NON MESURABLE dans cet etat. Voir Q1 : le mecanisme de creation a echoue.
Conclusion honnete : Q3 NON TRANCHEE (pas d'echec deguise en resultat).
```

**Q4 — `placeAndLink()`** (`/tmp/probe_04bis_Q4_placeAndLink.log`)

```
typeof doc.placeAndLink = function | doc.placeAndLink.length = 0
methodes de Document contenant 'place' -> 3 methode(s) : placeAndLink(), place(), placeCloudAsset()
typeof page.placeAndLink = function | page.placeAndLink.length = 0
typeof spread.placeAndLink = function | spread.placeAndLink.length = 0
typeof master.placeAndLink = function
NON INVOQUE (choix explicite, journalise) : placeAndLink(parentStory) n'accepte AUCUN fichier en argument. ...
=> Q4 partie runtime : mesuree ci-dessus. Q4 partie depreciation : a citer verbatim depuis la doc.
```

**Q5 — `story.linkedStoryOptions`** (`/tmp/probe_04bis_Q5_linkedStoryOptions.log`)

```
typeof story.linkedStoryOptions = object | constructor=LinkedStoryOption
reflect.properties -> 11 propriete(s) :
   updateWhileSaving = (lecture KO: Cette propriété n'est pas applicable dans l'état actuel.)
   warnOnUpdateOfEditedStory = (lecture KO: Cette propriété n'est pas applicable dans l'état actuel.)
   removeForcedLineBreaks = (lecture KO: Cette propriété n'est pas applicable dans l'état actuel.)
   applyStyleMappings = (lecture KO: Cette propriété n'est pas applicable dans l'état actuel.)
   isValid = true
   parent = [object Story]
reflect.methods -> 10 methode(s)
candidats fait negatif A (createLinksWhenPlacingTextAndSpreadsheetFiles, createLinksWhenPlacingText,
updateLinkWhenPlacingText, linkedStory, link, story) -> tous : Object does not support the property or method ('...') (typeof=undefined)
doc.links.length = 0
```

### 6. Bilan par question

| # | Verdict | Preuve (log brut, § 5) |
|---|---|---|
| **Q1** | **TRANCHÉE — par l'échec** | `createTextFragmentLink()` échoue **11/11** ; seul `linkResourceURI` est obligatoire (l'API attend une **URI**, pas un chemin — dit par le message `Valeur obligatoire manquante…`) ; les 2 messages d'erreur distincts (`Impossible de créer la ressource de lien à partir de l'URI donné.` / `Impossible d'importer le lien vers le fragment de texte…`) ; `doc.links.length = 0` **à chaque essai**. ⇒ **aucun `Link` natif n'est créable vers un `.md`.** |
| **Q1b** (non prévue, ajoutée) | **TRANCHÉE** | `place(.md)` **place bien** le texte (`contents longueur = 42`, retour `Array` portant un `Story`) mais `parentStory.itemLink = (null)` et `doc.links.length = 0` ⇒ **le placement d'un `.md` ne crée aucun lien** (le `.md` n'est pas un format liant pour InDesign). |
| **Q2** | **TRANCHÉE — fait négatif** | `story.itemLink = (null)`. Le log **s'auto-avertit** que l'égalité avec le dernier lien est **vide** (`null === null`) et « **ne prouve rien** » — mention conservée telle quelle : c'est de l'honnêteté méthodologique, pas un résultat. |
| **Q3** | **NON TRANCHÉE — explicitement** | `AUCUN LIEN -> Q3 NON MESURABLE dans cet etat.` + `Conclusion honnete : Q3 NON TRANCHEE (pas d'echec deguise en resultat).` ⇒ **la question décisive de l'architecture n'est pas résolue par `04bis`** ; elle le sera par la variante `04ter` (ICML). |
| **Q4** | **TRANCHÉE** (runtime **et** dépréciation) | `placeAndLink` existe sur `Document`, `Page`, `Spread`, `MasterSpread` ; `length = 0` ; **non invoqué** (choix journalisé). Dépréciation **citée verbatim** depuis `Document.html` (§ 7) : « **Deprecated: Use ContentPlacerObject load method.** » ⇒ dépréciation **douce** (la méthode reste présente au runtime), remplaçant désigné `ContentPlacerObject.load`. |
| **Q5** | **TRANCHÉE** | `reflect.properties` → **11 propriétés**, dont **4 KO** « *Cette propriété n'est pas applicable dans l'état actuel.* » ; `isValid = true` ; `parent = [object Story]` ; **10 méthodes**. Le **fait négatif A** est **confirmé au runtime** : aucune propriété « create links when placing text » n'existe, ni sur `linkedStoryOptions`, ni sur `linkingPreferences` / `wordRTFImportPreferences`. |

**Conséquence pour l'axe 1 (déclencheur) de la mission 04** : la voie A « lien natif sur le `.md` » est **fermée par la mesure**. Restait une variante : **lier un `.icml`** au lieu du `.md` (la seule route native restante). Elle a été mesurée le **29/09/2026 09:53** par la mission **`04ter`** : **elle échoue également pour notre besoin** (le lien natif surveille l'ICML, pas le `.md` ; `update()` ne recharge jamais ; l'ICML ne porte aucun style nommé) ⇒ **bifurcation actée vers la voie B** (empreinte maison du `.md` en métadonnées).

**Critères de sortie de la mission (état)** :

1. **Les 5 questions ont une réponse adossée à un log brut** → **✅ SATISFAIT** (dont une, Q3, **explicitement non tranchée** — c'est une réponse admise par le critère lui-même).
2. **Cas wiki 37 mis à jour** (`sourcé` → `mixte`, avec extraits de log) → **✅ SATISFAIT** (Cas 37 promu `mixte` dans le wiki ; sa règle corrigée).
3. **Statut de dépréciation de `placeAndLink()` tranché (citation verbatim + URL)** → **✅ SATISFAIT** (29/09/2026 14:29, voir § 7) : la fiche méthode de `Document.html` porte « **Deprecated: Use ContentPlacerObject load method.** » — URL servie `https://www.indesignjs.de/indesignapi/indesign/Document.html` (HTTP **200**, 239 282 octets, **1 redirection** depuis `…/extendscriptAPI/indesign-latest/Document.html`), sha256 `e1fb6142b29488c719a3925555dbc64e5dc9478131a2a38653ba451936d72a76`.
4. **Point 1 de la mission 04 exécutable sans hypothèse non vérifiée** → **✅ SATISFAIT**, et **répondu par la négative** : la mesure autorise à écrire la suite **sans hypothèse** — la voie A est écartée.

**Note de méthode (à conserver)** : les journaux de la passe 1 et ceux de la passe 2 portent des noms de fichiers partiellement différents dans les notes de travail ; la **référence est le contenu de `/tmp`** (noms réels : `probe_04bis_Q1_createTextFragmentLink.log`, `probe_04bis_Q2_story_itemLink.log`, `probe_04bis_Q3_update_vs_mapping.log`). Toute citation de ce CR s'appuie sur ces trois noms-là.

### 7. Q4 — statut de dépréciation de `placeAndLink()` : citation verbatim et URL (29/09/2026, 14:29)

**Source** : page de classe `Document.html` du miroir **indesignjs.de** (le même miroir que celui déjà cité au Cas 37 du wiki). Capture brute :

```
$ curl -sSL -o /tmp/indesignjs_Document.html -w 'HTTP=%{http_code} redirections=%{num_redirects} url_finale=%{url_effective}\n' \
    'https://www.indesignjs.de/extendscriptAPI/indesign-latest/Document.html'
HTTP=200 redirections=1 url_finale=https://www.indesignjs.de/indesignapi/indesign/Document.html
  239282 /tmp/indesignjs_Document.html
```

**URL servie (canonique)** : `https://www.indesignjs.de/indesignapi/indesign/Document.html`
**Piège de mesure (à retenir)** : l'URL « courte » `https://www.indesignjs.de/extendscriptAPI/indesign-latest/Document.html` répond **HTTP 301** avec un **corps de 308 octets** (simple talon de redirection) ⇒ **sans `curl -L`, rien n'est téléchargé** et on peut conclure à tort que la page n'existe pas. Et `https://www.indesignjs.de/extendscriptAPI/indesign-16.4/Document.html` répond **404** (à ne pas citer).
**Empreinte** : sha256 `e1fb6142b29488c719a3925555dbc64e5dc9478131a2a38653ba451936d72a76` — **239 282 octets** ; copie de la preuve : `/tmp/probe_04bis_Q4_doc_Document.html`.

**Extrait verbatim** (section `METHODS`, entrée `placeAndLink`, texte de la page débalisé, extrait à l'offset 201746) :

```
placeAndLink (parentStory, showingOptions? ) → void
Deprecated: Use ContentPlacerObject load method. Original Description: Place following the behavior of the place and link story menu item. This will load the place gun.
parentStory   Story   The story to place and link from.
showingOptions?   Boolean   Whether to display the link options dialog

placeCloudAsset (jsondata) → void
```

⇒ **la phrase de dépréciation, mot pour mot, est : « Deprecated: Use ContentPlacerObject load method. »** *(le retour à la ligne après « Place » dans le HTML est un artefact de rendu du texte récupéré, pas une coupure de la phrase.)*

**Lecture** : dépréciation **douce**. Le runtime la confirme indirectement — la méthode est **toujours présente** (`typeof doc.placeAndLink = function`, `doc.placeAndLink.length = 0`) et coexiste avec ses deux voisines **non** dépréciées `place()` et `placeCloudAsset()`. Elle **n'est plus la voie recommandée** (remplaçant désigné : `ContentPlacerObject`, méthode `load`). Ce fait **ne change pas** le verdict : la voie A était de toute façon **fermée par la mesure** (`04bis` Q1/Q2, puis `04ter`).

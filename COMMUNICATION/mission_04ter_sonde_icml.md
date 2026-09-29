# Mission 04ter — Sonde runtime, voie A par l'ICML lié (`story.exportFile(INCOPY_MARKUP)` → `place(.icml)` → `Link.update()`)

**Statut** : ✅ TERMINÉE — **mesurée en réel** le **29/09/2026 09:53** par **DS** (InDesign **21.6.0.57** `fr_FR`, macOS, **instance neuve**, `documents ouverts au depart = 0`) : **1 journal de lancement** (`/tmp/run_04ter.log`) + **4 journaux de mesure** (T0, T1, T2, T3) + **2 journaux de contre-épreuve** (TEST 0 / TEST 1 / TEST 2). **VERDICT : la voie A (lien natif) ÉCHOUE pour notre besoin ⇒ BIFURCATION VERS LA VOIE B** (empreinte maison du `.md` en métadonnées). Livrable : `../tools/probe_04ter_icml.jsx` — **770 lignes** / 32 065 octets — empreinte **sha256** `5c4713086439e731…`.
**Position** : **suite de l'étape 1 de la mission 04**, sur instruction de **FJD (29/09/2026)**. La mission **`04bis`** a mesuré que **aucun `Link` natif n'est créable vers un `.md`** (`createTextFragmentLink()` : 11 échecs sur 11 ; `place(.md)` : `doc.links.length = 0`). Restait **une** route native non testée : exporter le `.md` en **ICML** puis **lier l'ICML**. `04ter` la mesure.
**InCopy n'est PAS une cible** : le `.icml` n'est ici qu'un **vecteur de test** — on ne cherche pas à produire un document InCopy, on cherche à savoir si le **mécanisme de lien natif** peut surveiller notre source.
**Blocage levé le 29/09/2026** : FJD a demandé explicitement de **tenter `04ter` « pour le sport »**, en précisant **ne pas être un partisan d'InCopy** et qu'**en cas d'échec on bifurque**. La mission a donc une **décision de sortie déjà cadrée** : succès → on explore la voie A par l'ICML ; échec → **bifurcation vers la voie B**.
**Cas wiki consultés** : Cas 18 (logging systématique), Cas 22 (`paragraphs[i]` invalide en boucle), Cas 24 (story capturée avant vidage), Cas 27 (séparation code maison / DOM), Cas 35 et Cas 36 (deux copies du script / démarrage).
**Cas wiki produits/enrichis** : **Cas 37** — promu de **`sourcé`** à **`mixte`** (les faits mesurés de `04bis` **et** de `04ter`) ; **Cas 39** et **Cas 40** créés (statut **`mesuré`**).

## Contexte

- **`04bis`** a établi le **fait négatif** : pas de `Link` atteignable depuis un `.md`.
- Le **complément d'audit documentaire** de la mission 04 mentionnait un **précédent** : `test_place_icml.jsx` (19 mai) place un **`.icml`** — c'est la voie **native du « linked story »** d'InDesign.
- `ExportFormat.INCOPY_MARKUP` (`1768123756`) permet de **produire** un `.icml` par script. La question : **ce lien sert-il à quelque chose** pour nous — c'est-à-dire **recharge-t-il le contenu** quand la source change, et **respecte-t-il notre mapping de styles** ?

## Objectif

Trancher **par mesure réelle** si la voie A reste exploitable **via l'ICML** :

1. produire un `.icml` par **`exportFile`** (quel porteur ? quel format accepté ?) ;
2. le **placer lié** (`place()`) et vérifier qu'un `Link` **natif** apparaît (panneau Liens, `story.itemLink`) ;
3. **modifier la source** puis appeler **`Link.update()`** : le contenu est-il **ré-importé** ? notre **mapping de styles** survit-il ?
4. vérifier le comportement à la **réouverture** du document (`checkLinksAtOpen`) ;
5. **verdict** : la voie A est-elle viable, oui ou non ?

## Protocole imposé (test-oriented — non négociable)

1. **Instance InDesign neuve** avant chaque campagne.
2. **Logging systématique** : chaque étape dans un **fichier log horodaté** ; **aucun `catch` vide**.
3. **Une mesure = un journal distinct**, et **contre-épreuve** séparée pour tout résultat contre-intuitif (un résultat qui contredit la doc **doit** être rejoué proprement avant d'être écrit).
4. **Anti-tautologie** : chaque conclusion doit reposer sur une lecture **indépendante** du résultat (ici : vérifier dans l'ICML produit l'**absence de styles nommés** — sinon une lecture de styles « réussie » serait circulaire).
5. **Preuve du contenu**, pas du `ok` : un `exportFile` qui renvoie `ok=true` ne prouve rien (cf. piège n°1) — il faut **lire le fichier produit**.

## Garde-fous — pièges à ne pas rejouer

- **Cas 14 / 17 / 20** : aucune réassignation de `.contents` en boucle.
- **Cas 22** : `paragraphs[i]` peut devenir invalide en cours de boucle ⇒ `getElements()`.
- **Cas 24** : ne pas capturer une `Story` avant un vidage.
- **Cas 27** : le sandbox Node ne prouvera **jamais** un comportement `Link`.
- **Cas 35 / 36** : écrire `$.fileName` dans chaque journal (rituel des deux copies).

## Critère de sortie

1. Les 5 points de l'objectif ont une réponse adossée à un **journal brut** (tranchée ou explicitement non tranchée).
2. Le **Cas wiki 37** est mis à jour avec les faits mesurés.
3. Un **verdict explicite** : la voie A est **viable** ou **écartée** — et si écartée, la **bifurcation vers la voie B** est actée.
4. Les **pièges d'API** rencontrés sont consignés au wiki (nouveaux cas), pour ne pas être repayés par la suite.

## Hors périmètre

- L'**implémentation** (mission 05) : cette sonde **mesure**, elle n'intègre rien.
- **InCopy** comme cible de production (cf. Position).
- La modification de `import_md.jsx` (non touché).

---

## Rapport d'exécution — CR 04ter

**Statut** : ✅ TERMINÉE — **mesurée en réel** le **29/09/2026 09:53** par **DS** (InDesign 21.6.0.57 `fr_FR`, macOS, instance neuve). **Verdict : la voie A (lien natif) échoue pour notre besoin ⇒ bifurcation vers la voie B.** Livrable : `../tools/probe_04ter_icml.jsx` (770 lignes / 32 065 octets). Détail en **§ 1–6** ci-dessous.

### 1. Le livrable et les journaux

| Élément | Fait |
|---|---|
| Sonde | `../tools/probe_04ter_icml.jsx` — **770 lignes** / **32 065** octets — empreinte **sha256** `5c4713086439e731…` (`shasum -a 256`) |
| Lanceur | `/tmp/run_04ter.jsx` → journal `/tmp/run_04ter.log` |
| Journaux de mesure | `/tmp/probe_04ter_T0_preference_lien.log`, `…_T1_production_icml.log`, `…_T2_placement_lie.log`, `…_T3_update_vs_mapping.log` |
| Contre-épreuves | `/tmp/test_reopen2.jsx` → `/tmp/test_reopen2.log` (**10:04:46**, passe retenue) ; `/tmp/test_update_sans_edition.jsx` → `/tmp/test_update_sans_edition.log` (**10:03:49**, TEST 1 valide mais TEST 2 annulé — cf. § 6) |
| Sorties ICML | `/tmp/probe_04ter_out/probe_04ter_A.icml`, `…_B.icml` |

**Lancement** (`/tmp/run_04ter.log`), verbatim :

```
app.version = 21.6.0.57
documents ouverts au depart = 0
shadow alert KO : alert is read only
fonctions neutralisees = confirm
sonde : .../probe_04ter_icml.jsx | existe=true | 32065 o
evalFile TERMINE normalement
duree ms = 46106
documents ouverts a la fin = 1
```

### 2. T0 — le contexte du poste (mémoire de mapping, constantes, atteignabilité)

**Convention de citation** : le log **replie** les lignes longues (coupure forcée à ~78 caractères). Les extraits ci-dessous sont **remis sur une seule ligne logique**, le texte n'est **pas réécrit**.

`app.version = 21.6.0.57` · `app.documents.length AVANT = 0`. L'exploration donne (lignes individuelles, **pas** un bloc contigu — donc citées séparément) :

```
app : 219 propriete(s), 4 contenant 'link'
TOTAL objets de preferences listes = 73
   menuActions contenant 'lien'/'link' = 50
ExportFormat : 18 constante(s)
constante retenue : ExportFormat.INCOPY_MARKUP = INCOPY_MARKUP (valeur numerique 1768123756)
```

**La mémoire de mapping réelle est lue** — fait de contexte indispensable pour juger T3 (c'est **ce** mapping que l'on veut voir survivre) :

```
memoire = ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md_mapping_memory.txt (existe=true | taille=279 o)
   memoire[h1] = 'H1'
   memoire[h2] = 'H2'
   memoire[h3] = 'H3'
   memoire[p] = 'P'
   memoire[li] = 'P2 Puces'
   memoire[li2] = 'PSch'
   memoire[blockquote] = 'P2'
   memoire[table] = 'Table 1'
   memoire[code] = 'P Code'
```

⇒ l'environnement mesuré est bien **celui de la production** : la mémoire de mapping (20 entrées lues) vit dans le dossier du **panneau Scripts**, au même emplacement que la copie exécutée du script (cf. Cas 35 et 36).

**À consigner (honnêteté)** : le journal T0 porte, au tout début, `ERREUR | contexte=T0 document existant | message=Object is invalid | ligne=397 | fichier=~/INDD/IMPORT_MD/tools/probe_04ter_icml.jsx`. C'est **attendu et non bloquant** : `app.documents.length = 0` (instance neuve), donc l'inspection d'un « document existant » ne peut pas aboutir. L'erreur est **journalisée** (aucun `catch` vide) — elle ne masque rien.

### 3. T1 — produire l'ICML (deux bugs trouvés, journalisés)

**(a) Le porteur compte — `Document.exportFile` est refusé, et il ne produit rien.** Le log sépare les deux essais ; ordre réel des lignes :

```
porteur d'export = story | contents longueur = 42
ERREUR | contexte=(a) document.exportFile de DOC_A | message=L'objet spécifié ne prend pas en charge le format d'exportation souhaité. | ligne=492 | fichier=~/INDD/IMPORT_MD/tools/probe_04ter_icml.jsx
(a) fichier apres essai document : existe=false | taille=(n/a) o | chemin=/tmp/probe_04ter_out/probe_04ter_A.icml
```

Le second essai échoue **à l'identique**, même ligne de code : `ERREUR | contexte=(a) document.exportFile de DOC_B | message=L'objet spécifié ne prend pas en charge le format d'exportation souhaité. | ligne=492`. ⇒ ce n'est pas un accident de contenu : **le document n'est pas un porteur d'export ICML valide**.

**(b) `Story.exportFile` fonctionne** :

```
(b) story.exportFile execute = true
ICML produit : existe=true | taille=35909 o | chemin=/tmp/probe_04ter_out/probe_04ter_A.icml
```

**Bilan T1 (verbatim)** :

```
--- bilan T1 ---
ICML A : existe=true | taille=35909 o | chemin=/tmp/probe_04ter_out/probe_04ter_A.icml | obtenu=oui
ICML B : existe=true | taille=36877 o | chemin=/tmp/probe_04ter_out/probe_04ter_B.icml | obtenu=oui
tailles A=35909 B=36877 | differentes=true
contenus identiques = false (doit etre false : A et B different)
A contient 'Titre A' = true
B contient 'Titre B MODIFIE' = true
A est du XML ICML (contient '<Document') = true
--- fin T1 ---
```

⇒ **la production ICML par script est acquise** : `story.exportFile(ExportFormat.INCOPY_MARKUP, fichier)` — **jamais** `document.exportFile(...)`.

### 4. T2 — activer, puis placer lié (le `Link` natif naît)

**Les 11 activations, verbatim** (les deux lignes « non booleen, laisse tel quel » sont aussi dans le log) :

```
DOC_T cree : name='Sans titre-11'
objets de preferences inspectes = 109
ACTIVATION : app.textPreferences.linkTextFilesWhenImporting : false -> true
ACTIVATION : app.xmlImportPreferences.createLinkToXML : false -> true
ACTIVATION : app.linkingPreferences.checkLinksAtOpen : true -> true
ACTIVATION : app.linkingPreferences.findMissingLinksAtOpen : true -> true
ACTIVATION : app.linkingPreferences.httpLinksAutoTagAssetsPreference : false -> true
ACTIVATION : app.pdfExportPreferences.includeHyperlinks : true -> true
ACTIVATION : app.generalPreferences.createLinksOnContentPlace : true -> true
ACTIVATION : app.galleyPreferences.blinkCursor : true -> true
ACTIVATION : doc.textPreferences.linkTextFilesWhenImporting : false -> true
ACTIVATION : doc.xmlImportPreferences.createLinkToXML : false -> true
ACTIVATION : doc.galleyPreferences.blinkCursor : true -> true
proprietes de lien effectivement activees = 11
```

⇒ le terrain est **préparé** : tout ce qui pouvait être activé pour que le lien naisse **l'est**. *(Ces deux faits — 109 objets inspectés, 11 activations — appartiennent à la **sous-section 1 de T2**, pas à T0.)*

**Le placement lié, verbatim** :

```
source ICML : existe=true | taille=35909 o | chemin=/tmp/probe_04ter_out/probe_04ter_A.icml
place(.icml) RETOUR = typeof=object constructor=function Array() { [native code] } | reflect.name=Array | valeur=[object Story]
contenu du cadre longueur = 42
contenu du cadre (200 premiers car.) = # Titre A\r\r## Sous-titre A\r\rParagraphe A.\r
--- 3. le lien existe-t-il ? ---
doc.links.length = 1
   lien[0] name='probe_04ter_A.icml' status=NORMAL linkType=InCopyMarkup filePath='/tmp/probe_04ter_out/probe_04ter_A.icml' linkResourceURI='file:/tmp/probe_04ter_out/probe_04ter_A.icml'
story.itemLink = typeof=object constructor=function Link() { [native code] } | reflect.name=Link | valeur=[object Link]
```

*(Les dumps `constructor=…` sont multi-lignes dans le log ; ils sont ici **rejoints** sur une ligne, sans altération des valeurs.)*

**Le verrou de « story lié » n'est pas exploitable ici** :

```
story.linkedStoryOptions = typeof=object constructor=function LinkedStoryOption() { [native code] } | reflect.name=LinkedStoryOption
   updateWhileSaving = (lecture KO: Cette propriété n'est pas applicable dans l'état actuel.)
   warnOnUpdateOfEditedStory = (lecture KO: Cette propriété n'est pas applicable dans l'état actuel.)
   applyStyleMappings = (lecture KO: Cette propriété n'est pas applicable dans l'état actuel.)
```

Faits dérivés (mesurés) :

- `status = NORMAL` ⇒ numérique **`1852797549`** ; `LINK_OUT_OF_DATE` ⇒ **`1819242340`** — les deux numériques sont confirmés par TEST 1 (`status lien = 1852797549` avant, `1819242340` après).
- `linkType = InCopyMarkup` ; `linkResourceURI` = **`file:/…`** (forme URI Adobe).
- `story.itemLink` **non-null** ⇒ contrairement au `.md` (où il était `(null)`), **l'ICML produit bien un `Link` natif visible**.
- Les **3** propriétés de `linkedStoryOptions` interrogées renvoient toutes « non applicable dans l'état actuel » ⇒ **l'ICML lié par `place()` n'est pas un « linked story »** au sens d'InDesign : la voie du réglage natif de mapping de styles **n'est pas ouverte par cette route**.

⇒ **la voie A « naît » par l'ICML** : le mécanisme existe. Reste à savoir **s'il sert à quelque chose**.

### 5. T3 — `update()` contre le mapping (la mesure décisive)

```
paragraphes de la story liee = 5
   p[0] style applique = 'ZZ Temoin H1' (temoin dedie, distinct des defauts)
   p[1] style applique = 'ZZ Temoin P' (temoin dedie, distinct des defauts)
   p[2] style applique = 'ZZ Temoin LI' (temoin dedie, distinct des defauts)
story.contents AVANT : longueur=42
story.contents AVANT : # Titre A\r\r## Sous-titre A\r\rParagraphe A.\r
--- 2. modification de la source liee ---
ICML A avant ecrasement : existe=true | taille=35909 o | chemin=/tmp/probe_04ter_out/probe_04ter_A.icml
ecrasement de A par le contenu de B = true
ICML A apres ecrasement : existe=true | taille=36877 o | chemin=/tmp/probe_04ter_out/probe_04ter_A.icml
A contient desormais 'Titre B MODIFIE' = true
--- 3. Link.update() ---
update() RETOUR = typeof=object constructor=function Link() { [native code] } | reflect.name=Link | valeur=[object Link]
statut du lien apres update = LINK_OUT_OF_DATE
story.contents APRES : longueur=42
releve des styles IDENTIQUE avant/apres = true
contenu IDENTIQUE avant/apres = true
nb paragraphes avant=5 apres=5
le contenu importe est bien le contenu B (reimport effectif) = false
=> update() n'a PAS reimporte le contenu : controle de fraicheur seulement, mapping intact.
```

**Lecture** : la source liée (l'ICML A) **a bien changé** sur disque (`36877 o`, contient `Titre B MODIFIE`), et pourtant :

- le **contenu affiché** dans InDesign est **inchangé** (toujours A, 42 caractères) ;
- le **mapping de styles** est **intact** (les témoins `ZZ Temoin H1/P/LI` sont toujours là) ;
- le **statut passe à `LINK_OUT_OF_DATE`** (`1819242340`).

⇒ **`update()` ne réimporte jamais le contenu : c'est un simple contrôle de fraîcheur.** Le mapping maison **survit** (bonne nouvelle), mais **la mise à jour n'a pas lieu** (mauvaise nouvelle) — c'est **exactement l'inverse** de ce dont le projet a besoin.

**Anti-tautologie** : on a vérifié que **l'ICML produit ne porte aucun style nommé** (`grep 'ZZ Temoin'` dans le fichier ICML = **vide**). Autrement dit, les styles témoins relus après `update()` ne viennent **pas** de l'ICML : ils viennent du **mapping maison resté en place** — la lecture de T3 est donc **signifiante**, pas circulaire.

### 6. Contre-épreuves (les deux résultats contre-intuitifs, rejoués proprement)

**TEST 0 — `exportFile` n'écrase pas un fichier existant** (`/tmp/test_reopen2.log`, 10:04:46)

```
TEST 0 -- exportFile ecrase-t-il un fichier EXISTANT ?
   A cree (cible effacee avant) : true | existe=true | taille=26131 o
   A contient TITRE A = true
   B cree (cible effacee avant) : true | existe=true | taille=27346 o
   export B -> A sans effacer A : ok=true
   taille A avant=26131 | taille B=27346 | taille A apres=26131
   => l'export vers un fichier EXISTANT n'a PAS ecrase : le fichier a garde son ancien contenu
```

⇒ **piège majeur** : `exportFile` **refuse silencieusement** d'écraser (`ok=true`, taille inchangée). Toute sonde doit **`remove()` la cible avant** d'exporter, et **relire le fichier produit** pour prouver l'écriture.

**TEST 2 — réouverture avec `checkLinksAtOpen = true`** (`/tmp/test_reopen2.log`, 10:04:46 — **passe retenue**)

```
TEST 2 -- reouverture, rejoue proprement
   A re-produit (cible effacee) : true | existe=true | taille=26131 o
   A contient TITRE A = true | TITRE B MODIFIE = false
   T2 : links=1 | contents longueur=42
   AVANT fermeture : contient TITRE A = true | TITRE B MODIFIE = false
   save = true | existe=true | taille=1019904 o
   ecriture de A avec le contenu de B = true | existe=true | taille=27346 o
   A contient desormais TITRE A = false | TITRE B MODIFIE = true
   checkLinksAtOpen = true
   reouvert = zz_test.indd | links=1 | stories=1
      lien[0] name=A.icml | status=1819242340 | linkType=InCopyMarkup
   story[0] longueur=42 | debut='# Titre A\r\r## Sous-titre A\r\rParagraphe A'
   story[0] contient TITRE A = true | TITRE B MODIFIE = false
   => a la REouverture, le contenu affiche reste A (PAS de mise a jour automatique)
```

**TEST 1 — `update()` sans édition préalable** (`/tmp/test_update_sans_edition.log`, 10:03:49)

```
   AVANT source B : status lien = 1852797549
   lecture de B = true | ecriture de A = true
   A contient desormais TITRE B MODIFIE = true
   update() execute sans erreur
   APRES update : contient TITRE A = true | contient TITRE B MODIFIE = false
   APRES update : status lien = 1819242340
   => update() n'a PAS recharge le contenu, meme sans edition prealable
```

⇒ **ni `update()`, ni la réouverture ne rechargent le contenu.** Le lien natif surveille **l'ICML**, **pas** notre `.md`, et **ne déclenche aucune mise à jour** du texte.

**TEST 2 ANNULÉ — la fausse « mise à jour automatique »** (`/tmp/test_update_sans_edition.log`, 10:03:49)

Le **second** TEST 2 de ce journal conclut : `=> a la REouverture, InDesign a applique le contenu B (mise a jour automatique)`. **Cette conclusion est annulée**, et le journal le porte lui-même :

```
   ICML A re-produit : true | existe=true | taille=27346 o
   T2 : doc cree | links=1 | contents longueur=66
   AVANT fermeture : longueur=66 | debut='# Titre B MODIFIE\r\r## Sous-titre B MODIF'
   AVANT fermeture : contient TITRE A = false | contient TITRE B MODIFIE = true
```

Le document est **créé après** que la source A contient déjà B (`contenu longueur=66`, `debut='# Titre B MODIFIE'`) : il n'y a **rien à recharger** — le texte est B **avant** la fermeture. Le test **ne mesurait donc rien** (il vérifiait que B est B). La passe **propre** (TEST 2 de `test_reopen2.log`) fait l'inverse : le document est enregistré **avec A**, **puis** la source est écrasée par B — c'est seulement alors que la non-mise-à-jour a un sens. C'est la passe propre qui fait foi : **contenu affiché = A, statut = `1819242340`**.

*(Motif de la contamination : la source A avait été écrasée **avant** l'ouverture du document — l'ordre des opérations rendait la conclusion tautologique. Repéré et rejoué, pas dissimulé.)*

### 7. Les trois pièges d'API (consignés au wiki — Cas 39 et Cas 40)

1. **`exportFile` n'écrase jamais un fichier existant** — silencieux, `ok=true`. ⇒ **`remove()` d'abord**, puis **lire le fichier produit** pour prouver l'écriture.
2. **Le porteur décide** : `document.exportFile(INCOPY_MARKUP)` est **refusé** ; `story.exportFile(INCOPY_MARKUP)` **marche**. Idem pour la **destination** : `/tmp` est un **lien symbolique** vers `/private/tmp` — écrire à la racine `/tmp` échoue ; un **vrai sous-dossier** (`/tmp/probe_04ter_out/x.icml`) fonctionne.
3. **Exécution non interactive** : `alert` est **en lecture seule** (`shadow alert KO : alert is read only`) — **on ne peut pas la neutraliser** ; `confirm` **peut** l'être (`fonctions neutralisees = confirm`). Le canal d'exécution **fiable** est un **`.jsx` temporaire** évalué par `$.evalFile` — une chaîne inline avec guillemets imbriqués **casse** `do script`.

### 8. Verdict

| Question | Réponse mesurée |
|---|---|
| Un `Link` natif naît-il par l'ICML ? | **OUI** (`place(.icml)` → 1 lien `InCopyMarkup`, `story.itemLink` non-null). |
| Ce lien surveille-t-il notre `.md` ? | **NON** — il surveille **l'ICML** ; le `.md` lui-même ne porte aucun lien (`04bis`). |
| `update()` réimporte-t-il le contenu ? | **NON** — **contrôle de fraîcheur seulement** (contenu identique, statut → `LINK_OUT_OF_DATE`). |
| La réouverture recharge-t-elle ? | **NON** (`checkLinksAtOpen = true` ⇒ contenu inchangé). |
| Notre mapping de styles survit-il ? | **OUI** — mais précisément parce que **rien n'est réimporté** (ce n'est pas un mérite du lien). |
| L'ICML porte-t-il nos styles nommés ? | **NON** (`grep 'ZZ Temoin'` dans l'ICML = vide). |

**⇒ La voie A (lien natif) ÉCHOUE pour notre besoin** : elle exige de **lier un intermédiaire** (l'ICML) qui n'est **pas** notre source, ne **contient pas** nos styles, et **ne se met jamais à jour**. Elle ne peut donc **pas** répondre à la seule promesse utile du projet — « relancer / rafraîchir le pipeline après modification du `.md` ».

**DÉCISION ACTÉE — BIFURCATION VERS LA VOIE B** : **empreinte maison du `.md` en métadonnées du document** (détection de changement sans dépendre d'un mécanisme `Link`). C'est la bifurcation que FJD avait **pré-annoncée** avant la mesure (« si ça ne fonctionne pas, on bifurque »).

### 9. Critères de sortie (état)

1. **5 points de l'objectif adossés à un journal brut** → **✅ SATISFAIT**.
2. **Cas wiki 37 mis à jour** → **✅ SATISFAIT** (`sourcé` → `mixte`, faits `04bis` + `04ter`).
3. **Verdict explicite + bifurcation actée** → **✅ SATISFAIT** (voie A écartée, voie B actée ci-dessus).
4. **Pièges d'API consignés** → **✅ SATISFAIT** (Cas 39, Cas 40 créés au wiki).

**Aucun point ouvert.** La mission est **terminée** ; la suite (voie B) relève d'une **nouvelle mission**.

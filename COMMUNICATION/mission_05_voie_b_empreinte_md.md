# Mission 05 — Voie B : empreinte maison du `.md` en métadonnées du document (déclencheur de re-import)

**Statut** : 🟡 PARTIELLE — exécutée par **DS** le **29/09/2026** (V1/V2/V3 + non-régression **mesurés en réel** : 22/22 simulation, 38/38 sonde jetable, 50/50 sonde d'intégration sur le vrai `import_md.jsx`) ; reste à confirmer par FJD la **boîte annulable sous un clic humain réel (V4)** (cf. CR en fin de mission).
**Position** : **implémentation de la feature** — c'est la sortie naturelle de la mission 04, dont le **go/no-go est prononcé** : *voie A écartée par mesure ⇒ bifurcation vers la voie B*.
**Amont** : [mission_04_audit_lien_dynamique.md](mission_04_audit_lien_dynamique.md) (audit + entonnoir), [mission_04bis_sonde_lien_runtime.md](mission_04bis_sonde_lien_runtime.md) et [mission_04ter_sonde_icml.md](mission_04ter_sonde_icml.md) (les deux sondes qui ont produit le verdict).
**Rappel de gouvernance** : l'exécuteur (DS/Ouvrier) **ne commit pas, ne pousse pas** ; le CR se rédige **dans le corps de cette mission** (preuve inline), jamais dans un fichier `cr_*.md` séparé.

## Pourquoi cette mission existe — le verdict qui la fonde (clos par mesure)

La voie A (« lien natif ») a été **écartée par la mesure**, pas par opinion :

1. **Le `.md` ne peut pas porter de `Link`.** `place()` d'un `.md` rend `doc.links.length = 0` et `parentStory.itemLink = (null)` ; `createTextFragmentLink()` échoue **11 essais sur 11** vers un `.md`.
2. **L'ICML, lui, porte un lien — mais ne sert à rien.** `story.exportFile(ExportFormat.INCOPY_MARKUP, file)` puis `place(.icml)` produit bien `doc.links.length = 1` (`linkType = InCopyMarkup`) ; sauf que (a) le lien surveille **l'ICML**, jamais le `.md` ; (b) `Link.update()` **ne recharge pas** le contenu (contrôle de fraîcheur seulement : `statut du lien apres update = LINK_OUT_OF_DATE` alors que la story est identique avant/après, **relevé des styles identique = true**) ; (c) à la **réouverture**, le contenu affiché **reste l'ancien** (`story[0] contient TITRE A = true | TITRE B MODIFIE = false`) ; (d) l'ICML **ne porte aucun style de paragraphe nommé** (contrôle `ZZ Temoin` → 0 occurrence) ⇒ il **ne protège pas le mapping maison**.

⇒ Conclusion : **aucune voie native ne surveille notre `.md` et ne protège notre mapping.** La **voie B** (mécanisme maison) n'est donc plus un repli prudent : elle est **la seule voie qui satisfait le besoin**, et elle est **disponible sans condition** (ExtendScript pur, aucune API incertaine).

## Objectif — la chaîne à implémenter

Le besoin de FJD, formule d'origine : *« qu'InDesign détecte quand le `.md` source a changé, et qu'un clic relance notre pipeline complet (reparsing + mapping), pas juste un import brut. »*

La voie B s'y décompose en **quatre temps**, chacun mesurable :

| # | Temps | Contenu attendu | Ce qui le prouve |
|---|---|---|---|
| **V1** | **Empreinte** | Calculer une empreinte de la source au moment de l'import | Une empreinte imprimée au log pour un fichier donné, recalculée à l'identique sur un fichier inchangé |
| **V2** | **Persistance** | Stocker l'empreinte **dans le document**, à côté du mapping | `doc.extractLabel(...)` renvoie l'empreinte après **fermeture + réouverture** du document |
| **V3** | **Comparaison** | À l'ouverture/lancement, comparer empreinte stockée et empreinte recalculée ⇒ **3 états** : identique / différent / source absente | Les 3 états provoqués réellement, chacun tracé |
| **V4** | **Réaction** | Sur état « différent » : **alerter en boîte de dialogue** (annulable) puis, sur acceptation, **relancer notre pipeline complet** | Le pipeline relancé par l'utilisateur, mapping recalculé, log nominatif |

**Ce que la voie B ne prétend pas faire** : elle **ne sait pas *quoi* a changé**. Savoir *ce qui* a changé (quel bloc, quel titre, quelle table) est un besoin **distinct** qui n'est pas couvert par une empreinte — le traiter ici serait de l'anticipation. Il est **nommé** ci-dessous et **hors périmètre**.

## Hypothèse initiale (Architecte) — à VÉRIFIER par lecture réelle avant de coder

> **Règle de travail** : l'Architecte pose l'hypothèse, l'exécuteur la **vérifie par lecture réelle du code et de la doc** avant d'écrire une ligne. Une hypothèse non vérifiée **ne se code pas**.

L'hypothèse est de **réutiliser exactement le mécanisme déjà éprouvé** de persistance du mapping, plutôt que d'ouvrir un chantier nouveau :

- `import_md.jsx` définit `var LABEL_NAME = "md-style-map";` (ligne 10) ;
- la persistance passe par **`doc.extractLabel(LABEL_NAME)`** / **`doc.insertLabel(LABEL_NAME, value)`** (fonctions `loadMappingFromDocument()` ligne 845 et `saveMappingToDocument()` ligne 863) ;
- la valeur est sérialisée par `serializeFlatMapping()` (ligne 65) et relue par `deserializeFlatMapping()` (ligne 77) — un **format plat**, contraint par ExtendScript **ES3** (pas de `JSON` global).

⇒ **Hypothèse V2** : l'empreinte s'écrit dans un **second label** (nom à fixer, p. ex. `md-source-fingerprint`), **sans toucher** au label `md-style-map` existant — la séparation évite qu'un mapping corrompu emporte l'empreinte et vice-versa. `insertLabel()` **écrase** la valeur pour la clé (commentaire du code : « pas besoin de chercher/supprimer un label précédent ») ⇒ pas de gestion de doublons.

⇒ **Hypothèse V1** : l'empreinte ne peut pas être un hash cryptographique. En **ES3**, pas de `JSON`, pas de crypto : candidats = **taille** (`File.length`), **date de modification** (`File.modified`), et/ou une **somme de contrôle simple** (accumulation de codes de caractères modulo un entier) calculée en lisant le fichier caractère par caractère. À l'exécuteur de **vérifier** ce que `File` expose réellement au runtime et de **trancher la robustesse** : la date de modification seule est **fragile** (copie, restauration de sauvegarde, `touch`), la taille seule l'est plus encore (deux fichiers de même taille sont indiscernables).

## Questions à instruire (aucune n'est tranchée d'avance)

1. **Quelle empreinte est réellement robuste en ES3 ?** Lire `File` (`length`, `modified`, `encoding`), décider si une somme de contrôle maison est nécessaire, et **mesurer** la sensibilité : modifier le `.md` d'**un seul caractère** doit changer l'empreinte, le rouvrir sans le modifier ne doit **pas** la changer. *(Attention : `File.modified` dépend de l'horloge et du système de fichiers — le contrôle de sensibilité doit être fait en réel, pas déduit.)*
2. **Où est le point d'accroche de la comparaison ?** Les candidats sont le **lancement du script**, l'**ouverture du document** (`afterOpen` — à vérifier : la disponibilité d'un gestionnaire d'événement d'ouverture en ExtendScript classique), ou l'**entrée de menu** déjà créée à l'étape 9 de la mission 03. La question n'est pas « quelle est la plus élégante » mais **laquelle est réellement atteignable** au runtime.
3. **Que faire de l'état « source absente »** (`.md` supprimé ou chemin invalide) ? Aujourd'hui, un chemin mort échouerait probablement dans le pipeline : décider d'un comportement **explicite** et tracé, plutôt que d'un échec silencieux.
4. **Que stocke-t-on exactement du chemin de la source ?** Un **chemin absolu** est fragile (document déplacé, autre poste, Windows vs macOS) ; le préambule cross-platform de la mission 04 est **directement pertinent** ici. Décider, et **écrire la raison**.
5. **Le format plat de `serializeFlatMapping` accepte-t-il la valeur d'empreinte sans ambiguïté ?** Vérifier que le séparateur utilisé n'entre pas en collision avec le contenu de l'empreinte (sinon : échappement ou format dédié).

## Méthode de travail imposée

- **Lire avant d'écrire.** Aucune hypothèse de ce document ne se code sans vérification réelle.
- **Simulation Node d'abord** (comme pour la mission 03), **test réel InDesign ensuite**, dans cet ordre — la simulation attrape la syntaxe et la logique, le réel attrape l'API.
- **Instance InDesign neuve, script lancé depuis le Scripts Panel** (jamais le fichier de travail — piège des deux copies, cf. wiki), **log fichier horodaté**, **`catch` vide interdit**.
- **Contrôle négatif obligatoire** : un test qui ne peut pas échouer ne prouve rien. Pour chaque affirmation (l'empreinte change / ne change pas, l'alerte apparaît / n'apparaît pas), produire le cas où **l'inverse** serait attendu et vérifier que le système ne se trompe pas.
- **Une sonde jetable est préférable à une modification prématurée** de `import_md.jsx` : l'étape 9 de la mission 03 a montré qu'un livrable qui touche au pipeline se teste mieux isolé d'abord.
- **Ne pas réapprendre les pièges déjà au wiki** (cf. section suivante) : les lire **avant**, pas après l'échec.

## Pièges déjà payés — à lire AVANT de coder (wiki)

- **Cas 40** — `alert` **ET** `confirm` sont **tous deux en lecture seule** : `confirm` est **refusé en écriture** (`REFUSE : confirm is read only`, **8 tentatives dans 4 contextes**, mesure du 29/09/2026). La version antérieure de ce piège (« `confirm` est écrasable ⇒ toute sonde non interactive doit passer par `confirm` ») était **fausse** et a été **corrigée au wiki** par la mission 05. ⇒ **ne jamais fonder la testabilité sur l'écrasement d'un global** : faire passer toute boîte par une **variable possédée par le projet** (`demanderConfirmation…`) que la sonde remplace. Corollaire inchangé : **les guillemets imbriqués dans un `do script` inline échouent** ⇒ écrire un `.jsx` temporaire et l'évaluer avec `$.evalFile`.
- **Cas 43** — un document créé par script n'a **ni story ni textFrame** (`stories=0 | textFrames=0 | pages=1`) et l'erreur « Object is invalid » est signalée **une ligne trop tard** ⇒ ne pas déduire la cause de la ligne indiquée.
- **Cas 42** — un GREP ne pose **qu'un seul** style de paragraphe par requête ⇒ si une relance du pipeline doit reposer des styles, **N niveaux ⇒ N passes**.
- **Cas 39** — `exportFile` **n'écrase jamais** un fichier existant, silencieusement (`ok=true`, taille inchangée) ; si une sonde réexporte, `remove()` d'abord **puis asserter le contenu produit** (et se méfier du lien symbolique `/tmp` → `/private/tmp`).
- **Cas 37** — le modèle d'objet `Link` : **corrigé par la mesure** (`createTextFragmentLink()` vers un `.md` : échec 11/11). Ne pas relire la version d'origine du cas sans vérifier qu'elle porte bien la correction.

## Critère de sortie

- **V1** : l'empreinte d'un `.md` donné est **reproductible** (deux lectures d'un fichier inchangé ⇒ empreinte identique) et **sensible** (une modification d'un caractère ⇒ empreinte différente) — **les deux**, mesurées.
- **V2** : l'empreinte survit à une **fermeture puis réouverture** du document, relue par `extractLabel`.
- **V3** : les **3 états** (identique / différent / source absente) sont produits **en réel**, chacun avec sa ligne de log.
- **V4** : sur état « différent », une **boîte de dialogue annulable** apparaît, et l'acceptation **relance le pipeline complet** — vérifié sur un vrai document, pas en simulation.
- **Non-régression** : le mapping existant (label `md-style-map`) est **intact** — contrôle avant/après obligatoire (l'ajout d'un second label ne doit rien casser).
- **Wiki** : tout fait d'API nouveau rencontré est **enregistré au wiki dans le même tour** (cas créé ou cas enrichi), statut source honnête (`sourcé` / `mesuré` / `à sourcer`).

## Hors périmètre (explicite)

- **Le bot (axe 2 de la mission 04) : mis de côté, différé, réservé.** Décision FJD du 29/09/2026. Il n'est **pas** requis pour « relancer le pipeline après modification du `.md` » — il ne le devient que pour les cas d'usage qui exigent d'agir **dans** InDesign (GREP sur scopes resserrés, lecture de gabarits PDF de couvertures, messages de suivi de fabrication). **Aucun pont** (UXP-réseau, `app.doScript()` depuis UXP, polling fichier, CEP) n'est instruit par cette mission.
- **Le calcul du *diff* sémantique** (« *quoi* a changé ») : nommé comme besoin distinct, **non traité**.
- **UXP** — hors périmètre.
- **InCopy** — **n'est pas une cible** (décision FJD, mission 04ter) ; l'`.icml` n'était qu'un vecteur de test, désormais clos.
- **La voie A** — close par mesure, ne se rouvre pas sans fait nouveau.
- **La réécriture du mapping** ou de `insertMarkdownWithStyles` — la mission ajoute le **déclencheur**, elle ne refait pas le pipeline.

## Cas wiki consultés / à produire

**Cas wiki consultés** : Cas 36 (point d'entrée menu), Cas 37 (modèle d'objet `Link`, règle corrigée par mesure), Cas 39 (`exportFile` n'écrase pas), Cas 40 (sonde sans interaction), Cas 42 (un style par requête GREP), Cas 43 (document créé par script).
**Cas wiki produits/enrichis** (mission 05, 29/09/2026 — tous **`mesuré`**) : **Cas 44** créé (`extractLabel`/`insertLabel` : label absent ⇒ `''` et `typeof="string"`, réécriture sous la même clé ⇒ **écrasement**, label de **4000** caractères relu intégralement, survie à fermeture + réouverture) · **Cas 45** créé (`File.modified` **ne bouge pas** quand le contenu change dans la même seconde, `File.length` inchangé, `File.read()` **normalise les fins de ligne en LF**, `File.write()` **écrit CRLF → CR**) · **Cas 46** créé (`doc.save()` refuse `/tmp` **et** `/private/tmp`, `saveAs` **n'existe pas**, seule **`Folder.temp`** marche) · **Cas 40 corrigé** (`confirm` **n'est pas** écrasable). Décompte du wiki : **42 → 45 cas** (1411 → 1565 lignes).

---

## CR — Mission 05 · Voie B (exécutée par DS, 29/09/2026)

**Exécuteur** : **DS**, nommé par FJD le 29/09/2026 (« tu exécutes Mission 5 »). L'Architecte n'a **pas** eu d'exception.
**Ordre de travail respecté** : lire avant écrire → **simulation Node** → **sonde jetable réelle** (`import_md.jsx` non touché) → **intégration** → **sonde d'intégration sur le vrai fichier**.

### 1. Livrables

| # | Fichier | Nature | Résultat brut |
|---|---|---|---|
| 1 | `tools/sim_05_empreinte.js` | simulation Node (logique + syntaxe) | `=== RESULTAT : 22/22 verifications OK, 0 echec(s) ===` |
| 2 | `tools/probe_05_empreinte.jsx` | **sonde jetable** réelle, `import_md.jsx` non touché | `=== RESULTAT : 38/38 controles OK, 0 echec(s) ===` |
| 3 | `import_md.jsx` | **intégration** — 6 modifications + 1 réparation | 2839 → **3089** lignes (+250) |
| 4 | `tools/probe_05ter_integration.jsx` | sonde d'**intégration** : charge le **VRAI** `import_md.jsx` | `=== RESULTAT : 50/50 controles OK, 0 echec(s) ===` |
| 5 | `doc/wiki_extendscript_indesign.md` | Cas **44**, **45**, **46** créés ; **Cas 40 corrigé** | 1411 → **1565** lignes, **45 cas** |

> La sonde 4 ne recopie **aucune** fonction : elle coupe la queue du vrai fichier (`indexOf("// Exécuter le script")`), évalue le reste par `$.evalFile` et exerce **ses** fonctions. Deux contrôles négatifs y prouvent que la coupe a bien retiré `main();`.

### 2. V1 — empreinte **reproductible** ET **sensible** (les deux)

Mesuré sur un `.md` réel de 60 caractères (`/private/tmp/probe_05_empreinte.log`) :

```
lecture 1 : existe=true | taille=60 | dateMs=1790691560000 | somme=1565744833 | longueurLue=60
lecture 2 : existe=true | taille=60 | dateMs=1790691560000 | somme=1565744833 | longueurLue=60
  OK   V1 reproductible : 2 lectures d'un fichier intact => taille identique | attendu=60 | obtenu=60
apres 1 caractere change ('e'->'a') : existe=true | taille=60 | dateMs=1790691560000 | somme=1565740989 | longueurLue=60
  OK   V1 sensible : 1 caractere change => taille INCHANGEE (piege confirme) | attendu=60 | obtenu=60
```

⇒ reproductible (`1565744833` deux fois) **et** sensible (`1565744833 → 1565740989`). Le **contrôle négatif** est ici décisif : la **taille n'a pas bougé** (60 → 60) **et la date non plus** (`dateMs` identique) — un test fondé sur l'une ou l'autre **échouerait sur ce cas**. C'est ce qui rend la mesure probante.

Contre-épreuve menée sur le **code intégré** (sonde 05ter) : contenu A → contenu B (un caractère changé, **même longueur**) → **somme différente** ; retour au contenu A → **somme d'origine retrouvée**.

### 3. V2 — persistance du label

```
label 'md-style-map' longueur=42 relu={"h1":"Titre 1","p":"Paragraphe standard"}
label 'md-source-fingerprint' longueur=100 relu={"v":"1","size":"60","modified":"1790691560000","checksum":"1565740989","name":"probe_05_source.md"}
label de 4000 caracteres : longueur relue=4000
  OK   V2 un label de 4000 caracteres survit integralement | attendu=4000 | obtenu=4000
document enregistre : /var/folders/2h/t8bqzrc94d3__q93mbhds67w0000gn/T/probe_05_doc.indd | existe=true | taille=995328
document ferme
APRES reouverture — empreinte : {"v":"1","size":"60","modified":"1790691560000","checksum":"1565740989","name":"probe_05_source.md"}
APRES reouverture — mapping   : {"h1":"Titre 1","p":"Paragraphe standard"}
  OK   V2 l'empreinte survit a fermeture+reouverture
  OK   NON-REGRESSION : md-style-map intact | attendu={"h1":"Titre 1","p":"Paragraphe standard"} | obtenu={"h1":"Titre 1","p":"Paragraphe standard"}
```

⇒ l'empreinte vit dans un **second label** (`md-source-fingerprint`), **sans toucher** à `md-style-map`, et survit à **fermeture + réouverture**.

### 4. V3 — les états, provoqués EN RÉEL

```
etat A (source modifiee depuis l'import)        = different        OK
etat B (source intacte, empreinte re-ecrite)    = identique        OK
etat C (source absente)                         = source_absente   OK
etat D (document jamais importe)                = jamais_importe   OK
```

Les **3 états** du critère de sortie sont couverts ; un **4ᵉ** a été ajouté parce que le besoin l'impose : `extractLabel` sur un label **absent** rend `''` (cf. §7), donc **sans `jamais_importe`** un document jamais importé serait confondu avec une **source absente**.

### 5. V4 — réaction : boîte annulable puis relance du pipeline

Mesuré sur le **code réellement intégré**, avec un **vrai document** (sonde 05ter, section 4) :

- sur `different`, la boîte est appelée **exactement 2 fois**, avec le message attendu ;
- **accepter** ⇒ `relance = true` **et** le chemin de relance est le **chemin stocké** ;
- **refuser** ⇒ `relance = false`, `return` sec : **rien n'est touché** ;
- sur `source_absente` ⇒ **aucune relance automatique**, **une seule** alerte, message nommant le chemin manquant.

**Réserve déclarée (V4)** — La boîte a été **détournée via la variable du projet** (`demanderConfirmationM05`), **pas** observée sous un **clic humain** : conséquence directe du §8. Le **côté pile** (branches, relance, non-destructivité) est **prouvé** ; **l'apparence et l'annulabilité de la boîte devant un vrai utilisateur** restent à **confirmer par FJD** sur un document réel. **C'est la seule case que l'exécuteur ne coche pas.**

### 6. Les 5 questions de la mission — réponses instruites

| # | Question | Réponse (mesurée / vérifiée) |
|---|---|---|
| 1 | Empreinte robuste en ES3 ? | **Somme de contrôle maison** (`somme = (somme*31 + code) % 2147483647`, borne < 2³¹ pour rester exact en entier ExtendScript) **+ taille en garde-fou**. `File.modified` **mesurée non fiable** ⇒ stockée pour le **diagnostic**, **écartée de la décision**. |
| 2 | Point d'accroche ? | L'**entrée de menu** : `import_md_menu.jsx` est rechargé en fin de script, donc un clic ré-exécute **exactement `main()`** ⇒ vérification placée **au début de `main()`**. `Event.AFTER_OPEN` est bien **enregistrable et retirable** (`eventListeners` : 9 → 10 → 9) mais **non retenu** : rien ne garantit quel document sera visé à l'ouverture. |
| 3 | État « source absente » ? | Comportement **explicite et NON destructif** : un `alertUser` qui **nomme le chemin manquant**, **aucune** relance automatique, aucun mapping touché. Pas d'échec silencieux. |
| 4 | Que stocker du chemin ? | **Chemin absolu** (`File.fsName`). Raison écrite dans le code : c'est le **seul** moyen de retrouver la source sans repasser par un sélecteur de fichier (`File.openDialog` **n'accepte aucun chemin par défaut** en ExtendScript — mesuré). Risque assumé (document déplacé, autre poste) ⇒ **neutralisé par l'état `source_absente`**, explicite et non destructif. |
| 5 | Le format plat accepte-t-il la valeur ? | **Sans objet** : le sérialiseur **échappe déjà** `\` et `"`. Aller-retour **contre-éprouvé** avec un chemin contenant `"` : il **survit**. |

### 7. Fait mesuré nouveau — `extractLabel` sur un label absent

```
extractLabel sur label ABSENT -> typeof=string | valeur=''
```

⇒ **chaîne vide**, pas `null`, pas `undefined`, **aucune exception**. Conséquence appliquée : la détection d'un label absent teste la **valeur vide** (`if (!brut)`), **jamais** `null`.

### 8. Contradiction mesurée — le Cas 40 du wiki était FAUX sur `confirm` (corrigé dans ce tour)

Le wiki affirmait *« `alert` est en lecture seule, `confirm` est écrasable »*, et **la présente mission reprenait cette consigne** (*« toute sonde non interactive doit passer par `confirm` »*). **Mesure** : `confirm` est **refusé en écriture** dans **tous** les contextes testés.

```
A  evalFile + niveau superieur : REFUSE : confirm is read only    (sentinelle REELLEMENT vue = false)
B  evalFile + fonction imbriquee : REFUSE : confirm is read only  (sentinelle REELLEMENT vue = false)
C  inline + niveau superieur : REFUSE : confirm is read only      (sentinelle REELLEMENT vue = false)
D  inline + fonction imbriquee : REFUSE : confirm is read only    (sentinelle REELLEMENT vue = false)
etat final : confirm est redevenu natif = true
```

(`/private/tmp/matrix_inline.log`, `/private/tmp/matrix_evalfile.log`) — **4 contextes × 2 formes** (`confirm = f`, `$.global.confirm = f`) = **8 tentatives, 8 refus** ; **34** occurrences de `confirm is read only` dans les journaux du jour. État final : `confirm natif = true | alert natif = true`.

**Origine de la croyance fausse** — `/private/tmp/run_04ter.log` porte `shadow alert KO : alert is read only` puis `fonctions neutralisees = confirm` : cette ligne n'atteste que le fait que la **pile a été atteinte**, **pas** que la boîte a été neutralisée. **Corroboration décisive** — le même journal indique `duree ms = 46106` (**46 s**) pour une sonde contenant **5 appels `alert()`** (`tools/probe_04ter_icml.jsx` l. 690, 701, 744, 758, 763) : les boîtes **se sont ouvertes**, rien n'était neutralisé, et les 46 s sont des **clics humains**.

**Réserve honnête** — deux relevés antérieurs du **même jour** affichent `SANS ERREUR` (`/private/tmp/ctx_props.log`, `/private/tmp/ctx_shadow.log`) ; **je ne prétends pas expliquer cette contradiction** (la portée d'affectation d'un global natif en ExtendScript reste **non élucidée** ici). **Je n'ai retenu que le fait reproductible : le REFUS.**

**Conséquence appliquée** — plus aucune boîte ne dépend d'un global : `import_md.jsx` définit `var demanderConfirmationM05 = function (message) { return confirm(message, false, SCRIPT_NAME); };` et la sonde remplace **cette variable**, pas le global. C'est **ce qui rend la branche « refuser » testable** — sans quoi **V4 aurait été intraçable**.

**Correction portée au wiki dans ce même tour** : titre, symptôme, cause, « Ce que dit la doc », solution (+2 règles) **et toutes les ancres** (catalogue + index par thème + index par symptôme) du **Cas 40**.

### 9. Contrôle négatif (exigé par la mission)

Trois contrôles négatifs, tous **passés** :

1. **V1** : « un caractère change » laisse **taille ET date identiques** ⇒ un test fondé sur l'une ou l'autre **échouerait ici** : c'est bien le **contenu** qui est mesuré.
2. **Format / V2** : le mapping historique relu comme empreinte rend **`null`** (jamais confondu) ; une empreinte **sans clé `v`** est **refusée** ; un label **absent** ne fait lever **aucune** exception.
3. **Propreté de la sonde** : `nombre de documents revenu a l'etat d'entree | attendu=1` et `[negatif] le document de l'utilisateur n'a pas ete ferme | attendu=1`.

### 10. Non-régression

`md-style-map` vérifié **intact** à **chaque** étape de la sonde d'intégration (avant écriture, après écriture de l'empreinte, après écrasement, après nettoyage). **Aucun** document de FJD fermé ; compteur de documents rendu à sa valeur d'entrée.

### 11. Hygiène

- **Aucun `catch` vide** : le `catch` vide que **j'avais introduit** dans `m05BuildFingerprint` (double échec : lecture **puis** fermeture) a été **réparé** en `catch` journalisant (`M05-empreinte: fermeture apres echec de lecture a echoue : …`). Les **10** `catch` vides restants de `import_md.jsx` (l. 1618, 1630, 1639, 1641, 1643, 2369, 2373, 2467, 2468, 2488) sont **antérieurs** à la mission, **signalés mais non touchés** (hors périmètre).
- **Encodage** : `grep -c $'\xef\xbf\xbd'` = **0** sur les fichiers touchés.
- **Réserve de mesure** : l'écriture de l'empreinte à la branche « gun » (`.md` remis au place gun) est une **approximation assumée** — la pose par clic de FJD est **invisible au script** ; le commentaire du code le dit.

### 12. Ce que je n'ai PAS fait (et pourquoi)

- **Aucun commit, aucun push** (interdit à l'exécuteur).
- **Voie A, bot / axe 2, diff sémantique, UXP, InCopy : non rouverts.**
- **Le pipeline n'a pas été réécrit** : la mission ajoute le **déclencheur** ; `insertMarkdownWithStyles` et le mapping sont **inchangés** (les **+250** lignes sont des **ajouts**, aucune ligne de pipeline réécrite).
- **V4 sous clic humain** : **non exécuté par l'exécuteur** ⇒ **réserve déclarée** (§5).

### TERMINÉE ? — décision à FJD

V1, V2, V3, la non-régression et le mécanisme de V4 sont **mesurés en réel** (22/22, 38/38, 50/50) et l'intégration est **en place**, mais **la boîte annulable sous un clic humain réel n'a pas été vue par l'exécuteur**. D'où le statut **🟡 PARTIELLE** : le critère de sortie V4 n'est satisfait qu'au **mécanisme**, pas à l'**observation humaine**. **À FJD de trancher** : valider V4 visuellement (ce qui clôt la mission) ou exiger une mesure supplémentaire.

## Note d'architecture — la mission ne démarre pas sans exécuteur

Règle structurelle inscrite le 28/09/2026 (mission 04) : **aucune mission pilotée par l'Architecte ne porte un livrable de code sans exécuteur nommé**. Cette mission **porte un livrable de code** (`import_md.jsx` probablement modifié + sonde(s) jetable(s)) ⇒ elle reste **🔴 À FAIRE** jusqu'à ce que FJD **nomme l'exécuteur** (DS, comme pour les sondes 04bis/04ter) ou **autorise explicitement une exception** pour l'Architecte.

**Question ouverte à FJD** : qui écrit cette mission ?

**Réponse (FJD, 29/09/2026, même jour)** : l'exécuteur est **DS** (« tu exécutes Mission 5 »). La mission sort donc de l'attente d'exécuteur, **sans exception** au profit de l'Architecte. CR en fin de document, dans ce même tour.

# Wiki ExtendScript / InDesign — Base de connaissance des cas rencontrés

But : capitaliser les pièges API ExtendScript/InDesign découverts en pratique sur ce projet (et futurs projets InDesign), pour ne plus les redécouvrir à chaque script. Alimenté au fil des bugs rencontrés, pas une doc théorique.

## Méthode générale — développement fiable d'un script ExtendScript/InDesign (validée le 23/09/2026)

Constat FJD après plusieurs itérations correctif → test manuel → nouveau bug sur le module gras/italique : deviner l'API par déduction du message d'erreur suffit pour des erreurs de syntaxe simples (mot réservé, méthode absente), mais pas pour un modèle de données stateful comme le texte InDesign (`Story`/`Paragraphs`/`InsertionPoint`), où une hypothèse fausse en remplace facilement une autre sans que rien ne le signale avant le test suivant. Cette méthode a ensuite permis d'ajouter une fonctionnalité entièrement nouvelle (support des tableaux Markdown, jamais fait avant sur ce projet) qui a fonctionné au tout premier essai réel — la meilleure preuve de sa valeur.

### Les 5 réflexes, dans l'ordre

**1. Vérifier la documentation officielle avant de coder une hypothèse — et laisser une trace citable, pas juste "vérifié via doc".**
Ne jamais supposer qu'une API InDesign se comporte comme son équivalent JS générique le laisserait penser (`+=` sur un `InsertionPoint` n'est pas garanti se comporter comme `+=` sur une chaîne JS — cf. Cas 14). Chercher un exemple de code fonctionnel dans la doc officielle (indesignjs.de/extendscriptAPI) ou les forums Adobe/Indiscripts, pas seulement la signature de la méthode. Un exemple réel vaut mieux qu'une description abstraite de paramètres.

Décision FJD (23/09/2026) sur la manière de capitaliser cette doc : pas de RAG ni d'indexation séparée de la doc Adobe (disproportionné pour ce projet) — chaque vérification documentaire qui aboutit à un cas du wiki doit inclure la **citation exacte** trouvée (pas une paraphrase) et l'**URL source**, directement dans l'entrée du cas concerné. Le wiki devient ainsi une doc Adobe filtrée par l'usage réel du projet, sans infrastructure à maintenir.

**Format de la trace à reproduire systématiquement** — quand la citation exacte a été retrouvée et vérifiée :
> « `<citation verbatim>` » — *source* : `<URL>` (HTTP 200, consultée le JJ/MM/AAAA)

Voir les cas dont la source a été vérifiée HTTP 200 au 28/09/2026 (ex. Cas 01, 19, 26, 31). Quand la citation d'origine n'a PAS pu être retrouvée, ne jamais la reformuler de mémoire : le cas porte alors une mention honnête de repli (voir le champ **Statut source** du gabarit ci-dessous) — c'est le cas notamment de Cas 09, 14 et 17.

**2. Extraire la logique pure dans un script Node autonome, hors ExtendScript.**
Le parsing (Markdown → blocs), les calculs de position, la logique de décision — tout ce qui ne dépend pas directement du DOM InDesign — se teste en JS standard, avec `node --check` pour la syntaxe et des scripts d'exécution réels pour le comportement.

**3. Simuler le comportement InDesign pertinent quand la logique touche son modèle de données.**
Ex. `Story` comme une chaîne + split sur `\r` pour représenter `paragraphs`. Vérifier que les positions/plages calculées restent dans les bornes attendues. Toujours tester sur un **fichier réel fourni par l'utilisateur**, jamais seulement un cas jouet minimal — un cas jouet peut passer à côté d'un caractère Unicode composé, d'une structure de document particulière, etc. (cf. Cas 12, où le premier test avait raté ce problème).

**4. Journaliser systématiquement, dès le départ, pas après coup.**
Tout script ExtendScript sur ce poste doit inclure un pattern de logging fichier (`logError()`/`logToFile()`, cf. Cas 08 du wiki) avant même d'écrire la logique métier. Ça évite de dépendre d'un screenshot pour diagnostiquer, et ça révèle les erreurs qui seraient sinon avalées par un `catch` vide.

**5. Ne redemander un test réel qu'après que la simulation ne remonte plus d'erreur — et rester honnête sur les limites de cette simulation.**
Une simulation ne vaut que ce qu'elle modélise : si elle utilise les mêmes primitives biaisées que le code réel (ex. `String.length` pour un comptage qu'InDesign fait différemment), elle validera un bug à tort (cf. Cas 12). Dire explicitement à l'utilisateur ce qui a été vérifié par simulation et ce qui reste un vrai inconnu testé pour la première fois en conditions réelles (ex. la création de table InDesign, jamais faite avant sur ce projet) — pas présenter une confiance uniforme sur tout le code.

### Le signal qui doit déclencher un changement de stratégie, pas un nouveau correctif ponctuel

Quand un même symptôme persiste après plusieurs correctifs réels et vérifiés (chacun corrigeant un vrai bug distinct), il faut se demander si un mécanisme structurel commun est en cause plutôt que de continuer à chercher le prochain correctif de surface. Cf. Cas 17 : trois correctifs voisins (Unicode, `+=`, `startParagraph`) étaient tous justifiés, mais aucun ne traitait la vraie cause (réassignation répétée de `insertionPoints[-1]` dans une boucle). Un test qui isole une seule variable à la fois (ici : retirer complètement le gras/italique pour confirmer que l'ordre des paragraphes redevenait correct) permet de localiser la vraie cause avant de réinvestir du temps dans un nouveau pattern.

---

## Gabarit d'entrée — à appliquer à tout **nouveau** cas (É1)

Règle de rangement du wiki, définie dans `doc/METHODE_wiki_recursif.md` (socle projet-indépendant) : tout **nouveau** cas créé à partir du 28/09/2026 ouvre sur un titre `## Cas NN — <titre factuel>`, suivi de 4 champs balisés, puis du corps `Contexte` / `Symptôme` / `Cause` / `Ce que dit la doc` / `Solution` / `Portée` :

```markdown
Titre : ## Cas NN — <titre factuel>

**Thème** : <langage | modèle texte | styles | parsing | tables | menus | méthode>
**API / objet visé** : <nom exact de la méthode / propriété / classe concernée>
**Statut source** : sourcé | mesuré | à sourcer
**Build de référence** : InDesign 21.x (fr_FR, macOS)

Contexte / Symptôme / Cause / Ce que dit la doc / Solution / Portée :
les 6 rubriques habituelles, dans cet ordre.
```

**Valeurs du champ `Statut source`** :

- **`sourcé`** — le fait a été confirmé par une citation exacte de la doc officielle, avec URL vérifiée HTTP 200 et date de consultation.
- **`mesuré`** — le comportement a été constaté en réel (test dans InDesign), mais aucune source externe ne peut être citée.
- **`à sourcer`** — cas admis mais dont la source reste à retrouver (état transitoire à lever ou assumer).

**Portée de cette règle — non rétroactive** : ce gabarit s'applique **aux nouveaux cas uniquement**. Les 35 cas existants au 28/09/2026 gardent leur rédaction d'origine : **aucune réécriture rétroactive**, aucun déplacement de texte, aucune modification de contenu technique. Leur statut source est néanmoins rendu visible dans le sommaire ci-dessous, sans toucher au corps des cas (le champ balisé pourra être ajouté mécaniquement plus tard, par script, cf. `doc/METHODE_wiki_recursif.md`).

**Règle de numérotation** : ascendante et **immuable**. Aucun cas n'est renuméroté ; un cas retiré laisse un trou documenté comme tel (cf. Cas 11 et Cas 15 ci-dessous).

**Boucle de production** — tout bloc de mission porte deux champs obligatoires :

```markdown
**Cas wiki consultés** : Cas NN, Cas NN (ou « aucun — aucun cas voisin »)
**Cas wiki produits/enrichis** : Cas NN créé | Cas NN complété (ou « aucun — cas non mûr »)
```

---

## Table des matières

**État du wiki** : **53 cas** | build de référence **InDesign 21.x** (`21.6.0.57`, `fr_FR`, macOS) | dernière revue : **02/10/2026**.

Index de navigation rapide — utile pour ne charger/scanner que la section pertinente plutôt que tout le fichier avant une nouvelle mission. Les liens pointent vers les ancres de titre (`## Cas NN — ...`).

**Trous de numérotation assumés** : **Cas 11** et **Cas 15** n'existent pas (jamais créés). La numérotation est ascendante et **immuable** — jamais de renumérotation, un trou reste un trou (cf. `doc/METHODE_wiki_recursif.md`).

**Légende statut source** (champ `Statut source` du gabarit É1) : **`sourcé`** = citation exacte + URL vérifiée HTTP 200 · **`mixte`** = fait d'API sourcé, mais comportement constaté par test réel · **`mesuré`** = comportement constaté en réel, sans doc externe à citer.

### 1. Catalogue des cas (résumé + statut source)

- [Cas 00](#cas-00--créer-et-remplir-une-table-indesign-par-script-pattern-validé-23092026) — **`sourcé`** — Créer/remplir une table par script : `insertionPoints[-1].tables.add({headerRowCount, bodyRowCount, columnCount})`, puis `rows[r].cells[c].texts[0].contents`.
- [Cas 01](#cas-01--char-est-un-mot-réservé) — **`sourcé`** — `char` est un mot réservé ES3 (§7.5.1/§7.5.3) ⇒ erreur de syntaxe inattendue.
- [Cas 02](#cas-02--appactivewindowalert-nexiste-pas) — **`sourcé`** — `app.activeWindow.alert()` n'existe pas : utiliser l'`alert()` globale (sans titre sur macOS).
- [Cas 03](#cas-03--new-window-avec-un-objet-de-config) — **`sourcé`** — `new Window({...})` prend un objet de config, pas des arguments positionnels.
- [Cas 04](#cas-04--collectioneveryitem-itéré-avec-un-for-classique) — **`sourcé`** — `collection.everyItem()` : collection non indexable directement ⇒ `for` classique borné par `.length`.
- [Cas 05](#cas-05--duck-typing-sur-les-groupes-de-styles-paragraphstylegroup-vs-characterstylegroup) — **`sourcé`** — Duck-typing des groupes de styles : `CharacterStyleGroup` n'expose pas `paragraphStyles`.
- [Cas 06](#cas-06--documentlabels-traité-comme-une-collection-énumérable) — **`sourcé`** — `document.labels` n'est **pas** une collection énumérable : utiliser `insertLabel`/`extractLabel`.
- [Cas 07](#cas-07--json-nexiste-pas-nativement-en-extendscript) — **`sourcé`** — Pas de `JSON` natif en ExtendScript (ES3) ; `JSON` n'arrive qu'en ES5 (§15.12).
- [Cas 08](#cas-08--arrayprototypeindexof-nexiste-pas-nativement-en-extendscript) — **`sourcé`** — Pas d'`Array.prototype.indexOf` en ES3 (défini en ES5 §15.4.4.14).
- [Cas 09](#cas-09--insertionpoints-1paragraphsadd-nexiste-pas) — **`mixte`** — `insertionPoints[-1].paragraphs.add()` n'existe pas ; `InsertionPoint.contents` est read/write (API sourcée, parcours des paragraphes constaté en réel).
- [Cas 10](#cas-10--fusionner-des-lignes-de-texte-avec-n-avant-insertion-indesign) — **`mesuré`** — Fusion de lignes : seul `\r` termine un paragraphe, `\n` est un saut forcé (constaté en réel, non sourcé).
- [Cas 12](#cas-12--comptage-de-caractères-js-length-désynchronisé-du-comptage-indesign-sur-unicode-composé) — **`mesuré`** — `.length` JS ≠ comptage InDesign sur Unicode composé (é, é) — simulé puis constaté en réel.
- [Cas 13](#cas-13--textframe-temporaire--copie-caractère-par-caractère--pattern-fragile-à-éviter) — **`mesuré`** — Copie caractère par caractère via TextFrame temporaire : pattern fragile à éviter.
- [Cas 14](#cas-14---sur-insertionpointcontents--pattern-non-documenté-à-éviter) — **`mixte`** — `+=` sur `InsertionPoint.contents` : pattern non documenté à éviter (ancrage API `InsertionPoint.contents` ajouté).
- [Cas 16](#cas-16--un-nouveau-paragraphe-hérite-du-startparagraph-saut-de-colonnecadrepage-du-texte-précédent) — **`mixte`** — Un nouveau paragraphe hérite du `startParagraph` (saut de colonne/cadre/page) du texte précédent (enum `StartParagraph` sourcé, héritage mesuré).
- [Cas 17](#cas-17--réassignation-répétée-de-insertionpoints-1contents-dans-une-boucle--curseur-non-fiable) — **`mixte`** — Réassignation répétée de `insertionPoints[-1].contents` dans une boucle ⇒ curseur non fiable (source d'origine morte, ancrage API ajouté).
- [Cas 18](#cas-18--logging-systématique-plutôt-que-dépendre-du-dialogue-derreur-indesign) — **`mesuré`** — Journaliser systématiquement plutôt que dépendre du dialogue d'erreur InDesign.
- [Cas 19](#cas-19--marqueurs-markdown-ambigus-underscore--distinguer-syntaxe-et-texte-normal-par-bordure-de-mot) — **`sourcé`** — Marqueurs Markdown ambigus (underscore) : distinguer syntaxe et texte normal par *delimiter run* + *flanking* (CommonMark 0.31.2).
- [Cas 20](#cas-20--écriture-par-segments-avec-une-seule-assignation-et-une-table-nest-pas-un-paragraphe) — **`mesuré`** — Écriture par segments avec une seule assignation ; une table n'est pas un paragraphe (citation d'origine non retrouvée).
- [Cas 21](#cas-21--dialectes-markdown--un-item-de-liste-entièrement-en-gras-peut-être-un-titre-déguisé) — **`mesuré`** — Dialectes Markdown : un item de liste entièrement en gras peut être un titre déguisé (abandonné depuis, cf. mission 03).
- [Cas 22](#cas-22--storyparagraphsi-invalide-en-cours-de-boucle--utiliser-getelements) — **`mixte`** — `story.paragraphs[i]` invalide en cours de boucle : utiliser `getElements()` (absence de `getElements` confirmée par la doc).
- [Cas 23](#cas-23--storyparagraphslength-peut-valoir-0-après-une-assignation-explicite-de-chaîne-vide) — **`mesuré`** — `story.paragraphs.length` peut valoir 0 après une assignation explicite de chaîne vide ⇒ le compteur de diagnostic ment.
- [Cas 24](#cas-24--la-story-capturée-avant-le-vidage-se-détache--le-compteur-de-diagnostic-ment) — **`mesuré`** — La story capturée AVANT le vidage se détache (proxy mort) ⇒ le compteur de diagnostic ment ; mesurer sur `parentStory`.
- [Cas 25](#cas-25--une-valeur-par-défaut--qui-rend-service--applique-un-style-sans-geste-de-lutilisateur) — **`mesuré`** — Une valeur par défaut « qui rend service » applique un style sans geste de l'utilisateur (repli silencieux, puis persisté).
- [Cas 26](#cas-26--paragraphindex-nest-pas-un-index-de-paragraphe) — **`sourcé`** — `Paragraph.index` n'est PAS un index de paragraphe (c'est un offset de caractère) ; libellé ambigu de la doc confirmé verbatim.
- [Cas 27](#cas-27--séparation-stricte-code-maison--dom-indesign-pourquoi-le-sandbox-node-ne-peut-jamais-suffire) — **`mixte`** — Séparation stricte code maison / DOM InDesign : le sandbox Node ne peut jamais suffire (thèse vérifiée, citation d'origine non retrouvée).
- [Cas 28](#cas-28--un-style-de-paragraphe-appelé-depuis-un-style-de-cellule-est-surclassé-invisible-au-panneau-styles-de-paragraphe) — **`sourcé`** — Un style de paragraphe appelé depuis un style de CELLULE est surclassé et invisible au panneau Styles de paragraphe.
- [Cas 29](#cas-29--une-sonde-de-vérification-doffset-basée-sur-indexof-peut-rendre-un-faux-négatif) — **`mesuré`** — Une sonde d'offset basée sur `indexOf` peut rendre un faux négatif (trouve la 1ʳᵉ occurrence).
- [Cas 30](#cas-30--lesperluette-daccélérateur-dans-les-title-de-menus-fichier-importer) — **`sourcé`** — L'esperluette d'accélérateur dans les `title` de menus (`&Fichier`) : normaliser avant toute comparaison.
- [Cas 31](#cas-31--déclencheur-dune-scriptmenuaction--seul-un-gestionnaire-de-type-file-survit-à-la-fin-du-script) — **`sourcé`** — Déclencheur d'une `ScriptMenuAction` : seul un gestionnaire de type `File` survit à la fin du script.
- [Cas 32](#cas-32--cheminexists-sur-une-chaîne-renvoie-undefined--la-sonde-qui-crie-au-loup) — **`mesuré`** — `chemin.exists` sur une **chaîne** renvoie `undefined` (propriété d'objet `File`) ⇒ sonde qui crie au loup.
- [Cas 33](#cas-33--global-ne-transporte-pas-détat-du-script-vers-lévénement-quil-a-câblé) — **`mesuré`** — `$.global` ne transporte PAS d'état du script vers l'événement qu'il a câblé (frontière fin-de-script → événement).
- [Cas 34](#cas-34--une-scriptmenuaction-créée-au-runtime-ne-survit-pas-au-redémarrage-dindesign) — **`sourcé`** — Une `ScriptMenuAction` créée au runtime ne survit PAS au redémarrage d'InDesign : doit être recréée.
- [Cas 35](#cas-35--un-script-déposé-dans-startup-scripts-est-bien-exécuté-au-lancement-et-la-barre-de-menus-y-est-déjà-construite) — **`sourcé`** — Un script déposé dans `Startup Scripts` est bien exécuté au lancement, et la barre de menus y est DÉJÀ construite (read-me Adobe verbatim).
- [Cas 36](#cas-36--une-entrée-de-menu-durable--module-partagé-evalfile--chargeur-de-démarrage-implémentation-mesurée) — **`mesuré`** — Entrée de menu durable : module partagé `$.evalFile` + chargeur de démarrage (implémentation mesurée après redémarrage réel).
- [Cas 37](#cas-37--lien-natif-vers-un-fichier-source-sans-place--le-modèle-dobjet-link) — **`mixte`** — Lien natif vers une source : le modèle d'objet `Link` existe, `place(.icml)` en crée bien un (`linkType=InCopyMarkup`, `Story.itemLink` non-null), **mais** `InsertionPoint.createTextFragmentLink()` échoue **11/11** vers un `.md`, `place(.md)` ne crée **aucun** lien, et **`update()` comme la réouverture ne rechargent jamais le contenu** (contrôle de fraîcheur seul).
- [Cas 38](#cas-38--uxp-nest-pas-rétrocompatible-par-défaut--minversionmaxversion-du-manifest-pas-une-garantie-de-version) — **`mixte`** — UXP n'est **pas** rétrocompatible par défaut : `minVersion`/`maxVersion` du manifest bloquent l'installation hors plage, mais rien ne garantit qu'une API utilisée soit disponible sur toute la plage déclarée (versionnage UXP découplé du host InDesign).
- [Cas 39](#cas-39--exportfile-nécrase-pas-un-fichier-existant-silencieusement-et-le-porteur-de-lexport-icml-nest-pas-le-document) — **`mesuré`** — `exportFile` **n'écrase pas** un fichier existant (`ok=true`, taille inchangée) ⇒ `remove()` la cible puis relire le fichier produit ; l'export ICML se fait depuis la **story**, pas depuis le document ; `/tmp` est un lien symbolique (écrire dans un vrai sous-dossier).
- [Cas 40](#cas-40--neutraliser-lalerte-dune-sonde--alert-et-confirm-sont-tous-deux-en-lecture-seule) — **`mesuré`** — Dans une sonde non interactive, **`alert` ET `confirm` sont tous deux en lecture seule** (8 tentatives dans 4 contextes, toutes `REFUSE : confirm is read only`, sentinelle jamais vue) — la mention « `confirm` est écrasable » était **fausse** et a été **corrigée le 29/09/2026**, mesure à l'appui ; et le canal `osascript … do script` casse sur les guillemets imbriqués ⇒ écrire un `.jsx` temporaire et l'exécuter par `$.evalFile`.
- [Cas 41](#cas-41--ce-quun-icml-exporté-par-script-contient-réellement-et-ce-quil-ne-contient-pas) — **`mesuré`** — Ce qu'un ICML exporté par script contient **réellement** : les marques markdown survivent **littéralement en texte brut** dans `<Content>`, **aucune balise XML** (`XMLElement`/`XMLTag`/`<Tag` = 0) ⇒ « Map Tags to Styles » n'a rien à lier ; le bloc `<Properties>` domine le poids (≈ 850:1) ; **réserve de mesure déclarée** sur les styles.
- [Cas 42](#cas-42--un-grep-ne-pose-quun-seul-style-de-paragraphe-par-requête) — **`mesuré`** — Un GREP ne pose qu'**UN seul** style de paragraphe par requête : `appliedParagraphStyle` est **scalaire** (`typeof=string`, pas un `Array`), **aucune variante plurielle n'existe** dans le DOM, et la contre-épreuve donne `modifications = 1` avec `p[1]` resté intact ⇒ **N niveaux ⇒ N passes**.
- [Cas 43](#cas-43--un-document-créé-par-script-na-aucun-bloc-de-texte-ni-story-ni-textframe) — **`mesuré`** — Un document créé par `app.documents.add()` n'a **aucun bloc de texte** (`stories=0`, `textFrames=0`) ⇒ `doc.stories[0]` rend un objet **invalide** qui n'explose qu'à la ligne suivante (« Object is invalid », erreur signalée **une ligne trop tard**) ⇒ créer le bloc explicitement et passer par `parentStory`.
- [Cas 44](#cas-44--extractlabel--insertlabel--ce-que-le-label-accepte-réellement) — **`mesuré`** — `extractLabel` sur une clé **absente** rend **`''`** (`typeof="string"`, ni `null` ni `undefined`, sans exception) ⇒ tester par la valeur vide, jamais par `null` ; `insertLabel` sous la **même** clé **ÉCRASE** l'ancienne valeur ; un label de **4000** caractères se relit **intégralement** et **survit à fermeture + réouverture** du document.
- [Cas 45](#cas-45--filemodified-ne-signale-pas-un-changement-de-contenu-et-fileread-normalise-les-fins-de-ligne) — **`mesuré`** — `File.modified` **ne bouge pas** quand le contenu change dans la même seconde (`date a BOUGE = false` alors que la somme change) et `File.length` reste inchangé ⇒ **ni la date ni la taille ne sont un signal de contenu** ; `File.read()` **normalise les fins de ligne en LF** et `File.write()` **écrit CRLF → CR** ⇒ la somme décrit le texte **normalisé**, pas les octets bruts (bonne nouvelle : un `.md` ré-enregistré par un autre outil ne déclenche **pas** de fausse alerte).
- [Cas 46](#cas-46--docsave-refuse-tmp-et-privatetmp--foldertemp-est-la-seule-cible-qui-marche) — **`mesuré`** — `Document.save()` refuse `/tmp` **et** `/private/tmp` (`ECHEC : Dossier "…" introuvable`), `Document.saveAs` **n'existe pas** (`d.saveAs is not a function`) ⇒ seule **`Folder.temp`** permet d'enregistrer le document témoin d'un test fermeture/réouverture.
- [Cas 47](#cas-47--le-canal-darguments-de-appdoscript--lobjet-arguments-racine-jamais-appscriptargs) — **`mesuré`** — Le canal d'arguments de `app.doScript()` est l'objet **`arguments` de niveau racine** du script exécuté (`n=4`, les 4 valeurs **dans l'ordre**) ; **jamais** `app.scriptArgs` (objet **non indexable** ici : ni `length`, ni `[0]`, ni `getArguments`, **identique** avec et sans argument) ; **sans** argument `arguments` est **`undefined`** ⇒ test de discrimination menu/panneau direct ; le 3e paramètre exige une **liste** (`Array of Any Types attendu(e)`).
- [Cas 48](#cas-48--le-numéro-de-paragraphe-absolu-se-compte-en-retours-paragraphe-avant-loffset-caractère-jamais-par-soustraction) — **`mesuré`** — Pour désigner un paragraphe par son **rang absolu** dans une story, il faut **compter les retours paragraphe (`\r`) avant l'offset caractère** du point d'insertion, **jamais** soustraire `story_total − N` : le **dernier bloc inséré fusionne** avec le paragraphe suivant ⇒ **N paragraphes insérés ≠ N paragraphes décomptés** (mesure réelle : 527 avant + 44 blocs ⇒ total **570**, pas 571 ⇒ soustraction **526** au lieu de **527** ⇒ tout le mapping décalé d'un cran).
- [Cas 49](#cas-49--uxp-getfileforopening--le-sélecteur-natif-qui-casse-lœuf-poule-du-premier-import) — **`mesuré`** — `require("uxp").storage.localFileSystem.getFileForOpening({types:[…], allowMultiple:false})` est le **seul point d'entrée indépendant de tout état du document** : le panneau lisait sa source dans l'étiquette `md-source-fingerprint`, elle-même écrite par le moteur **après** un import réussi ⇒ **œuf-poule** (« import refusé : aucune source sélectionnée » sur document neuf, aucun moyen de déclarer une 1ʳᵉ source). Le sélecteur natif rend un `Entry` dont `nativePath` repart dans **le même tube gelé** ⇒ le moteur reste seul décideur.
- [Cas 50](#cas-50--un-écran-de-panneau-uxp-démarre-vide--la-maquette-nest-jamais-létat-douverture) — **`mesuré`** — Un panneau ne doit **jamais** s'ouvrir sur la maquette : l'état d'ouverture vivait dans le **DOM** (3 lignes-modèles, fiche, note, compteur) ⇒ l'écran affichait le dessin. Parade : DOM vidé (`display:none`, textes vides, **aucune** classe d'état résiduelle) + `viderLaListe()` au chargement + lecture **différée** (600 ms) qui remplit l'écran vide. Défaut joint, même famille : les gabarits d'icônes sont choisis **par position** (aucune règle CSS `.etat-*`) ⇒ un état mal aiguillé (« identique » → ligne du cercle rouge) affichait une **alerte rouge sur une source saine**.
- [Cas 51](#cas-51--le-journal-du-moteur-est-en-macroman--uxp-le-lit-en-utf-8-et-échoue) — **`mesuré`** — Le journal écrit par le moteur (`logToFile()`, `open("a")` **sans encoding**) est en **MacRoman** ; UXP lit en **UTF-8** ⇒ `getEntryWithUrl` + `read()` **échouent** sur ce fichier (129 Ko) alors que la **source `.md`** du **même dossier**, lue par le **même helper**, passe (6 157 car.). Parade : relire le journal **par le moteur** (`app.doScript`, `File.encoding = "BINARY"`) comme le fait la **sonde** — et **dire la cause** au lieu d'un `null` muet.
- [Cas 52](#cas-52--le-panneau-relit-le-document-à-louverture-pas-après-limport--lécran-montre-létat-davant) — **`mesuré`** — L'écran d'un panneau n'est qu'un **instantané** de sa dernière lecture : après un import réussi, le **moteur** a écrit une nouvelle étiquette dans le document, mais l'écran montrait encore l'état **d'avant** (document vierge = 0 ligne) ⇒ il fallait cliquer « Actualiser ». Parade : **relire** le document après l'import (`await actualiserListe()`, avant le verdict) — **écrire (moteur) ⇒ relire (panneau)**.
- [Cas 53](#cas-53--une-étiquette-de-document-ne-peut-pas-mémoriser-n-sources--la-liste-encodée-en-paires-plates-et-lupsert-qui-remplace-sur-place) — **`mesuré`** — `insertLabel` est un **couple clé/valeur qui ÉCRASE** (Cas 44) ⇒ une étiquette mono-source ne **peut pas** mémoriser N sources : « N imports ⇒ N lignes » est structurellement impossible sans changer le **format**. Parade : encoder la **liste** en **paires plates** à un seul niveau (`v`/`n`/**`s<i>.`**`v|name|path|size|checksum|modified`, pas de `JSON` — Cas 07), **versionnée** (v1 relue comme liste à 1 élément) et **bornée à 12** en lecture comme en écriture ; l'UPSERT **remplace sur place** (chemin déjà mémorisé = même position ; chemin nouveau = en tête).
- [Cas 54](#cas-54--le-panneau-ne-suit-pas-le-document-actif--événements-indesign-en-chaînes-minuscules-et-bascule-non-mesurable-hors-indesign) — **`sourcé`** — Un panneau UXP ne « voit » que ce qu'il **relit** : sans **abonnement** aux événements du host, il reste sur le **document précédent** à la bascule. Les noms d'événements UXP sont des **chaînes EN MINUSCULES** (`afterOpen`, `afterActivate`, `afterClose`, `afterNew`) via `app.addEventListener` / `removeEventListener` — jamais des constantes `Event.*`. **Quel** événement tire sur une **bascule entre deux documents déjà ouverts** n'est **pas mesurable hors InDesign** ⇒ parade : **superposition** des 4 événements **+ veille périodique** (filet garanti), **un seul** rafraîchissement par salve.

### 2. Index par thème

**Langage ExtendScript (ES3, absences d'API standard)**
- [Cas 01](#cas-01--char-est-un-mot-réservé) — `char` mot réservé
- [Cas 02](#cas-02--appactivewindowalert-nexiste-pas) — `app.activeWindow.alert()` inexistant
- [Cas 03](#cas-03--new-window-avec-un-objet-de-config) — `new Window({...})` config
- [Cas 04](#cas-04--collectioneveryitem-itéré-avec-un-for-classique) — `everyItem()` + `for` classique
- [Cas 07](#cas-07--json-nexiste-pas-nativement-en-extendscript) — pas de `JSON` natif
- [Cas 08](#cas-08--arrayprototypeindexof-nexiste-pas-nativement-en-extendscript) — pas d'`Array.indexOf`
- [Cas 33](#cas-33--global-ne-transporte-pas-détat-du-script-vers-lévénement-quil-a-câblé) — `$.global` ne transporte pas d'état
- [Cas 40](#cas-40--neutraliser-lalerte-dune-sonde--alert-et-confirm-sont-tous-deux-en-lecture-seule) — `alert` **et** `confirm` en lecture seule (corrigé 29/09/2026)

**Modèle texte InDesign (Story/Paragraph/InsertionPoint)**
- [Cas 09](#cas-09--insertionpoints-1paragraphsadd-nexiste-pas) — pas de `paragraphs.add()`
- [Cas 10](#cas-10--fusionner-des-lignes-de-texte-avec-n-avant-insertion-indesign) — fusion de lignes avec `\n`
- [Cas 12](#cas-12--comptage-de-caractères-js-length-désynchronisé-du-comptage-indesign-sur-unicode-composé) — comptage Unicode composé désynchronisé
- [Cas 13](#cas-13--textframe-temporaire--copie-caractère-par-caractère--pattern-fragile-à-éviter) — copie caractère par caractère fragile
- [Cas 14](#cas-14---sur-insertionpointcontents--pattern-non-documenté-à-éviter) — `+=` sur `InsertionPoint.contents`
- [Cas 16](#cas-16--un-nouveau-paragraphe-hérite-du-startparagraph-saut-de-colonnecadrepage-du-texte-précédent) — héritage de `startParagraph`
- [Cas 17](#cas-17--réassignation-répétée-de-insertionpoints-1contents-dans-une-boucle--curseur-non-fiable) — curseur non fiable en boucle
- [Cas 20](#cas-20--écriture-par-segments-avec-une-seule-assignation-et-une-table-nest-pas-un-paragraphe) — écriture par segments, table ≠ paragraphe
- [Cas 22](#cas-22--storyparagraphsi-invalide-en-cours-de-boucle--utiliser-getelements) — `paragraphs[i]` invalide en boucle
- [Cas 23](#cas-23--storyparagraphslength-peut-valoir-0-après-une-assignation-explicite-de-chaîne-vide) — `paragraphs.length` peut valoir 0
- [Cas 24](#cas-24--la-story-capturée-avant-le-vidage-se-détache--le-compteur-de-diagnostic-ment) — la story capturée se détache
- [Cas 26](#cas-26--paragraphindex-nest-pas-un-index-de-paragraphe) — `.index` n'est pas un index de paragraphe
- [Cas 29](#cas-29--une-sonde-de-vérification-doffset-basée-sur-indexof-peut-rendre-un-faux-négatif) — sonde `indexOf` faux négatif
- [Cas 43](#cas-43--un-document-créé-par-script-na-aucun-bloc-de-texte-ni-story-ni-textframe) — un document créé par script n'a aucune story
- [Cas 48](#cas-48--le-numéro-de-paragraphe-absolu-se-compte-en-retours-paragraphe-avant-loffset-caractère-jamais-par-soustraction) — index de paragraphe absolu : compter les `\r`, jamais soustraire

**Styles (paragraphe/caractère/objet/table/cellule)**
- [Cas 05](#cas-05--duck-typing-sur-les-groupes-de-styles-paragraphstylegroup-vs-characterstylegroup) — duck-typing groupes de styles
- [Cas 06](#cas-06--documentlabels-traité-comme-une-collection-énumérable) — `document.labels` non énumérable
- [Cas 44](#cas-44--extractlabel--insertlabel--ce-que-le-label-accepte-réellement) — `extractLabel`/`insertLabel` : clé absente ⇒ `''`, réécriture ⇒ écrasement
- [Cas 25](#cas-25--une-valeur-par-défaut--qui-rend-service--applique-un-style-sans-geste-de-lutilisateur) — valeur par défaut silencieuse
- [Cas 28](#cas-28--un-style-de-paragraphe-appelé-depuis-un-style-de-cellule-est-surclassé-invisible-au-panneau-styles-de-paragraphe) — style de cellule surclasse le style de paragraphe
- [Cas 42](#cas-42--un-grep-ne-pose-quun-seul-style-de-paragraphe-par-requête) — un GREP ne pose qu'un seul style par requête

**Parsing Markdown / logique métier du script**
- [Cas 19](#cas-19--marqueurs-markdown-ambigus-underscore--distinguer-syntaxe-et-texte-normal-par-bordure-de-mot) — ambiguïté underscore
- [Cas 21](#cas-21--dialectes-markdown--un-item-de-liste-entièrement-en-gras-peut-être-un-titre-déguisé) — puce en gras = faux titre (abandonné depuis, cf. mission 03)

**Table InDesign (création par API)**
- [Cas 00](#cas-00--créer-et-remplir-une-table-indesign-par-script-pattern-validé-23092026) — pattern de création de table

**Menus (`ScriptMenuAction`, intégration native — mission 03 étape 9)**
- [Cas 30](#cas-30--lesperluette-daccélérateur-dans-les-title-de-menus-fichier-importer) — esperluette d'accélérateur
- [Cas 31](#cas-31--déclencheur-dune-scriptmenuaction--seul-un-gestionnaire-de-type-file-survit-à-la-fin-du-script) — seul un handler `File` survit
- [Cas 32](#cas-32--cheminexists-sur-une-chaîne-renvoie-undefined--la-sonde-qui-crie-au-loup) — `.exists` sur une chaîne
- [Cas 34](#cas-34--une-scriptmenuaction-créée-au-runtime-ne-survit-pas-au-redémarrage-dindesign) — pas de persistance au redémarrage
- [Cas 35](#cas-35--un-script-déposé-dans-startup-scripts-est-bien-exécuté-au-lancement-et-la-barre-de-menus-y-est-déjà-construite) — `Startup Scripts` et barre de menus
- [Cas 36](#cas-36--une-entrée-de-menu-durable--module-partagé-evalfile--chargeur-de-démarrage-implémentation-mesurée) — entrée durable : module `$.evalFile` + chargeur

**Canal d'appel — passage d'arguments panneau UXP → moteur ExtendScript**
- [Cas 47](#cas-47--le-canal-darguments-de-appdoscript--lobjet-arguments-racine-jamais-appscriptargs) — `app.doScript(src, lang, [args])` → `arguments` racine ; `app.scriptArgs` ne transporte rien

**Panneau UXP (état d'ouverture, habillage, sélecteur de fichier)**
- [Cas 49](#cas-49--uxp-getfileforopening--le-sélecteur-natif-qui-casse-lœuf-poule-du-premier-import) — `getFileForOpening` : le point d'entrée qui **casse l'œuf-poule** du premier import
- [Cas 50](#cas-50--un-écran-de-panneau-uxp-démarre-vide--la-maquette-nest-jamais-létat-douverture) — écran **vide au chargement**, puis lecture différée ; les gabarits d'icônes se choisissent **par position**
- [Cas 51](#cas-51--le-journal-du-moteur-est-en-macroman--uxp-le-lit-en-utf-8-et-échoue) — un fichier écrit par le **moteur** (MacRoman) se relit **par le moteur** (`BINARY`), jamais par UXP (UTF-8)
- [Cas 52](#cas-52--le-panneau-relit-le-document-à-louverture-pas-après-limport--lécran-montre-létat-davant) — l'écran est un **instantané** : après un import, **relire** le document (écrire ⇒ relire)
- [Cas 53](#cas-53--une-étiquette-de-document-ne-peut-pas-mémoriser-n-sources--la-liste-encodée-en-paires-plates-et-lupsert-qui-remplace-sur-place) — une étiquette = **une** valeur : mémoriser **N** sources oblige à **aplatir** (paires `s<i>.`), **versionner** et **borner** ; l'UPSERT **remplace sur place**
- [Cas 54](#cas-54--le-panneau-ne-suit-pas-le-document-actif--événements-indesign-en-chaînes-minuscules-et-bascule-non-mesurable-hors-indesign) — suivre le **document actif** : événements du host en **chaînes minuscules** (`app.addEventListener`) **+ filet périodique** (la bascule n'est pas mesurable hors InDesign)

**Lien dynamique / fichier lié (`Link`, `place`, story liée)**
- [Cas 37](#cas-37--lien-natif-vers-un-fichier-source-sans-place--le-modèle-dobjet-link) — modèle d'objet `Link` : ce qui marche (`place(.icml)`) et ce qui ne marche pas (`createTextFragmentLink()`, `update()` qui ne recharge rien)

**Export et fichiers liés (`exportFile`, `ExportFormat`, ICML)**
- [Cas 39](#cas-39--exportfile-nécrase-pas-un-fichier-existant-silencieusement-et-le-porteur-de-lexport-icml-nest-pas-le-document) — `exportFile` n'écrase pas un fichier existant ; le porteur ICML est la story ; piège du lien symbolique `/tmp`
- [Cas 41](#cas-41--ce-quun-icml-exporté-par-script-contient-réellement-et-ce-quil-ne-contient-pas) — ce qu'un ICML contient réellement (aucune balise XML, marques md en texte brut)

**Méthode et diagnostic (transversal, pas un bug d'API)**
- [Cas 18](#cas-18--logging-systématique-plutôt-que-dépendre-du-dialogue-derreur-indesign) — logging systématique
- [Cas 27](#cas-27--séparation-stricte-code-maison--dom-indesign-pourquoi-le-sandbox-node-ne-peut-jamais-suffire) — séparation logique pure / DOM
- [Cas 38](#cas-38--uxp-nest-pas-rétrocompatible-par-défaut--minversionmaxversion-du-manifest-pas-une-garantie-de-version) — UXP et rétrocompatibilité de version
- [Cas 42](#cas-42--un-grep-ne-pose-quun-seul-style-de-paragraphe-par-requête) — mesurer une capacité par contre-épreuve réelle, pas par lecture du nom des propriétés
- [Cas 43](#cas-43--un-document-créé-par-script-na-aucun-bloc-de-texte-ni-story-ni-textframe) — fabriquer un document témoin dans une sonde
- [Cas 45](#cas-45--filemodified-ne-signale-pas-un-changement-de-contenu-et-fileread-normalise-les-fins-de-ligne) — `File.modified` n'est pas un signal de contenu ; lecture normalisée en LF
- [Cas 46](#cas-46--docsave-refuse-tmp-et-privatetmp--foldertemp-est-la-seule-cible-qui-marche) — `doc.save()` refuse `/tmp` ; seule `Folder.temp` marche

### 3. Index par symptôme

Chercher par ce qu'on a **vu à l'écran** (message d'erreur, comportement observé), pas par le concept qu'on devrait déjà connaître.

- **« undefined is not a function » / objet ou méthode inexistants** → [Cas 02](#cas-02--appactivewindowalert-nexiste-pas), [Cas 03](#cas-03--new-window-avec-un-objet-de-config), [Cas 04](#cas-04--collectioneveryitem-itéré-avec-un-for-classique), [Cas 05](#cas-05--duck-typing-sur-les-groupes-de-styles-paragraphstylegroup-vs-characterstylegroup), [Cas 08](#cas-08--arrayprototypeindexof-nexiste-pas-nativement-en-extendscript), [Cas 09](#cas-09--insertionpoints-1paragraphsadd-nexiste-pas), [Cas 22](#cas-22--storyparagraphsi-invalide-en-cours-de-boucle--utiliser-getelements), [Cas 32](#cas-32--cheminexists-sur-une-chaîne-renvoie-undefined--la-sonde-qui-crie-au-loup)
- **Un argument passé à un script exécuté n'arrive pas / `app.scriptArgs` vide ou inutilisable** → [Cas 47](#cas-47--le-canal-darguments-de-appdoscript--lobjet-arguments-racine-jamais-appscriptargs)
- **Les styles se posent un cran à côté / décalage d'un paragraphe en insertion au curseur (surtout document non vide)** → [Cas 48](#cas-48--le-numéro-de-paragraphe-absolu-se-compte-en-retours-paragraphe-avant-loffset-caractère-jamais-par-soustraction)
- **Erreur de syntaxe / mot inattendu** → [Cas 01](#cas-01--char-est-un-mot-réservé)
- **`JSON` introuvable / `JSON.parse` ne fonctionne pas** → [Cas 07](#cas-07--json-nexiste-pas-nativement-en-extendscript)
- **`.indexOf` sur un tableau qui échoue** → [Cas 08](#cas-08--arrayprototypeindexof-nexiste-pas-nativement-en-extendscript)
- **Comptage de caractères qui ne tombe pas juste (Unicode composé)** → [Cas 12](#cas-12--comptage-de-caractères-js-length-désynchronisé-du-comptage-indesign-sur-unicode-composé)
- **Texte écrit au mauvais endroit / caractères perdus / doublons** → [Cas 13](#cas-13--textframe-temporaire--copie-caractère-par-caractère--pattern-fragile-à-éviter), [Cas 14](#cas-14---sur-insertionpointcontents--pattern-non-documenté-à-éviter), [Cas 17](#cas-17--réassignation-répétée-de-insertionpoints-1contents-dans-une-boucle--curseur-non-fiable), [Cas 20](#cas-20--écriture-par-segments-avec-une-seule-assignation-et-une-table-nest-pas-un-paragraphe)
- **Curseur d'insertion qui ne suit pas la boucle** → [Cas 17](#cas-17--réassignation-répétée-de-insertionpoints-1contents-dans-une-boucle--curseur-non-fiable)
- **Nombre de paragraphes faux (`length` = 0, snapshot figé)** → [Cas 23](#cas-23--storyparagraphslength-peut-valoir-0-après-une-assignation-explicite-de-chaîne-vide), [Cas 24](#cas-24--la-story-capturée-avant-le-vidage-se-détache--le-compteur-de-diagnostic-ment)
- **Styles non appliqués (`reels=0`) sans aucune erreur** → [Cas 26](#cas-26--paragraphindex-nest-pas-un-index-de-paragraphe)
- **Un style neutre apparaît sans que l'utilisateur l'ait demandé** → [Cas 25](#cas-25--une-valeur-par-défaut--qui-rend-service--applique-un-style-sans-geste-de-lutilisateur)
- **Un style de paragraphe invisible au panneau Styles de paragraphe** → [Cas 28](#cas-28--un-style-de-paragraphe-appelé-depuis-un-style-de-cellule-est-surclassé-invisible-au-panneau-styles-de-paragraphe)
- **Table : création ou remplissage qui part en vrille** → [Cas 00](#cas-00--créer-et-remplir-une-table-indesign-par-script-pattern-validé-23092026), [Cas 20](#cas-20--écriture-par-segments-avec-une-seule-assignation-et-une-table-nest-pas-un-paragraphe), [Cas 28](#cas-28--un-style-de-paragraphe-appelé-depuis-un-style-de-cellule-est-surclassé-invisible-au-panneau-styles-de-paragraphe)
- **Markdown mal interprété (underscore, gras, faux titres)** → [Cas 19](#cas-19--marqueurs-markdown-ambigus-underscore--distinguer-syntaxe-et-texte-normal-par-bordure-de-mot), [Cas 21](#cas-21--dialectes-markdown--un-item-de-liste-entièrement-en-gras-peut-être-un-titre-déguisé)
- **Panneau Liens vide / aucun lien natif sur un texte inséré par script** → [Cas 37](#cas-37--lien-natif-vers-un-fichier-source-sans-place--le-modèle-dobjet-link)
- **Le fichier lié ne se met jamais à jour / contenu périmé affiché malgré une source modifiée** → [Cas 37](#cas-37--lien-natif-vers-un-fichier-source-sans-place--le-modèle-dobjet-link)
- **L'export « réussit » (`ok=true`) mais le fichier produit n'a pas changé / échec d'export ICML selon le porteur** → [Cas 39](#cas-39--exportfile-nécrase-pas-un-fichier-existant-silencieusement-et-le-porteur-de-lexport-icml-nest-pas-le-document)
- **La sonde bloque sur une boîte de dialogue / impossible de neutraliser l'alerte (écraser `confirm` ne marche pas non plus)** → [Cas 40](#cas-40--neutraliser-lalerte-dune-sonde--alert-et-confirm-sont-tous-deux-en-lecture-seule)
- **Sous-chaîne introuvable dans un `title` de menu** → [Cas 30](#cas-30--lesperluette-daccélérateur-dans-les-title-de-menus-fichier-importer)
- **Entrée de menu absente / un clic ne fait rien** → [Cas 30](#cas-30--lesperluette-daccélérateur-dans-les-title-de-menus-fichier-importer), [Cas 31](#cas-31--déclencheur-dune-scriptmenuaction--seul-un-gestionnaire-de-type-file-survit-à-la-fin-du-script), [Cas 34](#cas-34--une-scriptmenuaction-créée-au-runtime-ne-survit-pas-au-redémarrage-dindesign), [Cas 36](#cas-36--une-entrée-de-menu-durable--module-partagé-evalfile--chargeur-de-démarrage-implémentation-mesurée)
- **Entrée de menu disparue après un redémarrage d'InDesign** → [Cas 34](#cas-34--une-scriptmenuaction-créée-au-runtime-ne-survit-pas-au-redémarrage-dindesign), [Cas 35](#cas-35--un-script-déposé-dans-startup-scripts-est-bien-exécuté-au-lancement-et-la-barre-de-menus-y-est-déjà-construite), [Cas 36](#cas-36--une-entrée-de-menu-durable--module-partagé-evalfile--chargeur-de-démarrage-implémentation-mesurée)
- **Script qui ne tourne pas au lancement d'InDesign** → [Cas 35](#cas-35--un-script-déposé-dans-startup-scripts-est-bien-exécuté-au-lancement-et-la-barre-de-menus-y-est-déjà-construite)
- **Une sonde annonce « introuvable » / « absent » alors que c'est faux (faux négatif)** → [Cas 24](#cas-24--la-story-capturée-avant-le-vidage-se-détache--le-compteur-de-diagnostic-ment), [Cas 29](#cas-29--une-sonde-de-vérification-doffset-basée-sur-indexof-peut-rendre-un-faux-négatif), [Cas 30](#cas-30--lesperluette-daccélérateur-dans-les-title-de-menus-fichier-importer), [Cas 32](#cas-32--cheminexists-sur-une-chaîne-renvoie-undefined--la-sonde-qui-crie-au-loup)
- **Une alarme se déclenche alors que tout va bien (faux positif)** → [Cas 24](#cas-24--la-story-capturée-avant-le-vidage-se-détache--le-compteur-de-diagnostic-ment)
- **Impossible de diagnostiquer : aucune trace, `catch` vide** → [Cas 18](#cas-18--logging-systématique-plutôt-que-dépendre-du-dialogue-derreur-indesign)
- **Le test Node passe mais le réel échoue (simulateur trop optimiste)** → [Cas 12](#cas-12--comptage-de-caractères-js-length-désynchronisé-du-comptage-indesign-sur-unicode-composé), [Cas 23](#cas-23--storyparagraphslength-peut-valoir-0-après-une-assignation-explicite-de-chaîne-vide), [Cas 24](#cas-24--la-story-capturée-avant-le-vidage-se-détache--le-compteur-de-diagnostic-ment), [Cas 26](#cas-26--paragraphindex-nest-pas-un-index-de-paragraphe), [Cas 27](#cas-27--séparation-stricte-code-maison--dom-indesign-pourquoi-le-sandbox-node-ne-peut-jamais-suffire)
- **La correction ne s'applique pas (deux copies du script)** → piège structurel en fin de fichier (cf. [Cas 31](#cas-31--déclencheur-dune-scriptmenuaction--seul-un-gestionnaire-de-type-file-survit-à-la-fin-du-script), [Cas 35](#cas-35--un-script-déposé-dans-startup-scripts-est-bien-exécuté-au-lancement-et-la-barre-de-menus-y-est-déjà-construite), [Cas 36](#cas-36--une-entrée-de-menu-durable--module-partagé-evalfile--chargeur-de-démarrage-implémentation-mesurée))
- **« Object is invalid » en fabriquant un document témoin dans une sonde** → [Cas 43](#cas-43--un-document-créé-par-script-na-aucun-bloc-de-texte-ni-story-ni-textframe)
- **Il faut N passes pour poser N styles de titre / le nettoyage GREP n'en pose qu'un** → [Cas 42](#cas-42--un-grep-ne-pose-quun-seul-style-de-paragraphe-par-requête)
- **Besoin de relire les marques markdown depuis un export InDesign (ICML) / « Map Tags to Styles » n'a rien à lier** → [Cas 41](#cas-41--ce-quun-icml-exporté-par-script-contient-réellement-et-ce-quil-ne-contient-pas)
- **Un export InDesign énorme pour trois lignes de texte (20–29 ko)** → [Cas 41](#cas-41--ce-quun-icml-exporté-par-script-contient-réellement-et-ce-quil-ne-contient-pas)
- **Une donnée attachée au document se relit vide / le test « le label est-il là ? » ne se déclenche jamais** → [Cas 44](#cas-44--extractlabel--insertlabel--ce-que-le-label-accepte-réellement)
- **Une empreinte ne voit pas une source modifiée (ou crie au loup) : la date et la taille ne suffisent pas** → [Cas 45](#cas-45--filemodified-ne-signale-pas-un-changement-de-contenu-et-fileread-normalise-les-fins-de-ligne)
- **`doc.save()` échoue avec « Dossier … introuvable » / besoin d'un document témoin réellement enregistrable** → [Cas 46](#cas-46--docsave-refuse-tmp-et-privatetmp--foldertemp-est-la-seule-cible-qui-marche)
- **Un panneau réclame une source qu'on ne peut pas lui donner / « import refusé : aucune source sélectionnée » sur un document neuf** → [Cas 49](#cas-49--uxp-getfileforopening--le-sélecteur-natif-qui-casse-lœuf-poule-du-premier-import)
- **Le panneau s'ouvre garni de données de démonstration / la maquette s'affiche au chargement** → [Cas 50](#cas-50--un-écran-de-panneau-uxp-démarre-vide--la-maquette-nest-jamais-létat-douverture)
- **Une alerte rouge (ou toute icône d'état) s'affiche sur une source saine / en changeant un état c'est une autre icône qui bouge** → [Cas 50](#cas-50--un-écran-de-panneau-uxp-démarre-vide--la-maquette-nest-jamais-létat-douverture)
- **Un élément masqué puis réaffiché reste invisible (ou l'inverse) : `style.display = ""` rend la main à la feuille de styles** → [Cas 50](#cas-50--un-écran-de-panneau-uxp-démarre-vide--la-maquette-nest-jamais-létat-douverture)
- **« import envoyé, mais journal du moteur illisible » : un fichier écrit par le moteur ne se relit pas (MacRoman vs UTF-8)** → [Cas 51](#cas-51--le-journal-du-moteur-est-en-macroman--uxp-le-lit-en-utf-8-et-échoue)
- **Après un import, aucune nouvelle ligne ne s'affiche / il faut cliquer « Actualiser » pour voir la source importée** → [Cas 52](#cas-52--le-panneau-relit-le-document-à-louverture-pas-après-limport--lécran-montre-létat-davant)
- **Un document à plusieurs imports n'affiche qu'UNE seule ligne / le second import efface le premier** → [Cas 53](#cas-53--une-étiquette-de-document-ne-peut-pas-mémoriser-n-sources--la-liste-encodée-en-paires-plates-et-lupsert-qui-remplace-sur-place)
- **Une donnée de longueur variable attachée au document (liste de sources, d'éléments…) ne tient pas dans un label** → [Cas 53](#cas-53--une-étiquette-de-document-ne-peut-pas-mémoriser-n-sources--la-liste-encodée-en-paires-plates-et-lupsert-qui-remplace-sur-place)
- **L'ordre des lignes saute / se réordonne après un réimport d'une source déjà connue** → [Cas 53](#cas-53--une-étiquette-de-document-ne-peut-pas-mémoriser-n-sources--la-liste-encodée-en-paires-plates-et-lupsert-qui-remplace-sur-place)
- **Le panneau reste sur l'état du document PRÉCÉDENT quand on ouvre ou bascule vers un autre document / il faut cliquer « Actualiser »** → [Cas 54](#cas-54--le-panneau-ne-suit-pas-le-document-actif--événements-indesign-en-chaînes-minuscules-et-bascule-non-mesurable-hors-indesign)

---

## Cas 00 — Créer et remplir une table InDesign par script (pattern validé, 23/09/2026)

**Contexte** : ajout du support des tableaux Markdown (`| a | b |`) — jamais fait auparavant sur ce projet, fonctionnel dès le premier test réel.

**Créer la table** — au point d'insertion, avec le nombre de lignes/colonnes connu à l'avance :
```javascript
var newTable = story.insertionPoints[-1].tables.add({
    headerRowCount: 1,
    bodyRowCount: rowCount - 1,   // total de lignes moins la ligne d'en-tête
    columnCount: columnCount
});
```
`tables.add()` s'appelle sur un `InsertionPoint` (ou une collection `.tables` d'un objet Text), pas sur le document ou le TextFrame directement. `headerRowCount` + `bodyRowCount` doivent couvrir exactement le nombre total de lignes de données à remplir — pas de ligne supplémentaire créée automatiquement à combler après coup.

**Remplir les cellules** — accès explicite par ligne puis colonne, pas par index linéaire sur `table.cells` (l'ordre linéaire n'est pas garanti correspondre à un parcours ligne par ligne intuitif) :
```javascript
newTable.rows[r].cells[c].texts[0].contents = texteDeLaCase;
```
`cells[c].texts[0]` est nécessaire (pas `cells[c].contents` directement) — une cellule contient un objet `Text`, comme un `TextFrame`.

**Appliquer un style de tableau** — l'objet style réel, pas son nom en chaîne :
```javascript
newTable.appliedTableStyle = tableStyleObject; // objet TableStyle, obtenu via recherche par nom (cf. Cas 05 pour la même logique appliquée aux ParagraphStyle/CharacterStyle)
```

**Point non couvert par ce pattern** : le style de caractère (gras/italique) à l'intérieur d'une cellule n'a pas été implémenté — seul du texte brut est écrit dans chaque cellule pour l'instant, cohérent avec le retrait temporaire du gras/italique dans tout le reste du script (cf. Cas 17/18).

**Table des styles** : comme les `ParagraphStyle`/`CharacterStyle` (Cas 05), les `TableStyle` peuvent être rangés dans des `TableStyleGroup` — la même traversée récursive s'applique, mais volontairement implémentée en fonction séparée (`collectTableStylesRecursive`) plutôt que généralisée sur `collectStylesRecursive`, pour ne jamais risquer de régresser un code déjà validé en le rendant plus générique.

**Sources vérifiées en ligne le 28/09/2026** (modèle objet Adobe InDesign 2026 exporté par indesignjs.de) :
- `Tables.add` — *« add ( to? , reference? , withProperties? ) → Table — Creates a new table. »* (URL `https://www.indesignjs.de/indesignapi/indesign/Tables.html`) : `add()` est bien appelable sur la collection `tables` d'un point d'insertion.
- `Table.appliedTableStyle` — *« appliedTableStyle TableStyle | String read/write — The table style applied to the table. Can also accept: String. »* (URL `https://www.indesignjs.de/indesignapi/indesign/Table.html`).
- `Cell.texts` — *« texts Texts<Text> readonly — A collection of text objects. »* (URL `https://www.indesignjs.de/indesignapi/indesign/Cell.html`) : une cellule expose un `Text`, d'où `cells[c].texts[0].contents` et non `cells[c].contents`.

---

## Cas 01 — `char` est un mot réservé

**Symptôme** : `Illegal use of reserved word 'char'` (erreur JS #9)

**Cause** : ExtendScript hérite du vocabulaire réservé de Java/ES3. `char` (et d'autres mots-clés Java non utilisés en JS moderne) ne peuvent pas servir de noms de variables, même si un linter JS standard ne les signalerait pas.

**Correction** : renommer la variable (`ch`, `currentChar`, etc.)

**Mots réservés à surveiller** (hérités Java, invalides comme identifiants en ExtendScript) : `char`, `new`, `default`, `class`, `final`, `native`, `package`, `synchronized`, `throws`, `boolean`, `byte`, `double`, `float`, `int`, `long`, `short`, `interface`, `implements`, `extends`, `import`, `export`, `super`, `transient`, `volatile`.

**Source vérifiée le 28/09/2026** (norme ECMA-262 3ᵉ édition, décembre 1999, texte extrait directement du PDF officiel) — §7.5.1 *Reserved Words* : *« Reserved words cannot be used as identifiers. »* ; §7.5.3 *Future Reserved Words* : *« The following words are used as keywords in proposed extensions and are therefore reserved to allow for the possibility of future adoption of those extensions. »* La liste `FutureReservedWord :: one of` contient **`char`** aux côtés de `abstract, enum, int, short, boolean, export, interface, static, byte, extends, long, super, final, native, synchronized, class, float, package, throws, const, goto, private, transient, debugger, implements, protected, volatile, double, import, public` — exactement les mots hérités Java listés ci-dessus. URL `https://www.ecma-international.org/wp-content/uploads/ECMA-262_3rd_edition_december_1999.pdf` (HTTP 200, consultée le 28/09/2026).

---

## Cas 02 — `app.activeWindow.alert()` n'existe pas

**Symptôme** : `app.activeWindow.alert is not a function` (erreur JS #24)

**Cause** : confusion probable avec une API d'un autre contexte (After Effects, ou pattern halluciné). L'alerte native ExtendScript est la fonction **globale** `alert(message)`, pas une méthode d'un objet `Window` ou `activeWindow`.

**Correction** : `alert(text)` — un seul argument texte, pas de titre séparé (à concaténer soi-même si besoin).

**Source vérifiée le 28/09/2026** (documentation officielle Adobe, *JavaScript Tools Guide* — User Notification Dialogs) : *« alert(message[, title="Script Alert", errorIcon=false]); — Displays a platform-standard dialog containing a short message and an OK button. »* et *« Mac OS does not support titles for alert dialogs. »* — l'alerte est bien une **fonction globale** (pas une méthode de `Window`/`activeWindow`), et le titre n'a pas d'effet sur macOS. URL `https://extendscript.docsforadobe.dev/extendscript-tools-features/user-notification-dialogs/` (HTTP 200, consultée le 28/09/2026).

---

## Cas 03 — `new Window({...})` avec un objet de config

**Symptôme** : `Bad argument : Invalid Window type specification ([object Object])`

**Cause** : pattern de construction UI copié d'un autre contexte JS (React-like ou After Effects), invalide en ScriptUI InDesign. Le constructeur `Window` attend une signature positionnelle, pas un objet de configuration.

**Correction** : `new Window(type, title, bounds, options)` — ex. `new Window("dialog", "Mon titre")`. Le positionnement des enfants se fait ensuite via `orientation`, `alignChildren`, `spacing`, `margins` (layout automatique) plutôt que `.location`/`.size` en pixels absolus, qui ne sont fiables qu'en désactivant explicitement le layout automatique.

**Source vérifiée le 28/09/2026** (documentation officielle Adobe, *JavaScript Tools Guide* — The Window Object) : signature exacte *« new Window (type [, title, bounds, {creation_properties}]); »* et *« The constructor creates and returns a new Window object, or null if window creation failed. »* — signature **positionnelle**, aucun objet de configuration accepté. URL `https://extendscript.docsforadobe.dev/user-interface-tools/window-object/` (HTTP 200, consultée le 28/09/2026).

---

## Cas 04 — `collection.everyItem()` itéré avec un `for` classique

**Symptôme** : silencieux (avalé par un `catch` vide) — se manifeste comme "la liste revient vide" sans erreur visible.

**Cause** : `everyItem()` retourne un proxy de collection pensé pour des opérations en masse (ex. `everyItem().name` renvoie directement le tableau complet des noms en un seul appel). L'itérer avec `for (i=0; i<x.length; i++) x[i]` comme un tableau classique est le mauvais pattern et échoue.

**Correction** : soit itérer directement sur la collection sans `.everyItem()` (`collection.length`, `collection[i]`), soit utiliser `everyItem().name` pour obtenir directement le tableau de noms si c'est tout ce qu'il faut.

**Leçon transversale** : ne jamais laisser un `catch` vide sur un appel API InDesign incertain — logger systématiquement (cf. Cas 06), sinon ce genre d'échec silencieux est indiscernable d'un "document sans styles".

**Source vérifiée le 28/09/2026** (modèle objet Adobe InDesign 2026, indesignjs.de) — `everyItem` est documenté comme **méthode de collection** (au même titre que `item`, `firstItem`, `lastItem`, `anyItem`), distincte de l'accès indexé : URL `https://www.indesignjs.de/indesignapi/indesign/Paragraphs.html`. La collection expose aussi `length` : *« length Number readonly — The number of objects in the collection. »* — c'est cette paire (`length` + accès indexé) qui doit être utilisée dans un `for`, pas `everyItem()`. La collection `Cells` documente elle aussi `everyItem` (URL `https://www.indesignjs.de/indesignapi/indesign/Cells.html`).

---

## Cas 05 — Duck-typing sur les groupes de styles (`ParagraphStyleGroup` vs `CharacterStyleGroup`)

**Symptôme** : `Object does not support the property or method 'paragraphStyles'`

**Cause** : tentative de deviner le type de collection par `group.paragraphStyles || group.characterStyles`. Un `CharacterStyleGroup` n'a pas de propriété `paragraphStyles` du tout — contrairement à du JS indulgent, ExtendScript lève une exception à l'accès à une propriété absente du type, avant même que le `||` puisse évaluer l'alternative.

**Correction** : passer explicitement le type de collection traité (paramètre booléen ou équivalent) à travers la récursion, ne jamais deviner par accès direct à une propriété potentiellement absente.

**Leçon transversale** : `document.paragraphStyles`/`characterStyles` n'exposent que les styles à la racine du document — les styles rangés dans un `ParagraphStyleGroup`/`CharacterStyleGroup` (dossiers de styles dans le panneau InDesign) nécessitent une descente récursive explicite dans `paragraphStyleGroups`/`characterStyleGroups`. De même, `document.paragraphStyles.item(name)` ne trouve pas un style logé dans un groupe — il faut l'objet style réel, obtenu via la traversée récursive.

**Corollaire utile** : `[Style de paragraphe de base]`/`[Aucun]` existent nativement et de façon indestructible sur tout document InDesign, même le plus vierge — la racine de `document.paragraphStyles`/`characterStyles` n'est donc jamais réellement vide. Une UI de sélection de style peut s'appuyer là-dessus pour toujours avoir au moins une valeur par défaut valable, sans code spécial pour le cas "document sans styles personnalisés".

**Source vérifiée le 28/09/2026** (modèle objet Adobe InDesign 2026, indesignjs.de) — `CharacterStyleGroup` documente **uniquement** `characterStyles` : *« characterStyles CharacterStyles<CharacterStyle> readonly — A collection of character styles. »* (URL `https://www.indesignjs.de/indesignapi/indesign/CharacterStyleGroup.html`). Cette page ne contient **aucune** ancre `id="p-paragraphStyles"` (propriété inexistante), alors que `ParagraphStyleGroup` expose bien `paragraphStyles` (ancre `id="p-paragraphStyles"` présente, URL `https://www.indesignjs.de/indesignapi/indesign/ParagraphStyleGroup.html`) : le duck-typing `group.paragraphStyles || group.characterStyles` ne peut donc pas fonctionner.

---

## Cas 06 — `document.labels` traité comme une collection énumérable

**Symptôme** : `Object does not support the property or method 'labels'`

**Cause** : les labels InDesign (métadonnées clé/valeur attachées à un document, une page, un objet) ne forment pas une collection qu'on peut lister, itérer par index ou nettoyer manuellement. L'API ne propose que deux opérations : `insertLabel(key, value)` (écrit, et écrase silencieusement toute valeur existante pour la même clé) et `extractLabel(key)` (lit ; retourne `""` si absent).

**Correction** : ne jamais accéder à `.labels`, `.labels.length`, `.labels[i]`. Utiliser directement `doc.insertLabel(key, value)` pour écrire (pas besoin de chercher/supprimer un label précédent, `insertLabel` s'en charge) et `doc.extractLabel(key)` pour lire.

**Leçon transversale (renforce le Cas 04)** : ce bug est resté invisible un moment parce qu'une des deux fonctions concernées avait un `catch` vide — encore un cas d'échec silencieux masqué par l'absence de logging systématique.

**Source vérifiée le 28/09/2026** (modèle objet Adobe InDesign 2026, indesignjs.de) — la page `Document` documente exactement deux méthodes pour les labels et **aucune collection `labels`** : `insertLabel (key, value) → void — « Sets the label to the value asso[ciée à la clé] »` (ancre `id="m-insertLabel"`) et `extractLabel (key) → String` (ancre `id="m-extractLabel"`). Aucune ancre `id="p-labels"` n'existe sur la page (URL `https://www.indesignjs.de/indesignapi/indesign/Document.html`, consultée le 28/09/2026) — confirme qu'il n'y a pas de collection de labels énumérable.

---

## Cas 07 — `JSON` n'existe pas nativement en ExtendScript

**Symptôme** : `JSON is undefined`

**Cause** : l'objet global `JSON` (avec `.stringify()`/`.parse()`), natif en JS moderne depuis ES5, n'est pas fourni par le moteur ExtendScript par défaut. Aucun polyfill n'est chargé automatiquement.

**Correction** : pour une structure de données simple et connue à l'avance (objet plat, pas de nesting), écrire un sérialiseur/déserialiseur minimal fait maison plutôt que d'importer un polyfill JSON complet (souvent surdimensionné pour le besoin). Si le besoin de sérialisation devient plus riche (objets imbriqués, tableaux, types variés), envisager d'inclure un polyfill JSON2 standard (`json2.js`, domaine public) en début de script.

**Source vérifiée le 28/09/2026** (norme ECMA-262) — l'objet `JSON` est défini au **§15.12** de la norme ECMA-262 **5ᵉ édition** (juin 2011), dont l'ancre `id="sec-15.12"` existe (URL `https://262.ecma-international.org/5.1/#sec-15.12`, HTTP 200, titre de page : *ECMAScript Language Specification - ECMA-262 Edition 5.1*). Un objet introduit en **ES5** est par construction absent d'un moteur **ES3** comme ExtendScript — le rattachement ES3 d'ExtendScript est sourcé au Cas 01.

---

## Cas 08 — `Array.prototype.indexOf` n'existe pas nativement en ExtendScript

**Symptôme** : `<tableau>.indexOf is not a function`

**Cause** : même famille que le Cas 07 (`JSON`) — `Array.prototype.indexOf` est une méthode ES5, absente du moteur ExtendScript (ES3). Piège facile car `String.prototype.indexOf`, lui, existe bien nativement (hérité de bien plus ancien) — donc `"texte".indexOf("x")` fonctionne, mais `[1,2,3].indexOf(2)` échoue. La ressemblance de syntaxe masque la différence.

**Correction** : écrire une fonction de recherche manuelle (boucle `for` comparant chaque élément) plutôt que compter sur `.indexOf()` pour un tableau. Vérifier au cas par cas si l'objet est une chaîne (`.indexOf` OK) ou un tableau (`.indexOf` KO).

**Leçon transversale** : de façon générale, toute méthode ES5+ (`Array.prototype.indexOf`, `.forEach`, `.map`, `.filter`, `Object.keys`, etc.) est suspecte par défaut en ExtendScript et doit être vérifiée avant usage, pas supposée disponible comme en JS moderne.

**Source vérifiée le 28/09/2026** (norme ECMA-262) — `Array.prototype.indexOf` est spécifié au **§15.4.4.14** de la norme ECMA-262 **5ᵉ édition**, citation exacte de la signature : *« Array.prototype.indexOf ( searchElement [ , fromIndex ] ) »* (URL `https://262.ecma-international.org/5.1/#sec-15.4.4.14`, HTTP 200, ancre `sec-15.4.4.14` vérifiée). Méthode ES5 ⇒ absente du moteur ES3 d'ExtendScript.

---

## Cas 09 — `insertionPoints[-1].paragraphs.add()` n'existe pas

**Symptôme** : `insertionPoints.-1.paragraphs.add is not a function`

**Cause** : `story.insertionPoints[-1]` retourne un objet `InsertionPoint` **unique** (le dernier point d'insertion de la story), pas une collection. Un `InsertionPoint` n'a pas de propriété `.paragraphs` avec une méthode `.add()` — confusion probable avec un pattern de construction d'objet (comme `textFrames.add({...})`, qui lui est valide sur une vraie collection).

**Correction** : pour créer un nouveau paragraphe avec du contenu, écrire le texte directement dans `.contents` du point d'insertion, suivi d'un `"\r"` (le caractère de saut de paragraphe InDesign — pas `"\n"`, qui n'a pas ce sens particulier dans le modèle de texte InDesign). Le `"\r"` crée implicitement un nouveau paragraphe dans la story ; il suffit ensuite d'aller chercher ce paragraphe pour lui appliquer un style.

**Piège associé — l'indexation après un `\r` final** : une fois le `"\r"` écrit, il ouvre un **nouveau paragraphe vide** après le texte qu'on vient d'insérer, À CONDITION qu'un paragraphe existait déjà avant. Donc `story.paragraphs[-1]` (le dernier) désigne ce paragraphe vide, pas celui qui contient le texte — il faut viser `story.paragraphs[-2]` (l'avant-dernier) pour styler le bon paragraphe.

**Piège n°2 — le cas spécial du tout premier paragraphe d'une story vide** : sur une story encore complètement vide, écrire `"texte\r"` en une seule opération ne produit qu'**UN SEUL** paragraphe (pas deux) — la règle `[-2]` ci-dessus ne s'applique donc pas au tout premier bloc écrit. Il faut distinguer explicitement ce cas (`paragraphs[-1]` pour le premier bloc, `paragraphs[-2]` pour les suivants), sinon `paragraphs[-2]` lève `Object is invalid` sur le premier tour de boucle.

**CORRECTION du Cas 09 (23/09/2026, après vérification via simulation Node + doc officielle indesignjs.de)** : le raisonnement `[-1]`/`[-2]` ci-dessus s'est révélé faux dans les deux branches lors d'un test sur un fichier réel — `paragraphs[-1]` pointe TOUJOURS vers le paragraphe vide ouvert par le dernier `\r` écrit, y compris pour le tout premier bloc (un split sur `\r` d'une chaîne `"texte\r"` donne `["texte", ""]`, et `[-1]` est le `""`). La bonne approche, confirmée par la documentation officielle : **écrire le texte du bloc SANS `\r`, appliquer le style pendant que ce texte est encore le dernier paragraphe en cours (`paragraphs[-1]`, sans ambiguïté), puis ajouter le `\r` séparément après**, pour clore ce paragraphe et préparer le suivant. Élimine complètement le besoin de distinguer premier bloc / blocs suivants.

> **Citation source** : *"The easiest way to add text to a frame is targeting its last 'insertion point', which is equivalent to clicking the text cursor at the very end of its text. [...] `myTextFrame.insertionPoints.item(-1).contents = "\rThis is a new paragraph of example text."`"* — le `\r` précède le nouveau texte plutôt que de clore l'ancien, confirmant l'approche "texte d'abord, `\r` après".
> **Source** : recherche web ciblée sur `InDesign ExtendScript InsertionPoint contents append paragraphs "story" text model documentation` — **citation non re-retrouvée telle quelle** lors de la vérification du 28/09/2026.
> **Source vérifiée (doc officielle, 28/09/2026)** — `Paragraphs` est une collection **sans** méthode `add` : sa liste de méthodes se limite à `anyItem, count, everyItem, firstItem, item, itemByRange, lastItem, middleItem, nextItem, previousItem, toSource` et la page ne contient **aucune** ancre `id="m-add"` (URL `https://www.indesignjs.de/indesignapi/indesign/Paragraphs.html`) — ce qui confirme l'erreur `insertionPoints[-1].paragraphs.add is not a function`. Par ailleurs `InsertionPoint.contents` est bien `String | SpecialCharacters` (ancre `id="p-contents"`) et `InsertionPoint.paragraphs` est **readonly** (*« paragraphs Paragraphs<Paragraph> readonly — A collection of paragraphs. »*, URL `https://www.indesignjs.de/indesignapi/indesign/InsertionPoint.html`) : on écrit donc via `contents`, jamais via `paragraphs.add`.

---

## Cas 10 — Fusionner des lignes de texte avec `"\n"` avant insertion InDesign

**Symptôme** : texte inséré présent mais désordonné (fragments coupés au milieu de mots, ordre incohérent), accompagné d'erreurs `Object is invalid` plus loin dans le traitement, sur un `characterRanges`/`characters.itemByRange()`.

**Cause** : un parseur qui fusionne plusieurs lignes source en un seul bloc de texte avec `text += "\n" + ligneSuivante` introduit un caractère qu'InDesign ne traite **pas** comme un saut de paragraphe (seul `"\r"` a ce rôle dans le modèle de texte InDesign — cf. Cas 09). Ce `"\n"` reste un caractère littéral dans le contenu inséré, ce qui décale silencieusement toute longueur de texte calculée en amont (ex. pour positionner un style de caractère sur une plage précise) par rapport à ce qu'InDesign voit réellement — d'où des positions de caractères invalides plus loin.

**Correction** : ne jamais utiliser `"\n"` comme séparateur dans du texte destiné à devenir plusieurs paragraphes InDesign distincts — soit traiter chaque ligne source comme son propre bloc/paragraphe (le cas le plus sûr, un bloc logique = un paragraphe InDesign), soit fusionner avec un espace si la fusion en un seul paragraphe visuel continu est réellement voulue.

**Leçon transversale** : tout calcul de position de caractère en aval (`itemByRange`, `textRangeStart` cumulatif) est extrêmement sensible à la moindre différence entre la longueur de texte calculée côté script et celle qu'InDesign va réellement stocker après insertion — vérifier systématiquement qu'aucun caractère de contrôle ambigu (`\n` vs `\r`, espaces multiples normalisés différemment, etc.) ne s'est glissé entre les deux.

> **Statut source (28/09/2026) — mesuré, non sourcé** : l'affirmation « seul `\r` a le rôle de saut de paragraphe, pas `\n` » n'a **pas** été retrouvée explicitement dans la documentation en ligne (recherches sur les pages `Story.html` et `InsertionPoint.html` du modèle objet pour « paragraph separator » / « carriage return » : aucun résultat). Le fait est **mesuré** en test réel (décalage de positions observé avec `\n` en séparateur, cf. Symptôme/Cause ci-dessus) et cohérent avec l'usage de `\r` documenté au Cas 09. Ce cas est donc classé **mesuré**, non **sourcé**.

---

## Cas 12 — Comptage de caractères JS (`.length`) désynchronisé du comptage InDesign sur Unicode composé

**Symptôme** : texte inséré tronqué/désordonné, avec des erreurs `Object is invalid` sur un `characters.itemByRange()` — apparaît uniquement sur du texte contenant certains caractères Unicode (emoji, symboles composés), invisible sur des cas de test simples en ASCII/accents standards.

**Cause** : `String.prototype.length` en JavaScript/ExtendScript compte les unités UTF-16, pas les caractères visuels. Un symbole comme `⚠️` est en réalité composé de **deux points de code** (U+26A0 + le variation selector U+FE0F) et vaut `.length === 2`, alors qu'InDesign le traite vraisemblablement comme une unité plus proche d'1 caractère visuel dans son propre comptage. Tout calcul de position de caractère basé sur `.length` JS (`textRangeStart += child.text.length`, puis `characters.itemByRange(start, end)`) se désynchronise dès qu'un tel caractère apparaît dans le texte, provoquant une plage invalide.

**Correction — changement d'approche, pas juste de calcul** : abandonner le calcul de position a posteriori ("rétrospectif") au profit d'une application "prospective" : appliquer le style de caractère voulu **sur le point d'insertion (`insertionPoints[-1]`) avant d'y écrire le texte**, exactement comme le ferait un utilisateur tapant à la main avec un style de caractère actif. Le style s'applique alors automatiquement à tout ce qui est écrit ensuite à ce point — aucun calcul de longueur de texte n'est nécessaire, donc aucun risque de désynchronisation, quel que soit le comptage Unicode réel d'InDesign.

**Point pratique associé** : entre deux segments de styles différents, il faut explicitement remettre le point d'insertion sur le style de caractère neutre avant d'écrire un segment "normal", sinon il hérite du style du segment précédent. Le style neutre (`[Aucun]`/`[None]` selon la langue InDesign) est fiable à obtenir via `document.characterStyles.item(0)` — toujours le premier de la collection racine, indépendamment de son nom localisé (cf. corollaire du Cas 05).

**Leçon transversale** : ce cas illustre une limite de la méthode de simulation Node (Cas "Méthode" en tête de ce wiki) — un simulateur qui reproduit la logique de calcul en JS pur hérite des MÊMES biais de comptage que le code simulé s'il utilise aussi `.length`. La simulation a validé un fichier de test qui, par hasard, ne contenait pas de caractères Unicode composés problématiques — d'où l'intérêt de tester avec le fichier réel de l'utilisateur, contenant ses vrais caractères, et pas seulement un cas jouet simplifié.

---

## Cas 13 — TextFrame temporaire + copie caractère par caractère : pattern fragile à éviter

**Symptôme** : texte tronqué/désordonné à l'insertion, identique et persistant même après avoir corrigé le calcul de positions de caractères en amont (aucune nouvelle erreur dans le log malgré le symptôme inchangé).

**Cause** : un script qui construit le résultat dans un `TextFrame` temporaire puis le recopie vers le `TextFrame` cible via une boucle caractère par caractère (`for (var c = 0; c < newStory.characters.length; c++) { originalStory.characters[c]... = newStory.characters[c]... }`) repose sur une hypothèse implicite jamais garantie : que les deux collections `characters` restent alignées terme à terme après une réaffectation de `.contents`. Ce pattern est aussi lent (itération élément par élément sur potentiellement des centaines de caractères) et n'est protégé par aucune vérification de cohérence.

**Correction** : écrire directement dans le `TextFrame` final, sans détour par un `TextFrame` temporaire à recopier. Si un brouillon séparé est réellement nécessaire pour une raison métier (aperçu avant validation, etc.), le remplacer par un déplacement/fusion de story natif InDesign plutôt qu'une recopie manuelle caractère par caractère.

**Leçon transversale** : quand un correctif ciblé (ex. calcul de position) ne change pas le symptôme observé au test suivant, ne pas re-corriger la même zone avec une nouvelle hypothèse — élargir la relecture à toute la chaîne de traitement, y compris les étapes qui semblaient déjà correctes ou avaient été notées comme "point de vigilance" sans être creusées.

---

## Cas 14 — `+=` sur `InsertionPoint.contents` : pattern non documenté, à éviter

**Symptôme** : texte inséré présent et intact, mais dans un ordre incohérent (paragraphes voire segments internes inversés), sans aucune erreur JS levée.

**Cause** : `insertionPoints[-1].contents += texte` — l'opérateur `+=` sur la propriété `.contents` d'un `InsertionPoint` n'est pas un pattern documenté par Adobe. Un `InsertionPoint` représente une position, pas un contenu existant à lire pour concaténer dessus (contrairement à une `Text`/`Story`, qui a un vrai contenu qu'on peut légitimement vouloir étendre). Le comportement exact de `+=` dans ce contexte n'est pas précisé dans la documentation, mais des utilisateurs le signalent comme problématique, et il est cohérent avec un symptôme d'écriture qui ne se place pas là où on l'attend.

**Correction** : utiliser une **assignation directe** (`insertionPoints[-1].contents = texte`), le pattern officiellement documenté et démontré dans les exemples Adobe — malgré l'apparence contre-intuitive du nom (`=` et non `+=`), cette assignation directe sur `insertionPoints[-1]` AJOUTE bien le texte à la fin de la story existante, sans effacer ce qui précède.

**Leçon transversale** : en ExtendScript, un opérateur qui "a l'air de marcher" par analogie avec un pattern JS standard (`string += autre` pour concaténer) n'est pas garanti se comporter pareil sur un objet du DOM InDesign qui n'est pas une vraie chaîne de caractères — toujours privilégier le pattern exact montré dans la documentation officielle ou les exemples de la communauté, plutôt que d'assumer qu'un opérateur générique JS transpose tel quel.

> **Citation source** : *"With a text frame selected, this line will add text at the end: `app.selection[0].insertionPoints[-1].contents = "hello, world!";`"* — un exemple de documentation communautaire InDesign, confirmant l'assignation directe (`=`) comme le pattern standard, jamais `+=`. **Cette citation précise n'a pas été re-retrouvée en ligne lors de la vérification du 28/09/2026** (le motif `hello, world` est absent des pages indesignjs.de).
> **Source** : recherche web ciblée sur `InDesign ExtendScript "insertionPoints.item(-1).contents =" example add text without erasing existing story content` — **source d'origine non retrouvée**.
> **Ancrage API vérifié (doc officielle, 28/09/2026)** — `InsertionPoint.contents` est documenté **`String | SpecialCharacters`, read/write** (ancre `id="p-contents"`, URL `https://www.indesignjs.de/indesignapi/indesign/InsertionPoint.html`) : c'est bien une **propriété assignable**, ce qui fait de l'assignation directe (`=`) le seul pattern documenté ; aucun opérateur `+=` n'est décrit par le modèle objet, ce qui étaye la mise en garde sans la prouver formellement.

---

## Cas 16 — Un nouveau paragraphe hérite du `startParagraph` (saut de colonne/cadre/page) du texte précédent

**Symptôme** : du contenu inséré par script "disparaît" visuellement — en réalité poussé dans le cadre de texte lié suivant (ou la page suivante), sans erreur JS.

**Cause** : tout nouveau paragraphe créé par script hérite du style de paragraphe (et donc de tous ses attributs, y compris `startParagraph`) du texte qui le précède. Si ce style a un réglage "Démarrer le paragraphe" (Format > Options de saut de paragraphe dans l'UI InDesign, `startParagraph` en scripting) sur autre chose que "N'importe où" (colonne suivante, cadre suivant, page suivante...), tout paragraphe créé juste après hérite de ce comportement de saut — y compris un simple paragraphe technique/vide créé par le script lui-même (ex. un séparateur), pas seulement le contenu "métier".

**Correction** : neutraliser explicitement `paragraph.startParagraph = StartParagraph.ANYWHERE` sur tout paragraphe technique créé par le script (ex. un séparateur de saut de ligne), pour ne pas hériter silencieusement d'un réglage venant du contexte environnant. Ne pas neutraliser cette propriété sur le contenu "métier" lui-même si l'utilisateur a un motif légitime de configurer des sauts dans sa charte de styles — seul le paragraphe purement technique introduit par le script doit être neutralisé.

**Leçon transversale** : l'héritage de style d'un nouveau paragraphe en InDesign n'est pas limité à l'apparence visuelle (police, couleur, etc.) — des attributs de comportement structurel comme les sauts de paragraphe suivent la même règle d'héritage et peuvent produire des effets à distance (contenu qui "disparaît" ailleurs dans le document) difficiles à diagnostiquer sans connaître ce mécanisme.

> **Ancrage API vérifié (doc officielle, 28/09/2026)** — la propriété existe bien sous ce nom : `Paragraph.startParagraph` (type `StartParagraph`), enum documentée `StartParagraph :: ANYWHERE | NEXT_COLUMN | NEXT_EVEN_PAGE | NEXT_FRAME | NEXT_ODD_PAGE | NEXT_PAGE` (URL `https://www.indesignjs.de/indesignapi/indesign/Paragraph.html`). Le **comportement d'héritage** décrit ci-dessus (un nouveau paragraphe hérite du réglage du précédent) n'est pas documenté comme tel — il est **mesuré** en test réel. Ce cas est donc classé **sourcé pour l'existence/les valeurs de l'API**, **mesuré pour le comportement d'héritage**.

---

## Cas 17 — Réassignation répétée de `insertionPoints[-1].contents` dans une boucle : curseur non fiable

**Symptôme** : texte présent mais désordonné (fragments, ordre incohérent), persistant à travers plusieurs correctifs qui ciblaient des causes voisines mais pas cette cause structurelle (Unicode, `+=` vs `=`, `startParagraph`) — chacun de ces correctifs a résolu un vrai bug distinct, sans résoudre le désordre de fond.

**Cause** : `story.insertionPoints[-1]` réassigné (`.contents = texte`) plusieurs fois de suite **dans une boucle** ne fait pas avancer le curseur logique de façon fiable pour les itérations suivantes — un comportement documenté par la communauté Adobe (recommandation de travailler "en ordre inverse" pour ce genre de manipulation), qui contredit l'intuition naturelle qu'assigner à `[-1]` après chaque écriture pointerait toujours vers la fin actualisée.

**Correction appliquée en urgence (23/09, FJD)** : abandon temporaire de l'écriture segment par segment (nécessaire pour le gras/italique inline). Un bloc = une seule écriture de texte brut complet en un seul appel (`story.insertionPoints[-1].contents = block.text`, hors boucle interne), avec uniquement le style de paragraphe. Le gras/italique est retiré du scope en attendant un nouveau pattern non testé par itération aveugle.

> **Citation source** : *"When assigning new contents to insertion points, be careful and do that in reverse order (from back to forth) inside a story."* Signalé également : *"when inserting multiple returns to the end of a paragraph using `insertionPoints[-1]` in a loop, the insertion point -1 is not at the end of the paragraph for subsequent iterations."*
> **Source** : recherche web ciblée sur `InDesign ExtendScript multiple sequential "insertionPoints[-1].contents = text" calls in loop does insertion point advance each time`, résultat croisant GitHub (fabianmoronzirfas/extendscript wiki, page InsertionPoints) et forums Adobe.
> **Statut source (28/09/2026) — source non retrouvée** : le wiki GitHub cité à l'origine (`fabianmoronzirfas/extendscript`, page *InsertionPoints*) a été **déplacé** (redirection 301 vers `ff6347/extendscript`, dont la page ne dit plus que « This repos wiki has moved ») — la citation n'est donc **plus vérifiable en ligne**. Le comportement reste **mesuré** en test réel (symptôme confirmé sur fichier long) → ce cas est classé **mesuré**, non **sourcé**.
> **Ancrage API vérifié (doc officielle, 28/09/2026)** — `SpecialCharacters` documente les marqueurs de texte, dont `FORCED_LINE_BREAK`, `DISCRETIONARY_LINE_BREAK`, `COLUMN_BREAK`, `PAGE_BREAK`, `FRAME_BREAK`, `PARAGRAPH_SYMBOL`, mais **aucun** `PARAGRAPH_RETURN` (URL `https://www.indesignjs.de/indesignapi/indesign/SpecialCharacters.html`) : cohérent avec le fait que c'est `\r` (non exposé comme `SpecialCharacters`) qui structure le paragraphe.

**Leçon transversale, la plus importante de cette session** : quand un symptôme persiste après plusieurs correctifs ciblés, chacun réel et vérifié, il faut se demander si tous ces correctifs pansent des symptômes d'une seule et même cause structurelle plus profonde (ici : la boucle de réassignation répétée elle-même), plutôt que de continuer à chercher le prochain correctif ponctuel. Un test qui isole une variable à la fois (ici : retirer complètement le gras/italique) permet de confirmer si la cause de fond est bien là où on la soupçonne, avant de réinvestir du temps dans un nouveau pattern d'écriture.

---

## Cas 18 — Logging systématique plutôt que dépendre du dialogue d'erreur InDesign

**Constat** : InDesign ne propose pas de console de debug moderne (l'ExtendScript Toolkit historique est abandonné). Le seul retour natif est la boîte de dialogue d'erreur modale — donc chaque bug nécessitait un screenshot pour être diagnostiqué à distance.

**Solution adoptée** : chaque `catch` significatif (et le catch global de `main()`) écrit dans un fichier `import_md_errors.log` (append, horodaté, avec message/ligne/fichier/stack) situé à côté du script. Permet de lire l'erreur directement sans dépendre d'une capture d'écran.

**À généraliser** : tout nouveau script ExtendScript sur ce poste devrait inclure ce pattern de logging dès le départ plutôt que de l'ajouter après coup.

---

## Cas 19 — Marqueurs Markdown ambigus (underscore) : distinguer syntaxe et texte normal par bordure de mot

**Contexte** : extension du parseur Markdown (24/09/2026) pour couvrir `__gras__`/`_italique_` en plus de `**`/`*`.

**Piège identifié avant implémentation** : `*` est rarement présent dans du texte normal sans intention de marquage, mais `_` (underscore) l'est couramment — identifiants techniques (`mon_fichier`), noms de variables (`variable_nom`), URLs. Une détection naïve de `_texte_` comme italique casserait ce genre de contenu (`mon_fichier_texte` deviendrait "mon", "fichier" en italique, "texte" — un vrai bug de contenu, pas de crash).

**Solution** : n'activer `_`/`__` comme marqueur que si le caractère adjacent, côté extérieur au marqueur, est une **bordure de mot** — espace, ponctuation, ou début/fin de chaîne. Concrètement : avant d'ouvrir `_italique_`, vérifier que le caractère précédent est une bordure ; avant de le fermer, vérifier que le caractère suivant en est une aussi. `mon_fichier_texte` ne remplit cette condition à aucun des deux underscores (lettres des deux côtés), donc reste intact ; ` _italique_ ` (espaces autour) est bien détecté.

**Correspond au comportement CommonMark** pour les délimiteurs d'emphase — la règle "bordure de mot" n'est pas une improvisation, c'est l'esprit de la spécification officielle simplifié pour ce cas d'usage (CommonMark a des règles plus fines encore, notamment sur les délimiteurs "gauche-fort"/"droit-fort", non implémentées ici — suffisant pour les cas réels rencontrés).

**Source vérifiée le 28/09/2026** (spécification CommonMark 0.31.2) — la notion de *delimiter run* et de bordure (« flanking ») est bien dans la spécification : *« A delimiter run is either a sequence of one or more `*` characters [...] or a sequence of one or more `_` characters [...]. »*, avec les définitions *« A left-flanking delimiter run is a delimiter run that is (1) not followed by Unicode whitespace, and [...] »* et *« A right-flanking delimiter run is [...] »*. C'est exactement la règle « bordure de mot » simplifiée appliquée ici. URL `https://spec.commonmark.org/0.31.2/` (HTTP 200, consultée le 28/09/2026).

**Leçon transversale** : quand une syntaxe à ajouter réutilise un caractère qui a un usage légitime hors syntaxe (ici `_`), ne jamais l'activer sans condition — toujours vérifier avec l'utilisateur si une règle de désambiguïsation existe déjà dans la spécification de référence (ici CommonMark) avant d'improviser.

---

## Cas 20 — Écriture par segments avec une seule assignation, et une table n'est pas un paragraphe

**Contexte** : cause racine définitive du désordre de texte récurrent (Cas 17), trouvée après qu'un fichier plus long ait fait reproduire le bug malgré le retrait du gras/italique qui l'avait masqué.

**Architecture retenue** (confirmée par recherche documentaire, pattern recommandé pour la performance) : regrouper les blocs de contenu en segments (texte consécutif vs table), écrire chaque segment texte en **une seule assignation** (`insertionPoints[-1].contents = texteComplet`, blocs concaténés avec `\r`), jamais une réassignation par bloc dans une boucle. Les styles de paragraphe sont appliqués **après coup**, par index stable sur `story.paragraphs`.

**Piège n°1 — une table n'est pas un paragraphe.** Citation trouvée : *"tables occupy a single character position in the story"* — une table insérée via `insertionPoints[-1].tables.add()` s'ancre comme un caractère unique DANS le paragraphe courant, elle ne crée jamais son propre saut de paragraphe. Écrire un `\r` avant ET après un segment table (logique naïve "chaque segment a ses séparateurs") produit un paragraphe vide surnuméraire à chaque table. Correction : le `\r` de transition ne s'écrit qu'entre deux segments **texte** consécutifs, jamais autour d'un segment table.
> **Statut source (28/09/2026) — source non retrouvée** : la citation `"tables occupy a single character position in the story"` n'a **pas** été re-retrouvée en ligne (recherches infructueuses sur les pages `Table.html`, `Tables.html`, `Story.html`, `TextFrame.html`, `Text.html` du modèle objet indesignjs.de, ainsi qu'en recherche web générale ; aucune ancre ne porte ce texte). Le comportement, lui, est **mesuré** : il a été reproduit par le simulateur et par le test réel (paragraphe vide surnuméraire à chaque table, corrigé en ne plaçant le `\r` qu'entre deux segments texte). Ce cas est donc classé **mesuré**, non **sourcé**. Ancrage API partiel : `Tables.add` est bien documenté (*« add ( to? , reference? , withProperties? ) → Table — Creates a new table. »*, URL `https://www.indesignjs.de/indesignapi/indesign/Tables.html`).

**Piège n°2 — le paragraphe ouvert par un `\r` est le paragraphe courant, pas le suivant.** Après avoir écrit un `\r` de transition, `story.paragraphs.length` inclut déjà le nouveau paragraphe vide qu'il vient d'ouvrir. Écrire le premier bloc du segment suivant **remplit ce paragraphe existant**, il ne crée pas un nouveau paragraphe après lui. L'index correct du premier bloc d'un segment est donc `story.paragraphs.length - 1` (juste avant l'écriture), et **jamais** `story.paragraphs.length` tel quel — piège identique en substance au Cas 09/11 (confusion "paragraphe courant" vs "paragraphe suivant"), qui a donc été refait une deuxième fois avant d'être définitivement compris.

**Méthode qui a permis de le trouver AVANT tout test réel** : un simulateur Node dédié (représentant `story` comme une chaîne JS + split sur `\r`, une table comme "ne modifie pas la chaîne") a révélé les deux pièges sur des cas de test construits spécifiquement (document avec une table au milieu, document commençant par une table, deux tables consécutives) — zéro décalage d'index une fois les deux corrections appliquées, sur 3 cas distincts.

**Leçon transversale** : un bug structurel masqué par une simplification temporaire (ici : le retrait du gras/italique réduisant le nombre d'itérations) peut sembler résolu tant que le volume de test reste faible — ne jamais considérer un correctif "confirmé" sur un seul test court quand le mécanisme suspecté dépend explicitement du nombre de répétitions.

---

## Cas 21 — Dialectes Markdown : un item de liste entièrement en gras peut être un titre déguisé

**Contexte** : un fichier réel (sortie DeepSeek) utilisait `* **Sous-titre**` comme sous-titre visuel à l'intérieur d'une liste, plutôt que `####`. Notre parseur, testé jusque-là sur des fichiers qui séparaient toujours nettement titres et listes, traitait tout item de liste comme plat — le sous-titre devenait indiscernable des vrais items, cassant toute la hiérarchie une fois importé dans InDesign.

**Solution retenue** (proposée par l'utilisateur) : suivre un niveau de titre courant pendant le parsing (`currentTitleLevel`, mis à jour à chaque vrai `#`/`##`/`###`). Un item de liste **entièrement** en gras (`/^\*\*(.+)\*\*$/` sur son contenu, rien avant/après) devient un titre synthétique de niveau `currentTitleLevel + 1` — pas un tag générique unique, un niveau distinct par profondeur (h4, h5...), mappable individuellement.

**Distinction clé** : un item *partiellement* en gras (`**Label :** reste du texte`) n'est PAS un titre — seul un item où le gras couvre l'intégralité du contenu déclenche la règle. Sans cette distinction, des items légitimes comme `**Public cible :** Maquettistes...` auraient été mal classés.

**Méthode de vérification qui a permis de valider ça sans ouvrir InDesign** : un simulateur dédié (`simulate_mapping.js`) qui n'affiche pas seulement les blocs parsés, mais le **style InDesign effectif** que chaque bloc recevrait selon un mapping donné — révèle en un coup d'œil la distribution des tags et tout bloc qui se retrouverait sans style mappé, avant même de lancer le vrai script.

**Leçon transversale** : Markdown n'a pas une seule façon d'exprimer une hiérarchie — un même niveau conceptuel (sous-titre) peut être encodé différemment selon l'outil qui a généré le fichier (`####` vs item de liste en gras). Un parseur validé sur un dialecte ne généralise pas automatiquement à un autre ; chaque nouveau fichier réel est un test, pas juste une réutilisation du même chemin de code.

---

## Cas 22 — `story.paragraphs[i]` invalide en cours de boucle : utiliser `getElements()`

**Symptôme** : `Object is invalid` sur `story.paragraphs[i].appliedParagraphStyle = ...` au milieu d'une boucle qui parcourt plusieurs paragraphes — le script plante en cours de route, laissant certains paragraphes stylés et d'autres non (ou avec le mauvais style, selon l'endroit exact du plantage).

**Cause** : `story.paragraphs[i]` n'a pas d'identité d'objet fixe — c'est une plage de caractères **résolue dynamiquement à chaque accès**, pas un objet mis en cache. Appliquer un style de paragraphe qui modifie le flux de texte (ex. une liste à puces avec puce automatique InDesign, qui insère un caractère de puce) peut invalider ou décaler les indices des paragraphes suivants **pendant que la boucle est encore en cours**, avant même d'y arriver.

**Correction** : capturer un tableau JS stable une seule fois, avant la boucle, via `story.paragraphs.everyItem().getElements()` — ce pattern retourne un snapshot figé, indépendant de toute recomposition survenue après coup. Indexer sur ce tableau plutôt que de ré-interroger `story.paragraphs[i]` à chaque itération élimine le risque.

```javascript
var paragraphElements = story.paragraphs.everyItem().getElements();
for (var i = 0; i < n; i++) {
    paragraphElements[i].appliedParagraphStyle = monStyle; // stable, jamais invalidé en cours de boucle
}
```

**Leçon transversale** : en ExtendScript, toute collection accédée par index (`paragraphs`, `characters`, `words`...) est potentiellement une "vue dynamique" recalculée, pas un tableau figé — dès qu'une opération dans la boucle peut modifier la structure du texte sous-jacente (longueur, nombre de paragraphes, contenu), le pattern sûr est de snapshoter via `.everyItem().getElements()` avant de boucler, jamais de faire confiance à un ré-accès par index brut en cours de traitement.

---

## Cas 23 — `story.paragraphs.length` peut valoir 0 après une assignation explicite de chaîne vide

**Symptôme** : décalage d'index d'une unité dès le tout premier bloc écrit, "contagieux" (se propage à tous les indices suivants, qui finissent par dépasser la longueur réelle du tableau de paragraphes) — même symptôme visuel que le Cas 09/11/20 (mauvais paragraphe stylé), mais cause différente cette fois.

**Cause** : plusieurs sources communautaires (forums Adobe) affirment qu'un `TextFrame`/story vide a toujours `paragraphs.length >= 1` (un paragraphe vide par défaut, jamais 0). Vérifié faux dans ce cas précis, par log réel : immédiatement après `story.contents = ""` (assignation **explicite** d'une chaîne vide, pas un TextFrame simplement jamais touché), `story.paragraphs.length` valait **0**. Un calcul du type `firstNewParagraphIndex = paragraphsBeforeCount - 1` produit alors `-1` sur ce premier accès, décalant tout le reste.

**Correction** : `firstNewParagraphIndex = Math.max(0, paragraphsBeforeCount - 1)` — protège le cas `paragraphsBeforeCount === 0` sans changer le comportement des autres cas déjà validés (`length === 1` → index 0 ; `length` plus grand après un `\r` → dernier index existant, inchangé).

**Piège annexe rencontré pendant le diagnostic** : des logs de diagnostic avaient bien été écrits dans `import_md_errors.log`, mais une recherche `grep` shell pour les relire échouait systématiquement à les trouver — à cause d'un problème d'encodage sur les apostrophes/accents dans les chaînes de log (probablement une différence d'encodage entre l'écriture ExtendScript et l'interprétation shell du terminal). Ça a fait croire, à tort, que le logging lui-même avait échoué silencieusement. Résolu en relisant le fichier **en Python, au niveau des octets** (`open(..., 'rb')`, recherche sur des bytes, pas du texte décodé par le shell) plutôt qu'en `grep`.

**Leçon transversale** : une affirmation répétée sur plusieurs forums communautaires n'est pas une garantie absolue de comportement — quand un bug persiste malgré une hypothèse "documentée" qui semblait solide, vérifier par un log réel plutôt que de continuer à faire confiance à la doc secondaire. Et si un diagnostic censé produire un résultat ne produit "rien du tout", vérifier l'outil de lecture du diagnostic lui-même (ici : `grep` sur un encodage problématique) avant de conclure que le code testé est en cause.

---

## Cas 24 — La story capturée AVANT le vidage se DÉTACHE → le compteur de diagnostic ment

**Symptôme** : le log annonçait « 1 paragraphe » (puis « 9 ») là où l'œil voyait 3 (puis 39) paragraphes propres à l'écran. Le texte inséré était **correct dans tous les cas** — seul le chiffre rapporté était faux. Phénomène strictement corrélé au mode « `TextFrame` sélectionné » (story vidée avant écriture). En mode curseur (aucun vidage), les chiffres étaient justes.

**Cause — deux couches superposées :**

1. **Couche 1 — point d'insertion résolu trop tôt.** `targetPoint = story.insertionPoints[-1]` était évalué **avant** `story.contents = ""`. Le vidage recompose toute la story : la référence conservée ne désigne plus un état de texte cohérent. Correction : re-résoudre `targetPoint` **après** le vidage (le mode curseur, lui, garde son `insertAt` fourni par l'appelant ; seul le mode « fin de story » doit re-résoudre).

2. **Couche 2 — cause racine définitive : la poignée `story` elle-même se DÉTACHE.** Après `story.contents = ""`, l'objet story conservé n'est plus rattaché au document : il renvoie `.contents` **vide** (`length === 0`) et un `paragraphs` **périmé**. Le texte écrit vit en réalité dans **`targetPoint.parentStory`**, seule source de vérité après recomposition. Preuve par log réel (4 tirs, mêmes fichiers) :

| Tir | Mode | Blocs | `story` capturée AVANT vidage | `targetPoint.parentStory` (vérité) |
|-----|------|-------|-------------------------------|-------------------------------------|
| 1 | curseur | 3 | snapshot=3, `.contents.length=636` ✅ | 636 ✅ |
| 2 | TextFrame | 3 | snapshot=3, `.contents.length=0` ⚠️ | 636 ✅ (œil : 3) |
| 3 | TextFrame | 39 | snapshot=**9**, `.contents.length=0` ❌ | 4402 ✅ (œil : 39) |
| 4 | curseur | 85 | snapshot=85, `.contents.length=5474` ✅ | 5474 ✅ |

En mode curseur (aucun vidage), `story` reste valide. En mode TextFrame, `story` est un **proxy mort** : sa lecture directe (`paragraphs.length`) est périmée *et* son `.contents` est vide — c'est un même mensonge que le Cas 23, mais sur l'objet entier, pas seulement sur une vue.

**Confirmation en réel du correctif (26/09, 17:31–17:32 — mode TextFrame, celui qui mentait) :**

| Heure | Blocs | `paragraphes reels` (log) | DOM snapshot | compte `\r` | Proxy périmé de contraste | Verdict |
|-------|-------|---------------------------|--------------|--------------|---------------------------|---------|
| 17:32:17 | 3 | **3** (avant correctif : `1`) | 3 | 3 | snapshot=3, `.contents.length=0` | ✅ |
| 17:32:28 | 85 | **85** (avant correctif : valeur périmée) | 85 | 85 | snapshot=**26**, `.contents.length=0` | ✅ |

Les deux tirs affichent `source=targetPoint.parentStory` **sans** mention `REPLI`, **aucune** ligne `DIVERGENCE`, **aucune** ligne `ECART DOM/JS`. Le tir à 85 blocs est le plus parlant : le contraste montre le proxy périmé annonçant `snapshot=26` et `.contents.length=0` pendant que `targetPoint.contents.length=5474` et que les trois mesures de vérité donnent `85` — la couche 2 est donc bien neutralisée, pas contournée par chance.

**Vérification croisée indépendante** : les chiffres du log (blocs / `fullText.length` / `crCount`) ont été reproduits en réexécutant le **vrai parseur** (`parseMarkdown` de `import_md.jsx`) hors InDesign : `test_min_01_texte.md` → 3/636/2 ; `deepseek_formation.md` → 85/5474/84 ; `deepseek_referentiel.md` → 35/3940/34 ; `gemini_charte.md` → 24/2802/23. Concordance exacte sur les quatre fixtures. **Piège de méthode** : un comptage « indépendant » réécrit à la main (hors parseur) avait donné 85 blocs mais 5718 caractères — un faux écart dû à un nettoyage du balisage Markdown différent. Un arbitre n'est valable que s'il reproduit *la même transformation* que le code ; sinon il produit de fausses divergences, aussi nuisibles que les fausses alertes de l'addendum ci-dessous.

**Correction appliquée :**
1. **Re-résoudre `targetPoint` après le vidage** (couche 1).
2. **Mesurer sur `targetPoint.parentStory`**, jamais sur la `story` capturée avant (couche 2), avec repli explicite **et signalé dans le log** si `parentStory` est indisponible.
3. **Arbitre JS pur** : compter les `\r` en JS sur la chaîne réellement écrite ; paragraphes attendus = `crCount + 1`. Totalement indépendant des vues dynamiques du DOM.
4. **Log de contraste** : afficher côte à côte la vérité (`parentStory`) **et** la valeur mensongère de la `story` capturée avant vidage, pour que toute divergence reste visible au lieu de se cacher derrière un chiffre unique.

**Leçon transversale (méthode)** : un compteur de diagnostic doit être vérifié par un **arbitre indépendant du mécanisme suspecté** — ici, compter les `\r` en JS pur, insensible aux vues dynamiques du DOM InDesign. Et toute divergence journalisée doit être confrontée à l'**observation visuelle** : c'est l'œil (3, puis 39) qui a démasqué le log (1, puis 9), jamais l'inverse.

**Leçon sur les simulateurs (recoupement Cas 12)** : le simulateur Node de l'étape 1bis modélisait un compteur *idéal* (toujours juste) et validait donc le bug à tort — il ne pouvait structurellement pas l'attraper. Corrigé en modélisant explicitement le **détachement** (`contents = ""` → la `story` devient un proxy périmé, le texte vivant dans `parentStory`), **puis** en prouvant par un **contrôle négatif** que le simulateur *échoue* si l'ancien code revient. Un pré-check qui ne peut pas échouer ne prouve rien.

### Addendum — 3ᵉ défaut : le signal d'alerte lui-même peut mentir (faux positif)

Constaté sur le rejeu réel du 26/09 16:58 (nouveau code, 2 tirs curseur). Le log affichait `source=targetPoint.parentStory (REPLI sur story !)` — c'est-à-dire **une alarme de repli** — alors qu'aucun repli n'avait eu lieu. Le test utilisé était `liveStory === story`, qui confond deux situations opposées :

* **mode curseur** (`insertAtCursor=true`) : la story n'est **jamais vidée**, donc `targetPoint.parentStory` **est** `story` — c'est le fonctionnement **normal**, pas un repli ;
* **mode TextFrame** après vidage : `story` est un proxy périmé ; si `parentStory` échouait vraiment et qu'on retombait sur `story`, **là** c'était un repli dangereux.

Le libellé criait donc au loup sur les deux tirs les plus sains. **Correction** : `var isRealFallback = (liveStory === story) && !insertAtCursor;` — le signal n'apparaît que dans le seul cas où il a un sens. Verrouillé par une assertion dédiée dans le simulateur (26/26).

**Leçon** : un **indicateur d'erreur** est du code de diagnostic comme un autre et doit être testé comme tel. Un faux positif d'alarme est aussi nuisible qu'un faux négatif : il décrédibilise le log et pousse à ignorer les vraies alertes. Corollaire de méthode : un simulateur doit couvrir **chaque branche** qui produit un message (ici le mode curseur, absent de la couverture initiale) — sinon c'est précisément la branche non couverte qui ment.

---

## Cas 25 — Une valeur par défaut « qui rend service » applique un style sans geste de l'utilisateur

**Symptôme** : sur un document neuf, 72 paragraphes sur 85 ressortaient en style neutre (`[Aucun style]`) après import, alors que le récapitulatif du script affichait `ecarts=0 ... neutre=0`. L'utilisateur n'avait rien configuré : le style était « mis sans son intervention ». Seuls les titres et les paragraphes (`h1`, `h2`, `h3`, `p`) recevaient le bon style.

**Cause** : dans le dialogue de mapping, la **présélection** de chaque liste déroulante suivait une 3ᵉ règle de repli : *« sinon, le premier style disponible à la racine »* — c'est-à-dire, dans la pratique, le style neutre. Cette règle avait été ajoutée volontairement (« pour permettre de tester le flux sans configuration »). Or la 2ᵉ règle (correspondance exacte entre le nom du style et la convention HTML du tag) ne peut **structurellement jamais** aboutir pour une partie des tags :

| Tag | `htmlName` | Peut correspondre à un style réel ? |
|-----|-----------|-------------------------------------|
| `li`, `li2`..`li4` | `li`, `li2`..`li4` | ✗ |
| `li_num` | `ol` | ✗ |
| `blockquote` | `quote` | ✗ |
| `h1`, `h2`, `h3`, `p` | `h1`, `h2`, `h3`, `p` | ✓ |

Résultat : pour tous les tags de liste et de citation, la règle 2 échoue → la règle 3 s'applique → le **neutre est présélectionné en silence** → l'utilisateur clique OK (ou ne touche à rien) → **le neutre est persisté dans le mapping du document** comme s'il avait été choisi. Le symptôme n'était donc pas un problème d'API, d'héritage, ni d'adressage : la valeur *demandée* était déjà le neutre.

**Deux pièges de diagnostic, tous deux documentés comme leçons :**

1. **Le compteur d'auto-contrôle mentait.** `ecarts=0 / neutre=0` comptait les *applications réussies*, pas les *styles distincts* — appliquer le neutre est une application réussie. Un contrôle qui relit le paragraphe qu'il vient d'écrire valide la cohérence *interne* de l'action, jamais sa *pertinence*.
2. **Les sondes ponctuelles ne voyaient rien.** Ce qui a tranché est une **carte en plages (run-length) de la story entière** — une seule ligne de log listant, pour chaque plage contiguë de paragraphes, le style effectivement appliqué :
   ```
   0=H1 1=H2 2-6=[Aucun style] 7=H2 8=P 9-28=[Aucun style] ...
   ```
   72 paragraphes au neutre sont apparus d'un coup, invisibles à toutes les inspections locales précédentes.

**Correction** :
1. **Supprimer la règle de repli** — plus aucune présélection arbitraire.
2. **Ajouter une entrée sentinelle explicite** (« — non mappé — ») en tête de chaque liste, **sélectionnée par défaut** quand aucune correspondance n'existe.
3. **Au clic OK** : une sélection sur la sentinelle ⇒ le tag reste **absent** du mapping (aucune affectation), avec une ligne de log dédiée.

La sentinelle est écrite en **échappements ASCII** (`\u2014`, `\u00e9`) pour rester compatible avec l'encodage du script.

**Leçon transversale** : une valeur par défaut qui « rend service » est un bug en puissance. Un défaut doit être **explicite et visible** (« non mappé »), jamais **plausible et silencieux**. Et un repli silencieux devient particulièrement dangereux quand il est **persisté** : ce qui n'était qu'un confort de test se transforme en choix enregistré, que l'utilisateur croira ensuite avoir fait lui-même.

---

## Cas 26 — `Paragraph.index` n'est PAS un index de paragraphe

**Symptôme** : aucun style n'était appliqué du tout (`reels=0 ecarts=21 styles=0`) alors que le parseur produisait bien 21 blocs, et **uniquement** dans le chemin « insertion au curseur de texte » (`insertAtCursor=true`). Le même code fonctionnait en mode cadre. Un décalage constant d'un cran était suspecté — c'était autre chose.

**Cause** : `targetPoint.paragraphs[0].index` était utilisé comme point de départ pour calculer l'index du premier paragraphe inséré :

```javascript
baseParaIndex = targetPoint.paragraphs[0].index;   // ❌
```

Or `.index` renvoie ici un **offset de caractère dans la story**, pas une position de paragraphe. Valeur mesurée : `2015`, exactement égale à `story.contents.length − fullText.length` — la taille du texte déjà présent. La doc Adobe est ambiguë sur ce point (« The index of the text in the collection or parent object ») : le mot *index* laisse croire à un rang, alors que la valeur est une position de caractère.

Conséquence mécanique : `paraSnapshot[baseParaIndex + pb]` visait très au-delà de la fin du tableau ⇒ `undefined` pour chaque bloc ⇒ aucune application, sans erreur levée. Le décalage n'était donc pas « d'un cran » : il était **hors échelle**.

**Correction** : ne plus lire `.index` du tout dans le calcul. Reconstruire la frontière par **soustraction**, à partir de deux valeurs dont on maîtrise le sens :

```javascript
var insertedParaCount = (fullText.length > 0) ? (crCount + 1) : 0;
var baseParaIndex = paraSnapshot.length - insertedParaCount;
if (baseParaIndex < 0) { baseParaIndex = 0; }   // garde-fou + drapeau baseIndexKnown=false si incohérence
```

Preuve en réel : `baseParSoustraction=65` (= 86 − 21), puis `reels=21 ecarts=0 styles=21 neutre=0`. `.index` n'est plus lu que pour **journaliser** la frontière (comparaison), jamais pour calculer.

**Leçon transversale** : ne jamais se fier au **nom** d'une propriété du DOM InDesign pour en déduire sa **sémantique**. `.index` sonne comme un rang ; c'est un offset de caractère. La doc officielle entretient l'ambiguïté — dans ce cas, la seule autorité est la **mesure** : comparer la valeur lue à une valeur calculable par un autre chemin (`contents.length − fullText.length`) tranche en une ligne. Corollaire de méthode : un bug « d'un cran » peut en réalité être un bug **hors échelle** ; mesurer l'écart absolu, pas seulement son signe.

**Source vérifiée le 28/09/2026** (modèle objet Adobe InDesign 2026, indesignjs.de) — la formule ambiguë entre guillemets provient de la page `Paragraph`, verbatim : *« index Number readonly — The index of the text in the collection or parent object. »* (URL `https://www.indesignjs.de/indesignapi/indesign/Paragraph.html`, ancre `id="p-index"`, HTTP 200) — confirme le libellé documenté, sans lever l'ambiguïté « index de rang » vs « offset de caractère » que la mesure a tranchée.

---

## Cas 27 — Séparation stricte code maison / DOM InDesign (pourquoi le sandbox Node ne peut jamais suffire)

**Origine** : recherche externe menée le 27/09/2026 (FJD) pour savoir s'il existe un environnement dédié permettant de simuler InDesign (ExtendScript ou UXP) hors de l'application, façon "test-driven development". Résultat net et sourcé : **aucun mock du DOM InDesign n'existe dans la communauté**, ni en ExtendScript ni en UXP. Les frameworks de test trouvés (Extendables/Jasmine, jasminejsx) exécutent leurs tests **dans InDesign**, avec le vrai DOM — ils ne le remplacent jamais. Seul InDesign Server (licence payante, ~2100$/an) permet un vrai headless, mais avec le moteur de composition réel, pas un mock léger. Un thread Adobe Community de 2012 résume la pratique de la communauté : *« the decision went to use real world full runs rather than isolated test units »*.

> **Statut source (28/09/2026) — citation non retrouvée** : le thread Adobe Community de 2012 cité ici n'a **pas** pu être re-retrouvé en ligne avec certitude (aucune URL conservée au moment de la rédaction, et aucune page du guide de scripting local n'est disponible sur ce poste pour recouper). La **conclusion** de ce cas — pas de mock communautaire du DOM InDesign, frameworks de test exécutés dans InDesign, InDesign Server seul headless réel — reste, elle, **vérifiée** (constat de recherche FJD du 27/09/2026 et confortée par l'échec structurel du sandbox Node sur les Cas 23/24/26). La citation exacte est donc à considérer comme **non sourcée** ; la thèse du cas tient par la mesure et l'expérience, pas par cette citation.

**Raison structurelle (pas un manque d'outillage, une contrainte de fond)** : les objets `app`, `Document`, `Story`, `TextFrame`, etc. sont injectés par le runtime Adobe au moment de l'exécution dans l'application hôte — ce ne sont pas des modules importables ou substituables de l'extérieur. Un mock fidèle supposerait de réimplémenter tout le moteur de composition InDesign (retour à la ligne, gestion des styles, chaînage de texte, etc.) — hors de portée pour ce projet, et probablement pour n'importe quel projet hors Adobe lui-même.

**Conséquence directe, déjà vécue sur ce projet sans être nommée comme telle** : le sandbox Node maison (`simulate_*.js`, stubs `File`/`app`/`alert`) ne peut reproduire que ce qu'on lui a explicitement enseigné — il a été **structurellement incapable** de révéler les bugs les plus coûteux de la mission 03 (détachement de la référence `story` après vidage, Cas 24 ; `paragraphs.length` qui ment, Cas 23 ; `.index` qui n'est pas un index de paragraphe, Cas 26) parce que ce sont des comportements *runtime réels* d'InDesign, pas des questions de logique JS pure. Une simulation Node, aussi soignée soit-elle, ne remplace jamais le test réel — c'est déjà la règle non négociable de ce projet, et cette recherche en confirme le bien-fondé structurel plutôt que de le remettre en question.

**Principe à appliquer, déjà pratiqué dans ce projet sans avoir été formalisé** : séparer strictement, dans `import_md.jsx`, deux catégories de fonctions —

1. **Code maison, logique pure** (`parseMarkdown()`, `parseInlineMarkdown()`, `isWordBoundaryChar()`) : aucune référence à `app`/`Document`/`Story`/`TextFrame`, prend du texte en entrée, retourne des structures de données (blocs typés) en sortie. **Cette catégorie, et uniquement elle, est testable de façon fiable par simulation Node** — les résultats du sandbox y sont dignes de confiance, parce qu'il n'y a aucun comportement runtime InDesign à reproduire.
2. **Code d'intégration DOM** (`insertMarkdownWithStyles_v2()`, `resolveTargetStory()`, `checkAndCleanStylesAtTrigger()`, toute manipulation de `story`/`paragraphs`/`insertionPoints`) : appelle directement les objets du DOM InDesign. **Cette catégorie ne peut être validée que par test réel dans InDesign** — une simulation Node dessus ne prouve que la syntaxe et la logique de branchement, jamais le comportement réel (c'est exactement là que les Cas 23/24/26 ont été manqués par la simulation).

**Règle pratique qui en découle** : avant d'ajouter une fonction, se demander à laquelle des deux catégories elle appartient. Si elle mélange les deux (logique de transformation + appels DOM dans la même fonction), envisager de les séparer — la fonction de logique pure devient testable et fiable en simulation, la coquille DOM autour reste fine et le seul endroit qui nécessite un test réel.

---

## Cas 28 — Un style de paragraphe appelé depuis un style de CELLULE est surclassé (invisible au panneau Styles de paragraphe)

**Origine** : constat FJD du 27/09/2026, en test réel de l'étape 6 (tableaux). Symptôme : les cellules importées portaient un style de paragraphe **absent du panneau Styles de paragraphe** — impossible de le voir, donc impossible de le neutraliser par la voie habituelle. Verbatim FJD : *« les appels de styles de par sont faits depuis les styles de cellules, ils sont surclassés par des par standards par ailleurs absents de la section dans le panneau Styles de paragraphe. Le neutre doit passer aussi par style de cellule. »*

**Mécanisme réel** : dans une cellule, l'ordre d'application est **TableStyle → CellStyle → ParagraphStyle (appliqué au texte) → CharacterStyle**. Un `CellStyle` **porte** un `appliedParagraphStyle` (propriété *read/write* de `CellStyle`, type `ParagraphStyle | String | NothingEnum`). Tant que le texte de la cellule n'a **pas** de `appliedParagraphStyle` propre, le style de paragraphe effectif est **celui appelé par le style de cellule** — et ce style n'apparaît pas dans la liste des styles de paragraphe visibles du document, ce qui le rend indétectable au panneau.

**Conséquence pratique** : écrire du texte brut dans une cellule (`cell.texts[0].contents = "..."`) **ne suffit pas** à neutraliser. Il faut **poser explicitement** un `appliedParagraphStyle` sur le texte de chaque cellule.

**Route retenue (actée par FJD)** : lire le style de paragraphe appelé par le style de cellule **du TableStyle appliqué**, via `tableStyle.bodyRegionCellStyle.appliedParagraphStyle` (et `headerRegionCellStyle` pour l'en-tête), puis le poser sur `cell.paragraphs[0].appliedParagraphStyle`. Repli **neutre** (`document.paragraphStyles.item(0)`) si : aucun style de tableau, style de tableau introuvable, style de cellule n'appelant rien, ou nom appelé inexistant — **jamais de style au hasard**.

**Piège associé — `document.cellStyles` est une collection PLATE** : elle n'est **pas** hiérarchisée et ne permet donc **pas** de retrouver le style de cellule réellement appliqué à une région donnée. Chercher un `CellStyle` par nom dans `document.cellStyles` ne dit rien de la région (corps / en-tête / pied). La seule voie fiable est de **partir du TableStyle** (`bodyRegionCellStyle`, `headerRegionCellStyle`, `footerRegionCellStyle`, `headerColumnCellStyle`) — chacun étant de type `CellStyle`.

**API utile confirmée (build InDesign 21.x)** : `Cell.appliedCellStyle` (`CellStyle | String`, read/write) ; `Cell.paragraphs` (**readonly**, mais les paragraphes qu'il contient acceptent l'écriture de `appliedParagraphStyle`) ; `Cell.clearCellStyleOverrides(clearingOverridesThroughRootCellStyle?)` → void ; **`CellStyle` n'a PAS de `clearCellStyleOverrides`** (méthodes disponibles : addEventListener, duplicate, extractLabel, getElements, insertLabel, move, remove, removeEventListener, toSource).

**Sources vérifiées le 28/09/2026** (modèle objet Adobe InDesign 2026, indesignjs.de) — `Cell` expose bien `appliedCellStyle` (*« appliedCellStyle CellStyle | String read/write — The cell style applied to the cell. Can also accept: String. »*, ancre `id="p-appliedCellStyle"`), `paragraphs` (**readonly**, ancre `id="p-paragraphs"`) et `clearCellStyleOverrides` (méthode, ancre `id="m-clearCellStyleOverrides"`) : URL `https://www.indesignjs.de/indesignapi/indesign/Cell.html`. La page `CellStyle` ne contient **aucune** occurrence de `clearCellStyleOverrides` (URL `https://www.indesignjs.de/indesignapi/indesign/CellStyle.html`) — confirme que la méthode vit sur `Cell`, pas sur `CellStyle`. Les régions de style de cellule existent bien sur `TableStyle` : ancres `id="p-bodyRegionCellStyle"`, `id="p-headerRegionCellStyle"`, `id="p-footerRegionCellStyle"`, `id="p-headerColumnCellStyle"` toutes présentes (URL `https://www.indesignjs.de/indesignapi/indesign/TableStyle.html`).

**Preuve réelle (run 27/09/2026 22:25:46)** : `M03-etape6-detail: … erreurs=0 style_table=Table 1 style_cellule_para=appele:P Table cellules_style=18 cellules_neutre=0` ⇒ 18 cellules sur 18 portent le style appelé par le style de cellule, zéro repli neutre.

**Leçon transversale** : la « neutralisation » d'un document InDesign ne s'arrête pas aux styles de paragraphe visibles. Chaque niveau de la hiérarchie de style (table → cellule → paragraphe → caractère) peut **appeler** un style du niveau inférieur ; ignorer un niveau, c'est laisser un style invisible agir. Un log de diagnostic qui **nomme le style réellement posé** (`style_cellule_para=appele:<nom>`) vaut mieux qu'une inspection visuelle du panneau, qui ne peut pas montrer ce qui n'y est pas listé.

---

## Cas 29 — Une sonde de vérification d'offset basée sur `indexOf` peut rendre un faux négatif

**Origine** : étape 6, contrôle d'intégrité de l'ancrage des tables. Le log affichait `offset_verifie=FAUX(trouve=0,attendu=119)` alors que les ancrages étaient **corrects** (49 et 85 relatifs, identiques à un run propre antérieur).

**Cause** : la sonde utilisait `story.contents.indexOf(sonde)`, qui renvoie la **première** occurrence de la chaîne dans tout le document. Si le document contient **déjà** le texte importé (cas fréquent en test, document réutilisé), la sonde est trouvée à l'offset **0** et non à l'offset attendu ⇒ le contrôle déclare un échec qui n'existe pas.

**Leçon** : un contrôle de position doit chercher à partir de la position attendue — `contents.indexOf(sonde, offsetAttendu)` — ou mieux, **comparer directement** la tranche : `contents.substr(offsetAttendu, sonde.length) === sonde`. Une sonde de vérification qui peut produire un **faux négatif** est plus dangereuse qu'une absence de sonde : elle fait perdre du temps à chasser un bug inexistant, et elle érode la confiance dans le log.

**Règle pratique** : distinguer explicitement, dans le log, un échec **structurel** (le texte n'est pas au bon endroit) d'une **limite de la mesure** (`trouve=0` avec `attendu>0` sur un document non neuf). Le champ `offsets_fiables` (calculé indépendamment, par égalité de longueurs) et le champ `offset_verifie` (mesure ponctuelle) doivent rester **séparés** : c'est le premier qui fait foi.

---

## Cas 30 — L'esperluette d'accélérateur dans les `title` de menus (`&Fichier`, `I&mporter...`)

**Origine** : étape 9 (intégration au menu InDesign), sonde `tools/probe_menu2.jsx` exécutée en réel le 28/09/2026 (InDesign 21.6.0.57 fr_FR). La sonde cherchait le menu Fichier avec un filtre écrit au clair : `path.indexOf("Main/Fichier") === 0`. Résultat du journal : `CIBLE = INTROUVABLE`, puis `(pas de cible : essai d'ajout non execute)`. **La cible existait bel et bien** — c'est le filtre qui ne pouvait pas la reconnaître.

**Mécanisme réel** : les `title` de menus et d'items InDesign portent les **esperluettes d'accélérateur** du libellé (le caractère souligné sous Windows, pour la navigation Alt). Mesures brutes du journal de la sonde 2 :

```
MENU d=1 | path=Main/&Fichier | name=Fichier | title=&Fichier | items=29 | submenus=6
ITEM path=Main/&Fichier [10] name=Importer... | title=I&mporter... | action=Importer...
```

Deux conséquences immédiates, toutes deux mesurées :

1. **Les `title` ne sont pas comparables au clair** : `"Fichier" !== "&Fichier"`. La sonde 2 construisait ses chemins (`path`) à partir des `title`, d'où des chemins réels du type `Main/&Fichier` ; un filtre écrit `Main/Fichier` ne matche donc **jamais**.
2. **Une recherche de sous-chaîne échoue aussi** : `"I&mporter...".indexOf("Importer") === -1`. Chercher « Importer » dans le `title` de l'item « Importer… » ne le trouve pas — l'esperluette est **au milieu du mot**.

L'esperluette ne se limite pas au premier caractère (relevé sur les 6 sous-menus réels de Fichier) : `&Nouveau`, `Ouvrir une composition &récente`, `Paramètres prédéfinis Ado&be PDF`, `Param&ètres prédéfinis du document`, `Paramètres utilisateur`, `Impressions pr&édéfinies`. Elle peut donc tomber **n'importe où** dans le libellé, y compris à l'intérieur d'un mot.

**Ce que dit la doc officielle** (`indesignjs.de/indesignapi/indesign/`, export du modèle objet Adobe InDesign 2026, propriété `title` de `MenuAction` / `MenuItem` / `ScriptMenuAction`) : *« The title includes any ampersand characters (&), which are used to tell the Windows OS to underline the following character in the name for use with the Alt key to navigate to a menu item. Double ampersands are used to display an actual ampersand character in the name. The Mac OS ignores and removes the extra ampersand characters. »*

**Source vérifiée le 28/09/2026** — la citation provient bien de la page `title` (`id="p-title"`) du modèle objet, présente à l'identique sur les trois classes `MenuItem` (URL `https://www.indesignjs.de/indesignapi/indesign/MenuItem.html`), `MenuAction` (URL `https://www.indesignjs.de/indesignapi/indesign/MenuAction.html`) et `ScriptMenuAction` (URL `https://www.indesignjs.de/indesignapi/indesign/ScriptMenuAction.html`) — HTTP 200, consultées le 28/09/2026.

**Piège de lecture de cette citation** : « The Mac OS ignores and removes the extra ampersand characters » décrit l'**affichage** (macOS ne souligne rien), **pas la valeur de la propriété**. Mesure réelle sur macOS fr_FR : `title` renvoie bien `&Fichier` et `I&mporter...`, esperluettes **incluses**. On ne peut donc pas s'appuyer sur cette phrase pour croire la propriété nettoyée.

**Où trouver la valeur propre** : la propriété `name` du même objet ne porte pas l'esperluette (`name=Fichier` face à `title=&Fichier` ; `name=Importer...` face à `title=I&mporter...`). Elle reste liée au contexte : pour la barre de menus elle vaut `Main` tel quel, et `translateKeyString('$ID/TouchMenuFile')` renvoie `Fichier` — sans esperluette non plus.

**Preuve réelle (sonde 2, 28/09/2026)** : `app.menus.length = 151`, une seule barre de menus (`Main`, 11 sous-menus) ; les chemins mesurés sous `Main` sont `Main/&Fichier`, `Main/&Edition`, `Main/&Page`, `Main/&Texte` ; `Main/&Fichier` expose `items=29 submenus=6` et l'item `[10] name=Importer... | title=I&mporter...` est un **item direct**, pas un sous-menu.

**Leçon** : ne **jamais** comparer, filtrer, indexer ou construire un chemin à partir d'un `title` de menu InDesign tel quel. Normaliser d'abord : `String(title).replace(/&/g, "")`. Le réflexe vaut pour les tests d'égalité comme pour les `indexOf`, les expressions régulières et les clés de dictionnaire.

**Limite connue de cette normalisation** : `replace(/&/g, "")` retire aussi les esperluettes **littérales** (notées `&&` dans le libellé, cf. citation ci-dessus). Acceptable ici — aucun libellé de l'arbre mesuré n'en contient — mais à garder en tête si un libellé InDesign venait à afficher un `&` voulu.

**Portée au-delà du cas** : ce faux négatif est **silencieux** — la sonde s'arrête « proprement » en déclarant la cible introuvable, ce qui laisse croire à une absence d'API ou à un bug d'InDesign alors que seul le code de recherche est fautif (même famille que le **Cas 29**, où une sonde rendait un faux négatif crédible). Règle : quand une sonde déclare une cible « introuvable » alors qu'un humain la voit dans le menu, **dumper la valeur brute** (`name` **et** `title`) avant toute conclusion.

---

## Cas 31 — Déclencheur d'une `ScriptMenuAction` : seul un gestionnaire de type `File` survit à la fin du script

**Origine** : étape 9 (intégration au menu InDesign). L'entrée de menu était bien **créée** (`menu='Fichier' items 29 -> 30` au journal) mais un **clic réel ne lançait rien**. Le gestionnaire câblé était une **fonction du script** : `action.addEventListener("onInvoke", onMenuImportMdInvoke)`.

**Diagnostic — c'est la sonde `tools/probe_menu3.jsx` qui tranche, par une double mesure** (journal `probe_menu3.log`, InDesign 21.6.0.57 fr_FR, 28/09/2026).

**Mesure A — appel programmatique `action.invoke()` PENDANT l'exécution du script : les quatre formes de gestionnaire répondent.** Extraits verbatim du journal (horodatage conservé, seuls les chemins longs sont abrégés par `…` ; le reste est brut) :

```
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] --- 7) test automatique action.invoke() (sans clic) ---
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-A : AVANT
Mon Sep 28 2026 04:09:06 GMT+0200 [S3-A] FONCTION DU SCRIPT + ON_INVOKE : DECLENCHE | typeof main=function | typeof PROBE_LOG_PATH=string | typeof findSubmenuByTitle=function | typeof LINES=object | $.fileName=…/probe_menu3.jsx | $.global.__S3_MARKER=string
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-A : APRES (aucune erreur)
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-B : AVANT
Mon Sep 28 2026 04:09:06 GMT+0200 [S3-B] FONCTION DU SCRIPT + BEFORE_INVOKE : DECLENCHE | typeof main=function | typeof PROBE_LOG_PATH=string | typeof LINES=object | $.fileName=…/probe_menu3.jsx
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-B : APRES (aucune erreur)
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-C : AVANT
Mon Sep 28 2026 04:09:06 GMT+0200 [S3-C] FONCTION AUTONOME (new Function) : DECLENCHE | typeof main=function | typeof $.global.__S3_MARKER=string | $.fileName=…/probe_menu3.jsx
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-C : APRES (aucune erreur)
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-D : AVANT
Mon Sep 28 2026 04:09:06 GMT+0200 [S3-D] FICHIER GESTIONNAIRE (handler: File) : DECLENCHE | $.fileName=…/probe_menu3_file_handler.jsx | typeof app=object | typeof main=function | typeof logToFile=undefined | typeof $.global.__S3_MARKER=string
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] invoke() sur S3-D : APRES (aucune erreur)
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] --- fin du test automatique ---
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] RAPPEL : ces lignes ne disent rien du CLIC ; il reste
Mon Sep 28 2026 04:09:06 GMT+0200 [SONDE] a cliquer [S3-A], [S3-B], [S3-C], [S3-D] dans le menu.
```

Le câblage `addEventListener` est donc **correct pour les quatre** — et `invoke()` est utilisable comme **autotest de câblage**, sans intervention humaine. Noter que la sonde **énonce elle-même sa limite** (deux dernières lignes ci-dessus) : ces mesures ne disent rien du clic. C'est exactement la bonne posture de sonde — séparer ce qu'elle prouve de ce qu'elle ne prouve pas, pour que personne ne lise dans le log plus qu'il ne contient.

**Mesure B — clic RÉEL de l'utilisateur, APRÈS la fin du script : seule la forme `File` écrit.** Verbatim (deux clics, mêmes lignes, chemins abrégés par `…`) :

```
Mon Sep 28 2026 04:10:06 GMT+0200 [S3-D] FICHIER GESTIONNAIRE (handler: File) : DECLENCHE | $.fileName=…/probe_menu3_file_handler.jsx | typeof app=object | typeof main=undefined | typeof logToFile=undefined | typeof $.global.__S3_MARKER=undefined
Mon Sep 28 2026 04:10:19 GMT+0200 [S3-D] FICHIER GESTIONNAIRE (handler: File) : DECLENCHE | $.fileName=…/probe_menu3_file_handler.jsx | typeof app=object | typeof main=undefined | typeof logToFile=undefined | typeof $.global.__S3_MARKER=undefined
```

Au clic, **aucune ligne `[S3-A]`, `[S3-B]` ni `[S3-C]`** n'est écrite après la fin du script, alors que le fait d'écrire au journal a été prouvé possible au même instant, sur le **même chemin** et en **même mode append**, par `[S3-D]` (le fichier gestionnaire écrit dans `probe_menu3.log`, le même journal que les fonctions). Les trois gestionnaires « fonction » sont donc **bel et bien morts** après la sortie du script ; ce n'est pas une écriture qui échouerait silencieusement.

**Ce que la lecture du journal révèle en plus, et qui est capital** : au clic, `typeof app = object` mais `typeof main = undefined`, `typeof logToFile = undefined`. Le moteur qui exécute le clic ne **partage rien** avec celui qui a enregistré l'entrée — les variables du script ont disparu avec lui. Une fonction gestionnaire est une **fermeture** sur ces variables ; elle ne peut pas survivre à leur disparition.

**Ce que dit la doc officielle** — `ScriptMenuAction.addEventListener(eventType, handler, captures?)` (URL `https://www.indesignjs.de/indesignapi/indesign/ScriptMenuAction.html`, export du modèle objet Adobe InDesign 2026 (21.5.1.73), consultée le 28/09/2026) :

- `eventType` (String) : « The event type. »
- `handler` (**File | JavaScriptFunction**) : « The event handler. **Can accept: File or JavaScript Function.** »
- `captures?` (Boolean) : « This parameter is obsolete. »
- `ScriptMenuAction.ON_INVOKE` : « Dispatched when the ScriptMenuAction is invoked. This event does not bubble. This event is not cancelable. »
- `ScriptMenuAction.invoke()` : « Invoke the action. » — `ScriptMenuAction.remove()` : « Deletes the ScriptMenuAction. »

La doc annonce **deux formes acceptées** ; elle ne dit **pas** laquelle survit. C'est la mesure qui tranche : **`File`**. La doc décrit la signature, jamais la durée de vie — ne pas confondre les deux.

⚠️ **URL à ne plus citer** : `https://www.indesignjs.de/extendscriptAPI/indesign/ScriptMenuAction.html` renvoie **HTTP 404** (vérifié deux fois le 28/09/2026). Le miroir valide est `/indesignapi/indesign/`.

**Solution retenue** (un seul fichier, zéro logique dupliquée) : le gestionnaire de l'entrée est **`new File(<chemin absolu de ce script>)`**. Cliquer l'entrée **réexécute le script**, dont les deux dernières instructions sont :

```javascript
registerMenuEntry();   // déjà conforme -> sans effet (cf. ci-dessous)
main();                // le clic déclenche EXACTEMENT main()
```

`$.fileName` est renseigné même quand InDesign exécute le script comme gestionnaire (mesuré : `[S3-D] … | $.fileName=…/probe_menu3_file_handler.jsx` dans les lignes de clic ci-dessus). Il arrive sous forme **encodée et abrégée** — verbatim de l'en-tête du journal de la sonde 3 :

```
$.fileName = ~/Library/Preferences/Adobe%20InDesign/Version%2021.0/fr_FR/Scripts/Scripts%20Panel/probe_menu3.jsx
```

`new File($.fileName).fsName` le **décode** en chemin absolu utilisable. Preuve verbatim (même en-tête, comparaison du chemin dérivé au chemin réel tapé en dur dans la sonde) :

```
journal = ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/probe_menu3.log
journal (chemin derive du script) = ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/probe_menu3.log
les deux chemins coincident = true
```

**Corollaire de code indispensable — l'enregistrement doit être non destructif quand l'entrée est déjà conforme.** Puisque le clic réexécute le script, une `registerMenuEntry()` qui retire systématiquement l'action avant de la recréer **détruirait l'objet même qui est en train d'être invoqué**. La vérification de conformité (une seule entrée, à sa place, une seule action) doit donc passer **avant tout retrait**, et sortir en `return true` sans rien toucher. Ligne de journal correspondante (format du script, à constater au prochain run réel) :

```
M03-etape9: entree de menu deja conforme -> rien a faire | menu='Fichier' items=N | index=I | scriptMenuActions=1
```

**Leçon transversale** : « la doc documente un paramètre » ne veut pas dire « toutes les valeurs du paramètre sont équivalentes ». Pour un **déclencheur durable**, la question n'est pas « est-ce accepté ? » mais « **qu'est-ce qui survit à la fin du script ?** » — et cette question ne se règle que par une mesure discriminante : provoquer **le même effet** (ici : déclencher) par **deux voies différentes** (ici : `invoke()` puis un vrai clic) et comparer. Ici, `invoke()` a menti par optimisme : tout marchait ; le clic a révélé la vérité. Un test programmatique ne remplace jamais le geste réel de l'utilisateur.

**Persistance — deux questions distinctes, toutes deux désormais MESURÉES** :

| Question | Réponse mesurée | Preuve |
|---|---|---|
| L'entrée survit-elle à la **fin du script** ? | **OUI** | le clic l'atteint (`[S3-D]`, sonde 3) ; l'entrée créée à 04:35:52 est cliquée à 04:36:00 et 04:36:57 |
| L'entrée survit-elle à un **redémarrage d'InDesign** ? | **NON** | constaté par FJD le 28/09 → **voir Cas 34** |

⇒ L'entrée doit être **recréée à chaque lancement** d'InDesign — c'est la piste de recréation automatique instruite au **Cas 34** (citation Adobe first-party) et au **Cas 35** (dossier réellement présent sur le poste).

⚠️ **Correction du 28/09 (une mesure antérieure était fausse).** Une version précédente de cette ligne affirmait « le dossier `Scripts/Startup Scripts` **n'existe pas** sur ce poste (mesuré `existe = false` sur les deux chemins candidats) ». Cette affirmation était **partiellement fausse**, et le journal brut (`/tmp/probe_menu.clean.log`, lignes 175-176) le prouve :

```
dossier 'Startup Scripts' = ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Startup Scripts | existe = false
dossier app 'Scripts/Startup Scripts' = /Applications/Scripts/Startup Scripts | existe = false
```

- **Candidat 1 (préférences utilisateur)** : chemin correct, `false` **significatif** → le dossier est réellement absent côté utilisateur.
- **Candidat 2 (dossier d'application)** : le chemin imprimé est `/Applications/Scripts/Startup Scripts`, c'est-à-dire **faux**. Le code de la sonde (`tools/probe_menu.jsx`, ligne 152) le construisait avec `app.filePath.parent.fsName`, or `app.filePath` ne vaut pas ce qu'on croyait : `.parent` retombe sur `/Applications`. Le `false` de cette ligne est donc un **artefact de chemin**, pas une mesure — **exactement la même classe de faute que le Cas 32** (`exists` interrogé sur un objet qui n'est pas un `File`/`Folder`).

Le dossier d'application **existe bel et bien** : `/Applications/Adobe InDesign 2026/Scripts/startup scripts` (nom exact sur disque en minuscules, vérifié octet par octet avec `od -c`). Détail complet au **Cas 35**.

**Leçon ajoutée** : un `false` n'est une mesure que si le **chemin testé** est lui-même vérifié. Un `existe = false` sur un chemin fabriqué de travers est un faux négatif silencieux — il faut **lire le chemin imprimé**, pas le booléen. Corollaire : ici le journal *imprimait* le chemin fautif, la faute était donc visible à l'œil nu ; la lire est ce qui a manqué.

---

## Cas 32 — `chemin.exists` sur une **chaîne** renvoie `undefined` : la sonde qui crie au loup

**Origine** : sonde 3, contrôle de présence du script compagnon avant le test `File`. Le chemin était construit comme une **chaîne**. Extraits verbatim de `tools/probe_menu3.jsx` (lignes 32, 343 et 344) :

```javascript
var COMPANION_PATH = new File($.fileName).parent.fsName + "/probe_menu3_file_handler.jsx";
   ...
   p("compagnon = " + COMPANION_PATH + " | existe = " + COMPANION_PATH.exists);
   if (!COMPANION_PATH.exists) {
```

Le journal conclut, verbatim (en-tête de `probe_menu3.log`) :

```
compagnon = ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/probe_menu3_file_handler.jsx | existe = undefined

!!! ATTENTION : le compagnon probe_menu3_file_handler.jsx est ABSENT.
!!! L'entree [S3-D] ne pourra pas fonctionner. Ce n'est pas bloquant
!!! pour les tests A, B et C.
```

⇒ branchement sur la branche « absent » ⇒ avertissement **« compagnon ABSENT »** — alors que le fichier était **présent** et a pleinement fonctionné (`[S3-D]` s'est déclenché, au clic comme à l'`invoke()`). La sonde a donc averti d'une panne imaginaire, tout en continuant.

**Mécanisme** : `.exists` est une propriété d'**objet `File`**, pas de `String`. Lue sur une chaîne, elle vaut `undefined` — **sans lever d'erreur, sans avertissement**. Le test `if (chaîne.exists)` est donc toujours faux, en silence.

**Règle** : toujours **matérialiser** un chemin en objet avant de lui lire une propriété de fichier, et comparer explicitement à `true` :

```javascript
var f = new File(chemin);           // objet File, pas String
if (f.exists === true) { ... }      // verification explicite
```

**Famille** : **Cas 29** et **Cas 30** — une sonde qui rend un **faux négatif** coûte plus cher qu'aucune sonde : elle envoie chasser un bug inexistant et **érode la confiance dans le journal**, qui est la seule preuve acceptée sur ce projet. Corollaire : quand une sonde signale une absence inattendue, **dumper la valeur et son type** (`existe=undefined`, `typeof = string`) avant de conclure quoi que ce soit.

---

## Cas 33 — `$.global` ne transporte PAS d'état du script vers l'événement qu'il a câblé

**Origine** : sonde 3. Pendant l'enregistrement, un marqueur était posé dans le global — extrait verbatim de `tools/probe_menu3.jsx` (ligne 407) :

```javascript
try { $.global.__S3_MARKER = "pose-par-la-sonde3"; } catch (eg) {}
```

**Mesures croisées** :

| Moment d'exécution | Lecture du marqueur |
|---|---|
| Pendant le script (gestionnaires appelés par `invoke()`) | `typeof $.global.__S3_MARKER = string` |
| Au clic réel, après la fin du script (dans `[S3-D]`) | `typeof $.global.__S3_MARKER = undefined` |

**Conclusion** : on **ne peut pas** transmettre une fonction, un objet ou une donnée par `$.global` pour la retrouver au moment où l'utilisateur active réellement l'entrée de menu. Le global du script ne franchit pas la frontière « fin du script → événement ».

**Portée — complément direct du Cas 31** : c'était précisément la parade tentée pour garder une fonction gestionnaire vivante (`$.global.__M03_MENU_HANDLER = onMenuImportMdInvoke`) ; elle est **sans effet**, et la ligne a été **supprimée** du script. La seule chose qui traverse la frontière est le **fichier** désigné comme gestionnaire (`File`) et les objets persistants du DOM InDesign (l'entrée de menu elle-même, les actions de script). Règle pratique : **pour tout déclencheur durable, viser un `File` dès la conception** — ne pas tenter `$.global`, `new Function`, ni une fermeture.

---

## Cas 34 — Une `ScriptMenuAction` créée au runtime ne survit PAS au redémarrage d'InDesign

**Origine** : étape 9, question posée **avant même d'écrire le code** (« est-ce qu'une entrée de menu créée par script persiste après un redémarrage d'InDesign, ou doit-elle être recréée à chaque lancement ? »). Question tranchée par la mesure, pas par supposition.

**Le test réel du 28/09 a d'abord validé les trois critères** — preuve verbatim, journal `import_md_errors.log`, `InDesign 21.6.0.57 fr_FR` :

```
[Mon Sep 28 2026 04:35:52 GMT+0200] M03-etape9: entree de menu creee -> 'Importer un MD' apres 'Importer...'
   | menu='Fichier' items 34 -> 35 | declencheur=File ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx (exists=true) | eventType=onInvoke | scriptMenuActions=8
```

**Clic n° 1 (04:36:00 → 04:36:11)** — la ligne de conformité, puis `main()` :

```
[Mon Sep 28 2026 04:36:00 GMT+0200] M03-etape9: entree de menu deja conforme -> rien a faire | menu='Fichier' items=35 | index=11 | scriptMenuActions=1
[Mon Sep 28 2026 04:36:00 GMT+0200] M03-etape1bis: mode=InsertionPoint | paragraphes avant=0
[Mon Sep 28 2026 04:36:00 GMT+0200] PIVOT unifie: selection.length=1 | mode detecte=curseur
...
[Mon Sep 28 2026 04:36:07 GMT+0200] showConfigurationDialog: construction des boutons
...
[Mon Sep 28 2026 04:36:11 GMT+0200] M03-etape2: blocs=63 paragraphes attendus=63 reels=63 ecarts=0 | mode=curseur base=0 story_total=63 styles=63 neutre=0 baseIndexConnu=true avant_fenetre=0 apres_fenetre=0
```

**Clic n° 2 (04:36:57 → 04:37:15)** — même conformité, puis une **seconde** insertion qui s'ajoute à la première (`base=63 story_total=102`) :

```
[Mon Sep 28 2026 04:36:57 GMT+0200] M03-etape9: entree de menu deja conforme -> rien a faire | menu='Fichier' items=35 | index=11 | scriptMenuActions=1
[Mon Sep 28 2026 04:36:57 GMT+0200] M03-etape1bis: mode=InsertionPoint | paragraphes avant=63
...
[Mon Sep 28 2026 04:37:15 GMT+0200] M03-etape2: blocs=39 paragraphes attendus=39 reels=39 ecarts=0 | mode=curseur base=63 story_total=102 styles=39 neutre=0 baseIndexConnu=true avant_fenetre=63 apres_fenetre=0
```

⇒ Le chemin `File` fonctionne, **deux fois de suite** : clic → réexécution → conformité (aucune destruction, `items=35` inchangé, `index=11` inchangé) → `main()` → pipeline complet jusqu'au dialogue, puis insertion. Le `paragraphes avant=63` du 2ᵉ clic **prouve** que le 1ᵉʳ clic avait bien inséré son contenu (le réimport s'est empilé : `base=63`, `story_total=102`).

**Le 4ᵉ point, en revanche, a échoué** : après **redémarrage d'InDesign, l'entrée a disparu** (constaté par FJD le 28/09).

⚠️ **Ne pas confondre « créée par script » et « persistante ».** Ce qui est mesuré maintenant, séparément :

| Frontière | L'entrée traverse ? |
|---|---|
| fin du script d'enregistrement → session en cours | **OUI** (clic atteint, Cas 31) |
| fin de session → redémarrage d'InDesign | **NON** |

**Ce que dit la doc officielle — et ce qu'elle ne dit pas** (source : `https://www.indesignjs.de/indesignapi/indesign/ScriptMenuAction.html`, build 2026 / 21.5.1) : la description de `remove()` est « Deletes the ScriptMenuAction. » ; `addEventListener`, `invoke` et `remove` sont documentés, la **durée de vie** ne l'est **nulle part**. La doc décrit l'API, jamais la persistance — comme pour le paramètre `handler` au Cas 31, la réponse est dans la mesure.

**Conséquences pratiques** — l'entrée doit être **recréée à chaque lancement** d'InDesign. Deux voies, dont la première est désormais **mesurée** :

1. **script de démarrage** — mécanisme **documenté par Adobe** (read-me livré avec l'application, citation verbatim au **Cas 35**) : un script déposé dans le sous-dossier `Startup Scripts` du dossier `Scripts` s'exécute une fois à chaque lancement. **Mesuré le 28/09/2026 (Cas 35)** : le dossier **existe** des deux côtés (`/Applications/Adobe InDesign 2026/Scripts/startup scripts/` — `root:admin`, ne contenant que `ForceDirectory.txt` — et `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Startup Scripts/`) ; la balise « ce dossier **n'existe pas** » d'une version antérieure de ce cas était un **artefact de chemin** (cf. Cas 32 : un `false` n'est une mesure que si le chemin testé est lui-même vérifié — lire le chemin imprimé, pas le booléen). Le script du dossier **utilisateur** est réellement exécuté au lancement, la barre de menus y est **déjà construite** (`menus.length = 151`, `Fichier` à 29 entrées, `Importer...` à l'index 10, `documents.length = 0`), une entrée peut y être **créée** et un **clic réel** la rejoue ⇒ **aucun report sur `afterOpen` n'est nécessaire**. Piège d'architecture associé : `import_md.jsx` se termine par `main();`, donc le chargeur doit **enregistrer** une entrée dont le gestionnaire est `new File(<chemin de import_md.jsx>)` et **ne jamais exécuter** ce fichier — sinon la boîte de dialogue s'ouvre à chaque lancement ;
2. **premier lancement manuel assumé** — l'entrée se crée au premier passage par le Panneau Scripts, puis vit pour la session. Aucun artefact supplémentaire, mais **la promesse « sans plus nécessiter le Panneau Scripts » n'est alors tenue qu'après ce premier lancement**.

**Leçon transversale** : « ça marche pendant que je travaille » et « ça survit à un redémarrage » sont **deux propriétés différentes** — et elles ne se testent pas en même temps. Le test qui les distingue (redémarrer l'application) est **grossier, lent, manuel et hors du code** ; c'est précisément pour ça qu'il faut le faire, et tôt. Une entrée de menu créée dynamiquement vit dans l'**état de l'application**, pas dans le **document** ni sur le **disque** : rien, par défaut, ne la ressuscite.

**Règle** : pour tout élément d'interface créé par script (entrée de menu, action, panneau), se poser la question **« qui le recrée au prochain démarrage ? »** au moment de la conception, et vérifier par un redémarrage **réel** — jamais par déduction.

---

## Cas 35 — Un script déposé dans `Startup Scripts` est bien exécuté au lancement, et la barre de menus y est DÉJÀ construite

**Origine** : le Cas 34 laissait la voie 1 (« script de démarrage ») explicitement **non mesurée** (« cette affirmation n'est PAS mesurée ici… ce dossier n'existe pas… à instruire par une sonde avant toute affirmation »). La sonde a été écrite et exécutée le 28/09/2026.

**Ce que dit la doc Adobe — verbatim**, cité depuis le read-me **livré avec l'application** (autorité de première partie, pas un blog ni un forum) : `/Applications/Adobe InDesign 2026/Documentation/fr_FR/Lisez-moi Scripts InDesign 2026.pdf`, section « Problèmes connus liés à l'élaboration de scripts InDesign » → « Emplacement des scripts de lancement JavaScript », p. 10 :

> Les scripts de lancement utilisateur doivent être placés au même emplacement que les scripts de lancement InDesign (où ils **s'exécutent une seule fois à chaque lancement de l'application**), et non à l'emplacement où se trouvent les scripts d'initialisation de moteur ExtendScript (où ils sont exécutés à chaque initialisation d'un moteur). Pour exécuter les scripts au lancement du logiciel InDesign, placez-les dans le sous-dossier **Startup Scripts** (Scripts de lancement) du dossier **Scripts, situé dans le dossier d'application InDesign**. (**Si ce dossier n'existe pas, créez-le.**)

Formulation **identique** dans les read-me 2024, 2025 et 2026. Détail d'extraction : dans le PDF, l'espace de `Startup Scripts` est un **U+00A0** (insécable) — un `grep 'Startup Scripts'` avec espace ordinaire ne le trouve pas, `grep -E 'Startup\s+Scripts'` si. Le texte extrait est conservé dans `/tmp/indd_readme_scripts.txt`.

**Les deux inconnues que seule une mesure pouvait lever** :

1. un script déposé dans un dossier `Startup Scripts` est-il **réellement** exécuté au lancement sur ce poste ?
2. à cet instant précis, la barre de menus (`app.menus`, l'entrée « Fichier ») est-elle **déjà construite** — ou faut-il différer l'enregistrement (par exemple sur `afterOpen`) ?

**Sonde** : `tools/probe_startup.jsx`, déployée dans `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Startup Scripts/` (dossier **utilisateur**). Son gestionnaire `File` est `tools/probe_startup_handler.jsx`, laissé **uniquement dans le dépôt** — s'il était déposé dans le même dossier, InDesign l'exécuterait aussi au lancement et polluerait la mesure.

**Mesure 1 — oui, le script du dossier utilisateur est exécuté au lancement** (journal brut) :

```
[Mon Sep 28 2026 04:54:04 GMT+0200] A/fileName    = ~/Library/Preferences/Adobe%20InDesign/Version%2021.0/fr_FR/Scripts/Startup%20Scripts/probe_startup.jsx
[Mon Sep 28 2026 04:54:04 GMT+0200] A/engineName  = main
[Mon Sep 28 2026 04:54:04 GMT+0200] A/app.version = 21.6.0.57
[Mon Sep 28 2026 04:54:04 GMT+0200] B/documents.length        = 0      (0 = aucun document ouvert a cet instant)
```

⇒ Le dossier **utilisateur** fonctionne — alors que la doc Adobe ne mentionne que le dossier **d'application**. Les deux chemins existent réellement sur ce poste :

| Chemin | État mesuré |
|---|---|
| `/Applications/Adobe InDesign 2026/Scripts/startup scripts/` | existe, `root:admin`, ne contient que `ForceDirectory.txt` |
| `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Startup Scripts/` | existe (dossier utilisateur) |

`Scripts/Startup Scripts` et `Scripts/startup scripts` désignent **le même dossier** sur ce poste (système de fichiers insensible à la casse) : `stat -f "%i %N"` renvoie l'inode `108734100` pour les deux graphies. La graphie **réellement présente sur le disque** est `startup scripts` (vérifiée avec `od -c`).

**Mesure 2 — la barre de menus est DÉJÀ entièrement construite** :

```
[Mon Sep 28 2026 04:54:04 GMT+0200] B/menus.length            = 151    (151 mesure quand la barre est construite)
[Mon Sep 28 2026 04:54:06 GMT+0200] C/menu 'Main' TROUVE | submenus = 11
[Mon Sep 28 2026 04:54:06 GMT+0200] C/'Fichier' TROUVE | items = 29
[Mon Sep 28 2026 04:54:06 GMT+0200] C/item 'Importer...' index = 10
```

⇒ 151 menus, et les 29 entrées de `Fichier` déjà en place (`10:Importer...`, exactement comme en session normale) — le tout **avant l'ouverture du moindre document**. **Aucun report sur `afterOpen` n'est nécessaire** : l'hypothèse est réfutée par la mesure, pas par un raisonnement.

**Mesure 3 — l'entrée est créable depuis là, et un clic réel la rejoue** :

```
[Mon Sep 28 2026 04:54:07 GMT+0200] D/entree sonde deja presente ? items=0 actions=0
[Mon Sep 28 2026 04:54:07 GMT+0200] D/ENTREE POSEE: '[SONDE DEMARRAGE] Entree de test' apres 'Importer...' (index 10)
   | items 29 -> 30 | declencheur=File /Users/.../tools/probe_startup_handler.jsx (exists=true) | eventType=onInvoke | scriptMenuActions=3
[Mon Sep 28 2026 04:54:35 GMT+0200] E/CLIC DECLENCHE sur l'entree de sonde de demarrage
   | $.fileName=~/INDD/IMPORT_MD/tools/probe_startup_handler.jsx | app.version=21.6.0.57 | documents.length=1 | menus.length=151
```

⇒ **31 secondes** après le lancement, un clic **réel** de l'utilisateur sur l'entrée créée par le script de démarrage exécute bien le gestionnaire `File`. **La chaîne complète est établie** : lancement → script de démarrage exécuté → entrée créée → clic → gestionnaire rejoué.

**Corroboration indépendante — Adobe utilise lui-même ce mécanisme.** Le dossier d'application `Scripts/startup scripts/` contient **deux chargeurs .jsxbin livrés avec le logiciel** (`converturltohyperlink/startup scripts/ConvertURLToHyperlinkMenuItemLoader.jsx`, idem `footnoteendnoteconversion`). Leur **source .jsx lisible** (103 lignes, conservée telle quelle) est un modèle à suivre :

```javascript
#targetengine "ConvertURLToHyperlinks"
if (typeof(ConvertURLToHyperlinkMenuItem) == 'undefined') { /* garde anti double execution */ }
try { var script = app.activeScript; } catch(e) { var script = File(e.fileName); }
//this file is in the "startup scripts" subfolder
script = script.parent.parent;                 // remonte au script a lancer
OldFolder = Folder.current;
app.doScript(script);                          // lance le vrai script
Folder.current = OldFolder;
```

Trois enseignements directs : le mécanisme est celui d'Adobe lui-même (et non un bricolage) ; un **`#targetengine`** dédié isole le chargeur ; le vrai script est visé **par chemin de fichier relatif au chargeur**, exactement la logique du gestionnaire `File` du Cas 31. Cohérent avec la mesure : `app.scriptMenuActions.length = 2` **avant** toute action de la sonde (3 après son ajout) — deux actions sont donc déjà enregistrées avant nous. Leur **identité n'a pas été relevée** (réserve déclarée ci-dessous), mais c'est cohérent avec les deux chargeurs ci-dessus.

**Ce que cela change pour le Cas 34** : l'entrée ne survit pas au redémarrage (Cas 34), mais **tout le nécessaire pour la recréer à chaque lancement est mesuré** — un script de démarrage s'exécute, trouve la barre de menus prête, peut y créer l'entrée, et le clic fonctionne. Attention toutefois à un piège d'architecture : le script à lancer (`import_md.jsx`) **se termine par `main();`** — un chargeur qui l'exécuterait au démarrage ouvrirait la boîte de dialogue de choix de fichier **à chaque lancement**. Le chargeur doit seulement **enregistrer une entrée dont le gestionnaire est `new File(<chemin de import_md.jsx>)`**, jamais exécuter ce fichier.

⚠️ **Fausse mesure de la première version de la sonde — leçon générale.** Le journal de la première exécution portait :

```
| typeof main=string | typeof logToFile=string
```

C'est **faux**. La sonde appelait `tt(typeof main)`, où `tt` était elle-même `function tt(v) { return typeof v; }` : l'expression vaut donc `typeof "undefined"`, c'est-à-dire **`"string"`**, quelle que soit la variable testée. Un `typeof` déjà calculé ne doit **jamais** être passé à une fonction qui fait elle-même un `typeof` — le résultat est constant et se présente comme une mesure crédible. Corrigé : appel direct `(typeof main)`, **plus deux témoins positifs** (`typeof hlog`, `typeof LOG_PATH`, tous deux déclarés *dans* le fichier gestionnaire) — sans témoin, une lecture « `undefined` partout » ne distingue pas « variables absentes » de « moteur cassé » (même règle qu'au Cas 30 : dumper la valeur **et** son type avant de conclure). Le fait lui-même était déjà établi (Cas 31/33 : au clic dans un gestionnaire `File`, `typeof main = undefined`), donc aucune nouvelle mesure n'est nécessaire.

**Réserves honnêtes — ce qui n'est PAS mesuré** :

- seul le dossier **utilisateur** a été testé ; la copie dans le dossier **d'application** n'a jamais été déposée (elle exige `sudo`) ;
- **une seule** exécution : le comportement avec **plusieurs** scripts dans le dossier, ou avec un script qui échoue, n'est pas mesuré ;
- l'**identité des 2 actions de script préexistantes** n'a pas été relevée (seul leur **nombre** l'a été, deux fois) ;
- la sonde **n'a pas été retirée** : tant qu'elle est dans le dossier, elle recrée son entrée de test `[SONDE DEMARRAGE] Entree de test` **à chaque lancement** d'InDesign.

**Règle** : pour rendre durable un élément d'interface créé par script, le mécanisme d'Adobe est `Scripts/Startup Scripts/` — **documenté** (read-me livré) et **mesuré ici** (dossier utilisateur inclus). Le chargeur doit enregistrer l'action **et** désigner le vrai script comme gestionnaire `File` ; il ne doit **jamais** exécuter le script qu'il désigne. Et toute sonde déposée dans un dossier de lancement doit être **retirée après la mesure** — sinon elle devient elle-même une modification permanente de l'environnement de l'utilisateur.

---

## Cas 36 — Une entrée de menu durable : module partagé `$.evalFile` + chargeur de démarrage (implémentation mesurée)

**Origine** : étape 9 de la mission 03. Les Cas 31 à 35 avaient **tranché la conception** (déclencheur `File` durable, entrée non persistante, chargeur de démarrage mesuré) ; ce cas documente le **choix d'architecture retenu** (acté par FJD : « oui, option A ») et **sa mesure en réel** après un vrai redémarrage d'InDesign.

**Le choix — voie A, option (a) : un module partagé, zéro duplication.** Le script livrable `import_md.jsx` se termine par `main();` (il **exécute** l'import). Le chargeur de démarrage ne doit donc **jamais** l'exécuter — sinon la boîte de dialogue s'ouvrirait à chaque lancement (piège déjà posé au Cas 35). Pour que le chargeur puisse **enregistrer** l'entrée **sans dupliquer** la logique d'enregistrement, celle-ci a été extraite dans un **module autonome** :

| Fichier | Rôle | Ne doit jamais… |
|---|---|---|
| `import_md_menu.jsx` | module partagé : expose `importMdRegisterMenuEntry.register(path)` | être exécuté pour autre chose que définir le module |
| `import_md.jsx` | livrable : charge le module (`$.evalFile`) **puis** `main()` | — |
| `import_md_loader.jsx` | chargeur de démarrage : charge le module puis **`register`** (jamais `main()`) | exécuter `import_md.jsx` |

Le module est chargé par `$.evalFile(new File(<dossier du fichier appelant> + "/import_md_menu.jsx"))` — le chemin est **relatif à l'appelant** (`new File($.fileName).parent.fsName`), jamais absolu : le Panneau Scripts et le dossier de démarrage le résolvent chacun depuis son propre côté, sans chemin en dur. Après chargement, les deux appelants testent `typeof importMdRegisterMenuEntry !== "undefined"` avant d'appeler `register(...)`.

**`register` est idempotent et ne détruit jamais l'entrée qu'on vient d'activer.** La séquence : (1) inventaire des items de `Fichier` et repérage de la référence `Importer...` ; (2) **chemin rapide de conformité** — si l'entrée est déjà bien placée **et** qu'il n'y a qu'**une** action de ce nom, on **retourne sans rien retirer** ; (3) sinon seulement, retrait des résidus (items d'abord, puis `app.scriptMenuActions` de la fin vers le début) ; (4) placement `items.add(action, LocationOptions.AFTER, refItem)` ; (5) action créée via `app.scriptMenuActions.add(...)`, `eventType` pris sur `ScriptMenuAction.ON_INVOKE`, `handler = new File(<chemin de import_md.jsx>)`. C'est l'étape (2) qui garantit qu'un **clic** — qui réexécute `import_md.jsx` donc `register` — ne **retire pas** l'entrée en cours d'invocation.

**Le chargeur, sans `#targetengine` — divergence assumée d'avec le modèle Adobe.** Le modèle Adobe (`ConvertURLToHyperlinkMenuItemLoader.jsx`, cf. Cas 35) pose un `#targetengine` dédié parce que son déclencheur est une **fonction** en mémoire. Ici le déclencheur est un **`File`** (durable, cf. Cas 31/33) : un moteur dédié n'apporte rien et ne ferait que **séparer** le module du moteur principal. Le chargeur a donc été écrit **sans** `#targetengine` ; son rôle est strictement : retrouver le dossier `Scripts` depuis sa propre position (`IMD_SELF.parent` → `startupDir`, `.parent` → `scriptsDir`), localiser le dossier `Scripts Panel` (essai direct, sinon **balayage d'un niveau** des sous-dossiers à la recherche d'un dossier contenant `import_md.jsx` — parade aux noms de dossiers localisés/ accentués), puis charger le module et appeler `register(<chemin de import_md.jsx>)`. Il est **100 % ASCII** et ne journalise jamais dans un log qui n'existerait pas encore.

**Mesure en réel — après un vrai redémarrage d'InDesign le 28/09/2026**, journal `…/Scripts Panel/import_md_errors.log` (normalisé `LC_ALL=C tr '\r' '\n'`), InDesign `21.6.0.57 fr_FR`. Extraits **verbatim** (dates réelles, chemins abrégés par `…`) :

```
[Mon Sep 28 2026 11:26:27 GMT+0200] LOADER-DEMARRAGE: loader=…/Scripts/Startup Scripts/import_md_loader.jsx
   | startupDir=…/Scripts/Startup Scripts | scriptsDir=…/Scripts
   | panelDir=…/Scripts/Scripts Panel
   | target=…/Scripts Panel/import_md.jsx (exists=true) | module=…/Scripts Panel/import_md_menu.jsx (exists=true)
[Mon Sep 28 2026 11:26:29 GMT+0200] M03-etape9: entree de menu creee -> 'Importer un MD' apres 'Importer...'
   | menu='Fichier' items 29 -> 30 | declencheur=File …/Scripts Panel/import_md.jsx (exists=true) | eventType=onInvoke | scriptMenuActions=4
[Mon Sep 28 2026 11:26:29 GMT+0200] LOADER-DEMARRAGE: register -> true | scriptMenuActions=4
```

⇒ **au lancement**, le chargeur a résolu correctement **tous** ses chemins (y compris les dossiers accentués, via le balayage), chargé le module, et **posé l'entrée** à l'index 11 (juste après `Importer...` = index 10), avec un gestionnaire `File` dont la cible `exists=true`. **La chaîne lancement → chargeur → module → entrée est établie en réel.**

**Et un clic, qui réexécute le script, est un no-op d'enregistrement** (même journal, deux clics) :

```
[Mon Sep 28 2026 11:27:39 GMT+0200] M03-etape9: entree de menu deja conforme -> rien a faire | menu='Fichier' items=30 | index=11 | scriptMenuActions=1
[Mon Sep 28 2026 11:27:52 GMT+0200] M03-etape9: entree de menu deja conforme -> rien a faire | menu='Fichier' items=30 | index=11 | scriptMenuActions=1
[Mon Sep 28 2026 11:28:26 GMT+0200] M03-etape2: blocs=25 paragraphes attendus=34 reels=34 ecarts=0 | mode=curseur base=0 story_total=34 styles=25 neutre=0 baseIndexConnu=true avant_fenetre=0 apres_fenetre=0
[Mon Sep 28 2026 11:28:28 GMT+0200] M03-etape4: segments appliques=22 residuels=0 debordements=0 | blocs_avec_segments=16 imbriques=23 (italique prioritaire sur le gras : un seul style de caractere possible)
[Mon Sep 28 2026 11:28:28 GMT+0200] M03-etape6: tables=1 dims=2x3 cellules=6 paragraphes_hors_table=25
[Mon Sep 28 2026 11:28:28 GMT+0200] M03-etape7: code_blocs=2 lignes=11 literaux_intacts=true tables_detectees_dans_code=1 lignes_code_stylees=9
[Mon Sep 28 2026 11:28:28 GMT+0200] M03-etape6-detail: mode=curseur base_offset=0 ancrages=[693] erreurs=0 style_table=Table 1 style_cellule_para=appele:P Table cellules_style=6 cellules_neutre=0 story_len=2632 fullText_len=2632 offsets_fiables=true offset_verifie=true
```

⇒ le clic **réexécute `import_md.jsx`**, trouve l'entrée **déjà conforme** (« rien a faire », `items=30` et `index=11` **inchangés** — l'entrée en cours d'invocation n'est **pas** détruite), puis **`main()` tourne en entier** (étapes 2, 4, 6, 7 journalisées, `ecarts=0`, `residuels=0`, `debordements=0`, `erreurs=0`, `offset_verifie=true`). **Le clic déclenche exactement `main()`, sans duplication.**

**Verdict FJD (test réel du 28/09/2026)** : « **L'entrée est là, l'import fonctionne.** »

**Réserves honnêtes** :

- un seul poste, une seule version (`21.6.0.57 fr_FR`) ;
- la **copie dans le dossier d'application** du chargeur n'a pas été déposée (elle exige `sudo`) : seul le dossier **utilisateur** est utilisé ;
- le comportement si le module `import_md_menu.jsx` est **absent** ou corrompu n'est pas mesuré — le code journalise alors un échec **non bloquant** (`module … non chargeable -> entree de menu non creee (import inchange)`) et l'import via le Panneau Scripts reste fonctionnel, mais cette branche n'a pas été exercée en réel.

**Règle** : quand deux points d'entrée doivent partager une logique de script (ici le Panneau Scripts **et** le chargeur de démarrage), **extraire la logique dans un module `$.evalFile` autonome** — jamais la recopier (deux copies divergeraient au premier correctif, cf. le piège structurel ci-dessous). Le module ne fait que **définir** ; les appelants décident d'**exécuter** (`main()`) ou d'**enregistrer** (`register()`). Et tout enregistrement d'entrée déclenché par l'entrée elle-même doit d'abord **vérifier la conformité** et **sortir sans rien retirer** — sinon le premier clic détruit l'entrée qu'il vient d'activer.

---

## Cas 37 — Lien natif vers un fichier source sans `place()` : le modèle d'objet `Link`

**Thème** : modèle texte
**API / objet visé** : `Link`, `Story.itemLink`, `InsertionPoint.createTextFragmentLink()`, `Document.placeAndLink()`, `Story.linkedStoryOptions`
**Statut source** : `mixte`
**Build de référence** : InDesign 21.x (fr_FR, macOS) — miroir consulté : build **InDesign 2026 / 21.5.1.73** (fichiers Adobe datés **2026-09-21**) ; **comportements mesurés** sur **21.6.0.57** `fr_FR` les **29/09/2026** (sondes 04bis et 04ter)

**Contexte** — Mission 04 (audit du lien dynamique vers le Markdown source). Le pipeline d'import maison écrit le texte par **assignation directe à `.contents`**, jamais par un `place()` natif. Question posée : peut-on obtenir l'**icône de lien du panneau Liens** (donc la détection native « source modifiée ») **sans** renoncer au mapping de styles maison ?

**Symptôme / problème initial** — L'audit préalable concluait que notre méthode d'insertion « ne peut **structurellement** pas créer de `Link` » ⇒ le panneau Liens ne verrait jamais notre import, et il faudrait passer par un `place()` natif (qui écrase le mapping). **Cette conclusion était trop forte** — c'est ce que ce cas corrige.

**Ce que dit la doc** (extraits verbatim, consultés le 28/09/2026, HTTP 200 — `https://www.indesignjs.de/indesignapi/indesign/`) :

- `Story.itemLink` — « `itemLink` \| `Link` \| readonly \| *The source file of the link.* » (`Story.html`)
- `Link.parent` — « `parent` \| **Graphic \| Movie \| Story \| Sound** \| readonly \| *The linked object.* » (`Link.html`). La hiérarchie de la classe `Link` liste bien `Graphic | Movie | Sound | Story` ⇒ **une `Story` peut porter un `Link`**.
- `Link.filePath` — « `filePath` \| String, File \| readonly \| *… colon delimited on the Mac OS. Can also accept: File.* » (`Link.html`)
- `Link.update()` — « `update()` → `Link` — *Updates the link if the source file has been changed.* » (`Link.html`)
- `LinkStatus` (enum) — `NORMAL`, `LINK_OUT_OF_DATE`, `LINK_MISSING`, `LINK_INACCESSIBLE`, `LINK_EMBEDDED` (`Link.html`)
- **`InsertionPoint.createTextFragmentLink()` → `Link`** — section « RETURN 15 » de la classe `Link` (`Link.html`, `InsertionPoint.html`)
- **`placeAndLink(parentStory)`** — apparaît en « Story PARAMETER OF 35 » / « RETURN 20 » de `Link`, et comme méthode de `Document`, `Page`, `Spread`, `MasterSpread`, `EndnoteTextFrame` (`Document.html`, `Page.html`, `Spread.html`). **Dépréciée** — citation verbatim (`Document.html`, **consultée le 29/09/2026, HTTP 200**, URL servie `https://www.indesignjs.de/indesignapi/indesign/Document.html`, sha256 `e1fb6142b29488c719a3925555dbc64e5dc9478131a2a38653ba451936d72a76`) : « **Deprecated: Use ContentPlacerObject load method.** Original Description: Place following the behavior of the place and link story menu item. This will load the place gun. »
- `Story.linkedStoryOptions` — « `linkedStoryOptions` \| `LinkedStoryOption` \| readonly » (`Story.html`) ; classes associées : `LinkedStoryOption` (**14 membres**), `LinkedPageItemOption` (**17 membres**), `ParaStyleMapping` (**15 membres**)

**Ce que la doc NE dit PAS** (faits négatifs, vérifiés sur les pages de classes) :

- `Application.linkingPreferences` (`LinkingPreference`, **9 propriétés**) **et** `Application.wordRTFImportPreferences` (`WordRTFImportPreference`, **26 membres**) n'exposent **aucune** propriété « Create Links When Placing Text and Spreadsheet Files » ⇒ ce réglage d'interface **n'est pas scriptable via les préférences**.
- `WordRTFImportPreference` (26 membres) et `TaggedTextImportPreference` (**8 propriétés**) n'exposent **aucune** table de mapping de styles ⇒ le mapping passe par `Application.paraStyleMappings` / `charStyleMappings` / `tableStyleMappings`.

**Cause du faux mur** — La déduction « `.contents` ⇒ pas de lien » confondait deux choses : « notre méthode **ne crée pas** de lien » (vrai) et « notre méthode **interdit** le lien » (faux) : l'API **expose** bien une voie de création sur un fragment déjà présent (`createTextFragmentLink()`). Mais **l'existence d'une méthode ne garantit pas qu'elle fonctionne sur notre source** — la mesure ci-dessous infirme cette voie.

**Ce que la mesure a établi (29/09/2026 — sondes 04bis et 04ter)** :

| Fait mesuré | Résultat | Preuve |
| --- | --- | --- |
| `InsertionPoint.createTextFragmentLink()` vers un `.md` | **ÉCHEC 11/11** | `probe_04bis_Q1_createTextFragmentLink.log` — `Valeur obligatoire manquante pour le paramètre 'linkResourceURI'…`, puis `Impossible de créer la ressource de lien à partir de l'URI donné.`, puis `Impossible d'importer le lien vers le fragment de texte. Vérifiez la connectivité…` |
| `place()` d'un `.md` | **`doc.links.length = 0`**, `story.itemLink = (null)` | journaux 04bis |
| `place()` d'un `.icml` | **`links = 1`**, `linkType = InCopyMarkup`, `linkResourceURI = file:/…`, `story.itemLink` **non-null** | `probe_04ter_T2_placement_lie.log` |
| `Link.status` (numériques) | `NORMAL = 1852797549`, `LINK_OUT_OF_DATE = 1819242340` | `probe_04ter_T3_update_vs_mapping.log` + contre-épreuve TEST 1 |
| `Link.update()` sur source modifiée | **ne recharge RIEN** : contenu affiché et styles témoins identiques avant/après ; seul `status` passe à `LINK_OUT_OF_DATE` | `probe_04ter_T3_update_vs_mapping.log` |
| Réouverture avec `checkLinksAtOpen = true` | **ne recharge RIEN** non plus | `/tmp/test_reopen2.log` (TEST 2 propre, 10:04:46) |
| L'ICML produit porte-t-il nos styles nommés ? | **Non** (`grep 'ZZ Temoin'` dans l'ICML = vide) ⇒ les styles témoins relus après `update()` viennent du mapping maison, **pas** de l'ICML (lecture non circulaire) | anti-tautologie, T3 |
| `story.linkedStoryOptions` sur un ICML placé | **3 propriétés interrogées, 3 × « Cette propriété n'est pas applicable dans l'état actuel »** ⇒ l'ICML lié par `place()` **n'est pas** un « linked story » au sens d'InDesign | `probe_04ter_T2_placement_lie.log` |

⇒ **Le lien natif surveille l'ICML, pas le `.md` ; et il ne sert qu'à signaler la fraîcheur, jamais à réimporter.** Pour un pipeline qui doit relire le `.md` et réappliquer son mapping, **cette voie échoue**.

**Solution / règle** — **Révisée le 29/09/2026 : les étapes 2 à 4 de la version initiale de ce cas sont écartées par la mesure.**

1. **Écarter `InsertionPoint.createTextFragmentLink()`** comme voie de lien vers notre source : elle échoue systématiquement vers un `.md` (**11/11**, cf. tableau ci-dessus).
2. **Écarter `placeAndLink()`** : son statut de dépréciation est **tranché par citation verbatim** le 29/09/2026 — « **Deprecated: Use ContentPlacerObject load method.** » (`Document.html`). La méthode reste **présente au runtime** (`typeof = function`, arité 0, sur `Document`/`Page`/`Spread`/`MasterSpread`) ⇒ dépréciation **douce**, mais la voie est **écartée** (remplaçant désigné : `ContentPlacerObject.load`).
3. Si un lien natif est réellement requis, il ne peut viser qu'un **intermédiaire ICML** (`story.exportFile(file, ExportFormat.INCOPY_MARKUP)` puis `place(.icml)`) — et il faut alors assumer ses **deux limites mesurées** : il **ne réimporte jamais** le contenu (`update()` = contrôle de fraîcheur seul, réouverture comprise) et il **ne transporte aucun style nommé** (le mapping maison reste à faire, cf. Cas 25 et 28).
4. Pour répondre au besoin réel (« la source a changé ⇒ je sais de quoi elle a changé, et je décide quoi réappliquer »), il faut donc **une empreinte maison du fichier source** (piste retenue : voie B, empreinte du `.md` en métadonnées) — **pas** le mécanisme natif.

**Portée** — Toute question « comment obtenir l'icône/le statut du panneau Liens tout en gardant un traitement maison » se traite par cette famille d'API, **jamais** par les préférences (fait négatif A : `Application.linkingPreferences` et `wordRTFImportPreferences` n'exposent pas le réglage d'interface). **Réserve levée le 29/09/2026** : ce cas était `sourcé` **au sens documentaire uniquement** ; les comportements alors en réserve (signature de `createTextFragmentLink()`, valeur réelle de `linkResourceURI`, évolution de `status`, comportement de `update()` sur un lien créé par nous) **sont désormais mesurés** et figurent au tableau ci-dessus. **Point de dépréciation soldé le 29/09/2026** : la **citation verbatim** de la doc est jointe — « **Deprecated: Use ContentPlacerObject load method.** » (`Document.html`, section `METHODS`, entrée `placeAndLink` ; URL servie citée ci-dessus) — tandis que la méthode **existe toujours** comme membre de `Document`, `Page`, `Spread` (arité 0 relevée) : dépréciation **douce**, sans retrait du runtime. **Plus aucun point ouvert sur ce cas.**

---

## Cas 38 — UXP n'est PAS rétrocompatible par défaut : `minVersion`/`maxVersion` du manifest, pas une garantie de version

**Thème** : méthode
**API / objet visé** : `manifest.json` (`host.minVersion`, `host.maxVersion`), versionnage UXP indépendant du host InDesign
**Statut source** : `mixte`
**Build de référence** : documentation UXP consultée le 28/09/2026 (page « Plugin manifest », `developer.adobe.com/indesign/uxp/plugins/concepts/manifest/`)

**Contexte** — Mission 04/05 (panneau Import MD en UXP). FJD demande si UXP est rétrocompatible, en prévision de tests sur une machine Windows dont la version d'InDesign/UXP ne sera pas forcément identique au poste de développement (macOS).

**Ce que dit la doc** (extraits vérifiés) :

- Le manifest déclare une plage de compatibilité host explicite : `minVersion` — « *The minimum version of the host app that the plugin supports.* » ; `maxVersion` — « *The maximum version of the host app that the plugin supports* » (défaut : non défini = dernière version du host). (`developer.adobe.com/indesign/uxp/plugins/concepts/manifest/`)
- Conséquence documentée d'une incompatibilité de version : « *Incompatible plugins will: fail to install if attempted in the given host; be invisible in the in-app plugin marketplace for the given host; be unavailable for update if the update is no longer compatible.* » — un blocage net à l'installation, pas une dégradation silencieuse à l'exécution.
- Le « UXP Changelog and Product Support Matrix » (Cas 37, déjà cité) établit que **le cycle de version d'UXP est découplé de celui d'InDesign** : ex. UXP 9.3.0 ↔ InDesign 21.4 seulement, UXP 9.4.0 pas encore intégré à aucun host GA au moment de la consultation.

**Signal communautaire à requalifier honnêtement** (recherche large, pas une citation officielle directe retrouvée avec URL exacte lors de cette passe) : InDesign 18.5 embarquerait UXP 7.1 ; l'utilisation d'une API introduite en UXP 7.2 sur cette version d'InDesign provoquerait des erreurs inattendues plutôt qu'un simple message de fonctionnalité absente. **À vérifier par citation officielle exacte avant de le considérer comme acquis** — noté ici comme piste cohérente avec le reste du cas, pas comme fait confirmé.

**Ce que la doc NE dit PAS explicitement** : aucune page consultée (manifest, changelog) n'affirme ni n'infirme qu'un plugin écrit pour une ancienne version d'UXP continue de fonctionner à l'identique sur une version d'InDesign/UXP plus récente. Le silence documentaire porte spécifiquement sur la rétrocompatibilité ascendante (ancien plugin → nouvel hôte), pas seulement sur la compatibilité descendante (nouveau plugin → ancien hôte, elle, bien documentée via `minVersion`/`maxVersion`).

**Cause du risque** — Trois variables croisées, dont une seule sous notre contrôle : (OS × version du moteur UXP embarqué × version d'InDesign). Le plugin ne connaît que le host InDesign visé par son manifest ; il n'a aucune garantie sur la version UXP réellement embarquée par cette version d'InDesign sur le poste de test, ni sur le fait qu'une API utilisée pendant le développement soit disponible sur un poste avec une version plus ancienne.

**Solution / règle** :
1. Toujours renseigner `minVersion` dans le manifest, alignée sur la version d'InDesign la plus ancienne qu'on accepte réellement de supporter (pas laissée vide/par défaut).
2. Avant tout test sur une machine tierce (Windows notamment), **consigner la version exacte d'InDesign installée** sur ce poste avant de tirer une conclusion — un résultat positif sur une version ne se généralise pas automatiquement à une autre (cf. mission 04, section cross-platform).
3. Ne jamais présumer qu'une API utilisée en développement est disponible sur toutes les versions listées dans la plage `minVersion`/`maxVersion` — vérifier la matrice de support UXP↔InDesign (Cas 37) pour la version la plus basse visée.

**Portée** — S'applique à tout projet UXP multi-postes/multi-versions, pas seulement à ce projet. Distinct du Cas 37 (qui porte sur l'API `Link`) : ce cas porte sur le **cycle de vie de version**, orthogonal au contenu fonctionnel du plugin.

---

## Cas 39 — `exportFile` n'écrase pas un fichier existant (silencieusement) et le porteur de l'export ICML n'est pas le document

**Thème** : méthode
**API / objet visé** : `Document.exportFile()`, `Story.exportFile()`, `ExportFormat.INCOPY_MARKUP`, `File.remove()`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS) — mesuré le **29/09/2026** (mission 04ter)

**Contexte** — Sonde 04ter : produire un fichier ICML depuis une story pour le placer ensuite (`place(.icml)`) et obtenir un `Link` natif. Trois pièges successifs, tous découverts en réel et journalisés (`/tmp/probe_04ter_T1_production_icml.log`, `/tmp/test_reopen2.log`).

**Symptôme** —

1. `document.exportFile(ExportFormat.INCOPY_MARKUP, f)` échoue : **`L'objet spécifié ne prend pas en charge le format d'exportation souhaité.`** — 2 essais sur 2 (`ligne=492`).
2. Avec la cible à la **racine de `/tmp`**, l'export ne produit rien.
3. Après correction du porteur, l'export « réussit » (`ok=true`) **mais le fichier produit garde son ancien contenu et sa taille**.

**Cause** —

1. Le porteur d'un export ICML n'est pas le **document**, c'est la **story** : `story.exportFile(ExportFormat.INCOPY_MARKUP, file)` fonctionne (`ICML produit : existe=true | taille=35909 o`).
2. `/tmp` est un **lien symbolique vers `/private/tmp`** ; écrire à la racine de ce chemin échoue. Un **sous-dossier réel** (`/tmp/probe_04ter_out/x.icml`) fonctionne.
3. `exportFile` **ne remplace pas** un fichier existant : il ressort en `ok=true` sans rien écrire.

**Ce que dit la doc** — `ExportFormat` expose **18 constantes**, dont `INCOPY_MARKUP = 1768123756` (relevé par la sonde T0 : `ExportFormat : 18 constante(s)` / `constante retenue : ExportFormat.INCOPY_MARKUP … 1768123756`). La doc ne signale **pas** que `Document` refuse ce format, ni qu'`exportFile` reste sans effet sur une cible existante.

**Solution** —

1. Exporter depuis **la story** (`story.exportFile(file, ExportFormat.INCOPY_MARKUP)`), jamais depuis le document.
2. Écrire dans un **vrai sous-dossier** ; se méfier des liens symboliques (`/tmp`), y compris pour lire le fichier produit.
3. **`remove()` la cible avant d'exporter**, puis **relire le fichier produit** (existence, taille, contenu attendu) pour prouver l'écriture — `ok=true` **ne prouve rien**.

**Portée** — Vaut pour tout export par script (ICML, PDF, IDML…) : `ok=true` n'est pas une preuve, et le porteur du format peut être un objet inattendu. Toute sonde d'export doit se **contre-éprouver** en écrasant un fichier existant (TEST 0 de `COMMUNICATION/mission_04ter_sonde_icml.md`, journal `/tmp/test_reopen2.log`). Cas jumeau : Cas 18 (journaliser plutôt que se fier au retour de l'API).

---

## Cas 40 — Neutraliser l'alerte d'une sonde : `alert` ET `confirm` sont tous deux en lecture seule

**Thème** : langage
**API / objet visé** : `alert()`, `confirm()`, `$.evalFile()`, canal `osascript … do script`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS) — mesuré le **29/09/2026** (mission 04ter) ; **moitié « `confirm` » corrigée le 29/09/2026** (mission 05), mesure à l'appui

**Contexte** — Une sonde lancée sans personne devant l'écran ne doit afficher **aucune** boîte de dialogue (sinon elle bloque indéfiniment la mesure). Le lancement se fait depuis le shell : `osascript -e 'tell application "Adobe InDesign 2026" to do script "…" language javascript'`.

**Symptôme** — En tentant de neutraliser les boîtes de dialogue de la sonde, le journal porte **`shadow alert KO : alert is read only`**, tandis que la ligne **`fonctions neutralisees = confirm`** paraît attester que `confirm` a bien été écrasé (`/private/tmp/run_04ter.log`).

**Cause** — Dans ExtendScript, `alert` **et `confirm`** sont des **fonctions globales non réassignables** (lecture seule) : on ne peut remplacer ni l'une ni l'autre par une version silencieuse. La ligne `fonctions neutralisees = confirm` ne décrit **pas** un effet : elle n'atteste que le fait que l'instruction `neutralise.push("confirm")` a été **atteinte** — donc que l'affectation n'a pas levé d'exception à cet endroit-là, ce qui ne prouve rien sur son effet. Par ailleurs, le canal `osascript … do script "<code>"` **casse dès que le code contient des guillemets imbriqués** (JSON, chemins, chaînes littérales) — l'échec est silencieux côté AppleScript.

**Correction du 29/09/2026 — la moitié « `confirm` est écrasable » de ce cas était FAUSSE** —

Le libellé d'origine (« `alert` est en lecture seule, `confirm` est écrasable ») a été **invalidé par la mesure** :

- **Matrice 4 contextes × 2 formes d'écriture = 8 tentatives, TOUTES refusées** (`/private/tmp/matrix_inline.log`, `/private/tmp/matrix_evalfile.log`) :

  ```
  A  evalFile + niveau superieur : REFUSE : confirm is read only
     A sentinelle REELLEMENT vue = false
  B  evalFile + fonction imbriquee : REFUSE : confirm is read only
     B sentinelle REELLEMENT vue = false
  C  inline + niveau superieur : REFUSE : confirm is read only
     C sentinelle REELLEMENT vue = false
  D  inline + fonction imbriquee : REFUSE : confirm is read only
     D sentinelle REELLEMENT vue = false
  etat final : confirm est redevenu natif = true
  ```

- Les **deux formes** testées sont également refusées (`/private/tmp/probe_05_empreinte.log`, section 5bis) : `confirm = f` (affectation nue) → `REFUSE : confirm is read only` ; `$.global.confirm = f` (chemin explicite) → `REFUSE : confirm is read only`.
- En `do script`, la portée globale est refusée de la même façon : `INLINE (do script, portee globale) : REFUSE : confirm is read only | restaure = true` (`/private/tmp/ctx_inline.log`) et `EVALFILE ($.evalFile, portee de la sonde) : REFUSE : confirm is read only | restaure = true` (`/private/tmp/ctx_evalfile.log`).
- État final vérifié : `confirm natif = true | alert natif = true` (`/private/tmp/etat_final.log`) : **aucun des deux n'a été neutralisé**.

**Corroboration décisive** — Le **même** `/private/tmp/run_04ter.log` enregistre `duree ms = 46106` (**46 s**) pour une sonde qui contient **5 appels `alert()`** (`tools/probe_04ter_icml.jsx`, l. 690, 701, 744, 758, 763). Les boîtes se sont donc **réellement ouvertes** : rien n'a été neutralisé, et les 46 secondes correspondent aux **clics humains**. La ligne `fonctions neutralisees = confirm` est un **artefact de la sonde**, pas une capacité de l'API.

**Réserve d'honnêteté (contradiction NON résolue)** — Deux relevés antérieurs du **même** 29/09/2026 affichent au contraire `SANS ERREUR` : `/private/tmp/ctx_props.log` (`alert = f : SANS ERREUR`, `confirm = f : SANS ERREUR`, `delete $.global.confirm puis confirm = f : SANS ERREUR`, `delete $.global.alert puis alert = f : SANS ERREUR`, `confirm est-il encore actif apres ces essais = true`, `$.global.hasOwnProperty confirm = true`, `$.global.hasOwnProperty alert = true`) et `/private/tmp/ctx_shadow.log` (`apres affectation DANS une fonction, la sentinelle confirm est-elle VUE au niveau superieur = true`, `typeof confirm = function | source contient SENT_CONFIRM = true`). Je **ne prétends pas** expliquer ce point : la portée exacte que le moteur ExtendScript applique à l'affectation d'un global natif reste **non élucidée** ici. Le fait **établi et reproductible** est le **refus** (`confirm is read only`, 8/8 dans 4 contextes) — c'est cette mesure-là qu'il faut retenir pour concevoir un test.

**Ce que dit la doc** — Aucune page consultée ne documente `alert` **ni `confirm`** comme réassignables en ExtendScript/ES3 ; aucune ne documente le canal `do script` et ses limites de citation. Faits **mesurés**, sans source externe à citer.

**Solution** —

1. **Ne jamais fonder la testabilité d'un script sur l'écrasement d'`alert` ou de `confirm`.** Aucun des deux n'est remplaçable de façon fiable. Faire passer **toutes** les boîtes par une **variable possédée par le projet** — `var demanderConfirmation = function (m) { return confirm(m, false, SCRIPT_NAME); };` — que la sonde peut remplacer **sans toucher au global** : c'est la seule voie qui rend les **deux branches** (accepter / refuser) réellement testables. Mise en œuvre dans `import_md.jsx` (`demanderConfirmationM05`) et dans `tools/probe_05ter_integration.jsx` (`demanderConfirmation`).
2. **Concevoir la sonde pour ne pas appeler `alert`** : aucune boîte de dialogue dans un script de mesure. Si un `alert` est nécessaire en interactif, le rendre conditionnel à un **drapeau de mode** décidé par le script, jamais par l'utilisateur.
3. Écrire la sonde dans un **fichier `.jsx` temporaire**, puis l'exécuter par `$.evalFile(new File("/chemin/x.jsx"))` — **jamais** de code inline dans la commande `osascript` (guillemets imbriqués).
4. Journaliser **toutes** les erreurs dans un fichier de log (**aucun `catch` vide**), y compris les erreurs **attendues** — cf. T0 de 04ter : `ERREUR | contexte=T0 document existant | message=Object is invalid | ligne=397` quand `app.documents.length = 0`, erreur non bloquante et **consignée comme telle**.
5. **Se méfier d'un journal qui affirme un succès sans le mesurer.** Ici `neutralise.push("confirm")` a produit une ligne triomphante alors que les boîtes s'affichaient toujours. Une preuve de succès doit être un **effet observé** (durée d'exécution, absence de boîte, valeur relue), jamais une **trace d'exécution**.

**Portée** — Tout script de mesure non interactif. Complète le Cas 18 (journalisation systématique) : **journaliser ne suffit pas si le script peut bloquer** sur une boîte de dialogue. Complète aussi le Cas 32 (une sonde doit être sûr d'elle avant de crier au loup).

---

## Cas 41 — Ce qu'un ICML exporté par script contient réellement (et ce qu'il ne contient PAS)

**Thème** : méthode / format d'export
**API / objet visé** : `Story.exportFile(ExportFormat.INCOPY_MARKUP, …)`, éléments `<Content>`, `AppliedParagraphStyle`, `XMLElement` / `XMLTag`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** `fr_FR`, macOS — mesuré le **29/09/2026** (mission 04ter)

**Contexte** — Après l'échec de la voie A (lien natif, cf. Cas 37), une autre voie est envisagée : et si le mapping marques→styles pouvait se faire **depuis l'ICML** plutôt que depuis le `.md` ? L'idée est séduisante parce que l'ICML est un format qu'InDesign sait relire. Avant de bâtir quoi que ce soit dessus, on **inspecte** le fichier réellement produit.

**Relevé (mesuré)** — Fichier `probe_04ter_A.icml` : **36 877 octets** sur disque / **35 830 caractères** lus (UTF-8 multi-octets : accents et guillemets français).

1. **Les marques markdown survivent littéralement**, en **texte brut**, dans les éléments `<Content>` :
   ```
   <Content># Titre B MODIFIE</Content>
   <Content>## Sous-titre B MODIFIE</Content>
   <Content>Paragraphe B MODIFIE.</Content>
   ```
2. **Aucune balise XML** : `XMLElement` = **0**, `XMLTag` = **0**, `<Tag` = **0**, `AppliedXMLTag` = **0**, `TagName` = **0**.
3. **Style de paragraphe** : une seule valeur distincte relevée, `ParagraphStyle/$ID/[No paragraph style]`. Style de caractère : `CharacterStyle/$ID/[No character style]` et `n`.
4. **Poids** : 35 830 caractères pour **42 caractères** de texte utile (ratio ≈ **850:1**). Le bloc `<Properties>` domine — il recopie **tout le jeu du document** (couleurs, styles, formats de renvoi croisé, listes de numérotation).
5. La **localisation française fuit** dans l'ICML : `CrossReferenceFormat Name="Paragraphe entier et numéro de page"`, `NumberingExpression="^#.^t"`.

**Interprétation** —

- Ce qu'on appelle familièrement les « **tags** » d'un ICML **ne sont pas des balises InDesign** : ce sont les **marques markdown en texte brut** déposées dans `<Content>`. Il n'y a **aucun** `XMLTag` à quoi que ce soit à raccrocher ⇒ la commande « Map Tags to Styles » d'InDesign n'a **rien à lier** ici.
- L'ICML n'est donc **pas un format balisé** au sens InDesign : c'est un **conteneur de texte** plus un **jeu de styles recopié en bloc**. La taille du fichier n'est **pas proportionnelle au texte**.

**Ce que dit la doc** — Aucune page consultée ne documente le contenu d'un ICML exporté par script. Faits **mesurés**, sans source externe à citer.

**Réserve de mesure déclarée (à lever)** — Le relevé n° 3 (`[No paragraph style]` seul) **ne prouve PAS** que l'ICML efface les styles. La story témoin de la sonde n'avait **aucun style appliqué** au départ (contrôle `ZZ Temoin` → **0** occurrence). Ce relevé prouve seulement qu'**il n'y avait rien à relever**. Le point 3 doit donc être considéré comme **non instruit** jusqu'à ce qu'une sonde dédiée (story avec styles nommés réellement appliqués) l'ait tranché. **Ne pas citer ce point comme un fait acquis.**

**Solution / conséquence pratique** —

1. **Ne pas bâtir de mapping sur l'ICML** : relire les marques md depuis l'ICML ajoute un aller-retour complet (`.md` → InDesign → ICML → relecture) sur une source **plus pauvre**, alors que l'importateur mappe déjà les marques **directement depuis le `.md`** — source plus riche, plus simple, plus proche de l'intention.
2. **Règle d'outillage** : ne **jamais** déverser un ICML entier dans le terminal (20–29 ko observés) — cibler `<Content>`, `AppliedParagraphStyle` et les compteurs de balises par extraction ciblée.

**Portée** — Toute tentative de relecture d'un export InDesign pris comme source de données. Complète le Cas 39 (`exportFile`, porteur de l'export ICML) et le Cas 37 (voie A : ce que le lien natif ne fait pas).

---

## Cas 42 — Un GREP ne pose qu'UN seul style de paragraphe par requête

**Thème** : styles / recherche-remplacement
**API / objet visé** : `app.findGrepPreferences`, `app.changeGrepPreferences`, `Document.changeGrep()`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** `fr_FR`, macOS — mesuré le **29/09/2026** (outil `tools/probe_grep_style.jsx` ; mesure faite avec `documents au depart = 1`, la sonde crée et referme son propre document témoin)

**Contexte** — Idée de conception : « nettoyer les marques markdown (`#`, `##`) par GREP et poser les styles dans la même passe ». Avant de retenir ou d'écarter l'idée, on mesure la capacité réelle du moteur Rechercher/Remplacer.

**Relevé (mesuré)** —

1. `app.findGrepPreferences` expose **223 propriétés**, dont **9** contiennent « `tyle` » : `sameParaStyleSpacing`, `kentenFontStyle`, `rubyFontStyle`, `bulletsCharacterStyle`, `numberingCharacterStyle`, `appliedCharacterStyle`, **`appliedParagraphStyle`**, `fontStyle`, `otfFigureStyle`. **Une seule** concerne le style de **paragraphe**.
2. Les **variantes plurielles n'existent pas** — toutes rejettent :
   ```
   findGrepPreferences.appliedParagraphStyles -> ABSENT (Object does not support the property or method 'appliedParagraphStyles')
   findGrepPreferences.appliedCharacterStyles -> ABSENT (Object does not support the property or method 'appliedCharacterStyles')
   findGrepPreferences.paragraphStyles -> ABSENT (Object does not support the property or method 'paragraphStyles')
   findGrepPreferences.characterStyles -> ABSENT (Object does not support the property or method 'characterStyles')
   findGrepPreferences.appliedParagraphStyle -> PRESENT | typeof=string | valeur=
   ```
   Et : `appliedParagraphStyle : typeof=string` · `appliedParagraphStyle : est un Array ? = false` · `appliedParagraphStyle : reflect.name = String` ⇒ **scalaire**, jamais une collection.
3. **Contre-épreuve réelle** — story témoin à 3 paragraphes (`# Titre Niveau 1` / `## Titre Niveau 2` / `Paragraphe ordinaire.`), **une** requête : `findWhat = "^#\\s"`, `changeTo = ""`, `changeGrepPreferences.appliedParagraphStyle = ZZGREP Niveau1`, puis `doc.changeGrep()` :
   ```
   changeGrep(...) applique 1 seul style : modifications = 1
   releve apres la requete (3 paragraphes) :
     p[0] texte=# Titre Niveau 1/ | style=ZZGREP Niveau1
     p[1] texte=## Titre Niveau 2/ | style=[Paragraphe standard]
     p[2] texte=Paragraphe ordinaire./ | style=[Paragraphe standard]
   ```

**Cause** — Le moteur porte **un seul style de paragraphe et un seul style de caractère** par requête (deux propriétés scalaires). Il n'existe **aucune** forme plurielle permettant d'en poser plusieurs d'un coup : **N niveaux de titre ⇒ N requêtes.**

**Ce que dit la doc** — Aucune citation verbatim collectée pour ce point ; la démonstration repose **entièrement** sur la mesure DOM ci-dessus.

**Solution** —

1. Concevoir tout nettoyage GREP multi-niveaux comme **N passes** (une par style), jamais comme une passe unique. En prévoir le coût : N × (recherche + remplacement + recomposition).
2. Vérifier une capacité par **contre-épreuve réelle** (poser le style, puis *relire ce qui a été posé*), jamais par la seule lecture du nom des propriétés : `appliedParagraphStyle` est **au singulier**, et seul le test prouve qu'il n'existe pas de variante plurielle.

**Portée** — Tout usage de `changeGrep()` / `findGrep()` pour poser des styles. Remettre `app.findGrepPreferences` et `app.changeGrepPreferences` à `NothingEnum.nothing` après usage (idiome employé par la sonde ; l'effet d'un oubli n'a **pas** été mesuré ici). Complète le Cas 25 (valeur par défaut silencieuse).

---

## Cas 43 — Un document créé par script n'a aucun bloc de texte (ni story, ni textFrame)

**Thème** : modèle document / méthode (sonde)
**API / objet visé** : `app.documents.add()`, `Document.stories`, `Document.textFrames`, `Page.textFrames.add()`, `TextFrame.parentStory`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** `fr_FR`, macOS — mesuré le **29/09/2026**

**Contexte** — Une sonde a besoin d'un **document témoin** : elle le crée, écrit un texte dedans, mesure un comportement, puis le referme sans enregistrer.

**Symptôme** — `ERREUR | contexte=contre-epreuve GREP | message=Object is invalid | ligne=79`, à la ligne `var t = story.texts[0];` — alors que la ligne précédente, `var story = doc.stories[0];`, était passée sans broncher. **L'erreur est signalée une ligne trop tard**, ce qui brouille le diagnostic.

**Cause (mesurée)** — Juste après `app.documents.add()` :
```
doc cree : stories=0 | textFrames=0 | pages=1
```
Un document neuf comporte **une page mais aucun bloc de texte** — donc **aucune story**. L'accès à une collection vide reste **permissif** (`doc.stories[0]` ne lève rien) et rend un objet **invalide** qui n'explose qu'à l'usage suivant.

**Ce que dit la doc** — Aucune page consultée ne documente ce point. Faits **mesurés**, sans source externe à citer.

**Solution** — Créer explicitement le bloc de texte, puis passer par son `parentStory` — **jamais** par `doc.stories[0]` :
```javascript
var doc = app.documents.add();
var page = doc.pages[0];
var tf = page.textFrames.add();
var story = tf.parentStory;          // story valide
story.contents = "…\r";
story.recompose();
```
Mesuré après correction : `textFrame cree : null ? = false` · `story obtenue : null ? = false` · `story temoin : longueur=57`.

**Portée** — Toute sonde ou tout script qui fabrique son propre document témoin. Complète le Cas 40 (sonde non interactive), le Cas 39 (refermer le document témoin sans l'enregistrer) et le **Cas 46** (enregistrer ce document témoin).

---

## Cas 44 — `extractLabel` / `insertLabel` : ce que le label accepte réellement

**Thème** : styles
**API / objet visé** : `Document.insertLabel()`, `Document.extractLabel()`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS) — mesuré le **29/09/2026** (mission 05 : sonde jetable `tools/probe_05_empreinte.jsx`, puis sonde d'intégration `tools/probe_05ter_integration.jsx`)

**Contexte** — Il faut mémoriser dans le document une **empreinte** de la source Markdown importée, pour pouvoir dire au moment d'un ré-import si le `.md` a changé depuis. Le label est le seul endroit où une donnée voyage avec le document **sans fichier annexe**.

**Symptôme** — Une sonde qui teste « le label existe-t-il ? » par comparaison à `null` (`if (brut === null)`) ne se déclenche **jamais** : sur une clé absente, la valeur relue n'est pas `null`.

**Cause / relevé mesuré** —

1. **Clé absente ⇒ `extractLabel` rend `''`** — une **chaîne vide**, `typeof = "string"`. Ni `null`, ni `undefined`, et **aucune exception**. Mesuré : `extractLabel sur label ABSENT -> typeof=string | valeur=''`.
2. **Réécriture sous la MÊME clé ⇒ ÉCRASEMENT** de l'ancienne valeur (pas d'accumulation, pas d'erreur, pas de doublon). Mesuré : `OK V2 re-insertLabel du MEME nom ECRASE l'ancienne valeur` — et la valeur relue ensuite diffère bien de la précédente.
3. **Taille : un label de 4000 caractères se relit intégralement.** Mesuré : `label de 4000 caracteres : longueur relue=4000` puis `OK V2 un label de 4000 caracteres survit integralement | attendu=4000 | obtenu=4000`. C'est la **plus grande valeur réellement testée**, pas un maximum prouvé.
4. **Persistance : le label survit à fermeture + réouverture du document.** Mesuré après enregistrement, `close()`, puis réouverture du `.indd` : l'empreinte **et** le mapping sont relus à l'identique (`APRES reouverture — empreinte : {"v":"1","size":"60","modified":"1790691560000","checksum":"1565740989","name":"probe_05_source.md"}`).
5. **Les clés sont indépendantes** : `md-style-map` (`longueur=42`) et `md-source-fingerprint` (`longueur=100`) coexistent, et chaque écriture sur l'une laisse l'autre **intacte** — contrôle de non-régression passé à **chaque** étape de la sonde d'intégration.

**Ce que dit la doc** — Aucune citation verbatim collectée pour les points 1 à 3 : ni l'écrasement silencieux, ni la valeur `''` sur clé absente, ni le comportement au-delà de 4000 caractères ne sont documentés dans les pages consultées. À traiter comme **mesuré**, sans source externe. Le point de départ documentaire reste le **Cas 06** (`document.labels` n'est pas une collection énumérable ⇒ passer par `insertLabel`/`extractLabel`).

**Solution** —

1. Tester la **présence** d'un label par la **valeur vide** : `if (!brut) { … }` — **jamais** `brut === null` ni `typeof brut === "undefined"`.
2. Traiter toute donnée de label comme **écrasable** : une seule valeur vit sous une clé donnée ; ne pas compter sur deux écritures coexistantes sous le même nom.
3. N'y ranger que des données **petites et textuelles**, sérialisées en `clé=valeur` en **échappant** séparateurs et guillemets, et **contre-éprouver** l'aller-retour avec une valeur hostile (un chemin contenant `"` a été testé : il survit).
4. Verser la **version** du format dans la donnée elle-même (`v="1"`) et **refuser** une empreinte sans version : un format qui évolue ne doit pas être confondu avec une empreinte valide (testé : `m05ParseFingerprint` rend `null` sur une chaîne sans `v`, et `verifierSourceMarkdown` conclut alors `jamais_importe`).

**Portée** — Toute donnée à faire voyager avec le document (paramètres, empreintes, état d'import). Complète le **Cas 06** (accès aux labels) ; le pendant « fichier » est le **Cas 45** (mesurer la source) et le **Cas 46** (enregistrer un document témoin pour tester la réouverture).

---

## Cas 45 — `File.modified` ne signale pas un changement de contenu, et `File.read()` normalise les fins de ligne

**Thème** : méthode
**API / objet visé** : `File.modified`, `File.length`, `File.lineFeed`, `File.read()`, `File.write()`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS) — mesuré le **29/09/2026** (mission 05, sonde jetable `tools/probe_05_empreinte.jsx`, journal `/private/tmp/probe_05_empreinte.log`)

**Contexte** — Pour décider si un `.md` source a changé depuis l'import, l'idée naturelle est de comparer la **date de modification** du fichier (`File.modified`), éventuellement aidée de sa **taille** (`File.length`). Les deux sont insuffisantes — et la première est franchement trompeuse.

**Symptôme** — Une empreinte qui repose sur la date (ou sur la taille) ne détecte **pas** une modification de contenu : le fichier a bien changé, l'empreinte continue d'annoncer « identique ».

**Cause / relevé mesuré** —

1. **La date ne bouge pas quand le contenu change dans la même seconde.** Mesuré, après passage d'un caractère `'e'` → `'a'` : `taille=60 | dateMs=1790691560000 | somme=1565740989` — **même taille**, **même date**, **somme différente**. Explicité par la sonde : `date avant=1790691560000 | date apres=1790691560000 | date a BOUGE = false`. La date de modification est une information de **système de fichiers** (granularité de l'ordre de la seconde ici), **pas un signal de contenu**.
2. **La taille ne suffit pas non plus** : remplacer un caractère par un autre laisse `File.length` inchangé (60 → 60). Mesuré : `OK V1 sensible : 1 caractere change => taille INCHANGEE (piege confirme)`.
3. **Une somme de contrôle, elle, est reproductible ET sensible** : deux lectures d'un fichier intact donnent `somme=1565744833` toutes les deux (`OK V1 reproductible : 2 lectures d'un fichier intact => taille identique`), et un seul caractère changé fait passer la somme de `1565744833` à `1565740989`.
4. **`File.read()` normalise les fins de ligne en LF.** Écrit sur disque avec un `CR` (code 13), le même contenu se relit avec un `LF` (code 10) : `contenu ECRIT … ,13,…` face à `contenu LU du fichier … ,10,…`, avec `longueur ecrite = 60 | longueur lue = 60`. Relevé de stabilité par style de fin de ligne :

   ```
   LF seul : ecrit=4 | tailleDisque=4 | lu=4 | somme=2902385 | codes=97,10,98,10
   CR seul : ecrit=4 | tailleDisque=4 | lu=4 | somme=2902385 | codes=97,10,98,10
   CRLF    : ecrit=6 | tailleDisque=4 | lu=4 | somme=2902385 | codes=97,10,98,10
   ```

   ⇒ les trois styles se lisent avec la **même** longueur et la **même** somme. `File.write()`, lui, **écrit CRLF → CR** (6 caractères écrits ⇒ 4 octets sur disque). **Conséquence heureuse** : l'empreinte est **insensible au style de fin de ligne** ; un `.md` ré-enregistré par un autre outil qui convertit les fins de ligne ne déclenche **pas** de fausse alerte tant que le **texte** est inchangé.
5. **`File.lineFeed` ne change pas la lecture** : valeur par défaut observée avant `open()` = `'macintosh'`, et forcer `native` ou `unix` donne la **même** longueur lue et la **même** somme (`OK lineFeed ne change PAS la somme lue (native==unix)`).
6. **Conséquence de conception** : la somme décrit le contenu **normalisé par ExtendScript**, pas les octets bruts du disque. C'est acceptable **à une condition stricte** : que la lecture soit faite par la **même fonction** à l'import et à la comparaison — ce que fait le pipeline (`m05BuildFingerprint` miroite exactement `readMarkdownFileAt`, sans forcer d'encodage).

**Ce que dit la doc** — Aucune citation verbatim collectée : ni la granularité de `File.modified`, ni la normalisation CR/CRLF en lecture et en écriture ne sont documentées dans les pages consultées. Faits **mesurés**.

**Solution** —

1. **Ne jamais décider « la source a changé » sur la date ni sur la taille.** L'empreinte est une **somme de contrôle du contenu normalisé** + la taille, la taille n'étant qu'un **garde-fou secondaire**, jamais une preuve.
2. Comparer **texte normalisé à texte normalisé**, en réutilisant **exactement** la fonction de lecture du pipeline — jamais une lecture parallèle avec un autre encodage, sinon la fausse alerte est garantie.
3. Ne **pas** inclure la date dans la décision : `m05DecideState` la stocke pour le **diagnostic** (elle est utile au journal) mais **ne s'en sert pas** pour trancher.
4. Pour tester une empreinte, monter le cas piège — **taille identique ET date identique, contenu différent** — et vérifier que l'état bascule quand même. **Contre-épreuve obligatoire** : deux lectures du fichier **intact** doivent rendre la **même** somme (sinon la sensibilité mesurée ne prouve rien).

**Portée** — Toute détection de fraîcheur d'une source (voie B de la mission 05). Complète le **Cas 44** (où ranger l'empreinte), le **Cas 46** (fabriquer un document témoin) et le **Cas 39** (`exportFile` n'écrase pas ; `/tmp` est un lien symbolique).

---

## Cas 46 — `doc.save()` refuse `/tmp` et `/private/tmp` ; `Folder.temp` est la seule cible qui marche

**Thème** : méthode
**API / objet visé** : `Document.save()`, `Document.saveAs`, `Folder.temp`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS) — mesuré le **29/09/2026** (mission 05, sonde jetable `tools/probe_05_empreinte.jsx`, section 2 du journal)

**Contexte** — Pour vérifier qu'un label (une empreinte) **survit à fermeture + réouverture**, il faut un document **jetable qu'on puisse réellement enregistrer**. Le réflexe est d'écrire dans `/tmp` — déjà piégeux par ailleurs (cf. Cas 39 : `/tmp` est un lien symbolique).

**Symptôme** — `doc.save(new File("/private/tmp/probe_05_doc.indd"))` échoue avec un message qui **accuse le dossier** : `ECHEC : Dossier "/private/tmp/probe_05_doc.indd" introuvable`. Le dossier existe pourtant, et le chemin est correct.

**Cause / relevé mesuré** — Matrice de **6 tentatives**, **une seule** réussit :

```
A doc.save(new File('/private/tmp/...'))   : ECHEC : Dossier "/private/tmp/probe_05_doc.indd" introuvable | ligne=344
B doc.saveAs(new File('/private/tmp/...')) : ECHEC : d.saveAs is not a function | ligne=345
C doc.save('/private/tmp/...') en chaine   : ECHEC : Dossier ""/private/tmp/probe_05_doc.indd"" introuvable | ligne=346
D app.activeDocument=d ; d.save(File)      : ECHEC : Dossier "/private/tmp/probe_05_doc.indd" introuvable | ligne=347
E doc.save(new File(Folder.temp/...))      : OK -> /private/var/folders/2h/t8bqzrc94d3__q93mbhds67w0000gn/T/probe_05_doc.indd
F doc.save(new File('/tmp/...'))           : ECHEC : Dossier "/tmp/probe_05_doc.indd" introuvable | ligne=349
Folder.temp = /var/folders/2h/t8bqzrc94d3__q93mbhds67w0000gn/T
File(Folder.temp/...) existe apres coup = true
File('/private/tmp/...') existe apres coup = false
```

Trois faits à retenir :

1. **`Document.save` refuse `/tmp` ET `/private/tmp`** (`Dossier "…" introuvable`), que la cible soit un objet `File`, une chaîne, ou qu'on ait réaffecté le document actif au préalable. Le message est **trompeur** : il désigne le dossier alors que le dossier est correct.
2. **`Document.saveAs` n'existe pas** en ExtendScript : `d.saveAs is not a function` — la méthode attendue par analogie avec d'autres DOM n'est pas là.
3. **`Folder.temp` fonctionne** et rend un vrai chemin (`/var/folders/2h/…/T`) : le document s'y enregistre réellement (`taille=995328`) et le fichier **existe** après coup.

**Ce que dit la doc** — Aucune citation verbatim collectée sur cette restriction de cible : le comportement est **mesuré**, non documenté dans les pages consultées.

**Solution** —

1. Enregistrer tout document de test dans **`Folder.temp`**, **jamais** dans `/tmp` ni `/private/tmp`.
2. Ne pas chercher `saveAs` : **`save(File)`** est la seule voie, et elle exige une cible autorisée.
3. Après l'enregistrement, **vérifier que le fichier existe vraiment** (`File(...).exists === true`) avant de conclure au succès : l'absence de message d'erreur ne prouve rien.
4. Fermer le document témoin avec `doc.close(SaveOptions.NO)` et **compter les documents** avant/après pour garantir qu'aucun document de l'utilisateur n'a été fermé (`tools/probe_05ter_integration.jsx`, section 5).

**Portée** — Tout test qui exige un **document témoin réel** (persistance d'un label, comportement à la réouverture). Complète le **Cas 43** (fabriquer un document témoin) et le **Cas 44** (ce que le label doit prouver).

---

## Cas 47 — Le canal d'arguments de `app.doScript` : l'objet `arguments` racine, jamais `app.scriptArgs`

**Thème** : canal d'appel / méthode (UXP → ExtendScript)
**API / objet visé** : `Application.doScript(script, language, withArguments)`, objet `arguments` de niveau racine, `app.scriptArgs`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS), runtime UXP `uxp-9.3.0-local` — mesuré le **30/09/2026** (mission 04, sonde `uxp/com.fjd.importmd.sonde`, bouton 7, section Q7 du journal)

**Contexte** — Un panneau UXP doit transmettre des arguments (**Appelant**, **Action**, **Chemin**) à un moteur ExtendScript (`import_md.jsx`) **sans les écrire dans le texte du script**. Question posée : **quel canal porte ces arguments ?** Deux pistes étaient en concurrence — `app.scriptArgs` (piste documentée) et l'objet `arguments` racine du script exécuté.

**Symptôme** — `app.scriptArgs` se présente bien comme un `object` côté moteur, mais **n'expose rien d'exploitable** : ni `length`, ni `[0]`, ni `getArguments`. Le témoin passé en 3e paramètre de `doScript` **n'y apparaît jamais**.

**Cause / relevé mesuré** — Les **deux** lectures partagent le **même `src`** ; seul le 3e paramètre de `doScript` change. Verbatim du journal :

```
B1  ... app.scriptArgs
      sans argument : type=object | longueur=ERREUR:Object does not support the property or method 'length'
                    | [0]=ERREUR:Object does not support the property or method '0' | getArguments=ABSENT
      avec argument : (strictement identique)
      => le temoin n'apparait PAS dans app.scriptArgs

B2  ... objet `arguments` racine
      sans argument : ERREUR:arguments is undefined
      avec argument : n=4 | [0]=TEMOIN-20260930-1790790883963 | [1]=Appelant=panneau
                    | [2]=Action=importer | [3]=Chemin=/tmp/source.md
```

Quatre faits à retenir :

1. **`app.scriptArgs` ne transporte rien ici** : objet **non indexable** (`length` et `[0]` lèvent « Object does not support the property or method… », `getArguments` absent), et **identique** avec et sans argument. Il ne signale pas non plus l'échec — il ne dit rien.
2. **Le canal réel est l'objet `arguments` de niveau racine** du script exécuté : `n=4` et les **4 valeurs dans l'ordre** (`[0]`…`[3]`). C'est l'idiome InDesign.
3. **Sans argument fourni, `arguments` vaut `undefined`** (`ERREUR:arguments is undefined`) ⇒ c'est un **test de discrimination direct** : appel « menu » (pas d'arguments) vs appel « panneau » (arguments fournis).
4. Le 3e paramètre de `doScript` exige une **liste** — erreur observée avec une chaîne seule : *« Array of Any Types attendu(e), mais "TEMOIN-…" reçu(e) »*. On passe donc `[a0, a1, …]`.

**Ce que dit la doc** — Les pages consultées présentaient `withArguments` comme le canal d'arguments sans préciser **où** le script exécuté les relit ; la mesure tranche : **`arguments` racine**, pas `app.scriptArgs`.

**Solution** —

1. Transmettre par **`app.doScript(src, lang, [a0, a1, …])`** ; relire dans le script par **`arguments.length`** / **`arguments[i]`**.
2. **Ne pas compter sur `app.scriptArgs`** : dans ce runtime il ne rend rien et ne lève aucune erreur.
3. **Répartiteur** : un `doScript` **sans** 3e paramètre ⇒ `arguments` **undefined** ⇒ `typeof arguments === "undefined" ? "menu" : "panneau"`.
4. Le **4e** paramètre de `doScript` est `UndoModes` — c'est **là que l'annulation de script se règle**. **Dette soldée le 30/09/2026** : `import_md.jsx` enveloppe désormais son corps d'import dans `app.doScript(mainInterne, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT)` ⇒ **un import entier = un seul pas de `Ctrl+Z`** (validé en réel par FJD).

**Portée** — Tout appel d'un script ExtendScript **avec arguments** depuis un panneau UXP (ou tout autre appelant). Complète le **Cas 33** (`$.global` ne transporte pas d'état au-delà de la frontière de script) et le **Cas 36** (le module **définit**, les appelants **décident**).

---

## Cas 48 — Le numéro de paragraphe absolu se compte en retours paragraphe avant l'offset caractère, jamais par soustraction

**Statut source** : `mesuré`
**Build de référence** : InDesign 2026 `21.6.0.57`, `fr_FR`, macOS — mesuré le **30/09/2026**.
**Contexte** : mission 04 (import Markdown). Le moteur insère une série de blocs au
**point d'insertion** (curseur), puis doit **relire chacun** pour lui poser son style
de paragraphe. Il lui faut donc, pour chaque bloc inséré, son **rang absolu** dans
la story.

**Symptôme observé** — Les styles se posaient **un cran à côté** : le premier bloc
relu portait le style du **second**, etc. Sur **document neuf** (insertion en toute
fin de story), le défaut **n'apparaissait pas** ; sur **document non vide** (curseur
au milieu), **oui**.

**Cause mesurée** — Le moteur calculait le rang de base ainsi :

```
baseParaIndex = story_total − insertedParaCount
```

C'est **faux** dès que l'insertion n'est pas à la toute fin de la story. Raison
exacte, vérifiée dans le journal du moteur (tir réel du 30/09/2026) :

```
M03-etape1: blocs texte attendus=283 / total blocs parses=289 | crCount=293
          | paragraphes attendus=294 | insertAtCursor=true
```

Mesure intermédiaire d'un cas réduit : **527** paragraphes **avant** le point
d'insertion + **44** blocs insérés. Le **total** attendu serait `527 + 44 = 571` —
or la story en compte **570**. Pourquoi ? Parce que **le dernier bloc inséré
fusionne avec le paragraphe qui suivait** le curseur (il n'y a **pas** de coupure
ajoutée après lui). Donc :

- **N paragraphes insérés** n'ajoute **pas** N paragraphes à la story : **N−1**
  (le dernier se greffe sur la suite) ;
- la soustraction `story_total − N` désigne alors le **mauvais** paragraphe (ici
  **526** au lieu de **527**) → **tout le mapping décalé d'un cran** ;
- l'erreur était **masquée** sur document neuf : `base = 0 − 294` ⇒ borné à **0**,
  ce qui **tombait juste par accident**.

**Solution** — Ne **jamais** déduire le rang par soustraction. Désigner le point
d'insertion par son **offset caractère** (`baseCharOffset`), puis obtenir le rang
du paragraphe par **comptage direct des retours paragraphe (`\r`)** avant cet
offset :

```
baseParOffset = nombre de "\r" dans liveStory.contents.substring(0, baseCharOffset)
```

C'est **déterministe**, **indépendant** du contenu (donc **aucune collision** si un
import antérieur du **même** fichier est déjà présent), et **exact** que
l'insertion soit en fin ou au milieu de la story. Si l'offset caractère est
indisponible **et** que la soustraction est incohérente, le moteur **abandonne
explicitement** (`baseIndexKnown=false`) plutôt que de poser un style **au hasard**
sur le texte voisin.

**Portée** — Toute écriture par script qui doit ensuite **styler/reparcourir** des
paragraphes insérés (pas seulement l'import Markdown). Se combine au **Cas 26**
(`.index` n'est pas un index de paragraphe) et au **Cas 24** (la story capturée se
détache après une assignation de contenu).

---

## Cas 49 — UXP `getFileForOpening` : le sélecteur natif qui casse l'œuf-poule du premier import

**Thème** : panneau UXP (sélecteur de fichier)
**API / objet visé** : `require("uxp").storage.localFileSystem.getFileForOpening({ types, allowMultiple })` → `Entry.nativePath`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS), panneau UXP `com.fjd.importmd.panneau` — mesuré le **01/10/2026** (mission 06, batterie `verifier_moteur.js`, **125 vérifications / 0 échec**)

**Contexte** — Le panneau Liens MD n'a qu'**une seule** source de vérité pour savoir quoi importer : l'**étiquette de document** `md-source-fingerprint` (6 champs `v,size,checksum,modified,name,path`), relue par `extractLabel` (cf. Cas 44). Cette étiquette est écrite par le **moteur** `import_md.jsx`, et **seulement après un import réussi**. Le panneau ne PROPOSE donc jamais un chemin : il **décide** sur ce que le document lui dit (tube gelé, cf. Cas 47).

**Symptôme** — Sur un document **neuf** (donc sans étiquette), le panneau refuse tout : bandeau allumé `import refuse : aucune source selectionnee`. Constat FJD : *« import refusé, aucune source sélectionnée. On dirait que le panneau exige un premier import pour importer une première fois, on n'est pas rendus… »*. L'utilisateur n'a **aucun geste** qui lui permette de déclarer une première source.

**Cause** — C'est un **œuf-poule** fermé, et il tient à **un seul** point d'entrée : le chemin ne pouvait venir **que** de l'étiquette ; l'étiquette ne peut venir **que** d'un import réussi ; un import réussi exige **déjà** un chemin. Chaque maillon est correct isolément ; c'est la **transition** (document neuf → première source) qui n'avait aucun représentant dans l'interface.

Aucun script ne pouvait le révéler : c'est un défaut de **chemin d'accès**, pas de logique — tous les tests unitaires passaient, parce qu'ils **fournissaient** une étiquette au lieu de constater son absence.

**Ce que dit la doc** — **Aucune citation vérifiée conservée** : la page Adobe décrivant `getFileForOpening` n'a **pas** été retrouvée verbatim avec URL HTTP 200 à la date d'écriture. Le cas porte donc `mesuré` (comportement constaté en réel, sans source externe citable) — **fallback honnête déclaré**, jamais de reformulation de mémoire (règle du gabarit É1). Seule la **forme d'appel effectivement utilisée** est reproduite ci-dessous, telle qu'exécutée.

**Solution** — Câbler le bouton `btn_relier` sur le sélecteur **natif** :

```js
const fs = require("uxp").storage.localFileSystem;
const entree = await fs.getFileForOpening({
  types: ["md", "markdown", "txt"],
  allowMultiple: false,
});
// entree.nativePath part dans LE MÊME tube gelé (Appelant / Action / Chemin)
// que l'import classique : le panneau PROPOSE, le moteur DÉCIDE.
```

1. Le sélecteur est **le seul point d'entrée indépendant de tout état du document** : il n'a besoin ni d'étiquette, ni d'import antérieur, ni de sélection. C'est ce qui rouvre le chemin.
2. Ne **pas** court-circuiter le tube : le chemin obtenu repart dans les **3 champs nommés** (`Appelant=panneau`, `Action=importer`, `Chemin=<md>`) — le panneau ne décide **rien** lui-même (cf. Cas 47).
3. Le moteur reste **complet sans étiquette** : c'est un **premier** import, il n'y a rien à confronter ; l'étiquette est **écrite** à l'issue, ce qui rend l'import suivant comparable.
4. Sur le **refus/annulation** du sélecteur, ne rien envoyer au moteur et le **dire** (trace au journal) — un refus silencieux serait indiscernable d'un blocage.

**Portée** — Tout panneau UXP dont la donnée de pilotage est **stockée dans le document** (étiquette, `Link`, métadonnée) et qui doit néanmoins démarrer sur un document **vierge**. Généralise le Cas 44 (ce que le label accepte) : un label est un **état**, jamais un **point d'entrée** — il faut toujours, à côté, un geste qui n'en dépend pas.

---

## Cas 50 — Un écran de panneau UXP démarre VIDE : la maquette n'est jamais l'état d'ouverture

**Thème** : panneau UXP (état d'ouverture, habillage)
**API / objet visé** : `element.style.display` (valeurs explicites `block` / `none` / `flex`), `document.getElementById`, `setTimeout`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS), panneau UXP `com.fjd.importmd.panneau` — mesuré le **01/10/2026** (mission 06, batterie `verifier_moteur.js`, **125 vérifications / 0 échec**)

**Contexte** — Le panneau a été dessiné à partir d'une **maquette** (3 sources de démonstration, fiche garnie, compteur « 2 liens sélectionnés »). Ces valeurs ont fini par être écrites **dans le DOM** — donc l'écran les affichait à l'ouverture, avant toute lecture du document réel.

**Symptôme** — Deux défauts distincts, même écran :

1. FJD : *« par défaut le panneau garni des items qui ont servi à produire la maquette statique. Il faut des éléments vierges, un panneau vide on load »* — puis, plus précis : *« pas vide, mais actualisé par défaut. Vide puis refresh onload »*. L'écran mentait : il montrait le **dessin**, pas le **document**.
2. FJD : *« la ligne apparaît avec une icône d'alerte rouge »* — sur une source **saine**. Une **alerte rouge** s'affichait alors que rien n'était cassé.

**Cause** —

1. **L'état d'ouverture vivait dans le DOM**, en **quatre** endroits : les 3 `<div class="ligne">`, les champs de la fiche (`info_nom`, `info_taille`, `info_date`, `info_chemin`, `info_modele`, `info_etat`), la note de liste et le compteur de sélection. Rien ne les effaçait au chargement : l'écran **était** la maquette jusqu'à la première lecture.
2. **Les gabarits d'icônes sont choisis par POSITION, pas par classe.** Les 3 lignes-modèles portent l'icône **en dur** : rang 1 = triangle ambre (`#fcb910`), rang 2 = **cercle rouge** (`#d50f2b` + point d'exclamation blanc), rang 3 = colonne État **vide**. Il n'existe **aucune** règle CSS `.etat-*` : l'aiguillage se fait par `indexLignePourEtat(etat)`, **seul** mécanisme de conditionnement. Or l'ancien aiguillage envoyait `identique → rang 2` — soit **la ligne du cercle rouge**. Une source **saine** (« identique ») révélait donc l'alerte. Ce n'est pas l'icône qui était fausse : c'est **l'aiguillage**.

**Ce que dit la doc** — Aucune citation externe : cas de **méthode/habillage**, `mesuré` (même fallback déclaré que le Cas 49).

**Solution** —

1. **Assainir le DOM** : les 3 lignes-modèles passent en `display:none`, **sans aucune classe** d'état, textes **vides** ; tous les champs de fiche vidés ; note et compteur vidés. Le DOM ne transporte plus **aucune** donnée : les 3 lignes deviennent une **bibliothèque d'icônes**, pas un état.
2. **Vider explicitement au chargement** : un `viderLaListe()` masque les lignes, blanchit la fiche, retire la classe d'état, éteint le bandeau et **annonce** la lecture (`0 source  -  lecture du document en cours`).
   Distinction à tenir : ce libellé est une **annonce**, pas une **mesure** — l'écran vide ne prétend pas avoir compté.
3. **Puis lire, en différé** (600 ms) : `actualiserListe()` remplit l'écran **réel**. Le report n'est pas cosmétique : au tout premier instant de vie d'un panneau UXP le pont InDesign peut n'être **pas encore établi**, et une lecture immédiate afficherait `module indesign indisponible` — soit un **faux diagnostic présenté comme une mesure**.
4. **Corriger l'aiguillage, pas l'icône** :
   `different → rang 1` (triangle ambre = source modifiée) · `source_absente → rang 2` (cercle rouge = **chemin d'import brisé à réimporter**, définition FJD) · `identique` **et** état indéterminé `→ rang 3` (**colonne vide : rien à signaler**, jamais une icône inventée).
5. **Toujours écrire `display` explicitement** (`block` / `none` / `flex`) — piège joint, mesuré au tir : `style.display = ""` **ne rend pas la valeur par défaut**, il **rend la main à la feuille de styles**. Un `""` laissait la ligne comptée comme **affichée** et faussait la mesure suivante (échec de batterie obtenu puis corrigé par `"none"`).

Preuve d'exécution (batterie, extraits bruts) :

```
=== OUVERTURE - l'ecran demarre VIDE, jamais sur la maquette ===
  OK    aucune ligne affichee a l'ouverture  ->  []
  OK    note : la lecture est ANNONCEE, pas mesuree  ->  "0 source  -  lecture du document en cours"
=== OUVERTURE - " vide PUIS refresh " : la lecture remplit l'ecran vide ===
  OK    avant le refresh : l'ecran est toujours vide  ->  []
  OK    apres le refresh : la ligne 0 (triangle ambre) est servie  ->  ["0"]
  OK    indexLignePourEtat(identique) = colonne VIDE (aucune alerte)  ->  2
TOUT PASSE  (125 verifications)
```

**Portée** — Tout panneau UXP dérivé d'une maquette. Trois règles à garder : **(a)** la maquette est une **bibliothèque d'icônes**, jamais un état d'ouverture ; **(b)** si un habillage se choisit **par position**, l'aiguillage est le **seul** conditionnement — il doit être nommé et testé comme tel ; **(c)** `style.display = ""` n'est pas « la valeur par défaut ». Se combine au **Cas 27** (ce que le sandbox peut vraiment certifier) : la batterie a été étendue pour **simuler un résidu de maquette** et **prouver** que `viderLaListe()` l'efface — sans quoi elle n'aurait attesté qu'un cas favorable.

---

## Cas 51 — Le journal du moteur est en MacRoman : UXP le lit en UTF-8 et échoue

**Thème** : panneau UXP (relecture d'un fichier écrit par le moteur)
**API / objet visé** : `File.encoding` + `File.writeln` (ExtendScript), `localFileSystem.getEntryWithUrl` + `Entry.read()` (UXP), `app.doScript` (route de repli)
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS), panneau UXP `com.fjd.importmd.panneau` — mesuré le **02/10/2026** (mission 06, batterie `verifier_moteur.js`, **132 vérifications / 0 échec**)

**Contexte** — Le panneau juge un import en lisant les lignes **ajoutées** au journal du moteur (`import_md_errors.log`) entre un relevé « avant » et un relevé « après ». Ce journal est écrit par `logToFile()` (`import_md.jsx`).

**Symptôme** — FJD : *« import envoyé, mais journal moteur illisible »*. L'import avait bien été envoyé au moteur : c'est la **relecture du journal** qui échouait, et le panneau incriminait ce journal — sur un motif qui ne disait pas **pourquoi**.

**Cause** — `logToFile()` ouvre le fichier avec `open("a")` **sans encoding explicite** : ExtendScript écrit alors dans l'encodage **système**, c'est-à-dire **MacRoman** sur macOS (un « é accent aigu » y est l'octet `0x8E`). UXP, lui, lit les fichiers en **UTF-8** : `getEntryWithUrl` + `read()` **échouent** sur ce fichier précis.

Mesure directe sur le journal réel (129 368 octets) :

```
decode UTF-8 : ECHEC -> 'utf-8' codec can't decode byte 0xd1 in position 664: invalid continuation byte
decode MacRoman : OK ; accents -> ['—', '—', 'é', 'é', 'É', ...]
```

Deux éléments écartent l'hypothèse d'un simple problème de chemin : **le même dossier** et **le même helper** (`lireFichierTexte`) lisaient sans peine la **source `.md`** (6 157 caractères, UTF-8 valide) ; seul le **journal** échouait. Ce n'était donc pas l'accès au dossier, mais **l'encodage du fichier**.

Et la cause était **invisible** : le `catch` de `lireFichierTexte()` renvoyait `null` **sans dire pourquoi** — le panneau affichait un motif alarmant sans la raison. Un `null` sans cause transforme un défaut d'encodage en message trompeur.

**Ce que dit la doc** — Aucune citation externe : cas de **méthode/encodage**, `mesuré` (même fallback déclaré que les Cas 49 et 50).

**Solution** — Lire le journal **par le moteur**, jamais par UXP. C'est la route déjà éprouvée par la sonde (`com.fjd.importmd.sonde/main.js` L354 : `j.encoding = "BINARY"; j.open("r")`), reprise à l'identique :

```js
async function lireJournalParLeMoteur(chemin) {
  const ind = moduleInDesign();
  if (!ind || typeof ind.app.doScript !== "function") return null;
  const src =
    'var j = new File(' + chaineExtendScript(chemin) + ');\n' +
    'var texte = "";\n' +
    'if (j.exists) { j.encoding = "BINARY"; if (j.open("r")) { texte = j.read(); j.close(); } }\n' +
    'texte;';
  const t = ind.app.doScript(src, ind.ScriptLanguage.JAVASCRIPT);
  return (typeof t === "string") ? t : null;
}
```

1. La lecture passe par `app.doScript` (ExtendScript) en mode **`BINARY`** : les octets MacRoman deviennent une chaîne **sans tentative de décodage UTF-8**.
2. Le différentiel **avant/après** reste octet à octet, et les marqueurs jugés (`M04: REFUS`, `M04: source IMPOSEE par le PANNEAU`, `M04-repartiteur: appel PANNEAU`) sont **purs ASCII** : la réussite du décodage n'a aucune incidence sur le jugement.
3. Les lignes reportées au journal **du panneau** sont filtrées de tout non-ASCII (`replace(/[\u0080-\uffff]/g, "")`) : le journal moteur étant lu en binaire, les octets MacRoman y apparaîtraient sinon en bruit.
4. Quand le moteur ne rend rien, le motif est **honnête** — « le moteur n'a pas rendu son journal » — et **ne juge pas** le document (« le document peut avoir été importé : ce message ne juge que le journal »).

**Portée** — Tout consommateur **UXP** d'un fichier écrit par un **moteur ExtendScript** : le moteur écrit dans l'encodage **système** (MacRoman sur macOS), UXP lit en **UTF-8**. Deux règles : **(a)** un fichier produit par le moteur se relit **par le moteur** (`File.encoding = "BINARY"`), ou bien le moteur doit écrire en **UTF-8 explicite** ; **(b)** un `catch` qui renvoie `null` **sans cause** cache la raison réelle — toujours signaler la cause. Se combine au **Cas 45** (`File.read()` normalise les fins de ligne) : les deux montrent que la lecture d'un fichier par ExtendScript a des effets que l'on ne voit pas.

---

## Cas 52 — Le panneau relit le document à l'ouverture, pas après l'import : l'écran montre l'état d'avant

**Thème** : panneau UXP (état de l'écran vs état du document)
**API / objet visé** : `Document.extractLabel` / `insertLabel` (écriture par le moteur), relecture côté panneau (`construireListe()`), `app.doScript`
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS), panneau UXP `com.fjd.importmd.panneau` — mesuré le **02/10/2026** (mission 06, batterie `verifier_moteur.js`, **137 vérifications / 0 échec**)

**Contexte** — Le panneau affiche « une ligne par source » en relisant l'étiquette `md-source-fingerprint` du document actif. Cette étiquette est écrite par le **moteur** (`import_md.jsx`, `insertLabel`) au moment d'un import réussi : c'est le moteur, pas le panneau, qui écrit dans le document.

**Symptôme** — FJD : *« Un nouvel import, pas de nouvelle ligne. »* L'import réussissait (le moteur écrivait bien), mais l'écran ne montrait **jamais** la nouvelle ligne : il fallait cliquer « Actualiser » pour la voir apparaître.

**Cause** — Le panneau ne relisait le document qu'à **deux** moments : au chargement (lecture différée de 600 ms) et sur clic « Actualiser ». La fonction qui traite l'import (`envoyerImportAuMoteur()`, tronc commun à « Importer » et « Relier ») **ne relisait pas** le document après avoir confié l'ordre au moteur. Or l'écran n'est qu'un **instantané** de la dernière lecture : le document venait de **changer** (le moteur y avait écrit sa nouvelle étiquette), mais l'écran affichait encore l'état **d'avant** l'import. Un document vierge restait donc à « 0 ligne » juste après un import réussi.

C'est un défaut de **fraîcheur de lecture**, pas d'écriture : le panneau n'écrit rien (règle du tube gelé, cf. Cas 47) ; il oubliait simplement de **relire** ce que le moteur venait d'écrire.

**Ce que dit la doc** — Aucune citation externe : cas de **méthode**, `mesuré` (même famille que les Cas 49 à 51).

**Solution** — Après un import réussi, **relire le document** avant de conclure — et placer cette relecture **avant** le verdict :

```js
  // ... import confié au moteur, journal comparé, refus écarté ...
  await actualiserListe();   // relit le document tel qu'il est MAINTENANT

  afficherStatut(true, "import demande au moteur.\n" + ...);
```

Deux points de méthode :

1. **Relire après toute écriture venue d'ailleurs.** Le panneau ne modifie jamais le document : tout changement (étiquette, page, etc.) vient du moteur. Toute écriture du moteur impose donc une **relecture explicite** côté panneau.
2. **L'ordre compte.** `actualiserListe()` (`construireListe()`) part d'un bandeau muet et **peut le rallumer** (source modifiée). Comme `afficherStatut(true, …)` ne fait que **journaliser** (un succès reste muet, cf. Cas 50), c'est le verdict écrit en **dernier** qui reste maître du bandeau.

La preuve tient dans la batterie : un document **sans étiquette** (0 ligne) reçoit un import ; le moteur simule l'écriture de l'étiquette ; **sans aucun clic** sur « Actualiser », la liste passe à **1 ligne** et la fiche se garnit (`apres import : la liste est RAFRAICHIE (1 ligne, sans clic) -> ["2"]`).

**Portée** — Tout panneau (UXP) dont l'écran **reflète** un état que **seul le moteur écrit** : l'écran est un instantané, il ne se met pas à jour tout seul. Règle : **écrire (moteur) ⇒ relire (panneau)**, au même endroit du code que l'action, et jamais sur un état antérieur. Se combine au **Cas 50** (l'écran montre ce qu'on a lu, pas ce qui est) et au **Cas 51** (la relecture d'un fichier du moteur a ses propres pièges d'encodage).

---

## Cas 53 — Une étiquette de document ne peut pas mémoriser N sources : la liste encodée en paires plates, et l'UPSERT qui remplace SUR PLACE

**Thème** : persistance d'état dans le document (étiquette) — format de stockage
**API / objet visé** : `Document.insertLabel` / `extractLabel` (Couple clé/valeur), absence de `JSON` natif (ES3), `File.fsName` / `File.read()` (empreinte des sources)
**Statut source** : `mesuré`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS), moteur `import_md.jsx` — mesuré le **02/10/2026** (mission 06, batterie `verifier_empreinte.js`, **51 vérifications / 0 échec**)

**Contexte** — Le panneau affiche **une ligne par source importée** et lit cet état dans l'étiquette `md-source-fingerprint` du document. Jusqu'ici cette étiquette ne mémorisait **qu'une seule** source (chemin + taille + somme + date), réécrite à chaque import — suffisant pour la question d'alors (« la source qui a servi au dernier import a-t-elle changé ? », cf. Cas 45), insuffisant dès que le critère devient « **N imports ⇒ N lignes** ».

**Symptôme** — FJD : *« j'ai deux imports différents dans mon doc, je dois avoir deux lignes dans mon panneau. »* Le panneau affichait **une seule** ligne, celle du **dernier** import : la précédente avait disparu.

**Cause** — Ce n'est pas un défaut de code, c'est une **impossibilité structurelle du support**. `insertLabel(clé, valeur)` associe **une** clé à **une** valeur et **ÉCRASE** la valeur précédente (mesuré, cf. **Cas 44**). Une étiquette **mono-source** ne *peut pas* contenir N sources : chaque nouvel import remplaçait le contenu du précédent. Le document n'avait donc **pas de mémoire** de la seconde source — aucune correction côté affichage ne pouvait la faire apparaître.

S'y ajoute la contrainte de langage : ExtendScript est **ES3**, sans `JSON` natif (**Cas 07**), donc pas de « sérialiser un tableau » disponible.

**Ce que dit la doc** — `insertLabel(key, value)` : la doc Adobe ne propose qu'un **couple clé/valeur**, sans conteneur ni variante plurielle ; aucune API de type « plusieurs valeurs pour une clé ». L'absence de `JSON` est **sourcée** (Cas 07, ES3 §15.12). Pour le reste, comportement **constaté en réel** (batterie moteur).

**Solution** — Encoder la **liste** dans **une seule** valeur de label, en **paires plates** à **un seul niveau** — le format déjà employé par le projet (`serializeFlatMapping`) :

```
{"v":"2","n":"2","s0.v":"2","s0.name":"un.md","s0.path":"/x/un.md","s0.size":"16",
 "s0.checksum":"…","s0.modified":"…","s1.v":"2","s1.name":"deux.md", …}
```

Quatre décisions, toutes justifiées par une mesure :

1. **Une seule accolade, aucun tableau, aucun imbrication.** Le format est plat par construction : une regex de paires `"clé":"valeur"` suffit à le relire, sans parseur. Le préfixe `s<i>.` donne l'ordre des sources (`s0`, `s1`, …), `v` porte la **version du format** et `n` le **compteur**.
2. **Versionné dès la première évolution, et rétrocompatible.** Une étiquette **v1** (mono-source, déjà posée dans des documents existants) est relue **comme une liste à un élément** : `!obj.n && obj.path` ⇒ 1 source. Aucun document déjà importé ne perd sa source (vérifié : *« la source v1 n'est PAS perdue »*, la nouvelle source vient en tête, l'ancienne est conservée, et l'étiquette réécrite passe en v2).
3. **Borné aux deux bouts.** `M05_MAX_SOURCES = 12` s'applique à l'**écriture** (15 imports de **chemins différents** ⇒ 12 mémorisés, les 3 plus anciens évincés, le plus récent en tête) **et** à la **lecture** (un compteur `n` valant **99** ⇒ **12** sources lues, jamais 99). Un document forgé ne peut donc pas faire allouer au panneau une liste arbitrairement longue.
4. **Aucun champ vide n'est écrit.** Le sérialiseur n'écrit que les valeurs *truthy* (`if (obj[key])`) : un champ vide et un champ **absent** sont **indistinguables** dans le format. Ce n'est pas une perte — les lecteurs reconstituent avec `|| ""`, et un chemin vide rend une source **ignorée** (contrôle négatif : `n=3` avec une source sans chemin ⇒ **2** sources lues).

**Deuxième comportement mesuré, à la mise à jour d'une source déjà mémorisée** : l'écriture est un **UPSERT qui remplace SUR PLACE**. Un chemin **déjà** mémorisé est remplacé **à sa position** ; seul un chemin **nouveau** est poussé en tête (`unshift`). Conséquence visible : après un réimport, l'ordre des lignes **ne bouge pas** — le panneau ne se réordonne pas sous les yeux de l'utilisateur entre deux rafraîchissements. Vérifié dans les deux sens : `2 imports différents` ⇒ `["/x/deux.md", "/x/un.md"]` (le récent en tête), puis réimport de `/x/un.md` ⇒ **toujours 2 sources** et l'ordre **inchangé** (`/x/deux.md` reste 1ʳᵉ, `/x/un.md` reste 2ᵉ), le journal distinguant l'**ajout** de la **mise à jour** (`ajout`, `ajout`, `maj`).

**Portée** — Toute donnée de **longueur variable** attachée à un document InDesign passe obligatoirement par un **label**, donc par un **couple clé/valeur** : il faut l'**aplatir** (un seul niveau, préfixes d'index), la **versionner** (dès la première évolution, en gardant la lecture de l'ancien format) et la **borner** en lecture comme en écriture. Ne jamais supposer qu'un label accepte un tableau ou un objet imbriqué : `insertLabel` ne connaît que du texte, et ExtendScript n'a pas de `JSON` pour en fabriquer un. Se combine au **Cas 44** (le label écrase : une clé = une valeur) et au **Cas 07** (pas de `JSON` natif) — ce cas est ce que ces deux-là imposent quand il faut mémoriser **plusieurs** choses.

---

## Cas 54 — Le panneau ne suit pas le document actif : événements InDesign en chaînes minuscules, et bascule NON mesurable hors InDesign

**Thème** : panneau UXP — écoute des événements du host InDesign
**API / objet visé** : `app.addEventListener` / `app.removeEventListener` (module `indesign`), énumération `Event` (`afterOpen`, `afterActivate`, `afterClose`, `afterNew`, `afterContextChanged`), `app.activeDocument`
**Statut source** : `sourcé`
**Build de référence** : InDesign **21.6.0.57** (fr_FR, macOS) — événements UXP disponibles depuis **InDesign 18.4**

**Contexte** — Le panneau « Liens MD » lit l'état des imports dans l'étiquette du **document actif** (`app.activeDocument`). Jusqu'au tir 9, il ne lisait ce document qu'à **deux moments** : au **démarrage** (lecture différée) et sur **clic** (« Actualiser », import, relier). **Aucun écouteur d'événement InDesign n'existait.**

**Symptôme** — FJD : *« lorsqu'on passe d'un doc à l'autre, le panneau demeure sur l'état précédent »*. Ouvrir un document, ou **basculer** vers un autre document déjà ouvert, laissait l'écran figé sur les lignes, la note et la fiche du **document précédent**.

**Cause** — Un panneau UXP est un **observateur** : il ne « voit » que ce qu'il **relit**. Sans **abonnement aux événements du host**, rien ne le prévient qu'un autre document est devenu actif ⇒ l'écran reste un **instantané** de sa dernière lecture. Même famille que le **Cas 52** (écrire ⇒ relire) : le panneau ne relit pas au bon **moment**.

**Ce que dit la doc** — Deux pages Adobe **consultées le 02/10/2026** :

- Recette « InDesign events » (`https://developer.adobe.com/indesign/uxp/resources/recipes/indesign-events/`) : `const { app } = require("indesign"); app.addEventListener("<nom>", handler);` — le handler reçoit un objet exposant `.eventType` et `.currentTarget.name` ; retrait par `app.removeEventListener("<nom>", handler)`. **Le nom est une chaîne EN MINUSCULES** (`"afterNew"`, `"afterOpen"`, …), **jamais** une constante `Event.*` à la manière d'ExtendScript.
- Énumération `Event` (`https://developer.adobe.com/indesign/uxp/dom/api/e/event/`) : membres tous **en minuscules** — `afterOpen`, **`afterActivate`** (« Dispatched after the Event becomes active »), `afterClose`, `afterNew`, `afterContextChanged` (« Dispatched after the active context changes »)…

**Limite de source, déclarée** : **quel** événement se déclenche **exactement** sur une **bascule entre deux documents DÉJÀ ouverts** n'est pas documenté sans ambiguïté et **n'est pas mesurable hors InDesign** (`afterActivate` ? `afterContextChanged` ?). Ce cas ne le présente donc **pas** comme établi.

**Solution** — Une **veille à deux étages**, avec **un seul point d'entrée** qui tranche :

1. **Étage 1 — abonnement (voie rapide)** : enregistrer une **superposition** d'événements (`afterOpen`, `afterActivate`, `afterClose`, `afterNew`). Puisque le nom exact de la bascule est incertain, on **couvre** au lieu de parier. `removeEventListener` n'est pas appelé en l'état : le panneau vit toute la session.
2. **Étage 2 — veille périodique (filet GARANTI)** : une relecture `setInterval(…, 1000)` de l'**identité du document actif** (`nom|id`). C'est ce qui rend la correction **insensible** à l'incertitude ci-dessus : même si aucun des quatre noms ne tire sur la bascule, le panneau suit quand même.
3. **Un point d'entrée unique** compare l'identité ; il ne déclenche un rafraîchissement que sur **changement réel**, et **une seule fois par salve** (anti-rafale ≈ 300 ms) — une salve d'événements ne provoque **pas** N relectures.
4. **Lecture seule** : la veille ne fait que **relire** le document ; elle n'écrit **rien** (tube gelé inchangé, cf. **Cas 47**).

Le tirant se voit à l'écran : identités consignées avant/après, un rafraîchissement par changement, et `true`/`false` selon qu'un changement a été observé.

**Portée** — Tout panneau **persistant** qui affiche un état **dépendant du contexte** (document actif, sélection, page) doit **s'abonner** aux événements du host — mais un abonnement dont le **nom** n'est pas certain ne suffit **jamais** à garantir la réactivité : prévoir systématiquement un **filet** (relecture périodique) et **journaliser l'identité** de ce qu'on observe, pour distinguer « rien n'a changé » de « on n'a rien vu ». Se combine au **Cas 52** (écrire ⇒ relire) et au **Cas 50** (l'écran est un instantané).

---

## Piège structurel à retenir — deux copies du même script

InDesign exécute les scripts depuis `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/`, pas depuis le dossier de travail/repo. Toute correction faite sur le fichier source doit être recopiée vers cet emplacement avant test, sinon on corrige un fichier que le logiciel n'utilise jamais (piège rencontré le 23/09/2026, cf. mission_01).

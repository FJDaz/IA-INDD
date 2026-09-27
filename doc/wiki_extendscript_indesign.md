# Wiki ExtendScript / InDesign — Base de connaissance des cas rencontrés

But : capitaliser les pièges API ExtendScript/InDesign découverts en pratique sur ce projet (et futurs projets InDesign), pour ne plus les redécouvrir à chaque script. Alimenté au fil des bugs rencontrés, pas une doc théorique.

## Méthode générale — développement fiable d'un script ExtendScript/InDesign (validée le 23/09/2026)

Constat FJD après plusieurs itérations correctif → test manuel → nouveau bug sur le module gras/italique : deviner l'API par déduction du message d'erreur suffit pour des erreurs de syntaxe simples (mot réservé, méthode absente), mais pas pour un modèle de données stateful comme le texte InDesign (`Story`/`Paragraphs`/`InsertionPoint`), où une hypothèse fausse en remplace facilement une autre sans que rien ne le signale avant le test suivant. Cette méthode a ensuite permis d'ajouter une fonctionnalité entièrement nouvelle (support des tableaux Markdown, jamais fait avant sur ce projet) qui a fonctionné au tout premier essai réel — la meilleure preuve de sa valeur.

### Les 5 réflexes, dans l'ordre

**1. Vérifier la documentation officielle avant de coder une hypothèse — et laisser une trace citable, pas juste "vérifié via doc".**
Ne jamais supposer qu'une API InDesign se comporte comme son équivalent JS générique le laisserait penser (`+=` sur un `InsertionPoint` n'est pas garanti se comporter comme `+=` sur une chaîne JS — cf. Cas 14). Chercher un exemple de code fonctionnel dans la doc officielle (indesignjs.de/extendscriptAPI) ou les forums Adobe/Indiscripts, pas seulement la signature de la méthode. Un exemple réel vaut mieux qu'une description abstraite de paramètres.

Décision FJD (23/09/2026) sur la manière de capitaliser cette doc : pas de RAG ni d'indexation séparée de la doc Adobe (disproportionné pour ce projet) — chaque vérification documentaire qui aboutit à un cas du wiki doit inclure la **citation exacte** trouvée (pas une paraphrase) et l'**URL source**, directement dans l'entrée du cas concerné. Le wiki devient ainsi une doc Adobe filtrée par l'usage réel du projet, sans infrastructure à maintenir. Voir le format dans les cas ci-dessous (ex. Cas 09, 14, 17) — à reproduire systématiquement pour toute nouvelle vérification.

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

---

## Cas 01 — `char` est un mot réservé

**Symptôme** : `Illegal use of reserved word 'char'` (erreur JS #9)

**Cause** : ExtendScript hérite du vocabulaire réservé de Java/ES3. `char` (et d'autres mots-clés Java non utilisés en JS moderne) ne peuvent pas servir de noms de variables, même si un linter JS standard ne les signalerait pas.

**Correction** : renommer la variable (`ch`, `currentChar`, etc.)

**Mots réservés à surveiller** (hérités Java, invalides comme identifiants en ExtendScript) : `char`, `new`, `default`, `class`, `final`, `native`, `package`, `synchronized`, `throws`, `boolean`, `byte`, `double`, `float`, `int`, `long`, `short`, `interface`, `implements`, `extends`, `import`, `export`, `super`, `transient`, `volatile`.

---

## Cas 02 — `app.activeWindow.alert()` n'existe pas

**Symptôme** : `app.activeWindow.alert is not a function` (erreur JS #24)

**Cause** : confusion probable avec une API d'un autre contexte (After Effects, ou pattern halluciné). L'alerte native ExtendScript est la fonction **globale** `alert(message)`, pas une méthode d'un objet `Window` ou `activeWindow`.

**Correction** : `alert(text)` — un seul argument texte, pas de titre séparé (à concaténer soi-même si besoin).

---

## Cas 03 — `new Window({...})` avec un objet de config

**Symptôme** : `Bad argument : Invalid Window type specification ([object Object])`

**Cause** : pattern de construction UI copié d'un autre contexte JS (React-like ou After Effects), invalide en ScriptUI InDesign. Le constructeur `Window` attend une signature positionnelle, pas un objet de configuration.

**Correction** : `new Window(type, title, bounds, options)` — ex. `new Window("dialog", "Mon titre")`. Le positionnement des enfants se fait ensuite via `orientation`, `alignChildren`, `spacing`, `margins` (layout automatique) plutôt que `.location`/`.size` en pixels absolus, qui ne sont fiables qu'en désactivant explicitement le layout automatique.

---

## Cas 04 — `collection.everyItem()` itéré avec un `for` classique

**Symptôme** : silencieux (avalé par un `catch` vide) — se manifeste comme "la liste revient vide" sans erreur visible.

**Cause** : `everyItem()` retourne un proxy de collection pensé pour des opérations en masse (ex. `everyItem().name` renvoie directement le tableau complet des noms en un seul appel). L'itérer avec `for (i=0; i<x.length; i++) x[i]` comme un tableau classique est le mauvais pattern et échoue.

**Correction** : soit itérer directement sur la collection sans `.everyItem()` (`collection.length`, `collection[i]`), soit utiliser `everyItem().name` pour obtenir directement le tableau de noms si c'est tout ce qu'il faut.

**Leçon transversale** : ne jamais laisser un `catch` vide sur un appel API InDesign incertain — logger systématiquement (cf. Cas 06), sinon ce genre d'échec silencieux est indiscernable d'un "document sans styles".

---

## Cas 05 — Duck-typing sur les groupes de styles (`ParagraphStyleGroup` vs `CharacterStyleGroup`)

**Symptôme** : `Object does not support the property or method 'paragraphStyles'`

**Cause** : tentative de deviner le type de collection par `group.paragraphStyles || group.characterStyles`. Un `CharacterStyleGroup` n'a pas de propriété `paragraphStyles` du tout — contrairement à du JS indulgent, ExtendScript lève une exception à l'accès à une propriété absente du type, avant même que le `||` puisse évaluer l'alternative.

**Correction** : passer explicitement le type de collection traité (paramètre booléen ou équivalent) à travers la récursion, ne jamais deviner par accès direct à une propriété potentiellement absente.

**Leçon transversale** : `document.paragraphStyles`/`characterStyles` n'exposent que les styles à la racine du document — les styles rangés dans un `ParagraphStyleGroup`/`CharacterStyleGroup` (dossiers de styles dans le panneau InDesign) nécessitent une descente récursive explicite dans `paragraphStyleGroups`/`characterStyleGroups`. De même, `document.paragraphStyles.item(name)` ne trouve pas un style logé dans un groupe — il faut l'objet style réel, obtenu via la traversée récursive.

**Corollaire utile** : `[Style de paragraphe de base]`/`[Aucun]` existent nativement et de façon indestructible sur tout document InDesign, même le plus vierge — la racine de `document.paragraphStyles`/`characterStyles` n'est donc jamais réellement vide. Une UI de sélection de style peut s'appuyer là-dessus pour toujours avoir au moins une valeur par défaut valable, sans code spécial pour le cas "document sans styles personnalisés".

---

## Cas 06 — `document.labels` traité comme une collection énumérable

**Symptôme** : `Object does not support the property or method 'labels'`

**Cause** : les labels InDesign (métadonnées clé/valeur attachées à un document, une page, un objet) ne forment pas une collection qu'on peut lister, itérer par index ou nettoyer manuellement. L'API ne propose que deux opérations : `insertLabel(key, value)` (écrit, et écrase silencieusement toute valeur existante pour la même clé) et `extractLabel(key)` (lit ; retourne `""` si absent).

**Correction** : ne jamais accéder à `.labels`, `.labels.length`, `.labels[i]`. Utiliser directement `doc.insertLabel(key, value)` pour écrire (pas besoin de chercher/supprimer un label précédent, `insertLabel` s'en charge) et `doc.extractLabel(key)` pour lire.

**Leçon transversale (renforce le Cas 04)** : ce bug est resté invisible un moment parce qu'une des deux fonctions concernées avait un `catch` vide — encore un cas d'échec silencieux masqué par l'absence de logging systématique.

---

## Cas 07 — `JSON` n'existe pas nativement en ExtendScript

**Symptôme** : `JSON is undefined`

**Cause** : l'objet global `JSON` (avec `.stringify()`/`.parse()`), natif en JS moderne depuis ES5, n'est pas fourni par le moteur ExtendScript par défaut. Aucun polyfill n'est chargé automatiquement.

**Correction** : pour une structure de données simple et connue à l'avance (objet plat, pas de nesting), écrire un sérialiseur/déserialiseur minimal fait maison plutôt que d'importer un polyfill JSON complet (souvent surdimensionné pour le besoin). Si le besoin de sérialisation devient plus riche (objets imbriqués, tableaux, types variés), envisager d'inclure un polyfill JSON2 standard (`json2.js`, domaine public) en début de script.

---

## Cas 08 — `Array.prototype.indexOf` n'existe pas nativement en ExtendScript

**Symptôme** : `<tableau>.indexOf is not a function`

**Cause** : même famille que le Cas 07 (`JSON`) — `Array.prototype.indexOf` est une méthode ES5, absente du moteur ExtendScript (ES3). Piège facile car `String.prototype.indexOf`, lui, existe bien nativement (hérité de bien plus ancien) — donc `"texte".indexOf("x")` fonctionne, mais `[1,2,3].indexOf(2)` échoue. La ressemblance de syntaxe masque la différence.

**Correction** : écrire une fonction de recherche manuelle (boucle `for` comparant chaque élément) plutôt que compter sur `.indexOf()` pour un tableau. Vérifier au cas par cas si l'objet est une chaîne (`.indexOf` OK) ou un tableau (`.indexOf` KO).

**Leçon transversale** : de façon générale, toute méthode ES5+ (`Array.prototype.indexOf`, `.forEach`, `.map`, `.filter`, `Object.keys`, etc.) est suspecte par défaut en ExtendScript et doit être vérifiée avant usage, pas supposée disponible comme en JS moderne.

---

## Cas 09 — `insertionPoints[-1].paragraphs.add()` n'existe pas

**Symptôme** : `insertionPoints.-1.paragraphs.add is not a function`

**Cause** : `story.insertionPoints[-1]` retourne un objet `InsertionPoint` **unique** (le dernier point d'insertion de la story), pas une collection. Un `InsertionPoint` n'a pas de propriété `.paragraphs` avec une méthode `.add()` — confusion probable avec un pattern de construction d'objet (comme `textFrames.add({...})`, qui lui est valide sur une vraie collection).

**Correction** : pour créer un nouveau paragraphe avec du contenu, écrire le texte directement dans `.contents` du point d'insertion, suivi d'un `"\r"` (le caractère de saut de paragraphe InDesign — pas `"\n"`, qui n'a pas ce sens particulier dans le modèle de texte InDesign). Le `"\r"` crée implicitement un nouveau paragraphe dans la story ; il suffit ensuite d'aller chercher ce paragraphe pour lui appliquer un style.

**Piège associé — l'indexation après un `\r` final** : une fois le `"\r"` écrit, il ouvre un **nouveau paragraphe vide** après le texte qu'on vient d'insérer, À CONDITION qu'un paragraphe existait déjà avant. Donc `story.paragraphs[-1]` (le dernier) désigne ce paragraphe vide, pas celui qui contient le texte — il faut viser `story.paragraphs[-2]` (l'avant-dernier) pour styler le bon paragraphe.

**Piège n°2 — le cas spécial du tout premier paragraphe d'une story vide** : sur une story encore complètement vide, écrire `"texte\r"` en une seule opération ne produit qu'**UN SEUL** paragraphe (pas deux) — la règle `[-2]` ci-dessus ne s'applique donc pas au tout premier bloc écrit. Il faut distinguer explicitement ce cas (`paragraphs[-1]` pour le premier bloc, `paragraphs[-2]` pour les suivants), sinon `paragraphs[-2]` lève `Object is invalid` sur le premier tour de boucle.

**CORRECTION du Cas 09 (23/09/2026, après vérification via simulation Node + doc officielle indesignjs.de)** : le raisonnement `[-1]`/`[-2]` ci-dessus s'est révélé faux dans les deux branches lors d'un test sur un fichier réel — `paragraphs[-1]` pointe TOUJOURS vers le paragraphe vide ouvert par le dernier `\r` écrit, y compris pour le tout premier bloc (un split sur `\r` d'une chaîne `"texte\r"` donne `["texte", ""]`, et `[-1]` est le `""`). La bonne approche, confirmée par la documentation officielle : **écrire le texte du bloc SANS `\r`, appliquer le style pendant que ce texte est encore le dernier paragraphe en cours (`paragraphs[-1]`, sans ambiguïté), puis ajouter le `\r` séparément après**, pour clore ce paragraphe et préparer le suivant. Élimine complètement le besoin de distinguer premier bloc / blocs suivants.

> **Citation source** : *"The easiest way to add text to a frame is targeting its last 'insertion point', which is equivalent to clicking the text cursor at the very end of its text. [...] `myTextFrame.insertionPoints.item(-1).contents = "\rThis is a new paragraph of example text."`"* — le `\r` précède le nouveau texte plutôt que de clore l'ancien, confirmant l'approche "texte d'abord, `\r` après".
> **Source** : recherche web ciblée sur `InDesign ExtendScript InsertionPoint contents append paragraphs "story" text model documentation`, résultat issu de la doc officielle indesignjs.de/extendscriptAPI (page InsertionPoint/InsertionPoints) et d'exemples de la communauté Adobe.

---

## Cas 10 — Fusionner des lignes de texte avec `"\n"` avant insertion InDesign

**Symptôme** : texte inséré présent mais désordonné (fragments coupés au milieu de mots, ordre incohérent), accompagné d'erreurs `Object is invalid` plus loin dans le traitement, sur un `characterRanges`/`characters.itemByRange()`.

**Cause** : un parseur qui fusionne plusieurs lignes source en un seul bloc de texte avec `text += "\n" + ligneSuivante` introduit un caractère qu'InDesign ne traite **pas** comme un saut de paragraphe (seul `"\r"` a ce rôle dans le modèle de texte InDesign — cf. Cas 09). Ce `"\n"` reste un caractère littéral dans le contenu inséré, ce qui décale silencieusement toute longueur de texte calculée en amont (ex. pour positionner un style de caractère sur une plage précise) par rapport à ce qu'InDesign voit réellement — d'où des positions de caractères invalides plus loin.

**Correction** : ne jamais utiliser `"\n"` comme séparateur dans du texte destiné à devenir plusieurs paragraphes InDesign distincts — soit traiter chaque ligne source comme son propre bloc/paragraphe (le cas le plus sûr, un bloc logique = un paragraphe InDesign), soit fusionner avec un espace si la fusion en un seul paragraphe visuel continu est réellement voulue.

**Leçon transversale** : tout calcul de position de caractère en aval (`itemByRange`, `textRangeStart` cumulatif) est extrêmement sensible à la moindre différence entre la longueur de texte calculée côté script et celle qu'InDesign va réellement stocker après insertion — vérifier systématiquement qu'aucun caractère de contrôle ambigu (`\n` vs `\r`, espaces multiples normalisés différemment, etc.) ne s'est glissé entre les deux.

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

> **Citation source** : *"With a text frame selected, this line will add text at the end: `app.selection[0].insertionPoints[-1].contents = "hello, world!";`"* — un exemple de la documentation communautaire InDesign, confirmant l'assignation directe (`=`) comme le pattern standard, jamais `+=`.
> **Source** : recherche web ciblée sur `InDesign ExtendScript "insertionPoints.item(-1).contents =" example add text without erasing existing story content`.

---

## Cas 16 — Un nouveau paragraphe hérite du `startParagraph` (saut de colonne/cadre/page) du texte précédent

**Symptôme** : du contenu inséré par script "disparaît" visuellement — en réalité poussé dans le cadre de texte lié suivant (ou la page suivante), sans erreur JS.

**Cause** : tout nouveau paragraphe créé par script hérite du style de paragraphe (et donc de tous ses attributs, y compris `startParagraph`) du texte qui le précède. Si ce style a un réglage "Démarrer le paragraphe" (Format > Options de saut de paragraphe dans l'UI InDesign, `startParagraph` en scripting) sur autre chose que "N'importe où" (colonne suivante, cadre suivant, page suivante...), tout paragraphe créé juste après hérite de ce comportement de saut — y compris un simple paragraphe technique/vide créé par le script lui-même (ex. un séparateur), pas seulement le contenu "métier".

**Correction** : neutraliser explicitement `paragraph.startParagraph = StartParagraph.ANYWHERE` sur tout paragraphe technique créé par le script (ex. un séparateur de saut de ligne), pour ne pas hériter silencieusement d'un réglage venant du contexte environnant. Ne pas neutraliser cette propriété sur le contenu "métier" lui-même si l'utilisateur a un motif légitime de configurer des sauts dans sa charte de styles — seul le paragraphe purement technique introduit par le script doit être neutralisé.

**Leçon transversale** : l'héritage de style d'un nouveau paragraphe en InDesign n'est pas limité à l'apparence visuelle (police, couleur, etc.) — des attributs de comportement structurel comme les sauts de paragraphe suivent la même règle d'héritage et peuvent produire des effets à distance (contenu qui "disparaît" ailleurs dans le document) difficiles à diagnostiquer sans connaître ce mécanisme.

---

## Cas 17 — Réassignation répétée de `insertionPoints[-1].contents` dans une boucle : curseur non fiable

**Symptôme** : texte présent mais désordonné (fragments, ordre incohérent), persistant à travers plusieurs correctifs qui ciblaient des causes voisines mais pas cette cause structurelle (Unicode, `+=` vs `=`, `startParagraph`) — chacun de ces correctifs a résolu un vrai bug distinct, sans résoudre le désordre de fond.

**Cause** : `story.insertionPoints[-1]` réassigné (`.contents = texte`) plusieurs fois de suite **dans une boucle** ne fait pas avancer le curseur logique de façon fiable pour les itérations suivantes — un comportement documenté par la communauté Adobe (recommandation de travailler "en ordre inverse" pour ce genre de manipulation), qui contredit l'intuition naturelle qu'assigner à `[-1]` après chaque écriture pointerait toujours vers la fin actualisée.

**Correction appliquée en urgence (23/09, FJD)** : abandon temporaire de l'écriture segment par segment (nécessaire pour le gras/italique inline). Un bloc = une seule écriture de texte brut complet en un seul appel (`story.insertionPoints[-1].contents = block.text`, hors boucle interne), avec uniquement le style de paragraphe. Le gras/italique est retiré du scope en attendant un nouveau pattern non testé par itération aveugle.

> **Citation source** : *"When assigning new contents to insertion points, be careful and do that in reverse order (from back to forth) inside a story."* Signalé également : *"when inserting multiple returns to the end of a paragraph using `insertionPoints[-1]` in a loop, the insertion point -1 is not at the end of the paragraph for subsequent iterations."*
> **Source** : recherche web ciblée sur `InDesign ExtendScript multiple sequential "insertionPoints[-1].contents = text" calls in loop does insertion point advance each time`, résultat croisant GitHub (fabianmoronzirfas/extendscript wiki, page InsertionPoints) et forums Adobe.

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

**Leçon transversale** : quand une syntaxe à ajouter réutilise un caractère qui a un usage légitime hors syntaxe (ici `_`), ne jamais l'activer sans condition — toujours vérifier avec l'utilisateur si une règle de désambiguïsation existe déjà dans la spécification de référence (ici CommonMark) avant d'improviser.

---

## Cas 20 — Écriture par segments avec une seule assignation, et une table n'est pas un paragraphe

**Contexte** : cause racine définitive du désordre de texte récurrent (Cas 17), trouvée après qu'un fichier plus long ait fait reproduire le bug malgré le retrait du gras/italique qui l'avait masqué.

**Architecture retenue** (confirmée par recherche documentaire, pattern recommandé pour la performance) : regrouper les blocs de contenu en segments (texte consécutif vs table), écrire chaque segment texte en **une seule assignation** (`insertionPoints[-1].contents = texteComplet`, blocs concaténés avec `\r`), jamais une réassignation par bloc dans une boucle. Les styles de paragraphe sont appliqués **après coup**, par index stable sur `story.paragraphs`.

**Piège n°1 — une table n'est pas un paragraphe.** Citation trouvée : *"tables occupy a single character position in the story"* — une table insérée via `insertionPoints[-1].tables.add()` s'ancre comme un caractère unique DANS le paragraphe courant, elle ne crée jamais son propre saut de paragraphe. Écrire un `\r` avant ET après un segment table (logique naïve "chaque segment a ses séparateurs") produit un paragraphe vide surnuméraire à chaque table. Correction : le `\r` de transition ne s'écrit qu'entre deux segments **texte** consécutifs, jamais autour d'un segment table.

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

---

## Cas 27 — Séparation stricte code maison / DOM InDesign (pourquoi le sandbox Node ne peut jamais suffire)

**Origine** : recherche externe menée le 27/09/2026 (FJD) pour savoir s'il existe un environnement dédié permettant de simuler InDesign (ExtendScript ou UXP) hors de l'application, façon "test-driven development". Résultat net et sourcé : **aucun mock du DOM InDesign n'existe dans la communauté**, ni en ExtendScript ni en UXP. Les frameworks de test trouvés (Extendables/Jasmine, jasminejsx) exécutent leurs tests **dans InDesign**, avec le vrai DOM — ils ne le remplacent jamais. Seul InDesign Server (licence payante, ~2100$/an) permet un vrai headless, mais avec le moteur de composition réel, pas un mock léger. Un thread Adobe Community de 2012 résume la pratique de la communauté : *« the decision went to use real world full runs rather than isolated test units »*.

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

**Preuve réelle (run 27/09/2026 22:25:46)** : `M03-etape6-detail: … erreurs=0 style_table=Table 1 style_cellule_para=appele:P Table cellules_style=18 cellules_neutre=0` ⇒ 18 cellules sur 18 portent le style appelé par le style de cellule, zéro repli neutre.

**Leçon transversale** : la « neutralisation » d'un document InDesign ne s'arrête pas aux styles de paragraphe visibles. Chaque niveau de la hiérarchie de style (table → cellule → paragraphe → caractère) peut **appeler** un style du niveau inférieur ; ignorer un niveau, c'est laisser un style invisible agir. Un log de diagnostic qui **nomme le style réellement posé** (`style_cellule_para=appele:<nom>`) vaut mieux qu'une inspection visuelle du panneau, qui ne peut pas montrer ce qui n'y est pas listé.

---

## Cas 29 — Une sonde de vérification d'offset basée sur `indexOf` peut rendre un faux négatif

**Origine** : étape 6, contrôle d'intégrité de l'ancrage des tables. Le log affichait `offset_verifie=FAUX(trouve=0,attendu=119)` alors que les ancrages étaient **corrects** (49 et 85 relatifs, identiques à un run propre antérieur).

**Cause** : la sonde utilisait `story.contents.indexOf(sonde)`, qui renvoie la **première** occurrence de la chaîne dans tout le document. Si le document contient **déjà** le texte importé (cas fréquent en test, document réutilisé), la sonde est trouvée à l'offset **0** et non à l'offset attendu ⇒ le contrôle déclare un échec qui n'existe pas.

**Leçon** : un contrôle de position doit chercher à partir de la position attendue — `contents.indexOf(sonde, offsetAttendu)` — ou mieux, **comparer directement** la tranche : `contents.substr(offsetAttendu, sonde.length) === sonde`. Une sonde de vérification qui peut produire un **faux négatif** est plus dangereuse qu'une absence de sonde : elle fait perdre du temps à chasser un bug inexistant, et elle érode la confiance dans le log.

**Règle pratique** : distinguer explicitement, dans le log, un échec **structurel** (le texte n'est pas au bon endroit) d'une **limite de la mesure** (`trouve=0` avec `attendu>0` sur un document non neuf). Le champ `offsets_fiables` (calculé indépendamment, par égalité de longueurs) et le champ `offset_verifie` (mesure ponctuelle) doivent rester **séparés** : c'est le premier qui fait foi.

---

## Piège structurel à retenir — deux copies du même script

InDesign exécute les scripts depuis `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/`, pas depuis le dossier de travail/repo. Toute correction faite sur le fichier source doit être recopiée vers cet emplacement avant test, sinon on corrige un fichier que le logiciel n'utilise jamais (piège rencontré le 23/09/2026, cf. mission_01).

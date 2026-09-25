# Mission 01 — Plugin InDesign : import Markdown mappé sur la charte de styles réelle du document

## Statut
🟡 CORRECTIFS APPLIQUÉS + 1 BUG SUPPLÉMENTAIRE CORRIGÉ (v1.2 - 23/09/2026) — reste à tester en conditions réelles

### Bug n°23 — `story.paragraphs.length` peut valoir 0 après `story.contents = ""` (25/09/2026)
FJD a signalé un décalage d'index dès le premier item de liste, "contagieux" à tous les blocs suivants (indices `paraIndex` montant jusqu'à 83, tous en erreur "Paragraphe introuvable"). Plusieurs recherches documentaires précédentes affirmaient qu'un `TextFrame`/story vide a toujours `paragraphs.length >= 1` (un paragraphe vide par défaut, jamais 0) — hypothèse largement répétée sur les forums Adobe.

**Diagnostic par logging ciblé** (pas par extracteur générique, sur décision FJD de rester ciblé) : deux `logToFile()` ajoutés autour du calcul suspect. Un piège annexe a d'abord fait perdre du temps : mes propres recherches `grep` shell pour relire le log échouaient à trouver les nouvelles lignes (à cause d'un problème d'encodage sur les apostrophes/accents dans les chaînes de log), laissant croire que le logging lui-même avait échoué — alors qu'il fonctionnait. Résolu en lisant le fichier en Python (byte-level) plutôt qu'en grep shell.

**Résultat du log réel** : `story.paragraphs.length = 0` immédiatement après `story.contents = ""` — contredisant directement l'hypothèse documentée. Le calcul `firstNewParagraphIndex = paragraphsBeforeCount - 1` produisait donc `-1` sur le tout premier segment, décalant irrémédiablement tous les indices suivants.

**Corrigé** : `firstNewParagraphIndex = Math.max(0, paragraphsBeforeCount - 1)`. Validé par simulation sur 3 cas (le cas réel observé `length=0` → index 0 ; le cas "normal" supposé `length=1` → index 0 aussi ; le cas après un `\r` `length=5` → index 4, comportement inchangé pour ce cas déjà validé).

**Leçon** : une affirmation répétée sur plusieurs forums communautaires (`paragraphs.length` toujours ≥ 1) n'est pas une garantie absolue — le comportement réel observé sur cette version d'InDesign, dans ce contexte précis (assignation explicite de chaîne vide, pas un TextFrame jamais touché), a divergé. Toujours privilégier une vérification par log réel quand un bug persiste malgré une hypothèse documentée qui semblait solide.

### Correctifs implémentés (Mistral, session 23/09)
1. **Source du contenu conforme au CCG** : Remplacé le système AppleScript/presse-papiers par un dialogue natif `File.openDialog("Choisir un fichier Markdown", "*.md")` pour sélectionner directement un fichier `.md`.
2. **Bug bloquant corrigé** : Variable `char` renommée en `ch` dans `parseInlineMarkdown()` (lignes 173, 177, 188, 199) pour éviter le conflit avec le mot réservé ExtendScript.
3. **Séquence validée** : (a) dialogue Importer → sélection du fichier .md, (b) dialogue de mapping tags × styles, (c) insertion du texte SANS les marqueurs Markdown (`#`, `*`, `-`, `>`). Le parseur extrait bien le texte sans les marqueurs.

### Bug supplémentaire trouvé et corrigé (revue Claude, 23/09)
Dans `insertMarkdownWithStyles()` (application du gras/italique), `textRangeStart` était initialisé à `paragraph.index` — qui est l'index du paragraphe dans la story (0, 1, 2...), pas une position de caractère. Ce nombre était ensuite utilisé comme borne dans `paragraph.characterRanges.itemByRange(...)`, un mélange d'échelles (index de paragraphe traité comme position de caractère). Résultat concret : dès qu'un document a plusieurs paragraphes avant un passage en gras/italique, le style de caractère s'appliquait sur les mauvais caractères. Corrigé : `textRangeStart` repart de `0` à chaque nouveau paragraphe, et `paragraph.characters.itemByRange(...)` (relatif au paragraphe, pas à la story) remplace `paragraph.characterRanges.itemByRange(...)`.

### Bug supplémentaire n°2 trouvé et corrigé (revue Claude, 23/09)
`alertUser()` appelait `app.activeWindow.alert(title, message)` — cette méthode n'existe pas dans le DOM InDesign (erreur JS #24 "not a function"), bloquant l'affichage de toute alerte, y compris celles censées signaler d'autres erreurs. Corrigé : usage de la fonction globale `alert(text)` d'ExtendScript, qui ne prend qu'un seul argument — titre et message sont concaténés dans une seule chaîne.

### Bug supplémentaire n°3 trouvé et corrigé (revue Claude, 23/09, détecté via le nouveau log)
`showConfigurationDialog()` construisait la fenêtre avec `new Window({name:..., size:..., resizable:...})` — signature invalide en ScriptUI InDesign (`Bad argument : Invalid Window type specification`, log ligne 362). Le constructeur ScriptUI attend `new Window(type, title, bounds, options)`, pas un objet de config unique. Remplacé par `new Window("dialog", titre)`. Par la même occasion, le positionnement des contrôles enfants en `.location`/`.size` pixels absolus (incompatible avec le layout automatique ScriptUI par défaut) a été remplacé par un layout standard en colonne (`orientation`, `alignChildren`, `spacing`, `margins`, `preferredSize.width`), plus robuste que du positionnement en dur.

### Bug supplémentaire n°4 trouvé et corrigé (revue Claude, 23/09)
`getParagraphStyleNames()` et `getCharacterStyleNames()` itéraient sur `app.activeDocument.paragraphStyles.everyItem()` avec un `for` classique (`styles[i]`, `styles.length`). `everyItem()` retourne un proxy de collection pensé pour des opérations en masse (ex: `everyItem().name` renvoie directement le tableau des noms), pas un tableau itérable par index classique — l'itération échouait silencieusement, avalée par un `catch` vide, laissant les deux fonctions retourner un tableau vide. Conséquence observée par FJD : le dialogue de mapping s'affichait mais avec des listes déroulantes vides, provoquant l'échec de tout le flux en aval. Corrigé : itération directe sur la collection (`app.activeDocument.paragraphStyles`, sans `.everyItem()`), et les `catch` vides remplacés par `logError()` pour ne plus jamais avaler une erreur en silence.

### Bug supplémentaire n°5 trouvé et corrigé (revue Claude, 23/09, sur signalement FJD)
`document.paragraphStyles`/`document.characterStyles` n'exposent que les styles au niveau racine du document — pas ceux rangés dans un `ParagraphStyleGroup`/`CharacterStyleGroup` (dossiers de styles). Si la charte de styles du document utilise des groupes (cas courant), ces styles étaient invisibles : listes déroulantes vides ou incomplètes selon la structure du document, cause racine confirmée par FJD.

Corrigé par une traversée récursive (`collectStylesRecursive()`) qui descend dans `paragraphStyleGroups`/`characterStyleGroups` en plus des styles racine, et retourne des paires `{name, style}` (l'objet style réel, pas juste son nom). Nécessaire car `document.paragraphStyles.item(name)` échoue silencieusement pour un style logé dans un groupe — remplacé partout par `findParagraphStyleByName()`/`findCharacterStyleByName()`, qui cherchent récursivement.

Confirmation demandée par FJD : aucun style par défaut n'est imposé nulle part dans le code (vérifié — pas de fallback "[Basic Paragraph]"/"[Aucun]" en dur). Si aucune correspondance n'est trouvée pour un tag, le texte est inséré sans style de paragraphe appliqué (comportement neutre) et l'absence est journalisée via `logError()`, jamais masquée.

### Bug supplémentaire n°6 trouvé et corrigé (revue Claude, 23/09, via log)
`collectStylesRecursive()` devinait le type de collection par duck-typing (`group.paragraphStyles || group.characterStyles`) — mais un `CharacterStyleGroup` n'a pas de propriété `paragraphStyles` du tout, et ExtendScript lève une exception à l'accès à une propriété absente du type (contrairement à un JS indulgent où `undefined || x` évaluerait silencieusement `x`). Log : `Object does not support the property or method 'paragraphStyles'`. Corrigé : la fonction prend désormais un paramètre explicite `isParagraph` (booléen) pour choisir la bonne collection à chaque niveau de récursion, sans deviner.

### Feature UI — groupes de styles affichés en en-tête dans les dropdowns (demande FJD, 23/09)
`collectStylesRecursive()` retourne maintenant aussi `groupName` (nom du groupe parent direct, `""` si le style est à la racine). Dans `showConfigurationDialog()`, chaque dropdown regroupe désormais les styles par groupe : styles racine en premier (sans en-tête), puis chaque groupe précédé d'un en-tête visuel non sélectionnable (`── Nom du groupe ──`, `enabled = false`). La sélection d'une valeur courante (mapping déjà enregistré) et la lecture de la sélection au clic sur OK se font par nom de style, pas par index brut, pour rester correctes malgré les en-têtes insérés dans la liste. Sécurité ajoutée : si un en-tête était sélectionné malgré `enabled = false` (propriété pas garantie supportée par tous les moteurs ScriptUI), il est ignoré explicitement au clic sur OK plutôt que d'être enregistré comme un style valide.

### Bug supplémentaire n°7 trouvé et corrigé (revue Claude, 23/09)
`loadMappingFromDocument()`/`saveMappingToDocument()` traitaient `doc.labels` comme une collection énumérable (`.length`, itération par index, `.name`, `.remove()`) — cette API n'existe pas pour les labels InDesign, qui sont un système clé/valeur simple accessible uniquement via `insertLabel(key, value)` (écrit/écrase) et `extractLabel(key)` (lit). Erreur observée : `Object does not support the property or method 'labels'`. Bug resté invisible plus tôt car `loadMappingFromDocument()` avait un `catch` vide (avalait l'erreur en silence, cf. Cas 04 du wiki) — seul `saveMappingToDocument()`, qui alertait sans logger, l'a rendu visible. Corrigé : les deux fonctions utilisent maintenant `extractLabel`/`insertLabel` directement, sans itération, et `loadMappingFromDocument()` logue désormais toute erreur au lieu de l'avaler silencieusement.

### Bug supplémentaire n°8 trouvé et corrigé (revue Claude, 23/09, via log)
`JSON.stringify()`/`JSON.parse()` échouaient avec `JSON is undefined` — l'objet global `JSON`, natif en JS moderne, n'existe pas dans le moteur ExtendScript par défaut (pas de polyfill sans import explicite). Corrigé par un sérialiseur/déserialiseur minimal fait maison (`serializeFlatMapping`/`deserializeFlatMapping`), suffisant car le mapping est toujours un objet plat `{tag: "nomDeStyle"}` sans nesting ni types complexes — pas besoin d'un polyfill JSON complet pour ce cas.

### Feature UI — présélection par défaut dans les dropdowns (demande FJD, 23/09)
Chaque dropdown de `showConfigurationDialog()` présélectionne désormais automatiquement une valeur : le mapping déjà enregistré s'il existe, sinon le premier style disponible à la racine (typiquement le style neutre InDesign, `[Style de paragraphe de base]`/`[Aucun]`). But : permettre de cliquer directement sur OK et tester le flux complet du plugin sans devoir choisir manuellement un style pour chaque tag à chaque itération de debug.

### Bug supplémentaire n°9 trouvé et corrigé (revue Claude, 23/09, via log)
`isMappingValid()` appelait `.indexOf()` sur des tableaux JS (`paraStyles.indexOf(styleName)`) — `Array.prototype.indexOf` est une méthode ES5, absente d'ExtendScript (ES3), même famille de bug que `JSON` (Cas 07 du wiki). Erreur : `paraStyles.indexOf is not a function`. Corrigé par une fonction `arrayContains()` maison (boucle manuelle) qui remplace les deux appels concernés.

### Bug supplémentaire n°10 trouvé et corrigé (revue Claude, 23/09, signalé par capture FJD)
`insertMarkdownWithStyles()` appelait `story.insertionPoints[-1].paragraphs.add({contents: block.text})` — `insertionPoints[-1]` retourne un `InsertionPoint` unique (pas une collection), qui n'a pas de propriété `.paragraphs` avec une méthode `.add()`. Erreur : `story.insertionPoints.-1.paragraphs.add is not a function`. Corrigé : le texte du bloc est écrit directement au point d'insertion suivi d'un `"\r"` (convention InDesign pour un saut de paragraphe, pas `"\n"`), ce qui crée le nouveau paragraphe implicitement ; le style est ensuite appliqué sur `story.paragraphs[-2]` — pas `[-1]`, qui après le `\r` final désigne le paragraphe vide qui vient de s'ouvrir, pas celui qui contient le texte. Même correction appliquée à la référence utilisée pour le placement du gras/italique inline (`paragraph = story.paragraphs[-2]`, plus loin dans la même fonction).

Par la même occasion, tous les `catch` restants qui appelaient `alertUser()` sans `logError()` (`selectAndReadMarkdownFile`, `insertMarkdownWithStyles`) ont été branchés sur le logging — couverture désormais exhaustive sur tous les points d'échec du script.

### Bug supplémentaire n°11 trouvé et corrigé (revue Claude, 23/09, via log)
Le correctif précédent visait toujours `story.paragraphs[-2]` après écriture de `block.text + "\r"`, en supposant qu'un nouveau paragraphe vide s'ouvre systématiquement après le texte écrit. Faux pour le tout premier bloc : sur une story encore vide, écrire `"texte\r"` ne produit qu'**un seul** paragraphe (pas deux), donc `[-2]` n'existe pas encore — `Object is invalid`. Conséquence observée par FJD : une seule ligne importée, le script s'arrêtant dès le premier bloc. Corrigé : pour `b === 0` (premier bloc), le paragraphe ciblé est `paragraphs[-1]` ; pour les blocs suivants, `paragraphs[-2]` (le `\r` du bloc précédent a déjà ouvert le paragraphe vide qui devient `[-1]`).

### Feature — simplification du flux de mapping (demande FJD, 23/09, revue sur la version précédente)
Premier essai (bypass silencieux du dialogue quand un mapping valide existait) remplacé une première fois par une confirmation OK/Annuler avant le dialogue — jugé par FJD comme un aller-retour superflu. Simplifié en un flux unique : **le dialogue de configuration s'affiche désormais systématiquement à chaque exécution**, mais présélectionné avec le mapping précédent (ou à défaut le style neutre par défaut, cf. feature de présélection déjà en place). L'utilisateur voit directement ses choix précédents et peut valider en un clic ou ajuster, sans écran de confirmation intermédiaire ni bypass silencieux surprenant.

### Bug supplémentaire n°12 trouvé et corrigé (revue Claude, 23/09, sur fichier .md réel fourni par FJD)
Test avec un fichier Markdown réel (tableau, listes multi-lignes, citations, gras inline) a révélé un texte inséré mais désordonné (fragments coupés, ordre incohérent) + erreurs répétées `Object is invalid` ligne 668 lors de l'application du gras. Cause racine dans `parseMarkdown()` : les blocs `blockquote` et `li` fusionnaient des lignes source consécutives avec un `"\n"` interne (`currentBlock.text += "\n" + ligne`). Mais `"\n"` n'est pas interprété comme un saut de paragraphe par InDesign (seul `"\r"` l'est) — ce caractère finissait comme contenu littéral dans le paragraphe, désynchronisant le calcul de longueur utilisé pour positionner le gras/italique (`textRangeStart` + `paragraph.characters.itemByRange()`), d'où des `charRange` invalides plus loin dans le bloc suivant.

Corrigé structurellement : chaque ligne `- ` (liste) et `> ` (citation) devient désormais son propre bloc/paragraphe InDesign, au lieu d'être fusionnée avec les lignes suivantes du même type — cohérent avec le CCG ("un tiret = un paragraphe de liste"). Pour le cas légitime de fusion (lignes consécutives d'un même paragraphe Markdown "mou-wrap"), le séparateur `"\n"` a été remplacé par un espace, qui ne crée aucune ambiguïté de comptage de caractères.

**Limite connue non corrigée (hors scope v1, déjà actée)** : les tableaux Markdown ne sont pas reconnus par le parseur — chaque ligne `| ... |` tombe dans le cas "paragraphe standard" par défaut et produit un texte fusionné peu lisible, sans crash. Confirmé conforme au scope ("tableaux hors scope v1").

### Bug supplémentaire n°13 trouvé et corrigé (revue Claude, 23/09, via simulation Node + doc officielle)
Sur demande FJD ("travaille test oriented"), mise en place d'un simulateur Node reproduisant `parseMarkdown` + la logique de `insertMarkdownWithStyles` (modèle `Story` comme chaîne + split sur `\r`), testé sur le fichier .md réel fourni. A révélé que le correctif précédent (Cas 09/11, `paragraphs[-1]` pour le premier bloc / `paragraphs[-2]` pour les suivants) était **faux dans les deux branches** : `paragraphs[-1]` pointe toujours vers le paragraphe vide ouvert par le dernier `\r` écrit, y compris pour le tout premier bloc.

Vérifié ensuite via la documentation officielle ExtendScript (indesignjs.de/extendscriptAPI) : l'exemple `insertionPoints.item(-1).contents = "\rNouveau texte"` montre que le `\r` précède le nouveau texte plutôt que de clore l'ancien.

Corrigé structurellement : le texte du bloc est désormais écrit **sans** `\r` final, stylé pendant qu'il est encore le dernier paragraphe en cours (`paragraphs[-1]`, sans ambiguïté dans tous les cas), puis le `\r` est ajouté séparément juste après pour clore le paragraphe et préparer le suivant (sauf après le tout dernier bloc, pour éviter un paragraphe vide superflu en fin de texte). Élimine le besoin de distinguer premier bloc / blocs suivants. Validé par simulation : 0 erreur sur le fichier .md réel complet de FJD (35 blocs, tableaux exclus).

### Bug supplémentaire n°14 trouvé et corrigé (revue Claude, 23/09, texte de nouveau tronqué malgré correctif n°13)
Après le correctif n°13, nouveau test réel de FJD a montré le même symptôme de texte tronqué/désordonné (`Object is invalid` ligne 663, sur `charRange.appliedCharacterStyle`). Recherche via documentation ExtendScript (search "JS string.length vs InDesign characters count unicode") : les caractères comme `✅` (1 point de code) et surtout `⚠️` (2 points de code : symbole + variation selector U+FE0F) ont un `.length` JS différent du nombre de caractères qu'InDesign compte réellement — confirmé (`'⚠️'.length === 2` en JS). Le fichier réel de FJD contient ces symboles dans le premier segment de chaque bloc "Correspondance officielle", juste avant le texte en gras : le calcul `textRangeStart`/`textLength` basé sur `String.length` était donc décalé par rapport à la réalité InDesign, provoquant des `charRange` invalides.

Recherche complémentaire sur le pattern recommandé (forums Indiscripts/Adobe) : la bonne pratique est d'appliquer le style de caractère **au point d'insertion, avant d'y écrire le texte** ("prospectif"), plutôt que de calculer une plage de caractères après coup ("rétrospectif") — élimine tout calcul de position et donc tout risque de désynchronisation de comptage Unicode. Réécrit `insertMarkdownWithStyles()` en conséquence : chaque segment (`child` de `parseInlineMarkdown`) reçoit son style de caractère sur `insertionPoints[-1]` avant l'écriture de son texte ; entre deux segments, le style neutre (`characterStyles.item(0)`, le tout premier de la collection racine — fiable indépendamment de la langue InDesign) est réappliqué pour ne pas laisser le gras/italique du segment précédent "baver" sur le suivant.

### Bug supplémentaire n°15 trouvé et corrigé (revue Claude, 23/09, même symptôme persistant malgré correctif n°14)
FJD a retesté sur un TextFrame frais après le correctif n°14 (style de caractère prospectif) : symptôme identique, texte tronqué/désordonné, caractère pour caractère identique au tout premier test — mais **aucune** nouvelle erreur dans le log. Ça a réorienté le diagnostic : le bug n'était probablement pas (ou pas seulement) dans l'écriture initiale du texte, mais dans une étape non testée jusque-là.

FJD a suggéré une architecture en 2 passes (styles de paragraphe d'abord, styles de caractère ensuite par sélection). En creusant cette piste, relecture complète de la fonction a révélé le vrai point non vérifié depuis le tout début (signalé comme "point de vigilance" dès le correctif n°5, jamais traité en profondeur) : `insertMarkdownWithStyles()` écrivait tout le contenu dans un `TextFrame` **temporaire**, puis le recopiait vers le `TextFrame` cible via `textFrame.texts[0].contents = newTextFrame.texts[0].contents`, suivi d'une boucle `for (var c = 0; c < newStory.characters.length; c++)` copiant le style de CHAQUE caractère un par un. Ce pattern cumule deux risques jamais vérifiés : lenteur/fragilité sur un texte de plusieurs centaines de caractères, et une hypothèse implicite que `originalStory.characters[c]` et `newStory.characters[c]` restent alignés terme à terme après réaffectation de `.contents` — jamais confirmée.

Corrigé en profondeur : suppression complète du `TextFrame` temporaire et de la copie caractère par caractère. Le script écrit désormais **directement** dans le `TextFrame` sélectionné par l'utilisateur, en une seule passe combinant style de paragraphe et style de caractère prospectif (appliqué au point d'insertion avant d'écrire chaque segment, cf. correctif n°14) — élimine à la fois le risque de désynchronisation de la copie et tout calcul de position sensible au comptage Unicode.

Une architecture en 2 passes séparées (texte brut d'abord, styles de caractère par recherche de position ensuite, suggérée par FJD) a été explorée puis écartée : recalculer une position de caractère après coup, même dans une passe dédiée, réintroduirait le même risque non vérifié du Cas 12 (comptage Unicode). L'application prospective en une seule passe reste la seule approche vérifiée insensible à ce risque.

### Feature — présélection par convention de nommage HTML (demande FJD, 23/09, après premier import réussi)
FJD utilise un protocole de nommage fixe pour ses styles de paragraphe, adossé aux balises HTML (`P`, `H1`, `H2`, `H3`). Ajout d'un champ `htmlName` sur les tags h1/h2/h3/p dans `MARKDOWN_TAGS`. Dans `showConfigurationDialog()`, la présélection suit désormais 3 priorités : (1) mapping déjà enregistré pour ce document, (2) style dont le nom correspond EXACTEMENT (insensible à la casse, pas de correspondance floue — choix FJD explicite pour éviter les faux positifs) à la convention HTML du tag, (3) premier style racine disponible (comportement précédent, style neutre par défaut). Reste une présélection dans le dropdown, jamais un bypass automatique du dialogue — l'utilisateur voit et peut toujours ajuster avant de valider.

**Extension (23/09, même jour)** : ajout de `htmlName` sur blockquote/bold/italic également — `"quote"` pour blockquote (choix FJD : plus court que "blockquote"), `"strong"`/`"em"` pour bold/italic (convention sémantique HTML5, choisie par FJD plutôt que les balises brutes `b`/`i`). Pour `li` : un premier essai avec `"puces"` (mauvaise interprétation de la question de FJD) a été corrigé en `"li"` — FJD a en réalité déjà un style nommé exactement `li` dans son document, cohérent avec la même convention que h1/h2/h3/p. Tous les tags ont désormais un `htmlName`. La logique de présélection dans `showConfigurationDialog()` étant déjà générique (lit `tagInfo.htmlName` pour n'importe quel tag), aucune autre modification n'a été nécessaire à chaque ajout.

### Bug supplémentaire n°16 trouvé et corrigé (revue Claude, 23/09, ordre inversé après correctif n°15)
Après le correctif n°15, FJD a testé et obtenu un désordre différent des précédents : tous les paragraphes présents et intacts, mais l'ordre global quasiment inversé (document du bas vers le haut), et les segments gras/normal inversés entre eux à l'intérieur d'un même paragraphe. Aucune erreur dans le log.

Recherche via documentation et forums Adobe : le code écrivait `story.insertionPoints[-1].contents += child.text` (opérateur `+=`) à chaque segment. La documentation officielle et les exemples de la communauté Adobe recommandent explicitement une **assignation directe** (`insertionPoints[-1].contents = "texte"`), qui ajoute le texte à la fin sans effacer le contenu existant — un pattern confirmé par plusieurs sources concordantes. L'usage de `+=` sur `.contents` d'un `InsertionPoint` (qui n'a normalement pas de contenu préexistant à lire, contrairement à une `Text`/`Story`) est signalé comme non documenté et "problématique" dans les forums Adobe, sans plus de détail sur le mécanisme exact — mais cohérent avec le symptôme d'inversion observé.

Corrigé : les trois occurrences de `+=` sur `insertionPoints[-1].contents` remplacées par `=` (assignation directe), conformément à la documentation officielle vérifiée avant application.

### Bug supplémentaire n°17 trouvé et corrigé (revue Claude, 23/09, après ajout du support InsertionPoint)
FJD a signalé, dès le début de l'import à la suite d'un texte existant : le contenu "disparaît dans un bloc après" — évoquant un saut de bloc/colonne inattendu. Confirmé par FJD que le décrochage se produit dès le tout début de l'import, pas plus loin dans le contenu.

Cause : le paragraphe vide créé par le `"\r"` de séparation (ajouté avant le premier bloc importé, cf. feature précédente) **hérite du style de paragraphe du texte existant** — comportement standard InDesign pour tout nouveau paragraphe. Si ce style avait un réglage "Démarrer le paragraphe" (`startParagraph`, option de saut de colonne/cadre/page dans Format > Options de saut de paragraphe) différent de "N'importe où", le paragraphe séparateur héritait de ce saut et poussait tout le contenu importé dans le cadre de texte lié suivant.

Corrigé : après avoir créé ce paragraphe séparateur technique, sa propriété `startParagraph` est explicitement réinitialisée à `StartParagraph.ANYWHERE`. Le style de paragraphe des blocs Markdown importés eux-mêmes (ex. un style "H1" avec saut de page volontairement configuré dans la charte de l'utilisateur) n'est PAS touché — seul le paragraphe technique de séparation est neutralisé, pour ne pas court-circuiter un choix éditorial légitime de l'utilisateur.

### Bug n°18 — désordre persistant même après revert TextFrame simple, cause racine identifiée (revue Claude, 23/09)
FJD a confirmé que le désordre existait déjà sur le cas de base TextFrame (le revert n'a rien résolu — le bug n'était donc jamais lié à la tentative InsertionPoint). Log confirmé : `insertMarkdownWithStyles` s'exécute jusqu'au bout sans aucune erreur JS, donc le bug est un défaut de logique, pas une exception.

Recherche approfondie : un forum Adobe signale explicitement que réassigner `.contents` plusieurs fois de suite sur `insertionPoints[-1]` **dans une boucle** ne fait pas avancer le curseur de façon fiable pour les itérations suivantes — recommandation de la communauté d'opérer "en ordre inverse" pour ce type de manipulation. C'est le pattern exact utilisé dans la boucle segment-par-segment de gras/italique (Correctif n°14/15/16), jamais remis en question malgré 3 correctifs successifs sur des symptômes voisins (Unicode, `+=`, startParagraph) qui n'ont traité que des causes partielles, pas cette cause structurelle.

**Décision FJD** : plutôt que de risquer un 4e pattern non garanti, retrait temporaire complet du gras/italique. `insertMarkdownWithStyles()` simplifiée : une seule écriture de texte brut complet par bloc (`story.insertionPoints[-1].contents = block.text`, un seul appel, pas de boucle segment par segment), avec uniquement le style de paragraphe appliqué. Le style de caractère sera réintroduit séparément une fois ce texte brut validé stable par FJD, avec un nouveau pattern (probablement recherche de texte via `findText`, insensible à tout calcul de position) et un test isolé avant réintégration — pas un simple ajustement du pattern qui vient d'échouer 3 fois.

### Bug n°19 — ordre corrigé (validé par FJD), mais sauts de page/bloc vides réapparus (revue Claude, 23/09)
FJD a confirmé : après le retrait du gras/italique (correctif n°18), l'ordre des paragraphes est correct. Nouveau symptôme distinct : de grands espaces créant des blocs vides sur parfois deux pages.

Cause identique au Cas 16 du wiki, déjà rencontré une fois dans le contexte InsertionPoint (revert depuis) mais jamais appliqué systématiquement dans le chemin TextFrame classique : chaque paragraphe séparateur créé par `"\r"` entre deux blocs hérite du style de paragraphe (et donc du réglage `startParagraph`) du bloc qui vient d'être écrit. Si l'utilisateur a un style mappé (ex. un "H1") avec un saut de colonne/cadre/page volontairement configuré dans sa charte, chaque paragraphe technique de séparation en héritait, créant un saut à chaque transition entre deux blocs de ce type.

Corrigé : `story.paragraphs[-1].startParagraph = StartParagraph.ANYWHERE` appliqué systématiquement après chaque écriture du `"\r"` de séparation entre deux blocs (pas seulement dans le cas InsertionPoint où ce correctif avait été fait une première fois puis reverté avec le reste de cette feature).

### Feature — suppression des séparateurs horizontaux `---` (demande FJD, 23/09)
Les lignes `---`/`***`/`___` (séparateur horizontal Markdown, au moins 3 caractères identiques) n'étaient reconnues par aucun pattern du parseur et tombaient en "paragraphe standard" avec le texte littéral "---", créant un paragraphe parasite visible — ce que FJD appelait "doubles marques de paragraphe". Corrigé : ces lignes sont désormais ignorées complètement (ni paragraphe ni ligne visuelle), comme n'importe quelle ligne vide. Validé par simulation Node avant déploiement.

### Feature — support natif des tableaux Markdown (demande FJD, 23/09, sortie du hors-scope initial)
Les tableaux Markdown (`| a | b |`) étaient explicitement hors scope v1 depuis le tout début de la mission. Implémenté : le parseur détecte les lignes `|...|` consécutives, ignore la ligne de séparation d'en-tête (`|---|---|`), et les regroupe en un bloc `{type: "table", rows: [[cellules...], ...]}`. `insertMarkdownWithStyles()` crée une vraie table InDesign via `insertionPoints[-1].tables.add({headerRowCount: 1, bodyRowCount, columnCount})`, remplit chaque cellule (`table.rows[r].cells[c].texts[0].contents`), puis applique un style de tableau si mappé (`table.appliedTableStyle`).

Nouveau tag `table` ajouté à `MARKDOWN_TAGS` avec `type: "table"` (nouveau troisième type, en plus de `paragraph`/`character`) et `htmlName: "table"`. Nouvelle fonction `getTableStyleEntries()`/`getTableStyleNames()`/`findTableStyleByName()`, en miroir de l'architecture existante pour les styles de paragraphe/caractère mais volontairement **séparée** (pas de généralisation de `collectStylesRecursive`) pour ne pas risquer de régression sur un code déjà validé. `isMappingValid()` et `showConfigurationDialog()` étendus pour ce troisième type.

**Limite assumée, cohérente avec l'état courant du script** : le gras/italique dans les cellules de tableau n'est pas géré (texte brut uniquement) — cohérent avec le retrait temporaire du gras/italique partout ailleurs (Cas 17/18 du wiki), pas une limite spécifique aux tableaux. Validé par simulation Node (parsing du séparateur `---` et du tableau) avant déploiement, conformément à la méthode adoptée cette session — reste à valider en conditions réelles InDesign par FJD, en particulier la création de la table elle-même (jamais testée avant dans ce projet).

### Chantier — banc de fixtures multi-modèles (Claude/DeepSeek/Gemini/ChatGPT) et détection des blocs de code (25/09/2026)
Suite à une discussion approfondie sur la méthode de test (PDF Perplexity fourni par FJD sur les architectures possibles : simulateur de DOM, extracteur d'état réel, banc de fixtures TDD), FJD a tranché : un banc de fixtures `.md` **classées par modèle générateur** (Claude, 2× DeepSeek, Gemini, ChatGPT), avec pour chacune un JSON attendu figé à construire (comparaison attendu vs obtenu), plutôt qu'un mock qui devine le comportement InDesign ou un système de règles inférées automatiquement. Fixtures créées dans `fixtures/` : `claude_sample.md`, `deepseek_referentiel.md`, `deepseek_formation.md`, `gemini_charte.md`, `chatgpt_convention.md`.

En testant `gemini_charte.md` (qui contient un bloc de code Markdown citant en exemple `# [Titre principal H1]...`), un vrai bug a été révélé : les blocs de code (```` ``` ````) n'étaient jamais détectés, donc leur contenu d'exemple était interprété comme du vrai Markdown — un second H1 fantôme apparaissait. Corrigé : nouveau type de bloc `code`, délimité par ` ``` ` (ouverture avec langage optionnel, fermeture), dont le contenu est accumulé **tel quel** (pas de `trim`, les espaces d'indentation comptent) et jamais passé par `parseInlineMarkdown` (un `**` littéral dans du code ne doit pas devenir du gras). Les `\n` internes multi-lignes du bloc restent des `\n` littéraux dans l'assignation `.contents` — vérifié via doc/forums Adobe que ce caractère est traité comme un saut de ligne forcé InDesign (reste dans le même paragraphe), sans transformation nécessaire.

### Bug n°22 — `story.paragraphs[i]` invalide en cours de boucle de style, cause réelle du décalage de mapping (revue Claude, 25/09/2026)
FJD a signalé un décalage de mapping (bloc "Coût API estimé" devenant visuellement H3, "Module 1" devenant P) sur un fichier réel après l'ajout des tags h4/h5. Le parsing et l'indexation d'écriture du texte étaient corrects par simulation — l'écart devait donc venir de l'application des styles elle-même. Le log a confirmé : `ERREUR | contexte=insertMarkdownWithStyles | message=Object is invalid | ligne=991` (`story.paragraphs[paraIndex].appliedParagraphStyle = paraStyle`), à plusieurs reprises — le script plantait en cours de boucle, laissant une partie des paragraphes non stylés ou mal stylés selon où l'échec survenait.

Cause confirmée par recherche documentaire : `story.paragraphs[i]` n'est pas un objet à identité fixe, c'est une plage de caractères **résolue à chaque accès**. Certains styles de paragraphe (ex. liste à puces avec puce automatique InDesign) insèrent un caractère dans le flux de texte au moment de l'application du style — ce qui peut invalider les indices de paragraphes suivants dans la même boucle. Pattern recommandé par la communauté Adobe pour ce cas précis : `story.paragraphs.everyItem().getElements()`, qui retourne un tableau JS stable, snapshoté une fois, indépendant de toute recomposition ultérieure.

Corrigé : la boucle d'application des styles de paragraphe utilise désormais `paragraphElements = story.paragraphs.everyItem().getElements()` en amont, puis indexe sur ce tableau stable plutôt que de ré-interroger `story.paragraphs[i]` à chaque itération. Garde-fou ajouté : si `paragraphElements[paraIndex]` est absent, l'erreur est journalisée explicitement plutôt que de planter.

### Feature — items de liste entièrement en gras = sous-titres hiérarchiques (demande FJD, 25/09/2026)
Sur un vrai fichier de programme de formation (dialecte Markdown différent des tests précédents), FJD a signalé un mapping incohérent : certains `**texte**` finissaient en H2, d'autres en `li`, "beaucoup de li partout". Cause : ce fichier utilise `* **Sous-titre**` comme sous-titre visuel À L'INTÉRIEUR d'une liste (pas de `####`), suivi de vrais items `* texte normal` en dessous — un pattern jamais rencontré dans les tests précédents.

FJD a proposé la solution retenue (reformulée puis confirmée) : un item de liste **entièrement** en gras (rien avant/après le `**...**`) devient un titre synthétique de niveau = dernier vrai titre (`#`/`##`/`###`) rencontré + 1. Sous un H2, ça donne l'équivalent d'un H3 ; sous un H3, l'équivalent d'un H4 ; etc. Chaque niveau reçoit un tag distinct (`h4`, `h5`, ajoutés à `MARKDOWN_TAGS`), mappable à un style InDesign propre — pas un seul tag générique "sous-titre".

Implémenté : `currentTitleLevel` suivi pendant le parsing, mis à jour à chaque vrai `#`/`##`/`###`. Dans la détection `li`, un test préalable (`/^\*\*(.+)\*\*$/` sur le contenu de l'item) redirige vers un bloc `type: "h" + (currentTitleLevel + 1)` si le contenu est entièrement en gras — sinon comportement `li` inchangé (les items partiellement en gras, ex. `**Label :** texte`, restent bien des `li` normaux, confirmé par FJD).

Bug secondaire corrigé au passage : `h4`/`h5` manquaient dans la liste des types forçant un nouveau bloc (le test qui empêche la fusion accidentelle avec le paragraphe suivant) — potentiellement la cause du "dernier paragraphe en style par défaut" signalé par FJD, à confirmer par un nouveau test réel.

Validé par un nouveau simulateur (`simulate_mapping.js`, demande FJD) qui affiche non seulement le parsing mais le **style InDesign effectif** que chaque bloc recevrait selon un mapping donné — sur le fichier réel de FJD : 85 blocs, 0 bloc sans style mappé, hiérarchie propre (1 h1, 6 h2, 19 h3, 1 h4, 54 li, 4 p).

### Bug n°20 — cause racine du désordre de texte ENFIN éliminée (revue Claude, 24/09/2026)
FJD a signalé, sur un fichier réel plus long (module de formation multi-pages) : le texte "fuit" en excès dans tous les blocs/pages qu'on ajoute pour le voir, comme si une phrase s'arrêtait en plein milieu et le reste se retrouvait ailleurs. Confirmé par FJD comme du vrai débordement InDesign (texte poussé vers des cadres liés en chaîne existants) — mais la vraie question était pourquoi le texte lui-même semblait désordonné/tronqué avant même ce débordement.

**Diagnostic complet** : le correctif n°18 (retrait du gras/italique) avait réduit le nombre de réassignations de `insertionPoints[-1]` par bloc à une seule, ce qui masquait suffisamment le bug structurel du Cas 17 (réassignation répétée de `insertionPoints[-1]` dans une boucle, peu fiable) pour qu'il semble résolu sur les tests précédents (peu de blocs). Avec un fichier contenant beaucoup plus de blocs consécutifs, le même bug a reproduit.

**Réécriture complète de `insertMarkdownWithStyles()`**, confirmée par recherche documentaire (pattern reconnu et recommandé pour la performance : *"you can create an entire story of plain text and dump that into a text frame"*) :
1. Les blocs sont regroupés en **segments** : un segment "texte" (blocs consécutifs non-table) ou un segment "table".
2. Chaque segment texte est écrit en **UNE SEULE assignation** (`story.insertionPoints[-1].contents = texteComplet`, tous les blocs du segment concaténés avec `\r`), plus aucune réassignation de `insertionPoints[-1]` dans une boucle interne.
3. Les styles de paragraphe sont appliqués **après coup**, par index stable sur `story.paragraphs`, jamais via `[-1]` recalculé.

**Deux bugs supplémentaires trouvés et corrigés par simulation avant tout test réel** (aucun n'aurait été détecté sans le simulateur, cf. méthode du wiki) :
- **Double `\r` autour d'une table** : la première version ajoutait un `\r` à la fois en fin de segment texte ET en fin de segment table, produisant un paragraphe vide surnuméraire à chaque table. Corrigé après vérification documentaire (*"tables occupy a single character position in the story"* — une table s'ancre comme un caractère DANS le paragraphe courant, elle ne crée jamais son propre saut de paragraphe) : le `\r` de transition n'est désormais écrit qu'entre deux segments **texte**, jamais autour d'un segment table.
- **Mauvais calcul de `firstNewParagraphIndex`** : la première tentative visait `paragraphsBeforeCount` (le paragraphe suivant), mais le `\r` qui vient d'être écrit ouvre un nouveau paragraphe VIDE qui est déjà le paragraphe courant — y écrire le REMPLIT, ça ne crée pas encore un nouveau paragraphe après lui. Corrigé : `firstNewParagraphIndex = paragraphsBeforeCount - 1` dans tous les cas (premier segment du document inclus, où `story.paragraphs` contient déjà un paragraphe vide unique par défaut).

Validé par simulation sur 3 cas : fichier réel 35 blocs sans table, fichier avec une table au milieu, cas limite (document commençant par une table + deux tables consécutives) — zéro erreur d'indexation sur les trois. Reste à confirmer par un vrai test InDesign.

### Logging fichier ajouté (revue Claude, 23/09)
Ajout de `logError()`/`logToFile()` : le catch global de `main()` écrit désormais chaque erreur inattendue (message, ligne, fichier, stack) dans `import_md_errors.log`, créé dans le même dossier que le script. But : lire directement ce fichier au lieu de dépendre d'un screenshot de la boîte d'alerte InDesign à chaque bug.

### IMPORTANT — deux copies du fichier à garder synchronisées
Le fichier source de travail est `~/INDD/IMPORT_MD/import_md.jsx`, mais InDesign exécute réellement la copie dans `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx`. Toute modification doit être recopiée vers ce second emplacement avant test, sinon on corrige un fichier que le logiciel n'utilise jamais (constaté le 23/09 : le fix `app.activeWindow.alert` n'avait pas été propagé, l'erreur est réapparue identique).

### Points de vigilance non corrigés (à surveiller au premier test réel, pas des bugs certains)
- La copie de styles du `TextFrame` temporaire vers le `TextFrame` original (lignes ~509-530) suppose un alignement terme à terme entre `originalStory.paragraphs` et `newStory.paragraphs` après réaffectation de `.contents` — fragile si InDesign retokenise différemment.
- Les listes (`li`) n'ajoutent pas de puce automatique : le style de paragraphe mappé doit lui-même porter une puce dans sa définition InDesign.

**À tester** : Exécution réelle avec un fichier `.md` contenant titres, gras, italique, liste et citation sur un document InDesign avec charte de styles — en particulier vérifier le placement du gras/italique après la correction du bug d'index.

## Objectif
Permettre à l'utilisateur de sélectionner un bloc de texte InDesign, déclencher un raccourci clavier, et voir le contenu d'un fichier Markdown (`.md`) inséré dans ce bloc avec les styles InDesign correspondants appliqués automatiquement — sans jamais coder de nom de style en dur dans le script.

## Principe directeur
Le plugin ne doit connaître AUCUN nom de style à l'avance. La carte de styles utilisée est celle qui existe réellement dans le document `.indd` ouvert au moment de l'exécution, lue dynamiquement via l'API InDesign (`document.paragraphStyles`, `document.characterStyles`).

## Scope (v1)
Inclus :
- Titres `# / ## / ###` → styles de paragraphe
- Paragraphe standard → style de paragraphe
- Listes à puces (`- `) → style de paragraphe
- Citation (`> `) → style de paragraphe
- Gras (`**texte**`) et italique (`*texte*`) → styles de caractère, appliqués uniquement sur la portion de texte concernée

Exclu explicitement (hors scope v1, ne pas anticiper) :
- Tableaux Markdown
- Notes de bas de page
- Styles de cellule / styles d'objet
- Gestion multi-documents ou multi-gabarits (un mapping par document, pas de profils partagés)
- Liens, images, code inline/bloc

## Architecture

### 1. Déclenchement
- Raccourci clavier assigné côté InDesign (Édition > Raccourcis clavier > catégorie Scripts) sur un script du panneau Scripts.
- Cmd+D est déjà pris par "Place..." — utiliser un raccourci libre (ex: Cmd+Shift+D), à confirmer avec l'utilisateur au moment de l'installation.

### 2. Lecture du Markdown source (RÉVISÉ 23/09/2026 — remplace la v1.0)
- Le déclenchement ouvre un **dialogue natif de sélection de fichier** : `File.openDialog("Choisir un fichier Markdown", "*.md")`.
- Si l'utilisateur annule le dialogue (retour `null`) → arrêt propre du script, aucune alerte d'erreur.
- Lecture du fichier sélectionné en ExtendScript pur : `file.open("r")` / `file.read()` / `file.close()`.
- Le wrapper AppleScript presse-papiers (`get_clipboard.applescript`) et son appel dans `main()` sont retirés : la v1.0 lisait le presse-papiers, ce qui ne correspond pas au CCG (l'utilisateur veut importer un fichier, pas coller un contenu pré-copié).

### 3. Lecture de la carte de styles réelle du document
Au lancement, avant tout traitement :
```javascript
var paraStyleNames = document.paragraphStyles.everyItem().name;
var charStyleNames = document.characterStyles.everyItem().name;
```
Cette liste EST la seule source de vérité. Aucun nom de style n'est supposé exister.

### 4. Résolution du mapping tags Markdown → styles InDesign
Problème : les constructions Markdown sont fixes (h1, h2, h3, p, bold, italic, li, blockquote) mais les noms de styles sont arbitraires et propres à chaque document.

Mécanisme retenu :
- **Première exécution sur un document donné** : le script détecte l'absence de mapping résolu et présente à l'utilisateur, pour chaque tag Markdown du scope, un menu déroulant listant les styles réellement présents dans le document (`paraStyleNames` / `charStyleNames` selon le tag). L'utilisateur choisit une correspondance pour chaque tag.
- **Exécutions suivantes** : le mapping résolu est relu automatiquement, sans redemander à l'utilisateur, tant que le document n'a pas changé.

Aucune correspondance par convention de nommage (pas de recherche de motif "Titre 1"/"H1"/"Heading 1" dans les noms) — trop fragile, dépend d'une rigueur de nommage non garantie.

### 5. Stockage du mapping résolu
- Stocké **dans le document InDesign lui-même**, pas dans un fichier externe qui pourrait se désynchroniser :
```javascript
document.insertLabel("md-style-map", JSON.stringify(mapping));
```
- Relecture au lancement via `document.extractLabel("md-style-map")`.
- Si le label est vide ou si un style qu'il référence n'existe plus dans le document → redéclencher la configuration du point 4 (pas de fallback silencieux).

### 6. Application des styles
- Parcours du Markdown parsé, deux passes :
  - **Paragraphe entier** → `paragraph.appliedParagraphStyle = document.paragraphStyles.item(mapping[tag])`
  - **Portion de texte inline** (gras/italique) → `characterRange.appliedCharacterStyle = document.characterStyles.item(mapping[tag])`, appliqué uniquement sur la plage de caractères concernée, sans toucher au style de paragraphe englobant.
- Le texte est inséré dans le bloc actif (`app.selection[0]`, doit être un `TextFrame` — sinon erreur explicite à l'utilisateur, pas de comportement par défaut silencieux).

### 7. Gestion des erreurs (explicite, jamais silencieuse)
- Sélection active n'est pas un `TextFrame` → alerte, arrêt.
- Aucun fichier sélectionné dans le dialogue Importer (annulation) → arrêt silencieux, sans alerte (ce n'est pas une erreur, c'est un choix de l'utilisateur).
- Fichier sélectionné vide ou non-Markdown reconnaissable → alerte, arrêt.
- Style référencé dans le mapping stocké mais absent du document (ex: style supprimé depuis) → redéclenche la configuration (point 4), ne bascule jamais sur un style par défaut sans le signaler.

## Livrables attendus
1. Script ExtendScript (`.jsx`) principal, dans `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/` (dossier déjà existant côté FJD).
2. ~~Wrapper AppleScript pour l'accès presse-papiers~~ — retiré (23/09/2026), plus nécessaire : le dialogue Importer natif ExtendScript remplace la lecture presse-papiers.
3. Parseur Markdown minimal (scope ci-dessus uniquement), en JS pur compatible ExtendScript (pas d'ES6+, le moteur ExtendScript est ancien) — **attention aux mots réservés ExtendScript** (`char`, `new`, `default`, `class`, `final`, `native`, `package`, `synchronized`, `throws` notamment) qui ne peuvent pas servir de noms de variables.
4. UI de configuration du mapping (menus déroulants simples via `Window` ExtendScript, pas besoin de UXP pour ça).

## Correctifs à appliquer par l'agent exécutant (session du 23/09/2026)
1. Dans `import_md.jsx`, fonction `parseInlineMarkdown()` (lignes ~165-209) : renommer la variable `char` en `ch` (ou `currentChar`) à toutes ses occurrences (déclaration + 3 usages).
2. Dans `import_md.jsx`, fonction `main()` : remplacer l'appel `getClipboardContent()` par un dialogue `File.openDialog("Choisir un fichier Markdown", "*.md")`, puis lecture du fichier choisi (`file.open("r")`/`file.read()`/`file.close()`). Gérer le cas d'annulation (`null` retourné) par un arrêt silencieux.
3. Supprimer les fonctions devenues inutiles (`runAppleScript`, `getClipboardContent`) et le fichier `get_clipboard.applescript` du projet.
4. Mettre à jour `README.md` en conséquence (installation, flux de traitement, limitations — retirer la mention "macOS uniquement / AppleScript requis" si elle ne s'applique plus qu'au chargement de fichier).
5. Retester le script de bout en bout avec un vrai fichier `.md` contenant titres, gras, italique, liste et citation, sur un document InDesign réel avec une charte de styles existante, et confirmer que le texte inséré ne contient plus aucun marqueur Markdown résiduel (`#`, `*`, `-`, `>`).

## Points ouverts à trancher avant implémentation
- Raccourci clavier exact à assigner (Cmd+Shift+D proposé, à valider par FJD).
- Comportement si le document a plusieurs "familles" de styles de paragraphe portant des noms proches (aucune désambiguïsation automatique prévue — l'utilisateur choisit explicitement à la configuration).

### Feature — bouton Réinitialiser dans le dialogue de mapping (demande FJD, 23/09)
Ajout d'un bouton "Réinitialiser" dans `showConfigurationDialog()`, à côté de Annuler/OK. Efface le mapping stocké dans le document (`saveMappingToDocument({})`) puis relance le dialogue à partir de zéro (récursion avec `currentMapping = null`), ce qui fait retomber la présélection sur la convention HTML puis le style neutre — utile à la fois pour retester le mapping automatique HTML sans manipulation manuelle du label, et comme fonctionnalité UX permanente pour repartir d'une configuration propre à tout moment.

### Feature tentée puis REVERTÉE — insertion au point de curseur (23/09, même jour)
Une première tentative a ajouté le support d'un `InsertionPoint` en fin de texte (en plus du `TextFrame` entier), avec un `"\r"` de séparation + neutralisation de `startParagraph`. FJD a testé et signalé un résultat "super merdique" (texte à nouveau désordonné) et a demandé un **revert complet** vers le comportement `TextFrame` entier uniquement, plutôt qu'un nouveau cycle de diagnostic. Fait : `main()` et `insertMarkdownWithStyles()` reviennent à leur forme d'avant cette tentative (signature simple `insertMarkdownWithStyles(story, blocks, mapping)`, `story.contents = ""` systématique, sélection strictement limitée à `TextFrame`). Aucune trace de code du support `InsertionPoint` ne subsiste (vérifié par grep).

Cause du nouveau désordre non investiguée plus avant (le revert a été demandé avant diagnostic) — à reprendre depuis zéro si cette feature est redemandée, avec un test isolé avant de la considérer acquise.

## Backlog — évolutions futures (non implémentées, demandées par FJD pour une session ultérieure)

### Insertion au point de curseur / au milieu d'un texte existant / remplacement d'une sélection de texte (23/09/2026, re-ouvert après revert)
Une implémentation de "InsertionPoint en fin de texte" a été tentée puis revertée le même jour suite à un nouveau bug non diagnostiqué (cf. entrée "Feature tentée puis REVERTÉE" ci-dessus). Reste donc entièrement à refaire, y compris le cas le plus simple (fin de texte) :
- **Insertion à un point de curseur EN FIN de texte existant** : à ré-implémenter avec un diagnostic complet avant de considérer que c'est stable (la première tentative n'a pas été creusée avant le revert).
- **Insertion à un point de curseur AU MILIEU d'un texte existant** : nécessitera de résoudre le problème de recalcul de position après chaque insertion (les positions se décalent après chaque insertion, confirmé par la doc ExtendScript) — probablement via une approche différente de l'écriture séquentielle actuelle.
- **Remplacement d'une sélection de texte** (`app.selection[0]` est une plage `Text`/`Word`/`Character` sélectionnée par l'utilisateur, pas un simple `InsertionPoint`) : le Markdown importé doit remplacer cette plage, pas tout le bloc.

Techniquement proche (les deux passent par `app.selection[0]`, dont le type ExtendScript diffère selon ce que l'utilisateur a cliqué/sélectionné — `InsertionPoint` vs une collection de `Character`/`Word`/`Text`), mais le traitement diffère : insertion pure au point de curseur vs remplacement d'une plage existante. Implique de revoir `main()` (actuellement la vérification `instanceof TextFrame` rejette tout le reste) et `insertMarkdownWithStyles()` (actuellement basé sur `textFrame.texts[0]`, à généraliser pour accepter directement un point d'insertion ou une plage de texte en paramètre). Nécessitera vérification via doc officielle + simulation avant tout correctif, comme pour le reste de cette session (cf. wiki, section Méthode).

## Extra bloc (backlog, 23/09/2026)

### Curseur de chargement natif InDesign quand aucune sélection n'existe
Aujourd'hui, en l'absence de toute sélection valide (ni `TextFrame`, ni `InsertionPoint`, ni plage de texte), le script affiche une alerte bloquante ("Veuillez sélectionner un bloc de texte") et s'arrête. FJD demande de basculer, dans ce cas, sur le comportement natif d'InDesign pour `File > Place` (Cmd+D) : le curseur se transforme en "loaded cursor" (icône de chargement qui suit la souris, aperçu miniature du contenu), et au clic simple sur la page, InDesign crée automatiquement un nouveau `TextFrame` ajusté aux marges/colonnes de la page à l'endroit cliqué, puis y insère le contenu.

Techniquement, ce comportement correspond à l'API `app.activeDocument.place()` combinée à un "loaded cursor" — le pattern standard d'InDesign pour toute opération de placement de contenu externe, dont notre `File.openDialog()` + parsing custom n'est actuellement pas un vrai citoyen (on ouvre le fichier nous-mêmes et on écrit directement dans un `TextFrame` déjà sélectionné, on ne passe jamais par le mécanisme de placement natif). Pour obtenir ce comportement, il faudrait très probablement écrire d'abord le résultat du Markdown transformé dans un fichier temporaire (texte simple ou InDesign Tagged Text, qui porte nativement les styles de paragraphe/caractère), puis appeler `app.activeDocument.place(File(cheminTemporaire))` sans TextFrame cible — ce qui active le loaded cursor natif. Piste à vérifier via doc officielle avant toute implémentation (nécessite de comprendre le format Tagged Text pour porter les styles par ce chemin, différent de l'écriture directe actuelle via `insertionPoints`).

### Couverture élargie des syntaxes Markdown (demande FJD, 24/09/2026)
Constat : Markdown n'est pas un standard unique — plusieurs dialectes coexistent (CommonMark en étant la spécification la plus rigoureuse), et le parseur actuel n'en couvre qu'un sous-ensemble limité.

**Méthode retenue par FJD** : ajouter chaque variante au parseur une par une, sur preuve d'usage réel (un vrai fichier `.md` utilisé par FJD qui la contient), plutôt que d'implémenter une couverture CommonMark complète en préventif — cohérent avec la méthode déjà validée cette session (cf. wiki, section Méthode : tester sur fichier réel, pas cas jouet).

**Implémenté (24/09/2026, même session)** :
- **Puces alternatives `*`/`+`** : fusionnées avec le tag `li` existant (trois écritures équivalentes en Markdown, pas de distinction voulue par FJD dans le mapping InDesign).
- **Listes numérotées `1. `, `2. `...** : nouveau tag `li_num`, distinct de `li` (choix explicite FJD — permet un style InDesign de liste numérotée différent du style de liste à puces). `htmlName: "ol"`.
- **Gras/italique avec underscore `__gras__`/`_italique_`** : ajoutés dans `parseInlineMarkdown()`, équivalents à `**`/`*`. Point de vigilance résolu : `_` apparaît couramment dans du texte normal (`mon_fichier_texte`) sans intention de marquage, contrairement à `*` — implémenté avec une règle de **bordure de mot** (le caractère adjacent côté extérieur du marqueur doit être un espace, une ponctuation, ou début/fin de chaîne), pour ne jamais interpréter un identifiant à underscores comme du gras/italique. Validé par simulation Node sur un cas mixte (`mon_fichier_texte` reste intact, `_italique_`/`__gras__` en bordure de mot sont bien détectés).

**Toujours NON couvert**, à ajouter seulement sur preuve d'usage future :
- Titres alternatifs style Setext (`Titre\n===`)
- Code inline `` `code` `` et blocs de code ` ``` `
- Liens `[texte](url)` et images `![alt](url)`
- Gras+italique combiné `***texte***`

### Piste architecturale — assistant HCI dans InDesign, UXP vs ExtendScript (discussion FJD, 24/09/2026)
Question posée par FJD : un futur assistant conversationnel/HCI intégré à InDesign vaut-il mieux en UXP (plateforme moderne Adobe, JS ES2015+, accès réseau natif, UI React-like) ou en ExtendScript (accès complet et mature au DOM InDesign, mais ES3 daté et pas de client HTTP natif) ?

**Analyse** : les deux plateformes ne sont pas substituables sur ce projet précis — UXP InDesign a un accès DOM texte encore en retard par rapport à ExtendScript (les manipulations fines qu'on a dû faire cette session : `InsertionPoint`, `Story`, `Table`, groupes de styles, sont matures côté ExtendScript, moins couvertes côté UXP). Inversement, ExtendScript n'a pas d'accès réseau/HTTP natif fiable pour appeler une API LLM, et son UI (`ScriptUI`) est plus limitée qu'une UI UXP moderne.

**Piste retenue par FJD pour exploration future** : architecture **hybride** — panneau UXP pour l'interface utilisateur et les appels API (chat, requêtes LLM), qui invoque des scripts ExtendScript en arrière-plan pour la manipulation fine du DOM InDesign (pont UXP → ExtendScript, pattern reconnu chez Adobe). Pas de décision d'implémentation à ce stade — sujet distinct du plugin IMPORT_MD actuel, à creuser dans une session dédiée si le projet d'assistant HCI avance.

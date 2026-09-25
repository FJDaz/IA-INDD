// import_md.jsx
// Plugin InDesign : import Markdown mappé sur la charte de styles réelle du document
// Version 1.0 - Compatible ExtendScript (ES3)

// ============================================================================
// CONFIGURATION
// ============================================================================

var SCRIPT_NAME = "Import MD";
var LABEL_NAME = "md-style-map";
var LOG_FILE_PATH = new File($.fileName).parent.fsName + "/import_md_errors.log";

// ============================================================================
// SÉRIALISATION JSON MINIMALE
// L'objet global JSON n'existe pas nativement en ExtendScript. Le mapping étant
// toujours un objet plat { tag: "nomDeStyle" } (pas de nesting, pas de tableaux,
// pas de nombres/booléens), un sérialiseur/déserialiseur minimal suffit ici
// plutôt que d'importer un polyfill JSON complet.
// ============================================================================

function serializeFlatMapping(obj) {
    var pairs = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && obj[key]) {
            var escapedKey = String(key).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
            var escapedValue = String(obj[key]).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
            pairs.push('"' + escapedKey + '":"' + escapedValue + '"');
        }
    }
    return "{" + pairs.join(",") + "}";
}

function deserializeFlatMapping(str) {
    var obj = {};
    if (!str) return obj;
    var content = str.replace(/^\s*\{/, "").replace(/\}\s*$/, "");
    if (content.replace(/\s/g, "") === "") return obj;
    var pairRegex = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    var match;
    while ((match = pairRegex.exec(content)) !== null) {
        var key = match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        var value = match[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        obj[key] = value;
    }
    return obj;
}

// Tags Markdown supportés et leur type (paragraph ou character).
// htmlName : nom de convention (HTML ou proche) recherché EXACTEMENT (insensible à
// la casse) parmi les styles du document pour présélectionner automatiquement le
// mapping au premier essai. bold/italic utilisent la convention sémantique HTML5
// (strong/em) plutôt que les balises brutes (b/i), choisi par FJD. "li" utilise
// "puces" — pas un nom HTML mais le terme métier de FJD, tout aussi valable comme
// convention exacte.
var MARKDOWN_TAGS = {
    "h1": { type: "paragraph", display: "Titre 1 (#)", htmlName: "h1" },
    "h2": { type: "paragraph", display: "Titre 2 (##)", htmlName: "h2" },
    "h3": { type: "paragraph", display: "Titre 3 (###)", htmlName: "h3" },
    "h4": { type: "paragraph", display: "Titre 4 (sous-titre de liste en gras sous ###)", htmlName: "h4" },
    "h5": { type: "paragraph", display: "Titre 5 (sous-titre de liste en gras sous h4)", htmlName: "h5" },
    "p": { type: "paragraph", display: "Paragraphe standard", htmlName: "p" },
    "li": { type: "paragraph", display: "Liste à puces (-, *, +)", htmlName: "li" },
    "li2": { type: "paragraph", display: "Liste à puces niveau 2", htmlName: "li2" },
    "li3": { type: "paragraph", display: "Liste à puces niveau 3", htmlName: "li3" },
    "li4": { type: "paragraph", display: "Liste à puces niveau 4", htmlName: "li4" },
    "li_num": { type: "paragraph", display: "Liste numérotée (1. 2. ...)", htmlName: "ol" },
    "blockquote": { type: "paragraph", display: "Citation (>)", htmlName: "quote" },
    "bold": { type: "character", display: "Gras (**texte**)", htmlName: "strong" },
    "italic": { type: "character", display: "Italique (*texte*)", htmlName: "em" },
    "table": { type: "table", display: "Tableau (| a | b |)", htmlName: "table" },
    "code": { type: "paragraph", display: "Bloc de code (```)", htmlName: "code" }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Affiche une alerte à l'utilisateur
 */
function alertUser(message, title) {
    if (!title) title = SCRIPT_NAME;
    alert(title + "\n\n" + message);
}

/**
 * Écrit une entrée dans le fichier log (append), avec horodatage
 */
function logToFile(message) {
    try {
        var logFile = new File(LOG_FILE_PATH);
        logFile.open("a");
        logFile.writeln("[" + new Date().toString() + "] " + message);
        logFile.close();
    } catch (e) {
        // Si l'écriture du log échoue, ne pas bloquer le script pour autant
        // (diagnostic temporaire du 25/09 retiré une fois la vraie cause trouvée —
        // voir Cas 23 du wiki : le log fonctionnait en réalité, une recherche grep
        // shell avait simplement échoué à cause d'un problème d'encodage).
    }
}

/**
 * Journalise une exception avec son contexte (message, numéro de ligne, fichier, stack)
 */
function logError(e, context) {
    var parts = [];
    parts.push("ERREUR");
    if (context) parts.push("contexte=" + context);
    parts.push("message=" + e.message);
    if (typeof e.line !== "undefined") parts.push("ligne=" + e.line);
    if (typeof e.fileName !== "undefined") parts.push("fichier=" + e.fileName);
    if (e.stack) parts.push("stack=" + e.stack);
    logToFile(parts.join(" | "));
}

/**
 * Ouvre un dialogue pour sélectionner un fichier Markdown et retourne son contenu
 * Retourne null si l'utilisateur annule
 */
function selectAndReadMarkdownFile() {
    try {
        var file = File.openDialog("Choisir un fichier Markdown", "Markdown:*.md;*.markdown;*.txt");
        if (!file) {
            // Utilisateur a annulé - retour silencieux
            return null;
        }
        
        if (file.open("r")) {
            var content = file.read();
            file.close();
            return content;
        } else {
            alertUser("Impossible d'ouvrir le fichier sélectionné.");
            return null;
        }
    } catch (e) {
        logError(e, "selectAndReadMarkdownFile");
        alertUser("Erreur lors de la lecture du fichier : " + e.message);
        return null;
    }
}

// ============================================================================
// PARSEUR MARKDOWN
// ============================================================================

/**
 * Parse le Markdown et retourne un tableau de blocks structurés
 * Chaque block a : { type, text, children (pour inline), range (pour position) }
 */
function parseMarkdown(markdownText) {
    var blocks = [];
    var lines = markdownText.split("\n");
    var currentBlock = null;
    var inCodeBlock = false;
    var inList = false;

    // Niveau du dernier vrai titre (#/##/###) rencontré — utilisé pour convertir
    // un item de liste ENTIÈREMENT en gras (ex. "* **Titre**", rien avant/après
    // les "**") : traité comme un sous-titre de niveau (dernier titre réel
    // rencontré + 1), pas comme un item de liste normal. Plusieurs niveaux
    // successifs de ce pattern s'empilent (un "**Titre**" trouvé juste après
    // un autre du même type reste au même niveau, il ne descend pas plus —
    // seul un vrai #/##/### fait varier currentTitleLevel). Cette règle ne
    // s'applique qu'au niveau d'indentation 0 : un item en gras imbriqué
    // (indentLevel > 0) est un sous-item de liste normal, pas un titre.
    var currentTitleLevel = 0; // 0 = aucun titre encore rencontré

    // Première passe : séparer les blocs (titres, paragraphes, listes, citations)
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.replace(/^\s+|\s+$/g, "");

        // Détecter les blocs de code ("```" ou "```langage" en ouverture, "```"
        // en fermeture). Tout le contenu ENTRE les deux délimiteurs est traité
        // comme texte brut, jamais interprété comme Markdown — sans ça, un exemple
        // de syntaxe Markdown à l'intérieur d'un bloc de code (ex. une charte
        // documentant "# Titre H1" en exemple) était pris pour un vrai titre du
        // document (bug trouvé par simulation sur la fixture gemini_charte.md,
        // 25/09/2026).
        var codeFenceMatch = trimmed.match(/^```(.*)$/);
        if (codeFenceMatch) {
            if (inCodeBlock) {
                // Ligne de fermeture : clôt le bloc de code en cours.
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = null;
                inCodeBlock = false;
            } else {
                // Ligne d'ouverture : commence un nouveau bloc de code.
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = { type: "code", text: "", language: codeFenceMatch[1] || "", children: [] };
                inCodeBlock = true;
            }
            continue;
        }
        if (inCodeBlock) {
            // À l'intérieur d'un bloc de code : accumuler la ligne TELLE QUELLE
            // (pas de trim, les espaces d'indentation du code comptent), sans
            // passer par aucune des détections Markdown ci-dessous.
            if (currentBlock.text !== "") currentBlock.text += "\n";
            currentBlock.text += line;
            continue;
        }

        // Sauter les lignes vides
        if (trimmed === "") {
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            continue;
        }

        // Ignorer les séparateurs horizontaux Markdown ("---", "***", "___" — au
        // moins 3 caractères identiques, éventuellement espacés). Sans ce traitement,
        // ils tombaient en "paragraphe standard" avec le texte littéral "---",
        // créant un paragraphe parasite visible (signalé par FJD comme "double
        // marque de paragraphe").
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed.replace(/\s/g, ""))) {
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            continue;
        }

        // Détecter les titres
        var h1Match = trimmed.match(/^#\s+(.*)/);
        var h2Match = trimmed.match(/^##\s+(.*)/);
        var h3Match = trimmed.match(/^###\s+(.*)/);

        if (h1Match) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "h1", text: h1Match[1], children: [] };
            currentTitleLevel = 1;
            continue;
        } else if (h2Match) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "h2", text: h2Match[1], children: [] };
            currentTitleLevel = 2;
            continue;
        } else if (h3Match) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "h3", text: h3Match[1], children: [] };
            currentTitleLevel = 3;
            continue;
        }

        // Détecter les citations : chaque ligne "> " devient son propre bloc
        // (un paragraphe InDesign par ligne de citation, pas de fusion multi-lignes
        // en un seul bloc — la fusion précédente introduisait des "\n" internes non
        // comptés comme saut de paragraphe par InDesign, ce qui désynchronisait le
        // calcul des positions de caractères pour le gras/italique et provoquait des
        // erreurs "Object is invalid" plus loin dans le traitement).
        var blockquoteMatch = trimmed.match(/^>\s+(.*)/);
        if (blockquoteMatch) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "blockquote", text: blockquoteMatch[1], children: [] };
            continue;
        }

        // Détecter les listes à puces : "-", "*" et "+" sont trois écritures
        // équivalentes de la même chose en Markdown (CommonMark les traite comme
        // interchangeables) — un tiret, une étoile ou un plus = un bloc/paragraphe
        // "li", sans distinction dans le mapping InDesign.
        //
        // Indentation (25/09, choix FJD) : le nombre d'espaces avant le marqueur de
        // puce est capturé pour déterminer le niveau d'imbrication (indentLevel :
        // 0 = racine, 1 = premier sous-niveau, etc. — convention 2 espaces = 1
        // niveau, la plus courante en Markdown). indentLevel est stocké sur le bloc
        // et utilisé PLUS TARD, au moment du mapping (pas ici dans le parseur, qui
        // ne connaît pas les styles du document InDesign) pour choisir soit un style
        // de liste dédié au niveau (li2, li3...) si le document en a, soit une
        // cascade de titres synthétiques plafonnée — cf. mission_01, section
        // "Indentation de listes".
        var liIndentMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
        if (liIndentMatch) {
            var indentSpaces = liIndentMatch[1].length;
            var indentLevel = Math.floor(indentSpaces / 2);
            var liContent = liIndentMatch[2].replace(/\s+$/, "");

            // Item de liste ENTIÈREMENT en gras (ex. "* **Titre**", rien avant/après
            // les "**") : traité comme un sous-titre de niveau (dernier titre réel
            // rencontré + 1), pas comme un item de liste normal. Plusieurs niveaux
            // successifs de ce pattern s'empilent (un "**Titre**" trouvé juste après
            // un autre du même type reste au même niveau, il ne descend pas plus —
            // seul un vrai #/##/### fait varier currentTitleLevel). Cette règle ne
            // s'applique qu'au niveau d'indentation 0 : un item en gras imbriqué
            // (indentLevel > 0) est un sous-item de liste normal, pas un titre.
            var fullyBoldMatch = liContent.match(/^\*\*(.+)\*\*$/);
            if (fullyBoldMatch && currentTitleLevel > 0 && indentLevel === 0) {
                if (currentBlock) blocks.push(currentBlock);
                var syntheticLevel = currentTitleLevel + 1;
                currentBlock = { type: "h" + syntheticLevel, text: fullyBoldMatch[1], children: [] };
                continue;
            }

            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "li", indentLevel: indentLevel, text: liContent, children: [] };
            continue;
        }

        // Détecter les listes numérotées ("1. ", "2. ", etc.). Tag distinct "li_num"
        // (choix FJD, 24/09) : permet de mapper un style InDesign de liste
        // numérotée différent du style de liste à puces, plutôt que de forcer les
        // deux sur le même style.
        var liNumMatch = trimmed.match(/^\d+\.\s+(.*)/);
        if (liNumMatch) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "li_num", text: liNumMatch[1], children: [] };
            continue;
        }

        // Détecter les lignes de tableau Markdown ("| a | b |"). La ligne de
        // séparation d'en-tête ("|---|---|") est ignorée : elle ne porte aucune
        // donnée, juste une convention de syntaxe Markdown. Toutes les lignes de
        // tableau consécutives sont regroupées dans un seul bloc "table", dont
        // "rows" est un tableau de tableaux de cellules (texte brut, marqueurs
        // Markdown déjà nettoyés par ligne).
        if (/^\|.*\|$/.test(trimmed)) {
            var isSeparatorRow = /^\|[\s:|-]+\|$/.test(trimmed);
            if (!isSeparatorRow) {
                var cells = trimmed.split("|");
                // split() sur "|a|b|" produit ["", "a", "b", ""] : retirer les deux
                // extrémités vides issues des barres de bord de ligne.
                cells = cells.slice(1, cells.length - 1);
                for (var cellIdx = 0; cellIdx < cells.length; cellIdx++) {
                    cells[cellIdx] = cells[cellIdx].replace(/^\s+|\s+$/g, "");
                }

                if (!currentBlock || currentBlock.type !== "table") {
                    if (currentBlock) blocks.push(currentBlock);
                    currentBlock = { type: "table", rows: [], children: [] };
                }
                currentBlock.rows.push(cells);
            }
            continue;
        }

        // Paragraphe standard : des lignes source consécutives (wrap Markdown "mou")
        // sont fusionnées avec un espace, pas un "\n" — elles forment une seule
        // phrase continue dans le paragraphe InDesign final, et un espace évite
        // toute ambiguïté \n/\r dans le calcul ultérieur des positions de caractères.
        if (!currentBlock || currentBlock.type === "h1" || currentBlock.type === "h2" || currentBlock.type === "h3" || currentBlock.type === "h4" || currentBlock.type === "h5" || currentBlock.type === "blockquote" || currentBlock.type === "li" || currentBlock.type === "li_num" || currentBlock.type === "table" || currentBlock.type === "code") {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "p", text: trimmed, children: [] };
        } else {
            if (currentBlock.text !== "") currentBlock.text += " ";
            currentBlock.text += trimmed;
        }
    }

    if (currentBlock) blocks.push(currentBlock);

    // Deuxième passe : parser les éléments inline (gras, italique) dans chaque block.
    // Un bloc "table" n'a pas de .text (son contenu est dans .rows) : ignoré ici,
    // le gras/italique dans les cellules n'est pas géré pour l'instant (hors scope).
    // Un bloc "code" est exclu aussi : son contenu ne doit JAMAIS être interprété
    // comme du Markdown (un "**" littéral dans du code ne doit pas devenir du gras).
    for (var b = 0; b < blocks.length; b++) {
        var block = blocks[b];
        if (block.type !== "table" && block.type !== "code") {
            block.children = parseInlineMarkdown(block.text);
        }
    }

    return blocks;
}

/**
 * Parse les éléments inline (gras, italique) dans un texte
 * Retourne un tableau d'éléments : { text, isBold, isItalic }
 */
/**
 * Un caractère est considéré comme "limite de mot" (espace, ponctuation, ou
 * début/fin de chaîne) — utilisé pour n'activer "_"/"__" que sur des bordures
 * de mot, jamais au milieu d'un identifiant type "mon_fichier_texte" (24/09,
 * choix FJD : l'underscore est trop courant en texte normal pour être marqué
 * sans condition, contrairement à "*").
 */
function isWordBoundaryChar(ch) {
    if (ch === "") return true; // début/fin de chaîne
    return /[\s.,;:!?()\[\]{}"'«»—-]/.test(ch);
}

function parseInlineMarkdown(text) {
    var elements = [];
    var i = 0;
    var currentText = "";
    var isBold = false;
    var isItalic = false;

    while (i < text.length) {
        var ch = text.charAt(i);
        var nextChar = i + 1 < text.length ? text.charAt(i + 1) : "";
        var prevChar = i > 0 ? text.charAt(i - 1) : "";

        // Détecter **gras**
        if (ch === "*" && nextChar === "*") {
            if (currentText !== "") {
                elements.push({ text: currentText, isBold: isBold, isItalic: isItalic });
                currentText = "";
            }
            isBold = !isBold;
            i += 2;
            continue;
        }

        // Détecter *italique*
        if (ch === "*" && nextChar !== "*") {
            if (currentText !== "") {
                elements.push({ text: currentText, isBold: isBold, isItalic: isItalic });
                currentText = "";
            }
            isItalic = !isItalic;
            i += 1;
            continue;
        }

        // Détecter __gras__ (équivalent à ** en CommonMark), seulement en bordure
        // de mot des deux côtés du marqueur — sinon "mon__truc__ici" serait
        // interprété à tort comme du gras.
        if (ch === "_" && nextChar === "_") {
            var afterDoubleUnderscore = i + 2 < text.length ? text.charAt(i + 2) : "";
            var boundaryOk = isBold
                ? isWordBoundaryChar(afterDoubleUnderscore)
                : isWordBoundaryChar(prevChar);
            if (boundaryOk) {
                if (currentText !== "") {
                    elements.push({ text: currentText, isBold: isBold, isItalic: isItalic });
                    currentText = "";
                }
                isBold = !isBold;
                i += 2;
                continue;
            }
        }

        // Détecter _italique_ (équivalent à * en CommonMark), même règle de bordure.
        if (ch === "_" && nextChar !== "_") {
            var afterSingleUnderscore = nextChar;
            var boundaryOkItalic = isItalic
                ? isWordBoundaryChar(afterSingleUnderscore)
                : isWordBoundaryChar(prevChar);
            if (boundaryOkItalic) {
                if (currentText !== "") {
                    elements.push({ text: currentText, isBold: isBold, isItalic: isItalic });
                    currentText = "";
                }
                isItalic = !isItalic;
                i += 1;
                continue;
            }
        }

        // Ajouter le caractère courant
        currentText += ch;
        i++;
    }

    // Ajouter le dernier élément
    if (currentText !== "") {
        elements.push({ text: currentText, isBold: isBold, isItalic: isItalic });
    }

    return elements;
}

// ============================================================================
// GESTION DES STYLES
// ============================================================================

/**
 * Parcourt récursivement une collection de styles + ses sous-groupes,
 * et remplit un tableau plat { name, style, groupName } (style = objet InDesign réel,
 * nécessaire pour appliquer un style rangé dans un groupe ; groupName = nom du groupe
 * parent direct, "" si le style est à la racine du document).
 * isParagraph : true pour parcourir des ParagraphStyle/ParagraphStyleGroup,
 *               false pour des CharacterStyle/CharacterStyleGroup.
 */
function collectStylesRecursive(stylesCollection, groupsCollection, outList, isParagraph, groupName) {
    var i;
    for (i = 0; i < stylesCollection.length; i++) {
        outList.push({ name: stylesCollection[i].name, style: stylesCollection[i], groupName: groupName || "" });
    }
    for (i = 0; i < groupsCollection.length; i++) {
        var group = groupsCollection[i];
        var childStyles = isParagraph ? group.paragraphStyles : group.characterStyles;
        var childGroups = isParagraph ? group.paragraphStyleGroups : group.characterStyleGroups;
        collectStylesRecursive(childStyles, childGroups, outList, isParagraph, group.name);
    }
}

/**
 * Récupère tous les styles de paragraphe du document, y compris ceux
 * rangés dans des groupes de styles (ParagraphStyleGroup), en descendant récursivement.
 * Retourne un tableau de { name, style }.
 */
function getParagraphStyleEntries() {
    var entries = [];
    try {
        var doc = app.activeDocument;
        collectStylesRecursive(doc.paragraphStyles, doc.paragraphStyleGroups, entries, true, "");
    } catch (e) {
        logError(e, "getParagraphStyleEntries");
    }
    return entries;
}

/**
 * Récupère tous les styles de caractère du document, y compris ceux
 * rangés dans des groupes de styles (CharacterStyleGroup), en descendant récursivement.
 * Retourne un tableau de { name, style }.
 */
function getCharacterStyleEntries() {
    var entries = [];
    try {
        var doc = app.activeDocument;
        collectStylesRecursive(doc.characterStyles, doc.characterStyleGroups, entries, false, "");
    } catch (e) {
        logError(e, "getCharacterStyleEntries");
    }
    return entries;
}

/**
 * Variantes ne retournant que les noms (compatibilité avec le code appelant existant)
 */
function getParagraphStyleNames() {
    var entries = getParagraphStyleEntries();
    var names = [];
    for (var i = 0; i < entries.length; i++) names.push(entries[i].name);
    return names;
}

function getCharacterStyleNames() {
    var entries = getCharacterStyleEntries();
    var names = [];
    for (var i = 0; i < entries.length; i++) names.push(entries[i].name);
    return names;
}

/**
 * Retrouve l'objet style InDesign réel à partir de son nom, en cherchant
 * récursivement dans les groupes (nécessaire car document.paragraphStyles.item(name)
 * ne trouve pas un style rangé dans un groupe).
 */
function findParagraphStyleByName(name) {
    var entries = getParagraphStyleEntries();
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].name === name) return entries[i].style;
    }
    return null;
}

function findCharacterStyleByName(name) {
    var entries = getCharacterStyleEntries();
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].name === name) return entries[i].style;
    }
    return null;
}

/**
 * Parcourt récursivement les styles de tableau (TableStyle/TableStyleGroup) du
 * document, fonction séparée de collectStylesRecursive (paragraphe/caractère)
 * plutôt que généralisée dessus, pour ne pas risquer de régression sur un
 * comportement déjà validé.
 */
function collectTableStylesRecursive(stylesCollection, groupsCollection, outList, groupName) {
    var i;
    for (i = 0; i < stylesCollection.length; i++) {
        outList.push({ name: stylesCollection[i].name, style: stylesCollection[i], groupName: groupName || "" });
    }
    for (i = 0; i < groupsCollection.length; i++) {
        var group = groupsCollection[i];
        collectTableStylesRecursive(group.tableStyles, group.tableStyleGroups, outList, group.name);
    }
}

function getTableStyleEntries() {
    var entries = [];
    try {
        var doc = app.activeDocument;
        collectTableStylesRecursive(doc.tableStyles, doc.tableStyleGroups, entries, "");
    } catch (e) {
        logError(e, "getTableStyleEntries");
    }
    return entries;
}

function getTableStyleNames() {
    var entries = getTableStyleEntries();
    var names = [];
    for (var i = 0; i < entries.length; i++) names.push(entries[i].name);
    return names;
}

function findTableStyleByName(name) {
    var entries = getTableStyleEntries();
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].name === name) return entries[i].style;
    }
    return null;
}

/**
 * Charge le mapping depuis le label du document
 */
function loadMappingFromDocument() {
    try {
        var doc = app.activeDocument;
        if (doc) {
            var labelContent = doc.extractLabel(LABEL_NAME);
            if (labelContent && labelContent !== "") {
                return deserializeFlatMapping(labelContent);
            }
        }
    } catch (e) {
        logError(e, "loadMappingFromDocument");
    }
    return null;
}

/**
 * Sauvegarde le mapping dans le label du document
 */
function saveMappingToDocument(mapping) {
    try {
        var doc = app.activeDocument;
        if (doc) {
            // insertLabel() écrase directement la valeur existante pour cette clé,
            // pas besoin de chercher/supprimer un label précédent au préalable
            // (document.labels n'est de toute façon pas une collection énumérable en ExtendScript).
            doc.insertLabel(LABEL_NAME, serializeFlatMapping(mapping));
            return true;
        }
    } catch (e) {
        logError(e, "saveMappingToDocument");
        alertUser("Erreur lors de la sauvegarde du mapping : " + e.message);
    }
    return false;
}

/**
 * Vérifie si le mapping est valide (tous les styles référencés existent)
 */
/**
 * Array.prototype.indexOf n'existe pas en ExtendScript (ES3) : recherche manuelle.
 */
function arrayContains(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === value) return true;
    }
    return false;
}

function isMappingValid(mapping) {
    var paraStyles = getParagraphStyleNames();
    var charStyles = getCharacterStyleNames();
    var tableStyles = getTableStyleNames();

    for (var tag in mapping) {
        if (mapping.hasOwnProperty(tag)) {
            var styleName = mapping[tag];
            var tagInfo = MARKDOWN_TAGS[tag];
            if (!tagInfo) continue;

            if (tagInfo.type === "paragraph") {
                if (!arrayContains(paraStyles, styleName)) {
                    return false;
                }
            } else if (tagInfo.type === "character") {
                if (!arrayContains(charStyles, styleName)) {
                    return false;
                }
            } else if (tagInfo.type === "table") {
                if (!arrayContains(tableStyles, styleName)) {
                    return false;
                }
            }
        }
    }
    return true;
}

// ============================================================================
// UI DE CONFIGURATION
// ============================================================================

/**
 * Affiche la fenêtre de configuration pour le mapping des styles
 */
function showConfigurationDialog(currentMapping) {
    var doc = app.activeDocument;
    if (!doc) {
        alertUser("Aucun document InDesign actif.");
        return null;
    }

    var paraStyleEntries = getParagraphStyleEntries();
    var charStyleEntries = getCharacterStyleEntries();
    var tableStyleEntries = getTableStyleEntries();

    // Créer la fenêtre (layout automatique en colonne, signature ScriptUI standard)
    var win = new Window("dialog", SCRIPT_NAME + " - Configuration du mapping");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 10;
    win.margins = 16;

    // Panneau principal
    var mainPanel = win.add("panel", undefined, "Mapping Markdown → Styles InDesign");
    mainPanel.orientation = "column";
    mainPanel.alignChildren = "fill";
    mainPanel.spacing = 8;
    mainPanel.margins = 12;

    // Instructions
    var instructions = mainPanel.add("statictext", undefined, "Associez chaque élément Markdown à un style du document :");
    instructions.graphics.font = ScriptUI.newFont("Helvetica", "Bold", 12);

    // Créer un groupe pour chaque tag
    var mappingControls = {};

    for (var tag in MARKDOWN_TAGS) {
        if (MARKDOWN_TAGS.hasOwnProperty(tag)) {
            var tagInfo = MARKDOWN_TAGS[tag];
            var group = mainPanel.add("group", undefined);
            group.orientation = "row";
            group.alignChildren = "left";

            // Label
            var label = group.add("statictext", undefined, tagInfo.display + " :");
            label.preferredSize.width = 180;

            // Dropdown
            var dropdown = group.add("dropdownlist", undefined);
            dropdown.preferredSize.width = 280;

            // Remplir le dropdown en groupant par groupe de styles : le nom du
            // groupe apparaît en en-tête non sélectionnable ("---- Nom ----"),
            // suivi des styles qu'il contient. Les styles à la racine (sans
            // groupe) sont listés en premier, sans en-tête.
            var availableEntries = tagInfo.type === "paragraph" ? paraStyleEntries
                : (tagInfo.type === "character" ? charStyleEntries : tableStyleEntries);
            var entriesByGroup = {};
            var groupOrder = [];
            var k;
            for (k = 0; k < availableEntries.length; k++) {
                var entry = availableEntries[k];
                var gName = entry.groupName || "";
                if (!entriesByGroup.hasOwnProperty(gName)) {
                    entriesByGroup[gName] = [];
                    groupOrder.push(gName);
                }
                entriesByGroup[gName].push(entry.name);
            }
            // Racine (pas de groupe) en premier, puis les groupes nommés
            groupOrder.sort(function(a, b) {
                if (a === "") return -1;
                if (b === "") return 1;
                return a < b ? -1 : (a > b ? 1 : 0);
            });

            var selectableNames = []; // en parallèle des items ajoutés, "" pour les en-têtes
            for (k = 0; k < groupOrder.length; k++) {
                var gName2 = groupOrder[k];
                if (gName2 !== "") {
                    var headerItem = dropdown.add("item", "── " + gName2 + " ──");
                    headerItem.enabled = false;
                    selectableNames.push(null);
                }
                var namesInGroup = entriesByGroup[gName2];
                for (var m = 0; m < namesInGroup.length; m++) {
                    dropdown.add("item", namesInGroup[m]);
                    selectableNames.push(namesInGroup[m]);
                }
            }

            // Présélection par priorité :
            // 1. Le mapping déjà enregistré pour ce document, s'il existe.
            // 2. Sinon, un style dont le nom correspond EXACTEMENT (insensible à la
            //    casse) à la convention HTML du tag (ex. "H1" pour le tag h1) — pour
            //    les documents dont la charte de styles suit cette convention de
            //    nommage, aucune configuration manuelle n'est nécessaire.
            // 3. Sinon, le premier style disponible à la racine (typiquement le style
            //    neutre "[Style de paragraphe de base]"/"[Aucun]"), pour permettre de
            //    tester le flux sans configuration.
            var styleToPreselect = (currentMapping && currentMapping[tag]) ? currentMapping[tag] : null;

            if (!styleToPreselect && tagInfo.htmlName) {
                for (k = 0; k < selectableNames.length; k++) {
                    var candidateName = selectableNames[k];
                    if (candidateName && candidateName.toLowerCase() === tagInfo.htmlName.toLowerCase()) {
                        styleToPreselect = candidateName;
                        break;
                    }
                }
            }

            if (!styleToPreselect) {
                for (k = 0; k < selectableNames.length; k++) {
                    if (selectableNames[k] !== null) {
                        styleToPreselect = selectableNames[k];
                        break;
                    }
                }
            }
            if (styleToPreselect) {
                for (k = 0; k < selectableNames.length; k++) {
                    if (selectableNames[k] === styleToPreselect) {
                        dropdown.selection = k;
                        break;
                    }
                }
            }

            mappingControls[tag] = dropdown;
        }
    }

    // Boutons
    logToFile("showConfigurationDialog: construction des boutons");
    var buttonGroup = win.add("group", undefined);
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "right";

    var resetBtn = buttonGroup.add("button", undefined, "Réinitialiser");
    var cancelBtn = buttonGroup.add("button", undefined, "Annuler", { name: "cancel" });
    var okBtn = buttonGroup.add("button", undefined, "OK", { name: "ok" });
    logToFile("showConfigurationDialog: boutons créés - resetBtn=" + (resetBtn ? "ok" : "NULL") + " cancelBtn=" + (cancelBtn ? "ok" : "NULL") + " okBtn=" + (okBtn ? "ok" : "NULL"));

    // Gestion des événements
    var resultMapping = null;
    var wasReset = false;

    resetBtn.onClick = function() {
        logToFile("resetBtn.onClick: DÉCLENCHÉ");
        try {
            // Efface le mapping stocké dans le document (repasse par la même
            // sauvegarde que le flux normal, {} vide) et relance le dialogue de
            // configuration à partir de zéro : présélection HTML/style neutre,
            // sans les choix précédents.
            var saveResult = saveMappingToDocument({});
            logToFile("resetBtn.onClick: saveMappingToDocument({}) a retourné " + saveResult);
            wasReset = true;
            logToFile("resetBtn.onClick: avant win.close()");
            win.close();
            logToFile("resetBtn.onClick: après win.close() (ne devrait pas s'afficher si close() est bloquant)");
        } catch (eReset) {
            logError(eReset, "resetBtn.onClick");
        }
    };
    logToFile("showConfigurationDialog: resetBtn.onClick assigné, type=" + typeof resetBtn.onClick);

    okBtn.onClick = function() {
        logToFile("okBtn.onClick: DÉCLENCHÉ");
        resultMapping = {};
        for (var tag in mappingControls) {
            if (mappingControls.hasOwnProperty(tag)) {
                var dropdown = mappingControls[tag];
                // Ignorer une sélection sur un en-tête de groupe (non sélectionnable en
                // principe via enabled=false, sécurisé ici au cas où ce ne serait pas honoré)
                if (dropdown.selection !== null && dropdown.selection.text.indexOf("── ") !== 0) {
                    resultMapping[tag] = dropdown.selection.text;
                }
            }
        }
        win.close();
    };

    cancelBtn.onClick = function() {
        logToFile("cancelBtn.onClick: DÉCLENCHÉ");
        win.close();
    };

    // Afficher la fenêtre et attendre la fermeture
    logToFile("showConfigurationDialog: avant win.show()");
    win.show();
    logToFile("showConfigurationDialog: après win.show() - wasReset=" + wasReset + " resultMapping=" + (resultMapping ? "présent" : "null"));

    // Sur "Réinitialiser" : le mapping stocké vient d'être effacé, on relance le
    // dialogue à partir de zéro (récursion — currentMapping devient null, donc la
    // présélection retombe sur la convention HTML / le style neutre).
    if (wasReset) {
        logToFile("showConfigurationDialog: wasReset=true, relance récursive");
        return showConfigurationDialog(null);
    }

    return resultMapping;
}

// ============================================================================
// APPLICATION DES STYLES
// ============================================================================

/**
 * Résout le tag/style final à utiliser pour un bloc "li" selon son niveau
 * d'indentation (block.indentLevel : 0 = racine, 1 = premier sous-niveau, etc.),
 * suivant la règle de cascade FJD (mission_02, COMMUNICATION/) :
 * 1. Si un style de liste dédié au niveau (li2 pour indentLevel=1, li3 pour
 *    indentLevel=2, li4 pour indentLevel=3) est mappé ET existe réellement dans
 *    le document, on l'utilise directement.
 * 2. Sinon, cascade de titres plafonnée : on calcule le niveau de titre maximum
 *    RÉELLEMENT DISPONIBLE dans le mapping (le plus grand h1..h5 dont le style
 *    est mappé et valide), et on vise ce niveau + indentLevel — mais jamais
 *    au-delà du maximum disponible.
 * 3. Si le niveau de titre maximum est atteint/dépassé, ou si aucun titre n'est
 *    disponible du tout, on retombe sur "li" (le style de liste racine).
 * 4. Si même "li" n'a pas de style mappé, le comportement existant s'applique
 *    (aucun style, journalisé par l'appelant) — cette fonction retourne alors
 *    simplement le nom mappé pour "li" (potentiellement absent/undefined),
 *    sans rien inventer de plus.
 *
 * Retourne le NOM du style (chaîne), pas l'objet style — cohérent avec l'usage
 * existant de mapping[tag] dans insertMarkdownWithStyles().
 */
function getLiStyleForIndentLevel(block, mapping) {
    var indentLevel = block.indentLevel || 0;

    if (indentLevel === 0) {
        return mapping["li"];
    }

    // Étape 1 : style de liste dédié au niveau, s'il est mappé et existe réellement.
    var levelTag = "li" + (indentLevel + 1); // indentLevel=1 -> "li2", etc.
    var levelStyleName = mapping[levelTag];
    if (levelStyleName && findParagraphStyleByName(levelStyleName)) {
        return levelStyleName;
    }

    // Étape 2 : cascade de titres plafonnée au niveau de titre maximum RÉELLEMENT
    // disponible dans le mapping (pas juste MARKDOWN_TAGS — un h4/h5 déclaré dans
    // MARKDOWN_TAGS mais non mappé par l'utilisateur ne compte pas comme disponible).
    var maxAvailableTitleLevel = 0;
    for (var lvl = 1; lvl <= 5; lvl++) {
        var hTag = "h" + lvl;
        var hStyleName = mapping[hTag];
        if (hStyleName && findParagraphStyleByName(hStyleName)) {
            maxAvailableTitleLevel = lvl;
        }
    }

    if (maxAvailableTitleLevel > 0) {
        var targetTitleLevel = indentLevel + 1; // même convention que la racine (indentLevel=0 -> pas de titre, c'est déjà "li")
        if (targetTitleLevel <= maxAvailableTitleLevel) {
            var targetTag = "h" + targetTitleLevel;
            var targetStyleName = mapping[targetTag];
            if (targetStyleName && findParagraphStyleByName(targetStyleName)) {
                return targetStyleName;
            }
        }
    }

    // Étape 3 : ni style de liste dédié, ni titre disponible à ce niveau — retombe
    // sur le style de liste racine.
    return mapping["li"];
}

/**
 * Insère le texte Markdown parsé dans le TextFrame sélectionné avec les styles.
 */
function insertMarkdownWithStyles(story, blocks, mapping) {
    try {
        // ARCHITECTURE RÉÉCRITE (24/09/2026, sur diagnostic + décision FJD) : la
        // cause racine du désordre de texte (Cas 17 du wiki) n'était PAS l'opérateur
        // += (corrigé au Cas 14) ni le style hérité (corrigé au Cas 16) — ces deux
        // corrections étaient réelles mais insuffisantes. La vraie cause, jamais
        // éliminée : réassigner insertionPoints[-1] À CHAQUE ITÉRATION D'UNE BOUCLE,
        // quel que soit l'opérateur ("=" ou "+="), ne fait pas avancer le curseur de
        // façon fiable sur un grand nombre de blocs (confirmé par forum Adobe :
        // "be careful and do that in reverse order"). Le retrait du gras/italique
        // avait réduit le nombre de réassignations par bloc à une seule, ce qui a
        // suffisamment masqué le problème sur les tests précédents (peu de blocs) —
        // il a reproduit avec un fichier plus long (nombreux blocs consécutifs).
        //
        // Nouvelle approche, confirmée par recherche documentaire (pattern reconnu
        // et même recommandé pour la performance) : construire TOUT LE TEXTE en une
        // seule chaîne JS (blocs séparés par "\r"), UNE SEULE assignation finale à
        // story.contents, puis une passe séparée qui applique les styles de
        // paragraphe par INDEX STABLE sur story.paragraphs (plus de réassignation
        // répétée de insertionPoints[-1] dans la boucle principale).
        //
        // Les tables restent un cas à part (nécessitent une vraie insertion API,
        // pas de texte) : le texte est découpé en segments autour de chaque table,
        // chaque segment est écrit par une assignation directe unique (pas dans une
        // boucle), puis la table est créée entre deux segments.

        story.contents = "";
        logToFile("insertMarkdownWithStyles: après story.contents='' — story.paragraphs.length=" + story.paragraphs.length + ", story.contents.length=" + story.contents.length);

        // Regrouper les blocs non-table consécutifs pour ne faire qu'UNE assignation
        // par segment (jamais une par bloc individuel) — segments = tableaux de blocs.
        var segments = [];
        var currentSegment = [];
        for (var s = 0; s < blocks.length; s++) {
            if (blocks[s].type === "table") {
                if (currentSegment.length > 0) {
                    segments.push({ type: "text", blocks: currentSegment });
                    currentSegment = [];
                }
                segments.push({ type: "table", block: blocks[s] });
            } else {
                currentSegment.push(blocks[s]);
            }
        }
        if (currentSegment.length > 0) {
            segments.push({ type: "text", blocks: currentSegment });
        }

        // Le "\r" de transition entre deux segments TEXTE est écrit une seule fois,
        // au début de chaque segment texte sauf le tout premier du document.
        // Une table N'EST PAS un paragraphe : confirmé par recherche documentaire
        // ("tables occupy a single character position in the story") — elle
        // s'ancre comme un caractère DANS le paragraphe courant, elle ne crée
        // jamais son propre saut de paragraphe. Donc aucun "\r" n'est écrit autour
        // d'un segment table, ni avant ni après — seul du texte avant et du texte
        // après une table peuvent nécessiter un "\r" entre eux (et un seul, pas
        // deux). Une version précédente ajoutait un "\r" avant CHAQUE segment y
        // compris les tables, produisant un paragraphe vide surnuméraire à chaque
        // table et décalant tout l'index des paragraphes après ce point — bug
        // trouvé par simulation avant tout test réel (cf. wiki Cas 17/20).
        var hasWrittenAnyTextSegment = false;
        for (var seg = 0; seg < segments.length; seg++) {
            var segment = segments[seg];

            if (segment.type === "text" && hasWrittenAnyTextSegment) {
                story.insertionPoints[-1].contents = "\r";
                try {
                    story.paragraphs[-1].startParagraph = StartParagraph.ANYWHERE;
                } catch (eStartPara) {
                    logError(eStartPara, "insertMarkdownWithStyles/resetStartParagraph");
                }
            }

            if (segment.type === "table") {
                var block = segment.block;
                var rowCount = block.rows.length;
                var columnCount = rowCount > 0 ? block.rows[0].length : 0;
                if (rowCount > 0 && columnCount > 0) {
                    try {
                        var newTable = story.insertionPoints[-1].tables.add({
                            headerRowCount: 1,
                            bodyRowCount: rowCount - 1,
                            columnCount: columnCount
                        });
                        for (var r = 0; r < rowCount; r++) {
                            for (var cIdx = 0; cIdx < columnCount; cIdx++) {
                                var cellText = block.rows[r][cIdx] || "";
                                newTable.rows[r].cells[cIdx].texts[0].contents = cellText;
                            }
                        }
                        var tableStyleName = mapping["table"];
                        if (tableStyleName) {
                            var tableStyleObj = findTableStyleByName(tableStyleName);
                            if (tableStyleObj) {
                                newTable.appliedTableStyle = tableStyleObj;
                            } else {
                                logError({ message: "Style de tableau introuvable : " + tableStyleName }, "insertMarkdownWithStyles/tableStyle");
                            }
                        }
                    } catch (eTable) {
                        logError(eTable, "insertMarkdownWithStyles/table");
                    }
                }
                continue;
            }

            // Segment de texte : construire la chaîne complète du segment en JS pur,
            // puis UNE SEULE assignation à insertionPoints[-1].contents.
            //
            // Cas particulier des blocs "code" multi-lignes : leur .text contient
            // des "\n" internes (une ligne de code = une ligne source, à l'intérieur
            // du MÊME bloc/paragraphe). Vérifié via doc officielle et forums Adobe :
            // "\n" assigné à .contents est traité comme un saut de ligne forcé
            // InDesign (SpecialCharacters.FORCED_LINE_BREAK), qui reste dans le même
            // paragraphe sans en ouvrir un nouveau — comportement confirmé, pas
            // besoin de substitution vers un autre caractère Unicode.
            var segBlocks = segment.blocks;
            var fullText = "";
            for (var i = 0; i < segBlocks.length; i++) {
                fullText += segBlocks[i].text;
                if (i < segBlocks.length - 1) {
                    fullText += "\r";
                }
            }

            // Mémoriser l'index du paragraphe où le PREMIER bloc de ce segment va
            // s'écrire, pour appliquer les styles ensuite par index stable (pas par
            // [-1] recalculé en boucle).
            //
            // Point clé (trouvé par simulation, cf. wiki Cas 09/11/20) : si un "\r"
            // vient d'être écrit juste avant (transition entre segments texte), il a
            // OUVERT un nouveau paragraphe VIDE qui est déjà le "paragraphe courant"
            // — écrire du texte dedans le REMPLIT, ça ne crée pas encore un nouveau
            // paragraphe après lui. Donc le premier bloc du segment s'écrit dans
            // story.paragraphs[-1] (le dernier existant, vide), pas dans un
            // paragraphe qui n'existe pas encore à cet index. Seul le TOUT PREMIER
            // segment du document entier (story vide dès le départ) est déjà
            // positionné sur paragraphs[0] sans "\r" préalable — même logique,
            // simplement l'index 0 au lieu de "length - 1".
            //
            // CORRECTIF confirmé par log réel (25/09) : l'hypothèse "un TextFrame
            // vide a toujours au moins 1 paragraphe" (répétée par plusieurs forums
            // Adobe) s'est révélée FAUSSE dans ce cas précis — après une assignation
            // EXPLICITE de story.contents = "", le log a montré
            // story.paragraphs.length = 0 (pas 1). Le calcul "paragraphsBeforeCount
            // - 1" produisait alors -1 sur le tout premier segment, décalant
            // irrémédiablement tous les indices suivants (paraIndex "contagieux",
            // signalé par FJD). Corrigé avec Math.max(0, ...) : si la story est
            // réellement vide (length=0), le premier bloc vise l'index 0 (pas -1) ;
            // sinon le comportement précédent (dernier paragraphe existant, qui
            // vient d'être ouvert par un "\r") reste inchangé.
            var paragraphsBeforeCount = story.paragraphs.length;
            var firstNewParagraphIndex = Math.max(0, paragraphsBeforeCount - 1);
            logToFile("insertMarkdownWithStyles: segment texte seg=" + seg + " paragraphsBeforeCount=" + paragraphsBeforeCount + " firstNewParagraphIndex=" + firstNewParagraphIndex + " segBlocks.length=" + segBlocks.length);

            // Compter les "\r" réellement présents dans fullText avant assignation,
            // pour isoler si le problème vient de la construction JS de fullText ou
            // de la façon dont InDesign interprète l'assignation (25/09, diagnostic
            // du bug "paragraphElements.length=1 au lieu de 85").
            var crCount = 0;
            for (var crIdx = 0; crIdx < fullText.length; crIdx++) {
                if (fullText.charAt(crIdx) === "\r") crCount++;
            }
            logToFile("insertMarkdownWithStyles: avant assignation — fullText.length=" + fullText.length + " nombre de \\r dans fullText=" + crCount + " (attendu=" + (segBlocks.length - 1) + ")");

            story.insertionPoints[-1].contents = fullText;
            logToFile("insertMarkdownWithStyles: juste après assignation — story.paragraphs.length=" + story.paragraphs.length);

            // Appliquer le style de paragraphe de chaque bloc du segment, par index
            // stable. IMPORTANT (25/09, bug réel trouvé via log — erreur "Object is
            // invalid" ligne appliedParagraphStyle) : story.paragraphs[i] N'EST PAS
            // un objet à identité fixe, c'est une plage de caractères résolue à
            // chaque accès. Certains styles de paragraphe (ex. liste à puces avec
            // puce automatique InDesign) insèrent un caractère dans le flux de texte
            // au moment où le style est appliqué — ça peut invalider les indices de
            // paragraphes déjà "vus" mais pas encore stylés dans la MÊME boucle, le
            // script plante en cours de route (confirmé par forum Adobe : pattern
            // recommandé = story.paragraphs.everyItem().getElements() pour obtenir
            // un tableau JS stable, snapshoté une fois, plutôt que de ré-interroger
            // la collection dynamique à chaque itération).
            var paragraphElements = story.paragraphs.everyItem().getElements();
            logToFile("insertMarkdownWithStyles: après écriture fullText — paragraphElements.length=" + paragraphElements.length + " (attendu ~= firstNewParagraphIndex+segBlocks.length=" + (firstNewParagraphIndex + segBlocks.length) + ")");
            for (var p = 0; p < segBlocks.length; p++) {
                var paraIndex = firstNewParagraphIndex + p;
                // Déterminer le style approprié pour les blocs de liste imbriqués
                var paraStyleName = segBlocks[p].type;
                if (segBlocks[p].type === "li") {
                    paraStyleName = getLiStyleForIndentLevel(segBlocks[p], mapping);
                } else {
                    paraStyleName = mapping[segBlocks[p].type];
                }
                if (paraStyleName) {
                    var paraStyle = findParagraphStyleByName(paraStyleName);
                    if (paraStyle) {
                        if (paragraphElements[paraIndex]) {
                            paragraphElements[paraIndex].appliedParagraphStyle = paraStyle;
                        } else {
                            logError({ message: "Paragraphe introuvable à l'index " + paraIndex }, "insertMarkdownWithStyles/pass1/paraIndex");
                        }
                    } else {
                        logError({ message: "Style de paragraphe introuvable : " + paraStyleName }, "insertMarkdownWithStyles/pass1");
                    }
                }
            }

            hasWrittenAnyTextSegment = true;
        }

        return true;

    } catch (e) {
        logError(e, "insertMarkdownWithStyles");
        alertUser("Erreur lors de l'insertion du texte : " + e.message);
        return false;
    }
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Point d'entrée du script
 */
function main() {
    try {
        // Vérifier qu'un document est ouvert
        var doc = app.activeDocument;
        if (!doc) {
            alertUser("Aucun document InDesign actif. Veuillez ouvrir un document.");
            return;
        }

        // Vérifier que la sélection est un TextFrame
        var selection = app.selection;
        if (!selection || selection.length === 0) {
            alertUser("Veuillez sélectionner un bloc de texte (TextFrame) avant d'exécuter le script.");
            return;
        }

        var selectedItem = selection[0];
        if (!(selectedItem instanceof TextFrame)) {
            alertUser("La sélection active n'est pas un bloc de texte (TextFrame).\n\nVeuillez sélectionner un bloc de texte.");
            return;
        }
        var targetStory = selectedItem.texts[0];

        // Sélectionner et lire le fichier Markdown
        var fileContent = selectAndReadMarkdownFile();
        if (fileContent === null) {
            // Utilisateur a annulé - arrêt silencieux
            return;
        }
        
        if (!fileContent || fileContent.replace(/\s/g, "") === "") {
            alertUser("Le fichier sélectionné est vide ou ne contient pas de texte.");
            return;
        }

        // Parser le Markdown
        var blocks = parseMarkdown(fileContent);
        if (!blocks || blocks.length === 0) {
            alertUser("Aucun contenu Markdown valide détecté dans le fichier.");
            return;
        }

        // Charger le mapping existant (s'il existe, sert uniquement à préremplir
        // le dialogue ci-dessous — pas de bypass silencieux). Le dialogue de
        // configuration s'affiche systématiquement, déjà présélectionné avec ce
        // mapping (ou à défaut le style neutre par défaut) pour permettre de
        // valider en un clic ou d'ajuster directement, sans écran de confirmation
        // intermédiaire.
        var mapping = loadMappingFromDocument();

        mapping = showConfigurationDialog(mapping);
        if (!mapping) {
            // Utilisateur a annulé
            return;
        }

        // Sauvegarder le mapping (même s'il est identique au précédent, pour rester simple)
        if (!saveMappingToDocument(mapping)) {
            alertUser("Impossible de sauvegarder le mapping. Le plugin ne fonctionnera pas correctement.");
            return;
        }

        // Vérifier que tous les tags ont un mapping
        var missingTags = [];
        for (var tag in MARKDOWN_TAGS) {
            if (MARKDOWN_TAGS.hasOwnProperty(tag) && !mapping[tag]) {
                missingTags.push(MARKDOWN_TAGS[tag].display);
            }
        }

        if (missingTags.length > 0) {
            alertUser("Certains éléments Markdown ne sont pas mappés :\n\n" + missingTags.join("\n"));
            // Relancer la configuration
            mapping = showConfigurationDialog(mapping);
            if (!mapping) {
                return;
            }
            saveMappingToDocument(mapping);
        }

        // Insérer le Markdown avec les styles
        var success = insertMarkdownWithStyles(targetStory, blocks, mapping);
        if (!success) {
            alertUser("Échec de l'insertion du Markdown avec les styles.");
            return;
        }

        alertUser("Markdown inséré avec succès avec les styles configurés !");

    } catch (e) {
        logError(e, "main");
        alertUser("Erreur inattendue : " + e.message + "\n\nStack: " + e.stack + "\n\n(Détails enregistrés dans import_md_errors.log)");
    }
}

// Exécuter le script
main();

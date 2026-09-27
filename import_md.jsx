// import_md.jsx
// Plugin InDesign : import Markdown mappé sur la charte de styles réelle du document
// Version 1.0 - Compatible ExtendScript (ES3)

// ============================================================================
// CONFIGURATION
// ============================================================================

var SCRIPT_NAME = "Import MD";
var LABEL_NAME = "md-style-map";
var LOG_FILE_PATH = new File($.fileName).parent.fsName + "/import_md_errors.log";

// MEMOIRE DE MAPPING INTER-DOCUMENTS (MODE TEST)
// Le mapping vit normalement DANS le document (label). Pour ne pas avoir a le
// ressaisir a chaque nouveau document pendant la phase de test, on garde en plus
// une copie sur disque, A COTE DU SCRIPT (meme dossier que le log) : elle sert
// de source quand le document n'a pas de mapping, et elle est mise a jour a
// chaque validation du dialogue. Elle est DISSOCIEE du document — c'est
// volontairement une commodite de test : les noms de styles qu'elle contient
// peuvent ne pas exister dans un autre document, l'insertion le journalise et
// retombe sur le neutre (aucun plantage). A retirer avant diffusion.
var MEMORY_MAPPING_PATH = new File($.fileName).parent.fsName + "/import_md_mapping_memory.txt";

// Valeur sentinelle du dialogue de mapping : "ce tag n'est PAS mappe". Proposee
// par defaut quand aucune correspondance n'existe, elle signifie : aucune
// affectation de style pour ce tag. Le script ne devine JAMAIS a la place de
// l'utilisateur (decision FJD 27/09/2026, cf. doc/wiki Cas 25).
var NOT_MAPPED_LABEL = "\u2014 non mapp\u00e9 \u2014";

// MISSION 03 (25/09, décision FJD) : reconstruction minimale de
// insertMarkdownWithStyles après régression non identifiée. Quand
// MINIMAL_MODE = true, main() exécute insertMarkdownWithStyles_v2() au lieu de
// l'ancienne version — étape 1 = texte brut uniquement (une seule assignation,
// aucun style, aucune table, aucune liste, aucun segment), cf.
// COMMUNICATION/mission_03_reconstruction_minimale.md. Remettre à false une
// fois la reconstruction validée bout en bout (étape 5, non-régression complète).
var MINIMAL_MODE = true;

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
// MISSION 03 — ÉTAPE 3 (décision FJD, 26/09/2026, révisée le 27/09/2026) : les
// balises "####", "#####", "######"... sont TOUJOURS de VRAIS titres, et rien
// d'autre. L'ancien usage DÉTOURNÉ (« une puce entièrement en gras devient un
// sous-titre ») a été ABANDONNÉ (option 1) : il transformait tous les items de
// liste en gras d'un document réel en faux titres. Le parseur ne produit donc
// plus de tag "hN" que pour un vrai #/##/###..., et le drapeau `synthetic`
// n'existe plus. Côté dialogue de mapping, le nombre de niveaux proposés est
// volontairement plafonné à h9 : le PARSER, lui, n'a aucune limite (au-delà de
// h9 le bloc est produit normalement puis tombe en style neutre + log, sans
// échec).
var MARKDOWN_TAGS = {
    "h1": { type: "paragraph", display: "Titre 1 (#)", htmlName: "h1" },
    "h2": { type: "paragraph", display: "Titre 2 (##)", htmlName: "h2" },
    "h3": { type: "paragraph", display: "Titre 3 (###)", htmlName: "h3" },
    "h4": { type: "paragraph", display: "Titre 4 (####)", htmlName: "h4" },
    "h5": { type: "paragraph", display: "Titre 5 (#####)", htmlName: "h5" },
    "h6": { type: "paragraph", display: "Titre 6 (######)", htmlName: "h6", optional: true },
    "h7": { type: "paragraph", display: "Titre 7 (#######)", htmlName: "h7", optional: true },
    "h8": { type: "paragraph", display: "Titre 8 (########)", htmlName: "h8", optional: true },
    "h9": { type: "paragraph", display: "Titre 9 (#########)", htmlName: "h9", optional: true },
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

        // Détecter les titres.
        // MISSION 03 — ÉTAPE 3 (décision FJD 26/09/2026) : la détection est
        // DYNAMIQUE, quel que soit le nombre de "#" en tête de ligne (h1, h2, h3,
        // h4, h5, h6, h7... sans plafond côté parseur). Auparavant seuls "#", "##"
        // et "###" étaient reconnus : une ligne "#### Titre" tombait en paragraphe
        // standard avec le texte LITTÉRAL "#### Titre" (constat FJD du 26/09 sur
        // l'extrait ChatGPT, 3.1.1 Étape de compilation). FJD a acté que #### et
        // au-delà sont d'abord de VRAIS titres. Une espace OBLIGATOIRE après les
        // "#" reste exigée (CommonMark) : "#hashtag" n'est pas un titre.
        var headingMatch = trimmed.match(/^(#{1,})\s+(.*)$/);
        if (headingMatch) {
            if (currentBlock) blocks.push(currentBlock);
            var headingLevel = headingMatch[1].length;
            // Plus de champ `synthetic` : depuis l'option 1 (27/09/2026) tout
            // titre "hN" provient d'un vrai #/##/###..., sans exception.
            currentBlock = { type: "h" + headingLevel, text: headingMatch[2], children: [] };
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

            // Option 1 (décision FJD, 27/09/2026) : une puce RESTE une puce.
            // La règle précédente (« puce entièrement en gras ⇒ titre de niveau
            // currentTitleLevel + 1 ») a été SUPPRIMÉE. Elle détournait tous les
            // items de liste en gras d'un vrai document (constat FJD sur
            // programme_de_formation_indesign_ia_extendscript.md : 18 puces
            // `* **...**` converties en faux titres H3). Le gras d'une puce sera
            // traité comme du gras inline à l'étape 4, la puce gardant son style
            // de liste.
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
        // Le test de titre est volontairement GÉNÉRIQUE (/^h\d+$/) et non une
        // énumération littérale h1||h2||h3... : avec la détection dynamique de
        // l'étape 3, un titre "h6"/"h7" doit aussi clore le bloc courant, sinon
        // il serait avalé comme continuation de paragraphe.
        if (!currentBlock || /^h\d+$/.test(currentBlock.type) || currentBlock.type === "blockquote" || currentBlock.type === "li" || currentBlock.type === "li_num" || currentBlock.type === "table" || currentBlock.type === "code") {
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

/**
 * MISSION 03 — ÉTAPE 4. Texte "plat" d'un bloc, marqueurs inline RETIRÉS.
 *
 * `parseInlineMarkdown` CONSOMME les marqueurs (`**`, `*`, `__`, `_` en bordure
 * de mot) : ils n'apparaissent plus dans les `children`. Le texte à insérer
 * dans InDesign doit donc être reconstruit par concaténation des `children`,
 * et non depuis `block.text` qui, lui, les contient encore.
 *
 * Exception assumée : un bloc `code` n'est JAMAIS parsé en inline (décision de
 * `parseMarkdown`, cf. commentaire de la deuxième passe) — son texte est rendu
 * TEL QUEL, marqueurs compris : un `**` dans du code reste littéral. Un bloc
 * `table` n'a pas de `.text` (son contenu est dans `.rows`).
 *
 * Corollaire : un bloc dont le texte n'était QUE des marqueurs (ex. `**` seul)
 * donne un texte vide — donc un paragraphe vide. C'est le comportement juste :
 * le marqueur a été consommé, il ne doit pas rester visible.
 */
function getBlockPlainText(block) {
    if (!block) return "";
    if (block.type === "code") return block.text || "";
    if (block.type === "table") return "";
    if (!block.children) return block.text || "";
    var plain = "";
    for (var i = 0; i < block.children.length; i++) {
        plain += ("" + block.children[i].text);
    }
    return plain;
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
 * MEMOIRE DE TEST : lit le mapping conserve sur disque a cote du script.
 * Retourne null si le fichier n'existe pas ou est illisible — jamais d'alerte,
 * c'est un confort de test, pas une fonctionnalite du plugin.
 */
function loadMemoryMapping() {
    try {
        if (!MEMORY_MAPPING_PATH.exists) return null;
        MEMORY_MAPPING_PATH.encoding = "UTF-8"; // noms de styles accentues
        if (!MEMORY_MAPPING_PATH.open("r")) return null;
        var c = MEMORY_MAPPING_PATH.read();
        MEMORY_MAPPING_PATH.close();
        if (!c || c.replace(/\s/g, "") === "") return null;
        var m = deserializeFlatMapping(c);
        var hasKey = false;
        for (var k in m) { if (m.hasOwnProperty(k)) { hasKey = true; break; } }
        return hasKey ? m : null;
    } catch (eMemRead) {
        logError(eMemRead, "loadMemoryMapping");
        return null;
    }
}

/**
 * MEMOIRE DE TEST : ecrit le mapping sur disque a cote du script (mode "w",
 * qui ecrase l'existant). Un mapping vide est ecrit tel quel (fichier vide =
 * aucune memoire) : c'est ce qui permet au bouton "Reinitialiser" d'effacer
 * aussi la memoire. Ne lève jamais d'exception.
 */
function saveMemoryMapping(mapping) {
    try {
        MEMORY_MAPPING_PATH.encoding = "UTF-8"; // noms de styles accentues
        if (!MEMORY_MAPPING_PATH.open("w")) return false;
        MEMORY_MAPPING_PATH.write(serializeFlatMapping(mapping || {}));
        MEMORY_MAPPING_PATH.close();
        return true;
    } catch (eMemWrite) {
        logError(eMemWrite, "saveMemoryMapping");
        return false;
    }
}

/**
 * Verifie si le mapping est valide (tous les styles referes existent)
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

            var selectableNames = []; // en parallele des items ajoutes, null pour les entrees non selectionnables
            // Entree sentinelle en tete (index 0) : "non mappe". C'est le defaut
            // quand aucune correspondance n'existe, ce qui evite d'appliquer un
            // style arbitraire (typiquement le neutre) sans geste de l'utilisateur.
            dropdown.add("item", NOT_MAPPED_LABEL);
            selectableNames.push(null);
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
            // 3. Sinon, l'entrée sentinelle "— non mappé —" (index 0) : AUCUNE
            //    présélection arbitraire. L'ancienne règle 3 retenait "le premier
            //    style disponible à la racine" (souvent le style neutre) et
            //    appliquait donc un style SANS intervention de l'utilisateur —
            //    c'était la cause racine du symptôme "style neutralisé" du
            //    27/09/2026 (cf. doc/wiki_extendscript_indesign.md, Cas 25).
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

            dropdown.selection = 0; // defaut = "non mappe"
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
            // configuration à partir de zéro : présélection par convention HTML,
            // sinon "— non mappé —", sans les choix précédents.
            var saveResult = saveMappingToDocument({});
            logToFile("resetBtn.onClick: saveMappingToDocument({}) a retourné " + saveResult);
            // Memoire de test : "Reinitialiser" efface aussi la copie disque, sinon
            // elle resservirait immediatement (comportement contre-intuitif).
            logToFile("resetBtn.onClick: memoire disque effacee -> " + saveMemoryMapping({}));
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
                if (dropdown.selection === null || dropdown.selection.text.indexOf("── ") === 0) {
                    continue;
                }
                // Sentinelle "non mappé" : le tag reste volontairement ABSENT du
                // mapping => aucune affectation de style pour lui. Le repli neutre
                // de l'insertion (etape 2) reste inchangé : c'est lui qui journalise.
                if (dropdown.selection.text === NOT_MAPPED_LABEL) {
                    logToFile("M03-dialogue: tag=" + tag + " -> non mappe");
                    continue;
                }
                resultMapping[tag] = dropdown.selection.text;
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
    // présélection retombe sur la convention HTML, sinon "— non mappé —").
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
    // Borne portée à 9 à l'étape 2 de la mission 03 (décision FJD 26/09 : les vrais
    // titres vont jusqu'à hN ; MARKDOWN_TAGS propose désormais h1..h9, la cascade de
    // listes doit pouvoir s'y appuyer au même plafond).
    var maxAvailableTitleLevel = 0;
    for (var lvl = 1; lvl <= 9; lvl++) {
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

/**
 * MISSION 03 — reconstruction minimale, ÉTAPES 1 + 1bis + 2.
 * (COMMUNICATION/mission_03_reconstruction_minimale.md, décisions FJD 25-26/09)
 *
 * Cette fonction est une COPIE ISOLÉE : l'ancienne insertMarkdownWithStyles()
 * ci-dessus reste inchangée tant que la nouvelle n'est pas validée bout en bout.
 *
 * Ce qu'elle fait — rien d'autre :
 *   1. Construire fullText = textes des blocs joints par "\r" (blocs "table"
 *      IGNORÉS à ce stade, cf. mission étape 6 : ils reviendront plus tard).
 *   2. story.contents = "" puis UNE SEULE assignation à insertionPoints[-1]
 *      (mode cadre) ou à options.insertAt (mode curseur, story NON vidée).
 *   3. ÉTAPE 2 — appliquer à chaque paragraphe le style lu dans le mapping du
 *      document, par INDEX STABLE (n-ième bloc non-table = n-ième paragraphe,
 *      base = index du paragraphe portant le curseur en mode curseur). Style
 *      neutre (jamais d'échec) si une clé manque ou pointe un style inexistant.
 *      Aucun nom de style n'est codé en dur : tout vient du mapping.
 *
 * Ce qu'elle ne fait PAS (volontairement) : aucune table (étape 6), aucun bloc
 * de code (étape 7). Les segments inline (gras/italique) sont traités à l'étape
 * 4 et la cascade d'indentation des listes à l'étape 5, toutes deux plus bas
 * dans cette fonction. Chaque couche est réintroduite une à une, avec test réel
 * InDesign + commit git à chaque étape validée — jamais plusieurs couches d'un
 * coup.
 */
function insertMarkdownWithStyles_v2(story, blocks, mapping, options) {
    try {
        // Étape 1 : textes des blocs non-table collectés puis joints par un seul
        // "\r" entre chaque (formulation fidèle au snippet de la mission ; les
        // blocs "table" n'ont pas de .text — ils seraient sérialisés "undefined" —
        // et sont explicitement ignorés à ce stade, cf. étape 3).
        // ÉTAPE 4 : on pousse le texte PLAT du bloc (children concaténés), pas
        // block.text : les marqueurs inline sont ainsi RETIRÉS dès l'insertion
        // (aucun `**` résiduel visible), et les offsets des segments deviennent
        // exactement les offsets cumulés des children. Les blocs `code` gardent
        // leur texte brut (marqueurs compris) : voir getBlockPlainText().
        var textParts = [];
        for (var i = 0; i < blocks.length; i++) {
            if (blocks[i].type === "table") continue;
            textParts.push(getBlockPlainText(blocks[i]));
        }
        var blockCount = textParts.length;
        var fullText = textParts.join("\r");

        // Étape 1bis — mode d'invocation « curseur de texte » : on écrit à un
        // insertion point EXISTANT sans vider la story, pour ne pas écraser le
        // texte autour du curseur (cf. critère de réussite 1bis : « sans écraser
        // le texte existant autour du curseur »). En l'absence de options.insertAt
        // (mode TextFrame/Story déjà validé à l'étape 1), le comportement reste
        // STRICTEMENT identique à celui validé et commité (f3f6c68).
        var insertAtCursor = !!(options && options.insertAt);

        // Nombre de "\r" réellement présents dans fullText : c'est le SEUL
        // indicateur calculé en JS pur, donc totalement fiable, indépendant de
        // toute recomposition côté InDesign. Sert d'arbitre absolu du compteur.
        var crCount = 0;
        for (var crIdx = 0; crIdx < fullText.length; crIdx++) {
            if (fullText.charAt(crIdx) === "\r") crCount++;
        }

        // Log AVANT écriture : ce qu'on attend.
        logToFile("M03-etape1: blocs texte attendus=" + blockCount + " / total blocs parsés=" + blocks.length + " | fullText.length=" + fullText.length + " | crCount=" + crCount + " | insertAtCursor=" + insertAtCursor);

        // ÉTAPE 0bis (26/09/2026) — LECTURE FIABLE DU COMPTEUR.
        // `story.paragraphs` est une VUE DYNAMIQUE recalculée à l'accès, pas un
        // tableau figé (wiki Cas 22) : un `.length` lu directement juste après
        // une mutation de la story peut renvoyer une valeur périmée (wiki Cas
        // 23 : `.length` valait 0 après `contents = ""`). Le pattern sûr est de
        // forcer la résolution complète de la collection via
        // `everyItem().getElements()` puis de lire la longueur du snapshot.
        var paraCountBefore = 0;
        try { paraCountBefore = story.paragraphs.everyItem().getElements().length; } catch (ePB) { logError(ePB, "etape0bis paraCountBefore"); }

        if (!insertAtCursor) {
            story.contents = "";
        }

        // ÉTAPE 0bis — CAUSE RACINE IDENTIFIÉE le 26/09/2026 : le point
        // d'insertion doit être ré-obtenu APRÈS le vidage, jamais avant.
        // `story.contents = ""` recompose intégralement la story ; un
        // `insertionPoints[-1]` capturé avant cette recomposition reste une
        // référence stale. Écrire dans cette référence détachée fait bien
        // apparaître le texte à l'écran (constat visuel FJD : 3 paragraphes)
        // mais laisse la collection `paragraphs` de `story` dans son ancien
        // état → `story.paragraphs.length` rapportait `1` en mode TextFrame sur
        // les 7 tests du 26/09 (15:34→15:51) alors que le texte réel comptait
        // 3 paragraphes. Aucune anomalie en mode curseur (insertAtCursor=true)
        // car cette branche ne vide jamais la story.
        var targetPoint = insertAtCursor ? options.insertAt : story.insertionPoints[-1];

        // UNE SEULE assignation — le cœur du cas minimal.
        targetPoint.contents = fullText;

        // ÉTAPE 0bis — CAUSE RACINE DÉFINITIVE, confirmée par rejeu réel du
        // 26/09/2026 (16:39-16:40, 4 tirs) : en mode TextFrame, la référence
        // `story` capturée AVANT `story.contents = ""` reste un proxy PÉRIMÉ.
        // Preuves croisées des tirs :
        //   - tir 3 paragraphes   → snapshot(story)=3 | story.contents.length=0
        //   - tir 39 paragraphes  → snapshot(story)=9 | story.contents.length=0
        // alors que `targetPoint.contents.length` valait la taille réelle du
        // texte (636 / 4402) et que FJD a confirmé visuellement 3 PUIS 39
        // paragraphes. Le texte est intégralement inséré ; c'est la référence
        // `story` (poignée obsolète après recomposition) qui n'est plus peuplée.
        // → La SEULE source de vérité est le parent réel du point d'insertion.
        var liveStory = null;
        try { liveStory = targetPoint.parentStory; } catch (eLS) {}
        if (!liveStory) liveStory = story; // repli — signalé explicitement dans le log

        // Mesure DOM (peut encore être une vue dynamique, comme le prouve le
        // tir 39 : snapshot story=9 ≠ 39).
        var liveParaCount = -1;
        try { liveParaCount = liveStory.paragraphs.everyItem().getElements().length; } catch (eLP) { logError(eLP, "etape0bis liveParaCount"); }

        // Arbitre JS PUR, indépendant de TOUTE collection/vue dynamique du DOM :
        // on relit la chaîne réelle de la story vivante et on compte les "\r"
        // (fin de paragraphe en ExtendScript). Paragraphes = nb "\r" + 1.
        var liveContents = "";
        try { liveContents = liveStory.contents; } catch (eLC) {}
        var liveCrCount = 0;
        for (var lc = 0; lc < liveContents.length; lc++) {
            if (liveContents.charAt(lc) === "\r") liveCrCount++;
        }
        var liveParaFromCr = (liveContents.length === 0) ? 0 : (liveCrCount + 1);

        // Contrastes conservés pour l'audit : poignée périmée vs référence vivante.
        var straySnapshot = -1;
        try { straySnapshot = story.paragraphs.everyItem().getElements().length; } catch (eSS) {}
        var strayContentsLength = -1;
        try { strayContentsLength = story.contents.length; } catch (eSC) {}
        var targetContentsLength = -1;
        try { targetContentsLength = targetPoint.contents.length; } catch (eTC) {}

        // Attention : en mode curseur (insertAtCursor=true) on ne vide JAMAIS la
        // story, donc `targetPoint.parentStory === story` est le cas NORMAL — ce
        // n'est pas un repli. Le signal « REPLI » ne doit apparaître que quand
        // `parentStory` a réellement échoué ET qu'on a dû se rabattre sur `story`
        // dans un contexte où celle-ci peut être une poignée périmée (mode
        // TextFrame après vidage). Sinon le log crie au loup pour rien (constat
        // rejeu réel 26/09 16:58 : 2 tirs curseur tous deux étiquetés REPLI à tort).
        var isRealFallback = (liveStory === story) && !insertAtCursor;
        logToFile("M03-etape0bis: VERITE — source=targetPoint.parentStory" +
            (isRealFallback ? " (REPLI RÉEL sur story — parentStory indisponible !)" : "") +
            " | paragraphes(DOM snapshot)=" + liveParaCount + " | paragraphes(compte \\r sur contents reel)=" + liveParaFromCr +
            " | attendu(blocs)=" + blockCount + " | crCount(fullText)=" + crCount);
        logToFile("M03-etape0bis: contraste — story capturee AVANT vidage : snapshot=" + straySnapshot +
            " | contents.length=" + strayContentsLength + " || targetPoint.contents.length=" + targetContentsLength);
        logToFile("M03-etape1: apres assignation — paragraphes reels=" + liveParaFromCr + " (avant=" + paraCountBefore + ", blocs=" + blockCount + ", insertAtCursor=" + insertAtCursor + ")");

        // Le chiffre annoncé est celui de l'arbitre JS pur (infaillible). On
        // signale toute divergence avec l'attendu OU avec la mesure DOM.
        if (!insertAtCursor && liveParaFromCr !== blockCount) {
            logToFile("M03-etape1: DIVERGENCE — nb paragraphes reel (" + liveParaFromCr + ") != nb blocs (" + blockCount + "). Cause a isoler avant toute autre etape.");
        }
        if (liveParaCount !== -1 && liveParaCount !== liveParaFromCr) {
            logToFile("M03-etape0bis: ECART DOM/JS — snapshot(parentStory)=" + liveParaCount + " != compte \\r=" + liveParaFromCr + " (la vue dynamique DOM n'est pas fiable ; le compte JS fait foi).");
        }

        // -------------------------------------------------------------------
        // MISSION 03 — ÉTAPE 2 : MAPPING DES STYLES DE PARAGRAPHE
        // (COMMUNICATION/mission_03_reconstruction_minimale.md, décision FJD 26/09)
        //
        // Principe d'INDEX STABLE : le n-ième bloc NON-TABLE correspond au
        // n-ième paragraphe de la story. Les blocs "table" sont HORS de ce
        // compte (ils ne produisent aucun texte — traités à l'étape 6), c'est
        // déjà le filtre appliqué à la construction de fullText ci-dessus.
        //
        // Second point, non négociable : en mode curseur (insertAtCursor=true),
        // la story N'EST PAS vidée — les paragraphes préexistants restent et
        // notre texte s'insère AU MILIEU d'eux. L'index stable ne part donc PAS
        // de 0, mais de l'index du paragraphe qui PORTE le point d'insertion.
        // Cet index est relevé APRÈS l'assignation (targetPoint.paragraphs[0]
        // est relu sur l'état recomposé). S'il est illisible, on n'applique
        // AUCUN style (jamais de style au hasard sur le texte voisin) et on le
        // journalise explicitement.
        //
        // Hors périmètre de cette étape (assumé, cf. spec) : les segments
        // inline (gras/italique — étape 4) restent littéraux et VISIBLES ; les
        // listes imbriquées, les tables et les blocs de code ont leurs propres
        // étapes. Le type de bloc est ici utilisé TEL QUEL comme clé de mapping.
        // -------------------------------------------------------------------
        var styleBlocks = [];
        for (var sb = 0; sb < blocks.length; sb++) {
            if (blocks[sb].type === "table") continue;
            styleBlocks.push(blocks[sb]);
        }

        // Snapshot figé des paragraphes (même pattern qu'à l'étape 1 : la
        // collection est une vue dynamique, wiki Cas 22/23).
        var paraSnapshot = [];
        try { paraSnapshot = liveStory.paragraphs.everyItem().getElements(); } catch (ePS) { logError(ePS, "etape2 snapshot paragraphs"); }

        // Nombre de paragraphes que le texte insere occupe REELLEMENT :
        // crCount = nombre de \r de fullText ; chaque \r ferme un paragraphe et
        // le dernier paragraphe est complet => N = crCount + 1 (si texte non vide).
        var insertedParaCount = (fullText.length > 0) ? (crCount + 1) : 0;

        var baseParaIndex = 0;
        var baseIndexKnown = true;
        if (insertAtCursor) {
            // DÉCISION FJD (27/09) — SOUSTRACTION, PAS D'OFFSET DEVINÉ.
            // `targetPoint.paragraphs[0].index` N'EST PAS un numéro de paragraphe :
            // le réel a mesuré 671 pour 42 paragraphes et 1344 pour 65 paragraphes,
            // soit exactement l'offset CARACTÈRE du curseur (doc Adobe :
            // InsertionPoint.index / Paragraph.index = « the index of the text in
            // the collection or parent object »). Un tableau indexé par paragraphe
            // n'est donc pas adressable avec cette valeur.
            // Méthode retenue : le texte inséré occupe les N DERNIERS paragraphes
            // (mode curseur = insertion, la story n'est pas vidée) =>
            //     base = story_total - N
            // Contrôle sur le log réel : 42-21=21 et 65-21=44 = les « paragraphes
            // avant » du log. Aucune valeur en dur, tout est déduit.
            baseParaIndex = paraSnapshot.length - insertedParaCount;
            if (baseParaIndex < 0) baseParaIndex = 0;
            var indexAffiche = "?";
            try { indexAffiche = targetPoint.paragraphs[0].index; } catch (eBPI) { logError(eBPI, "etape2 index frontiere curseur"); }
            logToFile("M03-etape2: frontiere curseur — story_total=" + paraSnapshot.length
                + " paragraphes_inseres=" + insertedParaCount
                + " => baseParSoustraction=" + baseParaIndex
                + " | indexAffiche(inutilisable, offset caractere)=" + indexAffiche
                + " contents.length=" + ("" + targetPoint.contents).length);
            if (baseParaIndex <= 0 && paraSnapshot.length > insertedParaCount) {
                baseIndexKnown = false;
                logToFile("M03-etape2: ABANDON — soustraction incoherente (base=0 alors que la story contient des paragraphes avant le bloc insere). Aucun style applique (jamais au hasard sur le texte voisin).");
            }
        }

        // Style neutre lu par index 0 de la collection du document (jamais un
        // nom localisé en dur — corollaire du Cas 05 du wiki).
        var neutralPara = null;
        try { neutralPara = app.activeDocument.paragraphStyles.item(0); } catch (eNP2) { logError(eNP2, "etape2 lecture style neutre"); }
        var neutralParaLabel = safeStyleName(neutralPara, "?");

        var appliedCount = 0;
        var neutralCount = 0;
        var ecarts = 0;

        // -------------------------------------------------------------------
        // MISSION 03 — ÉTAPE 5 : LISTES (CASCADE D'INDENTATION)
        //
        // La cascade existe DÉJÀ, écrite et documentée :
        // getLiStyleForIndentLevel(block, mapping) (mission_02, section
        // « APPLICATION DES STYLES »). La spec de l'étape 5 demande de la
        // RÉUTILISER TELLE QUELLE — aucun nouveau code de décision ici, on
        // remplace seulement la résolution « mapping[type] » par la cascade
        // pour les blocs de type `li`.
        //
        // RÉVISION DU 27/09/2026 (option 1, décision FJD) : la règle « puce
        // entièrement en gras ⇒ titre synthétique » a été supprimée — une puce
        // reste une puce à TOUS les niveaux, et le gras qu'elle contient est du
        // gras INLINE (traité à l'étape 4, via sa clé `bold`). Il n'existe plus
        // qu'une seule provenance de titre : le vrai `#`. En conséquence, un
        // style de TITRE ne peut apparaître ici que par la cascade documentée
        // (étape 2 ci-dessus), jamais par conversion d'une puce grasse.
        //
        // Compteurs de contrôle : combien de puces par niveau d'indentation,
        // et combien d'items numérotés (type `li_num`, style de liste distinct
        // de la puce). Le style effectivement RETENU par la cascade est
        // mémorisé par niveau (le premier rencontré) pour être journalisé :
        // c'est ce qui permet de VOIR si un niveau tombe dans la cascade de
        // titres ou retombe sur la puce racine.
        // -------------------------------------------------------------------
        var liCountByLevel = {};
        var liNumCount = 0;
        var liStyleByLevel = {};

        if (baseIndexKnown) {
            for (var pb = 0; pb < styleBlocks.length; pb++) {
                var bloc = styleBlocks[pb];
                var paraIndex = baseParaIndex + pb;
                var paraObj = paraSnapshot[paraIndex];

                if (!paraObj) {
                    ecarts++;
                    logToFile("M03-etape2: ECART — bloc #" + pb + " (" + bloc.type + ") : paragraphe introuvable a l'index " + paraIndex + " (snapshot=" + paraSnapshot.length + ")");
                    continue;
                }

                // Style DEMANDÉ : clé = type de bloc, valeur = nom de style du
                // mapping du document. Aucun nom de style n'est codé en dur.
                // ÉTAPE 5 : pour une puce, ce n'est plus `mapping["li"]` mais le
                // résultat de la cascade d'indentation (style de liste dédié au
                // niveau, sinon cascade de titres plafonnée au plus haut titre
                // réellement mappé, sinon puce racine). Le niveau 0 rend
                // exactement `mapping["li"]` — comportement identique à avant.
                var demande = null;
                if (bloc.type === "li") {
                    try { demande = getLiStyleForIndentLevel(bloc, mapping); } catch (eLi) { logError(eLi, "etape5 getLiStyleForIndentLevel bloc #" + pb); demande = (mapping && mapping["li"]) ? mapping["li"] : null; }
                    var liLevel = bloc.indentLevel || 0;
                    liCountByLevel[liLevel] = (liCountByLevel[liLevel] || 0) + 1;
                    if (!liStyleByLevel[liLevel]) liStyleByLevel[liLevel] = (demande ? demande : "(absent)");
                } else {
                    if (bloc.type === "li_num") liNumCount++;
                    demande = (mapping && mapping[bloc.type]) ? mapping[bloc.type] : null;
                }
                var styleObj = null;
                if (demande) {
                    try { styleObj = findParagraphStyleByName(demande); } catch (eFind) { logError(eFind, "etape2 findParagraphStyleByName"); }
                }

                if (styleObj) {
                    try {
                        paraObj.applyParagraphStyle(styleObj, true);
                        var relu = safeStyleName(paraObj.appliedParagraphStyle, "?");
                        appliedCount++;
                        logToFile("M03-etape2: bloc #" + pb + " type=" + bloc.type + " paraIndex=" + paraIndex +
                            " demande='" + demande + "' relu='" + relu + "'");
                    } catch (eApply) {
                        ecarts++;
                        logError(eApply, "etape2 applyParagraphStyle bloc #" + pb);
                    }
                } else {
                    // Clé absente OU style introuvable : on n'échoue JAMAIS, on
                    // applique le style neutre et on journalise le motif exact.
                    neutralCount++;
                    logToFile("M03-etape2: pas de style pour " + bloc.type + ", neutre applique");
                    if (neutralPara) {
                        try {
                            paraObj.applyParagraphStyle(neutralPara, true);
                            var reluNeutre = safeStyleName(paraObj.appliedParagraphStyle, "?");
                            logToFile("M03-etape2: bloc #" + pb + " type=" + bloc.type + " paraIndex=" + paraIndex +
                                " demande='" + (demande ? demande : "(absent)") + "' relu='" + reluNeutre + "' (neutre attendu='" + neutralParaLabel + "')");
                        } catch (eNeut) {
                            ecarts++;
                            logError(eNeut, "etape2 applyParagraphStyle neutre bloc #" + pb);
                        }
                    }
                }
            }
        }

        // -------------------------------------------------------------------
        // MISSION 03 — ÉTAPE 5 : journal de contrôle de la cascade de listes.
        // `li0`, `li1`, `li2`… = nombre de puces par niveau d'indentation ;
        // `styles_li` = style RETENU par niveau (premier rencontré) — c'est là
        // qu'on voit si un niveau est allé chercher un style de titre via la
        // cascade ou s'il est retombé sur la puce racine ; `li_num` = items
        // numérotés (style distinct de la puce).
        // Alerte dédiée si une puce a reçu un style de TITRE : depuis l'option 1
        // (27/09/2026) cela ne peut venir QUE de la cascade documentée, jamais
        // d'une conversion de puce grasse — on le nomme pour que ce soit visible.
        // -------------------------------------------------------------------
        // Quels noms de styles sont des styles de TITRE effectivement mappés ?
        // Sert uniquement au compteur `cascade_titres` : un niveau > 0 dont le
        // style retenu tombe dans cet ensemble est passé par la cascade de titres.
        var mappedTitleStyleNames = {};
        for (var mtLvl = 1; mtLvl <= 9; mtLvl++) {
            var mtName = (mapping && mapping["h" + mtLvl]) ? mapping["h" + mtLvl] : null;
            if (mtName) mappedTitleStyleNames[mtName] = true;
        }
        var liCountStr = "";
        var liStyleStr = "";
        var liParCascade = 0;
        for (var liLvl = 0; liLvl <= 8; liLvl++) {
            if (liCountByLevel[liLvl]) liCountStr += "li" + liLvl + "=" + liCountByLevel[liLvl] + " ";
            if (liStyleByLevel[liLvl]) {
                liStyleStr += liLvl + ":'" + liStyleByLevel[liLvl] + "' ";
                if (liLvl > 0 && mappedTitleStyleNames[liStyleByLevel[liLvl]]) liParCascade += 1;
            }
        }
        logToFile("M03-etape5: " + (liCountStr ? liCountStr.replace(/\s+$/, " ") : "aucune puce ") +
            "li_num=" + liNumCount +
            " | styles_li=[" + (liStyleStr ? liStyleStr.replace(/\s+$/, "") : "aucun") + "]" +
            (liParCascade > 0 ? " cascade_titres=" + liParCascade : ""));

        // -------------------------------------------------------------------
        // SONDE CIBLEE (27/09/2026, run 15:49). Le symptome reel rapporte par
        // FJD (« contamination + dernier paragraphe en standard ») est la
        // signature d'un decalage d'UN cran, pas d'une erreur d'arithmetique :
        // le delta +84 du run est NORMAL (les 85 lignes ne creent que 84
        // frontieres nouvelles, la 1re ligne reutilise un paragraphe existant).
        // Le log de fenetre est AVEUGLE par construction (il relit
        // paraSnapshot[base+pb] et le compare au meme bloc). On dumpe donc le
        // CONTENU + le STYLE des paragraphes VOISINS de la frontiere et de la
        // FIN : le contenu localise le cran sans ambiguite.
        // Sonde temporaire, ASCII seul, a retirer a l'etape 8.
        // -------------------------------------------------------------------
        // SONDE v2 (27/09/2026, run 16:27) : la v1 a disculpe la boucle
        // (para[171] = bloc #0, para[255] = bloc #84, ecarts=0, neutre=0).
        // On emet maintenant une CARTE des styles en plages (run-length) sur
        // TOUTE la story, plus le nombre de paragraphes relus en direct :
        // une seule ligne suffit a voir tout decalage ou tout trou.
        // Sonde temporaire, ASCII seul, a retirer a l'etape 8.
        var liveNowLen = -1;
        try { liveNowLen = liveStory.paragraphs.everyItem().getElements().length; } catch (eLN) {}
        logToFile("M03-sonde2: snapshot=" + paraSnapshot.length + " liveNow=" + liveNowLen + " base=" + baseParaIndex);
        var mapParts = [];
        var mapRunStyle = null;
        var mapRunStart = 0;
        for (var mi = 0; mi < paraSnapshot.length; mi++) {
            var miStyle = "?";
            try { miStyle = safeStyleName(paraSnapshot[mi].appliedParagraphStyle, "?"); } catch (eMS) {}
            if (miStyle !== mapRunStyle) {
                if (mapRunStyle !== null) {
                    mapParts.push(mapRunStart + (mapRunStart === mi - 1 ? "" : "-" + (mi - 1)) + "=" + mapRunStyle);
                }
                mapRunStyle = miStyle;
                mapRunStart = mi;
            }
        }
        if (mapRunStyle !== null) {
            mapParts.push(mapRunStart + (mapRunStart === paraSnapshot.length - 1 ? "" : "-" + (paraSnapshot.length - 1)) + "=" + mapRunStyle);
        }
        logToFile("M03-carte: n=" + paraSnapshot.length + " base=" + baseParaIndex + " | " + mapParts.join(" "));

        // -------------------------------------------------------------------
        // ÉTAPE 3 — COMPTEUR DES TITRES (décision FJD 26/09/2026, révisée le
        // 27/09/2026 — option 1). Il n'existe plus qu'UNE provenance de titre :
        // le vrai #/##/###... (l'ancienne conversion « puce entièrement en gras »
        // a été supprimée). Le drapeau `synthetic` a donc disparu du code.
        // On compte aussi les dérives (« derive ») : un titre "hN" dont le niveau
        // dépasse le plus haut niveau mappé/offert par le dialogue (h9) — ce n'est
        // PAS un échec, le bloc reçoit le style neutre comme tout tag non mappé.
        // -------------------------------------------------------------------
        var hRealCounts = {};
        var hDeriveCounts = {};
        var maxMappedHeading = 0;
        for (var lvlProbe = 1; lvlProbe <= 9; lvlProbe++) {
            var tagProbe = "h" + lvlProbe;
            if (mapping && mapping[tagProbe] && findParagraphStyleByName(mapping[tagProbe])) {
                maxMappedHeading = lvlProbe;
            }
        }
        for (var hb = 0; hb < blocks.length; hb++) {
            var hBloc = blocks[hb];
            if (!hBloc || !/^h\d+$/.test(hBloc.type)) continue;
            var hLevel = parseInt(hBloc.type.substring(1), 10);
            hRealCounts[hLevel] = (hRealCounts[hLevel] || 0) + 1;
            if (hLevel > maxMappedHeading) {
                hDeriveCounts[hLevel] = (hDeriveCounts[hLevel] || 0) + 1;
            }
        }
        var hRealStr = "";
        var hDeriveStr = "";
        var deriveTotal = 0;
        for (var lvlStr = 1; lvlStr <= 12; lvlStr++) {
            if (hRealCounts[lvlStr]) hRealStr += "h" + lvlStr + "=" + hRealCounts[lvlStr] + " ";
            if (hDeriveCounts[lvlStr]) { hDeriveStr += "h" + lvlStr + "=" + hDeriveCounts[lvlStr] + " "; deriveTotal += hDeriveCounts[lvlStr]; }
        }
        logToFile("M03-etape3: titres reels [" + (hRealStr ? hRealStr.replace(/\s+$/, "") : "aucun") +
            "] maxMappe=h" + maxMappedHeading +
            " derives=" + deriveTotal + (hDeriveStr ? " [" + hDeriveStr.replace(/\s+$/, "") + "]" : ""));

        // -------------------------------------------------------------------
        // MISSION 03 — ÉTAPE 4 : SEGMENTS INLINE (GRAS / ITALIQUE)
        // (COMMUNICATION/mission_03_reconstruction_minimale.md, décision FJD)
        //
        // Le texte inséré est déjà SANS marqueurs (fullText est construit sur
        // getBlockPlainText). Reste à appliquer le style de CARACTÈRE mappé sur
        // la plage de caractères de chaque segment.
        //
        // OFFSETS : relatifs au paragraphe, 0 = premier caractère. C'est
        // l'offset EXACT du segment dans la story, parce qu'un marqueur inline
        // ne traverse jamais un "\r" : le découpage en blocs a eu lieu AVANT
        // parseInlineMarkdown, donc chaque bloc est un paragraphe, et l'offset
        // absolu dans la story vaut simplement (base + rang du bloc) pour le
        // paragraphe, et l'offset cumulé des children pour le caractère.
        //
        // ORDRE DES PASSES — le gras d'abord, l'italique ENSUITE. Un caractère
        // à la fois gras ET italique ne peut porter qu'UN seul
        // appliedCharacterStyle (il n'existe pas de style combiné dans le
        // mapping) : l'italique l'emporte, ce qui PRÉSERVE LE CONTRASTE VISUEL
        // voulu par l'auteur (laisser le gras seul rendrait le segment
        // identique à son voisinage). Le recouvrement est compté et journalisé
        // (`imbriques`) : ce n'est pas un arbitrage silencieux.
        //
        // HORS PÉRIMÈTRE : blocs `code` (texte jamais interprété) et `table`
        // (cellules non gérées, étape 6).
        // -------------------------------------------------------------------
        var boldStyleName = (mapping && mapping["bold"]) ? mapping["bold"] : null;
        var italicStyleName = (mapping && mapping["italic"]) ? mapping["italic"] : null;
        var boldCharStyle = null;
        var italicCharStyle = null;
        if (boldStyleName) { try { boldCharStyle = findCharacterStyleByName(boldStyleName); } catch (eBCS) { logError(eBCS, "etape4 findCharacterStyleByName bold"); } }
        if (italicStyleName) { try { italicCharStyle = findCharacterStyleByName(italicStyleName); } catch (eICS) { logError(eICS, "etape4 findCharacterStyleByName italic"); } }
        if (boldStyleName && !boldCharStyle) logToFile("M03-etape4: style de caractere gras introuvable ('" + boldStyleName + "') — segments gras ignores");
        if (italicStyleName && !italicCharStyle) logToFile("M03-etape4: style de caractere italique introuvable ('" + italicStyleName + "') — segments italiques ignores");
        if (!boldStyleName) logToFile("M03-etape4: cle 'bold' absente du mapping — segments gras ignores");
        if (!italicStyleName) logToFile("M03-etape4: cle 'italic' absente du mapping — segments italiques ignores");

        var segApplied = 0;
        var segImbriques = 0;
        var segDebordements = 0;
        var segResiduels = 0;
        var segBlocksAvecSegments = 0;

        if (baseIndexKnown) {
            for (var sb2 = 0; sb2 < styleBlocks.length; sb2++) {
                var sBloc = styleBlocks[sb2];
                if (sBloc.type === "code" || sBloc.type === "table") continue;
                var sChildren = sBloc.children;
                if (!sChildren || sChildren.length === 0) continue;

                var sPlain = getBlockPlainText(sBloc);
                var sPlainLen = sPlain.length;
                // Marqueurs non consommés : un `*` restant dans le texte plat
                // signale un marqueur orphelin (appariement impossible).
                // Les `_` ne sont PAS comptés : `mot_gras_isole` en contient
                // légitimement deux et doit rester intact (contrôle FJD).
                for (var sr = 0; sr < sPlainLen; sr++) {
                    if (sPlain.charAt(sr) === "*") segResiduels++;
                }

                var sPara = paraSnapshot[baseParaIndex + sb2];
                if (!sPara || sPlainLen === 0) continue;

                // 1. Plages (offsets relatifs au paragraphe).
                var sRuns = [];
                var sCursor = 0;
                var sHasSeg = false;
                for (var sc = 0; sc < sChildren.length; sc++) {
                    var sChild = sChildren[sc];
                    var sLen = ("" + sChild.text).length;
                    if (sLen > 0) {
                        var sBold = !!sChild.isBold;
                        var sItalic = !!sChild.isItalic;
                        sRuns.push({ start: sCursor, end: sCursor + sLen, bold: sBold, italic: sItalic });
                        if (sBold || sItalic) sHasSeg = true;
                        if (sBold && sItalic) segImbriques += sLen;
                    }
                    sCursor += sLen;
                }
                if (!sHasSeg) continue;
                segBlocksAvecSegments++;

                // 2. Application — passe gras, puis passe italique (cf. supra).
                for (var passB = 0; passB < 2; passB++) {
                    var passStyle = (passB === 0) ? boldCharStyle : italicCharStyle;
                    var passFlag = (passB === 0) ? "bold" : "italic";
                    if (!passStyle) continue;
                    for (var sa = 0; sa < sRuns.length; sa++) {
                        var aRun = sRuns[sa];
                        if (!aRun[passFlag]) continue;
                        if (aRun.end - 1 < aRun.start) continue;
                        try {
                            sPara.characters.itemByRange(aRun.start, aRun.end - 1).appliedCharacterStyle = passStyle;
                            segApplied++;
                        } catch (eApplySeg) {
                            segDebordements++;
                            logError(eApplySeg, "etape4 applyCharacterStyle bloc #" + sb2 + " [" + aRun.start + "," + (aRun.end - 1) + "]");
                        }
                    }
                }

                // 3. Contrôle : relecture des caractères du paragraphe. Un
                //    débordement = un caractère stylé qui ne devrait pas l'être
                //    (ou l'inverse). Attendus : italique = toutes les plages
                //    italiques ; gras = les plages grasses NON italiques
                //    (l'italique l'emportant sur le recouvrement).
                var expBold = 0;
                var expItalic = 0;
                for (var se = 0; se < sRuns.length; se++) {
                    var eRun = sRuns[se];
                    var eLen = eRun.end - eRun.start;
                    if (eRun.italic) expItalic += eLen;
                    if (eRun.bold && !eRun.italic) expBold += eLen;
                }
                var actBold = 0;
                var actItalic = 0;
                var sRange = null;
                try { sRange = sPara.characters.itemByRange(0, sPlainLen - 1); } catch (eSR) { logError(eSR, "etape4 plage de relecture"); }
                if (sRange) {
                    var sChars = [];
                    try { sChars = sRange.characters.everyItem().getElements(); } catch (eSC2) { logError(eSC2, "etape4 relecture characters"); }
                    for (var sk = 0; sk < sChars.length; sk++) {
                        var sName = safeStyleName(sChars[sk].appliedCharacterStyle, "?");
                        if (boldStyleName && sName === boldStyleName) actBold++;
                        if (italicStyleName && sName === italicStyleName) actItalic++;
                    }
                }
                if (actBold !== expBold || actItalic !== expItalic) {
                    segDebordements++;
                    logToFile("M03-etape4: ECART bloc #" + sb2 + " type=" + sBloc.type +
                        " attendu(gras=" + expBold + " ital=" + expItalic + ") relu(gras=" + actBold + " ital=" + actItalic + ")");
                } else {
                    logToFile("M03-etape4: bloc #" + sb2 + " type=" + sBloc.type + " paraIndex=" + (baseParaIndex + sb2) +
                        " gras=" + expBold + " ital=" + expItalic + " relu conforme");
                }
            }
        }

        logToFile("M03-etape4: segments appliques=" + segApplied + " residuels=" + segResiduels +
            " debordements=" + segDebordements + " | blocs_avec_segments=" + segBlocksAvecSegments +
            " imbriques=" + segImbriques +
            (segImbriques > 0 ? " (italique prioritaire sur le gras : un seul style de caractere possible)" : ""));

        // Compteur UNIQUE (spec : « paragraphes attendus / réels »). En mode
        // cadre, base=0 et la story ne contient QUE notre import ⇒ reels doit
        // valoir exactement le nombre de blocs, sinon c'est un ecart reel.
        // En mode curseur, la story n'est pas vidée : on isole donc la FENETRE
        // stylée [base, base+n) et on compte séparément ce qui la précède et ce
        // qui la suit — un reste non nul n'est PAS une anomalie (texte
        // préexistant), c'est pourquoi il est libellé, pas confondu avec reels.
        var reelsRelatifs = 0;
        try { reelsRelatifs = paraSnapshot.length - baseParaIndex; } catch (eRR) {}
        if (reelsRelatifs < 0) reelsRelatifs = 0;
        var avantFenetre = (baseIndexKnown && baseParaIndex > 0) ? baseParaIndex : 0;
        var apresFenetre = 0;
        try { apresFenetre = paraSnapshot.length - (baseParaIndex + styleBlocks.length); } catch (eAF) {}
        if (apresFenetre < 0) apresFenetre = 0;
        logToFile("M03-etape2: blocs=" + styleBlocks.length + " paragraphes attendus=" + styleBlocks.length +
            " reels=" + reelsRelatifs + " ecarts=" + ecarts +
            " | mode=" + (insertAtCursor ? "curseur" : "cadre") + " base=" + baseParaIndex +
            " story_total=" + paraSnapshot.length + " styles=" + appliedCount + " neutre=" + neutralCount +
            " baseIndexConnu=" + baseIndexKnown +
            (insertAtCursor ? " avant_fenetre=" + avantFenetre + " apres_fenetre=" + apresFenetre : ""));

        return true;

    } catch (e) {
        logError(e, "insertMarkdownWithStyles_v2");
        alertUser("Erreur (v2 étape 1) : " + e.message);
        return false;
    }
}

/**
 * MISSION 03 étape 1bis — Décrit le type de l'élément de sélection.
 * Sert à journaliser le type EXACT de app.selection[0] dans chacun des modes
 * d'invocation (cadre sélectionné, curseur de texte, outil flèche), point 1 de
 * la section « Étape 1bis » de la mission. Aucune hypothèse : on teste par
 * instanceof (classes du DOM InDesign) et on retombe sur constructor.name.
 */
function describeSelectionItem(item) {
    var parts = [];
    try { parts.push("TextFrame=" + (item instanceof TextFrame)); } catch (e1) { parts.push("TextFrame=?") ; }
    try { parts.push("Text=" + (item instanceof Text)); } catch (e2) { parts.push("Text=?") ; }
    try { parts.push("InsertionPoint=" + (item instanceof InsertionPoint)); } catch (e3) { parts.push("InsertionPoint=?") ; }
    try { parts.push("Story=" + (item instanceof Story)); } catch (e4) { parts.push("Story=?") ; }
    try { parts.push("constructor=" + item.constructor.name); } catch (e5) { parts.push("constructor=?") ; }
    return parts.join(" ");
}

/**
 * MISSION 03 étape 1bis — Détermine le story cible et le point d'insertion à
 * partir de l'état de sélection InDesign, sans JAMAIS supposer un TextFrame
 * explicitement sélectionné comme objet (point 2 de la section « Étape 1bis »).
 *
 * Modes couverts :
 *   - TextFrame sélectionné (outil flèche ou outil Texte sur le cadre) →
 *     story = item.texts[0] (chemin validé à l'étape 1), insertion en fin de
 *     story après vidage.
 *   - Curseur de texte actif (mode édition) → item est un InsertionPoint ; on
 *     dérive le story via la propriété documentée parentStory
 *     (indesignjs.de/extendscriptAPI — InsertionPoint.parentStory : « Story |
 *     readonly | The story that contains the text ») et on insère AU POINT DU
 *     CURSEUR, sans vider la story.
 *   - Plage de texte sélectionnée → item est un Text ; même dérivation
 *     (Text.parentStory), insertion au début de la plage sélectionnée.
 *   - Story directement sélectionnée → traitée comme le cas TextFrame.
 *
 * Retourne { story: Story, mode: String, insertAt: InsertionPoint|null } ou
 * null si aucun story exploitable (→ main() échoue proprement, point 3).
 */
function resolveTargetStory(selection) {
    if (!selection || selection.length === 0) {
        logToFile("M03-etape1bis: selection vide (length=0) — aucun story exploitable");
        return null;
    }

    var item = selection[0];
    logToFile("M03-etape1bis: app.selection[0] → " + describeSelectionItem(item) + " | selection.length=" + selection.length);

    var story = null;
    var mode = "";
    var insertAt = null;

    if (item instanceof TextFrame) {
        // Modes « outil flèche » et « outil Texte sur le cadre » : même type
        // retourné. Chemin strictement identique à l'étape 1 validée.
        story = item.texts[0];
        mode = "TextFrame";
    } else if (item instanceof InsertionPoint) {
        story = item.parentStory;
        insertAt = item;
        mode = "InsertionPoint";
    } else if (item instanceof Text) {
        story = item.parentStory;
        insertAt = item.insertionPoints[0];
        mode = "Text";
    } else if (item instanceof Story) {
        story = item;
        mode = "Story";
    } else {
        // Outils « flèche blanche » (sélection directe) et cas assimilés :
        // l'élément sélectionné peut être un PageItem PORTEUR DE TEXTE sans
        // être lui-même un TextFrame (contour, chemin, groupe…). Décision FJD
        // (26/09) : « il fallait étendre à … flèche blanche, peut-être voir
        // tout outil ». On tente une récupération par le texte contenu AVANT
        // d'abandonner — aucune supposition : si aucune histoire n'en sort,
        // c'est un échec propre.
        var carrierStory = null;
        try { if (item.texts && item.texts.length > 0) carrierStory = item.texts[0]; } catch (eGT) {}
        try { if (!carrierStory && item.parentStory) carrierStory = item.parentStory; } catch (eGP) {}
        if (carrierStory) {
            story = carrierStory;
            // Même comportement que le mode TextFrame (vidage puis insertion) :
            // on réutilise donc l'étiquette « TextFrame » pour que main()
            // classe ce cas en « cadre » sans logique dupliquée.
            mode = "TextFrame";
            logToFile("M03-etape1bis: PageItem porteur de texte (fleche blanche ?) — story recuperee via texts[0]/parentStory");
        } else {
            logToFile("M03-etape1bis: type non géré — échec propre");
            return null;
        }
    }

    if (!story) {
        logToFile("M03-etape1bis: type reconnu (mode=" + mode + ") mais aucun story exploitable — échec propre");
        return null;
    }

    var paraBefore = "?";
    try { paraBefore = story.paragraphs.length; } catch (eBefore) {}
    logToFile("M03-etape1bis: mode=" + mode + " | paragraphes avant=" + paraBefore);

    return { story: story, mode: mode, insertAt: insertAt };
}

/**
 * Lit le nom d'un objet style InDesign sans jamais lever d'exception.
 * Utilisé par l'étape 1ter pour journaliser nominativement les styles lus
 * (cf. décision FJD : « ce qui a été retiré est journalisé nominativement »).
 */
function safeStyleName(styleObj, fallback) {
    try {
        if (styleObj === undefined || styleObj === null) return fallback;
        // Les accesseurs applied*Style renvoient « StyleObject | String » (doc
        // officielle : « Can return: CharacterStyle or String ») : une valeur
        // chaîne est le NOM du style, pas un objet porteur de .name.
        if (typeof styleObj === "string") return styleObj;
        var n = styleObj.name;
        if (n === undefined || n === null) return fallback;
        return String(n);
    } catch (e) {
        return fallback;
    }
}

/**
 * MISSION 03 étape 1ter — Check + nettoyage des styles courants au trigger.
 *
 * État de l'art (doc officielle indesignjs.de — build InDesign 2026 / 21.5.1) :
 *   - Caractère  : Text.appliedCharacterStyle (r/w), Text.styleOverridden (ro)
 *   - Paragraphe : Text.appliedParagraphStyle (r/w), Text.applyParagraphStyle(using, clearingOverrides)
 *   - Objet      : TextFrame.appliedObjectStyle (r/w), TextFrame.applyObjectStyle(using, clearingOverrides, clearingOverridesThroughRootObjectStyle), TextFrame.clearObjectStyleOverrides()
 *   - Table/Cell : Table.appliedTableStyle + clearTableStyleOverrides() ; Cell.appliedCellStyle + clearCellStyleOverrides(clearingOverridesThroughRootCellStyle)
 *   - Aucun clearCharacterStyleOverrides()/clearParagraphStyleOverrides() n'existe → remise à neutre par réaffectation du style neutre.
 *
 * Ordre imposé par la spec : (1) détecter + journaliser, (2) remettre à neutre, (3) mapping (fait ailleurs, dans main()).
 * Périmètre : objet et table/cellule UNIQUEMENT si un cadre ou une table/cellule est réellement visé (aucun balayage global).
 * Les styles neutres sont lus via document.characterStyles.item(0) / paragraphStyles.item(0) /
 * objectStyles.item(0) — jamais un nom localisé en dur (corollaire Cas 05 du wiki).
 */
function checkAndCleanStylesAtTrigger(selection, doc, resolved) {
    if (!doc) return;

    var item = (selection && selection.length > 0) ? selection[0] : null;

    // ---- Passe 1 : DÉTECTER + JOURNALISER (aucune modification ici) ----
    logToFile("M03-etape1ter: === CHECK STYLES AU TRIGGER (avant toute modification) ===");

    var neutralCharStyle = null;
    var neutralParaStyle = null;
    var neutralObjStyle = null;
    try { neutralCharStyle = doc.characterStyles.item(0); } catch (eNC) { logError(eNC, "etape1ter lecture neutralCharStyle"); }
    try { neutralParaStyle = doc.paragraphStyles.item(0); } catch (eNP) { logError(eNP, "etape1ter lecture neutralParaStyle"); }
    try { neutralObjStyle = doc.objectStyles.item(0); } catch (eNO) { logError(eNO, "etape1ter lecture neutralObjStyle"); }

    var neutralCharName = safeStyleName(neutralCharStyle, "?");
    var neutralParaName = safeStyleName(neutralParaStyle, "?");
    var neutralObjName = safeStyleName(neutralObjStyle, "?");
    logToFile("M03-etape1ter: styles neutres du document -> caractere='" + neutralCharName + "' paragraphe='" + neutralParaName + "' objet='" + neutralObjName + "'");

    // Cible texte pour lecture caractère/paragraphe : le point d'insertion résolu
    // (mode curseur/plage) sinon le texte du cadre visé.
    var textTarget = null;
    if (resolved && resolved.insertAt) {
        textTarget = resolved.insertAt;
    } else if (item instanceof Text) {
        textTarget = item;
    } else if (item instanceof TextFrame) {
        try { textTarget = item.texts[0]; } catch (eTT) { logError(eTT, "etape1ter lecture textTarget"); }
    }

    // Famille 1 — CARACTÈRE
    var curCharStyle = null;
    var curCharName = "";
    if (textTarget) {
        try { curCharStyle = textTarget.appliedCharacterStyle; } catch (eCC) { logError(eCC, "etape1ter lecture appliedCharacterStyle"); }
        curCharName = safeStyleName(curCharStyle, "?");
        var charOverridden = "?";
        try { charOverridden = textTarget.styleOverridden; } catch (eCO) { logError(eCO, "etape1ter lecture styleOverridden"); }
        logToFile("M03-etape1ter: [caractere] applique='" + curCharName + "' overridden=" + charOverridden + " (neutre attendu='" + neutralCharName + "')");
    } else {
        logToFile("M03-etape1ter: [caractere] aucun textTarget exploitable -> famille ignoree");
    }

    // Famille 2 — PARAGRAPHE
    var curParaStyle = null;
    var curParaName = "";
    if (textTarget) {
        try { curParaStyle = textTarget.appliedParagraphStyle; } catch (ePC) { logError(ePC, "etape1ter lecture appliedParagraphStyle"); }
        curParaName = safeStyleName(curParaStyle, "?");
        logToFile("M03-etape1ter: [paragraphe] applique='" + curParaName + "' (neutre attendu='" + neutralParaName + "')");
    } else {
        logToFile("M03-etape1ter: [paragraphe] aucun textTarget exploitable -> famille ignoree");
    }

    // Famille 3 — OBJET (uniquement si un cadre est réellement visé)
    var objectTarget = (item instanceof TextFrame) ? item : null;
    var curObjName = "";
    if (objectTarget) {
        var curObjStyle = null;
        try { curObjStyle = objectTarget.appliedObjectStyle; } catch (eOC) { logError(eOC, "etape1ter lecture appliedObjectStyle"); }
        curObjName = safeStyleName(curObjStyle, "?");
        logToFile("M03-etape1ter: [objet] cadre vise -> applique='" + curObjName + "' (neutre attendu='" + neutralObjName + "')");
    } else {
        logToFile("M03-etape1ter: [objet] aucun cadre vise -> famille non declenchee (pas de balayage global)");
    }

    // Famille 4 — TABLE / CELLULE (uniquement si réellement visée)
    var tableTarget = (item instanceof Table) ? item : null;
    var cellTarget = (item instanceof Cell) ? item : null;
    if (tableTarget) {
        var curTblStyle = null;
        try { curTblStyle = tableTarget.appliedTableStyle; } catch (eTC) { logError(eTC, "etape1ter lecture appliedTableStyle"); }
        logToFile("M03-etape1ter: [table] applique='" + safeStyleName(curTblStyle, "?") + "'");
    } else if (cellTarget) {
        var curCellStyle = null;
        try { curCellStyle = cellTarget.appliedCellStyle; } catch (eCC2) { logError(eCC2, "etape1ter lecture appliedCellStyle"); }
        logToFile("M03-etape1ter: [cellule] applique='" + safeStyleName(curCellStyle, "?") + "'");
    } else {
        logToFile("M03-etape1ter: [table/cellule] aucune table/cellule visee -> famille non declenchee");
    }

    // ---- Passe 2 : REMETTRE À NEUTRE ----
    logToFile("M03-etape1ter: === REMISE A NEUTRE ===");

    // Caractère → réaffectation du style neutre (pas de clearCharacterStyleOverrides dans le DOM).
    if (textTarget && neutralCharStyle && curCharName !== "" && curCharName !== neutralCharName) {
        try {
            textTarget.appliedCharacterStyle = neutralCharStyle;
            logToFile("M03-etape1ter: [caractere] remis a neutre -> '" + curCharName + "' vers '" + neutralCharName + "'");
        } catch (eCReset) { logError(eCReset, "etape1ter reset characterStyle"); }
    } else if (textTarget) {
        logToFile("M03-etape1ter: [caractere] deja neutre ou indetermine -> aucune action");
    }

    // Paragraphe → applyParagraphStyle(neutre, clearingOverrides=true).
    if (textTarget && neutralParaStyle && curParaName !== "" && curParaName !== neutralParaName) {
        try {
            textTarget.applyParagraphStyle(neutralParaStyle, true);
            logToFile("M03-etape1ter: [paragraphe] remis a neutre -> '" + curParaName + "' vers '" + neutralParaName + "' (clearingOverrides=true)");
        } catch (ePReset) { logError(ePReset, "etape1ter reset paragraphStyle"); }
    } else if (textTarget) {
        logToFile("M03-etape1ter: [paragraphe] deja neutre ou indetermine -> aucune action");
    }

    // Objet → applyObjectStyle(neutre, true, true) + clearObjectStyleOverrides().
    if (objectTarget && neutralObjStyle) {
        try {
            objectTarget.applyObjectStyle(neutralObjStyle, true, true);
            objectTarget.clearObjectStyleOverrides();
            logToFile("M03-etape1ter: [objet] remis a neutre '" + neutralObjName + "' + clearObjectStyleOverrides()");
        } catch (eOReset) { logError(eOReset, "etape1ter reset objectStyle"); }
    }

    // Table / cellule → méthodes de nettoyage explicites du DOM.
    if (tableTarget) {
        try {
            tableTarget.clearTableStyleOverrides();
            logToFile("M03-etape1ter: [table] clearTableStyleOverrides() applique");
        } catch (eTReset) { logError(eTReset, "etape1ter reset tableStyle"); }
    }
    if (cellTarget) {
        try {
            cellTarget.clearCellStyleOverrides(true);
            logToFile("M03-etape1ter: [cellule] clearCellStyleOverrides(true) applique");
        } catch (eCReset2) { logError(eCReset2, "etape1ter reset cellStyle"); }
    }

    logToFile("M03-etape1ter: === FIN CHECK STYLES ===");
}

// ============================================================================
// MISSION 03 — PIVOT « SCRIPT UNIFIÉ » (3 modes : bloc / place gun / curseur)
// ============================================================================

/**
 * Neutralise les DÉFAUTS du document — mécanisme exact du symptôme « tout en H2 ».
 * Doc officielle (build 21.5.1) :
 *   Document.textDefaults      (TextDefault)     : appliedParagraphStyle (r/w),
 *                                                  appliedCharacterStyle (r/w)
 *   Document.pageItemDefaults  (PageItemDefault) : appliedTextObjectStyle (r/w)
 * Styles neutres lus via item(0) — jamais un nom localisé en dur (wiki Cas 05).
 * Décision FJD (26/09) : « on neutralise tout » — SANS restauration. Ce choix
 * rend la question du timing (lecture du défaut au loadPlaceGun vs au clic)
 * sans objet : le défaut est neutre aux DEUX instants.
 */
function neutralizeDocumentDefaults(doc) {
    if (!doc) return;
    var neutralPara = doc.paragraphStyles.item(0);
    var neutralChar = doc.characterStyles.item(0);
    var neutralObj = doc.objectStyles.item(0);

    var avant = "?";
    try {
        avant = "para=" + safeStyleName(doc.textDefaults.appliedParagraphStyle, "?") +
                " | char=" + safeStyleName(doc.textDefaults.appliedCharacterStyle, "?") +
                " | obj=" + safeStyleName(doc.pageItemDefaults.appliedTextObjectStyle, "?");
    } catch (eAv) { avant = "(lecture initiale KO: " + eAv.message + ")"; }

    try { doc.textDefaults.appliedParagraphStyle = neutralPara; } catch (eP) { logError(eP, "neutralize textDefaults para"); }
    try { doc.textDefaults.appliedCharacterStyle = neutralChar; } catch (eC) { logError(eC, "neutralize textDefaults char"); }
    try { doc.pageItemDefaults.appliedTextObjectStyle = neutralObj; } catch (eO) { logError(eO, "neutralize pageItemDefaults obj"); }

    var apres = "?";
    try {
        apres = "para=" + safeStyleName(doc.textDefaults.appliedParagraphStyle, "?") +
                " | char=" + safeStyleName(doc.textDefaults.appliedCharacterStyle, "?") +
                " | obj=" + safeStyleName(doc.pageItemDefaults.appliedTextObjectStyle, "?");
    } catch (eAp) { apres = "(lecture finale KO: " + eAp.message + ")"; }

    logToFile("PIVOT unifie: neutralisation des defauts — avant [" + avant + "] -> apres [" + apres + "]");
}

/**
 * Lit un fichier Markdown par son chemin absolu, sans jamais lever d'exception.
 */
function readMarkdownFileAt(path) {
    try {
        var f = new File(path);
        if (!f.exists) { alertUser("Fichier introuvable :\n" + path); return null; }
        if (!f.open("r")) { alertUser("Impossible d'ouvrir le fichier :\n" + path); return null; }
        var c = f.read();
        f.close();
        return c;
    } catch (e) {
        logError(e, "readMarkdownFileAt");
        alertUser("Erreur lors de la lecture du fichier : " + e.message);
        return null;
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

        // MISSION 03 — PIVOT « SCRIPT UNIFIÉ ». Les trois modes sont TOUS déduits
        // de l'état d'InDesign, jamais demandés :
        //   - « cadre »   : un cadre texte (ou une histoire) est sélectionné ;
        //   - « curseur » : un point d'insertion est actif dans du texte ;
        //   - « gun »     : AUCUNE sélection ⇒ on charge le place gun et FJD
        //                   clique dans la page pour créer le cadre.
        // Décision FJD (26/09) : « aucune sélection = gun ». Le mode gun n'est
        // donc PAS un état à détecter : un .md ne peut pas être pré-chargé à la
        // main dans InDesign (format non admis par Fichier > Importer).
        var selection = app.selection;
        var selLen = (selection && typeof selection.length === "number") ? selection.length : 0;
        var resolved = null;
        var mode;
        if (selLen === 0) {
            // FJD (26/09) : « il fallait étendre à l'outil Texte ». Un curseur
            // de texte peut rapporter une sélection VIDE quand le focus a migré
            // vers le panneau Scripts (constat log 26/09 : 7 tirs « selection
            // vide » alors qu'un curseur était actif) — alors qu'une sélection
            // d'OBJET (flèche noire) survit toujours. On journalise donc l'état
            // exact des sources de sélection AVANT de conclure « gun », pour
            // rendre la prochaine mesure décisive (aucune supposition).
            var winSelLen = -1;
            try { winSelLen = (app.activeWindow && app.activeWindow.selection) ? app.activeWindow.selection.length : -1; } catch (eWS) {}
            var docSelLen = -1;
            try { docSelLen = doc.selection ? doc.selection.length : -1; } catch (eDS) {}
            var docStories = -1;
            try { docStories = doc.stories.length; } catch (eDS2) {}
            logToFile("PIVOT unifie: selection vide — app.selection=0 | activeWindow.selection.length=" + winSelLen + " | doc.selection.length=" + docSelLen + " | stories du document=" + docStories);
            mode = "gun";
        } else {
            resolved = resolveTargetStory(selection);
            if (resolved) {
                mode = (resolved.mode === "TextFrame" || resolved.mode === "Story") ? "cadre" : "curseur";
            } else {
                mode = "invalide";
            }
        }
        logToFile("PIVOT unifie: selection.length=" + selLen + " | mode detecte=" + mode);

        if (mode === "invalide") {
            alertUser("Aucun bloc de texte exploitable n'est actif.\n\nPlacez le curseur dans un bloc de texte, selectionnez un bloc de texte, ou desactivez toute selection (Echap) pour charger le place gun, puis relancez le script.");
            return;
        }

        // NETTOYAGE — toujours AVANT le placement.
        //  - mode « gun » : aucune cible encore ; on neutralise les DÉFAUTS du
        //    document (mécanisme du symptôme « tout en H2 »).
        //  - modes « cadre »/« curseur » : nettoyage 1ter de la cible résolue.
        // Décision FJD (26/09) : « on neutralise tout ». Les DÉFAUTS du document
        // sont neutralisés dans TOUS les modes — pas seulement « gun ». Cause
        // MESURÉE (log 26/09 19:17) : le défaut paragraphe du document valait
        // 'H2' ; en mode « cadre »/« curseur » il n'était jamais neutralisé, si
        // bien que les paragraphes ouverts à l'insertion héritaient de 'H2' —
        // c'est le symptôme « le nettoyage ne marche pas ».
        // MODE « GUN » — AVERTISSEMENT DE RESPONSABILITÉ (décision FJD 26/09 :
        // « on met le loadGun en suspens »). En mode gun, le texte est déposé
        // par l'import natif d'InDesign SOUS LE STYLE PARAGRAPHE ACTIF AU
        // MOMENT DU CLIC : le script n'a AUCUNE prise dessus (le style du
        // panneau n'a pas d'accesseur API, l'import natif n'est pas scriptable).
        // Constat FJD (26/09) : « je n'ai que des H2 en loadedgun, le H2
        // sélectionné dans le panneau style de paragraphe » ⇒ résultat UNIFORME,
        // donc ce n'est PAS un mapping par balises (un style seul ne peut pas
        // produire une hiérarchie) mais bien le style actif.
        // Seule valeur lisible et représentative : le DÉFAUT paragraphe du
        // document — capturé ICI, AVANT neutralisation (après, il vaudrait
        // forcément '[Aucun style]' et l'avertissement serait trompeur).
        var defaultParaBefore = "[Aucun style]";
        try { defaultParaBefore = safeStyleName(doc.textDefaults.appliedParagraphStyle, "[Aucun style]"); } catch (eDpb) {}
        logToFile("PIVOT unifie: defaut paragraphe AVANT neutralisation = '" + defaultParaBefore + "'");

        neutralizeDocumentDefaults(doc);
        if (mode !== "gun" && resolved) {
            checkAndCleanStylesAtTrigger(selection, doc, resolved);
        }

        // L'avertissement est posé AVANT le sélecteur de fichier : si
        // l'utilisateur renonce, il n'a pas à choisir un fichier pour rien.
        if (mode === "gun") {
            // NB : le lecteur ci-dessus peut valoir '[Aucun style]' alors que le
            // panneau Style de paragraphe porte encore un style actif (mesure :
            // 8/8 tirs gun avaient textDefaults='[Aucun style]' et FJD voyait H2).
            // On ne depend donc PAS du nom : si le nom est neutre, on renvoie au
            // panneau sans affirmer de nom.
            var gunNamed = (defaultParaBefore !== "[Aucun style]" && defaultParaBefore !== "?");
            var gunStyleTxt = gunNamed
                ? "le style de paragraphe « " + defaultParaBefore + " » est en route"
                : "un style de paragraphe est actif dans le panneau Style de paragraphe";
            var gunActionTxt = gunNamed
                ? "Changez pour le style de paragraphe standard (« [Aucun style] ») dans le panneau Style de paragraphe, puis relancez : c'est tout ce qu'il y a a faire."
                : "Selectionnez le style de paragraphe standard (« [Aucun style] ») dans le panneau Style de paragraphe, puis relancez : c'est tout ce qu'il y a a faire.";
            var gunWarn = "Attention : " + gunStyleTxt + ".\n\n"
                + "En mode place gun, votre texte sera importe ENTIEREMENT sous ce style (l'import natif d'InDesign n'est pas pilotable par le script).\n\n"
                + gunActionTxt + " Pour le reste, c'est bon.\n\n"
                + "Continuer quand meme ?";
            if (!confirm(gunWarn, false, SCRIPT_NAME)) {
                logToFile("PIVOT unifie: mode gun — utilisateur a ANNULE apres avertissement (style annonce='" + defaultParaBefore + "')");
                return;
            }
            logToFile("PIVOT unifie: mode gun — utilisateur a CONFIRME l'avertissement (style annonce='" + defaultParaBefore + "')");
        }

        // SÉLECTEUR DE FICHIER NATIF — aucun dialogue intermédiaire : le mode
        // est DÉTECTÉ (aucune sélection ? sinon type de sélection), jamais demandé.
        var sourceFile = File.openDialog("Choisir un fichier Markdown", "Markdown:*.md;*.markdown;*.txt");
        if (!sourceFile) {
            logToFile("PIVOT unifie: annulation utilisateur au choix de fichier");
            return;
        }

        // MODE « gun » : charger le place gun, puis rendre la main — FJD clique
        // dans la page pour déposer.
        if (mode === "gun") {
            try {
                doc.placeGuns.loadPlaceGun(sourceFile);
            } catch (eGun) {
                logError(eGun, "PIVOT unifie loadPlaceGun");
                alertUser("Echec du chargement du place gun : " + eGun.message);
                return;
            }
            var gunOk = "?";
            try { gunOk = "" + doc.placeGuns.loaded; } catch (eGl) { gunOk = "ERR(" + eGl.message + ")"; }
            logToFile("PIVOT unifie: place gun charge -> " + sourceFile.name + " | doc.placeGuns.loaded=" + gunOk + " (cliquez dans la page pour deposer)");
            return;
        }

        // Modes « cadre » / « curseur » : on a besoin d'une cible résolue.
        if (!resolved) {
            // Le curseur était peut-être vide au moment de la détection alors
            // que le gun n'était pas chargé : on retente une résolution.
            resolved = resolveTargetStory(app.selection);
        }
        if (!resolved) {
            alertUser("Aucun bloc de texte exploitable n'est actif.\n\nPlacez le curseur dans un bloc de texte, ou selectionnez un bloc de texte (outil fleche ou outil Texte), puis relancez le script.");
            return;
        }
        var targetStory = resolved.story;
        var insertionOptions = resolved.insertAt ? { insertAt: resolved.insertAt } : null;

        // Lire le fichier choisi.
        var fileContent = readMarkdownFileAt(sourceFile.fsName);
        if (fileContent === null) {
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

        // Charge le mapping existant (s'il existe, sert uniquement à préremplir
        // le dialogue ci-dessous — pas de bypass silencieux). Le dialogue de
        // configuration s'affiche systématiquement, déjà présélectionné avec ce
        // mapping (ou à défaut le style neutre par défaut) pour permettre de
        // valider en un clic ou d'ajuster directement, sans écran de confirmation
        // intermédiaire.
        // MEMOIRE DE TEST : si ce document n'a pas de mapping propre, on retombe
        // sur la copie disque laissée par le dernier document mappé — c'est ce qui
        // évite de tout ressaisir dans un document neuf. Le mapping du document
        // reste PRIORITAIRE quand il existe.
        var docMapping = loadMappingFromDocument();
        var memoryMapping = loadMemoryMapping();
        var mapping = docMapping || memoryMapping;
        logToFile("M03-memoire: mapping du document=" + (docMapping ? "present" : "absent") +
            " | memoire disque=" + (memoryMapping ? "presente" : "absente") +
            " | source retenue=" + (docMapping ? "document" : (memoryMapping ? "memoire" : "aucune")));

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
        // MEMOIRE DE TEST : on met a jour la copie disque a chaque validation du
        // dialogue, pour que le prochain document neuf en herite automatiquement.
        logToFile("M03-memoire: memoire disque mise a jour -> " + saveMemoryMapping(mapping));

        // Vérifier que tous les tags ont un mapping.
        // MISSION 03 étape 3 : les niveaux de titre profonds (h6..h9) sont marqués
        // `optional: true` — leur absence de mapping est NORMALE (peu de chartes
        // ont 9 niveaux de titre) et ne doit PAS bloquer l'import : un titre h6+
        // non mappé tombe simplement en style neutre, avec un log de dérive
        // (`M03-etape3`), jamais un échec ni un blocage du dialogue.
        var missingTags = [];
        for (var tag in MARKDOWN_TAGS) {
            if (MARKDOWN_TAGS.hasOwnProperty(tag) && !mapping[tag] && !MARKDOWN_TAGS[tag].optional) {
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
            saveMemoryMapping(mapping);
        }

        // Insérer le Markdown avec les styles.
        // MISSION 03 : si MINIMAL_MODE est actif, on exécute la reconstruction
        // minimale (étape 1 : texte brut, cf. COMMUNICATION/
        // mission_03_reconstruction_minimale.md) — l'ancienne version reste
        // disponible et inchangée pour comparaison (MINIMAL_MODE = false).
        var success;
        if (MINIMAL_MODE) {
            success = insertMarkdownWithStyles_v2(targetStory, blocks, mapping, insertionOptions);
            if (success) {
                alertUser("M03 étapes 1/1bis (texte brut) + 2 (styles de paragraphe) + 3 (titres) exécutées.\n\nMode de sélection détecté : " + resolved.mode + "\n\nVérifiez le log import_md_errors.log :\ncompteurs M03-etape2 (blocs / attendus / reels / ecarts) et M03-etape3 (titres reels / maxMappe / derives), plus le style relu de chaque bloc. NE PAS avancer tant qu'un ecart persiste.");
            }
        } else {
            success = insertMarkdownWithStyles(targetStory, blocks, mapping);
        }
        if (!success) {
            alertUser("Échec de l'insertion du Markdown avec les styles.");
            return;
        }

        if (!MINIMAL_MODE) {
            alertUser("Markdown inséré avec succès avec les styles configurés !");
        }

    } catch (e) {
        logError(e, "main");
        alertUser("Erreur inattendue : " + e.message + "\n\nStack: " + e.stack + "\n\n(Détails enregistrés dans import_md_errors.log)");
    }
}

// Exécuter le script
main();

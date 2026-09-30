// import_md.jsx
// Plugin InDesign : import Markdown mappé sur la charte de styles réelle du document
// Version 1.0 - Compatible ExtendScript (ES3)

// ============================================================================
// CONFIGURATION
// ============================================================================

var SCRIPT_NAME = "Import MD";
var LABEL_NAME = "md-style-map";
// MISSION 05 (voie B) — label de l'EMPREINTE de la source Markdown.
// Séparé de LABEL_NAME : le mapping peut être hérité de la mémoire de test tandis
// que l'empreinte appartient en propre au document (cf. bloc MISSION 05 plus bas).
var LABEL_SOURCE_FP = "md-source-fingerprint";
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
// ATTENTION : ceci est un CHEMIN (chaine), comme LOG_FILE_PATH — il faut le
// convertir en objet File AVANT tout .exists/.open/.read, sinon l'erreur tombe
// dans main() AVANT l'insertion et fait echouer l'import complet en silence.
var MEMORY_MAPPING_PATH = new File($.fileName).parent.fsName + "/import_md_mapping_memory.txt";

// Valeur sentinelle du dialogue de mapping : "ce tag n'est PAS mappe". Proposee
// par defaut quand aucune correspondance n'existe, elle signifie : aucune
// affectation de style pour ce tag. Le script ne devine JAMAIS a la place de
// l'utilisateur (decision FJD 27/09/2026, cf. doc/wiki Cas 25).
var NOT_MAPPED_LABEL = "\u2014 non mapp\u00e9 \u2014";

// MISSION 03 — ÉTAPE 8 (point B, décision FJD 28/09/2026) : SUPPRESSION DES ÉMOJIS.
// Les signes ci-dessous sont des emojis Unicode que les polices de texte ne
// savent pas rendre (ou rendent en carré vide / tofu). Décision FJD : on les
// ÉLIMINE purement et simplement — aucune substitution par une police symboles
// (l'approche Webdings/Wingdings a été essayée et abandonnée : « fail emoji »).
//   U+26A0 (⚠)  -> supprimé
//   U+2705 (✅)  -> supprimé
// U+FE0F (variation selector d'emoji) est retiré : il ne sert qu'à forcer la
// présentation emoji, sans contenu propre.
// PÉRIMÈTRE STRICTEMENT FINI : cette liste est le fruit d'un inventaire mesuré
// des 12 fixtures (5 racine + 7 minimales). La typographie (U+2014 —, U+2026 …,
// U+2013 –, U+20AC €, U+0153 œ) n'est PAS un emoji et reste INCHANGÉE.
var EMOJI_STRIP = [
    "\u26A0",
    "\u2705"
];

// MISSION 03 (25/09 → 28/09, décision FJD) : reconstruction minimale achevée.
// `insertMarkdownWithStyles()` est désormais l'UNIQUE implémentation (étapes
// 1 à 7 validées en réel une à une, avec commit à chaque étape). Le drapeau
// MINIMAL_MODE et l'ancienne `insertMarkdownWithStyles()` — conservés jusque-là
// comme filet de comparaison — ont été retirés à l'étape 8 (non-régression
// complète). Cf. COMMUNICATION/mission_03_reconstruction_minimale.md.

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

// ============================================================================
// MISSION 05 (voie B) — EMPREINTE DE LA SOURCE MARKDOWN (déclencheur de re-import)
// ============================================================================
// Objet : savoir, à l'ouverture du script, si la source .md qui a servi au dernier
// import a CHANGÉ depuis. L'empreinte vit dans un label du document (elle suit le
// document, pas le poste), indépendant du mapping `md-style-map` — non-régression
// vérifiée avant/après par la sonde tools/probe_05_empreinte.jsx (36/36 puis 38/38).
//
// TOUTES les primitives ci-dessous ont été MESURÉES avant d'être écrites ici
// (sonde jetable, cf. COMMUNICATION/mission_05_voie_b_empreinte_md.md) :
//   - insertLabel() sur un nom déjà posé ÉCRASE l'ancienne valeur (mesuré) ;
//   - un label de 4000 caractères se relit INTÉGRALEMENT (mesuré) ;
//   - les 3 écritures de fin de ligne (LF, CR, CRLF) se relisent à l'IDENTIQUE
//     avec la MÊME somme ⇒ réenregistrer le .md dans un autre outil ne déclenche
//     PAS de fausse alerte tant que le texte lui-même n'a pas bougé (mesuré) ;
//   - File.modified ne bouge PAS quand le contenu change dans la même seconde
//     ⇒ la date n'entre PAS dans la décision (mesuré).
//
// DÉCISION Q4 DE LA MISSION — QU'EST-CE QU'ON STOCKE DU CHEMIN DE LA SOURCE ?
// On stocke le chemin ABSOLU (`fsName`), et la raison est écrite ici : c'est le
// SEUL moyen de retrouver la source sans repasser par un sélecteur de fichier
// (File.openDialog n'accepte aucun chemin par défaut en ExtendScript — mesuré).
// Risque assumé et documenté : un chemin absolu est fragile (déplacement du .md,
// autre poste, montage réseau différent). Il est neutralisé par l'état
// `source_absente`, qui est EXPLICITE et NON destructif : on signale, on ne
// réimporte jamais à l'aveugle, et l'utilisateur choisit un autre fichier.
//
// Q5 — AMBIGUÏTÉ DE SÉPARATEUR DANS LE FORMAT PLAT : sans objet. Le sérialiseur
// échappe déjà `\` et `"` (cf. serializeFlatMapping), donc un chemin chemin
// contenant des séparateurs ou des antislashs (cas Windows `C:\...`) est relu
// sans perte par deserializeFlatMapping. Vérifié par la sonde sur l'aller-retour.
// ============================================================================

var FINGERPRINT_VERSION = "1";
var M05_SUM_MODULUS = 2147483647; // borne < 2^31, l'entier ExtendScript reste exact

var ETAT_JAMAIS_IMPORTE = "jamais_importe";
var ETAT_IDENTIQUE = "identique";
var ETAT_DIFFERENT = "different";
var ETAT_SOURCE_ABSENTE = "source_absente";

/**
 * Somme de contrôle du CONTENU lu (même fonction que celle validée par la
 * simulation Node et par la sonde InDesign : 22/22 puis 36/36).
 * Volontairement indépendante de File.modified : on mesure le TEXTE, pas le fichier.
 */
function m05ChecksumOf(content) {
    var sum = 0;
    var s = String(content);
    for (var i = 0; i < s.length; i++) {
        sum = (sum * 31 + s.charCodeAt(i)) % M05_SUM_MODULUS;
    }
    return sum;
}

/**
 * Construit l'empreinte d'un fichier source. Retourne null si le fichier est
 * absent ou illisible — l'appelant traite null comme « source absente », jamais
 * comme « identique » (une lecture ratée ne doit PAS ressembler à un accord).
 *
 * POINT DE FIDÉLITÉ : on lit le fichier EXACTEMENT comme le fera l'import
 * (readMarkdownFileAt : new File, .exists, .open("r"), .read(), .close(), SANS
 * forcer d'encodage). C'est délibéré : si l'empreinte décodait autrement que
 * l'import, la somme mesurerait un texte que l'import ne verrait jamais.
 */
function m05BuildFingerprint(file) {
    if (!file || !file.exists) return null;
    var contenu = null;
    try {
        if (!file.open("r")) return null;
        contenu = file.read();
        file.close();
    } catch (eFp) {
        // catch NON vide : la fermeture peut elle-meme echouer si l'ouverture a
        // echoue ; on le journalise au lieu de l'avaler (regle de la mission 05).
        try { file.close(); } catch (eFpClose) {
            logToFile("M05-empreinte: fermeture apres echec de lecture a echoue : " + eFpClose.message);
        }
        return null;
    }
    if (contenu === null || contenu === undefined) return null;
    var modifiedMs = "";
    try { modifiedMs = String(file.modified ? file.modified.getTime() : ""); } catch (eMod) { modifiedMs = ""; }
    var fp = {};
    fp.v = FINGERPRINT_VERSION;
    fp.size = String(String(contenu).length);
    fp.checksum = String(m05ChecksumOf(contenu));
    fp.modified = modifiedMs;
    fp.name = String(file.name);
    fp.path = String(file.fsName);
    return fp;
}

/** Relit une empreinte stockée. Retourne null si le label est absent ou méconnaissable. */
function m05ParseFingerprint(raw) {
    if (!raw) return null;
    var obj = deserializeFlatMapping(raw);
    if (!obj || !obj.v) return null;
    return obj;
}

/**
 * Décide l'état de la source. Ordre des tests important : « jamais importé »
 * AVANT « source absente », sinon un document neuf dont la source est absente
 * serait annoncé comme une disparition alors qu'il n'a jamais rien importé.
 */
function m05DecideState(storedRaw, cheminSource) {
    var stored = m05ParseFingerprint(storedRaw);
    if (!stored) return ETAT_JAMAIS_IMPORTE;
    if (!cheminSource) return ETAT_SOURCE_ABSENTE;
    var f = new File(cheminSource);
    if (!f.exists) return ETAT_SOURCE_ABSENTE;
    var courant = m05BuildFingerprint(f);
    if (!courant) return ETAT_SOURCE_ABSENTE;
    if (stored.checksum === courant.checksum && stored.size === courant.size) return ETAT_IDENTIQUE;
    return ETAT_DIFFERENT;
}

/**
 * Boîte de dialogue du déclencheur — passe par une VARIABLE DU PROJET, pas par
 * l'appel direct au global `confirm`. Ce n'est pas une coquetterie : la sonde 05
 * a mesuré que le global `confirm` est REFUSÉ en écriture (« confirm is read
 * only », 8 tentatives, 4 contextes — cf. section 5bis du journal). On ne peut
 * donc PAS substituer `confirm` pour tester cette branche ; en passant par cette
 * variable, la branche devient testable sans clic humain, et le wiki Cas 40 est
 * corrigé en conséquence.
 */
var demanderConfirmationM05 = function (message) {
    return confirm(message, false, SCRIPT_NAME);
};

/**
 * Écrit l'empreinte de la source dans le document. Appelé UNIQUEMENT après un
 * import réussi (ou après chargement du place gun, cf. l'appel en mode gun).
 */
function saveSourceFingerprint(file) {
    try {
        var doc = app.activeDocument;
        if (!doc || !file || !file.exists) return false;
        var fp = m05BuildFingerprint(file);
        if (!fp) {
            logToFile("M05-empreinte: ABANDON — lecture impossible, aucune empreinte ecrite pour " + file.fsName);
            return false;
        }
        doc.insertLabel(LABEL_SOURCE_FP, serializeFlatMapping(fp));
        logToFile("M05-empreinte: ECRITE -> " + fp.path + " | v=" + fp.v + " | size=" + fp.size + " | checksum=" + fp.checksum);
        return true;
    } catch (eSave) {
        logError(eSave, "M05-empreinte saveSourceFingerprint");
        alertUser("Erreur lors de l'enregistrement de l'empreinte de la source : " + eSave.message);
        return false;
    }
}

/**
 * DÉCLENCHEUR — appelé au tout début de main(), dès qu'un document est actif et
 * AVANT tout dialogue (sélecteur de fichier compris), pour que l'utilisateur voie
 * la question avant toute autre. Retourne { etat, chemin, relance }.
 *
 * `relance` n'est vrai QUE sur l'état « different » accepté : c'est alors
 * main() qui poursuit le pipeline complet sur la source mémorisée, sans
 * repasser par le sélecteur de fichier. Les 3 autres états ne relancent JAMAIS
 * d'eux-mêmes.
 */
function verifierSourceMarkdown(doc) {
    var resultat = { etat: ETAT_JAMAIS_IMPORTE, chemin: null, relance: false };
    var raw = "";
    try { raw = doc.extractLabel(LABEL_SOURCE_FP) || ""; } catch (eLabel) {
        logError(eLabel, "M05-empreinte extractLabel");
        raw = "";
    }
    var stored = m05ParseFingerprint(raw);
    resultat.chemin = (stored && stored.path) ? stored.path : null;
    resultat.etat = m05DecideState(raw, resultat.chemin);
    logToFile("M05-empreinte: etat source = " + resultat.etat
        + " | source memorisee = " + (resultat.chemin || "(aucune)")
        + " | empreinte memorisee = " + (stored ? (stored.v + "/" + stored.size + "/" + stored.checksum) : "(aucune)"));

    if (resultat.etat === ETAT_DIFFERENT) {
        var msg = "La source Markdown a changé depuis le dernier import.\n\n"
            + resultat.chemin + "\n\nRelancer l'import de cette source maintenant ?";
        if (demanderConfirmationM05(msg)) {
            resultat.relance = true;
            logToFile("M05-empreinte: relance CONFIRMEE — pipeline complet relance sur la source memorisee");
        } else {
            logToFile("M05-empreinte: relance REFUSEE par l'utilisateur — arret du script");
        }
    } else if (resultat.etat === ETAT_SOURCE_ABSENTE) {
        logToFile("M05-empreinte: source memorisee ABSENTE — signale, sans relance automatique");
        alertUser("La source Markdown mémorisée est introuvable :\n\n" + (resultat.chemin || "(chemin inconnu)")
            + "\n\nVous pouvez choisir un autre fichier Markdown.");
    } else if (resultat.etat === ETAT_IDENTIQUE) {
        logToFile("M05-empreinte: source INCHANGEE depuis le dernier import — aucune alerte");
    }
    return resultat;
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

    // ------------------------------------------------------------------
    // MISSION 03 — ÉTAPE 7 : MOTIF TABLEAU À L'INTÉRIEUR D'UN BLOC DE CODE.
    //
    // Règle générale : dans un fence, RIEN n'est interprété (un "#" reste un
    // "#", une puce reste un "-"). UNE SEULE exception, actée par FJD le
    // 26/09 : le motif d'un tableau Markdown (ligne d'en-tête `| … | … |`
    // SUIVIE d'une ligne de séparateurs `| :--- | :---: |`, puis d'éventuelles
    // lignes de données) doit être extrait et rendu comme une VRAIE table
    // InDesign, exactement comme une table hors fence (étape 6).
    //
    // Le motif est donc TAMPONNÉ avant décision : tant qu'on n'a pas vu la
    // ligne de séparateurs, on ne peut pas savoir si c'est un tableau ou un
    // simple exemple littéral (`| a | b |` sans séparatrice n'est PAS un
    // tableau — c'est le cas de la fixture `test_min_07_code.md`). Si la
    // séparatrice ne vient jamais, les lignes tamponnées sont RÉINJECTÉES
    // telles quelles dans le texte du bloc de code : aucun contenu perdu.
    // La ligne de séparateurs elle-même n'entre jamais dans `rows` (même
    // convention que le parseur hors fence).
    // ------------------------------------------------------------------
    var codeTableLines = null;
    // Langue du fence en cours : indispensable pour réouvrir un bloc de code
    // APRÈS l'extraction d'une table (le fence est alors SCINDÉ en plusieurs
    // blocs `code` encadrant la table, tous de la même langue).
    var codeLanguage = "";

    // Crée paresseusement le bloc de code courant. Nécessaire car, juste après
    // une table extraite d'un fence, il n'existe plus de bloc de code alors
    // qu'on est TOUJOURS dans le fence : la ligne suivante doit en rouvrir un.
    function ensureCodeBlock() {
        if (!currentBlock) {
            currentBlock = { type: "code", text: "", language: codeLanguage, children: [], fromCodeFence: true };
        }
    }

    function resolveCodeTableLines() {
        if (!codeTableLines) return;
        var buffered = codeTableLines;
        codeTableLines = null;
        if (!buffered.hasSeparator) {
            // Pas de separateurs : ce n'est PAS un tableau. Reinjection
            // litterale, ligne pour ligne, dans le bloc de code en cours.
            ensureCodeBlock();
            for (var ri = 0; ri < buffered.length; ri++) {
                if (currentBlock.text !== "") currentBlock.text += "\n";
                currentBlock.text += buffered[ri];
            }
            return;
        }
        // Bloc de code interrompu : pousse seulement s'il porte du texte (un
        // bloc vide ne doit pas etre cree juste parce qu'une table suit).
        if (currentBlock && currentBlock.text !== "") blocks.push(currentBlock);
        currentBlock = { type: "table", rows: [], children: [], fromCodeFence: true };
        for (var ti = 0; ti < buffered.length; ti++) {
            var tLine = buffered[ti].replace(/^\s+|\s+$/g, "");
            var tCells = tLine.split("|");
            tCells = tCells.slice(1, tCells.length - 1);
            for (var tc = 0; tc < tCells.length; tc++) {
                tCells[tc] = tCells[tc].replace(/^\s+|\s+$/g, "");
            }
            currentBlock.rows.push(tCells);
        }
        blocks.push(currentBlock);
        currentBlock = null;
    }

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
                // Ligne de fermeture : on résout d'abord un éventuel tampon de
                // lignes de tableau resté ouvert (il n'y aura pas de
                // séparateurs), PUIS on clôt le bloc de code en cours.
                resolveCodeTableLines();
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = null;
                inCodeBlock = false;
            } else {
                // Ligne d'ouverture : commence un nouveau bloc de code.
                if (currentBlock) blocks.push(currentBlock);
                codeLanguage = codeFenceMatch[1] || "";
                currentBlock = { type: "code", text: "", language: codeLanguage, children: [], fromCodeFence: true };
                inCodeBlock = true;
            }
            continue;
        }
        if (inCodeBlock) {
            // ÉTAPE 7 — SEULE exception à la règle « rien n'est interprété dans
            // un bloc de code » : le motif d'un tableau Markdown. Les lignes
            // `| … |` sont TAMPONNÉES ; le tampon ne devient une table que si
            // une ligne de séparateurs suit. Toute autre ligne résout d'abord
            // le tampon en cours (réinjection littérale s'il n'y a pas de
            // tableau) avant d'être accumulée normalement.
            if (/^\|.*\|$/.test(trimmed)) {
                var isSepInCode = /^\|[\s:|-]+\|$/.test(trimmed);
                if (!codeTableLines) {
                    codeTableLines = [line];
                    codeTableLines.hasSeparator = false;
                    continue;
                }
                if (isSepInCode && !codeTableLines.hasSeparator) {
                    codeTableLines.hasSeparator = true;
                    continue;
                }
                codeTableLines[codeTableLines.length] = line;
                continue;
            }
            resolveCodeTableLines();
            // À l'intérieur d'un bloc de code : accumuler la ligne TELLE QUELLE
            // (pas de trim, les espaces d'indentation du code comptent), sans
            // passer par aucune des détections Markdown ci-dessous.
            ensureCodeBlock();
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
    // ÉTAPE 7 : un bloc "table" EXTRAIT d'un fence (`fromCodeFence`) est exclu pour
    // la même raison — ses cellules sont du texte brut, jamais de l'inline.
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
    // MISSION 03 — ÉTAPE 8 (décision FJD 28/09/2026) : les émojis sont retirés
    // ICI, à l'entrée du parseur inline. C'est le SEUL point de suppression : les
    // `children` en sortent déjà nettoyés, donc `getBlockPlainText()`
    // (concaténation des `children`) l'est aussi — et TOUT consommateur
    // d'offsets (paraOffsets de `fullText`, ancrages de table de l'étape 6,
    // segments gras de l'étape 4) travaille alors sur la MÊME longueur, celle du
    // texte réellement inséré.
    // Ne PAS déplacer cette suppression plus bas (par ex. seulement à
    // l'assemblage de `fullText`) : l'étape 4 relit alors des plages calculées
    // sur un texte plus long que le paragraphe réel et échoue en
    // « Object is invalid » (régression observée le 28/09, run 03:00).
    text = stripEmojis(text);
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
 * MISSION 03 — ÉTAPE 8 (point B, décision FJD 28/09/2026) : suppression des
 * emojis du flux de texte, cf. EMOJI_STRIP.
 *
 * Retourne le texte débarrassé des émojis de la liste. Chaque émoji retiré
 * emporte en outre UNE espace immédiatement suivante, s'il y en a une : sans
 * cela, retirer « ✅ » de « : ✅ Existe » laisserait « :  Existe » (double
 * blanc). Si l'émoji est en fin de ligne, l'espace traînante disparaît aussi.
 *
 * Attention : la suppression raccourcit le texte, donc les offsets de sortie ne
 * sont plus ceux d'entrée. Pour qu'il n'existe qu'UNE seule vérité de longueur,
 * elle est appelée en TÊTE de `parseInlineMarkdown` (cf. supra) : les `children`
 * et tout ce qui en dérive (`getBlockPlainText`, `fullText`, ancrages de table,
 * segments gras de l'étape 4) portent alors la longueur du texte réellement
 * inséré. Ne pas l'appeler ailleurs.
 *
 * ES3 : pas de String.replace avec callback, pas de Array.indexOf -> boucle.
 */
function stripEmojis(text) {
    if (!text) return text;
    var out = "";
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === "\uFE0F") continue; // variation selector emoji : sans contenu
        var isEmoji = false;
        for (var m = 0; m < EMOJI_STRIP.length; m++) {
            if (EMOJI_STRIP[m] === ch) { isEmoji = true; break; }
        }
        if (isEmoji) {
            // On saute l'émoji, puis TOUTE suite de sélecteurs de variation
            // (U+FE0F) qui le suivent IMMÉDIATEMENT — c'est le cas réel
            // « ⚠️ » (U+26A0 U+FE0F) —, puis les espaces qui suivent, pour ne
            // pas laisser de double blanc à la place de l'émoji retiré.
            var j = i + 1;
            while (j < text.length && text.charAt(j) === "\uFE0F") j++;
            while (j < text.length && text.charAt(j) === " ") j++;
            i = j - 1; // la boucle `for` fera i++ : on reprend au bon endroit
            continue;
        }
        out += ch;
    }
    return out;
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
    if (block.type === "code") {
        // MISSION 03 — ÉTAPE 7 : « UN PARAGRAPHE PAR LIGNE » (décision FJD du
        // 26/09). Un bloc de code multiligne n'est pas UN paragraphe à sauts de
        // ligne internes : il devient un paragraphe PAR LIGNE, les lignes étant
        // jointes par "\r". C'est ce qui rend le compteur d'arbitrage JS pur
        // (`crCount` sur `fullText`, étape 0bis) cohérent avec le nombre de
        // paragraphes réellement créés — et donc ce qui autorise la mesure du
        // nombre de paragraphes à rester exacte.
        // Les lignes VIDES sont ignorées (décision FJD du 27/09) : elles ne
        // créent pas de paragraphe vide.
        var codeLines = (block.text || "").split("\n");
        var keptLines = [];
        for (var ci = 0; ci < codeLines.length; ci++) {
            if (codeLines[ci] !== "") keptLines.push(codeLines[ci]);
        }
        return keptLines.join("\r");
    }
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
        var memFile = new File(MEMORY_MAPPING_PATH);
        if (!memFile.exists) return null;
        memFile.encoding = "UTF-8"; // noms de styles accentues
        if (!memFile.open("r")) return null;
        var c = memFile.read();
        memFile.close();
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
        var memFile = new File(MEMORY_MAPPING_PATH);
        memFile.encoding = "UTF-8"; // noms de styles accentues
        if (!memFile.open("w")) return false;
        memFile.write(serializeFlatMapping(mapping || {}));
        memFile.close();
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
 * de mapping[tag] dans insertMarkdownWithStyles().
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
 * MISSION 03 — import Markdown complet (étapes 1 à 7).
 * (COMMUNICATION/mission_03_reconstruction_minimale.md, décisions FJD 25-28/09)
 *
 * Implémentation UNIQUE depuis l'étape 8 (non-régression complète) : l'ancienne
 * `insertMarkdownWithStyles()` — conservée jusque-là comme filet de comparaison —
 * a été supprimée, ainsi que le drapeau MINIMAL_MODE qui l'appelait.
 *
 * Ce qu'elle fait, dans l'ordre :
 *   1. Construire fullText = textes des blocs joints par "\r" (blocs "table"
 *      EXCLUS de ce texte : ils n'ont pas de .text et sont ancrés séparément à
 *      l'étape 6, cf. plus bas).
 *   2. story.contents = "" puis UNE SEULE assignation à insertionPoints[-1]
 *      (mode cadre) ou à options.insertAt (mode curseur, story NON vidée).
 *   3. ÉTAPE 2 — appliquer à chaque paragraphe le style lu dans le mapping du
 *      document, par INDEX STABLE. Un bloc peut produire PLUSIEURS paragraphes
 *      (étape 7 : un paragraphe par ligne de code) : l'index du paragraphe est
 *      donc obtenu via paraOffsets[], et non par le rang du bloc. Style neutre
 *      (jamais d'échec) si une clé manque ou pointe un style inexistant.
 *      Aucun nom de style n'est codé en dur : tout vient du mapping.
 *   4. ÉTAPE 4 — segments inline (gras/italique) ; ÉTAPE 5 — cascade
 *      d'indentation des listes ; ÉTAPE 6 — tables InDesign ancrées par offset
 *      caractère ; ÉTAPE 7 — blocs de code littéraux (un paragraphe par ligne,
 *      le style étant appliqué à TOUTES les lignes du bloc).
 */
function insertMarkdownWithStyles(story, blocks, mapping, options) {
    try {
        // Étape 1 : textes des blocs non-table collectés puis joints par un seul
        // "\r" entre chaque (formulation fidèle au snippet de la mission ; les
        // blocs "table" n'ont pas de .text — ils seraient sérialisés "undefined" —
        // et sont exclus de ce texte : ils sont ancrés à leur place par l'API
        // table d'InDesign à l'ÉTAPE 6, cf. plus bas).
        // ÉTAPE 4 : on pousse le texte PLAT du bloc (children concaténés), pas
        // block.text : les marqueurs inline sont ainsi RETIRÉS dès l'insertion
        // (aucun `**` résiduel visible), et les offsets des segments deviennent
        // exactement les offsets cumulés des children. Les blocs `code` gardent
        // leur texte brut (marqueurs compris) : voir getBlockPlainText().
        var textParts = [];
        // -------------------------------------------------------------------
        // ÉTAPE 7 — OFFSET PARAGRAPHE DE CHAQUE BLOC NON-TABLE.
        // Jusqu'à l'étape 6, un bloc = un paragraphe, donc l'index du paragraphe
        // d'un bloc valait simplement son rang de bloc. Un bloc de code
        // multiligne produit désormais UN PARAGRAPHE PAR LIGNE : le rang de bloc
        // n'est plus l'offset de paragraphe, et les étapes 2 (styles) et 4
        // (segments) viseraient les mauvais paragraphes. On calcule donc, une
        // fois pour toutes et dans le même ordre que `textParts`, l'offset de
        // paragraphe de chaque bloc non-table.
        // Formule : pour k parties déjà collectées, fullText contient
        // (somme des \r des k parties) + (k - 1) séparateurs ⇒ l'offset du
        // paragraphe de la partie k+1 vaut (somme des \r) + k. Cette valeur est
        // par construction cohérente avec `crCount` (arbitre JS pur de l'étape
        // 0bis) : les deux se déduisent du même fullText.
        var paraOffsets = [];
        var crsSoFar = 0;
        for (var i = 0; i < blocks.length; i++) {
            if (blocks[i].type === "table") continue;
            var partText = getBlockPlainText(blocks[i]);
            // Les émojis ont déjà été retirés par `parseInlineMarkdown` (cf.
            // supra) : `getBlockPlainText` concatène des `children` nettoyés.
            // Un bloc `code` n'a jamais traversé le parseur inline — son texte
            // reste donc LITTÉRAL, émojis compris, comme ses marqueurs.
            var partStart = crsSoFar + textParts.length;
            paraOffsets[textParts.length] = partStart;
            var partCrs = 0;
            for (var pc = 0; pc < partText.length; pc++) {
                if (partText.charAt(pc) === "\r") partCrs++;
            }
            crsSoFar += partCrs;
            textParts.push(partText);
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

        // ÉTAPE 6 — OFFSET DE BASE DES ANCRAGES DE TABLE.
        // Les positions de table sont calculées en offsets RELATIFS au texte
        // inséré (fullText). En mode CADRE, la story est vidée avant écriture
        // donc l'offset absolu vaut l'offset relatif (base = 0). En mode
        // CURSEUR la story n'est PAS vidée : le texte s'insère AU MILIEU d'elle,
        // à partir de l'offset caractère du point d'insertion. Cet offset est
        // relevé AVANT l'assignation — après, le point peut avoir bougé.
        // `InsertionPoint.index` est documenté comme « the index of the text in
        // the collection or parent object » ; le réel de l'étape 2 a confirmé
        // qu'il s'agit bien d'un offset CARACTÈRE (671 pour 42 paragraphes, 1344
        // pour 65). La valeur est VÉRIFIÉE plus bas par comparaison directe du
        // contenu relu (log M03-etape6, mode curseur) : jamais utilisée en
        // aveugle.
        var baseCharOffset = 0;
        if (insertAtCursor) {
            try { baseCharOffset = options.insertAt.index; } catch (eBCO) { logError(eBCO, "etape6 offset de base (mode curseur)"); baseCharOffset = 0; }
        }

        // Nombre de "\r" réellement présents dans fullText : c'est le SEUL
        // indicateur calculé en JS pur, donc totalement fiable, indépendant de
        // toute recomposition côté InDesign. Sert d'arbitre absolu du compteur.
        var crCount = 0;
        for (var crIdx = 0; crIdx < fullText.length; crIdx++) {
            if (fullText.charAt(crIdx) === "\r") crCount++;
        }

        // ÉTAPE 7 — NOMBRE DE PARAGRAPHES RÉELLEMENT OCCUPÉS PAR L'IMPORT.
        // Défini ICI (et non plus tard comme avant l'étape 7) car plusieurs
        // logs et contrôles en ont besoin : chaque \r ferme un paragraphe et le
        // dernier paragraphe est complet ⇒ N = crCount + 1 (si texte non vide).
        // Avec l'étape 7, un bloc de code multiligne produit un paragraphe par
        // ligne : `insertedParaCount` peut donc désormais DÉPASSER le nombre de
        // blocs — c'est normal, et c'est la référence des contrôles ci-dessous.
        var insertedParaCount = (fullText.length > 0) ? (crCount + 1) : 0;

        // Log AVANT écriture : ce qu'on attend.
        logToFile("M03-etape1: blocs texte attendus=" + blockCount + " / total blocs parsés=" + blocks.length + " | fullText.length=" + fullText.length + " | crCount=" + crCount + " | paragraphes attendus=" + insertedParaCount + " | insertAtCursor=" + insertAtCursor);

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

        // ÉTAPE 8 (point B, décision FJD 28/09/2026) : les emojis sont SUPPRIMÉS
        // du texte AVANT insertion (cf. stripEmojis / EMOJI_STRIP). Il n'y a donc
        // plus rien à appliquer APRÈS insertion : ni glyphe de substitution, ni
        // police symboles. L'ancienne passe « re-police Webdings/Wingdings »
        // avait un défaut fatal — elle posait une surcharge de police AVANT
        // l'étape 2, qui appelle applyParagraphStyle(style, true) (clearing
        // overrides) et l'effaçait aussitôt : d'où un « fail emoji » muet
        // (compteur à 0 échec, rendu faux). La suppression en amont élimine la
        // cause, pas le symptôme.

        // Le chiffre annoncé est celui de l'arbitre JS pur (infaillible). On
        // signale toute divergence avec l'attendu OU avec la mesure DOM.
        if (!insertAtCursor && liveParaFromCr !== insertedParaCount) {
            logToFile("M03-etape1: DIVERGENCE — nb paragraphes reel (" + liveParaFromCr + ") != nb paragraphes attendus (" + insertedParaCount + ", soit " + blockCount + " blocs non-table dont les blocs de code multiligne). Cause a isoler avant toute autre etape.");
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
        // `insertedParaCount` est calculé plus haut (juste après crCount),
        // désormais AVANT le vidage de la story — l'étape 7 en a besoin pour
        // l'indexation par paragraphe, pas seulement pour ce contrôle final.

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

            // MISSION 04 — CORRECTIF 01/10/2026 : ANCRAGE PAR L'OFFSET CARACTERE.
            // La soustraction (story_total - N) est fausse des que l'insertion ne
            // se fait pas a la toute fin de la story. Mesure reelle du 30/09 :
            // 527 paragraphes avant + 44 blocs => total 570 (et non 571) car le
            // DERNIER bloc insere fusionne avec l'ancien premier paragraphe ;
            // la soustraction (526) designait donc le mauvais paragraphe, et
            // l'etape 4 relisait des plages hors du paragraphe vise.
            // On ne devine plus : `baseCharOffset` est l'offset CARACTERE reel du
            // point d'insertion (verifie plus bas par la sonde `offsetCheck`).
            // En InDesign, le numero de paragraphe = NOMBRE DE RETOURS PARAGRAPHE
            // situes AVANT cet offset. Deterministe, sans comparaison de contenu
            // (donc aucune collision possible avec un import precedent du meme
            // fichier deja present dans la story).
            var baseParOffset = -1;
            try {
                var avantCurseur = "" + liveStory.contents.substring(0, baseCharOffset);
                var nbRetoursAvant = 0;
                for (var ci = 0; ci < avantCurseur.length; ci++) {
                    if (avantCurseur.charAt(ci) === "\r") { nbRetoursAvant++; }
                }
                baseParOffset = nbRetoursAvant;
            } catch (ePbO) { logError(ePbO, "etape2 ancrage offset caractere"); }

            logToFile("M03-etape2: ancrage offset — baseCharOffset=" + baseCharOffset
                + " => baseParOffset(nb retours paragraphe avant)=" + baseParOffset
                + " | baseSoustraction=" + baseParaIndex);
            if (baseParOffset >= 0) {
                if (baseParOffset !== baseParaIndex) {
                    logToFile("M03-etape2: CORRECTIF ancrage offset — la soustraction etait fausse de "
                        + (baseParaIndex - baseParOffset) + " paragraphe(s) ; base retenue=" + baseParOffset);
                }
                baseParaIndex = baseParOffset;
            } else if (baseParaIndex <= 0 && paraSnapshot.length > insertedParaCount) {
                baseIndexKnown = false;
                logToFile("M03-etape2: ABANDON — soustraction incoherente (base=0) ET ancrage offset indisponible. Aucun style applique (jamais au hasard sur le texte voisin).");
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
        var codeParaStyled = 0;   // ÉTAPE 7 : lignes de code 2..N stylées

        // ÉTAPE 7 — UN BLOC DE CODE MULTILIGNE OCCUPE PLUSIEURS PARAGRAPHES.
        // Le style du bloc doit couvrir TOUTES ses lignes : sinon seule la
        // première est stylée et les suivantes restent au style par défaut du
        // document — incohérence visible dès qu'un style de code est mappé.
        // Nombre de paragraphes d'un bloc de code = nb de "\r" du texte plat
        // + 1 (les lignes vides ne produisent aucun paragraphe : elles ont déjà
        // été retirées par getBlockPlainText). Retourne le nombre de lignes
        // supplémentaires effectivement stylées.
        function styleCodeContinuationLines(startParaIndex, styleToUse, blockRef) {
            if (!styleToUse) return 0;
            var plainTmp = getBlockPlainText(blockRef);
            var nbParas = 1;
            for (var q1 = 0; q1 < plainTmp.length; q1++) {
                if (plainTmp.charAt(q1) === "\r") nbParas++;
            }
            var done = 0;
            for (var q2 = 1; q2 < nbParas; q2++) {
                var p2 = paraSnapshot[startParaIndex + q2];
                if (!p2) continue;
                try { p2.applyParagraphStyle(styleToUse, true); done++; }
                catch (eCC) { logError(eCC, "etape7 style ligne de code (para " + (startParaIndex + q2) + ")"); }
            }
            return done;
        }

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
                // ÉTAPE 7 : l'index du paragraphe n'est PLUS le rang du bloc —
                // un bloc de code multiligne occupe plusieurs paragraphes. On
                // passe par `paraOffsets` (même ordre que `styleBlocks`).
                var paraIndex = baseParaIndex + paraOffsets[pb];
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
                        if (bloc.type === "code") codeParaStyled += styleCodeContinuationLines(paraIndex, styleObj, bloc);
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
                            if (bloc.type === "code") codeParaStyled += styleCodeContinuationLines(paraIndex, neutralPara, bloc);
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

                var sPara = paraSnapshot[baseParaIndex + paraOffsets[sb2]];
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

        // -------------------------------------------------------------------
        // MISSION 03 — ÉTAPE 6 : TABLEAUX
        // (COMMUNICATION/mission_03_reconstruction_minimale.md, décisions FJD 26-27/09)
        //
        // Route technique de création de table InDesign, éprouvée dès les
        // premiers tests réels de la mission 03 et reprise sans changement :
        //   anchorPoint.tables.add({headerRowCount:1, bodyRowCount:rowCount-1,
        //                           columnCount:columnCount})
        //   newTable.rows[r].cells[c].texts[0].contents = <texte de cellule>
        //   newTable.appliedTableStyle = <style mappé sur la clé "table">
        //
        // DIFFÉRENCE avec l'ancienne version : ici le texte a déjà été écrit en
        // UNE SEULE assignation (étapes 1-5, validées et commitées), et l'index
        // stable des paragraphes ne doit PAS bouger. Deux conséquences :
        //   1. les tables sont ancrées APRÈS tout le stylage (étape 2, 4, 5) :
        //      le snapshot `paraSnapshot` est déjà figé, donc rien n'est décalé ;
        //   2. l'ancrage se fait par OFFSET CARACTÈRE calculé en JS pur, plus
        //      par `insertionPoints[-1]` (qui empilait tout en fin de story).
        //
        // Offsets : la table se pose à la FIN du dernier paragraphe de texte
        // écrit avant elle — soit, dans fullText, l'offset
        //     sumLen(blocs texte avant) + (nbTextAvant - 1) séparateurs "\r"
        // (nbTextAvant = 0 ⇒ offset 0 : la table ouvre le document).
        // Une table s'ancre DANS le paragraphe courant, comme un caractère : on
        // n'écrit ni "\r" avant ni après (un "\r" surnuméraire créerait un
        // paragraphe vide parasite — wiki Cas 17/20).
        //
        // ORDRE DE CRÉATION : du DERNIER vers le PREMIER. Ancrer une table
        // insère du texte dans la story, donc décale les offsets SUIVANTS ;
        // en descendant, tous les offsets restants (plus petits) sont encore
        // valides au moment de leur usage.
        // -------------------------------------------------------------------
        var tableSegments = [];   // {block, offsetRel, nbTextAvant} — ordre document
        var textPartsBefore = 0;
        var sumLenBefore = 0;
        for (var tb = 0; tb < blocks.length; tb++) {
            if (blocks[tb].type === "table") {
                tableSegments.push({
                    block: blocks[tb],
                    offsetRel: (textPartsBefore === 0) ? 0 : (sumLenBefore + (textPartsBefore - 1)),
                    nbTextAvant: textPartsBefore
                });
            } else {
                sumLenBefore += getBlockPlainText(blocks[tb]).length;
                textPartsBefore++;
            }
        }

        // CONTRÔLE D'INTÉGRITÉ DES OFFSETS — jamais d'ancrage à l'aveugle.
        // `liveContents` a été relevé AVANT le stylage (étapes 2/4/5). Or
        // certains styles de paragraphe (puce automatique InDesign) peuvent
        // INJECTER des caractères dans le flux au moment où on les applique
        // (constat documenté dès les premiers tests réels de la mission 03).
        // Si c'est arrivé, les offsets calculés depuis fullText ne désignent
        // plus les bons endroits. On RELIT donc la story MAINTENANT (juste
        // avant le premier ancrage) et on exige que sa longueur vaille
        // exactement base + fullText.length. En cas d'écart : ERREUR explicite
        // dans le log (diagnostic direct, pas de correction à l'aveugle) —
        // et on ancre quand même, pour ne pas masquer le problème derrière une
        // absence de table (une absence se confondrait avec un bug d'ancrage).
        var storyLenNow = -1;
        try { storyLenNow = liveStory.contents.length; } catch (eSL) { storyLenNow = -1; }
        var longueurAttendue = baseCharOffset + fullText.length;
        var offsetFiable = (storyLenNow === longueurAttendue);
        if (!offsetFiable) {
            logError({ message: "Longueur de story inattendue : " + storyLenNow + " au lieu de base(" + baseCharOffset + ") + fullText(" + fullText.length + ") = " + longueurAttendue + " — le stylage a modifie le flux, les ancrages de table peuvent etre decales" }, "etape6/integrite offsets");
        }

        // Contrôle de l'offset de base : on vérifie que le texte inséré commence
        // BIEN à baseCharOffset dans la story. La sonde est tronquée au premier
        // "\r" ou "\n" — ces deux caractères ne se comparent pas littéralement
        // au contenu relu ("\n" assigné devient un FORCED_LINE_BREAK InDesign),
        // et une sonde contenant un "\r" ferait échouer l'indexOf à tort.
        var offsetCheck = "n/a";
        var sonde = fullText;
        for (var sc = 0; sc < fullText.length; sc++) {
            var scCh = fullText.charAt(sc);
            if (scCh === "\r" || scCh === "\n") { sonde = fullText.substring(0, sc); break; }
        }
        if (sonde.length > 24) sonde = sonde.substring(0, 24);
        if (sonde.length >= 4) {
            var sondeFound = -1;
            try { sondeFound = liveStory.contents.indexOf(sonde); } catch (eSF) { sondeFound = -1; }
            offsetCheck = (sondeFound === baseCharOffset) ? "true" : ("FAUX(trouve=" + sondeFound + ",attendu=" + baseCharOffset + ")");
        } else {
            offsetCheck = "n/a(sonde trop courte)";
        }

        var tablesCreated = 0;
        var tableCellsTotal = 0;
        var tableErrors = 0;
        var cellStyleAppliedCount = 0;  // cellules stylées par le style de cellule
        var cellNeutralCount = 0;       // cellules retombées sur le neutre
        var cellParaDiag = "aucune table";   // diagnostic (dernière table traitée)
        var tableDims = [];      // indexé par position de table (ordre document)
        var tableAnchors = [];   // indexé par position de table (ordre document)
        for (var ts = tableSegments.length - 1; ts >= 0; ts--) {
            var tBlock = tableSegments[ts].block;
            var rowCount = 0;
            var columnCount = 0;
            try { rowCount = tBlock.rows.length; } catch (eTR) { rowCount = 0; }
            if (rowCount > 0) { try { columnCount = tBlock.rows[0].length; } catch (eTC) { columnCount = 0; } }
            if (rowCount <= 0 || columnCount <= 0) {
                tableErrors++;
                logError({ message: "Bloc table vide ou malforme (table #" + ts + " : " + rowCount + " ligne(s), " + columnCount + " colonne(s))" }, "etape6/table");
                continue;
            }
            var absOffset = baseCharOffset + tableSegments[ts].offsetRel;
            try {
                var anchorPoint = null;
                try { anchorPoint = liveStory.insertionPoints[absOffset]; } catch (eAP) { anchorPoint = null; }
                if (!anchorPoint) {
                    tableErrors++;
                    logError({ message: "Point d'ancrage introuvable a l'offset " + absOffset + " (story.contents.length=" + liveContents.length + ") — table non creee" }, "etape6/ancrage");
                    continue;
                }
                var newTable = anchorPoint.tables.add({
                    headerRowCount: 1,
                    bodyRowCount: rowCount - 1,
                    columnCount: columnCount
                });

                // Style de tableau d'abord : c'est lui qui porte les styles de
                // cellule de région (bodyRegionCellStyle / headerRegionCellStyle).
                var tableStyleObj = null;
                var tableStyleName = mapping["table"];
                if (tableStyleName) {
                    tableStyleObj = findTableStyleByName(tableStyleName);
                    if (tableStyleObj) {
                        newTable.appliedTableStyle = tableStyleObj;
                    } else {
                        logError({ message: "Style de tableau introuvable : " + tableStyleName }, "etape6/tableStyle");
                    }
                }

                // ÉTAPE 6 — STYLE DE PARAGRAPHE DES CELLULES (demande FJD 27/09).
                // Les styles de paragraphe APPELÉS DEPUIS un style de cellule sont
                // surclassés (ils n'apparaissent pas au panneau Styles de paragraphe).
                // La neutralisation doit donc passer par le style de cellule : on lit
                // le style de paragraphe que ce style de cellule appelle, et on le pose
                // TEL QUEL sur le texte de chaque cellule ; s'il n'appelle rien (ou si
                // l'API n'expose pas d'accesseur exploitable), repli sur le neutre.
                //
                // Cell.appliedCellStyle est une propriété STRING (nom) : pour atteindre
                // CellStyle.appliedParagraphStyle il faut l'OBJET du style de cellule.
                // On l'obtient par le TableStyle (bodyRegionCellStyle) — doc.cellStyles
                // est une collection PLATE, non hiérarchisée, donc inutilisable pour
                // retrouver le style de cellule réellement appliqué par région.
                var cellParaForThisTable = neutralPara;   // repli neutre (paragraphStyles.item(0))
                var cellParaSource = "neutre";
                cellParaDiag = "aucun style de tableau";
                if (tableStyleObj) {
                    cellParaDiag = "pas_de_region_cell";
                    try {
                        var regionCellStyle = tableStyleObj.bodyRegionCellStyle;
                        if (regionCellStyle) {
                            cellParaDiag = "sans_appel";
                            var calledParaName = "";
                            try { calledParaName = safeStyleName(regionCellStyle.appliedParagraphStyle, ""); } catch (eCP2) { calledParaName = ""; }
                            if (calledParaName) {
                                var calledParaObj = findParagraphStyleByName(calledParaName);
                                if (calledParaObj) {
                                    cellParaForThisTable = calledParaObj;
                                    cellParaSource = "style_cellule";
                                    cellParaDiag = "appele:" + calledParaName;
                                } else {
                                    cellParaDiag = "appele_introuvable:" + calledParaName;
                                }
                            }
                        }
                    } catch (eRC) { logError(eRC, "etape6 style de cellule de region"); }
                }

                for (var r = 0; r < rowCount; r++) {
                    for (var cIdx = 0; cIdx < columnCount; cIdx++) {
                        var cellText = tBlock.rows[r][cIdx] || "";
                        var cellObj = newTable.rows[r].cells[cIdx];
                        cellObj.texts[0].contents = cellText;
                        tableCellsTotal++;
                        // Neutralisation par style de cellule : on pose sur le texte le
                        // style de paragraphe appelé par le style de cellule (à défaut le
                        // neutre). Sans cela, le style de paragraphe effectif des cellules
                        // reste celui du style de cellule, hors panneau.
                        try {
                            var cellParaObj = cellObj.paragraphs[0];
                            if (cellParaObj) {
                                cellParaObj.appliedParagraphStyle = cellParaForThisTable;
                                if (cellParaSource === "style_cellule") cellStyleAppliedCount++; else cellNeutralCount++;
                            }
                        } catch (eCellPara) {
                            tableErrors++;
                            logError(eCellPara, "etape6/appliedParagraphStyle cellule #" + ts + "[" + r + "][" + cIdx + "]");
                        }
                    }
                }
                tablesCreated++;
                tableDims[ts] = rowCount + "x" + columnCount;
                tableAnchors[ts] = absOffset;
            } catch (eTable) {
                tableErrors++;
                logError(eTable, "etape6/table #" + ts);
            }
        }

        // Log de critère de réussite — ligne attendue par la mission, verbatim.
        var dimsParts = [];
        for (var dp = 0; dp < tableDims.length; dp++) {
            if (tableDims[dp]) dimsParts.push(tableDims[dp]);
        }
        logToFile("M03-etape6: tables=" + tablesCreated + " dims=" + dimsParts.join(",") +
            " cellules=" + tableCellsTotal + " paragraphes_hors_table=" + styleBlocks.length);

        // -------------------------------------------------------------------
        // MISSION 03 — ÉTAPE 7 : JOURNAL DES BLOCS DE CODE.
        // `code_blocs`   = nombre de blocs de type `code` (blocs littéraux).
        // `lignes`       = nombre de PARAGRAPHES produits par ces blocs (un
        //                  paragraphe par ligne non vide, décision FJD 26/09).
        // `literaux_intacts` = contrôle FALSIFIABLE : un bloc issu d'un fence
        //                  doit être de type `code` ou `table` — jamais autre
        //                  chose. Si un `#` ou un `-` d'un fence avait été
        //                  interprété, un bloc h1/li apparaîtrait avec
        //                  `fromCodeFence` et ce drapeau passerait à false.
        // `tables_detectees_dans_code` = tables EXTRAITES d'un fence.
        // -------------------------------------------------------------------
        var codeBlockCount = 0;
        var codeLineCount = 0;
        var literauxIntacts = true;
        var codeTableCount = 0;
        for (var cb = 0; cb < blocks.length; cb++) {
            if (blocks[cb].type === "code") {
                codeBlockCount++;
                var cbText = blocks[cb].text || "";
                if (cbText !== "") {
                    var cbLines = cbText.split("\n");
                    for (var cl = 0; cl < cbLines.length; cl++) {
                        if (cbLines[cl] !== "") codeLineCount++;
                    }
                }
            }
            if (blocks[cb].fromCodeFence) {
                if (blocks[cb].type === "table") {
                    codeTableCount++;
                } else if (blocks[cb].type !== "code") {
                    literauxIntacts = false;
                }
            }
        }
        logToFile("M03-etape7: code_blocs=" + codeBlockCount + " lignes=" + codeLineCount +
            " literaux_intacts=" + literauxIntacts + " tables_detectees_dans_code=" + codeTableCount +
            " lignes_code_stylees=" + codeParaStyled);
        var anchorsParts = [];
        for (var ap = 0; ap < tableAnchors.length; ap++) {
            if (tableAnchors[ap] !== undefined && tableAnchors[ap] !== null) anchorsParts.push(tableAnchors[ap]);
        }
        logToFile("M03-etape6-detail: mode=" + (insertAtCursor ? "curseur" : "cadre") +
            " base_offset=" + baseCharOffset + " ancrages=[" + anchorsParts.join(",") + "]" +
            " erreurs=" + tableErrors + " style_table=" + (mapping["table"] || "(aucun)") +
            " style_cellule_para=" + cellParaDiag +
            " cellules_style=" + cellStyleAppliedCount + " cellules_neutre=" + cellNeutralCount +
            " story_len=" + storyLenNow + " fullText_len=" + fullText.length +
            " offsets_fiables=" + offsetFiable + " offset_verifie=" + offsetCheck);

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
        try { apresFenetre = paraSnapshot.length - (baseParaIndex + insertedParaCount); } catch (eAF) {}
        if (apresFenetre < 0) apresFenetre = 0;
        logToFile("M03-etape2: blocs=" + styleBlocks.length + " paragraphes attendus=" + insertedParaCount +
            " reels=" + reelsRelatifs + " ecarts=" + ecarts +
            " | mode=" + (insertAtCursor ? "curseur" : "cadre") + " base=" + baseParaIndex +
            " story_total=" + paraSnapshot.length + " styles=" + appliedCount + " neutre=" + neutralCount +
            " baseIndexConnu=" + baseIndexKnown +
            (insertAtCursor ? " avant_fenetre=" + avantFenetre + " apres_fenetre=" + apresFenetre : ""));

        return true;

    } catch (e) {
        logError(e, "insertMarkdownWithStyles");
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
// ============================================================================
// MISSION 04 — RÉPARTITEUR DU TUBE PANNEAU -> MOTEUR
// ============================================================================
// Mesuré le 30/09/2026 (wiki Cas 47) : `app.doScript(src, lang, ARGS)` dépose les
// arguments dans l'objet **`arguments` de niveau RACINE** du script exécuté ; un
// appel par le MENU n'en fournit AUCUN (`arguments` vaut `undefined`). C'est le
// SEUL test dont on a besoin pour distinguer les deux appels.
//
// SIGNATURE GELÉE (décisions FJD 30/09) : cases NOMMÉES (`Appelant=panneau`),
// noyau = Appelant / Action / Chemin. L'EMPREINTE NE VOYAGE PAS : le moteur la
// recalcule depuis le Chemin (il a déjà m05BuildFingerprint) — « le panneau
// PROPOSE, le moteur TRANCHE ». Le mapping, le mode d'insertion forcé et les
// numéros de page/paragraphe n'entrent JAMAIS dans le tube.
//
// NON-RÉGRESSION : M04_TUBE reste null tant que personne ne fournit d'arguments
// racine ⇒ l'appel par le menu emprunte EXACTEMENT le chemin d'avant.
// ============================================================================

var M04_TUBE = null;

/**
 * Lit la liste d'arguments portée par le tube et en extrait les champs NOMMÉS.
 * ES3 strict (pas de JSON, pas de let/const) : on découpe sur le PREMIER « = »,
 * de sorte qu'un chemin contenant « = » reste intact au-delà du premier.
 * Les champs inconnus ne sont jamais jetés : ils vont dans `indices` (le tube a
 * le droit de s'enrichir sans casser un moteur qui ne les connaît pas encore).
 */
function lireTube(args) {
    var t = { appelant: "", action: "", chemin: "", indices: {}, nb: 0 };
    if (!args) return t;
    try { t.nb = args.length; } catch (eNb) { t.nb = -1; }
    for (var i = 0; i < t.nb; i++) {
        var s = "";
        try { s = String(args[i]); } catch (eIt) { continue; }
        var eq = s.indexOf("=");
        if (eq < 0) continue; // case nue ou illisible : ignorée, jamais devinée
        var cle = s.substring(0, eq);
        var val = s.substring(eq + 1);
        if (cle === "Appelant") { t.appelant = val; }
        else if (cle === "Action") { t.action = val; }
        else if (cle === "Chemin") { t.chemin = val; }
        else { t.indices[cle] = val; }
    }
    return t;
}

function mainInterne() {
    try {
        // Vérifier qu'un document est ouvert
        var doc = app.activeDocument;
        if (!doc) {
            alertUser("Aucun document InDesign actif. Veuillez ouvrir un document.");
            return;
        }

        // ====================================================================
        // MISSION 04 — APPEL PAR LE PANNEAU (tube). `M04_TUBE` est renseigné par
        // le répartiteur (en fin de script) UNIQUEMENT quand `app.doScript(...)
        // a fourni des arguments racine. Un appel par le MENU le laisse à null
        // ⇒ aucune ligne ci-dessous ne change de comportement.
        // ====================================================================
        var appelPanneau = !!M04_TUBE;

        // ====================================================================
        // MISSION 05 (voie B) — DÉCLENCHEUR DE RE-IMPORT, AVANT TOUT DIALOGUE.
        // Placé ICI volontairement : après la garde « document actif » (le label
        // ne se lit que sur un document) et AVANT File.openDialog, pour que la
        // question posée ne soit pas noyée après un choix de fichier. Le clic
        // dans le menu Fichier réexécute ce main() de bout en bout — l'accroche
        // est donc « réellement atteignable au runtime » (question 2 de la
        // mission, mesurée : l'entrée de menu EST ce script, et un écouteur
        // afterOpen est enregistrable si un jour l'ouverture devait déclencher).
        // En cas d'échec de la vérification, on journalise et on CONTINUE :
        // le déclencheur ne doit jamais casser un import qui marchait avant.
        // ====================================================================
        var relanceSourcePath = null;
        if (appelPanneau) {
            // Le panneau a DÉJÀ décidé (il a envoyé Action) : poser la question du
            // déclencheur ici serait une seconde décision sur la même chose.
            logToFile("M04: appel PANNEAU -> declencheur M05 SAUTE | action=" + M04_TUBE.action);
        } else {
            try {
                var verifSource = verifierSourceMarkdown(doc);
                if (verifSource.relance) {
                    relanceSourcePath = verifSource.chemin;
                } else if (verifSource.etat === ETAT_DIFFERENT) {
                    return; // relance refusée : on s'arrête net, rien n'est touché
                }
            } catch (eM05) {
                logError(eM05, "M05-empreinte verifierSourceMarkdown");
            }
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

        // MISSION 04 (30/09/2026, retour FJD) : « 1ere fois erreur silencieuse :
        // importer sans choisir un bloc. il faut une alerte. »
        // Le MENU garde le mode gun (décision FJD 26/09 : Echap = place gun).
        // Mais le PANNEAU, lui, PROMET « importer la source dans le document » :
        // charger un place gun serait une AUTRE action, et l'utilisateur ne voit
        // rien se passer. On REFUSE donc ici — AVANT tout nettoyage du document
        // (rien n'est touché : ni le document, ni le place gun) — avec une
        // alerte explicite. Une seule autorité : c'est le moteur qui juge la
        // sélection (constat mesuré : l'état de sélection diffère selon le focus).
        if (appelPanneau && mode === "gun") {
            logToFile("M04: REFUS - aucun bloc de texte actif | appel PANNEAU refuse (mode gun interdit au panneau) | selection.length=" + selLen);
            alertUser("Aucun bloc de texte n'est actif dans le document.\n\nLe panneau a besoin de savoir OU ecrire : placez le curseur dans un bloc de texte, ou selectionnez un bloc de texte, puis recliquez sur « Importer ».\n\nRien n'a ete modifie : ni le document, ni le place gun.");
            return;
        }

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
        // MISSION 05 : sauf si l'utilisateur vient d'ACCEPTER la relance — la
        // source mémorisée est alors imposée, sans repasser par le sélecteur
        // (File.openDialog n'accepte aucun chemin par défaut en ExtendScript).
        var sourceFile = null;
        // MISSION 04 — généralisation du précédent M05 : un chemin IMPOSÉ (par le
        // panneau ou par la relance) court-circuite `File.openDialog`. Le panneau
        // envoie donc le chemin au lieu de le demander (seul changement de fond
        // de la signature). `File.openDialog` n'accepte aucun chemin par défaut
        // en ExtendScript (mesuré) : le contournement est donc la seule voie.
        var cheminImpose = relanceSourcePath || ((M04_TUBE && M04_TUBE.chemin) ? M04_TUBE.chemin : null);
        if (cheminImpose) {
            sourceFile = new File(cheminImpose);
            logToFile((appelPanneau ? "M04: source IMPOSEE par le PANNEAU = " : "M05-empreinte: source IMPOSEE par la relance = ")
                + cheminImpose + " | existe=" + sourceFile.exists);
            if (!sourceFile.exists) {
                alertUser("La source Markdown demandée est introuvable :\n\n" + cheminImpose);
                return;
            }
        } else {
            sourceFile = File.openDialog("Choisir un fichier Markdown", "Markdown:*.md;*.markdown;*.txt");
            if (!sourceFile) {
                logToFile("PIVOT unifie: annulation utilisateur au choix de fichier");
                return;
            }
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
            // MISSION 05 — empreinte enregistrée ICI en toute honnêteté : le
            // script a chargé le place gun et rend la main, le dépôt réel se
            // fera par un clic de FJD que le script ne voit pas. On enregistre
            // donc l'état « cette source a été remise au place gun », ce qui
            // déclenchera la question au prochain lancement si le .md a bougé.
            // C'est une APPROXIMATION ASSUMÉE, pas une mesure du dépôt.
            saveSourceFingerprint(sourceFile);
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
        // MISSION 03 (étape 8) : `insertMarkdownWithStyles()` est l'unique
        // implémentation depuis la non-régression complète ; l'ancienne
        // `insertMarkdownWithStyles()` et le drapeau MINIMAL_MODE ont été
        // retirés. Cf. COMMUNICATION/mission_03_reconstruction_minimale.md.
        var success = insertMarkdownWithStyles(targetStory, blocks, mapping, insertionOptions);
        if (!success) {
            alertUser("Échec de l'insertion du Markdown avec les styles.");
            return;
        }

        // MISSION 05 — l'empreinte n'est écrite QU'APRÈS une insertion réussie :
        // une empreinte posée sur un import échoué ferait croire à un état
        // « identique » alors que rien n'a été inséré.
        saveSourceFingerprint(sourceFile);

        alertUser("Markdown inséré avec succès avec les styles configurés !");

    } catch (e) {
        logError(e, "main");
        alertUser("Erreur inattendue : " + e.message + "\n\nStack: " + e.stack + "\n\n(Détails enregistrés dans import_md_errors.log)");
    }
}

// ============================================================================
// MISSION 04 — ANNULATION EN UN SEUL PAS (dette Ctrl+Z, regle FJD 30/09/2026)
// ============================================================================
// Regle : toute ecriture dans le document doit tenir dans UN SEUL pas
// d'annulation — « sans cela, l'utilisateur devra faire Ctrl+Z 60 fois ».
// Mesure du 30/09 : import_md.jsx contenait 0 occurrence de doScript/UndoModes.
//
// Le 4e parametre de app.doScript est UndoModes (wiki Cas 47, l.1608) :
//   app.doScript(fn, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT)
// execute TOUT le corps de l'import comme UN SEUL pas d'annulation.
//
// main() reste le point d'entree COMMUN (menu ET panneau) : le dernier repere
// `main();` du fichier est conserve TEL QUEL (parade de troncature du panneau).
// Seul le corps a ete renomme `mainInterne` et enveloppe ici.
// Si UndoModes / app.doScript manque dans le runtime, on retombe sur l'appel
// direct : jamais de regression, seulement l'absence du regroupement.
function main() {
    var fait = false;
    try {
        if (typeof UndoModes !== "undefined" && typeof app.doScript === "function") {
            app.doScript(mainInterne, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT);
            fait = true;
        }
    } catch (eUndo) {
        logToFile("M04-undo: app.doScript(EntireScript) indisponible -> execution directe | message=" + eUndo.message);
    }
    if (!fait) {
        mainInterne();
    }
}

// ============================================================================
// ÉTAPE 9 — POINT D'ENTRÉE NATIF DANS LE MENU (Fichier > Importer un MD)
// ============================================================================
//
// Structure RÉELLE mesurée dans InDesign 21.6.0.57 fr_FR le 28/09 (sondes
// tools/probe_menu.jsx + tools/probe_menu2.jsx, journal probe_menu2.log) :
//   - app.menus contient 151 entrées, mais UNE SEULE est la barre de menus :
//     « Main » (11 sous-menus). Les 150 autres sont des menus contextuels ou
//     de panneaux.
//   - Le menu Fichier est un SOUS-MENU de Main :
//       MENU d=1 | path=Main/&Fichier | name=Fichier | title=&Fichier
//                | items=29 | submenus=6
//   - Le title porte l'ESPERLUETTE D'ACCÉLÉRATEUR (« &Fichier ») : comparer le
//     title brut ne matche JAMAIS « Fichier ». On retire donc les « & » avant
//     toute comparaison (title comme name).
//   - « Importer… » est un ITEM DIRECT du menu Fichier, PAS un sous-menu :
//       ITEM path=Main/&Fichier [10] name=Importer... | title=I&mporter...
//            | action=Importer...
//     Aucun des 6 sous-menus de Fichier n'est « Importer ». L'entrée est donc
//     posée DANS le menu Fichier, juste APRÈS « Importer… » (emplacement le
//     plus proche confirmé par la mesure, conformément à la mission).
//
// NATURE DU DÉCLENCHEUR — la doc accepte deux formes (File ou fonction), mais
// une seule survit. Mesure réelle (sonde 3, 28/09/2026, InDesign 21.6.0.57
// fr_FR, outil tools/probe_menu3.jsx) : action.invoke() PENDANT le script
// fonctionne avec les deux formes, mais APRÈS la fin du script SEUL un
// gestionnaire de type File écrit au journal — les formes « fonction »
// n'écrivent rien (au clic : typeof main = undefined, typeof logToFile =
// undefined, typeof $.global.__M03_MENU_HANDLER = undefined). Une fonction du
// script ne survit donc PAS à la fin du script ; le seul déclencheur durable
// est un File, c'est-à-dire CE script. Cliquer l'entrée le réexécute, et ses
// dernières instructions sont l'enregistrement de l'entrée (sans effet :
// l'entrée est déjà conforme) puis main(). Le clic déclenche donc EXACTEMENT
// main(), sans logique dupliquée.
//
// PERSISTANCE — l'enregistrement est en mémoire applicative : l'entrée ne
// survit PAS à un redémarrage d'InDesign (mesure FJD 28/09/2026, wiki Cas 34).
// Elle est recréée au lancement par le script de démarrage import_md_loader.jsx
// (dossier « Startup Scripts », niveau UTILISATEUR — mesuré fonctionnel,
// wiki Cas 35).
//
// Doc officielle (indesignjs.de/indesignapi/indesign/, export du modèle objet
// Adobe InDesign 2026) : MenuItems.add(associatedMenuAction, at?, reference?,
// withProperties?) ; ScriptMenuAction extends MenuAction ; Menus n'a PAS de
// add() ; ScriptMenuAction.ON_INVOKE ; addEventListener(eventType, handler),
// le handler pouvant être « File or JavaScript Function ».

// ---------------------------------------------------------------------------
// Enregistrement de l'entrée de menu.
//
// Il vit désormais dans le module PARTAGÉ import_md_menu.jsx (voie A, option
// (a) — décision FJD 28/09/2026), pour que le Panneau Scripts et le script de
// démarrage (import_md_loader.jsx) partagent UN SEUL code. Les helpers qui
// vivaient ici (MENU_ACTION_NAME, normalizeMenuTitle, safeMenuTitle,
// safeMenuName, findMainMenu, findSubmenuByTitle, countOwnScriptActions,
// resolveOwnScriptPath) ont été déplacés dans ce module — rien n'est dupliqué.
//
// Le module est chargé puis appelé AVANT l'import, de façon idempotente. Un
// échec ici est journalisé mais ne bloque JAMAIS l'import : le Panneau Scripts
// reste le point d'entrée de référence.
// ---------------------------------------------------------------------------
try {
    $.evalFile(new File(new File($.fileName).parent.fsName + "/import_md_menu.jsx"));
} catch (eMenuLoad) {
    logToFile("M03-etape9: module import_md_menu.jsx non chargeable -> entree de menu non creee (import inchange) | message=" + eMenuLoad.message);
}
if (typeof importMdRegisterMenuEntry !== "undefined") {
    importMdRegisterMenuEntry.register($.fileName);
} else {
    logToFile("M03-etape9: importMdRegisterMenuEntry ABSENT apres chargement -> entree de menu non creee");
}

// ---------------------------------------------------------------------------
// MISSION 04 — DÉTECTION DU TUBE, JUSTE AVANT L'ENTRÉE EN SCÈNE.
//
// `arguments` est lu ICI, au NIVEAU RACINE du script (c'est là que
// `app.doScript(src, lang, ARGS)` les dépose — mesuré, wiki Cas 47). On ne peut
// PAS déléguer cette lecture à une fonction : dans une fonction, `arguments`
// désigne les paramètres DE CETTE FONCTION, pas ceux du script.
//
// Rien n'est supposé : l'accès est protégé, et l'absence d'arguments est le cas
// NORMAL de l'appel par le menu (aucune régression).
//
// ⚠️ La dernière ligne du fichier reste EXACTEMENT `main();` — c'est le repère
//    utilisé par la sonde du panneau pour charger le moteur sans l'exécuter.
// ---------------------------------------------------------------------------
try {
    if (typeof arguments !== "undefined" && arguments && arguments.length > 0) {
        M04_TUBE = lireTube(arguments);
    }
} catch (eM04Detect) {
    logToFile("M04-repartiteur: lecture des arguments racine a echoue : " + eM04Detect.message);
}

// Repli MISSION 04 — le panneau charge le moteur par $.evalFile, et non comme
// un texte : c'est INDISPENSABLE, car le moteur deduit son journal
// (LOG_FILE_PATH, ligne 15) et l'entree de menu de $.fileName. Or $.evalFile
// ne transmet AUCUN argument : le panneau depose donc le MEME tube, avec les
// memes cas nommes, dans un global lu ici en dernier recours.
// Le global est a USAGE UNIQUE : on l'efface aussitot, pour qu'un appel par le
// MENU, plus tard, ne soit jamais pris pour un appel du panneau.
try {
    if (!M04_TUBE && $.global && $.global.__M04_TUBE_IMPOSE && $.global.__M04_TUBE_IMPOSE.length > 0) {
        M04_TUBE = lireTube($.global.__M04_TUBE_IMPOSE);
    }
} catch (eM04Repli) {
    logToFile("M04-repartiteur: lecture du tube de repli a echoue : " + eM04Repli.message);
}
try { $.global.__M04_TUBE_IMPOSE = null; } catch (eM04Purge) { }

logToFile(M04_TUBE
    ? ("M04-repartiteur: appel PANNEAU | appelant=" + M04_TUBE.appelant + " | action=" + M04_TUBE.action + " | chemin=" + M04_TUBE.chemin + " | n=" + M04_TUBE.nb)
    : "M04-repartiteur: appel MENU (aucun argument) -> main() inchange");

// Exécuter le script
main();

#!/usr/bin/env node
// ===========================================================================
// sim_parse_oracle.js — BANC NODE : REEXECUTION DU VRAI PARSEUR HORS INDESIGN
// ===========================================================================
//
// OBJET
//   Extraire du moteur REEL (import_md.jsx) les fonctions PURES du parseur
//   (parseMarkdown, parseInlineMarkdown, getBlockPlainText, stripEmojis,
//   isWordBoundaryChar + leurs dependances internes), les executer ici en Node,
//   et comparer le resultat aux oracles de reference `fixtures/*.expected.json`.
//
//   Methode imposee par la mission 03 : « la simulation attrape la syntaxe et la
//   logique, le reel attrape l'API ». Ce banc reproduit la demarche deja utilisee
//   au 26/09 (« chiffres reproduits par reexecution du vrai parseur hors
//   InDesign »).
//
// CE QUE CE BANC PROUVE
//   - la SEQUENCE DE BLOCS produite par parseMarkdown (donc : « le parseur
//     s'arrete-t-il avant le 2e H2 ? » -> oui/non, en evidence) ;
//   - les compteurs derives en JS pur : total blocs, types, tables,
//     fullText_length, crCount, paragraphes attendus, emojis restants.
//
// CE QU'IL NE PROUVE PAS (wiki Cas 27)
//   - l'APPLICATION des styles (etape 2), les tables InDesign (etape 6),
//     l'ancrage offset, le Ctrl+Z. Ces chemins n'existent qu'au runtime InDesign
//     et ne sont pas simulables ici. Ne JAMAIS lire dans cette sortie plus
//     qu'elle ne contient.
//
// EXECUTION
//   node tools/sim_parse_oracle.js
// ===========================================================================

'use strict';

var fs = require('fs');
var path = require('path');

var RACINE = path.resolve(__dirname, '..');
var MOTEUR = path.join(RACINE, 'import_md.jsx');
var FIXTURES = path.join(RACINE, 'fixtures');

// ---------------------------------------------------------------------------
// 1. DECOUPE DU MOTEUR (sans evaluer le reste : ES3 + appels InDesign au top)
// ---------------------------------------------------------------------------

// Index de fin d'une chaine litterale ouverte a `i` (src[i] est le guillemet).
function finChaine(src, i) {
    var q = src.charAt(i);
    i++;
    while (i < src.length) {
        var c = src.charAt(i);
        if (c === '\\') { i += 2; continue; }
        if (c === q) return i + 1;
        i++;
    }
    return i;
}

// Mots-cles apres lesquels un `/` ouvre une REGEX (et non une division).
var MOTS_CLES_REGEX = {
    'return': 1, 'typeof': 1, 'instanceof': 1, 'in': 1, 'of': 1, 'new': 1,
    'delete': 1, 'void': 1, 'do': 1, 'else': 1, 'case': 1, 'yield': 1, 'await': 1
};

// Un `/` ouvre-t-il une regex (valeur attendue) plutot qu'une division ?
function ouvreRegex(src, i) {
    var j = i - 1;
    while (j >= 0 && /\s/.test(src.charAt(j))) j--;
    if (j < 0) return true;
    var c = src.charAt(j);
    if ('(,=:[!&|?{};+-*%~^<>'.indexOf(c) >= 0) return true;   // operateur => valeur
    if (/[\w$]/.test(c)) {                                      // mot precede
        var deb = j;
        while (deb >= 0 && /[\w$]/.test(src.charAt(deb))) deb--;
        if (MOTS_CLES_REGEX[src.substring(deb + 1, j + 1)]) return true;
    }
    return false;                                              // valeur => division
}

// Index de fin d'une regex litterale ouverte a `i` (src[i] === '/').
function finRegex(src, i) {
    i++;
    var inClasse = false;
    while (i < src.length) {
        var c = src.charAt(i);
        if (c === '\\') { i += 2; continue; }
        if (c === '[') inClasse = true;
        else if (c === ']') inClasse = false;
        else if (c === '/' && !inClasse) return i + 1;
        else if (c === '\n') return i + 1;
        i++;
    }
    return i;
}

// Index de l'accolade fermante qui equilibre celle ouverte a `openIdx`.
function accoladeFermante(src, openIdx) {
    var depth = 0, i = openIdx;
    while (i < src.length) {
        var c = src.charAt(i);
        if (c === '/' && src.charAt(i + 1) === '/') {
            var nl = src.indexOf('\n', i); if (nl < 0) break; i = nl; continue;
        }
        if (c === '/' && src.charAt(i + 1) === '*') {
            var fc = src.indexOf('*/', i + 2); i = (fc < 0) ? src.length : fc + 2; continue;
        }
        if (c === '/' && ouvreRegex(src, i)) { i = finRegex(src, i); continue; }
        if (c === '"' || c === "'") { i = finChaine(src, i); continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return i; }
        i++;
    }
    return -1;
}

// Index du `;` qui termine l'instruction commencant a `debut` (profondeur 0,
// chaines / regex sautees).
function finInstruction(src, debut) {
    var i = debut, prof = 0;
    while (i < src.length) {
        var c = src.charAt(i);
        if (c === '/' && src.charAt(i + 1) === '/') {
            var nl = src.indexOf('\n', i); if (nl < 0) break; i = nl; continue;
        }
        if (c === '/' && src.charAt(i + 1) === '*') {
            var fc = src.indexOf('*/', i + 2); i = (fc < 0) ? src.length : fc + 2; continue;
        }
        if (c === '/' && ouvreRegex(src, i)) { i = finRegex(src, i); continue; }
        if (c === '"' || c === "'") { i = finChaine(src, i); continue; }
        if (c === '{' || c === '(' || c === '[') prof++;
        else if (c === '}' || c === ')' || c === ']') prof--;
        else if (c === ';' && prof === 0) return i;
        i++;
    }
    return -1;
}

// Recense les variables top-level `var NAME = ...;` (utile pour les constantes
// citees dans les fonctions pures, ex. EMOJI_STRIP).
function recenserVariables(src) {
    var re = /^var\s+([A-Za-z_$][\w$]*)\s*=/gm;
    var carte = {};
    var m;
    while ((m = re.exec(src)) !== null) {
        var fin = finInstruction(src, re.lastIndex);
        if (fin < 0) continue;
        carte[m[1]] = src.substring(m.index, fin + 1);
    }
    return carte;
}

// Recense toutes les fonctions top-level : nom -> { debut, fin } (sources brutes).
function recenserFonctions(src) {    var re = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
    var carte = {};
    var m;
    while ((m = re.exec(src)) !== null) {
        var nom = m[1];
        var open = src.indexOf('{', re.lastIndex);
        if (open < 0) continue;
        var close = accoladeFermante(src, open);
        if (close < 0) continue;
        carte[nom] = { debut: m.index, fin: close + 1, source: src.substring(m.index, close + 1) };
    }
    return carte;
}

// Fermeture transitive : la fonction demandee + toutes les fonctions du moteur
// qu'elle appelle (identifiants reconnus comme noms de fonctions top-level).
function extraireCloture(src, carte, racine) {
    var vus = {};
    var ordre = [];
    var pile = [racine];
    var estFonction = {};
    var k;
    for (k in carte) estFonction[k] = true;
    while (pile.length) {
        var nom = pile.pop();
        if (vus[nom] || !carte[nom]) continue;
        vus[nom] = true;
        ordre.push(nom);
        var corps = carte[nom].source;
        for (k in carte) {
            if (estFonction[k] && !vus[k]) {
                if (new RegExp('\\b' + k.replace(/\$/g, '\\$') + '\\s*\\(').test(corps)) pile.push(k);
            }
        }
    }
    return ordre.map(function (n) { return { nom: n, source: carte[n].source }; });
}

// ---------------------------------------------------------------------------
// 2. EXTRACTION + EVALUATION SANDBOXEE
// ---------------------------------------------------------------------------
var srcMoteur = fs.readFileSync(MOTEUR, 'utf8');
var carte = recenserFonctions(srcMoteur);

var nomsVoulus = ['parseMarkdown', 'getBlockPlainText', 'stripEmojis'];
var manquants = nomsVoulus.filter(function (n) { return !carte[n]; });
if (manquants.length) {
    console.error('ECHEC EXTRACTION : fonctions introuvables dans import_md.jsx -> ' + manquants.join(', '));
    process.exit(2);
}

var pieces = extraireCloture(srcMoteur, carte, 'parseMarkdown');
var cles = {};
pieces.concat(extraireCloture(srcMoteur, carte, 'getBlockPlainText')).forEach(function (p) {
    cles[p.nom] = p.source;
});

// Validation fonction par fonction : on isole toute fonction dont la source
// extraite ne se reparse pas (echec de decoupe -> erreur d'assemblage).
var nomsOk = [];
Object.keys(cles).forEach(function (nom) {
    try { new Function(cles[nom]); nomsOk.push(nom); }
    catch (e) { console.error('[DECOUPE KO] fonction ' + nom + ' : ' + e.message); }
});
if (nomsOk.length !== Object.keys(cles).length) process.exit(4);

var bundle = nomsOk.map(function (n) { return cles[n]; }).join('\n\n');

// 2bis. Constantes top-level referencees par le bundle (ex. EMOJI_STRIP).
var carteVars = recenserVariables(srcMoteur);
var varsRetenues = [];
Object.keys(carteVars).forEach(function (nom) {
    if (new RegExp('\\b' + nom.replace(/\$/g, '\\$') + '\\b').test(bundle)) varsRetenues.push(nom);
});
varsRetenues.forEach(function (nom) { bundle = carteVars[nom] + '\n' + bundle; });
// Annotation DA : quelques constantes globales peuvent etre citees dans les
// commentaires extraits ; on neutralise les references runtime non definies.
var shim = 'var app=undefined,$=undefined,global=undefined;';
var module_ = { exports: {} };
var fabrique = new Function(shim + '\n' + bundle + '\nreturn { parseMarkdown: parseMarkdown, getBlockPlainText: getBlockPlainText, stripEmojis: stripEmojis };');

var MOTEUR_PUR;
try {
    MOTEUR_PUR = fabrique();
} catch (e) {
    console.error('ECHEC EVALUATION du bundle extrait : ' + e.message);
    process.exit(3);
}

// ---------------------------------------------------------------------------
// 3. RECONSTRUCTION DES COMPTEURS D'ORACLE (JS pur, formule du moteur)
//    fullText = textes des blocs NON-table joints par "\r" (etape 1 du moteur).
// ---------------------------------------------------------------------------
var REGEX_EMOJI = /\p{Extended_Pictographic}/gu;      // Node >= 10
var REGEX_VS = /\uFE0F/g;                             // selecteur de variation

function mesurer(blocs) {
    var parts = [], tables = 0, texte = 0;
    for (var i = 0; i < blocs.length; i++) {
        if (blocs[i].type === 'table') { tables++; continue; }
        parts.push(MOTEUR_PUR.getBlockPlainText(blocs[i]));
        texte++;
    }
    var fullText = parts.join('\r');
    var crCount = 0;
    for (var c = 0; c < fullText.length; c++) if (fullText.charAt(c) === '\r') crCount++;
    var emojis = (fullText.match(REGEX_EMOJI) || []).length + (fullText.match(REGEX_VS) || []).length;
    return {
        types: blocs.map(function (b) { return b.type; }),
        total_blocs_parses: blocs.length,
        blocs_texte_attendus: texte,
        tables: tables,
        fullText_length: fullText.length,
        crCount: crCount,
        paragraphes_attendus: fullText.length > 0 ? crCount + 1 : 0,
        emojis_restants: emojis,
        fullText: fullText
    };
}

function egalProfond(a, b) {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) if (!egalProfond(a[ka[i]], b[ka[i]])) return false;
    return true;
}

// ---------------------------------------------------------------------------
// 4. EXECUTION CONTRE LES FIXTURES
// ---------------------------------------------------------------------------
var fichiers = fs.readdirSync(FIXTURES).filter(function (f) { return /\.expected\.json$/.test(f); }).sort();
var totalChecks = 0, totalOk = 0;
var echecs = [];

console.log('===========================================================================');
console.log('BANC NODE — reexecution du VRAI parseur du moteur hors InDesign');
console.log('Moteur : import_md.jsx (' + Buffer.byteLength(srcMoteur, 'utf8') + ' octets)');
console.log('Bundle extrait : ' + nomsOk.length + ' fonction(s) pure(s)');
console.log('===========================================================================');

fichiers.forEach(function (fExp) {
    var base = fExp.replace(/\.expected\.json$/, '');
    var fMd = path.join(FIXTURES, base + '.md');
    if (!fs.existsSync(fMd)) { console.log('\n[SKIP] ' + base + ' (pas de .md)'); return; }

    var attendu = JSON.parse(fs.readFileSync(path.join(FIXTURES, fExp), 'utf8'));
    var md = fs.readFileSync(fMd, 'utf8');
    var blocs = MOTEUR_PUR.parseMarkdown(md);
    var mesure = mesurer(blocs);

    console.log('\n--- ' + base + ' ---');
    // Recap lisible : combien de titres le parseur a REELLEMENT atteints
    // (contre l'idee recue « il s'arrete avant le 2e H2 »).
    var parType = {};
    mesure.types.forEach(function (t) { parType[t] = (parType[t] || 0) + 1; });
    var recap = Object.keys(parType).sort().map(function (t) { return t + '=' + parType[t]; }).join(' ');
    console.log('  profil : ' + mesure.total_blocs_parses + ' blocs | ' + recap);
    var checks = [];
    var estTableau = Array.isArray(attendu);

    if (estTableau) {
        checks.push(['nombre de blocs', mesure.total_blocs_parses, attendu.length]);
        checks.push(['sequence de types',
            mesure.types.join(','),
            attendu.map(function (x) { return x.type; }).join(',')]);
        // Comparaison du texte des blocs non-table. Convention des oracles
        // `*.expected.json` : texte BRUT de `block.text` (marqueurs inline et
        // emojis compris), pas le texte nettoye de `getBlockPlainText`.
        var attenduTexte = [], obtenuBrut = [], obtenuNettoye = [];
        for (var i = 0; i < attendu.length; i++) {
            if (attendu[i].type === 'table') continue;
            attenduTexte.push(String(attendu[i].text));
            obtenuBrut.push(String(blocs[i] ? blocs[i].text : '<absent>'));
            obtenuNettoye.push(String(blocs[i] ? MOTEUR_PUR.getBlockPlainText(blocs[i]) : '<absent>'));
        }
        var convBrut = obtenuBrut.join('\u0001') === attenduTexte.join('\u0001');
        checks.push(['textes des blocs',
            (convBrut ? obtenuBrut : obtenuNettoye).join('\u0001'),
            attenduTexte.join('\u0001')]);
    } else {
        checks.push(['total_blocs_parses', mesure.total_blocs_parses, attendu.total_blocs_parses]);
        checks.push(['blocs_texte_attendus', mesure.blocs_texte_attendus, attendu.blocs_texte_attendus]);
        checks.push(['fullText_length', mesure.fullText_length, attendu.fullText_length]);
        checks.push(['crCount', mesure.crCount, attendu.crCount]);
        checks.push(['paragraphes_attendus', mesure.paragraphes_attendus, attendu.paragraphes_attendus]);
        checks.push(['tables', mesure.tables, attendu.tables]);
        checks.push(['emojis_restants', mesure.emojis_restants, attendu.emojis_restants]);
        checks.push(['sequence de types', mesure.types.join(','), attendu.types.join(',')]);
    }

    checks.forEach(function (c) {
        var ok = (c[1] === c[2]);
        totalChecks++; if (ok) totalOk++; else echecs.push(base + ' :: ' + c[0]);
        var marque = ok ? 'OK  ' : 'ECHEC';
        console.log('  [' + marque + '] ' + c[0]);
        if (!ok) {
            var g = String(c[1]), a = String(c[2]);
            console.log('        obtenu   : ' + (g.length > 240 ? g.substring(0, 240) + '…' : g));
            console.log('        attendu  : ' + (a.length > 240 ? a.substring(0, 240) + '…' : a));
            if (c[0] === 'sequence de types') {
                var gg = g.split(','), aa = a.split(',');
                console.log('        longueurs : obtenu=' + gg.length + ' attendu=' + aa.length);
                for (var k = 0; k < Math.max(gg.length, aa.length); k++) {
                    if (gg[k] !== aa[k]) {
                        console.log('        1er ecart a l\'index ' + k + ' : obtenu=' +
                            (gg[k] || '<absent>') + ' attendu=' + (aa[k] || '<absent>'));
                        break;
                    }
                }
            }
        }
    });
});

console.log('\n===========================================================================');
console.log('RESULTAT : ' + totalOk + '/' + totalChecks + ' controles OK');
if (echecs.length) { console.log('ECHECS : ' + echecs.join(' | ')); }
console.log('RAPPEL : ce banc ne prouve QUE le parseur (logique pure).');
console.log('         Les styles (etape 2), les tables (etape 6), l\'ancrage et le');
console.log('         Ctrl+Z n\'existent qu\'au runtime InDesign (wiki Cas 27).');
console.log('===========================================================================');
process.exit(echecs.length ? 1 : 0);

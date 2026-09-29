// sim_05_empreinte.js — MISSION 05 (voie B) : SIMULATION NODE DE LA LOGIQUE PURE.
//
// Objet : valider la LOGIQUE et la SYNTAXE de l'empreinte-maison AVANT tout test
// réel InDesign (méthode imposée par la mission 05, même ordre que la mission 03 :
// « la simulation attrape la syntaxe et la logique, le réel attrape l'API »).
//
// CE QUE CETTE SIMULATION PROUVE : la fonction de somme de contrôle, le format
// plat sérialisé/désérialisé (avec échappement), la machine à états de comparaison.
// CE QU'ELLE NE PROUVE PAS : que `File.length`, `File.modified` et `File.read()`
// existent et se comportent ainsi au runtime ExtendScript. Cela relève de la sonde
// réelle, pas d'ici. Ne JAMAIS lire dans cette sortie plus qu'elle ne contient.
//
// Exécution : node tools/sim_05_empreinte.js

// ---------------------------------------------------------------------------
// 1. SOMME DE CONTRÔLE (extraite du code ES3 cible, sans dépendance Node)
//    Accumulation polynomiale modulaire : sum = (sum*31 + code) % 2147483647.
//    Bornes : sum < 2^31, sum*31 < 6.7e10 << 2^53 ⇒ aucune perte de précision
//    en double. Déterministe, insensible au type de saut de ligne SEULEMENT si
//    le contenu lu est identique — d'où la mesure réelle du \r vs \n (hors simu).
// ---------------------------------------------------------------------------
function checksumOf(content) {
    var sum = 0;
    for (var i = 0; i < content.length; i++) {
        sum = (sum * 31 + content.charCodeAt(i)) % 2147483647;
    }
    return sum;
}

// ---------------------------------------------------------------------------
// 2. FORMAT PLAT — question 5 de la mission : le format accepte-t-il la valeur
//    d'empreinte SANS AMBIGUÏTÉ ? Réponse retenue : on RÉUTILISE le couple
//    serializeFlatMapping/deserializeFlatMapping déjà éprouvé par md-style-map
//    (échappement de \ et "), donc AUCUN séparateur n'est introduit : le chemin
//    d'un fichier peut contenir des guillemets, des accolades, des virgules —
//    tout est échappé. C'est la raison du choix, pas un confort.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 3. CONSTRUCTION DE L'EMPREINTE
//    L'empreinte n'est PAS un hash cryptographique (impossible en ES3 sans
//    crypto). C'est un TRIPLET redondant : taille + date + somme de contrôle.
//    Redondance VOULUE : la date seule est fragile (copie, restauration, touch,
//    résolution 1 s sur certains systèmes de fichiers), la taille seule l'est
//    plus encore (deux fichiers de même taille indiscernables). La somme de
//    contrôle, elle, voit toute modification de contenu.
// ---------------------------------------------------------------------------
var FINGERPRINT_VERSION = "1";

function buildFingerprint(facts) {
    return {
        v: FINGERPRINT_VERSION,
        size: String(facts.size),
        modified: String(facts.modifiedMs),
        checksum: String(facts.checksum),
        name: String(facts.name)
    };
}

function serializeFingerprint(fp) {
    return serializeFlatMapping(fp);
}

function parseFingerprint(raw) {
    var o = deserializeFlatMapping(raw);
    if (!o || !o.v) return null;   // valeur absente ou d'un format inconnu
    return o;
}

// ---------------------------------------------------------------------------
// 4. MACHINE À ÉTATS — c'est ELLE qui est le cœur de la voie B.
//    Entrées : le label brut du document (ou null), l'existence de la source,
//    et l'empreinte recalculée (ou null si la source est illisible).
//    Sortie  : un état nommé, jamais un booléen — parce que « différent » et
//              « source absente » exigent des réactions DIFFÉRENTES.
// ---------------------------------------------------------------------------
var ETAT_JAMAIS_IMPORTE = "jamais_importe";
var ETAT_IDENTIQUE = "identique";
var ETAT_DIFFERENT = "different";
var ETAT_SOURCE_ABSENTE = "source_absente";

// DÉCISION TRANCHÉE (exécuteur, à MESURER par la sonde réelle avant d'être tenue
// pour acquise) : la comparaison porte sur TAILLE + SOMME DE CONTRÔLE, *pas* sur
// la date de modification. Raison : `File.modified` décrit le FICHIER, pas le
// CONTENU — ré-enregistrer un .md sans en changer un caractère (ou le restaurer
// depuis une sauvegarde, ou le `touch`er) ferait alerter à tort. La somme de
// contrôle, elle, ne bouge que si le contenu change. `modified` reste STOCKÉ et
// journalisé (diagnostic humain), mais ne décide pas.
function decideState(storedRaw, sourceExists, currentFp) {
    var stored = parseFingerprint(storedRaw);
    if (!stored) return ETAT_JAMAIS_IMPORTE;           // document jamais importé par nous
    if (!sourceExists) return ETAT_SOURCE_ABSENTE;     // le .md a disparu
    if (!currentFp) return ETAT_SOURCE_ABSENTE;        // illisible ⇒ même traitement que disparu
    if (stored.checksum === currentFp.checksum &&
        stored.size === currentFp.size) {
        return ETAT_IDENTIQUE;
    }
    return ETAT_DIFFERENT;
}

// ---------------------------------------------------------------------------
// 5. HARNESS — assertions + CONTRÔLE NÉGATIF (mission : « un test qui ne peut
//    pas échouer ne prouve rien »). Le contrôle négatif vérifie que le comparateur
//    DÉTECTE bien un écart là où l'écart existe — donc qu'il n'est pas un
//    comparateur qui répond toujours « identique ».
// ---------------------------------------------------------------------------
var echecs = 0;
var total = 0;

function check(label, obtenu, attendu) {
    total++;
    var ok = (obtenu === attendu);
    if (!ok) echecs++;
    console.log((ok ? "  OK  " : " FAIL ") + label + " | attendu=" + attendu + " | obtenu=" + obtenu);
}

console.log("=== sim_05_empreinte.js — logique pure de la voie B ===\n");

// --- 5.1 somme de contrôle : déterministe, sensible au moindre caractère ---
console.log("[1] checksum");
var cA = checksumOf("# Titre\rParagraphe.\r");
var cA2 = checksumOf("# Titre\rParagraphe.\r");
var cB = checksumOf("# Titre\rParagraphe!\r");
check("reproductible (deux lectures identiques)", cA === cA2, true);
check("sensible (1 caractere change)", cA !== cB, true);
check("1 caractere change => checksum different", cA !== cB, true);
check("cas vide deterministe", checksumOf("") === checksumOf(""), true);

// --- 5.2 format plat : roundtrip + échappement (question 5) ---
console.log("\n[2] format plat (roundtrip + echappement)");
var fpNormal = buildFingerprint({ size: 1234, modifiedMs: 1759000000000, checksum: 987654321, name: "cours.md" });
var rawNormal = serializeFingerprint(fpNormal);
check("roundtrip champs stables", deserializeFlatMapping(rawNormal).checksum, "987654321");

// PIÈGE RÉEL VISÉ : un chemin/nom contenant guillemet, accolade, virgule, backslash.
var fpPiege = buildFingerprint({
    size: 42,
    modifiedMs: 1,
    checksum: 7,
    name: 'a"b{c},d\\e.md'
});
var rawPiege = serializeFingerprint(fpPiege);
var reluPiege = deserializeFlatMapping(rawPiege);
check("nom piege roundtrip (guillemet+accolade+virgule+backslash)", reluPiege.name, 'a"b{c},d\\e.md');
check("nom piege : le champ name ne 'deborde' pas en champs parasites", Object.keys(reluPiege).length, 5);
check("nom piege : les 5 cles attendues sont presentes", Object.keys(reluPiege).sort().join(","), "checksum,modified,name,size,v");

// --- 5.3 machine à états : les 3 états exigés + l'état initial ---
console.log("\n[3] machine a etats");
var stored = serializeFingerprint(buildFingerprint({ size: 100, modifiedMs: 555, checksum: 4242, name: "x.md" }));
var same = buildFingerprint({ size: 100, modifiedMs: 555, checksum: 4242, name: "x.md" });
var other = buildFingerprint({ size: 100, modifiedMs: 555, checksum: 4243, name: "x.md" });
var sameSizeOtherDate = buildFingerprint({ size: 100, modifiedMs: 999, checksum: 4242, name: "x.md" });

check("aucun label => jamais_importe", decideState(null, true, same), ETAT_JAMAIS_IMPORTE);
check("label vide => jamais_importe", decideState("", true, same), ETAT_JAMAIS_IMPORTE);
check("label + source presente + identique", decideState(stored, true, same), ETAT_IDENTIQUE);
check("label + source presente + checksum different", decideState(stored, true, other), ETAT_DIFFERENT);
check("label + source presente + taille differente", decideState(stored, true, buildFingerprint({ size: 101, modifiedMs: 555, checksum: 4242, name: "x.md" })), ETAT_DIFFERENT);
check("label + source absente", decideState(stored, false, null), ETAT_SOURCE_ABSENTE);
check("label + source presente mais illisible", decideState(stored, true, null), ETAT_SOURCE_ABSENTE);
// DÉCISION : une DATE qui bouge SEULE (même contenu, même taille) ne doit PAS
// alerter — c'est le contrôle du choix « la date ne décide pas ».
check("meme contenu, date differente (touch/re-enregistrement) => identique", decideState(stored, true, sameSizeOtherDate), ETAT_IDENTIQUE);

// --- 5.4 CONTRÔLE NÉGATIF — le comparateur n'est PAS un « toujours identique » ---
console.log("\n[4] controle negatif (le comparateur doit savoir dire 'different')");
var unSeulCaractere = checksumOf("abc") !== checksumOf("abd");
check("[negatif] un comparateur qui ignore le checksum serait aveugle", unSeulCaractere, true);
var nIdentiques = 0;
var nDifferents = 0;
var corpus = ["abc", "abd", "abe", "abc ", "abc\r", "ab", "abcd"];
var i, j;
for (i = 0; i < corpus.length; i++) {
    for (j = 0; j < corpus.length; j++) {
        if (i === j) continue;
        if (checksumOf(corpus[i]) === checksumOf(corpus[j])) nIdentiques++;
        else nDifferents++;
    }
}
check("[negatif] aucune collision sur 7 variantes proches", nIdentiques, 0);
check("[negatif] toutes les paires distinctes sont vues distinctes", nDifferents, 42);

// --- 5.5 le format d'empreinte n'entre PAS en collision avec md-style-map ---
console.log("\n[5] separation des deux labels (non-regression)");
var mappingLabel = serializeFlatMapping({ h1: "Titre 1", p: "Paragraphe" });
check("le label mapping ne porte PAS de cle v", deserializeFlatMapping(mappingLabel).v, undefined);
check("le label empreinte est reconnu par sa cle v", parseFingerprint(stored).v, "1");
check("un mapping relu comme empreinte => null (jamais confondu)", parseFingerprint(mappingLabel), null);

console.log("\n=== RESULTAT : " + (total - echecs) + "/" + total + " verifications OK, " + echecs + " echec(s) ===");
process.exit(echecs === 0 ? 0 : 1);

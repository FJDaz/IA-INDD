// probe_05ter_integration.jsx — MISSION 05 : VÉRIFICATION DE L'INTÉGRATION RÉELLE.
//
// Objet : le code des fonctions M05 est-il CELUI DE import_md.jsx, et se comporte-t-il
// comme la sonde jetable l'a mesuré ? On ne recopie AUCUNE fonction ici : on lit le
// fichier réel, on coupe la queue (le module de menu + l'appel main()) pour ne RIEN
// exécuter, puis on évalue le reste et on appelle SES fonctions.
//
// Aucun document de l'utilisateur n'est touché : on crée un document JETABLE, et on le
// ferme sans enregistrer. Les boîtes (alertUser / demanderConfirmationM05) sont
// détournées par NOS variables — jamais par le global `confirm`, mesuré NON écrasable
// (cf. section 5bis du journal de la sonde 05).
//
// Sortie : /private/tmp/probe_05ter.log

var LOG = "/private/tmp/probe_05ter.log";
var SRC_SCRIPT = "~/INDD/IMPORT_MD/import_md.jsx";
var CUT = "/private/tmp/m05_import_cut.jsx";
var SRC_MD = "/private/tmp/m05_src.md";
var TMP_FP = "/private/tmp/m05_fp_label.txt";

var lg = new File(LOG);
lg.encoding = "UTF-8";
lg.open("w");
function log(t) { lg.writeln(String(t)); }
function line() { log("------------------------------------------------------------"); }
var OK = 0;
var FAIL = 0;
function check(nom, obtenu, attendu) {
    var o = String(obtenu);
    var a = String(attendu);
    if (o === a) { OK++; log("OK   " + nom + " | attendu=" + a); }
    else { FAIL++; log("FAIL " + nom + " | attendu=" + a + " | obtenu=" + o); }
}

var docJetable = null;
var docsAuDepart = app.documents.length;
var docUtilisateur = (docsAuDepart > 0) ? app.activeDocument : null;

line();
log("=== 05ter. VERIFICATION DE L'INTEGRATION REELLE (import_md.jsx) ===");
log("app.version = " + app.version + " | documents au depart = " + docsAuDepart);

// ---------------------------------------------------------------------------
// 1. Charger le VRAI code, sans exécuter l'import.
// ---------------------------------------------------------------------------
line();
log("### 1. chargement du vrai code (queue coupee)");
var srcFile = new File(SRC_SCRIPT);
var source = "";
try {
    srcFile.encoding = "UTF-8";
    if (!srcFile.open("r")) { throw new Error("ouverture impossible"); }
    source = srcFile.read();
    srcFile.close();
    check("1 import_md.jsx lu", (source.length > 100000), "true");
} catch (eRead) {
    log("FATAL : lecture de import_md.jsx impossible -> " + eRead.message);
    lg.close();
    throw eRead;
}

var marqueur = "// Exécuter le script";
var pos = source.indexOf(marqueur);
check("1 marqueur de fin d'execution trouve", (pos > 0), "true");
log("  position du marqueur = " + pos + " / " + source.length);
var coupe = source.substring(0, pos);
var queue = source.substring(pos);
check("[negatif] la queue contient bien l'appel main()", (queue.indexOf("main();") !== -1), "true");
check("[negatif] la partie evaluee NE contient PAS d'appel main() nu", (coupe.indexOf("\nmain();") === -1), "true");

var cutFile = new File(CUT);
cutFile.encoding = "UTF-8";
cutFile.open("w");
cutFile.write(coupe);
cutFile.close();
$.evalFile(cutFile);
check("1 le code de import_md.jsx est charge (m05ChecksumOf existe)", (typeof m05ChecksumOf), "function");
check("1 decider d'etat disponible", (typeof m05DecideState), "function");
check("1 verificateur disponible", (typeof verifierSourceMarkdown), "function");
check("1 sauvegarde d'empreinte disponible", (typeof saveSourceFingerprint), "function");
check("1 le label M05 est celui attendu", LABEL_SOURCE_FP, "md-source-fingerprint");
check("1 le label de mapping est inchange", LABEL_NAME, "md-style-map");

// ---------------------------------------------------------------------------
// 2. V1 sur les fonctions INTÉGRÉES : reproductible ET sensible.
// ---------------------------------------------------------------------------
line();
log("### 2. V1 sur le code integre");
function ecrireSource(txt) {
    var f = new File(SRC_MD);
    f.encoding = "UTF-8";
    f.open("w");
    f.write(String(txt));
    f.close();
}
var V1 = "# Titre Niveau 1\r## Titre Niveau 2\rUn paragraphe ordinaire.\r";
var V2 = "# Titre Niveau 1\r## Titre Niveau 2\rUn paragraphe ORDINAIRE.\r";
check("[montage] V1 et V2 ont la MEME longueur", V1.length, V2.length);
check("[negatif] V1 et V2 different vraiment", (V1 !== V2), "true");

ecrireSource(V1);
var fpA = m05BuildFingerprint(new File(SRC_MD));
var fpB = m05BuildFingerprint(new File(SRC_MD));
check("2 empreinte non nulle", (fpA !== null), "true");
check("2 V1 reproductible (2 lectures => meme somme)", fpA.checksum, fpB.checksum);
check("2 V1 reproductible (2 lectures => meme taille)", fpA.size, fpB.size);
check("2 la version est inscrite dans l'empreinte", fpA.v, "1");
check("2 le chemin absolu est stocke (decision Q4)", fpA.path, SRC_MD);

ecrireSource(V2);
var fpC = m05BuildFingerprint(new File(SRC_MD));
check("2 V1 sensible (1 caractere change => somme differente)", (fpC.checksum !== fpA.checksum), "true");
check("2 et pourtant la taille n'a PAS bouge", fpC.size, fpA.size);

ecrireSource(V1);
var fpD = m05BuildFingerprint(new File(SRC_MD));
check("[negatif] revenir au contenu initial rend la MEME somme", fpD.checksum, fpA.checksum);

// Aparté mesuré : la date ne bouge pas sur un changement de contenu immédiat.
log("  date V1 = " + fpA.modified + " | date V2 = " + fpC.modified + " | identiques = " + (fpA.modified === fpC.modified));
check("[negatif] la date n'entre PAS dans la decision (somme differente, date possiblement egale)", (fpA.checksum !== fpC.checksum), "true");

// ---------------------------------------------------------------------------
// 3. Q5 : l'aller-retour du format plat ne perd ni le chemin ni la somme.
// ---------------------------------------------------------------------------
line();
log("### 3. Q5 — aller-retour du label plat");
var brut = serializeFlatMapping(fpA);
var relu = m05ParseFingerprint(brut);
check("3 relecture non nulle", (relu !== null), "true");
check("3 le chemin absolu survit a l'aller-retour", relu.path, SRC_MD);
check("3 la somme survit a l'aller-retour", relu.checksum, fpA.checksum);
check("3 la version survit a l'aller-retour", relu.v, "1");
check("3 le nom de fichier survit", relu.name, "m05_src.md");
check("[negatif] un label vide ne produit PAS d'empreinte", m05ParseFingerprint(""), "null");
check("[negatif] un label sans version est REJETE", m05ParseFingerprint('{"size":"1","checksum":"2"}'), "null");
var avecGuillemet = serializeFlatMapping({ v: "1", path: '/tmp/un "chemin" bizarre.md' });
var reluG = m05ParseFingerprint(avecGuillemet);
check("3 un chemin contenant des guillemets survit", reluG.path, '/tmp/un "chemin" bizarre.md');

// ---------------------------------------------------------------------------
// 4. V3 sur un document RÉEL jetable : les 4 états, produits par le code intégré.
// ---------------------------------------------------------------------------
line();
log("### 4. V3 — les 4 etats sur un document reel jetable");
try {
    docJetable = app.documents.add();
} catch (eAdd) {
    log("FATAL : creation du document jetable impossible -> " + eAdd.message);
}
if (docJetable) {
    var nomDoc = "";
    try { nomDoc = docJetable.name; } catch (eNd) {}
    log("  document jetable cree : " + nomDoc + " | documents = " + app.documents.length);

    // 4a. label absent : que renvoie extractLabel exactement ? (question du wiki)
    var brutAbsent = null;
    try { brutAbsent = docJetable.extractLabel(LABEL_SOURCE_FP); } catch (eAbs) { brutAbsent = "EXCEPTION:" + eAbs.message; }
    log("  extractLabel sur label ABSENT -> typeof=" + (typeof brutAbsent) + " | valeur='" + brutAbsent + "'");
    check("4a etat 'jamais importe' quand aucun label n'existe", verifierSourceMarkdown(docJetable).etat, "jamais_importe");

    // 4b. mapping existant : on le pose AVANT pour verifier la non-regression.
    var MAPPING_TEMOIN = '{"h1":"Titre 1","h2":"Titre 2"}';
    docJetable.insertLabel(LABEL_NAME, MAPPING_TEMOIN);
    check("4b temoin de mapping en place", docJetable.extractLabel(LABEL_NAME), MAPPING_TEMOIN);

    // 4c. on importe V1 => l'empreinte est ecrite
    ecrireSource(V1);
    check("4c saveSourceFingerprint reussit", saveSourceFingerprint(new File(SRC_MD)), "true");
    check("4c etat IDENTIQUE apres enregistrement", verifierSourceMarkdown(docJetable).etat, "identique");

    // 4d. non-regression du mapping
    check("4d NON-REGRESSION : md-style-map intact", docJetable.extractLabel(LABEL_NAME), MAPPING_TEMOIN);

    // 4e. la source change => etat DIFFERENT, et la boite est bien appelee
    ecrireSource(V2);
    var boites = [];
    var vraiDemandeur = demanderConfirmationM05;
    var vraiAlert = alertUser;
    var rAccepte = null;
    var rRefuse = null;
    try {
        demanderConfirmationM05 = function (m) { boites.push("APPEL::" + m); return true; };
        rAccepte = verifierSourceMarkdown(docJetable);
        demanderConfirmationM05 = function (m) { boites.push("APPEL::" + m); return false; };
        rRefuse = verifierSourceMarkdown(docJetable);
    } catch (eBox) {
        log("  exception pendant le detournement des boites : " + eBox.message);
    } finally {
        demanderConfirmationM05 = vraiDemandeur;
        alertUser = vraiAlert;
    }
    check("4e etat DIFFERENT quand la source a change", rAccepte ? rAccepte.etat : "null", "different");
    check("4e accepter => relance = true (pipeline complet relance)", rAccepte ? rAccepte.relance : "null", "true");
    check("4e la source a relancer est bien le chemin memorise", rAccepte ? rAccepte.chemin : "null", SRC_MD);
    check("4e refuser => relance = false", rRefuse ? rRefuse.relance : "null", "false");
    check("4e la boite a bien ete appelee 2 fois", boites.length, 2);
    check("[negatif] les 2 appels portent le message attendu", (boites[0].indexOf("a changé") !== -1), "true");
    check("[negatif] le demandeur reel est restaure", (demanderConfirmationM05 === vraiDemandeur), "true");
    check("[negatif] l'alerte reelle est restauree", (alertUser === vraiAlert), "true");

    // 4f. source absente : on DETOURNE alertUser, sinon la boite reelle bloque la sonde.
    var sourcesAbsentes = [];
    var vraiAlert2 = alertUser;
    var rAbsent = null;
    try {
        alertUser = function (m) { sourcesAbsentes.push("ALERTE::" + m); };
        var fSrc = new File(SRC_MD);
        if (fSrc.exists) { fSrc.remove(); }
        rAbsent = verifierSourceMarkdown(docJetable);
    } catch (eAbs2) {
        log("  exception pendant l'etat source absente : " + eAbs2.message);
    } finally {
        alertUser = vraiAlert2;
    }
    check("4f etat SOURCE_ABSENTE quand le fichier a disparu", rAbsent ? rAbsent.etat : "null", "source_absente");
    check("4f source absente => AUCUNE relance automatique", rAbsent ? rAbsent.relance : "null", "false");
    check("4f l'utilisateur est bien prevenu (1 alerte)", sourcesAbsentes.length, 1);
    check("[negatif] l'alerte reelle est restauree apres coup", (alertUser === vraiAlert2), "true");

    // 4g. non-regression finale du mapping, tous etats confondus
    check("4g NON-REGRESSION finale : md-style-map intact", docJetable.extractLabel(LABEL_NAME), MAPPING_TEMOIN);
    check("4g l'empreinte est bien un label distinct du mapping", (LABEL_SOURCE_FP !== LABEL_NAME), "true");
}

// ---------------------------------------------------------------------------
// 5. Nettoyage : le document jetable est ferme SANS enregistrer.
// ---------------------------------------------------------------------------
line();
log("### 5. nettoyage");
if (docJetable) {
    try { docJetable.close(SaveOptions.NO); } catch (eClose) { log("  fermeture a signale : " + eClose.message); }
}
check("5 nombre de documents revenu a l'etat d'entree", app.documents.length, docsAuDepart);
if (docUtilisateur) {
    try { app.activeDocument = docUtilisateur; } catch (eAct) { log("  reactivation du document utilisateur : " + eAct.message); }
    check("[negatif] le document de l'utilisateur n'a pas ete ferme", app.documents.length, docsAuDepart);
}
ecrireSource("contenu de controle, sans importance");

line();
log("=== RESULTAT : " + OK + "/" + (OK + FAIL) + " controles OK, " + FAIL + " echec(s) ===");
log("=== FIN probe_05ter_integration.jsx ===");
lg.close();

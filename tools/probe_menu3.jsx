// probe_menu3.jsx - SONDE 3 : QUEL CABLAGE DE DECLENCHEUR MARCHE VRAIMENT ?
// Mission 03, etape 9. DIAGNOSTIC SEUL : ne touche PAS au livrable import_md.jsx.
//
// Constat reel a expliquer (test FJD du 28/09/2026, journal du panneau) :
//   - l'entree de menu est bien CREEE :
//       "M03-etape9: entree de menu creee -> 'Importer un MD' apres
//        'Importer...' | menu='Fichier' items 29 -> 30 | eventType=onInvoke"
//   - mais le gestionnaire n'a JAMAIS ete appele : aucune ligne
//       "M03-etape9: entree de menu '...' invoquee -> appel main()"
//     alors que main() a bien tourne au lancement du script (lignes PIVOT).
//   - un clic sur l'entree a produit une ALERTE ExtendScript (bouton "Non").
//
// Question mesuree ici, par l'experience et non par deduction :
//   quel type de gestionnaire declenche reellement une ScriptMenuAction au
//   clic, dans InDesign 21.6.0.57 fr_FR ?
//     A) une fonction DU SCRIPT (closure sur les variables du script)
//     B) idem, mais sur BEFORE_INVOKE au lieu de ON_INVOKE
//     C) une fonction AUTONOME (new Function : aucune variable du script)
//     D) un FICHIER de script (handler: File, autorise par la doc officielle)
//
// MODE D'EMPLOI (FJD) :
//   1) lancer ce script depuis le panneau Scripts (double-clic).
//   2) ouvrir le menu Fichier : en BAS du menu se trouvent les entrees de test.
//      Cliquer sur [S3-A], puis [S3-B], puis [S3-C], puis [S3-D].
//      Si une alerte ExtendScript apparait, repondre "Oui" et continuer.
//   3) cliquer enfin sur [S3-CLEAN] pour retirer toutes les entrees de test.
//   4) lire le journal probe_menu3.log (chemin indique par l'alerte finale).
//
// Pur ASCII (lecon encodage). Ni JSON ni Array.indexOf (ExtendScript ES3).

var PROBE_LOG_PATH = new File($.fileName).parent.fsName + "/probe_menu3.log";
var COMPANION_PATH = new File($.fileName).parent.fsName + "/probe_menu3_file_handler.jsx";

// Chemin du journal utilise par les gestionnaires A, B et C. Il doit rester
// disponible meme si les variables globales du script ont disparu au moment du
// clic (c'est justement l'hypothese a tester) : on l'obtient donc a partir de
// $.fileName, un global du MOTEUR et non une variable du script. Cela evite tout
// chemin personnel en dur, le script s'executant depuis le panneau Scripts.
var HARD_LOG_PATH = new File($.fileName).parent.fsName + "/probe_menu3.log";

var PREFIX = "[S3-";
var MENU_NAME = "Fichier";
var LINES = [];

function p(msg) { LINES.push(String(msg)); }

function writeLog() {
    var f = new File(PROBE_LOG_PATH);
    f.encoding = "UTF-8";
    if (f.open("w")) {
        f.write(LINES.join("\n") + "\n");
        f.close();
    }
}

// Ecriture en mode AJOUT avec le chemin EN DUR. Utilisee apres writeLog() pour
// ne jamais ecraser ce que les gestionnaires viennent d'ecrire.
function appendDirect(line) {
    try {
        var f = new File(HARD_LOG_PATH);
        f.encoding = "UTF-8";
        if (f.open("a")) {
            f.write(String(new Date()) + " " + line + "\n");
            f.close();
        }
    } catch (e) {}
}

function s(v) {
    if (v === null) return "(null)";
    if (v === undefined) return "(undefined)";
    try { return String(v); } catch (e) { return "(?)"; }
}

function attempt(label, fn) {
    try {
        var r = fn();
        p("  [OK] " + label + (r === undefined ? "" : " -> " + s(r)));
        return r;
    } catch (e) {
        p("  !! " + label + " -> ECHEC: " + e.message + " | name=" + s(e.name) +
          " | number=" + s(e.number));
        return undefined;
    }
}

function safeTitle(o) { try { return s(o.title); } catch (e) { return "(?)"; } }
function safeName(o) { try { return s(o.name); } catch (e) { return "(?)"; } }

// Ne JAMAIS comparer un title de menu InDesign tel quel : les libelles fr_FR
// portent les esperluettes d'accelerateur ("&Fichier", "I&mporter...") - piege
// qui a fait echouer la sonde 2 (cible existante declaree INTROUVABLE).
function normTitle(v) {
    if (v === null || v === undefined) return "";
    return String(v).replace(/&/g, "");
}

function jsQuote(v) {
    return "'" + String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

function findMainMenu() {
    var menus = app.menus;
    var byName = null;
    try { byName = menus.itemByName("Main"); } catch (e) {}
    if (byName) return byName;
    for (var i = 0; i < menus.length; i++) {
        if (normTitle(safeTitle(menus[i])) === "Main" || String(safeName(menus[i])) === "Main") {
            return menus[i];
        }
    }
    return null;
}

function findSubmenuByTitle(parent, wanted) {
    var subs = parent.submenus;
    for (var i = 0; i < subs.length; i++) {
        if (normTitle(safeTitle(subs[i])) === wanted || String(safeName(subs[i])) === wanted) {
            return subs[i];
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// GESTIONNAIRE A - fonction DU SCRIPT, evenement ON_INVOKE
// Ecrit d'abord avec un chemin obtenu SANS aucune variable du script
// ($.fileName, global du moteur), puis rapporte ce qu'il voit des variables
// globales du script.
// ---------------------------------------------------------------------------
function s3HandlerA(event) {
    try {
        var f = new File(new File($.fileName).parent.fsName + "/probe_menu3.log");
        f.encoding = "UTF-8";
        if (f.open("a")) {
            f.write(String(new Date()) + " [S3-A] FONCTION DU SCRIPT + ON_INVOKE : DECLENCHE" +
                    " | typeof main=" + (typeof main) +
                    " | typeof PROBE_LOG_PATH=" + (typeof PROBE_LOG_PATH) +
                    " | typeof findSubmenuByTitle=" + (typeof findSubmenuByTitle) +
                    " | typeof LINES=" + (typeof LINES) +
                    " | $.fileName=" + $.fileName +
                    " | $.global.__S3_MARKER=" + (typeof $.global.__S3_MARKER) + "\n");
            f.close();
        }
    } catch (eA) {
        try {
            var fe = new File(new File($.fileName).parent.fsName + "/probe_menu3.log");
            fe.encoding = "UTF-8";
            if (fe.open("a")) {
                fe.write(String(new Date()) + " [S3-A] ECHEC D'ECRITURE: " + eA.message + "\n");
                fe.close();
            }
        } catch (eA2) {}
    }
}

// ---------------------------------------------------------------------------
// GESTIONNAIRE B - fonction DU SCRIPT, evenement BEFORE_INVOKE
// Teste si c'est le CHOIX DE L'EVENEMENT qui change quelque chose.
// ---------------------------------------------------------------------------
function s3HandlerB(event) {
    try {
        var f = new File(new File($.fileName).parent.fsName + "/probe_menu3.log");
        f.encoding = "UTF-8";
        if (f.open("a")) {
            f.write(String(new Date()) + " [S3-B] FONCTION DU SCRIPT + BEFORE_INVOKE : DECLENCHE" +
                    " | typeof main=" + (typeof main) +
                    " | typeof PROBE_LOG_PATH=" + (typeof PROBE_LOG_PATH) +
                    " | typeof LINES=" + (typeof LINES) +
                    " | $.fileName=" + $.fileName + "\n");
            f.close();
        }
    } catch (eB) {}
}

// ---------------------------------------------------------------------------
// GESTIONNAIRE C - fonction AUTONOME fabriquee par new Function.
// Une fonction creee par new Function ne capture AUCUNE variable du script :
// elle ne voit que les objets natifs ExtendScript (File, Date, $) et $.global.
// Le chemin du journal est INJECTE en litteral dans son corps.
// Si C journalise et que A echoue, la cause est la perte des variables du
// script ; si C journalise, le clic atteint bien un gestionnaire.
// ---------------------------------------------------------------------------
function makeAutonomousHandler(tag) {
    var body =
        "var f = new File(" + jsQuote(HARD_LOG_PATH) + ");" +
        "f.encoding = 'UTF-8';" +
        "if (!f.open('a')) { f = new File(" + jsQuote(HARD_LOG_PATH) + "); f.encoding = 'UTF-8'; f.open('a'); }" +
        "if (f) {" +
        "  f.write(String(new Date()) + ' [" + tag + "] FONCTION AUTONOME (new Function) : DECLENCHE" +
        " | typeof main=' + (typeof main) +" +
        " ' | typeof $.global.__S3_MARKER=' + (typeof $.global.__S3_MARKER) +" +
        " ' | $.fileName=' + $.fileName + '\\n');" +
        "  f.close();" +
        "}" +
        "return 'ok';";
    return new Function("event", body);
}

// ---------------------------------------------------------------------------
// GESTIONNAIRE CLEAN - retire toutes les entrees de test [S3- du menu Fichier.
// Volontairement AUTONOME (chemin obtenu sans variable du script) pour deux
// raisons :
//   1) le journal doit etre ecrit AVANT tout retrait, car ce gestionnaire se
//      retire lui-meme : s'il ecrivait apres, la trace pourrait etre perdue ;
//   2) il doit fonctionner meme si les variables du script ont disparu, et ses
//      "typeof" disent alors si elles ont survecu.
// ---------------------------------------------------------------------------
function s3CleanNow(event) {
    var HARD = HARD_LOG_PATH;
    var KEEP = PREFIX + "CLEAN]";
    var targetId = -1;
    try { targetId = event.target.id; } catch (eT) {}

    function w(line) {
        try {
            var f = new File(HARD);
            f.encoding = "UTF-8";
            if (f.open("a")) {
                f.write(String(new Date()) + " " + line + "\n");
                f.close();
            }
        } catch (eW) {}
    }

    // 1) JOURNAL EN PREMIER : ne depend d'aucun retrait reussi.
    w("[S3-CLEAN] DECLENCHE" +
      " | targetId=" + targetId +
      " | typeof main=" + (typeof main) +
      " | typeof findSubmenuByTitle=" + (typeof findSubmenuByTitle) +
      " | typeof LINES=" + (typeof LINES) +
      " | typeof $.global.__S3_MARKER=" + (typeof $.global.__S3_MARKER));

    // 2) Resolution du menu sans aucune variable du script.
    var fileMenu = null;
    try {
        var mm = app.menus.itemByName("Main");
        var subs = mm.submenus;
        for (var k = 0; k < subs.length; k++) {
            var t = "";
            try { t = String(subs[k].title).replace(/&/g, ""); } catch (e1) {}
            if (t === MENU_NAME) { fileMenu = subs[k]; break; }
        }
    } catch (e2) {}

    var nItems0 = -1;
    if (fileMenu) { try { nItems0 = fileMenu.menuItems.length; } catch (e3) {} }
    var nActs0 = -1;
    try { nActs0 = app.scriptMenuActions.length; } catch (e4) {}
    w("[S3-CLEAN] avant retrait | items=" + nItems0 + " | scriptMenuActions=" + nActs0);

    // 3) Retrait des items, en PROTEGEANT l'entree CLEAN elle-meme (comparaison
    //    par NOM, controle par nous : plus robuste que l'id de event.target).
    var kept = 0, removedItems = 0, i;
    if (fileMenu) {
        while (true) {
            var acted = false;
            var items = fileMenu.menuItems;
            var n = items.length;
            for (i = 0; i < n; i++) {
                var it = items[i];
                var nom = "";
                try { nom = String(it.associatedMenuAction.name); } catch (e5) {}
                if (nom.indexOf(PREFIX) !== 0) continue;
                if (nom.indexOf(KEEP) === 0) { kept++; continue; }
                try { it.remove(); removedItems++; } catch (e6) {}
                acted = true;
                break;
            }
            if (!acted || n === 0) break;
            if (removedItems > 200) break;
        }
    }

    // 4) Retrait des actions, meme protection.
    var removedActions = 0;
    try {
        for (i = app.scriptMenuActions.length - 1; i >= 0; i--) {
            var a = app.scriptMenuActions[i];
            var na = "";
            try { na = String(a.name); } catch (e7) {}
            if (na.indexOf(PREFIX) !== 0) continue;
            if (na.indexOf(KEEP) === 0) continue;
            try { a.remove(); removedActions++; } catch (e8) {}
        }
    } catch (e9) {}

    w("[S3-CLEAN] apres retrait | items retires=" + removedItems +
      " | actions retirees=" + removedActions +
      " | entrees CLEAN conservees=" + kept +
      " | scriptMenuActions=" + app.scriptMenuActions.length);

    // 5) Enfin, l'entree CLEAN se retire elle-meme : en DERNIER, dans un
    //    try/catch, tout le necessaire ayant deja ete journalise.
    try {
        if (fileMenu) {
            var fin = fileMenu.menuItems;
            for (i = fin.length - 1; i >= 0; i--) {
                var nomF = "";
                try { nomF = String(fin[i].associatedMenuAction.name); } catch (eA) {}
                if (nomF.indexOf(KEEP) === 0) { fin[i].remove(); }
            }
        }
        for (i = app.scriptMenuActions.length - 1; i >= 0; i--) {
            var af = app.scriptMenuActions[i];
            var naf = "";
            try { naf = String(af.name); } catch (eB) {}
            if (naf.indexOf(KEEP) === 0) { try { af.remove(); } catch (eC) {} }
        }
        w("[S3-CLEAN] auto-retrait effectue | items=" + fileMenu.menuItems.length +
          " | scriptMenuActions=" + app.scriptMenuActions.length);
    } catch (eD) {
        w("[S3-CLEAN] auto-retrait impossible: " + eD);
    }
}

// ---------------------------------------------------------------------------
// Enregistrement des entrees de test
// ---------------------------------------------------------------------------
function registerEntry(fileMenu, title, action, eventType, handler) {
    action.addEventListener(eventType, handler);
    var items = fileMenu.menuItems;
    var before = items.length;
    var item = items.add(action, LocationOptions.AT_END);
    var after = items.length;
    var pos = "?";
    try { pos = item.index; } catch (eI) {}
    p("  [OK] entree posee: " + title +
      " | eventType=" + eventType +
      " | items " + before + " -> " + after +
      " | index=" + pos);
    return item;
}

function main() {
    p("================================================================");
    p("SONDE 3 - cablage du declencheur d'une ScriptMenuAction");
    p("date = " + s(new Date()));
    p("app.version = " + s(app.version));
    p("$.fileName = " + s($.fileName));
    p("journal = " + PROBE_LOG_PATH);
    p("journal (chemin derive du script) = " + HARD_LOG_PATH);
    p("les deux chemins coincident = " + (PROBE_LOG_PATH === HARD_LOG_PATH));
    p("compagnon = " + COMPANION_PATH + " | existe = " + COMPANION_PATH.exists);
    if (!COMPANION_PATH.exists) {
        p("");
        p("!!! ATTENTION : le compagnon probe_menu3_file_handler.jsx est ABSENT.");
        p("!!! L'entree [S3-D] ne pourra pas fonctionner. Ce n'est pas bloquant");
        p("!!! pour les tests A, B et C.");
    }
    p("");

    p("--- 1) resolution du menu ---");
    var mainMenu = null;
    attempt("app.menus.itemByName('Main')", function () {
        mainMenu = findMainMenu();
        return mainMenu ? (safeName(mainMenu) + " | " + safeTitle(mainMenu)) : "INTROUVABLE";
    });
    if (!mainMenu) {
        p("ABANDON: menu principal introuvable.");
        writeLog();
        alert("Sonde 3 : menu principal INTROUVABLE.\nJournal :\n" + PROBE_LOG_PATH);
        return;
    }
    var fileMenu = findSubmenuByTitle(mainMenu, MENU_NAME);
    if (!fileMenu) {
        p("ABANDON: sous-menu '" + MENU_NAME + "' introuvable.");
        writeLog();
        alert("Sonde 3 : sous-menu " + MENU_NAME + " INTROUVABLE.\nJournal :\n" + PROBE_LOG_PATH);
        return;
    }
    p("  [OK] sous-menu trouve: name=" + safeName(fileMenu) + " | title=" + safeTitle(fileMenu) +
      " | items=" + fileMenu.menuItems.length + " | submenus=" + fileMenu.submenus.length);

    p("");
    p("--- 2) evenements disponibles sur ScriptMenuAction ---");
    attempt("ScriptMenuAction.ON_INVOKE", function () {
        return s(ScriptMenuAction.ON_INVOKE) + " (typeof=" + (typeof ScriptMenuAction.ON_INVOKE) + ")";
    });
    attempt("ScriptMenuAction.BEFORE_INVOKE", function () {
        return s(ScriptMenuAction.BEFORE_INVOKE) + " (typeof=" + (typeof ScriptMenuAction.BEFORE_INVOKE) + ")";
    });
    attempt("ScriptMenuAction.AFTER_INVOKE", function () {
        return s(ScriptMenuAction.AFTER_INVOKE) + " (typeof=" + (typeof ScriptMenuAction.AFTER_INVOKE) + ")";
    });

    p("");
    p("--- 3) nettoyage des residus [S3- d'un run precedent ---");
    var items = fileMenu.menuItems;
    for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        var isOurs = normTitle(safeTitle(it)).indexOf(PREFIX) === 0;
        if (!isOurs) {
            try { if (s(it.associatedMenuAction.name).indexOf(PREFIX) === 0) isOurs = true; } catch (eOld) {}
        }
        if (isOurs) { try { it.remove(); } catch (er) {} }
    }
    for (i = app.scriptMenuActions.length - 1; i >= 0; i--) {
        if (s(app.scriptMenuActions[i].name).indexOf(PREFIX) === 0) {
            try { app.scriptMenuActions[i].remove(); } catch (ea) {}
        }
    }
    p("  residus nettoyes | items=" + fileMenu.menuItems.length +
      " | scriptMenuActions=" + app.scriptMenuActions.length);

    // Marqueur global : permet aux gestionnaires autonomes de constater si
    // $.global est bien le meme au moment du clic qu'au moment du lancement.
    try { $.global.__S3_MARKER = "pose-par-la-sonde3"; } catch (eg) {}

    // Actions de test conservees pour le test d'invocation automatique (section 7).
    var createdActs = [];

    p("");
    p("--- 4) creation des entrees de test ---");

    attempt("[S3-A] action + addEventListener(ON_INVOKE, fonction du script)", function () {
        var act = app.scriptMenuActions.add(PREFIX + "A] fonction du script (OnInvoke)");
        try { act.title = PREFIX + "A] fonction du script (OnInvoke)"; } catch (eAt) {}
        registerEntry(fileMenu, PREFIX + "A] fonction du script (OnInvoke)", act,
                      ScriptMenuAction.ON_INVOKE, s3HandlerA);
        createdActs.push({ tag: "S3-A", action: act });
        return "action.name=" + s(act.name);
    });

    attempt("[S3-B] action + addEventListener(BEFORE_INVOKE, fonction du script)", function () {
        var act = app.scriptMenuActions.add(PREFIX + "B] fonction du script (BeforeInvoke)");
        try { act.title = PREFIX + "B] fonction du script (BeforeInvoke)"; } catch (eBt) {}
        registerEntry(fileMenu, PREFIX + "B] fonction du script (BeforeInvoke)", act,
                      ScriptMenuAction.BEFORE_INVOKE, s3HandlerB);
        createdActs.push({ tag: "S3-B", action: act });
        return "action.name=" + s(act.name);
    });

    attempt("[S3-C] action + addEventListener(ON_INVOKE, fonction autonome new Function)", function () {
        var act = app.scriptMenuActions.add(PREFIX + "C] fonction autonome (new Function)");
        try { act.title = PREFIX + "C] fonction autonome (new Function)"; } catch (eCt) {}
        var h = makeAutonomousHandler("S3-C");
        p("        typeof gestionnaire C = " + (typeof h));
        registerEntry(fileMenu, PREFIX + "C] fonction autonome (new Function)", act,
                      ScriptMenuAction.ON_INVOKE, h);
        createdActs.push({ tag: "S3-C", action: act });
        return "action.name=" + s(act.name);
    });

    attempt("[S3-D] action + addEventListener(ON_INVOKE, File)", function () {
        var act = app.scriptMenuActions.add(PREFIX + "D] gestionnaire par fichier");
        try { act.title = PREFIX + "D] gestionnaire par fichier"; } catch (eDt) {}
        registerEntry(fileMenu, PREFIX + "D] gestionnaire par fichier", act,
                      ScriptMenuAction.ON_INVOKE, new File(COMPANION_PATH));
        createdActs.push({ tag: "S3-D", action: act });
        return "action.name=" + s(act.name);
    });

    p("");
    p("--- 5) entree de nettoyage ---");
    attempt("[S3-CLEAN] action de nettoyage", function () {
        var act = app.scriptMenuActions.add(PREFIX + "CLEAN] retirer les entrees de test");
        try { act.title = PREFIX + "CLEAN] retirer les entrees de test"; } catch (eEt) {}
        registerEntry(fileMenu, PREFIX + "CLEAN] retirer les entrees de test", act,
                      ScriptMenuAction.ON_INVOKE, s3CleanNow);
        return "action.name=" + s(act.name);
    });

    p("");
    p("--- 6) etat final du menu " + MENU_NAME + " ---");
    p("  items=" + fileMenu.menuItems.length + " | scriptMenuActions=" + app.scriptMenuActions.length);
    var fin = fileMenu.menuItems;
    for (i = 0; i < fin.length; i++) {
        p("  [" + i + "] name=" + safeName(fin[i]) + " | title=" + safeTitle(fin[i]));
    }

    p("");
    p("================================================================");
    p("A FAIRE MAINTENANT (dans InDesign, sans relancer ce script) :");
    p("  menu Fichier -> bas du menu -> cliquer [S3-A], [S3-B], [S3-C], [S3-D]");
    p("  (repondre 'Oui' si une alerte ExtendScript apparait)");
    p("  puis cliquer [S3-CLEAN]");
    p("  chaque clic qui atteint un gestionnaire AJOUTE une ligne dans ce journal.");
    p("  LIRE LE JOURNAL AVANT DE RELANCER CE SCRIPT : un nouveau lancement");
    p("  ecrase ce fichier (mode 'w').");
    p("================================================================");

    writeLog();

    // ---------------------------------------------------------------------
    // 7) TEST AUTOMATIQUE PAR action.invoke() - AUCUN CLIC HUMAIN NECESSAIRE
    // Ce test isole le CABLAGE de l'INVOCATION PAR LE CLIC :
    //   - si invoke() declenche un gestionnaire => addEventListener(ON_INVOKE)
    //     fonctionne, et le defaut du livrable est du cote de l'invocation par
    //     le clic (ou du cycle de vie de la fonction) ;
    //   - si invoke() ne declenche RIEN => le cablage lui-meme ne prend pas,
    //     et le clic ne pouvait pas davantage le declencher.
    // Les gestionnaires ecrivent en mode AJOUT : leurs lignes apparaissent dans
    // le journal ENTRE les reperes ci-dessous (l'ordre compte).
    // ---------------------------------------------------------------------
    appendDirect("[SONDE] --- 7) test automatique action.invoke() (sans clic) ---");
    for (var c = 0; c < createdActs.length; c++) {
        var tagTest = createdActs[c].tag;
        appendDirect("[SONDE] invoke() sur " + tagTest + " : AVANT");
        try {
            createdActs[c].action.invoke();
            appendDirect("[SONDE] invoke() sur " + tagTest + " : APRES (aucune erreur)");
        } catch (eInv) {
            appendDirect("[SONDE] invoke() sur " + tagTest + " : ERREUR -> " + eInv);
        }
    }
    appendDirect("[SONDE] --- fin du test automatique ---");
    appendDirect("[SONDE] RAPPEL : ces lignes ne disent rien du CLIC ; il reste");
    appendDirect("[SONDE] a cliquer [S3-A], [S3-B], [S3-C], [S3-D] dans le menu.");

    alert("SONDE 3 : 5 entrees de test ont ete posees dans le menu " + MENU_NAME + " (tout en bas).\n\n" +
          "1) Ouvrir le menu " + MENU_NAME + "\n" +
          "2) Cliquer [S3-A], [S3-B], [S3-C], [S3-D] (repondre Oui aux alertes)\n" +
          "3) Cliquer [S3-CLEAN]\n" +
          "4) Lire le journal :\n" + PROBE_LOG_PATH + "\n\n" +
          "Ne PAS relancer ce script avant d'avoir lu le journal (il l'ecrase).");
}

main();

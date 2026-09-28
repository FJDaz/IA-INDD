// import_md_loader.jsx
// ---------------------------------------------------------------------------
// Script de DEMARRAGE : recree au lancement d'InDesign l'entree de menu
// "Importer un MD" (menu Fichier), qui ne survit PAS au redemarrage.
//
// MISSION 03 (INDD) -- etape 9/10 -- voie A, option (a) [decision FJD 28/09/2026]
//
// EMPLACEMENT (copie manuelle, comme pour les sondes) :
//   ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Startup Scripts/
// La-CI est la SOURCE ; le fichier EXECUTE par InDesign est la copie ci-dessus.
// Le dossier "Scripts/" doit contenir, a cote, le dossier du Panneau Scripts :
//   <Scripts Panel>/import_md.jsx       (le script a declencher)
//   <Scripts Panel>/import_md_menu.jsx  (le module partage d'enregistrement)
//
// FONDEMENT / MESURES (wiki Cas 34 et 35)
//  - L'entree de menu ne survit pas au redemarrage d'InDesign (Cas 34).
//  - Un script depose dans "Startup Scripts" au niveau UTILISATEUR est bien
//    execute au lancement, SANS sudo, et app.menus y est DEJA construit
//    (menus.length = 151) -> aucun report afterOpen necessaire (Cas 35).
//  - Motif repris du chargeur d'Adobe lui-meme :
//      /Applications/Adobe InDesign 2026/Scripts/converturltohyperlink/
//      startup scripts/ConvertURLToHyperlinkMenuItemLoader.jsx
//    (app.activeScript -> parent.parent ; "this file is in the startup
//    scripts subfolder").
//
// CE QUE CE SCRIPT NE FAIT PAS
//  - Il ne charge NI n'execute import_md.jsx : le faire ouvrirait le dialogue
//    d'import a CHAQUE lancement. Il enregistre seulement l'entree, dont le
//    declencheur est un File pointant vers import_md.jsx (le clic l'executera,
//    et ce script-la finit par main()).
//  - Il n'utilise PAS #targetengine (contrairement au chargeur Adobe) : notre
//    declencheur est un File durable, pas une fonction en memoire ; l'execution
//    au lancement n'a donc pas besoin d'un moteur persistant. L'enregistrement
//    est idempotent, donc re-executer ce script est sans effet de bord.
//
// Source PUREMENT ASCII.
// ---------------------------------------------------------------------------

var IMD_LOADER_LOG_FALLBACK = "/tmp/import_md_loader.log";

// Le fichier en cours : app.activeScript a l'execution par InDesign ; repli sur
// e.fileName (ESTK) puis sur $.fileName. Motif repris du chargeur Adobe.
function imdLoaderOwnFile() {
    try {
        var a = app.activeScript;
        if (a) return a;
    } catch (e) {
        try { if (e.fileName) return new File(e.fileName); } catch (e2) {}
    }
    try { return new File($.fileName); } catch (e3) {}
    return null;
}

function imdLog(path, msg) {
    try {
        var f = new File(path);
        f.open("a");
        f.writeln("[" + new Date().toString() + "] " + msg);
        f.close();
    } catch (e) {
        // un journal qui echoue ne doit jamais faire tomber le chargement
    }
}

// Dossier du Panneau Scripts : d'abord le nom MESURE (fr_FR : "Scripts Panel"),
// puis balayage d'un niveau des sous-dossiers de "Scripts" (nom localisable).
function imdFindPanelDir(scriptsDir) {
    try {
        var direct = new Folder(String(scriptsDir.fsName) + "/Scripts Panel");
        if (direct.exists && new File(String(direct.fsName) + "/import_md.jsx").exists) {
            return direct;
        }
    } catch (e) {}

    var subs = null;
    try { subs = scriptsDir.getFiles(); } catch (e2) { return null; }
    if (!subs) return null;
    for (var i = 0; i < subs.length; i++) {
        var item = subs[i];
        var isFolder = false;
        try { isFolder = (item instanceof Folder); } catch (e3) {}
        if (!isFolder) continue;
        try {
            if (new File(String(item.fsName) + "/import_md.jsx").exists) return item;
        } catch (e4) {}
    }
    return null;
}

var imdSelf = imdLoaderOwnFile();
var imdLogPath = IMD_LOADER_LOG_FALLBACK;
var imdDetails = "self=<indeterminable>";

if (!imdSelf) {
    imdLog(imdLogPath, "LOADER-DEMARRAGE: ECHEC chemin du chargeur INDETERMINABLE");
} else {
    var imdStartupDir = null, imdScriptsDir = null, imdPanelDir = null;
    try { imdStartupDir = imdSelf.parent; } catch (e) {}
    try { if (imdStartupDir) imdScriptsDir = imdStartupDir.parent; } catch (e2) {}

    imdDetails = "loader=" + imdSelf.fsName +
                 " | startupDir=" + (imdStartupDir ? imdStartupDir.fsName : "<null>") +
                 " | scriptsDir=" + (imdScriptsDir ? imdScriptsDir.fsName : "<null>");

    if (imdScriptsDir) {
        imdPanelDir = imdFindPanelDir(imdScriptsDir);
    }

    if (!imdPanelDir) {
        imdLog(imdLogPath, "LOADER-DEMARRAGE: ECHEC dossier du Panneau Scripts INTROUVABLE | " + imdDetails);
    } else {
        imdLogPath = String(imdPanelDir.fsName) + "/import_md_errors.log";

        var imdTarget = new File(String(imdPanelDir.fsName) + "/import_md.jsx");
        var imdModule = new File(String(imdPanelDir.fsName) + "/import_md_menu.jsx");

        imdLog(imdLogPath, "LOADER-DEMARRAGE: " + imdDetails +
            " | panelDir=" + imdPanelDir.fsName +
            " | target=" + imdTarget.fsName + " (exists=" + imdTarget.exists + ")" +
            " | module=" + imdModule.fsName + " (exists=" + imdModule.exists + ")");

        if (!imdModule.exists) {
            imdLog(imdLogPath, "LOADER-DEMARRAGE: ECHEC module import_md_menu.jsx INTROUVABLE -> entree de menu non creee");
        } else {
            try {
                $.evalFile(imdModule);
            } catch (em) {
                imdLog(imdLogPath, "LOADER-DEMARRAGE: ECHEC $.evalFile(module) | message=" + em.message);
            }

            if (typeof importMdRegisterMenuEntry === "undefined") {
                imdLog(imdLogPath, "LOADER-DEMARRAGE: ECHEC importMdRegisterMenuEntry ABSENT apres chargement du module");
            } else {
                var imdOk = false;
                try {
                    imdOk = importMdRegisterMenuEntry.register(imdTarget);
                } catch (er) {
                    imdLog(imdLogPath, "LOADER-DEMARRAGE: EXCEPTION a l'enregistrement | message=" + er.message);
                }
                imdLog(imdLogPath, "LOADER-DEMARRAGE: register -> " + imdOk +
                    " | scriptMenuActions=" + (function () { try { return app.scriptMenuActions.length; } catch (e5) { return -1; } })());
            }
        }
    }
}

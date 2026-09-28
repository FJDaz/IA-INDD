// import_md_menu.jsx
// ---------------------------------------------------------------------------
// Module PARTAGE d'enregistrement de l'entree de menu native
// « Importer un MD » (menu Fichier, juste apres « Importer... »).
//
// MISSION 03 (INDD) -- etape 9/10 -- voie A, option (a) [decision FJD 28/09/2026]
//
// POURQUOI CE FICHIER EXISTE
//  - Une entree de menu creee par script NE survit PAS au redemarrage
//    d'InDesign (mesure FJD 28/09/2026 -> wiki Cas 34 : apres relance,
//    l'entree avait disparu).
//  - La recreation automatique au lancement passe par le dossier « Startup
//    Scripts » ; le niveau UTILISATEUR a ete mesure comme fonctionnel (wiki
//    Cas 35 : le script y a bien tourne au lancement, SANS sudo, et app.menus
//    y etait DEJA construit, menus.length = 151 -> aucun report afterOpen
//    necessaire).
//  - Pour que le Panneau Scripts ET le script de demarrage partagent UN SEUL
//    code d'enregistrement (option (a) = zero duplication), cette logique vit
//    ici. DEUX appelants :
//      1) import_md.jsx        (lance depuis le Panneau Scripts, ou par clic)
//      2) import_md_loader.jsx (script de demarrage)
//
// CONTRAT
//  - Expose UN SEUL global : importMdRegisterMenuEntry.register(targetPath)
//      targetPath : chemin du script a declencher au clic. Sa forme peut etre
//                   celle de $.fileName (encodee/abregee, ex.
//                   « ~/Library/.../Scripts%20Panel/import_md.jsx ») ou un
//                   chemin absolu : new File(...).fsName normalise les deux.
//      retour     : true si l'entree est posee (ou deja conforme), false sinon.
//  - NE LEVE JAMAIS. N'OUVRE AUCUN DIALOGUE. NE CHARGE AUCUN AUTRE SCRIPT.
//
// LE DECLENCHEUR EST UN File, JAMAIS UNE FONCTION
//  Mesure reelle (sonde 3, 28/09/2026, wiki Cas 31/33) : une fonction du script
//  ne survit pas a la fin du script ; au clic, typeof main = undefined. Le seul
//  declencheur durable est un File -- le clic reexecute ce fichier, dont les
//  dernieres instructions sont l'enregistrement (sans effet : deja conforme)
//  puis main().
// ---------------------------------------------------------------------------

var importMdRegisterMenuEntry = (function () {

    var ACTION_NAME = "Importer un MD";

    // Journal : meme fichier que import_md.jsx (import_md_errors.log dans le
    // dossier du script cible) -> UNE SEULE verite, un seul journal.
    // Renseigne au debut de chaque enregistrement, d'apres targetPath.
    var LOG_PATH = "";

    function log(message) {
        if (!LOG_PATH) return;
        try {
            var f = new File(LOG_PATH);
            f.open("a");
            f.writeln("[" + new Date().toString() + "] " + message);
            f.close();
        } catch (e) {
            // un journal qui echoue ne doit jamais faire tomber l'enregistrement
        }
    }

    function logErr(e, context) {
        var parts = ["ERREUR"];
        if (context) parts.push("contexte=" + context);
        try { parts.push("message=" + e.message); } catch (e1) {}
        try { if (typeof e.line !== "undefined") parts.push("ligne=" + e.line); } catch (e2) {}
        try { parts.push("fichier=" + e.fileName); } catch (e3) {}
        try { if (e.stack) parts.push("stack=" + e.stack); } catch (e4) {}
        log(parts.join(" | "));
    }

    /** Lecture defensive d'un title de menu (certaines entrees n'en exposent pas). */
    function safeTitle(obj) {
        try { return obj.title; } catch (e) { return null; }
    }

    /** Lecture defensive d'un name de menu / d'action. */
    function safeName(obj) {
        try { return obj.name; } catch (e) { return null; }
    }

    /**
     * Retire les esperluettes d'accelerateur d'un titre de menu
     * (« &Fichier » -> « Fichier »). Ne JAMAIS comparer un title tel quel.
     */
    function normTitle(value) {
        if (value === null || typeof value === "undefined") return "";
        return String(value).replace(/&/g, "");
    }

    /** Chemin absolu (fsName) a partir d'un chemin ou d'un File. "" si indeterminable. */
    function resolvePath(value) {
        try {
            var f = new File(value);
            if (f && f.fsName) return String(f.fsName);
        } catch (e) {}
        return "";
    }

    /**
     * Localise la barre de menus principale. app.menus ne contient pas les menus
     * de la barre au premier niveau : « Main » est le seul point d'entree.
     */
    function findMainMenu() {
        var menus;
        try { menus = app.menus; } catch (e) {
            logErr(e, "app.menus");
            return null;
        }
        var byName = null;
        try { byName = menus.itemByName("Main"); } catch (e2) {}
        if (byName) return byName;
        for (var i = 0; i < menus.length; i++) {
            var cand = menus[i];
            if (normTitle(safeTitle(cand)) === "Main" ||
                String(safeName(cand)) === "Main") {
                return cand;
            }
        }
        return null;
    }

    /** Cherche un sous-menu par titre NORMALISE (sans « & ») ou par name. */
    function findSubMenu(parent, wanted) {
        var subs;
        try { subs = parent.submenus; } catch (e) { return null; }
        for (var i = 0; i < subs.length; i++) {
            var s = subs[i];
            if (normTitle(safeTitle(s)) === wanted ||
                String(safeName(s)) === wanted) {
                return s;
            }
        }
        return null;
    }

    /**
     * Compte les actions de script portant notre nom : notre entree en place,
     * mais aussi d'eventuelles actions orphelines laissees par une execution
     * precedente (une action peut exister sans item de menu).
     */
    function countOwnActions() {
        var n = 0;
        try {
            for (var i = 0; i < app.scriptMenuActions.length; i++) {
                if (String(safeName(app.scriptMenuActions[i]) || "") === ACTION_NAME) n++;
            }
        } catch (e) {}
        return n;
    }

    /**
     * Enregistre (ou rafraichit) l'entree de menu native « Importer un MD »
     * dans le menu Fichier, juste apres « Importer... ».
     *
     * IDEMPOTENT : tout residu portant deja notre nom (item de menu et action
     * de script) est retire avant recreation -- un nouvel appel ne cree donc
     * jamais de doublon.
     *
     * NE LEVE JAMAIS : l'echec est journalise mais ne doit jamais empecher
     * l'import -- le Panneau Scripts reste le point d'entree de reference, et
     * les deux doivent fonctionner en parallele.
     */
    function doRegister(targetPath) {
        try {
            // 0) Le declencheur de l'entree est le script CIBLE : sans son
            //    chemin, on ne saurait pas quoi cabler. On prefere NE PAS creer
            //    d'entree morte.
            var ownPath = resolvePath(targetPath);
            LOG_PATH = "";
            if (ownPath) {
                try { LOG_PATH = new File(ownPath).parent.fsName + "/import_md_errors.log"; } catch (el) {}
            }
            if (!ownPath) {
                return false;   // rien a journaliser : le chemin du journal en depend
            }

            var mainMenu = findMainMenu();
            if (!mainMenu) {
                log("M03-etape9: menu principal 'Main' INTROUVABLE -> entree de menu non creee (import inchange)");
                return false;
            }
            var fileMenu = findSubMenu(mainMenu, "Fichier");
            if (!fileMenu) {
                log("M03-etape9: sous-menu 'Fichier' INTROUVABLE sous 'Main' -> entree de menu non creee");
                return false;
            }

            var items = fileMenu.menuItems;
            var i;

            // 1) Inventaire : nos items (par titre/nom normalises, ou via
            //    l'action associee) et l'index de la reference « Importer... ».
            var ownIndexes = [];
            var refIndex = -1;
            for (i = 0; i < items.length; i++) {
                var it = items[i];
                var itTitle = normTitle(safeTitle(it));
                var itName = String(safeName(it) || "");
                var itActionName = "";
                try { itActionName = String(it.associatedMenuAction.name); } catch (ea) {}
                if (itTitle === ACTION_NAME || itName === ACTION_NAME ||
                    itActionName === ACTION_NAME) {
                    ownIndexes.push(i);
                }
                if (refIndex < 0 &&
                    (itTitle === "Importer..." || itName === "Importer...")) {
                    refIndex = i;
                }
            }
            var actionsCount = countOwnActions();

            // 2) Conformite ? Une seule entree, a sa place, une seule action.
            //    Dans ce cas AUCUN RETRAIT : le clic sur l'entree reexecute le
            //    script, et retirer/recreer l'action pendant qu'elle est en
            //    cours d'invocation detruirait l'objet en cours de distribution.
            var wellPlaced = false;
            if (ownIndexes.length === 1) {
                if (refIndex >= 0) {
                    wellPlaced = (ownIndexes[0] === refIndex + 1);
                } else {
                    wellPlaced = (ownIndexes[0] === items.length - 1);
                }
            }
            if (wellPlaced && actionsCount === 1) {
                log("M03-etape9: entree de menu deja conforme -> rien a faire" +
                    " | menu='Fichier' items=" + items.length +
                    " | index=" + ownIndexes[0] +
                    " | scriptMenuActions=" + actionsCount);
                return true;
            }

            // 3) Idempotence -- retrait de nos eventuels residus (items puis
            //    actions), de la fin vers le debut pour garder les index valides.
            for (i = ownIndexes.length - 1; i >= 0; i--) {
                try {
                    items[ownIndexes[i]].remove();
                    log("M03-etape9: residu d'entree de menu retire (index " + ownIndexes[i] + ")");
                } catch (er) {
                    log("M03-etape9: residu d'entree de menu NON retire | message=" + er.message);
                }
            }
            for (i = app.scriptMenuActions.length - 1; i >= 0; i--) {
                var act = app.scriptMenuActions[i];
                if (String(safeName(act) || "") === ACTION_NAME) {
                    try { act.remove(); } catch (er2) {}
                }
            }

            // 4) Reference d'insertion : l'item « Importer... » du menu Fichier
            //    (item [10] mesure en reel). name/title compares NORMALISES.
            var refItem = null;
            for (i = 0; i < items.length; i++) {
                var cand = items[i];
                if (normTitle(safeTitle(cand)) === "Importer..." ||
                    String(safeName(cand) || "") === "Importer...") {
                    refItem = cand;
                    break;
                }
            }

            // 5) Creation de l'action de script et de son declencheur.
            var action = app.scriptMenuActions.add(ACTION_NAME);
            try { action.title = ACTION_NAME; } catch (et) {}
            var eventType = "onInvoke";
            try {
                if (typeof ScriptMenuAction !== "undefined" && ScriptMenuAction.ON_INVOKE) {
                    eventType = ScriptMenuAction.ON_INVOKE;
                }
            } catch (ev) {}

            // LE point de l'etape 9 : le declencheur est un File -- le script
            // cible -- seul type de gestionnaire mesure comme survivant a la fin
            // du script.
            var handler = null;
            try { handler = new File(ownPath); } catch (ef) { handler = null; }
            if (!handler) {
                log("M03-etape9: ECHEC creation du gestionnaire File('" + ownPath + "') -> entree de menu non creee");
                try { action.remove(); } catch (er4) {}
                return false;
            }
            action.addEventListener(eventType, handler);
            var handlerExists = false;
            try { handlerExists = (handler.exists === true); } catch (eh) {}

            // 6) Pose de l'entree de menu, juste apres « Importer... ».
            var itemsBefore = items.length;
            if (refItem) {
                items.add(action, LocationOptions.AFTER, refItem);
            } else {
                items.add(action, LocationOptions.AT_END);
            }
            var itemsAfter = items.length;
            var pos = refItem ? "apres 'Importer...'" : "fin du menu (repli : 'Importer...' non trouve)";

            log("M03-etape9: entree de menu creee -> '" + ACTION_NAME + "' " + pos +
                " | menu='Fichier' items " + itemsBefore + " -> " + itemsAfter +
                " | declencheur=File " + ownPath + " (exists=" + handlerExists + ")" +
                " | eventType=" + eventType +
                " | scriptMenuActions=" + app.scriptMenuActions.length);
            return true;
        } catch (e) {
            logErr(e, "registerMenuEntry");
            log("M03-etape9: ECHEC d'enregistrement de l'entree de menu (import inchange)" +
                " | message=" + e.message + " | name=" + e.name + " | number=" + e.number);
            return false;
        }
    }

    return {
        register: function (targetPath) {
            return doRegister(targetPath);
        }
    };
})();

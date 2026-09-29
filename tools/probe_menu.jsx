// probe_menu.jsx - SONDE DE DIAGNOSTIC TEMPORAIRE (Mission 03, etape 9)
// But : OBSERVER la structure reelle des menus d'InDesign (fr_FR) AVANT d'ecrire
// le code d'integration au menu Fichier > Importer. On ne devine aucune cle :
// on la lit dans le journal produit par le vrai InDesign.
//
// Lecture seule, plus UN essai d'ajout d'un item de menu (avec une action
// bidon) immediatement annule a la fin. Aucune modification persistante.
//
// Journal : probe_menu.log, ecrit a cote de ce script.
// Compatible ExtendScript (ES3) : pas de JSON, pas d'Array.indexOf.

var PROBE_LOG_PATH = new File($.fileName).parent.fsName + "/probe_menu.log";
var PROBE_LINES = [];

function p(msg) {
  PROBE_LINES.push(String(msg));
}

function writeProbeLog() {
  var f = new File(PROBE_LOG_PATH);
  try { f.encoding = "UTF-8"; } catch (eEnc) {}
  if (f.open("w")) {
    f.write(PROBE_LINES.join("\n") + "\n");
    f.close();
  }
}

// Executes fn and logs the error instead of aborting the whole probe.
function attempt(label, fn) {
  try {
    return fn();
  } catch (e) {
    p("  !! " + label + " -> ECHEC: " + e.message + " | name=" + e.name + " | number=" + e.number);
    return null;
  }
}

function s(v) {
  if (v === null || v === undefined) return "null";
  return String(v);
}

function main() {
  p("=== probe_menu.jsx - structure des menus InDesign ===");
  p("app.version = " + s(app.version));
  p("app.name = " + s(app.name));
  attempt("app.locale.name", function () { p("app.locale.name = " + s(app.locale.name)); });
  attempt("app.menus.length", function () { p("app.menus.length = " + s(app.menus.length)); });
  attempt("app.scriptMenuActions.length", function () { p("app.scriptMenuActions.length = " + s(app.scriptMenuActions.length)); });
  attempt("app.menuActions.length", function () { p("app.menuActions.length = " + s(app.menuActions.length)); });

  // --- 1) Arbre de premier niveau -------------------------------------------------
  p("");
  p("--- MENUS DE PREMIER NIVEAU ---");
  var menus = attempt("lecture app.menus", function () { return app.menus; });
  if (menus) {
    for (var i = 0; i < menus.length; i++) {
      (function (idx) {
        var m = menus[idx];
        attempt("menu[" + idx + "]", function () {
          p("MENU[" + idx + "] name=" + s(m.name) +
            " | title=" + s(m.title) +
            " | submenus=" + s(m.submenus.length) +
            " | items=" + s(m.menuItems.length));
        });
      })(i);
    }
  }

  // --- 2) Detail du menu Fichier --------------------------------------------------
  p("");
  p("--- DETAIL DU MENU FICHIER ---");
  var fileMenu = null;
  if (menus) {
    for (var j = 0; j < menus.length; j++) {
      var cand = menus[j];
      var nm = s(attempt("cand.name", function () { return cand.name; }));
      var ti = s(attempt("cand.title", function () { return cand.title; }));
      if (nm === "$ID/File" || /^fichier$/i.test(ti) || /^file$/i.test(ti)) {
        fileMenu = cand;
        p("menu Fichier trouve : index=" + j + " name=" + nm + " | title=" + ti);
        break;
      }
    }
  }
  if (!fileMenu) {
    p("menu Fichier NON TROUVE par (name == $ID/File || title == Fichier/File)");
  } else {
    attempt("items directs du menu Fichier", function () {
      p("items directs = " + fileMenu.menuItems.length);
      for (var a = 0; a < fileMenu.menuItems.length; a++) {
        var it = fileMenu.menuItems[a];
        p("  ITEM[" + a + "] name=" + s(it.name) + " | title=" + s(it.title) +
          " | action=" + s(attempt("action", function () { return it.associatedMenuAction.name; })));
      }
      return true;
    });
    attempt("sous-menus du menu Fichier", function () {
      p("submenus = " + fileMenu.submenus.length);
      for (var k = 0; k < fileMenu.submenus.length; k++) {
        var sm = fileMenu.submenus[k];
        p("  SUB[" + k + "] name=" + s(sm.name) + " | title=" + s(sm.title) +
          " | items=" + s(sm.menuItems.length) + " | submenus=" + s(sm.submenus.length));
        for (var t = 0; t < sm.menuItems.length; t++) {
          var sit = sm.menuItems[t];
          p("      Item[" + t + "] name=" + s(sit.name) + " | title=" + s(sit.title) +
            " | action=" + s(attempt("action", function () { return sit.associatedMenuAction.name; })));
        }
        for (var u = 0; u < sm.submenus.length; u++) {
          var ssm = sm.submenus[u];
          p("      SUBSUB[" + u + "] name=" + s(ssm.name) + " | title=" + s(ssm.title) +
            " | items=" + s(ssm.menuItems.length));
        }
      }
      return true;
    });
  }

  // --- 3) Cles de localisation (utile pour un code robuste) -----------------------
  p("");
  p("--- CLES DE LOCALISATION ---");
  attempt("findKeyStrings('Fichier')", function () {
    var ks = app.findKeyStrings("Fichier");
    p("findKeyStrings('Fichier') = " + s(ks.join(" | ")));
    return true;
  });
  attempt("findKeyStrings('Importer')", function () {
    var ks = app.findKeyStrings("Importer");
    p("findKeyStrings('Importer') = " + s(ks.join(" | ")));
    return true;
  });
  attempt("translateKeyString('$ID/File')", function () {
    p("translateKeyString('$ID/File') = " + s(app.translateKeyString("$ID/File")));
    return true;
  });
  attempt("translateKeyString('$ID/Import')", function () {
    p("translateKeyString('$ID/Import') = " + s(app.translateKeyString("$ID/Import")));
    return true;
  });

  // --- 4) Dossiers de scripts (question de persistance) ---------------------------
  p("");
  p("--- DOSSIERS DE SCRIPTS ---");
  attempt("Scripts Panel", function () {
    var here = new File($.fileName).parent;
    p("script courant = " + s($.fileName));
    p("dossier courant existe = " + here.exists);
    var scriptsRoot = here.parent;
    p("racine Scripts = " + s(scriptsRoot.fsName) + " | existe = " + scriptsRoot.exists);
    var startup = new Folder(scriptsRoot.fsName + "/Startup Scripts");
    p("dossier 'Startup Scripts' = " + s(startup.fsName) + " | existe = " + startup.exists);
    var startupApp = new Folder(app.filePath.parent.fsName + "/Scripts/Startup Scripts");
    p("dossier app 'Scripts/Startup Scripts' = " + s(startupApp.fsName) + " | existe = " + startupApp.exists);
    return true;
  });

  // --- 5) Essai d'ajout d'un item de menu, immediatement annule -------------------
  p("");
  p("--- ESSAI D'AJOUT (annule aussitot) ---");
  var importSub = null;
  if (fileMenu) {
    attempt("recherche sous-menu Import", function () {
      for (var q = 0; q < fileMenu.submenus.length; q++) {
        var sub = fileMenu.submenus[q];
        var sn = s(sub.name), st = s(sub.title);
        if (/import/i.test(sn) || /import/i.test(st) || /placer|place/i.test(sn) || /placer|place/i.test(st)) {
          p("  candidat sous-menu : name=" + sn + " | title=" + st);
          if (!importSub) importSub = sub;
        }
      }
      return true;
    });
    // Les sous-menus directs ne suffisent pas : on regarde aussi les sous-sous-menus.
    if (!importSub) {
      attempt("recherche Import dans les sous-sous-menus", function () {
        for (var q2 = 0; q2 < fileMenu.submenus.length; q2++) {
          var sub2 = fileMenu.submenus[q2];
          for (var r = 0; r < sub2.submenus.length; r++) {
            var deep = sub2.submenus[r];
            var dn = s(deep.name), dt = s(deep.title);
            if (/import/i.test(dn) || /import/i.test(dt)) {
              p("  candidat sous-sous-menu : name=" + dn + " | title=" + dt + " (parent=" + s(sub2.title) + ")");
              if (!importSub) importSub = deep;
            }
          }
        }
        return true;
      });
    }
  }
  p("IMPORT_SUB = " + (importSub ? (s(importSub.name) + " | " + s(importSub.title)) : "INTROUVABLE"));

  var action = null;
  if (importSub) {
    action = attempt("scriptMenuActions.add", function () {
      var a = app.scriptMenuActions.add("ZZZ PROBE IMPORT MD");
      p("scriptMenuActions.add() OK -> id=" + s(a.id) + " | name=" + s(a.name) + " | title=" + s(a.title));
      return a;
    });
    if (action) {
      attempt("addEventListener('onInvoke')", function () {
        action.addEventListener("onInvoke", function () {});
        p("addEventListener('onInvoke', fn) OK");
        return true;
      });
      attempt("menuItems.add(action, AT_END)", function () {
        var newItem = importSub.menuItems.add(action, LocationOptions.AT_END);
        p("menuItems.add() OK -> item name=" + s(newItem.name) + " | title=" + s(newItem.title));
        var found = importSub.menuItems.itemByName("ZZZ PROBE IMPORT MD");
        p("relecture itemByName dans le sous-menu = " + (found ? "TROUVE" : "NON TROUVE"));
        p("nouveau nb items = " + s(importSub.menuItems.length));
        newItem.remove();
        p("item retire, nb items = " + s(importSub.menuItems.length));
        return true;
      });
      attempt("remove action", function () {
        action.remove();
        p("action retiree, scriptMenuActions.length = " + s(app.scriptMenuActions.length));
        return true;
      });
    }
  }

  p("");
  p("=== fin de la sonde ===");
  writeProbeLog();
  alert("Sonde de menus terminee.\nJournal :\n" + PROBE_LOG_PATH);
}

main();

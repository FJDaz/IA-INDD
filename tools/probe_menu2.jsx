// probe_menu2.jsx - SONDE 2 DE DIAGNOSTIC TEMPORAIRE (Mission 03, etape 9)
// But : la sonde 1 a montre que le menu "Fichier" n'apparait PAS dans app.menus
// au premier niveau (151 menus = menus contextuels / de panneaux). Le seul
// candidat "barre de menus" est MENU[0] name=Main | title=Main | submenus=11.
// Cette sonde 2 explore l'arborescence sous Main, localise l'entree "Importer"
// du menu Fichier, et tente un ajout aussitot annule (nettoyage immediat).
// LECTURE SEULE sauf l'essai d'ajout, immediatement defait.

var PROBE_LOG_PATH = new File($.fileName).parent.fsName + "/probe_menu2.log";
var LINES = [];
var candidates = [];

function p(msg) { LINES.push(String(msg)); }

function s(v) {
  if (v === null) return "(null)";
  if (v === undefined) return "(undefined)";
  try { return String(v); } catch (e) { return "(?)"; }
}

function writeLog() {
  var f = new File(PROBE_LOG_PATH);
  f.encoding = "UTF-8";
  f.open("w");
  f.write(LINES.join("\n"));
  f.close();
}

function attempt(label, fn) {
  try {
    var r = fn();
    p("  [OK] " + label + (r === undefined ? "" : " -> " + s(r)));
    return r;
  } catch (e) {
    p("  !! " + label + " -> ECHEC: " + e.message + " | name=" + s(e.name) + " | number=" + s(e.number));
    return undefined;
  }
}

function safeTitle(m) { try { return s(m.title); } catch (e) { return "(?)"; } }
function safeName(m) { try { return s(m.name); } catch (e) { return "(?)"; } }

var MAXDEPTH = 3;
var MAXLINES = 700;

function walk(menu, depth, pathStr) {
  if (depth > MAXDEPTH) return;
  if (LINES.length > MAXLINES) return;

  var nm = safeName(menu), ti = safeTitle(menu);
  var nItems = -1, nSubs = -1;
  try { nItems = menu.menuItems.length; } catch (e) {}
  try { nSubs = menu.submenus.length; } catch (e) {}
  p("MENU d=" + depth + " | path=" + pathStr + " | name=" + nm + " | title=" + ti +
    " | items=" + nItems + " | submenus=" + nSubs);

  if (depth >= 1 && /^\s*importer/i.test(ti)) {
    candidates.push({ menu: menu, path: pathStr, title: ti, kind: "submenu" });
  }

  try {
    var ni = menu.menuItems.length;
    for (var i = 0; i < ni; i++) {
      var it = menu.menuItems[i];
      var inm = "", iti = "", act = "?";
      try { inm = s(it.name); } catch (e) {}
      try { iti = s(it.title); } catch (e) {}
      try { act = it.associatedMenuAction ? s(it.associatedMenuAction.name) : "(aucune)"; } catch (e) {}
      p("  ITEM path=" + pathStr + " [" + i + "] name=" + inm + " | title=" + iti + " | action=" + act);
      if (/^\s*importer/i.test(String(iti).replace(/\.+$/, ""))) {
        candidates.push({ menu: null, path: pathStr + "/item[" + i + "]", title: iti, kind: "item" });
      }
    }
  } catch (e) {
    p("  !! items de " + pathStr + " -> " + e.message);
  }

  try {
    var ns = menu.submenus.length;
    for (var k = 0; k < ns; k++) {
      var sm = menu.submenus[k];
      walk(sm, depth + 1, pathStr + "/" + safeTitle(sm));
    }
  } catch (e) {
    p("  !! submenus de " + pathStr + " -> " + e.message);
  }
}

function main() {
  p("=== probe_menu2.jsx - exploration sous le menu Main ===");
  p("app.version = " + s(app.version));
  p("app.menus.length = " + s(app.menus.length));
  p("app.scriptMenuActions.length = " + s(app.scriptMenuActions.length));

  // 1) resolution du menu Main
  var main = null;
  attempt("app.menus.itemByName('Main')", function () {
    var m = app.menus.itemByName("Main");
    if (m) { main = m; }
    return m ? (safeName(m) + " | " + safeTitle(m) + " | submenus=" + m.submenus.length) : "(vide)";
  });
  if (!main) {
    attempt("repli: boucle app.menus pour title==Main", function () {
      for (var i = 0; i < app.menus.length; i++) {
        var m = app.menus[i];
        if (safeTitle(m) === "Main" || safeName(m) === "Main") { main = m; return "trouve index=" + i; }
      }
      return "INTROUVABLE";
    });
  }
  if (!main) {
    p("ABANDON: menu Main introuvable.");
    p("=== fin de la sonde 2 ===");
    writeLog();
    alert("Sonde 2 : menu Main INTROUVABLE.\nJournal :\n" + PROBE_LOG_PATH);
    return;
  }

  // 2) arborescence sous Main
  p("");
  p("--- ARBORESCENCE SOUS Main (profondeur max " + MAXDEPTH + ") ---");
  walk(main, 0, "Main");

  // 3) localisation du sous-menu Fichier
  p("");
  p("--- RECHERCHE DU SOUS-MENU FICHIER (sous Main) ---");
  var fileMenu = null;
  attempt("parcours des sous-menus de Main", function () {
    var n = main.submenus.length;
    var found = "aucun";
    for (var i = 0; i < n; i++) {
      var sm = main.submenus[i];
      var t = safeTitle(sm);
      if (/^\s*fichier/i.test(t) || /^\s*file/i.test(t) || safeName(sm) === "$ID/File") {
        fileMenu = sm;
        found = "index=" + i + " | name=" + safeName(sm) + " | title=" + t;
      }
    }
    return found;
  });

  // 4) items directs + sous-menus du menu Fichier (explicite, garanti present)
  if (fileMenu) {
    p("");
    p("--- MENU FICHIER : items directs ---");
    attempt("boucle items du menu Fichier", function () {
      var ni = fileMenu.menuItems.length;
      for (var i = 0; i < ni; i++) {
        var it = fileMenu.menuItems[i];
        var inm = "", iti = "", act = "?";
        try { inm = s(it.name); } catch (e) {}
        try { iti = s(it.title); } catch (e) {}
        try { act = it.associatedMenuAction ? s(it.associatedMenuAction.name) : "(aucune)"; } catch (e) {}
        p("  FITEM[" + i + "] name=" + inm + " | title=" + iti + " | action=" + act);
      }
      return "n=" + ni;
    });
    p("");
    p("--- MENU FICHIER : sous-menus ---");
    attempt("boucle sous-menus du menu Fichier", function () {
      var ns = fileMenu.submenus.length;
      for (var k = 0; k < ns; k++) {
        var sm = fileMenu.submenus[k];
        p("  FSUB[" + k + "] name=" + safeName(sm) + " | title=" + safeTitle(sm) +
          " | items=" + sm.menuItems.length + " | submenus=" + sm.submenus.length);
        var ni2 = sm.menuItems.length;
        for (var q = 0; q < ni2; q++) {
          var it2 = sm.menuItems[q];
          var t2 = "", a2 = "?";
          try { t2 = s(it2.title); } catch (e) {}
          try { a2 = it2.associatedMenuAction ? s(it2.associatedMenuAction.name) : "(aucune)"; } catch (e) {}
          p("      FSUBITEM[" + q + "] name=" + safeName(it2) + " | title=" + t2 + " | action=" + a2);
        }
      }
      return "n=" + ns;
    });
  }

  // 5) cles de localisation ciblees
  p("");
  p("--- CLES DE LOCALISATION ---");
  attempt("translateKeyString('$ID/TouchMenuFile')", function () { return app.translateKeyString("$ID/TouchMenuFile"); });
  attempt("translateKeyString('$ID/Import')", function () { return app.translateKeyString("$ID/Import"); });
  attempt("translateKeyString('$ID/Place a File')", function () { return app.translateKeyString("$ID/Place a File"); });
  attempt("translateKeyString('$ID/Import a File')", function () { return app.translateKeyString("$ID/Import a File"); });
  attempt("translateKeyString('$ID/Place')", function () { return app.translateKeyString("$ID/Place"); });

  // 6) liste des candidats
  p("");
  p("--- CANDIDATS 'IMPORTER' TROUVES ---");
  if (candidates.length === 0) p("  (aucun)");
  for (var c = 0; c < candidates.length; c++) {
    p("  [" + c + "] kind=" + candidates[c].kind + " | path=" + candidates[c].path + " | title=" + candidates[c].title);
  }

  // 7) choix de la cible : candidat SOUS-MENU dont le chemin commence par Main/Fichier
  var target = null;
  for (var c2 = 0; c2 < candidates.length; c2++) {
    if (candidates[c2].kind === "submenu" && candidates[c2].path.indexOf("Main/Fichier") === 0) { target = candidates[c2]; }
  }
  p("");
  p("CIBLE = " + (target ? (target.path + " | " + target.title) : "INTROUVABLE"));

  // 8) essai d'ajout immediatement annule
  p("");
  p("--- ESSAI D'AJOUT (annule aussitot) ---");
  var action = null;
  var item = null;
  if (target && target.menu) {
    attempt("scriptMenuActions.add('ZZZ PROBE2 IMPORT MD')", function () {
      action = app.scriptMenuActions.add("ZZZ PROBE2 IMPORT MD");
      return "id=" + s(action.id) + " | name=" + s(action.name) + " | title=" + s(action.title);
    });
    if (action) {
      attempt("addEventListener('onInvoke', fn)", function () { action.addEventListener("onInvoke", function () {}); return "pose"; });
      attempt("menuItems.add(action, LocationOptions.AT_END)", function () {
        item = target.menu.menuItems.add(action, LocationOptions.AT_END);
        return "item name=" + s(item.name) + " | title=" + s(item.title);
      });
      attempt("menuItems.length apres ajout", function () { return target.menu.menuItems.length; });
      if (item) attempt("item.remove()", function () { item.remove(); return "ok"; });
      attempt("action.remove()", function () { action.remove(); return "ok"; });
      attempt("menuItems.length apres nettoyage", function () { return target.menu.menuItems.length; });
      attempt("scriptMenuActions.length apres nettoyage", function () { return app.scriptMenuActions.length; });
    }
  } else {
    p("  (pas de cible : essai d'ajout non execute)");
  }

  p("");
  p("=== fin de la sonde 2 ===");
  writeLog();
  alert("Sonde 2 terminee.\nJournal :\n" + PROBE_LOG_PATH);
}

main();

// ===========================================================================
//  probe_startup.jsx -- Sonde de DEMARRAGE (mission 03 / etape 9, INDD)
//
//  QUESTION MESUREE : un script depose dans un dossier "Startup Scripts"
//  est-il REELLEMENT execute par InDesign au lancement, et la barre de menus
//  est-elle DEJA CONSTRUITE a cet instant ?
//
//  Pourquoi cette sonde existe :
//   - l'entree de menu "Importer un MD" ne survit PAS au redemarrage
//     d'InDesign (constate par FJD le 28/09 -> Cas 34 du wiki) ;
//   - la seule voie de recreation automatique documentee par Adobe est un
//     script de demarrage (Lisez-moi Scripts InDesign 2026, p.10,
//     "Emplacement des scripts de lancement JavaScript") ;
//   - or creer l'entree suppose que app.menus soit deja construit. C'est
//     precisement ce que la mesure doit trancher, PAS la deduction.
//
//  Le journal contient $.fileName : il dit donc LAQUELLE des deux copies a
//  tourne -- dossier d'application (documente par Adobe) ou preferences
//  utilisateur (non documente). C'est la reponse a la seconde inconnue.
//
//  Source PUREMENT ASCII (regle des sondes du projet).
// ===========================================================================

var PROBE_NAME     = "[SONDE DEMARRAGE] Entree de test";
var LOG_PATH       = "/tmp/probe_startup.log";
// Dossier du projet : a adapter a votre installation (placeholder, jamais un
// chemin personnel en dur).
var PROJET_DIR     = "/chemin/vers/INDD/IMPORT_MD";
var COMPANION_FIXE = PROJET_DIR + "/tools/probe_startup_handler.jsx";

// ---------------------------------------------------------------------------
// Journal -- technique reprise a l'identique de import_md.jsx (open("a"))
// ---------------------------------------------------------------------------
function plog(msg) {
  try {
    var f = new File(LOG_PATH);
    f.encoding = "UTF-8";
    f.open("a");
    f.writeln("[" + new Date().toString() + "] " + msg);
    f.close();
  } catch (e) {
    // une sonde ne doit jamais mourir sur son propre journal
  }
}

function s(v) {
  try { return String(v); } catch (e) { return "<illisible:" + String(e.message) + ">"; }
}

function safeTitle(o) { try { return o.title; } catch (e) { return ""; } }
function safeName(o)  { try { return o.name;  } catch (e) { return ""; } }
function normTitle(v) { try { return String(v).replace(/&/g, ""); } catch (e) { return ""; } }

function findMainMenu() {
  var menus = null;
  try { menus = app.menus; } catch (e) { return null; }
  var byName = null;
  try { byName = menus.itemByName("Main"); } catch (e2) {}
  if (byName) return byName;
  for (var i = 0; i < menus.length; i++) {
    var c = menus[i];
    if (normTitle(safeTitle(c)) === "Main" || s(safeName(c)) === "Main") return c;
  }
  return null;
}

function findSubByTitle(parent, wanted) {
  var subs = null;
  try { subs = parent.submenus; } catch (e) { return null; }
  for (var i = 0; i < subs.length; i++) {
    if (normTitle(safeTitle(subs[i])) === wanted || s(safeName(subs[i])) === wanted) return subs[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// MESURES -- etat de l'application a l'instant ou le script de demarrage tourne
// ---------------------------------------------------------------------------
plog("========== SONDE DEMARRAGE : DEBUT ==========");

var engineName = "";
try { engineName = s($.engineName); } catch (e) { engineName = "ERR:" + s(e.message); }

var nDocs = -1;        try { nDocs = app.documents.length; } catch (e) {}
var nMenus = -1;       try { nMenus = app.menus.length; } catch (e) {}
var nMenuItems = -1;   try { nMenuItems = app.menuItems.length; } catch (e) {}
var nActions = -1;     try { nActions = app.scriptMenuActions.length; } catch (e) {}

plog("A/DATE        = " + s(new Date()));
plog("A/fileName    = " + s($.fileName));
plog("A/engineName  = " + engineName);
plog("A/app.name    = " + s(app.name));
plog("A/app.version = " + s(app.version));

plog("B/documents.length        = " + nDocs + "      (0 = aucun document ouvert a cet instant)");
plog("B/menus.length            = " + nMenus + "    (151 mesure quand la barre est construite)");
plog("B/menuItems.length        = " + nMenuItems + "    (tous menus confondus)");
plog("B/scriptMenuActions.length= " + nActions);

var listeMenus = [];
try {
  for (var i = 0; i < app.menus.length; i++) {
    listeMenus.push(s(safeName(app.menus[i])) + "/" + normTitle(safeTitle(app.menus[i])));
  }
} catch (e) {}
plog("B/menus (name/title) = " + listeMenus.join(", "));

// ---------------------------------------------------------------------------
// LA question : la barre de menus est-elle utilisable a cet instant ?
// ---------------------------------------------------------------------------
var mainMenu = findMainMenu();
if (!mainMenu) {
  plog("C/RESULTAT: menu principal 'Main' INTROUVABLE a cet instant -> BARRE DE MENUS NON PRETE");
  plog("C/consequence: une creation directe d'entree de menu ECHOUERAIT ici"
       + " (un report sur un evenement d'ouverture serait necessaire -- a instruire).");
} else {
  var nSubs = -1;
  try { nSubs = mainMenu.submenus.length; } catch (e) {}
  plog("C/menu 'Main' TROUVE | submenus = " + nSubs);

  var fileMenu = findSubByTitle(mainMenu, "Fichier");
  if (!fileMenu) {
    plog("C/RESULTAT: sous-menu 'Fichier' INTROUVABLE -> barre de menus PARTIELLEMENT construite.");
  } else {
    var items = fileMenu.menuItems;
    plog("C/'Fichier' TROUVE | items = " + items.length);

    var refIndex = -1;
    var titres = [];
    for (var k = 0; k < items.length; k++) {
      var t = normTitle(safeTitle(items[k]));
      titres.push(k + ":" + t);
      if (refIndex < 0 && t === "Importer...") refIndex = k;
    }
    plog("C/item 'Importer...' index = " + refIndex);
    plog("C/items Fichier = " + titres.join(" | "));

    // -----------------------------------------------------------------------
    // Test reel : l'entree est-elle CREABLE depuis un script de demarrage ?
    // (garde d'idempotence : on ne cree rien si un residu est deja la)
    // -----------------------------------------------------------------------
    var dejaItems = 0;
    var dejaActions = 0;
    try {
      for (var m = 0; m < items.length; m++) {
        if (normTitle(safeTitle(items[m])) === PROBE_NAME || s(safeName(items[m])) === PROBE_NAME) dejaItems++;
      }
      for (var p = 0; p < app.scriptMenuActions.length; p++) {
        if (s(safeName(app.scriptMenuActions[p])) === PROBE_NAME) dejaActions++;
      }
    } catch (e) {}
    plog("D/entree sonde deja presente ? items=" + dejaItems + " actions=" + dejaActions);

    if (dejaItems > 0 || dejaActions > 0) {
      plog("D/RESULTAT: rien a faire (idempotence) -- la sonde a deja tourne.");
    } else {
      var itemsAvant = items.length;
      var action = app.scriptMenuActions.add(PROBE_NAME);
      try { action.title = PROBE_NAME; } catch (e) {}

      var eventType = "onInvoke";
      try {
        if (typeof ScriptMenuAction !== "undefined" && ScriptMenuAction.ON_INVOKE) {
          eventType = ScriptMenuAction.ON_INVOKE;
        }
      } catch (e) {}

      var handler = null;
      try { handler = new File(COMPANION_FIXE); } catch (e) { handler = null; }

      if (!handler) {
        plog("D/ECHEC: gestionnaire File('" + COMPANION_FIXE + "') non cree -> entree non posee");
        try { action.remove(); } catch (e) {}
      } else {
        var hExiste = false;
        try { hExiste = (handler.exists === true); } catch (e) {}
        action.addEventListener(eventType, handler);

        var refItem = (refIndex >= 0) ? items[refIndex] : null;
        if (refItem) {
          items.add(action, LocationOptions.AFTER, refItem);
        } else {
          items.add(action, LocationOptions.AT_END);
        }
        var pos = refItem ? ("apres 'Importer...' (index " + refIndex + ")")
                          : "fin du menu (repli)";
        plog("D/ENTREE POSEE: '" + PROBE_NAME + "' " + pos
             + " | items " + itemsAvant + " -> " + items.length
             + " | declencheur=File " + COMPANION_FIXE + " (exists=" + hExiste + ")"
             + " | eventType=" + eventType
             + " | scriptMenuActions=" + app.scriptMenuActions.length);
      }
    }
  }
}

plog("========== SONDE DEMARRAGE : FIN ==========");

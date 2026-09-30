// ===========================================================================
// SONDE 04ter -- LE MECANISME NATIF DES STORIES LIEES EXISTE-T-IL ?
// ---------------------------------------------------------------------------
// POURQUOI CETTE SONDE
// La sonde 04bis a mesure 11 echecs de createTextFragmentLink() : ce n'est pas
// le mecanisme d'une story liee LOCALE (son message parle de "connectivite
// reseau", semantique InDesign Server / fragment heberge).
//
// Le mecanisme natif documente pour une story liee locale est le PLACEMENT
// d'un fichier texte/ICML avec la preference "creer des liens lors du
// placement de fichiers texte et de feuilles de calcul" ACTIVE.
//
// Ce que cette sonde doit trancher, et rien d'autre :
//   T0 : OU vit cette preference ?  (par reflect -- on ne la devine PAS)
//   T1 : peut-on PRODUIRE un ICML valide ? (via InDesign lui-meme, pas a la main)
//   T2 : le placement d'un ICML cree-t-il une entree dans le panneau Liens ?
//   T3 : DECISIVE -- update() reimporte-t-il le brut et ECRASE-t-il notre
//        mapping de styles, ou se contente-t-il d'un controle de fraicheur ?
//
// POSTURE : un echec est une mesure au meme titre qu'un succes. Aucun echec
// n'est deguise en resultat. Si T3 n'est pas mesurable, on l'ECRIT.
//
// CONTRAINTES : ExtendScript ES3, source 100% ASCII, pas de JSON global,
// pas de let/const, pas de += en boucle, une assignation par paragraphe.
// ===========================================================================

var LOG_DIR = "/tmp";

var T0_LOG = LOG_DIR + "/probe_04ter_T0_preference_lien.log";
var T1_LOG = LOG_DIR + "/probe_04ter_T1_production_icml.log";
var T2_LOG = LOG_DIR + "/probe_04ter_T2_placement_lie.log";
var T3_LOG = LOG_DIR + "/probe_04ter_T3_update_vs_mapping.log";

// Sources .md temoins (deux contenus distincts : A = pose, B = modifie)
var SRC_MD = LOG_DIR + "/probe_04ter_src.md";
var SRC_A = "# Titre A\n\n## Sous-titre A\n\nParagraphe A.\n";
var SRC_B = "# Titre B MODIFIE\n\n## Sous-titre B MODIFIE\n\nParagraphe B MODIFIE.\n";

// ICML produits par InDesign lui-meme (aucun XML ecrit a la main)
// MESURE 29/09 : un export ICML dont le fichier cible est directement a la
// racine /tmp ECHOUE avec "Dossier ... introuvable" -- /tmp est un lien
// symbolique vers /private/tmp. Il faut un sous-dossier REEL.
var OUT_DIR = LOG_DIR + "/probe_04ter_out";
var ICML_A = OUT_DIR + "/probe_04ter_A.icml";
var ICML_B = OUT_DIR + "/probe_04ter_B.icml";

// Memoire de mapping reellement utilisee par import_md.jsx
// Chemin derive du script lui-meme ($.fileName) : aucune donnee personnelle.
var MEM_PATH_PANEL = new File($.fileName).parent.fsName + "/import_md_mapping_memory.txt";

var LINES = [];
var DOC_A = null;   // document de PRODUCTION de l'ICML A
var DOC_B = null;   // document de PRODUCTION de l'ICML B
var DOC_T = null;   // document de TEST (celui qui recoit la story liee)
var STORY_T = null; // story liee de DOC_T
var LINK_T = null;  // le Link obtenu, ou null (et on l'ecrit)
var FMT_ICML = null; // valeur numerique de ExportFormat.<ICML>

// ---------------------------------------------------------------------------
// PLOMBERIE DE JOURNAL
// ---------------------------------------------------------------------------
function p(s) { LINES.push(s); }

function sn(v) {
  try { return String(v); } catch (e) { return "(non affichable)"; }
}

function logErr(e, ctx) {
  var msg = "(sans message)", line = "?", file = "?";
  try { msg = e.message; } catch (e2) { }
  try { if (e.line) { line = e.line; } } catch (e3) { }
  try { if (e.fileName) { file = e.fileName; } } catch (e4) { }
  p("ERREUR | contexte=" + ctx + " | message=" + msg + " | ligne=" + line + " | fichier=" + file);
}

function writeLog(path) {
  var f = new File(path);
  f.encoding = "UTF-8";
  if (!f.open("w")) {
    alert("SONDE 04ter : ecriture du journal impossible.\n" + path);
    return;
  }
  for (var i = 0; i < LINES.length; i++) { f.write(LINES[i] + "\n"); }
  f.close();
}

function runQ(q, path, fn) {
  LINES = [];
  p("================================================================");
  p("SONDE 04ter -- T" + q + " -- " + new Date().toString());
  p("$.fileName (LA copie qui tourne) = " + $.fileName);
  p("app.version = " + app.version + " | app.locale = " + app.locale);
  p("================================================================");
  try { fn(); } catch (e) { logErr(e, "T" + q + " (echec global)"); }
  p("--- fin T" + q + " ---");
  writeLog(path);
}

// ---------------------------------------------------------------------------
// INSPECTION (on MESURE l'objet, on ne le suppose pas)
// ---------------------------------------------------------------------------
function describeObj(o) {
  if (o === null) { return "(null)"; }
  if (o === undefined) { return "(undefined)"; }
  var t = typeof o;
  if (t !== "object") { return t + ":" + sn(o); }
  var c = "?", r = "?";
  try { c = sn(o.constructor); } catch (e) { }
  try { r = sn(o.reflect.name); } catch (e2) { }
  return "typeof=object constructor=" + c + " reflect.name=" + r;
}

function readProp(o, n) {
  try { return sn(o[n]); } catch (e) { return "(lecture KO: " + e.message + ")"; }
}

function readRaw(o, n) {
  try { return o[n]; } catch (e) { return null; }
}

function safeTypeof(o, n) {
  try { return (typeof o[n]); } catch (e) { return "(lecture KO)"; }
}

// Recherche de sous-chaine INSENSIBLE a la casse, sans indexOf (contrainte ES3
// du projet) : boucle explicite sur substr().
function hasSubstr(s, sub) {
  var ls = String(s).toLowerCase();
  var lsub = String(sub).toLowerCase();
  var n = ls.length, m = lsub.length;
  if (m === 0) { return true; }
  if (m > n) { return false; }
  for (var i = 0; i + m <= n; i++) {
    if (ls.substr(i, m) === lsub) { return true; }
  }
  return false;
}

function reflectNames(o, kind) {
  var out = [];
  try {
    var names = (kind === "methods") ? o.reflect.methods : o.reflect.properties;
    for (var i = 0; i < names.length; i++) { out.push(String(names[i])); }
  } catch (e) { logErr(e, "reflectNames (" + kind + ")"); }
  return out;
}

// Compte et AFFICHE les membres d'un objet dont le nom contient 'link'.
// On ne lit QUE les membres retenus : un objet de preferences peut en avoir 40.
function scanLinkMembers(obj, label) {
  if (!obj) { p(label + " : objet indisponible"); return 0; }
  var names = reflectNames(obj, "properties");
  var hits = 0;
  for (var i = 0; i < names.length; i++) {
    if (hasSubstr(names[i], "link")) {
      hits++;
      p("   " + label + "." + names[i] + " = " + readProp(obj, names[i]) +
        " | typeof=" + safeTypeof(obj, names[i]));
    }
  }
  p(label + " : " + names.length + " propriete(s), " + hits + " contenant 'link'");
  return hits;
}

// Affiche le CATALOGUE COMPLET des objets de preferences atteignables, avec le
// nombre de proprietes de chacun, PUIS les membres dont le nom evoque un lien.
// But : ne jamais rendre "0 lien trouve" indistinguable de "nom non devine".
function listPreferenceCatalogue(doc) {
  var KEYWORDS = ["link", "story", "import", "place", "relink"];
  var scopes = [{ lbl: "app", o: app }];
  if (doc) { scopes.push({ lbl: "doc", o: doc }); }
  var totalObj = 0;
  for (var s = 0; s < scopes.length; s++) {
    var props = reflectNames(scopes[s].o, "properties");
    for (var i = 0; i < props.length; i++) {
      if (!hasSubstr(props[i], "preferences")) { continue; }
      var o = readRaw(scopes[s].o, props[i]);
      if (!o || typeof o !== "object") { continue; }
      totalObj++;
      var members = reflectNames(o, "properties");
      p("   " + scopes[s].lbl + "." + props[i] + " -> " + members.length + " propriete(s)");
      for (var m = 0; m < members.length; m++) {
        var hitK = null;
        for (var k = 0; k < KEYWORDS.length; k++) {
          if (hasSubstr(members[m], KEYWORDS[k])) { hitK = KEYWORDS[k]; break; }
        }
        if (hitK) {
          p("      [motif '" + hitK + "'] " + members[m] + " = " + readProp(o, members[m]) +
            " | typeof=" + safeTypeof(o, members[m]));
        }
      }
    }
  }
  p("   TOTAL objets de preferences listes = " + totalObj);
  return totalObj;
}

// Cherche le basculement cote MENU (si le DOM n'expose pas la preference).
// En FR le libelle contient "lien", en EN "link" : on cherche les deux.
function scanMenuActionsForLink() {
  var acts = null;
  try { acts = app.menuActions.everyItem().getElements(); }
  catch (e) { logErr(e, "app.menuActions"); p("   menuActions indisponibles"); return 0; }
  p("   app.menuActions total = " + acts.length);
  var hits = 0;
  for (var i = 0; i < acts.length; i++) {
    var nm = "";
    try { nm = String(acts[i].name); } catch (e2) { nm = "?"; }
    if (!hasSubstr(nm, "lien") && !hasSubstr(nm, "link")) { continue; }
    var en = "?", ck = "?";
    try { en = acts[i].enabled; } catch (e3) { }
    try { ck = acts[i].checked; } catch (e4) { }
    hits++;
    p("   menuAction[" + i + "] '" + nm + "' enabled=" + en + " checked=" + ck);
  }
  p("   menuActions contenant 'lien'/'link' = " + hits);
  return hits;
}

// Rassemble tous les objets "preferences" atteignables depuis app et depuis un
// document, SANS supposer leurs noms : on filtre sur 'preferences'.
function collectPreferenceObjects(doc) {
  var out = [];
  var appNames = reflectNames(app, "properties");
  for (var i = 0; i < appNames.length; i++) {
    if (hasSubstr(appNames[i], "preferences")) {
      var o = readRaw(app, appNames[i]);
      if (o && typeof o === "object") { out.push({ lbl: "app." + appNames[i], o: o }); }
    }
  }
  if (doc) {
    var docNames = reflectNames(doc, "properties");
    for (var j = 0; j < docNames.length; j++) {
      if (hasSubstr(docNames[j], "preferences")) {
        var od = readRaw(doc, docNames[j]);
        if (od && typeof od === "object") { out.push({ lbl: "doc." + docNames[j], o: od }); }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// GARDE D'INTERACTION
// place() peut ouvrir un selecteur ("options d'import") et BLOQUER la sonde
// pour toujours. On force NEVER_INTERACT le temps de l'appel, puis on restaure.
// ---------------------------------------------------------------------------
function withNeverInteract(fn) {
  var prev = null;
  try { prev = app.scriptPreferences.userInteractionLevel; } catch (e) { logErr(e, "lecture userInteractionLevel"); }
  try {
    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
  } catch (e2) { logErr(e2, "passage a NEVER_INTERACT"); }
  var r = null;
  try { r = fn(); } catch (e3) { logErr(e3, "appel sous NEVER_INTERACT"); }
  try {
    if (prev !== null) { app.scriptPreferences.userInteractionLevel = prev; }
    p("   userInteractionLevel restaure = " + app.scriptPreferences.userInteractionLevel);
  } catch (e4) { logErr(e4, "restauration userInteractionLevel"); }
  return r;
}

// ---------------------------------------------------------------------------
// FICHIERS
// ---------------------------------------------------------------------------
function writeTextFile(path, s) {
  var f = new File(path);
  f.encoding = "UTF-8";
  if (!f.open("w")) { return false; }
  f.write(s);
  f.close();
  return true;
}

function readTextFile(path) {
  var f = new File(path);
  f.encoding = "UTF-8";
  if (!f.open("r")) { return null; }
  var s = f.read();
  f.close();
  return s;
}

function fileInfo(path) {
  var f = new File(path);
  return "existe=" + f.exists + " | taille=" + (f.exists ? f.length : "(n/a)") + " o | chemin=" + f.fsName;
}

// ---------------------------------------------------------------------------
// MAPPING ET STYLES TEMOINS
// ---------------------------------------------------------------------------
function deserializeFlatMapping(txt) {
  var out = {};
  if (!txt) { return out; }
  var body = txt;
  var a = body.indexOf("{");   // indexOf sur String : ES3
  var b = body.lastIndexOf("}");
  if (a === -1 || b === -1 || b <= a) { return out; }
  body = body.substring(a + 1, b);
  var parts = body.split(",");
  for (var i = 0; i < parts.length; i++) {
    var seg = parts[i];
    var c = seg.indexOf(":");
    if (c === -1) { continue; }
    var k = seg.substring(0, c);
    var v = seg.substring(c + 1);
    k = k.replace(/"/g, "");
    v = v.replace(/"/g, "");
    out[k] = v;
  }
  return out;
}

function loadMemoryMapping(path) {
  var txt = readTextFile(path);
  if (!txt) { return null; }
  return deserializeFlatMapping(txt);
}

function findParagraphStyleByName(doc, name) {
  var ps = null;
  try { ps = doc.paragraphStyles.everyItem().getElements(); } catch (e) { logErr(e, "findParagraphStyleByName"); return null; }
  for (var i = 0; i < ps.length; i++) {
    var n = "?";
    try { n = ps[i].name; } catch (e2) { }
    if (n === name) { return ps[i]; }
  }
  return null;
}

function ensureWitnessStyle(doc, name) {
  var found = findParagraphStyleByName(doc, name);
  if (found) { return found; }
  try {
    return doc.paragraphStyles.add({ name: name });
  } catch (eAdd) {
    logErr(eAdd, "creation du style temoin '" + name + "'");
    return null;
  }
}

function safeStyleName(style, fallback) {
  try { return style.name; } catch (e) { return fallback; }
}

function readAppliedStyles(story) {
  var out = [];
  var paras = null;
  try { paras = story.paragraphs.everyItem().getElements(); }
  catch (e) { logErr(e, "readAppliedStyles/everyItem"); return out; }
  for (var i = 0; i < paras.length; i++) {
    var np = "?", nc = "?";
    try { np = safeStyleName(paras[i].appliedParagraphStyle, "?"); } catch (eP) { logErr(eP, "para " + i); }
    try { nc = safeStyleName(paras[i].appliedCharacterStyle, "?"); } catch (eC) { logErr(eC, "char " + i); }
    out.push("p[" + i + "] paragraphe='" + np + "' caractere='" + nc + "'");
  }
  return out;
}

function neutralizeDefaults(doc) {
  try {
    doc.textDefaults.appliedParagraphStyle = doc.paragraphStyles.item(0);
    doc.textDefaults.appliedCharacterStyle = doc.characterStyles.item(0);
    doc.pageItemDefaults.appliedTextObjectStyle = doc.objectStyles.item(0);
  } catch (e) { logErr(e, "neutralisation des defauts"); }
}

function addFrame(doc, bounds) {
  var tf = null;
  try { tf = doc.pages[0].textFrames.add({ geometricBounds: bounds }); }
  catch (e1) {
    logErr(e1, "textFrames.add({geometricBounds})");
    try {
      tf = doc.pages[0].textFrames.add();
      try { tf.geometricBounds = bounds; } catch (e2) { logErr(e2, "affectation geometricBounds"); }
    } catch (e3) { logErr(e3, "textFrames.add() sans argument"); }
  }
  return tf;
}

function closeQuietly(doc, label) {
  if (!doc) { return; }
  try { doc.close(SaveOptions.NO); p("fermeture de " + label + " sans enregistrer"); }
  catch (e) { logErr(e, "fermeture de " + label); }
}

// ===========================================================================
// T0 -- OU VIT LA PREFERENCE DE CREATION DE LIENS ?  (par reflect)
// ===========================================================================
function t0() {
  p("app.name = " + app.name);
  p("app.version = " + app.version);
  p("app.locale = " + app.locale);
  p("app.scriptPreferences.userInteractionLevel = " + app.scriptPreferences.userInteractionLevel);
  p("app.documents.length = " + app.documents.length);
  p("app.documents.length AVANT = " + app.documents.length + " (deviation de protocole a consigner si > 0)");
  try {
    p("document deja ouvert = '" + app.documents[0].name + "'");
    p("   doc.links.length = " + app.documents[0].links.length);
  } catch (e) { logErr(e, "T0 document existant"); }

  p("");
  p("--- 1. membres de app contenant 'link' ---");
  scanLinkMembers(app, "app");

  p("");
  p("--- 2. CATALOGUE COMPLET des objets de preferences atteignables (app + document) ---");
  p("    (on liste TOUS les objets, pas seulement ceux dont le nom contient 'link')");
  var totalObj = listPreferenceCatalogue(null);
  p("objets de preferences retenus depuis app = " + totalObj);

  p("");
  p("--- 2b. membres 'link' des objets de preferences (filtre strict) ---");
  var prefs = collectPreferenceObjects(null);
  for (var i = 0; i < prefs.length; i++) {
    p("--- " + prefs[i].lbl + " ---");
    scanLinkMembers(prefs[i].o, prefs[i].lbl);
  }

  p("");
  p("--- 2c. basculement cote MENU (si le DOM n'expose pas la preference) ---");
  scanMenuActionsForLink();

  p("");
  p("--- 3. constantes ExportFormat contenant 'ICML' / 'INC' ---");
  var efNames = reflectNames(ExportFormat, "properties");
  p("ExportFormat : " + efNames.length + " constante(s)");
  var cands = [];
  for (var j = 0; j < efNames.length; j++) {
    if (hasSubstr(efNames[j], "ICML") || hasSubstr(efNames[j], "INC")) { cands.push(efNames[j]); }
  }
  p("candidates = " + (cands.length > 0 ? cands.join(", ") : "(aucune)"));
  var pick = null;
  for (var k = 0; k < cands.length; k++) {
    if (hasSubstr(cands[k], "ICML")) { pick = cands[k]; break; }
  }
  if (!pick && cands.length > 0) { pick = cands[0]; }
  if (pick) {
    FMT_ICML = readRaw(ExportFormat, pick);
    p("constante retenue : ExportFormat." + pick + " = " + sn(FMT_ICML) + " (valeur numerique " + Number(FMT_ICML) + ")");
  } else {
    p("AUCUNE constante d'export ICML trouvee -> T1 ne pourra pas exporter (fait negatif a enregistrer)");
  }

  p("");
  p("--- 4. memoire de mapping reelle (contexte) ---");
  var mem = loadMemoryMapping(MEM_PATH_PANEL);
  p("memoire = " + MEM_PATH_PANEL + " (" + fileInfo(MEM_PATH_PANEL) + ")");
  if (mem) {
    for (var mk in mem) { if (mem.hasOwnProperty(mk)) { p("   memoire[" + mk + "] = '" + mem[mk] + "'"); } }
  } else {
    p("   memoire illisible ou vide");
  }
}

// ===========================================================================
// T1 -- PRODUIRE UN ICML VALIDE (via InDesign, pas a la main)
// ===========================================================================
function produceIcml(content, icmlPath, docLabel, frameBounds) {
  var doc = null;
  try { doc = app.documents.add(true); }
  catch (eAdd) { logErr(eAdd, "documents.add pour " + docLabel); }
  if (!doc) { p("IMPOSSIBLE de creer " + docLabel); return null; }
  p(docLabel + " cree : name='" + sn(doc.name) + "'");
  neutralizeDefaults(doc);

  var tf = addFrame(doc, frameBounds);
  if (!tf) { p("IMPOSSIBLE de creer un cadre dans " + docLabel); closeQuietly(doc, docLabel); return null; }

  p("ecriture de " + SRC_MD + " (contenu " + content.substr(0, 12).replace(/\n/g, "\\n") + "...) -> " + writeTextFile(SRC_MD, content));
  var f = new File(SRC_MD);
  p("source .md : " + fileInfo(SRC_MD));

  var placed = withNeverInteract(function () { return tf.place(f); });
  p("place(.md) RETOUR = " + describeObj(placed) + " | valeur=" + sn(placed));
  p("contenu du cadre longueur = " + (tf.contents ? tf.contents.length : "(null)"));

  // dossier de sortie REEL (cf. OUT_DIR)
  var outDir = new Folder(OUT_DIR);
  if (!outDir.exists) { p("creation du dossier de sortie -> " + sn(outDir.create())); }
  p("dossier de sortie : " + OUT_DIR + " | existe=" + outDir.exists);

  var icmlFile = new File(icmlPath);
  if (icmlFile.exists) { icmlFile.remove(); }

  var story = tf.parentStory;
  p("porteur d'export = story | contents longueur = " + (story.contents ? story.contents.length : "(null)"));

  var exported = false;

  // (a) porteur DOCUMENT -- reproduit l'echec de la 1re passe (preuve inline)
  try {
    doc.exportFile(Number(FMT_ICML), icmlFile);
    p("(a) document.exportFile : ACCEPTE (contredit la mesure du 29/09)");
  } catch (eDoc) { logErr(eDoc, "(a) document.exportFile de " + docLabel); }
  p("(a) fichier apres essai document : " + fileInfo(icmlPath));

  // (b) porteur STORY -- forme qui fonctionne (mesure 29/09)
  try {
    story.exportFile(Number(FMT_ICML), icmlFile);
    exported = true;
  } catch (eStory) { logErr(eStory, "(b) story.exportFile de " + docLabel); }
  p("(b) story.exportFile execute = " + exported);
  p("ICML produit : " + fileInfo(icmlPath));

  closeQuietly(doc, docLabel);
  return exported ? icmlFile : null;
}

function t1() {
  if (FMT_ICML === null) {
    p("AUCUNE constante ICML connue (voir T0) -> T1 NON MESURABLE.");
    p("Conclusion honnete : production d'ICML NON TRANCHEE (pas d'echec deguise en resultat).");
    return;
  }

  var a = produceIcml(SRC_A, ICML_A, "DOC_A", [20, 20, 120, 170]);
  var b = produceIcml(SRC_B, ICML_B, "DOC_B", [20, 20, 120, 170]);

  p("");
  p("--- bilan T1 ---");
  p("ICML A : " + fileInfo(ICML_A) + " | obtenu=" + (a ? "oui" : "non"));
  p("ICML B : " + fileInfo(ICML_B) + " | obtenu=" + (b ? "oui" : "non"));

  if (a && b) {
    var ta = new File(ICML_A).length, tb = new File(ICML_B).length;
    p("tailles A=" + ta + " B=" + tb + " | differentes=" + (ta !== tb));
    var sa = readTextFile(ICML_A), sb = readTextFile(ICML_B);
    p("contenus identiques = " + (sa === sb) + " (doit etre false : A et B different)");
    p("A contient 'Titre A' = " + hasSubstr(sa ? sa : "", "Titre A"));
    p("B contient 'Titre B MODIFIE' = " + hasSubstr(sb ? sb : "", "Titre B MODIFIE"));
    p("A est du XML ICML (contient '<Document') = " + hasSubstr(sa ? sa : "", "<Document"));
  } else {
    p("production incomplete -> T2/T3 seront NON MESURABLES (a ecrire tel quel).");
  }
}

// ===========================================================================
// T2 -- LE PLACEMENT D'UN ICML CREE-T-IL UN LIEN ?
// ===========================================================================
function enableLinkPreferences(doc) {
  var prefs = collectPreferenceObjects(doc);
  p("objets de preferences inspectes = " + prefs.length);
  var enabled = 0;
  for (var i = 0; i < prefs.length; i++) {
    var names = reflectNames(prefs[i].o, "properties");
    for (var j = 0; j < names.length; j++) {
      if (!hasSubstr(names[j], "link")) { continue; }
      var before = readProp(prefs[i].o, names[j]);
      if (before === "true" || before === "false") {
        try {
          prefs[i].o[names[j]] = true;
          p("ACTIVATION : " + prefs[i].lbl + "." + names[j] + " : " + before + " -> " + readProp(prefs[i].o, names[j]));
          enabled++;
        } catch (eSet) { logErr(eSet, "activation " + prefs[i].lbl + "." + names[j]); }
      } else {
        p("non booleen, laisse tel quel : " + prefs[i].lbl + "." + names[j] + " = " + before);
      }
    }
  }
  p("proprietes de lien effectivement activees = " + enabled);
  return enabled;
}

function t2() {
  if (!new File(ICML_A).exists) {
    p("ICML A absent (" + ICML_A + ") -> T2 NON MESURABLE. Voir T1.");
    p("Conclusion honnete : mecanisme natif NON TRANCHE (pas d'echec deguise en resultat).");
    return;
  }

  try { DOC_T = app.documents.add(true); }
  catch (eAdd) { logErr(eAdd, "documents.add DOC_T"); }
  if (!DOC_T) { p("IMPOSSIBLE de creer le document de test -> T2/T3 non mesurables"); return; }
  p("DOC_T cree : name='" + sn(DOC_T.name) + "'");
  neutralizeDefaults(DOC_T);

  p("");
  p("--- 1. activation de la preference de creation de liens ---");
  enableLinkPreferences(DOC_T);

  p("");
  p("--- 2. placement de l'ICML ---");
  var tf = addFrame(DOC_T, [20, 20, 120, 170]);
  if (!tf) { p("IMPOSSIBLE de creer le cadre de test -> T2 NON MESURABLE"); return; }
  STORY_T = tf.parentStory;

  var icmlFile = new File(ICML_A);
  p("source ICML : " + fileInfo(ICML_A));
  var placed = withNeverInteract(function () { return tf.place(icmlFile); });
  p("place(.icml) RETOUR = " + describeObj(placed) + " | valeur=" + sn(placed));
  p("contenu du cadre longueur = " + (tf.contents ? tf.contents.length : "(null)"));
  p("contenu du cadre (200 premiers car.) = " + (tf.contents ? sn(tf.contents).substr(0, 200).replace(/\r/g, "\\r") : "(null)"));

  p("");
  p("--- 3. le lien existe-t-il ? ---");
  var links = null;
  try { links = DOC_T.links.everyItem().getElements(); } catch (eL) { logErr(eL, "T2 doc.links"); }
  p("doc.links.length = " + (links ? links.length : "(lecture KO)"));
  if (links) {
    for (var i = 0; i < links.length; i++) {
      p("   lien[" + i + "] name='" + readProp(links[i], "name") + "' status=" + readProp(links[i], "status") +
        " linkType=" + readProp(links[i], "linkType") + " filePath='" + readProp(links[i], "filePath") +
        "' linkResourceURI='" + readProp(links[i], "linkResourceURI") + "'");
    }
    if (links.length > 0) { LINK_T = links[0]; }
  }

  var il = null;
  try { il = STORY_T.itemLink; } catch (eI) { logErr(eI, "T2 story.itemLink"); }
  p("story.itemLink = " + describeObj(il) + " | valeur=" + sn(il));
  if (il && !LINK_T) { LINK_T = il; }

  p("lien retenu pour T3 : " + describeObj(LINK_T) + " | valeur=" + sn(LINK_T));

  p("");
  p("--- 4. verrou de placement (contexte, non decisif) ---");
  var lso = null;
  try { lso = STORY_T.linkedStoryOptions; } catch (eO) { logErr(eO, "T2 linkedStoryOptions"); }
  p("story.linkedStoryOptions = " + describeObj(lso));
  if (lso) {
    var lsoNames = reflectNames(lso, "properties");
    for (var m = 0; m < lsoNames.length; m++) {
      if (hasSubstr(lsoNames[m], "link") || hasSubstr(lsoNames[m], "update") || hasSubstr(lsoNames[m], "style")) {
        p("   " + lsoNames[m] + " = " + readProp(lso, lsoNames[m]));
      }
    }
  }

  if (!LINK_T) {
    p("");
    p("AUCUN LIEN CREE par le placement d'un ICML (preference active pourtant).");
    p("Conclusion honnete : la voie native 'story liee' n'est PAS obtenue par ce chemin sur ce build.");
  }
}

// ===========================================================================
// T3 -- DECISIVE : update() ECRASE-T-IL LE MAPPING DE STYLES ?
// ===========================================================================
function t3() {
  if (!STORY_T) { p("aucune story temoin (T2 a echoue) -> T3 NON MESURABLE"); return; }
  if (!LINK_T) {
    p("aucun lien (T2) -> T3 NON MESURABLE dans cet etat.");
    p("Conclusion honnete : T3 NON TRANCHEE (pas d'echec deguise en resultat).");
    return;
  }

  // 1) styles temoins DEDIES, distincts de tout defaut : un effacement devient
  //    ainsi VISIBLE. Les prendre parmi '[Aucun style]' / '[Paragraphe standard]'
  //    rendrait le releve incapable de distinguer conserve de efface.
  p("--- 1. application des styles temoins ---");
  var tags = ["h1", "p", "li"];
  var names = ["ZZ Temoin H1", "ZZ Temoin P", "ZZ Temoin LI"];
  var paras = null;
  try { paras = STORY_T.paragraphs.everyItem().getElements(); }
  catch (eG) { logErr(eG, "T3 everyItem paragraphs"); }
  p("paragraphes de la story liee = " + (paras ? paras.length : "(lecture KO)"));
  if (paras) {
    for (var i = 0; i < paras.length && i < names.length; i++) {
      var st = ensureWitnessStyle(DOC_T, names[i]);
      if (!st) { p("   p[" + i + "] style '" + names[i] + "' indisponible -> non applique"); continue; }
      try {
        paras[i].appliedParagraphStyle = st;
        p("   p[" + i + "] style applique = '" + safeStyleName(st, "?") + "' (temoin dedie, distinct des defauts)");
      } catch (eA) { logErr(eA, "T3 application style p[" + i + "]"); }
    }
  }

  p("");
  p("--- RELEVE AVANT update() ---");
  var avant = readAppliedStyles(STORY_T);
  for (var a = 0; a < avant.length; a++) { p("   " + avant[a]); }
  var contAvant = sn(STORY_T.contents);
  p("story.contents AVANT : longueur=" + contAvant.length);
  p("story.contents AVANT : " + contAvant.substr(0, 300).replace(/\r/g, "\\r"));

  // 2) modifier la SOURCE sur disque. On ne fabrique pas d'ICML a la main : on
  //    recopie l'ICML B (produit par InDesign) par-dessus A. Le fichier reste
  //    donc un ICML VALIDE, mais son contenu a change.
  p("");
  p("--- 2. modification de la source liee ---");
  p("ICML A avant ecrasement : " + fileInfo(ICML_A));
  var sb = readTextFile(ICML_B);
  var wrote = (sb !== null) ? writeTextFile(ICML_A, sb) : false;
  p("ecrasement de A par le contenu de B = " + wrote);
  p("ICML A apres ecrasement : " + fileInfo(ICML_A));
  var sa2 = readTextFile(ICML_A);
  p("A contient desormais 'Titre B MODIFIE' = " + hasSubstr(sa2 ? sa2 : "", "Titre B MODIFIE"));

  // 3) update()
  alert("SONDE 04ter -- CAPTURE 1/2 (AVANT update)\n\n" +
        "Verifiez que Fenetre > Liens est visible (la story liee doit y figurer),\n" +
        "puis faites Cmd+Shift+3 MAINTENANT.\n\n" +
        "Cliquez OK ensuite pour declencher Link.update().");
  p("");
  p("--- 3. Link.update() ---");
  var upd = null;
  try { upd = LINK_T.update(); p("update() RETOUR = " + describeObj(upd) + " | valeur=" + sn(upd)); }
  catch (eU) { logErr(eU, "T3 Link.update()"); }
  p("statut du lien apres update = " + readProp(LINK_T, "status"));

  alert("SONDE 04ter -- CAPTURE 2/2 (APRES update)\n\n" +
        "Faites Cmd+Shift+3 MAINTENANT (le panneau Liens doit montrer le nouvel etat).\n\n" +
        "Cliquez OK ensuite.");

  p("");
  p("--- RELEVE APRES update() ---");
  var apres = readAppliedStyles(STORY_T);
  for (var b = 0; b < apres.length; b++) { p("   " + apres[b]); }
  var contApres = sn(STORY_T.contents);
  p("story.contents APRES : longueur=" + contApres.length);
  p("story.contents APRES : " + contApres.substr(0, 300).replace(/\r/g, "\\r"));

  // 4) VERDICT -- comparaison terme a terme, aucun jugement implicite
  p("");
  p("--- 4. VERDICT ---");
  var memesStyles = (avant.join(" | ") === apres.join(" | "));
  var memeContenu = (contAvant === contApres);
  p("releve des styles IDENTIQUE avant/apres = " + memesStyles);
  p("contenu IDENTIQUE avant/apres = " + memeContenu);
  p("nb paragraphes avant=" + avant.length + " apres=" + apres.length);

  var contientB = hasSubstr(contApres, "Titre B MODIFIE");
  p("le contenu importe est bien le contenu B (reimport effectif) = " + contientB);

  if (!contientB && memesStyles) {
    p("=> update() n'a PAS reimporte le contenu : controle de fraicheur seulement, mapping intact.");
  } else if (contientB && memesStyles) {
    p("=> update() a REIMPORTE le contenu ET les styles temoins ont SURVECU : mapping preserve.");
    p("   ATTENTION a verifier visuellement : les styles temoins sont-ils toujours appliques ?");
  } else if (contientB && !memesStyles) {
    p("=> update() a REIMPORTE le contenu ET ECRASE les styles : le mapping est DETRUIT par update().");
    p("   C'est la reponse a l'axe 1 voie A : la mise a jour native est INCOMPATIBLE avec le mapping maison.");
  } else {
    p("=> cas non concluant : a lire dans les releves ci-dessus, sans interpretation.");
  }
  if (!contientB && !memesStyles) {
    p("NOTE : contenu inchange MAIS styles differents -- lire les deux releves avant de conclure.");
  }
}

// ===========================================================================
// EXECUTION
// ===========================================================================
alert("SONDE 04ter -- AVANT DE COMMENCER\n\n" +
      "Cette sonde teste le mecanisme NATIF des stories liees (ICML),\n" +
      "pas createTextFragmentLink() qui a echoue en 04bis.\n\n" +
      "1. Ouvrez Fenetre > Liens (le panneau doit etre visible).\n" +
      "2. Elle s'arretera DEUX fois pour capture : faites Cmd+Shift+3.\n" +
      "3. Elle se termine par une capture finale inconditionnelle.\n\n" +
      "Note : si T2 ne cree aucun lien, T3 s'arretera d'elle-meme et l'ecrira.\n\n" +
      "Cliquez OK pour lancer.");

runQ(0, T0_LOG, t0);
runQ(1, T1_LOG, t1);
runQ(2, T2_LOG, t2);
runQ(3, T3_LOG, t3);

alert("SONDE 04ter -- CAPTURE FINALE (inconditionnelle)\n\n" +
      "Toutes les etapes sont passees. Verifiez que Fenetre > Liens est visible,\n" +
      "puis faites Cmd+Shift+3 MAINTENANT.\n\n" +
      "Cliquez OK ensuite.");

alert("SONDE 04ter terminee.\n\nQuatre journaux ecrits dans /tmp :\n" +
      "  probe_04ter_T0_preference_lien.log\n" +
      "  probe_04ter_T1_production_icml.log\n" +
      "  probe_04ter_T2_placement_lie.log\n" +
      "  probe_04ter_T3_update_vs_mapping.log\n\n" +
      "Rapporter les 4 journaux + les captures du panneau Liens.\n\n" +
      "Les documents de production A et B ont ete fermes sans enregistrer.\n" +
      "Le document de test est LAISSE OUVERT (panneau Liens consultable).");

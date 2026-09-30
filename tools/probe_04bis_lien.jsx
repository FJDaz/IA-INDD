// ===========================================================================
//  probe_04bis_lien.jsx  --  SONDE JETABLE (Mission 04bis = etape 1 de la 04)
//
//  BUT : trancher par MESURE les 5 reserves documentaires laissees ouvertes
//  par le complement d'audit de la mission 04 (le "lien dynamique").
//  Spec : COMMUNICATION/mission_04bis_sonde_lien_runtime.md
//
//  CE QUE CETTE SONDE NE FAIT PAS :
//    - elle ne modifie PAS import_md.jsx (hors perimetre explicite) ;
//    - elle ne touche a AUCUN document existant : elle cree son PROPRE
//      document de test, qui est LAISSE OUVERT pour la capture du panneau Liens.
//    - elle ne conclut rien par deduction : chaque ligne de journal est un
//      fait observe, ou une erreur observee (jamais un catch vide).
//
//  PROTOCOLE IMPOSE (non negociable) :
//    - UN JOURNAL PAR QUESTION : /tmp/probe_04bis_Q0..Q5*.log
//    - logging systematique, horodate
//    - source PUREMENT ASCII (regle des sondes du projet)
//    - ES3 strict : pas de JSON, pas d'Array.prototype.indexOf, pas de trim
//    - le journal enregistre $.fileName : il dit LAQUELLE des deux copies a
//      tourne (piege structurel Cas 35/36)
//
//  MODE D'EMPLOI (FJD) :
//    1) copier ce fichier dans le panneau Scripts (rituel des deux copies) :
//       ~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/
//    2) REDEMARRER InDesign (instance neuve -- protocole point 1)
//    3) double-cliquer la sonde dans le panneau Scripts
//    4) a l'alerte "CAPTURE" : capturer le panneau Liens (Fenetre > Liens)
//    5) rapporter les 6 journaux /tmp/probe_04bis_Q*.log + la capture
// ===========================================================================

// ---------------------------------------------------------------------------
// EMPLACEMENT DES JOURNAUX : /tmp, un fichier par question (protocole point 4 :
// "une mesure = un fichier log distinct").
// ---------------------------------------------------------------------------
var LOG_DIR = "/tmp";
var Q0_LOG = LOG_DIR + "/probe_04bis_Q0_contexte.log";
var Q1_LOG = LOG_DIR + "/probe_04bis_Q1_createTextFragmentLink.log";
var Q2_LOG = LOG_DIR + "/probe_04bis_Q2_story_itemLink.log";
var Q3_LOG = LOG_DIR + "/probe_04bis_Q3_update_vs_mapping.log";
var Q4_LOG = LOG_DIR + "/probe_04bis_Q4_placeAndLink.log";
var Q5_LOG = LOG_DIR + "/probe_04bis_Q5_linkedStoryOptions.log";

// Document temoin en DEUX exemplaires (protocole point 6) : un intact, un
// modifiable. Le second est reecrit avec un contenu different pour declencher
// le cas "source modifiee" de Link.update().
var SRC_INTACT = LOG_DIR + "/probe_04bis_source_intact.md";
var SRC_LIVE = LOG_DIR + "/probe_04bis_source.md";
// 3e exemplaire en .txt : separe "forme d'URI refusee" de "extension .md non
// supportee par les liens de fragment de texte". Distinction decisive pour
// l'axe 1 voie A : si le .txt passe et le .md non, la voie native est morte
// POUR LE MARKDOWN -- ce n'est pas la meme conclusion que "voie native morte".
var SRC_TXT = LOG_DIR + "/probe_04bis_source.txt";
var SRC_A = "# Titre A\n\n## Sous-titre A\n\nParagraphe A.\n";
var SRC_B = "# Titre B MODIFIE\n\n## Sous-titre B MODIFIE\n\nParagraphe B MODIFIE.\n";

// Memoire de mapping REELLE du plugin (celle qu'utilise import_md.jsx dans le
// panneau Scripts). On l'utilise comme TEMOIN pour Q3 -- on ne la retravaille pas.
// Chemin derive du script lui-meme ($.fileName) : aucune donnee personnelle.
var MEM_PATH_PANEL = new File($.fileName).parent.fsName + "/import_md_mapping_memory.txt";

// ---------------------------------------------------------------------------
// ETAT PARTAGE ENTRE QUESTIONS
// ---------------------------------------------------------------------------
var LINES = [];
var TEST_DOC = null;
var TEST_STORY = null;
var LAST_LINK = null;

// ---------------------------------------------------------------------------
// PLOMBERIE DE JOURNAL (reprise du pattern import_md.jsx : logToFile/logError)
// ---------------------------------------------------------------------------
function p(m) { LINES.push(String(m)); }

function sn(v) {
  if (v === null) return "(null)";
  if (v === undefined) return "(undefined)";
  try { return String(v); } catch (e) { return "(valeur non affichable)"; }
}

function logErr(e, ctx) {
  var parts = ["ERREUR"];
  if (ctx) parts.push("contexte=" + ctx);
  try { parts.push("message=" + e.message); } catch (e1) {}
  try { if (typeof e.line !== "undefined") parts.push("ligne=" + e.line); } catch (e2) {}
  try { if (typeof e.fileName !== "undefined") parts.push("fichier=" + e.fileName); } catch (e3) {}
  try { if (e.stack) parts.push("stack=" + e.stack); } catch (e4) {}
  p(parts.join(" | "));
}

function writeLog(path) {
  try {
    var f = new File(path);
    try { f.encoding = "UTF-8"; } catch (eEnc) {}
    if (f.open("w")) {
      f.write(LINES.join("\n") + "\n");
      f.close();
      return true;
    }
  } catch (e) {
    alert("SONDE 04bis : ecriture du journal impossible.\n" + path + "\n" + e.message);
  }
  return false;
}

function runQ(q, path, fn) {
  LINES = [];
  p("================================================================");
  p("SONDE 04bis -- Q" + q + " -- " + new Date().toString());
  p("$.fileName (LA copie qui tourne) = " + sn($.fileName));
  p("app.version = " + sn(app.version) + " | app.locale = " + sn(app.locale));
  p("================================================================");
  try { fn(); } catch (e) { logErr(e, "bloc Q" + q); }
  p("--- fin Q" + q + " ---");
  writeLog(path);
}

// ---------------------------------------------------------------------------
// OUTILS D'INSPECTION RUNTIME
// `reflect` est le mecanisme natif ExtendScript pour enumerer les membres
// REELLEMENT presents : c'est ce qui permet de repondre Q1/Q2/Q5 sans deviner
// un seul nom de propriete.
// ---------------------------------------------------------------------------
function describeObj(o) {
  if (o === null) return "(null)";
  if (o === undefined) return "(undefined)";
  var parts = [];
  try { parts.push("typeof=" + (typeof o)); } catch (e1) { parts.push("typeof=?"); }
  try { parts.push("constructor=" + o.constructor.name); } catch (e2) { parts.push("constructor=?"); }
  try { parts.push("reflect.name=" + o.reflect.name); } catch (e3) { parts.push("reflect.name=?"); }
  return parts.join(" ");
}

function readProp(o, name) {
  if (o === null || o === undefined) return "(objet null)";
  try { return sn(o[name]); } catch (e) { return "(lecture KO: " + e.message + ")"; }
}

function reflectNames(o, kind, filter) {
  var out = [];
  if (o === null || o === undefined) return out;
  try {
    var coll = (kind === "methods") ? o.reflect.methods : o.reflect.properties;
    if (!coll) return out;
    for (var i = 0; i < coll.length; i++) {
      var n = sn(coll[i]);
      if (filter && n.toLowerCase().indexOf(String(filter).toLowerCase()) === -1) continue;
      out.push(n);
    }
  } catch (e) { logErr(e, "reflectNames(" + kind + ")"); }
  return out;
}

function dumpProps(o, label, filter) {
  var names = reflectNames(o, "properties", filter);
  p(label + " -> " + names.length + " propriete(s)" + (filter ? " contenant '" + filter + "'" : ""));
  for (var i = 0; i < names.length; i++) p("   " + names[i] + " = " + readProp(o, names[i]));
}

function dumpMethods(o, label, filter) {
  var names = reflectNames(o, "methods", filter);
  p(label + " -> " + names.length + " methode(s)" + (filter ? " contenant '" + filter + "'" : ""));
  for (var i = 0; i < names.length; i++) p("   " + names[i] + "()");
}

// ---------------------------------------------------------------------------
// FRAGMENTS REPRIS DE import_md.jsx (copies fideles -- voir le CR pour la liste)
// Le fichier import_md.jsx se termine par main() au top-level : il est donc
// IMPOSSIBLE de l'inclure (l'inclure executerait l'import). On copie donc les
// fragments strictement necessaires, et rien de plus.
// ---------------------------------------------------------------------------
function collectStylesRecursive(stylesCollection, groupsCollection, outList, isParagraph, groupName) {
  var i;
  for (i = 0; i < stylesCollection.length; i++) {
    outList.push({ name: stylesCollection[i].name, style: stylesCollection[i], groupName: groupName || "" });
  }
  for (i = 0; i < groupsCollection.length; i++) {
    var group = groupsCollection[i];
    var childStyles = isParagraph ? group.paragraphStyles : group.characterStyles;
    var childGroups = isParagraph ? group.paragraphStyleGroups : group.characterStyleGroups;
    collectStylesRecursive(childStyles, childGroups, outList, isParagraph, group.name);
  }
}

function getParagraphStyleEntries(doc) {
  var entries = [];
  try { collectStylesRecursive(doc.paragraphStyles, doc.paragraphStyleGroups, entries, true, ""); }
  catch (e) { logErr(e, "getParagraphStyleEntries"); }
  return entries;
}

function findParagraphStyleByName(doc, name) {
  var entries = getParagraphStyleEntries(doc);
  for (var i = 0; i < entries.length; i++) if (entries[i].name === name) return entries[i].style;
  return null;
}

function safeStyleName(styleObj, fallback) {
  try {
    if (styleObj === undefined || styleObj === null) return fallback;
    if (typeof styleObj === "string") return styleObj;
    var n = styleObj.name;
    if (n === undefined || n === null) return fallback;
    return String(n);
  } catch (e) { return fallback; }
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

function loadMemoryMapping(path) {
  try {
    var f = new File(path);
    if (!f.exists) return null;
    try { f.encoding = "UTF-8"; } catch (eE) {}
    if (!f.open("r")) return null;
    var c = f.read();
    f.close();
    if (!c || c.replace(/\s/g, "") === "") return null;
    var m = deserializeFlatMapping(c);
    var hasKey = false;
    for (var k in m) { if (m.hasOwnProperty(k)) { hasKey = true; break; } }
    return hasKey ? m : null;
  } catch (e) { logErr(e, "loadMemoryMapping"); return null; }
}

function writeTestSource(path, body) {
  try {
    var f = new File(path);
    try { f.encoding = "UTF-8"; } catch (eE) {}
    if (f.open("w")) { f.write(body); f.close(); return true; }
  } catch (e) { logErr(e, "writeTestSource " + path); }
  return false;
}

// Releve PAR PARAGRAPHE des styles reellement appliques : c'est la piece
// decisive de Q3 (protocole point 7 : "relever les noms de styles paragraphe
// par paragraphe, pas seulement 'ca a l'air bon'").
function readAppliedStyles(story) {
  var out = [];
  var paras = null;
  try { paras = story.paragraphs.everyItem().getElements(); }
  catch (e) { logErr(e, "readAppliedStyles/everyItem"); return out; }
  for (var i = 0; i < paras.length; i++) {
    var np = "?", nc = "?";
    try { np = safeStyleName(paras[i].appliedParagraphStyle, "?"); } catch (eP) { logErr(eP, "readAppliedStyles para " + i); }
    try { nc = safeStyleName(paras[i].appliedCharacterStyle, "?"); } catch (eC) { logErr(eC, "readAppliedStyles char " + i); }
    out.push("p[" + i + "] paragraphe='" + np + "' caractere='" + nc + "'");
  }
  return out;
}

// Cree (ou retrouve) un style de paragraphe temoin. Necessaire parce que le
// document de test ne contient que les deux styles par defaut : s'en servir
// comme repli rendrait le releve de Q3 incapable de distinguer "style conserve"
// de "style efface".
function ensureWitnessStyle(doc, name) {
  var found = findParagraphStyleByName(doc, name);
  if (found) { return found; }
  try {
    var created = doc.paragraphStyles.add({ name: name });
    return created;
  } catch (eAdd) {
    logErr(eAdd, "creation du style temoin '" + name + "'");
    return null;
  }
}

// ---------------------------------------------------------------------------
// MONTAGE DU TEMOIN (preparatif de Q3, journalise dans Q1)
// ---------------------------------------------------------------------------
function setupWitness() {
  // 1) document de test NEUF -- aucun document existant n'est touche
  try { TEST_DOC = app.documents.add(true); }
  catch (eAdd) { logErr(eAdd, "documents.add"); }
  if (!TEST_DOC) { p("IMPOSSIBLE de creer le document de test -> Q1..Q5 non mesurables"); return false; }
  p("document de test cree : name='" + sn(TEST_DOC.name) + "' | pages=" + sn(TEST_DOC.pages.length));

  // 2) neutraliser les DEFAUTS (meme geste que neutralizeDocumentDefaults)
  try {
    TEST_DOC.textDefaults.appliedParagraphStyle = TEST_DOC.paragraphStyles.item(0);
    TEST_DOC.textDefaults.appliedCharacterStyle = TEST_DOC.characterStyles.item(0);
    TEST_DOC.pageItemDefaults.appliedTextObjectStyle = TEST_DOC.objectStyles.item(0);
    p("defauts neutralises : textDefaults para/char + pageItemDefaults obj");
  } catch (eN) { logErr(eN, "neutralisation des defauts"); }

  // 3) cadre texte temoin -- trois voies essayees dans l'ordre, chacune
  //    journalisee : on ne suppose pas quelle forme d'add() est acceptee.
  var tf = null;
  var bounds = [20, 20, 120, 170];
  try {
    tf = TEST_DOC.textFrames.add({ geometricBounds: bounds });
    p("cadre cree via TEST_DOC.textFrames.add({geometricBounds})");
  } catch (eTf1) {
    logErr(eTf1, "textFrames.add (forme objet)");
    try {
      tf = TEST_DOC.pages[0].textFrames.add({ geometricBounds: bounds });
      p("cadre cree via TEST_DOC.pages[0].textFrames.add({geometricBounds})");
    } catch (eTf2) {
      logErr(eTf2, "pages[0].textFrames.add (forme objet)");
      try {
        tf = TEST_DOC.pages[0].textFrames.add();
        try { tf.geometricBounds = bounds; } catch (eB) { logErr(eB, "affectation geometricBounds"); }
        p("cadre cree via pages[0].textFrames.add() puis geometricBounds");
      } catch (eTf3) { logErr(eTf3, "pages[0].textFrames.add() (sans argument)"); }
    }
  }
  if (!tf) { p("IMPOSSIBLE de creer le cadre temoin -> Q1..Q5 non mesurables"); return false; }
  try { tf.contents = ""; } catch (eC) { logErr(eC, "tf.contents = vide"); }
  TEST_STORY = tf.parentStory;
  p("cadre temoin : " + describeObj(tf) + " | story=" + describeObj(TEST_STORY));

  // 4) trois paragraphes -- UNE assignation par paragraphe (Cas 14/17/20 :
  //    jamais de reassignation en boucle de .contents)
  try {
    TEST_STORY.insertionPoints[-1].contents = "Titre temoin\r";
    TEST_STORY.insertionPoints[-1].contents = "Paragraphe temoin.\r";
    TEST_STORY.insertionPoints[-1].contents = "Item de liste temoin.";
    p("trois paragraphes inseres (3 assignations distinctes, aucun += en boucle)");
  } catch (eI) { logErr(eI, "insertion des paragraphes temoins"); }

  // 5) styles appliques : le mapping REEL si ses styles existent dans le
  //    document de test, sinon repli explicite sur 3 styles reels distincts.
  //    (Le mecanisme teste par Q3 -- update() ecrase-t-il les styles ? -- ne
  //    depend pas des NOMS choisis : n'importe quels styles distincts suffisent.
  //    Chaque substitution est journalisee : aucune hypothese silencieuse.)
  var mem = loadMemoryMapping(MEM_PATH_PANEL);
  p("memoire de mapping : " + MEM_PATH_PANEL);
  p("   existe=" + new File(MEM_PATH_PANEL).exists + " | exploitable=" + (mem ? "oui" : "non"));
  if (mem) { for (var k in mem) { if (mem.hasOwnProperty(k)) p("   memoire[" + k + "] = '" + mem[k] + "'"); } }

  var entries = getParagraphStyleEntries(TEST_DOC);
  p("styles de paragraphe du document de test = " + entries.length);
  for (var s = 0; s < entries.length; s++) {
    p("   [" + s + "] '" + entries[s].name + "'" + (entries[s].groupName ? " (groupe '" + entries[s].groupName + "')" : ""));
  }

  // POINT CRITIQUE : le document de test ne contient que '[Aucun style]' et
  // '[Paragraphe standard]'. Les prendre comme repli rendrait Q3 AVEUGLE -- un
  // update() qui EFFACE les styles produirait un releve identique au releve
  // substitue, donc un faux verdict "IDENTIQUES". On CREE donc des styles
  // temoins dedies, aux noms distinctifs : tout effacement devient visible.
  var tags = ["h1", "p", "li"];
  var chosen = [];
  var origin = [];
  for (var t = 0; t < tags.length; t++) {
    var want = (mem && mem[tags[t]]) ? mem[tags[t]] : null;
    var st = want ? findParagraphStyleByName(TEST_DOC, want) : null;
    if (st) {
      chosen.push(st);
      origin.push("mapping[" + tags[t] + "] = '" + want + "' (style reel du document)");
    } else {
      var wname = "ZZ Temoin " + tags[t].toUpperCase();
      var wt = ensureWitnessStyle(TEST_DOC, wname);
      chosen.push(wt);
      origin.push((want
        ? ("TEMOIN CREE (mapping[" + tags[t] + "]='" + want + "' absent du document de test)")
        : "TEMOIN CREE (hors memoire)") + " -> '" + wname + "'");
    }
  }

  var paras = null;
  try { paras = TEST_STORY.paragraphs.everyItem().getElements(); }
  catch (eG) { logErr(eG, "setupWitness everyItem paragraphs"); }
  if (paras) {
    for (var pi = 0; pi < paras.length && pi < chosen.length; pi++) {
      if (!chosen[pi]) { p("   p[" + pi + "] aucun style disponible -> non applique"); continue; }
      try {
        paras[pi].appliedParagraphStyle = chosen[pi];
        p("   p[" + pi + "] style applique = '" + safeStyleName(chosen[pi], "?") + "' | origine=" + origin[pi]);
      } catch (eA) { logErr(eA, "setupWitness application style p[" + pi + "]"); }
    }
  }

  p("--- RELEVE INITIAL DES STYLES (temoin) ---");
  var init = readAppliedStyles(TEST_STORY);
  for (var r = 0; r < init.length; r++) p("   " + init[r]);

  // 6) document temoin .md, en DEUX exemplaires (intact / modifiable)
  p("ecriture du .md intact : " + SRC_INTACT + " -> " + writeTestSource(SRC_INTACT, SRC_A));
  p("ecriture du .md modifiable : " + SRC_LIVE + " -> " + writeTestSource(SRC_LIVE, SRC_A));
  p("ecriture du .txt jumeau : " + SRC_TXT + " -> " + writeTestSource(SRC_TXT, SRC_A));
  p("contenu A : " + SRC_A.replace(/\n/g, "\\n"));

  return true;
}

// ---------------------------------------------------------------------------
// Q0 -- CONTEXTE (aucune question de la spec : etat de l'environnement mesure)
// ---------------------------------------------------------------------------
function q0() {
  p("app.name = " + sn(app.name));
  p("app.version = " + sn(app.version));
  p("app.locale = " + sn(app.locale));
  p("app.scriptPreferences.userInteractionLevel = " + readProp(app.scriptPreferences, "userInteractionLevel"));
  p("app.documents.length = " + sn(app.documents.length));

  var doc = null;
  try { doc = app.activeDocument; } catch (e) { logErr(e, "activeDocument"); }
  p("document actif au lancement = " + (doc ? ("'" + sn(doc.name) + "'") : "(aucun)"));
  if (doc) {
    p("   pageWidth=" + readProp(doc.documentPreferences, "pageWidth") + " | pageHeight=" + readProp(doc.documentPreferences, "pageHeight"));
    var entries = getParagraphStyleEntries(doc);
    p("   styles de paragraphe = " + entries.length);
    for (var i = 0; i < entries.length; i++) p("      [" + i + "] '" + entries[i].name + "'");
    p("   doc.links.length = " + readProp(doc.links, "length"));
  }

  // La sonde ecrit-elle au bon endroit ? (le chemin est le point sensible du
  // protocole : deux copies du script, cf. Cas 35/36)
  p("dossier de la sonde = " + sn(new File($.fileName).parent.fsName));
  p("journaux ecrits dans = " + LOG_DIR);
  p("memoire de mapping lue depuis = " + MEM_PATH_PANEL + " (existe=" + new File(MEM_PATH_PANEL).exists + ")");
}

// ---------------------------------------------------------------------------
// Q1 -- createTextFragmentLink() : signature reelle, retour, linkResourceURI
// ---------------------------------------------------------------------------
function q1() {
  if (!setupWitness()) return;

  var ip = null;
  try { ip = TEST_STORY.insertionPoints[0]; } catch (e) { logErr(e, "Q1 insertionPoints[0]"); }
  p("point d'insertion vise : " + describeObj(ip));
  if (!ip) { p("aucun point d'insertion -> Q1 non mesurable"); return; }

  p("typeof ip.createTextFragmentLink = " + (typeof ip.createTextFragmentLink));
  try { p("ip.createTextFragmentLink.length (arite annoncee) = " + ip.createTextFragmentLink.length); }
  catch (eAr) { logErr(eAr, "Q1 arite"); }
  dumpMethods(ip, "methodes de InsertionPoint", "link");

  // MATRICE D'ARGUMENTS -- passe 2.
  // Le journal de la passe 1 a livre deux faits decisifs :
  //   (a) l'erreur sans argument nomme le 1er parametre : 'linkResourceURI' ;
  //   (b) avec un CHEMIN, l'API repond "Impossible de creer la ressource de
  //       lien a partir de l'URI donne." -> elle attend une URI, pas un chemin.
  // On teste donc les formes d'URI. Un echec est une mesure au meme titre
  // qu'un succes : il dit quelle forme est acceptee.
  var uriFile = "file://" + SRC_LIVE;
  var uriLocal = "file://localhost" + SRC_LIVE;
  var uriPrivate = "file:///private" + SRC_LIVE;
  var uriTxt = "file://" + SRC_TXT;

  // Forme canonique Adobe : File.absoluteURI (presente dans l'objet File
  // d'ExtendScript, hors spec ECMA). On la lit sans la supposer.
  var uriAbsolute = "";
  try {
    uriAbsolute = String(new File(SRC_LIVE).absoluteURI);
    p("File.absoluteURI (forme canonique Adobe) = " + uriAbsolute);
  } catch (eAbs) {
    logErr(eAbs, "Q1 File.absoluteURI");
    p("File.absoluteURI indisponible sur ce poste -> forme non testee");
  }

  // Appel explicite par arite : on evite Function.apply, dont le passage
  // d'arguments vers les methodes natives d'InDesign n'est pas garanti en ES3.
  function callLink(target, args) {
    if (args.length === 0) { return target.createTextFragmentLink(); }
    if (args.length === 1) { return target.createTextFragmentLink(args[0]); }
    return target.createTextFragmentLink(args[0], args[1]);
  }

  var candidates = [
    { lbl: "0 argument",                 args: [] },
    { lbl: "chemin absolu",              args: [SRC_LIVE] },
    { lbl: "chemin + nom",               args: [SRC_LIVE, "probe_04bis_source"] },
    { lbl: "URI file://",                args: [uriFile] },
    { lbl: "URI file:// + nom",          args: [uriFile, "probe_04bis_source"] },
    { lbl: "URI file://localhost",       args: [uriLocal] },
    { lbl: "URI file:///private (macOS)", args: [uriPrivate] },
    { lbl: "URI file:/ (un seul slash)", args: ["file:" + SRC_LIVE] },
    { lbl: "URI .txt (file://)",          args: [uriTxt] },
    { lbl: "URI .txt (file://) + nom",    args: [uriTxt, "probe_04bis_source"] }
  ];
  if (uriAbsolute) {
    candidates.push({ lbl: "URI File.absoluteURI (canonique Adobe)", args: [uriAbsolute] });
  }

  for (var c = 0; c < candidates.length; c++) {
    var cand = candidates[c];
    p("--- essai " + (c + 1) + " : " + cand.lbl + " | nb args=" + cand.args.length + " ---");
    try {
      var r = callLink(ip, cand.args);
      p("   RETOUR : " + describeObj(r));
      p("   valeur = " + sn(r));
      if (r) {
        p("   name = " + readProp(r, "name"));
        p("   filePath = " + readProp(r, "filePath"));
        p("   linkResourceURI = " + readProp(r, "linkResourceURI"));
        p("   linkType = " + readProp(r, "linkType"));
        p("   status = " + readProp(r, "status"));
        p("   parent = " + describeObj(r.parent));
        if (!LAST_LINK) { LAST_LINK = r; }
      }
    } catch (eC) { logErr(eC, "Q1 essai " + (c + 1) + " (" + cand.lbl + ")"); }
    try { p("   doc.links.length apres cet essai = " + TEST_DOC.links.length); }
    catch (eDL) { logErr(eDL, "Q1 doc.links apres essai " + (c + 1)); }
  }

  // --- Q1b : hypothese "placer d'abord" ---------------------------------
  // Le lien vise peut-etre une ressource DEJA placee : on place le .md dans un
  // 2e cadre, puis on tente createTextFragmentLink() sur un point d'insertion
  // de la story ainsi obtenue.
  p("--- Q1b : hypothese 'placer d'abord' ---");
  var f = new File(SRC_LIVE);
  p("fichier source existe = " + f.exists + " | chemin=" + f.fsName);
  var tf2 = null;
  try { tf2 = TEST_DOC.pages[0].textFrames.add({ geometricBounds: [140, 20, 200, 170] }); }
  catch (eT2) { logErr(eT2, "Q1b cadre 2"); }
  if (tf2) {
    // Garde d'interaction : place() peut ouvrir un selecteur ("show import
    // options") et BLOQUER la sonde pour toujours. On force NEVER_INTERACT
    // le temps de l'appel, puis on restaure la valeur initiale.
    var placed = null;
    var prevUI = null;
    try { prevUI = app.scriptPreferences.userInteractionLevel; }
    catch (eUI0) { logErr(eUI0, "Q1b lecture userInteractionLevel"); }
    try {
      app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
      p("userInteractionLevel force a NEVER_INTERACT pendant place() (evite un selecteur bloquant)");
    } catch (eUI1) { logErr(eUI1, "Q1b NEVER_INTERACT"); }
    try { placed = tf2.place(f); } catch (eP) { logErr(eP, "Q1b place(.md)"); }
    try {
      if (prevUI !== null) { app.scriptPreferences.userInteractionLevel = prevUI; }
      p("userInteractionLevel restaure = " + app.scriptPreferences.userInteractionLevel);
    } catch (eUI2) { logErr(eUI2, "Q1b restauration userInteractionLevel"); }
    p("tf2.place(.md) RETOUR = " + describeObj(placed) + " | valeur=" + sn(placed));
    p("tf2.contents longueur = " + (tf2.contents ? tf2.contents.length : "(null)"));
    p("tf2.parentStory.itemLink = " + readProp(tf2.parentStory, "itemLink"));
    try { p("doc.links.length apres place = " + TEST_DOC.links.length); }
    catch (eDL2) { logErr(eDL2, "Q1b doc.links apres place"); }
    var ip2 = null;
    try { ip2 = tf2.parentStory.insertionPoints[0]; } catch (eI2) { logErr(eI2, "Q1b insertionPoints"); }
    if (ip2) {
      try {
        var rP = ip2.createTextFragmentLink(uriFile);
        p("createTextFragmentLink(URI) sur story placee RETOUR = " + describeObj(rP) + " | valeur=" + sn(rP));
        if (rP && !LAST_LINK) { LAST_LINK = rP; }
      } catch (eRP) { logErr(eRP, "Q1b createTextFragmentLink sur story placee"); }
    } else {
      p("aucun point d'insertion sur la story placee");
    }
  }

  p("lien retenu pour Q2/Q3 : " + describeObj(LAST_LINK));

  // Inventaire des liens du document apres les essais : c'est la preuve
  // "l'objet est bien celui du panneau Liens, et non un objet inerte".
  var links = null;
  try { links = TEST_DOC.links.everyItem().getElements(); } catch (eL) { logErr(eL, "Q1 doc.links"); }
  p("doc.links apres les essais = " + (links ? links.length : "(lecture KO)"));
  if (links) {
    for (var i = 0; i < links.length; i++) {
      p("   lien[" + i + "] name='" + readProp(links[i], "name") + "' status=" + readProp(links[i], "status") +
        " linkType=" + readProp(links[i], "linkType") + " filePath='" + readProp(links[i], "filePath") +
        "' linkResourceURI='" + readProp(links[i], "linkResourceURI") + "' parent=" + describeObj(links[i].parent));
    }
  }
}

// ---------------------------------------------------------------------------
// Q2 -- story.itemLink apres createTextFragmentLink()
// ---------------------------------------------------------------------------
function q2() {
  if (!TEST_STORY) { p("aucun story temoin (Q1 a echoue) -> Q2 non mesurable"); return; }

  var il = null;
  try { il = TEST_STORY.itemLink; } catch (e) { logErr(e, "Q2 story.itemLink"); }
  p("typeof story.itemLink = " + (typeof il));
  p("story.itemLink = " + describeObj(il));
  if (il) {
    p("   name = " + readProp(il, "name"));
    p("   filePath = " + readProp(il, "filePath"));
    p("   linkResourceURI = " + readProp(il, "linkResourceURI"));
    p("   linkType = " + readProp(il, "linkType"));
    p("   status = " + readProp(il, "status"));
    p("   parent = " + describeObj(il.parent));
    dumpProps(il, "proprietes de Link (reflect)", null);
  } else {
    p("story.itemLink est null/undefined -> le Link cree par createTextFragmentLink() n'est PAS expose par story.itemLink (fait negatif a enregistrer)");
  }

  p("story.itemLink === LAST_LINK ? " + (il === LAST_LINK));
  if (il === null && LAST_LINK === null) {
    p("   ATTENTION : cette egalite est VIDE (null === null). Elle ne prouve rien : a ne pas lire comme une correspondance.");
  }

  var links = null;
  try { links = TEST_DOC.links.everyItem().getElements(); } catch (eL) { logErr(eL, "Q2 doc.links"); }
  p("doc.links.length = " + (links ? links.length : "(lecture KO)"));

  p("--- Q5 en passant : Story.linkedStoryOptions (releve ici car il depend du story) ---");
  var lso = null;
  try { lso = TEST_STORY.linkedStoryOptions; } catch (eO) { logErr(eO, "Q2 linkedStoryOptions"); }
  p("typeof story.linkedStoryOptions = " + (typeof lso));
  p("story.linkedStoryOptions = " + describeObj(lso));
}

// ---------------------------------------------------------------------------
// Q3 -- DECISIVE : Link.update() re-importe-t-il le fichier source BRUT
//       (donc ecrase notre mapping de styles) ou se contente-t-il d'un
//       controle de fraicheur ?
// ---------------------------------------------------------------------------
function q3() {
  if (!TEST_STORY) { p("aucun story temoin (Q1 a echoue) -> Q3 non mesurable"); return; }

  p("--- RELEVE AVANT (styles reellement appliques, paragraphe par paragraphe) ---");
  var before = readAppliedStyles(TEST_STORY);
  for (var i = 0; i < before.length; i++) p("   " + before[i]);

  var contentsBefore = null;
  try { contentsBefore = TEST_STORY.contents; } catch (eCb) { logErr(eCb, "Q3 story.contents avant"); }
  p("story.contents AVANT : longueur=" + (contentsBefore === null ? "(null)" : contentsBefore.length));
  p("story.contents AVANT : " + sn(contentsBefore));

  // 1) quel lien allons-nous mettre a jour ?
  var link = LAST_LINK;
  if (!link) { try { link = TEST_STORY.itemLink; } catch (eL) { logErr(eL, "Q3 story.itemLink"); } }
  p("lien utilise pour update() : " + describeObj(link));
  if (!link) {
    p("AUCUN LIEN -> Q3 NON MESURABLE dans cet etat. Voir Q1 : le mecanisme de creation a echoue.");
    p("Conclusion honnete : Q3 NON TRANCHEE (pas d'echec deguise en resultat).");
    return;
  }

  p("link.filePath AVANT = " + readProp(link, "filePath"));
  p("link.linkResourceURI AVANT = " + readProp(link, "linkResourceURI"));
  p("link.status AVANT = " + readProp(link, "status"));
  p("link.name AVANT = " + readProp(link, "name"));

  // 2) declencher le cas "source modifiee" (protocole point 6)
  var wrote = writeTestSource(SRC_LIVE, SRC_B);
  p("source reecrite avec le contenu B = " + wrote + " | chemin=" + SRC_LIVE);
  p("contenu B : " + SRC_B.replace(/\n/g, "\\n"));
  p("link.status APRES reecriture de la source (avant update) = " + readProp(link, "status"));

  // PAUSE 1/2 -- le statut doit etre OUT_OF_DATE a cet instant : c'est LE fait
  // decisif de Q3, et le seul visible dans le panneau. Capture AVANT update().
  alert("SONDE 04bis -- CAPTURE 1/2 (AVANT update)\n\n" +
        "La source .md vient d'etre REECRITE, le lien n'est PAS encore mis a jour.\n\n" +
        "Attendu dans le panneau Liens : le lien passe en ETAT MODIFIE (out of date).\n\n" +
        "Faites Cmd+Shift+3 (capture plein ecran) MAINTENANT,\n" +
        "puis cliquez OK : la sonde appellera link.update().");

  // 3) update()
  p("--- appel de link.update() ---");
  try {
    var upd = link.update();
    p("link.update() RETOUR : " + describeObj(upd));
    p("link.update() valeur = " + sn(upd));
    p("link.status APRES update = " + readProp(link, "status"));
  } catch (eUp) { logErr(eUp, "Q3 link.update()"); }

  // 4) releve APRES
  p("--- RELEVE APRES ---");
  var after = readAppliedStyles(TEST_STORY);
  for (var j = 0; j < after.length; j++) p("   " + after[j]);

  var contentsAfter = null;
  try { contentsAfter = TEST_STORY.contents; } catch (eCa) { logErr(eCa, "Q3 story.contents apres"); }
  p("story.contents APRES : longueur=" + (contentsAfter === null ? "(null)" : contentsAfter.length));
  p("story.contents APRES : " + sn(contentsAfter));

  // 5) verdict BRUT, calcule sur les releves (pas sur une impression)
  var sameStyles = (before.length === after.length);
  if (sameStyles) {
    for (var k = 0; k < before.length; k++) { if (before[k] !== after[k]) { sameStyles = false; break; } }
  }
  var sameText = (contentsBefore === contentsAfter);
  p("================================================================");
  p("VERDICT Q3 (styles) : " + (sameStyles ? "IDENTIQUES avant/apres -> update() n'a PAS ecrase le mapping" : "MODIFIES avant/apres -> update() a ECRASE tout ou partie du mapping"));
  p("VERDICT Q3 (texte)  : " + (sameText ? "IDENTIQUE avant/apres -> pas de re-import du contenu source" : "MODIFIE avant/apres -> update() a re-importe du contenu"));
  p("================================================================");

  // Le document reste OUVERT : c'est maintenant que la capture du panneau
  // Liens doit etre faite (protocole point 5).
  alert("SONDE 04bis -- CAPTURE 2/2 (APRES update)\n\n" +
        "link.update() vient d'etre appele.\n" +
        "Le document de test est ouvert.\n\n" +
        "Attendu dans le panneau Liens : le lien repasse en ETAT NORMAL.\n\n" +
        "Faites Cmd+Shift+3 (capture plein ecran) MAINTENANT,\n" +
        "puis cliquez OK (la sonde continue avec Q4 et Q5).");
}

// ---------------------------------------------------------------------------
// Q4 -- placeAndLink() : presence reelle au runtime, arite, emplacements
// ---------------------------------------------------------------------------
function q4() {
  var doc = TEST_DOC;
  if (!doc) { p("aucun document de test -> Q4 non mesurable"); return; }

  p("typeof doc.placeAndLink = " + (typeof doc.placeAndLink));
  try { p("doc.placeAndLink.length = " + doc.placeAndLink.length); } catch (eA) { logErr(eA, "Q4 arite doc"); }
  dumpMethods(doc, "methodes de Document contenant 'place'", "place");

  var page = null;
  try { page = doc.pages[0]; } catch (eP) { logErr(eP, "Q4 doc.pages[0]"); }
  if (page) {
    p("typeof page.placeAndLink = " + (typeof page.placeAndLink));
    try { p("page.placeAndLink.length = " + page.placeAndLink.length); } catch (eA2) { logErr(eA2, "Q4 arite page"); }
  }
  var spread = null;
  try { spread = doc.spreads[0]; } catch (eS) { logErr(eS, "Q4 doc.spreads[0]"); }
  if (spread) {
    p("typeof spread.placeAndLink = " + (typeof spread.placeAndLink));
    try { p("spread.placeAndLink.length = " + spread.placeAndLink.length); } catch (eA3) { logErr(eA3, "Q4 arite spread"); }
  }
  var master = null;
  try { master = doc.masterSpreads[0]; } catch (eM) { logErr(eM, "Q4 masterSpreads[0]"); }
  if (master) {
    p("typeof master.placeAndLink = " + (typeof master.placeAndLink));
  }

  p("NON INVOQUE (choix explicite, journalise) : placeAndLink(parentStory) n'accepte AUCUN fichier en argument.");
  p("L'invoquer sans place() prealable n'a pas de source a lier ; l'invoquer avec interaction ouverte");
  p("declencherait un selecteur de fichier et bloquerait la sonde. La question Q4 porte de toute facon");
  p("sur la DEPRECIATION, qui est un fait de DOCUMENTATION (Document.html), pas un fait de runtime.");
  p("=> Q4 partie runtime : mesuree ci-dessus. Q4 partie depreciation : a citer verbatim depuis la doc.");
}

// ---------------------------------------------------------------------------
// Q5 -- Story.linkedStoryOptions : membres REELLEMENT accessibles au runtime
// ---------------------------------------------------------------------------
function q5() {
  if (!TEST_STORY) { p("aucun story temoin -> Q5 non mesurable"); return; }

  var lso = null;
  try { lso = TEST_STORY.linkedStoryOptions; } catch (e) { logErr(e, "Q5 linkedStoryOptions"); }
  p("typeof story.linkedStoryOptions = " + (typeof lso));
  p("objet = " + describeObj(lso));
  if (!lso) { p("linkedStoryOptions inaccessible -> Q5 non tranchee"); return; }

  dumpProps(lso, "reflect.properties de linkedStoryOptions", null);
  dumpMethods(lso, "reflect.methods de linkedStoryOptions", null);

  p("--- lecture ciblee des candidats du fait negatif A ---");
  var cands = ["createLinksWhenPlacingTextAndSpreadsheetFiles", "createLinksWhenPlacingText",
               "updateLinkWhenPlacingText", "linkedStory", "link", "parent", "story"];
  for (var i = 0; i < cands.length; i++) {
    p("   " + cands[i] + " = " + readProp(lso, cands[i]) + " (typeof=" + (function (o, n) {
      try { return (typeof o[n]); } catch (e) { return "?"; }
    })(lso, cands[i]) + ")");
  }

  p("--- inventaire des liens du document a cet instant ---");
  var links = null;
  try { links = TEST_DOC.links.everyItem().getElements(); } catch (eL) { logErr(eL, "Q5 doc.links"); }
  p("doc.links.length = " + (links ? links.length : "(lecture KO)"));
  if (links) {
    for (var j = 0; j < links.length; j++) {
      p("   lien[" + j + "] '" + readProp(links[j], "name") + "' status=" + readProp(links[j], "status") +
        " linkType=" + readProp(links[j], "linkType") + " filePath='" + readProp(links[j], "filePath") + "'");
    }
  }
}

// ===========================================================================
// EXECUTION -- Q0 a Q5, chacune avec SON journal
// ===========================================================================
alert("SONDE 04bis -- AVANT DE COMMENCER\n\n" +
      "1) Ouvrez MAINTENANT le panneau Fenetre > Liens : il restera visible\n" +
      "   et c'est lui que vous capturerez deux fois.\n" +
      "2) Sur macOS : Cmd+Shift+3 = capture de TOUT l'ecran (le plus sur,\n" +
      "   le panneau y figure meme si la boite de dialogue est au premier plan).\n" +
      "   Les images vont sur le Bureau.\n\n" +
      "La sonde cree son PROPRE document de test et ne touche a aucun autre.\n\n" +
      "(Cliquez OK pour lancer Q0 a Q5.)");

runQ(0, Q0_LOG, q0);
runQ(1, Q1_LOG, q1);
runQ(2, Q2_LOG, q2);
runQ(3, Q3_LOG, q3);
runQ(4, Q4_LOG, q4);
runQ(5, Q5_LOG, q5);

// Pause de capture INCONDITIONNELLE : que Q1 ait reussi ou echoue, le panneau
// Liens doit etre capture -- c'est la seule preuve possible de Q2, et elle vaut
// aussi comme fait negatif ("aucun lien cree") si la creation a echoue.
alert("SONDE 04bis -- CAPTURE FINALE (inconditionnelle)\n\n" +
      "Toutes les questions sont passees. Le document de test est ouvert.\n\n" +
      "Verifiez que Fenetre > Liens est bien visible, puis faites\n" +
      "Cmd+Shift+3 MAINTENANT (le panneau Liens doit y figurer).\n\n" +
      "Cliquez OK ensuite.");

alert("SONDE 04bis terminee.\n\nSix journaux ecrits dans /tmp :\n" +
      "  probe_04bis_Q0_contexte.log\n" +
      "  probe_04bis_Q1_createTextFragmentLink.log\n" +
      "  probe_04bis_Q2_story_itemLink.log\n" +
      "  probe_04bis_Q3_update_vs_mapping.log\n" +
      "  probe_04bis_Q4_placeAndLink.log\n" +
      "  probe_04bis_Q5_linkedStoryOptions.log\n\n" +
      "Le document de test est LAISSE OUVERT (panneau Liens consultable).\n\n" +
      "Rapporter les 6 journaux + la capture du panneau Liens.");

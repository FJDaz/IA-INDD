// Batterie de verification du panneau Liens MD, HORS InDesign (Node).
// Fichier ADDITIF : il ne participe pas au panneau et peut etre supprime sans
// consequence. Il existe pour que la preuve du cablage du moteur soit
// REPRODUCTIBLE par un clone du depot, sans InDesign :  node verifier_moteur.js
// Aucun accent, aucun caractere non-ASCII (contrainte du projet).
// Harnais de verification du panneau Liens MD (hors UXP).
// On charge main.js dans un contexte vm avec des stubs de DOM / require /
// setTimeout, puis on EXERCE la logique du moteur porte. Ce n'est pas un test
// du runtime UXP : c'est un test de MON code, pour ne pas annoncer un
// comportement que je n'ai pas observe.
const fs = require("fs");
const vm = require("vm");

const CHEMIN = require("path").join(__dirname, "main.js");
const source = fs.readFileSync(CHEMIN, "utf8");

/* ---------------- stubs DOM ---------------- */
/* Le stub doit maintenant soutenir ce que le VRAI panneau fait depuis le
   tir 8 : CLONER une ligne-modele (cloneNode), l'AJOUTER (appendChild) et
   la RETIRER au rafraichissement suivant (removeChild). Regles tenues :
   - appendChild enregistre l'enfant dans les listes de CLASSE (".ligne",
     ".ligne-src") par CONCATENATION : la liste ".ligne" devient une COPIE,
     si bien que le tableau ` lignes ` (les 3 modeles) garde sa longueur 3.
     C'est exactement l'invariant du dessin : la bibliotheque d'icones est
     intacte, et querySelectorAll(".ligne") voit en plus les lignes reelles.
   - removeChild retire des memes listes (par recopie, jamais par mutation
     du tableau ` lignes `). */
function element(id) {
  const e = {
    id: id,
    textContent: "",
    className: "",
    style: {},
    enfants: {},
    _children: [],
    parentNode: null,
    _attrs: {},
    _classes: {},
    classList: {
      add: function (c) { this._owner._classes[c] = true; },
      remove: function (c) { delete this._owner._classes[c]; },
      contains: function (c) { return !!this._owner._classes[c]; }
    },
    addEventListener: function () {},
    appendChild: function (c) {
      this._children.push(c);
      c.parentNode = this;
      const classes = String(c.className || "").split(" ");
      for (let i = 0; i < classes.length; i++) {
        if (!classes[i]) continue;
        const cle = "." + classes[i];
        // Concat : on ne mute PAS la liste existante (le tableau ` lignes `
        // des 3 modeles doit garder sa longueur).
        this.enfants[cle] = (this.enfants[cle] || []).concat([c]);
      }
      return c;
    },
    removeChild: function (c) {
      const i = this._children.indexOf(c);
      if (i >= 0) this._children.splice(i, 1);
      c.parentNode = null;
      const cles = Object.keys(this.enfants);
      for (let k = 0; k < cles.length; k++) {
        if (cles[k].indexOf(".") !== 0) continue;
        const liste = this.enfants[cles[k]];
        if (!Array.isArray(liste)) continue;
        this.enfants[cles[k]] = liste.filter(function (x) { return x !== c; });
      }
      return c;
    },
    cloneNode: function (profond) {
      const c = element(this.id);
      c.textContent = this.textContent;
      c.className = this.className;
      c.style = {};
      const sk = Object.keys(this.style);
      for (let i = 0; i < sk.length; i++) c.style[sk[i]] = this.style[sk[i]];
      c._attrs = {};
      const ak = Object.keys(this._attrs);
      for (let i = 0; i < ak.length; i++) c._attrs[ak[i]] = this._attrs[ak[i]];
      if (profond) {
        const ek = Object.keys(this.enfants);
        for (let i = 0; i < ek.length; i++) {
          const v = this.enfants[ek[i]];
          if (Array.isArray(v)) continue;      // listes de parent, non heritees
          c.enfants[ek[i]] = v.cloneNode ? v.cloneNode(true) : null;
        }
      }
      return c;
    },
    scrollTop: 0,
    scrollHeight: 0,
    getAttribute: function (k) { return this._attrs[k]; },
    setAttribute: function (k, v) { this._attrs[k] = v; },
    querySelector: function (sel) { return this.enfants[sel] || null; },
    querySelectorAll: function (sel) { return this.enfants[sel] || []; }
  };
  e.classList._owner = e;
  return e;
}

const DOM = {};
function elem(id) {
  if (!DOM[id]) DOM[id] = element(id);
  return DOM[id];
}

// Les 3 lignes-modeles du dessin, avec leurs enfants.
const lignes = [];
[["0", "12"], ["1", "4"], ["2", "31"]].forEach(function (p) {
  const l = element("ligne" + p[0]);
  l._attrs = { "data-index": p[0], "data-page": p[1] };
  l.enfants[".col-nom"] = element("nom" + p[0]);
  l.enfants[".page-num"] = element("page" + p[0]);
  l.enfants[".page-num"].textContent = p[1];
  lignes.push(l);
});
elem("liste_corps").enfants[".ligne"] = lignes;

const IDS = ["statut", "statut_texte", "liste_note", "journal", "nb_selection", "calibrage", "ligne_calibrage",
  "btn_page", "btn_expand", "btn_relier", "btn_import", "btn_actualiser", "btn_editer",
  "btn_expand_ferme", "btn_expand_ouvert", "icone_calibrage", "icone_calibrage_ouvert",
  "info_nom", "info_etat", "info_taille", "info_mots", "info_signes", "info_date",
  "info_chemin", "info_modele", "zone_infos"];
IDS.forEach(elem);

const document = {
  getElementById: function (id) { return DOM[id] || null; }
};

/* ---------------- stubs require ---------------- */
const JOURNAL_DISQUE = {
  "/projet/import_md_errors.log": ""
};

// Le "disque" : chemin -> contenu
const DISQUE = {};
function miseEnPlace(fichiers) {
  Object.keys(DISQUE).forEach(function (k) { delete DISQUE[k]; });
  DISQUE["/projet/import_md_errors.log"] = "";
  Object.keys(fichiers).forEach(function (k) { DISQUE[k] = fichiers[k]; });
}

let doScriptAppels = [];
let lfsAppelsUrl = [];
let etatRendu = "different";
let journalMoteurAjout = "";
// Jeton de la LECTURE DU JOURNAL DU MOTEUR (route ExtendScript, BINARY).
const LECTURE_JOURNAL = 'j.encoding = "BINARY"';
const CHEMIN_JOURNAL = "/projet/import_md_errors.log";
function rendreJournal() { return DISQUE[CHEMIN_JOURNAL] || ""; }
// Ce que rend le selecteur natif d'UXP : un fichier, ou null si FJD annule.
let fichierChoisi = null;

const lfs = {
  getPluginFolder: async function () { return { nativePath: "/projet/uxp/com.fjd.importmd.panneau" }; },
  getDataFolder: async function () { return { createFile: async function () { return { nativePath: "/tmp/j.txt", write: async function () {} }; } }; },
  getTemporaryFolder: async function () { return { createFile: async function () { return { nativePath: "/tmp/j.txt", write: async function () {} }; } }; },
  getFileForOpening: async function () { return fichierChoisi; },
  getEntryWithUrl: async function (url) {
    const chemin = url.replace(/^file:\/\//, "");
    lfsAppelsUrl.push(chemin);
    if (DISQUE[chemin] === undefined) throw new Error("fichier absent : " + chemin);
    return {
      isFile: true,
      read: async function () { return DISQUE[chemin]; },
      getMetadata: async function () { return { dateModified: new Date(1759300000000) }; }
    };
  }
};

const indesign = {
  ScriptLanguage: { JAVASCRIPT: 1246973031 },
  app: {
    documents: [],
    activeDocument: null,
    /* Tir 9 : le panneau s'abonne aux evenements documentaires. On les
       ENREGISTRE (nom + ecouteur) pour pouvoir les declencher dans les tests. */
    addEventListener: function (name, fn) { evenementsPoses.push({ name: name, fn: fn }); return true; },
    removeEventListener: function () { return true; },
    doScript: function (src) {
      doScriptAppels.push(src);
      if (src.indexOf("__M04_TUBE_IMPOSE") >= 0) {
        DISQUE["/projet/import_md_errors.log"] =
          (DISQUE["/projet/import_md_errors.log"] || "") +
          "M04-repartiteur: appel PANNEAU\nM04: source IMPOSEE par le PANNEAU\n";
        return "";
      }
      // Le journal est lu PAR LE MOTEUR, pas par UXP.
      if (src.indexOf(LECTURE_JOURNAL) >= 0) return rendreJournal();
      return etatRendu;
    }
  }
};

function requireStub(nom) {
  if (nom === "indesign") return indesign;
  if (nom === "uxp") return { versions: {}, storage: { localFileSystem: lfs } };
  if (nom === "fs") return { lstat: async function () { return { mtime: new Date(1759300000000) }; } };
  throw new Error("module inconnu : " + nom);
}

/* ---------------- contexte ---------------- */
/* ---------------- minuteurs enregistrables (tir 9) ---------------- */
/* Avant le tir 9, setTimeout etait un NO-OP : le panneau ne pouvait donc pas
   etre teste sur un comportement DIFFERE (le rafraichissement de veille). On
   ENREGISTRE desormais les minuteurs SANS les executer : le harnais decide
   quand les declencher. Les blocs anterieurs restent valides car aucun
   minuteur ne s'execute tout seul. */
let fileMinuteurs = [];
let fileIntervalles = [];
let prochainIdMinuteur = 1;
function minuteursEnAttente() { return fileMinuteurs.length; }
function intervallesEnAttente() { return fileIntervalles.length; }
function viderMinuteurs() { fileMinuteurs = []; }
function declencherMinuteurs() {
  const lot = fileMinuteurs;
  fileMinuteurs = [];
  lot.forEach(function (m) { m.fn(); });
  return lot.length;
}
function declencherIntervalles() {
  fileIntervalles.forEach(function (i) { i.fn(); });
}

/* ---------------- evenements InDesign enregistrables (tir 9) ---------------- */
/* addEventListener de l'app est stubbe : on retient les ecouteurs pour pouvoir
   les DECLENCHER a la demande (le panneau s'y abonne desormais au chargement). */
const evenementsPoses = [];
function declencherEvenement(nom) {
  let n = 0;
  evenementsPoses.forEach(function (e) { if (e.name === nom) { e.fn({ eventType: nom, currentTarget: { name: nom } }); n++; } });
  return n;
}
function nomsEvenementsPoses() {
  return evenementsPoses.map(function (e) { return e.name; });
}

const sandbox = {
  document: document,
  require: requireStub,
  console: { log: function () {} },
  setTimeout: function (fn) { const id = prochainIdMinuteur++; fileMinuteurs.push({ id: id, fn: fn }); return id; },
  clearTimeout: function (id) { fileMinuteurs = fileMinuteurs.filter(function (m) { return m.id !== id; }); },
  setInterval: function (fn) { const id = prochainIdMinuteur++; fileIntervalles.push({ id: id, fn: fn }); return id; },
  clearInterval: function (id) { fileIntervalles = fileIntervalles.filter(function (i) { return i.id !== id; }); },
  Date: Date,
  JSON: JSON,
  Math: Math,
  String: String,
  Number: Number,
  parseInt: parseInt,
  isFinite: isFinite
};
sandbox.window = sandbox;
vm.createContext(sandbox);

// Ce que le DOM portait AVANT le 01/10/2026 : les valeurs de la maquette,
// ecrites en dur dans index.html (3 sources, 2 liens selectionnes, fiche
// garnie). Ce residu simule une regression de l'habillage : si ces valeurs
// survivent au chargement de main.js, alors le panneau s'ouvre sur le DESSIN,
// exactement ce que FJD a refuse (" un panneau vide on load ").
// viderLaListe() doit les effacer, qu'elles soient dans le DOM ou non.
DOM.liste_note.textContent = "3 sources dans ce document.";
DOM.nb_selection.textContent = "2 liens selectionnes";
DOM.info_nom.textContent = "charte_gemini_formation.md";
DOM.info_taille.textContent = "28,4 ko (29 117 octets)";
DOM.info_mots.textContent = "1 842";
DOM.info_signes.textContent = "12 903";
DOM.info_date.textContent = "mercredi 1 octobre 2026 09:14";
DOM.info_chemin.textContent = "/Users/fjd/Docs/charte_gemini_...";
DOM.info_modele.textContent = "Gemini 2.5 Pro";
DOM.info_etat.textContent = "modifiee";
DOM.info_etat.className = "etat modifiee";
lignes[0].className = "ligne etat-modifiee";
lignes[0].style.display = "flex";
lignes[1].className = "ligne selection etat-identique";
lignes[1].style.display = "flex";
lignes[2].className = "ligne etat-absente";
lignes[2].style.display = "flex";

vm.runInContext(source, sandbox, { filename: CHEMIN });

const API = sandbox.window.panneauLiensMd;

/* ---------------- micro-framework ---------------- */
let echecs = 0;
let total = 0;
function verifier(nom, obtenu, attendu) {
  total++;
  const o = JSON.stringify(obtenu);
  const a = JSON.stringify(attendu);
  if (o === a) {
    console.log("  OK    " + nom + "  ->  " + o);
  } else {
    echecs++;
    console.log("  ECHEC " + nom + "\n          attendu : " + a + "\n          obtenu  : " + o);
  }
}
function titre(t) { console.log("\n=== " + t + " ==="); }

/* Toutes les lignes de la liste : les 3 lignes-modeles PLUS les lignes
   reelles issues du clonage (classe " ligne-src "). Depuis le tir 8, ce sont
   ces dernieres qui portent les sources, une par import. */
function toutesLesLignes() {
  return elem("liste_corps").enfants[".ligne"] || [];
}
function lignesVisibles() {
  return toutesLesLignes().filter(function (l) { return l.style.display !== "none"; });
}
function etatEcran() {
  const vues = lignesVisibles();
  return {
    // Le bandeau parle par son AFFICHAGE et son texte. Regle du 01/10/2026 :
    // MUET (display "none") pour un succes ; ALLUME ("flex") pour une source
    // MODIFIEE et pour une action REFUSEE.
    statut: DOM.statut.style.display + " | " + DOM.statut_texte.textContent,
    note: DOM.liste_note.textContent,
    nbSel: DOM.nb_selection.textContent,
    // data-index des lignes AFFICHEES : depuis le tir 8 c'est le RANG DE LA
    // SOURCE (0..N-1), plus l'etat : deux imports = deux entrees.
    affichees: vues.map(function (l) { return l._attrs["data-index"]; }),
    nbAffichees: vues.length,
    // data-modele = quelle ligne-modele a fourni l'ICONE (0 triangle ambre =
    // source modifiee, 1 cercle rouge = chemin brise, 2 colonne vide). C'est
    // l'aiguillage d'icone, trace tel quel.
    icones: vues.map(function (l) {
      const m = l._attrs["data-modele"];
      return (m === undefined) ? l._attrs["data-index"] : m;
    }),
    nomLigne: vues.map(function (l) { return l.enfants[".col-nom"].textContent; }),
    pageLigne: vues.map(function (l) { return l.enfants[".page-num"].textContent; }),
    // Les 3 modeles : leur longueur doit rester 3 (bibliotheque d'icones).
    nbModeles: lignes.length
  };
}

/* ================================================================== */
(async function () {
  titre("OUVERTURE - l'ecran demarre VIDE, jamais sur la maquette");
  // Decision FJD du 01/10/2026 : " un panneau vide on load ", " vide puis
  // refresh onload ". Au chargement de main.js, seuls cabler() et
  // viderLaListe() s'executent : la lecture du document est DIFFEREE
  // (setTimeout, qui est un no-op dans ce harnais). L'etat d'ouverture est
  // donc observable ici, de facon synchrone et deterministe.
  verifier("aucune ligne affichee a l'ouverture", etatEcran().affichees, []);
  verifier("aucune ligne marquee selectionnee a l'ouverture",
    lignes.filter(function (l) { return String(l.className).indexOf("selection") >= 0; }).length, 0);
  verifier("compteur de selection VIDE (plus de \" 2 liens \" inventes)", DOM.nb_selection.textContent, "");
  verifier("fiche - nom VIDE", DOM.info_nom.textContent, "");
  verifier("fiche - taille VIDE", DOM.info_taille.textContent, "");
  verifier("fiche - date VIDE", DOM.info_date.textContent, "");
  verifier("fiche - chemin VIDE (plus de chemin de demonstration)", DOM.info_chemin.textContent, "");
  verifier("fiche - modele VIDE", DOM.info_modele.textContent, "");
  verifier("fiche - mots VIDE", DOM.info_mots.textContent, "");
  verifier("fiche - signes VIDE", DOM.info_signes.textContent, "");
  verifier("fiche - etat VIDE", DOM.info_etat.textContent, "");
  verifier("fiche - classe d'etat retiree (aucune couleur d'etat residuelle)", DOM.info_etat.className, "etat");
  verifier("bandeau muet a l'ouverture", DOM.statut.style.display, "none");
  // La note ne doit PAS dire " 0 source " : rien n'a encore ete MESURE, la
  // lecture est en cours. Un " 0 source " a l'ouverture serait un chiffre
  // presente comme une mesure, ce que le projet interdit.
  verifier("note : la lecture est ANNONCEE, pas mesuree", DOM.liste_note.textContent, "0 source  -  lecture du document en cours");
  verifier("les 3 lignes-modeles sont intactes (bibliotheque d'icones)", lignes.length, 3);

  titre("Fonctions pures");
  verifier("decoderEtiquettePlate - 6 champs",
    Object.keys(sandbox.decoderEtiquettePlate(
      '{"v":"1","size":"10","checksum":"abc","modified":"123","name":"a.md","path":"/x/a.md"}'))
      .sort().join(","),
    "checksum,modified,name,path,size,v");

  verifier("chaineExtendScript - echappement",
    sandbox.chaineExtendScript('a"b\\c'),
    '"a\\"b\\\\c"');

  verifier("libelleEtat(different)", sandbox.libelleEtat("different"), "modifiee");
  verifier("classeEtat(different)", sandbox.classeEtat("different"), "modifiee");
  // Aiguillage des icones CORRIGE le 01/10/2026 (defaut FJD : une icone
  // d'alerte rouge sur une source SAINE). Le cercle rouge du dessin (rang 2)
  // est l'icone du chemin d'import BRISE : c'est donc la source ABSENTE.
  // Une source identique n'a AUCUNE alerte (colonne Etat vide).
  verifier("indexLignePourEtat(different) = triangle ambre", sandbox.indexLignePourEtat("different"), 0);
  verifier("indexLignePourEtat(source_absente) = cercle ROUGE", sandbox.indexLignePourEtat("source_absente"), 1);
  verifier("indexLignePourEtat(identique) = colonne VIDE (aucune alerte)", sandbox.indexLignePourEtat("identique"), 2);
  verifier("indexLignePourEtat(etat indetermine) = colonne VIDE", sandbox.indexLignePourEtat(""), 2);
  verifier("formaterOctets(29117)", sandbox.formaterOctets(29117), "28,4 ko (29 117 octets)");
  verifier("formaterOctets(null)", sandbox.formaterOctets(null), "-");
  verifier("formaterDateCourte(0)", sandbox.formaterDateCourte(0), "(inconnue)");

  titre("IMPORT sur la MAQUETTE : refus, bandeau ALLUME (garde-fou)");
  // Depuis le 01/10/2026 la liste affichee a l'ouverture est VIDE : ce bloc ne
  // decrit donc plus l'etat d'ouverture mais reste le GARDE-FOU qui verifie
  // qu'une ligne marquee ` maquette ` (chemins de demonstration /Users/fjd/
  // Docs/...) est REFUSEE a l'import : ni chemin factice, ni silence.
  indesign.app.documents = [{}];
  indesign.app.activeDocument = { name: "Sans titre-1", extractLabel: function () { return ""; } };
  // Aucune ligne selectionnee au depart -> on l'annonce, sans rien importer.
  await sandbox.importerDepuisPanneau();
  verifier("refus sans selection : rien envoye au moteur", doScriptAppels.filter(function (s) { return s.indexOf("__M04_TUBE_IMPOSE") >= 0; }).length, 0);
  verifier("refus sans selection : bandeau ALLUME", DOM.statut_texte.textContent, "import refuse : aucune source selectionnee");
  verifier("refus sans selection : trace au journal", API.journal.join("\n").indexOf("[echec] import refuse : aucune source selectionnee") >= 0, true);
  // Ligne 0 marquee selectionnee, mais elle porte encore la marque maquette.
  lignes[0].className = "ligne selection etat-modifiee";
  lignes[0].style.display = "flex";
  doScriptAppels = [];
  await sandbox.importerDepuisPanneau();
  verifier("refus maquette : aucun chemin factice envoye au moteur", doScriptAppels.filter(function (s) { return s.indexOf("__M04_TUBE_IMPOSE") >= 0; }).length, 0);
  verifier("refus maquette : bandeau ALLUME", DOM.statut_texte.textContent, "import refuse : la liste affichee est la maquette");
  verifier("refus maquette : trace au journal", API.journal.join("\n").indexOf("la ligne affichee est encore la MAQUETTE") >= 0, true);
  // Remise a zero EXPLICITE : ` style.display = "" ` rendrait la main a la CSS
  // (regle du projet : on ecrit toujours block / none / flex). Un "" laisserait
  // la ligne comptee comme affichee et faussrait la mesure suivante.
  lignes[0].className = "ligne";
  lignes[0].style.display = "none";

  titre("OUVERTURE - \" vide PUIS refresh \" : la lecture remplit l'ecran vide");
  // La sequence demandee par FJD, exercee telle quelle : on VIDE, puis on
  // RAFRAICHIT. C'est exactement ce que fait main.js au chargement
  // (viderLaListe() puis actualiserListe() sous setTimeout 600 ms).
  miseEnPlace({ "/x/ouvert.md": "bonjour le monde" });
  etatRendu = "different";
  indesign.app.documents = [{}];
  indesign.app.activeDocument = {
    name: "ouvert.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"1","size":"16","checksum":"abc","modified":"1759300000000","name":"ouvert.md","path":"/x/ouvert.md"}';
    }
  };
  // Le vidage a deja eu lieu au chargement : rien ne doit avoir bouge depuis.
  verifier("avant le refresh : l'ecran est toujours vide", etatEcran().affichees, []);
  await API.actualiser();
  verifier("apres le refresh : la ligne 0 (triangle ambre) est servie", etatEcran().affichees, ["0"]);
  verifier("apres le refresh : l'icone est le triangle ambre (source modifiee)", etatEcran().icones, ["0"]);
  verifier("apres le refresh : la note est MESUREE, plus annoncee", etatEcran().note, "1 source  -  modifiee - 3 mot(s), 16 signe(s)");
  verifier("apres le refresh : compteur de selection", etatEcran().nbSel, "1 lien selectionne");
  verifier("apres le refresh : la fiche porte la source REELLE", DOM.info_nom.textContent, "ouvert.md");
  verifier("apres le refresh : aucun modele invente", DOM.info_modele.textContent, "-");
  // Et l'autre sens : on VIDE, on constate le vide, on relit.
  API.viderListe();
  verifier("viderListe : plus aucune ligne affichee", etatEcran().affichees, []);
  verifier("viderListe : compteur de selection vide", DOM.nb_selection.textContent, "");
  verifier("viderListe : fiche videe", DOM.info_nom.textContent, "");
  verifier("viderListe : bandeau eteint", DOM.statut.style.display, "none");
  verifier("viderListe : note d'attente posee", DOM.liste_note.textContent, "0 source  -  lecture du document en cours");
  await API.actualiser();
  verifier("refresh apres vidage : la ligne revient", etatEcran().affichees, ["0"]);

  titre("CAS 1 - aucun document ouvert : 0 ligne");
  await sandbox.assurerDossierProjet();
  indesign.app.documents = [];
  indesign.app.activeDocument = null;
  await sandbox.construireListe();
  let e = etatEcran();
  verifier("aucune ligne affichee", e.affichees, []);
  verifier("note", e.note, "0 source  -  aucun document ouvert");
  verifier("statut muet (aucun document ouvert)", e.statut, "none | ");

  titre("CAS 3 - etiquette absente : 0 ligne (controle negatif)");
  indesign.app.documents = [{}];
  indesign.app.activeDocument = { name: "vierge.indd", extractLabel: function () { return ""; } };
  await sandbox.construireListe();
  e = etatEcran();
  verifier("aucune ligne affichee", e.affichees, []);
  verifier("note", e.note, "0 source  -  document sans import - 0 ligne (normal)");
  verifier("statut muet (controle negatif)", e.statut, "none | ");

  titre("CAS 4 - etiquette presente mais illisible : 0 ligne");
  indesign.app.documents = [{}];
  indesign.app.activeDocument = { name: "bizarre.indd", extractLabel: function () { return "pas du json"; } };
  await sandbox.construireListe();
  e = etatEcran();
  verifier("aucune ligne affichee", e.affichees, []);
  verifier("note", e.note, "0 source  -  etiquette illisible - PAS un document vierge");
  // Regle du 01/10/2026 : un ECHEC parle a l'ecran (l'utilisateur doit voir
  // que le panneau a repondu) ; le detail complet reste au journal.
  verifier("statut ALLUME malgre l'echec (le detail complet est au journal)", e.statut, "flex | Etiquette presente mais illisible (voir journal)");
  verifier("l'echec EST trace au journal", API.journal.join("\n").indexOf("[echec] Etiquette presente mais illisible") >= 0, true);

  titre("CAS 5 - source differente (1 ligne), lecture disque reelle");
  miseEnPlace({ "/x/a.md": "bonjour le monde" });
  etatRendu = "different";
  indesign.app.documents = [{}];
  indesign.app.activeDocument = {
    name: "doc.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"1","size":"16","checksum":"abc","modified":"1759300000000","name":"a.md","path":"/x/a.md"}';
    }
  };
  await sandbox.construireListe();
  e = etatEcran();
  // Depuis le tir 8, data-index est le RANG DE LA SOURCE (0..N-1) et non
  // plus l'etat : avec une seule source, la ligne porte donc l'index 0. C'est
  // data-modele qui porte l'aiguillage d'icone.
  verifier("1 seule ligne affichee (rang de source 0)", e.affichees, ["0"]);
  verifier("1 seule ligne affichee (aucune autre)", e.nbAffichees, 1);
  verifier("icone : triangle ambre (source modifiee)", e.icones, ["0"]);
  verifier("les 3 lignes-modeles sont TOUJOURS la (bibliotheque intacte)", e.nbModeles, 3);
  verifier("nom ecrit dans la ligne", e.nomLigne[0], "a.md");
  verifier("page : AUCUN chiffre invente (tiret)", e.pageLigne[0], "-");
  verifier("note", e.note, "1 source  -  modifiee - 3 mot(s), 16 signe(s)");
  verifier("compteur de selection corrige", e.nbSel, "1 lien selectionne");
  verifier("statut ALLUME : triangle de danger (source modifiee)", e.statut, "flex | la source A BOUGE depuis l'import");
  verifier("fiche - nom", DOM.info_nom.textContent, "a.md");
  // Le libelle affiche est celui de LIBELLE_ETAT (main.js) : il porte un accent.
  // On l'ecrit en echappement ASCII pour garder ce fichier sans non-ASCII.
  verifier("fiche - etat", DOM.info_etat.textContent, "modifi\u00e9e");
  verifier("fiche - classe etat", DOM.info_etat.className, "etat modifiee");
  verifier("fiche - taille", DOM.info_taille.textContent, "0 ko (16 octets)");
  verifier("fiche - mots", DOM.info_mots.textContent, "3");
  verifier("fiche - signes", DOM.info_signes.textContent, "16");
  verifier("fiche - chemin", DOM.info_chemin.textContent, "/x/a.md");
  verifier("fiche - modele : AUCUNE source (orphelin)", DOM.info_modele.textContent, "-");

  titre("CAS 5 bis - source identique (1 ligne, colonne Etat VIDE : rien a signaler)");
  etatRendu = "identique";
  await sandbox.construireListe();
  e = etatEcran();
  verifier("1 ligne affichee (et non le cercle rouge : la source est SAINE)", e.affichees, ["0"]);
  verifier("icone : colonne VIDE (rien a signaler)", e.icones, ["2"]);
  verifier("statut muet (source identique : rien du tout)", e.statut, "none | ");

  titre("CAS 5 ter - source absente : cercle ROUGE, 0 chiffre invente");
  etatRendu = "source_absente";
  miseEnPlace({});
  await sandbox.construireListe();
  e = etatEcran();
  verifier("1 ligne affichee", e.affichees, ["0"]);
  verifier("icone : cercle rouge (chemin d'import brise)", e.icones, ["1"]);
  verifier("fiche - taille", DOM.info_taille.textContent, "-");
  verifier("fiche - mots", DOM.info_mots.textContent, "-");
  verifier("statut muet (source absente : rien du tout)", e.statut, "none | ");

  titre("CAS 5 quater - etat indetermine (moteur muet)");
  etatRendu = "ERREUR:m05DecideState introuvable";
  miseEnPlace({ "/x/a.md": "bonjour le monde" });
  await sandbox.construireListe();
  e = etatEcran();
  verifier("1 ligne affichee", e.affichees, ["0"]);
  verifier("icone NEUTRE (colonne vide), jamais une icone inventee", e.icones, ["2"]);  // " etat indetermine " est une INCERTITUDE, pas un etat calme : l'utilisateur
  // doit le voir (bandeau ALLUME), le detail restant au journal.
  verifier("statut ALLUME (etat indetermine : incertitude visible)", e.statut, "flex | je n'ai pas pu savoir l'etat de la source (voir le journal)");
  verifier("l'incertitude EST tracee au journal", API.journal.join("\n").indexOf("je n'ai pas pu savoir l'etat de la source") >= 0, true);

  titre("RELIER - le PREMIER import : le panneau produit un Chemin sans etiquette");
  // Blocage constate par FJD le 01/10/2026 : le panneau ne pouvait lire une
  // source que DANS l'etiquette du document, or l'etiquette nait d'un import.
  // " Relier " ouvre le selecteur natif et confie le chemin au MEME tube.
  indesign.app.documents = [{}];
  indesign.app.activeDocument = { name: "vierge.indd", extractLabel: function () { return ""; } };
  await sandbox.construireListe();
  verifier("document vierge : 0 ligne (rien a selectionner)", etatEcran().affichees, []);
  miseEnPlace({ "/x/choisi.md": "bonjour le monde" });
  fichierChoisi = { nativePath: "/x/choisi.md" };
  doScriptAppels = [];
  await API.relier();
  var tubeRelie = doScriptAppels.filter(function (s) { return s.indexOf("__M04_TUBE_IMPOSE") >= 0; })[0] || "";
  verifier("relier - chemin SANS etiquette envoye au moteur", tubeRelie.indexOf('"Chemin=/x/choisi.md"') >= 0, true);
  verifier("relier - tube identique (Appelant)", tubeRelie.indexOf('"Appelant=panneau"') >= 0, true);
  verifier("relier - tube identique (Action)", tubeRelie.indexOf('"Action=importer"') >= 0, true);
  verifier("relier - evalFile du moteur", tubeRelie.indexOf('$.evalFile(new File("/projet/import_md.jsx"))') >= 0, true);
  verifier("relier - statut MUTE (indicateur d'etat)", DOM.statut.style.display, "none");

  titre("RELIER - annulation : rien n'est envoye, rien ne s'allume");
  fichierChoisi = null;
  doScriptAppels = [];
  await API.relier();
  verifier("annulation - rien envoye au moteur", doScriptAppels.filter(function (s) { return s.indexOf("__M04_TUBE_IMPOSE") >= 0; }).length, 0);
  verifier("annulation - bandeau MUET (annuler n'est pas un echec)", DOM.statut.style.display, "none");
  verifier("annulation - tracee au journal", API.journal.join("\n").indexOf("[relier] selection annulee") >= 0, true);

  titre("RELIER - fichier choisi illisible : refus, aucune donnee inventee");
  miseEnPlace({});
  fichierChoisi = { nativePath: "/x/absent.md" };
  doScriptAppels = [];
  await API.relier();
  verifier("illisible - rien envoye au moteur", doScriptAppels.filter(function (s) { return s.indexOf("__M04_TUBE_IMPOSE") >= 0; }).length, 0);
  // Le bandeau ne montre que la PREMIERE ligne du motif : le chemin reste au journal.
  verifier("illisible - bandeau ALLUME", DOM.statut_texte.textContent, "import impossible : source introuvable");
  fichierChoisi = null;

  titre("IMPORT - tube gele (3 champs nommes)");
  // Etat APRES import : un import reussi laisse l'empreinte fraiche, donc la
  // source est SAINE (identique). On le simule ainsi : depuis le tir 7, le
  // panneau RELIT le document apres l'import, et la relecture d'une source
  // "different" rallumerait legitimement le bandeau ambre.
  etatRendu = "identique";
  miseEnPlace({ "/x/a.md": "bonjour le monde" });
  indesign.app.activeDocument = {
    name: "doc.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"1","size":"16","checksum":"abc","modified":"1759300000000","name":"a.md","path":"/x/a.md"}';
    }
  };
  await sandbox.construireListe();
  doScriptAppels = [];
  lfsAppelsUrl = [];
  await sandbox.importerDepuisPanneau();
  const tube = doScriptAppels.filter(function (s) { return s.indexOf("__M04_TUBE_IMPOSE") >= 0; })[0] || "";
  verifier("tube - Appelant", tube.indexOf('"Appelant=panneau"') >= 0, true);
  verifier("tube - Action", tube.indexOf('"Action=importer"') >= 0, true);
  verifier("tube - Chemin", tube.indexOf('"Chemin=/x/a.md"') >= 0, true);
  verifier("tube - evalFile du moteur", tube.indexOf('$.evalFile(new File("/projet/import_md.jsx"))') >= 0, true);

  titre("JOURNAL DU MOTEUR - lu par le MOTEUR (ExtendScript BINARY), jamais par UXP");
  // Defaut du 02/10/2026 : UXP lisait ce journal en UTF-8 et rendait null sur un
  // journal MacRoman -> "import envoye, mais journal moteur illisible".
  const lecturesJournal = doScriptAppels.filter(function (s) { return s.indexOf(LECTURE_JOURNAL) >= 0; });
  verifier("journal lu PAR LE MOTEUR (2 lectures : avant et apres)", lecturesJournal.length, 2);
  verifier("journal JAMAIS lu par UXP (getEntryWithUrl)",
    lfsAppelsUrl.filter(function (c) { return c.indexOf("import_md_errors.log") >= 0; }).length, 0);
  verifier("la lecture du journal est en BINARY (journal MacRoman)",
    lecturesJournal.length > 0 && lecturesJournal[0].indexOf("new File(CHEMIN)") >= 0, true);
  verifier("la source, elle, reste lue par UXP",
    lfsAppelsUrl.filter(function (c) { return c.indexOf("/x/a.md") >= 0; }).length >= 1, true);

  verifier("statut MUTE a l'import (indicateur d'etat, pas d'action)", DOM.statut.style.display, "none");
  verifier("import trace au journal", API.journal.join("\n").indexOf("[ok] import demande au moteur.") >= 0, true);

  titre("IMPORT - refus du moteur (aucun bloc actif)");
  journalMoteurAjout = "M04: REFUS - aucun bloc de texte actif";
  const doScriptOrigine = indesign.app.doScript;
  indesign.app.doScript = function (src) {
    doScriptAppels.push(src);
    if (src.indexOf("__M04_TUBE_IMPOSE") >= 0) {
      DISQUE[CHEMIN_JOURNAL] += "M04: REFUS\n";
      return "";
    }
    if (src.indexOf(LECTURE_JOURNAL) >= 0) return rendreJournal();
    return "";
  };
  await sandbox.importerDepuisPanneau();
  verifier("refus trace au journal", API.journal.join("\n").indexOf("[echec] import REFUSE") >= 0, true);
  // Regle du 01/10/2026 : le refus du moteur est une ACTION REFUSEE -> visible.
  verifier("bandeau ALLUME apres le refus du moteur", DOM.statut.style.display, "flex");
  verifier("bandeau : motif du refus", DOM.statut_texte.textContent, "import REFUSE : aucun bloc de texte n'est actif dans le document.");
  indesign.app.doScript = doScriptOrigine;

  titre("IMPORT - le moteur ne rend pas son journal : message HONNETE, rien d'invente");
  miseEnPlace({ "/x/a.md": "bonjour le monde" });
  etatRendu = "different";
  const doScriptSourd = indesign.app.doScript;
  indesign.app.doScript = function (src) {
    doScriptAppels.push(src);
    if (src.indexOf("__M04_TUBE_IMPOSE") >= 0) return "";
    if (src.indexOf(LECTURE_JOURNAL) >= 0) return undefined;  // le moteur ne repond pas
    return etatRendu;
  };
  await sandbox.construireListe();
  await sandbox.importerDepuisPanneau();
  verifier("journal non rendu - bandeau ALLUME (echec franc)", DOM.statut.style.display, "flex");
  verifier("journal non rendu - motif HONNETE, sans cause inventee",
    DOM.statut_texte.textContent, "import envoye, mais le moteur n'a pas rendu son journal");
  verifier("journal non rendu - aucune reussite annoncee",
    API.journal.join("\n").indexOf("appel PANNEAU vu : OUI") >= 0, false);
  indesign.app.doScript = doScriptSourd;

  titre("IMPORT - un nouvel import RAFRAICHIT la liste (sans clic sur Actualiser)");
  // Defaut signale par FJD le 02/10/2026 : " Un nouvel import, pas de nouvelle
  // ligne. " Le panneau relisait le document a l'ouverture, mais PAS apres
  // l'import : l'ecran gardait l'etat lu AVANT (document vierge = 0 ligne).
  indesign.app.documents = [{}];
  indesign.app.activeDocument = { name: "vierge.indd", extractLabel: function () { return ""; } };
  await sandbox.construireListe();
  verifier("avant import : 0 ligne (document sans etiquette)", etatEcran().affichees, []);
  miseEnPlace({ "/x/choisi.md": "bonjour le monde" });
  etatRendu = "identique";
  fichierChoisi = { nativePath: "/x/choisi.md" };
  doScriptAppels = [];
  const doScriptEcriture = indesign.app.doScript;
  indesign.app.doScript = function (src) {
    doScriptAppels.push(src);
    if (src.indexOf("__M04_TUBE_IMPOSE") >= 0) {
      // Le MOTEUR vient d'ECRIRE son etiquette dans le document : on simule
      // cette ecriture (import_md.jsx fait un insertLabel), pour que la
      // relecture du panneau voie un document DIFFERENT de celui d'avant.
      indesign.app.activeDocument = {
        name: "doc.indd",
        extractLabel: function (l) {
          if (l === "md-style-map") return "";
          return '{"v":"1","size":"16","checksum":"abc","modified":"1759300000000","name":"choisi.md","path":"/x/choisi.md"}';
        }
      };
      DISQUE[CHEMIN_JOURNAL] =
        (DISQUE[CHEMIN_JOURNAL] || "") +
        "M04-repartiteur: appel PANNEAU\nM04: source IMPOSEE par le PANNEAU\n";
      return "";
    }
    if (src.indexOf(LECTURE_JOURNAL) >= 0) return rendreJournal();
    return etatRendu;
  };
  await API.relier();
  const eRef = etatEcran();
  verifier("apres import : la liste est RAFRAICHIE (1 ligne, sans clic)", eRef.affichees, ["0"]);
  verifier("apres import : l'icone est la colonne vide (source saine)", eRef.icones, ["2"]);
  verifier("apres import : la ligne porte la source importee", eRef.nomLigne[0], "choisi.md");
  verifier("apres import : la fiche est garnie par la relecture", DOM.info_nom.textContent, "choisi.md");
  verifier("apres import : le bandeau reste MUET (un import est un succes)", DOM.statut.style.display, "none");
  indesign.app.doScript = doScriptEcriture;
  fichierChoisi = null;

  titre("TIR 8 - DEUX imports dans le document : DEUX lignes dans le panneau");
  // Livrable FJD du 02/10/2026 : " j'ai deux imports differents dans mon doc,
  // je dois avoir deux lignes dans mon panneau ". L'etiquette du moteur est
  // depuis le tir 8 une LISTE (v2 : champs s0./s1./..., n = nombre), et le
  // panneau doit en tirer UNE LIGNE PAR SOURCE : chacune avec SON icone et
  // SES compteurs. Le modele de donnees reste le meme (3 lignes-modeles =
  // bibliotheque d'icones, jamais affichees ; les lignes reelles sont CLONEES).
  miseEnPlace({ "/x/un.md": "bonjour le monde" });  // deux.md : ABSENT du disque
  etatRendu = "different|source_absente";
  indesign.app.documents = [{}];
  indesign.app.activeDocument = {
    name: "deux-imports.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"2","n":"2",' +
        '"s0.v":"2","s0.name":"un.md","s0.path":"/x/un.md","s0.size":"16","s0.checksum":"abc","s0.modified":"1759300000000",' +
        '"s1.v":"2","s1.name":"deux.md","s1.path":"/x/deux.md","s1.size":"16","s1.checksum":"xyz","s1.modified":"1759300000000"}';
    }
  };
  await sandbox.construireListe();
  let eDeux = etatEcran();
  verifier("DEUX lignes affichees (une par import)", eDeux.affichees, ["0", "1"]);
  verifier("DEUX lignes affichees, ni une ni trois", eDeux.nbAffichees, 2);
  verifier("icones distinctes : ambre (modifiee) puis cercle rouge (absente)", eDeux.icones, ["0", "1"]);
  verifier("nom de la 1re ligne", eDeux.nomLigne[0], "un.md");
  verifier("nom de la 2e ligne", eDeux.nomLigne[1], "deux.md");
  verifier("compteur de selection au pluriel", eDeux.nbSel, "2 liens selectionnes");
  verifier("note : repartition REELLE des etats",
    eDeux.note, "2 sources  -  1 modifiee(s), 1 absente(s), 0 identique(s)");
  // Le declencheur porte sur TOUTES les sources : une seule modifiee suffit a
  // allumer le bandeau (decision FJD du 02/10/2026).
  verifier("bandeau ALLUME : au moins une source a bouge",
    eDeux.statut, "flex | la source A BOUGE depuis l'import");
  verifier("la fiche suit la PREMIERE ligne", DOM.info_nom.textContent, "un.md");
  verifier("la fiche ne melange pas les sources (compteurs de un.md)",
    DOM.info_taille.textContent, "0 ko (16 octets)");
  verifier("les 3 lignes-modeles restent la (bibliotheque intacte)", eDeux.nbModeles, 3);

  // Le clonage ne doit pas EMPILER les lignes a chaque rafraichissement.
  await sandbox.construireListe();
  eDeux = etatEcran();
  verifier("apres un 2e rafraichissement : toujours DEUX lignes (pas d'empilement)",
    eDeux.affichees, ["0", "1"]);
  verifier("apres un 2e rafraichissement : les 3 modeles sont intacts", eDeux.nbModeles, 3);

  // Et trois imports : la regle tient au-dela de deux.
  etatRendu = "identique|identique|different";
  miseEnPlace({ "/x/un.md": "a", "/x/deux.md": "b", "/x/trois.md": "c" });
  indesign.app.activeDocument = {
    name: "trois-imports.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"2","n":"3",' +
        '"s0.v":"2","s0.name":"un.md","s0.path":"/x/un.md","s0.size":"1","s0.checksum":"a1","s0.modified":"1759300000000",' +
        '"s1.v":"2","s1.name":"deux.md","s1.path":"/x/deux.md","s1.size":"1","s1.checksum":"b1","s1.modified":"1759300000000",' +
        '"s2.v":"2","s2.name":"trois.md","s2.path":"/x/trois.md","s2.size":"1","s2.checksum":"c1","s2.modified":"1759300000000"}';
    }
  };
  await sandbox.construireListe();
  eDeux = etatEcran();
  verifier("TROIS imports : TROIS lignes", eDeux.affichees, ["0", "1", "2"]);
  verifier("TROIS icones, dans l'ordre des sources", eDeux.icones, ["2", "2", "0"]);
  verifier("compteur de selection au pluriel (3)", eDeux.nbSel, "3 liens selectionnes");
  verifier("note a trois sources", eDeux.note,
    "3 sources  -  1 modifiee(s), 0 absente(s), 2 identique(s)");

  // Retour a un document SANS import : l'ecran doit se VIDER (aucun reste).
  indesign.app.documents = [{}];
  indesign.app.activeDocument = { name: "vierge.indd", extractLabel: function () { return ""; } };
  await sandbox.construireListe();
  verifier("retour a un document sans import : l'ecran s'est VIDE", etatEcran().affichees, []);
  verifier("retour a un document sans import : 3 modeles intacts", etatEcran().nbModeles, 3);

  titre("TIR 9 - le panneau SUIT le CHANGEMENT de document actif");
  // Defaut FJD du 02/10/2026 : " lorsqu'on passe d'un doc a l'autre, le
  // panneau demeure sur l'etat precedent ". Le panneau doit RELIRE le
  // document ACTIF quand il change : ouverture, BASCULE, fermeture.
  viderMinuteurs();  // on ecarte le minuteur de demarrage (600 ms) herite du chargement

  // (a) cablage : les evenements documentaires SOURCES sont enregistres.
  verifier("4 evenements documentaires enregistres sur l'app", nomsEvenementsPoses().join(","),
    "afterOpen,afterActivate,afterClose,afterNew");
  verifier("la veille periodique est armee (filet garanti pour la bascule)", intervallesEnAttente(), 1);

  // (b) premier document : la veille cale la reference, sans aucun clic.
  miseEnPlace({ "/x/premier.md": "un deux trois mots" });
  etatRendu = "different";
  indesign.app.documents = [{}];
  indesign.app.activeDocument = {
    name: "premier.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"1","size":"16","checksum":"abc","modified":"1759300000000","name":"premier.md","path":"/x/premier.md"}';
    }
  };
  verifier("1re veille : le document est observe pour la 1re fois", API.veiller(), true);
  verifier("1re veille : un rafraichissement differe est programme", minuteursEnAttente(), 1);
  verifier("2e veille sans changement : rien de neuf", API.veiller(), false);
  verifier("2e veille : toujours un seul rafraichissement programme", minuteursEnAttente(), 1);
  declencherMinuteurs();
  await API.attendreMaj();
  verifier("le 1er document est affiche", etatEcran().nomLigne[0], "premier.md");

  // (c) BASCULE vers un AUTRE document : le coeur du defaut signale.
  miseEnPlace({ "/x/second.md": "autre texte ici" });
  indesign.app.activeDocument = {
    name: "second.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"1","size":"16","checksum":"xyz","modified":"1759300000000","name":"second.md","path":"/x/second.md"}';
    }
  };
  declencherEvenement("afterActivate");
  verifier("bascule : l'evenement programme un rafraichissement", minuteursEnAttente(), 1);
  // InDesign emet plusieurs evenements a la suite sur une bascule : ils ne
  // doivent PAS declencher N relectures.
  declencherEvenement("afterOpen");
  declencherEvenement("afterActivate");
  verifier("salve d'evenements : un seul rafraichissement pour la bascule", minuteursEnAttente(), 1);
  declencherMinuteurs();
  await API.attendreMaj();
  verifier("apres la bascule : la ligne suit SECOND.md", etatEcran().nomLigne[0], "second.md");
  verifier("apres la bascule : la fiche suit SECOND.md", DOM.info_nom.textContent, "second.md");

  // (d) la veille PERIODIQUE detecte aussi la bascule, SANS aucun evenement :
  // c'est le filet qui rend la correction insensible a un nom d'evenement.
  viderMinuteurs();
  miseEnPlace({ "/x/trois.md": "troisieme source" });
  indesign.app.activeDocument = {
    name: "troisieme.indd",
    extractLabel: function (l) {
      if (l === "md-style-map") return "";
      return '{"v":"1","size":"16","checksum":"zzz","modified":"1759300000000","name":"trois.md","path":"/x/trois.md"}';
    }
  };
  declencherIntervalles();
  verifier("veille periodique : un rafraichissement programme SANS evenement", minuteursEnAttente(), 1);
  declencherMinuteurs();
  await API.attendreMaj();
  verifier("veille periodique : le panneau suit TROISIEME.md", etatEcran().nomLigne[0], "trois.md");

  // (e) fermeture : plus de document actif -> le panneau se VIDE (etat honnete).
  viderMinuteurs();
  indesign.app.documents = [];
  indesign.app.activeDocument = null;
  declencherIntervalles();
  verifier("fermeture : le changement est vu", minuteursEnAttente(), 1);
  declencherMinuteurs();
  await API.attendreMaj();
  verifier("fermeture : plus aucune ligne affichee", etatEcran().affichees, []);

  titre("REPLI DU CALIBRAGE - l'etat est pose EN LIGNE, sans selecteur compose");
  // Ferme au depart : le bloc est masque, le chevron ferme est visible.
  verifier("etat initial - bloc masque", DOM.calibrage.style.display, undefined);
  verifier("etat initial - chevron ferme (barre)", DOM.btn_expand_ferme.style.display, undefined);
  verifier("etat initial - chevron ouvert (barre) masque", DOM.btn_expand_ouvert.style.display, undefined);

  DOM.zone_infos.scrollHeight = 192;  // contenu deplie mesure sur la reference
  sandbox.basculerCalibrage();  // 1er clic : deplier
  verifier("deplie - bloc affiche", DOM.calibrage.style.display, "flex");
  verifier("deplie - chevron ferme (barre) masque", DOM.btn_expand_ferme.style.display, "none");
  verifier("deplie - chevron ouvert (barre) affiche EN LIGNE (block)", DOM.btn_expand_ouvert.style.display, "block");
  verifier("deplie - chevron ferme (ligne) masque", DOM.icone_calibrage.style.display, "none");
  verifier("deplie - chevron ouvert (ligne) affiche EN LIGNE (block)", DOM.icone_calibrage_ouvert.style.display, "block");
  verifier("deplie - classe posee (compat DOM)", DOM.ligne_calibrage._classes.deplie, true);
  verifier("deplie - classe posee sur le bouton", DOM.btn_expand._classes.deplie, true);
  verifier("deplie - bloc ouvert cadre en bas (il est sous la ligne de flottaison)", DOM.zone_infos.scrollTop, 192);
  verifier("deplie - trace au journal", API.journal.join("\n").indexOf("[calibrage] deplie") >= 0, true);

  DOM.zone_infos.scrollTop = 29;  // le depliage avait fait defiler la fiche
  sandbox.basculerCalibrage();  // 2e clic : replier
  verifier("replie - bloc masque (TOUT l'ensemble referme)", DOM.calibrage.style.display, "none");
  verifier("replie - chevron ferme (barre) affiche EN LIGNE (block)", DOM.btn_expand_ferme.style.display, "block");
  verifier("replie - chevron ouvert (barre) masque", DOM.btn_expand_ouvert.style.display, "none");
  verifier("replie - chevron ferme (ligne) affiche EN LIGNE (block)", DOM.icone_calibrage.style.display, "block");
  verifier("replie - chevron ouvert (ligne) masque", DOM.icone_calibrage_ouvert.style.display, "none");
  verifier("replie - classe retiree (ligne)", DOM.ligne_calibrage._classes.deplie, undefined);
  verifier("replie - defilement remis en haut", DOM.zone_infos.scrollTop, 0);
  verifier("replie - trace au journal", API.journal.join("\n").indexOf("[calibrage] replie") >= 0, true);

  sandbox.basculerCalibrage();  // 3e clic : NE PAS rester bloque (regression signalee)
  verifier("reouvert - bloc affiche DE NOUVEAU (pas de blocage)", DOM.calibrage.style.display, "flex");
  verifier("reouvert - chevron ouvert (barre) affiche EN LIGNE (block)", DOM.btn_expand_ouvert.style.display, "block");
  verifier("reouvert - chevron ferme (barre) masque", DOM.btn_expand_ferme.style.display, "none");
  sandbox.basculerCalibrage();  // 4e clic : refermer a nouveau
  verifier("referme - bloc masque (cycle stable)", DOM.calibrage.style.display, "none");
  verifier("referme - chevron ouvert (barre) masque", DOM.btn_expand_ouvert.style.display, "none");

  // CONTROLE DE NON-REGRESSION de la cause elle-meme : aucun des quatre
  // traces ne doit jamais rester a "" (valeur vide = la CSS decide, et elle
  // masque `.act-ouvert` / `.cal-ouvert` : c'est le bug corrige).
  const TRACES = ["btn_expand_ferme", "btn_expand_ouvert", "icone_calibrage", "icone_calibrage_ouvert"];
  let indecis = [];
  TRACES.forEach(function (t) {
    const v = DOM[t].style.display;
    if (v !== "none" && v !== "block") indecis.push(t + "=" + JSON.stringify(v));
  });
  verifier("regression - AUCUN trace laisse a \"\" (valeur qui rend la main a la CSS)", indecis.join(","), "");
  const montres = TRACES.filter(function (t) { return DOM[t].style.display === "block"; });
  verifier("referme - exactement 2 traces montres (un par paire), ni 0 ni 4", montres.length, 2);
  verifier("referme - les 2 montres sont les chevrons FERMES",
    DOM.btn_expand_ferme.style.display === "block" && DOM.icone_calibrage.style.display === "block", true);

  console.log("\n" + (echecs === 0 ? "TOUT PASSE" : echecs + " ECHEC(S)") + "  (" + total + " verifications)");
  process.exit(echecs === 0 ? 0 : 1);
})();

// verifier_empreinte.js
// BATTERIE DU MOTEUR - etiquette "md-source-fingerprint" v2 (LISTE de sources).
//
// POURQUOI CE FICHIER (tir 8, 02/10/2026) :
//   La batterie du panneau (uxp/.../verifier_moteur.js) stube app.doScript :
//   elle verifie que le PANNEAU affiche N lignes, mais elle n'execute JAMAIS
//   le moteur. Or tout le tir 8 repose sur le format d'etiquette v2 ecrit et
//   relu par import_md.jsx. Ce fichier ferme ce trou : il charge le VRAI
//   import_md.jsx (tronque juste avant son code de haut niveau) dans un bac a
//   sable Node avec des stubs ExtendScript MINIMAUX, puis appelle les
//   fonctions reelles de l'etiquette.
//
// CE QUI EST VERIFIE ICI (et rien d'autre) :
//   - l'aller-retour du serialiseur plat (aucun JSON n'existe en ExtendScript) ;
//   - le format v2 ({"v":"2","n":"N","s0.*":...}) et sa relecture ;
//   - la RETROCOMPATIBILITE v1 (etiquette mono-source lue comme liste a 1) ;
//   - l'UPSERT : reimport du MEME chemin = mise a jour, PAS une 2e ligne ;
//   - la borne M05_MAX_SOURCES ;
//   - m05DecideStateList : un etat par source, dans l'ordre de la liste.
//
// Usage : node verifier_empreinte.js
// Aucun fichier du projet n'est modifie : tout se passe en memoire.

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CHEMIN_JSX = path.join(__dirname, "import_md.jsx");
const MARQUEUR_FIN = 'if (typeof importMdRegisterMenuEntry !== "undefined") {';

let total = 0;
let echecs = 0;

function titre(t) {
  console.log("\n=== " + t + " ===");
}

function verifier(nom, obtenu, attendu) {
  total++;
  const a = JSON.stringify(obtenu);
  const b = JSON.stringify(attendu);
  if (a === b) {
    console.log("  OK    " + nom + "  ->  " + a);
  } else {
    echecs++;
    console.log("  ECHEC " + nom + "\n          attendu : " + b + "\n          obtenu  : " + a);
  }
}

// ---------------------------------------------------------------------------
// STUBS EXTENDSCRIPT - le minimum vital pour EVALUER le fichier (aucun import
// n'est simule ici : seules les fonctions d'etiquette sont appelees).
// ---------------------------------------------------------------------------

// Disque en memoire : chemin absolu -> contenu texte.
const DISQUE = {};
function miseEnPlace(fichiers) {
  Object.keys(DISQUE).forEach((k) => delete DISQUE[k]);
  Object.keys(fichiers).forEach((k) => {
    DISQUE[k] = fichiers[k];
  });
}

const DATE_FIXE = new Date(1759300000000);

function FileStub(chemin) {
  this.fsName = String(chemin);
  const slash = this.fsName.lastIndexOf("/");
  this.name = slash >= 0 ? this.fsName.slice(slash + 1) : this.fsName;
  this.parent = { fsName: slash >= 0 ? this.fsName.slice(0, slash) : "/" };
  this.exists = Object.prototype.hasOwnProperty.call(DISQUE, this.fsName);
  this.modified = DATE_FIXE;
  this._ouvert = false;
}
FileStub.prototype.open = function () {
  this._ouvert = true;
  return true;
};
FileStub.prototype.read = function () {
  if (!this.exists) throw new Error("lecture impossible : " + this.fsName);
  return DISQUE[this.fsName];
};
FileStub.prototype.close = function () {
  this._ouvert = false;
  return true;
};

// Document actif : les labels vivent dans une table.
const LABELS = {};
const appStub = {
  activeDocument: null,
  documents: [],
};

function documentStub(nom) {
  return {
    name: nom || "doc.indd",
    extractLabel: function (cle) {
      return Object.prototype.hasOwnProperty.call(LABELS, cle) ? LABELS[cle] : "";
    },
    insertLabel: function (cle, valeur) {
      LABELS[cle] = String(valeur);
    },
  };
}

// ---------------------------------------------------------------------------
// CHARGEMENT DU VRAI MOTEUR (tronque avant son code de haut niveau).
// ---------------------------------------------------------------------------

const source = fs.readFileSync(CHEMIN_JSX, "utf8");
const coupe = source.indexOf(MARQUEUR_FIN);
if (coupe < 0) {
  console.log("ECHEC FATAL : marqueur de fin introuvable dans import_md.jsx");
  process.exit(1);
}
const corps = source.slice(0, coupe);

const journal = [];
const sandbox = {
  File: FileStub,
  $: { fileName: "/projet/import_md.jsx", global: {} },
  app: appStub,
  console: { log: function () {} },
  JSON: { stringify: JSON.stringify, parse: JSON.parse },
  Math: Math,
  String: String,
  Number: Number,
  Object: Object,
  Array: Array,
  Date: Date,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isFinite: isFinite,
  isNaN: isNaN,
  RegExp: RegExp,
  Error: Error,
  alert: function () {},
  confirm: function () { return false; },
  // Redefinis plus bas par le moteur : on les capture pour prouver qu'aucun
  // avertissement n'a ete declenche pendant les tests d'etiquette.
  logToFile: function (m) { journal.push(String(m)); },
  logError: function (e, ou) { journal.push("ERREUR " + ou + " : " + (e && e.message)); },
  alertUser: function (m) { journal.push("ALERTE " + m); },
};
sandbox.global = sandbox;
sandbox.$.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(corps, sandbox, { filename: "import_md.jsx (tronque)" });

// Le moteur DECLARE ses propres logToFile/logError/alertUser : leurs
// declarations remplacent nos stubs places avant l'evaluation. On les
// remplace A NOUVEAU, apres coup, pour capturer le journal reel du moteur
// (les fonctions du moteur resolvent ces noms au moment de l'APPEL, donc
// elles verront bien nos version capturantes).
sandbox.logToFile = function (m) { journal.push(String(m)); };
sandbox.logError = function (e, ou) { journal.push("ERREUR " + ou + " : " + (e && e.message)); };
sandbox.alertUser = function (m) { journal.push("ALERTE " + m); };

const M = sandbox;

// ---------------------------------------------------------------------------
// CAS 1 - aller-retour du serialiseur plat (aucun JSON en ExtendScript).
// ---------------------------------------------------------------------------

titre("SERIALISEUR PLAT - echappement des guillemets et antislashs");
const plat = M.serializeFlatMapping({ a: 'gui"llemets', b: "C:\\Docs\\x.md", c: "" });
verifier("guillemet echappe", plat.indexOf('\\"') >= 0, true);
verifier("antislash echappe", plat.indexOf("\\\\") >= 0, true);
const relu = M.deserializeFlatMapping(plat);
verifier("aller-retour fidele", relu, { a: 'gui"llemets', b: "C:\\Docs\\x.md" });
// COMPORTEMENT MESURE du serialiseur : toute valeur FALSY ("", null, undefined)
// n'est PAS ecrite. Relue, elle est simplement absente : les lecteurs la
// reconstituent avec "|| \"\"". Ce n'est pas une perte : un champ vide et un
// champ absent sont indistinguables dans le format plat, et c'est SANS EFFET
// sur les empreintes (un chemin vide rend une source ignoree, cf. controles negatifs).
verifier("valeur vide NON serialisee (falsy omis, comportement mesure)", relu.c, undefined);

// ---------------------------------------------------------------------------
// CAS 2 - format v2 : {"v":"2","n":"N","s0.*":...}
// ---------------------------------------------------------------------------

titre("ETIQUETTE v2 - format de la LISTE");
const deux = [
  { v: "2", name: "un.md", path: "/x/un.md", size: "16", checksum: "abc", modified: "1759300000000" },
  { v: "2", name: "deux.md", path: "/x/deux.md", size: "9", checksum: "xyz", modified: "1759300000001" },
];
const brut2 = M.m05SerializeFingerprintList(deux);
verifier("version v2 annoncee", brut2.indexOf('"v":"2"') >= 0, true);
verifier("compteur n = 2", brut2.indexOf('"n":"2"') >= 0, true);
verifier("clefs plates prefixees s0. et s1.", brut2.indexOf('"s0.path"') >= 0 && brut2.indexOf('"s1.path"') >= 0, true);
verifier("aucun TABLEAU (aucun crochet carre)", brut2.indexOf("[") < 0, true);
verifier("un seul niveau : une seule accolade ouvrante", brut2.split("{").length - 1, 1);
verifier("2e source presente dans le texte", brut2.indexOf('"s1.name":"deux.md"') >= 0, true);

const liste2 = M.m05ParseFingerprintList(brut2);
verifier("relecture : 2 sources", liste2.length, 2);
verifier("relecture : ordre conserve (la 1re reste la 1re)", liste2[0].path, "/x/un.md");
verifier("relecture : champs complets de la 1re", liste2[0], deux[0]);
verifier("relecture : champs complets de la 2e", liste2[1], deux[1]);

// ---------------------------------------------------------------------------
// CAS 3 - RETROCOMPATIBILITE : une etiquette v1 reste lisible (1 source).
// ---------------------------------------------------------------------------

titre("RETROCOMPATIBILITE - etiquette v1 mono-source");
const brut1 = M.serializeFlatMapping({
  v: "1", name: "ancien.md", path: "/x/ancien.md", size: "42", checksum: "vieux", modified: "1759300000000",
});
const liste1 = M.m05ParseFingerprintList(brut1);
verifier("v1 relue comme une liste a 1 element", liste1.length, 1);
verifier("v1 : chemin conserve", liste1[0].path, "/x/ancien.md");
verifier("v1 : la version stockee est conservee telle quelle", liste1[0].v, "1");
verifier("m05ParseFingerprint (mono) rend la 1re de la liste", M.m05ParseFingerprint(brut1).path, "/x/ancien.md");

// ---------------------------------------------------------------------------
// CAS 4 - CONTROLES NEGATIFS : jamais de source inventee.
// ---------------------------------------------------------------------------

titre("CONTROLES NEGATIFS - rien a lire => aucune source");
verifier("etiquette absente : liste vide", M.m05ParseFingerprintList(""), []);
verifier("etiquette absente : m05ParseFingerprint rend null", M.m05ParseFingerprint(""), null);
verifier("texte quelconque : liste vide", M.m05ParseFingerprintList("pas du json du tout"), []);
verifier("objet sans version : liste vide", M.m05ParseFingerprintList(M.serializeFlatMapping({ path: "/x/a.md" })), []);
verifier("compteur n = 0 : liste vide", M.m05ParseFingerprintList(M.serializeFlatMapping({ v: "2", n: "0" })), []);
verifier("compteur n illisible : liste vide", M.m05ParseFingerprintList(M.serializeFlatMapping({ v: "2", n: "beaucoup" })), []);
verifier(
  "n = 3 mais une source sans chemin : la ligne vide est IGNOREE (2 seulement)",
  M.m05ParseFingerprintList(M.serializeFlatMapping({
    v: "2", n: "3",
    "s0.path": "/x/a.md", "s1.path": "", "s2.path": "/x/c.md",
  })).length,
  2
);

// ---------------------------------------------------------------------------
// CAS 5 - BORNE HAUTE : M05_MAX_SOURCES (l'etiquette reste courte, relue integrale).
// ---------------------------------------------------------------------------

titre("BORNE HAUTE - M05_MAX_SOURCES = " + M.M05_MAX_SOURCES);
verifier("la borne vaut 12", M.M05_MAX_SOURCES, 12);
const grosObj = { v: "2", n: "99" };
for (let i = 0; i < 99; i++) grosObj["s" + i + ".path"] = "/x/" + i + ".md";
verifier("n = 99 : lecture BORNEE a 12 (jamais 99)", M.m05ParseFingerprintList(M.serializeFlatMapping(grosObj)).length, 12);

// ---------------------------------------------------------------------------
// CAS 6 - m05DecideStateList : UN ETAT PAR SOURCE, dans l'ordre de la liste.
// ---------------------------------------------------------------------------

titre("ETATS PAR SOURCE - un etat par entree, dans l'ordre");
miseEnPlace({
  "/x/un.md": "bonjour le monde",   // 16 octets : identique a l'empreinte stockee
  "/x/deux.md": "autre chose",      // empreinte stockee fausse : differente
});
const fpIdentique = M.m05BuildFingerprint(new FileStub("/x/un.md"));
verifier("empreinte de reference construite", fpIdentique.checksum.length > 0, true);
const fpFaux = { v: "2", name: "deux.md", path: "/x/deux.md", size: "1", checksum: "jamais-vu", modified: "" };
const etiquette3 = M.m05SerializeFingerprintList([
  fpIdentique, fpFaux, { v: "2", name: "trois.md", path: "/x/trois.md", size: "1", checksum: "c", modified: "" },
]);
verifier("3 etats, separes par |", M.m05DecideStateList(etiquette3), "identique|different|source_absente");
verifier("etiquette vide : aucun etat", M.m05DecideStateList(""), "");
verifier("1 seule source : 1 seul etat", M.m05DecideStateList(M.m05SerializeFingerprintList([fpIdentique])), "identique");

// ---------------------------------------------------------------------------
// CAS 7 - UPSERT (le coeur du tir 8) : N imports => N entree, jamais de doublon.
// ---------------------------------------------------------------------------

titre("UPSERT - reimport du meme chemin : MISE A JOUR, pas une 2e ligne");
journal.length = 0;
miseEnPlace({ "/x/un.md": "bonjour le monde", "/x/deux.md": "autre chose" });
LABELS["md-source-fingerprint"] = "";
appStub.activeDocument = documentStub("doc.indd");

verifier("1er import : ecriture reussie", M.saveSourceFingerprint(new FileStub("/x/un.md")), true);
verifier("1er import : 1 source en memoire", M.m05ParseFingerprintList(LABELS["md-source-fingerprint"]).length, 1);

// 2e import d'un AUTRE fichier : la liste s'ALLONGE (c'est le livrable FJD).
verifier("2e import (autre fichier) : ecriture reussie", M.saveSourceFingerprint(new FileStub("/x/deux.md")), true);
let apres = M.m05ParseFingerprintList(LABELS["md-source-fingerprint"]);
verifier("2 imports differents : 2 sources en memoire", apres.length, 2);
verifier("le plus recent est en tete (unshift)", apres[0].path, "/x/deux.md");
verifier("l'ancien est conserve", apres[1].path, "/x/un.md");

// Reimport du MEME fichier : upsert, la liste ne doit PAS grandir.
verifier("reimport du meme fichier : ecriture reussie", M.saveSourceFingerprint(new FileStub("/x/un.md")), true);
apres = M.m05ParseFingerprintList(LABELS["md-source-fingerprint"]);
verifier("reimport du meme chemin : TOUJOURS 2 sources (aucun doublon)", apres.length, 2);
// COMPORTEMENT MESURE : l'UPSERT remplace l'entree A SA PLACE, l'ordre est
// STABLE (un reimport ne fait pas remonter la ligne en tete). C'est voulu : la
// liste garde l'ordre des imports, le panneau ne se reordonne pas sous les yeux
// de l'utilisateur entre deux rafraichissements.
verifier("reimport : l'ordre est STABLE (la ligne ne saute pas en tete)", apres[0].path, "/x/deux.md");
verifier("reimport : l'entree mise a jour reste a sa place", apres[1].path, "/x/un.md");
verifier("reimport : l'autre source est intacte", apres[0].path, "/x/deux.md");

// Le journal du moteur doit dire AJOUT puis MISE A JOUR (preuve lisible).
const traces = journal.filter((l) => l.indexOf("sources en memoire") >= 0);
verifier("le journal distingue AJOUT et MISE A JOUR",
  traces.map((l) => (l.indexOf("(mise a jour)") >= 0 ? "maj" : "ajout")), ["ajout", "ajout", "maj"]);
verifier("aucune ALERTE pendant les ecritures d'etiquette",
  journal.filter((l) => l.indexOf("ALERTE") === 0).length, 0);
verifier("aucune ERREUR pendant les ecritures d'etiquette",
  journal.filter((l) => l.indexOf("ERREUR") === 0).length, 0);

// ---------------------------------------------------------------------------
// CAS 8 - MIGRATION DOUCE : une etiquette v1 survit au 1er import en v2.
// ---------------------------------------------------------------------------

titre("MIGRATION DOUCE - document deja importe (v1) puis nouvel import");
LABELS["md-source-fingerprint"] = brut1; // etiquette v1 : /x/ancien.md
miseEnPlace({ "/x/ancien.md": "contenu ancien", "/x/neuf.md": "contenu neuf" });
M.saveSourceFingerprint(new FileStub("/x/neuf.md"));
const apresMigr = M.m05ParseFingerprintList(LABELS["md-source-fingerprint"]);
verifier("la source v1 n'est PAS perdue", apresMigr.length, 2);
verifier("la nouvelle source est en tete", apresMigr[0].path, "/x/neuf.md");
verifier("la source heritee est conservee", apresMigr[1].path, "/x/ancien.md");
verifier("l'etiquette reecrite est bien en v2", LABELS["md-source-fingerprint"].indexOf('"v":"2"') >= 0, true);

// ---------------------------------------------------------------------------
// CAS 9 - BORNE A L'ECRITURE : on n'empile jamais plus de 12 sources.
// ---------------------------------------------------------------------------

titre("BORNE A L'ECRITURE - jamais plus de 12 sources memorisees");
LABELS["md-source-fingerprint"] = "";
const disque12 = {};
for (let i = 0; i < 15; i++) {
  disque12["/x/s" + i + ".md"] = "contenu " + i;
  DISQUE["/x/s" + i + ".md"] = disque12["/x/s" + i + ".md"];
}
for (let i = 0; i < 15; i++) M.saveSourceFingerprint(new FileStub("/x/s" + i + ".md"));
const liste12 = M.m05ParseFingerprintList(LABELS["md-source-fingerprint"]);
verifier("15 imports : la memoire est bornee a 12", liste12.length, 12);
verifier("les 3 plus anciens sont evinces (le plus recent est en tete)", liste12[0].path, "/x/s14.md");

// ---------------------------------------------------------------------------
// BILAN
// ---------------------------------------------------------------------------

console.log("\n" + (echecs === 0 ? "TOUT PASSE" : echecs + " ECHEC(S)") + "  (" + total + " verifications)");
process.exit(echecs === 0 ? 0 : 1);

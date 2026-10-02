// Panneau  Liens MD  - habillage pixel + MOTEUR REEL (01/10/2026).
//
// Le contrat d'identifiants reprend celui du panneau de terrain
// (com.fjd.importmd.sonde), qui est la REFERENCE GELEE : #statut,
// #liste_corps, #liste_note, #journal, et les boutons d'action. Le moteur
// (lecture d'etiquette, etat tranche par import_md.jsx, compteurs disque,
// tube d'import) est porte depuis cette sonde - cf. la section " MOTEUR REEL ".
//
// CE QUI EST ENCORE LA MAQUETTE, ET POURQUOI :
//  - la table SOURCES garde les 3 sources de reference du dessin
//    d'Illustrator, mais elle n'est PLUS l'etat affiche : DECISION FJD du
//    01/10/2026 - " un panneau vide on load ", " vide puis refresh onload ".
//    L'ecran s'ouvre VIDE (viderLaListe ci-dessous) puis se remplit avec la
//    lecture du document reel (actualiserListe, differee de 600 ms). Les
//    valeurs de SOURCES servent d'etiquettes de demonstration aux tests et au
//    dessin : elles ne sont jamais affichees telles quelles.
//  - le moteur ne peut rendre QU'UNE source par document : l'etiquette du
//    document (md-source-fingerprint) est MONO-SOURCE aujourd'hui. Les 3
//    lignes du dessin supposent l'etiquette-LISTE de la Mission 6, qui
//    n'existe pas encore.
//  - l'etiquette porte EXACTEMENT six champs (v, size, checksum, modified,
//    name, path) : ni " page " ni " modele ". Ces deux colonnes n'ont donc
//    AUCUNE source et restent des orphelins declares (cf. CR de la Mission 6).

/* ------------------------------------------------------------------ */
/* Jeu de donnees de demonstration                                     */
/* ------------------------------------------------------------------ */
const SOURCES = [
  {
    // MAQUETTE = true : ces trois lignes sont le DESSIN d'ouverture, pas des
    // sources reelles. " Importer " REFUSE toute ligne qui porte cette marque
    // (cf. importerDepuisPanneau) : on n'importe jamais un chemin de
    // demonstration. Le premier " Actualiser " ecrit la source reelle et
    // efface donc cette marque.
    maquette: true,
    nom: "charte_gemini_formation.md",
    etat: "modifiee",
    page: 12,
    taille: "28,4 ko (29 117 octets)",
    mots: "1 842",
    signes: "12 903",
    date: "mercredi 1 octobre 2026 09:14",
    // Le chemin de la reference est deja tronque par un point de suspension :
    // on garde la meme chaine pour que le rendu tombe au meme pixel.
    chemin: "/Users/fjd/Docs/charte_gemini_…",
    modele: "Gemini 2.5 Pro"
  },
  {
    maquette: true,
    nom: "referentiel_deepseek.md",
    etat: "identique",
    page: 4,
    taille: "11,2 ko (11 470 octets)",
    mots: "730",
    signes: "5 108",
    date: "lundi 29 septembre 2026 17:02",
    chemin: "/Users/fjd/Docs/referentiel_deepseek.md",
    modele: "DeepSeek V3"
  },
  {
    maquette: true,
    nom: "mission_03_minimal.md",
    etat: "absente",
    page: 31,
    taille: "-",
    mots: "-",
    signes: "-",
    date: "-",
    chemin: "/Users/fjd/Docs/mission_03_minimal.md",
    modele: "-"
  }
];

const LIBELLE_ETAT = {
  identique: "identique",
  modifiee: "modifiée",
  absente: "source absente"
};

/* ------------------------------------------------------------------ */
/* Petits utilitaires                                                  */
/* ------------------------------------------------------------------ */
function el(id) {
  return document.getElementById(id);
}

function journaliser(ligne) {
  // On alimente d'abord le journal COMPLET (celui qui part dans le fichier) :
  // ` dire ` reecrit l'ecran depuis son propre index, donc une ligne qui ne
  // serait que posee dans le DOM serait effacee au ` dire ` suivant.
  journal.push(ligne);
  const zone = el("journal");
  if (zone) zone.textContent = ligne + "\n" + zone.textContent;
}

// Etat ouvert/ferme du bloc Calibrage.
// On tient un booleen explicite : la regle CSS `#calibrage { display: none }`
// n'est PAS lisible via element.style (seul le style en ligne l'est), donc
// sonder style.display renverrait toujours faux au premier clic.
let calibrageOuvert = false;

/* ------------------------------------------------------------------ */
/* Zone 4 - ligne expandable  Calibrage                              */
/*   Pas de widget accordeon natif : bloc masque + chevron qui pivote.  */
/* ------------------------------------------------------------------ */
function basculerCalibrage() {
  const bloc = el("calibrage");
  const rangee = el("ligne_calibrage");
  if (!bloc) return;

  calibrageOuvert = !calibrageOuvert;
  bloc.style.display = calibrageOuvert ? "flex" : "none";

  // Le chevron est pilote par la classe `deplie` posee sur la ligne :
  // deux traces SVG superposes (le chevron d'origine, a plat, puis LE MEME
  // trace tourne de 90 degres horaire), la CSS affiche l'un ou l'autre. On ne
  // touche plus a l'attribut `name` de #icone_calibrage.
  if (rangee) {
    if (calibrageOuvert) rangee.classList.add("deplie");
    else rangee.classList.remove("deplie");
  }

  // Le chevron de la barre d'actions est le MEME expander, vu depuis la zone
  // Informations : il pilote ce meme bloc et doit donc afficher le meme etat.
  const bouton = el("btn_expand");
  if (bouton) {
    if (calibrageOuvert) bouton.classList.add("deplie");
    else bouton.classList.remove("deplie");
  }

  // Les bascules CSS ci-dessus reposent sur des selecteurs COMPOSES
  // (`#btn_expand.deplie .act-ferme`, `#ligne_calibrage.deplie .cal-ouvert`)
  // qui, comme `.ligne.selection` avant eux, ne sont PAS certifies dans le
  // runtime UXP : c'est la cause du chevron qui restait bloque sur son etat.
  // On pose donc l'etat EN LIGNE sur chacun des quatre traces : le style en
  // ligne prime et ne depend d'aucun selecteur compose. Les regles a
  // selecteur compose ont ete RETIREES de index.html : elles ne sont plus
  // qu'un piege (voir le commentaire qui les remplace). La classe `deplie`
  // reste posee pour la compatibilite du DOM, mais elle ne decide plus rien.
  afficherTrace("btn_expand_ferme", !calibrageOuvert);
  afficherTrace("btn_expand_ouvert", calibrageOuvert);
  afficherTrace("icone_calibrage", !calibrageOuvert);
  afficherTrace("icone_calibrage_ouvert", calibrageOuvert);

  // #zone_infos a une hauteur FIGEE (163 px) pour un contenu de 192 px quand
  // le calibrage est deplie : le bloc ouvert est le DERNIER de la zone, donc
  // sous la ligne de flottaison. Sans cadrage, l'ouverture "ne fait rien" a
  // l'ecran alors que le bloc est bien affiche ; et sans remise a zero a la
  // fermeture on continuait de voir les lignes mots/signes. On cadre donc
  // les DEUX sens explicitement.
  const zi = el("zone_infos");
  if (zi) zi.scrollTop = calibrageOuvert ? zi.scrollHeight : 0;

  journaliser(calibrageOuvert ? "[calibrage] deplie" : "[calibrage] replie");
  // journaliser() n'ecrit que dans le tableau + a l'ecran ; la vidange du
  // fichier est programmee separement. On la force ici pour que la bascule
  // soit tracable APRES coup : c'est la seule preuve lisible par FJD
  // (PluginData/panneau_liens_md_journal.txt), et donc le seul moyen de
  // distinguer "le clic n'arrive pas" de "le clic arrive mais l'ecran ne
  // bouge pas".
  programmerEcritureJournal();
}

/* Affiche ou masque un trace SVG par son id. L'affichage est TOUJOURS pose
   explicitement : `none` pour masquer, `block` pour montrer.
   POURQUOI PAS `""` : vider le style en ligne ne rend pas "le defaut de
   l'element", cela REND LA MAIN A LA FEUILLE DE STYLE. Or la CSS porte
   `.act-ouvert { display: none }` et `.cal-ouvert { display: none }` ; seuls
   des selecteurs COMPOSES (`#btn_expand.deplie .act-ouvert`) rallumaient ces
   traces, et ces selecteurs ne sont PAS certifies dans le runtime UXP.
   Consequence mesuree (navigateur, cascade pure, donc independante de l'hote) :
     ferme                                   -> ouvert: none / ferme: block
     apres style.display = ""                -> ouvert: none
     ouvert AVEC la classe .deplie           -> ouvert: flex   (Chromium seul)
     ouvert SANS  la classe .deplie (= UXP)  -> ouvert: none !!
   Autrement dit, a l'ouverture le chevron ferme passait a `none` (en ligne)
   et le chevron ouvert restait a `none` (CSS) : PLUS AUCUN chevron, ce qui se
   lit a l'ecran comme "le repli ne marche pas".
   `block` est exactement le display CALCULE du trace en etat ferme (les deux
   svg sont des items flex, donc deja blockifies) : le rendu ferme reste celui,
   deja valide, de la reference au pixel. */
function afficherTrace(id, visible) {
  const trace = el(id);
  if (!trace) return;
  trace.style.display = visible ? "block" : "none";
}

/* ------------------------------------------------------------------ */
/* Zone 2 -> zone 4 - selection d'une ligne remplissant la fiche        */
/* ------------------------------------------------------------------ */
function selectionner(ligne) {
  // Les lignes de la liste sont des div .ligne (plus des lignes de tableau) :
  // le rang se lit donc sur l'attribut data-index de la ligne cliquee.
  const rang = parseInt(ligne.getAttribute("data-index"), 10);
  const s = SOURCES[rang];
  if (!s) return;

  const corps = el("liste_corps");
  if (corps) {
    // On ne vide plus className : la classe `ligne` porte la mise en page
    // (flex, hauteur 24 px) et la classe etat-* porte l'icone de la colonne
    // Etat. On retire donc uniquement l'etat `selection`.
    const lignes = corps.querySelectorAll(".ligne");
    for (let i = 0; i < lignes.length; i++) {
      const src = SOURCES[parseInt(lignes[i].getAttribute("data-index"), 10)];
      lignes[i].className = classeDeLigne(lignes[i], src ? src.etat : "identique", false);
    }
  }
  ligne.className = classeDeLigne(ligne, s.etat, true);

  el("info_nom").textContent = s.nom;
  el("info_etat").textContent = LIBELLE_ETAT[s.etat] || s.etat;
  el("info_etat").className = "etat " + s.etat;
  el("info_taille").textContent = s.taille;
  el("info_mots").textContent = s.mots;
  el("info_signes").textContent = s.signes;
  el("info_date").textContent = s.date;
  el("info_chemin").textContent = s.chemin;
  el("info_modele").textContent = s.modele;

  journaliser("[selection] " + s.nom);
}

/* ------------------------------------------------------------------ */
/* Zone 2 - tri par ordre de page                                      */
/* ------------------------------------------------------------------ */
let triPage = false;

function trierParPage() {
  const corps = el("liste_corps");
  if (!corps) return;

  const lignes = Array.prototype.slice.call(corps.querySelectorAll(".ligne"));
  lignes.sort(function (a, b) {
    const pa = parseInt(a.getAttribute("data-page"), 10) || 0;
    const pb = parseInt(b.getAttribute("data-page"), 10) || 0;
    return triPage ? pb - pa : pa - pb;
  });

  triPage = !triPage;
  for (let i = 0; i < lignes.length; i++) corps.appendChild(lignes[i]);
  journaliser("[tri] par ordre de page " + (triPage ? "decroissant" : "croissant"));
}

/* ================================================================== */
/* MOTEUR REEL - porte depuis la sonde com.fjd.importmd.sonde          */
/*                                                                     */
/* Adaptation 1 : la sonde batissait un <table> (tr/td) ; l'ecran du    */
/* panneau est fait de div .ligne. On ne FABRIQUE pas de noeud SVG       */
/* (l'API de creation SVG n'est pas certifiee dans ce runtime - la sonde */
/* evite deja innerHTML) : on AFFICHE la ligne-modele qui porte l'icone  */
/* de l'etat (index 0 = triangle ambre " modifiee ", index 1 = point      */
/* blanc " identique ", index 2 = colonne Etat vide " absente ").        */
/*                                                                     */
/* Adaptation 2 : le panneau n'a PAS de champ " chemin " (choix de la    */
/* maquette). Le dossier du projet est donc DEDUIT de l'emplacement du   */
/* panneau, comme le fait deja la sonde.                                 */
/*                                                                     */
/* Regle du projet respectee : le panneau PROPOSE, le moteur TRANCHE.    */
/* L'etat est calcule par m05DecideState() DANS import_md.jsx ; le       */
/* panneau ne recalcule JAMAIS la somme de controle.                     */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/* Dossier du projet - deduit, jamais ecrit en dur                     */
/* ------------------------------------------------------------------ */
let dossierProjetDevine = null;

function dossierProjet() {
  return dossierProjetDevine || "";
}

function cheminMoteur() {
  return dossierProjet() + "/import_md.jsx";
}

/* Le plugin vit dans <projet>/uxp/com.fjd.importmd.panneau : deux parents
   au-dessus = le dossier du projet. Aucun chemin personnel n'est ecrit dans
   le source (portabilite preservee) : on le DEDUIT a l'execution. */
async function devinerDossierProjet() {
  try {
    const uxp2 = require("uxp");
    const lfs = (uxp2 && uxp2.storage) ? uxp2.storage.localFileSystem : null;
    if (!lfs || typeof lfs.getPluginFolder !== "function") return false;

    const dossier = await lfs.getPluginFolder();
    if (!dossier || typeof dossier.nativePath !== "string") return false;

    let chemin = dossier.nativePath.replace(/\/+$/, "");
    for (let i = 0; i < 2; i++) {
      const j = chemin.lastIndexOf("/");
      if (j <= 0) return false;
      chemin = chemin.substring(0, j);
    }
    if (chemin.charAt(0) !== "/") return false;

    dossierProjetDevine = chemin;
    dire("dossier du projet deduit de l'emplacement du panneau :");
    dire("      " + chemin);
    return true;
  } catch (e) {
    dire("dossier du projet non deduit (" + messageDe(e) + ") -> import impossible.");
    return false;
  }
}

/* La deduction est un aller-retour asynchrone : le demarrage la lance sans
   l'attendre. Une action qui en depend l'EXIGE donc explicitement, sinon un
   clic tres tot apres l'ouverture trouverait un dossier vide. */
let deductionEnCours = null;

async function assurerDossierProjet() {
  if (dossierProjet()) return true;
  if (!deductionEnCours) deductionEnCours = devinerDossierProjet();
  await deductionEnCours;
  deductionEnCours = null;
  return !!dossierProjet();
}

/* ------------------------------------------------------------------ */
/* Journal du moteur (le meme canal que la sonde : #journal)            */
/* ------------------------------------------------------------------ */
const journal = [];

/* Index de depart de l'AFFICHAGE. Le tableau " journal " reste ENTIER (c'est
   lui qui part sur le disque, donc la preuve est preservee), l'ecran ne
   montrant que les lignes a partir d'ici : un clic = un ecran propre. */
let debutAffichage = 0;

function purgerEcranJournal() {
  debutAffichage = journal.length;
  const zone = el("journal");
  if (zone) zone.textContent = "";
}

function messageDe(e) {
  if (!e) return "erreur inconnue (valeur falsy)";
  if (typeof e === "string") return e;
  if (e.message) return e.message;
  try {
    return JSON.stringify(e);
  } catch (_) {
    return String(e);
  }
}

function dire(ligne) {
  journal.push(ligne);
  const zone = el("journal");
  if (zone) {
    zone.textContent = journal.slice(debutAffichage).join("\n");
    zone.scrollTop = zone.scrollHeight;
  }
  programmerEcritureJournal();
  console.log("[panneau-liens-md] " + ligne);
}

function ok(nom, valeur) {
  dire("OK    " + nom + "  ->  " + valeur);
}

function ko(nom, e) {
  dire("ECHEC " + nom + "  ->  " + messageDe(e));
}

/* ------------------------------------------------------------------ */
/* Etiquette du document - les DEUX routes mesurees par la sonde        */
/* ------------------------------------------------------------------ */
/* Le format relu est celui ecrit par serializeFlatMapping (import_md.jsx) :
   {"cle":"valeur",...} avec echappement de \\ et \" seulement. */
const LABEL_SOURCE_FP = "md-source-fingerprint";
const LABEL_STYLE_MAP = "md-style-map";
/* Borne haute du nombre de sources memorisees, IDENTIQUE au moteur
   (import_md.jsx, M05_MAX_SOURCES). L'etiquette reste courte. */
const M05_MAX_SOURCES = 12;

function decoderEtiquettePlate(str) {
  const obj = {};
  if (!str) return obj;
  const contenu = String(str).replace(/^\s*\{/, "").replace(/\}\s*$/, "");
  if (contenu.replace(/\s/g, "") === "") return obj;
  const re = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(contenu)) !== null) {
    const clef = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const val = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    obj[clef] = val;
  }
  return obj;
}

/* La LISTE des sources portee par l'etiquette v2 (02/10/2026).
   Le moteur serialise des PAIRES PLATES "s<i>.cle":"valeur" (ExtendScript
   n'a pas de JSON) : on les regroupe ici en objets.
   RETROCOMPATIBLE : un label v1 (mono-source, 6 champs a la racine, sans
   compteur "n") est rendu comme une liste a UN element. Aucune source => []. */
function decoderEtiquetteListe(str) {
  const obj = decoderEtiquettePlate(str);
  if (!obj || !obj.v) return [];
  if (!obj.n) {
    if (!obj.path) return [];
    return [{ v: obj.v, nom: obj.name || "", chemin: obj.path,
              taille: obj.size || "", checksum: obj.checksum || "" }];
  }
  const total = parseInt(obj.n, 10);
  if (!isFinite(total) || total <= 0) return [];
  const borne = total > M05_MAX_SOURCES ? M05_MAX_SOURCES : total;
  const liste = [];
  for (let i = 0; i < borne; i++) {
    const p = "s" + i + ".";
    const src = {
      v: obj[p + "v"] || obj.v,
      nom: obj[p + "name"] || "",
      chemin: obj[p + "path"] || "",
      taille: obj[p + "size"] || "",
      checksum: obj[p + "checksum"] || ""
    };
    if (src.chemin) liste.push(src);
  }
  return liste;
}

let inDesignModule = null;

function moduleInDesign() {
  if (inDesignModule) return inDesignModule;
  try {
    inDesignModule = require("indesign");
  } catch (e) {
    ko("require('indesign')", e);
    inDesignModule = null;
  }
  return inDesignModule;
}

/* Route 1 = DOM UXP direct (doc.extractLabel), route 2 = repli ExtendScript
   via app.doScript. On journalise LAQUELLE a repondu. */
async function lireEtiquetteDocument(doc) {
  const resultat = { brut: null, route: "aucune", erreur: null };

  if (typeof doc.extractLabel === "function") {
    try {
      resultat.brut = doc.extractLabel(LABEL_SOURCE_FP);
      resultat.route = "DOM UXP doc.extractLabel()";
      return resultat;
    } catch (e1) {
      resultat.erreur = e1;
      ko("DOM UXP doc.extractLabel", e1);
    }
  } else {
    dire("      doc.extractLabel : ABSENT du DOM UXP -> repli app.doScript");
  }

  try {
    const ind = moduleInDesign();
    if (!ind || typeof ind.app.doScript !== "function") {
      dire("      repli impossible : app.doScript indisponible");
      return resultat;
    }
    const sl = ind.ScriptLanguage;
    const lang = sl ? sl.JAVASCRIPT : undefined;
    const src =
      'var d = app.activeDocument; ' +
      'd ? String(d.extractLabel("' + LABEL_SOURCE_FP + '")) : "";';
    resultat.brut = String(ind.app.doScript(src, lang));
    resultat.route = "app.doScript (ExtendScript) - repli";
    resultat.erreur = null;
  } catch (e2) {
    resultat.erreur = e2;
    ko("repli app.doScript extractLabel", e2);
  }

  return resultat;
}

function lireMapBrute(doc) {
  try {
    if (typeof doc.extractLabel === "function") {
      const v = doc.extractLabel(LABEL_STYLE_MAP);
      return v && String(v).length > 0 ? String(v) : null;
    }
  } catch (eMap) {
    ko("lecture " + LABEL_STYLE_MAP, eMap);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Etats - vocabulaire du moteur -> vocabulaire de l'ecran              */
/* ------------------------------------------------------------------ */
function libelleEtat(etat) {
  if (etat === "identique") return "identique";
  if (etat === "different") return "modifiee";
  if (etat === "source_absente") return "absente";
  if (etat === "jamais_importe") return "jamais importe";
  return "(" + etat + ")";
}

/* La REPONSE EN CLAIR, telle qu'elle doit s'afficher dans le bandeau : une
   PHRASE, pas un code d'etat interne. */
function phraseEtat(etat) {
  if (etat === "identique") return "la source n'a pas bouge depuis l'import";
  if (etat === "different") return "la source A BOUGE depuis l'import";
  if (etat === "source_absente") return "la source n'est PLUS LA (renommee, deplacee ou supprimee)";
  if (etat === "jamais_importe") return "ce document n'a jamais recu d'import MD";
  return "etat rendu par le moteur : " + libelleEtat(etat);
}

/* L'etat du moteur (4 valeurs) -> la classe CSS de la ligne (3 valeurs).
   " jamais importe " n'a PAS de ligne : c'est le controle negatif (0 ligne). */
function classeEtat(etat) {
  if (etat === "identique") return "identique";
  if (etat === "different") return "modifiee";
  if (etat === "source_absente") return "absente";
  return "";
}

/* Indice de la ligne-modele qui porte l'icone de l'etat demande.
   On n'invente aucune icone : on choisit celle que le dessin a deja posee.
   CORRIGE le 01/10/2026 - defaut constate par FJD : " la ligne apparait avec
   une icone d'alerte rouge " sur une source SAINE. Cause : l'ancien tableau
   envoyait l'etat " identique " sur la ligne qui porte le CERCLE ROUGE.
   Or FJD a defini ce cercle (CR tir 2, arbitrage du 01/10) : il " indique un
   chemin d'import brise a reimporter " - c'est donc l'icone de la source
   ABSENTE, pas d'une source saine. Une source identique n'a AUCUNE alerte
   (colonne Etat vide : il n'y a rien a signaler).
   L'habillage pixel ne bouge pas : on change SEULEMENT l'aiguillage. */
function indexLignePourEtat(etat) {
  if (etat === "different") return 0;      // triangle ambre = source MODIFIEE
  if (etat === "source_absente") return 1; // cercle rouge = chemin BRISE
  // " identique " (rien a signaler) et etat indetermine (aucune icone
  // inventee) partagent la ligne a colonne Etat VIDE.
  return 2;
}

/* ------------------------------------------------------------------ */
/* Petits formateurs                                                   */
/* ------------------------------------------------------------------ */
/* Date courte JJ/MM/AAAA HH:MM, sans jamais afficher " Invalid Date ". */
function formaterDateCourte(ms) {
  const n = Number(ms);
  if (!isFinite(n) || n <= 0) return "(inconnue)";
  const d = new Date(n);
  const p2 = (v) => (v < 10 ? "0" + v : String(v));
  return p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() +
    " " + p2(d.getHours()) + ":" + p2(d.getMinutes());
}

/* Taille lisibles, au format de la reference : " 28,4 ko (29 117 octets) ".
   Aucun chiffre n'est invente : la valeur vient de la lecture disque, et une
   valeur absente (null/undefined/vide) rend un tiret, jamais " 0 ". */
function formaterOctets(octets) {
  if (octets === null || octets === undefined || octets === "") return "-";
  const n = Number(octets);
  if (!isFinite(n) || n < 0) return "-";
  const ko = String(Math.round((n / 1024) * 10) / 10).replace(".", ",");
  const milliers = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return ko + " ko (" + milliers + " octets)";
}

/* Enveloppe une chaine dans un litteral ExtendScript, en echarpant ce qui
   casserait la source (antislash, guillemet, retours ligne). */
function chaineExtendScript(s) {
  const t = String(s === null || s === undefined ? "" : s);
  return '"' + t
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n") + '"';
}

/* ------------------------------------------------------------------ */
/* L'ETAT, decide par le MOTEUR (parade : copie sans " main(); ")       */
/* La copie est ecrite dans le dossier du moteur (indispensable : il     */
/* resout son journal via $.fileName) puis supprimee aussitot.          */
/* ------------------------------------------------------------------ */
/* La source ExtendScript est FACTORISEE : on n'y change que le NOM de la
   fonction du moteur appelee (m05DecideState pour UNE source,
   m05DecideStateList pour la LISTE). Une seule source = un seul endroit
   ou la parade " copie sans main(); " est ecrite. */
function sourceMoteur(nomFonction, argumentsAppel) {
  return 'var CHEMIN = ' + chaineExtendScript(cheminMoteur()) + ';\n' +
    'var resultat = "(non calcule)";\n' +
    'try {\n' +
    '  if (typeof ' + nomFonction + ' !== "function") {\n' +
    '    var PARENT = new File(CHEMIN).parent.fsName;\n' +
    '    var f = new File(CHEMIN); f.encoding = "UTF-8"; f.open("r");\n' +
    '    var txt = f.read(); f.close();\n' +
    '    var idx = txt.lastIndexOf("\\nmain();");\n' +
    '    if (idx < 0) { resultat = "ABANDON:main();introuvable"; }\n' +
    '    else {\n' +
    '      var tmp = new File(PARENT + "/_panneau_moteur_sans_main.jsx");\n' +
    '      tmp.encoding = "UTF-8"; tmp.open("w");\n' +
    '      tmp.write(txt.substring(0, idx) + "\\n"); tmp.close();\n' +
    '      $.evalFile(tmp); tmp.remove();\n' +
    '    }\n' +
    '  }\n' +
    '  if (typeof ' + nomFonction + ' === "function") {\n' +
    '    resultat = String(' + nomFonction + '(' + argumentsAppel + '));\n' +
    '  }\n' +
    '} catch (e) { resultat = "ERREUR:" + e.message; }\n' +
    'resultat;';
}

/* Les ETATS de TOUTES les sources memorisees, DANS L'ORDRE, tels que le
   moteur les rend (une etiquette v2 = N sources = N etats separes par "|").
   C'est ce qui permet a l'ecran d'afficher UNE LIGNE PAR SOURCE. */
async function etatsParLeMoteur(brut) {
  const ind = moduleInDesign();
  if (!ind || typeof ind.app.doScript !== "function") {
    return { etats: null, erreur: "app.doScript indisponible" };
  }
  const sl = ind.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;
  const src = sourceMoteur("m05DecideStateList", chaineExtendScript(brut));

  try {
    const texte = String(ind.app.doScript(src, lang));
    return { etats: texte.split("|"), erreur: null, brut: texte };
  } catch (e) {
    return { etats: null, erreur: e };
  }
}

/* ------------------------------------------------------------------ */
/* Les CARACTERISTIQUES : lecture disque REELLE. Une lecture ratee rend  */
/* une erreur, JAMAIS des compteurs inventes ni zero.                    */
/* ------------------------------------------------------------------ */
async function caracteristiquesDisque(chemin) {
  const res = { mots: null, signes: null, dateMs: null, erreur: null };
  try {
    const uxp2 = require("uxp");
    const lfs = (uxp2 && uxp2.storage) ? uxp2.storage.localFileSystem : null;
    if (!lfs) { res.erreur = "uxp.storage.localFileSystem absent"; return res; }

    const entree = await lfs.getEntryWithUrl("file://" + chemin);
    let contenu = await entree.read();
    if (typeof contenu !== "string") contenu = String(contenu);
    res.signes = contenu.length;
    res.mots = contenu.split(/\s+/).filter((m) => m.length > 0).length;

    if (typeof entree.getMetadata === "function") {
      const meta = await entree.getMetadata();
      if (meta && meta.dateModified !== undefined && meta.dateModified !== null) {
        res.dateMs = new Date(meta.dateModified).getTime();
      }
    }
    if (res.dateMs === null) {
      const fs2 = require("fs");
      if (typeof fs2.lstat === "function") {
        const st = await fs2.lstat("file://" + chemin);
        if (st && st.mtime !== undefined && st.mtime !== null) {
          res.dateMs = new Date(st.mtime).getTime();
        }
      }
    }
  } catch (e) {
    res.erreur = e;
  }
  return res;
}

/* ------------------------------------------------------------------ */
/* Affichage de la liste (lignes-modeles revelees / masquees)          */
/* ------------------------------------------------------------------ */
function lignesListe() {
  const corps = el("liste_corps");
  if (!corps) return [];
  return Array.prototype.slice.call(corps.querySelectorAll(".ligne"));
}

function masquerToutesLesLignes() {
  const lignes = lignesListe();
  for (let i = 0; i < lignes.length; i++) {
    lignes[i].style.display = "none";
    // On retire AUSSI l'etat " selection " : sinon une ligne masquee restait
    // " selectionnee " en memoire, et " Importer " lisait une source
    // invisible (defaut constate le 01/10/2026 : import du chemin-maquette
    // apres un Actualiser sur un document sans import MD).
    lignes[i].className = String(lignes[i].className)
      .replace(/\bselection\b/g, "")
      .replace(/\s+/g, " ")
      .replace(/^ | $/g, "");
  }
  // Les lignes REELLES sont non seulement masquees mais RETIREES : une ligne
  // masquee resterait dans le document avec l'icone d'un etat devenu faux.
  // Les 3 lignes-modeles, elles, sont la bibliotheque d'icones : conservees.
  retirerLignesSources();
}

/* Compte les lignes REELLEMENT affichees (pour la note de bas de tableau). */
function compterLignesListe() {
  const lignes = lignesListe();
  let n = 0;
  for (let i = 0; i < lignes.length; i++) {
    if (lignes[i].style.display !== "none") n++;
  }
  return n;
}

function majNoteListe(nb, detail) {
  const note = el("liste_note");
  if (!note) return;
  // Le pluriel est REELLEMENT accorde : " 2 source " etait faux des qu'un
  // document portait deux imports. " 0 source " et " 1 source " sont
  // inchanges (la note de l'ecran vide reste identique au pixel).
  const mot = (nb > 1) ? "sources" : "source";
  note.textContent = nb + " " + mot + "  -  " + detail;
}

/* L'ECRAN VIDE - decision FJD du 01/10/2026 : " un panneau vide on load "
   (" vide puis refresh onload "). Le panneau ne doit JAMAIS s'ouvrir sur le
   DESSIN qui a servi a produire la maquette : ce serait annoncer une source,
   des compteurs et une date qui n'existent dans AUCUN document.
   On vide donc tout ce qui PORTE une donnee - lignes, compteur de selection,
   fiche d'informations, bandeau - AVANT la lecture du document.
   On ne touche a AUCUN trace (icones) : l'habillage pixel (Mission 5) reste
   intact. Les icones sont choisies par POSITION dans la liste (cf.
   indexLignePourEtat) et non par la classe etat-* de la ligne. */
function viderLaListe() {
  // Masque ET retire les lignes reelles ; les 3 lignes-modeles restent.
  masquerToutesLesLignes();

  const nb = el("nb_selection");
  if (nb) nb.textContent = "";

  const champs = ["info_nom", "info_etat", "info_taille", "info_mots",
    "info_signes", "info_date", "info_chemin", "info_modele"];
  for (let i = 0; i < champs.length; i++) {
    const c = el(champs[i]);
    if (c) c.textContent = "";
  }
  // La classe d'etat de la fiche disparait aussi : il ne reste QUE la classe
  // de mise en page, aucun etat (une couleur d'etat residuelle serait un
  // mensonge sur un ecran vide).
  const etatFiche = el("info_etat");
  if (etatFiche) etatFiche.className = "etat";

  masquerStatut();
  // Tant que la lecture n'a pas rendu son verdict, on l'ANNONCE : une note
  // vide se lirait comme une mesure (" 0 source "), or rien n'est encore lu.
  majNoteListe(0, "lecture du document en cours");
}

/* Reconstruit la classe d'une ligne SANS perdre sa marque " ligne-src ".
   Cette marque distingue les lignes REELLES des 3 lignes-modeles (la
   bibliotheque d'icones) : la confondre ferait retirer les MODELES au
   rafraichissement suivant, et viderait la bibliotheque. */
function classeDeLigne(ligne, etat, selectionnee) {
  return "ligne" +
    (String(ligne.className).indexOf("ligne-src") >= 0 ? " ligne-src" : "") +
    (selectionnee ? " selection" : "") +
    " etat-" + etat;
}

/* Les lignes REELLES (une par source), hors lignes-modeles. */
function lignesSources() {
  const corps = el("liste_corps");
  if (!corps) return [];
  return Array.prototype.slice.call(corps.querySelectorAll(".ligne-src"));
}

/* Retire les lignes d'une lecture precedente. Les masquer ne suffirait pas :
   elles resteraient dans le document avec l'icone d'un etat devenu faux, et
   s'accumuleraient a chaque Actualiser. Les 3 lignes-modeles, elles, ne sont
   JAMAIS retirees (ce sont les seules icones du dessin). */
function retirerLignesSources() {
  const anciennes = lignesSources();
  for (let i = 0; i < anciennes.length; i++) {
    const parent = anciennes[i].parentNode;
    if (parent && typeof parent.removeChild === "function") parent.removeChild(anciennes[i]);
  }
}

/* Affiche N sources : UNE LIGNE PAR SOURCE.
   Les 3 lignes-modeles de index.html ne sont jamais affichees : elles sont la
   BIBLIOTHEQUE D'ICONES. Pour chaque source on CLONE la ligne-modele qui
   porte l'icone de SON etat (aucune icone inventee), on l'habille, on
   l'ajoute. Le clone porte data-index = rang de la SOURCE (0..N-1), qui est
   ce que lisent selectionner() et sourceSelectionnee(), et data-modele = la
   ligne-modele utilisee (0 triangle ambre, 1 cercle rouge, 2 colonne vide). */
function afficherLignesSources(sources) {
  const corps = el("liste_corps");
  if (!corps) return [];

  // On repart de zero : aucune ligne d'une lecture precedente.
  retirerLignesSources();
  const modeles = lignesListe();
  // La bibliotheque d'icones ne s'affiche jamais.
  for (let i = 0; i < modeles.length; i++) modeles[i].style.display = "none";

  const rendues = [];
  for (let i = 0; i < sources.length; i++) {
    const modele = modeles[sources[i].icone];
    if (!modele || typeof modele.cloneNode !== "function") continue;
    const ligne = modele.cloneNode(true);
    // UNE classe nouvelle et SIMPLE : un selecteur compose
    // " .ligne.selection " n'est pas certifie dans ce runtime. On garde
    // " ligne " : c'est elle qui porte la mise en page du dessin.
    ligne.className = "ligne ligne-src";
    ligne.setAttribute("data-index", String(i));
    ligne.setAttribute("data-modele", String(sources[i].icone));
    ligne.setAttribute("data-page", sources[i].page === "-" ? "" : String(sources[i].page));
    const nom = ligne.querySelector(".col-nom");
    if (nom) nom.textContent = sources[i].nom;
    const num = ligne.querySelector(".page-num");
    if (num) num.textContent = sources[i].page;
    ligne.style.display = "flex";
    corps.appendChild(ligne);
    SOURCES[i] = sources[i];
    rendues.push(ligne);
  }
  dire("      => " + rendues.length + " ligne(s) affichee(s) pour "
    + sources.length + " source(s) memorisee(s).");
  return rendues;
}

/* La source affichee dans la fiche (la ligne qui porte la classe selection).
   On balaie les lignes et on teste la CLASSE : c'est le seul vocabulaire
   verifie dans ce runtime (querySelector/querySelectorAll sur une classe
   simple). Un selecteur compose " .ligne.selection " n'est pas certifie. */
function sourceSelectionnee() {
  const lignes = lignesListe();
  for (let i = 0; i < lignes.length; i++) {
    // Une ligne MASQUEE n'est pas une source : " importer le fichier " ne
    // doit jamais viser une ligne que l'utilisateur ne voit pas.
    if (lignes[i].style.display === "none") continue;
    if (String(lignes[i].className).indexOf("selection") >= 0) {
      const rang = parseInt(lignes[i].getAttribute("data-index"), 10);
      return SOURCES[rang] || null;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Bandeau d'etat — DECISION FJD (01/10/2026).                          */
/* UN SEUL cas parle a l'ecran : la source MODIFIEE, signalee par le     */
/* TRIANGLE DE DANGER (le trace ambre du dessin, repris tel quel). Dans   */
/* TOUS les autres cas le bandeau est MUET : le message part au JOURNAL,  */
/* qui est le canal de debug et rien d'autre. Ce n'est donc plus un       */
/* bandeau succes/echec.                                                  */
/* ------------------------------------------------------------------ */
function afficherStatut(estOk, texte) {
  // Le JOURNAL garde TOUJOURS la trace complete (canal de debug).
  journaliser((estOk ? "[ok] " : "[echec] ") + String(texte).split("\n")[0]);
  // Ecran : un ECHEC PARLE enfin (defaut constate le 01/10/2026 : un import
  // refuse ne laissait AUCUNE trace visible, l'utilisateur croyait que le
  // bouton ne repondait pas). Un SUCCES reste MUET : le bandeau n'est pas un
  // tapis de confirmations, il ne s'allume que s'il y a quelque chose a dire
  // (source MODIFIEE, ou action REFUSEE). Le motif tient sur UNE ligne ; le
  // detail multi-lignes reste au journal.
  if (estOk) return;
  const bandeau = el("statut");
  if (!bandeau) return;
  const t = el("statut_texte");
  if (t) t.textContent = String(texte).split("\n")[0];
  bandeau.style.display = "flex";
}

/* L'UNIQUE cas ou le bandeau parle : la source a bouge depuis l'import.
   Le triangle de danger est deja dans le DOM (index.html) : on ne pose ici
   que le texte et l'allumage, jamais un selecteur compose (non certifie). */
function afficherDanger(texte) {
  const bandeau = el("statut");
  if (!bandeau) return;
  const t = el("statut_texte");
  if (t) t.textContent = texte;
  bandeau.style.display = "flex";
}

/* Bandeau muet : ni triangle, ni texte. */
function masquerStatut() {
  const bandeau = el("statut");
  if (!bandeau) return;
  const t = el("statut_texte");
  if (t) t.textContent = "";
  bandeau.style.display = "none";
}

/* ------------------------------------------------------------------ */
/* Sortie du journal vers un FICHIER (pas de presse-papier UXP, et un    */
/* panneau ne laisse pas selectionner son texte).                        */
/* ------------------------------------------------------------------ */
const NOM_FICHIER_JOURNAL = "panneau_liens_md_journal.txt";
let dossierJournal = null;
let cheminJournal = "(non determine)";
let minuteurEcriture = null;

function journalTexte() {
  return journal.join("\n");
}

async function resoudreDossierJournal() {
  if (dossierJournal) return dossierJournal;
  const uxp2 = require("uxp");
  const lfs = (uxp2 && uxp2.storage) ? uxp2.storage.localFileSystem : null;
  if (!lfs) throw new Error("uxp.storage.localFileSystem absent");
  try {
    dossierJournal = await lfs.getDataFolder();
  } catch (eData) {
    dossierJournal = await lfs.getTemporaryFolder();
  }
  if (!dossierJournal) throw new Error("aucun dossier accessible pour ecrire le journal");
  return dossierJournal;
}

async function ecrireJournalFichier(silencieux) {
  try {
    const dossier = await resoudreDossierJournal();
    const fichier = await dossier.createFile(NOM_FICHIER_JOURNAL, { overwrite: true });
    await fichier.write(journalTexte(), { append: false });
    cheminJournal = fichier.nativePath || cheminJournal;
    // Le bandeau n'est mis a jour que sur une ACTION EXPLICITE : l'ecriture
    // automatique ne doit jamais remplacer le resultat d'une mesure (defaut
    // corrige dans la sonde le 30/09).
    if (!silencieux) {
      afficherStatut(true, "journal enregistre :\n" + cheminJournal);
      ok("journal ecrit dans un fichier", cheminJournal);
    }
    return true;
  } catch (e) {
    afficherStatut(false, "ecriture du journal : " + messageDe(e));
    if (!silencieux) ko("ecriture du journal dans un fichier", e);
    return false;
  }
}

function programmerEcritureJournal() {
  if (minuteurEcriture) return;
  minuteurEcriture = setTimeout(function () {
    minuteurEcriture = null;
    ecrireJournalFichier(true);
  }, 400);
}

/* ------------------------------------------------------------------ */
/* Lecture d'un fichier texte par la voie UXP.                         */
/* ------------------------------------------------------------------ */
async function lireFichierTexte(chemin) {
  try {
    const uxp2 = require("uxp");
    const lfs = (uxp2 && uxp2.storage) ? uxp2.storage.localFileSystem : null;
    if (!lfs) return null;
    const entree = await lfs.getEntryWithUrl("file://" + chemin);
    if (!entree || !entree.isFile) return null;
    const t = await entree.read();
    return (typeof t === "string") ? t : String(t);
  } catch (e) {
    return null;
  }
}

/* Lecture du JOURNAL DU MOTEUR : par le moteur, jamais par UXP.

   Mesure du 02/10/2026 (defaut signale par FJD : "import envoye, mais
   journal moteur illisible"). Le journal est ecrit par logToFile()
   (import_md.jsx, ligne 348) SANS encoding explicite, donc en MacRoman
   sur macOS : un "e accent aigu" y est l'octet 0x8E, invalide en UTF-8.
   UXP lit en UTF-8 et ECHOUE sur ce fichier : getEntryWithUrl + read()
   rendent null. Or le MEME helper lit sans aucun probleme la source .md
   (UTF-8 valide) situee dans le MEME dossier : ce n'etait donc pas un
   probleme de chemin, mais d'encodage.

   La sonde (com.fjd.importmd.sonde, main.js L348-360) lit ce meme journal
   DANS ExtendScript, en "BINARY" : route deja eprouvee. On la reprend a
   l'identique. Le differentiel avant/apres reste octet a octet, et les
   marqueurs juges ("M04: REFUS", "M04: source IMPOSEE par le PANNEAU",
   "M04-repartiteur: appel PANNEAU") sont purs ASCII.

   Renvoie le texte du journal, ou null si le moteur n'a pas repondu. */
async function lireJournalParLeMoteur(chemin) {
  const ind = moduleInDesign();
  if (!ind || typeof ind.app.doScript !== "function") return null;
  const sl = ind.ScriptLanguage;
  const src =
    'var CHEMIN = ' + chaineExtendScript(chemin) + ';\n' +
    'var texte = "";\n' +
    'var j = new File(CHEMIN);\n' +
    'if (j.exists) {\n' +
    '  j.encoding = "BINARY";\n' +
    '  if (j.open("r")) { texte = j.read(); j.close(); }\n' +
    '}\n' +
    'texte;';
  try {
    const t = ind.app.doScript(src, sl ? sl.JAVASCRIPT : undefined);
    return (typeof t === "string") ? t : null;
  } catch (e) {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* LA LISTE - le meme calcul pour l'ouverture et pour " Actualiser ".   */
/* Cinq cas SEPARES, comme dans la sonde : aucun document / lecture      */
/* ratee / etiquette absente / etiquette illisible / N sources a lister. */
/* Une source memorisee = une ligne : deux imports = deux lignes.        */
/* Le cas " etiquette absente " est le CONTROLE NEGATIF : 0 ligne,       */
/* jamais une ligne vide.                                                */
/* ------------------------------------------------------------------ */
async function construireListe() {
  dire("");
  dire("--- la liste des sources ---");
  dire("lecture seule : rien n'est ecrit dans le document.");
  await assurerDossierProjet();
  // On repart d'un bandeau MUET : seul le cas "source modifiee" le rallume.
  masquerStatut();

  const ind = moduleInDesign();
  if (!ind) {
    masquerToutesLesLignes();
    majNoteListe(0, "module indesign indisponible");
    afficherStatut(false, "Liste impossible : require('indesign') a echoue");
    return;
  }
  const app = ind.app;

  let nbDocs = 0;
  try {
    nbDocs = app.documents.length;
  } catch (eDoc) {
    ko("app.documents.length", eDoc);
    masquerToutesLesLignes();
    majNoteListe(0, "nombre de documents illisible");
    afficherStatut(false, "Liste impossible : app.documents illisible");
    return;
  }

  // CAS 1 - aucun document ouvert : 0 ligne (ce n'est pas une lecture ratee).
  if (nbDocs === 0) {
    masquerToutesLesLignes();
    dire("CAS AUCUN DOCUMENT OUVERT -> 0 ligne.");
    majNoteListe(0, "aucun document ouvert");
    afficherStatut(true, "aucun document ouvert dans InDesign - il n'y a rien a regarder");
    return;
  }

  let doc = null;
  try {
    doc = app.activeDocument;
  } catch (eAct) {
    ko("app.activeDocument", eAct);
    masquerToutesLesLignes();
    majNoteListe(0, "document actif illisible");
    afficherStatut(false, "Liste impossible : app.activeDocument illisible");
    return;
  }
  dire("document actif : " + doc.name);

  const lu = await lireEtiquetteDocument(doc);
  dire("route utilisee pour l'etiquette : " + lu.route);

  // CAS 2 - lecture ratee : erreur reelle, jamais un document vierge.
  if (lu.route === "aucune" && lu.erreur) {
    masquerToutesLesLignes();
    dire("CAS LECTURE RATEE : aucune route n'a pu lire l'etiquette.");
    majNoteListe(0, "lecture ratee - PAS un document vierge");
    afficherStatut(false, "Lecture de l'etiquette ratee (voir journal)");
    return;
  }

  const brut = (lu.brut === null || lu.brut === undefined) ? "" : String(lu.brut);
  dire("longueur de l'etiquette brute : " + brut.length + " caractere(s)");

  // CAS 3 - etiquette absente : CONTROLE NEGATIF = 0 ligne.
  if (brut === "") {
    masquerToutesLesLignes();
    dire("CAS ETIQUETTE ABSENTE : document sans import MD -> 0 ligne.");
    majNoteListe(0, "document sans import - 0 ligne (normal)");
    afficherStatut(true, "ce document n'a jamais recu d'import MD - il n'y a rien a regarder");
    return;
  }

  const fp = decoderEtiquettePlate(brut);

  // CAS 4 - etiquette presente mais illisible : ni vierge, ni lisible.
  if (!fp.v) {
    masquerToutesLesLignes();
    dire("CAS ETIQUETTE PRESENTE mais ILLISIBLE -> 0 ligne.");
    dire("brut (tronque a 200) : " + brut.substring(0, 200));
    majNoteListe(0, "etiquette illisible - PAS un document vierge");
    afficherStatut(false, "Etiquette presente mais illisible (voir journal)");
    return;
  }

  // CAS 5 - les sources a lister : UNE PAR IMPORT, dans l'ordre du moteur.
  const listeSources = decoderEtiquetteListe(brut);
  if (listeSources.length === 0) {
    masquerToutesLesLignes();
    dire("CAS ETIQUETTE PRESENTE mais SANS SOURCE -> 0 ligne.");
    majNoteListe(0, "etiquette presente mais sans source - PAS un document vierge");
    afficherStatut(false, "Etiquette presente mais sans source (voir journal)");
    return;
  }
  dire("sources memorisees dans l'etiquette : " + listeSources.length);
  for (let i = 0; i < listeSources.length; i++) {
    dire("  source[" + i + "] : " + (listeSources[i].nom || "(sans nom)") + " -> " + listeSources[i].chemin);
  }
  dire("mapping " + LABEL_STYLE_MAP + " : " + (lireMapBrute(doc) ? "present" : "absent"));

  // LES ETATS : c'est le moteur qui tranche, SOURCE PAR SOURCE.
  const verdict = await etatsParLeMoteur(brut);
  let etats = verdict.etats;
  let etatIndetermine = false;
  if (verdict.erreur) {
    ko("etats par le moteur", verdict.erreur);
    etatIndetermine = true;
  } else if (!etats || etats.length === 0) {
    dire("      => le moteur n'a PAS rendu d'etat exploitable.");
    etatIndetermine = true;
  } else {
    for (let i = 0; i < etats.length; i++) {
      if (etats[i].indexOf("ERREUR:") === 0 || etats[i].indexOf("ABANDON") === 0) etatIndetermine = true;
    }
  }
  if (etatIndetermine) etats = null;
  dire("etats rendus par le moteur : " + (etats ? etats.join(" | ") : "(aucun - indetermine)"));

  // Chaque source : son etat (moteur) et ses caracteristiques (lecture disque).
  const sources = [];
  for (let i = 0; i < listeSources.length; i++) {
    const it = listeSources[i];
    const etatI = etats ? (etats[i] || "") : "";
    const car = await caracteristiquesDisque(it.chemin);
    let taille, mots, signes, date;
    if (car.erreur) {
      if (etatI === "source_absente") {
        dire("      " + it.chemin + " : source absente, lecture disque impossible PAR CONSEQUENCE (attendu, pas une panne).");
      } else {
        ko("caracteristiques (lecture disque) " + it.chemin, car.erreur);
      }
      dire("      => compteurs NON affiches (aucun chiffre invente).");
      taille = "-"; mots = "-"; signes = "-";
      date = it.modified ? formaterDateCourte(it.modified) + " (import)" : "-";
    } else {
      taille = formaterOctets(car.signes);
      mots = String(car.mots);
      signes = String(car.signes);
      date = formaterDateCourte(car.dateMs);
    }
    sources.push({
      nom: it.nom || "(sans nom)",
      etat: etatI ? classeEtat(etatI) : "absente",
      // La PAGE n'a aucune source dans le moteur (l'etiquette ne la porte pas) :
      // on affiche un tiret plutot qu'un numero invente. Orphelin declare.
      page: "-",
      taille: taille,
      mots: mots,
      signes: signes,
      date: date,
      chemin: it.chemin || "-",
      // Le MODELE n'a aucune source dans le moteur : orphelin declare.
      modele: "-",
      // L'ICONE : la ligne-modele a cloner (0 triangle ambre = source
      // modifiee, 1 cercle rouge = chemin d'import brise, 2 colonne vide =
      // rien a signaler). Aucune icone inventee : le choix est celui du dessin.
      icone: indexLignePourEtat(etatI),
      brutEtat: etatI
    });
  }

  // On affiche UNE LIGNE PAR SOURCE (les 3 lignes-modeles restent la
  // bibliotheque d'icones, jamais affichee).
  const lignesRendues = afficherLignesSources(sources);
  if (lignesRendues.length) selectionner(lignesRendues[0]);

  // Le compteur de selection etait faux dans la maquette (" 2 liens " pour
  // une seule ligne selectionnee) : on l'ecrit depuis l'etat reel.
  const nb = el("nb_selection");
  if (nb) nb.textContent = (sources.length === 1) ? "1 lien selectionne"
    : sources.length + " liens selectionnes";

  // La NOTE : une seule source garde la note historique ; plusieurs sources
  // donnent la repartition REELLE (aucun chiffre invente).
  let nbDiff = 0, nbAbs = 0, nbId = 0;
  for (let i = 0; i < sources.length; i++) {
    if (sources[i].brutEtat === "different") nbDiff++;
    else if (sources[i].brutEtat === "source_absente") nbAbs++;
    else if (sources[i].brutEtat === "identique") nbId++;
  }
  if (sources.length === 1) {
    majNoteListe(1, etatIndetermine
      ? "etat indetermine - voir le journal"
      : libelleEtat(sources[0].brutEtat) + " - " + sources[0].mots + " mot(s), " + sources[0].signes + " signe(s)");
  } else if (etatIndetermine) {
    majNoteListe(sources.length, "etats indetermines - voir le journal");
  } else {
    majNoteListe(sources.length, nbDiff + " modifiee(s), " + nbAbs + " absente(s), " + nbId + " identique(s)");
  }

  // DECISION FJD (01/10/2026) : le bandeau ne parle QUE pour une source
  // MODIFIEE. Tous les autres cas (identique, absente, indetermine) sont
  // MUETS a l'ecran : le detail est au journal. Decision FJD du 02/10/2026 :
  // le declencheur porte sur TOUTES les sources (une seule modifiee suffit).
  if (nbDiff > 0) {
    afficherDanger(nbDiff === 1 ? phraseEtat("different")
      : nbDiff + " sources ont bouge depuis l'import");
  } else {
    masquerStatut();
    if (etatIndetermine) {
      // La note de liste renvoie au journal : on tient la promesse en y
      // tracant l'incertitude (ecran muet, journal complet).
      afficherStatut(false, "je n'ai pas pu savoir l'etat de la source (voir le journal)");
    }
  }

  dire("");
  dire("VERDICT : " + sources.length + " ligne(s) affichee(s) pour "
    + sources.length + " source(s) memorisee(s) dans l'etiquette.");
  if (nbAbs > 0) {
    dire("      => " + nbAbs + " source(s) ABSENTE(S) : plus sur le disque a cet instant.");
  }
}

function actualiserListe() {
  return construireListe();
}

/* ------------------------------------------------------------------ */
/* TIR 9 (02/10/2026) - le panneau SUIT le document actif               */
/* Defaut FJD : " lorsqu'on passe d'un doc a l'autre, le panneau        */
/* demeure sur l'etat precedent ". Le panneau lisait le document UNE     */
/* fois au demarrage, puis seulement sur clic. On ajoute donc une VEILLE */
/* du document ACTIF : ouverture, BASCULE entre documents, fermeture.    */
/*                                                                      */
/* DEUX ETAGES, pour ne pas dependre d'un nom d'evenement devine :       */
/*   1. EVENEMENTS InDesign (voie rapide). Noms SOURCES dans la doc      */
/*      Adobe UXP (objet Event, membres en minuscules) : afterOpen,      */
/*      afterActivate, afterClose, afterNew. Lequel se declenche        */
/*      EXACTEMENT sur une BASCULE entre deux documents DEJA ouverts    */
/*      n'est pas mesurable hors InDesign : on enregistre les QUATRE.    */
/*   2. VEILLE PERIODIQUE (filet GARANTI) : on relit l'identite du       */
/*      document actif chaque seconde. Un nom d'evenement mal choisi ne  */
/*      peut donc PAS laisser le panneau sur l'etat precedent.           */
/*                                                                      */
/* Le tube reste GELE (panneau = demande, moteur = decision) : la veille */
/* ne fait que RELIRE, elle n'ecrit RIEN dans le document.               */
/* ------------------------------------------------------------------ */
let derniereIdentiteDocument = null;   // null = jamais observe
let minuteurVeille = null;             // anti-rafale (un seul refresh par salve)
let majDifferee = null;                // promesse du refresh differe (pour la preuve)
let intervalleVeille = null;
let veilleArmee = false;

/* Identite du document ACTIF. On ne devine rien : nom + identifiant quand il
   existe. "aucun-document" / "...illisible" sont des etats HONNETES, pas des
   erreurs : app.activeDocument jette quand aucun document n'est ouvert. */
function identiteDocumentActif() {
  const ind = moduleInDesign();
  if (!ind || !ind.app) return "module-indesign-indisponible";
  try {
    const d = ind.app.activeDocument;
    if (!d) return "aucun-document";
    const id = (d.id === undefined || d.id === null) ? "" : String(d.id);
    return String(d.name) + "|" + id;
  } catch (e) {
    return "document-actif-illisible";
  }
}

/* LE point d'entree unique des deux etages. Renvoie true si un CHANGEMENT a
   ete vu (preuve testable), false sinon. Un changement programme UN SEUL
   rafraichissement differe : une salve d'evenements ne provoque pas N relectures. */
function veillerSurDocument(motif) {
  if (!veilleArmee) armerVeille();   // 2e chance : le pont InDesign peut s'etre etabli depuis
  const id = identiteDocumentActif();
  if (id === derniereIdentiteDocument) return false;
  const avant = derniereIdentiteDocument;
  derniereIdentiteDocument = id;
  dire("");
  dire("--- document actif CHANGE (" + (motif || "veille periodique") + ") ---");
  dire("    avant : " + avant);
  dire("    apres : " + id);
  if (minuteurVeille) return true;   // un refresh est deja prevu : il lira deja CE document
  minuteurVeille = setTimeout(function () {
    minuteurVeille = null;
    majDifferee = actualiserListe();
  }, 300);
  return true;
}

/* Noms minuscules, tels que la doc Adobe UXP les donne (Event.AFTER_OPEN =
   "afterOpen", etc.). PAS les constantes Event.* d'ExtendScript. */
const EVENEMENTS_DOCUMENT = ["afterOpen", "afterActivate", "afterClose", "afterNew"];

function armerVeille() {
  const ind = moduleInDesign();
  const app = (ind && ind.app) ? ind.app : null;

  // Etage 1 - evenements, si le pont est pret. Sinon on ne marque PAS arme :
  // la prochaine veille retentera (silencieusement, pour ne pas noyer le journal).
  if (app && typeof app.addEventListener === "function") {
    const poses = [];
    for (let i = 0; i < EVENEMENTS_DOCUMENT.length; i++) {
      const nom = EVENEMENTS_DOCUMENT[i];
      try {
        app.addEventListener(nom, function () { veillerSurDocument(nom); });
        poses.push(nom);
      } catch (e) {
        journaliser("[veille] evenement refuse par InDesign : " + nom);
      }
    }
    veilleArmee = true;
    journaliser("[veille] evenements documentaires enregistres : "
      + (poses.length ? poses.join(", ") : "AUCUN"));
  }

  // Etage 2 - veille periodique : le filet garanti pour la BASCULE de document.
  if (!intervalleVeille && typeof setInterval === "function") {
    intervalleVeille = setInterval(function () { veillerSurDocument("veille periodique"); }, 1000);
    journaliser("[veille] veille periodique active (1000 ms)");
  }
}

/* ------------------------------------------------------------------ */
/* MISSION 4 - bouton " Importer " : la SEULE action qui ECRIT dans le  */
/* document. Le panneau n'ecrit RIEN : il donne l'ordre au moteur        */
/* (import_md.jsx), qui DECIDE et execute. Tube = signature GELEE du     */
/* 30/09/2026 : cas nommes Appelant / Action / Chemin.                   */
/* ------------------------------------------------------------------ */
async function importerDepuisPanneau() {
  dire("");
  dire("--- Import : le panneau demande l'import au moteur ---");
  dire("cette action ECRIT dans le document (c'est la seule).");
  // Le bandeau est un indicateur d'ETAT, pas d'ACTION : il se tait ici et se
  // rallumera sur " Actualiser " si la source a encore bouge.
  masquerStatut();

  const ind = moduleInDesign();
  if (!ind || typeof ind.app.doScript !== "function") {
    dire("app.doScript indisponible : import impossible.");
    afficherStatut(false, "import impossible : app.doScript indisponible");
    return;
  }
  const sl = ind.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;

  if (!await assurerDossierProjet()) {
    dire("Dossier du projet non deduit : import impossible.");
    afficherStatut(false, "import impossible : dossier du projet non deduit");
    return;
  }

  // La source a importer : le CHEMIN de la ligne affichee dans la fiche.
  // Le panneau n'a pas de champ " chemin " (choix de la maquette) :
  // " Importer le fichier " importe LE fichier montre. A ARBITRER (cf. CR).
  const s = sourceSelectionnee();
  if (!s) {
    dire("Aucune source selectionnee : rien a importer.");
    dire("      cliquez sur Actualiser (lecture du document), puis sur une ligne.");
    afficherStatut(false, "import refuse : aucune source selectionnee");
    return;
  }

  // GARDE-FOU MAQUETTE. A l'ouverture la liste affichee est le DESSIN : trois
  // chemins de demonstration (/Users/fjd/Docs/...). Importer l'un d'eux n'a
  // aucun sens et masquerait le vrai etat du document. On REFUSE en disant
  // quoi faire ; la maquette disparait des le premier " Actualiser ".
  if (s.maquette) {
    dire("Refus : la ligne affichee est encore la MAQUETTE d'ouverture.");
    dire("      chemin de demonstration, jamais importe : " + String(s.chemin));
    dire("      cliquez sur Actualiser : la source reelle remplacera la maquette.");
    afficherStatut(false, "import refuse : la liste affichee est la maquette");
    return;
  }

  const cheminMd = (s.chemin && s.chemin !== "-") ? String(s.chemin).trim() : "";
  if (!cheminMd) {
    dire("Aucune source exploitable : rien a importer.");
    afficherStatut(false, "import impossible : aucune source selectionnee");
    return;
  }

  return envoyerImportAuMoteur(cheminMd);
}

/* Le tronc COMMUN aux DEUX entrees d'import : " Importer " (le fichier de la
   ligne affichee) et " Relier " (le fichier choisi par l'utilisateur). Les
   deux produisent le MEME tube gele (3 champs nommes) : la signature du tube
   n'a pas bouge d'un caractere. Seule change la facon d'obtenir le Chemin. */
async function envoyerImportAuMoteur(cheminMd) {
  // L'appelant a deja verifie app.doScript et le dossier ; on relit ici les
  // deux references dont le tronc a besoin (il sert DEUX entrees differentes,
  // il ne peut donc pas dependre des variables locales de l'une d'elles).
  const ind = moduleInDesign();
  if (!ind || typeof ind.app.doScript !== "function") {
    dire("app.doScript indisponible : import impossible.");
    afficherStatut(false, "import impossible : app.doScript indisponible");
    return;
  }
  const sl = ind.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;

  // On verifie ICI que la source est lisible, AVANT d'occuper le moteur.
  const texteSource = await lireFichierTexte(cheminMd);
  if (texteSource === null) {
    dire("Source introuvable ou illisible : " + cheminMd);
    afficherStatut(false, "import impossible : source introuvable\n" + cheminMd);
    return;
  }

  const cheminJsx = cheminMoteur();
  dire("source      : " + cheminMd + "  (" + texteSource.length + " caracteres)");
  dire("moteur      : " + cheminJsx);

  const ARGS = [
    "Appelant=panneau",
    "Action=importer",
    "Chemin=" + cheminMd
  ];
  dire("tube        : " + ARGS.join("  |  "));

  // Le moteur doit s'executer COMME UN FICHIER (il deduit son journal et son
  // entree de menu de $.fileName). $.evalFile ne transmettant aucun argument,
  // on depose le tube dans un global a usage unique que le moteur relira.
  const src =
    '$.global.__M04_TUBE_IMPOSE = [ ' +
      ARGS.map(function (a) { return chaineExtendScript(a); }).join(", ") +
    ' ];\n' +
    '$.evalFile(new File(' + chaineExtendScript(cheminJsx) + '));';

  // Le journal DU MOTEUR : on le lit AVANT et APRES, et on ne juge QUE sur
  // les lignes ajoutees. Lecture PAR LE MOTEUR (ExtendScript, BINARY),
  // jamais par UXP : le journal est en MacRoman et UXP lit en UTF-8, ce qui
  // rendait ce fichier illisible alors que la source .md, elle, se lit
  // (cf. lireJournalParLeMoteur ci-dessus, CR tir 6).
  const cheminJournalMoteur = dossierProjet() + "/import_md_errors.log";
  const avant = await lireJournalParLeMoteur(cheminJournalMoteur);

  dire("Envoi au moteur...");
  try {
    const retour = ind.app.doScript(src, lang);
    dire("      retour brut : " + String(retour));
  } catch (eImport) {
    ko("appel du moteur", eImport);
    afficherStatut(false, "import : " + messageDe(eImport));
    return;
  }

  const apres = await lireJournalParLeMoteur(cheminJournalMoteur);
  if (apres === null) {
    dire("      le moteur n'a pas rendu son journal : " + cheminJournalMoteur);
    afficherStatut(false,
      "import envoye, mais le moteur n'a pas rendu son journal\n" +
      "(journal attendu : " + cheminJournalMoteur + ")\n" +
      "Le document peut avoir ete importe : ce message ne juge que le journal.");
    return;
  }

  let ajout;
  if (avant !== null && apres.indexOf(avant) === 0) ajout = apres.substring(avant.length);
  else ajout = apres;

  const lignes = ajout.split(/\r?\n/).filter(function (l) { return l.length > 0; });
  const dernieres = lignes.slice(-14);
  dire("      --- lignes AJOUTEES au journal du moteur ---");
  if (dernieres.length === 0) dire("      (aucune ligne ajoutee)");
  // Le journal est lu en BINARY : on n'ecrit que de l'ASCII dans le journal
  // du panneau, sinon les octets MacRoman y apparaitraient en bruit.
  for (let i = 0; i < dernieres.length; i++) {
    dire("      " + dernieres[i].replace(/[\u0080-\uffff]/g, ""));
  }

  const vuAppel = /M04-repartiteur: appel PANNEAU/.test(ajout);
  const vuSource = /M04: source IMPOSEE par le PANNEAU/.test(ajout);
  const vuRefus = /M04: REFUS/.test(ajout);

  if (vuRefus) {
    ko("le moteur a refuse l'import", "aucun bloc de texte actif");
    afficherStatut(false,
      "import REFUSE : aucun bloc de texte n'est actif dans le document.\n" +
      "Placez le curseur dans un bloc de texte (ou selectionnez un bloc), puis recliquez sur Importer.\n" +
      "Rien n'a ete modifie : ni le document, ni le place gun.\n" +
      "journal moteur : " + cheminJournalMoteur);
    return;
  }

  // Defaut signale par FJD le 02/10/2026 : " Un nouvel import, pas de nouvelle
  // ligne. " Le document vient de CHANGER (le moteur a ecrit son etiquette),
  // mais l'ecran affichait encore le document tel qu'il etait AVANT l'import :
  // une relecture est donc necessaire. Le panneau ne lit pas le moteur, il
  // relit le DOCUMENT ; l'appel vient AVANT le message de verdict, car
  // actualiserListe() part d'un bandeau muet et peut le rallumer (source
  // modifiee) : on ecrit le verdict de l'import en DERNIER pour rester maitre
  // du bandeau. (Le panneau ne modifie jamais le document : c'est bien une
  // relecture, pas une ecriture.)
  await actualiserListe();

  afficherStatut(true,
    "import demande au moteur.\n" +
    "appel PANNEAU vu : " + (vuAppel ? "OUI" : "NON") +
    "   |   source imposee : " + (vuSource ? "OUI" : "NON") +
    "\njournal moteur : " + cheminJournalMoteur);
}

/* ------------------------------------------------------------------ */
/* MISSION 6 - bouton " Relier " : produire un CHEMIN quand il n'y en   */
/* a aucun. C'est la REPONSE au blocage du PREMIER import : le panneau  */
/* ne sait lire une source que dans l'etiquette du document, et cette   */
/* etiquette nait D'UN IMPORT. Sans cette entree, le panneau exigeait   */
/* un premier import pour faire un premier import - impasse constatee   */
/* par FJD le 01/10/2026. Le moteur, lui, n'a jamais eu ce probleme :   */
/* sur un appel MENU il ouvre deja File.openDialog (import_md.jsx).     */
/* Ici on ouvre le selecteur NATIF d'UXP et on confie son resultat au   */
/* tube GELE, a l'identique de " Importer " (signature inchangee).      */
/* Regle du projet respectee : le panneau PROPOSE un chemin, le moteur  */
/* TRANCHE (mapping, empreinte, page : jamais transportes).             */
/* ------------------------------------------------------------------ */
async function relierDepuisPanneau() {
  dire("");
  dire("--- Relier : choix d'un fichier Markdown a importer ---");
  masquerStatut();

  const ind = moduleInDesign();
  if (!ind || typeof ind.app.doScript !== "function") {
    dire("app.doScript indisponible : relier impossible.");
    afficherStatut(false, "relier impossible : app.doScript indisponible");
    return;
  }

  if (!await assurerDossierProjet()) {
    dire("Dossier du projet non deduit : relier impossible.");
    afficherStatut(false, "relier impossible : dossier du projet non deduit");
    return;
  }

  // Acces UXP isole dans son propre try : un runtime sans selecteur doit
  // produire un refus FRANC, pas un plantage silencieux.
  let lfs = null;
  try {
    const uxp2 = require("uxp");
    lfs = (uxp2 && uxp2.storage) ? uxp2.storage.localFileSystem : null;
  } catch (e) {
    ko("require('uxp')", e);
  }
  if (!lfs || typeof lfs.getFileForOpening !== "function") {
    dire("getFileForOpening indisponible dans ce runtime : relier impossible.");
    afficherStatut(false, "relier impossible : selecteur de fichier indisponible");
    return;
  }

  let entree = null;
  try {
    entree = await lfs.getFileForOpening({
      types: ["md", "markdown", "txt"],
      allowMultiple: false
    });
  } catch (e) {
    ko("getFileForOpening", e);
    afficherStatut(false, "relier : " + messageDe(e));
    return;
  }

  // Annulation : FJD a ferme le selecteur. Ce n'est PAS un echec : on le dit
  // au journal et on ne touche a RIEN (ni document, ni bandeau).
  if (!entree) {
    dire("Selection annulee : rien n'a ete envoye au moteur.");
    journaliser("[relier] selection annulee - rien envoye");
    return;
  }

  const cheminMd = (entree.nativePath && String(entree.nativePath).trim()) || "";
  if (!cheminMd) {
    dire("Le selecteur n'a pas rendu de chemin exploitable.");
    afficherStatut(false, "relier impossible : chemin illisible");
    return;
  }

  dire("fichier choisi : " + cheminMd);
  return envoyerImportAuMoteur(cheminMd);
}

/* ------------------------------------------------------------------ */
/* Cablage general                                                     */
/* ------------------------------------------------------------------ */
function cabler() {
  // Zone 2 - entete
  const b = el("btn_page");
  if (b) b.addEventListener("click", trierParPage);

  // Zone 2 - selection
  const corps = el("liste_corps");
  if (corps) {
    const lignes = corps.querySelectorAll(".ligne");
    for (let i = 0; i < lignes.length; i++) {
      lignes[i].addEventListener("click", function () { selectionner(this); });
    }
  }

  // Zone 3 - barre d'icones (toutes icones seules, pas de label visible)
  // TROIS boutons portent le MOTEUR REEL : " Actualiser " (lecture seule),
  // " Importer " (importe le fichier de la ligne affichee) et " Relier "
  // (choisit un fichier quand il n'y a AUCUNE ligne : c'est l'entree du
  // PREMIER import - cf. relierDepuisPanneau). " Editer " reste le SEUL
  // orphelin : aucun moteur derriere dans import_md.jsx.
  const actions = {
    btn_expand: "expander",
    btn_relier: "relier un fichier .md",
    btn_import: "importer le fichier",
    btn_actualiser: "actualiser",
    btn_editer: "editer"
  };
  Object.keys(actions).forEach(function (id) {
    const bouton = el(id);
    if (!bouton) return;
    bouton.addEventListener("click", function () {
      if (id === "btn_expand") { basculerCalibrage(); return; }
      // Un clic = un ecran propre (le fichier journal, lui, garde tout).
      purgerEcranJournal();
      if (id === "btn_actualiser") { actualiserListe(); return; }
      if (id === "btn_import") { importerDepuisPanneau(); return; }
      if (id === "btn_relier") { relierDepuisPanneau(); return; }
      journaliser("[action] " + actions[id] + " (non cable : orphelin)");
    });
  });

  // Zone 4 - ligne expandable
  const lc = el("ligne_calibrage");
  if (lc) lc.addEventListener("click", basculerCalibrage);

  journaliser("panneau pret - ecran vide : la liste se remplit a la lecture du document");
}

/* ------------------------------------------------------------------ */
/* Demarrage                                                           */
/* ------------------------------------------------------------------ */
cabler();

// Le dossier du projet est DEDUIT de l'emplacement du panneau : FJD n'a rien
// a taper.
// DECISION FJD (01/10/2026) : " un panneau vide on load " - " vide puis
// refresh onload ". L'ecran ne montre donc JAMAIS la maquette a l'ouverture :
// on le VIDE d'abord (viderLaListe), PUIS on lit le document reel.
// La lecture est DIFFEREE d'un temps (600 ms, la meme mesure que l'ecriture du
// journal) et non lancee dans le tour courant : au tout premier instant de vie
// d'un panneau UXP, le pont InDesign peut ne pas etre encore etabli, et une
// lecture immediate risquerait d'afficher " module indesign indisponible " -
// soit un FAUX diagnostic presente comme une mesure.
viderLaListe();
dire("Ouverture : ecran vide, puis lecture du document courant.");
void assurerDossierProjet();
// Tir 9 (02/10/2026) : on ARME la veille des maintenant (evenements +
// veille periodique). Si le pont InDesign n'est pas encore etabli, armerVeille
// ne marque rien : la prochaine veille retentera, sans bruit.
armerVeille();
// Ecrit le journal une fois pour REVELER le chemin du fichier de sortie :
// c'est notre seul moyen de recuperer la preuve (pas de presse-papier UXP).
// Dans le meme temps, on remplit l'ecran avec le document REEL.
setTimeout(function () {
  ecrireJournalFichier(true);
  // Tir 9 : on cale la reference de veille sur le document lu MAINTENANT.
  // La veille ne declenche donc que sur un VRAI changement, jamais deux fois
  // au demarrage.
  derniereIdentiteDocument = identiteDocumentActif();
  void actualiserListe();
}, 600);

/* Expose l'objet pour inspection depuis la console de l'hote (meme commodite
   que la sonde : window.sondeImportMd). */
window.panneauLiensMd = {
  journal: journal,
  actualiser: actualiserListe,
  construireListe: construireListe,
  viderListe: viderLaListe,
  importer: importerDepuisPanneau,
  relier: relierDepuisPanneau,
  statut: afficherStatut,
  danger: afficherDanger,
  masquerStatut: masquerStatut,
  sources: SOURCES,
  cheminFichierJournal: function () { return cheminJournal; },
  dossierProjet: function () { return dossierProjet(); },
  // Tir 9 : la veille du document actif, exposee pour inspection (console
  // de l'hote) et pour la batterie (preuve du comportement differe).
  veiller: veillerSurDocument,
  identiteDocument: identiteDocumentActif,
  attendreMaj: function () { return majDifferee || Promise.resolve(); }
};

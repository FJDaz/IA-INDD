/*
 * SONDE UXP « Import MD » — jetable.
 * ---------------------------------------------------------------------------
 * Objet : MESURER, pas supposer.
 *
 *   Q1  Un panneau UXP s'affiche-t-il dans InDesign 2026 SANS <webview> ?
 *   Q2  Le DOM InDesign est-il joignable depuis le panneau (require("indesign")) ?
 *   Q3  app.doScript() existe-t-il ?  -> decide si nos 3089 lignes d'ExtendScript
 *       (import_md.jsx) sont reutilisables telles quelles, ou s'il faut les
 *       traduire en ES6 contre le DOM UXP.
 *   Q3bis  Le moteur import_md.jsx est-il chargeable SANS s'executer ?
 *       Le 29/09, l'appel naif a lance un import complet de 85 paragraphes :
 *       import_md.jsx se termine par un "main();" au niveau racine, et
 *       $.evalFile execute TOUT le fichier. Parade mesuree ici.
 *   Q4  Peut-on LIRE un .md depuis le panneau, et avec quelle API ?
 *       Le 29/09 : fs.stat n'existe pas dans le module fs d'UXP.
 *       On mesure donc ce qui existe reellement, au lieu de le supposer.
 *   Q5  Le garde-fou fonctionne-t-il ? Un controle NEGATIF qui DOIT echouer est
 *       execute : si lui aussi affichait « OK », la sonde ne prouverait rien.
 *
 * Regles du chantier respectees ici :
 *   - aucun catch vide : toute erreur est ecrite dans le journal ;
 *   - resultat affiche a l'ecran ET envoye dans la console de l'hote
 *     (donc dans ~/Library/Logs/Adobe/Adobe InDesign 2026/UXPLogs_*.log).
 */

/* ------------------------------------------------------------------ */
/* Chemins par defaut (aucun accent : chemin projet verifie a 0 non-ASCII) */
/* ------------------------------------------------------------------ */
// Dossier du projet : a adapter a votre installation (placeholder, jamais un
// chemin personnel en dur). Ces valeurs ne sont que des valeurs par defaut :
// le champ de saisie du panneau permet de les remplacer.
const PROJET_DIR = "/chemin/vers/INDD/IMPORT_MD";
const CHEMIN_MD = PROJET_DIR + "/atelier_importateur_md.md";
const CHEMIN_JSX = PROJET_DIR + "/import_md.jsx";

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */
const journal = [];

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
  const zone = document.getElementById("journal");
  if (zone) {
    zone.textContent = journal.join("\n");
    // Le journal a une hauteur limitee : sans ce defilement, les lignes
    // ecrites par un test partent SOUS LE PLI et l'ecran semble ne pas
    // bouger alors que le test a bien tourne. On force donc la vue en bas
    // pour que le dernier resultat soit TOUJOURS visible.
    zone.scrollTop = zone.scrollHeight;
  }
  // Sortie de secours : on recopie le journal dans un fichier .txt sur le
  // disque, en arriere-plan (mesure du 30/09 : uxp.clipboard n'existe pas
  // dans ce runtime, et un panneau UXP ne laisse pas selectionner le texte).
  programmerEcritureJournal();
  // console de l'hote : c'est ce qui atterrit dans le journal UXP sur disque
  console.log("[sonde-import-md] " + ligne);
}

function ok(nom, valeur) {
  dire("OK    " + nom + "  ->  " + valeur);
}

function ko(nom, e) {
  dire("ECHEC " + nom + "  ->  " + messageDe(e));
}

/* Execute un test et ecrit OK ou ECHEC. Retourne le resultat ou undefined. */
function essai(nom, fn) {
  try {
    const r = fn();
    ok(nom, r === undefined ? "(sans valeur de retour)" : r);
    return r;
  } catch (e) {
    ko(nom, e);
    return undefined;
  }
}

function titre(texte) {
  dire("");
  dire("--- " + texte + " ---");
}

/* ------------------------------------------------------------------ */
/* Modules UXP                                                         */
/* ------------------------------------------------------------------ */
let uxpModule = null;
let osModule = null;
let inDesignModule = null;

/* ------------------------------------------------------------------ */
/* Q0 — le panneau est-il vivant, et sans WebView ?                    */
/* ------------------------------------------------------------------ */
function demarrer() {
  titre("Q1  le panneau est vivant");

  dire("date       : " + new Date().toISOString());
  dire("userAgent  : " + String(navigator.userAgent));
  dire("webview    : " + (document.querySelector("webview") === null
        ? "ABSENTE  (le panneau n'embarque aucun navigateur)"
        : "PRESENTE dans ce panneau"));

  essai("require('uxp')", () => {
    uxpModule = require("uxp");
    return "type=" + typeof uxpModule;
  });

  essai("uxp.versions (versions de l'hote)", () => {
    if (!uxpModule || !uxpModule.versions) return "uxp.versions indisponible";
    const v = uxpModule.versions;
    return "uxp=" + v.uxp + "  plugin=" + v.plugin;
  });

  essai("require('os')", () => {
    osModule = require("os");
    return "platform=" + osModule.platform + "  release=" + osModule.release;
  });

  // Champ de saisie pre-rempli avec le chemin du .md de reference
  const champ = document.getElementById("chemin");
  if (champ) champ.value = CHEMIN_MD;

  dire("");
  dire("Panneau visible et dockable = Q1 repondue par la vue.");
  dire("Les tests ci-dessous mesurent Q2, Q3 et Q4.");
}

/* ------------------------------------------------------------------ */
/* Q2 — le DOM InDesign est-il joignable ?                             */
/* ------------------------------------------------------------------ */
function testerDom() {
  titre("Q2  DOM InDesign depuis le panneau");

  essai("require('indesign')", () => {
    inDesignModule = require("indesign");
    const clefs = Object.keys(inDesignModule);
    return clefs.length + " export(s) : " + clefs.join(", ");
  });

  if (!inDesignModule) {
    dire("Suite impossible : require('indesign') a echoue.");
    return;
  }

  essai("app present", () => {
    const a = inDesignModule.app;
    return a ? "oui, type=" + typeof a : "NON";
  });

  essai("app.name / app.version", () => {
    const a = inDesignModule.app;
    return a.name + " / " + a.version;
  });

  essai("app.documents.length (le DOM est-il VIVANT ?)", () => {
    return inDesignModule.app.documents.length + " document(s) ouvert(s)";
  });
}

/* ------------------------------------------------------------------ */
/* Q3 — app.doScript existe-t-il ?  (la charniere du chantier)         */
/* ------------------------------------------------------------------ */
function testerDoScript() {
  titre("Q3  app.doScript  (reutilisation de notre ExtendScript)");

  if (!inDesignModule) {
    inDesignModule = essai("require('indesign')", () => require("indesign"));
  }
  if (!inDesignModule) {
    dire("Suite impossible : require('indesign') a echoue.");
    return;
  }

  const a = inDesignModule.app;

  essai("typeof app.doScript", () => {
    return typeof a.doScript;
  });

  essai("ScriptLanguage expose ?", () => {
    const sl = inDesignModule.ScriptLanguage;
    if (!sl) return "absent du module indesign";
    return "JAVASCRIPT=" + sl.JAVASCRIPT + "  APPLESCRIPT=" + sl.APPLESCRIPT;
  });

  if (typeof a.doScript !== "function") {
    dire("");
    dire("VERDICT Q3 : app.doScript ABSENT du DOM UXP.");
    dire("=> import_md.jsx n'est PAS appelable tel quel : il faudra traduire");
    dire("   le moteur en ES6 contre le DOM UXP (traduction, pas redecouverte).");
    return;
  }

  dire("");
  dire("VERDICT Q3 : app.doScript PRESENT. On mesure maintenant son appel.");

  essai("app.doScript : expression simple", () => {
    const sl = inDesignModule.ScriptLanguage;
    const lang = sl ? sl.JAVASCRIPT : undefined;
    const r = a.doScript("app.name", lang);
    return "retour = " + r;
  });

  essai("app.doScript : boucle de 3 iterations", () => {
    const sl = inDesignModule.ScriptLanguage;
    const lang = sl ? sl.JAVASCRIPT : undefined;
    const src = "var s=0; for (var i=0;i<3;i++){ s+=i; } s;";
    return "retour = " + a.doScript(src, lang);
  });
}

/* ------------------------------------------------------------------ */
/* Q3bis — charger le moteur SANS declencher l'import                    */
/* Lecon du 29/09 : $.evalFile execute TOUT le fichier, et import_md.jsx */
/* se termine par un "main();" racine -> un import complet de 85          */
/* paragraphes s'est lance tout seul. On charge donc une COPIE du moteur  */
/* dont la derniere ligne "main();" a ete retiree. Le fichier d'origine   */
/* n'est pas modifie, la copie est supprimee juste apres.                */
/* ------------------------------------------------------------------ */
function testerMoteur() {
  titre("Q3bis  moteur import_md.jsx charge SANS executer main()");

  if (!inDesignModule) {
    inDesignModule = essai("require('indesign')", () => require("indesign"));
  }
  if (!inDesignModule || typeof inDesignModule.app.doScript !== "function") {
    dire("Non mesurable : app.doScript indisponible (cf. Q3).");
    return;
  }

  const sl = inDesignModule.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;

  /* Le script ExtendScript ci-dessous :
     1) lit import_md.jsx sur le disque ;
     2) coupe le "main();" de la fin ;
     3) ecrit une copie temporaire DANS LE MEME DOSSIER (indispensable :
        le moteur resout son journal et import_md_menu.jsx via $.fileName) ;
     4) l'evalue ;
     5) supprime la copie.

     ATTENTION — le moteur a DEUX effets de bord de niveau racine :
       a) le "main();" final (coupe ici) ;
       b) le bloc try { $.evalFile(import_md_menu.jsx) } + register($.fileName)
          (lignes 3077-3086), qui n'est PAS coupe et ecrit dans le journal.
     Donc comparer seulement la TAILLE du journal ne prouve rien : il faut
     regarder QUELLES lignes ont ete ajoutees. On renvoie donc le texte
     ajoute au journal, que le cote JS classe : trace d'import (main() a
     tourne), creation d'entree de menu (danger : elle serait pointee vers
     la copie temporaire supprimee), ou simple verification (inoffensif). */
  const src =
    'var CHEMIN = "' + CHEMIN_JSX + '";\n' +
    'var PARENT = new File(CHEMIN).parent.fsName;\n' +
    'var CHEMIN_JOURNAL = PARENT + "/import_md_errors.log";\n' +
    'function lireJournal() {\n' +
    '  var j = new File(CHEMIN_JOURNAL);\n' +
    '  if (!j.exists) { return ""; }\n' +
    '  j.encoding = "BINARY"; j.open("r");\n' +
    '  var s = j.read(); j.close();\n' +
    '  return s;\n' +
    '}\n' +
    'var texteAvant = lireJournal();\n' +
    'var f = new File(CHEMIN); f.encoding = "UTF-8"; f.open("r");\n' +
    'var txt = f.read(); f.close();\n' +
    'var idx = txt.lastIndexOf("\\nmain();");\n' +
    'var resultat;\n' +
    'if (idx < 0) { resultat = "ABANDON|main();introuvable|evalFile non execute (securite)"; }\n' +
    'else {\n' +
    '  var tmp = new File(PARENT + "/_sonde_moteur_sans_main.jsx");\n' +
    '  tmp.encoding = "UTF-8"; tmp.open("w");\n' +
    '  tmp.write(txt.substring(0, idx) + "\\n"); tmp.close();\n' +
    '  $.evalFile(tmp);\n' +
    '  tmp.remove();\n' +
    '  var texteApres = lireJournal();\n' +
    '  var ajout = "";\n' +
    '  if (texteApres.indexOf(texteAvant) === 0) { ajout = texteApres.substring(texteAvant.length); }\n' +
    '  else { ajout = "(journal reecrit pendant le test)"; }\n' +
    '  ajout = ajout.replace(/[\\r\\n]+/g, " >> ");\n' +
    '  if (ajout.length > 700) { ajout = ajout.substring(0, 700) + " ..."; }\n' +
    '  resultat = [typeof m05BuildFingerprint, typeof m05DecideState,' +
    '              typeof insertMarkdownWithStyles, typeof resolveTargetStory].join("|") +\n' +
    '    "#journal:" + (texteAvant.length === texteApres.length' +
    '      ? "INCHANGE (" + texteAvant.length + " octets)"\n' +
    '      : "MODIFIE " + texteAvant.length + " -> " + texteApres.length) +\n' +
    '    "#ajout:" + ajout;\n' +
    '}\n' +
    'resultat;';

  essai("copie du moteur sans main(), evaluee puis supprimee", () => {
    const r = String(inDesignModule.app.doScript(src, lang));
    dire("      brut : " + r);

    if (r.indexOf("ABANDON") === 0) {
      dire("      => le motif 'main();' n'a pas ete trouve : rien n'a ete evalue.");
      return r;
    }

    const morceaux = r.split("#journal:");
    const parties = morceaux[0].split("|");
    const noms = [
      "m05BuildFingerprint",
      "m05DecideState",
      "insertMarkdownWithStyles",
      "resolveTargetStory"
    ];
    const bilan = [];
    for (let i = 0; i < noms.length; i++) {
      bilan.push(noms[i] + "=" + parties[i]);
    }

    if (morceaux[0].indexOf("function") !== -1) {
      dire("      => moteur charge : ses fonctions sont visibles du cote ExtendScript.");
    } else {
      dire("      => moteur charge mais fonctions absentes : a examiner.");
    }

    const suite = morceaux[1] ? morceaux[1].split("#ajout:") : [];
    const jrnl = suite[0] ? suite[0].trim() : "non mesure";
    dire("      journal du moteur : " + jrnl);

    const ajout = suite[1] ? suite[1].trim() : "";
    if (ajout) {
      dire("      lignes ajoutees au journal : " + ajout);
    }

    const traceImport = /M05-empreinte|M03-etape2|M03-etape6|M03-etape7/.test(ajout);
    const menuCree = /entree de menu creee/.test(ajout);
    const menuIntact = /deja conforme/.test(ajout);

    if (traceImport) {
      dire("      => ANORMAL : une trace d'import figure dans le journal");
      dire("         => main() A TOURNE. Le retrait du 'main();' n'a pas suffi.");
    } else if (menuCree) {
      dire("      => DANGER : le bloc de menu de niveau racine vient de CREER");
      dire("         l'entree de menu, donc pointee vers la copie temporaire…");
      dire("         …qui est supprimee juste apres. Relancer import_md.jsx");
      dire("         (menu Fichier > Importer) pour reparer l'entree de menu.");
    } else if (menuIntact) {
      dire("      => aucun import et aucune creation de menu : main() n'a PAS");
      dire("         tourne (sinon une boite de dialogue de choix de fichier se");
      dire("         serait ouverte). Le bloc de menu de niveau racine a seulement");
      dire("         verifie l'entree existante : rien a faire. Inoffensif.");
    } else if (/non creee|INTROUVABLE|ECHEC/.test(ajout)) {
      dire("      => le bloc de menu n'a rien enregistre (voir le libelle ci-dessus) :");
      dire("         aucune entree de menu n'a donc ete pointee vers la copie");
      dire("         temporaire. Import inchange, aucun risque.");
    } else if (ajout) {
      dire("      => le journal a bouge sans trace d'import : voir les lignes ci-dessus.");
    } else {
      dire("      => journal INCHANGE : aucun effet de bord du tout.");
    }

    return bilan.join("  ");
  });
  dire("      (la copie temporaire _sonde_moteur_sans_main.jsx est supprimee aussitot)");
}

/* ------------------------------------------------------------------ */
/* Lecture disque (.md) — le panneau doit pouvoir lire la source        */
/* ------------------------------------------------------------------ */
async function testerFichier() {
  titre("Q4  lecture d'un .md sur le disque (API UXP mesuree)");

  const champ = document.getElementById("chemin");
  const chemin = (champ && champ.value) ? champ.value : CHEMIN_MD;
  dire("chemin : " + chemin);
  dire("");
  dire("1) Ce que le module fs d'UXP expose REELLEMENT");

  try {
    const fs = require("fs");
    const clefs = Object.keys(fs);
    ok("require('fs')", clefs.length + " export(s) : " + clefs.join(", "));
    dire("      fs.stat     : " + typeof fs.stat);
    dire("      fs.readFile : " + typeof fs.readFile);
    dire("      fs.lstat    : " + typeof fs.lstat);
  } catch (e) {
    ko("require('fs')", e);
  }

  dire("");
  dire("2) Le stockage UXP (la voie documentee pour lire un fichier)");
  let lfs = null;
  try {
    const uxp2 = require("uxp");
    const stockage = (uxp2 && uxp2.storage) ? uxp2.storage : null;
    if (!stockage) {
      dire("      uxp.storage ABSENT");
    } else {
      ok("uxp.storage", Object.keys(stockage).join(", "));
      lfs = stockage.localFileSystem ? stockage.localFileSystem : null;
      if (lfs) {
        ok("storage.localFileSystem", Object.keys(lfs).join(", "));
      } else {
        dire("      storage.localFileSystem ABSENT");
      }
    }
  } catch (e) {
    ko("require('uxp').storage", e);
  }

  if (!lfs) {
    dire("");
    dire("=> aucune API de lecture disponible : a traiter avant d'ecrire le panneau.");
    return;
  }

  dire("");
  dire("3) La lecture reelle, avec ses caracteristiques");
  try {
    const entree = await lfs.getEntryWithUrl("file://" + chemin);
    ok("localFileSystem.getEntryWithUrl",
      "nom=" + entree.name + "  isFile=" + entree.isFile +
      "  nativePath=" + entree.nativePath);

    let contenu = await entree.read();
    if (typeof contenu !== "string") contenu = String(contenu);
    ok("entree.read()", contenu.length + " caracteres lus");
    dire("      debut : " + JSON.stringify(contenu.slice(0, 60)));

    // Ce que le panneau devra afficher dans « caracteristiques »
    const mots = contenu.split(/\s+/).filter((m) => m.length > 0).length;
    const lignes = contenu.split("\n").length;
    let modification = "indisponible";
    let route = "aucune";

    // Nom EXACT de la cle : dateModified. (La premiere version de cette sonde
    // lisait "modificationDate", qui n'existe pas : le resultat etait
    // "undefined" alors que la cle etait bien presente dans la liste ci-dessus.)
    if (typeof entree.getMetadata === "function") {
      try {
        const meta = await entree.getMetadata();
        ok("entree.getMetadata()", "cles=" + (meta ? Object.keys(meta).join(", ") : "aucune"));
        if (meta && meta.dateModified !== undefined && meta.dateModified !== null) {
          modification = String(meta.dateModified);
          route = "getMetadata().dateModified";
        } else {
          dire("      dateModified present mais vide : on essaie fs.lstat().mtime");
        }
      } catch (e2) {
        ko("entree.getMetadata()", e2);
      }
    } else {
      dire("      entree.getMetadata : ABSENT");
    }

    // Seconde route possible, mesuree elle aussi (fs.stat n'existe pas, mais
    // fs.lstat oui) : on garde celle qui repond pour le futur panneau.
    if (route === "aucune") {
      try {
        const fs2 = require("fs");
        if (typeof fs2.lstat === "function") {
          const st = await fs2.lstat("file://" + chemin);
          if (st && st.mtime !== undefined && st.mtime !== null) {
            modification = String(st.mtime);
            route = "fs.lstat().mtime";
          } else {
            dire("      fs.lstat() repond mais sans mtime");
          }
        }
      } catch (e3) {
        ko("fs.lstat()", e3);
      }
    }

    ok("caracteristiques",
      "mots=" + mots + "  signes=" + contenu.length +
      "  lignes=" + lignes + "  derniere modification=" + modification +
      "  (obtenue via " + route + ")");
  } catch (e) {
    ko("lecture via localFileSystem de " + chemin, e);
    dire("      => si l'erreur parle d'autorisation, c'est le manifeste");
    dire("         (requiredPermissions.localFileSystem) qu'il faut regarder.");
  }
}

/* ------------------------------------------------------------------ */
/* Q4 — CONTROLE NEGATIF : ce test DOIT echouer                        */
/* ------------------------------------------------------------------ */
function testerNegatif() {
  titre("Q5  controle negatif  (l'echec DOIT etre detecte)");

  dire("Ce test appelle volontairement du code inexistant.");
  dire("S'il affichait OK, la sonde ne prouverait rien.");

  essai("app.fonctionQuiNExistePas()", () => {
    if (!inDesignModule) {
      inDesignModule = require("indesign");
    }
    return inDesignModule.app.fonctionQuiNExistePas();
  });

  essai("require('moduleQuiNExistePas')", () => {
    return require("moduleQuiNExistePas");
  });

  /* Les deux lignes precedentes sont les deux echecs volontaires.
     On relit le journal : c'est la preuve que l'echec laisse une trace. */
  const deuxDernieres = journal.slice(-2).join("  ");
  const detecte = deuxDernieres.indexOf("ECHEC") !== -1;
  dire("");
  dire(detecte
    ? "VERDICT Q5 : les deux echecs ont bien ete detectes et ecrits."
    : "VERDICT Q5 : AUCUN echec detecte -> le garde-fou est casse, la sonde est invalide.");
}

/* ------------------------------------------------------------------ */
/* MISSION 1 (Chapitre Panneau) — IDENTITE DE LA SOURCE                 */
/* ------------------------------------------------------------------ */
/* Objet : lire l'etiquette md-source-fingerprint du DOCUMENT ACTIF, et    */
/* en extraire chemin / nom / taille / date / empreinte. LECTURE SEULE :   */
/* cette mission n'ecrit rien dans le document.                            */
/*                                                                        */
/* Point neuf (mesure le 30/09) : la sonde d'origine NE LISAIT PAS         */
/* l'etiquette du document. C'est le vrai nouveau morceau.                 */
/*                                                                        */
/* Trois cas distincts, VOLONTAIREMENT separes (regle du projet) :         */
/*   - AUCUN document ouvert            -> rien a lire ;                   */
/*   - ETIQUETTE ABSENTE ("")           -> jamais importe  (etat normal) ;  */
/*   - LECTURE RATEE (exception)        -> erreur reelle, jamais confondue */
/*     avec l'absence ;                                                     */
/*   - ETIQUETTE PRESENTE mais illisible -> corrompue, encore un autre cas. */
/*                                                                        */
/* Le format relu est celui ecrit par serializeFlatMapping (import_md.jsx) */
/* : {"cle":"valeur",...} avec echappement de \\ et \" seulement. On relit */
/* donc avec le MEME contrat, sans reinvention.                            */

const LABEL_SOURCE_FP = "md-source-fingerprint";
const LABEL_STYLE_MAP = "md-style-map";

/* Decode la forme plate {"cle":"valeur",...} du moteur (meme contrat que
   deserializeFlatMapping cote ExtendScript). */
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

/* Lit une etiquette du document actif. Deux routes mesurees :
   route 1 = le DOM UXP direct (doc.extractLabel), route 2 = repli
   ExtendScript via app.doScript. On journalise LAQUELLE a repondu. */
async function lireEtiquetteDocument(doc) {
  const resultat = { brut: null, route: "aucune", erreur: null };

  // Route 1 — DOM UXP direct
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

  // Route 2 — repli ExtendScript (app.doScript)
  try {
    if (!inDesignModule || typeof inDesignModule.app.doScript !== "function") {
      dire("      repli impossible : app.doScript indisponible");
      return resultat;
    }
    const sl = inDesignModule.ScriptLanguage;
    const lang = sl ? sl.JAVASCRIPT : undefined;
    const src =
      'var d = app.activeDocument; ' +
      'd ? String(d.extractLabel("' + LABEL_SOURCE_FP + '")) : "";';
    resultat.brut = String(inDesignModule.app.doScript(src, lang));
    resultat.route = "app.doScript (ExtendScript) — repli";
    resultat.erreur = null;
  } catch (e2) {
    resultat.erreur = e2;
    ko("repli app.doScript extractLabel", e2);
  }

  return resultat;
}

async function testerIdentite() {
  titre("M1  identite de la source (etiquette du document actif)");
  dire("clic recu a " + new Date().toLocaleTimeString());

  if (!inDesignModule) {
    inDesignModule = essai("require('indesign')", () => require("indesign"));
  }
  if (!inDesignModule) {
    dire("Suite impossible : require('indesign') a echoue.");
    return;
  }
  const app = inDesignModule.app;

  // 1) Un document est-il ouvert ? (cas distinct de « pas d'etiquette »)
  let nbDocs = 0;
  try {
    nbDocs = app.documents.length;
  } catch (eDoc) {
    ko("app.documents.length", eDoc);
    return;
  }
  dire("documents ouverts : " + nbDocs);
  if (nbDocs === 0) {
    dire("");
    dire("CAS « AUCUN DOCUMENT OUVERT » : rien a lire.");
    dire("(ce n'est PAS une lecture ratee : il n'y a simplement pas de document)");
    dire("VERDICT M1 : pas de document actif.");
    return;
  }

  let doc = null;
  try {
    doc = app.activeDocument;
  } catch (eAct) {
    ko("app.activeDocument", eAct);
    return;
  }
  essai("nom du document actif", () => doc.name);

  // 2) Lecture de l'etiquette (deux routes mesurees)
  const lu = await lireEtiquetteDocument(doc);

  dire("");
  dire("route utilisee : " + lu.route);

  // CAS « lecture ratee » : une exception des deux routes.
  if (lu.route === "aucune" && lu.erreur) {
    dire("CAS « LECTURE RATEE » : aucune route n'a pu lire l'etiquette.");
    dire("=> ce n'est PAS « jamais importe » : c'est une erreur reelle.");
    dire("VERDICT M1 : lecture echouee.");
    return;
  }

  const brut = (lu.brut === null || lu.brut === undefined) ? "" : String(lu.brut);
  dire("longueur de l'etiquette brute : " + brut.length + " caractere(s)");

  // CAS « etiquette absente » : jamais importe (etat normal).
  if (brut === "") {
    dire("");
    dire("CAS « ETIQUETTE ABSENTE » : ce document n'a jamais recu d'import MD.");
    dire("(etat NORMAL, ce n'est pas une erreur)");
    const mapBrut = lireMapBrute(doc);
    dire("mapping " + LABEL_STYLE_MAP + " : " + (mapBrut ? "present" : "absent"));
    dire("VERDICT M1 : jamais importe -> la liste du panneau aura 0 ligne.");
    return;
  }

  // CAS « etiquette presente » : on tente de la decoder.
  const fp = decoderEtiquettePlate(brut);
  if (!fp.v) {
    dire("");
    dire("CAS « ETIQUETTE PRESENTE mais ILLISIBLE » : la marque de version 'v' est absente.");
    dire("brut (tronque a 200) : " + brut.substring(0, 200));
    dire("VERDICT M1 : etiquette corrompue ou format inattendu (pas « jamais importe »).");
    return;
  }

  // CAS « identite lue » : on expose les champs.
  dire("");
  dire("identite de la source :");
  dire("  version (v)     : " + fp.v);
  dire("  nom             : " + fp.name);
  dire("  chemin          : " + fp.path);
  dire("  taille          : " + fp.size + " caractere(s) au moment de l'import");
  dire("  empreinte       : " + fp.checksum);
  dire("  modifie (stamp) : " + formaterDateMs(fp.modified));

  const mapBrut = lireMapBrute(doc);
  dire("mapping " + LABEL_STYLE_MAP + " : " + (mapBrut ? "present" : "absent"));

  dire("");
  dire("VERDICT M1 : identite lue depuis le DOCUMENT (pas depuis le disque).");
  dire("=> chemin, nom, taille, date, empreinte exposes au panneau.");
}

/* Formate le stamp de date stocke (millisecondes en texte) sans jamais
   afficher « Invalid Date » si la valeur est vide ou non numerique. */
function formaterDateMs(valeur) {
  if (!valeur) return "(non stocke)";
  const n = Number(valeur);
  if (!isFinite(n)) return String(valeur) + "  (nombre non exploitable)";
  try {
    return String(valeur) + "  -> " + new Date(n).toLocaleString();
  } catch (eDate) {
    return String(valeur) + "  (conversion de date impossible)";
  }
}

/* Lecture utilitaire du mapping (pour dire present/absent sans le decoder ici). */
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
/* Sortie du journal vers un FICHIER                                   */
/* L'UXP de ce runtime n'expose PAS de presse-papier (mesure du 30/09 :   */
/* uxp.clipboard.copyText indisponible) et un panneau UXP ne laisse pas   */
/* selectionner le texte. La seule sortie fiable est donc un FICHIER .txt */
/* sur le disque, que l'on peut ouvrir et copier normalement.            */
/* ------------------------------------------------------------------ */
const NOM_FICHIER_JOURNAL = "sonde_import_md_journal.txt";
let dossierJournal = null;
let cheminJournal = "(non determine)";
let minuteurEcriture = null;

function journalTexte() {
  return journal.join("\n");
}

// Bandeau de STATUT : vert = succes, rouge = echec.
// C'est le signal VISIBLE que reclame FJD : sans lui, le fichier .txt est
// ecrit sur le disque mais personne ne le voit dans le panneau. On affiche
// donc, en haut du panneau, un bandeau colore impossible a manquer.
function afficherStatut(estOk, texte) {
  const bandeau = document.getElementById("statut");
  if (!bandeau) return;
  bandeau.className = estOk ? "ok" : "ko";
  bandeau.textContent = (estOk ? "SUCCES  " : "ECHEC  ") + texte;
}

async function resoudreDossierJournal() {
  if (dossierJournal) return dossierJournal;
  const uxp = require("uxp");
  const lfs = (uxp && uxp.storage) ? uxp.storage.localFileSystem : null;
  if (!lfs) throw new Error("uxp.storage.localFileSystem absent");
  // On prefere le dossier de DONNEES du plugin : son chemin est STABLE et
  // connu a l'avance (…/UXP/PluginsStorage/IDSN/<ver>/Developer/<plugin>/PluginData),
  // ce qui permet de retrouver le journal sans le chercher. Repli sur le
  // dossier temporaire si jamais il n'est pas disponible.
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
    // On recree le fichier a chaque fois (overwrite) pour garantir qu'il n'y a
    // AUCUN doublon : on veut toujours la photo EXACTE du journal courant.
    const fichier = await dossier.createFile(NOM_FICHIER_JOURNAL, { overwrite: true });
    await fichier.write(journalTexte(), { append: false });
    cheminJournal = fichier.nativePath || cheminJournal;
    // Bandeau de succes : visible en permanence, meme pendant les ecritures
    // silencieuses (le chemin du fichier reste ainsi sous les yeux).
    afficherStatut(true,
      "journal enregistre :\n" + cheminJournal +
      "\n(" + journalTexte().length + " caracteres)");
    if (!silencieux) {
      ok("journal ecrit dans un fichier",
        cheminJournal + "  (" + journalTexte().length + " caracteres)");
      dire("      -> ouvrez ce fichier dans un editeur de texte : le contenu est copiable.");
    }
    return true;
  } catch (e) {
    afficherStatut(false, "ecriture du journal : " + messageDe(e));
    if (!silencieux) ko("ecriture du journal dans un fichier", e);
    return false;
  }
}

// Ecriture automatique differree : appelee a chaque dire(), elle laisse
// passer 400 ms pour laisser un test ecrire plusieurs lignes d'un coup,
// puis recopie le journal complet dans le fichier, sans bruit a l'ecran.
function programmerEcritureJournal() {
  if (minuteurEcriture) return;
  minuteurEcriture = setTimeout(function () {
    minuteurEcriture = null;
    ecrireJournalFichier(true);
  }, 400);
}

/* ------------------------------------------------------------------ */
/* Bouton « Enregistrer le journal »                                   */
/* ------------------------------------------------------------------ */
async function copierJournal() {
  dire("--- sortie du journal ---");
  const texte = journalTexte();
  if (!texte) {
    dire("ECHEC sortie -> le journal est vide, il n'y a rien a enregistrer.");
    return;
  }

  // 1) Presse-papier UXP : mesure du 30/09 => ABSENT dans ce runtime.
  try {
    const uxp = require("uxp");
    if (uxp && uxp.clipboard && typeof uxp.clipboard.copyText === "function") {
      uxp.clipboard.copyText(texte);
      ok("presse-papier", texte.length + " caractere(s) copies");
      return;
    }
    dire("      presse-papier UXP : ABSENT dans ce runtime -> on ecrit un fichier.");
  } catch (eClip) {
    dire("      presse-papier UXP : " + messageDe(eClip));
  }

  // 2) Fichier : la route qui fonctionne reellement.
  const ecrit = await ecrireJournalFichier(false);
  if (!ecrit) {
    dire("      aucune sortie disponible : impossible de recuperer ce journal.");
  }
}

/* ------------------------------------------------------------------ */
/* Cablage des boutons                                                 */
/* ------------------------------------------------------------------ */
function cabler() {
  const liens = [
    ["btn_dom", testerDom],
    ["btn_doscript", testerDoScript],
    ["btn_moteur", testerMoteur],
    ["btn_fichier", testerFichier],
    ["btn_negatif", testerNegatif],
    ["btn_identite", testerIdentite],
    ["btn_copier", copierJournal]
  ];

  for (let i = 0; i < liens.length; i++) {
    const bouton = document.getElementById(liens[i][0]);
    if (bouton) {
      bouton.addEventListener("click", liens[i][1]);
    } else {
      dire("ECHEC cablage -> bouton introuvable : " + liens[i][0]);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Demarrage                                                           */
/* ------------------------------------------------------------------ */
try {
  demarrer();
  cabler();
  dire("");
  dire("Panneau pret. Cliquez les tests 1 a 6.");
  // Ecrit le journal immediatement pour REVELER le chemin du fichier de
  // sortie : c'est notre seul moyen de recuperer la preuve (pas de
  // presse-papier UXP, pas de selection dans un panneau).
  setTimeout(function () { ecrireJournalFichier(false); }, 600);
} catch (e) {
  ko("demarrage du panneau", e);
}

/* Expose l'objet pour inspection depuis la console de l'hote */
window.sondeImportMd = {
  journal: journal,
  dom: testerDom,
  doScript: testerDoScript,
  moteur: testerMoteur,
  fichier: testerFichier,
  negatif: testerNegatif,
  identite: testerIdentite,
  copier: copierJournal,
  statut: afficherStatut,
  cheminFichierJournal: function () { return cheminJournal; }
};

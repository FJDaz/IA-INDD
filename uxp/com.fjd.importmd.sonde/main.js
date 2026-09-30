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

/* Le dossier du projet TEL QUE SAISI dans le panneau (champ « chemin »).
   Les constantes ci-dessus ne sont que des valeurs par defaut : sans cette
   resolution, les tests moteur chercheraient import_md.jsx dans le dossier
   placeholder /chemin/vers/... et echoueraient meme sur une installation
   correcte. Le champ est prerempli avec le chemin du .md de reference : on
   en deduit le dossier (un .md/.jsx -> on prend le parent ; sinon le champ
   est deja un dossier). */
function dossierProjet() {
  const champ = document.getElementById("chemin");
  let v = (champ && champ.value) ? String(champ.value).trim() : "";
  if (!v) v = CHEMIN_MD;
  v = v.replace(/\/+$/, "");
  if (/\.(md|jsx)$/i.test(v)) {
    const i = v.lastIndexOf("/");
    if (i > 0) v = v.substring(0, i);
  }
  return v;
}

function cheminMoteur() {
  return dossierProjet() + "/import_md.jsx";
}

/* DEVINER le dossier du projet sans rien taper : le panneau sait ou il est
   installe. Le plugin vit dans <projet>/uxp/com.fjd.importmd.sonde, donc
   deux parents au-dessus = le dossier du projet. On ne l'ecrit nulle part
   dans le source (aucun chemin personnel en dur : la portabilite est
   preservee) — on le DEDUIT a l'execution.
   Ne remplace JAMAIS une valeur deja saisie par l'utilisateur, et echoue en
   silence : en cas d'echec on retombe sur le placeholder, le champ reste
   utilisable a la main. */
async function devinerDossierProjet() {
  try {
    const champ = document.getElementById("chemin");
    if (!champ) return false;

    const uxp2 = require("uxp");
    const lfs = (uxp2 && uxp2.storage) ? uxp2.storage.localFileSystem : null;
    if (!lfs || typeof lfs.getPluginFolder !== "function") return false;

    const dossier = await lfs.getPluginFolder();
    if (!dossier || typeof dossier.nativePath !== "string") return false;

    /* On remonte DEUX niveaux par le TEXTE du chemin, sans dependre d'une
       methode « parent » dont l'existence n'est pas certifiee ici :
       <projet>/uxp/com.fjd.importmd.sonde  ->  <projet>. */
    let chemin = dossier.nativePath.replace(/\/+$/, "");
    for (let i = 0; i < 2; i++) {
      const j = chemin.lastIndexOf("/");
      if (j <= 0) return false;
      chemin = chemin.substring(0, j);
    }
    if (chemin.charAt(0) !== "/") return false;

    // On ne remplace pas un chemin deja saisi par l'utilisateur.
    const actuel = (champ.value || "").trim();
    if (actuel && actuel.indexOf(PROJET_DIR) !== 0) return false;

    champ.value = chemin + "/atelier_importateur_md.md";
    dire("dossier du projet deduit depuis l'emplacement du panneau :");
    dire("      " + chemin);
    return true;
  } catch (e) {
    dire("dossier du projet non deduit (" + messageDe(e) + ") -> saisir le champ a la main.");
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */
const journal = [];

/* Index de depart de l'AFFICHAGE a l'ecran. Le tableau « journal » reste
   ENTIER (c'est lui qui part sur le disque, donc la preuve est preservee),
   mais l'ecran ne montre que les lignes a partir d'ici. Sans cela, chaque
   clic rajoutait ses lignes aux precedentes et l'ecran devenait illisible
   (constat FJD du 30/09 : « on s'y retrouve plus trop »). */
let debutAffichage = 0;

/* Purge l'ECRAN seulement : le fichier sur disque garde tout. Appelee au
   debut de chaque clic (cf. cabler) pour qu'un clic = un ecran propre. */
function purgerEcranJournal() {
  debutAffichage = journal.length;
  const zone = document.getElementById("journal");
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
  const zone = document.getElementById("journal");
  if (zone) {
    zone.textContent = journal.slice(debutAffichage).join("\n");
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
    'var CHEMIN = ' + chaineExtendScript(cheminMoteur()) + ';\n' +
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
/* MISSION 2 (Chapitre Panneau) — LA LISTE DES SOURCES ET SES SIGNAUX   */
/* ------------------------------------------------------------------ */
/* Objet : afficher un TABLEAU, une ligne par source (1 source par        */
/* document, cf. ROADMAP question 1), portant :                          */
/*   - le signal d'etat : identique / modifie dans la source / source     */
/*     absente ;                                                         */
/*   - le chemin de la source ;                                          */
/*   - la date de derniere modification ;                                */
/*   - les caracteristiques : nombre de mots et nombre de signes.        */
/*                                                                       */
/* REPARTITION DES ROLES (regle du projet « le panneau PROPOSE, le moteur */
/* TRANCHE ») :                                                          */
/*   - l'ETAT est decide par m05DecideState() DANS LE MOTEUR (charge sans  */
/*     executer main(), meme parade que le test 3). Le panneau ne          */
/*     recalcule JAMAIS la somme de controle : deux endroits qui          */
/*     decideraient la meme chose finiraient par diverger.                */
/*   - les CARACTERISTIQUES viennent de la lecture disque deja certifiee   */
/*     par le test 4 (getEntryWithUrl + read, clef dateModified).          */
/*                                                                       */
/* CONTROLE NEGATIF OBLIGATOIRE : document vierge => 0 ligne. Jamais une  */
/* ligne vide, jamais un etat invente. Un document vierge et une lecture  */
/* ratee restent DEUX cas distincts (meme regle qu'en Mission 1).         */
/* ------------------------------------------------------------------ */

/* Libelles lisibles des etats rendus par le moteur. */
function libelleEtat(etat) {
  if (etat === "identique") return "identique";
  if (etat === "different") return "modifie dans la source";
  if (etat === "source_absente") return "source absente";
  if (etat === "jamais_importe") return "jamais importe";
  return "(" + etat + ")";
}

/* La REPONSE EN CLAIR, telle qu'elle doit s'afficher dans le bandeau.
   Le bandeau est la seule chose du panneau qu'on ne peut pas rater : il dit
   donc une PHRASE, pas un code d'etat interne. C'est ce qui permet de
   comprendre ce qui se passe sans connaitre le vocabulaire du moteur. */
function phraseEtat(etat) {
  if (etat === "identique") return "la source n'a pas bouge depuis l'import";
  if (etat === "different") return "la source A BOUGE depuis l'import";
  if (etat === "source_absente") return "la source n'est PLUS LA (renommee, deplacee ou supprimee)";
  if (etat === "jamais_importe") return "ce document n'a jamais recu d'import MD";
  return "etat rendu par le moteur : " + libelleEtat(etat);
}

/* Vide le corps du tableau sans innerHTML (retrait explicite des enfants). */
function viderListe() {
  const corps = document.getElementById("liste_corps");
  if (!corps) return null;
  while (corps.firstChild) corps.removeChild(corps.firstChild);
  return corps;
}

function ajouterLigneListe(corps, cellules) {
  const ligne = document.createElement("tr");
  for (let i = 0; i < cellules.length; i++) {
    const cellule = document.createElement("td");
    cellule.textContent = cellules[i];
    ligne.appendChild(cellule);
  }
  corps.appendChild(ligne);
}

function majNoteListe(nb, detail) {
  const note = document.getElementById("liste_note");
  if (!note) return;
  note.textContent = (nb === 0 ? "0 source" : nb + " source") + "  -  " + detail;
}

/* Compte les lignes REELLEMENT affichees dans le tableau.
   Necessaire a l'actualisation (Mission 3), qui n'efface pas l'historique : la
   note doit annoncer le TOTAL affiche, et pas seulement ce que la mesure
   vient d'ajouter. N'utilise que des API deja certifiees dans ce fichier
   (childNodes / nodeType), pas « children » ni « childElementCount ». */
function compterLignesListe() {
  const corps = document.getElementById("liste_corps");
  if (!corps || !corps.childNodes) return 0;
  let n = 0;
  for (let i = 0; i < corps.childNodes.length; i++) {
    if (corps.childNodes[i].nodeType === 1) n++;
  }
  return n;
}

/* Date courte JJ/MM/AAAA HH:MM, sans jamais afficher « Invalid Date ». */
function formaterDateCourte(ms) {
  const n = Number(ms);
  if (!isFinite(n) || n <= 0) return "(inconnue)";
  const d = new Date(n);
  const p2 = (v) => (v < 10 ? "0" + v : String(v));
  return p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() +
    " " + p2(d.getHours()) + ":" + p2(d.getMinutes());
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

/* L'ETAT, decide par le moteur. La copie sans « main(); » est ecrite dans le
   dossier du moteur (indispensable : il resout son journal via $.fileName)
   puis supprimee aussitot — meme parade que le test 3. */
async function etatParLeMoteur(brut, chemin) {
  if (!inDesignModule || typeof inDesignModule.app.doScript !== "function") {
    return { etat: null, erreur: "app.doScript indisponible" };
  }
  const sl = inDesignModule.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;

  const src =
    'var CHEMIN = ' + chaineExtendScript(cheminMoteur()) + ';\n' +
    'var etat = "(non calcule)";\n' +
    'try {\n' +
    '  if (typeof m05DecideState !== "function") {\n' +
    '    var PARENT = new File(CHEMIN).parent.fsName;\n' +
    '    var f = new File(CHEMIN); f.encoding = "UTF-8"; f.open("r");\n' +
    '    var txt = f.read(); f.close();\n' +
    '    var idx = txt.lastIndexOf("\\nmain();");\n' +
    '    if (idx < 0) { etat = "ABANDON:main();introuvable"; }\n' +
    '    else {\n' +
    '      var tmp = new File(PARENT + "/_sonde_moteur_sans_main.jsx");\n' +
    '      tmp.encoding = "UTF-8"; tmp.open("w");\n' +
    '      tmp.write(txt.substring(0, idx) + "\\n"); tmp.close();\n' +
    '      $.evalFile(tmp); tmp.remove();\n' +
    '    }\n' +
    '  }\n' +
    '  if (typeof m05DecideState === "function") {\n' +
    '    etat = String(m05DecideState(' + chaineExtendScript(brut) + ', ' +
                     chaineExtendScript(chemin) + '));\n' +
    '  }\n' +
    '} catch (e) { etat = "ERREUR:" + e.message; }\n' +
    'etat;';

  try {
    return { etat: String(inDesignModule.app.doScript(src, lang)), erreur: null };
  } catch (e) {
    return { etat: null, erreur: e };
  }
}

/* Les CARACTERISTIQUES : lecture disque reelle (route certifiee au test 4).
   Une lecture ratee rend une erreur, JAMAIS des compteurs inventes ni zero. */
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

    // Clef exacte mesuree au test 4 : dateModified (PAS modificationDate).
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

/* Mission 2 : la liste des sources. Mission 3 : le MEME calcul, relance par le
   bouton « Actualiser ». Le bouton n'ajoute AUCUNE logique de mesure — il
   n'ajoute qu'un DECLENCHEUR. Seule difference, l'affichage :
     - sans option            -> le tableau repart de zero (bouton 7, le test) ;
     - garderHistorique:true  -> la mesure est AJOUTEE au tableau, donc l'etat
       precedent reste visible : on VOIT la bascule (« identique » ->
       « source absente ») au lieu de la perdre. */
async function construireListe(options) {
  const garderHistorique = !!(options && options.garderHistorique === true);
  const etiquetteMode = garderHistorique ? "M3" : "M2";
  const dejaAffichees = garderHistorique ? compterLignesListe() : 0;

  titre(etiquetteMode + (garderHistorique ? "  actualisation de la liste" : "  la liste des sources"));
  dire(garderHistorique
    ? "clic « Actualiser » recu a " + new Date().toLocaleTimeString()
    : "clic recu a " + new Date().toLocaleTimeString());
  if (garderHistorique) {
    dire("mode : actualisation SANS effacement (" + dejaAffichees + " ligne(s) deja affichee(s))");
    dire("      lecture seule : rien n'est ecrit dans le document.");
  }

  const corps = garderHistorique
    ? document.getElementById("liste_corps")
    : viderListe();
  if (!corps) { ko("tableau de la liste", "element #liste_corps introuvable"); return; }

  // Note de bas de tableau : elle annonce le TOTAL affiche, historique compris.
  // En mode test, dejaAffichees vaut 0 : le texte reste celui de la Mission 2.
  const mentionHistorique = dejaAffichees > 0
    ? " - historique conserve (" + dejaAffichees + " ligne(s) precedente(s))"
    : "";
  const note = function (detail) { majNoteListe(dejaAffichees, detail + mentionHistorique); };

  if (!inDesignModule) {
    inDesignModule = essai("require('indesign')", () => require("indesign"));
  }
  if (!inDesignModule) {
    dire("Suite impossible : require('indesign') a echoue.");
    note("module indesign indisponible");
    afficherStatut(false, "Liste impossible : require('indesign') a echoue");
    return;
  }
  const app = inDesignModule.app;

  let nbDocs = 0;
  try {
    nbDocs = app.documents.length;
  } catch (eDoc) {
    ko("app.documents.length", eDoc);
    note("nombre de documents illisible");
    afficherStatut(false, "Liste impossible : app.documents illisible");
    return;
  }

  // CAS 1 — aucun document ouvert : 0 ligne (ce n'est pas une lecture ratee).
  if (nbDocs === 0) {
    dire("documents ouverts : 0");
    dire("CAS « AUCUN DOCUMENT OUVERT » -> 0 ligne ajoutee.");
    if (dejaAffichees > 0) {
      dire("      => " + dejaAffichees + " ligne(s) precedente(s) CONSERVEE(S) (historique non efface).");
    }
    note("aucun document ouvert");
    afficherStatut(true, "aucun document ouvert dans InDesign - il n'y a rien a regarder");
    return;
  }

  let doc = null;
  try {
    doc = app.activeDocument;
  } catch (eAct) {
    ko("app.activeDocument", eAct);
    note("document actif illisible");
    afficherStatut(false, "Liste impossible : app.activeDocument illisible");
    return;
  }
  essai("document actif", () => doc.name);

  // Lecture de l'etiquette (les deux routes mesurees en Mission 1).
  const lu = await lireEtiquetteDocument(doc);
  dire("route utilisee : " + lu.route);

  // CAS 2 — lecture ratee : erreur reelle, jamais confondue avec un document vierge.
  if (lu.route === "aucune" && lu.erreur) {
    dire("CAS « LECTURE RATEE » : aucune route n'a pu lire l'etiquette.");
    dire("=> ce n'est PAS un document vierge : c'est une erreur reelle.");
    note("lecture ratee - PAS un document vierge");
    afficherStatut(false, "Lecture de l'etiquette ratee (voir journal)");
    return;
  }

  const brut = (lu.brut === null || lu.brut === undefined) ? "" : String(lu.brut);
  dire("longueur de l'etiquette brute : " + brut.length + " caractere(s)");

  // CAS 3 — etiquette absente : document vierge => CONTROLE NEGATIF = 0 ligne.
  if (brut === "") {
    dire("CAS « ETIQUETTE ABSENTE » : document sans import MD.");
    dire("VERDICT " + etiquetteMode + " : 0 ligne ajoutee (controle negatif satisfait).");
    note("document sans import - 0 ligne (normal)");
    afficherStatut(true, "ce document n'a jamais recu d'import MD - il n'y a rien a regarder");
    return;
  }

  const fp = decoderEtiquettePlate(brut);

  // CAS 4 — etiquette presente mais illisible : ni vierge, ni lisible.
  if (!fp.v) {
    dire("CAS « ETIQUETTE PRESENTE mais ILLISIBLE » -> 0 ligne.");
    dire("brut (tronque a 200) : " + brut.substring(0, 200));
    note("etiquette illisible - PAS un document vierge");
    afficherStatut(false, "Etiquette presente mais illisible (voir journal)");
    return;
  }

  // CAS 5 — une source a lister.
  const chemin = fp.path ? String(fp.path) : "";
  dire("nom enregistre : " + (fp.name || "(sans nom)"));
  dire("chemin         : " + (chemin || "(vide dans l'etiquette)"));

  // L'ETAT : c'est le moteur qui tranche (le panneau ne recalcule rien).
  const verdict = await etatParLeMoteur(brut, chemin);
  let etat = verdict.etat;
  let etatIndetermine = false;
  dire("etat rendu par le moteur : " + etat);
  if (verdict.erreur) {
    ko("etat par le moteur", verdict.erreur);
    etatIndetermine = true;
  } else if (!etat || etat.indexOf("ERREUR:") === 0 || etat.indexOf("ABANDON") === 0) {
    dire("      => le moteur n'a PAS rendu d'etat exploitable.");
    etatIndetermine = true;
  }

  // Les CARACTERISTIQUES : lecture disque reelle.
  const car = await caracteristiquesDisque(chemin);
  let mots, signes, dateTexte;
  if (car.erreur) {
    // Quand le moteur a deja tranche « source absente », l'echec de la lecture
    // disque est la CONSEQUENCE attendue, pas une panne : on ne le presente
    // donc pas comme un ECHEC (cas limite de la Mission 3).
    if (etat === "source_absente") {
      dire("      source absente : lecture disque impossible PAR CONSEQUENCE (attendu, pas une panne).");
      dire("      => compteurs NON affiches (aucun chiffre invente).");
    } else {
      ko("caracteristiques (lecture disque)", car.erreur);
      dire("      => source illisible : compteurs NON affiches (aucun chiffre invente).");
    }
    mots = "(non lues)";
    signes = "(non lues)";
    // Repli honnete : la taille archivee au moment de l'import, et sa date.
    dateTexte = fp.modified
      ? formaterDateCourte(fp.modified) + " (import)"
      : "(inconnue)";
  } else {
    mots = String(car.mots);
    signes = String(car.signes);
    dateTexte = formaterDateCourte(car.dateMs);
  }

  ajouterLigneListe(corps, [
    etatIndetermine ? "(indetermine)" : libelleEtat(etat),
    chemin || (fp.name || "(sans nom)"),
    dateTexte,
    mots,
    signes
  ]);

  const detailNote = etatIndetermine
    ? "etat indetermine - voir le journal"
    : libelleEtat(etat) + " - " + mots + " mot(s), " + signes + " signe(s)";
  const totalAffiche = dejaAffichees + 1;
  majNoteListe(totalAffiche, detailNote + mentionHistorique);
  // BANDEAU — on y met la REPONSE EN CLAIR (cf. phraseEtat). C'est le signal
  // principal du panneau : il ne doit contenir ni code interne ni chemin de
  // fichier (l'ecriture automatique du journal ne l'ecrase plus, cf. le
  // correctif du 30/09 dans ecrireJournalFichier).
  afficherStatut(!etatIndetermine,
    etatIndetermine
      ? "je n'ai pas pu savoir l'etat de la source (voir le journal ci-dessous)"
      : phraseEtat(etat));

  dire("");
  dire("VERDICT " + etiquetteMode + " : " + totalAffiche +
    " ligne(s) affichee(s), derniere mesure = " +
    (etatIndetermine ? "etat indetermine" : libelleEtat(etat)) + ".");

  // Cas limite de la Mission 3 : la source a disparu entre deux actualisations.
  // L'etat vient du moteur (« source absente »), il est rendu SANS erreur, et
  // la ligne precedente reste affichee (aucun effacement de l'historique).
  if (etat === "source_absente") {
    dire("      => SOURCE ABSENTE : la source n'est plus sur le disque a cet instant.");
    dire("      => rendu SANS erreur" + (garderHistorique
      ? " et SANS effacement : les " + dejaAffichees + " ligne(s) precedente(s) restent affichee(s)."
      : "."));
  }
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
    // BANDEAU — DEFECT CORRIGE LE 30/09 : cette ecriture AUTOMATIQUE (declenchee
    // 400 ms apres chaque « dire ») ecrasait le bandeau et REMPLACAIT le
    // resultat de la mesure par un chemin de fichier. Consequence : FJD
    // cliquait, le resultat apparaissait, puis disparaissait aussitot —
    // « pas visible dans le panneau ». Le bandeau n'est donc mis a jour que
    // sur une ACTION EXPLICITE (bouton « Enregistrer le journal » ou demarrage).
    if (!silencieux) {
      afficherStatut(true,
        "journal enregistre :\n" + cheminJournal +
        "\n(" + journalTexte().length + " caracteres)");
      ok("journal ecrit dans un fichier",
        cheminJournal + "  (" + journalTexte().length + " caracteres)");
      dire("      -> ouvrez ce fichier dans un editeur de texte : le contenu est copiable.");
    }
    return true;
  } catch (e) {
    // L'echec reste TOUJOURS visible, meme en ecriture automatique : un
    // journal qui ne s'ecrit plus est une panne, pas un detail.
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
/* Q7 — LE TUYAU : par quel canal un argument peut-il voyager ?        */
/* ------------------------------------------------------------------ */
/* Question unique : par quel chemin le panneau peut-il TRANSMETTRE une
   valeur au moteur ? Trois candidats sont mesures ensemble, chacun
   journalise separement ; aucun chiffre n'est invente : ce que le moteur
   renvoie est recopie tel quel, y compris une erreur.

   Ce test N'ECRIT RIEN dans le document : il fait seulement voyager un
   temoin (une chaine reconnaissable) et le lit au retour. */
async function testerCanal() {
  titre("Q7  le tuyau : quel canal porte un argument ?");
  dire("lecture seule : aucun octet n'est ecrit dans le document.");

  // Meme idiome que les autres sondes : charger le module InDesign s'il ne
  // l'est pas encore. Sans cette ligne, la sonde demandait doScript a un
  // module pas encore charge et repondait « indisponible » a tort (observe
  // au premier essai du 30/09).
  if (!inDesignModule) {
    inDesignModule = essai("require('indesign')", () => require("indesign"));
  }
  if (!inDesignModule || typeof inDesignModule.app.doScript !== "function") {
    dire("Non mesurable : app.doScript indisponible (cf. Q2).");
    return;
  }
  const sl = inDesignModule.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;

  // Le temoin : une chaine assez reconnaissable pour ne jamais se confondre
  // avec un fragment du moteur. L'horodatage evite qu'une vieille reponse
  // (cache, relecture) ne passe pour un succes.
  const TEMOIN = "TEMOIN-20260930-" + (new Date().getTime());

  // Les ARGUMENTS A TRIMBALLER — pas un temoin seul : on transporte deja la
  // forme reelle du tube (Appelant / Action / Chemin). Si le canal passe un
  // seul temoin mais perd les suivants, ce test le dit.
  const ARGS = [
    TEMOIN,
    "Appelant=panneau",
    "Action=importer",
    "Chemin=/tmp/source.md"
  ];

  // --- Canal C, cote panneau : on ecrit un petit fichier temoin dans NOTRE
  //     dossier de donnees (le meme que le journal). Le moteur le relira.
  let cheminTemoin = "(non ecrit)";
  try {
    const dossier = await resoudreDossierJournal();
    const f = await dossier.createFile("sonde_temoin_canal.txt", { overwrite: true });
    await f.write("temoin-fichier:" + TEMOIN, { append: false });
    cheminTemoin = f.nativePath || cheminTemoin;
    ok("C1  le panneau a ecrit un fichier temoin", cheminTemoin);
  } catch (eC1) {
    ko("C1  le panneau a ecrit un fichier temoin", eC1);
  }

  // Le script execute DANS le moteur : il recueille les trois temoins dans
  // une chaine « A##B##C » et la renvoie. Chaque temoin est isole dans son
  // try : un canal qui echoue ne cache pas les deux autres.
  const src =
    'var TEMOIN_A = ' + chaineExtendScript(TEMOIN) + ';\n' +
    'var A = "(non mesure)";\n' +
    'var B = "(non mesure)";\n' +
    'var C = "(non mesure)";\n' +
    'try { A = TEMOIN_A; } catch (eA) { A = "ERREUR:" + eA.message; }\n' +
    // On relit app.scriptArgs de PLUSIEURS facons, sans supposer sa forme :
    // le premier essai du 30/09 a montre qu'il existe ([object ScriptArg]).
    'try {\n' +
    '  var sa = app.scriptArgs;\n' +
    '  var p = [];\n' +
    '  p.push("type=" + (typeof sa));\n' +
    '  try { p.push("longueur=" + sa.length); } catch (eL) { p.push("longueur=ERREUR:" + eL.message); }\n' +
    '  try { p.push("[0]=" + sa[0]); } catch (e0) { p.push("[0]=ERREUR:" + e0.message); }\n' +
    '  if (sa && typeof sa.getArguments === "function") {\n' +
    '    try { var ga = sa.getArguments(); p.push("getArguments().length=" + ga.length); p.push("getArguments()[0]=" + ga[0]); }\n' +
    '    catch (eG) { p.push("getArguments=ERREUR:" + eG.message); }\n' +
    '  } else { p.push("getArguments=ABSENT"); }\n' +
    '  B = p.join(" | ");\n' +
    '} catch (eB) { B = "ERREUR:" + eB.message; }\n' +
    // Piste NON testee jusqu'au 30/09 : l'idiome InDesign veut que les
    // arguments d'un doScript arrivent dans l'objet `arguments` de NIVEAU
    // RACINE du script execute (et non dans app.scriptArgs). On lit donc
    // arguments.length et les 4 positions, sans rien supposer.
    'var B2 = "(non mesure)";\n' +
    'try {\n' +
    '  var n = -1, a0 = "(rien)", a1 = "(rien)", a2 = "(rien)", a3 = "(rien)";\n' +
    '  n = arguments.length;\n' +
    '  if (n > 0) { a0 = String(arguments[0]); }\n' +
    '  if (n > 1) { a1 = String(arguments[1]); }\n' +
    '  if (n > 2) { a2 = String(arguments[2]); }\n' +
    '  if (n > 3) { a3 = String(arguments[3]); }\n' +
    '  B2 = "n=" + n + " | [0]=" + a0 + " | [1]=" + a1 + " | [2]=" + a2 + " | [3]=" + a3;\n' +
    '} catch (eB2) { B2 = "ERREUR:" + eB2.message; }\n' +
    'try {\n' +
    '  var fC = new File(' + chaineExtendScript(cheminTemoin) + ');\n' +
    '  if (!fC.exists) { C = "ABSENT"; }\n' +
    '  else { fC.encoding = "UTF-8"; fC.open("r"); C = fC.read(); fC.close(); }\n' +
    '} catch (eC) { C = "ERREUR:" + eC.message; }\n' +
    'A + "##" + B + "##" + B2 + "##" + C;';

  function decouper(retour) {
    const p = String(retour).split("##");
    return { A: p[0], B: p[1], B2: p[2], C: p.slice(3).join("##") };
  }

  // Deux appels : le premier SANS argument supplementaire (reference), le
  // second AVEC les vrais arguments du tube. Attention : le 3e parametre de
  // app.doScript n'est PAS une chaine — l'essai du 30/09 a montre qu'il exige
  // une LISTE (« Array of Any Types attendu »). On passe donc ARGS.
  let r1 = null;
  let r2 = null;
  try { r1 = decouper(inDesignModule.app.doScript(src, lang)); }
  catch (e1) { ko("appel 1 (sans argument supplementaire)", e1); }
  try { r2 = decouper(inDesignModule.app.doScript(src, lang, ARGS)); }
  catch (e2) { ko("appel 2 (" + ARGS.length + " arguments)", e2); }

  // --- Canal A : le tube deja en service (Missions 1 a 3) — la valeur est
  //     ECRITE dans le texte du script. Attendu : le temoin revient identique.
  dire("A  tube « texte de source » (celui des Missions 1 a 3)");
  if (r1 && r1.A === TEMOIN) ok("A  temoin recu identique", "OUI");
  else ko("A  temoin recu identique", "recu = " + (r1 ? r1.A : "(pas d'appel)"));

  // --- Canal B : le 3e argument de app.doScript, relu par app.scriptArgs.
  //     Piste NON mesuree jusqu'ici. On ne juge pas : on recopie les deux
  //     valeurs (sans argument / avec argument).
  dire("B1  tube « app.doScript(..., ARGS) » relu par app.scriptArgs");
  dire("      sans argument : " + (r1 ? r1.B : "(pas d'appel)"));
  dire("      avec argument : " + (r2 ? r2.B : "(pas d'appel)"));
  const bArrive = !!(r2 && r2.B && r2.B.indexOf(TEMOIN) >= 0);
  if (bArrive) ok("B1  le temoin est ARRIVE par app.scriptArgs", "OUI");
  else dire("      => le temoin n'apparait PAS dans app.scriptArgs");

  // --- Canal B2 : le MEME appel, mais relu dans l'objet `arguments` de
  //     niveau racine du script execute. C'est l'idiome InDesign : le temoin
  //     ET les arguments suivants doivent s'y trouver dans l'ordre.
  dire("B2  tube « app.doScript(..., ARGS) » relu par l'objet `arguments` racine");
  dire("      sans argument : " + (r1 ? r1.B2 : "(pas d'appel)"));
  dire("      avec argument : " + (r2 ? r2.B2 : "(pas d'appel)"));
  const b2Complet = !!(r2 && r2.B2 &&
    r2.B2.indexOf(TEMOIN) >= 0 &&
    r2.B2.indexOf("Appelant=panneau") >= 0 &&
    r2.B2.indexOf("Action=importer") >= 0 &&
    r2.B2.indexOf("Chemin=/tmp/source.md") >= 0);
  const b2Partiel = !!(r2 && r2.B2 && r2.B2.indexOf(TEMOIN) >= 0 && !b2Complet);
  if (b2Complet) ok("B2  les 4 arguments sont ARRIVES, dans l'ordre", "OUI");
  else if (b2Partiel) ko("B2  arguments partiels", "le temoin passe, pas les suivants");
  else dire("      => rien n'est arrive par ce canal (voir la ligne ci-dessus)");

  // --- Canal C : un fichier temoin ecrit par le panneau, lu par le moteur.
  dire("C  tube « fichier temoin » ecrit par le panneau");
  if (r1 && r1.C === "temoin-fichier:" + TEMOIN) ok("C  fichier lu par le moteur", "OUI");
  else ko("C  fichier lu par le moteur", "recu = " + (r1 ? r1.C : "(pas d'appel)"));

  const aOk = !!(r1 && r1.A === TEMOIN);
  const cOk = !!(r1 && r1.C === "temoin-fichier:" + TEMOIN);
  const bOk = bArrive || b2Complet;
  afficherStatut(true,
    "tuyau — A (texte de source) : " + (aOk ? "PASSE" : "NON") +
    " · B1 (app.scriptArgs) : " + (bArrive ? "PASSE" : "NON") +
    " · B2 (arguments racine) : " + (b2Complet ? "PASSE" : (b2Partiel ? "PARTIEL" : "NON")) +
    " · C (fichier temoin) : " + (cOk ? "PASSE" : "NON"));
  dire("=> A est le tube deja en service. B1 et B2 portent le MEME appel :");
  dire("   B1 lit app.scriptArgs, B2 lit l'objet `arguments` racine du script.");
  if (bOk) dire("   => un canal d'arguments EXISTE (voir le detail ci-dessus).");
  else dire("   => aucun des deux canaux d'arguments ne rend les arguments ici.");
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
/* Mission 3 — bouton « Actualiser » : le MEME calcul que la Mission 2, relance
   a la demande et SANS rien ecrire dans le document (construireListe ne fait
   que lire : le document n'est jamais touche). Le declencheur est le seul
   apport ; l'ajout au tableau au lieu du remplacement est ce qui rend la
   bascule d'etat VISIBLE. */
function actualiserListe() {
  return construireListe({ garderHistorique: true });
}

/* ------------------------------------------------------------------ */
/* Lecture d'un fichier texte par la voie UXP (la seule API de lecture */
/* mesuree ici, cf. Q4). Retourne le texte, ou null si absent/illisible. */
/* ------------------------------------------------------------------ */
async function lireFichierTexte(chemin) {
  try {
    const uxp2 = require("uxp");
    const lfs = (uxp2 && uxp2.storage) ? uxp2.storage.localFileSystem : null;
    if (!lfs) return null;
    const entree = await lfs.getEntryWithUrl("file://" + chemin);
    if (!entree || !entree.isFile) return null;
    let t = await entree.read();
    return (typeof t === "string") ? t : String(t);
  } catch (e) {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* MISSION 4 - bouton « Importer »                                     */
/* C'est la SEULE action du panneau qui ECRIT dans le document. Le      */
/* panneau n'ecrit RIEN lui-meme : il donne l'ordre au moteur           */
/* (import_md.jsx), qui DECIDE et execute. Le tube porte la signature   */
/* gelee du 30/09/2026 : cas nommes Appelant / Action / Chemin.         */
/* ------------------------------------------------------------------ */
async function importerDepuisPanneau() {
  titre("Import - le panneau demande l'import au moteur");
  dire("cette action ECRIT dans le document (c'est la seule).");

  if (!inDesignModule) {
    inDesignModule = essai("require('indesign')", () => require("indesign"));
  }
  if (!inDesignModule || typeof inDesignModule.app.doScript !== "function") {
    dire("Non mesurable : app.doScript indisponible (cf. Q2).");
    afficherStatut(false, "import impossible : app.doScript indisponible");
    return;
  }
  const sl = inDesignModule.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;

  // La source : le chemin saisi dans le panneau (champ prerempli au demarrage).
  const champ = document.getElementById("chemin");
  const cheminMd = (champ && champ.value) ? String(champ.value).trim() : "";
  if (!cheminMd) {
    dire("Aucune source indiquee : renseigner le champ « chemin » (section Mesures techniques).");
    afficherStatut(false, "import impossible : aucune source Markdown indiquee");
    return;
  }

  // On verifie ICI que la source est lisible, AVANT d'occuper le moteur : une
  // erreur de chemin doit se lire dans le panneau, pas se perdre dans l'import.
  const texteSource = await lireFichierTexte(cheminMd);
  if (texteSource === null) {
    dire("Source introuvable ou illisible : " + cheminMd);
    afficherStatut(false, "import impossible : source introuvable\n" + cheminMd);
    return;
  }

  const cheminJsx = cheminMoteur();
  dire("source      : " + cheminMd + "  (" + texteSource.length + " caracteres)");
  dire("moteur      : " + cheminJsx);

  // Le tube - signature GELEE : 3 champs, cas nommes, dans cet ordre.
  const ARGS = [
    "Appelant=panneau",
    "Action=importer",
    "Chemin=" + cheminMd
  ];
  dire("tube        : " + ARGS.join("  |  "));

  // Le moteur doit s'executer COMME UN FICHIER : il deduit son journal
  // (LOG_FILE_PATH, ligne 15) et l'entree de menu de $.fileName. Une simple
  // chaine de source ne donnerait pas de $.fileName valable. On execute donc
  // une ENVELOPPE minuscule qui, dans le moteur : (1) depose le tube dans un
  // global a usage unique, (2) charge le VRAI import_md.jsx par $.evalFile.
  // ($.evalFile ne transmet aucun argument : c'est ce global que le moteur
  // relit, puis efface, pour qu'un appel ulterieur par le MENU reste normal.)
  const src =
    '$.global.__M04_TUBE_IMPOSE = [ ' +
      ARGS.map(function (a) { return chaineExtendScript(a); }).join(', ') +
    ' ];\n' +
    '$.evalFile(new File(' + chaineExtendScript(cheminJsx) + '));';

  // Le journal DU MOTEUR (pas le notre) : on le lit AVANT et APRES, et on ne
  // juge QUE sur les lignes ajoutees. Sans cela, une reussite precedente
  // passerait pour celle d'aujourd'hui.
  const cheminJournalMoteur = dossierProjet() + "/import_md_errors.log";
  const avant = await lireFichierTexte(cheminJournalMoteur);

  dire("Envoi au moteur...");
  try {
    const retour = inDesignModule.app.doScript(src, lang);
    dire("      retour brut : " + String(retour));
  } catch (eImport) {
    ko("appel du moteur", eImport);
    afficherStatut(false, "import : " + messageDe(eImport));
    return;
  }

  const apres = await lireFichierTexte(cheminJournalMoteur);
  if (apres === null) {
    dire("      journal du moteur illisible ou introuvable : " + cheminJournalMoteur);
    afficherStatut(false, "import envoye, mais journal moteur illisible\n" + cheminJournalMoteur);
    return;
  }

  let ajout;
  if (avant !== null && apres.indexOf(avant) === 0) ajout = apres.substring(avant.length);
  else ajout = apres;

  const lignes = ajout.split(/\r?\n/).filter(function (l) { return l.length > 0; });
  const dernieres = lignes.slice(-14);
  dire("      --- lignes AJOUTEES au journal du moteur ---");
  if (dernieres.length === 0) dire("      (aucune ligne ajoutee)");
  for (let i = 0; i < dernieres.length; i++) dire("      " + dernieres[i]);

  const vuAppel = /M04-repartiteur: appel PANNEAU/.test(ajout);
  const vuSource = /M04: source IMPOSEE par le PANNEAU/.test(ajout);
  if (vuAppel) ok("le moteur a vu l'appel du PANNEAU", "OUI");
  else ko("le moteur a vu l'appel du PANNEAU", "non trouve dans les lignes ajoutees");
  if (vuSource) ok("le moteur a utilise la source imposee", "OUI");
  else dire("      => source imposee non retrouvee (voir les lignes ci-dessus).");

  // MISSION 04 (30/09/2026, retour FJD) : « 1ere fois erreur silencieuse :
  // importer sans choisir un bloc. il faut une alerte. »
  // Le moteur REFUSE ce cas (aucun bloc de texte actif, appel PANNEAU) et
  // l'ecrit dans le journal. On l'annonce en clair — et surtout on ne dit PAS
  // « succes » alors que RIEN n'a ete importe.
  const vuRefus = /M04: REFUS/.test(ajout);
  if (vuRefus) {
    ko("le moteur a refuse l'import", "aucun bloc de texte actif");
    afficherStatut(false,
      "import REFUSE : aucun bloc de texte n'est actif dans le document.\n" +
      "Placez le curseur dans un bloc de texte (ou selectionnez un bloc), puis recliquez sur « Importer ».\n" +
      "Rien n'a ete modifie : ni le document, ni le place gun.\n" +
      "journal moteur : " + cheminJournalMoteur);
    return;
  }

  afficherStatut(true,
    "import demande au moteur.\n" +
    "appel PANNEAU vu : " + (vuAppel ? "OUI" : "NON") +
    "   |   source imposee : " + (vuSource ? "OUI" : "NON") +
    "\njournal moteur : " + cheminJournalMoteur);
}

/* ------------------------------------------------------------------ */
/* Menage de l'affichage — section « Mesures techniques »              */
/* Les boutons de mesure ont servi a CONSTRUIRE le panneau : on ne les   */
/* supprime pas (le controle negatif reste une preuve), on les range.    */
/* Repli par style.display : technique deja certifiee dans ce fichier    */
/* (aucune API incertaine : pas de <details>, pas de hidden).            */
/* ------------------------------------------------------------------ */
function basculerMesures() {
  const zone = document.getElementById("mesures");
  const bouton = document.getElementById("btn_mesures");
  if (!zone || !bouton) { dire("ECHEC menage -> section « Mesures techniques » introuvable."); return; }
  const etaitOuverte = zone.style.display !== "none";
  zone.style.display = etaitOuverte ? "none" : "block";
  bouton.textContent = etaitOuverte
    ? "Mesures techniques (repliees) - cliquer pour ouvrir"
    : "Mesures techniques (ouvertes) - cliquer pour replier";
}

function cabler() {
  const liens = [
    ["btn_dom", testerDom],
    ["btn_doscript", testerDoScript],
    ["btn_moteur", testerMoteur],
    ["btn_fichier", testerFichier],
    ["btn_negatif", testerNegatif],
    ["btn_identite", testerIdentite],
    ["btn_canal", testerCanal],
    // Enveloppe explicite : sans elle, l'evenement de clic serait passe comme
    // premier argument a construireListe (options), ce qui est fragile.
    ["btn_liste", function () { construireListe(); }],
    ["btn_copier", copierJournal],
    ["btn_actualiser", actualiserListe],
    ["btn_import", importerDepuisPanneau],
    ["btn_mesures", basculerMesures]
  ];

  for (let i = 0; i < liens.length; i++) {
    const bouton = document.getElementById(liens[i][0]);
    if (bouton) {
      // Purge de l'ECRAN avant chaque action : un clic = un ecran propre
      // (le fichier sur disque, lui, garde tout — c'est la preuve).
      // Exception : « Mesures techniques » (ouvrir/replier) ne doit RIEN
      // effacer, sinon ouvrir la zone ferait disparaitre le dernier resultat.
      if (liens[i][0] === "btn_mesures") {
        bouton.addEventListener("click", liens[i][1]);
      } else {
        const action = liens[i][1];
        bouton.addEventListener("click", function () {
          purgerEcranJournal();
          action();
        });
      }
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
  dire("Panneau pret. Les 4 boutons utiles : « Voir la liste des sources », « Actualiser », « Importer », « Enregistrer le journal ».");
  dire("Les mesures techniques (1 a 6) sont repliees en bas du panneau.");
  // Le dossier du projet est DEDUIT de l'emplacement du panneau : FJD n'a
  // rien a taper. Si la deduction echoue, le champ reste modifiable a la
  // main (on le dit dans le journal).
  devinerDossierProjet();
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
  liste: construireListe,
  actualiser: actualiserListe,
  importer: importerDepuisPanneau,
  copier: copierJournal,
  statut: afficherStatut,
  cheminFichierJournal: function () { return cheminJournal; }
};

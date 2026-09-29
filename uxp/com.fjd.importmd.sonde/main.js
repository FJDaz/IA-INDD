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
 *   Q4  Le garde-fou fonctionne-t-il ? Un controle NEGATIF qui DOIT echouer est
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
const CHEMIN_MD = "~/INDD/IMPORT_MD/atelier_importateur_md.md";
const CHEMIN_JSX = "~/INDD/IMPORT_MD/import_md.jsx";

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
  if (zone) zone.textContent = journal.join("\n");
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
/* Q3bis — notre moteur import_md.jsx est-il joignable sans l'executer ? */
/* Charge le fichier, SANS appeler main() : aucun dialogue ne s'ouvre.  */
/* ------------------------------------------------------------------ */
function testerMoteur() {
  titre("Q3bis  moteur import_md.jsx (charge, jamais execute)");

  if (!inDesignModule) {
    inDesignModule = essai("require('indesign')", () => require("indesign"));
  }
  if (!inDesignModule || typeof inDesignModule.app.doScript !== "function") {
    dire("Non mesurable : app.doScript indisponible (cf. Q3).");
    return;
  }

  const sl = inDesignModule.ScriptLanguage;
  const lang = sl ? sl.JAVASCRIPT : undefined;

  /* $.evalFile charge le fichier et definit ses fonctions dans le moteur
     ExtendScript. On ne rappelle PAS main() : la sonde ne doit ouvrir
     aucun dialogue. On verifie seulement que les fonctions cles existent,
     dont l'aiguillage d'etat de la mission 05. */
  const src =
    '$.evalFile("' + CHEMIN_JSX + '");\n' +
    "[" +
    "  typeof m05BuildFingerprint," +
    "  typeof m05DecideState," +
    "  typeof insertMarkdownWithStyles," +
    "  typeof resolveTargetStory" +
    "].join('|');";

  essai("$.evalFile(import_md.jsx) puis types des fonctions cles", () => {
    const r = inDesignModule.app.doScript(src, lang);
    const parties = String(r).split("|");
    const noms = [
      "m05BuildFingerprint",
      "m05DecideState",
      "insertMarkdownWithStyles",
      "resolveTargetStory"
    ];
    let bilan = [];
    for (let i = 0; i < noms.length; i++) {
      bilan.push(noms[i] + "=" + parties[i]);
    }
    if (String(r).indexOf("function") !== -1) {
      dire("      => moteur charge, fonctions visibles du cote ExtendScript.");
    } else {
      dire("      => moteur charge mais fonctions absentes : a examiner.");
    }
    return bilan.join("  ");
  });
}

/* ------------------------------------------------------------------ */
/* Lecture disque (.md) — le panneau doit pouvoir lire la source        */
/* ------------------------------------------------------------------ */
async function testerFichier() {
  titre("Lecture d'un .md sur le disque");

  const champ = document.getElementById("chemin");
  const chemin = (champ && champ.value) ? champ.value : CHEMIN_MD;

  try {
    const fs = require("fs");
    const stat = await fs.stat(chemin);
    ok("fs.stat", stat.size + " octets");

    const contenu = await fs.readFile(chemin, "utf8");
    ok("fs.readFile", contenu.length + " caracteres lus");
    dire("      debut : " + JSON.stringify(contenu.slice(0, 60)));
  } catch (e) {
    ko("lecture de " + chemin, e);
  }
}

/* ------------------------------------------------------------------ */
/* Q4 — CONTROLE NEGATIF : ce test DOIT echouer                        */
/* ------------------------------------------------------------------ */
function testerNegatif() {
  titre("Q4  controle negatif  (l'echec DOIT etre detecte)");

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
    ? "VERDICT Q4 : les deux echecs ont bien ete detectes et ecrits."
    : "VERDICT Q4 : AUCUN echec detecte -> le garde-fou est casse, la sonde est invalide.");
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
    ["btn_negatif", testerNegatif]
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
  dire("Panneau pret. Cliquez les tests 1 a 5.");
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
  negatif: testerNegatif
};

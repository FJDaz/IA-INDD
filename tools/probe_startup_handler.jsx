// ===========================================================================
//  probe_startup_handler.jsx -- GESTIONNAIRE de l'entree posee par
//  probe_startup.jsx (sonde de DEMARRAGE, mission 03 / etape 9, INDD)
//
//  Role : etre le declencheur (File) de l'entree de menu de sonde. Le clic
//  sur l'entree rejoue CE fichier et rien d'autre -- c'est exactement le
//  mecanisme dont depend l'entree "Importer un MD" (cf. Cas 31 du wiki).
//
//  Ce que la mesure doit etablir : qu'un File gestionnaire pose depuis un
//  script de DEMARRAGE est bien rejoue par un clic -- autrement dit que la
//  voie "script de demarrage" produit un declencheur VIVANT, et pas
//  seulement une entree de menu decorative.
//
//  Source PUREMENT ASCII (regle des sondes du projet).
// ===========================================================================

var LOG_PATH = "/tmp/probe_startup.log";

function hlog(msg) {
  try {
    var f = new File(LOG_PATH);
    f.encoding = "UTF-8";
    f.open("a");
    f.writeln("[" + new Date().toString() + "] " + msg);
    f.close();
  } catch (e) {
    // rien
  }
}

function ts(v) { try { return String(v); } catch (e) { return "<illisible>"; } }

// PIEGE (mesure fausse constatee le 28/09 sur la version precedente de cette sonde) :
// une fonction utilitaire du genre  function tt(v) { return typeof v; }
// appelee en  tt(typeof main)  renvoie  typeof "undefined"  =  "string".
// La ligne affichait donc  typeof main=string  alors que main etait absent.
// Ne JAMAIS passer un typeof deja calcule a une fonction qui fait un typeof.

var nDocs = -1;
try { nDocs = app.documents.length; } catch (e) {}
var nMenus = -1;
try { nMenus = app.menus.length; } catch (e) {}

// typeof sur un identifiant absent ne leve pas d'erreur : l'appel direct est sur.
// Temoins positifs (hlog, LOG_PATH sont declares DANS CE fichier) : sans eux,
// un "undefined" partout pourrait signifier "moteur casse" au lieu de "variable absente".
hlog("E/CLIC DECLENCHE sur l'entree de sonde de demarrage"
     + " | $.fileName=" + ts($.fileName)
     + " | app.name=" + ts(app.name)
     + " | app.version=" + ts(app.version)
     + " | documents.length=" + nDocs
     + " | menus.length=" + nMenus
     + " | typeof hlog=" + (typeof hlog)
     + " | typeof LOG_PATH=" + (typeof LOG_PATH)
     + " | typeof main=" + (typeof main)
     + " | typeof logToFile=" + (typeof logToFile));

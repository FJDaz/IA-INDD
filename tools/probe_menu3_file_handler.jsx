// probe_menu3_file_handler.jsx - COMPAGNON DE LA SONDE 3 (jetable)
//
// Ce fichier est pose comme GESTIONNAIRE D'EVENEMENT (handler: File, type
// autorise par la doc officielle Adobe) sur une action de menu de test.
// Il ne doit JAMAIS etre lance a la main depuis le panneau Scripts : c'est
// InDesign qui l'execute, au moment du clic sur l'entree [S3-D].
//
// Il est volontairement AUTO-SUFFISANT : il ne partage AUCUNE variable avec
// la sonde 3. Son seul lien est le chemin du journal, qu'il calcule depuis son
// propre $.fileName (avec repli sur un chemin en dur).
//
// Mesures apportees au journal :
//   - le gestionnaire File est-il vraiment execute au clic ?
//   - quel est le $.fileName vu par le gestionnaire ?
//   - le moteur qui l'execute voit-il les fonctions du script principal
//     (typeof main) et le global marqueur de la sonde ($.global.__S3_MARKER) ?
//     -> "function" / "string" = moteur partage ; "undefined" = moteur distinct,
//        auquel cas un pont app.doScript(File, ScriptLanguage.JAVASCRIPT) est
//        necessaire.
//
// Pur ASCII (lecon encodage).

// Chemin derive du script lui-meme ($.fileName) : aucune donnee personnelle.
var S3H_HARD_LOG = new File($.fileName).parent.fsName + "/probe_menu3.log";

function s3hStamp() {
    try { return String(new Date()); } catch (e) { return "(date indisponible)"; }
}

function s3hWrite(line) {
    var candidates = [];
    try {
        if ($.fileName) candidates.push(new File($.fileName).parent.fsName + "/probe_menu3.log");
    } catch (e0) {}
    candidates.push(S3H_HARD_LOG);
    for (var i = 0; i < candidates.length; i++) {
        try {
            var f = new File(candidates[i]);
            f.encoding = "UTF-8";
            if (f.open("a")) {
                f.write(s3hStamp() + " " + line + "\n");
                f.close();
                return candidates[i];
            }
        } catch (e1) {}
    }
    return "(aucun journal accessible)";
}

var seenFileName = "(indisponible)";
try { seenFileName = String($.fileName); } catch (e2) {}

s3hWrite("[S3-D] FICHIER GESTIONNAIRE (handler: File) : DECLENCHE" +
         " | $.fileName=" + seenFileName +
         " | typeof app=" + (typeof app) +
         " | typeof main=" + (typeof main) +
         " | typeof logToFile=" + (typeof logToFile) +
         " | typeof $.global.__S3_MARKER=" + (typeof $.global.__S3_MARKER));

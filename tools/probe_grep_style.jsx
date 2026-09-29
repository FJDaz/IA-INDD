// probe_grep_style.jsx — mesure : un GREP ne pose-t-il qu'UN seul style de paragraphe a la fois ?
// Cible : app.findGrepPreferences / app.changeGrepPreferences
// Sortie : /tmp/probe_grep_style.log

(function () {

    var LOG = "/tmp/probe_grep_style.log";
    var f = new File(LOG);
    f.encoding = "UTF-8";
    f.open("w");
    function log(t) { f.writeln(String(t)); }
    function line() { log("------------------------------------------------------------"); }

    log("=== probe_grep_style.jsx ===");
    log("date          : " + (new Date()).toString());
    log("app           : " + app.name + " " + app.version);
    log("documents au depart = " + app.documents.length);
    line();

    // ---- 0. structure : quelles proprietes parlent de style ? ----
    log("=== 0. app.findGrepPreferences : proprietes contenant 'tyle' ===");
    var fp = app.findGrepPreferences;
    var props = fp.reflect.properties;
    var n = 0;
    var trouvees = [];
    var i;
    for (i = 0; i < props.length; i++) {
        var nom = String(props[i].name);
        if (nom.indexOf("tyle") !== -1) {
            n++;
            trouvees.push(nom);
        }
    }
    log("proprietes totales = " + props.length);
    log("proprietes contenant 'tyle' = " + n);
    for (i = 0; i < trouvees.length; i++) { log("  - " + trouvees[i]); }
    line();

    log("=== 1. y a-t-il une variante PLURIELLE (plusieurs styles d'un coup) ? ===");
    var variantes = ["appliedParagraphStyles", "appliedCharacterStyles",
                     "paragraphStyles", "characterStyles", "appliedParagraphStyle"];
    for (i = 0; i < variantes.length; i++) {
        var v = variantes[i];
        var etat;
        try {
            var val = fp[v];
            etat = "PRESENT | typeof=" + (typeof val) + " | valeur=" + String(val);
        } catch (e) {
            etat = "ABSENT (" + e.message + ")";
        }
        log("  findGrepPreferences." + v + " -> " + etat);
    }
    line();

    log("=== 2. le style est-il bien UNE propriete scalaire (pas un tableau) ? ===");
    try {
        var st = fp.appliedParagraphStyle;
        var estTableau = (st instanceof Array);
        log("appliedParagraphStyle : typeof=" + (typeof st));
        log("appliedParagraphStyle : est un Array ? = " + estTableau);
        log("appliedParagraphStyle : reflect.name = " + st.reflect.name);
    } catch (e) {
        log("ERREUR lecture appliedParagraphStyle : " + e.message);
    }
    line();

    // ---- 3. contre-epreuve : une requete GREP reelle = combien de styles ? ----
    log("=== 3. contre-epreuve reelle : une requete, un seul style pose ===");

    var doc = null;
    var docCree = false;
    var stylesCrees = [];

    try {
        // story temoin : deux marques md de niveaux differents
        doc = app.documents.add();
        docCree = true;
        log("doc cree : stories=" + doc.stories.length +
            " | textFrames=" + doc.textFrames.length +
            " | pages=" + doc.pages.length);

        // un document neuf n'a aucun bloc de texte : on en cree un explicitement
        var page = doc.pages[0];
        var tf = page.textFrames.add();
        log("textFrame cree : null ? = " + (tf === null));
        var story = tf.parentStory;
        log("story obtenue : null ? = " + (story === null));

        story.contents = "# Titre Niveau 1\r## Titre Niveau 2\rParagraphe ordinaire.\r";
        story.recompose();
        log("story temoin : longueur=" + story.contents.length);
        log("story temoin : debut=" + story.contents.substring(0, 40).replace(/\r/g, "/"));

        // deux styles de paragraphe temoins
        var s1 = doc.paragraphStyles.add({ name: "ZZGREP Niveau1" });
        var s2 = doc.paragraphStyles.add({ name: "ZZGREP Niveau2" });
        stylesCrees.push(s1); stylesCrees.push(s2);
        log("styles crees : " + s1.name + " | " + s2.name);

        // UNE seule requete GREP : ^# + espace  ->  style1
        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        app.findGrepPreferences.findWhat = "^#\\s";
        app.changeGrepPreferences.changeTo = "";
        app.changeGrepPreferences.appliedParagraphStyle = s1;

        var nmodifs = doc.changeGrep();
        log("changeGrep(...) applique 1 seul style : modifications = " +
            (nmodifs === null ? "null" : nmodifs.length));

        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        story.recompose();

        // releve : quels styles sont reellement poses ?
        var paras = story.paragraphs;
        log("releve apres la requete (" + paras.length + " paragraphes) :");
        for (i = 0; i < paras.length; i++) {
            var pStyle = paras[i].appliedParagraphStyle.name;
            log("  p[" + i + "] texte=" + paras[i].contents.substring(0, 22).replace(/\r/g, "/") +
                " | style=" + pStyle);
        }
        log("");
        log("LECTURE : si UN seul passage suffisait a poser les 2 styles,");
        log("          on verrait ZZGREP Niveau1 ET ZZGREP Niveau2 ci-dessus.");
        line();

    } catch (e) {
        log("ERREUR | contexte=contre-epreuve GREP | message=" + e.message +
            " | ligne=" + e.line);
    }

    // ---- nettoyage ----
    log("=== 4. nettoyage ===");
    try {
        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        log("preferences GREP remises a Nothing: ok");
    } catch (e) {
        log("ERREUR reset prefs : " + e.message);
    }
    if (docCree) {
        try {
            doc.close(SaveOptions.NO);
            log("document temoin ferme (sans enregistrer) : ok");
        } catch (e2) {
            log("ERREUR fermeture doc : " + e2.message);
        }
    }
    log("document final : restants = " + app.documents.length);
    line();
    log("=== FIN probe_grep_style.jsx ===");

    f.close();
})();

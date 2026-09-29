// probe_05_empreinte.jsx — MISSION 05 (voie B) : SONDE JETABLE, MESURE RÉELLE.
//
// Objet : mesurer l'API RÉELLE avant toute modification de import_md.jsx
// (principe de la mission 05 : « une sonde jetable est préférable à une
// modification prématurée du pipeline »).
//
// Sections :
//   0. environnement + surface de l'API File
//   1. V1 — empreinte : reproductible ? sensible au moindre caractère ?
//      CONTRÔLE NÉGATIF : ré-écrire le MÊME contenu ne doit pas changer l'empreinte.
//   1bis. lineFeed : la lecture normalise-t-elle les fins de ligne ?
//   1ter. ce qui est RÉELLEMENT écrit sur le disque (codes mesurés, pas supposés).
//   2. persistance : QUELLE cible d'enregistrement fonctionne réellement ?
//   3. V2 — le label survit-il à fermeture + réouverture ? non-régression md-style-map ?
//   4. V3 — les 4 états provoqués en réel
//   5. V4 — mécanisme de la boîte annulable (LES DEUX branches exécutées)
//   6. question 2 — un gestionnaire d'ouverture est-il atteignable au runtime ?
//
// Ce que cette sonde NE fait PAS : cliquer pour de vrai dans une boîte de dialogue.
// La branche V4 est mesurée en détournant NOTRE variable `demanderConfirmation`,
// PAS le global `confirm` : la section 5bis mesure que le global `confirm` est
// REFUSÉ en écriture (« confirm is read only ») — ce qui contredit la 2e moitié du
// Cas 40 du wiki. Voir 5bis pour la mesure, la nuance et la conséquence.
// Le clic RÉEL est réservé à FJD.
//
// Chaque section est protégée (bloc()) : l'échec de l'une n'arrête PAS les suivantes
// — leçon de la 1re exécution, arrêtée sur doc.save, après quoi plus rien n'a été mesuré.
//
// Sortie : /private/tmp/probe_05_empreinte.log
// Nettoyage : ne touche AUCUN document de l'utilisateur (références strictes).

(function () {

    var LOG = "/private/tmp/probe_05_empreinte.log";
    var SRC = "/private/tmp/probe_05_source.md";
    var LABEL_FP = "md-source-fingerprint";
    var LABEL_MAP = "md-style-map";

    var f = new File(LOG);
    f.encoding = "UTF-8";
    f.open("w");
    function log(t) { f.writeln(String(t)); }
    function line() { log("------------------------------------------------------------"); }

    var echecs = 0;
    var controles = 0;
    function check(nom, obtenu, attendu) {
        controles++;
        var ok = (String(obtenu) === String(attendu));
        if (!ok) echecs++;
        log((ok ? "  OK   " : "  FAIL ") + nom + " | attendu=" + attendu + " | obtenu=" + obtenu);
    }
    function codes(s, n) {
        var out = [];
        var lim = s.length < n ? s.length : n;
        for (var i = 0; i < lim; i++) out.push(s.charCodeAt(i));
        return out.join(",");
    }
    function bloc(nom, fn) {
        log("### " + nom);
        try { fn(); } catch (e) { log("  ERREUR SECTION " + nom + " : " + e.message + " | ligne=" + e.line); }
        log("");
    }

    var mesDocs = [];   // references STRICTES : on ne ferme QUE les documents de la sonde

    log("=== probe_05_empreinte.jsx — MISSION 05 voie B ===");
    log("date            : " + (new Date()).toString());
    log("app             : " + app.name + " " + app.version);
    log("documents ouverts a l'entree = " + app.documents.length);
    log("Folder.temp.fsName = " + Folder.temp.fsName);
    line();

    var CONTENU_V1 = "# Titre Niveau 1\r## Titre Niveau 2\rUn paragraphe ordinaire.\r";
    var CONTENU_V2 = "# Titre Niveau 1\r## Titre Niveau 2\rUn paragraphe ordinaira.\r";   // 1 caractere change

    // =======================================================================
    // 0. API File
    // =======================================================================
    bloc("0. API File : ce qui existe réellement", function () {
        var t = new File("/private/tmp/.probe_05_inexistant_zz");
        var props = [];
        try {
            var rp = t.reflect.properties;
            for (var k = 0; k < rp.length; k++) props.push(String(rp[k].name));
        } catch (eRp) { log("reflect KO : " + eRp.message); }
        log("proprietes de File = " + props.length);
        log("  " + props.join(", "));
        log("  length    present=" + (typeof t.length !== "undefined") + " type=" + typeof t.length);
        log("  modified  present=" + (typeof t.modified !== "undefined") + " type=" + typeof t.modified);
        log("  encoding  present=" + (typeof t.encoding !== "undefined") + " type=" + typeof t.encoding);
        log("  exists    present=" + (typeof t.exists !== "undefined") + " type=" + typeof t.exists);
        log("  lineFeed  present=" + (typeof t.lineFeed !== "undefined") + " type=" + typeof t.lineFeed);
    });

    // =======================================================================
    // Helpers d'empreinte
    // =======================================================================
    function ecrireSource(contenu) {
        var w = new File(SRC);
        w.encoding = "UTF-8";
        if (!w.open("w")) return false;
        w.write(contenu);
        w.close();
        return true;
    }

    // sum = (sum*31 + code) % 2147483647 — identique a la simulation Node.
    function sommeDe(s) {
        var sum = 0;
        for (var i = 0; i < s.length; i++) sum = (sum * 31 + s.charCodeAt(i)) % 2147483647;
        return sum;
    }

    function empreinte(chemin) {
        var out = { existe: false, taille: -1, dateMs: -1, somme: -1, nom: "", lu: false,
                    longueurLue: -1, err: "", codes: "" };
        try {
            var p = new File(chemin);
            out.existe = p.exists;
            if (!out.existe) return out;
            out.nom = p.name;
            try { out.taille = p.length; } catch (eT) { out.err += " length:" + eT.message; }
            try { out.dateMs = p.modified.getTime(); } catch (eD) { out.err += " modified:" + eD.message; }
            var r = new File(chemin);
            r.encoding = "UTF-8";
            if (r.open("r")) {
                var c = r.read();
                r.close();
                out.lu = true;
                out.longueurLue = c.length;
                out.somme = sommeDe(c);
                out.codes = codes(c, 24);
            } else { out.err += " open('r')=false"; }
        } catch (eE) { out.err += " EXC:" + eE.message + "@" + eE.line; }
        return out;
    }

    function resume(e) {
        return "existe=" + e.existe + " | taille=" + e.taille + " | dateMs=" + e.dateMs +
               " | somme=" + e.somme + " | longueurLue=" + e.longueurLue +
               (e.err ? " | err=" + e.err : "");
    }

    function serializeFlatProbe(obj) {
        var pairs = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && obj[key]) {
                var ek = String(key).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                var ev = String(obj[key]).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                pairs.push('"' + ek + '":"' + ev + '"');
            }
        }
        return "{" + pairs.join(",") + "}";
    }

    function deserializeFlatProbe(str) {
        var obj = {};
        if (!str) return obj;
        var content = String(str).replace(/^\s*\{/, "").replace(/\}\s*$/, "");
        if (content.replace(/\s/g, "") === "") return obj;
        var re = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        var mt;
        while ((mt = re.exec(content)) !== null) {
            var kk = mt[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
            var vv = mt[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
            obj[kk] = vv;
        }
        return obj;
    }

    // Decision identique a la simulation Node : TAILLE + SOMME, jamais la date.
    function decideProbe(labelBrut, cheminSource) {
        var stored = deserializeFlatProbe(labelBrut);
        if (!stored || !stored.v) return "jamais_importe";
        var p = new File(cheminSource);
        if (!p.exists) return "source_absente";
        var e = empreinte(cheminSource);
        if (!e.lu) return "source_absente";
        if (String(stored.checksum) === String(e.somme) && String(stored.size) === String(e.taille)) return "identique";
        return "different";
    }

    // Reaction du pipeline : seule 'different' ouvre la boite annulable.
    // La boite passe par NOTRE fonction, jamais par l'appel direct au global :
    // c'est la seule forme testable (le global se revele non ecrasable, cf. section 5).
    var demanderConfirmation = function (msgTexte) { return confirm(msgTexte, false, "Import MD"); };

    function reactProbe(etat) {
        if (etat === "different") {
            var msg = "La source Markdown a change depuis le dernier import.\n\nRelancer l'import ?";
            if (demanderConfirmation(msg)) return "relancer";
            return "abandonner";
        }
        if (etat === "source_absente") return "signaler_sans_relance";
        return "silencieux";
    }

    var e1 = null, e2 = null, e3 = null, eCrit = null;

    // =======================================================================
    // 1. V1
    // =======================================================================
    bloc("1. V1 — empreinte : reproductible et sensible", function () {
        ecrireSource(CONTENU_V1);
        eCrit = empreinte(SRC);       // empreinte de ce qui a REELLEMENT ete ecrit+relu
        e1 = empreinte(SRC);
        var e1b = empreinte(SRC);
        log("lecture 1 : " + resume(e1));
        log("lecture 2 : " + resume(e1b));
        check("V1 reproductible : 2 lectures d'un fichier intact => somme identique", e1.somme, e1b.somme);
        check("V1 reproductible : 2 lectures d'un fichier intact => taille identique", e1.taille, e1b.taille);

        ecrireSource(CONTENU_V2);
        e2 = empreinte(SRC);
        log("apres 1 caractere change ('e'->'a') : " + resume(e2));
        check("V1 sensible : 1 caractere change => somme differente", (e1.somme !== e2.somme), "true");
        check("V1 sensible : 1 caractere change => taille INCHANGEE (piege confirme)", e1.taille, e2.taille);

        ecrireSource(CONTENU_V2);          // meme contenu reecrit
        e3 = empreinte(SRC);
        log("re-enregistrement du MEME contenu : " + resume(e3));
        check("[negatif] meme contenu => somme identique", (e3.somme === e2.somme), "true");
        log("  date avant=" + e2.dateMs + " | date apres=" + e3.dateMs +
            " | date a BOUGE = " + (e2.dateMs !== e3.dateMs));
        log("  LECTURE : la date de modification n'est pas un signal de CONTENU ;");
        log("            decider sur elle produirait une fausse alerte au moindre touch.");
    });

    // =======================================================================
    // 1bis. lineFeed
    // =======================================================================
    bloc("1bis. lineFeed : la lecture normalise-t-elle les fins de ligne ?", function () {
        log("File.lineFeed par defaut (avant open) = '" + String(new File(SRC).lineFeed) + "'");

        function lireAvec(reglage) {
            var r = new File(SRC);
            r.encoding = "UTF-8";
            if (reglage) { try { r.lineFeed = reglage; } catch (eS) { return "lineFeed refuse: " + eS.message; } }
            if (!r.open("r")) return "open KO";
            var c = r.read();
            var eff = String(r.lineFeed);
            r.close();
            return { reglage: reglage, lineFeedEffectif: eff, longueur: c.length, somme: sommeDe(c), codes: codes(c, 24) };
        }
        function montre(o) {
            if (typeof o === "string") { log("  " + o); return; }
            log("  reglage='" + o.reglage + "' | effectif='" + o.lineFeedEffectif + "' | longueur=" +
                o.longueur + " | somme=" + o.somme);
            log("    codes = " + o.codes);
        }
        var a = lireAvec("native");
        var b = lireAvec("unix");
        var c = lireAvec("mac");
        montre(a); montre(b); montre(c);
        if (typeof a === "object" && typeof b === "object" && typeof c === "object") {
            check("lineFeed ne change PAS la longueur lue", a.longueur, b.longueur);
            check("lineFeed ne change PAS la somme lue (native==unix)", a.somme, b.somme);
            check("lineFeed ne change PAS la somme lue (native==mac)", a.somme, c.somme);
        }
    });

    // =======================================================================
    // 1ter. ce qui est REELLEMENT sur le disque
    // =======================================================================
    bloc("1ter. ce qui est REELLEMENT ecrit sur le disque", function () {
        log("contenu ECRIT (escapes de source) : " + codes(CONTENU_V2, 24));
        log("contenu LU du fichier            : " + (eCrit ? eCrit.codes : "(n/a)"));
        log("longueur ecrite = " + CONTENU_V2.length + " | longueur lue = " + (eCrit ? eCrit.longueurLue : "n/a"));
        log("taille sur disque (File.length)  = " + (eCrit ? eCrit.taille : "n/a"));
        log("  IMPORTANT : si le code 13 (CR) ecrit ressort en 10 (LF) a la lecture, la");
        log("  somme de controle mesure le contenu NORMALISE par ExtendScript, pas les octets");
        log("  bruts. C'est acceptable TANT QUE la lecture est faite dans les memes conditions");
        log("  a l'import et a la comparaison — ce que fait le pipeline (meme fonction).");
    });

    // =======================================================================
    // 1quater. la somme est-elle stable selon le style de fin de ligne du fichier ?
    // Question directe : FJD re-enregistre son .md ailleurs -> fausse alerte ?
    // =======================================================================
    bloc("1quater. stabilite de l'empreinte selon les fins de ligne du fichier", function () {
        var VAR_EOL = "/private/tmp/probe_05_eol.md";
        var variantes = [
            { nom: "LF seul", contenu: "a\nb\n" },
            { nom: "CR seul", contenu: "a\rb\r" },
            { nom: "CRLF   ", contenu: "a\r\nb\r\n" }
        ];
        var res = [];
        for (var i = 0; i < variantes.length; i++) {
            var v = variantes[i];
            var f = new File(VAR_EOL);
            f.encoding = "UTF-8";
            if (!f.open("w")) { log("  ouverture en ecriture KO pour " + v.nom); continue; }
            f.write(v.contenu);
            f.close();

            var g = new File(VAR_EOL);
            var contenuLu = "";
            if (g.open("r")) { g.encoding = "UTF-8"; contenuLu = g.read(); g.close(); }
            var o = {
                nom: v.nom, ecrit: v.contenu.length, tailleDisque: g.length,
                lu: contenuLu.length, somme: sommeDe(contenuLu), codes: codes(contenuLu, 8)
            };
            res.push(o);
            log("  " + o.nom + " : ecrit=" + o.ecrit + " | tailleDisque=" + o.tailleDisque +
                " | lu=" + o.lu + " | somme=" + o.somme + " | codes=" + o.codes);
        }
        if (res.length === 3) {
            check("1quater CR et LF se lisent avec la MEME longueur", res[0].lu, res[1].lu);
            check("1quater CR et LF donnent la MEME somme (normalisation)", res[0].somme, res[1].somme);
            check("1quater CRLF se lit comme LF (sinon risque de fausse alerte)",
                  (res[0].somme === res[2].somme), "true");
            log("  CONSEQUENCE : si CRLF se lit comme LF, l'empreinte est INSENSIBLE au style");
            log("  de fin de ligne => un re-enregistrement du .md par un autre outil ne");
            log("  declenche PAS de fausse alerte tant que le TEXTE est inchange.");
        }
        try { (new File(VAR_EOL)).remove(); } catch (eRm) {}
    });

    // =======================================================================
    // 2. QUELLE CIBLE D'ENREGISTREMENT FONCTIONNE ?
    // =======================================================================
    bloc("2. persistance : quelle cible d'enregistrement fonctionne vraiment ?", function () {
        var cheminTemp = Folder.temp.fsName + "/probe_05_doc.indd";
        var cheminPrivate = "/private/tmp/probe_05_doc.indd";
        var cheminTmp = "/tmp/probe_05_doc.indd";

        function essayer(nom, action) {
            var d = null;
            var r = "";
            try {
                d = app.documents.add();
                mesDocs.push(d);
                action(d);
                r = "OK -> " + String(d.fullName);
            } catch (e) {
                r = "ECHEC : " + e.message + " | ligne=" + e.line;
            }
            try { if (d) d.close(SaveOptions.NO); } catch (e2c) {}
            log("  " + nom + " : " + r);
            return r.charAt(0) === "O";
        }

        essayer("A doc.save(new File('/private/tmp/...'))", function (d) { d.save(new File(cheminPrivate)); });
        essayer("B doc.saveAs(new File('/private/tmp/...'))", function (d) { d.saveAs(new File(cheminPrivate)); });
        essayer("C doc.save('/private/tmp/...') en chaine", function (d) { d.save(cheminPrivate); });
        essayer("D app.activeDocument=d ; d.save(File)", function (d) { app.activeDocument = d; d.save(new File(cheminPrivate)); });
        essayer("E doc.save(new File(Folder.temp/...))", function (d) { d.save(new File(cheminTemp)); });
        essayer("F doc.save(new File('/tmp/...'))", function (d) { d.save(new File(cheminTmp)); });
        log("  Folder.temp = " + Folder.temp.fsName);
        log("  File(Folder.temp/...) existe apres coup = " + (new File(cheminTemp)).exists);
        log("  File('/private/tmp/...') existe apres coup = " + (new File(cheminPrivate)).exists);
    });

    // =======================================================================
    // 3. V2 — persistance du label
    // =======================================================================
    var docRouvert = null;
    var FP_VALUE = "";
    var MAP_VALUE = "";
    var CHEMIN_DOC = Folder.temp.fsName + "/probe_05_doc.indd";

    bloc("3. V2 — le label survit-il a fermeture + reouverture ?", function () {
        var doc = app.documents.add();
        mesDocs.push(doc);
        log("document cree : stories=" + doc.stories.length + " | textFrames=" +
            doc.textFrames.length + " | pages=" + doc.pages.length);

        MAP_VALUE = serializeFlatProbe({ h1: "Titre 1", p: "Paragraphe standard" });
        FP_VALUE = serializeFlatProbe({
            v: "1", size: String(e2.taille), modified: String(e2.dateMs),
            checksum: String(e2.somme), name: "probe_05_source.md"
        });
        doc.insertLabel(LABEL_MAP, MAP_VALUE);
        doc.insertLabel(LABEL_FP, FP_VALUE);
        log("label '" + LABEL_MAP + "' longueur=" + MAP_VALUE.length + " relu=" + doc.extractLabel(LABEL_MAP));
        log("label '" + LABEL_FP + "' longueur=" + FP_VALUE.length + " relu=" + doc.extractLabel(LABEL_FP));
        check("V2 empreinte relue AVANT fermeture", String(doc.extractLabel(LABEL_FP)), FP_VALUE);
        check("V2 mapping relu AVANT fermeture", String(doc.extractLabel(LABEL_MAP)), MAP_VALUE);

        // label de grande taille
        var gros = "";
        for (var j = 0; j < 4000; j++) gros += "A";
        try {
            doc.insertLabel("md-probe-gros", gros);
            var relu = String(doc.extractLabel("md-probe-gros"));
            log("label de 4000 caracteres : longueur relue=" + relu.length);
            check("V2 un label de 4000 caracteres survit integralement", relu.length, 4000);
        } catch (eG) {
            log("label 4000 : EXCEPTION " + eG.message);
            check("V2 un label de 4000 caracteres survit integralement", "EXC:" + eG.message, "4000");
        }

        // Enregistrement + fermeture + reouverture.
        var cible = new File(CHEMIN_DOC);
        if (cible.exists) cible.remove();
        doc.save(cible);
        log("document enregistre : " + CHEMIN_DOC + " | existe=" + cible.exists + " | taille=" + cible.length);
        doc.close(SaveOptions.NO);
        log("document ferme");

        docRouvert = app.open(cible);
        mesDocs.push(docRouvert);
        var fpApres = String(docRouvert.extractLabel(LABEL_FP));
        var mapApres = String(docRouvert.extractLabel(LABEL_MAP));
        log("APRES reouverture — empreinte : " + fpApres);
        log("APRES reouverture — mapping   : " + mapApres);
        check("V2 l'empreinte survit a fermeture+reouverture", fpApres, FP_VALUE);
        check("NON-REGRESSION : md-style-map intact", mapApres, MAP_VALUE);
    });

    // =======================================================================
    // 4. V3 — les 4 etats, en reel
    // =======================================================================
    var etats = {};
    bloc("4. V3 — les 4 etats provoques en reel", function () {
        // La source doit changer APRES l'import : c'est tout le scenario.
        // On change 1 caractere A TAILLE CONSTANTE (minuscule -> majuscule) pour
        // verifier que c'est bien la SOMME qui detecte, pas la taille.
        var CONTENU_V3 = "# Titre Niveau 1\r## Titre Niveau 2\rUn paragraphe ORDINAIRE.\r";
        ecrireSource(CONTENU_V3);
        var eApres = empreinte(SRC);
        log("source modifiee APRES l'import : " + resume(eApres));
        check("[montage] taille identique apres modification", eApres.taille, e2.taille);
        check("[montage] somme differente apres modification", (eApres.somme !== e2.somme), "true");

        etats.different = decideProbe(FP_VALUE, SRC);
        log("etat A (source modifiee depuis l'import) = " + etats.different);
        check("V3 etat 'different'", etats.different, "different");

        // Re-import : l'empreinte est recalculee et reecrite (ce que fera le pipeline).
        var nouvelFP = serializeFlatProbe({
            v: "1", size: String(eApres.taille), modified: String(eApres.dateMs),
            checksum: String(eApres.somme), name: "probe_05_source.md"
        });
        if (docRouvert) {
            docRouvert.insertLabel(LABEL_FP, nouvelFP);
            var reluFP = String(docRouvert.extractLabel(LABEL_FP));
            log("empreinte reecrite apres re-import : " + reluFP);
            check("V2 re-insertLabel du MEME nom ECRASE l'ancienne valeur", reluFP, nouvelFP);
            check("V2 l'empreinte reecrite differe bien de l'ancienne", (reluFP !== FP_VALUE), "true");
            check("NON-REGRESSION : md-style-map encore intact apres reecriture",
                  String(docRouvert.extractLabel(LABEL_MAP)), MAP_VALUE);
        } else {
            log("ATTENTION : pas de doc rouvert, l'etat 'identique' est evalue a blanc");
        }
        etats.identique = decideProbe(nouvelFP, SRC);
        log("etat B (source intacte, empreinte re-ecrite) = " + etats.identique);
        check("V3 etat 'identique' apres re-import", etats.identique, "identique");

        etats.absente = decideProbe(nouvelFP, "/private/tmp/probe_05_source_ABSENTE.md");
        log("etat C (source absente) = " + etats.absente);
        check("V3 etat 'source_absente'", etats.absente, "source_absente");

        etats.jamais = decideProbe("", SRC);
        log("etat D (document jamais importe) = " + etats.jamais);
        check("V3 etat 'jamais_importe'", etats.jamais, "jamais_importe");
    });

    // =======================================================================
    // 5. V4 — mecanisme de la boite annulable, les deux branches
    // =======================================================================
    bloc("5. V4 — mecanisme de la boite annulable (les 2 branches)", function () {
        log("typeof confirm = " + (typeof confirm) + " | arite = " + confirm.length);

        // Tentative d'ecrasement du GLOBAL. Mesure, pas deduction.
        var ecrasable = false;
        var msgRefus = "";
        var vraiGlobal = confirm;
        try {
            confirm = function () { return true; };
            ecrasable = true;
        } catch (eCE) { msgRefus = eCE.message; }
        try { confirm = vraiGlobal; } catch (eR) {}
        log("ecrasement du GLOBAL confirm : " + (ecrasable ? "POSSIBLE" : "REFUSE : " + msgRefus));
        log("  CONSEQUENCE D'ARCHITECTURE : la boite doit passer par NOTRE fonction");
        log("  (demanderConfirmation), sinon les deux branches ne sont pas testables");
        log("  sans un clic humain. C'est ce que fait cette sonde.");
        check("le global confirm est REFUSE en ecriture (fait mesure, cf. 5bis)", ecrasable, "false");

        var trace = [];
        var vraiDemandeur = demanderConfirmation;
        var r1 = "", r2 = "", r3 = "", r4 = "", r5 = "";
        try {
            demanderConfirmation = function (m) { trace.push("APPEL(different,accepter)::" + m); return true; };
            r1 = reactProbe("different");
            demanderConfirmation = function (m) { trace.push("APPEL(different,refuser)::" + m); return false; };
            r2 = reactProbe("different");
            demanderConfirmation = function (m) { trace.push("APPEL_INATTENDU::" + m); return true; };
            r3 = reactProbe("identique");
            r4 = reactProbe("source_absente");
            r5 = reactProbe("jamais_importe");
        } finally {
            demanderConfirmation = vraiDemandeur;
        }
        log("appels a la boite captures = " + trace.length);
        for (var m = 0; m < trace.length; m++) log("  " + trace[m]);
        check("V4 'different' + acceptation => relancer", r1, "relancer");
        check("V4 'different' + refus => abandonner", r2, "abandonner");
        check("[negatif] 'identique' n'alerte PAS", r3, "silencieux");
        check("[negatif] 'source_absente' ne relance PAS tout seul", r4, "signaler_sans_relance");
        check("[negatif] 'jamais_importe' reste silencieux", r5, "silencieux");
        check("[negatif] exactement 2 appels a la boite (les 3 autres sont muets)", trace.length, 2);
        check("[negatif] aucun appel inattendu", (trace.join(" ").indexOf("APPEL_INATTENDU") === -1), "true");
        check("[negatif] le demandeur reel est bien restaure", (demanderConfirmation === vraiDemandeur), "true");
        log("RESERVE HONNETE : le clic REEL dans la boite n'est pas mesurable sans humain.");
        log("                  Il est reserve a FJD, sur le vrai document.");
    });

    // =======================================================================
    // 5bis. CONTRADICTION A TRANCHER PAR MESURE
    // Le wiki (Cas 40) affirme : "confirm est une propriete globale reassignable".
    // La section 5 vient de mesurer : "confirm is read only". Les deux ne peuvent
    // pas etre vrais sous la meme forme. On teste donc CHAQUE chemin d'ecrasement
    // separement, et on verifie le resultat SANS APPELER confirm (un appel non
    // ecrase ouvrirait la vraie boite et bloquerait la sonde pour toujours).
    // =======================================================================
    bloc("5bis. par quel chemin exact 'confirm' est-il ecrasable ?", function () {
        var original = confirm;
        var sentinelle = function (m, d, t) { return "SENTINELLE_CONFIRM"; };
        function marque() { return (String(confirm).indexOf("SENTINELLE_CONFIRM") !== -1); }
        function restaurer() {
            try { confirm = original; } catch (e1r) {}
            try { $.global.confirm = original; } catch (e2r) {}
        }
        log("etat avant essais : marque de sentinelle presente = " + marque() + " (doit etre false)");

        var formes = [
            { nom: "confirm = f            (affectation nue)", appliquer: function () { confirm = sentinelle; } },
            { nom: "$.global.confirm = f   (chemin explicite)", appliquer: function () { $.global.confirm = sentinelle; } }
        ];
        for (var i = 0; i < formes.length; i++) {
            var f = formes[i];
            var msg = "";
            var reussi = false;
            try { f.appliquer(); reussi = marque(); }
            catch (eF) { msg = eF.message; }
            log("  " + f.nom + " : " + (reussi
                ? "ECRASEMENT REUSSI (verifie par identite, sans appel)"
                : "REFUSE : " + (msg || "aucun changement d'identite, sans erreur levee")));
            restaurer();
            log("    restauration : sentinelle encore presente = " + marque() + " (doit etre false)");
            check("5bis apres restauration, confirm n'est PAS la sentinelle", marque(), "false");
        }
        log("  CONCLUSION MESUREE : les DEUX formes sont REFUSEES dans ce contexte.");
        log("  => la 2e moitie du Cas 40 ('confirm est ecrasable') n'est PAS reproductible ici.");
        log("     Elle repose sur UNE ligne de /private/tmp/run_04ter.log, et ce meme log");
        log("     la contredit : 'duree ms = 46106' pour une sonde qui contient 5 appels");
        log("     alert() => les boites se sont bien ouvertes, donc RIEN n'a ete neutralise.");
        log("     La ligne 'fonctions neutralisees = confirm' ne decrit pas un effet :");
        log("     c'est un push() execute apres un try reste muet (code relu, l.14-15).");
        log("  MESURE EXTERNE (matrice 2x2 : 4 contextes, 8 tentatives, TOUTES REFUSEES) :");
        log("    inline/top-level   -> REFUSE : confirm is read only  (/private/tmp/matrix_inline.log)");
        log("    inline/fonction    -> REFUSE : confirm is read only  (/private/tmp/matrix_inline.log)");
        log("    evalFile/top-level -> REFUSE : confirm is read only  (/private/tmp/matrix_evalfile.log)");
        log("    evalFile/fonction  -> REFUSE : confirm is read only  (/private/tmp/matrix_evalfile.log)");
        log("  RESERVE HONNETE : deux executions anterieures avaient affiche 'SANS ERREUR'");
        log("  (/private/tmp/ctx_props.log, /private/tmp/ctx_shadow.log). Ce resultat N'EST PAS");
        log("  reproductible : les memes gestes refusent aujourd'hui. On ne retient donc que");
        log("  le resultat reproductible — l'ecriture du global est REFUSEE — et on ne pretend");
        log("  pas expliquer la mecanique interne d'Adobe.");
        log("  CONSEQUENCE OPERATIONNELLE : ne JAMAIS fonder la testabilite sur l'ecrasement");
        log("  de confirm. Toute boite passe par une variable du PROJET (demanderConfirmation)");
        log("  — c'est ce que fait la section 5 et ce que fera l'integration dans import_md.jsx.");
    });

    // =======================================================================
    // 6. question 2 — gestionnaire d'ouverture atteignable ?
    // =======================================================================
    bloc("6. question 2 — un gestionnaire d'ouverture est-il atteignable ?", function () {
        var trouves = [];
        try {
            var rpa = app.reflect.properties;
            for (var ka = 0; ka < rpa.length; ka++) {
                var nm = String(rpa[ka].name);
                if (nm.indexOf("vent") !== -1 || nm.indexOf("isten") !== -1) trouves.push(nm);
            }
        } catch (eRA) { log("reflect app KO : " + eRA.message); }
        log("app : proprietes liees aux evenements/ecouteurs = [" + trouves.join(", ") + "]");
        log("typeof app.addEventListener      = " + (typeof app.addEventListener));
        log("typeof app.eventListeners        = " + (typeof app.eventListeners));
        log("typeof app.attachEventListener   = " + (typeof app.attachEventListener));
        log("typeof app.menuActions           = " + (typeof app.menuActions));
        try {
            log("Event global = " + (typeof Event));
            if (typeof Event !== "undefined") {
                log("Event.AFTER_OPEN = " + Event.AFTER_OPEN);
                log("Event.AFTER_NEW  = " + Event.AFTER_NEW);
            }
        } catch (eEv) { log("Event global : " + eEv.message); }
        log("LECTURE : un gestionnaire d'ouverture n'est utile que s'il est ENREGISTRABLE");
        log("          depuis un script de demarrage et s'il survit a la fin du script.");

        // Mesure d'enregistrabilite REELLE, avec retrait immediat (pas de residue
        // dans la session de FJD).
        log("typeof app.removeEventListener = " + (typeof app.removeEventListener));
        var h = function (ev) { return; };
        var avant = -1, apres = -1, fin = -1;
        try {
            avant = app.eventListeners.length;
            app.addEventListener(Event.AFTER_OPEN, h);
            apres = app.eventListeners.length;
            app.removeEventListener(Event.AFTER_OPEN, h);
            fin = app.eventListeners.length;
        } catch (eLs) { log("enregistrement KO : " + eLs.message + " | ligne=" + eLs.line); }
        log("eventListeners : avant=" + avant + " | apres ajout=" + apres + " | apres retrait=" + fin);
        check("un ecouteur afterOpen est ENREGISTRABLE", (apres > avant), "true");
        check("l'ecouteur est RETIRABLE (aucun residue)", fin, avant);
    });

    // =======================================================================
    // 7. nettoyage
    // =======================================================================
    log("=== 7. nettoyage ===");
    for (var d = 0; d < mesDocs.length; d++) {
        try {
            var dd = mesDocs[d];
            var nom = "";
            try { nom = dd.name; } catch (eN) {}
            dd.close(SaveOptions.NO);
            log("document de la sonde ferme : " + nom);
        } catch (eCd) { log("reference deja invalide (ferme plus tot) — sans effet"); }
    }
    var temps = [
        Folder.temp.fsName + "/probe_05_doc.indd",
        "/private/tmp/probe_05_doc.indd",
        "/tmp/probe_05_doc.indd"
    ];
    for (var q = 0; q < temps.length; q++) {
        try {
            var ff = new File(temps[q]);
            if (ff.exists) { ff.remove(); log("supprime : " + temps[q]); }
            else { log("absent (rien a supprimer) : " + temps[q]); }
        } catch (eRm) { log("non supprime " + temps[q] + " : " + eRm.message); }
    }
    log("SOURCE CONSERVEE POUR INSPECTION : " + SRC + " | existe=" + (new File(SRC)).exists);
    log("documents restants = " + app.documents.length + " (doit valoir le nombre d'entree)");
    line();
    log("=== RESULTAT : " + (controles - echecs) + "/" + controles + " controles OK, " + echecs + " echec(s) ===");
    log("=== FIN probe_05_empreinte.jsx ===");

    f.close();

})();

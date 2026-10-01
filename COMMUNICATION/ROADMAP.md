# ROADMAP — Projet IMPORT_MD (plugin InDesign)

Registre actif des missions du projet. Chaque mission a son propre fichier détaillé dans ce dossier (`mission_NN_<nom>.md`) — ce ROADMAP reste un sommaire, pas une duplication du contenu.

Convention : toute nouvelle mission est rédigée ici (entrée + fichier détaillé), jamais laissée en fichier isolé hors de ce registre.

**Archivage** : une mission close **sort** de ce registre et son bloc est conservé **intégralement** dans le journal du mois — [`RMA/2026-09.md`](RMA/2026-09.md) (décision FJD du 29/09/2026 : « tu clôtures, tu archives »). L'archive **recopie** le bloc, elle **ne le résume pas**. Ce registre ne garde donc que ce qui reste ouvert.

---

## Chapitre Commutativité INDD↔MD — Cadrage (30/09/2026, en attente de mission numérotée)

**Statut** : 🔴 À FAIRE — cadrage architecture acté par FJD, pas encore découpé en missions exécutables. **Priorité après la clôture du Chapitre Panneau** (Missions 5-6 en cours), **avant** le chantier GREP et le wiki récursif du bot (évoqués mais explicitement reportés par FJD : « on voit le GREP et le wiki après »).

**Principe non négociable (FJD, 30/09/2026)** : **aucun texte n'entre ni ne sort du `.md` sans passer par un bot LLM + MCP**. Outil **exclusivement LLM-inclusif** — zéro édition manuelle brute du fichier source, y compris par un client externe. Le client dialogue avec un bot ; c'est le bot qui écrit/amende le `.md` distant, jamais l'inverse.

**Architecture envisagée** :
1. **Connecteur MCP** sur un dossier/texte distant — le bot y crée/amende le `.md` suite au dialogue avec l'utilisateur (ou un client externe à qui on donne accès au bot, jamais au fichier).
2. **Une app locale moissonne** ce distant via HTTP (pas InDesign directement — confirmé cohérent avec les limites UXP déjà documentées : `fetch`/WebSocket existent mais fragiles, notamment Windows, cf. Mission 04 archivée).
3. **Le panneau Import MD importe depuis ce clone local**, comme aujourd'hui (voie B, empreinte en métadonnées) — aucune rupture avec l'architecture déjà construite.

**Deux modes requis** :
- **Mode live** : polling court, import quasi immédiat dès modification côté distant.
- **Mode différé** : le dialogue bot↔utilisateur se poursuit côté distant sans toucher à la mise en page en cours ; la moisson/import n'est déclenchée qu'à la validation explicite — utile notamment si un **client** externe est dans la boucle (il amende via le bot, jamais le fichier lui-même, puis valide avant que ça remonte dans InDesign).

**Risque nouveau identifié (FJD)** : un client externe dans la boucle introduit un tiers non technique — nécessite probablement un **diff visuel avant validation** (pas juste "ça a changé"), et un contrat d'usage clair (cf. horizon É7 du wiki, déjà posé pour le partage à des tiers — même logique de contrat de contribution, à relier).

**Explicitement reporté par FJD, à ne pas anticiper ici** :
- Chantier **GREP** (bot produit l'expression GREP, renseigne le champ, itération confiée aux contrôles natifs InDesign `Suivant`/`Précédent`/`Remplacer`/`Tout remplacer` — pas de boucle réinventée côté UXP). **Extension envisagée (FJD, 30/09/2026) : mode SR (Secrétariat de Rédaction)**, greffé sur ce même mécanisme CMD+F — le bot repère orphelines/veuves, fautes d'orthotypographie (surlignage), propose une sélection de portion à confirmer en justification, et peut réduire le kerning/l'approche de groupe pour résorber un débord. Même navigation itérative que le GREP classique (Suivant/Précédent), pas de nouvelle UI. **Préalable obligatoire avant toute implémentation** : chercher la documentation officielle Adobe SR/typographie (kerning, approche, `Justification` prefs) pour fonder un skill sur preuve, pas sur supposition — même discipline que le reste du projet (citation exacte + URL avant hypothèse).
- **Wiki récursif du bot** (capitaliser les expressions GREP produites + retour utilisateur, même patron que `doc/wiki_extendscript_indesign.md` : gabarit, cas, numérotation immuable) — pour améliorer la précision du bot dans le temps.

**Prochaine étape** : découper ce cadrage en missions numérotées une fois le Chapitre Panneau clos — ne pas commencer l'implémentation avant.

---

## Mission 00 — Base documentaire structurée : ontologie du DOM ExtendScript/InDesign

**Statut** : 🔴 ABANDONNÉE — décision FJD du **29/09/2026**, **confirmée définitivement par FJD le 29/09/2026** : le wiki `doc/wiki_extendscript_indesign.md` (**42 cas** au 29/09) **est le dernier niveau** de documentation du projet. Une ontologie séparée ne se justifierait que pour un corpus éclaté en **plusieurs dizaines de fichiers distincts centralisés** — ce qui n'est pas le cas : le wiki est **un seul fichier**, alimenté par les mesures réelles des missions 03/04, à son juste niveau de granularité.
**Historique de la décision (Architecte, 28/09/2026)** : la mission s'était **auto-déclarée rétroactive** (« numéroté 00 car il aurait dû précéder toutes les autres missions ») tout en restant à faire alors que les missions 01 à 04 étaient déjà construites — son constat d'ordre n'a donc jamais été suivi d'effet. Deux issues étaient ouvertes : **(a) la faire** une fois, comme socle documentaire ; **(b) la marquer 🔴 ABANDONNÉE** avec raison citée. **FJD a tranché (b) le 29/09/2026.**
**Périmètre de l'abandon** : il porte sur la **recherche large sur l'ontologie** uniquement. La **question prioritaire** de cette même mission (Q1/Q2, répondue le 26/09, cf. ci-dessous) reste **valide** et continue d'être citée comme fondement par la mission 03 — son contenu est intégré au wiki.

**Fichier détaillé** : [mission_00_ontologie_dom_indesign.md](mission_00_ontologie_dom_indesign.md)

**Résumé** : chantier fondationnel et rétroactif — numéroté 00 car il aurait dû précéder toutes les autres missions plutôt que d'être découvert après coup. Constituer une base documentaire structurée (ontologie) du DOM ExtendScript/InDesign (objets, propriétés, méthodes, pièges connus, citations exactes de doc officielle) à partir d'une recherche web ciblée, pour que tout Ouvrier futur (quel que soit le modèle) dispose d'un contrat de référence fiable au lieu de redécouvrir les mêmes pièges à chaque mission. Capitalise sur les 22+ bugs déjà rencontrés (mission_01) et la méthode de travail déjà validée (vérification doc officielle avant hypothèse).

**Question prioritaire — répondue le 26/09** : Q1 (curseur chargé/loaded cursor déclenchable par script) confirmée **OUI**, citation officielle `Document.place()`/`Document.placeGuns`/`PlaceGun.loadPlaceGun()` (indesignjs.de/Document.html). Q2 (Markdown ajoutable aux formats du Placer natif par scripting seul) confirmée **NON**, réservé au SDK C++. Détail complet : [m00_question_prioritaire_reponse.md](m00_question_prioritaire_reponse.md). Recherche large sur l'ontologie complète : **non lancée et désormais abandonnée** (cf. Statut ci-dessus) — le wiki joue ce rôle.

---

## Mission 01 — Plugin InDesign : import Markdown mappé sur la charte de styles réelle du document

**Statut** : 🟡 EN COURS — base fonctionnelle stable (texte, styles, tableaux, blocs de code), tests réels en cours sur fichiers multi-modèles

**Fichier détaillé** : [mission_01_plugin_indesign_import_md.md](mission_01_plugin_indesign_import_md.md)

**Résumé** : construction du script `import_md.jsx` — importe un fichier Markdown dans InDesign en mappant chaque élément (titres, paragraphes, listes, gras/italique, tableaux, blocs de code) sur les styles réels du document ouvert, sans jamais coder de nom de style en dur. 22 bugs ExtendScript/InDesign rencontrés et corrigés au fil de la session du 23-25/09/2026 (voir wiki pour le détail technique de chacun). Dialogue de mapping avec présélection automatique par convention HTML, bouton Réinitialiser, journal d'erreurs (`import_md_errors.log`).





---

## Mission 03quater — Wiki : alimentation (clôturée provisoirement)

**Statut** : 🟡 PARTIELLE — **clôturée provisoirement le 29/09/2026 (décision FJD)** : l'alimentation est faite et contrôlée (**39 → 42 cas**, index + catalogue à jour, **0 U+FFFD**, **0 ancre morte**) ; le seul point ouvert est **hors de cette mission** — la **factorisation É3** part en **Mission 06**.

**Fichier détaillé** : [mission_03quater_wiki_alimentation.md](mission_03quater_wiki_alimentation.md)

**Résumé** : mission **intermédiaire** qui solde la dette d'écriture restée ouverte après les missions 03 (étape 9 → Cas 36) et 04 (sondes `04bis`/`04ter` → Cas 37, 39, 40). Quatre cas sont portés au wiki, tous **`mesuré`** : **Cas 40** (`alert` en lecture seule / `confirm` écrasable + guillemets imbriqués d'un `do script` inline ⇒ `.jsx` temporaire + `$.evalFile`) ; **Cas 41** (ce qu'un ICML exporté par script contient réellement : marques markdown conservées **littéralement** en texte brut, compteurs XML **tous à zéro**, 36 877 octets pour 42 caractères utiles ⇒ « Map Tags to Styles » n'a rien à lier — **réserve déclarée** : le point « l'ICML efface les styles » est **non instruit**, la story témoin n'avait aucun style appliqué) ; **Cas 42** (un GREP ne pose **qu'un seul** style de paragraphe par requête : **223** propriétés, **9** contenant « tyle », **aucune** variante au pluriel, `appliedParagraphStyle` **scalaire** `typeof=string` — contre-épreuve réelle `modifications = 1` sur 3 paragraphes ⇒ **N niveaux ⇒ N passes**) ; **Cas 43** (un document créé par script n'a **ni story ni textFrame** : `stories=0 | textFrames=0 | pages=1`, et l'erreur « Object is invalid » est signalée **une ligne trop tard**). Contrôles bruts au CR. **Ce qui n'est pas fait et ne le sera pas ici** : la factorisation É3 (elle a une adresse, Mission 06), la rétro-application du gabarit É1, le comblement des trous Cas 11 / Cas 15.

**Cas wiki consultés** : Cas 18, 22, 24, 27, 35, 36, 37, 39.
**Cas wiki produits/enrichis** : **Cas 40, 41, 42, 43** (créés, `mesuré`) + compteur d'en-tête, catalogue, index par thème et index par symptôme.

**Clôture** : **provisoire** — le reliquat est **délégué** à la Mission 06 ; cette mission **reste au registre** (ni archivée ni supprimée) tant que FJD n'a pas confirmé la clôture définitive.

---

## Mission 06 — Wiki : factorisation (É3) + outillage d'écriture de cas

**Statut** : 🔴 À FAIRE — rédigée le 29/09/2026, en attente du go FJD. Le numéro **05** est désormais pris par l'implémentation de la voie B (cf. Mission 05) : d'où le 06.

**Fichier détaillé** : [mission_06_wiki_e3_factorisation.md](mission_06_wiki_e3_factorisation.md)

**Résumé** : le wiki a atteint le déclencheur É3, mais par **une seule** de ses deux branches — la mesure du 29/09/2026 le corrige : **1412 lignes / 42 cas**, aucun cas ne dépasse **106 lignes** (le critère « > 150 lignes » n'est **pas** atteint), et la duplication réelle se concentre sur **3 familles** (identité de source, environnement mesuré, patterns de code), portées par une douzaine de cas seulement. Deux volets : **(2) outillage d'abord** — `tools/new_wiki_case.py` (Python 3 stdlib), qui trouve le numéro suivant sans jamais renuméroter ni combler un trou, insère le squelette É1, met à jour les **3** emplacements d'index (compteur, catalogue, thème) de façon **atomique**, et **lance lui-même les 3 contrôles** (compteur == `grep -c "^## Cas "`, 0 ancre morte, 0 U+FFFD) ; **(1) factorisation ensuite** — 3 annexes **dans le même fichier** (A sources canoniques = identité, pas citation ; B environnement ; C patterns), et réécriture des **seuls** cas dupliquants, sans toucher une ligne de contenu technique. Index par symptôme : **manuel** (décision FJD).

---

## Mission 07 — Nettoyage et publication du repo en public

**Statut** : ✅ TERMINÉE — exécutée le 29/09/2026, 4 livrables sur 4 ; contrôles de sortie au vert (0 chemin perso, 0 clé API, 0 référence à un autre projet personnel).

**Fichier détaillé** : [mission_07_publication_repo_public.md](mission_07_publication_repo_public.md)

**Résumé** : FJD candidate à des formations et veut ce repo comme preuve de travail public (historique de commits datés). L'audit réel du 29/09 a infirmé le chiffrage de la rédaction : ce n'était pas **7** fichiers mais **14** (7 de code + 7 de documentation) qui portaient le chemin absolu du dossier utilisateur — la mission détaillée a été corrigée en conséquence. `IMPORT_MD_MODEL.indt` (1,3 Mo) : **exclu** (binaire de test, non essentiel à la démonstration). Livrables : chemins nettoyés, README public rédigé, revérification finale par grep. Le passage effectif en public reste une décision/action humaine, hors périmètre de la mission — **il a été autorisé et exécuté le 30/09/2026** (commit `09d8d43`, remote `origin`, push de `main`), cf. « CR — Mission 07, suite » ci-dessous.

---

### CR — Mission 07 (29/09/2026)

**Diagnostic à l'ouverture** — l'inventaire par `grep -rIn` du nom de dossier utilisateur a rendu **14 fichiers**, et non 7 :

- **7 fichiers de code** : `tools/probe_menu3.jsx`, `tools/probe_menu3_file_handler.jsx`, `tools/probe_04bis_lien.jsx`, `tools/probe_04ter_icml.jsx`, `tools/probe_05ter_integration.jsx`, `tools/probe_startup.jsx`, `uxp/com.fjd.importmd.sonde/main.js` ;
- **7 fichiers de documentation** : `doc/wiki_extendscript_indesign.md`, `COMMUNICATION/mission_01_plugin_indesign_import_md.md`, `COMMUNICATION/mission_02_indentation_listes.md`, `COMMUNICATION/mission_04_audit_lien_dynamique.md`, `COMMUNICATION/mission_04ter_sonde_icml.md`, `COMMUNICATION/m03_etape8_handoff.md`, `COMMUNICATION/ROADMAP.md`.

**Décision de remplacement, prise par nature de fichier** (et non par simple masquage) :

- **Code exécuté depuis le panneau Scripts** ⇒ chemin **dérivé du script**, jamais écrit en dur : `new File($.fileName).parent.fsName`. Le point décisif est que **`$.fileName` est un global du MOTEUR**, pas une variable du script : les gestionnaires d'événement de `probe_menu3.jsx` (dont le but est justement de tester la survie de l'état après la fin du script) continuent donc de journaliser **sans dépendre d'une variable du script** — la sémantique de la sonde est préservée, pas contournée.
- **Code hors panneau Scripts** (`probe_05ter_integration.jsx`, `probe_startup.jsx`, `uxp/.../main.js`) ⇒ **placeholder explicite** `var PROJET_DIR = "/chemin/vers/INDD/IMPORT_MD";`, avec commentaire d'adaptation.
- **Documentation** ⇒ **`~`** (chemin relatif au dossier utilisateur), forme lisible et non nominative.

**Contrôle de non-régression sémantique** — les quatre variables nettoyées (`HARD_LOG_PATH`, `MEM_PATH_PANEL`, `S3H_HARD_LOG`, chemins des gestionnaires) étaient des **chaînes** avant la modification et le sont restées : leurs usages aval les enveloppent dans `new File(...)`. Un premier essai sur `probe_menu3.jsx` avait produit une parenthèse orpheline (`new File($.fileName).parent.fsName + "...")`, qui affectait une **chaîne** à une variable attendue comme objet `File` : détecté par `grep -n "probe_menu3.log"` (lignes 135/149/165) puis corrigé en `new File(new File($.fileName).parent.fsName + "/probe_menu3.log")`.

**Validation syntaxique** — `node` refusant l'extension `.jsx`, chaque sonde a été parsée comme corps de fonction :

```
tools/probe_menu3.jsx                OK
tools/probe_menu3_file_handler.jsx   OK
tools/probe_04bis_lien.jsx           OK
tools/probe_04ter_icml.jsx           OK
tools/probe_05ter_integration.jsx    OK
tools/probe_startup.jsx              OK
uxp/com.fjd.importmd.sonde/main.js   OK   (node --check)
```

**Captures supprimées** (décision FJD : « capture on supprime, ça n'apporte rien ») — `doc/captures/` retiré du suivi et du disque : 5 PNG (**1 608 458 · 116 133 · 1 622 065 · 1 672 945 · 116 953 octets**, ≈ 4,9 Mo) + un `.DS_Store`. `ls doc/captures` → `(dossier absent)`.

**`IMPORT_MD_MODEL.indt` (1,3 Mo)** — **exclu** via `.gitignore`, avec les artefacts d'exécution du plugin (`import_md_mapping_memory.txt`, `import_md_errors.log`) qui n'ont jamais à être versionnés.

**README public** — le README technique existant (installation, utilisation, architecture, dépannage) a été déplacé en `doc/GUIDE_UTILISATION.md` (`git mv`, donc l'historique du fichier est conservé), pour libérer la racine à un README de présentation destiné à un lecteur qui découvre le projet : ce que fait l'outil, **ce que le dépôt démontre** (wiki de 45 cas à statut de source explicite `sourcé`/`mesuré`/`mixte`, protocole de test qui distingue le réel de la simulation, sondes instrumentées), état réel des chantiers, stack, structure du dépôt, liens vers le wiki et le ROADMAP, limites connues, licence.

**Références à d'autres projets personnels** — le premier `grep` a trouvé 3 occurrences (`doc/architecture/PATRON_wiki_recursif.md` ×2, `COMMUNICATION/mission_04_audit_lien_dynamique.md` ×1) ; elles ont été reformulées de façon générique (« d'autres projets documentaires », « noms de dossier comportant `é` ou `ü` »).

**Contrôles de sortie — sorties brutes** :

```
=== 1. chemin perso ===            (VIDE)
=== 2. autres projets FJD ===      (VIDE)
=== 3. cle API ===                 (VIDE)
=== 4. U+FFFD ===                  (VIDE)
=== 5. captures ===                (dossier absent)
```

La condition de sortie de la mission — « 0 chemin personnel en dur, README rédigé et lisible pour un tiers » — est satisfaite. **Reste hors périmètre, par décision explicite de la mission** : l'action GitHub elle-même (déclaration du remote, `git push`, bascule en public), qui est une décision humaine.

### CR — Mission 07, suite : publication effective (30/09/2026)

FJD a autorisé et demandé l'action GitHub (« push stp »), qui était hors périmètre de la mission.

- **Commit de nettoyage** : `09d8d43` « M07: nettoyage pour publication publique + README public » (27 fichiers, +1219/−211). Le commit antérieur `2fd98e2` ne contenait que le brief de mission (ROADMAP + fichier détaillé) — tout le nettoyage restait dans l'arbre de travail.
- **Remote ajouté** : `origin` = `https://github.com/FJDaz/IA-INDD.git` (aucun remote n'existait).
- **Push** : `git push -u origin main` → branche `main` liée à `origin/main`.

**Échec rencontré et cause identifiée** — le premier push a rendu :

```
error: RPC failed; HTTP 400 curl 22 The requested URL returned error: 400
send-pack: unexpected disconnect while reading sideband packet
fatal: the remote end hung up unexpectedly
```

Le dépôt distant existait bien et était **vide** (`git ls-remote origin` sans aucun ref, `curl` → HTTP 200 sur le dépôt et sur le compte). La cause est **HTTP/2**, cassé pour `git push` sur ce poste (git 2.39.2 Apple, macOS 22) ; le correctif est `git config http.version HTTP/1.1` (posé en configuration **locale du dépôt**, pas globale), avec `http.postBuffer 524288000`. Le second essai a réussi.

**Vérification du push — sorties brutes** :

```
refs distants :  09d8d434162a27483d0721be789f00df4e0822de  HEAD
                 09d8d434162a27483d0721be789f00df4e0822de  refs/heads/main
local  : 09d8d434162a27483d0721be789f00df4e0822de
origin : 09d8d434162a27483d0721be789f00df4e0822de
README.md distant -> HTTP 200   (contenu = « # Import Markdown → InDesign »)
```

**Limite signalée à FJD — le nettoyage couvre l'arbre, pas l'historique.** Le contrôle de sortie de la mission porte sur les fichiers de l'arbre courant (tous au vert). Mais un dépôt public expose **tous** les commits : `git log -S` retrouve le chemin utilisateur dans **8 commits**, dont l'initial `647f691`, sur **15 fichiers** — dont `COMMUNICATION/mission_03_reconstruction_minimale.md`, qui n'existe plus dans l'arbre actuel mais reste lisible dans l'historique. **Aucune clé API ni aucun secret dans l'historique** (vérifié par `git grep` sur toutes les révisions). Remédiation possible (branche orpheline / squash + force-push) : **décision FJD — TRANCHÉE ET EXÉCUTÉE le 30/09/2026, cf. « CR — Mission 07, clôture » ci-dessous.**

### CR — Mission 07, clôture : réécriture d'historique (30/09/2026)

FJD a tranché la limite ci-dessus et demandé l'action : « **Tu force push stp** ».

**Levée d'ambiguïté préalable.** Au moment de la demande, local et distant étaient **identiques** (`85fcdfe`) : un `--force` simple n'aurait alors rien changé. Le seul sens possible était donc une **réécriture d'historique** — la seule remédiation qui retire réellement le chemin personnel des commits publics. C'est cette lecture qui a été retenue.

**Décisions FJD (non ambiguës)** :
- **Conserver les commits** (pas de squash) : purger le chemin des commits concernés sans écraser l'histoire de construction.
- **Outil : `git filter-repo`** (ni branche orpheline, ni `filter-branch`).
- **Neutraliser l'email d'auteur** → adresse `noreply` GitHub.

**Pipeline exécuté** :
1. Sauvegarde complète : `git bundle create IA-INDD-backup-20260930_163318.bundle --all` → **l'unique filet de sécurité** (réécriture = irréversible).
2. `/tmp/fr-expressions.txt` : `francois-jeandazin==>~` (+ chemin absolu complet `==>~`).
3. `/tmp/fr-mailmap.txt` : `François Jean Dazin <FJDaz@users.noreply.github.com> François Jean Dazin <francois.jean.dazin@gmail.com>`.
4. `git filter-repo --force --replace-text /tmp/fr-expressions.txt --mailmap /tmp/fr-mailmap.txt`.
5. `git remote add origin …` — **`filter-repo` supprime `origin`** : il faut le re-déclarer avant de pousser.
6. `git push --force-with-lease origin main` (correctif **HTTP/1.1** déjà posé en config locale du dépôt).

**Preuve de la correspondance des hashes (empreinte d'arbre, bundle de sauvegarde vs dépôt réécrit)** — les hashes cités dans le CR de publication ci-dessus sont **pré-réécriture** et n'existent plus (`git cat-file -t 09d8d43` → `fatal: Not a valid object name`) :

```
85fcdfe  (CR M07)     arbre 8b14ba456f440de82bd1174c0bcfa99b15d7aa60  ->  f4942a0  arbre 8b14ba456f440de82bd1174c0bcfa99b15d7aa60  (IDENTIQUE)
09d8d43  (nettoyage)  arbre 32a9e85e7cedbf78427aa26fcad693dfc58ac774  ->  662ccd6  arbre 32a9e85e7cedbf78427aa26fcad693dfc58ac774  (IDENTIQUE)
2fd98e2  (brief)      arbre 105fe11e312eefbe0d785dcca35e7b1440c64b3d  ->  8311d26  arbre 4bcea7cacffff76567c6883aeccc157d8b5aa13a  (DIFFÈRE : le chemin perso y est remplacé par ~)
```

**Vérification finale — sorties brutes du dépôt réel** :

```
git rev-parse HEAD               7e3f3224c7c8748dae8a91953f62835326e6c332
git ls-remote origin             7e3f3224… HEAD   /   7e3f3224… refs/heads/main
git status -sb                   ## main...origin/main          (local == distant)
git rev-list --count HEAD        69                             (histoire conservée, aucun squash)
git log -S 'francois-jeandazin'  -> 0                           (chemin perso ABSENT de l'historique)
grep -rIl 'francois-jeandazin' . -> 0                           (chemin perso ABSENT de l'arbre)
git log --format='%ae' | sort -u -> FJDaz@users.noreply.github.com   (email UNIQUE)
```

**Résultat** : la **limite signalée est LEVÉE** — le dépôt public n'expose plus le chemin personnel, ni dans l'arbre ni dans l'historique, l'histoire de construction est intégralement préservée (69 commits) et l'email d'auteur est neutralisé.

**Deux réserves honnêtes** :
- **Irréversibilité** : `--force` a réécrit l'historique **public** ; le bundle de sauvegarde est l'unique recours.
- **Identité git globale** : `~/.gitconfig` émet encore `francois.jean.dazin@gmail.com` sur les **futurs** commits (le mailmap n'a corrigé que le passé). À changer dans `~/.gitconfig` ou via `git config --local user.email …` pour rendre la neutralisation durable.

**Question résiduelle du README — close.** Le doc « Personnaliser son UI INDD avec l'IA » cité par FJD **existe** : `doc/formation/Personnaliser son UI INDD avec L'IA.xml` (+ `doc/formation/images/`, 4 JPEG). Un rendu Markdown fidèle en a été tiré : `fixtures/formation_reference.md` (136 lignes, 86 puces, 0 U+FFFD). Ces deux chemins sont encore **non suivis** par git à l'instant de ce CR.

---

## Mission 04 — Audit : lien dynamique vers le Markdown source (UXP vs update() natif vs solution maison)

**Statut** : 🟡 PARTIELLE (mise à jour 29/09/2026) — **réorganisée le 28/09/2026 par l'Architecte en entonnoir à 3 étapes avec go/no-go** (cf. « ORDRE D'EXÉCUTION » ci-dessous) ; **socle documentaire ACQUIS** (préambule cross-platform ratifié par FJD + complément d'audit intégré : 3 mécanismes de lien + 2 faits négatifs + 1 affirmation trop forte corrigée) ; **cible recadrée par FJD** (bot pilote InDesign + pont de transport, pas un panneau d'affichage) ; **étape 1 = sonde runtime (`04bis` puis `04ter`) : EXÉCUTÉE EN RÉEL les 29/09/2026 — le verdict tombe : la voie A (lien natif) ÉCHOUE pour notre besoin ⇒ BIFURCATION VERS LA VOIE B** ; étapes 2 et 3 **fermées par construction**. Le **go/no-go de l'étape 1 est donc prononcé**, et **l'axe 2 (le bot / le pont) est MIS DE CÔTÉ — différé, réservé, pas abandonné (décision FJD du 29/09/2026)** : il n'est requis que pour GREP / gabarits PDF / suivi de fabrication, **pas** pour « relancer le pipeline après modification du `.md` ». **La suite du projet passe par la voie B ⇒ [Mission 05](mission_05_voie_b_empreinte_md.md).**

**Fichier détaillé** : [mission_04_audit_lien_dynamique.md](mission_04_audit_lien_dynamique.md)

**Cas wiki consultés** : Cas 37 (lien natif / modèle d'objet `Link`, créé le 28/09 dans le cadre de cette mission), Cas 14, Cas 17, Cas 18, Cas 20, Cas 22, Cas 24, Cas 27, Cas 35, Cas 36.
**Cas wiki produits/enrichis** : **Cas 37** (créé le 28/09 — mécanismes de lien ; **corrigé par la mesure des 29/09** : `createTextFragmentLink()` échoue **11/11** vers un `.md`, et `place()` d'un `.md` donne `links.length = 0`) ; le wiki est enrichi des constats des deux sondes (`Link.update()` d'un lien ICML **ne recharge pas** le contenu — contrôle de fraîcheur seulement ; `exportFile` **n'écrase jamais** ; `alert` en **lecture seule**). Les cas correspondants (**40** à **43**) sont recensés par la **Mission 03quater**, qui solde la dette d'écriture du wiki.

**ORDRE D'EXÉCUTION (Architecte, 28/09/2026)** — la mission est un **entonnoir à 3 étapes**, pas une liste plate de 4 points : **étape 0** socle documentaire ✅ acquise → **étape 1 = sonde runtime (`04bis` puis `04ter`) — EXÉCUTÉE EN RÉEL le 29/09/2026, verdict tombé (voie A écartée par mesure)** → **go/no-go** → **étape 2 = décision (déclencheur + pont)** → **étape 3 = recommandation + périmètre mission 05**. La sonde **précède** la décision parce que son verdict **ferme des branches entières** : c'est exactement ce qui vient d'arriver à la **voie A**.
**Axe 1 (déclencheur)** : voie A = lien natif (`createTextFragmentLink()` + `Link.update()`, **conditionnée** à Q3) ; voie B = mécanisme maison (empreinte du `.md` en métadonnées — **plancher toujours disponible**, ex-« point 3 »). **Axe 2 (exécution)** : **le pont n'est requis que pour GREP / gabarits PDF / suivi de fabrication** — pour « relancer le pipeline après modification du `.md` », **aucun pont n'est nécessaire** (ex-« point 2 »).
**Axe 2 — MIS DE CÔTÉ le 29/09/2026 (décision FJD : « on met de côté le bot »)** : l'axe 2 est **différé et réservé**, **pas abandonné** — il se rouvrira **le jour où les cas d'usage l'exigeront** (GREP sur scopes resserrés, gabarits PDF de couvertures, suivi de fabrication), jamais par réflexe. Aucun des quatre ponts candidats (réseau UXP, `app.doScript()` depuis UXP, polling fichier ExtendScript, CEP) n'est instruit à ce jour. **La suite du projet passe donc par la voie B** ⇒ [Mission 05](mission_05_voie_b_empreinte_md.md).
**Règle structurelle** : aucune mission pilotée par l'Architecte ne porte un livrable de code sans **exécuteur nommé**. **Satisfaite** : FJD a nommé **DS** exécuteur le 28/09/2026, et les deux sondes (`04bis`, `04ter`) ont été écrites **et exécutées en réel**.
**Correspondance** (les numéros acquis ne se réécrivent pas) : point 1 → étape 1 ; point 2 → axe 2 ; point 3 → axe 1 voie B ; point 4 → étape 3.

**Socle (ex-« étape 1 ») — préambule cross-platform (28/09/2026) : FAITE, ratifiée par FJD.** Verdict tranché (passe DS, insert dans le fichier de mission avant « Contexte et objectif ») : UXP **n'est pas** « deux dialectes séparés par OS » — un seul code source, une seule surface d'API, une seule chaîne de distribution — **mais la parité n'est pas acquise** : différences de comportement par OS **réelles, datées, officiellement reconnues**, ni marginales ni systématiques. Trois familles documentées : (a) **WebView bi-moteur** — WebView2 (Windows) vs WKWebView (macOS), distinction écrite noir sur blanc par Adobe dans le changelog UXP 9.1 ; (b) **chemins de fichiers** — correctif UNC UXP 9.4 + topics 7342 (« développé sur Mac, file picker cassé sous Windows ») et 7713 ; (c) **focus clavier / raccourcis** — topic 12145, InDesign 21.2 sous Windows 11. **Preuve la plus forte : topic 6650** (« Operating system specific problems with InDesign APIs? », 2023-08-09) — un bogue **macOS-only confirmé par Adobe** (« random bug on Mac related to event loop processing ») est apparu sur du code **sans aucune dépendance OS** ⇒ **la divergence n'est pas prévisible par lecture du code**, seule la mesure sur les deux OS la détecte. Honnêteté bidirectionnelle : des signaux **Windows-only** et **macOS-only** existent tous deux (topic 12104, Photoshop, 2026-08-19) — l'échantillon étant biaisé par la collecte, **aucune conclusion quantitative**. **Limite signalée** : aucune machine Windows disponible ⇒ verdict fondé sur documentation officielle + retours communautaires datés, **jamais** sur une mesure personnelle. Traitement des 4 preuves de la première passe de l'Architecte : n°1 confirmée, n°2 confirmée **et enrichie** (UXP 9.4 / 9.1 / 9.0 + matrice), n°3 **requalifiée**, n°4 **retirée** faute de source datée (non citable en l'état).

**Arbitrages FJD (28/09/2026)** : (1) **le verdict est ratifié** comme base de la suite ; (2) **réserve « UXP sans WebView »** à instruire — FJD : « si on veut faire un assistant HCI on est dans la sauce, non ? » ; (3) **le risque « pas de machine Windows pour tester » est ACCEPTÉ** — mais il reste entier (aucun plan de test mono-OS ne suffira pour Windows).

**Recadrage de la cible (FJD, 28/09/2026) — structurant pour tout le chapitre.** FJD précise que l'intention n'était **pas** un panneau affichant du Markdown mis en forme, mais un **bot qui pilote InDesign** : génération **et lancement** de requêtes **GREP** sur des scopes resserrés, interprétation de **gabarits PDF de couvertures**, interprétation de **messages de suivi de fabrication**. Conséquences : (a) l'UI riche est **accessoire** pour ces cas ⇒ **« UXP sans WebView » n'est pas disqualifiant** ; (b) le point dur devient le **pont** — exécuter du code *dans* InDesign depuis un process externe : candidats réseau UXP, CEP (Chromium+Node, en fin de vie), **polling fichier ExtendScript** (= point 3 de la mission, dont la crédibilité remonte nettement), ou aucun pont (bot qui n'écrit que les fichiers sources) ; (c) le **point 1 (`Link.update()`) est contourné** si le bot **réécrit** le contenu au lieu de **lier** un fichier ; (d) le risque OS **change d'adresse** — de la famille « WebView bi-moteur » vers la famille « transports et chemins », qui est précisément celle où le préambule a trouvé 3 signaux Windows-only sur 5 : **le risque migre, il ne s'efface pas**. ⚠️ Modifier les prémisses d'une mission relève de l'Architecte : le libellé du point 2 reste à réviser — **DS ne l'a pas restructuré**.

**Prochaine action (lancée le 28/09)** : vérification des capacités réelles pour trancher entre les ponts — (i) **transport réseau UXP** (WebSocket / `fetch`, permissions manifest), (ii) **`app.doScript()`** depuis UXP, (iii) **`findGrep` dans le DOM UXP** (cœur du cas n°1), (iv) statut réel de **CEP** dans la version courante.

**Premiers résultats de la recherche sur le pont (28/09/2026) — un fait décisif.** Le pont candidat n°1 (réseau UXP) vient d'être documenté sur une source datée et non ambiguë : **topic Discourse 8528, « Windows InDesign version 20 WebSocket not connecting »** (créé 2024-10-18, **14 posts**, tag `bug`, catégorie InDesign). Faits établis : sous **Windows**, tout WebSocket reste indéfiniment à l'état « CONNECTING », **aucune entrée dans l'onglet Network du débogueur**, et **aucun** des événements `onOpen`/`onClose`/`onError`/`onMessage` n'est déclenché — c'était une **régression** (le même code fonctionnait sur Mac InDesign 20, sur Windows Photoshop, et sur les versions **antérieures** de Windows InDesign). Bug reporté par les utilisateurs sur uservoice `#49192655` (« Websocket not connecting in windows », InDesign 20.0.1 / Windows 11 / manifest v5). Citation de simonrelayter (2024-12-09) : « *WebSockets work on Mac InDesign, Photoshop and Windows Photoshop but not Windows InDesign. Socket is never connected. This is the second mayor bug we are encountering in the InDesign UXP plugin framework.* » Confirmé encore cassé sous Windows sur **InDesign 2025** (sbeandev, 2025-07-03 : « *On macOS, it works fine. Only InDesign 2025 on Windows problem occurs.* »). **Puis résolu** — dernier post du même fil (sbeandev, 2025-11-06) : « *FYI : InDesign 2026 has corrected the issue.* » ⇒ **le pont réseau n'est donc PAS condamné** (trou 20→2025 sous Windows, comblé en 2026), **mais il est historiquement fragile et totalement invisible tant qu'on n'a pas une machine Windows** — exactement la limite que FJD a acceptée. Indice de mitigation non confirmé, donné par Jarda (Focus-Group Adobe) : « *On Windows if your web sockets are using ping with empty message it won't work* ».

Autres acquis de la même recherche, tous sourcés : **(1) pas de socket brut** — topic 5908 « Communicate with other apps over TCP is Impossible? » (2023-02-23, 8 posts) : le transport UXP passe par **WebSocket / `fetch`**, pas par TCP libre ; complété par topic 6991 « Uxp use socket to communicate with external programs issue » (résolu). **(2) les permissions réseau du manifest sont un piège classique et coûteux** — topic 11062 « Plugin not permitted to access the network apis » (2025-06-17, **15 posts**, fermé par Adobe) : l'auteur avait `domains: "all"` **et** les domaines explicites, et *aucune* requête ne passait ; diagnostique par Justin Taylor (Hyper Brew) : « *Manifests are finicky* » ⇒ la parade est de **partir d'un manifest qui marche** et d'y remettre ses propriétés, de vérifier l'orthographe exacte du domaine, d'essayer **sans numéro de port**, et de **décharger/recharger** le panneau après chaque changement de manifest. Même famille : 11230 « [Network Permission Issue] ATTN: Adobe — Manifest Domain Entry Not Granting Fetch Access » (2025-07-30, **sans réponse Adobe**), 10557 « … Despite "domains: all" » (2025-04-05), 4714 (2022, résolu), 9153 (2025, résolu). **Directement pertinent pour notre cas : topic 11509 « Allowing Network access to a specific PORT? » (2025-10-30, 1 post, SANS RÉPONSE)** — or un bot qui pilote InDesign écoutera précisément sur un **port local**. **(3) `wss` et historique** — topic 2422 « Is Websocket Secure (wss) supported? » (2021-01-11, 24 posts, réponses de staff Adobe). **(4) le débogage ExtendScript par ESTK est mort** — Adobe l'écrit sur la page OMV : « *As of InDesign 18.0, ESTK no longer reliably connects to InDesign* » ⇒ raison supplémentaire de ne pas fonder le pont sur l'outillage ExtendScript historique. **(5) le DOM InDesign est intégralement documenté sous UXP** — l'OMV en ligne (`developer.adobe.com/indesign/uxp/dom/api/`, **maj 5/11/2026**) expose bien les classes dont les 3 cas d'usage de FJD ont besoin : `Document`, `Story`, `Text`, les préférences GREP, `PDFExportPreset`, `PrintPreference`, la famille `DataMerge*` ⇒ **aucun des trois cas d'usage n'est hors API**, le seul inconnu restant est le **transport** et la **variante d'OS**.

**Conséquence pour la suite** : le choix du pont ne peut pas être tranché par la seule lecture documentaire — il faut mesurer (leçon du préambule). Trois vérifications encore ouvertes avant d'écrire la recommandation (point 4) : l'existence et la signature de **`app.doScript()`** côté UXP, la présence de **`findGrep`** dans le DOM UXP, et le **statut réel de CEP**. ⚠️ Limite non levée : toujours **aucune machine Windows** — or c'est précisément sous Windows que les deux pannes réseau de ce paragraphe se manifestent. **Non fait à ce stade : aucune mesure, aucune implémentation — la mission reste un audit.**

**Résumé** : FJD veut qu'InDesign détecte (via son panneau Liens natif si possible) quand le `.md` source a changé, et qu'un clic relance notre pipeline complet (reparsing + mapping), pas juste un import brut. Exploration préalable avec l'Architecte (Claude) : `place()` existe sur `Document`/`InsertionPoint`/`Text` ; `Story.itemLink` et `Link.update()`/`.status` sont scriptables, mais `Link.update()` semble être une boîte noire non pilotable (relance vraisemblablement un import natif brut, écrasant tout mapping fait après coup) — **non confirmé par test réel**. Notre méthode d'insertion actuelle (assignation `.contents`, jamais `place()`) **ne crée aucun `Link` par elle-même** — ⚠️ formulation **corrigée le 28/09** : l'affirmation initiale (« ne peut *structurellement* pas créer de `Link` ») était **trop forte**, la doc officielle exposant `InsertionPoint.createTextFragmentLink()`, qui crée un `Link` sur un fragment de texte **déjà présent**. Piste alternative repérée mais non auditée : **UXP** (framework JS moderne d'Adobe pour panneaux InDesign, pas C++) — pourrait éviter le mur du SDK propriétaire, mais compatibilité avec notre code existant non vérifiée.



---

## Mission 05 — Voie B : empreinte maison du `.md` en métadonnées du document

**Statut** : 🔴 À FAIRE — **rédigée le 29/09/2026**, en attente du go FJD **et d'un exécuteur nommé** (règle structurelle de la mission 04 : aucun livrable de code sans exécuteur nommé).

**Fichier détaillé** : [mission_05_voie_b_empreinte_md.md](mission_05_voie_b_empreinte_md.md)

**Position** : **implémentation de la feature** — sortie naturelle de la mission 04, dont le go/no-go est prononcé (**voie A écartée par mesure ⇒ bifurcation vers la voie B**).

**Cas wiki consultés** : Cas 36, 37, 39, 40, 42, 43.
**Cas wiki produits/enrichis** : **à produire** — un cas `extractLabel`/`insertLabel` (persistance en métadonnées) et un cas `File.modified`/`File.length` (fiabilité réelle de l'empreinte).

**Résumé** : la chaîne à implémenter tient en **quatre temps, chacun mesurable** — **V1 empreinte** de la source (reproductible **et** sensible : un caractère modifié ⇒ empreinte différente), **V2 persistance** dans un **second label** à côté du mapping existant (le projet utilise déjà `extractLabel`/`insertLabel` avec `LABEL_NAME = "md-style-map"` et un format plat ES3), **V3 comparaison** produisant **3 états** (identique / différent / source absente), **V4 réaction** (boîte de dialogue **annulable** puis relance du **pipeline complet**, pas d'un import brut). Contrainte ES3 : pas de `JSON`, pas de hash cryptographique ⇒ l'empreinte se construit sur `File` (`length`, `modified`) et/ou une somme de contrôle simple, à **vérifier en réel** — hypothèse posée par l'Architecte, **à contrôler avant de coder**. Non-régression exigée : le label `md-style-map` reste **intact** (contrôle avant/après). **Ce que la voie B ne fait pas** : elle ne dit pas *quoi* a changé (besoin distinct, nommé et hors périmètre).

**Hors périmètre** : **le bot / le pont (axe 2 de la mission 04) — mis de côté, différé, réservé (FJD 29/09/2026)** ; le *diff* sémantique ; UXP ; InCopy ; la réouverture de la voie A ; la réécriture du pipeline ou du mapping.

**Règle structurelle** : la mission **porte un livrable de code** ⇒ elle ne démarre **pas** sans exécuteur nommé (DS) ou autorisation explicite d'exception pour l'Architecte. **Question ouverte à FJD : qui écrit cette mission ?**

---

# CHAPITRE — Implémentation du contenu du panneau UXP

**Ouvert le 30/09/2026** (demande FJD : « tu notes ce plan dans la RM, chapitre implémentation du contenu du panneau UXP — missions 1, 2, 3… »).

**Numérotation** : les missions de ce chapitre se numérotent **1, 2, 3, 4** — **numérotation LOCALE au chapitre**. Elle **ne consomme pas** les numéros globaux du projet (`Mission 00` → `Mission 06`) et **n'entre pas en collision** avec eux. Dans les échanges et les CR, on écrit **« Chapitre Panneau / Mission N »**.

**Socle acquis (30/09/2026)** : le panneau `com.fjd.importmd.sonde` est **chargé dans InDesign** (via UDT, mode développeur) et **visible** — panneau dockable, disponible dans le menu « Modules externes ». Ses **5 boutons de sonde sont certifiés par log brut** (boutons 1, 2, 5 le 29/09 ; boutons 3 et 4 le 30/09 — log `UXPLogs_2026-09-30_11-13-20_026477.log`). Ce chapitre transforme la **sonde** en **outil**.

**Ce que ce chapitre n'est pas** : ce n'est **pas** la Mission 05 (empreinte du `.md`, déjà implémentée — `m05BuildFingerprint`, `m05DecideState`, `saveSourceFingerprint`). Le présent chapitre **consomme** ce travail, il ne le refait pas. Ce n'est pas non plus le chantier « analyseur Markdown standard » (cf. [note d'architecture](../doc/architecture/NOTE_analyseur_markdown_standard.md)) — **différé**.

**Faits techniques de départ (mesurés, à ne pas re-mesurer)** :
- L'étiquette `md-source-fingerprint` rangée dans le document contient **déjà** : `path`, `name`, `size`, `checksum`, `modified`, `v`.
- La fonction `m05DecideState` rend **déjà** les **4 états** : `ETAT_JAMAIS_IMPORTE` / `ETAT_SOURCE_ABSENTE` / `ETAT_IDENTIQUE` / `ETAT_DIFFERENT`.
- ⇒ **Les « signaux de modification » et « d'absence » ne sont pas à concevoir** : ils sont calculés par du code déjà certifié. Les missions 1 à 3 sont de l'**assemblage**, pas de la conception.
- Le bouton 3 de la sonde a prouvé que `import_md.jsx` est **joignable** depuis le panneau (`app.doScript`) ; le bouton 4 a prouvé qu'on **lit un `.md` sur le disque** et qu'on en tire les caractéristiques (mots, signes, lignes, date).

**Contrainte transversale (règle FJD du 30/09)** : toute écriture dans le document devra être enveloppée dans la **méthode `app.doScript()` avec l'option `UndoModes.ENTIRE_SCRIPT`** — « sans cela, l'utilisateur devra faire `Ctrl+Z` 60 fois pour revenir en arrière ». **Mesuré dans `import_md.jsx` : 0 occurrence** de `UndoModes` / `doScript` / `undo` ⇒ la dette est réelle sur l'import existant.

**Questions conditionnant la mission 2** :
1. **Une source ou plusieurs ?** `insertLabel` **ÉCRASE** son homonyme ⇒ il n'y a aujourd'hui **qu'une seule source par document**. La « liste des `.md` » est donc un **tableau à 1 ligne** (0 si rien n'a jamais été importé).
   → ✅ **TRANCHÉE (FJD, 30/09/2026) : une source par document pour l'instant.** L'étiquette **n'évolue pas** vers N sources. La liste est donc légitimement un tableau à 0 ou 1 ligne.
2. **Document actif, ou tous les documents ouverts ?** Le panneau est ancré à l'**application**, pas à un document. **ENCORE OUVERTE** — *proposition de l'agent : le document actif.*

---

## Chapitre Panneau — Mission 1 — Lire l'identité de la source depuis le document

**Statut** : ✅ TERMINÉE — 30/09/2026 : lecture réelle prouvée sur un document importé (chemin, nom, taille, empreinte, date) **et** cas « jamais importé » correctement distingué de « lecture ratée » ; preuve brute ci-dessous.

**Pourquoi elle vient en premier** : c'est le **socle**. Sans elle, le panneau n'a rien à afficher — et c'est aussi la **mesure de départ** : on verra dans le journal **ce que contient réellement l'étiquette** sur un document réel, au lieu de le supposer.

**Ce qui est neuf** : la sonde actuelle **ne lit pas l'étiquette du document**. Ses 5 boutons font autre chose (DOM, `doScript`, joignabilité du moteur, lecture d'un `.md`, contrôle négatif). **Lire l'étiquette = le vrai nouveau morceau.**

**À faire** : depuis le panneau, interroger le document actif et récupérer l'étiquette `md-source-fingerprint` ; en extraire **chemin, nom, taille, date, empreinte** ; les exposer au panneau.

**Critère de fin** : log brut montrant la lecture réelle sur un document où un import MD a **déjà** été fait (chemin, taille, date, empreinte), **et** le cas « document sans étiquette » (jamais importé) correctement distingué du cas « lecture ratée ».

**Cas limite à ne pas confondre** : *jamais importé* ≠ *lecture échouée*. Une lecture ratée ne doit **jamais** ressembler à un état normal (règle déjà appliquée par `m05BuildFingerprint` qui rend `null` explicitement).

### CR — 30/09/2026 — lecture de l'identité prouvée (cas positif + cas négatif)

**Livré (lecture seule — aucune écriture dans le document)** :
- Bouton **6** ajouté à la sonde : « Identité de la source (étiquette du doc) ».
- Lecture par la route **DOM UXP `doc.extractLabel()`** (repli ExtendScript via `app.doScript` si la route 1 échoue) ; les **4 cas** sont séparés : aucun document / étiquette absente / étiquette présente mais illisible / identité lue.
- Bandeau de **statut visible** (vert = succès, rouge = échec) en tête de panneau, et journal recopié dans un fichier `.txt` — le presse-papier UXP est **absent** de ce runtime (mesuré : `uxp.clipboard.copyText indisponible`) et un panneau UXP ne laisse pas sélectionner le texte.

**Cas POSITIF** — log brut, `sonde_import_md_journal.txt`, 30/09 15:55 :
```
nom du document actif  -> Sans titre-4
route utilisee : DOM UXP doc.extractLabel()
longueur de l'etiquette brute : 206 caractere(s)
identite de la source :
  version (v)     : 1
  nom             : mission_03_nonregression_all.md
  chemin          : ~/INDD/IMPORT_MD/fixtures/mission_03_nonregression_all.md
  taille          : 19874 caractere(s) au moment de l'import
  empreinte       : 187411491
  modifie (stamp) : 1790557963000  -> 9/28/2026, 3:12:43 AM
mapping md-style-map : present
VERDICT M1 : identite lue depuis le DOCUMENT (pas depuis le disque).
```

**Cas NÉGATIF** — « jamais importé », distinct de la lecture ratée : document `Sans titre-3`, 30/09 15:01 :
```
longueur de l'etiquette brute : 0 caractere(s)
CAS « ETIQUETTE ABSENTE » : ce document n'a jamais recu d'import MD.
(etat NORMAL, ce n'est pas une erreur)
VERDICT M1 : jamais importe -> la liste du panneau aura 0 ligne.
```
⇒ Les deux états sont **distingués** : étiquette vide ⇒ « jamais importé » (normal) ; exception des deux routes ⇒ « LECTURE RATEE » (erreur réelle). **Critère de fin satisfait sur les deux moitiés.**

**Défaut trouvé et corrigé au passage** : deux copies de `import_md.jsx` coexistaient. La copie exécutée par le **menu InDesign** (`~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx`, 28/09) était **antérieure** à la Mission 05 : elle écrivait le **mapping** mais **pas** l'empreinte — d'où un mapping « present » avec une étiquette vide, donc un « jamais importé » affiché à tort. La copie du menu a été **remplacée** par celle du workshop (`cmp` ⇒ identiques **octet par octet**, 162442 o) ; l'ancienne est conservée en `import_md.ancien-20260928.jsx.bak`. **Leçon** : le moteur doit être lancé depuis une copie à jour — un décalage workshop/menu fausse toute mesure.

**Reste ouvert (hors Mission 1)** : la question 2 (document actif vs tous les documents) ; la dette `UndoModes.ENTIRE_SCRIPT` (mesurée à 0 occurrence, à traiter en Mission 4).

---

## Chapitre Panneau — Mission 2 — La liste et ses signaux

**Statut** : ✅ TERMINÉE — 30/09/2026 : **les deux moitiés du critère sont prouvées en réel** — contrôle négatif **0 ligne** sur document vierge (CR du 30/09, journal brut) **et** cas positif **1 ligne** sur document étiqueté, avec l'état **réel** rendu par le moteur (`identique`, CR ci-dessous).

**Contenu (spec FJD du 30/09)** : un **tableau** — une ligne par source — portant :
- le **signal d'état** : `identique` / `modifié dans la source` / `source absente` ;
- le **chemin** de la source ;
- la **date de dernière modification** ;
- les **caractéristiques** : **nombre de mots**, **nombre de signes** (calibrage).

**Ce qui est de l'assemblage** : les états viennent de `m05DecideState`, les caractéristiques du bouton 4 de la sonde (déjà certifié). **Rien à réinventer.**

**Contrôle négatif obligatoire** (méthode du projet) : la liste doit afficher **0 ligne** sur un document vierge — jamais une ligne vide ou un état inventé.

**Ouvert** : la question 2 (document actif vs tous les documents). La question 1 est **tranchée** : **1 source par document** (l'étiquette n'évolue pas vers N).

### CR — 30/09/2026 — la liste et ses signaux (code livré, clic InDesign à faire)

**Livré (lecture seule — aucune écriture dans le document)** :
- Bouton **7** « La liste des sources (tableau) » ; le bouton du journal passe de 7 à **8**.
- Tableau à 5 colonnes : **Etat / Source / Modifiee / Mots / Signes**, plus une ligne de note sous le tableau (« 0 source - … » ou « 1 source - … »). Le tableau est toujours présent, même vide : **une liste vide est un résultat**, pas une absence d'affichage.
- **Répartition des rôles respectée** : l'**état** est décidé **dans le moteur** par `m05DecideState` (même parade que le test 3 : copie de `import_md.jsx` sans `main();`, évaluée puis supprimée aussitôt) — le panneau **ne recalcule jamais** la somme de contrôle. Les **caractéristiques** viennent de la lecture disque **déjà certifiée** au test 4. Rien de réinventé.
- Les **4 cas** restent **séparés** : aucun document / lecture ratée / étiquette absente (vierge) / source à lister.

**Ce qui est DÉJÀ prouvé, hors InDesign** (journal brut) :
```
node --check main.js                          -> OK (1187 lignes)
boutons declares (index.html)                 -> 8
boutons cables (main.js)                      -> 8   (aucun orphelin, aucun manquant)
tube panneau->moteur, cas pire (guillemets + antislash + chemin Windows) :
  source ExtendScript generee                 -> syntaxe valide
  valeur rendue                               -> etat_recu|brut={"v":"1",...}|chemin=C:\dossier\a.md
  => les chaines traversent SANS perte
```

**Ce qui RESTE À FAIRE (FJD, dans InDesign)** — c'est le critère de fin :
1. document **déjà importé**, cliquer **7** ⇒ **1 ligne** (etat + chemin + date + mots + signes) ;
2. document **vierge**, cliquer **7** ⇒ **0 ligne** et la note dit « 0 source » (contrôle négatif obligatoire) ;
3. reporter les deux journaux bruts ici ⇒ clôture en ✅.

**Report de signature honnête (si la source a disparu)** : quand le fichier n'est plus lisible sur le disque, **Mots** et **Signes** affichent `(non lues)` — **jamais un chiffre inventé** — et la date affichée est celle **archivée à l'import**, marquée `(import)`.

**Décision provisoire, réversible — question 2** : la liste porte sur le **document actif** (la proposition de la Mission 1). Passer à « tous les documents ouverts » ne changerait que la boucle d'appel, **pas** le tableau.

### CR — 30/09/2026 — contrôle négatif EXÉCUTÉ EN RÉEL (point 2 du critère : ACQUIS)

Run réel de FJD, clique sur le bouton 7. Journal brut (`PluginData/sonde_import_md_journal.txt`) :
```
--- M2  la liste des sources ---
clic recu a 5:06:51 PM
OK    require('indesign')  ->  [object ID]
OK    document actif  ->  Personnalisr su-on UI INDD avec L'AI.indd
route utilisee : DOM UXP doc.extractLabel()
longueur de l'etiquette brute : 0 caractere(s)
CAS « ETIQUETTE ABSENTE » : document sans import MD.
VERDICT M2 : la liste a 0 ligne (controle negatif satisfait).
```
**Ce que ça prouve** : sur un document **sans import MD**, la liste affiche **0 ligne** et le panneau **nomme le cas** (« étiquette absente ») au lieu d'inventer un état. Le **contrôle négatif obligatoire est satisfait en réel**.

**Ce qui manque encore** : le **point 1** du critère — un document **déjà importé** ⇒ **1 ligne**. Aucun document portant une étiquette n'a encore été cliqué ce run (`longueur = 0`). ⇒ statut **maintenu en 🟡** : on ne clôture pas sur une moitié de critère.

### CR — 30/09/2026 — cas POSITIF EXÉCUTÉ EN RÉEL : 1 ligne, mais état INDÉTERMINÉ (défaut réel trouvé et corrigé)

Deuxième run réel de FJD. Journal brut, second bloc `M2` :
```
--- M2  la liste des sources ---
clic recu a 5:08:37 PM
OK    document actif  ->  Sans titre-4
route utilisee : DOM UXP doc.extractLabel()
longueur de l'etiquette brute : 206 caractere(s)
nom enregistre : mission_03_nonregression_all.md
chemin         : /Users/francois-jeandazin/INDD/IMPORT_MD/fixtures/mission_03_nonregression_all.md
etat rendu par le moteur : ABANDON:main();introuvable
      => le moteur n'a PAS rendu d'etat exploitable.

VERDICT M2 : 1 ligne affichee (etat indetermine).
```

**Ce que ça prouve (acquis)** : sur un document **portant une étiquette** (206 caractères), la liste affiche bien **1 ligne**, lit le **nom** et le **chemin** enregistrés. Le **point 1** du critère est donc **atteint sur sa moitié « 1 ligne »**.

**Ce que ça révèle (défaut réel)** : l'état n'est **pas** décidé par le moteur — `ABANDON:main();introuvable`. Cause trouvée : le panneau cherchait `import_md.jsx` dans un **dossier placeholder en dur** (`/chemin/vers/INDD/IMPORT_MD`), au lieu du dossier saisi dans le champ du panneau. Sur une installation réelle, le moteur était donc **introuvable par construction**, pour le test 3 **comme** pour M2. Le panneau a bien **refusé d'inventer** un état (« indéterminé » + renvoi au journal) : le défaut est dans la résolution du chemin, pas dans la décision.

**Correction appliquée** : `dossierProjet()` + `cheminMoteur()` résolvent désormais le dossier depuis le champ du panneau (un `.md`/`.jsx` ⇒ on prend le parent ; sinon le champ est déjà un dossier), et **le test 3 comme M2** passent par cette résolution. Contrôles : `node --check` OK (1210 lignes), 0 U+FFFD.

**Ce qui reste** : relancer **une** fois le bouton 7 sur ce document (`Sans titre-4`) après rechargement du panneau dans UDT ⇒ l'état doit être **réel** (« identique » ou « modifié dans la source »), plus « indéterminé ». ⇒ statut **maintenu en 🟡** (le critère n'est pas encore satisfait en entier).

### CR — 30/09/2026 — le dossier n'a plus à être tapé : il est DÉDUIT

**Décision : on supprime le travail manuel.** FJD a buté sur la consigne « remplir le champ » ; la question posée (« mettre le vrai dossier : `IMPORT_MD` ? ») a montré que **le formulaire lui-même était le problème**, pas FJD. Plutôt que de lui faire recopier un chemin, le panneau le **déduit de sa propre installation**.

**Mécanisme** (`devinerDossierProjet()`, appelée au démarrage) : le panneau demande à UXP son **dossier de plugin** (`localFileSystem.getPluginFolder()`), puis remonte **deux niveaux** — par le **texte** du chemin, pas par une méthode `parent` dont l'existence n'était pas certifiée (premier jet corrigé en `lastIndexOf("/")` ; `grep getParent` → **0**). Le plugin vit dans `<projet>/uxp/com.fjd.importmd.sonde` ⇒ deux niveaux au-dessus = `<projet>`, arrimé sur `.../atelier_importateur_md.md`.

**Garde-fous (anti-régression)** : ne remplace **jamais** un chemin déjà saisi par un humain (`indexOf(PROJET_DIR) !== 0` ⇒ on ne touche à rien) ; **échec silencieux** (le champ reste modifiable, avec une ligne au journal qui le dit). **Aucun chemin personnel en dur** dans le source : le dossier est **déduit à l'exécution** ⇒ portabilité préservée.

**Contrôles** : `node --check` OK (**1259 lignes**), 0 U+FFFD.

**Ce qui reste** : **1 clic** (bouton 7, puis 8) sur `Sans titre-4`, panneau rechargé dans UDT. Pas de champ à remplir. ⇒ statut **maintenu en 🟡** : le clic réel n'a pas encore été fait.

### CR — 30/09/2026 — CLÔTURE : état RÉEL rendu par le moteur (`identique`)

Troisième run réel de FJD, après rechargement du panneau dans UDT. Journal brut :
```
Panneau pret. Cliquez les tests 1 a 6, puis 7 (la liste).
dossier du projet deduit depuis l'emplacement du panneau :
      /Users/francois-jeandazin/INDD/IMPORT_MD

--- M2  la liste des sources ---
clic recu a 5:25:44 PM
document actif  ->  Sans titre-4
longueur de l'etiquette brute : 206 caractere(s)
nom enregistre : mission_03_nonregression_all.md
chemin         : /Users/francois-jeandazin/INDD/IMPORT_MD/fixtures/mission_03_nonregression_all.md
etat rendu par le moteur : identique

VERDICT M2 : 1 ligne affichee (identique).
```

**Ce que ça prouve — le critère est COMPLET** :
| Point du critère | Preuve | Verdict |
|---|---|---|
| 1 ligne sur document **étiqueté** | `1 ligne affichee` + nom + chemin lus | **ACQUIS** |
| L'état vient du **moteur**, pas du panneau | `etat rendu par le moteur : identique` | **ACQUIS** |
| **0 ligne** sur document **vierge** | `VERDICT M2 : la liste a 0 ligne` (CR du 30/09) | **ACQUIS** |
| Aucun état inventé | « indéterminé » affiché tant que le moteur n'avait pas répondu | **ACQUIS** |

**Déduction du dossier : CONFIRMÉE EN RÉEL** — `devinerDossierProjet()` a trouvé `/Users/francois-jeandazin/INDD/IMPORT_MD` tout seul, sans qu'aucun chemin soit tapé. Le placeholder n'est plus jamais utilisé sur cette installation.

**Note de traçabilité honnête** : le journal sur disque est **écrasé à chaque rechargement du panneau** (il repart de zéro). Le log brut du **contrôle négatif** est donc conservé dans le **CR du 30/09** plus haut dans ce document, pas dans le fichier courant — celui-ci ne contient plus que le run de clôture.

**Bilan des 3 défauts réels trouvés par ces clics** (aucun n'était visible hors InDesign) :
1. chemin du moteur figé sur le placeholder ⇒ **corrigé** (résolution depuis le champ) ;
2. consigne de saisie manuelle ⇒ **supprimée** (déduction depuis l'emplacement du panneau) ;
3. `getParent()` non certifiée en UXP ⇒ **remplacée** par un calcul sur le texte du chemin.

⇒ **Mission 2 TERMINÉE** : la liste affiche le vrai état, les vrais identifiants et les vrais compteurs, ou **rien** quand il n'y a rien — jamais d'invention.

---

## Chapitre Panneau — Mission 3 — Bouton « Actualiser »

**Statut** : ✅ TERMINÉE — 30/09 : **les 4 étapes du protocole sont passées en réel**, chacune constatée par FJD à l'écran : `identique` (17:36 puis 17:51) → **`source absente` sans erreur ni effacement** (17:40 et 17:49) → retour à `identique` avec historique conservé (17:51) → aucun document ouvert, 0 ligne (17:54) ; **bonus** contrôle négatif 0 ligne sur un document sans import MD (17:53). Le défaut de visibilité du bandeau (écrasé par l'écriture automatique du journal) a été trouvé, corrigé et **constaté corrigé** ; le bandeau expose désormais l'état **en clair**. FJD a validé le 30/09 (« OK ») et le fichier de référence a été restauré.

**À faire** : recalculer les états et rafraîchir le tableau **sans rien écrire dans le document**.

**Pourquoi c'est presque gratuit** : c'est la **même fonction** que la Mission 2 qu'on relance. Le bouton n'ajoute pas de logique, il ajoute un **déclencheur**.

**Cas limite à traiter** : le fichier source **disparaît entre deux actualisations** ⇒ le signal doit passer à « source absente » **sans erreur** et sans effacer l'historique affiché.

### CR — Mission 3, 30/09 : le bouton existe, et il ne fait que RELANCER

**Décision d'implémentation** — le bouton n'ajoute **aucune** mesure. Il appelle
la **même fonction** que la Mission 2 (`construireListe`) avec une seule option :
`garderHistorique: true`. Lectures seules : `import_md.jsx` n'est **pas** touché
et `construireListe` n'appelle aucune API d'écriture du document.

**Pourquoi « garder l'historique » et pas seulement relancer** : relancer en
vidant le tableau ferait **disparaître la ligne précédente** — exactement ce que
le cas limite interdit. En mode actualisation la mesure est donc **ajoutée** au
tableau : on VOIT `identique` puis `source absente` l'une sous l'autre. En mode
test (bouton 7), le tableau repart de zéro : comportement de la Mission 2
**inchangé**.

**Cas limite — la source disparaît entre deux actualisations** : traité en deux
endroits, tous deux vérifiés par **lecture du moteur** :
1. **L'état** vient du moteur, pas du panneau : `m05DecideState()` retourne
   `ETAT_SOURCE_ABSENTE` dès que `!f.exists` (`import_md.jsx` l.207).
2. **La lecture disque** échoue forcément ensuite. Cet échec était journalisé en
   `ECHEC`, ce qui faisait passer une **conséquence attendue** pour une panne.
   Corrigé : quand le moteur a dit `source_absente`, la ligne est neutre
   (« lecture disque impossible PAR CONSEQUENCE (attendu, pas une panne) »), les
   compteurs restent `(non lues)` — **aucun chiffre inventé** — et la ligne
   précédente reste affichée.

**Contrôles passés (machine, avant tout clic)** :

| Contrôle | Résultat |
|---|---|
| Syntaxe (`node --check` sur copie `.js` — il refuse le `.jsx`) | **OK** |
| Boutons déclarés dans `index.html` / câblés dans `cabler()` | **10 / 10** |
| Encaractères de remplacement U+FFFD (`main.js`, `index.html`) | **0** |
| `FileEntry.getParent()` (non certifiée en UXP) | **0** |
| `import_md.jsx` modifié ? | **non** |

**Ménage du panneau (demande FJD du 30/09 : « c'est illisible devant »)** : les
6 boutons de mesure ont été rangés dans une section **repliée** en bas du
panneau (« Mesures techniques »), avec le champ du dossier. **Rien n'est
supprimé** — le contrôle négatif reste une preuve utilisable — mais l'avant du
panneau ne montre plus que trois boutons, nommés par ce qu'ils font :
« Voir la liste des sources », « Actualiser (sans rien écrire) »,
« Enregistrer le journal (.txt) ». Repli par `style.display` : même technique
que `#statut`, déjà certifiée ici (pas de `<details>`, non certifié en UXP).
Contrôle : **10 boutons déclarés = 10 câblés**, listes comparées et identiques.

**Protocole de clic (à exécuter par FJD, après rechargement UDT — toute édition
du panneau l'exige)** :
1. Document étiqueté ouvert, cliquer **« Voir la liste des sources »**
   ⇒ 1 ligne `identique`.
2. Faire **disparaître** `fixtures/mission_03_nonregression_all.md` (le renommer),
   cliquer **« Actualiser »** ⇒ **2 lignes** : la 1re toujours `identique`, la 2e
   `source absente`, compteurs `(non lues)`, **aucun ECHEC** de lecture disque.
3. Restaurer le nom du fichier, cliquer **« Actualiser »** ⇒ **3 lignes**, la
   dernière revenue à `identique`.
4. Aucun document ouvert, cliquer **« Actualiser »** ⇒ 0 ligne ajoutée, les
   lignes précédentes **restent**, la note annonce l'historique conservé.

**Clics réels déjà obtenus — run du 30/09 17:36** (journal brut ; rechargement
UDT et section repliée confirmés par FJD) :
```
Panneau pret. Les 3 boutons utiles : « Voir la liste des sources », « Actualiser », « Enregistrer le journal ».
Les mesures techniques (1 a 6) sont repliees en bas du panneau.
dossier du projet deduit depuis l'emplacement du panneau :
      /Users/francois-jeandazin/INDD/IMPORT_MD

--- M3  actualisation de la liste ---
clic « Actualiser » recu a 5:36:36 PM
mode : actualisation SANS effacement (0 ligne(s) deja affichee(s))
      lecture seule : rien n'est ecrit dans le document.
document actif  ->  Sans titre-4
route utilisee : DOM UXP doc.extractLabel()
nom enregistre : mission_03_nonregression_all.md
etat rendu par le moteur : identique

VERDICT M3 : 1 ligne(s) affichee(s), derniere mesure = identique.
```
- **Étape 1 du protocole : ACQUISE** — la même réponse que la Mission 2
  (`identique`), obtenue par le nouveau bouton, avec l'annonce explicite
  « lecture seule : rien n'est ecrit dans le document ».
- **Le ménage est constaté en vrai** : le panneau dit lui-même que les mesures
  sont repliées ⇒ c'est bien le panneau nettoyé qui a été rechargé.

**Clics réels — run du 30/09 17:40** (journal brut, second passage de FJD) :
```
--- M2  la liste des sources ---
clic recu a 5:40:18 PM
OK    document actif  ->  Sans titre-4
nom enregistre : mission_03_nonregression_all.md
chemin         : /Users/francois-jeandazin/INDD/IMPORT_MD/fixtures/mission_03_nonregression_all.md
etat rendu par le moteur : source_absente
      source absente : lecture disque impossible PAR CONSEQUENCE (attendu, pas une panne).
      => compteurs NON affiches (aucun chiffre invente).
VERDICT M2 : 1 ligne(s) affichee(s), derniere mesure = source absente.
      => SOURCE ABSENTE : la source n'est plus sur le disque a cet instant.
      => rendu SANS erreur.

--- M3  actualisation de la liste ---
clic « Actualiser » recu a 5:40:23 PM
mode : actualisation SANS effacement (1 ligne(s) deja affichee(s))
      lecture seule : rien n'est ecrit dans le document.
etat rendu par le moteur : source_absente
      source absente : lecture disque impossible PAR CONSEQUENCE (attendu, pas une panne).
      => compteurs NON affiches (aucun chiffre invente).
VERDICT M3 : 2 ligne(s) affichee(s), derniere mesure = source absente.
      => SOURCE ABSENTE : la source n'est plus sur le disque a cet instant.
      => rendu SANS erreur et SANS effacement : les 1 ligne(s) precedente(s) restent affichee(s).
```
- **Étape 2 du protocole : ACQUISE** — source disparue, clic « Actualiser » ⇒
  **2 lignes**, la 2e à `source_absente`, **aucun ECHEC** de lecture disque, la
  1re ligne conservée. Le cas limite de la Mission 3 est donc **prouvé côté
  journal**.
- **Correctif non encore vu à l'écran** : le run du 17:40 est correct dans le
  journal, mais FJD répond **« pas dans le panneau, pas visible »**. Cause
  trouvée et corrigée (voir ci-dessous) ; le correctif exige un **rechargement
  UDT** avant d'être constatable.

**Clics réels — run du 30/09 17:49, APRÈS le correctif de visibilité** (journal
brut ; c'est ce run que FJD a **VU** — il répond « source absente », mot pour mot
ce que le bandeau affiche désormais) :
```
--- M3  actualisation de la liste ---
clic « Actualiser » recu a 5:49:00 PM
mode : actualisation SANS effacement (0 ligne(s) deja affichee(s))
      lecture seule : rien n'est ecrit dans le document.
OK    require('indesign')  ->  [object ID]
OK    document actif  ->  Sans titre-4
route utilisee : DOM UXP doc.extractLabel()
longueur de l'etiquette brute : 206 caractere(s)
nom enregistre : mission_03_nonregression_all.md
chemin         : /Users/francois-jeandazin/INDD/IMPORT_MD/fixtures/mission_03_nonregression_all.md
etat rendu par le moteur : source_absente
      source absente : lecture disque impossible PAR CONSEQUENCE (attendu, pas une panne).
      => compteurs NON affiches (aucun chiffre invente).

VERDICT M3 : 1 ligne(s) affichee(s), derniere mesure = source absente.
      => SOURCE ABSENTE : la source n'est plus sur le disque a cet instant.
      => rendu SANS erreur et SANS effacement : les 0 ligne(s) precedente(s) restent affichee(s).
```
- **Cas limite VU À L'ÉCRAN : ACQUIS.** FJD annonce « source absente » après ce
  clic : c'est **mot pour mot** ce que le bandeau affiche désormais (via
  `phraseEtat()`). La chaîne est donc prouvée **de bout en bout** et **observée
  par l'humain**, pas seulement présente dans le journal :
  moteur → `source_absente` → bandeau en clair → œil de FJD.
- *Nuance honnête (levée au run suivant)* : ce run avait démarré tableau vide
  (`0 ligne(s) deja affichee(s)`) — un rechargement UDT vide la table.
  La **conservation de l'historique** (« sans effacement ») est finalement
  prouvée en direct par le run du **17:51** : 1 ligne avant le clic, 2 après.
- **Fichier de référence RESTAURÉ** par mes soins (pas par FJD) :
  `fixtures/mission_03_nonregression_all.md` est de nouveau en place (20389 o).
  FJD n'avait pas à sortir du panneau — le renommage précédent était ma
  demande, et elle était de trop.

**Clics réels — run du 30/09 17:51, ÉTAPE 3** (journal brut ; FJD répond
« identique » — le fichier venait d'être restauré par mes soins) :
```
--- M3  actualisation de la liste ---
clic « Actualiser » recu a 5:51:58 PM
mode : actualisation SANS effacement (1 ligne(s) deja affichee(s))
      lecture seule : rien n'est ecrit dans le document.
OK    document actif  ->  Sans titre-4
nom enregistre : mission_03_nonregression_all.md
chemin         : /Users/francois-jeandazin/INDD/IMPORT_MD/fixtures/mission_03_nonregression_all.md
etat rendu par le moteur : identique

VERDICT M3 : 2 ligne(s) affichee(s), derniere mesure = identique.
```
- **Étape 3 : ACQUISE.** Source restaurée ⇒ retour à `identique`.
- **La conservation de l'historique est désormais prouvée À L'ÉCRAN** : le run
  part de **1 ligne déjà affichée** et finit à **2** (`sans effacement`). C'est
  la démonstration que la nuance laissée ouverte au 17:49 était un simple effet
  de mesure (tableau vide après rechargement), **pas** un défaut.
- Cycle complet parcouru par FJD à l'écran : `identique` → `source absente` →
  `identique`, **sans qu'une seule ligne soit perdue**.

**Clics réels — run du 30/09 17:53, CONTRÔLE NÉGATIF** (journal brut ; FJD avait
par erreur plusieurs documents ouverts — ce run en a profité pour couvrir un cas
supplémentaire, **non prévu au protocole**, et il passe) :
```
--- M3  actualisation de la liste ---
clic « Actualiser » recu a 5:53:29 PM
mode : actualisation SANS effacement (2 ligne(s) deja affichee(s))
      lecture seule : rien n'est ecrit dans le document.
OK    document actif  ->  Sans titre-2
longueur de l'etiquette brute : 0 caractere(s)
CAS « ETIQUETTE ABSENTE » : document sans import MD.
VERDICT M3 : 0 ligne ajoutee (controle negatif satisfait).
```
- **Contrôle négatif ACQUIS** : un autre document (`Sans titre-2`), ouvert au
  même moment, **sans import MD** ⇒ **0 ligne ajoutée** au lieu d'une ligne
  inventée. C'est exactement la règle héritée de la Mission 2 : *le panneau ne
  devine pas, il affiche rien quand il n'y a rien*. Le tableau conservait ses
  2 lignes précédentes.

**Clics réels — run du 30/09 17:54, ÉTAPE 4** (journal brut ; FJD a fermé tous
les documents à ma demande) :
```
--- M3  actualisation de la liste ---
clic « Actualiser » recu a 5:54:53 PM
mode : actualisation SANS effacement (2 ligne(s) deja affichee(s))
      lecture seule : rien n'est ecrit dans le document.
documents ouverts : 0
CAS « AUCUN DOCUMENT OUVERT » -> 0 ligne ajoutee.
      => 2 ligne(s) precedente(s) CONSERVEE(S) (historique non efface).
```
- **Étape 4 : ACQUISE.** Plus aucun document ouvert ⇒ 0 ligne ajoutée, et
  l'historique reste : la note annonce explicitement la conservation.

**DÉFAUT TROUVÉ : le résultat de la mesure était EFFACÉ de l'écran 400 ms après
le clic** (signalé par FJD : « pas dans le panneau en tout cas, pas visible »).
- *Cause* : `ecrireJournalFichier()` — appelée **automatiquement** par
  `programmerEcritureJournal()` 400 ms après chaque `dire()` — remettait le
  bandeau à « journal enregistre : /Users/... » **même en écriture silencieuse**.
  Le bandeau est le seul signal impossible à rater du panneau : il annonçait
  donc systématiquement un **chemin de fichier** à la place de la réponse.
- *Correctif 1* : le bandeau n'est plus mis à jour que sur **action explicite**
  (bouton « Enregistrer le journal », ou écriture de démarrage). Une écriture
  automatique ne touche plus au bandeau. L'**échec** d'écriture reste visible,
  lui, même en automatique (un journal qui ne s'écrit plus est une panne).
- *Correctif 2* : le bandeau dit désormais la **réponse en clair**, plus un code
  interne — nouvelle fonction `phraseEtat()` : « la source n'a pas bouge depuis
  l'import » / « la source A BOUGE depuis l'import » / « la source n'est PLUS LA
  (renommee, deplacee ou supprimee) » / « ce document n'a jamais recu d'import
  MD ». C'était la demande de FJD : **comprendre ce qui se passe sans connaître
  le vocabulaire du moteur**.

**Étapes encore ouvertes : 3 (restauration → retour à `identique`) et 4 (aucun
document ouvert).** Restaurer `fixtures/mission_03_nonregression_all.md` : le nom
est actuellement modifié, la source est donc **absente** sur le disque.

**Ce qui reste ouvert** : **rien.** Les 4 étapes du protocole sont passées en réel
et constatées à l'écran par FJD ; le contrôle négatif supplémentaire passe aussi.
Le seul point non couvert par le protocole initial (le bandeau écrasé par
l'écriture automatique) a été trouvé **pendant** ces clics et corrigé dans la
foulée. Le journal dit la vérité, **et** FJD l'a lue dans le panneau.

---

## Chapitre Panneau — Mission 4 — Bouton « Importer »

**Statut** : ✅ TERMINÉE — **seule** mission du chapitre qui **ÉCRIT dans le document**, **volontairement en DERNIER**. Au 30/09/2026 : **signature GELÉE**, **canal MESURÉ**, **répartiteur ÉCRIT dans le moteur**, **bouton CÂBLÉ au moteur**, et le cas muet « Importer sans bloc » **REFUSÉ, ANNONCÉ et PROUVÉ en réel** (journal du moteur : refus sans bloc à 20:52:54, import avec bloc à 20:53:04). **Les deux moitiés du critère de fin sont atteintes** : (1) **`Ctrl+Z` en UN SEUL pas** — le corps de l'import est enveloppé dans `app.doScript(mainInterne, …, UndoModes.ENTIRE_SCRIPT)`, validé par FJD ; (2) **mapping intact** après import — prouvé en réel le 30/09 à **21:54** sur **document neuf** (`blocs=283 · attendus=294 · reels=294 · ecarts=0 · base=0 · styles=283 · neutre=0`, **aucune erreur**). Clôture validée par FJD le 30/09/2026.

**Cas wiki consultés** : Cas 33 (`$.global` ne transporte pas d'état au-delà de la frontière de script — **même famille** que le canal panneau → moteur, ajouté le 30/09), Cas 36 (module qui **définit** / appelants qui **décident** — le répartiteur), Cas 46 (`/tmp` refusé, `Folder.temp` seule cible d'écriture temporaire), Cas 39 (`exportFile` n'écrase pas, `/tmp` est un **lien symbolique**), Cas 44 (labels persistants, `extractLabel` rend `''`), Cas 45 (`File.modified` menteur ; `File.read()` normalise les fins de ligne), Cas 40 (sonde sans interaction).
**Cas wiki produits/enrichis** : **Cas 47 et Cas 48 créés le 30/09** — Cas 47 « Le canal d'arguments de `app.doScript` : l'objet `arguments` racine, jamais `app.scriptArgs` » ; Cas 48 « Le numéro de paragraphe absolu se compte en retours paragraphe avant l'offset caractère, jamais par soustraction » (tous deux `mesuré` le 30/09, cause racine du défaut d'ancrage). Compteur du wiki 45 → **47 cas**, catalogue + index par thème (nouveau bloc « Canal d'appel ») + index par symptôme mis à jour. Comblent les deux trous confirmés par grep (canal d'arguments ; comptage du paragraphe absolu).

### Signature du tube panneau → moteur (GELÉE — 30/09/2026, décision FJD)

**Historique du gel** : le tube dépendait du canal — un canal riche autorise des champs nommés, un canal étroit oblige à des chaînes courtes. Le canal est mesuré (30/09) : `arguments` racine via `app.doScript`, qui transporte **une liste**. Deux formes restaient possibles dans cette liste : cases nues (positions) ou cases **nommées**. **Décision FJD (30/09) : cases NOMMÉES** (`Appelant=panneau`) — « A clairement » —, pour qu'un champ ajouté au milieu ne décale jamais les suivants. **Décision FJD (30/09) sur l'empreinte : elle ne voyage PAS** — « B » — le moteur la **recalcule** depuis le `Chemin` (il a déjà `m05BuildFingerprint`). Tube **minimal**, et l'empreinte reste **vérifiée par le moteur**, jamais crue sur parole. **Signature gelée ci-dessous.**

**À quoi servent les arguments — trois métiers, pas un** :

| Métier | Réponse transportée |
|---|---|
| **Commande** | qui appelle, et pour faire quoi |
| **Source** | quelle source, et de quoi la reconnaître |
| **Indice de mapping** | ce qui peut aider à retrouver le bon mapping |

**Noyau — ce dont on ne peut PAS se passer** :

| Champ | Métier | Pourquoi |
|---|---|---|
| **Appelant** (panneau / menu) | commande | **Fondateur** : c'est lui qui autorise le répartiteur à **ne pas** réenregistrer le menu quand c'est le panneau qui appelle |
| **Action** (importer / actualiser) | commande | Deux boutons, deux comportements |
| **Chemin** | source | Le seul changement de fond du moteur : il le reçoit au lieu de le demander. **Porte aussi la reconnaissance** : le moteur en dérive l'empreinte (décision B) |

**Indices optionnels** :

| Champ | Métier | Statut |
|---|---|---|
| **Mode d'import initial** (cadre / curseur / gun) | comportement | **Nécessaire** — c'est lui qui distingue *rafraîchir* de *réparer* (cf. encadré gun ci-dessous) |
| **Identité de story** + **décalage de caractère** | position | Pour le mode curseur. Le moteur lit **déjà** `options.insertAt.index` = offset **caractère** dans la story (pas un n° de paragraphe). ⚠️ L'identité de story **n'est pas** enregistrée aujourd'hui |
| **Provenance** (GPT / Claude / Gemini…) | indice mapping | **À DÉCLARER, jamais devinée.** Aujourd'hui non lisible ⇒ vaut `inconnu` (cf. décision ci-dessous) |
| **Projet / charte** | indice mapping | Même esprit que la provenance : une **clé de rangement** de la mémoire de mapping |
| **Document cible** | commande | Dépend de la question 2 (actif vs tous les docs), **encore ouverte** |

**Ce qui n'entre JAMAIS dans le tube** :
- **Le mapping lui-même** — **le panneau PROPOSE, le moteur TRANCHE** (document → mémoire → dialogue). Mettre le mapping dans le tube déplacerait la décision dans le panneau et créerait **deux endroits** qui décident la même chose.
- **Le mode d'insertion forcé** (cadre / curseur / gun) — le mode reste **détecté** par le moteur, jamais reçu du panneau. On transmet le mode **initial** (pour mémoire), pas le mode de **cette** exécution.
- **Le numéro de page / de paragraphe** comme identité — 🔴 **fragile** (la pagination bouge dès qu'on édite au-dessus). Toléré **en affichage humain**, jamais comme identité.

#### Décisions actées sur la provenance (30/09/2026)
- **La provenance ne se devine JAMAIS.** Trois routes possibles — *déclarée* dans le MD, *saisie* par l'humain, *détectée* par heuristique — et seule la route **déclarée** est retenue à terme : le marqueur de la route A (identifiant de bloc) peut porter **aussi** la provenance. **Synergie** avec le futur taggeur.
- **En attendant : `inconnu`**, et la mémoire de mapping retombe sur son comportement actuel (dernier mapping gagnant).
- **La provenance est un INDICE de pré-remplissage, jamais une autorité** : le mapping du **document** reste prioritaire. Sinon on risque d'appliquer un mapping GPT à un document dont la feuille de styles n'a rien à voir.
- **Perspective** : cette clé transformera la mémoire de mapping (**un seul fichier, le dernier gagne**) en **mémoire indexée par provenance** (« pour un MD Claude, propose *ce* mapping d'abord »).

#### Encadré — le mode GUN : limite dure (mesuré dans le code, 30/09)
En mode gun, le script **charge le place gun**, journalise, enregistre l'empreinte, puis **`return`** : il n'applique **AUCUN style** et **ne voit jamais le dépôt** (qui se fait au clic de FJD). Conséquences :
- **La position est INCONNUE** (on sait *quoi*, pas *où*) ⇒ non enregistrable, assumé.
- Un import gun = contenu **jamais stylé** ⇒ sa mise à jour n'est **pas un rafraîchissement, c'est une RÉPARATION** : on récupère la story telle quelle et on lui applique **enfin** la route normale de stylage. Ce cas doit être **nommé comme tel**, jamais confondu avec une simple actualisation.

##### Décision actée (FJD, 30/09/2026) — traitement du gun : récupération → vérif → mapping par défaut au retour
Principe : **au moins cette route existe**. On ne cherche pas encore la perfection, on garantit qu'un contenu gun **n'est jamais laissé dans son état brut sans issue**.
1. **Récupération** — on relit le contenu déposé tel quel (lecture pure : styles appliqués paragraphe par paragraphe ; le moteur sait déjà le faire, cf. `appliedParagraphStyle`). Aucune écriture, aucun risque.
2. **Vérif** — on constate ce que ce contenu porte (uniforme / différencié, conforme ou non au mapping du document). Aucune décision automatique n'en découle **tout de suite** : la finesse de ce contrôle **se règle plus tard**.
3. **Mapping par défaut au retour** — pour la mise à jour, on repasse par la **route normale de stylage** (mapping par défaut / mapping du document). C'est la **réparation** : le contenu gun reçoit enfin son stylage.
- **Limite assumée qui reste ouverte** : la **position** de la story gun est inconnue (voir ci-dessous) ⇒ la réparation a besoin d'une cible. Tant que l'identifiant stable de bloc (route A) n'existe pas, **la story à réparer doit être désignée au moment de la mise à jour** (sélection). Ce n'est pas un défaut : c'est la limite honnête de l'état actuel.

##### Piste « page + index » au prochain regard (à MESURER — non retenue comme décision)
Idée : **la page ne peut pas être lue au `loadPlaceGun()`** — à cet instant rien n'est déposé, le dépôt est le clic physique de FJD, hors script. Lire une page à ce moment donnerait **la page sous la souris, pas la page d'atterrissage** = fausse information.
Route honnête, **à la deuxième observation** :
1. **Au chargement du gun** : mémoriser la **liste des stories existantes** du document (leurs identifiants).
2. **Au prochain regard** (actualisation du panneau ou prochaine ouverture) : **recomparer** — toute story **nouvelle** = le dépôt gun.
3. On en dérive : **la page** (`textContainers[0].parentPage.name`) et **l'index dans la story** (`0`, par définition du point de départ).
Réserves : la **page reste fragile** (déjà écartée comme identité — affichage humain seulement) ; le **stable** est l'index dans la story.
🔬 **À mesurer avant toute décision** : (a) le **diff de stories** est-il fiable ? (b) un dépôt crée-t-il **toujours exactement une** story ? (c) l'écouteur au dépôt existe-t-il en ExtendScript (seuls `Event.AFTER_OPEN`/`AFTER_NEW` ont été testés comme enregistrables/retirables) ?

##### Reporté — « Chapitre GUN » ouvert en DERNIER (décision FJD, 30/09/2026)
Les raffinements gun sont **groupés et renvoyés à un chapitre dédié, ouvert en dernier** :
- **piste page + index** ci-dessus (localiser le dépôt gun) ;
- **alimentation des tags internes** (`index` + nom de style en commentaire dans le MD — moisson de terminologie) ;
- **et cie** (les finesses qui découlent de ces deux-là).
Raison : le panneau (Missions 1→4) passe d'abord ; ces raffinements dépendent de la **route A** (identifiant stable de bloc) et de la **lecture des commentaires par `parseMarkdown`** (acquis, différé). On **ne les ouvre pas maintenant**.

#### Règle de prudence (position)
La position mémorisée (story + offset caractère) ne vaut que **tant que le texte au-dessus n'a pas bougé**. La parade réelle est l'**identifiant stable de bloc** (route A) — **on ne règle pas ce problème maintenant, on le nomme**. ⚠️ **Ne pas inventer un second système de position** : « story + offset » **est la même famille** que l'identifiant de bloc ; une seule mécanique, réutilisée.

#### Points à mesurer avant de geler la signature
1. **Le canal** — ✅ **MESURÉ (30/09/2026)** : `app.doScript(src, lang, ARGS)` transporte bien les arguments, mais **pas** par `app.scriptArgs` — par l'**objet `arguments` de niveau racine du script exécuté**. Verdict : canal **existant**, idiome InDesign. Détail et extrait brut ci-dessous, cas wiki **Cas 47**.
2. **Le répartiteur** — 🔨 **ÉCRIT (30/09/2026)**, pas encore **prouvé en réel** : le moteur porte désormais un répartiteur `M04_TUBE` / `lireTube()` (détail et preuves ci-dessous). **Indice retenu de la mesure** : sans 3ᵉ paramètre, `arguments` vaut **`undefined`** ⇒ test direct `typeof arguments === "undefined"`.
3. **Le contournement du sélecteur** — ✅ **GÉNÉRALISÉ (30/09/2026)** dans le code : `cheminImposé = relanceSourcePath || M04_TUBE.chemin` court-circuite `File.openDialog`. Reste à **prouver** par un appel réel du panneau (détail ci-dessous).
4. **Le branchement du bouton** — ✅ **ÉCRIT (30/09/2026)** : `btn_import` visible et câblé ; il appelle le moteur par `$.evalFile` d'une enveloppe qui dépose le tube (détail au CR « bouton câblé » ci-dessous). Reste à **prouver** par un clic réel.

#### Compte rendu — mesure du canal (30/09/2026) — CR inline

**Ce qui a été fait** : sonde **Q7** (« Le tuyau : quel canal porte un argument ? », bouton 7 du panneau, zone repliée « Mesures techniques ») **réécrite** pour transporter **4 arguments réels** (`Appelant=panneau`, `Action=importer`, `Chemin=/tmp/source.md` + le témoin horodaté) au lieu d'un témoin seul, et pour **lire deux canaux dans le même appel** : `app.scriptArgs` (B1) **et** l'objet `arguments` racine (B2). `import_md.jsx` **non modifié**. Moteur chargé **sans** `main()` (copie tronquée). Panneau rechargé (UDT) avant mesure.

**Extrait brut du journal** (fichier `…/com.fjd.importmd.sonde/PluginData/sonde_import_md_journal.txt`, 3139 octets, 30/09 19:55:00) :

```
A  tube « texte de source »              : OK — temoin recu identique : OUI
B1 tube « app.scriptArgs » relecture    : sans argument ET avec argument, identiques :
     type=object | longueur=ERREUR:Object does not support the property or method 'length'
     | [0]=ERREUR:Object does not support the property or method '0' | getArguments=ABSENT
     => le temoin n'apparait PAS dans app.scriptArgs
B2 tube « objet arguments racine »      :
     sans argument : ERREUR:arguments is undefined
     avec argument : n=4 | [0]=TEMOIN-20260930-1790790883963 | [1]=Appelant=panneau
                     | [2]=Action=importer | [3]=Chemin=/tmp/source.md
     => les 4 arguments sont ARRIVES, dans l'ordre : OUI
C  tube « fichier temoin »              : OK — OUI
VERDICT sonde : un canal d'arguments EXISTE
```

**Verdict** : **le canal existe et il est l'idiome InDesign** — `app.doScript(src, lang, [a0, a1, …])` → `arguments` **racine** du script exécuté. `app.scriptArgs` est une **fausse piste** dans ce runtime (objet opaque, non indexable, **identique avec et sans argument** : il ne transporte rien et ne signale pas l'échec). Correction à retenir : le **premier verdict négatif** sur B venait de la **sonde** (elle lisait au mauvais endroit), **pas** d'une limite du runtime — refus d'abandon de FJD fondé.

**Ce qui reste ouvert** : la **signature** du tube n'est pas gelée (décision FJD) ; le **répartiteur** reste à écrire ; le **contournement du sélecteur** (M05) reste à généraliser ; l'**annulation** (`UndoModes.ENTIRE_SCRIPT`, 4ᵉ paramètre de `doScript`) est **reportée** — mécanisme plus subtil que prévu (décision FJD, 30/09).

**Statut inchangé** : 🔴 À FAIRE — le point 1 (canal) est **mesuré**, mais le **critère de fin** (un seul `Ctrl+Z` annule tout l'import) n'est **pas** atteint.

---

**Pourquoi en dernier** : d'abord parce qu'**on lit avant d'écrire** — si les missions 1 à 3 sont fausses, on les corrige sans dégât. Ensuite parce qu'**importer par-dessus une liste qui n'existe pas encore, c'est tester deux inconnues à la fois** : si ça rate, on ne saura pas *quelle* moitié a raté.

**À faire** : brancher le bouton sur le moteur `import_md.jsx` (joignabilité déjà prouvée par le bouton 3), en enveloppant l'exécution dans **`app.doScript()` + `UndoModes.ENTIRE_SCRIPT`**.

**Questions ouvertes à instruire AVANT de coder (à remonter, pas à trancher seul)** — détail dans la section « Signature du tube » ci-dessus :
- **Le panneau réutilise-t-il le pipeline complet** (sélecteur de fichier + dialogue de mapping inclus) **ou** une variante sans dialogue ? Le panneau a déjà le chemin : rouvrir un sélecteur serait redondant. Le précédent existe (**relance M05**) : c'est le **crochet à généraliser**.
- **`import_md.jsx` se termine par un appel `main();` au niveau racine** ⇒ l'évaluer déclenche **aussi** le bloc d'enregistrement du menu (l. 3077-3086, hors `main()`). Il faut un **répartiteur** qui distingue « appelé par le menu » de « appelé par le panneau », donc l'argument **Appelant** du tube.

**Critère de fin** : un **seul** `Ctrl+Z` annule **tout** l'import (preuve : nombre de pas d'annulation constaté, pas estimé), et le mapping `md-style-map` est **intact** après import (contrôle avant/après).

---

#### Compte rendu — le répartiteur écrit dans le moteur (30/09/2026) — CR inline

**Ce qui a été fait** : `import_md.jsx` (moteur, **3181 lignes**) reçoit le **répartiteur**. Quatre ajouts, tous **additifs** — aucune ligne de l'ancien chemin n'a été réécrite :

1. `var M04_TUBE = null;` — l'état du tube, `null` par défaut.
2. `function lireTube(args)` — découpe les **cases nommées** sur le **premier** `=` (`Appelant` / `Action` / `Chemin` dans le noyau ; **tout champ inconnu** va dans `indices`, jamais jeté). ES3 strict, aucun JSON.
3. **Détection à la racine**, juste avant `main();` : `arguments` est lu **au niveau racine du script** (et non dans une fonction — dans une fonction, `arguments` désigne les paramètres *de cette fonction*). Accès protégé par `try/catch`, absence = cas **normal** du menu.
4. **Deux exceptions chirurgicales dans `main()`**, conditionnées par `appelPanneau = !!M04_TUBE` :
   - le **déclencheur M05 est sauté** (le panneau a déjà envoyé `Action` : reposer la question serait une **seconde décision sur la même chose**) ;
   - le **sélecteur de fichier est sauté** : `cheminImposé = relanceSourcePath || M04_TUBE.chemin` — **généralisation directe du précédent M05**, pas une seconde mécanique.

**Preuves de non-régression** (le vrai risque de ce changement) :

```
$ cp import_md.jsx /tmp/imd_check.js && node --check /tmp/imd_check.js
SYNTAXE OK
$ grep -c $'\xef\xbf\xbd' import_md.jsx
0
$ tail -c 120 import_md.jsx
    : "M04-repartiteur: appel MENU (aucun argument) -> main() inchange");

// Exécuter le script
main();
```

- **La dernière ligne reste EXACTEMENT `main();`** : c'est le repère utilisé par la sonde du panneau pour charger le moteur **sans l'exécuter** (parade de troncature). Il a été **préservé volontairement** — un `if/else` final l'aurait cassé.
- **Appel par le menu = `arguments` absent ⇒ `M04_TUBE` reste `null`** ⇒ `appelPanneau` est faux ⇒ **les deux exceptions ne s'appliquent pas** : le chemin d'avant, à l'identique.
- **0 U+FFFD** dans le moteur (une corruption `mesuré` → `U+FFFD` a été trouvée **et corrigée** pendant ce travail).

**Ce qui reste ouvert** : le **branchement du bouton** côté panneau (`app.doScript` du **vrai moteur** avec le tube) et la **preuve en réel** dans le journal du moteur. **Non acquis** : le critère de fin (un seul `Ctrl+Z`) est **reporté** par décision FJD.

---

#### Compte rendu — le bouton « Importer » câblé au moteur (30/09/2026) — CR inline

**Ce qui a été fait** — le **dernier** maillon du chapitre : le panneau **appelle** désormais le moteur.

1. **Bouton** `btn_import` ajouté à la zone **visible** (pas dans « Mesures techniques » : c'est l'action utile, FJD doit la voir), **câblé** dans `cabler()` et **exposé** (`window.sondeImportMd.importer`). Garde-fou respecté : **12 boutons déclarés = 12 câblés**.
2. **Gestionnaire** `importerDepuisPanneau()` : (a) résout le `Chemin` (champ prérempli), (b) **vérifie la source lisible AVANT** d'occuper le moteur (une erreur de chemin doit se lire dans le panneau, pas se perdre dans l'import), (c) construit le tube **gelé** (`Appelant=panneau`, `Action=importer`, `Chemin=<md>`), (d) appelle le moteur, (e) **relit le journal DU MOTEUR**.
3. **Le moteur s'exécute COMME UN FICHIER, pas comme un texte.** Mesuré **dans le code** : `LOG_FILE_PATH` est calculé **ligne 15** depuis `$.fileName` (`new File($.fileName).parent.fsName + "/import_md_errors.log"`), et le module de menu est chargé de même (l. 3145) puis enregistré par `register($.fileName)` (l. 3150). Une chaîne de source ne donnerait **aucun `$.fileName` valable** — le journal partirait ailleurs. Le panneau envoie donc une **enveloppe minuscule** qui, *dans le moteur* : (1) dépose le tube dans un global à usage unique, (2) `$.evalFile(new File("<moteur>"))`.
4. **Repli ajouté au répartiteur** (moteur **3181 → 3198 lignes**, +17, toutes **additives**) : `$.evalFile` **ne transmet pas d'arguments**, donc le moteur relit le **même** tube (mêmes cas nommés) dans `$.global.__M04_TUBE_IMPOSE` — **en dernier recours** (condition `!M04_TUBE`), puis **l'efface aussitôt** (usage unique : un appel ultérieur par le MENU reste « appel MENU »). Le canal `arguments` de `app.doScript` reste **prioritaire** et **inchangé** (wiki Cas 47 hors de cause).

**Comment la preuve est faite (côté panneau)** : le gestionnaire lit le journal moteur **AVANT et APRÈS** et ne juge **que sur les lignes AJOUTÉES** (sinon une réussite antérieure passerait pour celle d'aujourd'hui — même leçon que `testerMoteur`), en cherchant **`M04-repartiteur: appel PANNEAU`** et **`M04: source IMPOSEE par le PANNEAU`**. Le bandeau affiche ces deux vérités.

**Preuves de non-régression** :

```
$ node --check (moteur, copie .js)   -> SYNTAXE MOTEUR OK
$ node --check (panneau main.js)     -> SYNTAXE PANNEAU  OK
$ grep -c $'\xef\xbf\xbd' import_md.jsx / main.js / index.html   -> 0 / 0 / 0
$ boutons déclarés (index.html) == boutons câblés (main.js)       -> 12 == 12
$ tail import_md.jsx   ->  ..."main() inchange");
                          // Exécuter le script
                          main();
```

- **La dernière ligne reste EXACTEMENT `main();`** (repère de la troncature de la sonde) : préservée volontairement.
- **Appel par le menu** : `arguments` absent **et** global absent ⇒ `M04_TUBE` reste `null` ⇒ chemin d'avant, à l'identique.

**Ce qui reste ouvert** : la **preuve en réel** — cliquer « Importer » sur un document et lire les deux lignes ci-dessus dans le journal du moteur. Tant qu'elle n'est pas faite, la mission **n'est pas** terminée. Le `Ctrl+Z` reste **reporté** (décision FJD).

**Statut inchangé** : 🟡 PARTIELLE — le **code est en place des deux côtés** ; il manque la **démonstration** en réel.

---

#### Compte rendu — « Importer » sans bloc choisi : le refus est désormais ANNONCÉ (30/09/2026) — CR inline

**Déclencheur (retour FJD, verbatim)** : « 1ere fois erreur silencieuse : importer sans choisir un bloc. il faut un laerte. 2e bon. »

**Diagnostic** — lu dans le code, pas supposé : quand **aucune sélection** n'est active, le moteur bascule en **mode « gun »** (`selLen === 0`, l. 2834). Dans ce mode le moteur **ne se plaint pas** : il affiche un `confirm` d'avertissement, charge le **place gun**, puis **retourne** — rien n'est écrit dans le document tant que l'utilisateur n'a pas cliqué dans une page. Appelé depuis le panneau, ce chemin est **contradictoire** : le panneau promet « importer la source dans le document », le moteur prépare un placement à la main. Résultat perçu par FJD : **un silence** (« erreur silencieuse ») — et, côté panneau, un bandeau **SUCCES** alors que **rien** n'a été importé (les deux lignes de journal cherchées sont écrites **avant** la branche gun).

**Choix retenu, et pourquoi** (point d'architecture, signalé comme tel) : le MENU **garde** le mode gun (décision FJD du 26/09 : « aucune sélection = gun ») — on n'y touche pas. Seul le **chemin PANNEAU** refuse (condition `appelPanneau && mode === "gun"`). Le refus est prononcé **dans le moteur**, immédiatement après la détection du mode et **AVANT tout nettoyage** : ni le document, ni le place gun ne sont touchés. **Une seule autorité sur la sélection** reste le moteur — le panneau ne peut pas juger à sa place (constat mesuré du 26/09 : un curseur actif peut rapporter une sélection **vide** quand le focus est passé au panneau).

- **Moteur** (`import_md.jsx`) : ligne de journal dédiée `M04: REFUS — aucun bloc de texte actif | appel PANNEAU refuse (mode gun interdit au panneau) | selection.length=0`, puis `alertUser(...)` explicite.
- **Panneau** (`main.js`) : lit cette ligne dans les lignes **AJOUTÉES** au journal ; si présente → bandeau **ECHEC** (« import REFUSE : aucun bloc de texte n'est actif… ») et `return` **avant** tout affichage de succès.

**Preuves de non-régression** :

```
$ node --check (moteur, copie .js)   -> jsx: syntaxe OK
$ node --check (panneau main.js)     -> main.js: syntaxe OK
$ grep -c $'\xef\xbf\xbd' import_md.jsx / main.js   -> 0 / 0
$ tail -c 20 import_md.jsx           -> ...main();
$ grep -c 'M04: REFUS' import_md.jsx -> 1
$ grep 'M04: REFUS' import_md.jsx | grep -c '[^ -~]' -> 0 (ligne de journal en ASCII pur)
```

**Preuve en réel — OBTENUE (journal du moteur, `import_md_errors.log`, non-UTF8 ⇒ lecture `LC_ALL=C grep -a`)** : deux clics de FJD, deux issues.

```
[Wed Sep 30 2026 20:52:54] M04-repartiteur: appel PANNEAU | appelant=panneau | action=importer | n=3
[Wed Sep 30 2026 20:52:54] M04: appel PANNEAU -> declencheur M05 SAUTE | action=importer
[Wed Sep 30 2026 20:52:54] M04: REFUS - aucun bloc de texte actif | appel PANNEAU refuse (mode gun interdit au panneau) | selection.length=0
---
[Wed Sep 30 2026 20:53:04] M04-repartiteur: appel PANNEAU | appelant=panneau | action=importer | n=3
[Wed Sep 30 2026 20:53:04] M04: appel PANNEAU -> declencheur M05 SAUTE | action=importer
[Wed Sep 30 2026 20:53:05] M04: source IMPOSEE par le PANNEAU = /Users/francois-jeandazin/INDD/IMPORT_MD/atelier_importateur_md.md | existe=true
```

→ **Clic sans bloc** (20:52:54) : le moteur **refuse** et l'écrit (`M04: REFUS … selection.length=0`) ; le panneau lit cette ligne et affiche **ECHEC** — plus de silence, plus de faux SUCCES. → **Clic avec bloc** (20:53:04-05) : le moteur **importe** la source imposée — **aucune régression** de la marche normale.

**Nettoyage d'encodage** : la ligne de journal contenait un tiret long (U+2014, non-ASCII) — remplacé par un tiret ASCII, ligne désormais **ASCII pur** (vérifié).

**Ce qui reste ouvert** : le `Ctrl+Z` (**reporté**, décision FJD).

**Statut** : ✅ TERMINÉE — le **refus est ANNONCÉ**, **PROUVÉ en réel** (les deux clics ci-dessus) et **la clôture est validée par FJD** le 30/09/2026.

---

#### Compte rendu — annulation en un seul pas + ancrage corrigé + oracle Node (30/09/2026) — CR inline

**Déclencheur (règle FJD, verbatim)** : « toute écriture dans le document doit tenir dans **UN SEUL** pas d'annulation — *sans cela, l'utilisateur devra faire Ctrl+Z 60 fois* ».

**Ce qui a été fait** — trois apports, tous dans le périmètre de la mission :

1. **Annulation en un seul pas** (`import_md.jsx`, l. 3131-3160). Mesure préalable : **0 occurrence** de `doScript` / `UndoModes` dans le moteur. Le corps de `main()` est **renommé `mainInterne`** et enveloppé :

```
function main() {
    var fait = false;
    try {
        if (typeof UndoModes !== "undefined" && typeof app.doScript === "function") {
            app.doScript(mainInterne, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT);
            fait = true;
        }
    } catch (eUndo) {
        logToFile("M04-undo: app.doScript(EntireScript) indisponible -> execution directe | message=" + eUndo.message);
    }
    if (!fait) { mainInterne(); }
}
```

   - `main()` reste le **point d'entrée commun** (menu **et** panneau) ; le **dernier repère `main();`** du fichier est **conservé tel quel** (parade de troncature du panneau) ;
   - si le runtime n'expose pas `UndoModes`, **repli sur l'appel direct** — jamais de régression, seulement l'absence du regroupement.

2. **Correctif d'ancrage en mode curseur** (`insertMarkdownWithStyles`, l. 1743-1779). **Cause trouvée** : `baseParaIndex = story_total − insertedParaCount` est **faux dès que l'insertion n'est pas à la toute fin de la story**. Mesure réelle du 30/09 : **527** paragraphes avant + **44** blocs ⇒ total **570** (et non 571) car le **dernier bloc inséré fusionne** avec l'ancien premier paragraphe ⇒ la soustraction (**526**) désignait le **mauvais** paragraphe, et l'**étape 4 relisait des plages hors du paragraphe visé**. **Correctif** : l'ancrage ne se **devine plus** — `baseParOffset` = **nombre de retours paragraphe (`\r`) situés avant `baseCharOffset`**, l'offset **caractère** réel du point d'insertion. Déterministe, sans comparaison de contenu (donc **aucune collision** avec un import antérieur du même fichier déjà présent). Si l'ancrage est indisponible **et** la soustraction incohérente ⇒ **abandon explicite** (`baseIndexKnown=false`), aucun style appliqué au hasard sur le texte voisin.

3. **Oracle Node** (`tools/sim_parse_oracle.js`) — **réexécution du VRAI `parseMarkdown` hors InDesign** (directive FJD : « teste-le en Node avant de me faire relancer »). L'outil extrait par **clôture transitive** les fonctions appelées par `parseMarkdown`, les évalue via `new Function()` avec un `app`/`$` neutralisé, recalcule les compteurs d'oracle depuis les blocs produits, et les compare aux `fixtures/*.expected.json`.

**Preuves de non-régression** :

```
$ cp import_md.jsx /tmp/_chk.js && node --check /tmp/_chk.js     -> syntaxe OK
$ node tools/sim_parse_oracle.js | grep RESULTAT                 -> RESULTAT : 23/23 controles OK
$ node tools/sim_parse_oracle.js | grep "profil"                 -> 289 blocs | h1=24 h2=23 h3=24 ... (conforme au .expected)
$ grep -c $'\xef\xbf\xbd' import_md.jsx COMMUNICATION/ROADMAP.md -> 0 / 0
$ tail -c 12 import_md.jsx                                       -> main();
```

**Preuve en réel — OBTENUE (journal du moteur `import_md_errors.log`, non-UTF8 ⇒ lecture `LC_ALL=C grep -a`)**, tir du **30/09 à 21:54** sur **document neuf** :

```
[... 21:54:20] M03-etape1: blocs texte attendus=283 / total blocs parses=289 | fullText.length=17863
              | crCount=293 | paragraphes attendus=294 | insertAtCursor=true
[... 21:54:21] M03-etape2: frontiere curseur — story_total=294 paragraphes_inseres=294
              => baseParSoustraction=0
[... 21:54:21] M03-etape2: ancrage offset — baseCharOffset=0 => baseParOffset=0 | baseSoustraction=0
[... 21:54:41] M03-etape2: bloc #282 type=p paraIndex=293 demande='P' relu='P'
[... 21:54:43] M03-etape2: blocs=283 paragraphes attendus=294 reels=294 ecarts=0
              | mode=curseur base=0 story_total=294 styles=283 neutre=0
```

- **Les 283 blocs sont parcourus** (du `#0` au `#282`), **`ecarts=0`**, **`neutre=0`** ;
- **`base=0`** ⇒ document **neuf** (plus de story accumulée) ;
- **aucune erreur** après 21:54 : les derniers `ERREUR | contexte=etape4 relecture characters` et `Longueur de story inattendue` datent des tirs **sales** antérieurs (21:21 → 21:31), **pas** de ce tir.

**Ce qui restait ouvert, et pourquoi c'est fermé** : le symptôme « **s'arrête avant le 2ᵉ H2** » **n'est ni dans le parseur** (l'oracle Node le prouve : 289 blocs, **23 H2** produits) **ni dans l'étape 2** (le journal montre les 283 blocs stylés). Il venait d'un **document réutilisé/accumulé** (`Longueur de story inattendue : 120779 au lieu de 25906`) qui rendait la mesure illisible. Sur **document neuf**, la mesure est propre.

**Leçon consignée (wiki Cas 48)** : sur document **non vide**, `base = story_total − N` est **faux** — le **dernier bloc inséré fusionne** avec le paragraphe suivant, donc **N paragraphes insérés ≠ N paragraphes décomptés**. Il faut **ancrer par l'offset caractère** (nombre de `\r` avant le point d'insertion), jamais soustraire.

**Statut** : ✅ TERMINÉE — les **deux moitiés du critère de fin** sont atteintes et **prouvées** : `Ctrl+Z` en un seul pas (validé FJD) **et** mapping intact après import (journal réel du 30/09 à 21:54, document neuf, `ecarts=0`). Clôture validée par FJD le 30/09/2026.

---

## Chapitre Panneau — Mission 5 — Habillage Spectrum (l'UI native)

**Statut** : 🟡 PARTIELLE — tir 1 (les 4 zones), tir 2 (widgets `sp-*` + `sp-icon` + `sp-textfield` + tokens), **tir 3 (panneau « Liens MD » autonome + repli SVG Illustrator, 01/10)**, **tir 3-suite (recalage du panneau sur le SVG de référence de FJD, au pixel, 01/10)** et **tir 3-suite bis (les 16 pictogrammes portent leur `fill` — `#eaeaea` pour les actions — et le chevron déplié est le chevron d'origine tourné 90° horaire, 01/10)**, ainsi que **tir 3-suite ter (bold « Calibrage », interlettrage global `.035em`, et icône de panneau MD livrée en PNG 23/46 + 24/48 avec ajout de l'array racine `icons`, 01/10)** sont faits et contrôlés automatiquement ; il reste la **validation visuelle FJD** (1 rechargement UDT) avant clôture. **Décidée avant la Mission 6** (ordre FJD du 30/09/2026 : « M UI Spectrum avant la boucle ») : l'habillage ne dépend **d'aucune** décision de stockage, la boucle, si.

### CR — tir 1 : les 4 zones (30/09/2026)

**Périmètre tranché par FJD** : « Tu produis le code front end, tu es à la fois archi et ouvrier » ; premier tir = **les 4 zones** (en-tête / liste / actions / informations), pas encore les widgets.

**Fichier touché** : `uxp/com.fjd.importmd.sonde/index.html` **seul** (`main.js` **non touché** — la structure change, la logique non).

**Ce qui a été fait** :
- corps réorganisé en **4 zones** nommées (`#zone_entete`, `#zone_liste`, `#zone_actions`, `#zone_infos`) suivant le patron de la référence DA (`doc/DA/Panneau lien INDD DESC.md`) : *titre/état → liste → actions → informations* ;
- `body` en **flex colonne** + `html,body{height:100%}` ; la **zone liste** prend la hauteur restante (`flex:1 1 auto`, `overflow:auto`, `min-height:120px`) → la **zone actions** reste collée sous elle ;
- **tokens d'espacement** introduits (`--space-1..4`, `--rayon`) ;
- **couleurs laissées en dur** : délibéré, elles partiront avec les `sp-*` au tir 2 (c'est alors que le thème viendra de l'hôte).

**Preuve (contrôles automatiques, à froid)** :
```
ids presents (une fois chacun) : 23/23   (les 4 zones + les 19 ids existants)
balises equilibrees : <div> 7 / </div> 7 · <button> 12 / </button> 12
U+FFFD (index.html) : 0
git diff --name-only : uxp/com.fjd.importmd.sonde/index.html  (seul fichier)
index.html : +116 / -58
```

**Preuve visuelle** : capture FJD du 30/09 à 23:31 (panneau rechargé). Retour FJD sur les 3 points de contrôle (liste extensible / journal lisible / 4 boutons actifs) : « **Oui, je crois** » — **validation molle, à reconfirmer au tir 2** (honnêteté : non certifiée par test instrumenté).

**Ce qui reste ouvert (donc 🟡, pas ✅)** : remplacer les contrôles par les widgets `sp-*` (boutons, `#chemin`, `#statut`, tableau), **ajouter les icônes `sp-icon`** aux 4 actions, **supprimer les couleurs en dur**. Le câblage `cabler()` (`addEventListener("click")`) devra être revérifié en réel à ce moment-là.

**Décision FJD** : la Mission 5 est **habilitée à l'exécution du code front-end par l'agent** (exception explicite au rôle « architecte seul »).

### CR — tir 2 : widgets natifs + tokens (30/09/2026)

**Périmètre tranché par FJD** : « **Tir 2** », dans le cadre déjà posé (« Tu produis le code front end, tu es à la fois archi et ouvrier »). Objet du tir : passer les contrôles bruts aux **widgets natifs `sp-*`**, **ajouter les `sp-icon`** aux 4 actions, et **retirer toute couleur en dur** au profit de **tokens**.

**Fichier touché** : `uxp/com.fjd.importmd.sonde/index.html` **seul** (`main.js` **non touché** — vérifié par `git diff --name-only`). Sauvegarde de l'état tir 1 prise avant édition (`/tmp/index.html.tir1.bak`, 233 lignes).

**Faits UXP vérifiés dans la doc AVANT d'écrire** (protocole : ne pas supposer) :
- `sp-button` (depuis UXP v4.1) **émet `click`** — donc `cabler()` (`addEventListener("click")`) **reste valide** tel quel ;
- l'icône dans un bouton **exige `slot="icon"`** : `<sp-button><sp-icon name="ui:X" size="s" slot="icon"></sp-icon>Libellé</sp-button>` ;
- `sp-textfield` (depuis UXP v4.1) **expose `.value`** — donc les 4 accès `getElementById("chemin").value` de `main.js` **restent valides** ;
- **la doc `sp-button` ne documente PAS d'attribut `size`** ⇒ les `size="s"` d'abord posés sur les boutons ont été **retirés** (on n'écrit que ce qui est vérifié). `size` est **conservé** sur `sp-icon` (là, il **est** documenté : `xxs`→`xxl`) ;
- **jeu d'icônes intégré = liste FERMÉE (~35 noms)**, **aucune** ne dit « rafraîchir ».

**Ce qui a été fait** :
- **bloc `:root` de tokens** : espacements (`--space-1..4`), rayon (`--rayon`), et **toutes les couleurs** (`--panel-bg`, `--panel-surface`, `--panel-journal-bg`, `--panel-border`, `--panel-border-strong`, `--panel-separator`, `--panel-th-bg`, `--panel-text`, `--panel-text-dim`, `--panel-journal-text`, `--panel-warning-text`, `--panel-success-*`, `--panel-error-*`) ;
- **les 4 actions** = `<sp-button>` avec `variant` (3 lectures en `secondary`, l'**écriture** `btn_import` seule en **`cta`**), chacune portant **une `<sp-icon slot="icon">` ET son libellé** (règle FJD « icône + mot, jamais l'icône seule »). Correspondance retenue — **noms intégrés les plus proches, à confirmer en réel** : `btn_liste`=`ui:Magnifier`, `btn_actualiser`=`ui:ArrowDownSmall`, `btn_import`=`ui:CheckmarkMedium`, `btn_copier`=`ui:ArrowUpSmall` ;
- **`#chemin`** = `<sp-textfield>` (propriété `.value` conservée : `main.js` intact) ;
- **boutons de l'annexe technique** (`btn_mesures` + les 7) = `<sp-button variant="secondary" quiet>` (le `variant` est **maintenu** car « cta est la variante par défaut » et « quiet ne supporte pas cta » — omettre `variant` créerait précisément le conflit interdit) ;
- **aucune couleur en dur hors du bloc `:root`** ; le CSS maison ne sert plus qu'à l'**agencement** (`display:block;width:100%;margin` sur les `sp-button` des zones actions/infos/annexe ; `#chemin` pleine largeur) ;
- **tableau `#liste`, journal `#journal`, bandeau `#statut`** : restent du **HTML brut** (pas de widget natif « tableau » ni « banner »), mais **entièrement tokenisés** ; le contrat `main.js` est **préservé** (`#statut` reste un `<div>` avec `className = ok|ko`) ;
- **Règle d'or UXP respectée** : on **ne restyle pas** les `sp-*` — ils prennent l'apparence et le thème (sombre/clair) de l'hôte.

**Preuve (contrôles automatiques, à froid)** :
```
contrat d'ids demandés par main.js : 18/18   (7 via getElementById + 11 via cabler())
  (chemin journal liste_corps liste_note statut mesures btn_mesures
   btn_dom btn_doscript btn_moteur btn_fichier btn_negatif btn_identite
   btn_canal btn_liste btn_copier btn_actualiser btn_import)
balises nat. equilibrees : <sp-button> 12 / </sp-button> 12   <sp-icon> 4/4   <sp-textfield> 1/1
attribut size= : 0 sur sp-button   ·   4 sur sp-icon   (conforme a la doc)
controles bruts restants : <button> 0   ·   <input> 0
couleurs en dur HORS :root : 0   (le bloc :root est le seul endroit ou une couleur est ecrite)
U+FFFD : 0 (index.html)   ·   0 (ROADMAP.md)
git diff --name-only : uxp/com.fjd.importmd.sonde/index.html  (main.js NON touche)
tir 2 seul (index.html vs sauvegarde tir 1) : +110 / -70   (233 -> 273 lignes)
cumul index.html vs dernier commit (tir 1 + tir 2, tir 1 non commite) : +288 / -96
```
NB méthode : deux compteurs (`sp-icon` 5, `sp-textfield` 2) provenaient de **commentaires CSS** (lignes 11 et 13) : `grep -n` l'a prouvé — le **markup** est bien **4** et **1**, sans doublon.

**Ce qui reste ouvert (donc 🟡, pas ✅)** :
1. **Validation visuelle FJD** — 1 rechargement UDT, puis capture : les 4 zones, les 4 icônes, le champ chemin et le journal. **La validation molle du tir 1 (« oui, je crois ») doit être confirmée ici**, et l'écart avec la référence DA doit être comblé (critère de fin n°1).
2. **Rendu des icônes à l'écran** — les **NOMS sont désormais vérifiés** : les 4 (`Magnifier`, `ArrowDownSmall`, `CheckmarkMedium`, `ArrowUpSmall`) figurent **tous** dans la **liste officielle fermée** des 37 icônes `ui:` de la doc UXP (`sp-icon`, natif depuis v4.1). Cette liste **ne contient aucune icône « rafraîchir »** : `btn_actualiser` = `ArrowDownSmall` est donc une **approximation assumée**, à juger visuellement. Le rendu reste **à voir à l'écran**, pas supposé.
   *NB — **CORRIGÉ le 01/10**. La piste « workflow icons » n'est **pas** écartée pour indisponibilité : c'était une **erreur de ma part**. Vérification réelle (registre npm + dépôt `adobe/swc-uxp-wrappers`) : les **37 paquets** `@swc-uxp-wrappers/*` existent — dont **`table`**, `banner`, `toast`, `card`, `tooltip`, `sidenav`, `search`, `action-button` — et `Icon`, **`Icons Workflow`**, `Iconset`, `theme`, `base` sont embarqués dans **`@swc-uxp-wrappers/utils`** (prérequis obligatoire). Le coût est réel et mesuré : couche **figée à SWC 0.37.0** (publiée le 2024-06-06, dernier commit du dépôt **il y a 2 ans**) quand la SWC navigateur est en **1.12.4**, et **known issues** déclarés sur `table`, `textfield`, `search`, `sidenav`, `menu`, `switch`, `card`… D'où la **remise en cause par FJD le 01/10** (« entrer de plein pied dans UXP ») : le rendu natif est jugé daté, et le tableau + les icônes riches manquent. **Décision à prendre sur test réel**, pas sur argumentaire. Faits consignés : `/memories/repo/indd-uxp-spectrum-faits.md`.*
   *À titre d'option (non retenue à ce jour) : `sp-action-button` **existe** en UXP natif — widget adapté à des boutons **icône seule**, si la règle « icône + mot » évoluait.*
3. **Thème clair/sombre du HTML brut** (tableau, journal, statut) : leurs tokens **existent**, mais le **basculement** depuis l'hôte n'est **pas câblé** — noté comme mesure ultérieure, **pas** supposé.
4. **Preuve fonctionnelle** (critère de fin n°2) : les 4 boutons font toujours la même chose — à rejouer après validation visuelle.

**Rappel protocole** : `main.js` **non modifié**, donc le câblage `cabler()` et les accès DOM sont **inchangés** — leur compatibilité avec les `sp-*` repose sur les **faits vérifiés ci-dessus** (`click`, `.value`), **à confirmer en réel** au rechargement.

### CR — tir 3 : panneau « Liens MD » autonome + repli SVG Illustrator (01/10/2026)

**Déclencheur FJD** : « BON, on repart du panneau liens » suivi d'une **spécification textuelle complète L1→L5** : le panneau est **rebaptisé « Liens MD »** et calqué sur le panneau natif InDesign « Liens ». FJD ayant épuisé ses crédits Figma, le design passe par le **code UXP** au lieu d'une maquette.

**Trois questions tranchées par FJD (verbatim)** :
- **Livrable** : « UXP + SVG Illustrator comme ça si tu ne fonctionnes pas, j'ai tout ce qu'il faut pour reprendre » ⇒ **deux artefacts** (panneau UXP exécutable **et** SVG réimportables dans Illustrator) ;
- **Emplacement** : « Dans le dépôt INDD/IMPORT_MD/uxp/ (j'autorise explicitement le toucher) » ⇒ touché **dans le dépôt**, autorisation explicite ;
- **Périmètre** : « Les 4 zones complètes (en-tête + liste + actions + informations) ».

**Fichiers produits — dossier NOUVEAU, purement additif** :
```
uxp/com.fjd.importmd.panneau/
  index.html          14994 -> 14940 o   le panneau (4 zones)
  main.js              6089 ->  6067 o   cablage DOM, donnees de demonstration
  manifest.json         907 o           manifestVersion 5, host ID >= 21.6.0
  illustrator/
    generer_svg.py    12921 o           generateur (geometrie alignee sur le HTML)
    panneau_liens_md.svg                     9324 o   Calibrage replie (defaut)
    panneau_liens_md_calibrage_deplie.svg    9624 o   Calibrage deplie
```
**Le panneau de la sonde n'est PAS touché** — vérifié par `git diff --name-only` (voir Preuve). La livraison est **strictement additive**.

**Correspondance spec FJD → implémentation** :

| Spec FJD | Implémentation |
|---|---|
| L1 « label liens MD » | `<sp-heading size="S">Liens MD</sp-heading>` + état à droite (`#statut`, classe `ko`) |
| L2 « nom \| icône danger \| icône page (tri) » | `#entetes` : colonne `Nom` + `sp-icon ui:AlertMedium` + bouton tri icône seule (`#btn_page`) |
| L3 « tableau, lignes NON expandables : badge md dans carré bordé radius orange, nom, align-right état, n° de page » | `table#liste` : `.badge-format` (carré 18×18 bordé `--panel-warning`, radius 4, texte `MD`) + nom + `.etat` aligné à droite + `.cellule-page` |
| L4 « chevron expander, nb de liens sélectionnés, chaîne, flèche import, circulaire actualiser, crayon — icônes seules sans label » | `#zone_actions` : `#btn_expand` + `<sp-detail id="nb_selection">` + 4 `sp-action-button` icône seule (`#btn_relier`, `#btn_import`, `#btn_actualiser`, `#btn_editer`), chacun avec son `title` |
| L5 « informations sur les liens » : titre, nom, État, Taille, **Calibrage** (repliable → mots, signes), date de modification, chemin, modèle | `#zone_infos` : `#titre_infos` + `#fiche` + `#ligne_calibrage` (chevron) + `#calibrage` (masqué par défaut) + 3 dernières lignes |

**Choix techniques explicités** :
- **Pas de widget accordéon/tree en UXP InDesign** (vérifié : la doc ne liste ni accordion, ni disclosure, ni tree, ni table) ⇒ la ligne « Calibrage » est un **déclencheur + bloc masqué** par `style.display` — **le mécanisme déjà certifié** sur `#mesures` de la sonde, pas une invention ;
- **`sp-icon` seulement quand le nom existe** dans la liste fermée `ui:` : utilisés = `ui:AlertMedium` (danger) et `ui:ChevronRightSmall`/`ui:ChevronDownSmall` (expander) ;
- **icônes absentes du jeu natif** (chaîne, import, actualiser, crayon, page) ⇒ **SVG inline** dans `<div slot="icon">`, ce que la **doc `sp-action-button` documente explicitement**, avec les **géométries réelles** du jeu Spectrum déjà extrait (`Link.svg`, `Import.svg`, `DocumentRefresh.svg`, `Edit.svg`, `Document.svg`) — **aucun tracé inventé à la main** ;
- **« icônes seules, sans label »** est la **demande explicite de FJD** pour la zone L4 : elle est donc appliquée **ici et ici seulement** (elle déroge à la règle « icône + mot » du tir 2, qui reste en vigueur dans la sonde) — chaque icône seule porte un `title=` pour l'accessibilité ;
- **`sp-*` non restylés** (règle d'or) ; le CSS maison ne fait que l'**agencement** ; **toute couleur est dans le bloc `:root`** (tokens provisoires, à remplacer par ceux de l'hôte) ;
- **convention ASCII respectée** : le panneau de la sonde ne contient **aucun accent** — les nouveaux fichiers suivent la même convention (voir Preuve) ;
- **SVG Illustrator** : aucune **classe CSS** (Illustrator aplatit les styles), uniquement des **attributs de présentation** ; chaque zone est un `<g id="...">` ⇒ arrive en **calque nommé** ; dimensions **1:1** avec `preferredDockedSize` du manifest (320×640).

**Preuve (contrôles automatiques, à froid)** :
```
contrat d'ids main.js -> index.html ......... 19/19  (aucun manquant)
balises principales equilibrees ............. OK (table/tbody/tr/td/div/style/script/body/html)
manifest.json valide ........................ OK (json.load)
SVG bien formes (XML) ....................... OK (minidom) x2
non-ASCII (index.html / main.js / manifest / .py / 2 SVG) ... 0 partout
U+FFFD (les 6 fichiers livres) .............. 0 partout
git status --porcelain (depot IMPORT_MD) .... M COMMUNICATION/ROADMAP.md        (CR tirs 1-2, non commite)
                                              M uxp/com.fjd.importmd.sonde/index.html  (tir 2, non commite)
                                              ?? uxp/com.fjd.importmd.panneau/  <-- SEUL apport du tir 3
git diff --name-only ........................ ROADMAP.md + sonde/index.html  (le panneau n'apparait PAS : non suivi)
```
**Aperçu visuel des 2 SVG** : rendus dans Chromium (viewport 340×660) et contrôlés — les 4 zones, le badge `MD`, la ligne sélectionnée en bleu, la barre d'icônes, la fiche et le chevron **Calibrage** s'affichent conformément à la spec ; la variante dépliée ajoute bien `mots` / `signes` et retourne le chevron. *(`qlmanage` a été écarté : il rend l'icône générique de document, pas le SVG — mesure faite, pas supposé.)*

**Ce qui reste ouvert (donc 🟡, pas ✅)** :
1. **Validation visuelle FJD** — 1 rechargement UDT sur `com.fjd.importmd.panneau` ; le panneau est un **nouveau dossier**, il n'écrase **pas** la sonde : les deux peuvent coexister le temps de la comparaison ;
2. **Points d'interprétation à confirmer** : (a) le libellé des états (`modifiee` / `identique` / `source absente`) ; (b) le badge `MD` rendu en **texte dans un carré bordé** (et non un glyphe) ; (c) l'ordre des champs de la fiche ; (d) les **tokens sombres provisoires** du `:root` (à remplacer par ceux de l'hôte) ; (e) le **chevron par échange d'attribut `name`** sur `sp-icon` (réactivité **supposée**, à voir à l'écran) ;
3. **Décision FJD** : ce panneau **remplace-t-il** l'UI de la sonde, ou reste-t-il un **modèle de design** à côté d'elle ? Non tranché.
4. Aucune **preuve fonctionnelle** n'est revendiquée : `main.js` du nouveau panneau câble des **données de démonstration**, il n'appelle **pas** le moteur `import_md.jsx`.

### CR — tir 3 (suite) : recalage au pixel sur le SVG de référence de FJD (01/10/2026)

**Déclencheur FJD** : « Je t'ai remis le svg en place. C'est le SVG de reference. Suis-la a la lettre, au px. » — plus une consigne d'alignement précise : « attention notamment à aligner les param de la liste en bas (nom:..., taille:...) sur le signe ":" et pas par le centre. »

**Étape 0 — le SVG de référence est INTACT (une alerte que j'avais moi-même levée est close)**. J'avais consigné au tir 3 un doute (« le fichier aurait été écrasé : 34005 octets / 41 tspan à 12:20 contre 11065 / 15 tspan à 14:27 »). **Vérification faite : c'était une ERREUR DE MA PART** — 34005 octets était un relevé fautif de ma propre main, pas une trace de fichier. Le fichier sur disque est **le bon et n'a jamais été écrasé** :
```
fichier   illustrator/panneau_liens_md.svg
taille    11065 octets        mtime  01/10 14:27
md5       ba000b0648718bbc3435919ee6e5c350
viewBox   0 0 371.5 592
groupes   zone_entete, zone_liste, zone_actions, zone_infos
compte    text 15 · rect 7 · line 9 · path 15 · tspan 41 · g 10 · classes .cls-1..34
```
Aucune action de réparation n'était donc nécessaire. **Le doute est levé, pas reporté.**

**Faits tirés du SVG de référence (mesurés, pas supposés)** — le panneau est la tranche **x 51.5 → 371.5** (320 de large), y 0 → 592 :
- textes : `Liens MD` (63.5,22) · entête `Nom` (67.5,49) · les 3 noms d'état `MD` (70.28) · les 3 fichiers + leurs numéros de page (12 / 4 / 31) · `2 liens selectionnes` (95.5,420) · `Informations sur les liens` (71.07,447) · `Calibrage` (92.5,571.43) · **la fiche entière est UN seul `<text>`** (59.37,482.48) avec les 6 lignes séparées par des tabulations ;
- rectangles : fond panneau (51.5,0,320,592) · fond liste (59.5,32,304,368) · bandeau d'entête (60.5,35,302,22) · **sélection** (60.5,80,302,24) · **3 badges** (67.5 ; 59/83/107, 18×18, rayon 4) ;
- traits : `#5a5a5a` y=57 · `#474747` y=80 · `#6d6d6d` y=104 · **deux traits verticaux** x=310.9 et x=273.9 (y 39→53) · `#6d6d6d` y=429, 456.66, 557, 579 ;
- palette relevée au pixel : `#535353` 87.76 % · `#323232` 2.84 % · `#595959` 1.16 % · `#eaeaea` 0.76 % · `#e68619` 0.34 % · `#a8a8a8`, `#fcb910`, `#d7373f`, `#d50f2b`, `#6d6d6d`, `#474747`, `#b0b0b0`.

**Fait UXP vérifié AVANT d'écrire (et qui a commandé toute la réécriture)** : la surface CSS d'UXP est **plus étroite** que celle du navigateur. Relevé exhaustif de la doc (`reference-css/styles/`) : `display` ne documente que **`none | inline | block | inline-block | flex | inline-flex`** ⇒ **CSS Grid est INDISPONIBLE**, et `line-height`, `box-sizing`, `text-decoration`, `cursor`, `z-index`, `transform`, `box-shadow` **ne sont pas documentés**. Conséquence directe : la fiche alignée sur le `:` **ne peut pas** être une grille ; elle est faite en **flex / inline-block**, et les filets sont des `border-*`/`background` (pas de `outline`). `:hover`, `::before`, `::after` et les sélecteurs standard **sont** disponibles. *(Faits consignés dans `/memories/repo/indd-uxp-spectrum-faits.md`.)*

**La consigne d'alignement sur le `:` — tenue, et prouvée** : la fiche est bâtie sur `.cle` (**largeur fixe 129.45 px, `text-align: right`, gras**) + `.val` (`padding-left: 3.05 px`) ⇒ le `:` tombe à **132.5 px** dans la fiche, soit **140.37 px** dans le panneau. Mesure d'encre sur les 2 images rendues, **ligne par ligne** :

```
ligne            REF (x du « : »)   PANNEAU (x du « : »)
Nom                   142                  142
Etat                  142                  142   (rouge #d7373f dans les deux)
Taille                142                  142
Date de modification  142                  142
Chemin                142                  142
Modele                142                  142
=> les 6 lignes : bord droit du libelle 136/137 (identique) · debut de valeur 146/147 (identique)
```
La consigne est donc **satisfaite et chiffrée** : l'alignement se fait **sur le signe `:`**, jamais par le centre, et il est identique dans les deux images sur **les 6 lignes**.

**Le seul écart résiduel trouvé, sa cause, et sa correction** : la ligne `Chemin` s'arrêtait à **x=302** dans le panneau contre **x=309** dans la référence (7 px). Cause identifiée, pas devinée : le `…` de la référence est du **contenu écrit** (un `<text>` SVG ne découpe jamais), dont l'**avance vaut ≈170 px** alors que la boîte de `.val` n'en offrait que **169.94** (302.44 − 129.45 − 3.05) ⇒ Chromium **tronquait la chaîne et reposait son propre `…`**, dont l'encre tombe à 302. Correction : `max-width: 171px` (la chaîne de la référence **tient** alors telle quelle, sans troncature ; le bord droit reste à 311.37 < 312, fin des filets). **Après correction : encre à 308 contre 309 en référence — soit 1 px d'anti-aliasing**, et les groupes de points se recouvrent (`285-301`, `304-305` de part et d'autre).

**Méthode de rendu (Playwright absent — mesuré, pas supposé)** : `view_image` ne lit pas le SVG et le module Playwright n'est **pas installé** sur ce poste. Rendu par **Chrome en mode headless**, `--window-size=320,592`, `--force-device-scale-factor=1`, `--hide-scrollbars` ; la référence est cadrée par un wrapper qui décale le SVG de `-51.5 px` pour ramener la tranche du panneau à l'origine. Les deux PNG font **320×592**.

**Preuve du recalage — écart global au pixel** :
```
identiques : 90.37 % des pixels (18689 / 189440)
  entete  (y 0-32)       95.94 %      liste   (y 32-400)     94.26 %
  actions (y 399-431)    82.99 %      infos   (y 429-592)    81.52 %
```
Le reliquat est **de la rastérisation de police** (les deux images ne sont pas composées par le même moteur de texte) et **un artefact de trait à 0.5 px** — explicité ci-dessous, **volontairement non compensé**.

**Les 5 filets pleine largeur (y 104, 429, 457, 557, 579) — 1 px de rastérisation assumé** : dans la référence, ce sont des **traits de 0.5 px** (`.cls-22`, `#6d6d6d`) ; rendus par le moteur SVG de Chrome, un trait de 0.5 px centré sur une coordonnée entière couvre **25 % de chacune des deux lignes voisines** (relevé : 89 / 89 sur fond 83). Le CSS de Chromium, lui, **cale une boîte de 0.5 px sur une seule ligne, à 100 %** (relevé : 109). **Je n'ai donc pas compensé la couleur** : à l'écart d'échelle réel (écran Retina, facteur 2), les deux redeviennent **un trait d'un pixel physique**, et assombrir la couleur rendrait le panneau **faux** sur l'écran cible. C'est un **artefact de la comparaison à 1×**, pas un défaut du panneau. *(Il pèse ~1565 px du total, soit 8,6 % du reliquat.)*

**Garde-fou ajouté : le générateur ne peut plus écraser la référence.** `illustrator/generer_svg.py` écrivait **exactement** `panneau_liens_md.svg` — le fichier de FJD. Corrigé : ses sorties sont désormais `panneau_liens_md_genere.svg` et `panneau_liens_md_genere_calibrage_deplie.svg`, avec un **refus explicite** (`SystemExit`) si l'on tente d'écrire le nom de la référence. Preuve que la référence est hors de portée :
```
md5 avant execution du generateur : ba000b0648718bbc3435919ee6e5c350
md5 apres execution du generateur : ba000b0648718bbc3435919ee6e5c350   (inchange)
ecrit : panneau_liens_md_genere.svg (9324 octets)
ecrit : panneau_liens_md_genere_calibrage_deplie.svg (9624 octets)
la reference panneau_liens_md.svg n'a pas ete touchee
```

**Preuve (contrôles automatiques, à froid)** :
```
U+FFFD : 0 sur index.html, main.js, manifest.json ET sur le SVG de référence
balises index.html : div 39/39 · span 54/54 · svg 10/10 · script 1/1 · pre 1/1  (equilibrees)
                     (<path .../> : 15, auto-fermantes — pas un desequilibre)
manifest.json : JSON valide (json.load) — id com.fjd.importmd.panneau
git status --porcelain : ?? uxp/com.fjd.importmd.panneau/        <-- NON SUIVI (purement additif)
                         M  COMMUNICATION/ROADMAP.md              (CR tirs 1-2-3, non commite)
                         M  uxp/com.fjd.importmd.sonde/index.html (tir 1-2, non commite)
```
**Le panneau de la sonde n'est PAS touché par ce tir** — vérifié par les dates : `sonde/index.html` a pour **mtime 01/10 00:04** (tirs 1-2), alors que les fichiers ouverts dans ce tir sont datés **01/10 15:03**. Aucune écriture de ma part après 00:04 sur la sonde.

**Ce qui reste ouvert (donc 🟡, pas ✅)** :
1. **Validation visuelle FJD** — 1 rechargement UDT : c'est la seule mesure qui manque, et elle ne peut venir que de FJD. **Le rendu ci-dessus est celui de Chromium, PAS celui d'InDesign** : memes fichiers, autre moteur.
2. **`manifest.json` : tailles à trancher** — il déclare `preferredDockedSize` **320×640** alors que la référence est dessinée sur **320×592** (28 px d'écart, soit la hauteur d'une ligne). À recaler ou à assumer, décision FJD.
3. **Points que je reproduis littéralement du SVG et que je signale plutôt que de « corriger » seul** : (a) la **sélection** porte sur la **ligne 2** alors que la **fiche décrit le fichier de la ligne 1** ; (b) l'en-tête annonce **« 2 liens selectionnes »** alors qu'**une seule** ligne est surlignée ; (c) l'état de la ligne 2 est un **`!` blanc sans triangle** et la ligne 3 n'a **rien** ; (d) les libellés `Etat` et `Modele` sont **sans accent** ; (e) le `Chemin` porte un **`…` dans son contenu**. **Ce sont des incohérences du dessin de référence** : je les ai suivies à la lettre (« au px »), mais elles méritent une décision de FJD.
4. **Accents** : la convention ASCII du projet est **transgressée par la référence elle-même** (`modifiée`, `…`) — j'ai suivi la référence, pas la convention. À confirmer.
5. **`sp-action-button` non utilisé** : les 5 icônes d'action (chaîne, import, actualiser, crayon) sont des `<div>` avec `:hover`, car leurs tracés **ne figurent pas** dans la liste fermée `ui:`. Passer au widget natif est possible sur demande (FJD avait déjà tranché « icône seule » pour cette zone).
6. **`illustrator/panneau_liens_md_calibrage_deplie.svg` (9624 o, 12:06)** est désormais **en doublon** avec `panneau_liens_md_genere_calibrage_deplie.svg`. Je ne supprime pas un fichier du dépôt sans accord.
7. **Valider l'état déplié du Calibrage** : la référence ne montre **que l'état replié** ; l'état ouvert (chevron retourné + bloc `mots`/`signes`) est **déduit**, pas copié — il n'a donc **aucune référence** à laquelle se comparer.

---

### CR — tir 3 (suite bis) : les pictogrammes en `#eaeaea` et le chevron déplié (01/10/2026)

**Déclencheur FJD** — après « Pas mal ! », deux corrections précises :
1. « les pictogrammes (chevrons, chaîne, dossier, crayon) sont pour le moment en `#000`, ils doivent être en `#eaeaea` cf le SVG » ;
2. « le chevron de ligne expandue est décoloré dans la dimension par défaut du kit ; dans ma ref, il faut utiliser le chevron d'origine simplement tourné 90° horaire. »

**Correction 1 — la cause, trouvée et non devinée.** Le `fill` était posé **sur le `<svg>` racine** : en UXP cet attribut **n'est pas hérité** par les tracés enfants — la surface CSS d'UXP ne documente **ni `fill`, ni `transform`, ni `svg`** (relevé exhaustif de la doc, fait consigné en mémoire). Les tracés retombaient donc au **noir par défaut**, exactement ce que FJD voyait. Correction : `fill="…"` explicite **sur chacun des 16 `<path>`**, en reprenant **les couleurs de classe du SVG de référence** :

```
zone       pictogramme                     fill      classe ref
entete     triangle avertissement           #b0b0b0   .cls-32
entete     icone page (corps)               #b0b0b0   .cls-32
entete     icone page (coin)                #b0b0b0   .cls-32
ligne 1    triangle ambre                   #fcb910   .cls-31
ligne 2    point d'exclamation              #ffffff   .cls-9
actions    chevron expander                 #eaeaea   .cls-24
actions    chaine (2 maillons)              #eaeaea   .cls-24
actions    dossier/import (2 traces)        #eaeaea   .cls-24
actions    actualiser (3 traces)            #eaeaea   .cls-24
actions    crayon                           #eaeaea   .cls-24
calibrage  chevron FERME                    #eaeaea   .cls-24
calibrage  chevron OUVERT                   #eaeaea   .cls-24
=> 16 <path> / 16 avec fill / 0 sans fill (controle automatique)
```
Les 11 `#eaeaea` couvrent bien **tout** ce que FJD citait : chevrons, chaîne, dossier, crayon.

**Correction 2 — le chevron déplié.** Le kit offrait `sp-icon name="ui:ChevronDownSmall"` : **autre tracé, autre dimension, et il sort décoloré** ⇒ il ne peut pas servir, comme FJD le dit. Solution retenue : **rejouer LE MÊME tracé que le chevron fermé**, tourné de **90° horaire**. Comme **`transform` n'existe pas** dans la surface CSS d'UXP, la rotation est **gravée dans le tracé lui-même** (attribut `d`) par `illustrator/rot_chevron.py` : rotation de 90° autour du centre du tracé (`CX=83.42, CY=567.285`), chaque point `(x,y)` devenant `(CX-(y-CY), CY+(x-CX))`, les courbes de Bézier tournées par leurs **points de contrôle**.

Preuve de la gravure (rendu natif `<g transform="rotate(90 …)">` contre tracé gravé, ×60) :
```
a.png (rotation native) vs b.png (trace grave) : 145 / 175131 px d'ecart  (0,08 %)
delta max par canal : 5 / 255     => anti-aliasing pur, pas une deformation
rendu de b.png : le chevron pointe bien vers le BAS
```
Preuve sur le panneau (rendu `replie.png` contre `deplie.png`, encre **#eaeaea** dans les deux états) :
```
etat      encre   x       y         colonnes          centre x
replie    8 px    29..33  565..572  29 30 31 32 33    31,0   (forme '>' verticale)
deplie    8 px    28..35  566..570  28..35            31,5   (forme 'v' horizontale)
=> meme axe horizontal : le trace ouvert EST le trace ferme tourne
   (5,32 px de large -> 9,15 px, soit exactement 5,32 x 9,15 inverse)
```
Et la preuve que **le texte ne bouge pas d'un pixel** : `Calibrage` mesure **105 px** et occupe **x 42..86 · y 563..572** dans **les deux** états — identité stricte. Le chevron ouvert, plus large de 3,83 px que sa boîte, **déborde de 1,915 px de chaque côté** (centrage flex) : c'est exactement le geste d'une rotation autour du centre, et cela **laisse le mot à sa place**.

**Non-régression** : identité au pixel avec la référence **90,36 %** contre **90,37 %** avant correction ⇒ écart nul à l'arrondi, donc **aucune régression** (le reliquat est de la rastérisation de police, déjà explicité plus haut).

**Contrôles à froid** :
```
U+FFFD                 : 0 sur index.html, main.js, manifest.json
node --check main.js   : OK
balises index.html     : div 39/39 · span 54/54 · svg 11/11 · script 1/1 · pre 1/1 · style 1/1
                         (svg passe de 10 a 11 : le chevron deplies est un SVG inline)
<p .../> auto-fermants : 16 / 16
sp-icon subsistants    : 0        (le dernier a ete retire)
manifest.json          : JSON valide
```
Le commentaire devenu faux dans `main.js` (il citait encore `sp-icon ChevronDownSmall`) a été corrigé dans le même geste.

**Fait à consigner** : **le `fill` posé sur le `<svg>` racine n'est PAS hérité par les `<path>` en UXP** ⇒ la couleur d'un pictogramme doit **toujours** être portée par le tracé lui-même, jamais par la racine.

**Reste à faire** : rapatrier `rot_chevron.py` de `/tmp/liens_md_icones/` vers `illustrator/`, puisque le commentaire de `index.html` cite ce chemin comme l'origine du tracé gravé. *(Fait : le script est bien dans `illustrator/`.)*


### CR — tir 3 (suite ter) : le bold « Calibrage », l'interlettrage global et l'icône de panneau (01/10/2026)

**Déclencheur FJD** — trois retours successifs :
1. « Calibrage en bold » (puis, corrigeant sa propre coquille : « label calibrage en vold, pardon ») ;
2. « Au glkobal : letter-spacing: .035em; » ;
3. « Tu fais l'icine stp ? » — puis le constat qui a recadré le sujet : « L'cone de barre d'accroche n'a pas changé. JE pe se que tu n'as pas identifié le bon objet. C'est l'icone de repli du panneau, une fois qu'on ne voit plus le label. Là c'est encore l'icone générique des pklugins ».

Les deux premiers points sont faits **et vérifiés** ; le troisième est **livré mais pas encore constaté à l'écran** — d'où un statut qui reste partiel.

**1. Le bold du label « Calibrage » — écart assumé, pas une erreur.** Le SVG de référence porte « Calibrage » en **Helvetica NORMAL** (classe `.cls-5`), tout le reste du bloc en gras. FJD demandant le gras, on **dévie volontairement** de la référence : `#ligne_calibrage .cal-texte { font-weight: 700; }`. La référence typographique a été relue pour **tracer l'écart** (et non pour l'ignorer).

Preuve mesurée sur les deux rendus (état replié), bande de la ligne « Calibrage » :
```
              avant        apres
boite x       41..87       41..90
boite y       562..574     562..574     (hauteur inchangee : 12 px)
encre         245 px       305 px       (+24,5 %)
dernier x     87           90           (le gras pousse a droite, pas a gauche)
premier x     41           41           (l'alignement a gauche est preserve)
```
`font-weight` est **documenté dans la surface CSS d'UXP** (v3.0+) : ce n'est pas une extrapolation.

**2. L'interlettrage global `.035em` — posé sur `#panneau`, donc hérité.** Documenté (UXP v2.0+ ; les valeurs négatives sont invalides, `.035em` est positif). Contrôle : **12 bandes** de pixels modifiées, **toutes du texte pur** (aucune bordure, aucun fond), et **aucun décalage de disposition**. Le seul risque réel était le **débordement à droite** de la fiche ; mesuré :
```
bord droit de la fiche : 285 -> 295   et   308 -> 307
largeur utile          : 312 px
=> 295 et 307 restent < 312 : aucune troncature
```

**3. L'icône de barre d'accroche — le bon objet, enfin identifié.**

**Ce que FJD voit** : dans le bandeau d'accroche du panneau **replié** (quand le libellé « Liens MD » n'est plus affiché), c'est **le lego « module externe » générique** qui s'affiche — pas le badge MD (capture : `Capture d'écran 2026-10-01 à 19.06.36.png`).

**Pourquoi l'essai précédent ne pouvait pas marcher.** L'essai précédent déclarait, dans l'entrypoint, un `icon` en **SVG** avec `species: ["toolbar"]` et `scale: [1]`. Trois défauts, tous **documentés** :

(a) **Le moteur SVG d'UXP n'est pas fiable.** La doc InDesign (`known-issues`) est explicite : « Plugin icons do support SVG files, but UXP doesn't support all SVG features… test your SVG icon before shipping » et « Not all SVG files are supported by UXP. UXP's SVG renderer is targeted for simple icons and the like; complex SVGs may fail to render completely, or may render in unexpected ways. » Notre SVG contenait un `<g transform="translate(...)">` — et **`transform` ne figure pas** dans la surface CSS supportée par UXP. Le fichier a donc été **aplati**.

(b) **`species: ["toolbar"]` est restrictif.** Doc du manifest InDesign (`plugins/concepts/manifest`, L167) : « generic: suitable for display anywhere » est **le défaut** ; « toolbar: suitable for display in a toolbar ». N'autoriser que `toolbar` **exclut** l'icône de tout emplacement que l'hôte ne classe pas « toolbar ». Le nouveau manifest **omet `species`** ⇒ défaut `["generic"]` = affichable **partout** : le choix le plus permissif.

(c) **L'array racine `icons` était absent.** Doc (même fichier, L101) : « An array of icons representing the overall plugin **or panel** icon… If the icons array is missing, **a default icon will be used**. » C'est exactement notre cas, et le monde réel le confirme : le plugin **sonde** installé (`~/Library/Application Support/Adobe/UXP/Plugins/External/com.fjd.importmd.sonde/manifest.json`, lecture seule) **n'a aucune icône** — ni racine ni entrypoint — donc il retombe sur l'icône générique, celle que FJD voit.

**Résolution retenue — les causes possibles traitées en une seule fois** (une seule session UDT par essai : on ne joue pas au devineur) :

| cause possible | traitement |
|---|---|
| `<g transform>` non rendu par UXP | SVG **aplati** : translation gravée dans le `d` (1 `path`, 0 `g`, 0 `transform`) |
| moteur SVG d'UXP peu fiable | icônes livrées en **PNG**, plus en SVG |
| `species: ["toolbar"]` trop restrictif | `species` **omis** ⇒ `["generic"]` (affichable partout) |
| `scale: [1]` sans variante 2x | `scale: [1, 2]` avec les deux PNG (23 + 46) |
| array racine `icons` absent | **ajouté** (24 x 24 + 48 x 48) |
| cache d'icône de l'hôte | **instruction FJD** : décharger/recharger entièrement le plugin, ou redémarrer InDesign |

**Tailles — lues dans la doc, pas inventées** (IconDefinition, L167) : `toolbar` ⇒ 23 x 23 @100 %, 46 x 46 @200 % ; `pluginList` ⇒ 24 x 24 @100 %, 48 x 48 @200 %. D'où quatre fichiers.

**Le SVG aplati** (`icones/md.svg`, 1 143 o) — `illustrator/generer_icone_md.py` a été réécrit en **deux passes** : passe 1 sans décalage pour mesurer la bbox d'encre brute, calcul du centrage, passe 2 avec le décalage appliqué **à la fois au tracé et à sa bbox**. Le `<g transform>` a disparu : seul le recentrage centralise l'encre.
```
carre            : 20 x 20, rx 4,44   (marge 1,5 dans une boite de 23)
corps lettres    : 8,89
avance totale    : 14,45
bbox encre abs   : (4,97 ; 8,32) -> (18,03 ; 14,68)
centre d'encre   : (11,5 ; 11,5)      => centre geometrique exact de la boite 23 x 23
balises          : path 1 / g 0 / transform 0
XML              : valide       U+FFFD : 0
```
Couleurs reprises de la référence : carré `#535353`, liseré et lettres `#b0b0b0` (énoncé FJD : « simplement en fill #535353 et Stroke + type #b0b0b0 »).

**Les PNG** — `illustrator/generer_png_icone.py` (aucun outil SVG natif sur ce poste : ni cairosvg, ni rsvg-convert, ni inkscape). Méthode : Chrome headless rend un maître **480 x 480 sur fond transparent** (`--default-background-color=00000000`), puis PIL réduit en **LANCZOS avec prémultiplication de l'alpha** (sans cela, LANCZOS moyenne la couleur des pixels transparents — noire — avec celle du liseré et produit un halo gris sombre).
```
fichier         taille     octets   encre (xmin,ymin,xmax,ymax)
md.png          23 x 23       947    (0, 0, 22, 22)
md@2x.png       46 x 46     2 072    (1, 1, 44, 44)
panneau.png     24 x 24     1 034    (0, 0, 23, 23)
panneau@2x.png  48 x 48     2 117    (2, 2, 45, 45)
fond du maitre  : transparent (alpha min = 0)
```
(La bbox « pleine » à 23 px vient du halo d'anti-aliasing du liseré, à ~1 px du bord : l'icône occupe bien sa boîte, sans déborder.)

**Manifest — ce qui change** (`manifest.json`, JSON valide, U+FFFD 0) :
```json
"icon": [ { "width": 23, "height": 23, "path": "icones/md.png",
            "scale": [1, 2], "theme": ["all"] } ]
...
"icons": [ { "width": 24, "height": 24, "path": "icones/panneau.png",
             "scale": [1, 2], "theme": ["all"] } ]
```
L'entrypoint `icon` est l'icône **du panneau** (« overrides the plugin icon in places where the entrypoint is specifically displayed », L198) ; l'array racine `icons` est l'icône **globale du plugin ou du panneau**. Les deux sont désormais renseignés, avec les PNG aux tailles prescrites, et `manifestVersion: 5` satisfait la seule contrainte de version du schéma.

**Ce qui reste à constater** : FJD doit faire **un rechargement UDT complet** (décharger le plugin puis le recharger, ou redémarrer InDesign — un changement d'icône de manifest est **mis en cache** par l'hôte). Diagnostic utile en cas de doute : la **liste de plugins d'UDT** elle-même — si le badge MD y apparaît, le manifest est bon et c'est bien la barre d'accroche d'InDesign qui garde l'ancienne icône en cache.

**Deux points signalés, non tranchés** (aucune restructuration faite de ma propre initiative) :
- **Collision en panneau comprimé** : `#zone_actions` (`bottom: 161px`) et `#zone_infos` (`bottom: 0`) sont toutes deux ancrées en bas et **se chevauchent sur la 3e ligne** quand le panneau est comprimé. Correctif proposé : passage à un **flux vertical flex**. À valider par FJD.
- **Hauteur préférée** : `preferredDockedSize` / `preferredFloatingSize` sont à **640**, quand la référence mesure **592**.




**Pourquoi elle vient avant la boucle** : la Mission 6 (liste N sources) **change le stockage** (l'étiquette passe à N empreintes — décision FJD du 30/09) et donc la **logique** : elle est plus lourde et plus risquée. L'habillage, lui, est **purement d'apparence** : il ne touche ni à l'étiquette, ni au moteur, ni à la signature du tube. On gagne une UI lisible **avant** de complexifier la logique — et la Mission 6 se fera alors dans un panneau **déjà habillé** (une seule fois le travail d'UI à refaire, pas deux).

**Le diagnostic FJD (30/09/2026)** : « les fonctionnalités sont actives, mais l'UI pas du tout ». Exact : le panneau fonctionne (4 missions ✅), mais son apparence est **brute** — faux boutons HTML, tableau HTML nu, tout en CSS maison. Ce n'est **pas** un défaut de goût : c'est que le panneau n'utilise **pas** le design system d'Adobe.

**La charte existe : c'est Spectrum.** Le DOM de scripting (notre moteur ExtendScript) n'a **pas** de design ; ce qui a une charte, c'est **l'UI** — donc le panneau UXP. Ressources, dans l'ordre d'utilité :
1. **Spectrum (la charte)** — [spectrum.adobe.com](https://spectrum.adobe.com/) : couleurs (tokens), typographie, espacements, rayons, icônes, états des composants.
2. **Règle d'or UXP : ne pas restyler, utiliser les widgets natifs** — les balises `sp-*` (`<sp-button>`, `<sp-textfield>`, `<sp-slider>`…) sont **fournies par le runtime** et prennent **automatiquement** l'apparence de l'application hôte, **thème sombre/clair compris**. Aucun design à refaire ([Create UI](https://developer.adobe.com/indesign/uxp/resources/fundamentals/create-ui/), [référence Spectrum UXP](https://developer.adobe.com/indesign/uxp/reference/uxp-api/reference-spectrum/)).
3. **Sous-ensemble CSS** — UXP ne comprend qu'une **partie** du CSS (pas de préprocesseur direct ; SASS à transpiler d'abord) : [CSS styling](https://developer.adobe.com/indesign/uxp/resources/recipes/css-styling/).
4. **Spectrum CSS** — la version feuille de styles des composants, en dernier recours ([github.com/adobe/spectrum-css](https://github.com/adobe/spectrum-css)).

**Trois routes UI en UXP — à ne pas confondre (piège mesuré dans la doc, pas supposé)** :

| Route | Look natif auto | Table ? | Coût |
|---|---|---|---|
| **HTML brut** (ce qu'on a aujourd'hui) | non | oui, mais **nu** | 0 — mais tout à styler |
| **Widgets Spectrum UXP** (`sp-*` intégrés) | **oui** | **non** | 0 (fourni par le runtime) |
| **SWC** (`@spectrum-web-components/…`) | **oui** | **oui** (`sp-table`, `sp-banner`, `sp-card`, `sp-toast`) | `npm i` + `import`, **beta** (UXP v7+) |

- **Ce que dit la doc** : « les balises HTML non supportées sont traitées **comme un simple `<div>`** » (→ notre `<table>` s'affiche, mais **sans charte**) ; Adobe recommande aujourd'hui **SWC d'abord**, **widgets natifs en repli**, **HTML en dernier**.
- ⇒ Le seul point qui **force** un choix, c'est le **tableau** : les widgets natifs n'en ont pas. Soit **SWC** (`sp-table`), soit **HTML + tokens Spectrum** — à trancher dans cette mission (voir Ouvert).

**Tranché par FJD (30/09/2026)** : **widgets natifs `sp-*` + tableau HTML tokenisé** — **pas de SWC**. Motif : **0 dépendance**, gain immédiat, pas de `npm i` ni de `manifest.json` à retoucher, pas de **beta**. Le tableau reste du **HTML**, mais habillé par les **tokens Spectrum** (couleurs, bordures, espacements) : il doit **se fondre** dans le panneau natif, pas jurer à côté. La question « SWC ou natif » est donc **close**.

**Référence DA (obligatoire)** : `doc/DA/Capture d'écran 2026-09-30 à 23.00.58.png`, spécifiée dans `doc/DA/Panneau lien INDD DESC.md`. C'est **l'appui visuel** de cette mission : **le patron à suivre**, pas une invention de l'agent. Toute décision d'agencement, de hiérarchie ou d'état visuel se **vérifie contre cette référence**, jamais contre un goût supposé. (`doc/DA/` est le lieu des références de design.)

**Ce que la référence est, exactement — et ce qu'elle n'est pas** : la capture décrit le **panneau « Liens » natif d'InDesign** (534×1186 px, thème sombre, fond `#535353`). C'est un panneau **de l'application**, pas un panneau UXP. Nous **ne pouvons pas** en faire un vrai panneau ancré natif. Ce que nous en **prenons**, c'est le **patron d'organisation et d'aspect** — ni plus, ni moins. Le dire clairement évite une attente impossible.

**Le patron à reprendre (les 4 zones, dans cet ordre)** — c'est la valeur de la référence :

```text
┌──────────────────────────────────────────┐
│ zone 1 — EN-TÊTE   (titre, contrôle)     │  léger, une ligne
├──────────────────────────────────────────┤
│ zone 2 — LISTE     (en-têtes + lignes)   │  prend toute la hauteur restante
├──────────────────────────────────────────┤
│ zone 3 — ACTIONS   (compteur + boutons)  │  barre fixe, sous la liste
├──────────────────────────────────────────┤
│ zone 4 — INFORMATIONS (fiche de la       │  zone basse, lisible
│          source sélectionnée)            │
└──────────────────────────────────────────┘
```

⇒ **La hiérarchie est le cœur de la référence** : *titre → liste → actions → informations*. Notre panneau actuel est **à plat** (titre, note, 4 boutons, tableau, journal empilés sans hiérarchie) : c'est **là** que l'écart se voit.

**Traduction de nos objets dans ce patron** :

| Zone de la référence | Chez nous aujourd'hui | Après |
|---|---|---|
| En-tête « Liens » | `h1` + `#statut` | **titre compact + bandeau d'état en tête** |
| En-têtes de colonnes + lignes | `table#liste` (HTML nu) | **tableau HTML tokenisé** (mêmes colonnes, habillage Spectrum) |
| Barre d'actions (icônes) | 4 `button` pleine largeur + `#btn_mesures` | **barre d'actions** : boutons `sp-*` **alignés**, chacun avec son **icône `sp-icon`**, plus le libellé d'état |
| Fiche d'informations | `pre#journal` (bloc brut, en bas) | **zone basse** = le journal (lisible, **pas** de troncature silencieuse) |

**Les icônes : `sp-icon` (correction FJD, 30/09/2026)** — les 4 actions **portent une icône**, en plus de leur libellé. Widget natif, **0 dépendance** (même route que les autres `sp-*`, **pas** de SWC) :
- **syntaxe** : `<sp-icon size="s" name="ui:Magnifier"></sp-icon>` (attribut `name`, préfixe `ui:` ; tailles T-shirt `xxs` → `xxl`, ici `s`) — [réf. `sp-icon`](https://adobedocs.github.io/uxp-photoshop/uxp-api/reference-spectrum/Spectrum%20UXP%20Widgets/User%20Interface/sp-icon/) ;
- **icône + mot, jamais l'icône seule** : l'icône **accompagne** le libellé (lisibilité d'un journal de preuve, accessibilité) ;
- **les icônes intégrées sont limitées** : la doc liste une **trentaine** de noms (`CheckmarkMedium`, `CrossSmall`, `Magnifier`, `Star`, `InfoMedium`…) — **aucun** ne correspond mot à mot à nos 4 actions (Lister / Actualiser / Importer / Copier le journal) ⇒ prendre le nom intégré **le plus proche**, puis **le vérifier en réel dans le runtime InDesign** — **ne pas supposer** qu'un nom existe. Si aucun ne convient, charger un **SVG** dans le `sp-icon` — **à vérifier** en réel, pas à décider de tête.

**Ce que nous N'imitons PAS** (et pourquoi) — honnêteté, pour ne pas produire un faux :
- **pas** les **miniatures** : nos sources sont des fichiers `.md`, pas des images ;
- **pas** l'**arborescence à occurrences** (chevron dépliable, niveaux enfants, compteurs orange) : nous n'avons **pas** d'occurrences (avec N sources, une ligne = une source) ;
- **pas** le **nombre** d'icônes de la référence (**5** chez elle, **4** chez nous) : nous adoptons **bien** `sp-icon` (voir « Les icônes » ci-dessus), mais pour **nos 4 actions**, et toujours **icône + libellé**, jamais l'icône seule ;
- **pas** les **coordonnées absolues** de la capture (534 px n'est **pas** une propriété du composant, c'est la **taille de la capture** — cf. §5/§28 de la DESC).

**Les tokens, pas les couleurs** — exigence issue directement de la référence (§4/§5/§27 de la DESC) : la référence donne des **relations de couleur**, pas des RGB absolus. ⇒ le CSS doit exposer des **variables** (`--panel-bg`, `--panel-border`, `--panel-text`, `--panel-text-secondary`, `--panel-selection`, `--panel-warning`) et **jamais** de valeur en dur. Le thème clair/sombre vient de **l'hôte**. Séparation à tenir : **tokens système** (fournis par l'hôte) vs **tokens composant** (`--row-height`, `--indent`, `--space-*`) vs **tokens de référence** (taille de capture — **à ne pas** recopier dans le layout).

**Les états** (§6/§7 de la DESC) : la référence montre `selected` et `expanded`. Chez nous, l'état utile est **celui de la source** — `identique` / `modifiée` / `source absente` — rendu par le **moteur** (jamais recalculé). Ces états doivent être **visuellement distincts** (couleur **et** mot, pas la couleur seule : lisibilité). La **colonne d'état** de notre tableau joue le rôle de la **colonne d'avertissement** de la référence.

**Contraintes négatives** (§14 de la DESC — « ce qui est interdit ») : ne pas **étirer** une miniature (N/A), ne pas **replier** un nom sur 2 lignes, ne pas **écraser** le compteur, ne pas **étendre la sélection** à toute la largeur du panneau.

**À faire** :
- remplacer les contrôles bruts par des composants Spectrum, dans cet ordre de priorité : les 4 boutons (`#btn_liste`, `#btn_actualiser`, `#btn_import`, `#btn_copier`), le champ `#chemin`, le bandeau `#statut`, puis le tableau `#liste` ;
- **ajouter une icône `sp-icon` à chacune des 4 actions** (`#btn_liste`, `#btn_actualiser`, `#btn_import`, `#btn_copier`), **sans retirer** le libellé (**icône + mot**) ;
- **supprimer** les couleurs en dur du CSS (`#2b2b2b`, `#3a3a3a`, `#1f6f2f`…) : le thème clair/sombre est **fourni par l'hôte** ;
- **introduire les 4 zones** du patron (en-tête / liste / actions / informations) — c'est **le** changement structurant, plus que le remplacement des balises ;
- remplacer les valeurs CSS en dur par des **tokens** (variables) ;
- ne garder le CSS maison que pour l'**agencement** (marges, alignements, largeurs) ;
- **ne rien changer à la logique** (états, moteur, tube gelé) : cette mission est **d'apparence**.

**Ce qui est neuf, et donc risqué (à mesurer, pas à supposer)** : `cabler()` et les accès DOM de `main.js` sont écrits pour du **HTML brut** (`getElementById(…).value`, `.textContent`, `addEventListener("click")`). Un widget Spectrum expose des **propriétés et des événements** différents (ex. `<sp-textfield>` : `.value` existe, mais `sp-button` émet `click` par défaut — **à vérifier en réel**). ⇒ **Passer aux widgets touche la logique de câblage**, pas seulement le style. C'est **le vrai travail** de la mission, pas le remplacement des balises.

**Critère de fin** (double, comme les autres missions du chapitre) :
1. **Preuve visuelle** : capture du panneau **mise côte à côte avec la référence DA** — l'écart doit être **comblé** (charte respectée, hiérarchie lisible), et non « jugée jolie » ;
2. **Preuve fonctionnelle** : les 4 boutons **font toujours la même chose** qu'avant (journal brut : liste, actualisation, import, enregistrement du journal), **aucune** régression.

**Cas limites à ne pas perdre** :
- la section **repliée** « Mesures techniques » doit **encore s'ouvrir** (elle est pilotée par `style.display`, certifié ici — un widget n'existe pas pour ça, on garde le mécanisme) ;
- le **journal** (`<pre>#journal`) doit **rester lisible et sélectionnable** (c'est la preuve du panneau) ; un composant Spectrum ne doit pas casser le `white-space: pre-wrap` ni le défilement ;
- **1 rechargement UDT par essai** (toute édition du panneau l'exige) : regrouper les changements pour **ne pas** multiplier les clics de FJD.

**Ce que cette mission ne fait pas** : elle ne touche **pas** au moteur `import_md.jsx`, **pas** à la signature du tube (gelée), **pas** au nombre de sources (Mission 6).

---

## Chapitre Panneau — Mission 6 — La boucle : tous les imports du document courant

**Statut** : 🟡 PARTIELLE — **tir 1 (01/10/2026)** : le panneau appelle le **MOTEUR RÉEL** (`import_md.jsx`) via le **tube gelé**, à **N = 1** ; prouvé par batterie (`verifier_moteur.js`, **75/75** — 48 au tir 1, **+3** par l'arbitrage FJD du 01/10 sur le bandeau d'état, **+24 au tir 2** du 01/10 sur le repli du calibrage, cf. §6 bis et §6 quater) — le **critère 2** (« vierge ⇒ 0 ligne », contrôle négatif obligatoire) est **ATTEINT**, le **critère 1** (« N imports ⇒ N lignes ») reste **OUVERT** : il exige l'**étiquette-LISTE** (N sources), évolution de stockage **tranchée le 30/09 mais NON faite**. **Arbitrage FJD du 01/10 appliqué** (`#statut` = **triangle danger UNIQUEMENT si source modifiée, rien du tout sinon** ; `#journal` = canal de **debug**, désormais réellement alimenté ; objections « chemin » et « `btn_import` » **retirées car infondées**) ; **restent ouverts : la page** (voir §6 quater : FJD la veut = le **point d'insertion du texte**, donnée **absente du moteur**), la **signalétique texte-en-excès / page de sortie** (capacité **NEUVE**, idem) et la **provenance / `info_modele`** (capacité **NEUVE** — le moteur ne détecte RIEN —, **à spécifier par l'Architecte**, cf. §6 bis et §6 quater). **Tir 2 (01/10)** : **cercle rouge d'alerte RESTAURÉ** sur la ligne importée (chemin d'import brisé ⇒ à réimporter) et **repli du calibrage CORRIGÉ** (l'état des chevrons est désormais posé **EN LIGNE**, plus par sélecteur composé — cf. §6 quater). Validation visuelle FJD (1 rechargement UDT) à faire. **Décidée APRÈS la Mission 5** (ordre FJD du 30/09/2026 : l'UI d'abord). **Débloquée** : FJD a **confirmé le 30/09/2026** que l'étiquette passe de **1** à **N** sources par document (le gel du 30/09 est levé **pour cette évolution précise, et pour elle seule**).

**Le périmètre, tranché par FJD (30/09/2026)** : la liste porte sur **tous les imports du document courant** — ni « tous les documents ouverts », ni un registre sur disque. **Plus simple et plus juste** que la proposition antérieure. (La « Question 2 » du chapitre — actif vs tous les docs — est donc **close** : c'est **le document courant**, et ses imports.)

**Décision tranchée (FJD, 30/09/2026)** : l'étiquette passe d'**une** empreinte à une **liste** d'empreintes (`[{path,name,size,checksum,modified,v}, …]`) ⇒ **N sources par document**. Le gel du 30/09 (« une source par document, l'étiquette n'évolue pas vers N ») est **levé pour cette évolution précise, et pour elle seule**.
- Rappel du blocage qui avait motivé la question : `insertLabel` **écrase** son homonyme, donc l'ancienne étiquette ne pouvait porter que **1** source, **par construction**. C'est ce que la liste d'empreintes corrige.
- Conséquence : la Mission 6 **existe** (il y a bien une boucle à écrire) et **n'est plus bloquée**.
- **Ordre maintenu** : Mission 5 (UI) **d'abord**, Mission 6 **ensuite**.

**Pourquoi « la boucle »** : c'est la **même** fonction (`construireListe`) avec **une boucle** au lieu du seul `app.activeDocument`. Le tableau (Mission 2), l'actualisation (Mission 3) et le bouton Importer (Mission 4) **ne changent pas** : seul le **nombre de lignes** change.

**À faire** :
- lire l'**étiquette-liste** du document courant (nouveau format, si N confirmé) ;
- **boucler** sur les N sources ⇒ N lignes, chacune avec son état (moteur) et ses compteurs (lecture disque) ;
- **conserver** les 4 cas séparés (aucun document / lecture ratée / étiquette absente / sources à lister) — un document **vierge** rend **0 ligne** (contrôle négatif **obligatoire**, inchangé) ;
- **ne pas** inventer de ligne, **ne pas** réutiliser un chiffre pour une autre ligne.

**Signature du tube : INCHANGÉE.** Le gel du 30/09 vaut toujours (le tube ne transporte **pas** le mapping, **pas** l'empreinte ; champs **nommés**). Si une ligne doit devenir **agissante** (importer SA source), c'est le champ **Chemin** — déjà au tube — qui porte la source ; rien de neuf à geler.

**Critère de fin** (double) :
1. document portant **N imports** ⇒ **N lignes** distinctes, chaque état rendu par le **moteur** ;
2. document **vierge** ⇒ **0 ligne** et la note dit « 0 source » (contrôle négatif **obligatoire**).

**Cas limites** :
- **une seule** des N sources a disparu du disque ⇒ **sa** ligne passe à `source absente`, les **autres** restent `identique` ;
- **N = 1** ⇒ le comportement doit être **rigoureusement identique** à la Mission 2 (non-régression du mono-source) ;
- **N = 0** ⇒ 0 ligne (jamais une ligne vide).

**Ce que cette mission ne fait pas** : elle ne touche **pas** à l'habillage (Mission 5, faite avant), **pas** au moteur `import_md.jsx` au-delà du **nouveau format d'étiquette** à lire, **pas** à la décision de mapping.

### CR — tir 1 : le panneau appelle le MOTEUR RÉEL (tube gelé, N = 1) + inventaire des orphelins (01/10/2026)

**Instruction FJD** : « Maintenant, procédons au câblage. On câble ce qui est déjà implémenté et puis on regarde les composants orphelins. » Arbitrage FJD de l'alternative posée : **option B — câbler le panneau sur le moteur réel (tube gelé)**, classée ici.

#### 1. Ce qui est fait

`uxp/com.fjd.importmd.panneau/main.js` passe de **208 à 1057 lignes**. Le moteur de la sonde (`com.fjd.importmd.sonde`, **lue seule, non modifiée**) est **porté** dans le panneau, et la maquette du tir 3 est **inchangée** (elle reste l'état d'ouverture : la validation au pixel de la Mission 5 tient).

Porté depuis la sonde :
- **dossier projet déduit** (`getPluginFolder()` remonte 2 niveaux, refuse si `< 1` ou sans `/`), mémoïsé et **attendu** (`assurerDossierProjet()`) ;
- **journal** double : écran (`#journal`) + fichier `panneau_liens_md_journal.txt`, écriture **débattue 400 ms** ;
- **étiquettes** : `md-source-fingerprint` (6 champs : `v, size, checksum, modified, name, path`) et `md-style-map`, lues par **2 routes** (`doc.extractLabel()` puis repli `app.doScript`) ;
- **état rendu par le moteur** via `etatParLeMoteur()` : parade du **dispatcher** — copie temporaire `_panneau_moteur_sans_main.jsx` (le `main();` racine de `import_md.jsx` est retiré), `$.evalFile(tmp)`, `tmp.remove()`. **Sans cette parade, un simple `$.evalFile` déclenche un import complet** (incident 29/09) ;
- **compteurs disque** : `getEntryWithUrl` + `read()` pour mots/signes, `getMetadata().dateModified` pour la date ;
- **tube gelé** (3 champs **nommés** — cf. « Signature du tube », inchangée) : `"Appelant=panneau"`, `"Action=importer"`, `"Chemin=" + cheminMd`, transportés par `app.doScript`, et le moteur rappelé par `$.evalFile(new File(<cheminJsx>))`.

Boutons réellement câblés : `btn_expand` → `basculerCalibrage()` (dépliage, inchangé) ; `btn_actualiser` → `actualiserListe()` ; `btn_import` → `importerDepuisPanneau()`. Les autres écrivent au journal `(non câblé : orphelin)` **sans rien inventer**.

État au démarrage : `dire("Panneau pret. Moteur reel cable sur Actualiser et Importer.")`, puis la déduction du dossier est **attendue**, puis le journal est écrit sur disque (600 ms).

#### 2. Preuve automatique — la batterie versée au dépôt

Preuve **reproductible par un clone, sans InDesign** : `uxp/com.fjd.importmd.panneau/verifier_moteur.js` (fichier **additif**, supprimable ; `node verifier_moteur.js`).

```
SYNTAXE OK
TOUT PASSE  (48 verifications)
```

Elle charge `main.js` dans un contexte `vm` avec des stubs de DOM / `require` (« indesign », « uxp », « fs ») / `setTimeout`, puis **exerce** la logique. Couvert : décodage de l'étiquette à 6 champs, échappement ExtendScript, table d'états, formatage date/octets, **les 5 cas** (aucun document / lecture ratée / étiquette absente / étiquette présente illisible / sources à lister), compteurs disque, `#nb_selection`, et le **tube gelé** (les 3 champs + l'`$.evalFile` du moteur), plus le **refus** du moteur.

Contrôle négatif obligatoire, **acquis** : document vierge ⇒ **0 ligne**. Fichier ASCII, **0 U+FFFD**.

#### 3. Deux défauts RÉELS trouvés par la batterie (et corrigés)

1. `formaterOctets(null)` rendait `"0 ko (0 octets)"` — parce que `Number(null) === 0`. C'était **un chiffre inventé**, contraire à la règle du projet. Corrigé par une garde explicite `null / undefined / ""` ⇒ tiret.
2. `sourceSelectionnee()` reposait sur le sélecteur composé `.ligne.selection`, **non certifié** dans ce runtime, et pouvait s'exécuter **avant** que le dossier projet soit déduit (`void devinerDossierProjet()` était lancé sans attente). Corrigé par un balayage de `lignesListe()` + `className`, et par `assurerDossierProjet()` attendu en tête de `construireListe()` et de `importerDepuisPanneau()`.

#### 4. Inventaire des composants ORPHELINS (le second point de l'instruction FJD)

| Composant | Raison de l'orphelinat |
|---|---|
| `btn_relier`, `btn_editer` | **aucun moteur** derrière dans `import_md.jsx` ; ils écrivent au journal au lieu d'agir |
| `btn_page` + colonne Page / `data-page` | **aucune source** : l'étiquette ne porte pas de page ; la colonne affiche `"-"` |
| `info_modele` | **aucune source** (le modèle n'est pas dans l'étiquette) ; affiche `"-"` |
| `nb_selection` (compteur) | la maquette annonçait **« 2 liens »** — faux ; le panneau dit **« 1 lien selectionne »** (mono-source) |
| `compterLignesListe()` | déclarée, **non utilisée** — conservée pour la boucle N de cette mission |
| 3 lignes de la maquette | la maquette en **dessine 3** ; le moteur n'en rend **qu'une** (mono-source). Le panneau **révèle/cache** les 3 lignes modèles au lieu de fabriquer des noeuds SVG (API non certifiée) |

#### 5. Ce que ce tir ne fait PAS — et c'est le coeur de la Mission 6

Le critère de fin est **double**. État honnête :

1. « document portant **N imports** ⇒ **N lignes** » ⇒ **NON ATTEINT** : le tir est à **N = 1**. `md-source-fingerprint` est **MONO-SOURCE par construction** (`insertLabel` écrase son homonyme) ; il faut que l'étiquette passe à une **liste** d'empreintes — c'est **l'évolution de stockage tranchée par FJD le 30/09**, **non faite**.
2. « document **vierge** ⇒ **0 ligne** » ⇒ **ATTEINT ET PROUVÉ** (batterie, cas « aucun document »).

**NOTE DE CLASSEMENT (à trancher par Claude/FJD, pas par l'ouvrier)** : ce tir **ferme le point ouvert n° 4 de la Mission 5** (« `main.js` du nouveau panneau câble des données de démonstration, il n'appelle **pas** le moteur `import_md.jsx` »). Il est donc à la charnière M5/M6 : c'est du **câblage mono-source**. La Mission 6 (la boucle N sources, l'étiquette-liste) **reste à faire**. Le classement retenu ici suit l'arbitrage FJD ; le contenu du CR est transférable si Claude préfère le rattacher à la Mission 5.

#### 6 bis. ARBITRAGE FJD (01/10/2026) — décisions, et ce qui a été appliqué

FJD a tranché les 4 points d'interface du §6. **Trois des quatre objections de l'ouvrier étaient infondées** et sont **retirées** ; une seule résiste.

**1. `#statut` — DÉCISION : « modifié ⇒ triangle danger, sinon rien du tout ».**
- *Appliqué* : le bandeau n'est **plus** un bandeau succès/échec. Il est **MUET** par défaut ; il ne s'**allume** que dans **un seul** cas — **source modifiée** — et montre alors le **triangle de danger** (trace ambré `#fcb910` du dessin, `path 3`, **repris tel quel** : aucune géométrie inventée). Tous les autres cas (`identique`, `absente`, `indéterminé`, document vierge) n'affichent **rien**.
- L'allumage se fait par `style.display` posé en JS (**jamais un sélecteur composé** : non certifié UXP).
- Le **detail** ne disparaît pas : `afficherStatut()` **trace désormais au journal** (`[ok]` / `[echec]`) au lieu d'écrire à l'écran.
- Conséquence de bord, **décidée par l'ouvrier et signalée ici** : le bandeau est un indicateur d'**ÉTAT**, pas d'**ACTION** ⇒ il se tait pendant « Importer » ; il se rallume sur « **Actualiser** » si la source a encore bougé.

**2. `#journal` — DÉCISION : « utile pour le debug, pour le reste, pas besoin ».**
- *Appliqué* : `#journal` reste **masqué** à l'écran (L449) — c'est le canal de **debug**. Le fichier `panneau_liens_md_journal.txt` reste la preuve récupérable.
- **Défaut réel corrigé au passage** : `journaliser()` n'alimentait **que** le DOM — or `dire()` **réécrit** `#journal` depuis son propre index, donc toute ligne posée par `journaliser()` était **effacée** au `dire()` suivant ; et surtout ces lignes **n'atteignaient jamais le fichier** de journal. `journaliser()` alimente maintenant le journal **complet** (celui qui part dans le fichier).

**3. `info_modele` / provenance — FJD propose : « on détecte la structure particulière de chaque MD au mapping, donc à ce moment on en voit la provenance, non ? ».**
- **FAIT VÉRIFIÉ** : le moteur **ne détecte RIEN** de tel. `grep -nE 'gemini|deepseek|chatgpt|claude|provenance|modele|generateur' import_md.jsx` ne renvoie que **3 commentaires** sur la provenance du **titre** (`#`), **aucun code de détection**. Il n'y a donc **aucune provenance à lire** : ce serait une **capacité NOUVELLE à construire**.
- **FAIT VÉRIFIÉ (utile à FJD)** : le projet classe déjà ses fixtures **par générateur** (`claude_sample.md`, `deepseek_formation.md`, `deepseek_referentiel.md`, `gemini_charte.md`, `chatgpt_convention.md`) — mais c'est un classement **humain**, pas une signature calculée.
- **ESCALADE — l'ouvrier ne tranche pas** : où la signature se calcule-t-elle (moteur `import_md.jsx` au mapping ? panneau à la lecture ?), et **où se stocke-t-elle** (7ᵉ champ de `md-source-fingerprint` ? nouvelle étiquette ? recalcul à la volée ?). Aucune heuristique n'a été inventée. **À spécifier par Claude/FJD.**

**4. Chemin et `btn_import` — OBJECTIONS RETIRÉES (FJD a raison).**
- **Chemin** : le panneau **affiche bien** le chemin — `#info_chemin` (index.html **L614**), alimenté en `main.js` (L150). L'objection était **infondée** : il n'existe simplement **pas de champ de saisie** de chemin, et c'est un choix de maquette, pas une lacune.
- **`btn_import`** : il **importe le `.md` de la ligne sélectionnée** (tube gelé, champ `Chemin`). C'est ce qu'il fait déjà ; l'objection était **infondée**.

**5. Colonne Page / `btn_page` — SEUL POINT RÉELLEMENT OUVERT** (FJD : « à part la page peut-être, c'est vrai »). La page n'a **aucune source** dans le moteur (l'étiquette ne la porte pas) ⇒ `"-"` maintenu, **jamais un numéro inventé**.

#### 6 ter. Re-vérification après arbitrage (01/10/2026)

- `node --check main.js` ⇒ **SYNTAXE OK**.
- `node verifier_moteur.js` ⇒ **TOUT PASSE (51 vérifications)** — 48 avant, **+3** pour l'arbitrage : statut **allumé** (`flex | la source A BOUGE depuis l'import`) sur source modifiée ; statut **muet** (`none | `) sur `identique` / `absente` / `indéterminé` / vierge ; **l'échec et l'incertitude sont bien tracés au journal** (le bandeau se tait, le journal parle).
- Encodage : `grep -c $'\xef\xbf\xbd'` = **0** sur `main.js`, `index.html`, `verifier_moteur.js` et la présente ROADMAP (ligne de Statut incluse). `verifier_moteur.js` reste **100 % ASCII** (0 non-ASCII). Restent dans `main.js` les **3 non-ASCII préexistants** (`…`, `é`, `—`).

#### 7. Encodage

Normalisation ASCII appliquée à `main.js` (`-` pour le tiret cadratin, guillemets supprimés). Restent **2 non-ASCII préexistants** : `…` (L36, données de la maquette) et `é` (L65, `modifiee: "modifiee"` — libellé affiché). À confirmer avec FJD au regard de la convention « aucun accent » du tir 3.
`grep -c $'\xef\xbf\xbd'` : **0** sur `main.js`, `index.html`, `verifier_moteur.js` et la présente ROADMAP (ligne de Statut incluse).

#### 8. Reste à faire pour clore

**1 rechargement UDT** puis validation visuelle FJD : document portant un import MD ⇒ « Actualiser » ⇒ comparer à l'écran et au journal ; **document vierge ⇒ 0 ligne**.

---

### CR — tir 2 : cercle rouge restauré, repli du calibrage corrigé, et les 2 capacités neuves demandées par FJD (01/10/2026)

**Contexte** : après le tir 1 (§6 bis / §6 ter), FJD signale **2 défauts réels** et demande **2 évolutions**. Le présent tir traite les défauts ; les évolutions sont **escaladées** (jamais inventées).

#### 1. Défaut RÉEL trouvé et corrigé — le cercle rouge d'alerte avait disparu

**Ce que FJD voit** : « le cercle rouge autour de l'icône d'alerte dans la ligne de doc importé a disparu, il indique un chemin d'import brisé à réimporter ».

**Diagnostic (lecture du dessin de référence, pas une supposition)** : la référence `illustrator/panneau_liens_md.svg` porte, au **rang 2** de la colonne État, **deux** traces superposés : `<circle class="cls-33" cx="292.84" cy="91.93" r="7.11"/>` — **le disque PLEIN `#d50f2b`** — **et** le point d'exclamation blanc (`cls-9`, `#ffffff`). La transposition HTML n'avait **repris que le point blanc** : un « ! » blanc flottant, sans son cercle. **La perte était réelle.**

**Correction** : rétablissement du **bloc complet aux cotes de la référence** dans `index.html` — `viewBox="285.73 84.82 14.22 14.22"` (union : le cercle couvre `x 285.73→299.95`, `y 84.82→99.04`, soit **14.22 de diamètre** ; le point est centré sur `292.7 / 91.88`), avec `<circle cx="292.84" cy="91.93" r="7.11" fill="#d50f2b"/>` **puis** le tracé blanc. Un commentaire dans le fichier **grave la provenance** des deux cotes.

**Preuve (navigateur réel, `page.evaluate`)** : `document.querySelectorAll("#liste_corps circle").length` = **1**, `fill` = **`#d50f2b`**. Le cercle est **présent et rouge**.

#### 2. Défaut RÉEL — le repli « Calibrage » restait bloqué (et ne refermait pas tout)

**Ce que FJD voit** : « encore des problèmes avec le *collapse* des informations : il ne ferme nullement l'ensemble des informations en l'état, et rouvre le calibrage une fois fermé, et *rouge-vert* une première fois, il reste bloqué sur ce comportement ensuite ».

**Diagnostic** :
- **Cause la plus probable — sélecteurs composés NON CERTIFIÉS.** Le repli reposait **entièrement** sur des sélecteurs composés : `#btn_expand.deplie .act-ferme`, `#btn_expand.deplie .act-ouvert`, `#ligne_calibrage.deplie .cal-ferme`, `#ligne_calibrage.deplie .cal-ouvert`. Le projet a **déjà payé ce défaut une fois** : `.ligne.selection` avait dû être remplacé par une inspection de `className` (cf. §6 ter et le `sourceSelectionnee()` du tir 1) parce que **ce type de sélecteur n'est pas certifié dans le runtime UXP**. Le symptôme FJD — « ça marche une fois, puis ça reste bloqué » — est **exactement** la signature d'un sélecteur composé évalué une fois puis plus rafraîchi.
- **Ce n'est PAS un bug du cycle logique** : reproduit en **Chromium** par 4 clics programmatiques, le cycle ouverture/fermeture/ouverture/fermeture est **parfait** (`etat0 → flex → none → flex → none`). Chromium, lui, **certifie** les sélecteurs composés ⇒ **le défaut est bien côté UXP**, pas dans la logique.
- **Second point (le « ne ferme pas tout »)** : le bloc `#calibrage` ne fait que **26 px** (2 lignes : mots, signes) et vit dans `#zone_infos` (hauteur figée **163 px**, contenu déplié **192 px** ⇒ **défilement**). Rien n'était hors de cause ; en revanche le **défilement n'était pas remis à zéro** à la fermeture, si bien qu'après un dépliage on **continuait de voir** les deux lignes mots/signes ⇒ **perception de « ça ne referme pas »**, à juste titre.

**Correction (pattern CERTIFIÉ : état posé EN LIGNE par JS, pas par sélecteur composé)** :
- **4 identifiants posés** dans `index.html` sur les 4 traces (2 chevrons de la barre d'actions, 2 chevrons de la ligne « Calibrage ») : `btn_expand_ferme`, `btn_expand_ouvert`, `icone_calibrage`, `icone_calibrage_ouvert`. **Zéro `sp-*`.**
- **Nouvelle fonction `afficherTrace(id, visible)`** dans `main.js` : `style.display = "none"` pour masquer, **`""` pour RENDRE LA MAIN au défaut de l'élément** (donc à la référence, **au pixel**) — pas de valeur inventée quand l'élément doit être visible.
- **`basculerCalibrage()`** pilote désormais explicitement **`#calibrage`** (inline `flex`/`none`), **les 4 traces** (inline) **et** remet **`#zone_infos.scrollTop = 0`** à la fermeture. Les classes `deplie` **restent posées** (compatibilité CSS, aucun effet de bord).
- **Batterie enrichie** : le stub DOM reçoit un `classList` réel (il n'en avait **pas** — la batterie n'appelait donc jamais `basculerCalibrage`) et `zone_infos` entre dans les identifiants contrôlés. **+24 vérifications** couvrant **le cycle complet** (fermé → déplié → replié → ré-ouvert → re-replié) : état des 4 traces, classes posées/retirées, **remise à zéro du défilement**, traces au journal. Le verrou `✅` de la régression signalée par FJD (« re-ouvert **DE NOUVEAU — pas de blocage** ») est **explicite dans la batterie**.

**Preuve — `node verifier_moteur.js` ⇒ `TOUT PASSE (75 vérifications)`** (48 au tir 1, +3 arbitrage, **+24 tir 2**). `node --check main.js` ⇒ **SYNTAXE OK**.
**Preuve — navigateur réel** (4 clics sur `#btn_expand` via `page.evaluate`) : `calibrage` = `(défaut) → flex → none → flex → none`, `barreFerme` = `(défaut) → none → (défaut) → none → (défaut)`, `barreOuvert` = l'inverse exact. **Le cycle est stable, plus de blocage.**

#### 3. ÉVOLUTION DEMANDÉE (1) — la page = le POINT D'INSERTION du texte

**Demande FJD** : « la page indique le **point d'insertion du texte**, là où il démarre ».

**FAIT VÉRIFIÉ** : dans l'étiquette `md-source-fingerprint`, il y a **exactement 6 champs** — `v, size, checksum, modified, name, path`. **Aucun champ `page`.** Et `import_md.jsx` **n'écrit ni ne lit aucune page** (`grep -E "pageNumber|parentPage"` sur le moteur : voir ci-dessous).

**Ce que le moteur PEUT atteindre, en revanche (vérifié)** : il travaille déjà avec le **modèle objet réel** — `resolveTargetStory()` distingue `TextFrame` / `InsertionPoint` / `Story`; la branche curseur (`InsertionPoint`) connaît le **point d'insertion exact**. Techniquement, une page se lirait là : `insertionPoint.parentTextFrames[0].parentPage.name`. **Mais c'est une capacité NEUVE, non présente ; l'ouvrier ne l'invente pas.**

**ESCALADE (l'ouvrier ne tranche pas)** : faut-il **ajouter la page à l'étiquette** (7ᵉ champ) **ou** la recalculer à la lecture ? La page est-elle celle du **point d'insertion au moment de l'import** (donnée figée, historique) ou celle du **point courant** (donnée vivante) ? **À spécifier par Claude/FJD.**

#### 4. ÉVOLUTION DEMANDÉE (2) — signalétique « texte en excès » + « page de sortie »

**Demande FJD** : un **chevron d'expansion** ouvrant sur **L1 : début de texte + n° de page** ; **L2 : sortie de texte + alerte texte-en-excès (icône identique à celle de bloc en excès) si excès + n° de page de sortie**.

**FAIT VÉRIFIÉ** : **aucune** de ces données n'existe aujourd'hui. `grep -E "overset|overflows|Overflow"` sur `import_md.jsx` ⇒ **0 occurrence**. Le moteur ne teste **jamais** le débordement.

**Ce que le moteur PEUT atteindre (vérifié)** : le modèle objet expose bien `TextFrame.overflows` (booléen) et la page du dernier cadre (`story.textContainers` / `parentPage`). Donc c'est **faisable** — mais c'est une **capacité NOUVELLE à construire côté moteur**, pas du câblage.

**Note de cohérence visuelle** : l'icône « texte en excès **sur bloc** » est **celle qui vient d'être restaurée** — **disque plein `#d50f2b` + point d'exclamation blanc** (`cls-33` + `cls-9`, `cx 292.84 cy 91.93 r 7.11`). La signalétique demandée la **reprend**, ce qui **confirme** la lecture du §1 : le cercle rouge est **l'icône d'alerte du projet**, pas un ornement.

**ESCALADE (l'ouvrier ne tranche pas)** : la donnée est **du ressort du moteur** (c'est lui qui touche la story). Où la lit-on (`story.textContainers[dernier].overflows` ?), où la stocke-t-on (étiquette ? à la volée ?), et **le chevron va-t-il par ligne de liste ou dans la fiche** ? **À spécifier par Claude/FJD.**

#### 5. Ce que ce tir NE fait PAS

- Il **ne touche pas** au moteur `import_md.jsx` (aucune ligne) — les points 3 et 4 **exigeront** son évolution, **à arbitrer d'abord**.
- Il **ne crée aucune donnée** : pas de page inventée, pas d'excès inventé. Là où la donnée manque, l'interface **ne ment pas** (elle reste à `"-"`).
- Il **ne commite pas** : le commit reste à FJD/Claude.

#### 6. État de la batterie après ce tir

- `node --check main.js` ⇒ **SYNTAXE OK**.
- `node verifier_moteur.js` ⇒ **TOUT PASSE (75 vérifications)**.
- `grep -c $'\xef\xbf\xbd'` ⇒ **0** sur `main.js`, `index.html`, `verifier_moteur.js` et la présente ROADMAP (**ligne de Statut incluse**). `verifier_moteur.js` reste **100 % ASCII**.

---

## Chapitre Panneau — Règles de clôture (communes aux 6 missions)

- **CR inline** : le compte rendu se met **dans le bloc de sa mission**, après `**Statut**` (preuve inline : log brut, sortie réelle) — **jamais** dans un fichier `cr_mXXX_*.md` séparé. *(Principe CR-inline dans la RM, universel — décision FJD du 14/09/2026.)*
- **Statut** : signalétique stricte, un seul format — `**Statut** : <marqueur> — <preuve en une phrase>`, avec exactement un de ✅ TERMINÉE / 🔴 À FAIRE / 🟡 PARTIELLE / 🔴 ABANDONNÉE. Mise à jour **dans le même tour** que le CR.
- **Encodage** : avant de rendre un CR, `grep -c $'\xef\xbf\xbd' COMMUNICATION/ROADMAP.md` doit renvoyer **0** — **ligne de Statut incluse** (le marqueur 🟡 est le coupable historique connu).
- **Preuve de dock** : la preuve d'ancrage à côté de « Liens » (`preferredDockedSize` 320×520) exige un **contrôle négatif** associé.
- **Wiki** : le wiki `doc/wiki_extendscript_indesign.md` est nourri **après le succès**, jamais avant (cible réservée, non éditée).
- **Périmètre** : ne pas ouvrir ici le chantier « analyseur Markdown standard » ni la modification de `parseMarkdown` (lecture de nos commentaires) — **acquis mais différé** (cf. [note d'architecture](../doc/architecture/NOTE_analyseur_markdown_standard.md), §5.3).

---

## Références du projet

- **Wiki technique** : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — base de connaissance des pièges ExtendScript/InDesign (**47 cas au 30/09**, table des matières par thème en tête de fichier), méthode de travail validée (simulation Node avant test réel, contrôle négatif obligatoire, vérification doc officielle avant hypothèse, arbitre indépendant devant reproduire la *même* transformation que le code, carte en plages pour révéler une distribution de styles)
- **Patron d'organisation du wiki** : [../doc/architecture/PATRON_wiki_recursif.md](../doc/architecture/PATRON_wiki_recursif.md) (analyse complète FJD+DS, 28/09) et [../doc/METHODE_wiki_recursif.md](../doc/METHODE_wiki_recursif.md) (socle projet-indépendant) — boucle consulter/documenter, gabarit à champs balisés, numérotation immuable, échelle à 6 horizons chiffrés. Missions 03bis (sources) et 03ter (gabarit+sommaire) en découlent.
- **Fixtures de test** : [../fixtures/](../fixtures/) — fichiers `.md` classés par modèle générateur (Claude, DeepSeek ×2, Gemini, ChatGPT) + JSON attendus
- **Script principal** : [../import_md.jsx](../import_md.jsx) — copié systématiquement vers `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx` après chaque modification (InDesign exécute cette seconde copie, jamais le fichier de travail directement)
- **Rôles** : Architecte (Claude) rédige les missions et valide, Ouvrier (DS) exécute — cf. mémoire `project_agent_roles.md`

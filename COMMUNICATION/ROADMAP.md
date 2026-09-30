# ROADMAP — Projet IMPORT_MD (plugin InDesign)

Registre actif des missions du projet. Chaque mission a son propre fichier détaillé dans ce dossier (`mission_NN_<nom>.md`) — ce ROADMAP reste un sommaire, pas une duplication du contenu.

Convention : toute nouvelle mission est rédigée ici (entrée + fichier détaillé), jamais laissée en fichier isolé hors de ce registre.

**Archivage** : une mission close **sort** de ce registre et son bloc est conservé **intégralement** dans le journal du mois — [`RMA/2026-09.md`](RMA/2026-09.md) (décision FJD du 29/09/2026 : « tu clôtures, tu archives »). L'archive **recopie** le bloc, elle **ne le résume pas**. Ce registre ne garde donc que ce qui reste ouvert.

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

**Statut** : 🔴 À FAIRE — rédigée le 29/09/2026.

**Fichier détaillé** : [mission_07_publication_repo_public.md](mission_07_publication_repo_public.md)

**Résumé** : FJD candidate à des formations et veut ce repo comme preuve de travail public (historique de commits datés). Vérifié le 29/09 : **0 clé API**, mais **7 fichiers** (`tools/*.jsx`, `uxp/.../main.js`) contiennent le chemin absolu `~/...` en dur — à nettoyer. `IMPORT_MD_MODEL.indt` (1,3 Mo) à trancher (exclure probable). Livrables : chemins nettoyés, README public rédigé (présentation, lien ROADMAP/wiki, stack), revérification finale (0 chemin perso, 0 référence aux autres projets FJD). Le passage effectif en public reste une décision/action humaine, hors périmètre de la mission.

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

**Statut** : 🔴 À FAIRE — premier morceau neuf ; **lecture seule**, aucun risque d'écriture.

**Pourquoi elle vient en premier** : c'est le **socle**. Sans elle, le panneau n'a rien à afficher — et c'est aussi la **mesure de départ** : on verra dans le journal **ce que contient réellement l'étiquette** sur un document réel, au lieu de le supposer.

**Ce qui est neuf** : la sonde actuelle **ne lit pas l'étiquette du document**. Ses 5 boutons font autre chose (DOM, `doScript`, joignabilité du moteur, lecture d'un `.md`, contrôle négatif). **Lire l'étiquette = le vrai nouveau morceau.**

**À faire** : depuis le panneau, interroger le document actif et récupérer l'étiquette `md-source-fingerprint` ; en extraire **chemin, nom, taille, date, empreinte** ; les exposer au panneau.

**Critère de fin** : log brut montrant la lecture réelle sur un document où un import MD a **déjà** été fait (chemin, taille, date, empreinte), **et** le cas « document sans étiquette » (jamais importé) correctement distingué du cas « lecture ratée ».

**Cas limite à ne pas confondre** : *jamais importé* ≠ *lecture échouée*. Une lecture ratée ne doit **jamais** ressembler à un état normal (règle déjà appliquée par `m05BuildFingerprint` qui rend `null` explicitement).

---

## Chapitre Panneau — Mission 2 — La liste et ses signaux

**Statut** : 🔴 À FAIRE — dépend de la Mission 1.

**Contenu (spec FJD du 30/09)** : un **tableau** — une ligne par source — portant :
- le **signal d'état** : `identique` / `modifié dans la source` / `source absente` ;
- le **chemin** de la source ;
- la **date de dernière modification** ;
- les **caractéristiques** : **nombre de mots**, **nombre de signes** (calibrage).

**Ce qui est de l'assemblage** : les états viennent de `m05DecideState`, les caractéristiques du bouton 4 de la sonde (déjà certifié). **Rien à réinventer.**

**Contrôle négatif obligatoire** (méthode du projet) : la liste doit afficher **0 ligne** sur un document vierge — jamais une ligne vide ou un état inventé.

**Ouvert** : la question 2 (document actif vs tous les documents). La question 1 est **tranchée** : **1 source par document** (l'étiquette n'évolue pas vers N).

---

## Chapitre Panneau — Mission 3 — Bouton « Actualiser »

**Statut** : 🔴 À FAIRE — dépend de la Mission 2.

**À faire** : recalculer les états et rafraîchir le tableau **sans rien écrire dans le document**.

**Pourquoi c'est presque gratuit** : c'est la **même fonction** que la Mission 2 qu'on relance. Le bouton n'ajoute pas de logique, il ajoute un **déclencheur**.

**Cas limite à traiter** : le fichier source **disparaît entre deux actualisations** ⇒ le signal doit passer à « source absente » **sans erreur** et sans effacer l'historique affiché.

---

## Chapitre Panneau — Mission 4 — Bouton « Importer »

**Statut** : 🔴 À FAIRE — **volontairement en DERNIER** : c'est la **seule** mission du chapitre qui **ÉCRIT dans le document**.

### Signature du tube panneau → moteur (DRAFT — à geler après mesure du canal)

**Pourquoi un draft et pas une signature figée** : le « tube » qui portera les arguments du panneau vers le moteur **n'existe pas encore**. Sa forme **dépend du canal** : un canal intégré (`app.scriptArgs`, *piste à vérifier — non mesurée*) préfère des chaînes courtes ; un **fichier temporaire** accepte sans douleur une structure riche. **La forme suit le canal ⇒ on mesure le canal d'abord, on gèle la signature ensuite.**

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
| **Chemin** | source | Le seul changement de fond du moteur : il le reçoit au lieu de le demander |
| **Empreinte** (taille + checksum) | source | Le moteur peut la recalculer ; utile si le panneau l'a déjà |

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
1. **Le canal** : `app.scriptArgs` transport-t-il un argument du panneau vers ExtendScript, sans perte ? (piste documentée, **non mesurée**)
2. **Le répartiteur** : comment le moteur distingue « appelé par le menu » de « appelé par le panneau » — et ce que le panneau doit fournir.
3. **Le contournement du sélecteur** : le précédent existe (**relance M05** : chemin mémorisé ⇒ `File.openDialog` sauté). C'est le **crochet à généraliser**.

---

**Pourquoi en dernier** : d'abord parce qu'**on lit avant d'écrire** — si les missions 1 à 3 sont fausses, on les corrige sans dégât. Ensuite parce qu'**importer par-dessus une liste qui n'existe pas encore, c'est tester deux inconnues à la fois** : si ça rate, on ne saura pas *quelle* moitié a raté.

**À faire** : brancher le bouton sur le moteur `import_md.jsx` (joignabilité déjà prouvée par le bouton 3), en enveloppant l'exécution dans **`app.doScript()` + `UndoModes.ENTIRE_SCRIPT`**.

**Questions ouvertes à instruire AVANT de coder (à remonter, pas à trancher seul)** — détail dans la section « Signature du tube » ci-dessus :
- **Le panneau réutilise-t-il le pipeline complet** (sélecteur de fichier + dialogue de mapping inclus) **ou** une variante sans dialogue ? Le panneau a déjà le chemin : rouvrir un sélecteur serait redondant. Le précédent existe (**relance M05**) : c'est le **crochet à généraliser**.
- **`import_md.jsx` se termine par un appel `main();` au niveau racine** ⇒ l'évaluer déclenche **aussi** le bloc d'enregistrement du menu (l. 3077-3086, hors `main()`). Il faut un **répartiteur** qui distingue « appelé par le menu » de « appelé par le panneau », donc l'argument **Appelant** du tube.

**Critère de fin** : un **seul** `Ctrl+Z` annule **tout** l'import (preuve : nombre de pas d'annulation constaté, pas estimé), et le mapping `md-style-map` est **intact** après import (contrôle avant/après).

---

## Chapitre Panneau — Règles de clôture (communes aux 4 missions)

- **CR inline** : le compte rendu se met **dans le bloc de sa mission**, après `**Statut**` (preuve inline : log brut, sortie réelle) — **jamais** dans un fichier `cr_mXXX_*.md` séparé. *(Principe CR-inline dans la RM, universel — décision FJD du 14/09/2026.)*
- **Statut** : signalétique stricte, un seul format — `**Statut** : <marqueur> — <preuve en une phrase>`, avec exactement un de ✅ TERMINÉE / 🔴 À FAIRE / 🟡 PARTIELLE / 🔴 ABANDONNÉE. Mise à jour **dans le même tour** que le CR.
- **Encodage** : avant de rendre un CR, `grep -c $'\xef\xbf\xbd' COMMUNICATION/ROADMAP.md` doit renvoyer **0** — **ligne de Statut incluse** (le marqueur 🟡 est le coupable historique connu).
- **Preuve de dock** : la preuve d'ancrage à côté de « Liens » (`preferredDockedSize` 320×520) exige un **contrôle négatif** associé.
- **Wiki** : le wiki `doc/wiki_extendscript_indesign.md` est nourri **après le succès**, jamais avant (cible réservée, non éditée).
- **Périmètre** : ne pas ouvrir ici le chantier « analyseur Markdown standard » ni la modification de `parseMarkdown` (lecture de nos commentaires) — **acquis mais différé** (cf. [note d'architecture](../doc/architecture/NOTE_analyseur_markdown_standard.md), §5.3).

---

## Références du projet

- **Wiki technique** : [../doc/wiki_extendscript_indesign.md](../doc/wiki_extendscript_indesign.md) — base de connaissance des pièges ExtendScript/InDesign (42 cas au 29/09, table des matières par thème en tête de fichier), méthode de travail validée (simulation Node avant test réel, contrôle négatif obligatoire, vérification doc officielle avant hypothèse, arbitre indépendant devant reproduire la *même* transformation que le code, carte en plages pour révéler une distribution de styles)
- **Patron d'organisation du wiki** : [../doc/architecture/PATRON_wiki_recursif.md](../doc/architecture/PATRON_wiki_recursif.md) (analyse complète FJD+DS, 28/09) et [../doc/METHODE_wiki_recursif.md](../doc/METHODE_wiki_recursif.md) (socle projet-indépendant) — boucle consulter/documenter, gabarit à champs balisés, numérotation immuable, échelle à 6 horizons chiffrés. Missions 03bis (sources) et 03ter (gabarit+sommaire) en découlent.
- **Fixtures de test** : [../fixtures/](../fixtures/) — fichiers `.md` classés par modèle générateur (Claude, DeepSeek ×2, Gemini, ChatGPT) + JSON attendus
- **Script principal** : [../import_md.jsx](../import_md.jsx) — copié systématiquement vers `~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/import_md.jsx` après chaque modification (InDesign exécute cette seconde copie, jamais le fichier de travail directement)
- **Rôles** : Architecte (Claude) rédige les missions et valide, Ouvrier (DS) exécute — cf. mémoire `project_agent_roles.md`

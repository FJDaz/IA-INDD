# Mission 04 — Audit : bot pilote InDesign (GREP, gabarits PDF, suivi fabrication) — pont de transport, ex-« lien dynamique »

**Statut** : 🟡 PARTIELLE (mise à jour 29/09/2026) — **réorganisée le 28/09/2026 par l'Architecte en entonnoir à 3 étapes avec go/no-go** (cf. « Ordre d'exécution » ci-dessous) ; **socle documentaire ACQUIS** (préambule cross-platform ratifié par FJD + complément d'audit documentaire intégré : 3 mécanismes de lien, 2 faits négatifs, 1 affirmation trop forte corrigée) ; **étape 1 = sonde runtime (`mission_04bis` puis `mission_04ter`) : EXÉCUTÉE EN RÉEL le 29/09/2026** — **le verdict est tombé : la voie A (lien natif) ÉCHOUE pour notre besoin ⇒ BIFURCATION VERS LA VOIE B** ; **go/no-go PRONONCÉ** ; **étape 2 = décision : axe 1 TRANCHÉ (voie B retenue), axe 2 MIS DE CÔTÉ — différé, réservé, pas abandonné (décision FJD du 29/09/2026)** ; **étape 3 = périmètre de la suite : écrit et devenu la [Mission 05](mission_05_voie_b_empreinte_md.md)**. Cette mission est donc **close sur le plan décisionnel** : il ne lui reste **rien à décider**, et **elle n'implémente rien** — la suite s'exécute en **Mission 05**.
**Cadrage (FJD, 27/09)** : la mission 03 (pipeline complet + point d'entrée menu InDesign) était le **premier exercice** du projet. Cette mission 04 ouvre le **second chapitre**.
**Recadrage (FJD, 28/09)** : l'intention réelle n'est pas un panneau qui affiche du Markdown mis en forme, mais un **bot qui pilote InDesign** — génère et lance des requêtes GREP sur des scopes resserrés, interprète des gabarits PDF de couvertures, interprète des messages de suivi de fabrication. Le point dur devient le **pont** (exécuter du code dans InDesign depuis un process externe), pas l'UI.

## Ordre d'exécution (Architecte, 28/09/2026) — la réponse à « dans quel ordre ? »

**Constat qui a motivé cette réorganisation** : la mission s'était construite par **accrétion** (préambule + complément documentaire + 4 points + une sous-mission), avec des notes de révision empilées (« RÉVISÉ le 28/09 », « périmé, conservé en historique »). Résultat : le fichier racontait **l'histoire de ses révisions** au lieu de porter **un plan courant**. Trois défauts d'ordre en découlaient :

1. **La mesure arrivait après la décision.** Le point 1 (« `Link.update()` est-il une boîte noire ? ») **décide de l'architecture** — et il était bloqué par la sonde, elle-même numérotée `04bis`, donc **après**. Or un audit décisionnaire se mesure **avant** de recommander.
2. **La recommandation était écrite avant toute mesure.** Le point 4 a été révisé le 28/09 alors qu'**aucune** mesure n'existait encore.
3. **Deux questions indépendantes étaient mêlées dans une seule liste.** Les « points 1 à 4 » mélangeaient **le déclencheur** (« comment InDesign sait que le `.md` a changé ? ») et **le pont** (« comment le bot agit-il *dans* InDesign ? ») — deux axes aux dépendances différentes.

### La structure retenue : 3 étapes franchies dans l'ordre, 2 axes à trancher

| Étape | Contenu | État | Franchissement |
|---|---|---|---|
| **Étape 0 — Socle documentaire** | Préambule cross-platform + complément d'audit (3 mécanismes, 2 faits négatifs) | ✅ **ACQUISE** (ratifiée par FJD) | ne se rejoue pas |
| **Étape 1 — SONDE RUNTIME** (= `mission_04bis` puis `mission_04ter`) | 5 questions ; **Q3 décisive** : `Link.update()` sur un lien créé par nous écrase-t-il le mapping ? | ✅ **EXÉCUTÉE EN RÉEL le 29/09/2026** | **GO / NO-GO → PRONONCÉ : voie A écartée par mesure** |
| **Étape 2 — DÉCISION** | Une décision **par axe** (déclencheur / exécution), fondée sur l'étape 1 | 🟡 **tranchée** : axe 1 = **voie B** ; axe 2 = **mis de côté** (différé, réservé) | conditionnée à l'étape 1 — **satisfaite** |
| **Étape 3 — RECOMMANDATION + périmètre mission 05** | Décision argumentée, ampleur, critère de déploiement | ✅ **écrite** ⇒ [Mission 05](mission_05_voie_b_empreinte_md.md) | après les étapes 1 et 2 — **satisfait** |

### Axe 1 — DÉCLENCHEUR : comment InDesign sait que le `.md` a changé ?

Deux voies, **tranchées par l'étape 1** :

- **Voie A — lien natif** : `InsertionPoint.createTextFragmentLink()` produit un `Link` **sans** `place()` natif, puis `Link.status` signale la péremption et `Link.update()` rafraîchit. **Avantage** : icône d'alerte native du panneau Liens, gratuite. **Condition** : que Q3 (étape 1) établisse que `update()` **n'écrase pas** notre mapping.
- **Voie B — mécanisme maison** : empreinte (timestamp/hash) du `.md` stockée dans les métadonnées du document — exactement comme le mapping l'est déjà via `saveMappingToDocument()` / `loadMappingFromDocument()` — comparée à chaque lancement, avec alerte en boîte de dialogue. **Avantage** : ExtendScript pur, **ne dépend d'aucune API incertaine**, donc **disponible quel que soit le verdict de Q3**. **Coût** : pas d'icône native.

⇒ **Mise à jour du 29/09/2026 — la voie B n'est plus un repli : c'est LA voie.** La sonde a **écarté la voie A par mesure** (cf. point 1 ci-dessous, et le verdict détaillé). La voie B reste l'ex-« point 3 », **promu au rang de branche de décision** (il n'était pas un point parallèle) — et elle est désormais **l'objet de la [Mission 05](mission_05_voie_b_empreinte_md.md)**.

### Axe 2 — EXÉCUTION : le bot doit-il agir *dans* InDesign ?

**Cet axe ne se pose que pour les cas d'usage qui l'exigent** — GREP sur scopes resserrés, lecture de gabarits PDF de couvertures, messages de suivi de fabrication. **Pour le seul « relancer le pipeline après modification du `.md` », l'axe 1 suffit** : le bot réécrit le `.md`, notre pipeline est relancé — **aucun pont n'est nécessaire**. C'est la conséquence la plus importante du recadrage FJD, et elle doit rester écrite noir sur blanc pour éviter de construire un pont par réflexe.

**MIS DE CÔTÉ — décision FJD du 29/09/2026 (« on met de côté le bot »).** L'axe 2 est **différé et réservé, pas abandonné** : il se rouvrira **le jour où les cas d'usage l'exigeront** (GREP sur scopes resserrés, gabarits PDF de couvertures, suivi de fabrication), **jamais par réflexe**. Conséquence pratique : **aucun des quatre ponts candidats ci-dessous n'est instruit** — le tableau qui suit est conservé comme **état de la recherche au 28/09/2026**, il n'est **ni validé, ni clos**. Rien dans la suite du projet ne dépend de lui.

Quatre ponts candidats, à départager **par mesure** (pas par lecture seule) — c'est l'ex-« point 2 » :

| Pont | Ce qu'il permet | Réserve connue |
|---|---|---|
| **Réseau UXP** (WebSocket / `fetch`) | Le bot pousse des ordres à un plugin UXP | WebSocket **cassé sous Windows InDesign de la version 20 à 2025**, corrigé en InDesign 2026 (topic 8528) ⇒ à retenir **seulement** si la cible de déploiement exclut les versions antérieures |
| **`app.doScript()` depuis UXP** | Exécuter de l'ExtendScript classique déclenché par le bot | Disponibilité et signature **non vérifiées** |
| **Polling fichier ExtendScript pur** | Le bot écrit des fichiers, un script les lit périodiquement | Latence de polling ; **aucune** dépendance réseau ni UXP |
| **CEP** | Pont Chromium+Node historique | Fin de vie annoncée — statut réel à confirmer |

### Étape 3 — la sortie : la recommandation

La recommandation (ex-point 4) rend **une décision par axe**, pas une liste d'options : *déclencheur* = voie A ou B ; *exécution* = pont retenu ou « pas de pont ». Elle intègre les deux faits négatifs (le réglage « Create Links When Placing Text » **n'est pas** dans les préférences ⇒ `linkedStoryOptions` est le seul levier scriptable ; le mapping de styles **n'est pas** dans les préférences d'import ⇒ il passe par les collections `paraStyleMappings` / `charStyleMappings` / `tableStyleMappings`). Elle privilégie l'option **la plus simple à maintenir** et la moins exposée aux divergences cross-platform déjà documentées (Cas 38), sauf besoin fonctionnel contraignant.

### Règle structurelle inscrite le 28/09/2026 (cause du blocage actuel)

> **Aucune mission pilotée par l'Architecte ne porte un livrable de code sans exécuteur nommé.** Si l'exécuteur manque, la mission est **bloquée** — et elle doit être déclarée **bloquée**, jamais maquillée en recherche documentaire pour paraître active.

**Application immédiate — SATISFAITE le 29/09/2026.** L'étape 1 (la sonde) est du **code** : FJD a nommé **DS** exécuteur le 28/09, et les deux sondes (`04bis`, `04ter`) ont été **écrites puis exécutées en réel**. La règle reste **vivante pour la suite** : la [Mission 05](mission_05_voie_b_empreinte_md.md) porte un **livrable de code** ⇒ elle **ne démarre pas** sans exécuteur nommé. **Question ouverte à FJD : qui écrit la Mission 05 ?**

### Traçabilité avec l'ancienne numérotation (les « points 1 à 4 » restent des identifiants valides)

Les CR et la ROADMAP citent les « points 1 à 4 » : **le numéro reste un identifiant, il n'est pas renuméroté** (une numérotation acquise ne se réécrit pas). Correspondance :

- **point 1** → **étape 1 / axe 1, voie A** (mesure de `Link.update()` par la sonde) ;
- **point 2** → **axe 2** (le pont) ;
- **point 3** → **axe 1, voie B** (mécanisme maison — branche de décision, pas point parallèle) ;
- **point 4** → **étape 3** (recommandation).

⚠️ **Ne pas confondre deux séries de numéros** : les titres des rapports d'exécution en bas de ce fichier (« **CR 04, étape 1** (préambule) », « **CR 04, étape 2** (complément) ») sont des **étapes de CR** — chronologiques, elles racontent ce qui a **déjà été livré**. Les **étapes 0 à 3** du présent entonnoir sont l'**ordre de travail** de la mission. Les deux séries sont indépendantes.

## Préambule OBLIGATOIRE — cross-platform Windows/macOS (ajouté 28/09/2026, FJD) — **= étape 0, ACQUISE**

**Constat** : tout le travail de la mission 03 a été pensé, codé et testé exclusivement sur macOS (chemins `~/Library/Preferences/Adobe InDesign/.../fr_FR/Scripts/...`, locale française en dur dans certaines présélections). **Windows fait partie du périmètre réel du projet** (utilisateurs finaux sur PC), et **aucune machine Windows n'est disponible pour tester en réel**. Ce préambule doit être traité avant les points 1-4 ci-dessous, parce que sa réponse peut réorienter tout le reste de l'audit.

**Question centrale, à trancher en premier, par recherche documentaire uniquement (pas de test réel possible)** : **UXP est-il réellement cross-platform** (même code, même comportement sur macOS et Windows, à l'exception du strict nécessaire — chemins de fichiers, raccourcis clavier), **ou retombe-t-on sur des dialectes séparés par OS** comme à l'époque du SDK C++ classique (« comme en 2001 ») ?

**Méthode imposée pour ce préambule** :
- Chercher la documentation officielle Adobe UXP en premier (affirmation explicite de parité cross-platform, ou silence révélateur sur le sujet).
- Compléter par une recherche large de retours d'expérience communautaires — forums développeurs Adobe, GitHub issues, blogs techniques — en cherchant spécifiquement les mentions du type « fonctionne sur Mac mais pas Windows », « bug spécifique Windows », « chemin cassé sous Windows », etc. Ce sont ces signaux-là, pas la doc marketing, qui révèlent les vrais points de friction.
- Pour chaque affirmation retenue, citation exacte + URL + date, comme d'habitude (cf. wiki, réflexe n°1).
- Étendre la même vérification aux **chemins de fichiers ExtendScript classiques** (`File`/`Folder`, dossiers `Scripts Panel`/`Startup Scripts` sous Windows) — c'est pertinent même si la mission part sur UXP, au cas où une brique ExtendScript classique reste dans l'architecture retenue.

**Sortie attendue de ce préambule** : une réponse tranchée (avec le niveau d'incertitude honnêtement signalé si la doc reste ambiguë) sur le degré de portabilité réelle d'UXP entre macOS et Windows, avant de trancher l'orientation générale de l'audit (points 1 à 4 ci-dessous). Si UXP s'avère fortement dépendant de l'OS, cette information doit peser dans la recommandation finale au même titre que les 3 options déjà identifiées.

### Première passe de recherche (Architecte, 28/09/2026 — à approfondir/vérifier par DS)

**Verdict provisoire** : UXP n'est ni « cross-platform à 100% » ni « deux dialectes séparés comme en 2001 » — c'est **un seul code source avec des écarts de comportement ponctuels et documentés officiellement**, pas systémiques.

**Preuves trouvées** :
1. La page officielle "Getting started" (`developer.adobe.com/indesign/uxp/plugins/getting-started/`) et le guide UXP général (`developer.adobe.com/photoshop/uxp/2022/guides/`) restent **silencieux** sur une affirmation explicite de parité cross-OS — ni promesse, ni mise en garde. Vérifié par lecture directe des deux pages, aucune occurrence de "Windows"/"macOS"/"cross-platform".
2. **Preuve décisive, source officielle** : le "UXP Changelog and Support Matrix" (`blog.developer.adobe.com/en/publish/2026/07/uxp-changelog-and-support-matrix`) documente explicitement, pour UXP 9.3, des fonctionnalités limitées à un OS : *« Added support for the video `poster` attribute (supported only on MacOS). »* et *« Added support for `file://` URLs alongwith `#fragments` via `shell.openPath()` on macOS. »* — aucun équivalent Windows mentionné pour ces deux points.
3. **Signal communautaire (à vérifier plus en détail, pas encore une preuve solide)** : un bug rapporté sur un panneau UXP Photoshop qui charge une UI vide spécifiquement sous Windows 11 (v26.8.1), avec un contournement suggéré de déplacer le dossier plugin à la racine du disque — suggère une sensibilité aux chemins de fichiers sous Windows, cohérent avec l'inquiétude de FJD.
4. **Signal communautaire, ExtendScript classique** : InDesign 19.4 a changé de format de chemin de plugin (HFS → POSIX), signe que les questions de chemin de fichiers restent un point de friction réel et évolutif dans l'écosystème Adobe, pas seulement une crainte théorique.

**Ce qui reste à faire (pour DS, dans le cadre de la mission)** : approfondir le signal Windows 11/Photoshop (est-ce un bug isolé corrigé depuis, ou récurrent ?), et chercher spécifiquement si un comportement similaire a été rapporté pour un plugin **InDesign** (pas seulement Photoshop) — les deux applications partagent UXP mais pas nécessairement les mêmes bugs.

### Deuxième passe (DS, 28/09/2026) — vérification de la première passe et réponse à la question centrale

**Nature de cette passe** : recherche documentaire uniquement. **Aucune machine Windows n'est disponible sur ce poste (macOS uniquement)** — le verdict ci-dessous repose sur la documentation officielle Adobe et sur des retours communautaires datés, **jamais sur une mesure personnelle**. C'est une limite réelle, et elle est signalée comme telle plutôt que masquée.

#### A. Ce qui, dans la première passe de l'Architecte, résiste à la vérification indépendante

- **Preuve n° 2 (changelog UXP) : CONFIRMÉE, et notablement plus riche que citée.** Le « UXP Changelog and Product Support Matrix » (auteur Kasi Viswanathan K, publié le 29/07/2026, page récupérée le 28/09/2026 — `https://blog.developer.adobe.com/en/publish/2026/07/uxp-changelog-and-support-matrix`) contient bien les deux citations Mac-only annoncées (UXP 9.3 : *« Added support for the video `poster` attribute (supported only on MacOS). »* et *« Added support for `file://` URLs alongwith `#fragments` via `shell.openPath()` on macOS. »*). La même source livre **trois preuves supplémentaires que la première passe n'avait pas relevées** :
  - **UXP 9.4 (correctif)** : *« Fixed UNC path handling for WebView `src`, video `src`, and video `poster` attributes on Windows. »* — un bug **exclusivement Windows** (chemins réseau `\\serveur\partage`) — donc un correctif Windows-only, dans une version UXP (9.4.0) qui, elle, est générale et n'est encore intégrée à **aucun** host GA.
  - **UXP 9.1** : *« Disabled swipe navigation on WebView2 for consistency with macOS WKWebView; all WebView2 gestures (Swipe, Zoom Control, Pinch Zoom) are now disabled. »* — Adobe y **écrit noir sur blanc que WebView2 (Windows) et WKWebView (macOS) sont deux moteurs distincts**, et que l'alignement de comportement est un travail explicite de leur part.
  - **UXP 9.0** : *« WebView2 now uses Fluent overlay scrollbars »* — amélioration visuelle visible **sur Windows seul**.
  - **Matrice de support** : 9.3.0 ↔ InDesign 21.4 ; 9.2.1 ↔ InDesign 21.3 ; 9.0.3 ↔ InDesign 21 ; 8.0.1 ↔ InDesign 20.2.1 ; et **9.4.0 sans ligne de host GA** (version pas encore embarquée dans un host stable). Le cycle de vie UXP est **découplé** du cycle de vie d'InDesign, avec des versions intermédiaires absentes d'InDesign.
- **Preuve n° 1 (silence de la documentation) : CONFIRMÉE par relecture indépendante.** J'ai relu `developer.adobe.com/indesign/uxp/introduction/` (*« Last updated 8/4/2023 »*), `developer.adobe.com/indesign/uxp/scripts/` (*« Last updated 5/8/2026 »*) et, lors de la passe précédente, les pages « Getting started » et « Concepts ». **Aucune de ces pages ne promet la parité macOS/Windows, et aucune ne la nuance.** Le silence est bien symétrique : ni promesse marketing, ni avertissement technique.
- **Preuve n° 4 (InDesign 19.4, HFS → POSIX) : NON revérifiée.** Je n'ai pas retrouvé de source officielle datée confirmant ce changement dans le temps imparti. **À ne pas citer en l'état** — une affirmation non sourcée vaut zéro (réflexe n° 1 du wiki).
- **Preuve n° 3 (signal Windows 11 / Photoshop v26.8.1) : REQUALIFIÉE.** Le cas précis décrit par la première passe n'a pas été retrouvé tel quel. Le signal Windows de cette famille existe bel et bien, mais il est **beaucoup mieux étayé par d'autres sources** (voir B.2 ci-dessous), qui sont d'ailleurs **majoritairement InDesign et non Photoshop** — c'est exactement ce que la première passe demandait de creuser.

#### B. Apports de cette deuxième passe — le point décisif

**B.1. Un sujet communautaire pose littéralement la question du préambule, trois ans avant nous.**

- **Titre exact** : *« Operating system specific problems with InDesign APIs? »*
- **URL vérifiée et récupérée le 28/09/2026** (flux complet reçu) : `https://forums.creativeclouddeveloper.com/t/operating-system-specific-problems-with-indesign-apis/6650`
- **Métadonnées** : ouvert le **2023-08-09** par **Zuri Klaschka (pklaschka**, badge *Champions*, modérateur et staff**)** ; 7 messages ; dernier message le 2023-08-21 ; 862 vues ; catégorie 72 (InDesign) ; étiquettes `uxp`, `javascript`, `bug`, `plugin`.
- **Citation exacte du message d'ouverture** (2023-08-09) : *« My plugin just got rejected in the review process. Now that, by itself, isn't why I'm posting here. The reason I'm writing about this is that it alludes to some sort of operating system dependency in some InDesign API that (in my opinion) can only be a bug. »* Le plugin (code public, `github.com/pklaschka/indesign-pride-flagger`) se figeait complètement : *« this results in the complete unresponsiveness and freezing of the entire InDesign application […] The only practical course of action I discovered to exit InDesign was to utilize the Activity Monitor and forcefully terminate the application. »*
- **Et surtout, la phrase qui tranche** : *« While I had seen a similar problem on Windows while trying to use `window.alert()` […] the plugin now uses nothing that should have anything to do with the operating system (in fact, I only use DOM APIs and two "more native" features […] `app.eventListeners.add()` and `app.doScript()`), and **the described flow works without any issues on Windows**. Unfortunately, I don't have a Mac available for testing at the moment […] I guess that this is a mix of a bug report (because **I haven't used anything that would justify a difference of behavior between operating systems**) and a question. »*
- **Réponse d'une employée Adobe (Kerri Shotts / kerrishotts, badge *Adobe*, admin, 2023-08-09)** : *« Hmm… I managed to replicate this once on my machine […] But after I restarted Id, I can't duplicate that anymore, and it works flawlessly. […] May need to involve Eng to do some debugging here as **there could be something Mac-specific going on**. »*
- **Confirmation finale par Adobe (Anoop B Valomkot / Anoop, 2023-08-21)** : *« Your plugin just happened to uncover a **random bug on Mac related to event loop processing**. This is being looked into, thanks for reporting it. »*
- **Ce que ce sujet démontre, précisément** : (1) un différenciateur de comportement par OS **peut** surgir sur du code qui n'a **rien** d'OS-spécifique (`app.doScript()`, `app.eventListeners.add()`, APIs DOM) ; (2) ce différenciateur a été **confirmé côté Adobe** ; (3) il allait **dans le sens Mac-only, pas Windows-only** — le même plugin marchait « sans aucun problème » sous Windows et gelait sur Mac ; (4) l'auteur lui-même note que **personne n'avait de machine de l'autre OS sous la main** — la couverture de test par OS est un angle mort structurel de cet écosystème, y compris chez les développeurs expérimentés.

**B.2. Les poches de bogues par OS sont réelles, datées, et vont dans les deux sens.**

Signaux **Windows-only** (URL vérifiées et récupérées le 28/09/2026) :

| Sujet | topic_id | Date | Signal exact |
|---|---|---|---|
| *UXP Webview Resizing Windows Border Bug (Photoshop & InDesign)* | 11181 | 2025-07-18 (justin2taylor) | *« When using a Webview in your UXP Plugin on Windows in Photoshop or InDesign, the border flickers during resizing. **MacOS is fine.** »* |
| *UXP <webview> panels never receive keyboard focus on Windows (InDesign) after an app switch* | 12145 | 2026-09-03 (arturparaschiv) | InDesign **21.2.0.30 (Windows 11)**, WebView2 151.0.4129.107 : le panneau ne reçoit jamais le focus clavier après un changement d'application. |
| *File Picker not working in Windows* | 7342 | 2024-01-10 (salinsley) | *« I have a plug-in that I developed on a Mac, and I'm installing it now onto a Windows machine. I can't get the file picker from […] getFileForOpening to work on Wind… »* — **c'est littéralement le « fonctionne sur Mac mais pas Windows » demandé par le préambule**. |
| *(Windows) Unable to Access Files on Network Drive* | 7713 | 2024-03-28 (salinsley) | *« I'm unable to resolve the network path correctly on a Windows machine »* — cohérent avec le correctif UNC de l'UXP 9.4. |
| *UXP Plugin InDesign 20.4 Win 11 Bug: The standard behavior of the HTML SELECT element is broken* | — | 2025-06 | Régression apparue au passage **20.3.1 → 20.4**, sous Windows 11. |

URL canonique des sujets : `https://forums.creativeclouddeveloper.com/t/<slug>/<topic_id>` (slugs repris tels quels dans les titres ci-dessus, en minuscules, espaces remplacés par des tirets).

Signaux **macOS-only** — et c'est ce qui interdit de conclure « Windows est le mauvais élève » :

- Topic **6650** ci-dessus : bogue *« random bug on Mac related to event loop processing »*, confirmé par Adobe.
- Topic **12104**, *« [bug] Color Picker problem when Move tool active (Mac only) — demo plugin attached »*, ouvert le **2026-08-19** (catégorie Photoshop) : un bogue **explicitement Mac-only**, posté trois semaines avant la rédaction de ce verdict.

**B.3. La famille de frictions la plus concentrée : les chemins et les fichiers.**

Trois des cinq signaux Windows-only de B.2 touchent les chemins (`getFileForOpening`, lecteur réseau, bordure WebView), et le correctif UXP 9.4 est *« Fixed UNC path handling […] on Windows »*. Un quatrième signal, non daté dans ma collecte et donc **non cité comme preuve**, évoque en outre l'échec d'installation de plugins UXP pour les utilisateurs Windows dont le **nom de compte contient un caractère accentué** (`C:\Program Files\Common Files\Adobe\UXP\Plugins\Møhü\`). **Point d'attention direct pour notre projet** : nos chemins contiennent des accents (dossiers `Tchiou Vélu`, `I-AMiens`) et notre code ExtendScript actuel travaille en `fr_FR` — sur une chaîne de build Windows, ce n'est pas une hypothèse théorique.

#### C. Verdict tranché sur la question centrale

**Réponse : UXP n'est PAS « deux dialectes séparés par OS » — mais ce n'est PAS non plus la parité.** La formulation exacte que je retiens, et qui est le point à ne pas simplifier :

> **Un seul code source, une seule surface d'API, une seule chaîne de distribution — mais des différences de comportement par OS réelles, datées, officiellement reconnues (tantôt par correctif ciblé, tantôt par mention « supported only on MacOS »), et qui ne sont ni marginales ni systématiques.**

Décomposition, pour éviter toute lecture binaire :

1. **Ce qui est réellement unifié — et c'est massif.** Un seul `manifest.json`, un seul arbre de fichiers plugin, une seule chaîne de distribution (Adobe Marketplace / `.ccx`), une seule API InDesign côté script (`app.*`, DOM document, `Story`, `Link`…), un seul langage (UXP = JavaScript ES6 ; ExtendScript = ES3). **Aucune compilation séparée, aucun `#ifdef` Mac/Windows, aucun arbre de sources dupliqué.** Sur ce plan, nous sommes **très loin** du SDK C++ classique « comme en 2001 », où le code Mac et le code Windows étaient deux projets distincts. Cette partie de l'inquiétude de FJD est levée.
2. **Ce qui diverge malgré tout, et qu'il faut budgéter.** Trois familles identifiées, chacune adossée à une preuve datée : (a) **la couche WebView est un bi-moteur** — WebView2 sous Windows, WKWebView sous macOS (citation UXP 9.1), donc deux moteurs de rendu, deux jeux de gestes, deux gestionnaires de chemins, deux rendus de barres de défilement (UXP 9.0) ; (b) **les chemins de fichiers** — UNC, lecteurs réseau, caractères accentués dans le profil utilisateur (UXP 9.4 + topics 7342, 7713) ; (c) **le focus clavier et les raccourcis** — le sujet Windows-only 12145 sur InDesign 21.2, plus un fil communautaire fourni où des développeurs listent les raccourcis globaux cassés dès qu'un panneau UXP a le focus, *« particularly Alt+F4 not closing InDesign but the plugin logic »*.
3. **Ce qui reste structurellement inconnu.** Les bogues confirmés (topic 6650) sont apparus sur du code **sans** aucune dépendance OS — donc la frontière « ici ça peut diverger, ici non » **n'est pas prévisible à l'écriture**. C'est le vrai enseignement : ce n'est pas qu'UXP diverge beaucoup, c'est que **l'on ne peut pas déduire par lecture du code où il divergera**. La seule parade est le test sur les deux OS, et l'écosystème lui-même en manque (l'auteur du topic 6650 n'avait pas de Mac, se demande s'il doit « acheter un Mac Mini pour tester », et c'est la soumission au review Adobe qui a servi de premier test Mac involontaire).
4. **Un effet de cycle de vie à ne pas oublier.** UXP est versionné indépendamment d'InDesign (UXP 9.4.0 n'est encore dans **aucun** host GA ; 9.3.0 ↔ InDesign 21.4 seulement), donc **le comportement dépend de (OS × version du moteur UXP × version d'InDesign)** — trois variables, dont une seule est sous notre contrôle. Le topic 20.3.1 → 20.4 est l'illustration exacte : une régression apparue sur une montée de version du host.

**Nuance honnête à porter au dossier** : les signaux Windows-only sont **plus nombreux** dans mon échantillon (5 contre 2), mais mon échantillon est **biaisé par la façon dont je l'ai collecté** (requêtes orientées « windows »). Je **ne** conclus **pas** que Windows est plus cassé que macOS. Ce que l'échantillon démontre solidement, c'est le **fait** des divergences par OS et leur **nature** (chemins, WebView, focus), pas leur **répartition quantitative**.

**Consigne pratique ajoutée le 28/09/2026 (FJD), pour tout futur test réel sur machine Windows** : le point C.4 ci-dessus établit 3 variables croisées (OS × version UXP × version InDesign) — un test sur une machine Windows tierce (collègue, élève, machine empruntée) **ne garantit pas** la même version d'InDesign/UXP que le poste de développement actuel (macOS, InDesign 21.5.1.73 / 21.6.0.57 selon les sondes déjà faites sur ce projet). **Avant tout test Windows, consigner la version exacte d'InDesign et, si accessible, la version UXP du poste testé** (visible dans les infos de version InDesign ou via le manifest du plugin chargé) — sans ça, un test "ça marche sous Windows" ne prouve rien de généralisable, il ne prouve que "ça marche sur CETTE version précise". Un résultat positif sur une version ne dispense pas de re-tester si la version cible de déploiement diffère.

#### D. Extension aux chemins ExtendScript classiques (`File`/`Folder`)

Le préambule demandait de couvrir aussi l'ExtendScript classique, en cas de brique conservée. Verdict sur cette partie — et il est **radicalement différent** de celui d'UXP :

> **Ici, oui, ce sont bien deux dialectes de chemins distincts** — mais ils sont **normalisés par l'API `File`/`Folder`** d'ExtendScript.

- Les emplacements des **Scripts Panel** et **Startup Scripts** ne sont pas les mêmes sous Windows et sous macOS : côté macOS ils vivent sous `~/Library/Preferences/Adobe InDesign/Version <XX>/<locale>/Scripts/…`, côté Windows sous `%APPDATA%\Adobe\InDesign\Version <XX>\<locale>\Scripts\…`, avec en plus un emplacement **au niveau de l'application** (dossier d'installation) qui coexiste avec l'emplacement utilisateur. La locale (`fr_FR`, `en_US`, `<XX>` = version majeure) **entre dans le chemin** — donc changer de version d'InDesign ou de locale déplace les fichiers.
- **Ce que ça implique concrètement pour nous** : `Folder.userData`, `Folder.myDocuments`, `Folder.appPackage`, `File.fs`, `File.getRelativeURI()` existent précisément pour absorber cette différence. Un script qui écrit `"~/Library/Preferences/…"` en dur **est** un script mac-only ; un script qui écrit `Folder.userData + "/Adobe/InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel"` reste fragile (locale et version en dur) ; la seule forme portable consiste à **composer le chemin via l'API** plutôt qu'à le littéraliser.
- **Statut de cette sous-section** : c'est un **verdict de conception**, appuyé sur la sémantique documentée de `File`/`Folder` — **pas** une mesure sur Windows, que je ne peux pas produire. Elle devra être **confirmée par un test réel dès qu'une machine Windows est disponible** (chemin exact des deux dossiers sous la version déployée, comportement de `Folder.userData`).

#### E. Conséquences directes pour les points 1 à 4 de cette mission

1. **Le préambule ne disqualifie pas UXP.** La partie « dialectes séparés à la 2001 » de la crainte est levée : un seul code source, une seule distribution. UXP reste une option ouverte pour le panneau de suivi de lien.
2. **Mais il impose une réserve sur le coût, non sur la faisabilité.** Si l'option retenue implique une **WebView** (interface riche en HTML/CSS dans le panneau — scénario probable pour un panneau de liens), on tombe précisément sur **la couche bi-moteur**, la plus documentée comme divergente. Une UI UXP **sans** WebView (contrôles UXP natifs, `sp-button`, `sp-textfield`…) évite cette famille de friction. **Ce critère doit peser dans la recommandation du point 4** au même titre que les trois options déjà identifiées.
3. **Il renforce l'attrait du mécanisme « maison » ExtendScript (point 3) sur un axe précis** : un mécanisme ExtendScript pur ne traverse **ni** la couche WebView **ni** le moteur UXP, donc échappe aux deux familles de divergence les mieux documentées. Il conserve en revanche la famille « chemins » (D. ci-dessus) et **perd** l'icône native du panneau Liens. **C'est un arbitrage, pas une évidence** — et il appartient à FJD.
4. **Il ajoute une exigence de méthode, quelle que soit l'option retenue.** Puisque la divergence n'est pas prévisible par lecture du code (C.3), **toute brique retenue devra être testée sur les deux OS** avant d'être considérée comme acquise. Or **aucune machine Windows n'est disponible aujourd'hui** : c'est un risque de projet à remonter à FJD explicitement, indépendamment du choix technique. Un plan de test mono-OS ne suffit pas pour Windows.

**Sources citées dans cette passe** (toutes récupérées le 28/09/2026) :
- Blog Adobe, *UXP Changelog and Product Support Matrix* — `https://blog.developer.adobe.com/en/publish/2026/07/uxp-changelog-and-support-matrix` (publié 29/07/2026).
- Forum développeurs Adobe, topic **6650**, *Operating system specific problems with InDesign APIs?* — `https://forums.creativeclouddeveloper.com/t/operating-system-specific-problems-with-indesign-apis/6650` (2023-08-09 → 2023-08-21).
- Forum développeurs Adobe, topic **11181**, *UXP Webview Resizing Windows Border Bug (Photoshop & InDesign)* — `https://forums.creativeclouddeveloper.com/t/uxp-webview-resizing-windows-border-bug-photoshop-indesign/11181` (2025-07-18).
- Forum développeurs Adobe, topic **12145**, *UXP <webview> panels never receive keyboard focus on Windows (InDesign) after an app switch* — `https://forums.creativeclouddeveloper.com/t/uxp-webview-panels-never-receive-keyboard-focus-on-windows-indesign-after-an-app-switch/12145` (2026-09-03).
- Forum développeurs Adobe, topic **7342**, *File Picker not working in Windows* — `https://forums.creativeclouddeveloper.com/t/file-picker-not-working-in-windows/7342` (2024-01-10).
- Forum développeurs Adobe, topic **7713**, *(Windows) Unable to Access Files on Network Drive* — `https://forums.creativeclouddeveloper.com/t/windows-unable-to-access-files-on-network-drive/7713` (2024-03-28).
- Forum développeurs Adobe, topic **12104**, *[bug] Color Picker problem when Move tool active (Mac only)* — `https://forums.creativeclouddeveloper.com/t/bug-color-picker-problem-when-move-tool-active-mac-only-demo-plugin-attached/12104` (2026-08-19).
- Documentation Adobe InDesign UXP : `https://developer.adobe.com/indesign/uxp/introduction/` (maj 8/4/2023) et `https://developer.adobe.com/indesign/uxp/scripts/` (maj 5/8/2026).

**Découverte réutilisable à porter au wiki** (gabarit É1, nouveau cas) : le statut du sujet **6650** — *un différenciateur de comportement par OS peut apparaître sur du code ExtendScript/UXP sans aucune dépendance OS, et Adobe peut le confirmer comme bogue* — est un cas de diagnostic générique, au même titre que les pièges d'encodage et de portée déjà documentés.

## Contexte et objectif

FJD veut, à terme, une feature de suivi de lien : quand le fichier `.md` source est modifié après un premier import, InDesign doit **détecter** ce changement (idéalement via son propre panneau Liens natif, avec l'icône d'alerte standard), et un geste utilisateur (clic sur un bouton de mise à jour) doit **relancer notre pipeline complet** (reparsing + mapping de styles sur la charte réelle du document), pas juste un import brut.

Un échange avec l'Architecte (Claude) a déjà exploré cette question et abouti à trois constats **à vérifier par toi de façon indépendante**, pas à prendre pour acquis :

1. **`place()` existe sur 3 objets** (`Document`, `InsertionPoint`, `Text`) — confirmé par citation exacte de `indesignjs.de` (signature identique sur les 3 : `place(fileName, showingOptions?, withProperties?)`).
2. **`Story.itemLink` existe** et retourne un `Link` si la story provient d'un fichier placé (confirmé par citation exacte). `Link.status`, `Link.update()`, `Link.filePath` sont scriptables.
3. **`Link.update()` semble être une boîte noire** : sa description officielle ("Updates the link if the source file has been changed.") ne documente aucun paramètre ni hook pour lui faire exécuter un traitement custom après coup — elle relance vraisemblablement un import natif brut, écrasant tout mapping de styles fait précédemment. **Ce point n'est PAS confirmé par test réel**, seulement déduit de l'absence de paramètre dans la doc — à vérifier en priorité.

Un point important, à vérifier aussi : **notre méthode d'insertion actuelle (assignation directe à `.contents`, jamais un vrai `place()`) ne crée aucun `Link`** — donc en l'état actuel du script, le panneau Liens ne verra jamais notre import. Pour bénéficier du lien natif, il faudrait faire passer l'insertion par un vrai `place()` (sur le `.md` lui-même ou un fichier intermédiaire), puis réappliquer notre mapping de styles en seconde passe dans la même exécution du script (ExtendScript étant synchrone, l'utilisateur ne verrait jamais le texte brut non stylé à l'écran, à condition de ne pas insérer de dialogue modal entre les deux étapes).

> ⚠️ **Correction du 28/09/2026** (cf. « Complément d'audit documentaire » ci-dessous) : la formulation initiale — « ne peut **structurellement** pas créer de `Link` » — était **trop forte**. La doc officielle expose `InsertionPoint.createTextFragmentLink() → Link`, qui crée un `Link` sur un fragment de texte **déjà présent**. Notre méthode d'insertion *n'interdit donc pas* le lien : elle ne le crée simplement pas par elle-même. Une seconde passe peut le produire **sans** `place()` natif.

Une piste alternative est apparue en fin d'échange, **non creusée en profondeur, à auditer sérieusement** : **UXP** (Unified Extensibility Platform), le framework moderne d'Adobe pour construire des plugins InDesign en JavaScript/HTML/CSS (pas C++), avec support officiel de panneaux persistants ancrés dans l'interface depuis InDesign v18.5. Si viable, ça éviterait le mur du SDK C++ propriétaire (compilation séparée Mac/Windows, courbe d'apprentissage lourde) qu'on redoutait initialement pour tout panneau custom.

---

## Complément d'audit documentaire — 3 mécanismes manquants, et 1 affirmation à corriger (Architecte, 28/09/2026)

**Origine** : FJD a demandé une vérification externe de la couverture du sujet `place()` / `Link` / import de texte (le wiki local ne le couvre pas). La vérification a été faite sur le miroir de l'object model **`indesignjs.de`** — build de référence **InDesign 2026 / 21.5.1.73**, fichiers Adobe datés **2026-09-21**. Elle **confirme les constats 1 et 2** ci-dessus, mais révèle **trois mécanismes absents de la présente mission** et **une affirmation trop forte**.

**Méthode** : citation exacte avant toute hypothèse (réflexe n°1 du wiki) ; **une page de classe `indesignjs.de` à la fois** (chaque page est volumineuse et répète des blocs de liens).

### 1. Les deux constats existants sont CONFIRMÉS (extraits verbatim)

| Fait | Extrait officiel | Source |
|---|---|---|
| `Story.itemLink` | « `itemLink` \| `Link` \| readonly \| *The source file of the link.* » | `indesignjs.de/indesignapi/indesign/Story.html` |
| `Link.filePath` | « `filePath` \| String, File \| readonly \| *… colon delimited on the Mac OS. Can also accept: File.* » | `…/Link.html` |
| `Link.parent` | « `parent` \| **Graphic \| Movie \| Story \| Sound** \| readonly \| *The linked object.* » | `…/Link.html` |
| `Link.update()` | « `update()` → `Link` — *Updates the link if the source file has been changed.* » | `…/Link.html` |
| `LinkStatus` (enum) | `NORMAL` \| `LINK_OUT_OF_DATE` \| `LINK_MISSING` \| `LINK_INACCESSIBLE` \| `LINK_EMBEDDED` | `…/Link.html` |

⇒ `Story.itemLink` **existe** ; un `Link` **peut** avoir une `Story` pour parent (la hiérarchie de la classe `Link` liste explicitement `Graphic | Movie | Sound | Story`) ; `filePath` / `status` / `update()` sont bien scriptables. **Constats 1 et 2 : validés par la doc.**

### 2. Mécanisme n°1 — `InsertionPoint.createTextFragmentLink()` : le mur du `.contents` est franchissable

La méthode figure dans la section « RETURN 15 » de la classe `Link` (source : `…/Link.html` et `…/InsertionPoint.html`) :

> « `createTextFragmentLink()` → `Link` »

⇒ Il existe une méthode qui **crée un `Link` sur un fragment de texte déjà présent**. Conséquence directe : **l'affirmation « notre méthode d'insertion ne peut structurellement pas créer de `Link` » doit être corrigée** (correction appliquée plus haut dans ce fichier). Ce qui est exact : notre méthode actuelle *n'en crée aucun par elle-même*. Ce qui est faux : qu'elle *interdise* structurellement le lien. Une seconde passe (`createTextFragmentLink()` sur le point d'insertion, après l'assignation `.contents`) **peut** produire le `Link` sans `place()` — piste **à tester en réel**.

**Réserve** : la signature complète (paramètres) et le comportement réel (quel `Link` est produit, quelle `linkResourceURI`, comment `status` évolue) ne sont **pas** documentés au-delà de cette ligne ⇒ **à mesurer par sonde runtime**, pas à présumer (cf. `mission_04bis_sonde_lien_runtime.md`).

### 3. Mécanisme n°2 — `placeAndLink()` : le lien créé *pendant* le placement

`placeAndLink` apparaît côté **Story PARAMETER OF 35** et **RETURN 20** de la classe `Link`, et comme méthode de `Document`, `Page`, `Spread`, `MasterSpread`, `EndnoteTextFrame` — avec un paramètre `parentStory` (source : `…/Document.html`, `…/Page.html`, `…/Spread.html`).

⚠️ **Réserve forte** : la mémoire projet consigne `placeAndLink` comme **déprécié**. **Avant tout usage, relire la page `Document.html` pour vérifier le statut réel** (mention « Deprecated » explicite ?). Un mécanisme déprécié n'est pas disqualifié, mais ne peut pas fonder une recommandation sans que ce soit dit.

### 4. Mécanisme n°3 — `Story.linkedStoryOptions` : le réglage « linked story » exposé à l'API

> « `linkedStoryOptions` \| `LinkedStoryOption` \| readonly » — classe `Story` (source : `…/Story.html`)

Classes associées et volumétrie relevée : `LinkedStoryOption` (**14 membres**), `LinkedPageItemOption` (**17 membres**), `ParaStyleMapping` (**15 membres**).

⇒ C'est le réglage de **story liée**, c'est-à-dire le comportement « *Create Links When Placing Text* » — qui **n'est pas exposé dans les préférences** (fait négatif A ci-dessous). L'API est donc le **seul** levier scriptable pour ce réglage.

### 5. FAIT NÉGATIF A — le réglage n'est PAS dans les préférences

- `Application.linkingPreferences` (classe `LinkingPreference`, **9 propriétés**) : **aucune** propriété « Create Links When Placing Text and Spreadsheet Files ».
- `Application.wordRTFImportPreferences` (classe `WordRTFImportPreference`, **26 membres**) : idem.

⇒ Le réglage d'interface **n'est pas scriptable via les préférences**. C'est précisément pour cela qu'il faut passer par `placeAndLink()` / `createTextFragmentLink()` / `linkedStoryOptions`.

### 6. FAIT NÉGATIF B — le mapping de styles n'est PAS dans les préférences d'import

- `WordRTFImportPreference` (26 membres) et `TaggedTextImportPreference` (**8 propriétés**) : **aucune** table de mapping de styles.

⇒ Le mapping de styles **doit** passer par les collections dédiées : `Application.paraStyleMappings` / `charStyleMappings` / `tableStyleMappings`. Cohérent avec notre architecture : c'est notre mapping maison qui porte la charte, pas un réglage d'import.

### 7. Ce que ce complément change pour les points 1 à 4

- **Point 1** (`Link.update()` boîte noire) : **inchangé dans son principe**, mais le champ des possibles s'élargit — un `Link` peut exister **sans** `place()` natif (mécanisme n°1), donc le test peut porter sur un lien **créé par nous**, pas seulement sur un lien issu du Placer.
- **Point 2** : inchangé (recadrage FJD en cours — révision du libellé à la charge de l'Architecte).
- **Point 3** (mécanisme maison) : **renforcé** — `createTextFragmentLink()` offre une troisième voie, ExtendScript pur, entre « tout maison sans lien » et « `place()` natif qui écrase notre mapping ».
- **Point 4** (recommandation) : devra intégrer ces 3 mécanismes **et** citer les deux faits négatifs comme **raison de leur nécessité**.

**Sources** (consultées le 28/09/2026, HTTP 200) : `indesignjs.de/indesignapi/indesign/` — pages `Link.html`, `Story.html`, `InsertionPoint.html`, `Document.html`, `Page.html`, `Spread.html`, `Application.html`. Build de référence **InDesign 2026 / 21.5.1.73** (fichiers Adobe datés **2026-09-21**). ⚠️ `WordImportPreference.html` renvoie **HTTP 404** (nom de classe erroné — la classe réelle est `WordRTFImportPreference`).

## Ce qui est demandé (audit, pas implémentation) — **à lire selon l'ordre d'exécution ci-dessus**

**Comment lire cette section** : les 4 points ci-dessous sont **conservés intégralement** (leur détail est la matière de l'audit) mais ils ne sont **pas** à traiter dans l'ordre de leur numéro. Les étiquettes `(Étape n)` / `(Axe n)` disent à quel moment de l'entonnoir chaque point se rattache : **étape 1 → axe 1 voie A** (point 1) ; **axe 2** (point 2) ; **axe 1 voie B — plancher garanti** (point 3) ; **étape 3** (point 4). Le point 2 n'est **pas** à ouvrir avant le go/no-go de l'étape 1.

### 1. (Étape 1 · axe 1 voie A — la mesure décisive) Vérifier par test réel si `Link.update()` est vraiment une boîte noire

**✅ EXÉCUTÉ EN RÉEL le 29/09/2026 — Q3 est TRANCHÉE : la voie A ÉCHOUE.** Mesures décisives (sondes `04bis` + `04ter`) : `place()` d'un `.md` ⇒ `doc.links.length = 0` et `parentStory.itemLink = (null)` ; `createTextFragmentLink()` vers un `.md` échoue **11 essais sur 11** ; l'ICML porte bien un lien (`linkType = InCopyMarkup`) mais son `update()` **ne recharge pas** le contenu (contrôle de fraîcheur seulement : `statut du lien apres update = LINK_OUT_OF_DATE`, story identique avant/après, `relevé des styles identique = true`) et **à la réouverture** la story affiche encore l'ancien texte (`TITRE A = true | TITRE B MODIFIE = false`) ; enfin l'ICML **ne porte aucun style de paragraphe nommé**. ⇒ **aucune voie native ne surveille notre `.md` ni ne protège notre mapping.** C'est ce verdict qui ferme la voie A et ouvre la voie B.

- Créer un test minimal : placer un fichier texte simple via `place()` dans un TextFrame, styler le texte après coup (mapping simplifié), modifier le fichier source, appeler `Link.update()` par script, observer le résultat.
- Est-ce que le style appliqué après le premier import survit à `update()`, ou est-il écrasé par un ré-import brut ?
- Documenter la réponse avec preuve réelle (log + constat visuel), pas seulement par déduction de la doc.

### 2. (Axe 2 — ne s'ouvre qu'après le go/no-go de l'étape 1) RÉVISÉ le 28/09/2026 (Architecte, suite au recadrage FJD) — Vérifier le pont de pilotage, pas la compatibilité d'un panneau d'affichage

**MIS DE CÔTÉ le 29/09/2026 (décision FJD) — différé, réservé, PAS abandonné.** La condition d'ouverture est **techniquement levée** (le go/no-go de l'étape 1 est tombé), mais FJD **ne l'ouvre pas** : ce point ne concerne que **GREP / gabarits PDF / suivi de fabrication** — pas « relancer le pipeline après modification du `.md` », cas couvert **sans aucun pont**. Tout ce qui suit est donc conservé comme **état de la recherche au 28/09/2026 : ni validé, ni clos, non instruit**.

**Ce que ce point vérifiait avant recadrage** (périmé, conservé en historique) : compatibilité d'un panneau UXP d'affichage de liens avec le code ExtendScript existant.

**Ce qu'il vérifie maintenant** : FJD a précisé que la cible n'est pas un panneau qui affiche des liens, mais un **bot qui pilote InDesign** — génère et lance des requêtes GREP sur des scopes resserrés, interprète des gabarits PDF de couvertures, interprète des messages de suivi de fabrication. Le point dur n'est donc plus « UXP peut-il afficher un lien », mais **« comment un process externe (le bot) exécute-t-il des actions dans InDesign »** — c'est une question de **transport/pont**, pas d'UI.

Sous-questions à trancher par mesure, pas par lecture seule (cf. recherche déjà engagée par DS dans le ROADMAP, section Mission 04) :
- **`app.doScript()` est-il exposé côté UXP**, et avec quelle signature — permettrait d'exécuter du code ExtendScript classique déclenché depuis un plugin UXP, donc depuis le bot.
- **`findGrep` (recherche/remplacement GREP) est-il disponible dans le DOM UXP** — condition nécessaire pour le premier cas d'usage cité par FJD (requêtes GREP sur scopes resserrés).
- **Le pont réseau UXP (WebSocket/`fetch`) est-il fiable pour ce projet** — DS a déjà trouvé un bug WebSocket **spécifique à Windows InDesign** (versions 20 à 2025, corrigé en InDesign 2026 seulement) : à characteriser précisément (quelle version InDesign minimale viser côté Windows, ou repli nécessaire si la cible de déploiement inclut une version antérieure à 2026).
- **Statut réel de CEP** (Chromium Embedded Extension) comme pont alternatif — en fin de vie annoncée, à confirmer si c'est encore une option viable ou définitivement à écarter.
- **Alternative sans pont réseau** : polling fichier ExtendScript pur (le bot écrit des fichiers, un script InDesign les lit périodiquement ou au déclenchement) — reprend et renforce le mécanisme déjà évoqué au point 3 ci-dessous, qui devient d'autant plus pertinent que le pont réseau s'avère fragile côté Windows.
- Quel est le coût réel de chaque option (ampleur de développement, pas jugement de valeur) : structure de projet UXP + pont réseau, vs script ExtendScript avec polling fichier, vs CEP si encore viable.

**Conséquence sur l'architecture UI** : puisque la cible n'est plus un panneau d'affichage riche, la question « UXP avec ou sans WebView » perd une partie de son enjeu — un bot pilote, il n'a pas besoin d'une interface HTML complexe. Ça ne disqualifie pas WebView pour autant si un jour une UI de supervision du bot est voulue, mais ce n'est plus le critère dimensionnant du choix technique.

### 3. (Axe 1 · voie B — le plancher garanti, disponible sans condition) Vérifier si un mécanisme "maison" (sans UXP, sans `place()`/`Link` natif) est réaliste

**PROMU le 29/09/2026 : ce n'est plus un plancher de repli, c'est LA voie retenue** (la voie A est écartée par mesure). Ce point **quitte donc le statut de « point à vérifier »** pour devenir une **mission d'implémentation** ⇒ [**Mission 05**](mission_05_voie_b_empreinte_md.md). Ce qui suit est conservé comme **formulation d'origine** (l'identifiant historique ne se réécrit pas) ; la version à jour, avec ses 4 temps (V1 empreinte / V2 persistance / V3 comparaison / V4 réaction) et ses critères de sortie, est la **Mission 05**.

- Le script ExtendScript actuel pourrait-il, à chaque lancement, comparer un timestamp/hash du `.md` source (stocké dans les métadonnées du document InDesign, comme le mapping l'est déjà via `saveMappingToDocument()`/`loadMappingFromDocument()`) à l'état du fichier sur disque, et alerter l'utilisateur par une simple boîte de dialogue si le fichier a changé depuis le dernier import ?
- Ce mécanisme n'aurait pas l'icône native du panneau Liens, mais serait scriptable à 100% en ExtendScript pur, sans nouveau framework à apprendre.

### 4. (Étape 3 — jamais avant les étapes 1 et 2) Recommandation — RÉVISÉ le 28/09/2026 (Architecte, suite au recadrage)

**SUITE DONNÉE le 29/09/2026, dans un périmètre réduit.** La recommandation ne porte plus sur « quel **pont** retenir » (axe 2 **mis de côté**) mais sur **la voie B**. Le périmètre écrit est devenu la [**Mission 05**](mission_05_voie_b_empreinte_md.md). La liste de ponts qui suit est **conservée pour mémoire** : état au 28/09/2026, **non instruit**.

Une fois les points 1 à 3 vérifiés par mesure (pas avant), formuler une recommandation argumentée sur le **pont de pilotage** à retenir pour le bot, parmi les options identifiées à ce jour :
- **Pont réseau UXP** (WebSocket/`fetch`) — fragile historiquement sous Windows (bug corrigé seulement en InDesign 2026), à ne retenir que si la cible de déploiement exclut les versions antérieures, ou si un repli est prévu.
- **`app.doScript()` depuis UXP**, si sa disponibilité est confirmée — permettrait d'exécuter de l'ExtendScript classique déclenché par le bot sans dépendre d'un pont réseau propre.
- **Polling fichier ExtendScript pur** (point 3, renforcé par la fragilité du pont réseau) — le bot écrit des fichiers, un script InDesign les lit périodiquement ; aucune dépendance à UXP ni à un transport réseau, mais latence de polling à accepter.
- **CEP**, seulement si son statut de fin de vie n'empêche pas un usage à l'horizon de ce projet.

La recommandation doit tenir compte de l'ampleur du chantier déjà en cours (mission 03) et du fait que ce projet est piloté par FJD seul avec des Ouvriers IA, pas une équipe de développement dédiée — privilégier l'option la plus simple à maintenir et la moins exposée aux régressions cross-platform déjà documentées (Cas 38 du wiki), sauf si un besoin fonctionnel précis impose le pont réseau.

## Méthode de travail attendue
- Même rigueur que sur la mission 03 : vérifier la doc officielle avec citation exacte avant toute affirmation, test réel avant toute conclusion, ne jamais deviner un comportement.
- Si un point ne peut pas être tranché sans un vrai test dans InDesign, le signaler comme tel plutôt que de spéculer.
- Documenter au wiki (nouveau cas) toute découverte réutilisable au-delà de cette mission.
- Ne pas coder de solution définitive — cette mission est un audit qui doit permettre à FJD de choisir une direction, pas un livrable fonctionnel.

## Hors périmètre
- Toute implémentation de la feature elle-même (reportée à une mission 05 une fois la direction choisie). **Mise à jour du 29/09/2026 : la direction est choisie** (voie B) et la mission 05 est **écrite** ⇒ [mission_05_voie_b_empreinte_md.md](mission_05_voie_b_empreinte_md.md). **Cette mission 04 n'implémente rien** — elle reste un audit.
- **L'axe 2 / le bot, et tous les ponts candidats** — **mis de côté le 29/09/2026** (différé, réservé, pas abandonné).
- Toute modification du code des étapes 2-8 de la mission 03, en cours.

## Rapport d'exécution — CR 04, étape 1 (préambule cross-platform, 28/09/2026)

**Périmètre traité** : le préambule obligatoire uniquement. Points 1 à 4 (**non** commencés).

**Ce qui a été fait**
1. Vérification indépendante des 4 preuves de la première passe de l'Architecte : 2 confirmées (dont une **enrichie** de 3 preuves supplémentaires), 1 **requalifiée** (le signal Windows 11/Photoshop n'a pas été retrouvé tel quel), 1 **retirée** faute de source datée (InDesign 19.4 HFS→POSIX — non citable en l'état).
2. Recherche communautaire élargie (forums développeurs Adobe, flux Discourse) : **7 sujets datés** retenus et cités avec URL exacte, dont **le sujet qui pose littéralement la question du préambule** (topic **6650**, *Operating system specific problems with InDesign APIs?*, 2023-08-09).
3. Rédaction du **verdict tranché** (section « Deuxième passe », C.) et extension aux chemins ExtendScript `File`/`Folder` (D.), puis conséquences sur les points 1-4 (E.).

**Preuve principale — le topic 6650 (le plus proche de notre question)**
- Ouvert le 2023-08-09 par Zuri Klaschka ; **Adobe a répondu et confirmé un bogue**.
- Citation OP : *« I haven't used anything that would justify a difference of behavior between operating systems »* — et pourtant *« the described flow works without any issues on Windows »* alors que le même code gelait sur Mac.
- Citation Adobe (Anoop B Valomkot, 2023-08-21) : *« Your plugin just happened to uncover a **random bug on Mac related to event loop processing**. »*
- **Enseignement** : une divergence par OS peut apparaître sur du code **sans aucune dépendance OS** — donc **non prévisible par lecture du code**.

**Verdict (formulation retenue, non simplifiable)**
> Un seul code source, une seule surface d'API, une seule chaîne de distribution — **mais** des différences de comportement par OS réelles, datées, officiellement reconnues, ni marginales ni systématiques.

- **L'inquiétude « dialectes séparés à la 2001 » est LEVÉE** : pas de compilation séparée, pas de `#ifdef`, un seul arbre de sources.
- **La parité n'est PAS acquise** : trois familles divergentes documentées — (a) **WebView bi-moteur** (WebView2/Windows vs WKWebView/macOS, cité noir sur blanc dans le changelog UXP 9.1) ; (b) **chemins de fichiers** (UNC, lecteurs réseau, noms accentués — correctif UXP 9.4 + topics 7342, 7713) ; (c) **focus clavier / raccourcis** (topic 12145 sur InDesign 21.2 Windows 11).
- **Honnêteté bidirectionnelle** : des bogues **macOS-only** existent aussi (topic 6650 confirmé par Adobe ; topic 12104, Photoshop, 2026-08-19). Mon échantillon est **biaisé** par mes requêtes orientées Windows — je ne conclus **pas** à une répartition quantitative.
- **3ᵉ variable** : le comportement dépend de **(OS × version UXP × version InDesign)**, UXP étant versionné indépendamment du host (9.4.0 dans **aucun** host GA ; 9.3.0 ↔ InDesign 21.4 seulement).

**Limite méthodologique signalée** : **aucune machine Windows sur ce poste**. Le verdict repose sur documentation officielle + retours communautaires datés, **jamais** sur une mesure personnelle. Un plan de test mono-OS ne suffit pas pour Windows — risque projet à remonter à FJD (point E.4).

**Non fait (volontairement)** : points 1 à 4. Le **cas wiki 37** (mécanismes de lien, cf. ci-dessous) a en revanche été **ajouté le 28/09** sur décision de FJD — le report à la clôture prévu initialement ne s'applique plus à ce cas ; le cas 6650 (diagnostic générique) reste, lui, à porter au wiki.

**Validation attendue de FJD** : (1) le verdict du préambule est-il ratifié comme base de la suite ? (2) la réserve « UXP sans WebView » (point E.2) doit-elle être inscrite comme critère du point 4 ? (3) le risque « pas de machine Windows pour tester » est-il accepté, ou faut-il le traiter avant les points 1-4 ?

---

## Rapport d'exécution — CR 04, étape 2 (complément d'audit documentaire, 28/09/2026)

**Périmètre traité** : vérification externe de la couverture `place()` / `Link` / import de texte (demandée par FJD), puis intégration au présent fichier. Points 1 à 4 toujours **non commencés**.

**Ce qui a été fait**
1. Vérification de l'object model sur le miroir `indesignjs.de` (build **InDesign 2026 / 21.5.1.73**, fichiers Adobe datés **2026-09-21**), une page de classe à la fois.
2. **Confirmation** des constats 1 et 2 (`Story.itemLink`, `Link.filePath`/`status`/`update()`), avec extraits verbatim.
3. **Découverte de 3 mécanismes manquants** : `InsertionPoint.createTextFragmentLink()`, `placeAndLink()` (`Document`/`Page`/`Spread`/`MasterSpread`/`EndnoteTextFrame`), `Story.linkedStoryOptions`.
4. **Correction d'une affirmation trop forte** : « notre insertion ne peut *structurellement* pas créer de `Link` » → « ne crée aucun `Link` par elle-même ».
5. **Deux faits négatifs** établis : le réglage « Create Links When Placing Text » n'est pas dans `linkingPreferences`/`wordRTFImportPreferences` (fait A) ; le mapping de styles n'est pas dans `WordRTFImportPreference`/`TaggedTextImportPreference` (fait B).

**Statut des vérifications** : **documentaires uniquement** — aucun test réel, aucune implémentation. La signature complète de `createTextFragmentLink()` et le statut de dépréciation de `placeAndLink()` restent **à vérifier** (réserves explicites dans la section « Complément d'audit documentaire »).

**Conséquence** : le point 1 doit désormais être testé **sur un lien créé par nous** (`createTextFragmentLink()`), pas seulement sur un lien issu du Placer natif. Une **sonde runtime** a été ouverte en sous-mission pour porter cette mesure : `COMMUNICATION/mission_04bis_sonde_lien_runtime.md`. Le **cas wiki 37** a été créé (mécanismes de lien, cf. `doc/wiki_extendscript_indesign.md`).

**Validation attendue de FJD** : (1) le complément d'audit documentaire est-il ratifié comme base du point 1 ? (2) la correction de l'affirmation est-elle acceptée telle quelle ? (3) le périmètre de la sonde runtime (`mission_04bis_sonde_lien_runtime.md`) est-il conforme à l'intention ?

---

## Rapport d'exécution — CR 04, clôture décisionnelle (29/09/2026)

**Statut** : 🟡 PARTIELLE — **close sur le plan décisionnel** : toutes les décisions que cette mission devait produire sont prises ; **aucune mesure ni implémentation ne reste à faire ici**.

**Ce qui a changé ce jour**
1. **Étape 1 exécutée en réel** (sondes `04bis` puis `04ter`, exécuteur DS) : **verdict tombé, voie A écartée par mesure**. Les CR détaillés des deux sondes sont conservés dans leurs blocs archivés (`RMA/2026-09.md`) ; le fichier `mission_04bis`/`mission_04ter` reste accessible à côté du présent fichier.
2. **Go/no-go prononcé** ⇒ **bifurcation vers la voie B**.
3. **Étape 2 (décision)**, une décision par axe : **axe 1 = voie B** (retenue) ; **axe 2 = mis de côté** — différé, réservé, **pas abandonné** (décision FJD du 29/09/2026 : « on met de côté le bot »).
4. **Étape 3 (périmètre)** : écrit, et devenu la [**Mission 05**](mission_05_voie_b_empreinte_md.md) — implémentation de l'empreinte maison du `.md` en métadonnées du document.

**Ce que cette mission ne fait PAS et ne fera pas** : elle **n'implémente rien** (elle reste un audit), elle **ne rouvre pas la voie A** (close par mesure), elle **n'instruit aucun pont** (axe 2 mis de côté), et elle **ne traite pas le *diff* sémantique** (besoin distinct, nommé en Mission 05 comme hors périmètre).

**Réserve transmise** : le **risque « aucune machine Windows pour tester »** reste **accepté mais entier** (arbitrage FJD du 28/09). Il **migre** de la famille « WebView bi-moteur » vers la famille « transports et chemins » — il **ne s'efface pas**. Il resurgira dès que l'axe 2 (ou toute mesure cross-platform) sera rouvert. La **voie B**, elle, est **peu exposée** : ExtendScript pur, mais son empreinte repose sur `File.modified`/`File.length`, dont la **fiabilité par OS est à vérifier** (c'est une des questions à instruire de la Mission 05).

**Validation attendue de FJD** : (1) cette clôture décisionnelle de la mission 04 est-elle acceptée (statut 🟡 PARTIELLE conservé, la mission n'étant pas archivée) ? (2) la mise de côté de l'axe 2 est-elle bien comprise comme **différé/réservé** et non comme un abandon ?


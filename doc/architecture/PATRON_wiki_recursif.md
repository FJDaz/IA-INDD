# Patron du wiki récursif — de 35 cas à une base documentaire interrogeable

**Statut** : proposition d'architecture (rédigée le 28/09/2026). Document de pilotage, à
valider par FJD / à organiser par Claude.
**Portée** : le projet INDD/IMPORT_MD d'abord, mais le patron est conçu **projet-indépendant**
— il vise explicitement la réutilisation sur d'autres projets documentaires, présents ou à venir.
**Nature du document** : ce n'est pas un cas du wiki et ce n'est pas de la documentation
technique ExtendScript. C'est la **règle d'organisation** du wiki lui-même et de sa croissance.

---

## 0. Le problème posé (en une phrase)

Un wiki de cas techniques grossit de façon **non gabarîée** ; passé un certain volume il devient
difficile à retrouver, impossible à interroger par une machine, et chaque nouvelle entrée coûte
plus cher à ranger qu'à écrire. La question n'est donc pas « faut-il un RAG », mais
**quel est le plus petit acte à faire maintenant qui ne ferme aucune porte plus tard**.

Réponse retenue : **un gabarit d'entrée à champs balisés** (É1) + **des identifiants immuables**.
Tout le reste s'en déduit.

---

## 1. État mesuré du wiki (28/09/2026)

> **Rafraîchissement du 29/09/2026** : état courant = **1 412 lignes / 42 cas** (cas 41, 42 et 43 ajoutés le 29/09), dont **6 cas lourds** (24, 31, 34, 35, 36, 37 = 422 lignes ≈ **30 %**). Le tableau ci-dessous est la **photographie du 28/09/2026**, conservée telle quelle comme mesure datée.

Faits vérifiés, pas des impressions :

| Mesure | Valeur |
|---|---|
| Fichier | `doc/wiki_extendscript_indesign.md` |
| Lignes | **969** |
| Cas | **35** (numéros 00 → 36, **trous 11 et 15**) |
| Cas de 10–20 lignes | 30 cas |
| Cas lourds (> 50 lignes) | **5** : 24, 31, 34, 35, 36 → **369 lignes ≈ 42 % du total** |
| Cas portant une URL | **2** : Cas 31, Cas 34 |
| Cas citant une source **en prose sans URL** | ~9 : Cas 09, 14, 17, 23, 26, 27, 30, 35 (+ Cas 00 pattern) |
| Sommaire | annonce « 34 cas », **Cas 36 absent**, index thématique seul |

**Diagnostic.** Le wiki n'a pas un problème de **taille**, il a un problème de **structure**.
Deux symptômes le prouvent :

1. Le seuil « sommaire + liens » que l'on croyait à venir (700–900 lignes) est **déjà franchi**
   et le sommaire est **déjà périmé**. L'échelle n'est pas en avance, elle est **en retard d'un cran**.
2. **42 % du contenu tient dans 5 cas** qui sont, pour 4 d'entre eux, la même saga (« les menus »).
   Ce n'est pas de la croissance, c'est de la **non-factorisation** — c'est exactement le
   « moyen insidieux » : le volume n'explose pas, la redondance s'installe.

---

## 2. Le principe récursif — la boucle de production

Le wiki n'est pas un livrable, c'est un **mécanisme** : il est consulté avant, nourri après.

```
    (1) CONSULTER le wiki  ──────────────┐
            │                            │
            ▼                            │
    (2) MISSION / code                   │
            │                            │
            ▼                            │
    (3) Difficulté ?                     │
         ├── non → (4)                    │
         └── oui → doc vendeur            │
                   (citation exacte      │
                    + URL + date)        │
                   puis (4)              │
            │                            │
            ▼                            │
    (4) RENSEIGNER / ENRICHIR le wiki ───┘
```

**Règle de bouclage (rendre la boucle mesurable, pas déclarative).**
Tout bloc de mission porte désormais **deux champs obligatoires** :

```markdown
**Cas wiki consultés** : Cas NN, Cas NN (ou « aucun — aucun cas voisin »)
**Cas wiki produits/enrichis** : Cas NN créé | Cas NN complété (ou « aucun — cas non mûr »)
```

Une mission qui ne coche ni l'un ni l'autre est une mission qui **n'a pas bouclé** : soit elle
n'a rien appris (autorisé, mais à dire), soit elle a appris et ne l'a pas capitalisé (défaut).

**Le réflexe n°1 du wiki est incomplet aujourd'hui.** Il dit « laisser une trace citable » et
renvoie en exemple aux **Cas 09, 14, 17 — qui n'ont précisément aucune URL**. Tant que ce
exemple n'est pas corrigé, la règle n'est pas crédible. C'est l'objet de la rétrodoc (§ 7).

---

## 3. Les 4 horizons — avec déclencheurs mesurables

Chaque horizon a un **déclencheur chiffré**. On ne passe pas à l'horizon suivant « quand ça
semble utile », on y passe quand la mesure le dit.

| Horizon | Déclencheur | Acte | Coût |
|---|---|---|---|
| **É0 — MD simple** | *dépassé* | — | — |
| **É1 — GABARIT** | **maintenant (imposé)** | squelette de cas + 3 champs balisés (§ 4) | faible, purement rédactionnel |
| **É2 — SOMMAIRE enrichi** | **maintenant (969 > 900)** | résumé par cas + statut source + index symptôme | faible, mécanique |
| **É3 — FACTORISATION** | 3 répétitions d'un même bloc, **ou** 1 cas > 150 lignes | annexes Sources / Environnement / Patterns ; les cas **référencent** | moyen |
| **É4 — MULTI-FICHIERS** | > 2 000 lignes **ou** > 60 cas | 1 fichier par famille + index | moyen |
| **É5 — BASE LOCALE STRUCTURÉE** | « grep ne suffit plus » (§ 6) | front-matter par cas → recherche locale *(base doc ｜ ontologie ｜ actions) × contrat de données* | élevé |
| **É6 — EN LIGNE / API** | hors de vue aujourd'hui | service interrogeable, multi-projets | élevé, réversible |

### Ce qu'on fait dès maintenant (É1 + É2)

**É1 — le gabarit de cas.** Chaque cas, à partir d'aujourd'hui, suit ce squelette, avec
**3 champs balisés** (les seuls que la machine lira un jour) :

```markdown
## Cas NN — <titre factuel>

**Thème** : <langage | modèle texte | styles | parsing | tables | menus | méthode>
**API / objet visé** : <Paragraph.style, ScriptMenuAction.addEventListener, …>
**Statut source** : sourcé | mesuré | à sourcer
**Build de référence** : InDesign 21.x (fr_FR, macOS)

**Contexte** : …
**Symptôme** : …
**Cause** : …
**Ce que dit la doc** : « citation exacte » — *source* : <URL> (consultée le JJ/MM/AAAA)
**Solution** : …
**Portée** : <quand ce cas se reproduit ailleurs>
```

Les 3 champs balisés — `Thème`, `API / objet visé`, `Statut source` — sont ce qui rendra
possibles la factorisation (É3) puis l'indexation (É5). **Ils sont migrables mécaniquement** :
un script pourra les lire pour générer un front-matter YAML le jour venu.

**É2 — le sommaire enrichi.** Trois ajouts :

- En-tête du fichier : `nb de cas`, `build InDesign de référence`, `date de dernière revue`.
- Par cas dans le sommaire : **une ligne de résumé** (pas seulement le titre) + **statut source**.
- **Index double** : « par thème » (existant) **et** « par symptôme » — on cherche une erreur
  par ce qu'on a vu à l'écran, pas par le concept qu'on devrait connaître.

**Règle de numérotation (immuable).** Numérotation **ascendante**, **jamais de renumérotation**.
Les trous 11 et 15 **restent troués** et sont documentés comme tels. Toute renumérotation casse
les ancres, les citations et — le jour venu — les identifiants d'API. Ce n'est pas de l'esthétique,
c'est la **clé de voûte** de tout ce qui suit (§ 5).

---

## 4. Bientôt — É3 (factorisation) : ce qu'on sait déjà devoir extraire

Déclencheur quasi atteint (Cas 31/34/35/36 se répètent). Trois annexes suffiraient :

- **Annexe A — Sources canoniques** : une ligne par source (URL valide + citation + date + build).
  Les cas **référencent** `[A-n]` au lieu de recopier la citation.
- **Annexe B — Environnement mesuré** : chemins réels, versions, dossiers (`Startup Scripts`,
  `Scripts Panel`), journal de logs. Aujourd'hui recopiés dans plusieurs cas.
- **Annexe C — Patterns de code validés** : logging fichier, handler `File`, module partagé
  `$.evalFile`, création de table.

**Bénéfice direct** : les 5 cas lourds (42 % du fichier) se réduisent d'eux-mêmes, car leur poids
vient de la **répétition**, pas de la complexité.

---

## 5. L'API structurée en ligne de mire — ce qu'on anticipe et ce qu'on refuse d'anticiper

### La distinction qui commande tout

- **Avoir une API** (exposer un service) : **non, prématuré.** À 35 cas, ce serait disproportionné.
- **Être prêt pour une API** : **oui, et quasi gratuit maintenant.** Ce n'est pas un chantier
  technique, c'est une **discipline d'écriture**.

La cible É5/É6 est donc assumée ; le **travail** É5/É6 ne l'est pas.

### Le geste d'anticipation décisif : l'identifiant stable

Une API manipule des **identifiants**, jamais des **positions**. Aujourd'hui un cas n'existe que
comme « Cas 28 », ancré sur son titre : **tout renommage casse la référence**.

La bonne nouvelle : **le numéro est déjà un identifiant stable — à une seule condition : ne
jamais renuméroter.** Graver cette règle (§ 3) **est** l'anticipation. Coût : nul.

### Ce qu'on refuse d'anticiper — et pourquoi c'est un choix, pas une paresse

| À anticiper | À NE PAS anticiper |
|---|---|
| les **champs** (thème, API, statut source) | le **moteur** (Chroma, Qdrant, embedding) |
| l'**identifiant** stable | le **transport** (HTTP, serveur, UI) |
| la **migrabilité** du gabarit | le **format** de stockage cible |

Raison : le choix de la technologie est **réversible** ; le choix des **données** ne l'est pas.
**On ne paie que l'irréversible.**

### Le piège à éviter explicitement

Mettre un **front-matter YAML en tête de chaque cas aujourd'hui** serait une erreur : coût de
réécriture des 35 cas, risque de casser les ancres, **bénéfice immédiat nul** (grep suffit).
Décision retenue : **ne pas le faire**, mais choisir le gabarit tel que le front-matter puisse
être **ajouté mécaniquement plus tard**, par script, à partir des champs balisés. On prépare la
migration sans la payer.

### Formulation à retenir

> Un wiki **structuré** est déjà une base de données dont le Markdown est l'interface humaine.
> Le RAG n'est qu'**une des façons** de la lire.

C'est pourquoi les deux sillons — wiki INDD (prose) et contrat de données externe
(`docs/architecture/contrat/3_branchement.yaml`, donnée nativement structurée, LinkML) —
**convergent sur É1, pas sur un moteur**. L'un est né structuré, l'autre doit le devenir.

---

## 6. Le plus tard ici (É4/É5) — quand les cas deviennent « exploitables machine »

Réponse nette : **jamais tout seuls. Il faut un acte explicite.** Trois conditions, dans l'ordre.

1. **Champs balisés** (§ 4). Tant que c'est de la prose, aucune machine ne peut extraire
   « quels cas concernent `ParagraphGenerator` ». Condition **nécessaire**, purement rédactionnelle.
2. **Identifiant stable + statut source normalisé + tags** (thème / symptôme / API visée).
   Là, on sait répondre à : « tous les cas menus », « tous les non sourcés », « tous ceux de plus
   de 6 mois ».
3. **Le volume le justifie.** Point qu'on saute toujours : **en dessous de ~100 cas, un `grep`
   bien conçu sur un fichier bien structuré *est* le RAG.** Un RAG local à 35 cas coûte plus cher
   (embeddings à maintenir, désynchronisation à chaque édition) qu'il ne rapporte.

### Le vrai déclencheur n'est pas « on veut un RAG », c'est « grep ne suffit plus »

Signes concrets, vérifiables :

- Je ne retrouve plus un cas par recherche textuelle (vocabulaire trop varié).
- Je dois faire des requêtes **croisées** (« à la fois menus *et* handler »).
- Je dois interroger **plusieurs wikis de projets** ensemble.

Le basculement est le passage du **lexical** au **sémantique**. La sémantique n'a d'intérêt que
quand le vocabulaire diverge du mien — donc quand plusieurs plumes/agents écrivent, ou quand le
corpus dépasse ce qu'on tient en tête. **On n'y est pas.**

---

## 7. Le plus tard en ligne (É6) — hors de vue, mais non fermé

À É6 on expose un service. Rien de ce qui est proposé ici ne le prépare techniquement, et c'est
volontaire. Ce qui le rend **possible** :

- des **identifiants** stables (§ 5) ;
- une **donnée balisée** (§ 4) ;
- des **sources traçables** avec date et build (§ 8), donc une politique de rafraîchissement ;
- une **règle d'admission** qui empêche le corpus de se remplir de bruit (§ 8).

Autrement dit : É6 n'a pas besoin d'être anticipé **techniquement**, seulement **documentairement**.
C'est É1 qui le rend possible, et É1 coûte presque rien.

### 7bis. Horizon ajouté le 28/09/2026 — partage à des tiers (élèves, stagiaires)

FJD envisage un partage du wiki au-delà de son propre usage : élèves, stagiaires — **en lecture
d'abord**, puis potentiellement **en écriture** via un système de modération (mention : « via Jev
par exemple ») et un **contrat d'écriture** explicite. Horizon jugé long terme mais susceptible
d'arriver **plus tôt que prévu** — à documenter maintenant, pas à construire maintenant.

**Ce que cet horizon confirme sans rien changer à É1-É6** : la numérotation immuable et les
identifiants stables (§ 5) deviennent encore plus nécessaires — un tiers doit pouvoir référencer
« le Cas 17 » de façon fiable, y compris des mois après sa propre contribution.

**Ce que cet horizon ajoute, non couvert par É1-É6 tel qu'écrit** : la distinction lecture/écriture
n'existe pas encore dans le patron actuel, qui suppose un unique cercle de contribution (FJD +
agents). Un usage ouvert à des tiers introduirait un besoin de :
- un champ **Origine** par cas (FJD | agent | contribution externe), distinct du `Statut source`
  déjà prévu (qui parle de la fiabilité de la citation, pas de qui a écrit le cas) ;
- un **état de contribution** (proposé → validé → publié), avec un rôle de modérateur qui tranche ;
- un **contrat d'écriture** (règles de forme et de fond qu'une contribution externe doit respecter
  avant validation) — à écrire le jour où le besoin devient concret, pas avant.

**Décision de méthode, cohérente avec le principe anti-anticipation (§ 5)** : ne rien construire
de ceci maintenant. Le geste utile aujourd'hui est de **documenter l'horizon**, pour que les choix
d'É1-É2 déjà faits (gabarit, numérotation) ne ferment pas cette porte plus tard — ce qui est déjà
le cas, puisqu'un champ `Origine` s'ajouterait au gabarit existant sans le casser.

---

## 8. Anti-bloat — nommer l'ennemi

Le danger n'est pas la taille, c'est **l'entrée non filtrée**.

**Règle d'admission — 3 conditions cumulatives.** Un cas n'entre que s'il est :

1. **reproductible** (on peut le remontrer),
2. **coûteux** (il a réellement consommé du temps de debug),
3. **transférable** (il resservira sur un autre projet/script).

« J'ai utilisé l'API comme documenté » **n'entre pas**. Ce qui entre, c'est la **surprise**.

**Politique de péremption.** Toute citation porte `consultée le` + `build`. Un changement de build,
ou plus de **6 mois** sans revérification → **drapeau « à revérifier »** sur le cas. C'est
l'assurance-vie de la traçabilité : une documentation sourcée mais périmée est plus dangereuse
qu'une documentation honnêtement non sourcée.

---

## 9. Où vit chaque chose (séparation du transférable et du projet)

Règle : **le wiki porte le savoir transférable** (fait d'API reproductible ailleurs) ; **la
mission ou la doc d'architecture porte le spécifique projet**.

Application immédiate : les Cas 31/34/35/36 mélangent les deux.

| Contenu | Destination |
|---|---|
| « seul un handler `File` survit à la fin du script » | **wiki** (fait durable) |
| « une `ScriptMenuAction` ne survit pas au redémarrage » | **wiki** (fait durable) |
| « un script dans `Startup Scripts` s'exécute au lancement » | **wiki** (fait durable) |
| l'implémentation de **notre** loader (`import_md_loader.jsx`) | **doc/architecture** |

**Arborescence cible du dossier `doc/` :**

```
doc/
├── wiki_extendscript_indesign.md      # les CAS (savoir transférable)
├── METHODE_wiki_recursif.md           # ce document, version projet-indépendante (§ 11)
└── architecture/
    ├── PATRON_wiki_recursif.md        # ce fichier : règles + échelle + horizons
    ├── ARCHI_import_md.md             # modules réels : import_md.jsx, _menu.jsx, _loader.jsx
    └── BOUCLE_production.md           # conventions de mission (consultation/documentation)
```

---

## 10. Rétrodoc (mission 03bis) — position

Le tri en 2 catégories de la mission est conservé, **avec une 3ᵉ famille reconnue** : la
« source citée en prose sans URL » (≈ 9 cas) est classée **cat.1** — sinon le réflexe n°1 reste
un vœu pieux.

- **cat.1 — « API nommée » → URL due** : ≈ 20 cas (dont Cas 31/34 déjà sourcés).
- **cat.2 — « découverte par mesure » → pas d'URL due** : ≈ 15 cas.
- **Volume réel à sourcer : ≈ 18 cas** — c'est le critère de fin honnête.

**Sources par nature de fait** : langage ES3 (Cas 01, 07, 08, 32, 33) → **ECMA-262 3ᵉ éd.** et
**MDN** (pas Adobe) ; DOM InDesign → **indesignjs `/indesignapi/`**.

**Règle anti-fabrication.** Pour chaque cas cat.1 : ouvrir réellement la page, vérifier **HTTP
200** (jamais les URL 404 bannies), copier la **phrase exacte**. Si la source est introuvable →
**ne pas fabriquer** : basculer le cas en cat.2 avec la mention « source non retrouvée, fait
confirmé par mesure ».

**Plan d'exécution en 4 lots**, du sûr au long : **A** cadre (réflexe n°1 + définitions +
compteurs) · **B** langage/ES3 · **C** DOM InDesign · **D** constat cat.2 (une ligne par cas,
zéro contenu technique modifié). Traçabilité dans le fichier de mission 03bis.

---

## 11. Usages à mettre DÈS MAINTENANT dans les mémoires des agents

Ces blocs sont prêts à copier dans la mémoire persistante des agents (règle § 0 des projets FJD :
ce qui doit survivre à une reprise doit être écrit, pas recollé).

### 11.1 Bloc « patron wiki récursif » (projet-indépendant)

```markdown
# Patron wiki récursif — TOUS PROJETS (source : INDD/doc/architecture/PATRON_wiki_recursif.md)

## La boucle (obligatoire)
1. CONSULTER le wiki avant mission → 2. coder → 3. difficulté ? → doc vendeur
(citation EXACTE + URL + date + build) → 4. RENSEIGNER le wiki.

## Champs de mission obligatoires
- **Cas wiki consultés** : ... (ou « aucun — aucun cas voisin »)
- **Cas wiki produits/enrichis** : ... (ou « aucun — cas non mûr »)
→ Une mission sans ces 2 champs n'a pas bouclé.

## Gabarit de cas (3 champs balisés = lisibles machine un jour)
**Thème** : ... | **API / objet visé** : ... | **Statut source** : sourcé|mesuré|à sourcer
Puis : Contexte · Symptôme · Cause · Ce que dit la doc (citation+URL+date) · Solution · Portée

## Règle d'admission (3 conditions cumulatives)
reproductible ET coûteux (vrai temps de debug) ET transférable. « API utilisée comme
documenté » n'entre pas. Ce qui entre = la SURPRISE.

## Numérotation IMMUABLE
Ascendante, jamais de renumérotation. Les trous restent troués. Le numéro = identifiant
stable (clé de voûte d'une future API). Renommer un titre = casser les références.

## Péremption
Toute citation porte `consultée le` + build. Build changé ou > 6 mois → drapeau « à revérifier ».

## Échelle (déclencheurs chiffrés)
É1 gabarit : maintenant | É2 sommaire enrichi : > 900 lignes | É3 factorisation :
3 répétitions ou 1 cas > 150 lignes | É4 multi-fichiers : > 2000 lignes ou > 60 cas |
É5 base locale : « grep ne suffit plus » | É6 en ligne/API : hors de vue.

## Anti-anticipation
Anticiper les DONNÉES (champs, IDs, migrabilité), jamais la TECHNOLOGIE (moteur, transport).
Le technologique est réversible, la donnée ne l'est pas. En dessous de ~100 cas,
un grep bien conçu EST le RAG.
```

### 11.2 Bloc « conventions de boucle INDD » (spécifique projet)

```markdown
# INDD/IMPORT_MD — conventions de boucle
- Wiki : doc/wiki_extendscript_indesign.md (35 cas au 28/09/2026, trous 11 et 15 assumés).
- Gabarit de cas : 3 champs balisés obligatoires (Thème, API visée, Statut source).
- Toute mission porte « Cas wiki consultés » + « Cas wiki produits/enrichis ».
- Toute citation : URL valide (HTTP 200 vérifié) + phrase EXACTE + date + build.
  NE JAMAIS citer : indesignjs.de/extendscriptAPI/indesign/ScriptMenuAction.html (404)
  ni helpx.adobe.com/indesign/using/scripts.html (404).
- ES3 : source = ECMA-262 3e éd. / MDN, pas Adobe.
- Ne pas créer/modifier quoi que ce soit dans les dossiers Adobe de FJD sans le signaler.
- CR inline dans le bloc de mission (ROADMAP/journal), jamais de cr_mXXX_*.md séparé.
- Un commit par sujet, seulement après validation réelle de FJD.
```

---

## 12. Synthèse en une page

| Horizon | Acte | Déclencheur |
|---|---|---|
| **Maintenant** | É1 gabarit + É2 sommaire + règle de numérotation + champs de boucle en mission | imposé (969 lignes, déjà en retard) |
| **Bientôt** | É3 factorisation : annexes Sources / Environnement / Patterns | 3 répétitions ou 1 cas > 150 lignes |
| **Plus tard ici** | É4 multi-fichiers, puis É5 front-matter + recherche locale | > 2000 lignes / > 60 cas, puis « grep ne suffit plus » |
| **Plus tard en ligne** | É6 service / API | hors de vue |
| **Ligne de mire** | API structurée | rendue possible par É1, pas par un moteur |

**Trois phrases pour retenir :**
1. Le problème n'est pas la taille, c'est la **structure** — et 42 % du wiki tient dans 5 cas
   redondants.
2. Le seul acte d'anticipation qui compte s'appelle **É1 + identifiants immuables** : il est
   presque gratuit et il ne ferme aucune porte.
3. On anticipe la **donnée**, jamais la **technologie** — et **en dessous de ~100 cas, le grep
   est le RAG**.

---

## 13. Décisions ouvertes (à arbitrer par Claude / FJD)

1. **3bis vs É1/É2** : la rétrodoc (03bis) reste-t-elle une mission distincte, ou intègre-t-elle
   le gabarit ? *Reco : 3bis = sources seules ; É1/É2 = mission distincte (un commit = un sujet).*
2. **`METHODE_wiki_recursif.md`** (socle projet-indépendant) : le créer maintenant, ou au
   premier projet qui le réclame ? *Reco : maintenant, il est déjà écrit ici (§ 11.1).*
3. **Découpage des Cas 31/34/35/36** (§ 9) : wiki = fait durable / architecture = implémentation ?
   *Reco : oui, mais à faire dans l'É3, pas maintenant.*
4. **Hébergement des blocs mémoire** (§ 11) : à écrire dans `/memories/` des agents, ou seulement
   référencés ici ? *Reco : les écrire, cf. règle § 0 des projets FJD.*

---

*Document rédigé le 28/09/2026 — proposition, en attente d'arbitrage. Aucune modification du wiki
ni du code n'a été effectuée par ce document.*

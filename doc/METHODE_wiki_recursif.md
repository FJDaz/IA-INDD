# Méthode wiki récursif — socle projet-indépendant

**Origine** : extrait du patron d'architecture `doc/architecture/PATRON_wiki_recursif.md` (rédigé conjointement par FJD et DS le 28/09/2026 sur le projet IMPORT_MD), isolé ici sous une forme réutilisable telle quelle sur tout projet portant un wiki de cas techniques.

**Portée** : ce document ne parle plus d'InDesign ni d'ExtendScript. Il décrit une règle d'organisation générale, applicable à n'importe quel wiki de cas (bugs, pièges d'API, découvertes de comportement) sur n'importe quel projet FJD.

---

## Le problème que ce patron résout

Un wiki de cas techniques grossit de façon non gabarité ; passé un certain volume il devient difficile à retrouver, impossible à interroger par une machine, et chaque nouvelle entrée coûte plus cher à ranger qu'à écrire. La question n'est pas « faut-il un RAG », mais **quel est le plus petit acte à faire maintenant qui ne ferme aucune porte plus tard**.

Réponse : un gabarit d'entrée à champs balisés + des identifiants immuables. Tout le reste s'en déduit.

## La boucle de production (obligatoire)

Le wiki n'est pas un livrable, c'est un mécanisme : il est consulté avant une mission, nourri après.

```
(1) CONSULTER le wiki avant mission
        │
        ▼
(2) MISSION / code
        │
        ▼
(3) Difficulté rencontrée ?
     ├── non → (4)
     └── oui → vérifier la doc officielle (citation exacte + URL + date + build)
               puis (4)
        │
        ▼
(4) RENSEIGNER / ENRICHIR le wiki
```

Tout bloc de mission porte deux champs obligatoires :

```markdown
**Cas wiki consultés** : Cas NN, Cas NN (ou « aucun — aucun cas voisin »)
**Cas wiki produits/enrichis** : Cas NN créé | Cas NN complété (ou « aucun — cas non mûr »)
```

Une mission qui ne renseigne aucun des deux champs n'a pas bouclé : soit elle n'a rien appris (autorisé, mais à dire explicitement), soit elle a appris et ne l'a pas capitalisé (défaut à corriger).

## Le gabarit de cas (E1 — à appliquer dès le premier cas d'un projet)

```markdown
## Cas NN — <titre factuel>

**Thème** : <langage | modèle de données | styles/config | parsing | méthode | ...>
**API / objet visé** : <nom exact de la méthode/propriété/classe concernée>
**Statut source** : sourcé | mesuré | à sourcer
**Build de référence** : <version exacte de l'environnement>

**Contexte** : …
**Symptôme** : …
**Cause** : …
**Ce que dit la doc** : « citation exacte » — *source* : <URL> (consultée le JJ/MM/AAAA)
**Solution** : …
**Portée** : <quand ce cas se reproduit ailleurs>
```

Les 3 champs balisés (`Thème`, `API / objet visé`, `Statut source`) sont ce qui rend possible, plus tard, la factorisation puis l'indexation. Ils sont migrables mécaniquement — un script pourra un jour les lire pour générer un front-matter structuré, sans qu'on ait à le payer maintenant.

## Règle de numérotation (immuable, clé de voûte)

Numérotation ascendante, jamais de renumérotation. Un cas retiré laisse un trou documenté comme tel, jamais comblé. Toute renumérotation casse les ancres, les citations croisées, et — le jour où le wiki devient interrogeable par une machine — les identifiants eux-mêmes. Ce n'est pas de l'esthétique, c'est ce qui rend un cas référençable de façon stable dans le temps.

## Règle d'admission (3 conditions cumulatives, anti-bloat)

Un cas n'entre dans le wiki que s'il est :
1. **reproductible** (on peut le remontrer) ;
2. **coûteux** (il a réellement consommé du temps de debug) ;
3. **transférable** (il resservira sur un autre projet/script).

« J'ai utilisé l'API comme documenté » n'entre pas. Ce qui entre, c'est la **surprise** — un comportement qui contredisait l'attente raisonnable.

## Politique de péremption

Toute citation porte `consultée le <date>` + `build <version>`. Un changement de build, ou plus de 6 mois sans revérification, déclenche un drapeau « à revérifier » sur le cas. Une documentation sourcée mais périmée est plus dangereuse qu'une documentation honnêtement non sourcée — elle inspire une fausse confiance.

## Les 6 horizons (déclencheurs chiffrés, jamais "quand ça semble utile")

| Horizon | Déclencheur | Acte | Coût |
|---|---|---|---|
| É0 — MD simple | point de départ | — | — |
| É1 — Gabarit | dès le premier cas, toujours | squelette + 3 champs balisés | faible, rédactionnel |
| É2 — Sommaire enrichi | fichier > ~900 lignes | résumé par cas + statut source + index par thème ET par symptôme | faible, mécanique |
| É3 — Factorisation | 3 répétitions du même bloc, ou 1 cas > 150 lignes | annexes Sources/Environnement/Patterns, les cas y renvoient | moyen |
| É4 — Multi-fichiers | > 2000 lignes ou > 60 cas | 1 fichier par famille + index | moyen |
| É5 — Base locale structurée | « grep ne suffit plus » (voir signes ci-dessous) | front-matter par cas, recherche locale | élevé |
| É6 — En ligne / API | hors de vue par défaut | service interrogeable, multi-projets | élevé, réversible |

**Signes concrets que "grep ne suffit plus"** (les seuls qui justifient de passer à É5) :
- on ne retrouve plus un cas par recherche textuelle (vocabulaire trop varié entre les entrées) ;
- il faut faire des requêtes croisées (« à la fois X et Y ») ;
- il faut interroger plusieurs wikis de projets différents ensemble.

Le basculement est le passage du lexical au sémantique — qui n'a d'intérêt que quand le vocabulaire diverge trop pour un simple grep (plusieurs auteurs/agents, ou corpus dépassant ce qu'on tient en tête).

## Horizon É7 — partage à des tiers (lecture puis écriture modérée)

Ajouté le 28/09/2026 : un wiki construit selon ce patron peut, à terme, être partagé au-delà de son cercle d'origine — élèves, stagiaires, collaborateurs — d'abord en lecture, puis potentiellement en écriture via un système de modération et un contrat d'écriture explicite. Jugé long terme au moment de la rédaction, mais susceptible d'arriver plus tôt que prévu selon le projet.

Ce que la numérotation immuable et les identifiants stables (déjà exigés dès É1) rendent possible sans rien y changer : une contribution externe peut référencer un cas de façon fiable et durable. Ce qui manquerait le jour venu, à construire alors et pas avant : un champ **Origine** par cas (auteur du dépôt vs contribution externe, distinct du `Statut source` qui parle de fiabilité de citation, pas de provenance), un état de contribution (proposé → validé → publié) avec un rôle de modérateur, et un contrat d'écriture propre au projet qui l'adopte.

## Le principe anti-anticipation (le cœur du patron)

Anticiper les **données** (champs balisés, identifiants stables, migrabilité du gabarit), jamais la **technologie** (moteur de recherche, transport, format de stockage). Le choix technologique est réversible ; le choix des données ne l'est pas — on ne paie que l'irréversible.

**En dessous de ~100 cas, un grep bien conçu sur un fichier bien structuré EST le RAG.** Un RAG local à ce volume coûte plus cher en maintenance (embeddings à resynchroniser à chaque édition) qu'il ne rapporte.

Un piège explicite à éviter : mettre un front-matter structuré en tête de chaque cas dès aujourd'hui serait une erreur — coût de réécriture de tous les cas existants, risque de casser les ancres, bénéfice immédiat nul tant que grep suffit. On choisit le gabarit pour que le front-matter puisse être ajouté mécaniquement plus tard, par script, à partir des champs déjà balisés — sans payer la migration maintenant.

## Où vit chaque chose

Le wiki porte le savoir **transférable** (un fait d'API, reproductible sur n'importe quel projet utilisant la même techno). La mission ou la doc d'architecture du projet porte le **spécifique projet** (l'implémentation propre à ce dépôt précis — un module, un loader, une convention de nommage locale).

## Formulation à retenir

> Un wiki structuré est déjà une base de données dont le Markdown est l'interface humaine. Le RAG n'est qu'une des façons de la lire.

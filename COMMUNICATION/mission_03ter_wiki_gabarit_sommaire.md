# Mission 03ter — Wiki : gabarit à champs balisés (É1) + sommaire enrichi (É2)

**Statut** : 🟡 PARTIELLE — Étapes 1 et 2 faites et vérifiées ; commit et validation FJD en attente (cf. Rapport d'exécution en fin de fichier).
**Position** : mission intermédiaire, à la suite de la mission 03bis (rétro-doc URLs). Indépendante de la mission 04 (chapitre 2), qui reste bloquée séparément.
**Référence de méthode** : `doc/METHODE_wiki_recursif.md` (socle) et `doc/architecture/PATRON_wiki_recursif.md` (analyse complète, FJD + DS, 28/09/2026).

## Contexte

Constat mesuré le 28/09/2026 : le wiki (`doc/wiki_extendscript_indesign.md`) a dépassé le seuil de déclenchement des horizons É1 (gabarit) et É2 (sommaire enrichi) définis dans le patron d'organisation — 969 lignes, 35 cas, dont 5 cas lourds (>50 lignes) représentant 42% du fichier, et un sommaire déjà périmé (annonce 34 cas, en compte 35).

Cette mission ne touche **pas** au contenu technique des cas (ça, c'est la mission 03bis pour les sources, et une future mission É3 pour la factorisation des cas lourds) — elle restructure le **format** : gabarit à champs balisés pour tout nouveau cas, et sommaire réellement à jour avec deux index (thème + symptôme).

## Objectif — Étape 1 : gabarit à champs balisés (É1)

Pour **tout nouveau cas** ajouté au wiki à partir de maintenant, appliquer le squelette suivant (voir `doc/METHODE_wiki_recursif.md` pour le détail) :

```
**Thème** : <langage | modèle texte | styles | parsing | tables | menus | méthode>
**API / objet visé** : <nom exact>
**Statut source** : sourcé | mesuré | à sourcer
**Build de référence** : InDesign 21.x (fr_FR, macOS)
```
suivi de Contexte / Symptôme / Cause / Ce que dit la doc / Solution / Portée.

**Ne pas rétro-appliquer ce gabarit aux 35 cas existants** dans cette mission — coût disproportionné pour un bénéfice nul tant que grep suffit (cf. principe anti-anticipation de la méthode). Seuls les nouveaux cas suivent le gabarit dès aujourd'hui.

## Objectif — Étape 2 : sommaire enrichi (É2)

Trois ajouts à la table des matières déjà existante (créée le 27/09) :
1. **En-tête du fichier** : nombre de cas actuel, build InDesign de référence, date de dernière revue.
2. **Une ligne de résumé par cas** dans le sommaire (pas seulement le titre) + statut source (sourcé/mesuré/à sourcer, une fois connu via la mission 03bis).
3. **Index double** : conserver l'index par thème existant, ajouter un **index par symptôme** — permettre de chercher un cas par ce qu'on a vu à l'écran (le message d'erreur, le comportement observé), pas seulement par le concept qu'on devrait déjà connaître.

## Règle de numérotation (rappel, non négociable)

Numérotation ascendante, jamais de renumérotation. Les trous actuels (Cas 11, Cas 15) restent troués et documentés comme tels dans le sommaire — ne jamais les combler en renumérotant les cas suivants.

## Méthode de travail

- Travail purement structurel/mécanique — ne pas modifier le contenu technique (symptôme/cause/solution) des cas existants.
- Une fois fait, vérifier que le nombre de cas annoncé en en-tête correspond bien au compte réel (`grep -c "^## Cas "`), pour ne pas reproduire l'erreur de péremption immédiate du sommaire précédent.
- Committer une fois les deux étapes faites, avec le décompte exact dans le message de commit.

## Critère de sortie

- Le gabarit à champs balisés est documenté et appliqué à tout cas ajouté après cette mission (vérifiable sur le prochain cas créé).
- Le sommaire affiche le nombre de cas exact, un résumé par cas, le statut source (si disponible), et un index par symptôme en plus de l'index par thème.
- Aucune modification du contenu technique des 35 cas existants.


---

## Rapport d'exécution — CR 03ter (28/09/2026)

**Statut** : 🟡 PARTIELLE — Étape 1 (gabarit) et étape 2 (sommaire enrichi) faites et vérifiées ; commit et validation FJD en attente.

**Fichier touché** : `doc/wiki_extendscript_indesign.md` (seul fichier modifié). Aucun autre fichier n'a été changé.

### Étape 1 — Gabarit à champs balisés (É1)

Le gabarit est désormais **documenté dans le wiki lui-même**, dans une section « Gabarit d'entrée — à appliquer à tout **nouveau** cas (É1) » placée juste avant la table des matières. Elle contient :

- le squelette du cas (titre `## Cas NN — <titre factuel>` + les 4 champs balisés `Thème` / `API / objet visé` / `Statut source` / `Build de référence`, puis les 6 rubriques habituelles) ;
- la définition des 3 valeurs de `Statut source` (`sourcé` / `mesuré` / `à sourcer`) ;
- la règle de **non-rétroactivité** explicite : le gabarit s'applique aux nouveaux cas uniquement, les 35 cas existants gardent leur rédaction d'origine, aucune réécriture rétroactive ;
- le rappel de la règle de numérotation immuable ;
- la boucle de production (les 2 champs obligatoires d'un bloc de mission : `Cas wiki consultés` / `Cas wiki produits/enrichis`).

**Correctif annexe (section méthode, hors cas)** : le réflexe n°1 de la « Méthode générale » citait « ex. Cas 09, 14, 17 » comme modèles du format de citation. Or ces trois cas sont précisément ceux dont la citation n'a **pas** été re-retrouvée en 03bis (catégorie 2) — la référence se contredisait donc elle-même. Remplacée par des cas réellement sourcés (Cas 01, 19, 26, 31), avec le format de trace exact, et une mention honnête des cas de repli (09, 14, 17). Cette correction porte sur la **section méthode**, pas sur le corps des cas.

### Étape 2 — Sommaire enrichi (É2)

La table des matières a été réécrite en trois blocs :

1. **En-tête** : 35 cas, build de référence **InDesign 21.x** (`21.6.0.57`, `fr_FR`, macOS), date de dernière revue **28/09/2026**. Les trous de numérotation **Cas 11** et **Cas 15** y sont documentés comme tels, et une légende définit les 3 valeurs de statut source.
2. **Catalogue des cas** : une ligne par cas = lien vers l'ancre + **statut source** + **résumé factuel** d'une ligne (35 entrées). Ceci rend le statut source visible dans le sommaire **sans** toucher au corps des cas.
3. **Index double** : l'index par thème existant est conservé (7 groupes), et un **index par symptôme** est ajouté (22 entrées) — on y cherche par ce qu'on a **vu à l'écran** (message d'erreur typique, comportement observé), pas par le concept qu'on devrait déjà connaître.

**Répartition du statut source** (dérivée du tri 03bis, 35 cas au total) :

| Statut | Nombre | Cas |
|---|---|---|
| `sourcé` | 16 | 00, 01, 02, 03, 04, 05, 06, 07, 08, 19, 26, 28, 30, 31, 34, 35 |
| `mixte` | 6 | 09, 14, 16, 17, 22, 27 |
| `mesuré` | 13 | 10, 12, 13, 18, 20, 21, 23, 24, 25, 29, 32, 33, 36 |

### Vérifications (preuves brutes)

```text
$ grep -c "^## Cas " doc/wiki_extendscript_indesign.md
35
$ grep -c $'\xef\xbf\xbd' doc/wiki_extendscript_indesign.md
0
$ python3 /tmp/check_03ter_b.py     # contrôle de toutes les ancres du sommaire
headings: 35
liens: 120 | manquantes: 0
numeros: 00,01,02,03,04,05,06,07,08,09,10,12,13,14,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36
```

- Nombre de cas annoncé en en-tête = compte réel = **35** (l'erreur de péremption immédiate du sommaire précédent — « 34 cas » — est corrigée).
- Les **120** liens du sommaire résolvent tous vers une ancre de titre existante (0 manquante) ; l'ancre de **Cas 36** (jusqu'ici absent du sommaire) a été vérifiée et corrigée par recalcul de la règle de normalisation d'ancre.
- **Aucune modification du contenu technique** (Contexte/Symptôme/Cause/Solution) des 35 cas : les seules éditions hors sommaire portent sur la section méthode (réflexe n°1) et l'ajout de la section gabarit.
- Encodage : **0** U+FFFD dans le fichier (émojis et tirets cadratins inclus).

### Reste à faire

- **Commit** (réservé FJD/Claude) une fois la validation faite, avec le décompte exact (35 cas) dans le message de commit.
- **Validation FJD** du résultat.

### Arbitrages FJD (28/09/2026)

- **Ratifié** : la convention « catégorie 1 / catégorie 2 » de 03bis devient, dans le sommaire, un triplet `sourcé` / `mixte` / `mesuré` ; les cas mixtes (API sourcée + comportement mesuré : 09, 14, 16, 17, 22, 27) sont classés `mixte` plutôt que `sourcé`. (Réponse FJD : « 1 ok ».)
- **Réglé** : le socle `doc/METHODE_wiki_recursif.md` et l'analyse `doc/architecture/PATRON_wiki_recursif.md` sont désormais **versionnés** — commités par FJD/Claude dans `5b44863 docs(wiki): mission 03ter (gabarit+sommaire), socle méthode, horizon É7 partage tiers`. (Réponse FJD : « 2 commit ».)

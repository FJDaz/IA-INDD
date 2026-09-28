# Mission 03ter — Wiki : gabarit à champs balisés (É1) + sommaire enrichi (É2)

**Statut** : 🔴 À FAIRE
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

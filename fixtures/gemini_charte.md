# Programme de Formation : Construire ses outils InDesign avec l'IA — Charte Gemini

Voici le schéma de structure et la feuille de style micro-typographique appliqués à la rédaction des livrables Markdown.

---

## 1. Squelette de structure (Architecture MD)

```markdown
# [Titre principal H1] — [Sous-titre ou déclinaison]

> **Chapeau / Métadonnées** (Contextualisation rapide en blockquote : cible, durée, statut, prérequis).

---

## 1. [Section majeure H2]
* **[Amorce de niveau 1]** : explication synthétique du point clé.
  * [Détail sous-jacent ou sous-puce de niveau 2 sans gras].
  * [Deuxième détail].

### [Sous-section optionnelle H3]
Paragraphe court (3 à 4 lignes max). Analyse ou explication contextuelle.

| Colonne 1 | Colonne 2 | Colonne 3 |
| :--- | :---: | ---: |
| Alignement gauche | Centre | Droite |

---

## 2. [Section suivante H2]
```

---

## 2. Feuille de style et règles d'ergonomie

### Hiérarchie et découpage
* **Un seul H1 par document :** sert de titre écosystème ou produit.
* **Pas de saut de niveau :** passage strict de H1 à H2, puis H3. Les niveaux H4 à H6 sont proscrits (remplacés par des amorces en gras sur une ligne isolée si besoin).
* **Séparateurs (`---`) :** utilisés uniquement pour isoler les grands blocs H2 ou marquer le passage au cadrage opérationnel/annexes.

### Lisibilité et scannabilité (*F-Shape Pattern*)
* **Amorce en gras (*Lead-in bold*) :** chaque point d'une liste commence par 2 à 4 mots clés en gras suivis de deux-points ` :`. Cela permet une lecture rapide par balayage visuel.
* **Format des listes :**
  * **Listes ordonnées (`1.`, `2.`) :** réservées à la chronologie, aux étapes d'un workflow ou aux priorités.
  * **Listes à puces (`*` ou `-`) :** réservées à la description de fonctionnalités, concepts ou listes d'éléments sans ordre de préséance.
* **Paragraphes courts :** isolés par une ligne vide, sans pavés de texte continu.

### Tableaux et blocs techniques
* **Tableaux Markdown :** privilégiés dès qu'il y a plus de deux variables à comparer (ex. : Durée / Contenu / Modèle / Coût). Alignement explicite requis dans la ligne de séparation (`:---`, `:---:`, `---:`).
* **Blocs de code :** spécification systématique du langage (`js`, `bash`, `html`, `json`, `markdown`).
* **Encadrés (`>`) :** réservés aux alertes, résumés stratégiques, ou conditions sine qua non.

### Micro-typographie française
* **Punctuation & espaces insécables :** espace insécable avant les signes doubles (` :`, ` ;`, ` !`, ` ?`).
* **Guillemets :** usage exclusif des guillemets français `« … »` avec espaces insécables internes.
* **Tirets :** tirets demi-cadratins `–` pour les intervalles, tirets cadratins `—` pour les incises ou séparations de sous-titres.
* **Nombres :** écriture en toutes lettres en deçà de 10, chiffres au-delà, espaces comme séparateurs de milliers (ex. : `10 000`), virgule pour les décimales (`0,50 €`).

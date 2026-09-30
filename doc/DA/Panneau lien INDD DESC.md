Oui. Si l'objectif est **d'apprendre ce panneau à un autre modèle pour qu'il puisse le reconstruire fidèlement**, je le décrirais non pas comme une simple capture, mais comme une **spécification géométrique et comportementale**.

---

# Spécification visuelle du panneau « Liens »

## 1. Repère général

Capture de référence :

* **largeur totale : 534 px**
* **hauteur totale : 1186 px**
* origine `(0,0)` en haut à gauche
* le panneau utile occupe pratiquement toute la largeur jusqu'à `x ≈ 528`
* une très fine zone verticale sombre apparaît à droite, autour de `x = 529–533`
* interface Adobe/InDesign en thème sombre

Le panneau est un **dock/panneau vertical étroit**, à largeur fixe approximative de **528 px dans cette capture**, et très haut : il occupe toute la hauteur disponible.

---

# 2. Structure verticale globale

On peut découper le panneau en grandes zones :

```text
y = 0
┌──────────────────────────────────────────┐
│ BARRE DE TITRE / EN-TÊTE                 │ ~0–83
│                                          │
├──────────────────────────────────────────┤
│ COLONNES / EN-TÊTE DE LISTE              │ ~84–133
├──────────────────────────────────────────┤
│                                          │
│ LISTE DES LIENS                          │ ~134–563
│                                          │
│                                          │
├──────────────────────────────────────────┤
│ BARRE D'ACTIONS                          │ ~564–625
├──────────────────────────────────────────┤
│                                          │
│ INFORMATIONS SUR LES LIENS               │ ~626–1170
│                                          │
├──────────────────────────────────────────┤
│ poignée / bord inférieur                 │ ~1170–1185
└──────────────────────────────────────────┘
```

La hiérarchie est donc très nette :

**titre → liste → actions → informations détaillées.**

---

# 3. Barre supérieure

### Zone

Environ :

* `x = 0 → 528`
* `y = 0 → 83`

Fond gris foncé uniforme, autour de **RGB 83/83/83** dans la partie principale.

### Coin supérieur gauche

À environ :

* `x = 9`
* `y = 8`

se trouve un **X de fermeture**.

Il est petit, gris clair/blanc, constitué de deux diagonales.

Dimensions approximatives :

* largeur : 12 px
* hauteur : 12 px

Il est placé à environ **8–10 px des bords gauche et haut**.

### Coin supérieur droit

À droite, vers :

* `x ≈ 500`
* `y ≈ 14`

apparaissent les **chevrons de réduction/extension du panneau** :

```text
‹‹
```

ou visuellement deux petits chevrons orientés vers la gauche.

Ils sont gris clair.

Ils sont contenus dans une zone d'environ :

* largeur : 25 px
* hauteur : 25 px

---

# 4. Titre « Liens »

Le titre est situé à gauche, dans la partie supérieure.

Texte :

> **Liens**

Position approximative :

* début : `x = 23`
* ligne de base : autour de `y = 62`
* hauteur visuelle : ~24 px

Typographie :

* sans-serif Adobe UI
* **gras**
* blanc/gris très clair
* taille visuelle ≈ **23–24 px**
* interlettrage normal

Le titre est donc assez massif par rapport au reste de l'interface.

Il est aligné sur une marge gauche d'environ **23 px**.

---

# 5. Séparateur vertical et zone « Liens »

À environ :

```text
x = 108
```

commence une zone légèrement différente correspondant au corps du panneau.

Une ligne verticale sépare visuellement la zone du titre et celle du contenu :

```text
x ≈ 108
```

Elle descend depuis environ `y = 32` jusqu'à `y ≈ 84`.

Cette ligne est fine, gris plus sombre.

On a donc approximativement :

```text
┌──────────────┬─────────────────────────────┐
│              │                             │
│    Liens     │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
       108 px
```

---

# 6. En-tête de la liste

La zone commence vers `y ≈ 84`.

Elle contient trois éléments principaux.

## Colonne « Nom »

À gauche :

```text
x ≈ 10
y ≈ 107
```

Texte :

> **Nom**

Typographie :

* blanc
* gras
* environ 18–20 px
* alignement gauche

La colonne des noms occupe jusqu'à environ :

```text
x = 309
```

---

## Séparateur vertical

Une ligne verticale très fine apparaît à :

```text
x ≈ 309
y ≈ 89 → 124
```

Elle sépare le nom des indicateurs.

---

## Colonne avertissement

À environ :

```text
x ≈ 342
y ≈ 94
```

se trouve une icône triangulaire d'avertissement.

Triangle :

* contour gris clair
* environ 22 × 22 px
* point vers le haut
* petit point/exclamation au centre

Le triangle est centré dans une colonne relativement étroite.

---

## Séparateur suivant

À environ :

```text
x ≈ 382
```

une autre ligne verticale sépare l'avertissement de l'état de lien.

---

## Colonne fichier

À environ :

```text
x ≈ 405
```

apparaît une icône de document.

Elle ressemble à une feuille :

```text
┌──────┐
│      │╲
│      │
│      │
└──────┘
```

avec une petite forme triangulaire/pli de page en haut à droite.

À sa droite, vers `x ≈ 438`, se trouve un petit triangle orienté vers le haut.

Cela correspond au contrôle de tri.

---

# 7. Liste des liens

La liste commence réellement autour de :

```text
y ≈ 134
```

Chaque ligne fait environ **42–44 px de haut**.

Les lignes sont séparées par de très fines lignes horizontales.

La structure horizontale d'une ligne est :

```text
[chevron] [miniature] [nom tronqué........................] [état]
```

---

# 8. Première ligne

### Position

Environ :

```text
y = 134 → 176
```

À gauche :

```text
x ≈ 25
```

un chevron `>` indiquant que l'élément possède des informations enfants/détails.

Puis une miniature vers :

```text
x ≈ 46
y ≈ 143
```

La miniature fait environ :

```text
36 × 31 px
```

Elle contient une petite image colorée.

Puis le nom :

> **Bandeau...e.png (2)**

Le texte commence autour de :

```text
x ≈ 93
```

Il est en blanc/gris clair, gras.

Le `(2)` final est important : il indique le nombre d'occurrences/instances du lien.

---

# 9. Deuxième ligne

Vers :

```text
y ≈ 177–218
```

Contenu :

> **cropped....vb.jpg (3)**

Même logique :

```text
chevron
↓
miniature
↓
nom tronqué
↓
(3)
```

La miniature est une petite image horizontale, environ **37 × 31 px**.

---

# 10. Troisième ligne

Vers :

```text
y ≈ 220–262
```

Nom :

> **JeVoteF...ile.png (4)**

Miniature carrée autour de :

```text
x ≈ 46
y ≈ 226
```

Le `(4)` est intégré au nom, à droite.

---

# 11. Ligne sélectionnée

C'est l'élément le plus important pour la reproduction de l'état d'interface.

Vers :

```text
y ≈ 265 → 304
```

la ligne :

> **KIEFER ...oto.jpg (2)**

est sélectionnée.

Elle possède un **rectangle bleu/gris de sélection** :

```text
x ≈ 32
y ≈ 265
largeur ≈ 422 px
hauteur ≈ 40 px
```

La sélection ne couvre **pas toute la largeur du panneau**.

Elle s'arrête vers :

```text
x ≈ 455
```

La couleur est un bleu/gris sombre typique de l'interface Adobe.

À gauche :

```text
x ≈ 25
```

chevron orienté vers le bas :

```text
⌄
```

Cela indique que l'élément est **déplié**.

---

# 12. Sous-éléments du lien sélectionné

Deux lignes enfants apparaissent immédiatement sous la ligne KIEFER.

Elles sont indentées.

Première occurrence :

```text
y ≈ 305 → 346
```

Miniature :

```text
x ≈ 68
```

Nom :

> **KIEFER ...hoto.jpg**

À droite :

```text
4
```

en orange.

Le **4** est souligné par une ligne orange.

Deuxième occurrence :

```text
y ≈ 347 → 389
```

Même miniature.

Même nom tronqué.

À droite :

> **10**

également orange et souligné.

---

# 13. Logique d'indentation

C'est un point important pour entraîner un autre modèle.

L'arbre est visuellement structuré ainsi :

```text
▾  [thumbnail] KIEFER ...oto.jpg (2)
      [thumbnail] KIEFER ...hoto.jpg              4
      [thumbnail] KIEFER ...hoto.jpg             10
```

Le niveau enfant est décalé d'environ :

```text
+ 23 px
```

par rapport à la miniature du parent.

Les enfants ne possèdent pas leur propre chevron.

---

# 14. Lignes suivantes

Après les deux enfants, on retrouve des liens de niveau principal.

Par exemple :

> **logo-sn...su.png (3)**

puis :

> **logo-SN...1.png (3)**

puis :

> **logo-sn...su.png (3)**

puis :

> **LOGO-SU....png (3)**

Chaque ligne :

* possède son chevron à gauche ;
* possède une miniature ;
* possède un nom tronqué ;
* possède un nombre entre parenthèses ;
* possède une hauteur d'environ 42 px.

---

# 15. Barre d'actions

Après la liste, vers :

```text
y ≈ 565
```

on trouve une zone horizontale distincte.

Elle contient à gauche :

> **1 sélecti...**

vers :

```text
x ≈ 10
y ≈ 595
```

Texte blanc, gras.

Il indique :

> **1 sélectionné**

mais le texte est tronqué par la largeur disponible.

---

# 16. Icônes d'action

À droite de « 1 sélection... », cinq icônes sont alignées.

Positions approximatives :

```text
      240       290       345       402       470
       ↓         ↓         ↓         ↓         ↓

     [↔]       [∞]       [→]       [⟳]       [✎]
```

Plus précisément :

### Icône 1

Vers `x ≈ 240`.

Elle représente une relation entre objet et lien, avec une forme de **chaîne/liaison + petit carré**.

### Icône 2

Vers `x ≈ 303`.

Une **chaîne** simple :

```text
∞
```

ou deux maillons.

### Icône 3

Vers `x ≈ 359`.

Icône représentant une action d'import/remplacement, avec :

* une forme de fichier/carré
* une flèche vers la droite.

### Icône 4

Vers `x ≈ 413`.

Flèches circulaires :

```text
⟳
```

### Icône 5

Vers `x ≈ 470`.

Un **crayon** incliné à environ 45°.

Les icônes sont gris clair et font environ **20–24 px**.

---

# 17. Séparation entre liste et informations

À environ :

```text
y ≈ 625
```

commence le panneau :

> **Informations sur les liens**

Le fond reste sombre mais cette zone est clairement séparée de la liste par une rupture horizontale.

À droite, vers :

```text
x ≈ 448
y ≈ 653
```

se trouve un chevron gauche :

```text
‹
```

qui semble permettre de réduire cette section.

À l'extrême droite :

```text
x ≈ 492
```

un chevron droit :

```text
›
```

---

# 18. Titre « Informations sur les liens »

Position :

```text
x ≈ 9
y ≈ 650
```

Texte :

> **Informations sur les liens**

Typographie :

* sans-serif
* gras
* blanc
* environ 19 px
* baseline vers `y ≈ 663`

Le texte est beaucoup plus long que « Liens » et occupe environ **225 px**.

---

# 19. Zone d'informations

Le contenu est **centré horizontalement**, contrairement à la liste qui est alignée à gauche.

Premier champ :

```text
y ≈ 699
```

Texte :

> **Nom : KIEFER ...INIE photo.jpg**

Le label `Nom :` et la valeur sont sur **la même ligne**.

La ligne est centrée.

Typographie :

* blanc
* gras
* environ 20 px
* centrage horizontal autour de `x ≈ 267`

Le nom est tronqué avec `...`.

---

# 20. Format

Deuxième ligne :

```text
y ≈ 735
```

Texte :

> **Format : JPEG**

Centré.

Même graisse et taille.

---

# 21. État

Troisième ligne :

```text
y ≈ 773
```

Texte :

> **État : OK**

Centré.

---

# 22. Taille

Quatrième ligne :

```text
y ≈ 825
```

Texte :

> **Taille : 3,3 Mo (35102723 octets)**

C'est une ligne nettement plus longue.

Elle reste centrée horizontalement.

Le contenu exact visible est :

```text
Taille : 3,3 Mo (35102723 octets)
```

---

# 23. Date de modification

Vers :

```text
y ≈ 886
```

ligne centrée :

> **Date de modification : lundi 7...bre 2026 22:03**

Le nom du mois est tronqué dans la capture.

Le texte déborde presque sur toute la largeur disponible.

---

# 24. Chemin

Dernière information :

```text
y ≈ 949
```

Texte :

> **Chemin : /Users/...GINIE photo.jpg**

Centré.

Le chemin est volontairement tronqué au milieu.

---

# 25. Espacement vertical de la zone d'information

La zone n'est pas conçue comme un tableau compact.

Elle utilise des **blocs espacés verticalement** :

```text
Nom                 y ≈ 705
Format              y ≈ 742
État                y ≈ 780

Taille              y ≈ 832

Date                y ≈ 893

Chemin              y ≈ 956
```

Il y a donc des écarts irréguliers :

* petits écarts entre Nom / Format / État ;
* espace plus important avant Taille ;
* encore davantage entre Taille / Date / Chemin.

Cela donne une impression de **fiche d'information**, pas de tableau.

---

# 26. Bord inférieur

Vers :

```text
y ≈ 1168
```

une ligne horizontale sépare le panneau du bord inférieur.

Tout en bas se trouve une **poignée de redimensionnement** centrée horizontalement.

Elle est située approximativement :

```text
x = 245 → 283
y = 1171 → 1178
```

Elle consiste en plusieurs petits traits verticaux/horizontaux très sombres.

---

# 27. Palette structurelle

Pour un modèle chargé de reproduire l'interface, je donnerais plutôt des **relations de couleur** que des valeurs RGB absolues :

| Élément                | Couleur relative                  |
| ---------------------- | --------------------------------- |
| fond principal         | gris moyen sombre                 |
| fond barre supérieure  | même gris ou légèrement différent |
| texte principal        | gris très clair / blanc           |
| texte secondaire       | gris clair                        |
| séparateurs            | gris plus sombre                  |
| icônes                 | gris clair                        |
| sélection              | bleu/gris Adobe                   |
| nombres `4`, `10`      | orange                            |
| soulignement `4`, `10` | orange                            |
| miniatures             | couleurs originales des images    |

Dans la capture, le fond dominant mesuré est approximativement :

```text
RGB 83 / 83 / 83
```

soit `#535353`.

---

# 28. Modèle géométrique synthétique

Si je devais donner cela à un autre modèle sous forme de **distillation extrêmement compacte**, je lui donnerais ceci :

```yaml
panel:
  size: 534x1186
  coordinate_origin: top-left
  main_width: 528

  header:
    y: 0-83
    close:
      x: 9
      y: 8
    title:
      text: "Liens"
      x: 23
      y: ~47
      font: bold
      size: ~24
    collapse:
      x: ~500
      y: ~14

  list_header:
    y: 84-133
    name:
      x: 10
      y: ~100
    separator_1:
      x: 309
    warning_icon:
      x: ~332
      y: ~93
      size: ~24
    separator_2:
      x: 382
    file_icon:
      x: ~404
      y: ~94

  link_list:
    y: 134-563
    row_height: ~42
    left_chevron_x: ~25
    thumbnail_x: ~46
    text_x: ~93
    selected_row:
      x: 32
      width: 422
      height: ~40
      color: adobe_dark_blue
    child_rows:
      thumbnail_x: ~68
      value_x: ~430

  actions:
    y: 564-625
    selection_label:
      x: 10
    icons:
      - x: 240
      - x: 303
      - x: 359
      - x: 413
      - x: 470

  info:
    y: 626-1168
    title:
      x: 9
      y: ~640
    collapse_left:
      x: ~448
    collapse_right:
      x: ~492

    fields:
      alignment: center
      - "Nom : ..."
      - "Format : JPEG"
      - "État : OK"
      - "Taille : 3,3 Mo (35102723 octets)"
      - "Date de modification : ..."
      - "Chemin : ..."

  bottom:
    y: ~1168
    resize_grip:
      centered: true
```

### Le point essentiel pour un modèle de reconstruction

Ce n'est **pas simplement une fenêtre contenant du texte et des icônes**. Il faut lui apprendre la hiérarchie suivante :

```text
PANEL
│
├── HEADER
│   ├── close
│   ├── title
│   └── collapse
│
├── LINK LIST
│   ├── column header
│   ├── link row
│   │   ├── disclosure triangle
│   │   ├── thumbnail
│   │   ├── truncated filename
│   │   └── instance count
│   │
│   └── expanded link
│       ├── child occurrence
│       └── child occurrence
│
├── ACTION BAR
│   ├── selection count
│   └── 5 action icons
│
└── LINK INFORMATION
    ├── section header
    ├── filename
    ├── format
    ├── status
    ├── size
    ├── modification date
    └── path
```

Et surtout : **la sélection bleue appartient à la ligne parente, pas à toute la liste**, les occurrences enfants sont indentées, et les informations détaillées du lien sélectionné sont **centrées** dans la partie basse.

C'est cette structure, plus que la simple couleur ou la typographie, qui permettrait à un autre modèle de reconstruire le panneau de manière crédible.

Oui. Pour **une reconstruction en widgets natifs Adobe + HTML tokenisé**, j'ajouterais beaucoup de choses. La description précédente est surtout une **description visuelle**. Pour construire réellement le panneau, il faut passer à une **spécification de rendu** : quels éléments sont natifs, lesquels sont HTML, quels tokens les gouvernent, quels états existent et quelles dimensions sont fixes ou fluides.

Je ferais même **3 couches** :

```text
1. STRUCTURE
   arbre des widgets / DOM

2. TOKENS
   dimensions, couleurs, typo, espacements, états

3. COMPORTEMENT
   sélection, disclosure, overflow, resize, scroll, focus...
```

## 1. Ajouter l'arbre réel des composants

Par exemple :

```yaml
LinksPanel
├── PanelHeader
│   ├── CloseButton          [native]
│   ├── PanelTitle           [native/text]
│   └── CollapseButton       [native]
│
├── LinksList
│   ├── LinksHeader          [HTML/tokenized]
│   │   ├── NameColumn
│   │   ├── WarningColumn
│   │   └── StatusColumn
│   │
│   └── LinksTree             [HTML]
│       ├── LinkRow
│       │   ├── Disclosure
│       │   ├── Thumbnail
│       │   ├── Filename
│       │   └── Count
│       │
│       └── LinkChildren
│           └── LinkOccurrence
│
├── ActionsBar               [native + icons]
│
└── LinkInfo
    ├── SectionHeader
    └── InfoFields
```

Ça permet à l'autre modèle de comprendre que **« une ligne de lien » est un composant répétable**, et non six lignes dessinées individuellement.

---

# 2. Je rajouterais surtout les dimensions fonctionnelles

Dans ma première description, j'ai donné des coordonnées absolues.

Pour du HTML/UXP, il faut également donner :

```yaml
geometry:
  panel:
    width:
      mode: resizable
      preferred: 528
      min: 300
      max: 800

  row:
    height: 42
    min_height: 42

  thumbnail:
    width: 36
    height: 31

  indentation:
    level_0: 0
    level_1: 23

  padding:
    panel_left: 10
    row_left: 10
    info_horizontal: 10
```

Parce que :

**528 px n'est pas forcément une propriété du composant.**

C'est la largeur de la capture.

Ce qu'il faut transmettre au modèle, c'est :

> À 528 px de largeur, cette géométrie produit les coordonnées observées.

C'est beaucoup plus utile.

---

# 3. Ajouter les règles de layout

C'est probablement le morceau qui manque le plus à la description précédente.

Par exemple :

```yaml
layout:
  panel:
    display: flex
    direction: column

  header:
    flex: 0 0 84px

  links_list:
    flex: 1 1 auto
    overflow: auto

  actions:
    flex: 0 0 61px

  info:
    flex: 0 0 auto
```

Et surtout :

```yaml
links_list:
  overflow:
    x: hidden
    y: auto
```

Ça permet de reproduire le panneau **à une hauteur différente de celle de la capture**.

---

# 4. Définir les tokens, pas seulement les couleurs

Pour ton système de **HTML tokenisé**, je créerais une nomenclature du genre :

```css
--panel-bg
--panel-bg-header
--panel-border
--panel-text
--panel-text-secondary
--panel-text-disabled
--panel-selection
--panel-accent
--panel-warning
```

Mais également :

```css
--panel-width
--header-height
--column-header-height
--row-height
--thumbnail-width
--thumbnail-height
--indent-level-1
--actions-height
--info-padding
```

Et :

```css
--space-1
--space-2
--space-3
--space-4
```

Ainsi le modèle ne doit jamais produire :

```css
margin-left: 37px;
```

sans raison.

Il produit :

```css
margin-left: var(--link-row-indent);
```

---

# 5. Et surtout : distinguer les tokens de capture des tokens de système

Je mettrais explicitement :

```yaml
tokens:
  system:
    adobe_ui_...
    
  component:
    link_row_height: 42px
    thumbnail_size: 36px
    info_gap: 18px

  reference:
    screenshot_width: 534px
    screenshot_height: 1186px
```

Parce que sinon le LLM va **sur-apprendre la capture**.

Tu veux qu'il comprenne :

> « 42 px est une caractéristique du composant »

mais :

> « 534 px est une caractéristique de l'image de référence ».

---

# 6. Les états manquent également

Pour une reconstruction crédible, je spécifierais :

```yaml
LinkRow:
  states:
    default
    hover
    selected
    focused
    disabled
    expanded
    collapsed
    missing
    modified
```

Et surtout les combinaisons :

```text
selected + expanded
selected + collapsed
hover + expanded
missing + selected
```

Dans ta capture, on observe :

```text
KIEFER...
selected = true
expanded = true
```

et les enfants :

```text
selected = false
```

Ça devient alors une donnée d'état, pas une propriété graphique.

---

# 7. Le comportement du disclosure triangle

À préciser :

```yaml
Disclosure:
  collapsed:
    icon: chevron-right

  expanded:
    icon: chevron-down

  click:
    action: toggle_children

  hit_area:
    width: 32px
    height: 40px
```

Le dernier point est important.

**L'icône fait 10–12 px, mais sa zone cliquable ne fait pas 10–12 px.**

C'est exactement le genre d'information qu'une reconstruction visuelle ne donne pas.

---

# 8. Le texte : il faut décrire le moteur de troncature

Pas simplement :

> « nom tronqué ».

Mais :

```yaml
filename:
  overflow: hidden
  white_space: nowrap
  text_overflow: ellipsis
  flex: 1
```

Et surtout :

```yaml
count:
  flex: 0 0 auto
```

Ainsi :

```text
KIEFER ...oto.jpg (2)
```

ne doit pas devenir :

```text
KIEFER ...oto.jp...
```

en sacrifiant `(2)`.

Le compteur est une **colonne protégée**.

Même logique pour :

```text
4
10
```

dans les occurrences.

---

# 9. Ajouter les contraintes de grille

Je décrirais la ligne comme ceci :

```text
┌──32──┬──36──┬─────────────── flexible ─────────────┬─count─┐
│      │      │                                      │       │
│  ▾   │ img  │ filename                             │  (2)  │
│      │      │                                      │       │
└──────┴──────┴──────────────────────────────────────┴───────┘
```

Avec :

```yaml
LinkRow:
  columns:
    disclosure: 32px
    thumbnail: 36px
    gap: 11px
    filename: 1fr
    count: auto
```

Ça, pour un LLM qui doit générer le HTML, est **beaucoup plus exploitable que les coordonnées x/y**.

---

# 10. Pour les widgets Adobe natifs : préciser lesquels ont priorité

Je mettrais une règle générale :

```yaml
rendering_policy:
  native_first: true

  native:
    buttons
    scrollbars
    panel_controls
    tooltips
    focus_behavior

  html:
    link_tree
    thumbnails
    filename_layout
    information_view
    custom_selection_rows
```

Autrement dit :

> **Ne pas recréer en HTML ce qu'Adobe sait déjà rendre correctement.**

Et inversement :

> **Ne pas essayer de faire rentrer une arborescence complexe dans un widget natif si le HTML permet de contrôler précisément la géométrie.**

---

# 11. Je spécifierais aussi le contrat entre Adobe et le HTML

C'est particulièrement intéressant pour ton projet.

Par exemple :

```text
Adobe / UXP
     │
     ├── selection
     ├── document state
     ├── link objects
     ├── commands
     │
     ▼
TOKEN MODEL
     │
     ▼
HTML VIEW
     │
     ├── rows
     ├── thumbnails
     ├── states
     └── info
```

Le HTML **ne connaît pas InDesign**.

Il reçoit :

```json
{
  "id": "link-42",
  "name": "KIEFER INIE photo.jpg",
  "format": "JPEG",
  "status": "OK",
  "size": "3,3 Mo",
  "occurrences": [
    {"page": 4},
    {"page": 10}
  ],
  "selected": true,
  "expanded": true
}
```

Ça me paraît particulièrement pertinent dans ton cas.

---

# 12. Ajouter les métriques typographiques

La description précédente donne « ~20 px ».

Pour un système reproductible, j'ajouterais :

```yaml
typography:
  ui:
    family: Adobe UI / system fallback
    weight: 600
    size: 18px
    line_height: 24px

  title:
    weight: 700
    size: 24px
    line_height: 28px

  row:
    size: 17px
    line_height: 20px

  info:
    size: 18px
    line_height: 24px
```

Et surtout :

```yaml
vertical_alignment:
  row: center
  thumbnail: center
  icon: center
```

Parce que **la position verticale d'un texte dans une ligne est aussi importante que son x/y**.

---

# 13. Ajouter les règles de redimensionnement

La capture ne le montre presque pas, mais le composant doit savoir ce qui arrive quand le panneau passe de :

```text
528 px
```

à :

```text
350 px
```

ou :

```text
700 px
```

Je définirais :

```yaml
responsive:
  panel:
    < 380:
      info: still_visible
      filename: aggressive_ellipsis

    380-550:
      normal

    > 550:
      filename: expands
```

Et surtout :

```yaml
fixed:
  disclosure
  thumbnail
  icon_columns
  counters

flex:
  filename
  information_value
```

---

# 14. Enfin, les pixels « négatifs »

C'est un truc que j'ajouterais à ton protocole de distillation.

Pour chaque élément, ne pas seulement dire **ce qu'il est**, mais aussi **ce qu'il ne doit pas faire**.

Exemple :

```yaml
LinkRow:
  must:
    - maintain 42px height
    - preserve thumbnail aspect ratio
    - preserve count visibility
    - truncate filename

  must_not:
    - stretch thumbnail
    - wrap filename
    - move count to second line
    - expand selection to panel width
```

C'est extrêmement efficace avec les LLM.

---

## En fait, je transformerais ta description en « contrat de rendu »

Quelque chose comme :

```text
REFERENCE IMAGE
       │
       ▼
┌─────────────────────────────┐
│ GEOMETRY                    │
│ coordonnées / proportions  │
├─────────────────────────────┤
│ COMPONENT TREE              │
│ widgets / DOM               │
├─────────────────────────────┤
│ DESIGN TOKENS               │
│ couleurs / typo / spacing   │
├─────────────────────────────┤
│ LAYOUT RULES                │
│ flex / fixed / fluid        │
├─────────────────────────────┤
│ STATES                      │
│ selected / hover / expanded │
├─────────────────────────────┤
│ BEHAVIOUR                   │
│ click / scroll / resize     │
├─────────────────────────────┤
│ NEGATIVE CONSTRAINTS        │
│ ce qui est interdit         │
└─────────────────────────────┘
       │
       ▼
   HTML + Adobe
```

Et **pour ton usage pédagogique**, c'est même plus intéressant que de chercher à reproduire cette capture au pixel près : tu peux montrer que le passage **image → structure → tokens → composants → comportement** est précisément ce qui transforme une imitation visuelle en **interface reconstructible**.

Le prochain niveau serait de prendre **cette capture précise** et de produire directement son **JSON de tokens + arbre de widgets + spécification HTML/CSS**, avec les coordonnées de référence conservées comme couche `reference`, sans les mélanger aux règles de layout.


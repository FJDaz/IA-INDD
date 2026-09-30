# Analyseur Markdown « standard » — note de chantier futur

**Statut** : note d'architecture, **chantier DIFFÉRÉ** (rédigée le 30/09/2026 à la demande de FJD :
« on tâchera de factoriser cette feature plus tard »). **Rien à construire maintenant.**
**Décision rattachée** : le panneau Import MD reste la priorité ; cette note ne le modifie en rien.
**Nature du document** : ce n'est ni un cas du wiki, ni de la documentation ExtendScript. C'est
la **description d'une cible** et des **précisions** à ne pas perdre d'ici là.

---

## 0. L'idée, en une phrase

> Remplacer un analyseur Markdown **taillé sur nos fichiers de test** par un analyseur qui
> **connaît le standard** : un spécialiste du Markdown qui sait *reconnaître une structure*,
> sans budget d'API ni reconnaissance de modèle.

C'est la bonne cible. Cette note dit **ce que le standard donne gratuitement**, **ce qu'il ne
donne pas**, et **où se situe exactement la factorisation**.

---

## 1. Le standard Markdown : ce qui existe vraiment

Ce qui suit est factuel (pas une impression) — à vérifier d'un clic si un lecteur en doute.

| Nom | Ce que c'est | Pourquoi ça compte |
|---|---|---|
| **Markdown original** (John Gruber, 2004) | **Pas une spécification** : une description en prose + un script Perl | C'est **la racine de l'ambiguïté** : chaque implémentation a divergé librement |
| **CommonMark** (2014 →) | **Une vraie spécification formelle** + une implémentation de référence (`cmark`) + **une suite de tests de conformité (~652 exemples, `spec.json`)** | CommonMark est né **précisément parce que** les implémentations divergeaient. C'est notre mètre étalon objectif |
| **GFM — GitHub Flavored Markdown** | CommonMark **+** quelques extensions : tableaux, texte barré, cases à cocher, liens automatiques, filtrage du HTML brut | Même suite de tests, étendue. C'est le dialecte que les modèles produisent le plus souvent |
| Pandoc markdown, Markdown Extra, MultiMarkdown | Des **surensembles** propriétaires | Rappel : « Markdown » n'est pas un seul objet, mais une famille |

**Conclusion utile** : oui, le Markdown **a des standards**, et oui, on peut s'y conformer plutôt
que de s'ajuster à nos fixtures. Le mètre étalon n'est plus « ce que contient
`atelier_importateur_md.md` » mais **les ~652 cas officiels** — c'est ça le gain réel.

---

## 2. « Il suffit de les y entrer » — le oui, et les trois réserves précises

### Le oui
Le standard est **déterministe** : la même entrée produit **toujours le même arbre**. C'est
exactement ce qui manque à un parseur maison. On troque « ça marche sur mon fichier » contre
« ça marche sur les 652 cas de la spécification ».

### Réserve 1 — « déterministe » ne veut pas dire « simple »
Les passages les plus délicats sont **formellement spécifiés**, donc exigeants :

- l'**emphase/gras** (`*` et `**`) se résout par un **algorithme de piles sur les suites de
  délimiteurs** — c'est la section la **plus difficile** de la spécification ;
- les **conteneurs de blocs** avec « lignes de continuation paresseuses » (une ligne qui
  appartient à un paragraphe sans indentation correcte) ;
- les **blocs HTML**, les **définitions de liens de référence**, la **compacité des listes**
  et les **règles d'indentation** (quatre espaces = code, trois = liste, etc.).

Un analyseur conforme, c'est **du vrai travail d'ingénierie** (de l'ordre de 2 000 lignes
soignées), pas un script du week-end. Ce n'est pas un obstacle — c'est juste qu'il faut
**le savoir avant de promettre un délai**.

### Réserve 2 — le standard décrit la RECONNAISSANCE, jamais l'APPLICATION
CommonMark produit un **arbre de document** : `heading(niveau 3)`, `paragraph`, `list_item`,
`code_block`, `blockquote`… Il **ne dit rien** sur « un titre de niveau 3 doit porter le style
*Titre 3* dans InDesign ». Ce choix-là reste **entièrement le nôtre**.

> C'est le point le plus important de cette note : **un analyseur conforme ne stylera rien tout
> seul.** Il reconnaît ; nous appliquons. Les deux vivent aujourd'hui **mêlés** dans un seul
> fichier (`parseMarkdown` + `insertMarkdownWithStyles`).

### Réserve 3 — le runtime ExtendScript est bridé (ES3)
InDesign se pilote en **ExtendScript**, un JavaScript d'époque **ES3** : pas de `JSON` global
(le code sérialise à la main), pas d'`Array.prototype.indexOf`. Les bibliothèques Markdown
modernes (`markdown-it`, `remark`, `commonmark.js`) sont **ES5 ou plus** et **ne tournent pas
telles quelles** dans ce runtime.

⇒ « Il suffit de suivre le standard » signifie concrètement : **porter ou écrire** un analyseur
conforme en ES3, — ou en embarquer un et **vérifier** qu'il est compatible ES3. **Voilà le vrai
coût**, et il n'a rien à voir avec « pas de budget » : le coût est du **temps d'ingénierie**,
pas de l'abonnement.

---

## 3. Le Markdown des modèles n'est pas toujours du Markdown strict

Fait mesuré dans notre propre code : nous avons dû écrire `stripEmojis()` **parce que** les
modèles sèment des emojis dans les sorties — y compris dans les titres.

Autres écarts observés de la famille LLM :

- `**` entourant **toute une puce** (lue à tort comme un titre synthétique — d'où la décision
  FJD du 27/09 : *une puce reste toujours une puce*) ;
- marqueurs de liste incohérents (`-`, `*`, `•` mélangés) ;
- tableaux sans la ligne d'alignement exigée par GFM ;
- ponctuation « intelligente », tirets longs, espaces insécables.

⇒ **La bonne forme n'est pas « conforme ou rien »**, mais :

1. **une reconnaissance conforme d'abord** (l'arbre est correct sur le Markdown bien formé) ;
2. **une couche de tolérance ensuite, explicite et MESURÉE** (ce qui a été devié le sera **au
   journal**, jamais en silence).

Un écart toléré qui n'est pas journalisé est un mensonge qui attend son heure — c'est
précisément la leçon des Cas 22/23/24 du wiki (« le compteur qui ment »).

---

## 4. Où se situe exactement la factorisation

Aujourd'hui, **deux responsabilités sont fusionnées** dans le même fichier :

```
   (1) RECONNAÎTRE                     (2) APPLIQUER
   texte .md ──► arbre / blocs         blocs ──► styles InDesign
   (parseMarkdown)                     (insertMarkdownWithStyles + md-style-map)
   ────────────────────────────────    ─────────────────────────────────────────
   devrait être PROJET-INDÉPENDANT     reste 100 % PROJET (nos choix, nos styles)
        ↑ c'est ICI qu'on vise un analyseur standard
```

**Factoriser** = **couper entre (1) et (2)**, pas « écrire un meilleur parseur ».

- La couche **(1)** ne doit **rien savoir d'InDesign** : elle prend du texte, rend une structure
  neutre. Elle devient vérifiable contre les ~652 cas officiels.
- La couche **(2)** garde tout le projet : le mapping `md-style-map`, les styles du document,
  et le **distributeur de tag de bloc** (voir §5).

Cette coupe est **le vrai livrable du chantier futur**. Elle a un bénéfice immédiat : un bug
« ça stylise mal » n'obligera plus à suspecter tout à la fois.

---

## 5. Les deux idées rattachées (à ne pas perdre)

### 5.1 L'observateur des fluctuations (chronomètre mensuel)
Un **chien de garde de conformité** : une tâche mensuelle interroge l'**API HTTP** des grands
modèles et regarde si leur Markdown est **toujours conforme**.

⚠️ **Cadre honnête, à acter d'avance** — sinon l'outil coûte plus qu'il ne rapporte :
- il **observe** la dérive, il **ne bloque jamais** un import ;
- accès API/MCP **par modèle** (hétérogène) ; cas **Mistral** : « RGPD-compatible, FR » est un
  **argument à préserver**, pas un détail ;
- **coût / quotas** : un rendez-vous mensuel avec plusieurs modèles, c'est un budget à cadrer ;
- **non-déterminisme** : une réponse différente **ne veut pas dire** « standard cassé ». Le
  garde-fou doit distinguer *variation normale* et *vraie rupture*.

### 5.2 Le distributeur de tag de bloc (la plus forte des deux)
Le plugin **parse les styles réellement présents dans le document INDD courant**, les **mappe
aux tags Markdown** (`**`, `##`, `-`…), et **note la chaîne du nom de style DANS le tag de bloc**
pour faciliter le stylage à l'import.

⇒ **C'est une INVERSION du sens actuel.** Aujourd'hui : `md-style-map` (étiquette rangée dans le
document) va **tag MD → nom de style**. La proposition va **lire les styles du document → écrire
la chaîne dans le tag**. On réutilise le mécanisme d'étiquette déjà en place (`doc.insertLabel`),
on n'invente rien.

⚠️ **Piège à graver** : écrire un nom de style (`Titre 1`) dans le `.md` rend le `.md`
**dépendant de CE document**. Un autre document, d'autres noms ⇒ résultat faux. Donc :
**le tag MD canonique reste obligatoire** (`##` reste `##`) ; le nom de style n'est qu'un
**indice / repli**, jamais l'unique source de vérité.

### 5.3 Contrainte technique commune (bloquante pour 5.2, à traiter un jour)
`parseMarkdown` **ne gère aucun commentaire HTML**. Un marqueur du type
`<!-- md:bloc-xxxx -->` ressort aujourd'hui en **texte VISIBLE** dans InDesign (branche par
défaut → bloc `type:"p"`).

⇒ Toute idée de « tag écrit dans le MD » suppose d'apprendre à l'analyseur à **reconnaître et
sauter** ce marqueur. C'est de la **couture interne** (analyseur maison ⇒ personne d'externe à
convaincre).

**DÉCISION ACTÉE (FJD, 30/09/2026)** — ce n'est plus une hypothèse mais une ligne de route :
**`parseMarkdown` sera modifié pour lire nos commentaires.** C'est acquis, et ce n'est pas la
priorité du moment : **le panneau passe avant.**

---

## 6. Ce que cette note ne fait pas

- Elle **ne réordonne pas** les missions : le panneau Import MD reste la priorité.
- Elle **ne touche pas** au wiki (`doc/wiki_extendscript_indesign.md`) — il ne sera nourri
  qu'après un succès réel.
- Elle **ne propose pas de calendrier** : « chantier futur » au sens strict.
- Elle **ne tranche pas** la question « portage maison en ES3 » vs « embarquement d'une
  bibliothèque ES3-compatible » — c'est un arbitrage à faire **au moment d'ouvrir le chantier**,
  avec une mesure à l'appui.

---

## 7. Question à garder ouverte (pour le jour où on ouvre le chantier)

> **Quel dialecte viser en premier : CommonMark strict, ou GFM ?**

GFM est un **surensemble** de CommonMark et correspond au dialecte réellement produit par les
modèles (tableaux, cases à cocher). Viser **GFM** paraît plus utile dans notre cas — mais cela
reste **à valider**, et la décision appartient à l'Architecte / FJD.

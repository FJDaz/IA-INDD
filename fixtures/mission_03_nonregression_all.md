# FIXTURE 01 : chatgpt_convention.md

# Rapport de synthèse : Refonte du pipeline de build

> Statut : v0.1
> Date : 2026-09-25
> Contexte : évaluation technique avant lancement

## 1. Contexte

### 1.1 Constat

Le pipeline actuel accumule des temps de build croissants, sans qu'aucune cause unique n'ait été isolée.

### 1.2 Problème

Les développeurs contournent le pipeline en local, ce qui masque les régressions jusqu'à l'intégration continue.

## 2. Objectifs

### 2.1 Objectif principal

Réduire le temps de build de 40% sans changer la stack de compilation existante.

### 2.2 Objectifs secondaires

- Réactiver la vérification systématique en local
- Documenter les étapes du pipeline pour les nouveaux arrivants

## 3. Architecture

Le pipeline se décompose en trois étapes séquentielles.

#### 3.1.1 Étape de compilation

Première étape, actuellement la plus lente.

### 3.2 Étape de tests

- Tests unitaires
- Tests d'intégration
- Tests de bout en bout

## 4. Données de référence

| Étape | Durée actuelle | Durée cible |
|---|---|---|
| Compilation | 4min 20s | 2min 30s |
| Tests | 6min 10s | 4min 00s |
| Packaging | 1min 45s | 1min 45s |

## 5. État du projet

En cours d'évaluation, aucune décision de lancement prise à ce stade.

---

## Annexe

### A. Historique des décisions

**2026-09-20**
- Décision : reporter la migration vers un nouveau compilateur
- Raisonnement : risque trop élevé sans période de test dédiée


# FIXTURE 02 : claude_sample.md

# Rapport de synthèse : Migration API v2

## Contexte

Le service actuel repose sur une architecture legacy qui présente plusieurs limites connues.

### Problèmes identifiés

- Latence moyenne de 340ms sur les requêtes de lecture
- Absence de mise en cache au niveau applicatif
- Couplage fort entre la couche de présentation et la logique métier

### Objectifs de la migration

1. Réduire la latence sous les 100ms
2. Introduire un cache Redis en amont de la base
3. Découpler les couches via une API REST versionnée

## Architecture proposée

La nouvelle architecture s'appuie sur trois composants principaux : un **gateway API**, un **service de cache**, et la **base de données** existante, conservée sans modification de schéma.

> Ce choix de conservation du schéma existant limite le risque de régression, au prix d'une dette technique assumée sur le moyen terme.

### Composants

| Composant | Rôle | Statut |
|---|---|---|
| Gateway | Routage et authentification | À développer |
| Cache Redis | Réduction de la latence | À déployer |
| Base existante | Persistance | Inchangée |

## Risques et mitigations

Le principal risque identifié concerne la *cohérence du cache* lors des écritures concurrentes. Une stratégie de cache invalidation par événement (plutôt que par TTL seul) est recommandée pour limiter ce risque.

### Plan de test

- Tests de charge sur l'environnement de pré-production
- Validation de la cohérence cache/base sur 48h
- Rollback automatisé en cas de dépassement du seuil d'erreur (>1%)

## Conclusion

La migration présente un rapport bénéfice/risque favorable, sous réserve d'une phase de validation rigoureuse en pré-production avant bascule.


# FIXTURE 03 : deepseek_formation.md

# Programme de Formation : Construire ses outils InDesign avec l'IA et ExtendScript

---

## Informations Générales

* **Public cible :** Maquettistes, graphistes, directeurs artistiques, responsables de production prépresse.
* **Prérequis :** Maîtrise courante d'InDesign. Aucune expérience préalable en programmation requise.
* **Durée recommandée :** 3 à 4 jours (21 à 28 heures).
* **Stack technique IA :** OpenRouter, VS Code, DeepSeek V4 Pro (Architecte), DeepSeek V4.1 Flash (Ouvrier).
* **Coût API estimé :** ~0,60 $ (~0,55 €) par stagiaire / jour.

---

## Module 1 — Remise à niveau : Maîtriser les briques InDesign à automatiser
*Objectif : Consolider la maîtrise des fonctions avancées d'InDesign indispensables à une automatisation robuste.*

* **Styles de paragraphe et de caractère avancés**
  * Structuration rigoureuse et enchaînements de styles (*Style suivant*).
  * Puces et numérotations complexes.
* **Styles imbriqués et styles GREP**
  * Automatisation typographique native au sein des paragraphes.
  * Application dynamique des styles de caractère sans modifier la structure du texte.
* **Rechercher/Remplacer avancé & GREP**
  * Syntaxe GREP essentielle (classes de caractères, quantificateurs, captures).
  * Nettoyage automatique, reformatage et restructuration du texte par expressions régulières.
* **Tableaux et styles de tableau / cellule**
  * Logique de formatage des tableaux InDesign.
  * Combinaison des styles de tableaux, de cellules et de paragraphes imbriqués.
* **Objets ancrés**
  * Ancrage en ligne, personnalisé ou au-dessus du texte.
  * Comportement des objets dans le flux de texte (prérequis pour la mise en page automatique par script).
* **Variables de texte**
  * En-têtes courants dynamiques, numérotations, métadonnées et champs personnalisés.
* **Gabarits et héritage**
  * Structuration des gabarits parents/enfants.
  * Masquage, libération d'éléments et gestion propre de l'héritage.

---

## Module 2 — Fondations techniques et environnement de dev
*Objectif : Comprendre le fonctionnement des LLM et installer un environnement de travail efficace.*

* **Comprendre les modèles et l'écosystème LLM**
  * Architecture Transformer, fenêtre de contexte, modèles open source vs propriétaires.
  * Clés API, rôle des *providers* et agrégateurs (OpenRouter).
* **Méthodologie de pilotage par l'IA**
  * Posture d'Architecte vs posture d'Ouvrier.
  * Établissement de la roadmap et chronologie de traitement (RM > RMA).
* **Environnement ExtendScript et IDE**
  * Anatomie d'un script InDesign et intégration dans le système d'exploitation.
  * Installation et configuration de VS Code.
  * Inscription OpenRouter et configuration de l'extension *OpenRouter for VS Code*.
  * Configuration du multi-fenêtrage Copilot/Chat pour séparer les rôles.
  * Structuration de l'espace de travail (documentation structurée).

---

## Module 3 — Fil rouge guidé : Développer un importateur Markdown
*Objectif : Créer un script complet en appliquant la méthode de travail IA, la Sandbox de simulation et le Wiki de suivi.*

* **Cahier des charges et spécifications de l'outil**
  * Périmètre : import Markdown vers styles InDesign existants sans marqueurs (`#`, `*`, `-`).
  * Reprise dynamique de la feuille de styles du document ouvert.
* **Gestion des erreurs et capitalisation**
  * Traitement des bugs et résolution du problème des alertes bloquantes.
  * Création du Wiki d'écosystème (alimentation du contexte).
  * Structure d'une fiche cas : symptôme / cause / correction / leçon transversale.
  * Boucle récursive : documentation immédiate, consultation obligatoire du Wiki avant tout nouveau correctif ou *feature*.
* **Sandbox Node.js de simulation**
  * Problématique : gérer les correctifs consécutifs sur la traction du texte.
  * Émulation autonome du flux de texte InDesign en Node.js (hors ExtendScript).
  * Alignement du code réel guidé par la simulation avant test dans InDesign.
  * Règle absolue : passage obligatoire par la Sandbox pour toute modification du modèle texte.
* **Optimisation du document InDesign et fonctionnalités avancées**
  * Mapping de styles et anticipation par conventions HTML.
  * Ajout du support des tableaux Markdown vers les tables InDesign natives.
  * Rédaction finale du Wiki de cas techniques et formalisation de la méthode.

---

## Module 4 — Atelier personnel : Création d'un outil métier
*Objectif : Concevoir et développer son propre script d'automatisation sur la base de ses besoins de production.*

* **Cadrage du besoin**
  * Identification des tâches grises répétitives en production.
  * Inférence du cahier des charges de l'outil individuel.
* **Architecture et planification**
  * Projection de la roadmap et stratégie de *prompting* Architecte/Ouvrier.
  * Mise en place du journal de logs, du Wiki et de la Sandbox dédiés.
* **Implémentation et recette**
  * Implémentation itérative soutenue par l'IA.
  * Vérification humaine de la logique code et des contraintes métier InDesign.
  * Phase de tests, recette et améliorations.

---

## Fiche Logistique et Budgétaire

### Répartition temporelle suggérée (Format 3 jours)
* **Jour 1 :** Module 1 (Remise à niveau InDesign) + Début du Module 2 (Concepts LLM, Setup VS Code).
* **Jour 2 :** Fin du Module 2 + Module 3 complet (Fil rouge Importateur MD, Wiki récursif, Sandbox Node.js).
* **Jour 3 :** Module 4 (Atelier individuel, conception du script métier, tests et mise en production).

### Estimation Budgétaire API (OpenRouter)
* **Configuration :** 
  * *DeepSeek V4 Pro* pour le rôle d'Architecte (Specs, choix d'architecture).
  * *DeepSeek V4.1 Flash* pour le rôle d'Ouvrier (Génération ExtendScript & Node.js).
* **Volumétrie moyenne :** 60 à 80 requêtes / stagiaire / jour.
* **Coût estimé :** **~0,60 $ / stagiaire / jour** (soit environ 1,80 $ par stagiaire pour les 3 jours).


# FIXTURE 04 : deepseek_referentiel.md

# Vérification : Correspondance entre les compétences C1-C5 et le référentiel DN MADE

## Résultats de vérification : Correspondance entre vos C1-C5 et le référentiel officiel

### C1 — Analyser / contextualiser

**Correspondance officielle** : ✅ Existe dans le référentiel officiel

Les compétences correspondantes dans le référentiel officiel incluent :

- « Mobiliser une culture générale artistique et une connaissance des concepts issus de disciplines connexes pour analyser et apprécier les contextes de création... »
- « Identifier, sélectionner, organiser diverses ressources spécialisées, pertinentes et vérifiées, pour documenter un sujet »
- « Observer, analyser et évaluer les pratiques et des univers visuels de référence »

**Points à noter** : La formulation « site urbain amiénois » que vous mentionnez est une **localisation pédagogique propre à un établissement**, et ne constitue pas une compétence officielle du référentiel national.

### C2 — Expérimenter / développer

**Correspondance officielle** : ✅ Existe dans le référentiel officiel

Les compétences correspondantes dans le référentiel officiel incluent :

- « Expérimenter des outils de création et de recherche plastique et conceptuelle permettant de structurer les étapes d'un projet et leurs interactions »
- « Démontrer une pratique plastique personnelle maîtrisée »

**Points à noter** : La classification des « postures visuelles » (formelle, opérationnelle, tribale, etc.) est une **méthode d'enseignement propre à un établissement**, et ne figure pas dans le référentiel officiel.

### C3 — Concevoir / modéliser

**Correspondance officielle** : ✅ Existe dans le référentiel officiel

Les compétences correspondantes dans le référentiel officiel incluent :

- « Mettre en œuvre les matériaux, les techniques et les technologies innovantes ou traditionnelles dans le cadre de la conception et de la réalisation de tout ou partie d'un projet »
- « Énoncer des hypothèses relevant d'aménagements... argumenter ses choix au travers de supports et de média adaptés »

**Points à noter** : Les éléments spécifiques tels que « système d'identité visuelle », « logotype principal », « palette chromatique » sont des **spécifications de projet** au niveau de la mention Graphisme, plutôt que des intitulés de compétences officiels indépendants.

### C4 — Réaliser / fabriquer (maîtrise d'Adobe Illustrator)

**Correspondance officielle** : ⚠️ Existe partiellement

La compétence correspondante dans le référentiel officiel est :

- « Prototyper ou réaliser tout ou partie du projet en incluant les outils numériques CAO, DAO, PAO »

**Points à noter** : **Le référentiel officiel ne mentionne pas de logiciels spécifiques**. « Maîtrise d'Adobe Illustrator » est une **exigence d'enseignement propre à un établissement**. Les outils tels que « Plume », « Pathfinder », « vectorisation » sont des spécifications d'outils plutôt que des compétences officielles.

### C5 — Communiquer / valoriser

**Correspondance officielle** : ✅ Existe dans le référentiel officiel

Les compétences correspondantes dans le référentiel officiel incluent :

- « Énoncer ses idées, argumenter ses choix et communiquer efficacement les multiples aspects d'un projet »
- « Communiquer efficacement ses idées, oralement et graphiquement, et collaborer au sein d'une équipe et avec tous les acteurs d'un projet »
- « Formaliser et rendre visible ses expériences pour valoriser son identité personnelle »

**Points à noter** : La mention spécifique de « cahier de normes » ou « planche de présentation » comme exigence de forme de rendu constitue une **spécification d'évaluation propre à un établissement**.

## Conclusion

**Vos compétences C1-C5 sont une réorganisation et une subdivision du référentiel officiel par un établissement**, et non la structure originale du référentiel officiel DN MADE. Le référentiel officiel adopte une organisation par « blocs de compétences », comprenant des compétences transversales et des compétences spécifiques à la mention.


# FIXTURE 05 : gemini_charte.md

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


# FIXTURE 06 : test_min_01_texte.md

Premier paragraphe de test : texte brut, sans titre, sans liste, sans mise en forme, sans tableau. C'est le cas minimal de l'étape 1 de la mission 03. Si l'insertion de ce seul bloc échoue, le problème est dans la couche de base, pas dans les couches styles/segments/tables.

Deuxième paragraphe : il sert à vérifier l'ordre d'insertion en fin de story. Après le test, l'ordre attendu est paragraphe 1, puis 2, puis 3. Toute inversion ou duplication est un échec de l'étape 1.

Troisième paragraphe : après validation en réel InDesign, commit git « M03 étape 1 : insertion texte brut OK », puis passage à l'étape 2 (styles de paragraphe).


# FIXTURE 07 : test_min_02_styles.md

# Titre de niveau 1

Paragraphe standard juste apres le titre 1.

## Titre de niveau 2

Paragraphe standard apres le titre 2.

### Titre de niveau 3

Paragraphe standard apres le titre 3.

> Citation de test pour le mapping du style citation.

- Item a puces pour le mapping du style liste.

1. Premier item numerote du mapping styles.
2. Deuxieme item numerote du mapping styles.

Paragraphe final de l'etape 2.


# FIXTURE 08 : test_min_03_titres.md

# Titre 1 principal

Paragraphe introductif sous le titre 1.

## Titre 2 premier

Paragraphe sous le titre 2 premier.

### Titre 3 premier

Paragraphe sous le titre 3 premier.

* **Item de liste entierement en gras (option 1 : reste une puce)**
* Item de liste normal apres la puce en gras.

## Titre 2 second

Paragraphe sous le titre 2 second.

### Titre 3 second

Paragraphe sous le titre 3 second.

#### Titre 4 par quatre dieses (vrai titre depuis l'etape 3)

Paragraphe sous le titre 4.

##### Titre 5 par cinq dieses

Paragraphe sous le titre 5.

###### Titre 6 par six dieses (sonde H6)

Paragraphe sous la sonde H6.

####### Titre 7 par sept dieses (sonde H7)

Paragraphe sous la sonde H7.

Paragraphe final de l'etape 3.


# FIXTURE 09 : test_min_04_segments.md

# Segments inline

Paragraphe avec du **gras au milieu** du texte pour tester les segments.

Paragraphe avec de l'*italique au milieu* du texte pour tester les segments.

Paragraphe avec **gras et *italique imbrique*** dans la meme phrase.

Paragraphe avec mot_gras_isole **seul** puis suite du texte normal.

- Item de liste avec **gras** a l'interieur.
- Item de liste avec *italique* a l'interieur.
- Item normal sans mise en forme, pour controle.

Paragraphe final de l'etape 4.


# FIXTURE 10 : test_min_05_listes.md

# Listes et indentation

Paragraphe introductif avant les listes.

- Item de liste niveau 1 alpha.
- Item de liste niveau 1 beta.
  - Item de liste niveau 2 beta-un.
  - Item de liste niveau 2 beta-deux.
    - Item de liste niveau 3 beta-deux-a.
- Item de liste niveau 1 gamma.

1. Item numerote un.
2. Item numerote deux.
3. Item numerote trois.

# Section avec sous-titre de liste

* **Sous-titre de liste en gras**
* Item de liste sous le sous-titre.
* Deuxieme item de liste sous le sous-titre.

Paragraphe final de l'etape 5.


# FIXTURE 11 : test_min_06_tables.md

# Tableaux

Paragraphe introductif avant le tableau.

| Colonne A | Colonne B | Colonne C |
|-----------|-----------|-----------|
| Valeur A1 | Valeur B1 | Valeur C1 |
| Valeur A2 | Valeur B2 | Valeur C2 |
| Valeur A3 | Valeur B3 | Valeur C3 |

Paragraphe entre les deux tableaux.

| Cle | Sens |
|-----|------|
| h1  | titre 1 |
| p   | paragraphe |

Paragraphe final de l'etape 6.


# FIXTURE 12 : test_min_07_code.md

# Blocs de code

Paragraphe introductif avant le code.

```
ligne de code brute une
ligne de code brute deux
```

Paragraphe entre les deux blocs de code.

```javascript
var x = 1;
```

Paragraphe final avant le code markdown.

```markdown
# Ceci est un exemple H1 en literral
- et une puce en littral
| a | b |
| :--- | :--- |
| 1 | 2 |
```

Paragraphe final de l'etape 7.


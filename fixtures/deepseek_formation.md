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

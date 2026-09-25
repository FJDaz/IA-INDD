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

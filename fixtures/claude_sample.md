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

# Prompt veille — MCP vs UXP pour pilotage InDesign

Contexte : je développe un plugin InDesign (ExtendScript + exploration UXP) qui importe du Markdown mappé sur la charte de styles d'un document — mais l'objectif premier n'est pas de livrer un produit : c'est un projet de **formation/pédagogie**, conçu pour démontrer une méthode de travail rigoureuse (documentée par 45+ cas techniques vérifiés, pièges API, protocole test-avant-code) et candidater à des postes/missions de formateur sur ces technos. Je veux donc aussi comprendre ce qui est pédagogiquement exploitable (facile à démontrer, à expliquer, à faire reproduire par des apprenants), pas seulement ce qui est techniquement optimal. Je viens de découvrir deux références :
- https://github.com/lucdesign/indesign-mcp-server
- https://www.mikechambers.com/blog/post/2025-06-06-exploring-ai-integration-with-adobe-photoshop-indesign-and-premiere-pro/

Je veux comprendre précisément la fourche technique, pas une vue générale marketing.

**Ce que je demande** :

1. **Cartographie des familles de solutions** pour piloter InDesign depuis un agent IA : UXP natif (plugin dans l'app), MCP (Model Context Protocol, serveur externe exposant des outils), ExtendScript classique + pont réseau, autres. Pour chaque famille : ce qu'elle permet, ce qu'elle ne permet PAS, où elle s'exécute (dans l'app / process externe), latence/fiabilité connues.

2. **Cas d'usage précis à trancher** : un outil qui (a) adapte un brief reçu par mail vers une mise en page InDesign, (b) interprète un gabarit PDF de couverture, (c) suit des messages de fabrication — est-ce plutôt un candidat MCP (agent externe qui pilote InDesign via des commandes) ou UXP (logique embarquée dans le plugin) ? Donne le critère de décision, pas juste une réponse.

3. **État de la concurrence/écosystème réel en 2026** sur le pilotage InDesign par agent IA (pas Photoshop seul) — projets connus, maturité, ce qui manque encore.

4. **Exemples concrets** (repos, articles, specs) illustrant chaque famille de solution pour InDesign spécifiquement.

5. **Angle pédagogique** : pour chaque famille (UXP, MCP, ExtendScript+pont), quelle est la courbe d'apprentissage pour un public de formation (débutant à intermédiaire en dev), quels prérequis, quel est le meilleur "premier cas" à faire construire à des apprenants pour toucher la vraie difficulté sans les noyer.

Réponds avec des sources datées et vérifiables, pas des généralités. Je compare ensuite tes réponses avec celles obtenues sur les mêmes questions via d'autres outils.

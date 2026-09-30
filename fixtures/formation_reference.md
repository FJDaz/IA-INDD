# Construire son UI sur InDesign avec l’IA

Les Cassandres annoncent la disparition prochaine des graphistes. Dans le print, il suffit pourtant de regarder la réalité de la production :  sortir 40 000 exemplaires conformes avec Claude n’arrivera pas demain. Le métier, ses contraintes techniques et son savoir-faire restent déterminants.

Cela ne signifie pas que rien ne va changer. L’IA va profondément modifier les façons de produire, de contrôler et d’automatiser le travail. Et ces transformations vont s’accélérer. L’enjeu n’est  pas de savoir si l’IA va remplacer le métier, mais de nous en saisir et de le transformer nous-mêmes, graphistes chevronnés. Notre connaissance d’InDesign, du prépresse, des contraintes de production et des usages réels du métier constitue précisément le point de départ de cette mutation. L’IA peut produire du code et automatiser des tâches, mais c’est notre connaissance du métier qui permet de savoir ce qu’il faut répéter, comment et selon quelles contraintes. Cette formation propose donc de partir du métier pour construire ses propres outils avec l’IA : identifier les tâches répétitives, coûteuses en temps comme en énergie, puis mettre en place un environnement de développement de scripts et de fonctionnltés natives qui réponde précsément et fidèlement à ses besoins propres.

#### Le métier va changer et ce sont les graphistes qui connaissent et l’A et leur métier qui présideront le mieux à cette transformation.

### 9h00 → 10h30 - Qu’est-ce qu’un modèle ?

- Transformer
- Contexte et fenêtre de contexte
- Modèles propriétaires et modèles open source
- API
- Providers

### 11h00 → 13h00 - Révision des fondamentaux InDesign

- Styles de paragraphe et de caractère
- Enchaînements de styles avec Style suivant
- Puces et numérotations
- Styles imbriqués et styles GREP
- Rechercher / Remplacer avancé
- Syntaxe GREP
- Tableaux, styles de tableau et styles de cellule
- Objets ancrés
- Variables de texte
- Gabarits et héritage

### 14h00 → 15h30 - Concevoir avant de coder

- Architecte / Ouvrier
- Roadmap
- RM → RMA
- Découpage du problème
- Installation de plugins dans VS Code
- OpenRouter
- Plugins provider

### 16h00 → 17h30 - Préparer le chantier

- Wiki
  - Collecte thématique de la doc officielle avant chaque run
  - Alimentation du wiki
- Boucle récursive :
  - consultation > implémentation > correction des bugs > alimentation du wiki avec retours d’expérience
- Wiki scale-up :
  - Repérage de toxicité des contenus (calibrage seuillé : 1000 l, 3000 l et +)
  - md > md + sommaire hypertexte > factorisation > système RAGDocumentation structurée
- Préparer un modèle INDD
  - Structure de styles INDD HTML-like :
    - h1, h2, h3, p, li, blockquote, em, italic, bold...
  - Mapping vers les styles InDesign
  - Normalisation des sources
    - Schémas MD des grands modèles
- Méthode de simulation
  - Principe de la Sandbox Node
  - Émulation du flux Markdown → modèle InDesign
  - Fixtures
  - Limites de la simulation

### 9h00 → 10h30 - Premier script

- ExtendedScript / scripts InDesign
- Créer un script, installer le script, exécuter et modifier un script simple
- Passage du besoin au cahier des charges
- Définition des inputs et outputs (##; ¨¨…)

### 11h00 → 13h00 - Lancer le chantier Markdown

- Construire les specs
- Définir les critères de vérification
  - Atelier fil rouge : importateur Markdown
    - premiers runs
    - Correction guidée par la simulation
    - panneau scrpts
    - au curseur, au bloc, loaded gun
    - les différences à l’import, les limites du DOM ExtendScript

### 14h00 → 15h30 - Construire et corriger

- Mapping de styles
- Tests des fixtures
- Montage incrémental par standard MD de modèles

### 16h00 → 17h30 - Capitaliser et faire évoluer

- Factorisation
- Surveillance de la taille et de la complexité du code
- Insertion au menu INDD
- Introduction à UXP

### 9h00 → 10h30 - Découverte UXP

- Pourquoi passer du script au panneau
- ExtendScript = le moteur
- UXP = le tableau de bord
- UXP Developer Tool
- Chargement dans InDesign
- Inspection et débogage

### 11h00 → 13h00 - UXP piloté par l’IA et conception métier

- Sonde d’accès au panneau
- Sonde d’accès du pannau au scrpt
- Sonde d’accès du panneau à l’import
- Sonde de persistance
- Sonde de mise à jour
- Assemblage final de la fonctionnalité

#### Conception de l’outil personnel

- Identification des tâches grises
- Idées d’outils métier
- Inventaire des besoins
- Rédaction du CCG
- Choix de l’architecture avec le modèle architecte

### 14h00 → 15h30 - Atelier personnel : conception et démarrage

- Spec
- Roadmap
- wiki
- Sandbox
- fixtures
- Début de l’implémentation

### 16h00 → 17h30 - Atelier personnel : implémentation

- Vérification de la logique métier
- Tests
- Premières améliorations

### Fin de formation

Chacun repart avec son chantier amorcé et une méthode pour poursuivre le développement chez lui.

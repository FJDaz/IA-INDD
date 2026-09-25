# Plugin InDesign : Import Markdown avec mapping dynamique des styles

## Description

Ce plugin permet d'importer du contenu Markdown dans InDesign avec un mapping automatique sur la charte de styles **réelle** du document ouvert. Aucun nom de style n'est codé en dur : le plugin lit dynamiquement les styles disponibles dans le document et propose à l'utilisateur de les associer aux éléments Markdown.

## Scope (v1)

### Inclus
- Titres `#`, `##`, `###` → styles de paragraphe
- Paragraphe standard → style de paragraphe
- Listes à puces (`- `) → style de paragraphe
- Citations (`> `) → style de paragraphe
- Gras (`**texte**`) et italique (`*texte*`) → styles de caractère

### Exclu (hors scope v1)
- Tableaux Markdown
- Notes de bas de page
- Styles de cellule / styles d'objet
- Gestion multi-documents
- Liens, images, code inline/bloc

## Installation

### 1. Copier le fichier
Le script suivant doit être placé dans le dossier des scripts InDesign :

```
~/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/
```

- **`import_md.jsx`** - Script ExtendScript principal

Ce fichier est déjà copié dans ce dossier.

### 2. Assigner un raccourci clavier

1. Dans InDesign, aller dans **Édition > Raccourcis clavier...**
2. Sélectionner la catégorie **Scripts**
3. Trouver le script **Import MD** dans la liste
4. Assigner un raccourci clavier (par défaut : **Cmd+Shift+D** suggéré, à valider)
5. Cliquer sur **OK** pour enregistrer

## Utilisation

### Première utilisation (configuration requise)

1. Ouvrir un document InDesign avec une charte de styles définie
2. Sélectionner un bloc de texte (TextFrame)
3. Exécuter le script via le raccourci clavier ou le panneau Scripts
4. Une boîte de dialogue s'ouvre pour sélectionner un fichier Markdown (`.md`)
5. Une fenêtre de configuration s'ouvre :
   - Pour chaque élément Markdown (Titre 1, Titre 2, Paragraphe, etc.), sélectionner le style correspondant dans le document
   - Les styles de paragraphe sont proposés pour les éléments de bloc
   - Les styles de caractère sont proposés pour Gras et Italique
6. Cliquer sur **OK** pour sauvegarder le mapping
7. Le contenu Markdown est inséré dans le bloc sélectionné avec les styles appliqués (sans les marqueurs Markdown : `#`, `*`, `-`, `>`)

### Utilisations suivantes

- Le mapping est sauvegardé **dans le document InDesign lui-même** (via un label)
- Lors des exécutions suivantes sur le même document, le script utilise automatiquement le mapping enregistré
- Si un style référencé a été supprimé du document, la configuration est relancée automatiquement

## Architecture technique

### Fichiers

| Fichier | Rôle | Langage |
|--------|------|---------|
| `import_md.jsx` | Script principal : parsing, mapping, application des styles | ExtendScript (ES3) |

### Flux de traitement

```
1. Raccourci clavier déclenché
   ↓
2. Vérification de la sélection (doit être un TextFrame)
   ↓
3. Dialogue natif pour sélectionner un fichier Markdown
   ↓
4. Parsing du Markdown
   ↓
5. Chargement du mapping depuis le document (si existe)
   ↓
6. [Si mapping invalide/absent] Affichage de l'UI de configuration
   ↓
7. Sauvegarde du mapping dans le document (label)
   ↓
8. Insertion du contenu avec application des styles
   ↓
9. Confirmation à l'utilisateur
```

### Stockage du mapping

Le mapping Markdown → Styles est stocké dans un **label** du document InDesign :
- Nom du label : `md-style-map`
- Format : JSON
- Exemple : `{"h1":"Titre 1","h2":"Sous-titre","p":"Corps de texte","bold":"Gras","italic":"Italique"}`

### Gestion des erreurs

Le plugin vérifie explicitement et alerte l'utilisateur pour :
- Sélection active non valide (pas un TextFrame)
- Aucun fichier sélectionné (annulation) → arrêt silencieux
- Fichier vide ou sans contenu texte
- Style référencé dans le mapping mais supprimé du document
- Aucune correspondance pour certains tags Markdown

## Personnalisation

### Modifier les tags Markdown supportés

Éditer la variable `MARKDOWN_TAGS` dans `import_md.jsx` :

```javascript
var MARKDOWN_TAGS = {
    "h1": { type: "paragraph", display: "Titre 1 (#)" },
    "h2": { type: "paragraph", display: "Titre 2 (##)" },
    // ... ajouter d'autres tags ici
};
```

- `type` : soit `"paragraph"` (style de paragraphe) soit `"character"` (style de caractère)
- `display` : texte affiché dans l'UI de configuration

### Changer le nom du label

Modifier la variable `LABEL_NAME` dans `import_md.jsx` :

```javascript
var LABEL_NAME = "mon-nom-de-label";
```

## Compatibilité

- **InDesign** : Version 21.0 (2025) et ultérieures
- **Système** : macOS et Windows (dialogue natif ExtendScript)
- **Langage** : ExtendScript (compatible ES3, pas d'ES6+)

## Limitations connues

1. **ExtendScript ancien** : Le moteur JavaScript d'InDesign est limité à ES3, donc pas de syntaxe moderne
2. **Pas de prévisualisation** : Le mapping doit être configuré avant de voir le résultat
3. **Un seul niveau de liste** : Les listes imbriquées ne sont pas supportées

## Dépannage

### Le script ne s'affiche pas dans le panneau Scripts
- Vérifier que le fichier est bien dans le dossier `Scripts Panel`
- Redémarrer InDesign
- Vérifier que le dossier correspond à la version d'InDesign utilisée

### La fenêtre de dialogue de fichier ne s'ouvre pas
- Vérifier que JavaScript est activé dans InDesign
- Essayer avec un document plus simple

### La fenêtre de configuration ne s'affiche pas
- Vérifier que JavaScript est activé dans InDesign
- Essayer avec un document plus simple

### Les styles ne sont pas appliqués
- Vérifier que le mapping a bien été sauvegardé (label `md-style-map` existe dans le document)
- Vérifier que les noms de styles n'ont pas été modifiés dans le document

## License

Ce code est fourni tel quel, sans garantie. Libre d'utilisation et de modification.

---

**Statut** : ✅ Implémenté
**Version** : 1.0
**Date** : 2026-09-23

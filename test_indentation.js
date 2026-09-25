// Script de test pour la gestion de l'indentation des listes
// Extraction de la logique de parsing pour test unitaire

// Fonction de parsing simplifiée (simulant le parseur Markdown)
function parseMarkdown(markdownText) {
    var blocks = [];
    var lines = markdownText.split("\n");
    var currentBlock = null;
    var inCodeBlock = false;
    var currentTitleLevel = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.replace(/^\s+|\s+$/g, "");

        // Détecter les blocs de code
        var codeFenceMatch = trimmed.match(/^```(.*)$/);
        if (codeFenceMatch) {
            if (inCodeBlock) {
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = null;
                inCodeBlock = false;
            } else {
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = { type: "code", text: "", language: codeFenceMatch[1] || "", children: [] };
                inCodeBlock = true;
            }
            continue;
        }
        if (inCodeBlock) {
            if (currentBlock.text !== "") currentBlock.text += "\n";
            currentBlock.text += line;
            continue;
        }

        // Sauter les lignes vides
        if (trimmed === "") {
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            continue;
        }

        // Détecter les titres
        var h1Match = trimmed.match(/^#\s+(.*)/);
        var h2Match = trimmed.match(/^##\s+(.*)/);
        var h3Match = trimmed.match(/^###\s+(.*)/);

        if (h1Match) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "h1", text: h1Match[1], children: [] };
            currentTitleLevel = 1;
            continue;
        } else if (h2Match) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "h2", text: h2Match[1], children: [] };
            currentTitleLevel = 2;
            continue;
        } else if (h3Match) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "h3", text: h3Match[1], children: [] };
            currentTitleLevel = 3;
            continue;
        }

        // Détecter les citations
        var blockquoteMatch = trimmed.match(/^>\s+(.*)/);
        if (blockquoteMatch) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "blockquote", text: blockquoteMatch[1], children: [] };
            continue;
        }

        // Détecter les listes à puces
        var liIndentMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
        if (liIndentMatch) {
            var indentSpaces = liIndentMatch[1].length;
            var indentLevel = Math.floor(indentSpaces / 2);
            var liContent = liIndentMatch[2].replace(/\s+$/, "");

            // Item de liste ENTIÈREMENT en gras
            var fullyBoldMatch = liContent.match(/^\*\*(.+)\*\*$/);
            if (fullyBoldMatch && currentTitleLevel > 0 && indentLevel === 0) {
                if (currentBlock) blocks.push(currentBlock);
                var syntheticLevel = currentTitleLevel + 1;
                currentBlock = { type: "h" + syntheticLevel, text: fullyBoldMatch[1], children: [] };
                continue;
            }

            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "li", indentLevel: indentLevel, text: liContent, children: [] };
            continue;
        }

        // Traitement des listes numérotées
        var liNumMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (liNumMatch) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: "li_num", text: liNumMatch[2], children: [] };
            continue;
        }

        // Traitement des paragraphes standards
        if (currentBlock) {
            blocks.push(currentBlock);
        }
        currentBlock = { type: "p", text: trimmed, children: [] };
    }

    if (currentBlock) {
        blocks.push(currentBlock);
    }

    return blocks;
}

// Test avec le cas réel
var testMarkdown = `
# Programme de Formation : Construire ses outils InDesign avec l'IA — Charte Gemini

Voici le schéma de structure et la feuille de style micro-typographique appliqués à la rédaction des livrables Markdown.

---

## 1. Squelette de structure (Architecture MD)

* **Amorce de niveau 1** : explication synthétique du point clé.
  * Détail sous-jacent ou sous-puce de niveau 2 sans gras.
  * Deuxième détail.

### Sous-section optionnelle H3
`;

console.log("=== Parsing du Markdown ===");
var parsed = parseMarkdown(testMarkdown);
parsed.forEach(function(block, index) {
    console.log(index + ": " + block.type + " (indentLevel: " + (block.indentLevel || "N/A") + ") - " + block.text);
});

console.log("\n=== Simulation de la logique de cascade ===");
// Simuler la logique de sélection de style pour les listes imbriquées
function getStyleForLiBlock(block, availableStyles) {
    // Simuler la logique de cascade décrite dans la mission
    if (block.type !== "li") return block.type;
    
    // Vérifier si le style multi-niveau existe
    var styleName = "li" + (block.indentLevel + 1);
    if (availableStyles.includes(styleName)) {
        return styleName;
    }
    
    // Sinon, utiliser la cascade de titres
    // Pour simplifier, on suppose qu'on a h1 à h5 disponibles
    var maxTitleLevel = 5; // On suppose h5 comme maximum
    var titleLevel = Math.min(maxTitleLevel, block.indentLevel + 1 + 1); // +1 car on commence à h1
    
    // Si le niveau dépasse le maximum, utiliser li
    if (titleLevel > maxTitleLevel) {
        return "li";
    }
    
    return "h" + titleLevel;
}

// Simuler des styles disponibles
var availableStyles = ["li", "li2", "li3", "h1", "h2", "h3", "h4", "h5"];
console.log("Styles disponibles:", availableStyles);

parsed.forEach(function(block, index) {
    if (block.type === "li") {
        var style = getStyleForLiBlock(block, availableStyles);
        console.log(index + ": " + block.type + " (indentLevel: " + block.indentLevel + ") -> " + style);
    }
});
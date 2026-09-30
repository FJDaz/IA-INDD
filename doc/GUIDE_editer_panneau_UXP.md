# Guide — Éditer le design du panneau UXP (Sonde Import MD)

## Le problème
On ne peut **pas** éditer le design du panneau depuis le *Playground* de l'UDT.
Le Playground sert seulement à tester des bouts de code jetables : il ne connaît
pas les fichiers d'un plugin déjà chargé.

## Où vit le panneau
Dossier du plugin : `uxp/com.fjd.importmd.sonde/`

| Fichier | Rôle |
|---|---|
| `index.html` | **le design du panneau** (c'est ça qu'on veut arranger) |
| `main.js` | la logique (boutons, appels) |
| `manifest.json` | déclaration du plugin (`main: index.html`) |

Le dépôt est la **source de vérité** : les fichiers du dossier sont ceux que l'UDT charge.

## La méthode (obligatoire)
1. Ouvrir `uxp/com.fjd.importmd.sonde/index.html` (ou `main.js`) dans un **éditeur externe** (VS Code).
2. Modifier, enregistrer.
3. Dans l'**UDT** : **recharger le plugin** `com.fjd.importmd.sonde` (bouton *Reload* / *Load* du plugin).
4. Dans InDesign, fermer/rouvrir le panneau pour voir le résultat.

> Après **chaque** modification de `index.html` ou `main.js` → **recharger l'UDT**,
> sinon on regarde l'ancienne version et on croit que rien ne change.

## Ce que l'UDT attend
L'UDT pointe sur le **dossier** `uxp/com.fjd.importmd.sonde/`, pas sur un fichier.
Si l'on ne voit pas le plugin dans l'UDT, vérifier que le dossier pointé est bien
celui-ci (et non un ancien emplacement).

## En résumé
- Playground = non.
- Éditeur externe sur `index.html` + `main.js` = oui.
- Puis **Reload dans l'UDT**.

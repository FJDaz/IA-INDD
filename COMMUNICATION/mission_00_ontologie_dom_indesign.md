# Mission 00 — Base documentaire structurée : ontologie du DOM ExtendScript/InDesign

**Statut** : 🔴 À FAIRE
**Numérotation** : 00, pas 04 — ce chantier est fondationnel et rétroactif. Il aurait dû précéder la mission 01 ; il est rédigé après coup, une fois le besoin devenu visible par l'expérience (22+ bugs rencontrés en marchant).

## Contexte et origine

Après 3 jours de développement (mission_01) et une régression de fond (mission_03), le constat suivant s'est imposé : une bonne partie du temps perdu vient de la découverte au fil de l'eau de comportements du DOM InDesign qui contredisent la documentation communément citée sur les forums (ex. `story.paragraphs.length` peut valoir 0 après `contents = ""`, contrairement à ce qu'affirment plusieurs sources Adobe). Chaque Ouvrier — Qwen, GLM, DeepSeek — repart avec un niveau de connaissance différent et redécouvre potentiellement les mêmes pièges, ou pire, en introduit des nouveaux en supposant un comportement non vérifié.

FJD propose de construire, en amont, une base documentaire structurée : une recherche web ciblée sur le DOM ExtendScript/InDesign, organisée en ontologie (objets, propriétés, relations, pièges), qui devienne le contrat de référence pour tout Ouvrier, quel que soit le modèle utilisé.

**Important — ce que cette mission ne corrige pas** : elle n'aurait pas empêché l'incident GLM du 26/09 (recopie hallucinée d'un ancien message, cf. mission_03) — ce n'était pas un problème de connaissance du DOM mais une panne d'exécution. Cette mission réduit le risque d'hypothèses fausses sur le comportement InDesign, pas le risque qu'un Ouvrier n'exécute rien du tout.

## Objectif

Produire un document d'ontologie (`doc/ontologie_dom_indesign.md` ou format structuré équivalent, à trancher en section Forme) couvrant les objets du DOM InDesign effectivement utilisés ou susceptibles de l'être dans ce projet, avec pour chacun : propriétés clés, méthodes clés, relations avec les objets voisins, pièges connus (confirmés par test réel ou par citation exacte de doc officielle), et sources citées.

## Périmètre — objets à couvrir en priorité

Objets déjà rencontrés dans le projet (source : wiki, mission_01, mission_03) :
- `Story`, `Paragraph`, `InsertionPoint`, `TextFrame`, `Text` — modèle texte de base, séparateur `\r`, comportement de `paragraphs` comme collection dynamique.
- `ParagraphStyle`, `CharacterStyle`, `ParagraphStyleGroup`, `CharacterStyleGroup` — styles organisés en groupes, traversée récursive nécessaire.
- `Table`, `Row`, `Column`, `Cell` — ancrage d'une table dans le flux de texte (occupe une position de caractère, n'ouvre pas de paragraphe).
- `Selection` (`app.selection`) — état de sélection selon l'outil actif et le mode (texte/objet), pertinent pour la mission_03 étape 1bis (points d'entrée du script).
- `Document`, `Page` — points d'ancrage generaux déjà utilisés dans `main()`.

Objets non encore rencontrés mais probables si le projet s'étend (à évaluer, pas à couvrir en priorité immédiate) : `TextStyleRange`, `Hyperlink`, `Footnote`, `XMLElement` (si import structuré au-delà du Markdown).

## Sources

- Documentation officielle Adobe ExtendScript/InDesign (JavaScript API reference) — citation exacte obligatoire, jamais de paraphrase approximative (cf. méthode déjà en vigueur, wiki).
- Forums Adobe (Adobe Community, Stack Overflow tag indesign-extendscript) — utilisables mais **toujours marqués comme non fiables à 100%** dans l'ontologie (cf. le cas `paragraphs.length` où plusieurs forums se sont trompés), jamais pris pour argent comptant sans confirmation.
- Les 22+ cas déjà documentés dans `doc/wiki_extendscript_indesign.md` — matériau interne déjà vérifié par test réel, prioritaire sur toute source externe en cas de contradiction.

## Forme de sortie (à trancher avec FJD avant de lancer la recherche)

Deux options possibles, non tranchées à la rédaction de cette mission :
1. Un document Markdown structuré par objet (une section par objet du DOM), avec pour chaque piège un lien vers le cas correspondant du wiki si déjà rencontré.
2. Un format plus rigoureusement typé (YAML/JSON) par objet — propriétés, méthodes, pièges — plus facilement exploitable par un Ouvrier qui doit "consulter le contrat" avant de coder, au prix d'une lecture moins naturelle pour FJD.

**Recommandation** : commencer par l'option 1 (Markdown structuré), plus rapide à produire et à vérifier, et n'évoluer vers un format typé que si l'usage répété par les Ouvriers montre que la forme actuelle ne suffit pas.

## Méthode de travail

1. Recherche web ciblée objet par objet (pas une recherche générale "ExtendScript InDesign bugs") — voir liste du périmètre.
2. Pour chaque piège documenté, citer la source exacte (URL + extrait cité, pas une reformulation).
3. Croiser systématiquement avec les cas déjà connus du wiki — si contradiction, le comportement observé en test réel (wiki) prime toujours sur une source externe non vérifiée par ce projet.
4. Ne pas produire d'exemple de code dans l'ontologie elle-même — décrire le comportement et les pièges en prose, cf. [[feedback_code_dans_fichier_mission_import_md]] (règle architecte).
5. Une fois le premier jet produit, le confronter à un cas réel du wiki pour vérifier sa lisibilité et son utilité opérationnelle avant de le considérer terminé.

## Critère de sortie de la mission

- Document d'ontologie créé, couvrant au minimum les objets du périmètre prioritaire.
- Chaque piège cité a une source vérifiable (URL + extrait), ou un renvoi explicite vers un cas du wiki déjà validé par test réel.
- Le document est référencé dans le ROADMAP et dans le wiki (section méthode de travail), comme référence à consulter avant toute nouvelle mission touchant le DOM InDesign.

## Statut d'avancement
Rien n'a encore été lancé — cette mission attend d'être confiée (Architecte ou Ouvrier avec capacité de recherche web) et son périmètre/forme validés par FJD avant démarrage.

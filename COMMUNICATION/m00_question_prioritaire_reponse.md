# Mission 00 — Réponse tranchée à la question prioritaire

**Date** : 26/09/2026
**Objet** : réponse tranchée (oui/non + citations officielles) aux deux sous-questions de la « question prioritaire » de [[mission_00_ontologie_dom_indesign]], à traiter **avant** toute recherche large sur l'ontologie du DOM.
**Statut de la mission** : ⏸️ recherche large NON lancée — en attente de la décision de FJD (voir §4).

**Mise à jour du 29/09/2026** : FJD a tranché — la Mission 00 est **🔴 ABANDONNÉE** (le wiki `doc/wiki_extendscript_indesign.md`, 42 cas, joue déjà le rôle de base documentaire). **Cette décision ne remet pas en cause le présent document** : les réponses Q1/Q2 ci-dessous restent **valides** et sont citées comme fondement par la mission 03. Seule la **recherche large sur l'ontologie** est abandonnée.

> Rappel de la question : « jusqu'où le scripting ExtendScript a-t-il accès aux mécanismes natifs d'import/placement d'InDesign, et où commence l'obligation de tout réinventer ? »

---

## 1. Synthèse

| Sous-question | Réponse | Base |
| --- | --- | --- |
| **Q1** — Le « curseur chargé » (loaded cursor) est-il déclenchable par script ? | **OUI** | API scripting officielle : `Document.place()`, `Document.placeGuns`, `PlaceGun.loadPlaceGun()`, `PlaceGun.loaded` |
| **Q2** — Un format (Markdown) peut-il être ajouté aux formats éligibles au Placer natif via scripting seul ? | **NON** (scripting pur) | Aucune API de scripting ne permet d'enregistrer un filtre/format d'import ; cela relève du SDK natif (plugin C++), cf. §3 |

**Conséquence directe** : Q1 étant **positive**, la mission est un **candidat pivot**. Je n'ai pas lancé la recherche large sur l'ontologie et je rends la main à FJD (la décision lui revient, cf. mission 00 : « Si un des deux points s'avère possible, en informer FJD immédiatement »).

---

## 2. Q1 — Le curseur chargé est déclenchable par script : OUI

### 2.1 Citation décisive

> `place(fileName, showingOptions?, withProperties?) → void`
> « Place one or more files following the behavior of the place menu item. **This may load the place gun** or replace the selected object, depending on current preferences. »
> — *Document*, InDesign ExtendScript API
> Source : `https://www.indesignjs.de/extendscriptAPI/indesign-latest/Document.html`

Points clés de cette documentation :
- `fileName` : `File[] | Files[]` — « One or more files to place ».
- `showingOptions?` : `Boolean` — « Whether to display the import options dialog ».
- `withProperties?` : `Object` — « Initial values for properties of the placed object(s) ».

La phrase « **This may load the place gun** » est la réponse textuelle à la question : le menu native « Placer » et l'état de curseur chargé qui en découle sont atteignables depuis le scripting.

### 2.2 L'état « curseur chargé » est exposé explicitement par le DOM

Toujours sur la même source officielle :

- `Document.placeGuns` — lecture seule, type `PlaceGun` — « **The place gun.** »
- `PlaceGun.loadPlaceGun(fileName, showingOptions?, withProperties?) → void` — « **Load the place gun with one or more files.** »
- `PlaceGun.loaded` (Boolean, lecture seule) — « **Whether the place gun is currently loaded with content for placing.** »
- `PlaceGun.abortPlaceGun() → void` — « Delete the contents of the place gun. »
- `PlaceGun.rotate(direction?)` — « Rotate the contents of the place gun. »

Source : `https://www.indesignjs.de/extendscriptAPI/indesign-latest/PlaceGun.html` (et `.../Document.html`).
Documentation équivalente côté Adobe UXP : `https://developer.adobe.com/indesign/uxp/dom/api/p/place-gun/`.

On dispose donc, en scripting pur, de :
1. le moyen de **charger** le curseur (`Document.place()` ou `PlaceGun.loadPlaceGun()`),
2. le moyen de **savoir** s'il est chargé (`PlaceGun.loaded`),
3. le moyen de **l'annuler** (`abortPlaceGun()`).

C'est exactement le comportement que FJD attendait (mission 01, ligne ~302 : « correspond à l'API `app.activeDocument.place()` combinée à un 'loaded cursor' »).

### 2.3 Le comportement clic / shift-clic

Le clic simple (nouveau bloc dans les marges) et le shift-clic (création des pages nécessaires au calibrage) sont le comportement **natif délégué par InDesign** une fois le curseur chargé. `Document.place()` déclare explicitement reproduire « the behavior of the place menu item », donc l'interaction héritée est celle du Placer natif, pas une réimplémentation script.

**Réserve honnête** (règle des 5 réflexes, point 5) : ceci est une inférence à partir de la documentation officielle (qui dit « following the behavior of the place menu item »), **non vérifiée par test réel à ce jour**. Deux points à confirmer par un test InDesign minimal avant de bâtir un pivot dessus :
- le curseur chargé **reste-t-il actif après la fin du script** (le script rend-il la main avec le place gun encore chargé, ou InDesign le vide-t-il à la sortie) ;
- le clic/shift-clic hérités se comportent-ils bien comme décrit quand le chargement vient d'un script et non du menu.

### 2.4 Piste complémentaire (non tranchée)

`Document.placeAndLink(parentStory, showingOptions?)` est marquée **« Deprecated: Use ContentPlacerObject load method. »** et « This will load the place gun. ». Il existe donc un objet `ContentPlacerObject` (collection) à explorer — il pourrait offrir un pilotage plus fin du placement (position, chaînage). À documenter dans l'ontologie si le pivot est retenu, mais **hors périmètre de la réponse tranchée**.

---

## 3. Q2 — Ajouter un format (Markdown) au Placer natif par scripting : NON

### 3.1 Constat

Aucune API de scripting ExtendScript ne permet d'**enregistrer un format/filtre d'import** auprès d'InDesign. Le DOM ExtendScript expose l'usage des filtres existants (via `Document.place()` / options d'import), mais **pas leur création ni leur déclaration**. On ne trouve, dans la référence officielle du DOM, aucun objet du type `ImportProvider` / `ImportFilter` / « format registration ».

L'**absence** de tout objet de ce genre dans le DOM de scripting est en soi l'élément de preuve principal : le contrat du DOM liste l'intégralité des objets accessibles en scripting ; un mécanisme d'enregistrement de format n'y figure pas.

### 3.2 Ce que la recherche web a donné (et son statut de fiabilité)

Conformément à la règle de la mission (« toujours marqués comme non fiables à 100% »), voici ce qui a été trouvé, avec sa nature :

- Documentation Adobe (support utilisateur) sur les **options d'import** existantes : `https://helpx.adobe.com/indesign/desktop/add-and-manage-text/add-and-import-text/import-options.html` — décrit les options des formats **déjà supportés**, pas la façon d'en ajouter un. Ne tranche pas mais ne contredit pas le NON.
- Discussion communautaire « How to Create a Custom Menu in InDesign SDK » (`community.adobe.com/t5/indesign-discussions/.../m-p/15451305`) — concerne le **SDK** (menus/plugins), pas le scripting. Confirme indirectement que l'ajout de fonctionnalités d'import relève du **SDK**, non du script.
- Article CreativePro « Going From Markdown to InDesign » (`creativepro.com/going-from-markdown-to-indesign/`) — contourne le problème en convertissant hors InDesign (Pandoc) puis en plaçant le résultat. Illustration pratique : **personne n'ajoute Markdown au Placer natif**, on convertit avant.

Aucune de ces sources n'est une citation officielle **positive** disant « le scripting ne peut pas enregistrer de filtre d'import ». La conclusion NON repose donc sur (a) l'absence de l'objet dans le DOM officiel et (b) le fait que la déclaration d'un filtre d'import est, dans l'écosystème InDesign, une fonctionnalité de **plugin SDK (C++)**, pas de script.

**Réserve** : pour une citation Adobe *positive* (doc SDK listant l'interface `IImportProvider`/l'enregistrement de filtre), il faudrait accéder à la documentation du SDK InDesign (téléchargement SDK, non indexée publiquement de façon fiable). Si FJD veut ce niveau de preuve, c'est une piste à ouvrir — mais elle ne changerait pas la conclusion pour le scripting pur.

### 3.3 Conclusion

- **Impossible en scripting pur.** Ajouter Markdown aux formats éligibles au `File > Place` natif relève du **SDK InDesign (plugin C++)**, hors du périmètre du projet (script `.jsx`).
- **Conséquence** : le mapping de style et le traitement Markdown restent à faire dans `import_md.jsx` (mission 03), **sauf** ce qui peut être hérité du placement natif via Q1 (voir §4).

---

## 4. Conséquence pour la feuille de route — décision demandée à FJD

Q1 étant **positive**, un pivot est envisageable. Trois usages possibles de `Document.place()` / `PlaceGun`, par ordre croissant d'ambition :

1. **Point d'entrée natif (le plus direct)** — quand aucune sélection valide n'existe, charger le curseur (via `Document.place()` sur un fichier intermédiaire, ou en pilotant le place gun) plutôt que de construire manuellement le bloc. Cela **remplacerait la logique de `resolveTargetStory()` / étape 1bis** de la mission 03, au moins pour le cas « pas de sélection ».
2. **Calibrage de pages (shift-clic)** — hériter gratuitement de la création des pages nécessaires au lieu de la recalibrer.
3. **Placement d'un fichier converti** — convertir Markdown → RTF (ou autre format natif supporté) hors InDesign, puis `Document.place()` ce fichier : InDesign ferait alors **le mapping de styles natif**, ce qui pourrait rendre obsolète une grande partie de la reconstruction manuelle. C'est l'option la plus lourde de conséquences (et celle qui dépend le plus d'options de conversion externes).

**⚠️ Aucun de ces usages n'est validé par test réel.** Avant tout pivot, il faut un **test minimal** en InDesign confirmant que le curseur chargé par script (a) survit à la sortie du script et (b) se comporte au clic / shift-clic comme le Placer natif.

**Ce que je demande à FJD** :
1. Valider/invalider le **principe du pivot** Q1 (mettre la mission 03 en pause prolongée le temps d'explorer le placement natif) — ou au contraire acter « on garde la reconstruction manuelle » et clore la question prioritaire.
2. Si pivot accepté : autoriser un **test minimal de faisabilité** (script de 10-15 lignes, fichier réel, inspection visuelle) avant toute réécriture de la mission 03.
3. Confirmer la **forme de sortie** de l'ontologie (mission 00, section « Forme ») : option 1 recommandée (Markdown structuré par objet, `doc/ontologie_dom_indesign.md`), pour lancer la recherche large **une fois** Q1 tranchée. → **Tranché le 29/09/2026 : sans objet** — la recherche large est **abandonnée**, le wiki `doc/wiki_extendscript_indesign.md` tient ce rôle (cf. mise à jour en tête de ce document).

---

## 5. Rappel d'état

- **Mission 03** : ⏸️ en pause (étape 1 validée et commitée `f3f6c68` ; étape 1bis écrite + simulée, **non** testée en réel, **non** commitée).
- **Mission 02** : ✅ terminée côté code, test réel sur `gemini_charte.md` encore à faire.
- **Mission 00** : recherche large **non lancée** (cette réponse couvre uniquement la question prioritaire) — puis **ABANDONNÉE le 29/09/2026** par décision FJD ; les réponses Q1/Q2 de ce document restent valides et citées par la mission 03.
# Mission 06 — Wiki : factorisation (É3) + outillage d'écriture de cas

**Statut** : 🔴 À FAIRE — mission rédigée le 29/09/2026 sur demande FJD, en attente du go d'exécution. Aucune ligne de code écrite, aucun fichier modifié à ce stade.
**Position** : suite directe de la mission **03ter** (gabarit É1 + sommaire É2). Indépendante de la mission 04. **Le numéro 05 reste réservé à l'implémentation de la feature** (réserve explicite, ROADMAP § Mission 04bis) — d'où le **06**.
**Référence de méthode** : `doc/architecture/PATRON_wiki_recursif.md` §4 (horizon É3) et `doc/METHODE_wiki_recursif.md`.
**Demande FJD (29/09/2026)** : « copie ça dans la RM, analyse, améliore, propose, ensuite on exécute ». La présente version est la version **analysée et corrigée par la mesure** — les chiffres de la demande initiale sont périmés et un de ses deux critères de déclenchement est factuellement non atteint (cf. § « Ce que la mesure corrige »). **À ratifier avant exécution.**

---

## Contexte — état mesuré le 29/09/2026

Fichier concerné : `doc/wiki_extendscript_indesign.md` (**le seul** que la factorisation touche).

| Mesure | Valeur |
|---|---|
| Lignes du fichier | **1412** |
| Cas (titre `^## Cas `) | **42** — numéros 00 → 43, **trous en 11 et 15** (à préserver) |
| Ancres mortes | **0** (42 titres / 42 liens) |
| U+FFFD | **0** |
| Cas lourds (> 50 lignes) | **6** : Cas 24 (53), **31 (106)**, 34 (56), **35 (94)**, 36 (58), 37 (55) |
| Poids des cas lourds | **422 lignes = 30 %** du fichier |
| Blocs de l'index par thème (§2) | **9** |

## Ce que la mesure corrige dans la demande initiale

1. **Chiffres d'entrée périmés.** La demande décrit le wiki à « 1282 lignes / 39 cas ». État réel : **1412 lignes / 42 cas** (les cas 41, 42, 43 ont été ajoutés le 29/09).
2. **Le déclencheur « 1 cas > 150 lignes » n'est PAS atteint.** Le patron §4 pose un déclencheur à deux branches : *3 répétitions d'un même bloc* **ou** *1 cas > 150 lignes*. Le plus gros cas fait **106 lignes**. **Fonder l'É3 sur ce critère serait faux.** Le seul fondement valide est la **branche « 3 répétitions »**, qui est elle largement atteinte (chiffres ci-dessous). La mission doit l'écrire ainsi.
3. **La liste des cas lourds était incomplète.** Ce ne sont pas « au moins 31/34/35/36, probablement d'autres » : ce sont exactement **24, 31, 34, 35, 36, 37**.
4. **Le chiffre « 5 cas ≈ 42 % » du patron est périmé lui aussi** — mais dans l'autre sens : le nombre de cas lourds a **augmenté** (5 → 6) et leur poids relatif a **baissé** (42 % → 30 %), parce que les 7 derniers cas ajoutés sont courts. À dire honnêtement.
5. **La duplication n'est pas diffuse : elle se concentre sur 3 familles**, mesurées cas par cas (voir table). C'est ce qui rend la factorisation légitime — et c'est aussi ce qui la **borne**.

## Les 3 familles de duplication (mesurées)

**Famille A — identité de la source.** `indesignjs.de` **× 35 dans 15 cas** ; formules d'attribution **× 17** (`Source vérifiée` × 12, `Ancrage API vérifié` × 3, `Sources vérifiées` × 2) ; date `28/09/2026` **× 43** ; `modèle objet Adobe InDesign 2026` **× 8** ; `HTTP 200` **× 13**.

**Famille B — environnement mesuré.** `Scripts/` **× 31**, `Startup Scripts` **× 19** + `startup scripts` **× 8**, `Scripts Panel` **× 11** — répartis sur **Cas 31, 32, 34, 35, 36, 43**.

**Famille C — patterns de code.** `File(` **× 21** (9 cas), `new File(` **× 10**, `logToFile` **× 5** (Cas 31, 35), `$.evalFile` **× 6** (Cas 36, 40), création de table (Cas 00).

**Borne honnête** : les cas 00 à 23 font **10 à 20 lignes** et ne dupliquent rien. La factorisation ne concerne donc **qu'une douzaine de cas**, pas les 42.

---

## Décisions proposées (à ratifier par FJD)

**D1 — Les annexes sont DANS le même fichier** (sections `## Annexe A/B/C`), pas des fichiers séparés.
1. Le patron §4 dit « annexes » sans imposer des fichiers ; il réserve le **multi-fichier à l'horizon É4** (> 2000 lignes **ou** > 60 cas). Nous sommes à 1412 / 42 : **l'É4 n'est pas déclenché**. Ouvrir des fichiers maintenant *anticiperait* un horizon non atteint — ce que la méthode interdit explicitement.
2. La valeur revendiquée (FJD) est « un seul fichier, greppable ». Des fichiers séparés cassent le `grep` unique.
3. `[A-n]` reste une **ancre intra-fichier** ⇒ 0 risque de lien mort inter-fichiers.
4. **Contrainte** : aucun titre d'annexe ne doit commencer par `## Cas ` — sinon `grep -c "^## Cas "` ment et le contrôle de compteur devient faux.

**D2 — L'annexe A porte l'IDENTITÉ de la source, pas la citation verbatim.**
L'annexe A liste **une ligne par famille de document** (6 familles mesurées : modèle objet Adobe InDesign 2026 / indesignjs.de ; norme ECMA-262 édition ES3 ; norme ECMA-262 édition ES5 ; spec CommonMark ; Adobe JavaScript Tools Guide ; developer.adobe.com — UXP). Chaque ligne = *nom de famille + URL + date de consultation + statut HTTP + build*.
**La citation verbatim reste dans le cas.** Raison : une citation détachée de son cas ne prouve plus rien, et une annexe qui la porterait grossirait autant que le fichier. `[A-n]` remplace donc l'**identité** (URL / date / HTTP / build), jamais la citation.
**Bénéfice qui ne se voit pas au compteur de lignes** : l'information « URL à ne plus citer » (un **HTTP 404** aujourd'hui enterré dans le seul Cas 31) devient visible de tous les cas. C'est le vrai gain de l'annexe A, plus que le nombre de lignes économisées.
**Anti-fabrication** : les URL et dates de l'annexe A sont **recopiées depuis les cas**, jamais re-tapées de mémoire.

**D3 — Annexe B « Environnement mesuré »** : chemins réels (repo, `Scripts Panel`, `Startup Scripts`, `/tmp` **et le piège du lien symbolique**), versions (InDesign `21.6.0.57` `fr_FR` macOS ; ExtendScript ES3), journaux de référence, et la procédure de synchronisation repo → Scripts Panel (piège des deux copies). Les cas y renvoient au lieu de recopier les chemins.

**D4 — Annexe C « Patterns de code validés »** : C-1 logging fichier + handler `File` ; C-2 module partagé `$.evalFile` + chargeur de démarrage ; C-3 création/remplissage de table ; C-4 sonde non interactive (`confirm` écrasable, `alert` non). Chaque pattern = **code minimal + cas d'origine cité**. Le **code** vit dans l'annexe ; le cas garde le **récit du piège**.

**D5 — Non-rétroactivité stricte.** On ne réécrit **que** les cas qui recopient réellement (liste mesurée du § familles). Interdit : profiter de la mission pour re-styliser, reformuler, ou « améliorer » un cas non concerné. Le contenu technique est intouchable (cf. critère de sortie).

**D6 — Volet 2 en Python 3, bibliothèque standard uniquement.** ES3 est une contrainte de l'**ExtendScript exécuté dans InDesign**, pas de l'outillage de développement : le script ne tourne jamais dans InDesign. Python est déjà l'outil de mesure du projet (`/tmp/check_anchors.py`, `/tmp/wiki_analyse.py`) ⇒ zéro dépendance à installer, zéro toolchain. Fichier : `tools/new_wiki_case.py` (le dossier `tools/` existe déjà et n'est pas ignoré par git).

**D7 — Ordre d'exécution : Volet 2 d'abord, Volet 1 ensuite.** Trois raisons :
1. Le script embarque les 3 contrôles (compteur / ancres / U+FFFD) : c'est **l'instrument** qui servira à valider le Volet 1. On construit l'instrument avant l'opération.
2. Le script cible 3 emplacements (compteur d'en-tête, ligne catalogue, entrée d'index) que le Volet 1 ne modifie **pas** (le Volet 1 ne touche que des corps de cas et ajoute des annexes) ⇒ le script reste valide après le Volet 1, l'inverse n'est pas garanti.
3. Le Volet 2 attaque directement le coût que FJD a nommé (temps passé à écrire dans le wiki). Il doit exister **avant** qu'on écrive davantage.

---

## Volet 2 — spécification de `tools/new_wiki_case.py`

1. **Entrée** : chemin du wiki en argument (`--wiki`), défaut `doc/wiki_extendscript_indesign.md`. **Le fait d'être paramétrable est une exigence de test** : la recette s'exécute sur une **copie**.
2. **Numéro** : relève `^## Cas (\d+)` → `max`. Propose **`max + 1`**. Affiche **les trous** (numéros absents de 0 à max) **pour information**, sans jamais les combler ni renuméroter quoi que ce soit.
3. **Saisie interactive** : **titre**, **thème**, **API / objet visé**, **statut source**, **date de dernière revue** (défaut = aujourd'hui).
   - `statut source` = liste fermée **`sourcé | mixte | mesuré`**. *(Correction : le gabarit du wiki affiche aujourd'hui `sourcé | mesuré | à sourcer`. Or `à sourcer` n'apparaît **nulle part** dans le catalogue, et la valeur réellement utilisée est `mixte` — cf. légende ligne 78 et les 42 entrées du catalogue. La liste fermée du script est donc le triplet réel, et le gabarit du wiki doit être **aligné** dans cette mission : c'est une incohérence de vocabulaire, pas un choix.)*
4. **Ancre** : calculée par l'algorithme **vérifié** — minuscules → suppression de tout caractère hors `[\w\s-]` (apostrophes, parenthèses, `:`, `.`, `,`, `«»` retirés ; **accents conservés**) → espaces remplacés par `-` → **aucun écrasement des espaces multiples**. *(L'écrasement des espaces multiples avait produit 39 faux liens morts lors d'un premier essai : la règle « ne pas écraser » est le résultat de cette erreur, elle est non négociable.)* La fonction est **reprise de `/tmp/check_anchors.py`**, pas réécrite de mémoire.
5. **Insertion du squelette É1** (4 champs balisés + 6 rubriques vides) **en fin de liste des cas**, c'est-à-dire **avant** la section finale `## Piège structurel à retenir — deux copies du même script`. L'ancre d'insertion est **localisée par son titre**, jamais par un numéro de ligne en dur.
6. **Trois écritures d'index** :
   - **compteur d'en-tête** : `**État du wiki** : **NN cas** | … | dernière revue : **JJ/MM/AAAA**.` ;
   - **ligne catalogue** (§1) : ajoutée en fin de liste, juste avant `### 2. Index par thème` ;
   - **entrée d'index par thème** (§2), dans **un ou plusieurs** des **9 blocs**.
7. **Point dur qui corrige la spécification initiale — le thème n'est pas mécanisable.** Il n'existe **aucune correspondance** entre le champ `**Thème**` d'un cas et les intitulés des blocs du §2 : **Cas 42** est listé dans « Styles » **et** dans « Méthode et diagnostic » ; **Cas 43** dans « Modèle texte » **et** « Méthode et diagnostic ». Un cas peut donc appartenir à **1..N** blocs. Le script **propose** les blocs par mots-clés puis **fait confirmer** une **sélection multiple** par index ; une entrée est écrite par bloc retenu. Aucun bloc n'est deviné en silence.
8. **`--dry-run`** : affiche les 4 écritures projetées (cas + 3 index) **sans modifier le fichier**. Le mode réel s'utilise après un dry-run conforme.
9. **Écriture atomique** (fichier temporaire + `os.replace`) : **soit les 4 écritures passent, soit aucune**. C'est la vraie garantie utile — un script qui écrit 2 emplacements sur 4 est **exactement** la cause de la péremption immédiate du sommaire, déjà constatée **deux fois**.
10. **Le script lance lui-même les 3 contrôles après écriture et échoue bruyamment** si l'un échoue :
    - `grep -c "^## Cas "` **==** le compteur affiché en en-tête ;
    - **0 ancre morte** (chaque `](#…)` du sommaire pointe vers un titre qui existe) ;
    - **0 U+FFFD**.
11. **Encodage** : lecture/écriture UTF-8 explicite ; sortie console volontairement sobre (la leçon U+FFFD du projet vient d'un émoji écrit par un outil d'édition — le script ne doit pas en produire).

**Index par symptôme (§3) : reste MANUEL** — décision FJD, confirmée. Texte libre, non mécanisable.

---

## Volet 1 — Factorisation (après le Volet 2)

1. Ajouter les sections **`## Annexe A — Sources canoniques`**, **`## Annexe B — Environnement mesuré`**, **`## Annexe C — Patterns de code validés`** **après le §3 (index par symptôme) et avant le premier cas**.
2. Remplir A/B/C **par recopie depuis les cas** (anti-fabrication) — jamais de mémoire.
3. Réécrire **les seuls cas mesurés comme dupliquants** : l'attribution devient `[A-n]`, le chemin devient `[B-n]`, le bloc de code devient `[C-n]`.
   **Interdit** : déplacer un fait d'un cas à l'autre, reformuler une cause, retoucher une citation, « harmoniser » un style.
4. Re-passer les **3 contrôles** + l'audit d'ancres.
5. **Mesurer le gain** (lignes avant/après) et l'écrire au CR. **Si le gain est inférieur à 5 % du fichier, le dire honnêtement** plutôt que de le présenter comme un succès — la valeur de l'annexe A est la source unique de vérité, pas le nombre de lignes.

---

## Périmètre

**Dans** : `doc/wiki_extendscript_indesign.md` ; `tools/new_wiki_case.py` (nouveau) ; le bloc de mission dans `COMMUNICATION/ROADMAP.md` ; l'alignement des compteurs **périmés** ailleurs — **déjà fait le 29/09/2026, hors mission, sur demande directe FJD** (ROADMAP Mission 00 + § Références « 39 cas » → **42** ; `mission_00_ontologie_dom_indesign.md` et `m00_question_prioritaire_reponse.md` « 39 cas » → **42** ; `PATRON_wiki_recursif.md` §1 : ligne de **rafraîchissement** « 1 412 lignes / 42 cas », la mesure datée du 28/09/2026 étant **conservée** telle quelle).

**Hors** : tout contenu technique d'un cas ; `import_md.jsx` ; la mission 04 (son entonnoir et son axe 2) ; les annexes en fichiers séparés (cf. D1) ; l'index par symptôme (manuel).

## Critère de sortie

1. `tools/new_wiki_case.py` existe, fonctionne **sans aucune dépendance externe**, et **refuse** de renuméroter ou de combler un trou.
2. **Recette du script sur une COPIE** (`/tmp/wiki_copie.md` — le fichier réel n'est **pas** touché) : création d'un cas de test ⇒ les 3 contrôles passent ; le fichier de copie est ensuite supprimé.
3. Le script **échoue bruyamment** sur un cas volontairement mal formé (compteur incohérent) — contrôle négatif obligatoire, conformément à la méthode du projet.
4. Après Volet 1, sur le **vrai** wiki : compteur d'en-tête == `grep -c "^## Cas "` ; **0 ancre morte** ; **0 U+FFFD**.
5. Le **gain de factorisation** est mesuré et rapporté, chiffre nu, même s'il est modeste.
6. **CR inline** dans ce fichier (§ « Rapport d'exécution ») + question de clôture à FJD.

## Preuves brutes attendues (gates)

```text
$ grep -c "^## Cas " doc/wiki_extendscript_indesign.md        # == compteur d'en-tête
$ python3 tools/new_wiki_case.py --dry-run                    # 4 écritures projetées, fichier intact
$ <audit d'ancres>                                            # 0 ancre morte
$ grep -c $'\xef\xbf\xbd' doc/wiki_extendscript_indesign.md   # 0
```

## Test réel — ce qu'est « le réel » ici

Cette mission ne produit **aucun artefact InDesign** : pas d'instance à démarrer, pas de `Scripts Panel`, pas de `$.evalFile`. L'objet testé **est le fichier**. Le « test réel » est donc exécutable directement sur le poste (Python + `grep`), et **sa sortie brute est la preuve** — il n'y a pas de couche d'interprétation. Les deux contrôles non négociables : **recette sur copie** (jamais sur le wiki réel avant le Volet 1) et **contrôle négatif** (le script doit échouer quand il doit échouer).

---

## Bloc de mission à reporter dans le ROADMAP

```markdown
## Mission 06 — Wiki : factorisation (É3) + outillage d'écriture de cas

**Statut** : 🔴 À FAIRE — rédigée le 29/09/2026, en attente du go FJD. Le numéro 05 reste réservé à l'implémentation de la feature (cf. Mission 04bis) : d'où le 06.

**Fichier détaillé** : [mission_06_wiki_e3_factorisation.md](mission_06_wiki_e3_factorisation.md)

**Résumé** : le wiki a atteint le déclencheur É3, mais par **une seule** de ses deux branches — la mesure du 29/09/2026 le corrige : **1412 lignes / 42 cas**, aucun cas ne dépasse **106 lignes** (le critère « > 150 lignes » n'est **pas** atteint), et la duplication réelle se concentre sur **3 familles** (identité de source, environnement mesuré, patterns de code), portées par une douzaine de cas seulement. Deux volets : **(2) outillage d'abord** — `tools/new_wiki_case.py` (Python 3 stdlib), qui trouve le numéro suivant sans jamais renuméroter ni combler un trou, insère le squelette É1, met à jour les **3** emplacements d'index (compteur, catalogue, thème) de façon **atomique**, et **lance lui-même les 3 contrôles** (compteur == `grep -c "^## Cas "`, 0 ancre morte, 0 U+FFFD) ; **(1) factorisation ensuite** — 3 annexes **dans le même fichier** (A sources canoniques = identité, pas citation ; B environnement ; C patterns), et réécriture des **seuls** cas dupliquants, sans toucher une ligne de contenu technique. Index par symptôme : **manuel** (décision FJD).
```

---

## Rapport d'exécution — CR 06

*(à produire en fin de mission — preuve inline, pas de fichier CR séparé)*

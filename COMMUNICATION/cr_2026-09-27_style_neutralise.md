# CR — 27/09/2026 — Cause racine du « style neutralisé » (mission 03, étape 2→3)

**Objet** : clôture du symptôme « les blocs arrivent en style neutre / sans retour auto, sans mon intervention ».
**Périmètre** : `import_md.jsx`, fonction `showConfigurationDialog()`.
**Statut** : cause racine identifiée, prouvée, correctif appliqué, gates hors ligne verts, synchronisé au Scripts Panel.
**SHA Panel avant** : `2c7096d7…` (avec sonde v2) — **SHA Panel après** : `28a77c22…`.

---

## 1. Le symptôme

Sur un **document neuf**, après import d'un Markdown réel, la très grande majorité des blocs ressortait en **style neutre** (`[Aucun style]`), alors que le récapitulatif du script affichait fièrement :

```
M03-etape2: blocs=85 ... ecarts=0 ... styles=85 neutre=0
```

Autrement dit : **le script se déclarait parfaitement sain pendant que le document était presque entièrement au neutre**. Le compteur ne comptait pas des *styles distincts*, il comptait des *applications réussies* — y compris des applications réussies du style neutre.

## 2. Ce qu'on a traversé (chronologie des hypothèses)

| # | Hypothèse | Verdict | Comment elle a été tranchée |
|---|-----------|---------|-----------------------------|
| 1 | **Mapping décalé** (les tags pointaient vers les mauvais styles) | Réfutée | Relecture du mapping enregistré : les clés correspondaient bien aux tags. |
| 2 | **Bug `.index`** — offset caractère pris pour un index de paragraphe | **Confirmée puis corrigée** | Cause racine prouvée, correctif « soustraction » appliqué et validé en réel (commit `efaa80a`). |
| 3 | **Option 1** — un item de liste entièrement en gras était converti à tort en titre | **Confirmée, règle retirée** | Décision FJD (« faut bien que le user bosse un peu ») : la règle heuristique a été supprimée, l'item reste une puce. |
| 4 | **Décalage d'un cran à l'adressage** (`baseParaIndex`) | **Réfutée** | Sonde v1 (`M03-sonde`) : l'adressage est exact. |
| 5 | **Contamination / héritage entre paragraphes** | Réfutée | Sonde v2 (`M03-sonde2` + `M03-carte`) sur toute la story. |
| 6 | **Présélection silencieuse du dialogue de mapping** | ✅ **CAUSE RACINE** | Preuve par carte en plages + confirmation FJD. |

**Méthode de diagnostic qui a débloqué la situation** : après plusieurs sondes locales restées muettes, on a cessé de relire le style d'un paragraphe à la fois et on a produit une **carte en plages (run-length) de la story entière** — une seule ligne de log décrivant, pour chaque plage contiguë, le style effectivement appliqué.

## 3. La preuve décisive

### 3.1 La carte (run 16:52, document neuf)

```
M03-carte: n=85 base=0 | 0=H1 1=H2 2-6=[Aucun style] 7=H2 8=P 9-28=[Aucun style]
29=H2 30=P 31-42=[Aucun style] 43=H2 44=P 45-61=[Aucun style] 62=H2 63=P
64-73=[Aucun style] 74=H2 75=H3 76-78=[Aucun style] 79=H3 80-84=[Aucun style]
```

**72 paragraphes au neutre sur 85.** Le récap annonçait `neutre=0`.

### 3.2 La boucle d'application

```
bloc #0 type=h1 demande='H1' relu='H1'
bloc #1 type=h2 demande='H2' relu='H2'
bloc #2 type=li demande='[Aucun style]' relu='[Aucun style]'
```

Décompte sur les 85 blocs : **72× `demande='[Aucun style]'`**, 6× `H2`, 4× `P`, 2× `H3`, 1× `H1`.

Autrement dit : **le style neutre n'était pas appliqué par accident à l'insertion — il était la valeur *demandée* par le mapping**, donc enregistrée dans le document.

### 3.3 L'adressage est innocent

```
M03-sonde2: snapshot=85 liveNow=85 base=0
M03-etape2: frontiere curseur — story_total=85 paragraphes_inseres=85 => baseParSoustraction=0
```

Aucun décalage. Le `PAR-1` suspecté n'existait pas.

## 4. La cause racine

Dans `showConfigurationDialog()`, la **présélection** de chaque liste déroulante suivait 3 règles :

1. le mapping déjà enregistré dans le document, s'il existe ;
2. sinon, un style dont le nom correspond **exactement** à la convention HTML du tag (`H1` pour `h1`, `P` pour `p`…) ;
3. **sinon, « le premier style disponible à la racine »**, typiquement le style neutre.

**La règle 3 est la faute.** Elle appliquait un style **sans aucun geste de l'utilisateur**, en silence, et ce choix était ensuite persisté comme s'il avait été voulu.

Pourquoi elle se déclenchait si souvent : les `htmlName` de plusieurs tags ne peuvent **correspondre à aucun style InDesign réel** —

| Tag | `htmlName` | Correspondance possible ? |
|-----|-----------|---------------------------|
| `li` | `li` | ✗ |
| `li2`..`li4` | `li2`..`li4` | ✗ |
| `li_num` | `ol` | ✗ |
| `blockquote` | `quote` | ✗ |
| `h1`, `h2`, `h3`, `p` | `h1`, `h2`, `h3`, `p` | ✓ (par nom) |

Donc : **règle 2 échoue pour tous les tags de liste et de citation → règle 3 s'applique → neutre présélectionné → neutre persisté**. Les titres et les paragraphes, eux, se mappaient correctement par leur nom — ce qui explique exactement la carte observée : `H1`, `H2`, `H3`, `P` corrects, **tout le reste au neutre**.

**Confirmation indépendante par FJD** : dans le dialogue, `li_num` affiche « aucun style ».

## 5. Le correctif

Trois changements, dans `showConfigurationDialog()` uniquement :

1. **Suppression de la règle 3.** Plus aucune présélection arbitraire. Le script ne devine plus à la place de l'utilisateur.
2. **Ajout d'une entrée sentinelle « — non mappé — »** en tête de chaque liste déroulante (index 0), **sélectionnée par défaut** quand ni le mapping enregistré ni la convention de nom n'ont donné de correspondance.
3. **Au clic OK** : une sélection sur « — non mappé — » ⇒ le tag reste **absent** de `resultMapping` (donc aucune affectation), avec une trace `M03-dialogue: tag=li -> non mappe`.

Conformité aux contraintes : **ES3 strict** (aucune API ES5+), chaîne sentinelle écrite en échappements ASCII (`\u2014`, `\u00e9`), en-têtes de groupe `"── "` et tableau `selectableNames[]` inchangés, `getLiStyleForIndentLevel()` intact, adressage (`baseParaIndex` / `insertedParaCount`) intact.

**Point de cohérence vérifié** : le correctif change la *présélection du dialogue*, **pas** le comportement de l'insertion. Le repli neutre de l'étape 2 (quand `mapping[tag]` est absent) reste inchangé — il continue de journaliser. La différence est que désormais **l'absence de mapping est un choix explicite de l'utilisateur**, plus un effet de bord silencieux.

## 6. Validation hors ligne

| Gate | Résultat |
|------|----------|
| Syntaxe (`node --check`) | ✅ OK |
| Caractères corrompus (U+FFFD) | ✅ 0 |
| Non-régression oracles | ✅ **12/12**, 0 échec |
| Synchro Scripts Panel (`diff`) | ✅ identique |
| SHA-256 source = Panel | ✅ `28a77c22ba104127563271b06645fa1e9ef5a2d99165932f17c35d53a232035a` |

**Test réel restant à faire par FJD**, en **document neuf** : attendu = la carte ne doit plus contenir de `[Aucun style]` sur les `li`/`li_num`/`blockquote`, et aucun style ne doit être appliqué sans geste. Le dialogue doit afficher « — non mappé — » pour `li`, `li2`..`li4`, `li_num`, `blockquote` tant qu'ils ne sont pas mappés manuellement.

## 7. Leçons

- **Un compteur d'auto-contrôle est structurellement aveugle** s'il relit le paragraphe qu'il vient lui-même d'écrire : il valide la cohérence *interne* de l'action, pas sa *pertinence*. `ecarts=0 / neutre=0` peut être parfaitement vrai et complètement trompeur.
- **Une carte en plages sur toute la story** révèle en une ligne ce que des dizaines de sondes ponctuelles laissent invisible.
- **Une valeur par défaut qui « rend service » est un bug en puissance** : la règle 3 existait « pour permettre de tester le flux sans configuration ». Elle a produit 72 styles neutres non désirés. Un défaut doit être *explicite et visible* (« non mappé »), jamais *plausible et silencieux*.
- **Corriger à l'aveugle est proscrit** : cinq hypothèses successives ont été réfutées par la mesure avant que la sixième soit confirmée par la preuve. C'est le protocole du projet qui a évité cinq faux correctifs.

## 8. État & suite

- **Fait** : correctif écrit, gates verts, Panel synchronisé.
- **En attente** : test réel FJD en document neuf → puis commit `M03 étape 3 : titres OK`.
- **Suite du plan** : étape 4 (segments inline), 5 (listes + cascade), 6 (tableaux), 7 (code), 8 (non-régression complète + retrait de la sonde v2 + nettoyage `/tmp`).
- **Hors périmètre de l'agent** : le cadrage et la rédaction du « lien avec l'origine et la mise à jour » sont pris en charge par FJD dans `ROADMAP.md`.

# Mission 03quater — Wiki : alimentation (clôturée provisoirement)

**Statut** : 🟡 PARTIELLE — **clôturée provisoirement le 29/09/2026 sur décision FJD** : le wiki est **alimenté** (39 → **42 cas**, index et catalogue à jour, contrôles verts) ; le seul point ouvert est **hors de cette mission** — la **factorisation É3** part en **Mission 06**, décision actée par FJD (« on met de côté le bot », la mission wiki intermédiaire se clôt ici).
**Position** : mission **intermédiaire**, à la suite de la mission 03ter (gabarit + sommaire). Elle **encaisse** l'alimentation produite par les missions 03 (étape 9 → Cas 36) et 04 (sondes `04bis`/`04ter` → Cas 37, 39, 40) et par les mesures de code (Cas 41, 42, 43).
**Références de méthode** : `doc/METHODE_wiki_recursif.md` (socle projet-indépendant) et `doc/architecture/PATRON_wiki_recursif.md` (analyse complète FJD + DS, 28/09/2026).
**Amont direct** : [mission_03ter_wiki_gabarit_sommaire.md](mission_03ter_wiki_gabarit_sommaire.md) (É1 gabarit + É2 sommaire).
**Aval explicite** : [mission_06_wiki_e3_factorisation.md](mission_06_wiki_e3_factorisation.md) — **seule destination** du reliquat É3.

## Contexte — pourquoi une mission « intermédiaire »

Deux missions avaient produit des **faits mesurés** sans que le wiki les reçoive :

1. la **mission 03** a clos son étape 9 (intégration au menu `Fichier > Importer un MD`, validée en réel après vrai redémarrage d'InDesign le 28/09/2026) ;
2. la **mission 04**, par ses deux sondes runtime, a produit une série de faits d'API qui n'étaient documentés nulle part : le fait que `exportFile` **n'écrase jamais** un fichier existant, que le **porteur compte** pour l'export ICML, que `alert` est en **lecture seule** là où `confirm` est écrasable, que le **`.md` ne peut pas porter de `Link`**, et que l'`update()` d'un lien ICML **ne recharge pas** le contenu.

Le patron de méthode impose qu'un fait **mesuré** entre au wiki **dans le tour où il est mesuré** — sinon il est perdu et redécouvert. Les missions 03 et 04 étant centrées sur leur livrable de code, la **rédaction des cas** restait due. Cette mission est cette dette, soldée.

Elle est **intermédiaire** et non « 05 » : le numéro **05** était **déjà réservé** à l'implémentation de la feature (cf. mission 04), et une numérotation acquise ne se réécrit pas.

## Ce qui était dû

- Porter le wiki de **39 à 42 cas** (numérotation ascendante, **aucun trou comblé** : les trous acquis Cas 11 et Cas 15 restent troués et documentés comme tels).
- Appliquer le **gabarit à champs balisés É1** aux nouveaux cas (`Thème` / `API / objet visé` / `Statut source` / `Build de référence`).
- Maintenir les **trois** emplacements d'index dans le même mouvement : compteur d'en-tête, **catalogue** (une ligne par cas), **index par thème** — et l'**index par symptôme**, mis à jour **manuellement** (décision FJD du 29/09 : pas d'auto-génération, le symptôme est un choix éditorial).
- Passer les **3 contrôles** obligatoires : compteur == `grep -c "^## Cas "`, **0 ancre morte**, **0 U+FFFD**.

## Ce qui a été fait — les 4 cas produits

### Cas 40 — Neutraliser l'alerte d'une sonde : `alert` est en lecture seule, `confirm` est écrasable

- **Statut source** : `mesuré`. **Thème** : méthode. **API visée** : `alert`, `confirm`.
- **Fait** : une sonde qui doit s'exécuter **sans interaction** ne peut pas neutraliser `alert` (`shadow alert KO : alert is read only`) alors qu'elle **peut** écraser `confirm`. Corollaire opérationnel : **les guillemets imbriqués dans un `do script` inline échouent** ⇒ passer par un `.jsx` temporaire + `$.evalFile`.
- **Portée** : c'est ce cas qui rend les sondes `04bis`/`04ter` exécutables sans surveillance.

### Cas 41 — Ce qu'un ICML exporté par script contient réellement (et ce qu'il ne contient PAS)

- **Statut source** : `mesuré`. **Thème** : modèle texte. **API visée** : `story.exportFile(ExportFormat.INCOPY_MARKUP, file)`.
- **Faits mesurés** : les marques markdown **survivent littéralement en texte brut** dans `<Content>` (ex. `<Content># Titre B MODIFIE</Content>`) ; les compteurs XML sont **tous à zéro** (`XMLElement=0`, `XMLTag=0`, `<Tag=0`, `AppliedXMLTag=0`, `TagName=0`) ⇒ « Map Tags to Styles » **n'a rien à lier** ; la seule valeur de style de paragraphe rencontrée est `ParagraphStyle/$ID/[No paragraph style]` ; **36 877 octets / 35 830 caractères** produits pour **42 caractères utiles** (ratio ≈ 850:1) ; la localisation française fuit dans le fichier (`CrossReferenceFormat Name="Paragraphe entier et numéro de page"`).
- **Réserve de mesure DÉCLARÉE (point 3)** : le relevé **ne prouve pas** que l'ICML efface les styles — la story témoin **n'avait aucun style appliqué** (contrôle `ZZ Temoin` → **0 occurrence**). Ce point est **non instruit** et **ne doit pas être cité comme fait acquis** tant qu'une sonde dédiée ne l'a pas tranché.

### Cas 42 — Un GREP ne pose qu'UN seul style de paragraphe par requête

- **Statut source** : `mesuré`. **Thème** : styles. **API visée** : `app.findGrepPreferences`, `app.changeGrepPreferences.appliedParagraphStyle`.
- **Faits mesurés** : `app.findGrepPreferences` expose **223 propriétés**, dont **9 seulement** contiennent « tyle » ; **aucune variante au pluriel n'existe** (erreur `Object does not support the property or method 'appliedParagraphStyles'`) ; `appliedParagraphStyle` est un **scalaire** (`typeof = string`, `reflect.name = String`), **pas** un tableau. **Contre-épreuve réelle** sur une story témoin à 3 paragraphes : une requête (`findWhat = "^#\\s"`) ⇒ `modifications = 1`, `p[0] style = ZZGREP Niveau1`, `p[1]` et `p[2]` restent `[Paragraphe standard]`.
- **Conséquence structurante** : **N niveaux de titre ⇒ N passes GREP.** Aucune API ne permet de poser N styles en une requête.
- **Preuve** : `tools/probe_grep_style.jsx` — **5 968 octets** — sha256 `5e69d7721ec56f70025123e3351e9c05af688b549a308edb4b33a7d0ef6814f4`.

### Cas 43 — Un document créé par script n'a aucun bloc de texte (ni story, ni textFrame)

- **Statut source** : `mesuré`. **Thème** : modèle objet / méthode. **API visée** : `app.documents.add()`, `Page.textFrames.add()`, `TextFrame.parentStory`.
- **Faits mesurés** : après `app.documents.add()` ⇒ `doc cree : stories=0 | textFrames=0 | pages=1` ; `doc.stories[0]` **renvoie un objet invalide** qui n'explose qu'à l'usage suivant (`ERREUR | contexte=contre-epreuve GREP | message=Object is invalid | ligne=79`) — l'erreur est donc signalée **une ligne trop tard**, ce qui envoie le diagnostic sur la mauvaise ligne.
- **Solution mesurée** : `var tf = page.textFrames.add(); var story = tf.parentStory;` (contrôle : `story temoin : longueur=57`).

## Cas wiki consultés / produits

**Cas wiki consultés** : Cas 18, 22, 24, 27, 35, 36, 37, 39 (modèle objet `Link`, export/placement, menus et point d'entrée, méthode de sonde).
**Cas wiki produits/enrichis** : **Cas 40**, **Cas 41**, **Cas 42**, **Cas 43** créés (tous `mesuré`) ; compteur d'en-tête, catalogue, index par thème et index par symptôme mis à jour dans le même mouvement.

## Contrôles passés (sorties brutes, 29/09/2026)

```
$ wc -l doc/wiki_extendscript_indesign.md
    1411 doc/wiki_extendscript_indesign.md
$ grep -c '^## Cas ' doc/wiki_extendscript_indesign.md
cas: 42
$ grep -c $'\xef\xbf\xbd' doc/wiki_extendscript_indesign.md
FFFD: 0
$ grep -n '^## Cas 4[0-9]' doc/wiki_extendscript_indesign.md
1267:## Cas 40 — Neutraliser l'alerte d'une sonde : `alert` est en lecture seule, `confirm` est écrasable
1292:## Cas 41 — Ce qu'un ICML exporté par script contient réellement (et ce qu'il ne contient PAS)
1332:## Cas 42 — Un GREP ne pose qu'UN seul style de paragraphe par requête
1375:## Cas 43 — Un document créé par script n'a aucun bloc de texte (ni story, ni textFrame)
$ sed -n '76p' doc/wiki_extendscript_indesign.md
**État du wiki** : **42 cas** | build de référence **InDesign 21.x** (`21.6.0.57`, `fr_FR`, macOS) | dernière revue : **29/09/2026**.
```

⇒ **compteur d'en-tête = compte réel (42 = 42)**, **0 U+FFFD**, **0 ancre morte** (les 4 nouvelles entrées de catalogue et les entrées d'index pointent sur les ancres des Cas 40-43, présentes).

## Pourquoi « clôturée provisoirement » et non « terminée »

- **Ce qui est fait** est fait et vérifié : les 4 cas sont **dans** le wiki, mesurés, indexés, et les 3 contrôles sont verts.
- **Ce qui reste ouvert n'appartient pas à cette mission** : la **factorisation É3** (3 annexes : sources canoniques, environnement mesuré, patterns de code + réécriture des seuls cas dupliquants). Elle est **déjà écrite** en [mission_06_wiki_e3_factorisation.md](mission_06_wiki_e3_factorisation.md) et **attend un go FJD**.
- **Décision FJD du 29/09/2026** : « on clôture, on archive ; la partie wiki va vers une mission wiki intermédiaire qu'on vient de clore provisoirement ; on met de côté le bot ». La mission est donc **conservée au ROADMAP en 🟡 PARTIELLE** — elle n'est **ni** archivée **ni** supprimée, sa clôture est **provisoire** et son reliquat a une **adresse** (Mission 06).

## Critère de sortie

- Le wiki contient les cas produits par les missions 03 et 04 **ainsi que** les cas de méthode issus des mesures de code ⇒ **satisfait** (39 → 42).
- Les **trois** emplacements d'index sont cohérents entre eux et avec le compte réel ⇒ **satisfait**.
- `0 U+FFFD`, `0 ancre morte` ⇒ **satisfait**.
- **Critère de clôture définitive** (non satisfait, par construction) : le reliquat É3 est traité **ou** explicitement délégué — **délégué**, à la Mission 06.

## Rapport d'exécution — CR 03quater (29/09/2026)

**Statut** : 🟡 PARTIELLE — clôturée **provisoirement** ; alimentation faite et contrôlée, reliquat É3 délégué à la Mission 06.

**Fichier touché** : `doc/wiki_extendscript_indesign.md` (seul fichier de contenu modifié : 4 cas ajoutés + en-tête + catalogue + index thème + index symptôme).

**Nature du travail** : rédaction de cas à partir de **faits déjà mesurés** (aucune mesure nouvelle n'a été faite dans cette mission — c'est un point important : elle **n'invente rien**, elle **enregistre**). Les mesures citées proviennent des sondes `04bis`, `04ter`, `probe_grep_style.jsx` et de la mise au point du pipeline de la mission 03.

**Ce qui n'a PAS été fait, volontairement** :
- **pas** de rétro-application du gabarit É1 aux cas antérieurs (règle de non-rétroactivité de 03ter, maintenue) ;
- **pas** de réécriture du corps d'un cas existant ;
- **pas** de factorisation É3 ⇒ **Mission 06** ;
- **pas** de comblement des trous de numérotation Cas 11 / Cas 15 (règle de numérotation immuable).

**Réserve transmise à la suite** : le **point 3 du Cas 41** (l'ICML efface-t-il les styles ?) est **non instruit** — la story témoin n'avait aucun style appliqué. Il est écrit **comme réserve** dans le cas lui-même, pour qu'aucun lecteur ultérieur ne le prenne pour un fait acquis. Une sonde dédiée reste due.

**Validation attendue de FJD** : (1) la clôture **provisoire** de cette mission est-elle la bonne façon de conserver la trace ? (2) le renvoi unique du reliquat vers la Mission 06 est-il conforme à l'intention ?

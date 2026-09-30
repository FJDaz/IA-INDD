# Parcours de construction — Panneau IMPORT MD (journal des marches)

**Objet** : garder la TRACE DES ÉTAPES de construction (pas seulement le résultat) —
la démarche, les mesures, les décisions, dans l'ordre. Sert de matière pour un
parcours de formation et de garde-fou contre la reconstruction d'un raisonnement déjà tenu.
**Règle** : une marche = un pas franchi, daté, avec SA PREUVE. Rien n'est déclaré franchi
sans mesure réelle.

---

## Chapitre A — Le panneau prend forme (Missions 1 à 3)

- **Marche A1 — Identité du panneau.** Le panneau UXP sait dire ce qu'il est (nom, version,
  environnement). *Preuve : visible à l'écran après rechargement UDT.*
- **Marche A2 — Lecture d'un chemin.** Le panneau lit un champ « chemin » et en déduit le
  dossier du projet + le fichier moteur.
- **Marche A3 — Lecture d'un état rendu par le moteur.** Le panneau appelle le moteur et
  relit ce que le moteur a écrit. *Preuve : `etat rendu par le moteur : identique`, 1 ligne
  de journal.*
- **Marche A4 — Bouton « Actualiser ».** Le panneau relit le disque et redessine sans
  redémarrer InDesign. *Preuve : 4 étapes de protocole vues à l'écran + un contrôle négatif
  (0 ligne).*

**Leçon transversale A** : *un indicateur de fond ne doit JAMAIS écraser la bannière* — bug réel
(une écriture de journal en arrière-plan écrasait le résultat affiché). Parade : l'état est
mis en phrase avant toute écriture.

**Leçon transversale B** : *une preuve n'existe que si elle est vue à l'écran*. Un test qui
réussit en coulisse mais ne s'affiche pas n'est pas une preuve.

---

## Chapitre B — La question du « tube » (Mission 4, préalable)

Problème de fond : **comment faire voyager une information du panneau (UXP/JS) jusqu'au
moteur (ExtendScript) ?** Le wiki ne documentait AUCUN canal d'arguments ⇒ trou confirmé par grep.

- **Marche B1 — Ne pas conclure trop vite.** Premier verdict : « le canal n'existe pas », sur la
  seule lecture de `app.scriptArgs`. **Objection FJD : c'était faux.** *Leçon : un verdict négatif
  doit être établi depuis PLUSIEURS chemins de lecture avant d'être accepté. L'absence de
  précédent dans le wiki ne prouve pas une impossibilité.*
- **Marche B2 — Lire au bon endroit.** Mesure du 30/09 : `app.doScript(src, lang, ARGS)` dépose les
  arguments dans l'objet **`arguments` de niveau RACINE** du script exécuté. *Preuve brute :
  `n=4 | [0]=TEMOIN-… | [1]=Appelant=panneau | [2]=Action=importer | [3]=Chemin=/tmp/source.md`.*
  Sans 3ᵉ paramètre : `ERREUR:arguments is undefined` ⇒ test trivial pour distinguer les appels.
- **Marche B3 — Écrire la découverte.** Création du **Cas wiki 47** (compteur 45 → 46), index par
  thème et par symptôme mis à jour. *Le canal manquant est désormais documenté.*
- **Marche B4 — Remonter la mesure à la source.** Annotation inline du bloc Mission 4
  (extrait de journal brut), correction d'une référence périmée. **Aucune optimisation de code
  tant que la mesure n'est pas écrite.**

---

## Chapitre C — Geler la signature (décisions du 30/09)

- **Marche C1 — La forme suit le canal.** On ne gèle pas une signature avant de connaître le canal
  (un canal riche autorise des champs nommés, un canal étroit oblige à des chaînes courtes).
  ⇒ **mesurer d'abord, geler ensuite.** C'est l'ordre de la démarche.
- **Marche C2 — Forme des cases : NOMMÉES** (décision FJD : « A clairement »). Chaque case porte
  son nom (`Appelant=panneau`), pour qu'un champ ajouté au milieu ne décale jamais les suivants.
- **Marche C3 — Noyau minimal : 3 champs.** `Appelant` · `Action` · `Chemin`.
- **Marche C4 — L'empreinte NE VOYAGE PAS** (décision FJD : « B »). Le moteur la recalcule depuis
  le `Chemin`. *Principe : le panneau PROPOSE, le moteur TRANCHE — une donnée recalculée par le
  moteur est vérifiée, une donnée reçue est crue sur parole.*
- **Marche C5 — Tracer le gel.** ROADMAP : bloc passé de *DRAFT* à *GELÉE*, avec l'historique des
  deux décisions. Mémoire de projet mise à jour.

**Rappel de conception (question FJD : « mapping en JSON avec un diff ? »)** : NON. Le texte porte
déjà son état (style appliqué, lu à la demande) ; le document porte la table de correspondance et
l'empreinte en étiquettes ; le disque n'a qu'une mémoire de secours. **Une seule source de vérité.**
Le seul « diff » du projet est la piste gun (diff de la LISTE DES STORIES, pas des styles).

---

## Chapitre D — Le répartiteur (en cours)

- **Marche D1 — Séparer les deux appels.** ✅ **FAITE (30/09/2026).** Un **répartiteur** est posé
  en fin de moteur, juste avant l'entrée en scène : `M04_TUBE` / `lireTube()`. Si des arguments
  racine sont fournis → **chemin panneau** ; sinon → **chemin menu**. *Idée clé : le test qui
  sépare les deux appels est trivial (`arguments` absent ⇔ on vient du menu) — c'est la mesure du
  30/09 qui l'a rendu trivial ; sans elle, on aurait inventé un mécanisme compliqué.*
- **Marche D2 — Ne rien casser.** ✅ **FAITE ET VÉRIFIÉE (30/09/2026).** `M04_TUBE` vaut `null`
  quand personne ne fournit d'arguments ⇒ le menu suit **le chemin d'avant, à l'identique**.
  *Preuve : `node --check` OK, **0 U+FFFD**, et la **dernière ligne du moteur reste `main();`** —
  volontairement préservée parce que la sonde du panneau s'en sert comme repère pour charger le
  moteur sans l'exécuter.* **Leçon : on ne casse pas un repère que d'autres outils utilisent.**
  *Deuxième leçon : la corruption d'encodage (`mesuré` → U+FFFD) est arrivée PENDANT l'écriture —
  d'où le contrôle systématique après édition, jamais avant.*
- **Marche D3 — Brancher le bouton, et prouver le transport dans le VRAI moteur** (pas une sonde).
  **3a ✅ ÉCRITE (30/09/2026)** : bouton `btn_import` **visible** et câblé ; il construit le tube gelé
  (`Appelant=panneau` / `Action=importer` / `Chemin=<md>`) et appelle le moteur. **3b — prochain pas** :
  lire dans le **journal du moteur** la ligne `M04-repartiteur: appel PANNEAU | …`.
  *Idée clé de 3a — le moteur doit s'exécuter COMME UN FICHIER, pas comme un texte.* Mesuré **dans le
  code** : le moteur déduit son **journal** (ligne 15) et son **entrée de menu** (l. 3145/3150) de
  `$.fileName`. Une chaîne de source ne donne aucun `$.fileName` valable. On envoie donc une **enveloppe
  minuscule** qui, *dans le moteur*, dépose le tube dans un global **à usage unique** puis charge le
  **vrai** `import_md.jsx` par `$.evalFile`. *("Un moteur qui se croit nulle part écrit son journal
  nulle part." )*
  *Leçon : ne pas confondre « appeler un script » et « appeler un FICHIER de script » — le second porte
  son propre chemin, le premier non.*
- **Marche D3bis — Transporter un argument à travers `$.evalFile`.** Complément de D3a : `$.evalFile`
  **ne transmet aucun argument**. Deux parades possibles — le **global à usage unique** (retenu, mesuré,
  simple) ou un enchaînement `doScript(File…)` construit côté moteur (idiome Adobe, plus lourd). On a pris
  le global *parce que le repli est trivial : il relit le MÊME tube, mêmes cas nommés, puis s'efface —*
  sinon un appel ultérieur par le MENU serait pris pour un appel du panneau.
- **Marche D4 — Le sélecteur de fichier ne s'ouvre plus** côté panneau : généralisation directe du
  précédent M05 (`cheminImposé = relanceSourcePath || M04_TUBE.chemin` ⇒ `File.openDialog` sauté).
  ✅ **FAIT DANS LE MOTEUR, ET DÉSORMAIS ALIMENTÉ PAR LE PANNEAU** ; reste à le **constater** par un
  appel réel.
- **Marche D5 — La preuve ne juge que sur les lignes AJOUTÉES.** ✅ **FAITE (30/09/2026).** Le
  gestionnaire lit le journal moteur **avant** et **après**, puis n'examine que le **delta**. *Leçon :
  un journal qui s'accumule prouve le passé autant que le présent — un succès d'hier passerait pour
  celui d'aujourd'hui. On ne juge jamais un journal cumulé en entier.*
- **Marche D5bis — Un refus doit se DIRE, et ne jamais s'afficher comme un succès.**
  ✅ **FAITE (30/09/2026)**, déclenchée par FJD : *« 1ere fois erreur silencieuse : importer sans
  choisir un bloc. il faut un laerte. »* Cause **lue dans le code** : sans sélection, le moteur part en
  **mode « gun »** — il prépare un placement à la main et **retourne sans un mot**. Côté panneau, c'était
  même **pire que le silence** : les deux lignes de journal cherchées sont écrites **avant** cette
  branche, donc le bandeau affichait **SUCCES** alors que **rien** n'avait été importé.
  **Décision** (point d'architecture) : le MENU **garde** le mode gun (choix FJD du 26/09 — on n'y touche
  pas) ; seul le **chemin PANNEAU** refuse, **en le disant** : le moteur journalise `M04: REFUS …` et
  alerte, **avant** tout nettoyage (ni document, ni place gun touchés) ; le panneau lit cette ligne dans
  le **delta** et bascule en **ECHEC**.
  *Leçon : un succès doit être **conditionné à une écriture réelle**, pas à la simple présence d'une
  trace d'appel.* Et : **une seule autorité par question** — le panneau ne juge pas la sélection à la
  place du moteur (un curseur actif peut rapporter une sélection vide quand le focus est au panneau).
- **Marche D6 — Le Cmd+Z** : **différé par FJD** (« plus subtil que ce qui a été mis en place »).
  Ne pas l'ouvrir avant que le reste tienne.

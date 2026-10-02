#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generateur des SVG du panneau  Liens MD  pour Illustrator.

Pourquoi ce script plutot qu'un SVG ecrit a la main :
  - la geometrie reste ainsi ALIGNEE sur le HTML du panneau (memes tokens, meme
    ordre de zones, memes hauteurs de ligne) ; si on retouche l'un, on regenere
    l'autre au lieu de laisser diverger deux dessins ;
  - les icones sont les VRAIES geometries Spectrum (jeu workflow), pas des
    approximations.

Choix de compatibilite Illustrator :
  - AUCUNE classe CSS : tout en attributs de presentation (fill=, font-size=...).
    Illustrator aplatit les styles SVG et perdrait les classes.
  - Chaque zone est un <g id="..."> => arrive comme un CALQUE nomme dans Illustrator.
  - Dimensions 1:1 avec le panneau reel (320 x 640, taille dockee declaree dans
    manifest.json) : FJD peut mettre a l'echelle dans Illustrator sans recalcul.

Sortie (suffixe _genere OBLIGATOIRE) :
  illustrator/panneau_liens_md_genere.svg                    (Calibrage replie)
  illustrator/panneau_liens_md_genere_calibrage_deplie.svg   (Calibrage deplie)

ATTENTION : illustrator/panneau_liens_md.svg est la REFERENCE re-sauvee par FJD
depuis Illustrator. Ce n'est PAS une sortie de ce script et il ne doit JAMAIS
l'ecraser (garde explicite dans main()).
"""

import os

# --------------------------------------------------------------------------
# Tokens (identiques au bloc :root de index.html)
# --------------------------------------------------------------------------
T = {
    "bg":             "#323232",
    "surface":        "#3a3a3a",
    "border":         "#494949",
    "border_strong":  "#5a5a5a",
    "separator":      "#474747",
    "th_bg":          "#3f3f3f",
    "text":           "#eaeaea",
    "text_dim":       "#b0b0b0",
    "accent":         "#2680eb",
    "warning":        "#e68619",
    "danger":         "#d7373f",
    "success":        "#2d9d78",
    "white":          "#ffffff",
}

POLICE = "Helvetica, Arial, sans-serif"

# --------------------------------------------------------------------------
# Geometries d'icones (viewBox 0 0 36 36) - jeu Spectrum workflow
# --------------------------------------------------------------------------
# rs-workflow/Alert.svg - vb 36 (vrai glyphe d'avertissement Adobe)
I_ALERTE = [
    "M17.127,2.579.4,32.512A1,1,0,0,0,1.272,34H34.728a1,1,0,0,0,.872-1.488L18.873,2.579A1,1,0,0,0,17.127,2.579ZM20,29.5a.5.5,0,0,1-.5.5h-3a.5.5,0,0,1-.5-.5v-3a.5.5,0,0,1,.5-.5h3a.5.5,0,0,1,.5.5Zm0-6a.5.5,0,0,1-.5.5h-3a.5.5,0,0,1-.5-.5v-12a.5.5,0,0,1,.5-.5h3a.5.5,0,0,1,.5.5Z",
]
I_PAGE = [
    "M20 11V2H7a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1V12h-9a1 1 0 0 1-1-1Z",
    "M22 2h.086a1 1 0 0 1 .707.293l6.914 6.914a1 1 0 0 1 .293.707V10h-8Z",
]
# uxp-ui/Chevron200.svg - vb 12. Le jeu ui: ne fournit PAS de chevron vers le bas :
# on obtient  bas  par une rotation de 90 degres du chevron droite.
VB_CHEVRON = 12
I_CHEVRON_DROITE = [
    "M9.034 5.356L4.343.663a.911.911 0 00-1.29 1.289L7.102 6l-4.047 4.047a.911.911 0 101.289 1.29l4.691-4.692a.912.912 0 000-1.29z",
]
I_CHAINE = [
    "M31.7 4.3a7.176 7.176 0 0 0-10.148 0c-.385.386-4.264 4.222-5.351 5.309a8.307 8.307 0 0 1 3.743.607c.519-.52 3.568-3.526 3.783-3.741a4.1 4.1 0 0 1 5.8 5.8l-7.119 7.115a4.617 4.617 0 0 1-3.372 1.3 3.953 3.953 0 0 1-2.7-1.109 4.154 4.154 0 0 1-1.241-1.626 2.067 2.067 0 0 0-.428.318l-1.635 1.712a7.144 7.144 0 0 0 1.226 1.673c2.8 2.8 7.875 2.364 10.677-.438l6.765-6.768a7.174 7.174 0 0 0 0-10.152Z",
    "M15.926 25.824c-.52.52-3.5 3.547-3.713 3.762a4.1 4.1 0 1 1-5.8-5.8L13.6 16.6a4.58 4.58 0 0 1 3.366-1.292 4.2 4.2 0 0 1 3.784 2.782 2.067 2.067 0 0 0 .428-.318l1.734-1.721a7.165 7.165 0 0 0-1.226-1.673 7.311 7.311 0 0 0-10.26.048l-7.187 7.186a7.176 7.176 0 0 0 10.148 10.149c.386-.386 4.194-4.243 5.281-5.33a8.3 8.3 0 0 1-3.742-.607Z",
]
I_IMPORT = [
    "M33 2H11a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V6h16v24H14v-3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z",
    "M16 25.198a.8.8 0 0 0 .805.802.786.786 0 0 0 .527-.204l7.524-7.445a.5.5 0 0 0 0-.702l-7.524-7.445a.785.785 0 0 0-.527-.204.8.8 0 0 0-.805.802V16H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h13Z",
]
I_ACTUALISER = [
    "M20 0h.086a1 1 0 0 1 .706.292L27.708 7.2a1 1 0 0 1 .292.714V8h-8Z",
    "M14 27a13 13 0 0 1 13-13c.338 0 .669.025 1 .05V10h-9a1 1 0 0 1-1-1V0H5a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h10a12.956 12.956 0 0 1-1-5ZM35.605 29.549a8.883 8.883 0 0 1-15.501 3.09l-1.25 1.251a.489.489 0 0 1-.35.148.5.5 0 0 1-.504-.501v-5a.5.5 0 0 1 .5-.5h4.999a.502.502 0 0 1 .501.504.489.489 0 0 1-.147.35l-1.74 1.74a6.057 6.057 0 0 0 10.597-1.436.977.977 0 0 1 .921-.62h1.25a.759.759 0 0 1 .724.974Z",
    "M18.395 24.526a8.883 8.883 0 0 1 15.501-3.091l1.25-1.25a.489.489 0 0 1 .35-.148.5.5 0 0 1 .504.5v5a.5.5 0 0 1-.5.5h-4.999a.502.502 0 0 1-.501-.504.489.489 0 0 1 .147-.35l1.74-1.74A6.057 6.057 0 0 0 21.29 24.88a.977.977 0 0 1-.921.62h-1.25a.759.759 0 0 1-.724-.974Z",
]
I_CRAYON = [
    "M33.567 8.2 27.8 2.432a1.215 1.215 0 0 0-.866-.353H26.9a1.371 1.371 0 0 0-.927.406L5.084 23.372a.99.99 0 0 0-.251.422L2.055 33.1c-.114.377.459.851.783.851a.251.251 0 0 0 .062-.007c.276-.063 7.866-2.344 9.311-2.778a.972.972 0 0 0 .414-.249l20.888-20.889a1.372 1.372 0 0 0 .4-.883 1.221 1.221 0 0 0-.346-.945ZM11.4 29.316c-2.161.649-4.862 1.465-6.729 2.022l2.009-6.73Z",
]


def icone(paths, x, y, taille, couleur, vb=36, rotation=0):
    """Icone posee en (x, y) (coin haut-gauche), cote = taille.
    vb = dimension du viewBox d'origine ; rotation = degres autour du centre."""
    e = float(taille) / vb
    d = " ".join('<path d="%s"/>' % p for p in paths)
    t = "translate(%.2f,%.2f) scale(%.4f)" % (x, y, e)
    if rotation:
        t += " rotate(%d,%.1f,%.1f)" % (rotation, vb / 2.0, vb / 2.0)
    return '<g transform="%s" fill="%s">%s</g>' % (t, couleur, d)


def texte(x, y, s, taille=11, couleur=None, ancre="start", gras=False):
    couleur = couleur or T["text"]
    g = ' font-weight="bold"' if gras else ""
    return ('<text x="%.1f" y="%.1f" font-family="%s" font-size="%s" fill="%s" '
            'text-anchor="%s"%s>%s</text>'
            % (x, y, POLICE, taille, couleur, ancre, g,
               s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")))


def rect(x, y, w, h, fill="none", stroke=None, rayon=0, opacite=None):
    a = ' x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s"' % (x, y, w, h, fill)
    if stroke:
        a += ' stroke="%s" stroke-width="1"' % stroke
    if rayon:
        a += ' rx="%d" ry="%d"' % (rayon, rayon)
    if opacite is not None:
        a += ' opacity="%s"' % opacite
    return "<rect%s/>" % a


def ligne(x1, y1, x2, y2, couleur):
    return ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" '
            'stroke-width="1"/>' % (x1, y1, x2, y2, couleur))


# --------------------------------------------------------------------------
# Donnees de demonstration (identiques a main.js)
# --------------------------------------------------------------------------
SOURCES = [
    ("charte_gemini_formation.md", "modifiee",  "p. 12", T["danger"],
     "28,4 ko (29 117 octets)", "1 842", "12 903",
     "mercredi 1 octobre 2026 09:14",
     "/Users/fjd/Docs/charte_gemini_formation.md", "Gemini 2.5 Pro"),
    ("referentiel_deepseek.md", "identique", "p. 4", T["text_dim"],
     "11,2 ko (11 470 octets)", "730", "5 108",
     "lundi 29 septembre 2026 17:02",
     "/Users/fjd/Docs/referentiel_deepseek.md", "DeepSeek V3"),
    ("mission_03_minimal.md", "source absente", "p. 31", T["warning"],
     "-", "-", "-", "-",
     "/Users/fjd/Docs/mission_03_minimal.md", "-"),
]


# --------------------------------------------------------------------------
# Construction du dessin
# --------------------------------------------------------------------------
def construire(deplie):
    L, H = 320, (676 if deplie else 640)
    PAD = 8
    DROITE = L - PAD            # 312
    GAUCHE = PAD                # 8
    o = []

    # fond
    o.append(rect(0, 0, L, H, T["bg"]))

    # ================= zone 1 - EN-TETE =================
    z = []
    z.append(texte(GAUCHE, 22, "Liens MD", 13, T["text"], "start", True))
    z.append(icone(I_ALERTE, DROITE - 132, 9, 14, T["warning"]))
    z.append(texte(DROITE, 21, "1 source modifiee", 11, T["danger"], "end"))
    o.append('<g id="zone_entete">%s</g>' % "".join(z))

    # ================= zone 2 - LISTE =================
    z = []
    TOP = 34
    HAUT_TABLE = 56
    BAS_TABLE = HAUT_TABLE + 24 * len(SOURCES)
    BAS_BLOC = 400

    z.append(rect(GAUCHE, TOP, DROITE - GAUCHE, BAS_BLOC - TOP,
                  T["surface"], T["border"], 4))

    # entete de colonnes (L2)
    z.append(rect(GAUCHE + 1, TOP + 1, DROITE - GAUCHE - 2, 22, T["th_bg"]))
    z.append(texte(GAUCHE + 8, TOP + 15, "Nom", 11, T["text_dim"]))
    z.append(icone(I_ALERTE, DROITE - 62, TOP + 5, 14, T["text_dim"]))
    z.append(icone(I_PAGE, DROITE - 30, TOP + 5, 14, T["text_dim"]))
    z.append(ligne(GAUCHE + 1, TOP + 23, DROITE - 1, TOP + 23, T["border_strong"]))

    # lignes (L3)
    y = HAUT_TABLE
    for i, (nom, etat, page, coul, taille, mots, signes, date, chemin, modele) in enumerate(SOURCES):
        if i == 0:
            z.append(rect(GAUCHE + 1, y, DROITE - GAUCHE - 2, 24, T["accent"]))
        coul_txt = T["white"] if i == 0 else T["text"]

        # badge de format  md 
        z.append(rect(GAUCHE + 8, y + 3, 18, 18, "none",
                      T["warning"] if i != 0 else T["white"], 4))
        z.append(texte(GAUCHE + 17, y + 16, "MD", 8,
                       T["warning"] if i != 0 else T["white"], "middle", True))

        z.append(texte(GAUCHE + 34, y + 16, nom, 11, coul_txt))
        z.append(texte(DROITE - 62, y + 16, etat, 11,
                       T["white"] if i == 0 else coul, "end"))
        z.append(texte(DROITE - 8, y + 16, page, 11, coul_txt, "end"))
        if i < len(SOURCES) - 1:
            z.append(ligne(GAUCHE + 1, y + 24, DROITE - 1, y + 24, T["separator"]))
        y += 24

    z.append(texte(GAUCHE + 8, BAS_TABLE + 18,
                   "3 sources dans ce document - la ligne bleue est la source selectionnee.",
                   10, T["text_dim"]))
    o.append('<g id="zone_liste">%s</g>' % "".join(z))

    # ================= zone 3 - ACTIONS =================
    z = []
    AY = 408
    TAILLE_BTN = 32
    # chevron expander
    z.append(icone(I_CHEVRON_DROITE, GAUCHE + 9, AY + 9, 14, T["text"], VB_CHEVRON))
    z.append(texte(GAUCHE + 36, AY + 21, "2 liens selectionnes", 11, T["text_dim"]))
    # 4 icones seules, alignees a droite
    icones = [(I_CHAINE, "reediter le lien"), (I_IMPORT, "importer"),
              (I_ACTUALISER, "actualiser"), (I_CRAYON, "editer")]
    x = DROITE - (TAILLE_BTN * 4 + 4 * 3)
    for paths, _ in icones:
        z.append(rect(x, AY, TAILLE_BTN, TAILLE_BTN, "none", T["border"], 4, 0.6))
        z.append(icone(paths, x + 9, AY + 9, 14, T["text"]))
        x += TAILLE_BTN + 4
    o.append('<g id="zone_actions">%s</g>' % "".join(z))

    # ================= zone 4 - INFORMATIONS =================
    z = []
    IY = 452
    z.append(ligne(GAUCHE, IY - 8, DROITE, IY - 8, T["separator"]))
    z.append(texte(L / 2, IY + 10, "Informations sur les liens", 13,
                   T["text"], "middle", True))

    s = SOURCES[0]
    lignes = [
        ("Nom :", s[0], T["text"]),
        ("Etat :", s[1], T["danger"]),
        ("Taille :", s[4], T["text"]),
    ]
    y = IY + 34
    for cle, val, coul in lignes:
        z.append(texte(L / 2, y, "%s %s" % (cle, val), 11, coul, "middle"))
        y += 18

    # ligne expandable  Calibrage  (chevron vers le bas quand c'est deplie)
    y += 10
    z.append(icone(I_CHEVRON_DROITE, L / 2 - 46, y - 11, 13, T["text"],
                   VB_CHEVRON, 90 if deplie else 0))
    z.append(texte(L / 2 - 30, y, "Calibrage", 11, T["text"]))
    y += 18

    if deplie:
        z.append(texte(L / 2, y, "mots : %s" % s[5], 11, T["text_dim"], "middle"))
        y += 18
        z.append(texte(L / 2, y, "signes : %s" % s[6], 11, T["text_dim"], "middle"))
        y += 18

    y += 8
    for cle, val in [("Date de modification :", s[7]),
                     ("Chemin :", s[8]),
                     ("Modele :", s[9])]:
        z.append(texte(L / 2, y, "%s %s" % (cle, val), 11, T["text"], "middle"))
        y += 18

    o.append('<g id="zone_infos">%s</g>' % "".join(z))

    corps = "".join(o)
    svg = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
           'viewBox="0 0 %d %d">\n%s\n</svg>\n' % (L, H, L, H, corps))
    return svg


# panneau_liens_md.svg n'est PAS une sortie de ce script : c'est la reference
# re-sauvee par FJD depuis Illustrator. On refuse de l'ecrire, meme par accident.
REFERENCE = "panneau_liens_md.svg"


def main():
    ici = os.path.dirname(os.path.abspath(__file__))
    cibles = [
        ("panneau_liens_md_genere.svg", False),
        ("panneau_liens_md_genere_calibrage_deplie.svg", True),
    ]
    for nom, deplie in cibles:
        if nom == REFERENCE:
            raise SystemExit("refus d'ecrire sur la reference %s" % REFERENCE)
        chemin = os.path.join(ici, nom)
        with open(chemin, "w", encoding="utf-8") as f:
            f.write(construire(deplie))
        print("ecrit : %s (%d octets)" % (nom, os.path.getsize(chemin)))
    print("la reference %s n'a pas ete touchee" % REFERENCE)


if __name__ == "__main__":
    main()

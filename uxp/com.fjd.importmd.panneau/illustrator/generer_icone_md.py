# -*- coding: utf-8 -*-
"""
Genere l'icone de barre d'accroche du panneau « Liens MD » (23 x 23).

Demande FJD (01/10/2026) :
  « il nous faut une icone de reconnaissance dans la barre d'accroche de
    panneau a droite, lorsque le panneau est accroche et collapsed. pour le
    moment c'est un lego "module externe" ; optons provisoirement pour le
    logo MD qui figure a gauche de la liste de liens, simplement en
    fill #535353 et Stroke + type #b0b0b0 »

Source du dessin = le BADGE MD de la reference Illustrator
  uxp/com.fjd.importmd.panneau/illustrator/panneau_liens_md.svg
    rect  cls-30  x=67.5 y=59  w=18 h=18  rx=4 ry=4   fill #e68619
    text  cls-4   translate(70.28 71)  "MD"  Helvetica-Bold 700, 8 px

On garde les PROPORTIONS du badge et on rejoue les couleurs demandees :
    carre : fill #535353   +  stroke #b0b0b0
    lettres : fill #b0b0b0

Les lettres sont VECTORISEES (pas de <text>) : une icone doit etre autonome,
sans dependance a une police installee sur la machine de l'utilisateur.

Usage : python3 generer_icone_md.py [sortie.svg]
"""

import io
import os
import re

# --- la police du badge de reference (Helvetica-Bold ; Arial Bold lui est
#     metriquement identique et disponible en .ttf simple). --------------
POLICE = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

# --- geometrie de la reference, pour garder les proportions -------------
REF_COTE = 18.0          # cote du carre du badge
REF_RX = 4.0             # rayon des coins du badge
REF_POLICE = 8.0         # corps des lettres du badge

# --- la cible -----------------------------------------------------------
COTE = 23.0              # icone 23 x 23 (species "toolbar" : 23 @100%, 46 @200%)
MARGE = 1.5              # marge pour que le stroke ne soit pas rogne
COULEUR_FOND = "#535353"
COULEUR_TRAIT = "#b0b0b0"
COULEUR_LETTRES = "#b0b0b0"
EPAISSEUR = 1.0

# Interlettrage global demande par FJD (01/10) : .035em.
INTERLETTRAGE = 0.035


def nb(v):
    """Tronque les decimales inutiles (2 chiffres max), comme rot_chevron.py."""
    s = "%.2f" % v
    s = s.rstrip("0").rstrip(".")
    return s if s not in ("", "-0") else "0"


def nb3(v):
    """Comme nb() mais a 3 decimales (pour les coordonnees de trace)."""
    s = "%.3f" % v
    s = s.rstrip("0").rstrip(".")
    return s if s not in ("", "-0") else "0"


def arrondir_trace(d):
    """Arrondit chaque nombre d'un attribut d= a 3 decimales."""
    return re.sub(r"-?\d+\.\d+",
                  lambda m: nb3(float(m.group(0))),
                  d)


def contour_lettres(texte, corps, interlettrage, decalage=(0.0, 0.0)):
    """Retourne (d_svg, largeur_avance, bbox) des lettres vectorisees.

    bbox = (xmin, ymin, xmax, ymax) de l'ENCRE, en repere SVG (y vers le bas).

    `decalage` = translation (tx, ty) CUITE dans la matrice du trace. On
    n'utilise donc AUCUN <g transform=...> dans le SVG produit : le moteur SVG
    d'UXP ne supporte pas transform, et la doc UXP avertit que toutes les
    fonctions SVG ne sont pas rendues (known-issues InDesign : « Plugin icons
    do support SVG files, but UXP doesn't support all SVG features »).
    """
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.misc.transform import Transform

    fonte = TTFont(POLICE)
    glyphes = fonte.getGlyphSet()
    cmap = fonte.getBestCmap()
    upem = fonte["head"].unitsPerEm
    echelle = corps / upem
    tx, ty = decalage

    morceaux = []
    x = 0.0
    for ch in texte:
        nom = cmap[ord(ch)]
        g = glyphes[nom]

        # repere police (y vers le haut) -> repere SVG (y vers le bas)
        t = Transform(echelle, 0, 0, -echelle, x + tx, ty)
        pen = SVGPathPen(glyphes)
        g.draw(TransformPen(pen, t))
        morceaux.append(pen.getCommands())

        avance = g.width * echelle
        x += avance + interlettrage * corps

    d = " ".join(morceaux)

    # bbox de l'encre : on mesure sur les vraies courbes
    from fontTools.pens.boundsPen import BoundsPen
    bp = BoundsPen(glyphes)
    xx = 0.0
    for ch in texte:
        nom = cmap[ord(ch)]
        g = glyphes[nom]
        t = Transform(echelle, 0, 0, -echelle, xx + tx, ty)
        g.draw(TransformPen(bp, t))
        xx += g.width * echelle + interlettrage * corps

    return d, x, bp.bounds


def construire():
    cote_carre = COTE - 2 * MARGE
    rx = REF_RX * cote_carre / REF_COTE
    corps = REF_POLICE * cote_carre / REF_COTE

    # 1re passe : bbox de l'encre NON translatee, pour calculer le centrage.
    _, avance, bbox = contour_lettres("MD", corps, INTERLETTRAGE)
    xmin, ymin, xmax, ymax = bbox

    # centrage de l'ENCRE dans l'icone
    dx = -xmin + (COTE - (xmax - xmin)) / 2.0
    dy = -ymin + (COTE - (ymax - ymin)) / 2.0

    # 2e passe : le trace est produit DEJA positionne (translation cuite),
    # donc le SVG n'a besoin d'aucun <g transform=...>.
    d, _, bbox_deplacee = contour_lettres("MD", corps, INTERLETTRAGE,
                                          (dx, dy))
    d = arrondir_trace(d)

    lignes = []
    lignes.append('<?xml version="1.0" encoding="UTF-8"?>')
    lignes.append('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" '
                  'viewBox="0 0 %s %s">' % (nb(COTE), nb(COTE), nb(COTE), nb(COTE)))
    lignes.append("  <!-- Icone de barre d'accroche du panneau Liens MD (23 x 23).")
    lignes.append("       Provient du badge MD de panneau_liens_md.svg : carre 18x18")
    lignes.append("       rx 4, lettres Helvetica-Bold 8 px. Couleurs demandees par")
    lignes.append("       FJD : fill #535353, stroke et lettres #b0b0b0. -->")
    lignes.append('  <rect x="%s" y="%s" width="%s" height="%s" rx="%s" ry="%s"'
                  % (nb(MARGE), nb(MARGE), nb(cote_carre), nb(cote_carre),
                     nb(rx), nb(rx)))
    lignes.append('        fill="%s" stroke="%s" stroke-width="%s"/>'
                  % (COULEUR_FOND, COULEUR_TRAIT, nb(EPAISSEUR)))
    lignes.append('  <path fill="%s" d="%s"/>' % (COULEUR_LETTRES, d))
    lignes.append("</svg>")
    lignes.append("")

    return "\n".join(lignes), dict(cote_carre=cote_carre, rx=rx, corps=corps,
                                   avance=avance, bbox=bbox, dx=dx, dy=dy,
                                   bbox_deplacee=bbox_deplacee)


if __name__ == "__main__":
    import sys

    ici = os.path.dirname(os.path.abspath(__file__))
    sortie = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(ici), "icones", "md.svg")

    svg, info = construire()
    dossier = os.path.dirname(sortie)
    if dossier and not os.path.isdir(dossier):
        os.makedirs(dossier)
    io.open(sortie, "w", encoding="utf-8").write(svg)

    print("  ecrit          :", sortie)
    print("  octets         :", len(svg.encode("utf-8")))
    print("  carre          : %s x %s  rx %s  (marge %s)"
          % (nb(info["cote_carre"]), nb(info["cote_carre"]), nb(info["rx"]), nb(MARGE)))
    print("  corps lettres  :", nb(info["corps"]))
    print("  avance totale  :", nb(info["avance"]))
    print("  bbox encre rel.:", [nb(v) for v in info["bbox"]])
    print("  translation    : dx %s  dy %s" % (nb(info["dx"]), nb(info["dy"])))
    print("  bbox encre abs.:", [nb(v) for v in info["bbox_deplacee"]])
    print("  balises        :", svg.count("<path"), "path,",
          svg.count("<g "), "g,", svg.count("transform"), "transform")
    print("  U+FFFD         :", svg.count("\ufffd"))

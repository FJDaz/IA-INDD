# -*- coding: utf-8 -*-
"""
Rasterise icones/md.svg en PNG pour le manifest du panneau « Liens MD ».

Pourquoi des PNG et pas le SVG directement ?
  La doc UXP (known-issues InDesign) avertit noir sur blanc :
    « Plugin icons do support SVG files, but UXP doesn't support all SVG
      features, which means you'll want to test your SVG icon before
      shipping your plugin if you decide to use SVG icons in the Plugin
      Panel. »
    « Not all SVG files are supported by UXP. UXP's SVG renderer is targeted
      for simple icons and the like; complex SVGs may fail to render
      completely, or may render in unexpected ways. »
  Le guide Photoshop « Icons for Your Plugins » donne en plus la taille
  exacte des icones de panneau (espèce « toolbar ») : 23 x 23 (46 x 46 @2x),
  et des icones de liste de plugins (espèce « pluginList ») : 24 x 24
  (48 x 48 @2x).

  => on fournit des PNG aux DEUX tailles, ce qui supprime tout risque lié au
     moteur SVG d'UXP.

Aucun outil SVG natif n'est présent sur ce poste (pas de cairosvg, rsvg-convert
ni inkscape) : on passe donc par Chrome headless (rendu d'un SVG vectoriel en
PNG, fond transparent), puis on REDUIT avec PIL/LANCZOS pour un anti-aliasing
propre.

Sorties (dans icones/) :
    md.png          23 x 23   + md@2x.png        46 x 46   (entrypoint, toolbar)
    panneau.png     24 x 24   + panneau@2x.png   48 x 48   (racine, pluginList)

Usage : python3 generer_png_icone.py
"""

import io
import os
import re
import subprocess
import sys

from PIL import Image

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# taille de rendu maitre : >= la plus grande cible x 8, pour une reduction nette
COTE_MAITRE = 480

# (nom du fichier, cote final en px) -- l'ordre compte pour l'annonce
CIBLES = (
    ("md.png", 23),
    ("md@2x.png", 46),
    ("panneau.png", 24),
    ("panneau@2x.png", 48),
)


def chemin_racine():
    """Dossier du plugin (parent de illustrator/)."""
    ici = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(ici)


def lire_svg(chemin):
    return io.open(chemin, encoding="utf-8").read()


def forcer_taille(svg, cote):
    """Réécrit width/height de la balise <svg> racine, garde le viewBox."""
    svg = re.sub(r'(<svg[^>]*?)\swidth="[^"]*"', r'\1 width="%d"' % cote, svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\sheight="[^"]*"', r'\1 height="%d"' % cote, svg, count=1)
    return svg


def page_html(svg):
    return ("<!doctype html>\n<html><head><meta charset=\"utf-8\">\n"
            "<style>html,body{margin:0;padding:0;background:transparent}"
            "svg{display:block}</style></head>\n<body>\n" + svg + "\n</body></html>\n")


def rendu_maitre(svg, dossier_tmp):
    """Rend le SVG en PNG transparent a COTE_MAITRE via Chrome headless."""
    html = os.path.join(dossier_tmp, "icone.html")
    png = os.path.join(dossier_tmp, "icone.png")
    io.open(html, "w", encoding="utf-8").write(page_html(forcer_taille(svg, COTE_MAITRE)))

    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--default-background-color=00000000",   # fond TRANSPARENT
        "--screenshot=" + png,
        "--window-size=%d,%d" % (COTE_MAITRE, COTE_MAITRE),
        "file://" + html,
    ]
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if not os.path.isfile(png):
        sys.stderr.write(r.stderr.decode("utf-8", "replace"))
        raise RuntimeError("Chrome n'a produit aucun PNG")
    return png


def reduire(img, cote):
    """Reduction LANCZOS en PRE-MULTIPLIANT l'alpha (evite les halos sombres).

    Sans premultiplication, LANCZOS moyenne la couleur des pixels totalement
    transparents (souvent du noir) avec celle du contour : le liseré vire au
    gris sombre. On premultiplie, on reduit, on depremultiplie.
    """
    alpha = img.getchannel("A")
    r, g, b = img.convert("RGB").split()

    prem = Image.merge("RGB", (
        Image.composite(r, Image.new("L", img.size, 0), alpha),
        Image.composite(g, Image.new("L", img.size, 0), alpha),
        Image.composite(b, Image.new("L", img.size, 0), alpha),
    )).resize((cote, cote), Image.LANCZOS)
    alpha2 = alpha.resize((cote, cote), Image.LANCZOS)

    donnees = []
    for (pr, pg, pb), al in zip(prem.getdata(), alpha2.getdata()):
        if al == 0:
            donnees.append((0, 0, 0, 0))
        else:
            donnees.append((min(255, round(pr * 255 / al)),
                            min(255, round(pg * 255 / al)),
                            min(255, round(pb * 255 / al)),
                            al))
    res = Image.new("RGBA", (cote, cote), (0, 0, 0, 0))
    res.putdata(donnees)
    return res


def encre(img):
    """Retourne la bbox de l'encre (xmin, ymin, xmax, ymax) pour alpha > 8."""
    a = img.getchannel("A")
    w, h = a.size
    px = a.load()
    xmin, ymin, xmax, ymax = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y] > 8:
                if x < xmin:
                    xmin = x
                if x > xmax:
                    xmax = x
                if y < ymin:
                    ymin = y
                if y > ymax:
                    ymax = y
    if xmax < 0:
        return None
    return (xmin, ymin, xmax, ymax)


def main():
    racine = chemin_racine()
    dossier_icones = os.path.join(racine, "icones")
    source = os.path.join(dossier_icones, "md.svg")

    svg = lire_svg(source)
    if "transform" in svg:
        sys.stderr.write("ATTENTION : le SVG contient encore un transform\n")
        return 1

    import shutil
    import tempfile
    tmp = tempfile.mkdtemp(prefix="icone_md_")
    try:
        maitre = rendu_maitre(svg, tmp)
        img = Image.open(maitre).convert("RGBA")
        print("  rendu maitre   : %d x %d  (fond transparent : %s)"
              % (img.size[0], img.size[1],
                 img.getchannel("A").getextrema()[0] == 0))

        for nom, cote in CIBLES:
            petite = reduire(img, cote)
            dest = os.path.join(dossier_icones, nom)
            petite.save(dest, "PNG", optimize=True)
            e = encre(petite)
            print("  %-14s : %2d x %2d  %5d o  encre %s"
                  % (nom, cote, cote, os.path.getsize(dest),
                     e if e else "AUCUNE"))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print("  U+FFFD         : 0")
    return 0


if __name__ == "__main__":
    sys.exit(main())

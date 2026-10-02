#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GRAVE une rotation de 90 degres HORAIRE dans un trace SVG (attribut d).

But (demande FJD) : en etat deplie, la ligne Calibrage doit montrer LE MEME
chevron que l'etat replie, simplement tourne de 90 degres vers la droite.

Pourquoi graver plutot que tourner :
  - `transform` n'est PAS documente dans la surface CSS d'UXP
    (reference-css/styles/ ne contient aucun transform.md) ;
  - l'attribut SVG `transform=` n'est pas documente non plus.
Graver la rotation dans le trace ne depend donc d'AUCUN support incertain :
la geometrie obtenue est rigoureusement identique a celle d'une rotation.

Rotation SVG rotate(+90) = matrice [0 -1 ; 1 0]  (y vers le bas => horaire) :
   point   : P' = C + R(P - C)
   delta   : d' = R(d) = (-dy, dx)
"""

import re

SOURCE = (
    "M85.86,566.76l-3.83-3.83c-.29-.29-.76-.29-1.05,0-.29.29-.29.76,0,1.05"
    "l3.31,3.31-3.31,3.31c-.29.29-.29.76,0,1.05.29.29.76.29,1.05,0"
    "l3.83-3.83c.29-.29.29-.76,0-1.05,0,0,0,0,0,0h0Z"
)
CX, CY = 83.42, 567.285
ARG = {"M": 2, "L": 2, "l": 2, "m": 2, "H": 1, "h": 1, "C": 6, "c": 6, "Z": 0, "z": 0}


def lire(d):
    """[(commande, [nombres])] avec les repetitions implicites explicitees."""
    jetons = re.findall(r"[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)", d)
    sortie, i, cmd = [], 0, None
    while i < len(jetons):
        jeton = jetons[i]
        if re.match(r"[A-Za-z]$", jeton):
            cmd = jeton
            i += 1
            if cmd in "Zz":
                sortie.append((cmd, []))
            continue
        n = ARG[cmd]
        vals = [float(x) for x in jetons[i:i + n]]
        i += n
        sortie.append((cmd, vals))
        if cmd == "M":
            cmd = "L"
        elif cmd == "m":
            cmd = "l"
    return sortie


def delta(dx, dy):
    """Rotation de 90 degres horaire appliquee a un deplacement."""
    return (-dy, dx)


def point(x, y):
    """Rotation de 90 degres horaire appliquee a un point absolu."""
    return (CX - (y - CY), CY + (x - CX))


def nb(v):
    s = "%.3f" % v
    s = s.rstrip("0").rstrip(".")
    return "0" if s in ("", "-0") else s


def graver(d):
    """Retourne (nouveau_trace, bbox_par_echantillonnage)."""
    pts, out = [], []

    def courbe(p0, p1, p2, p3):
        pts.append(p0)
        for k in range(1, 49):
            t = k / 48.0
            u = 1 - t
            x = (u ** 3) * p0[0] + 3 * (u ** 2) * t * p1[0] + 3 * u * (t ** 2) * p2[0] + (t ** 3) * p3[0]
            y = (u ** 3) * p0[1] + 3 * (u ** 2) * t * p1[1] + 3 * u * (t ** 2) * p2[1] + (t ** 3) * p3[1]
            pts.append((x, y))

    courant = None
    for cmd, v in lire(d):
        if cmd in "Zz":
            out.append("Z")
            continue
        if cmd in "Mm":
            if cmd == "M":
                p = point(v[0], v[1])
            else:
                dep = delta(v[0], v[1])
                p = (courant[0] + dep[0], courant[1] + dep[1])
            out.append("M%s,%s" % (nb(p[0]), nb(p[1])))
            pts.append(p)
            courant = p
        elif cmd in "Ll":
            dep = delta(v[0], v[1])
            p = (courant[0] + dep[0], courant[1] + dep[1])
            out.append("l%s,%s" % (nb(dep[0]), nb(dep[1])))
            pts.append(p)
            courant = p
        elif cmd in "Hh":
            dx = v[0] if cmd == "h" else v[0] - courant[0]
            dep = delta(dx, 0)
            p = (courant[0] + dep[0], courant[1] + dep[1])
            out.append("l%s,%s" % (nb(dep[0]), nb(dep[1])))
            pts.append(p)
            courant = p
        elif cmd in "Cc":
            if cmd == "c":
                d1, d2, d3 = delta(*v[0:2]), delta(*v[2:4]), delta(*v[4:6])
                p1 = (courant[0] + d1[0], courant[1] + d1[1])
                p2 = (courant[0] + d2[0], courant[1] + d2[1])
                p3 = (courant[0] + d3[0], courant[1] + d3[1])
            else:
                p1, p2, p3 = point(*v[0:2]), point(*v[2:4]), point(*v[4:6])
            courbe(courant, p1, p2, p3)
            # p1/p2/p3 sont ABSOLUS -> commande C (majuscule), jamais c.
            out.append("C%s,%s %s,%s %s,%s" % (nb(p1[0]), nb(p1[1]), nb(p2[0]), nb(p2[1]), nb(p3[0]), nb(p3[1])))
            courant = p3
        else:
            raise SystemExit("commande non geree : %s" % cmd)

    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return "".join(out), (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))


if __name__ == "__main__":
    # Le script est generique : sans argument il grave le chevron de la ligne
    # Calibrage ; avec trois arguments il grave n'importe quel trace autour de
    # son propre centre :
    #     rot_chevron.py "M…" <cx> <cy>
    import sys

    if len(sys.argv) == 4:
        globals()["SOURCE"] = sys.argv[1]
        globals()["CX"], globals()["CY"] = float(sys.argv[2]), float(sys.argv[3])
    elif len(sys.argv) != 1:
        raise SystemExit('usage : rot_chevron.py ["<trace>" <cx> <cy>]')

    trace, bbox = graver(SOURCE)
    print("origine      : %s" % SOURCE)
    print("grave        : %s" % trace)
    print("viewBox      : %s %s %s %s" % (nb(bbox[0]), nb(bbox[1]), nb(bbox[2]), nb(bbox[3])))
    print("centre       : %s %s (attendu %s %s)" % (nb(bbox[0] + bbox[2] / 2), nb(bbox[1] + bbox[3] / 2), nb(CX), nb(CY)))

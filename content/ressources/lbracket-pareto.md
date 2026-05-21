---
title: "Étude éléments finis paramétrique d'une cornière (L-bracket) sous CalculiX, avec balayage de 50 designs et identification d'un front de Pareto masse / contrainte"
description: "Étude paramétrique FEM d'un L-bracket en acier S235 — Latin Hypercube Sampling, 50 designs, front de Pareto masse / contrainte de Von Mises — XiLAB3D+"
date: 2026-05-19
math: true
ShowToc: true
TocOpen: false
ressource_type: "experimentations"
---

**XiLAB3dplus — Étude exploratoire**

Le document peut comporter des erreurs : n'hésitez pas à nous contacter

Étude éléments finis paramétrique d'une cornière (L-bracket) sous CalculiX, automatisation de la chaîne du maillage à l'analyse, avec balayage de 50 designs et identification d'un front de Pareto
masse / contrainte.

---

## 1. Objectif

Identifier les couples (masse, contrainte) accessibles pour un L-bracket
en acier S235 chargé en flexion à son extrémité, en faisant varier
**trois paramètres géométriques** :

- **L** — longueur d'aile (les deux ailes identiques)
- **W** — largeur (hors-plan)
- **t** — épaisseur

Sortie finale : un **front de Pareto** des designs non-dominés, et la
**loi multivariée** σ = f(L, W, t) calée sur les calculs FEM.

---

## 2. Géométrie & paramètres

![Schéma L-bracket paramétrique](/images/lbracket-pareto/lbracket_schema.png)

Cornière en L, ailes orthogonales, congé intérieur de rayon `r = t` pour
éviter la singularité d'angle droit.

| Paramètre | Symbole | Plage balayée |
|-----------|---------|---------------|
| Longueur d'aile | L | 50 – 150 mm |
| Largeur | W | 20 – 60 mm |
| Épaisseur | t | 3 – 10 mm |
| Rayon de congé | r | r = t |

Matériau : **acier S235**
- E = 210 000 MPa
- ν = 0.3
- ρ = 7.85 × 10⁻⁹ t/mm³
- Re = 235 MPa

Unités de travail : **mm, N, MPa, t**.

---

## 3. Conditions aux limites

- **Encastrement** sur la face arrière de l'aile verticale (`x = 0`) — toutes
  les composantes du déplacement bloquées.
- **Effort** total `F = 1000 N` dirigé selon `−y` (vers le bas), réparti en
  forces nodales équivalentes (`F/N` par nœud) sur la face d'extrémité de
  l'aile horizontale (`x = L`).

Le total de l'effort est constant entre designs ; seules les dimensions
varient. 

---

## 4. Maillage

**gmsh 4.15** [2] — tétraèdres quadratiques **C3D10** (4 sommets + 6 nœuds
de mi-arête, fonction de forme parabolique → capture le gradient linéaire
de déformation par élément, voir [5]).

**Stratégie de tailles** :

- **Au congé** : taille `h = r/6` (≈ 6 éléments le long du quart de
  cercle)
- **En volume (loin du congé)** : taille `h = t/3` — garantit la **règle
  des 3 éléments dans l'épaisseur**, recommandation standard pour capturer
  un gradient linéaire de déformation dans une section fléchie [6].

| Cas | n_nœuds | n_éléments | h_médiane / t |
|---|---:|---:|---:|
| L=50, W=20, t=3   | 90 k  | 56 k  | 2.8 |
| L=100, W=40, t=6  | 89 k  | 56 k  | 2.9 |
| L=150, W=60, t=10 | 76 k  | 48 k  | 3.1 |

Note permutation Tet10 dans le passage Gmsh > Calculix : les nœuds 9 et 10 sont
permutés entre la convention gmsh  et la convention CalculiX
C3D10. Cette permutation est appliquée à l'écriture du `.inp`.

Visualisation des 50 maillages générés de manière automatique grâce à un
script Python (ordre de calcul ; cadre rouge = front de Pareto) :

![Maillages 3D des 50 designs](/images/lbracket-pareto/meshes_3d_grid.png)

On observe que les cas à faible épaisseur (`t = 3 mm`) sont sensiblement
plus densément maillés (jusqu'à 130 k éléments) que les cas plus épais
(`t = 10 mm`, ~25 k éléments) : la contrainte `h ≤ t/3` impose une
taille de maille proportionnelle à l'épaisseur.

---

## 5. Solveur

**CalculiX 2.23** [1] en analyse linéaire statique. Solveur direct SPOOLES.

Sorties par cas :
- `model.frd` — résultats binaires CalculiX (relisibles par CGX)
- `model.vtu` — converti via `ccx2paraview` (ouvrable dans ParaView [9])

---

## 6. Exemples de champ de contraintes

Sur un design optimal déduit du Pareto (case 008 : L=58, W=57, t=8.2,
masse 0.40 kg, σ_max = 86 MPa) :

![Champ von Mises — cas 008](/images/lbracket-pareto/stress_case_008.png)

La concentration de contrainte se localise nettement le long du congé
intérieur ; ailleurs la pièçe est très peu sollicité.

Sur un design **plus fin** (case 047 : L=102, W=33, t=3.2, masse
0.16 kg, σ_max = 2265 MPa, **u = 17 mm**) :

![Champ von Mises — cas 047](/images/lbracket-pareto/stress_case_047.png)

La pièce a une flèche élevée (déformation tracée à l'échelle réelle ×1),
et la contrainte au congé dépasse largement la limite élastique de
l'acier. Ce design serait inutilisable en pratique — il sert ici à
borner le domaine d'étude.

**Mesure de σ_vM_max** : dans le script Python on filtre la mesure
σ_vM_max sur la zone du congé (`x ∈ [t, t+r]` × `y ∈ [t, t+r]`) pour
ignorer la singularité d'encastrement et les pics au point d'application
de la charge (principe de Saint-Venant [7]). La quantité extraite est
donc la contrainte structurellement dimensionnante, pas un artefact
de modélisation. Sa valeur dépend du facteur de concentration `Kt` du
congé [8].

---

## 7. Plan d'expérience

**Latin Hypercube Sampling** [4] sur les 3 paramètres, 50 échantillons.
La méthode LHS donne une meilleure couverture du domaine que
l'échantillonnage Monte-Carlo simple à effectif équivalent [10].

- 49 / 50 cas convergés en 37 min (1 cas — le plus fin+large — sature
  les 16 Go de RAM sur Calculix et est marqué `FAIL`).
- Plage σ_vM_max observée : 66 – 3600 MPa
- Plage masse : 0.10 – 0.97 kg

Aperçu des 50 designs balayés, à l'échelle absolue, triés par masse
croissante (couleur = σ_vM,max ; cadre rouge = front de Pareto) :

![Vue d'ensemble des 50 designs](/images/lbracket-pareto/designs_grid.png)

Même planche en rendu 3D, dans l'**ordre de calcul** (case_001 → case_050),
chaque pièce colorée par σ_vM sur échelle logarithmique commune :

![Rendu 3D des 50 designs](/images/lbracket-pareto/designs_3d_grid.png)

---

## 8. Front de Pareto

![Pareto masse vs contrainte](/images/lbracket-pareto/pareto_mass_stress.png)

8 designs forment le front de Pareto (non-dominés au sens
**minimiser masse ET contrainte**). De masse croissante :

| case | L (mm) | W (mm) | t (mm) | masse (kg) | σ_vM (MPa) | u (mm) |
|------|-------:|-------:|-------:|-----------:|-----------:|-------:|
| 038  | 53.9   | 23.4   | 5.24   | 0.099      | 528        | 0.68   |
| 006  | 65.6   | 20.1   | 7.82   | 0.154      | 324        | 0.41   |
| 002  | 70.0   | 25.7   | 7.91   | 0.212      | 266        | 0.38   |
| 015  | 54.8   | 42.1   | 7.01   | 0.239      | 158        | 0.15   |
| 029  | 59.2   | 34.6   | 8.08   | 0.244      | 154        | 0.15   |
| 022  | 50.8   | 56.6   | 6.83   | 0.290      | 113        | 0.09   |
| 008  | 57.8   | 57.1   | 8.23   | 0.399      | 86         | 0.08   |
| 009  | 60.8   | 59.7   | 9.30   | 0.493      | 67         | 0.06   |

**Analyse rapide** :

- Le front est décroissant : tout gain en masse coûte en
  contrainte et inversement [11].

- Pour rester sous la limite d'élasticité S235 (235 MPa), il faut une
  masse d'au moins ~0.24 kg (voir le cas 15 - lien de téléchargement ci-dessous).

- Tous les designs du front ont L ≤ 70 mm — les parties longues sont
  systématiquement dominées dans cette gamme de charge.

- Les designs lourds en masse (>0.6 kg) sont **dominés** : pénalité
  de masse sans bénéfice en contrainte → à éviter.

---

## 9. Sensibilité

![Sensibilité aux paramètres](/images/lbracket-pareto/sensitivity.png)

Sur chaque panneau, on a tracé la régression log-log
`log σ ~ log(paramètre)` avec sa pente et son coefficient de
corrélation `R`. Plus la droite est raide (|pente|) **et** plus
les points collent (|R| → 1), plus le paramètre est dominant.

| Paramètre | Pente | R | Lecture |
|-----------|----------------:|---:|---------|
| L (long.) | +1.35 | +0.50 | tendance modérée, nuage diffus |
| W (larg.) | −0.71 | −0.26 | tendance faible |
| **t** (ép.) | **−2.09** | **−0.82** | **tendance forte, points alignés** |

---

## Annexe — reproductibilité

```bash
# Étude complète
python3 run_study.py 50 --clean        # ≈ 37 min sur Mac M-series, 1 thread

# Post-traitement
python3 plot_pareto.py                 # front + sensibilité + loi multivariée
python3 render_stress.py 8             # rendu d'un cas particulier

# Visualisation ParaView
paraview results/case_008/model.vtu
```

Scripts Python du projet :

| fichier | rôle |
|---|---|
| `geometry.py` | construit la géométrie + mailleur gmsh (raffinement local, règle 3 él. dans t) |
| `solver.py` | génère le `.inp` CalculiX, lance `ccx_2.23`, convertit `.frd → .vtu`, extrait σ_vM et u_max |
| `run_study.py` | LHS + boucle 50 cas + écriture `results/summary.csv` |
| `plot_pareto.py` | front de Pareto, sensibilité, loi multivariée (non précisée dans ce rapport intéermédiare) |
| `render_stress.py` | rendu pyvista d'un cas avec champ de contraintes |
| `check_through_thickness.py` | vérifie le nombre d'éléments dans l'épaisseur |

Versions logicielles utilisées : CalculiX 2.23, gmsh 4.15.1,
ccx2paraview, meshio 5.3.5, numpy 2.1, scipy 1.17, pandas 2.3,
matplotlib 3.10, pyvista 0.47.

**Accès aux 50 cas tests** — l'intégralité des fichiers d'entrée et
de sortie (`.inp` CalculiX, `.frd` résultats binaires, `.vtu` pour
ParaView) est mise à disposition ici :
[Télécharger l'archive (50 cas)](https://drive.google.com/file/d/1wNusJc_AE2e0bbkhSZiOzS3ueYdR4I9P/view?usp=sharing).

---

## Références

[1] Dhondt, G. (2004). *The Finite Element Method for Three-Dimensional
Thermomechanical Applications*. Wiley, Chichester. — Base théorique de
CalculiX, par son auteur. Voir aussi le manuel utilisateur en ligne :
Dhondt, G. & Wittig, K., *CalculiX CrunchiX User's Manual*,
<http://www.dhondt.de/ccx_2.23.pdf>.

[2] Geuzaine, C., & Remacle, J.-F. (2009). "Gmsh: A 3-D finite element
mesh generator with built-in pre- and post-processing facilities."
*International Journal for Numerical Methods in Engineering*, 79(11),
1309–1331. <https://doi.org/10.1002/nme.2579>.

[3] Marot, C., Pellerin, J., & Remacle, J.-F. (2019). "One machine, one
minute, three billion tetrahedra." *International Journal for Numerical
Methods in Engineering*, 117(9), 967–990.
<https://doi.org/10.1002/nme.5987>. — Algorithme HXT utilisé pour le
maillage 3D parallèle de gmsh.

[9] Ahrens, J., Geveci, B., & Law, C. (2005). "ParaView: An End-User
Tool for Large Data Visualization." In *Visualization Handbook*,
Elsevier. ISBN 978-0123875822.

[5] Zienkiewicz, O. C., Taylor, R. L., & Zhu, J. Z. (2013). *The Finite
Element Method: Its Basis and Fundamentals* (7e éd.).
Butterworth-Heinemann. — Référence canonique sur les éléments
quadratiques (tétraèdre Tet10 / C3D10, fonctions de forme paraboliques).

[6] Cook, R. D., Malkus, D. S., Plesha, M. E., & Witt, R. J. (2002).
*Concepts and Applications of Finite Element Analysis* (4e éd.). Wiley.
ISBN 978-0471356059. — Discussion de la règle empirique des 3 éléments
dans l'épaisseur pour capturer un gradient linéaire de déformation.

[7] Toupin, R. A. (1965). "Saint-Venant's Principle." *Archive for
Rational Mechanics and Analysis*, 18, 83–96.
<https://doi.org/10.1007/BF00282253>. — Énoncé moderne du principe de
Saint-Venant invoqué pour ignorer les pics de contrainte au voisinage
de l'encastrement et du chargement.

[8] Pilkey, W. D., & Pilkey, D. F. (2008). *Peterson's Stress
Concentration Factors* (3e éd.). Wiley. ISBN 978-0470048245. —
Tabulation des facteurs `Kt` pour congés et changements de section.

[4] McKay, M. D., Beckman, R. J., & Conover, W. J. (1979). "A Comparison
of Three Methods for Selecting Values of Input Variables in the Analysis
of Output from a Computer Code." *Technometrics*, 21(2), 239–245.
<https://doi.org/10.2307/1268522>. — Article fondateur du Latin Hypercube
Sampling.

[10] Helton, J. C., & Davis, F. J. (2003). "Latin hypercube sampling and
the propagation of uncertainty in analyses of complex systems."
*Reliability Engineering & System Safety*, 81(1), 23–69.
<https://doi.org/10.1016/S0951-8320(03)00058-9>.

[11] Deb, K. (2001). *Multi-Objective Optimization using Evolutionary
Algorithms*. Wiley. ISBN 978-0471873396. — Cadre formel du front de
Pareto et de la domination dans l'optimisation multi-objectif.

[12] Buckingham, E. (1914). "On Physically Similar Systems; Illustrations
of the Use of Dimensional Equations." *Physical Review*, 4(4), 345–376.
<https://doi.org/10.1103/PhysRev.4.345>. — Théorème π, justification des
lois en produit de puissances ajustées par régression log-log.

[13] Wooldridge, J. M. (2019). *Introductory Econometrics: A Modern
Approach* (7e éd.). Cengage. ISBN 978-1337558860. — Chapitre 3 : biais
de variable omise et différence entre coefficient simple et coefficient
partiel en régression multiple.

[14] Timoshenko, S. P., & Gere, J. M. (1972). *Mechanics of Materials*.
Van Nostrand Reinhold. — Formule classique de la flexion d'une poutre
encastrée-libre, base de l'expression `σ = 6FL/(Wt²)` utilisée comme
référence analytique.

---

→ [Retour aux résultats R&D](/resultats-rd/)

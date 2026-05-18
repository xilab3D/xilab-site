---
title: "Étude éléments finis paramétrique d'une cornière (L-bracket) sous CalculiX, avec balayage de 50 designs et identification d'un front de Pareto masse / contrainte"
description: "Étude paramétrique FEM d'un L-bracket en acier S235 — Latin Hypercube Sampling, 50 designs, front de Pareto masse / contrainte de Von Mises — XiLAB3D+"
date: 2025-01-01
math: true
ShowToc: true
TocOpen: false
---

**XiLAB3dplus — Nicolas Gardan**

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
éviter la singularité de coin vif.

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
- Re = 235 MPa (limite d'élasticité — tracée en pointillé sur les graphes)

Unités de travail : **mm, N, MPa, t** (tonnes).

---

## 3. Conditions aux limites

- **Encastrement** sur la face arrière de l'aile verticale (`x = 0`) — toutes
  les composantes du déplacement bloquées.
- **Effort** total `F = 1000 N` dirigé selon `−y` (vers le bas), réparti en
  forces nodales équivalentes (`F/N` par nœud) sur la face d'extrémité de
  l'aile horizontale (`x = L`).

Le total de l'effort est constant entre designs ; seules les dimensions
varient. La comparaison de contraintes entre designs est donc équitable.

---

## 4. Maillage

**gmsh 4.15** — tétraèdres quadratiques **C3D10** (4 sommets + 6 nœuds
de mi-arête, fonction de forme parabolique → capture le gradient linéaire
de déformation par élément). Génération mono-thread pour reproductibilité
(`General.NumThreads = 1`, `Mesh.RandomSeed = 1`, `Mesh.Algorithm3D = 10` HXT).

**Stratégie de tailles** :

- **Au congé** : taille `h = r/6` (≈ 6 éléments le long du quart de
  cercle) — pilotée par un champ `Distance + Threshold` sur la surface
  cylindrique du congé.
- **En volume (loin du congé)** : taille `h = t/3` — garantit la **règle
  des 3 éléments dans l'épaisseur** (standard FEM pour capturer le
  gradient de déformation en flexion).

| Cas | n_nœuds | n_éléments | h_médiane / t |
|---|---:|---:|---:|
| L=50, W=20, t=3   | 90 k  | 56 k  | 2.8 |
| L=100, W=40, t=6  | 89 k  | 56 k  | 2.9 |
| L=150, W=60, t=10 | 76 k  | 48 k  | 3.1 |

Permutation Tet10 : les nœuds 9 et 10 (positions 1-indexées) sont
permutés entre la convention gmsh (MSH) et la convention Abaqus / CalculiX
C3D10. Cette permutation est appliquée à l'écriture du `.inp`, vérifiée
par comparaison avec le writer Abaqus natif de gmsh.

---

## 5. Solveur

**CalculiX 2.23** en analyse linéaire statique. Solveur direct SPOOLES,
**mono-thread** (`OMP_NUM_THREADS = 1`) car la version multi-thread de
SPOOLES est non déterministe — observé en pratique : sur le *même* `.inp`,
σ_vM_max sautait de 472 à 1450 MPa selon l'ordonnancement des threads.
Avec `OMP_NUM_THREADS = 1` les résultats sont bit-à-bit reproductibles.

Sorties par cas :
- `model.frd` — résultats binaires CalculiX (relisibles par CGX)
- `model.vtu` — converti via `ccx2paraview` (ouvrable dans ParaView)

---

## 6. Champ de contraintes

Sur un design Pareto-optimal "lourd & sûr" (case 008 : L=58, W=57, t=8.2,
masse 0.40 kg, σ_max = 86 MPa) :

![Champ von Mises — cas 008](/images/lbracket-pareto/stress_case_008.png)

La concentration de contrainte se localise nettement le long du congé
intérieur ; ailleurs le matériau est très peu sollicité.

Sur un design **léger et thin** (case 047 : L=102, W=33, t=3.2, masse
0.16 kg, σ_max = 2265 MPa, **u_tip = 17 mm**) :

![Champ von Mises — cas 047](/images/lbracket-pareto/stress_case_047.png)

La pièce flèche fortement (déformation tracée à l'échelle réelle ×1),
et la contrainte au congé dépasse largement la limite élastique de
l'acier. Ce design serait inutilisable en pratique — il sert ici à
borner le domaine d'étude.

**Mesure de σ_vM_max** : filtrée spatialement sur la zone du congé
(`x ∈ [t, t+r]` × `y ∈ [t, t+r]`) pour ignorer la singularité d'encastrement
et les pics au point d'application de la charge (Saint-Venant). La quantité
extraite est donc la contrainte structurellement dimensionnante, pas un
artefact de modélisation.

---

## 7. Plan d'expérience

**Latin Hypercube Sampling** sur les 3 paramètres, 50 échantillons,
graine fixée (`seed = 0` pour reproductibilité).

- 49 / 50 cas convergés en 37 min (1 cas — le plus thin+large — sature
  les 16 Go de RAM sur SPOOLES et est marqué `FAIL`).
- Plage σ_vM_max observée : 66 – 3600 MPa
- Plage masse : 0.10 – 0.97 kg

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

**Lecture** :
- Le front est convexe, décroissant : tout gain en masse coûte en
  contrainte et inversement.
- Pour rester sous la limite d'élasticité S235 (235 MPa), il faut une
  masse d'au moins ~0.24 kg (case 015).
- Tous les designs du front ont L ≤ 70 mm — les ailes longues sont
  systématiquement dominées dans cette gamme de charge.
- Les designs lourds hors-front (>0.6 kg) sont **dominés** : pénalité
  de masse sans bénéfice en contrainte → à éviter.

---

## 9. Sensibilité & loi multivariée

![Sensibilité aux paramètres](/images/lbracket-pareto/sensitivity.png)

### Lecture rapide

Sur chaque panneau, on a tracé la régression log-log univariée
`log σ ~ log(paramètre)` avec sa pente et son coefficient de
corrélation `R`. Plus la droite est raide (|pente|) **et** plus
les points y collent (|R| → 1), plus le paramètre est dominant.

| Paramètre | Pente univariée | R | Lecture |
|-----------|----------------:|---:|---------|
| L (long.) | +1.35 | +0.50 | tendance modérée, nuage diffus |
| W (larg.) | −0.71 | −0.26 | tendance faible |
| **t** (ép.) | **−2.09** | **−0.82** | **tendance forte, points alignés** |

### Loi multivariée

Ajustement simultané sur `log L`, `log W`, `log t` :

$$
\boxed{\;\sigma_{vM,\max} \;\propto\; L^{+1.16} \cdot W^{-1.00} \cdot t^{-2.15}\;}
\qquad R^{2} = 1.000
$$

**100 %** de la variance log de σ est expliquée par cette forme produit
de puissances — autrement dit, dans la gamme balayée, le L-bracket suit
*exactement* une loi de poutre fléchie + concentration au congé.

### Pourquoi −2.09 (univarié) ≠ −2.15 (multivarié) ?

Ce n'est pas un bug, c'est une propriété statistique. Les deux exposants
n'estiment **pas la même chose** :

- **Multivariée** : effet de `t` *à L et W fixés mathématiquement*
  (coefficient partiel). C'est l'exposant **physique**.
- **Univariée** : effet de `t` *mélangé* avec la variation aléatoire de
  L et W dans l'échantillon (coefficient marginal). Il subit un **biais
  de variable omise**.

Vérification chiffrée. Dans l'échantillon LHS (50 points), les
corrélations résiduelles entre paramètres ne sont pas exactement nulles :

```
corr(log t, log W) = -0.148
corr(log t, log L) = -0.069
```

D'où le biais :

$$
a_{\text{uni}}(t) \;=\; a_{\text{mul}}(t) \;+\; a_{\text{mul}}(L)\,\rho_{tL} \;+\; a_{\text{mul}}(W)\,\rho_{tW}
$$

$$
-2.09 \;\approx\; -2.15 \;+\; (+1.16)(-0.07) \;+\; (-1.00)(-0.15)
\;=\; -2.15 + 0.07 \;=\; -2.08 \;\checkmark
$$

Concrètement, dans l'échantillon, *quand `t` est grand, `W` est en moyenne
un peu plus petit* ; comme `W` a un effet négatif sur σ, ça atténue
l'effet apparent de `t` quand on le regarde seul. **C'est la valeur
multivariée `−2.15` qui décrit la physique**.

### Comparaison à la théorie de la poutre

Pour une poutre en flexion, la contrainte au congé en première
approximation suit :

$$
\sigma_{vM,\max} \;\approx\; K_t \cdot \frac{6\,F\,L}{W\,t^{2}}
\qquad \Rightarrow \qquad \sigma \;\propto\; L^{+1}\,W^{-1}\,t^{-2}
$$

avec `Kt` le facteur de concentration de contrainte au congé. Les
exposants ajustés sur les calculs FEM (`+1.16`, `−1.00`, `−2.15`)
collent **à mieux que 15 %** des exposants théoriques `(+1, −1, −2)`.
Les écarts viennent essentiellement de la variation de `Kt` avec la
géométrie (le congé `r = t` n'est pas géométriquement similaire d'un
design à l'autre, donc `Kt` n'est pas constant).

---

## 10. Recommandations design

Pour réduire la contrainte au congé d'un L-bracket dans cette
configuration de chargement :

| Levier | Effet sur σ | Coût masse | Verdict |
|--------|-------------|------------|---------|
| **Épaissir t** | `÷ 2.15` par doublement de t | linéaire | **levier #1** |
| Élargir W | `÷ 1` par doublement de W | linéaire | levier #2 |
| Raccourcir L | `÷ 1.16` par réduction de moitié | gain de masse | levier #3 |

**Exemple concret** : doubler `t` de 5 à 10 mm divise σ par ≈ 4.4 pour un
seul doublement de la masse → c'est de loin le meilleur compromis
masse / contrainte. Inversement, doubler `L` (et donc le bras de levier)
multiplie σ par ~2.2 — d'où l'absence du front Pareto pour les grandes
longueurs.

---

## Annexe — reproductibilité

Versions logicielles utilisées : CalculiX 2.23 (Homebrew), gmsh 4.15.1,
ccx2paraview, meshio 5.3.5, numpy 2.1, scipy 1.17, pandas 2.3,
matplotlib 3.10, pyvista 0.47.

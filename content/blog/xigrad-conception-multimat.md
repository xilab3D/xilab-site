---
title: "XiGrad : conception multi-matériau guidée par la mécanique"
date: 2026-03-20
description: "Comment piloter point par point la composition d'une pièce imprimée à partir du champ de contraintes ou de l'optimisation topologique — méthodologie, implémentation et résultats sur la poutre MBB."
tags: ["R&D", "simulation", "optimisation topologique", "impression 3D", "multi-matériau", "SIMP", "éléments finis"]
categories: ["rd"]
draft: true
math: true
cover:
  image: "/images/xigrad/topo_final_3d.png"
  alt: "Topologie optimale SIMP 3D — poutre MBB"
  relative: false
---

## Introduction

L'impression 3D multi-matériau voxel par voxel — technologies PolyJet (Stratasys J750/J850) ou Multi Jet Fusion (HP) — ouvre une possibilité rarement exploitée en conception : **spécifier la composition en chaque point de l'espace**, et non plus seulement la forme extérieure. Plutôt que de choisir entre un matériau rigide et un matériau souple, on peut définir un gradient continu : 100 % rigide là où les contraintes sont maximales, 100 % souple là où la pièce n'est sollicitée qu'en surface, avec toutes les nuances intermédiaires.

Ce principe — les **matériaux à gradient fonctionnel** (FGM, *Functionally Graded Materials*) — est connu depuis les années 1990 dans les applications aérospatiales (gradients thermiques barrières) [Koizumi, 1997]. Ce qui change aujourd'hui, c'est que les imprimantes à jetting de matière le rendent accessible à l'échelle de la pièce mécanique courante.

**XiGrad** est un pipeline open source qui automatise ce chemin : à partir d'une géométrie et d'un cas de charge, il calcule le champ mécanique, en déduit une distribution de matière, et produit un fichier d'impression 3MF prêt pour la machine. Deux approches ont été implémentées et comparées sur le même cas de référence : la **poutre MBB** (*Messerschmitt-Bölkow-Blohm*).

---

## Cas de référence : la poutre MBB

La poutre MBB est le cas test canonique de l'optimisation topologique [Bendsøe & Sigmund, 2003]. Elle présente l'avantage de générer un champ de contraintes riche et asymétrique — compressions en fibre supérieure, tractions en fibre inférieure, cisaillement diagonal au centre — ce qui en fait un excellent révélateur des différences entre méthodes.

**Géométrie et conditions aux limites :**
- Barre 100 × 20 × 20 mm, acier (E = 210 000 MPa, ν = 0,3)
- Appui **pin** en bas-gauche (x = 0, y = 0) : blocage XYZ
- Appui **roller** en bas-droit (x = L, y = 0) : blocage YZ uniquement
- Charge concentrée **F = 4000 N** en −Y au centre supérieur (x = L/2, y = h)

{{< figure src="/images/xigrad/mbb_setup.png" alt="Schéma de mise en données — poutre MBB" caption="**Fig. 1** — Mise en données : appuis pin/roller, charge −Y au centre supérieur. Généré automatiquement par XiGrad au lancement de l'étape FEA." >}}

Ce cas crée les **arches diagonales** caractéristiques des treillis de Michell [Michell, 1904], où les bielles de compression partent du point de charge vers les appuis. C'est exactement la structure que l'optimisation topologique retrouve par calcul.

---

## Méthodologie

### Approche 1 — Gradient de contraintes (lignes de force)

#### Pipeline : Gmsh → CalculiX → contraintes → OpenVCAD

La première approche reconstruit le trajet des efforts à partir d'une analyse éléments finis classique, puis encode ce trajet comme gradient de composition.

**Étape 1 — Maillage (Gmsh)**

La géométrie est maillée en tétraèdres linéaires C3D4 avec Gmsh [Geuzaine & Remacle, 2009], taille de maille 3 mm, soit environ 12 000 éléments. Ce type d'élément est volontairement simple : la régularité du maillage n'est pas critique ici car le champ de contraintes sera lissé par interpolation à l'étape suivante.

**Étape 2 — Analyse éléments finis (CalculiX)**

Le fichier `.inp` est généré programmatiquement avec les conditions aux limites MBB, puis soumis à CalculiX [Dhondt & Wittig, 1998], solveur EF open source. CalculiX résout le système linéaire K·u = F et exporte les contraintes nodales au format `.frd`.

**Étape 3 — Extraction des contraintes principales**

Le tenseur de Cauchy σ est extrait de chaque nœud. Les contraintes principales σ₁ (traction maximale) et σ₃ (compression maximale) sont calculées par diagonalisation du tenseur 3×3. La fraction de matériau rigide est définie par :

$$f(\mathbf{x}) = \left(\frac{\max(|\sigma_1|, |\sigma_3|)}{\sigma_{\max}}\right)^2$$

Le choix de `max(|σ₁|, |σ₃|)` est essentiel : il capture à égalité les zones en compression (fibre supérieure) et en traction (fibre inférieure), produisant un gradient symétrique fidèle aux lignes de force réelles. L'exposant carré accentue le contraste entre le cœur chargé et les zones périphériques peu sollicitées.

Ce champ est exporté en `.vtk` pour visualisation dans ParaView, et en `.npz` pour la suite du pipeline.

**Étape 4 — Gradient multi-matériau (OpenVCAD / pyvcad)**

[OpenVCAD](https://matterassembly.org/openvcad) [Matter Assembly Computation Lab, CU Boulder] est un moteur de construction volumique fonctionnelle. Son opérateur `FGrade` prend en entrée une liste de fonctions de fraction (une par matériau) et une géométrie, et produit un objet dont la composition est définie analytiquement en tout point.

La fraction f(x) calculée à l'étape 3 est encapsulée dans un interpolateur scipy (`LinearNDInterpolator` + `NearestNDInterpolator` pour les extrapolations aux bords) qui est passé directement à `FGrade` :

```python
root = pyvcad.FGrade(
    [f_rigid, f_soft],   # fonctions de fraction par matériau
    [mat_rigid, mat_soft],
    prob_mode=True,
    geometry=bar
)
```

La grille de composition résultante (50 × 10 × 10 points) est échantillonnée et sauvegardée. C'est cette grille qui alimente l'export 3MF.

---

### Approche 2 — Optimisation topologique SIMP 3D

#### Formulation du problème

L'optimisation topologique cherche la distribution de matière ρ(x) ∈ [0, 1] qui minimise la compliance (déformation élastique totale) sous contrainte de volume :

$$\min_{\rho} \quad C(\rho) = \mathbf{u}^T \mathbf{K}(\rho)\, \mathbf{u}$$
$$\text{s.t.} \quad \frac{1}{|\Omega|}\int_\Omega \rho\, d\Omega \leq V^*, \quad 0 < \rho_{\min} \leq \rho \leq 1$$

La méthode **SIMP** (*Solid Isotropic Material with Penalization*) [Bendsøe, 1989 ; Bendsøe & Sigmund, 2003] pénalise les densités intermédiaires via :

$$E(\rho) = E_{\min} + \rho^p (E_0 - E_{\min})$$

avec p = 3 (valeur standard). L'exposant p > 1 rend coûteuses les densités grises : l'algorithme converge vers des solutions proches de 0/1, c'est-à-dire des topologies nettes.

#### Implémentation en Python (assemblage sparse)

L'élément de référence est un hexaèdre C3D8 (8 nœuds, 24 DDL), intégré numériquement par quadrature de Gauss 2 × 2 × 2. La matrice de rigidité élémentaire ke₀ (24 × 24) est calculée une fois analytiquement pour un voxel unitaire (hx, hy, hz).

L'assemblage global utilise scipy en format COO, ce qui permet de vectoriser complètement la construction :

```python
rows = np.repeat(edof, 24, axis=1).ravel()
cols = np.tile(edof, (1, 24)).ravel()
vals = (E_e[:, np.newaxis] * ke0.ravel()).ravel()
K = coo_matrix((vals, (rows, cols))).tocsc()
```

Le système K·u = F est résolu par `spsolve` (factorisation LU sparse). Sur un maillage 60 × 20 × 6 = 7 200 éléments, chaque itération prend quelques secondes sur CPU standard.

#### Filtrage et mise à jour par critères d'optimalité

Pour éviter l'instabilité en damier (*checkerboard*) et la dépendance au maillage, les sensibilités $s_e = \partial C/\partial\rho_e$ sont remplacées par une moyenne pondérée dans un voisinage de rayon $r_{\min}$ [Sigmund & Petersson, 1998] :

$$\hat{s}_e = \frac{\displaystyle\sum_{f \in \mathcal{N}_e} H_{ef}\,\rho_f\,s_f}{\rho_e\,\displaystyle\sum_{f \in \mathcal{N}_e} H_{ef}}, \qquad H_{ef} = \max\!\left(0,\; r_{\min} - d_{ef}\right)$$

où $d_{ef}$ est la distance entre les centres des éléments $e$ et $f$.

La mise à jour des densités utilise les **critères d'optimalité** (OC) [Bendsøe & Kikuchi, 1988] avec un schéma de bissection sur le multiplicateur de Lagrange $\lambda$ de la contrainte de volume. La nouvelle densité est obtenue par une opération de clamping à déplacement limité $m = 0{,}2$ :

$$\rho_e^{(k+1)} = \min\!\left(1,\; \max\!\left(\rho_{\min},\; \min\!\left(\rho_e^{(k)} + m,\; \max\!\left(\rho_e^{(k)} - m,\; \rho_e^{(k)}\sqrt{B_e}\,\right)\right)\right)\right)$$

où $B_e = -\hat{s}_e\,/\,(\lambda\,v_e)$ est le ratio sensibilité / coût volumique, et $\lambda$ est ajusté par bissection pour satisfaire la contrainte $\sum \rho_e v_e = V^*$.

#### Connexion ρ → gradient OpenVCAD

Une fois la densité SIMP convergée, elle est directement utilisée comme fraction de matériau rigide dans OpenVCAD : ρ = 1 signifie 100 % rigide (matière solide), ρ = 0 signifie 100 % souple (vide ou matériau flexible). L'interpolateur est construit depuis les centres des éléments SIMP et transmis identiquement à `FGrade`. Il n'y a pas de post-traitement : la physique du problème d'optimisation garantit que les zones à haute densité coïncident précisément avec les zones les plus sollicitées mécaniquement.

#### Export 3MF multi-matériau

La grille de composition finale est voxelisée et exportée au format **3MF** (*3D Manufacturing Format*) [3MF Consortium, 2015], avec attribution par triangle de l'un des 11 paliers de mélange (0 % R → 100 % R, par pas de 10 %). Trois résolutions sont disponibles selon la technologie d'impression cible :

| Mode | Résolution | Usage |
|------|-----------|-------|
| `native` | ~2 mm | Visualisation / validation |
| `fff` | 1 mm, binarisé | FFF 2 matériaux (PrusaSlicer, Bambu) |
| `polyjet` | 0,5 mm | Gradient continu PolyJet (Stratasys J750) |

---

## Résultats

### Approche 1 — Gradient de contraintes MBB

#### Mise en données et champ de contraintes

Le schéma de mise en données (Fig. 1) confirme les conditions imposées : pin en bas-gauche, roller en bas-droit, flèche −Y au centre supérieur. L'analyse CalculiX produit le champ de contraintes principales sur les ~12 000 nœuds du maillage tétraédrique.

#### Distribution de composition — coupes 2D

{{< figure src="/images/xigrad/ldf_slice.png" alt="Vue synthétique du gradient multi-matériau — coupes XY et XZ" caption="**Fig. 2** — Vue synthétique : coupe XY (gauche) et coupe XZ (droite) au plan médian. Les tirets indiquent les iso-compositions ; un label « 40 % R / 60 % S » signifie que l'imprimante dépose en ce point 40 % de matériau rigide et 60 % de souple." >}}

La coupe XY (plan z médian) révèle la signature mécanique de la poutre MBB :

- **Fibre supérieure** (y ≈ 20 mm) : concentration de matériau rigide au droit du point de charge (x ≈ 50 mm), avec une poche rouge centrée — zone de compression maximale.
- **Fibre inférieure** (y ≈ 0 mm) : deux zones rigides aux deux appuis — zones de traction.
- **Zone centrale** (y ≈ 10 mm) : matériau souple dominant — axe neutre, contraintes quasi nulles.

Les iso-contours en tirets quantifient précisément les transitions : la ligne « 20 % R / 80 % S » délimite la zone où la proportion de matériau rigide devient significative.

{{< figure src="/images/xigrad/ldf_slices_XY.png" alt="Coupes XY à 6 niveaux z" caption="**Fig. 3** — Coupes XY pour z = 0 mm à z = 20 mm. La distribution est quasi invariante selon Z pour une poutre prismatique, ce qui valide la cohérence du pipeline 3D." >}}

{{< figure src="/images/xigrad/ldf_slices_XZ.png" alt="Coupes XZ à 5 niveaux y" caption="**Fig. 4** — Coupes XZ à différentes hauteurs y. Les fibres extrêmes (y = 0 et y = 20 mm) concentrent le matériau rigide au droit de l'appui central, tandis que l'axe neutre (y ≈ 10 mm) reste entièrement souple — résultat attendu pour une poutre fléchie." >}}

#### Vue 3D PyVista

{{< figure src="/images/xigrad/ldf_3d.png" alt="Vue 3D PyVista du gradient multi-matériau" caption="**Fig. 5** — Vue 3D PyVista. Gauche : isosurfaces du gradient (f = 0,2 / 0,5 / 0,8) avec coupe médiane semi-transparente. Centre : coupe XY frontale — la bande rouge supérieure (compression) et inférieure (traction) est clairement visible. Droite : section YZ près de l'appui, montrant la concentration de rigidité aux fibres extrêmes." >}}

La vue 3D confirme que le gradient est bien tridimensionnel et cohérent : les isosurfaces f = 0,8 (rouge) délimitent précisément les zones de compression et de traction, tandis que la coque souple (bleue) englobe l'axe neutre.

---

### Approche 2 — Optimisation topologique SIMP 3D

#### Convergence de l'algorithme

Le maillage SIMP compte 60 × 20 × 6 = 7 200 éléments hexaédriques C3D8, avec une fraction volumique cible de 30 % (V* = 0,30).

{{< figure src="/images/xigrad/topo_iter_01.png" alt="SIMP — Itération 1" caption="**Fig. 6** — Itération 1 : densité initiale uniforme ρ = 0,30 sur tout le domaine. Compliance = 5 496 N·mm." >}}

{{< figure src="/images/xigrad/topo_iter_10.png" alt="SIMP — Itération 10" caption="**Fig. 7** — Itération 10 : les arches diagonales commencent à se former. Compliance = 590 N·mm — chute de ×9 en 10 itérations." >}}

{{< figure src="/images/xigrad/topo_iter_25.png" alt="SIMP — Itération 25" caption="**Fig. 8** — Itération 25 : la topologie en treillis est bien établie. Les bielles de compression (diagonales descendant vers les appuis) et les membrures (horizontales) sont clairement identifiables. Compliance = 456 N·mm." >}}

{{< figure src="/images/xigrad/topo_iter_35.png" alt="SIMP — Itération 35 (convergence)" caption="**Fig. 9** — Itération 35 : convergence. Compliance finale = 455 N·mm — variation < 0,2 % entre les 5 dernières itérations. La topologie est stable." >}}

La compliance chute de 5 496 à 455 N·mm, soit une **réduction de 92 %** par rapport à la structure uniforme, à volume de matière identique (30 %). La convergence est rapide — moins de 15 itérations pour l'essentiel du gain — ce qui est caractéristique des problèmes de flexion avec contraintes bien posées [Andreassen et al., 2011].

#### Résultat final — vue 3D et gradient multi-matériau

{{< figure src="/images/xigrad/topo_final_3d.png" alt="Topologie optimale SIMP — vue 3D finale" caption="**Fig. 10** — Vue 3D finale. Gauche : vue isométrique de l'isosurface ρ ≥ 0,5 — la structure en arche-treillis typique de la poutre MBB est retrouvée. Centre : coupe XY, confirmant l'architecture en membrures et diagonales. Droite : courbe de convergence (échelle log) montrant la décroissance rapide de la compliance." >}}

La structure optimale retrouve l'architecture en **arche de Michell** : deux membrures horizontales (compression en haut, traction en bas) reliées par des diagonales inclinées qui transmettent le cisaillement vers les appuis. Ce résultat est cohérent avec la solution analytique connue pour ce cas [Michell, 1904 ; Rozvany, 2009].

{{< figure src="/images/xigrad/topo_multimat_slice.png" alt="Gradient multi-matériau issu de l'optimisation topologique" caption="**Fig. 11** — Gradient multi-matériau dérivé de la densité SIMP. La densité ρ ∈ [0,1] est directement mappée sur la fraction de matériau rigide. Les zones denses (ρ ≈ 1, rouge) correspondent aux bielles structurelles ; les vides (ρ ≈ 0, bleu) aux zones non portantes. Les iso-contours montrent la transition progressive entre les deux matériaux." >}}

{{< figure src="/images/xigrad/topo_slices_XY.png" alt="Coupes XY du gradient multi-matériau topo — 6 niveaux z" caption="**Fig. 12** — Coupes XY pour z = 0 mm à z = 20 mm. L'architecture en treillis est parfaitement identique à chaque niveau z, confirmant la nature prismatique de la structure optimisée. Les bielles (rouge) et les vides (bleu) forment un motif répété, avec des interfaces nettes très différentes du gradient diffus obtenu par l'approche contraintes." >}}

{{< figure src="/images/xigrad/topo_slices_XZ.png" alt="Coupes XZ du gradient multi-matériau topo — 5 niveaux y" caption="**Fig. 13** — Coupes XZ à différentes hauteurs y. Les membrures horizontales (fibre haute et fibre basse, 100 % rigide) sont visibles aux niveaux y = 0 mm et y = 20 mm. À mi-hauteur (y ≈ 10 mm), seuls les montants verticaux subsistent, conformément à la topologie en treillis Warren/Pratt retrouvée par SIMP." >}}

La connexion SIMP → OpenVCAD produit un gradient particulièrement intéressant : contrairement à l'approche par contraintes (qui donne un champ relativement diffus), la densité SIMP génère des **frontières nettes** entre zones rigides et zones souples, correspondant exactement aux interfaces entre bielles et vides topologiques.

---

## Discussion : comparaison des deux approches

| Critère | Lignes de force | Optimisation topologique |
|---------|----------------|-------------------------|
| **Fondement** | Champ de contraintes σ(x) | Minimisation de la compliance |
| **Résultat** | Gradient continu diffus | Topologie 0/1 + gradient aux interfaces |
| **Interprétabilité** | Immédiate (suit les efforts) | Optimale au sens mathématique |
| **Temps de calcul** | ~30 s (1 solve CalculiX) | ~5 min (35 itérations sparse) |
| **Imprimabilité** | Gradient lisse, facile à voxeliser | Frontières nettes, bon pour FFF |
| **Usage recommandé** | Pièces en service continu, fatigue | Allègement structurel, rigidité maximale |

Les deux approches sont complémentaires. L'approche par lignes de force produit une distribution de matière **physiquement interprétable** et parfaitement adaptée aux technologies à gradient continu (PolyJet, MJF). L'optimisation topologique produit une architecture **globalement optimale** dont la densité peut être réinterprétée comme gradient : les zones à ρ intermédiaire aux interfaces constituent des zones de transition mécanique.

Un usage combiné est envisageable : utiliser SIMP pour définir la **topologie macroscopique** (quelles régions sont structurelles), puis l'approche par contraintes pour définir le **gradient local** à l'intérieur des zones retenues.

---

## Perspectives

- **Validation expérimentale** : impression d'échantillons MBB en VeroBlack / Agilus30 sur Stratasys J750, mesure de compliance par essai 3 points.
- **Extension aux charges multiples** : la fraction rigide peut être définie comme l'enveloppe de plusieurs cas de charge (max sur les cas).
- **Couplage thermomécanique** : gradient adapté aux contraintes thermiques pour pièces en environnement à gradient de température.
- **Résolution sub-millimétrique** : à 42 µm (résolution PolyJet), la grille SIMP devra être affinée ou l'export 3MF interpolé à la résolution de la tête d'impression.

---

## Références

- **Bendsøe, M. P.** (1989). Optimal shape design as a material distribution problem. *Structural Optimization*, 1(4), 193–202.

- **Bendsøe, M. P. & Kikuchi, N.** (1988). Generating optimal topologies in structural design using a homogenization method. *Computer Methods in Applied Mechanics and Engineering*, 71(2), 197–224.

- **Bendsøe, M. P. & Sigmund, O.** (2003). *Topology Optimization: Theory, Methods and Applications*. Springer, Berlin.

- **Sigmund, O.** (2001). A 99 line topology optimization code written in Matlab. *Structural and Multidisciplinary Optimization*, 21(2), 120–127.

- **Sigmund, O. & Petersson, J.** (1998). Numerical instabilities in topology optimization: a survey on procedures dealing with checkerboards, mesh-dependencies and local minima. *Structural Optimization*, 16(1), 68–75.

- **Andreassen, E., Clausen, A., Schevenels, M., Lazarov, B. S. & Sigmund, O.** (2011). Efficient topology optimization in MATLAB using 88 lines of code. *Structural and Multidisciplinary Optimization*, 43(1), 1–16.

- **Michell, A. G. M.** (1904). The limits of economy of material in frame-structures. *Philosophical Magazine*, 8(47), 589–597.

- **Rozvany, G. I. N.** (2009). A critical review of established methods of structural topology optimization. *Structural and Multidisciplinary Optimization*, 37(3), 217–237.

- **Koizumi, M.** (1997). FGM activities in Japan. *Composites Part B: Engineering*, 28(1–2), 1–4.

- **Geuzaine, C. & Remacle, J.-F.** (2009). Gmsh: A 3-D finite element mesh generator with built-in pre- and post-processing facilities. *International Journal for Numerical Methods in Engineering*, 79(11), 1309–1331.

- **Dhondt, G. & Wittig, K.** (1998). CalculiX: A Free Software Three-Dimensional Structural Finite Element Program. Disponible sur [calculix.de](http://www.calculix.de).

- **Matter Assembly Computation Lab** (2024). OpenVCAD — Volumetric Computer-Aided Design. University of Colorado Boulder. [matterassembly.org/openvcad](https://matterassembly.org/openvcad)

- **Doubrovski, E. L., Tsai, E. Y., Dikovsky, D., Geraedts, J. M. P., Herr, H. & Oxman, N.** (2015). Voxel-based fabrication through material property mapping: A design method for bitmap printing. *CAD Computer Aided Design*, 60, 3–13.

- **3MF Consortium** (2015). *3D Manufacturing Format — Core Specification 1.2*. [3mf.io](https://3mf.io).

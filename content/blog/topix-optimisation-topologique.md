---
title: "TopiX : optimisation topologique open-source couplée à CalculiX"
date: 2025-05-18
description: "Comment nous avons développé TopiX, un outil Python d'optimisation topologique par éléments finis, et ce que donne la méthode SIMP sur le cas classique de la poutre cantilever."
tags: ["R&D", "éléments finis", "optimisation topologique", "CalculiX", "Python"]
categories: ["rd"]
draft: false
---

L'optimisation topologique répond à une question simple : *quelle est la forme la plus efficace pour reprendre un effort donné avec le moins de matière possible ?* La réponse — jamais intuitive — produit des structures en treillis, des arches, des nervures, qui rappellent les os ou les branches d'un arbre. Ce sont les formes que la nature a optimisées depuis des millions d'années ; nous cherchons à les retrouver par le calcul.

Chez XiLAB3D+, nous avons développé **TopiX**, un outil Python d'optimisation topologique entièrement basé sur des logiciels libres. Cet article en présente la méthode et le fonctionnement, illustrés par le cas classique de la poutre encastrée-libre (cantilever).

---

## La méthode SIMP en quelques mots

La méthode **SIMP** (*Solid Isotropic Material with Penalization*, Bendsøe 1989 / Sigmund 2001) est aujourd'hui la référence académique et industrielle pour l'optimisation topologique. Le principe est le suivant.

On part d'un domaine de conception rempli uniformément de matière, et on cherche à minimiser la déformabilité globale de la structure (*compliance*) en ne conservant qu'une fraction cible du volume initial — typiquement 30 à 40 %.

À chaque élément du maillage, on associe une densité ρ ∈ [0, 1], et on pénalise les valeurs intermédiaires par une loi de puissance :

```
E(ρₑ) = Emin + (E₀ - Emin) · ρₑ^p
```

Avec p = 3 (exposant standard), un élément à ρ = 0,5 ne vaut mécaniquement que 12,5 % d'un élément plein. La pénalisation pousse l'optimiseur à trancher : plein ou vide.

À chaque itération, on résout le problème éléments finis, on calcule la sensibilité de la compliance par rapport à chaque densité, on filtre ces sensibilités pour éviter les instabilités numériques (*damier*), puis on met à jour les densités par la méthode du critère d'optimalité (OC). On répète jusqu'à convergence.

---

## TopiX : le pipeline complet, de la géométrie STL à la surface finale

Le choix de conception de TopiX est de rester **entièrement piloté par la géométrie**. L'utilisateur fournit trois fichiers STL :

- `piece.stl` — le domaine de conception (volume complet de la pièce)
- `force_vol.stl` — un volume simple (boîte ou cylindre) représentant la zone de chargement
- `fixed_vol.stl` — un volume simple représentant l'encastrement

Ces volumes d'insert sont voxelisés sur la même grille que la pièce. Les éléments qu'ils contiennent restent toujours solides — l'optimisation ne peut pas les supprimer, ce qui garantit la cohérence physique aux points d'application des efforts.

Le pipeline complet est le suivant :

```
piece.stl ────┐
force_vol.stl ─┤── voxelisation ──▶ maillage C3D8R ──▶ SIMP ──▶ STL lissé
fixed_vol.stl ─┘    (contains)        + CL                        + VTU
```

Le solveur éléments finis utilisé est **CalculiX**, libre (GNU GPL), compatible avec le format Abaqus `.inp` et disponible sur toutes les plateformes via Homebrew ou apt. TopiX l'appelle en sous-processus à chaque itération et parse les résultats `.frd` pour extraire l'énergie de déformation élémentaire, seul ingrédient nécessaire au calcul des sensibilités.

En sortie, TopiX produit :

- Des fichiers VTU à chaque itération, lisibles dans **ParaView** (animation de convergence),
- Une surface lissée par **Marching Cubes** + lissage laplacien, directement utilisable en FAO ou impression 3D,
- Un fichier `.inp` final pour re-simulation dans PrePoMax.

---

## Cas test : la poutre cantilever

Le cas test classique de l'optimisation topologique est la **poutre encastrée-libre** : une poutre fixée à une extrémité, chargée verticalement à l'autre.

**Configuration :**

| Paramètre | Valeur |
|---|---|
| Dimensions | 100 × 30 × 20 mm |
| Maillage | 20 × 6 × 4 = 480 éléments C3D8R |
| Matériau | Acier — E = 210 000 MPa, ν = 0,3 |
| Encastrement | Face X = 0 (35 nœuds) |
| Effort | F = −1 000 N selon Y, centre de la face X = 100 mm |
| Fraction volumique | 40 % |
| Filtre r_min | 7 mm (1,4 × taille de maille) |

**Résultat :** après 60 itérations SIMP, la compliance est passée de ~8 500 à ~145 (réduction d'un facteur 60). Sur les 480 éléments du domaine, 116 restent solides — soit exactement 40 % de la matière initiale. La topologie obtenue est l'arc porteur classique : une membrure inférieure tendue, une membrure supérieure comprimée, et des diagonales reprenant les efforts tranchants. C'est la structure que tout ingénieur dessinerait intuitivement... mais que le calcul retrouve automatiquement.

La surface lissée finale (Marching Cubes + 10 itérations laplaciennes) est directement exportée en STL, prête pour l'impression ou la fabrication.

---

## Originalités de l'implémentation

**Voxelisation par test d'appartenance.** Plutôt que d'utiliser le remplissage par flot extérieur (`voxelized().fill()`), peu robuste sur les géométries complexes, TopiX utilise `trimesh.contains` — un test direct par lancer de rayons sur chaque centre de voxel. Le résultat est exact quelle que soit la forme de la pièce.

**Conditions aux limites par volumes d'insert.** Les zones de chargement et d'encastrement ne sont pas des surfaces projetées sur le maillage, mais des volumes voxelisés toujours solides. Cette approche est plus robuste à la position du maillage et physiquement plus cohérente (les inserts modélisent des bossages, des vis, des plots réels).

**Contraintes de symétrie par moyennage de champs.** Si la pièce est symétrique, l'utilisateur peut activer un ou plusieurs plans de symétrie (X, Y, Z). À chaque itération, les sensibilités et les densités sont moyennées avec leur image miroir — sans modifier le maillage ni les conditions aux limites. Le coût algorithmique est négligeable.

**Amortissement OC.** Un paramètre `oc_damping` (défaut : 1,0, sans amortissement) permet de mélanger la densité mise à jour avec la densité courante : `ρ_new = d·ρ_OC + (1−d)·ρ`. Avec d = 0,5, les oscillations en fin de convergence sont supprimées, au prix d'une convergence légèrement plus lente.

---

## Perspectives

TopiX est développé en open-source dans le cadre du programme de R&D **AINUM-e** de XiLAB3D+. Les prochaines étapes incluent :

- Le support des **contraintes de contrainte** (Von Mises), pour aller au-delà de la minimisation de compliance,
- L'interface avec **Gmsh** pour des maillages tétraédriques non structurés,
- L'export direct vers **PrePoMax** pour une vérification FEA immédiate du résultat optimisé.

L'outil est disponible sur demande. Pour toute question ou collaboration : [ngardan@xilab.tech](mailto:ngardan@xilab.tech)

---

*XiLAB3D+ — R&D · Mai 2025*

---

**Références**

- Bendsøe, M.P. (1989). Optimal shape design as a material distribution problem. *Structural Optimization*, 1, 193–202.
- Sigmund, O. (2001). A 99 line topology optimization code written in Matlab. *Structural and Multidisciplinary Optimization*, 21(2), 120–127.
- Sigmund, O., Petersson, J. (1998). Numerical instabilities in topology optimization. *Structural Optimization*, 16(1), 68–75.

---
title: "Conception générative : état de lieux et expérimentations"
description: "Synthèse du rapport de recherche XiLAB sur la conception générative appliquée à la modélisation 3D — définitions, architecture système, méthodes de résolution, visualisation des solutions."
date: 2026-05-20
ref: RAP_25_001
author: N. Gardan
ressource_type: "rapports"
ShowToc: true
TocOpen: false
---

Synthèse du rapport de recherche **RAP_25_001** — un panorama des concepts et outils de la conception générative appliquée à la modélisation 3D, à destination des PME et des équipes de conception.

*N. Gardan — mai 2026*

---

## 1. De quoi parle-t-on ?

La conception générative regroupe **un ensemble d'outils permettant de créer des concepts et des modèles à partir d'exigences, de contraintes et d'objectifs**. Le concepteur ne dessine plus la solution : il **pose le problème**, et le système propose une ou plusieurs réponses.

Trois idées sont à retenir d'emblée :

- la conception générative **ne se réduit pas** à l'optimisation topologique ni au biomimétisme — ces deux pratiques en sont des cas particuliers ;
- elle **ne dépend pas nécessairement de l'IA** (un solveur d'équations ou un moteur d'inférence font aussi le travail) ;
- elle peut produire **une solution unique ou de nombreuses solutions alternatives**, et c'est cette seconde configuration qui change réellement la manière de travailler.

Le rapport complet précise le vocabulaire (Système, Utilisateur, CDC, modèles implicites vs explicites) et donne plusieurs définitions issues de la littérature et des éditeurs logiciels.

---

## 2. Ce qu'on en attend (et ce qu'il faut savoir)

La promesse est forte : **explorer un grand nombre de conceptions** répondant au cahier des charges, parfois avec des solutions inattendues, plus rapidement et avec moins de biais humain. Par construction, les solutions respectent les exigences spécifiées.

En contrepartie, plusieurs limites doivent être anticipées :

- le système ne couvre **jamais toutes les caractéristiques** — des simulations de validation restent nécessaires ;
- la méthode **redéfinit le rôle du concepteur** : il faut désormais formuler le problème, pas le résoudre soi-même (impact métier et organisationnel) ;
- la **comparaison de nombreuses solutions** est un problème en soi (classement, similarités, écarts) ;
- les biais humains sont réduits mais **des biais systèmes apparaissent** (algorithmes, données d'apprentissage) ;
- les sorties demandent souvent des **post-traitements** (fabricabilité, finition).

Le rapport détaille chacun de ces points et leurs implications pour une PME industrielle.

---

## 3. Architecture d'un système génératif

Le processus type se déroule en plusieurs étapes, **non linéaires** (allers-retours permis) :

l'utilisateur spécifie son problème, le système en construit un modèle, l'utilisateur peut intervenir sur la résolution (choix d'un algorithme par exemple) ou sur des choix du modeleur, le système résout, présente les solutions — éventuellement assorties d'outils d'aide à la décision —, puis l'utilisateur choisit.

Cinq questions structurent toute la démarche :

> **Comment spécifier le problème ? Comment le modéliser ? Comment le résoudre ? Comment modéliser les solutions ? Comment les visualiser pour choisir ?**

Ces cinq questions organisent l'ensemble du rapport.

---

## 4. Spécifier le problème : trois voies

Le cahier des charges peut être transmis au système de trois manières, souvent combinées :

- **Interactivement**, en agissant directement sur le modèle 3D — paramètres géométriques, espaces de conception, zones protégées, esquisses.
- **Par langage**, du langage du modeleur à un langage métier, voire au langage naturel.
- **En mixant les deux**, en modifiant alternativement le modèle géométrique et la description textuelle.

Le rapport illustre cette voie avec un exemple parlant : la création d'une plaque percée de quatre trous, décrite d'abord en pseudo-langage géométrique (`P = parallélépipède(...)`, `C1 = cylindre(...)`, différences booléennes), puis en langage naturel (« créer une plaque de 10 cm de large… avec quatre trous proches des bords »). La demande en langage naturel contient des paramètres « flous » (« proches du bord ») que le système doit interpréter. Le rapport compare les sorties de **ChatGPT** (code OpenSCAD) et de **TextToCAD**.

---

## 5. Résoudre : exécuter ou rechercher

Deux grandes familles de résolution coexistent.

**L'exécution d'un programme** : paramétrage avec valeurs données, résolution d'un système d'équations, inférences sur une base de règles, optimisation topologique, génération par IA.

**La recherche parmi des solutions existantes** (notamment par *Deep Learning*) : on cherche des pièces déjà conçues, similaires fonctionnellement ou géométriquement, pour les réutiliser ou les adapter. La difficulté centrale est alors de **définir la similarité** — c'est-à-dire une mesure de distance entre deux modèles —, ce qui est tout sauf trivial. Deux modèles implicites différents (deux arbres CSG distincts) peuvent par exemple aboutir au même modèle explicite.

Le rapport recense les approches : comparaison visuelle d'images, comparaison de grandeurs physiques (volume, masse, performances), comparaison de paramètres pour des familles de pièces, superposition 3D avec mise en exergue des différences, ou extraction de **signatures géométriques et topologiques**.

---

## 6. Choisir parmi N solutions

Quand le système propose **beaucoup** de solutions, la question devient : comment aider l'utilisateur à choisir ? Trois outils sont mis en avant :

- le **regroupement (clustering)** des solutions par similarité, pour organiser la masse de résultats ;
- l'**exploitation des codes visuels** des outils CAO (couleurs, transparences) pour faire ressortir similarités et différences ;
- des **visualisations spécifiques** permettant de filtrer dynamiquement les solutions selon des plages de paramètres ou de performance.

Cette étape, souvent sous-estimée, **conditionne l'usabilité réelle** d'une démarche générative en contexte industriel.

---

## 7. Optimisation de formes : paramétrique, géométrique, topologique

L'optimisation de formes — cas particulier le plus connu de conception générative — se décline en trois familles, traitées en annexe du rapport :

- **Optimisation paramétrique** : on fait varier un jeu de paramètres connus (dimensions, matériau, charge) et on évalue chaque configuration par simulation. Manuel ou via un plan d'expériences.
- **Optimisation géométrique** : on modifie les frontières de la pièce, sans changer sa topologie (pas d'ajout ni de suppression de trous).
- **Optimisation topologique** : la géométrie **et** la topologie évoluent — création de trous, redistribution de matière. Une solution unique en général, à laquelle il faut ensuite ajouter les contraintes de fabricabilité pour qu'elle soit réellement industrialisable.

Ces trois approches s'appliquent à de nombreux domaines physiques : mécanique, thermique, fluides, etc.

---

## Pour aller plus loin

Cette synthèse ne couvre qu'une partie du rapport. Le document complet **RAP_25_001** approfondit :

- le vocabulaire détaillé et les définitions issues de différentes sources,
- les structures de modélisation du problème (langages, règles, équations, modèles géométriques),
- une **annexe sur le Geometric Deep Learning** appliqué à la fouille de bases de conceptions antérieures,
- les questions ouvertes pour une PME : qui utilise ces outils, avec quelles compétences, quelle confiance accorder aux résultats, et comment articuler tout cela avec un PLM.

→ Demander l'accès au rapport complet auprès de XiLAB.

---

*Rapport rédigé par N. Gardan — Référence : RAP_25_001 — Mise à jour : mai 2026.*

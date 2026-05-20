---
title: "Signature Graphonumérique : relier l'intention humaine au calcul physique"
description: "Synthèse pédagogique de l'article XiLAB sur la Signature Graphonumérique — une approche neuro-symbolique pour assurer la traçabilité des données dans les Jumeaux Numériques (LLM + PINNs)."
date: 2026-05-20
ref: RAP_25_002
author: N. Gardan
ressource_type: "rapports"
ShowToc: true
TocOpen: false
---

# Signature Graphonumérique : relier l'intention humaine au calcul physique

Synthèse de l'article **Signature Graphonumérique : approche neuro-symbolique pour les Jumeaux Numériques** — un cadre méthodologique pour passer du langage naturel à des contraintes physiques rigoureuses, et garantir la traçabilité du couplage essai/simulation.

20 mai 2026

**Table des matières**

- [1. Le problème : un Jumeau Numérique sans mémoire sémantique](#1-le-probleme--un-jumeau-numerique-sans-memoire-semantique)
- [2. Trois concepts pour structurer la continuité numérique](#2-trois-concepts-pour-structurer-la-continuite-numerique)
- [3. L'architecture du couplage : LLM + PINN](#3-larchitecture-du-couplage--llm--pinn)
- [4. Le cadre mathématique en bref](#4-le-cadre-mathematique-en-bref)
- [5. L'incertitude spatiale : le noyau d'intégration](#5-lincertitude-spatiale--le-noyau-dintegration)
- [6. La signature cryptographique : sceller la donnée](#6-la-signature-cryptographique--sceller-la-donnee)
- [7. Cas d'usage : l'échangeur de chaleur](#7-cas-dusage--lechangeur-de-chaleur)
- [8. Implémentation prototype](#8-implementation-prototype)
- [Pour aller plus loin](#pour-aller-plus-loin)

---

## 1. Le problème : un Jumeau Numérique sans mémoire sémantique

Le Jumeau Numérique repose sur la synchronisation entre un système physique réel et sa représentation virtuelle. Mais dans la pratique, **la définition sémantique des capteurs — leur intention, leur positionnement, leur fonction — est souvent déconnectée du modèle de calcul**.

Un thermocouple posé sur un échangeur produit une valeur numérique. Cette valeur est utilisée par la simulation. Mais qui sait *où* le capteur était exactement, *pourquoi* l'ingénieur d'essai l'a placé là, avec quelle *incertitude de position* ? Cette information vit dans un cahier de manip, dans une tête, dans un mail. Pas dans le modèle.

L'article propose une architecture **neuro-symbolique** — hybridation entre l'IA symbolique (sémantique) et l'IA connexionniste (numérique) — appliquée au Jumeau Numérique. L'objectif : coupler la maquette physique avec la maquette numérique **et** assurer une traçabilité complète des données.

---

## 2. Trois concepts pour structurer la continuité numérique

Le modèle s'appuie sur trois objets qui correspondent à trois étapes de transformation de l'information :

**L'Expression Graphonumérique (EGN)** est la représentation de l'intention de l'utilisateur **en langage naturel**. Non structurée, sémantiquement riche, elle porte le contexte métier. Exemple : *« Je veux mesurer la température moyenne près de la sortie du fluide, avec une incertitude de position de 5 mm. »* C'est l'interface homme-machine intuitive.

**Le Paramètre Graphonumérique (PGN)** est la **projection structurée** de l'EGN : un objet informatique (vecteur ou graphe) interprétable par une machine, contenant les instructions géométriques, physiques et dimensionnelles. Concrètement, un objet JSON avec coordonnées, type de noyau d'intégration et unités. Il sert de condition aux limites pour le modèle numérique.

**La Signature Graphonumérique (Σ)** est l'objet **immuable et traçable** qui lie une valeur mesurée à son contexte de définition (le PGN) à un instant *t*. Elle garantit que la donnée n'est pas orpheline : une valeur numérique ne peut exister sans la définition de son capteur. Elle sert à la fois de preuve cryptographique et de point d'ancrage pour l'entraînement du modèle physique.

> **EGN → PGN → Σ** : du langage naturel à l'instruction mathématique, puis au scellé de traçabilité.

---

## 3. L'architecture du couplage : LLM + PINN

Le flux méthodologique se décompose en deux étapes critiques.

**Étape 1 — L'Interpréteur (LLM local).** Le LLM reçoit l'EGN. Son rôle est *déterministe* : il ne doit pas « inventer » d'information mais **extraire** des paramètres structurés à partir du langage naturel. Une phrase comme « capteur pression en tête de cylindre » devient un JSON `{type: "pressure", loc: "cyl_head_v1", coords: [x1,y1,z1]}`.

**Étape 2 — L'Injecteur Physique (PGN vers PINN).** Dans un réseau de neurones informé par la physique (*Physics-Informed Neural Network*), on cherche à minimiser une fonction de perte globale combinant deux termes :

> ℒ<sub>total</sub> = ℒ<sub>physique</sub> + ω · ℒ<sub>data</sub>

où ℒ<sub>physique</sub> impose le respect des équations différentielles (Navier-Stokes, chaleur, etc.) et ℒ<sub>data</sub> mesure l'erreur entre la prédiction du modèle et la valeur réelle issue de la Signature. Les PGN deviennent ainsi la composante « Data » de cette fonction, et la Signature sert de vérité terrain *signée*.

Le processus traverse **quatre couches d'abstraction** :

1. **Couche Sémantique** — l'intention de l'utilisateur en langage naturel (EGN).
2. **Couche Structurelle** — le LLM convertit l'incertitude linguistique en incertitude mathématique (noyaux spatiaux, vérification dimensionnelle).
3. **Couche Computationnelle** — les PGN sont injectés comme contraintes dans le PINN, qui équilibre physique et données.
4. **Couche de Signature** — le couple (PGN + valeur) est scellé dans un graphe de connaissances haché.

---

## 4. Le cadre mathématique en bref

Pour formaliser le modèle, l'article définit plusieurs espaces : ℒ pour le langage naturel, 𝒟 ⊂ ℝ³ × ℝ⁺ pour le domaine spatio-temporel, 𝒱 pour les valeurs physiques.

Un point central : **garantir l'homogénéité dimensionnelle**. L'article utilise un espace ℝ⁷ correspondant aux **7 unités de base du Système International** (mètre, kilogramme, seconde, ampère, kelvin, mole, candela). Chaque PGN porte ainsi un vecteur de dimensions qui empêche, par construction, de mélanger une température avec une vitesse.

Le LLM agit alors comme une **fonction de transformation Φ** :

> Φ : ℒ → 𝒮<sub>truct</sub>

qui mappe une phrase en langage naturel vers un tuple structuré contenant identifiant, type physique, position vectorielle et fréquence d'échantillonnage. L'appartenance de la position au domaine physique (`x ∈ 𝒟`) joue un rôle de garde-fou : si le LLM génère un point en dehors de l'objet, la contrainte mathématique le rejette.

---

## 5. L'incertitude spatiale : le noyau d'intégration

Une mesure physique n'est jamais ponctuelle. Un thermocouple intègre une température sur un petit voisinage, avec une incertitude de placement. Le langage naturel reflète cette réalité avec des formulations comme *« aux alentours de »*, *« près de »*, *« proche du bord »*.

L'article modélise cela par une **convolution du champ réel par un noyau de pondération K** :

> v<sub>PGN</sub> = ∫ u(x) · K(x | θ<sub>loc</sub>) dx

Le noyau K (gaussien, sphérique, etc.) est dérivé du langage naturel : « 5 mm d'incertitude » devient un noyau gaussien de σ = 5 mm. Ce mécanisme rend la mesure mathématiquement compatible avec le champ continu produit par le PINN.

---

## 6. La signature cryptographique : sceller la donnée

La Signature Σ n'est pas seulement la valeur mesurée. C'est le **couplage de la définition (PGN) et de la mesure**, scellé par hachage.

L'article construit d'abord un **graphe RDF** (triplets sémantiques) qui décrit la mesure : identifiant du capteur, valeur, instant, noyau utilisé. Ce graphe est ensuite haché cryptographiquement (typiquement SHA-256) :

> Σ = Hash(G<sub>RDF</sub>)

Conséquence : si quelqu'un modifie *a posteriori* la position du capteur, la valeur mesurée, ou n'importe quel attribut, le hash change complètement. **La donnée devient infalsifiable** et auditable. C'est ce qui permet de construire une véritable mémoire du Jumeau Numérique dans le temps.

---

## 7. Cas d'usage : l'échangeur de chaleur

L'article illustre le modèle sur un cas concret : couplage CFD / essai physique sur un échangeur tubulaire (fluide chaud dans les tubes, froid dans la calandre).

**Étape 1 — Expression.** L'ingénieur déclare son capteur en langage naturel :

> *« Créer un capteur de température Tc_Sortie situé au centre de la bride de sortie du fluide chaud (en x = 1.5, y = 0, z = 0.5) avec une incertitude de positionnement de 5 mm. »*

**Étape 2 — Structure.** Le LLM analyse la phrase, identifie la physique (thermique), la position et le noyau d'intégration. Il génère le PGN :

```json
{
  "id": "Tc_Sortie",
  "physique_domain": "Heat_Transfer",
  "dimension_vector": [0,0,0,0,1,0,0],
  "geometrie": {
    "centre": [1.5, 0.0, 0.5],
    "forme": "Spherical_Kernel",
    "sigma": 0.005
  }
}
```

Le vecteur de dimensions `[0,0,0,0,1,0,0]` indique sans ambiguïté qu'il s'agit d'une grandeur en kelvin. Le `physique_domain` déclenche automatiquement l'équation de la chaleur côté PINN.

**Étape 3 — Signature.** À t = 10 s, le thermocouple renvoie 80 °C (353,15 K). La Signature est générée :

> Σ = SHA256({ ID: "Tc_Sortie", Kernel: K<sub>Gauss</sub>, Val: 353.15 })

Ce scellé est stocké pour la traçabilité, et les données sont ensuite préparées pour le moteur d'IA parcimonieuse **NeurEco (ADAGOS)**, qui assurera l'entraînement du modèle réduit.

---

## 8. Implémentation prototype

L'article propose une architecture en couches avec des technologies recommandées :

- **Couche sémantique** — LLM local via *Ollama* (Mistral) + *LangChain* pour structurer le prompt.
- **Couche structurelle** — *Pydantic* pour forcer le format des données (validation stricte des PGN).
- **Couche signature** — *Hashlib* (SHA-256 standard Python).
- **Couche physique** — *DeepXDE* (framework PINN) ou PyTorch pur, en attendant l'intégration NeurEco.

Le dossier prototype s'organise autour d'un `ledger.json` jouant le rôle de « blockchain » locale, et de modules séparés pour l'interpréteur LLM, la signature, et la couche physique. Une interface web permet à l'ingénieur de saisir ses EGN et de visualiser les Signatures émises.

---

## Pour aller plus loin

Cette synthèse ne couvre qu'une partie de l'article. Le document complet approfondit :

- la **formulation mathématique complète** des fonctions de perte composites,
- la **sélection automatique de l'opérateur différentiel** par analyse sémantique (chaleur, fluides, mécanique),
- le rôle de **régularisateur sémantique** joué par l'équation différentielle dans le PINN,
- l'**intégration avec NeurEco (ADAGOS)** pour le moteur d'IA parcimonieuse.

> Document distribué à titre confidentiel. → Demander l'accès auprès de XiLAB.

---

*Article rédigé par N. Gardan (XILAB) — Mise à jour : mai 2026.*

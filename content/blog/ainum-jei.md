---
title: "AINUM-e : notre programme R&D et le statut Jeune Entreprise Innovante"
date: 2025-03-24
description: "Comment XiLAB3D+ développe un procédé original d'assistance numérique pour les jumeaux numériques, et pourquoi ce travail nous a valu le statut de Jeune Entreprise Innovante."
tags: ["R&D", "jumeaux numériques", "IA", "JEI"]
categories: ["rd"]
draft: false
---

## Le statut JEI : une reconnaissance de l'effort de recherche

En mars 2025, XiLAB3D+ a obtenu le statut de **Jeune Entreprise Innovante (JEI)** auprès de l'administration fiscale française. Ce statut — encadré par le Code général des impôts — reconnaît que plus d'un tiers de nos charges sont consacrées à des activités de recherche et développement. Pour nous, c'est la validation formelle d'un choix de fond : construire une entreprise d'ingénierie qui ne se contente pas d'appliquer l'état de l'art, mais qui contribue à le faire avancer.

Concrètement, au quotidien, l'équipe consacre l’essentiel de leur temps à des travaux de recherche et développement : conception d’architectures techniques nouvelles, expérimentation de solutions, développement de prototypes et amélioration continue de nos technologies. Ces travaux impliquent des phases régulières d’essais, d’itérations et de validation afin de lever des verrous techniques et d’aboutir à des solutions robustes et innovantes.

---

## Le projet AINUM-e : l'IA au service de l'ingénierie numérique

Notre programme de R&D s'appelle **AINUM-e** : *Artificial Intelligence in Numerical Engineering*. L'ambition est simple à formuler, complexe à résoudre : **aider les ingénieurs à construire et mettre à jour des maquettes numériques — en particulier des Jumeaux Numériques — grâce à l'intelligence artificielle**.

### Pourquoi ce sujet est-il difficile ?

Un Jumeau Numérique, c'est un modèle numérique couplé en temps réel (ou quasi-réel) à un objet physique via des capteurs. Les données échangées permettent de surveiller, prédire et corriger le comportement du système physique. C'est une technologie-clé de l'industrie 4.0.

Mais la mettre en œuvre pose plusieurs problèmes que l'IA généraliste ne résout pas :

- **Les lois de la physique doivent être respectées.** Un réseau de neurones classique peut produire des résultats plausibles mais physiquement absurdes. En ingénierie, c'est rédhibitoire.
- **Les données sont rares et hétérogènes.** Pas de Big Data en simulation industrielle : on travaille avec des jeux de données limités, issus de simulations coûteuses ou de mesures expérimentales ponctuelles.
- **Il n'existe pas de langage technique standardisé** pour formaliser les règles de conception et de simulation numérique. Chaque ingénieur, chaque outil parle son propre dialecte.

### Notre réponse : un procédé en trois briques

**1. Un langage technique structuré.** Nous développons une ontologie — un système de représentation formelle des connaissances — qui permet d'organiser les paramètres d'une simulation (conditions aux limites, propriétés matériaux, contraintes géométriques) de manière exploitable par des agents IA. Ce langage sert d'interface entre la connaissance métier de l'ingénieur et les modèles numériques.

**2. L'IA parcimonieuse couplée à la physique.** Plutôt que des réseaux de neurones gourmands en données, nous utilisons des approches *Physics-Informed Neural Networks* (PINN) et l'IA parcimonieuse développée par le professeur Mohamed Masmoudi (logiciel **NeurEco**, Adagos). Ces modèles intègrent les équations physiques directement dans leur architecture, ce qui leur permet d'être précis même avec peu de données d'entraînement.

**3. Un système expert hybride.** Un moteur de règles — validées par des spécialistes — fonctionne en parallèle de l'agent IA. Les deux se complètent : les règles garantissent la cohérence physique, l'IA gère la généralisation et la prédiction.

---

## Un premier résultat concret : la simulation CFD d'une fuite d'hydrogène

Pour valider l'approche, nous avons choisi un cas d'usage industriel exigeant : la **simulation de fuite d'hydrogène dans un contexte aéronautique**. Ce problème est multi-paramétrique (thermique, compressibilité, turbulence, composition du mélange gazeux, altitude, pression du réservoir…) et représentatif des défis réels auxquels font face les ingénieurs en simulation avancée.

Résultat : en couplant notre langage technique avec un RNN parcimonieux (NeurEco), nous avons **réduit drastiquement le temps de calcul** — initialement autour de 24 heures par simulation — tout en maintenant la précision physique des résultats. La structuration des données par le langage technique a également amélioré la qualité des données d'entraînement du modèle.

Ce n'est qu'un premier démonstrateur. L'objectif final est un procédé générique, transférable à n'importe quel outil de simulation numérique.

---

## Ce que ça veut dire pour nos clients

Concrètement, un ingénieur qui utiliserait notre procédé pourrait :

- Passer d'un problème formulé en langage naturel à une simulation structurée, paramètrée et annotée sémantiquement
- Réduire les temps de calcul sur des simulations répétitives
- Capitaliser la connaissance d'un projet sur l'autre, dans un format exploitable par l'IA

C'est exactement l'esprit de nos missions : apporter les outils de l'ingénierie numérique avancée aux PME et laboratoires industriels, sans la complexité et les coûts des grandes structures.

---

→ [En savoir plus sur notre programme R&D](/rd)

→ [Nous contacter](/contact)

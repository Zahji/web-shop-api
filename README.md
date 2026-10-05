[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/1XV6Meim)
# Projet Web 2025 - Groupe XX

Ce repository GitHub reprend le boilerplate de votre projet web, c'est à dire la base de code à partir de laquelle vous allez travailler.

## Apprentissage de Git et GitHub

Suivez le document d'installation du projet et les vidéos proposé sur moodle pour apprendre à utiliser Git et GitHub durant votre projet. Vous devrez utiliser ces outils pour collaborer entre étudiants du même groupe. Faites des commits fréquents !

## Installation du projet

Commencez par ouvrir un terminal. Attention, il faut utiliser le terminal Git Bash sur Windows, au lieu de cmd ou de PowerShell. Lancez ensuite la commande :

```sh
bash install.sh
```

Cette commande va créer la base de données, suivant le script `db_install.sql` correspondant à la correction de la deuxième soumission. Il va également télécharger les dépendances du projet avec `npm install`.

## Lancer le projet

Une fois que le projet est préparé tel qu'expliqué dans la section précédente, vous pouvez travailler dedans à votre guise et le lancer tel que vu dans le cours de web 1 :

```sh
npm run build
```

Et dans un autre terminal :

```sh
npm run dev
```

## Préparation de la soumission

Lorsque vous voudrez soumettre votre projet, utilisez la commande suivante dans un terminal (Git Bash et pas cmd ou PowerShell sur Windows) ouvert à la racine du projet :

```bash
bash submit.sh
```

Cette commande crée une archive ZIP nommée `final_submission_FIRSTNAME_LASTNAME.zip`, contenant les fichiers du projet que vous devez soumettre et en évitant les fichiers qui ne doivent pas être inclus.

## Membres
HAJJI Zahra
Simon Storme
KAJEWSKI Adrian

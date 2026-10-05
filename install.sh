#!/bin/bash

# Crée le dossier 'sqlite' si nécessaire
if [ ! -d sqlite ]; then
    mkdir sqlite
fi

# Télécharge et décompresse SQLite
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    curl --location -s https://www.sqlite.org/2025/sqlite-tools-win-x64-3490100.zip > sqlite/sqlite.zip
    unzip -o sqlite/sqlite.zip -d sqlite > /dev/null
else
    curl --location -s https://www.sqlite.org/2025/sqlite-amalgamation-3490100.zip > sqlite/sqlite.zip
    unzip -o sqlite/sqlite.zip -d sqlite > /dev/null
    gcc sqlite/sqlite-amalgamation-3490100/shell.c sqlite/sqlite-amalgamation-3490100/sqlite3.c -lpthread -ldl -lm -o sqlite/sqlite3 > /dev/null
fi

# Crée la base de données avec SQLite
./sqlite/sqlite3 db/project.db < db/db_install.sql > /dev/null
if [ $? != 0 ]; then
    echo "La création de la base de données a échoué" >&2
    exit 1
fi

# Installe les dépendances npm
npm install > /dev/null
if [ $? != 0 ]; then
    echo "L'installation des dépendances a échoué" >&2
    exit 1
fi

echo "L'installation s'est terminée avec succès"

rm -rf sqlite

exit 0
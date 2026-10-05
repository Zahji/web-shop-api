#!/bin/bash

# Crée une archive zip du projet en excluant les node_modules et la base de données
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    if [ ! -d zip ]; then
        mkdir zip
    fi

    curl -sL "https://sourceforge.net/projects/gnuwin32/files/zip/3.0/zip-3.0-bin.zip" > zip/zip.zip
    unzip -o zip/zip.zip -d zip > /dev/null

    if [ ! -d bzip2 ]; then
        mkdir bzip2
    fi

    curl -sL "https://sourceforge.net/projects/gnuwin32/files/bzip2/1.0.5/bzip2-1.0.5-bin.zip" > bzip2/bzip2.zip
    unzip -o bzip2/bzip2.zip -d bzip2 > /dev/null

    cp bzip2/bin/bzip2.dll zip/bin/

    zip/bin/zip -r final_submission_FIRSTNAME_LASTNAME.zip . -x "*.zip" -x "node_modules/*" -x "db/project.db" -x "exec/*" -x "sqlite/*" -x "zip/*" -x "bzip2/*" -x ".git/*"  > /dev/null
else
    zip -r final_submission_FIRSTNAME_LASTNAME.zip . -x "*.zip" -x "node_modules/*" -x "db/project.db" -x "exec/*" -x "sqlite/*" -x "zip/*" -x "bzip2/*" -x ".git/*"  > /dev/null
fi

echo "L'archive a été créée avec succès"

rm -rf zip
rm -rf bzip2

exit 0

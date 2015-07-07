#!/usr/bin/env bash

file="extension/manifest.json"
name=$(cat "$file" | grep "\"name\"" | cut -d ":" -f2 | cut -d "," -f1 | cut -d "\"" -f2)
version=$(cat "$file" | grep "\"version\"" | cut -d ":" -f2 | cut -d "," -f1 | cut -d "\"" -f2)
echo "Current version# of $name is: $version"
find . -type f -name "$name-*.zip" -exec rm {} +
zip -r "$name-$version".zip extension/
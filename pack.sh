#!/usr/bin/env bash

# IF YOU WANT TO EDIT INPUT FILE DIRECTORY, DO HERE #1
file="extension/manifest.json"
version=$(cat "$file" | grep "\"version\"" | cut -d ":" -f2 | cut -d "," -f1 | cut -d "\"" -f2)
bumped=""
# If `bump` passed in as argument, increment manifest.json version
if [ $# -eq 1 ] && [ "$1" == "bump" ]
    then
    # Reference: http://stackoverflow.com/a/6245903/
    inc_version="${version%.*}.$((${version##*.}+1))"
    echo "%s/$version/$inc_version/g
    w
    q
    " | ex $file
    version=$inc_version
    bumped=" (bumped)"
fi

name=$(cat "$file" | grep "\"name\"" | cut -d ":" -f2 | cut -d "," -f1 | cut -d "\"" -f2)
echo "Current$bumped version# of $name is: $version"
find . -type f -name "$name-*.zip" -exec rm {} +

if [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac OSX, so remove all .DS_Stores
    echo "Removing .DS_Stores..."
        find . -name '*.DS_Store' -type f -delete
    echo "Done."
fi

# AND HERE #2
zip -r "$name-$version".zip extension/



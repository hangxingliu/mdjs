#!/usr/bin/env bash

while read -r repo; do
	echo "Pushing to repository \"$repo\"...";
    eval "git push $repo --all" || exit 1;
done <<< "$(git remote -v | awk '{print $1}' | uniq )"

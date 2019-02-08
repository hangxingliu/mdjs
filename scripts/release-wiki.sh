#!/usr/bin/env bash

throw() { echo "[-] fatal: $1"; exit 1; }

echo "[.] goto project root directory ...";
pushd "$( dirname "${BASH_SOURCE[0]}")" && pushd .. || throw;

echo "[.] checking target directory is existed (../mdjs.wiki) ...";
[[ -d "../mdjs.wiki" ]] || throw "../mdjs.wiki is not existed!";

echo "[.] copying markdown files to ../mdjs.wiki ...";
find documents -type f \( -name '*.markdown' -o -name '*.md' \) |
	xargs -I __file__ cp -v __file__ ../mdjs.wiki || throw;

echo "[.] git add files in wiki repo ...";
pushd "../mdjs.wiki" || throw;
git add . || throw;

echo "[+] release to wiki repo done! (you can git commit and git push now)";

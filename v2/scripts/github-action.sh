#!/usr/bin/env bash

uname -a;
date;

pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

yarn install || exit 1;
yarn run build || exit 1;
yarn run test:build || exit 1;
yarn run test || exit 1;
yarn run clean || exit 1;

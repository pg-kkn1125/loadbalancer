#!/usr/bin/env sh

mkdir -p ./migrations

rm -rf ./migrations/*

cp -r ecosystem.config.js app.js src/ ./migrations/

find ./migrations -type f -name '*.js' -exec sh -c 'mv "$1" "${1%.js}.mjs"' _ {} \;

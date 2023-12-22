#!/bin/bash
rm -rf test_site
npm install
node process_markdown.js -i './test_vault' -o './test_site' -oi 1
rm -f ./test_site/pkm.sqlite && \
node ./scripts/index_to_sqlite.js \
    -i ./test_site \
    -dbf ./test_site/pkm.sqlite

cd test_site
mkdocs build -v
cd docs
python3 -m http.server
#!/bin/bash
rm -rf test_site
npm install
node process_markdown.js -i './test_vault' -o './test_site' -oi 1
cd test_site
mkdocs build
cd docs
python3 -m http.server
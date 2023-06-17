#!/bin/bash
npm install
node process_markdown.js -i './test_vault' -o './test_site' -oi 1
cd test_site
mkdocs build -v
cd docs
python3 -m http.server
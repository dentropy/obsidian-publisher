#!/bin/bash
export build_path='dentropy.github.io'
source .env
node process_markdown.js -i '/home/dentropy/Documents/Root' -o './dentropy.github.io' -oi 5
# cd $build_path
# git add .
# git commit -m "Updated Site"
# mkdocs build -v
# git add .
# git commit -m "Rebuilt site"

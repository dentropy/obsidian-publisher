#!/bin/bash
npm install
source .env
echo 'build_path'
echo $build_path
rm -rf $build_path/markdown_flies/*md
rm -rf $build_path/docs/*
node raw_to_sqlite.js -i $pkm_in_path -o $build_path -oi 5
# node process_markdown.js -i $pkm_in_path -o $build_path -oi 5
cd $build_path
git add .
git commit -m "Updated Site"
mkdocs build -v
git add .
git commit -m "Rebuilt site"
git push origin main

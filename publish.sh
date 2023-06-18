#!/bin/bash
npm install
source .env
echo 'build_path'
echo $build_path
node process_markdown.js -i '/home/paul/Documents/Root' -o $build_path -oi 5
cd $build_path
git add .
git commit -m "Updated Site"
mkdocs build -v
git add .
git commit -m "Rebuilt site"
git push origin main

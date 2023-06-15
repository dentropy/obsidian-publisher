#!/bin/bash
npm install
export build_path='dentropy.github.io'
node process_markdown.js
cd $build_path
git add .
git commit -m "Updated Site"
mkdocs build -v
git add .
git commit -m "Rebuilt site"
git push origin main

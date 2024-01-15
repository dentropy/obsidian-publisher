#!/bin/bash
# npm install
source .env
echo 'build_path'
echo $build_path
./build_full.sh
cd $build_path
git add .
git commit -m "Updated Site"
mkdocs build -v
git add .
git commit -m "Rebuilt site"
git push origin main

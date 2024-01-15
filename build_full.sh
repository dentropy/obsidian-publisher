#!/bin/bash
source .env
echo 'build_path'
echo $build_path
./build.sh

# git commit -m "Updated Site"
cd $build_path
mkdocs build -v

# git add .
# git commit -m "Rebuilt site"

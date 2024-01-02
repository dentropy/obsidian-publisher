#!/bin/bash

# NOTE IS YOU TRY TO USE GIT YOU WILL GET config user.email and user.name errors
echo 'Showing files from pkm_in'
ls /pkm_in
node process_markdown.js -i '/pkm_in' -o '/pkm_out' -oi $offsetindex
cd /pkm_out
# git add .
# git commit -m "Updated Site"

mkdocs build -v

# git add .
# git commit -m "Rebuilt site"

#!/usr/bin/env bash

# Usage: ./script.sh file.json    or    cat data.json | ./script.sh
echo "Run in root directory not scripts directory using ./scripts/retag_published_notes.js"

node ./scripts/list_all_shared_files.js  -i $OBSIDIAN_VAULT_DIR -o test.json
jq -c '.[]' "${1:-/dev/stdin}" | while IFS= read -r item; do
    echo "$item"                 # ← replace this line with whatever you want to do per item
    item2=${item:1:-1}
    node ./scripts/set_key_value_in_file.js -i "$item2" -t published -v "true"
done
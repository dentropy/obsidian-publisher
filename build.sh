#!/bin/bash
source .env
echo 'build_path'
echo $build_path
rm -rf $build_path/markdown_flies/*md
rm -rf $build_path/docs/*
rm -rf $build_path/pkm.sqlite
node raw_to_sqlite.js \
    -dbf $build_path/pkm.sqlite \
    -i $pkm_in_path \
    -o $build_path \
    -oi 5


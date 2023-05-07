#!/bin/bash
rm -rf out
node build.js
cp -rn out/docs site
cd site
mkdocs build
# rsync or push ./site to S3 bucket



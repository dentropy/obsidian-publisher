#!/bin/bash
source .env
echo $pkm_in_path
echo $(pwd)/$build_path
docker run \
  --env-file .env \
  -v $pkm_in_path:/pkm_in  \
  -v $(pwd)/$build_path:/pkm_out \
  dentropys-obsidian-publisher
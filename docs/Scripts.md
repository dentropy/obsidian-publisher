## Scripts

* Get all files in group
* Get all files shared
* Display hierarchy tree color coded based on shared or not shared
* Share everything within glob path besides these hard coded notes
* Do we also want a private variable, just to make things super safe?
  * If we can script directories to share, we need a counter measure
* Then we need to dump all this shit into sqlite

``` bash

# Lists all markdown files
node ./scripts/list_all_markdown_files.js \
  -i ./test_vault\
   -o list_all_markdown_files.json

# Produces site_data.json which is used to produce
#  the site directory on the right side of the final website
node ./scripts/save_site_data.js \
  -i ./test_vault \
  -o site_data.json -oi 5 

# Add a tag to everything within a speciifc path
# This adds a tag groups with value test
# Beware this will overwrite the pre existing
# Tag value pair if it is already set
node ./scripts/update_and_insert_yaml_tags.js \
  -i ./test_vault \
  -t groups \
  -v test

# Test overwiring the tag group value test
node ./scripts/update_and_insert_yaml_tags.js \
  -i ./test_vault \
  -t groups \
  -v test2

# Reset things after hte test is done
git checkout test_vault


# Add a value to a tag
# Can be used to create tags as well
node ./scripts/append_value_in_path.js \
  -i ./test_vault \
  -t groups \
  -v writings
node ./scripts/append_value_in_path.js \
  -i ./test_vault \
  -t groups \
  -v published
node ./scripts/append_value_in_path.js \
  -i ./test_vault \
  -t hello \
  -v world


# Test removing a value from a key
node ./scripts/append_value_in_path.js \
  -i ./test_vault \
  -t groups \
  -v paid
node ./scripts/append_value_in_path.js \
  -i ./test_vault \
  -t groups \
  -v premium
node ./scripts/remove_value_from_key.js \
  -i ./test_vault \
  -t groups \
  -v paid
```


## Build Test Site

``` bash
# This script actually generates the markdown
# For your site
node process_markdown.js \
    -i './test_vault' \
    -o './test_site' -oi 1 -g 'paid'

bash test_build.sh

sqlitebrowser ./test_site/pkm.sqlite

git checkout test_vault

```

## Convert your PKMS from markdown a SQLite Database

``` bash

clear
rm -rf test_site

node process_markdown.js \
    -i './test_vault' \
    -o './test_site' -oi 1 -g 'paid'

rm -f ./test_site/pkm.sqlite && \
node ./scripts/index_to_sqlite.js \
    -i ./test_site \
    -dbf ./test_site/pkm.sqlite


node ./scripts/add_backlinks.js \
    -i './test_site' \
    -dbf ./test_site/pkm.sqlite

cd ./test_site && python3 -m mkdocs build -v && cd ..
cd ./test_site/docs && python3 -m http.server

cd ../..

sqlitebrowser ./test_site/pkm.sqlite

cd ../..

```

## Depreciated Scripts


``` bash

# Update or Insert YAML tags
# Overwites the existing tag
node ./scripts/update_and_insert_yaml_tags.js \
  -i ./test_vault \
  -t groups \
  -v blog

```

## SQLite Rewrite Tests

``` bash

clear && rm -rf test_site2

node ./raw_to_sqlite.js \
    -i './test_vault' \
    -dbf ./test_site2/pkm.sqlite \
    -oi 1 \
    -o './test_site2' -oi 1 -g 'paid'

cp -r ./test_site2/markdown_files/assets ./test_site2/docs/assets

cd test_site2 && \
  mkdocs build -v && \
  cd docs && \
  python3 -m http.server

cd ...


sqlitebrowser ./test_site2/pkm.sqlite

```

## SQL Queries


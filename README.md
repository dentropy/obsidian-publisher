# dentropys-obsidian-publisher

## Requirements

* nodejs + npm
* python3 + pip3
* Folder of markdown files you want as a HTML website

## Install

``` bash

pip3 install mkdocs
pip3 install mkdocs-material

git clone https://github.com/dentropy/dentropys-obsidian-publisher.git
cd dentropys-obsidian-publisher
npm install
cd pkm-site
npm install


```

## Use

``` bash
cd dentropys-obsidian-publisher
mkdir pkm
# Move your obsidian vault files you want in this folder
node load_markdown.js
node generate_file_hierarchy.js
node yaml_site_hierarchy.js
cd site
mkdocs build -v
mkdocs serve
```

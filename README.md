# dentropys-obsidian-publisher

This project build a static website using mkdocs from your obsidian vault. Please note that this project adds YAML frontmatter to the notes in your existing vault for manging permissions and providing each note a UUID. If you don't like looking at frontmatter yaml in Obsidian you can install [hua03/obsidian-toggle-meta-yaml-plugin](https://github.com/hua03/obsidian-toggle-meta-yaml-plugin) from the community plugins page.

## Requirements

* Linux Shell
* Obsidian Vault with notes you want to share
* nodejs + npm
* python3 + pip3
* Folder of markdown files you want as a HTML website

## Install

``` bash
python3 -m venv env
source env/bin/activate
pip3 install mkdocs
pip3 install mkdocs-material
# pip3 install git+https://github.com/danodic-dev/mkdocs-backlinks.git
# pip3 install mkdocs-tooltipster-links-plugin
# pip3 install mkdocs-backlinks
# pip3 install mkdocs-preview-links-plugin

git clone https://github.com/dentropy/dentropys-obsidian-publisher.git
cd dentropys-obsidian-publisher
npm install

```

## Build Static Site

``` bash

cd dentropys-obsidian-publisher
mkdir pkm
# Move your obsidian vault files you want in this folder
node process_markdown.js
cd site
mkdocs build -v
mkdocs serve -v

```

## Publish Static Site

Check out [Quickstart for GitHub Pages](https://docs.github.com/en/pages/quickstart) to setup github pages repository

Remember our static site is located at /site/site if you want to change things up

**RUN ONE LINE AT A TIME**

Create github repo with name $YOUR_GITHUB_USERNAME.github.io.git

``` bash
# YOUR_GITHUB_USERNAME=dentropy

cd dentropys-obsidian-publisher
git config --global init.defaultBranch main
git clone git@github.com:$YOUR_GITHUB_USERNAME/$YOUR_GITHUB_USERNAME.github.io.git
```

**Edit mkdocs-bak.yml**

Replace the `dentropy` in `site_url: https://dentropy.github.io` to your github username

``` yaml
site_url: https://dentropy.github.io
```

Change `pattern` to the path where your Obsidian Vault is, remember to keep the `/**/*.md` at the end
Change `offset_index` to what the sliced index is, in this case Root is the main folder
Change `out_path` to `$YOUR_GITHUB_USERNAME.github.io`

**Run process_markdown.js**

``` bash
cd dentropys-obsidian-publisher
node process_markdown.js -i './test_vault' -o './test_site' -oi 1
cd  test_site
mkdocs build -v
cd docs
python3 -m http.server
```


``` bash
cd dentropys-obsidian-publisher
node process_markdown.js
```

When `process_markdown.js` runs successfully your terminal should say `Built Markdown Completed Successfully`

**Build site**

``` bash
cd dentropys-obsidian-publisher
cd $YOUR_GITHUB_USERNAME.github.io.git
git add .
git commit -m "Updated Site"
mkdocs build -v
cd docs
python3 -m http.server
# Go to http://localhost:8000 in your browser to test your site
# Ctrl + C to exit after verified site
cd ..
git add .
git commit -m "Rebuilt site"
git push origin main
```

**Finish Configuring Github Pages**

* Go to the git repository on on the github website
* Select `settings` along the top navigation bar of the repo
* Select `Pages` on the left navigation bar under `code and automation`
  * Under `Source` select `Deploy from a branch`
  * Under `Branch` select `main`
  * Select `/(Root)` drop down and select `/docs`
  * Under `Branch` select `Save`

**Wait 10 minutes and check site**

Go to https://$YOUR_GITHUB_USERNAME.github.io cause your site should be up now

## Build With Docker

**Note:** The docker build is not as fully functionally as the CLI, for example you can not build you entire PKM, I chose this intentionally for security reasons

``` bash

cp example_dot_env .env
$EDITOR .env
bash container-build.sh
bash container-run.sh
sudo chown $USER:$USER ./pkm_out
```

## Scripts

* Get all files in group
* Get all files shared
* Display hierarchy tree color coded based on shared or not shared
* Share everything within glob path besides these hard coded notes
* Do we also want a private variable, just to make things super safe?
  * If we can script directories to share, we need a counter measure
* Then we need to dump all this shit into sqlite

``` bash

node ./scripts/list_all_markdown_files.js -i /home/paul/Documents/Root -o out.json

node ./scripts/save_site_data.js \
  -i /home/paul/Projects/dentropys-obsidian-publisher/test_vault \
  -o out.json -oi 5 

node ./scripts/update_and_insert_yaml_tags.js \
  -i /home/paul/Projects/dentropys-obsidian-publisher/test_vault \
  -t groups \
  -v test

git checkout test_vault

node ./scripts/update_and_insert_yaml_tags.js \
  -i /home/paul/Projects/dentropys-obsidian-publisher/test_vault/Blog \
  -t groups \
  -v blog

git checkout test_vault

```
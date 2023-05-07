import fs from 'node:fs/promises'
import { load } from 'js-yaml';
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import util from "util";
import { glob } from 'glob';
import yaml from 'yaml';
import { v4 as uuidv4 } from 'uuid';


function replaceYamlFrontMatter(markdownContent, newFrontMatter) {
  // Match YAML front matter using regular expression
  const regex = /^---\n([\s\S]+?)\n---\n/;
  
  // Replace the YAML front matter with the new front matter
  return markdownContent.replace(regex, `---\n${newFrontMatter}\n---\n`);
}


// Get all markdown files
const pattern = 'pkm/**/*.md';
// const pattern = 'pkm/index.md';
const filepaths = glob.sync(pattern);

console.log("filepaths")
console.log(filepaths)
console.log("Done filepaths\n")

let site_data = {
  markdown_syntax_tree : {},
  filename_uuid : {},
  filepath_uuid : {},
  site_hierarchy : {}
}

for(var i = 0; i < filepaths.length; i++) {
    let doc = await fs.readFile(filepaths[i])
    let tree = fromMarkdown(doc, {
      extensions: [frontmatter(['yaml', 'toml']), syntax()],
      mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
    })
    let parsed_yaml = {}

    // Extract Yaml
    console.log(filepaths[i])
    if( Object.keys(tree).includes("children") ){
      if (tree["children"].length >= 1){
        if(tree["children"][0].type == "yaml"){
          parsed_yaml = yaml.parse(tree["children"][0].value)
        }
        else {
          console.log(`Skipped ${filepaths[i]}`)
          continue
        }
      }
      else {
        console.log(`Skipped ${filepaths[i]}`)
        continue
      }
    }
    else {
      console.log(`Skipped ${filepaths[i]}`)
      continue
    }
    if ( Object.keys(parsed_yaml).includes("share") )  {
      if (parsed_yaml["share"] == true){
        if (Object.keys(parsed_yaml).includes("uuid")){
          site_data.markdown_syntax_tree[parsed_yaml.uuid] = tree
          site_data.filepath_uuid[filepaths[i]] = parsed_yaml.uuid
          site_data.filename_uuid[filepaths[i].split('/').pop()] = parsed_yaml.uuid
        }
        else {
          parsed_yaml.uuid = uuidv4();
          let yaml_string = yaml.stringify(parsed_yaml).slice(0, -1)
          let new_md_file = replaceYamlFrontMatter(doc.toString(), yaml_string)
          await fs.writeFile(filepaths[i], new_md_file)
          doc = await fs.readFile(filepaths[i])
          let tree = fromMarkdown(doc, {
            extensions: [frontmatter(['yaml', 'toml']), syntax()],
            mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
          })
          site_data.markdown_syntax_tree[parsed_yaml.uuid] = tree
          site_data.filepath_uuid[filepaths[i]] = parsed_yaml.uuid
          site_data.filename_uuid[filepaths[i].split('/').pop()] = parsed_yaml.uuid
        }
      }
      console.log(`Parsed ${filepaths[i]}`)
    }
}
// console.log(util.inspect(site_data, {showHidden: false, depth: null, colors: true}))



// Build site map, Check for and add UUID


// Learn NextJS

// console.log(util.inspect(tree, {showHidden: false, depth: null, colors: true}))


import { Command } from 'commander';
import util from 'util';

// File System Stuff
import fs from 'fs'
import { glob } from 'glob';

// Markdown Stuff
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'

// For Markdown Processing
import yaml from 'yaml';
import { v4 as uuidv4 } from 'uuid';


const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath  <string>')
  .option('-o, --outpath <string>')
program.parse(process.argv)
const options = program.opts()

console.log(options)
let pattern = ''
if (  !(Object.keys(options).includes("inpath"))  ){
  console.log("You failed to set input path '-i $FOLDER_PATH' for you markdown documents")
  process.exit(1);
}
else {
  pattern = options.inpath;
  if (pattern.charAt(pattern.length - 1) != '/'){
    pattern += '/'
  }
  pattern += '**/*.md'
}

let out_path = 'test.json'
if (  !(Object.keys(options).includes("outpath"))  ){
  console.log("You failed to set output path '-o $FOLDER_PATH' for you markdown documents")
  process.exit(1);
}
else {
  out_path = options.outpath
}

const glob_options = {
  nodir: true, // Exclude directories
};
let filepaths = glob.sync(pattern, glob_options);
filepaths = filepaths.sort((a, b) => a - b);
let returned_file_list = [] // Shared Files
for (var i = 0; i < filepaths.length; i++) {
  // Read markdown file and turn it into syntax tree
  let doc = await fs.readFileSync(filepaths[i])
  let tree = fromMarkdown(doc, {
    extensions: [frontmatter(['yaml', 'toml']), syntax()],
    mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
  })
  // Extract Yaml from markdown file, if not add UUID, save shared notes to out_path
  let parsed_yaml = {}
  if (Object.keys(tree).includes("children")) {
    if (tree["children"].length >= 1) {
      // This if else statement edits the original markdown note in the Obsidian Vault
      if (tree["children"][0].type == "yaml") {
        parsed_yaml = yaml.parse(tree["children"][0].value)
      } 
      else {
        parsed_yaml.uuid = uuidv4();
        parsed_yaml.share = false
        let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' + doc.toString()
        await fs.writeFile(filepaths[i], new_md_file)
      }
    } 
    else {
      parsed_yaml.uuid = uuidv4();
      parsed_yaml.share = false
      let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' + doc.toString()
      await fs.writeFile(filepaths[i], new_md_file)
    }
  }



  if (Object.keys(parsed_yaml).includes("share") ) {
    if (parsed_yaml["share"] == false ) {
      returned_file_list.push(filepaths[i])
    }
  }
  console.log(`Processed ${filepaths[i]}`)
}

console.log(util.inspect(returned_file_list, {showHidden: false, depth: null, colors: true}))
fs.writeFileSync(out_path, JSON.stringify(returned_file_list, null, 2));
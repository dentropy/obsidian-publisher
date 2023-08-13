import util from 'util'
import yaml from 'yaml';

// File System Stuff
import fs from 'fs'
import { glob } from 'glob';

// Import Custom Modules
import { extractYamlFromMarkdown } from '../lib/extractYamlFromMarkdown.js';
import { removeYamlFromMarkdown } from '../lib/removeYamlFromMarkdown.js';
import { v4 as uuidv4 } from 'uuid';

import { Command } from 'commander';
const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath  <string>')
  .option('-g, --group_name     <string>')
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

async function main(pattern, key, value){
  const glob_options = {
      nodir: true, // Exclude directories
  };
  let filepaths = await glob.sync(pattern, glob_options);
  let parsed_yaml = {}
  for (var i = 0; i < filepaths.length; i++) {
    let doc = await fs.readFileSync(filepaths[i])
    let parsed_yaml =  extractYamlFromMarkdown(doc.toString())
    if (parsed_yaml == null ){
      parsed_yaml = {}
    }
    console.log(filepaths[i])
    console.log(parsed_yaml)
    if (  !Object.keys(parsed_yaml).includes("uuid") ) {
      parsed_yaml.uuid = uuidv4();
      parsed_yaml.share = false
    }
    if (  !Object.keys(parsed_yaml).includes("groups") ) {
      parsed_yaml.groups = [];
    }
    if( !parsed_yaml.groups.includes(options.group_name)){
      parsed_yaml.groups.push(options.group_name)
    }
    let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' + removeYamlFromMarkdown(doc.toString())
    await fs.writeFileSync(filepaths[i], new_md_file)
  }
}

main(pattern, options.tag, options.value)
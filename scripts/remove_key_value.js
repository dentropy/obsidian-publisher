import util from 'util'
import yaml from 'yaml';

// File System Stuff
import fs from 'fs'
import { glob } from 'glob';

// Import Custom Modules
import { extractYamlFromMarkdown } from '../lib/extractYamlFromMarkdown.js';
import { removeYamlFromMarkdown } from '../lib/removeYamlFromMarkdown.js';

import { Command } from 'commander';
const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath  <string>')
  .option('-t, --tag     <string>')
  .option('-v, --value   <string>')
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
    if (  Object.keys(parsed_yaml).includes(options.tag) ) {
      if(parsed_yaml[options.tag] == false){
        console.log(filepaths[i])
      }
      if (options.value == "true" || options.value == "false"){
        if(parsed_yaml[options.tag] == true && parsed_yaml[options.tag] == "true" ){
          delete parsed_yaml[options.tag]
        }
        if(parsed_yaml[options.tag] == false && parsed_yaml[options.tag] == "false" ){
          delete parsed_yaml[options.tag]
        }
      }
      else {
        if(parsed_yaml[options.tag] == options.value){
          delete parsed_yaml[options.tag]
        }
      }
    }
    let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' + removeYamlFromMarkdown( doc.toString() )
    await fs.writeFileSync(filepaths[i], new_md_file)
  }
}

main(pattern, options.tag, options.value)
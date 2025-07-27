import fs from 'fs'
import { glob } from 'glob';
import { v4 as uuidv4 } from 'uuid';
import yaml from 'yaml';

// Import Custom Modules
import { extractYamlFromMarkdown } from './lib/extractYamlFromMarkdown.js';
import { removeYamlFromMarkdown } from './lib/removeYamlFromMarkdown.js'



// * Get CLI Arguments
import { Command } from 'commander';
const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath  <string>')
  .option('-o, --outpath <string>')
  .option('-dbf, --dbfilepath   <string>')
  .option('-oi, --offsetindex <int>')
  .option('-mkdn, --mkfilesfoldername <string>')
  .option('-ev, --entire_vault')
  .option('-np, --not_public')
  .option('-g, --groupstopublish <string>')
  .option('-cp, --custom_path <string>')
  .option('-am, --add_md_extensions')
  .option('-it, --index_title <string>')
program.parse(process.argv)
const options = program.opts()
console.log(options)
let pattern = ''
let in_path = ''
if (  !(Object.keys(options).includes("inpath"))  ){
  console.log("You failed to set input path '-i $FOLDER_PATH' for you markdown documents")
  process.exit(1);
}
else {
  pattern = options.inpath;
  in_path = options.inpath;
  if (pattern.charAt(pattern.length - 1) != '/'){
    pattern += '/'
    in_path += '/'
  }
  pattern += '**/*.md'
}

async function build() {

    console.log("\nGlob all the files")
    let note_files = await glob.sync(in_path + '**/*.md')

    for(var i = 0; i < note_files.length; i++){
        console.log(in_path)
        console.log(note_files[i])
        // Read YAML to JSON
        let raw_markdown = await fs.readFileSync(note_files[i])
        let parsed_yaml =  extractYamlFromMarkdown(raw_markdown.toString())

        if(parsed_yaml == undefined){
          parsed_yaml = {}
        }
        // Add uuid's to files missing them
        if(!Object.keys(parsed_yaml).includes("uuid")){
          parsed_yaml.uuid = uuidv4();
          parsed_yaml.share = false
          let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' +  removeYamlFromMarkdown( raw_markdown.toString())
          await fs.writeFileSync(note_files[i], new_md_file)
        }
    }
}

build()
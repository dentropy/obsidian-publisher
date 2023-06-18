import util from 'util';

// CLI Stuff
import readline from 'readline';
import { Command } from 'commander';

// File System Stuff
import fs from 'node:fs/promises'
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

// Import Custom Modules
import { addInEmbeddedNotes } from './lib/addInEmbeddedNotes.js';
import { createRecursiveObject } from './lib/createRecursiveObject.js';
import { extractImagesFromMarkdown } from './lib/extractImagesFromMarkdown.js';
import { extractWikiLinksFromMarkdown } from './lib/extractWikiLinksFromMarkdown.js';
import { removeYamlFromMarkdown } from './lib/removeYamlFromMarkdown.js'; // Not Used
import { replaceWikiLinks } from './lib/replaceWikiLinks.js';
import { replaceYamlFrontMatter } from './lib/replaceYamlFrontMatter.js';


// Gotta initialize this first because it is called from inside the functions, no functional programming here bro
let site_data = {
  uuid_list : [],
  filename_uuid : {},
  filepath_uuid : {},
  site_hierarchy : {}
}


const program = new Command();
program
  .name('dentropys-obsidian-publisher')
  .description('This project build a static website using mkdocs from your obsidian vault.')
  .option('-i, --inpath  <string>')
  .option('-o, --outpath <string>')
  .option('-oi, --offsetindex <int>')
  .option('-mkdn, --mkfilesfoldername <string>')
  .option('-ev, --entire_vault')
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

let out_path = ''
if (  !(Object.keys(options).includes("outpath"))  ){
  console.log("You failed to set output path '-o $FOLDER_PATH' for you markdown documents")
  process.exit(1);
}
else {
  out_path = options.outpath
}

let offset_index = 0
if (  (Object.keys(options).includes("offsetindex"))  ){
  offset_index = options.offsetindex
}

let mkfiles_directory_name = 'markdown_files'
if (  (Object.keys(options).includes("mkfilesfoldername"))  ){
  mkfiles_directory_name = options.mkfilesfoldername
}

function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question + ' (y/n) ', (answer) => {
      const confirmed = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      resolve(confirmed);
      rl.close();
    });
  });
}

console.log(`pattern: ${pattern}`)
console.log(`out_path: ${out_path}`)
console.log(`offset_index: ${offset_index}`)
console.log(`mkfiles_directory_name: ${mkfiles_directory_name}`)

let build_full_site = false
if (  (Object.keys(options).includes("entire_vault"))  ){
  const confirmed = await askForConfirmation('Are you sure you want to build EVERYTHING?');
  if (confirmed) {
    console.log('Alright let\'s build everything');
    build()
  } else {
    console.log('Aborted.');
    console.log("Ya gotta be careful")
    process.exit(1);
  }
  await askForConfirmation();
  console.log(`build_full_site: ${build_full_site}`)
  build()
}
else {
  console.log(`build_full_site: ${build_full_site}`)
  build()
}

// Real stuff starts here

async function build(){
  // const pattern = 'index.md';     // For Testing
  // const out_path = "./out/docs"   // For Testing
  // Thank you #ChatGPT https://sharegpt.com/c/oOmLLUc
  await fs.mkdir(out_path, { recursive: true });
  await fs.mkdir(`${out_path}/${mkfiles_directory_name}`, { recursive: true });

  // Get all markdown files
  const filepaths = glob.sync(pattern);


  for (var i = 0; i < filepaths.length; i++) {
    // Read markdown file and turn it into syntax tree
    let doc = await fs.readFile(filepaths[i])
    let tree = fromMarkdown(doc, {
      extensions: [frontmatter(['yaml', 'toml']), syntax()],
      mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
    })

    // Extract Yaml from markdown file, if not add UUID, save shared notes to out_path
    // #TODO This should be a specific function to be used in scripts
    let parsed_yaml = {}
    if (Object.keys(tree).includes("children")) {
      if (tree["children"].length >= 1) {
        // This if else statement edits the original markdown note in the Obsidian Vault
        if (tree["children"][0].type == "yaml") {
          parsed_yaml = yaml.parse(tree["children"][0].value)
        } else {
          parsed_yaml.uuid = uuidv4();
          parsed_yaml.share = false
          let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' + doc.toString()
          await fs.writeFile(filepaths[i], new_md_file)
        }
      } else {
        parsed_yaml.uuid = uuidv4();
        parsed_yaml.share = false
        let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' + doc.toString()
        await fs.writeFile(filepaths[i], new_md_file)
      }
    }

    // Save the processed markdown into the mkdocs folder with filename as uuid of note
    if (Object.keys(parsed_yaml).includes("share") || build_full_site == true) {
      // #TODO will the line below stop memes from receiving UUID's if they are not shared when building site?
      if (parsed_yaml["share"] == true || build_full_site == true) {
        // If there is already a UUID in the markdown file YAML
        if (!Object.keys(parsed_yaml).includes("uuid")) {
          // If there is not a UUID in the original markdown file add one
          parsed_yaml.uuid = uuidv4();
          let yaml_string = yaml.stringify(parsed_yaml).slice(0, -1)
          let new_md_file = replaceYamlFrontMatter(doc.toString(), yaml_string)
          await fs.writeFile(filepaths[i], new_md_file)
        }
        // We get the note_title here because if share:false we do not need to do this processing
        // We have if statement because title can be hard coded in the original yaml
        if (!Object.keys(parsed_yaml).includes("title")) {
          // If title is not in the file add it
          let note_title = filepaths[i].split('/')
          note_title = note_title[note_title.length - 1]
          note_title = note_title.split('.')[0]
          parsed_yaml.title = note_title
        }
        let yaml_string = yaml.stringify(parsed_yaml).slice(0, -1)
        let new_md_file = replaceYamlFrontMatter(doc.toString(), yaml_string)
        await fs.writeFile(`${out_path}/${mkfiles_directory_name}/${parsed_yaml.uuid}.md`, new_md_file)
        site_data.uuid_list.push(parsed_yaml.uuid)
        site_data.filepath_uuid[filepaths[i].split('/').slice(offset_index).join('/')] = parsed_yaml.uuid
        site_data.filename_uuid[filepaths[i].split('/').pop().split('.')[0]] = parsed_yaml.uuid
      }
    }
    console.log(`Parsed ${filepaths[i]}`)
  }



  // Add in embedded notes and replace wikilinks with markdown links to UUID markdown file



  let test_obj = {
    "Dentropy's Blog Posts and Videos" : "TEST1",
    "Dentropy's Projects" : "TEST2",
    "Dentropy Deamon Intro" : "TEST3",
    "Dentropy's Favorite Apps" : "TEST4"
  }

  // Embedding Notes
  for(var i = 0; i < site_data.uuid_list.length; i++){
    console.log(`Performing addInEmbeddedNotes on ${out_path}/${mkfiles_directory_name}/${site_data.uuid_list[i]}.md`)
    let doc = await fs.readFile(`${out_path}/${mkfiles_directory_name}/${site_data.uuid_list[i]}.md`)
    doc = await addInEmbeddedNotes(site_data, doc.toString())

    // Changing WikiLinks to connect to UUID filename
    console.log(`Performing replaceWikiLinks on ${out_path}/${mkfiles_directory_name}/${site_data.uuid_list[i]}.md`)
    let wikilinks = extractWikiLinksFromMarkdown(doc.toString())
    for(var k = 0; k < wikilinks.length; k++){
      wikilinks[k].link = site_data.filename_uuid[wikilinks[k].link] 
    }
    console.log(`wikilinks ${wikilinks}`)
    let raw_links = []
    for(var j = 0; j < wikilinks.length; j++){
      raw_links.push(`[${wikilinks[j].text}](/${wikilinks[j].link})`)
    }
    console.log(`raw_links: ${raw_links}`)
    let result = replaceWikiLinks(doc.toString(), raw_links)
    await fs.writeFile(`${out_path}/${mkfiles_directory_name}/${site_data.uuid_list[i]}.md`, result)
  };

  // Checking for images in markdown documents
  site_data.images = []
  for(var i = 0; i < site_data.uuid_list.length; i++){
    console.log(`Performing addInEmbeddedNotes on ${out_path}/${mkfiles_directory_name}/${site_data.uuid_list[i]}.md`)
    let doc = await fs.readFile(`${out_path}/${mkfiles_directory_name}/${site_data.uuid_list[i]}.md`)
    
    let extracted_images = extractImagesFromMarkdown(doc)
    if ( extracted_images.length > 0) {
      site_data.images.push( { 
        note_uuid : site_data.uuid_list[i],
        image_links : extracted_images
      } )
    }

    
    // Check if extracted_images are file system images or links

    // Move files over to site folder

    };



  // Generate site_date.site_hierarchy, note this is not technically required

  Object.keys(site_data.filepath_uuid).forEach(key => {
    const value = site_data.filepath_uuid[key];
    console.log(`site_hierarchy key:${key},  value:${value} added`);
    let key_from_pkm_path = key.replace("/home/paul/Documents/", "");
    let split_filepath = key_from_pkm_path.split('/')
    createRecursiveObject(site_data.site_hierarchy, split_filepath, value);
  });



  await fs.writeFile(`${out_path}/site_data.json`, JSON.stringify(site_data, null, 2));
  console.log("Added site_data.json")
  console.log(util.inspect(site_data, {showHidden: false, depth: null, colors: true}))
  await fs.copyFile(`${out_path}/${mkfiles_directory_name}/${site_data.filename_uuid["index"]}.md`, `${out_path}/index.md`)
  await fs.copyFile(`${out_path}/${mkfiles_directory_name}/${site_data.filename_uuid["index"]}.md`, `${out_path}/${mkfiles_directory_name}/index.md`)
  console.log("Added index.md files")

  let note_filepaths = Object.keys(site_data.filepath_uuid)
  note_filepaths = note_filepaths.sort()


  let notes_with_metadata = []
  note_filepaths.forEach(note_path => {
    notes_with_metadata.push({
      note_path: note_path,
      uuid:  site_data.filepath_uuid[note_path],
      parsed: String(note_path).split('/'),
      parsed_length: String(note_path).split('/').length
    })  
  })
  notes_with_metadata.sort((a, b) => a.parsed_length - b.parsed_length);
  notes_with_metadata.reverse()



  let test_yaml = [{
    "Section": [
      "section/index", {
        Page1: "page1-uuid"
      }, {
        Page2: "page2-uuid"
      }
    ]
  }]



  /// CHAT GPT Functions

  // Initialize the data structure
  let fileStructure = [];

  // Function to add a file path and its contents to the file structure
  function addFilePath(filePath, contents) {
    let currentLevel = fileStructure;

    // Split the file path into individual directory names
    const directories = filePath.split('/');

    // Remove the filename from the directories array
    const fileName = directories.pop();

    // Loop through each directory in the file path
    for (const directory of directories) {
      // Check if the directory already exists at the current level
      const existingDirectory = currentLevel.find(item => item.hasOwnProperty(directory));

      // If the directory doesn't exist, create it
      if (!existingDirectory) {
        const newDirectory = {};
        newDirectory[directory] = [];
        currentLevel.push(newDirectory);
        currentLevel = newDirectory[directory];
      } else {
        // If the directory exists, move to the next level
        currentLevel = existingDirectory[directory];
      }
    }

    // Add the file to the final level
    const file = {};
    file[fileName] = contents;
    currentLevel.push(file);
  }

  // Usage example
  // addFilePath('one/two/three/hello.txt', 'qwerty');
  // addFilePath('one/two/four/example.txt', '12345');
  // addFilePath('one/five/another.txt', 'abcdef');
  // console.log(JSON.stringify(fileStructure, null, 2));

  /// END CHAT GPT

  notes_with_metadata.forEach(note => {
    addFilePath(note.note_path, note.uuid);
  })

  const yamlData = yaml.stringify(fileStructure);
  let mkdocs_yml = await fs.readFile('./mkdocs-bak.yml')
  await fs.writeFile(`${out_path}/mkdocs.json`, JSON.stringify(fileStructure, null, 2)); // This is technically not used, but a nice to have
  await fs.writeFile(`${out_path}/mkdocs.yaml`, mkdocs_yml + "\n" + yamlData);
  console.log("Built mkdocs.yaml")
  console.log("Built Markdown Completed Successfully")
  process.exit(0);
}

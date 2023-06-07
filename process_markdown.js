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
//import yaml from 'js-yaml'

// Manual Settings
const pattern = '/home/paul/Documents/Root/**/*.md';
const offset_index = 5;
const out_path = './dentropy.github.io'
const mkfiles_directory_name = 'markdown_files'
// const pattern = 'index.md';     // For Testing
// const out_path = "./out/docs"   // For Testing
// Thank you #ChatGPT https://sharegpt.com/c/oOmLLUc
await fs.mkdir(out_path, { recursive: true });
await fs.mkdir(`${out_path}/${mkfiles_directory_name}`, { recursive: true });


// Helper Functions



function replaceYamlFrontMatter(markdownContent, newFrontMatter) {
  // Match YAML front matter using regular expression
  const regex = /^---\n([\s\S]+?)\n---\n/;
  
  // Replace the YAML front matter with the new front matter
  return markdownContent.replace(regex, `---\n${newFrontMatter}\n---\n`);
}

// Thank you #ChatGPT https://sharegpt.com/c/oPDZdLS
function extractWikiLinksFromMarkdown(content) {
  // Regular expression to match wiki links
  const wikiLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

  // Array to store extracted wiki links
  const wikiLinks = [];

  // Iterate over each match and extract the link and text
  let match;
  while ((match = wikiLinkRegex.exec(content))) {
    const link = match[1];
    const text = match[2] || link; // If no text is provided, use the link itself
    wikiLinks.push({ link, text });
  }

  return wikiLinks;
}

function removeYamlFromMarkdown(markdown) {
  const lines = markdown.trim().split('\n');

  if (lines[0].trim() === '---') {
    let index = lines.indexOf('---', 1);
    if (index !== -1) {
      lines.splice(0, index + 1);
    }
  }

  const updatedMarkdown = lines.join('\n').trim();
  return updatedMarkdown;
}

// Function to update wikilinks with markdown links, with help from #ChatGPT
async function addInEmbeddedNotes(content) {
  // Find Embeds
  // Regular expression to match wiki links
  let wikiLinkRegex = /\!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
  // Array to store extracted wiki links
  let wikiEmbeds = [];
  // Iterate over each match and extract the link and text
  let match;
  while ((match = wikiLinkRegex.exec(content))) {
    const link = match[1];
    const text = match[2] || link; // If no text is provided, use the link itself
    wikiEmbeds.push({ link, text });
  }
  let replacements = wikiEmbeds

  
  // Find note to embed
  for(var k = 0; k < wikiEmbeds.length; k++){
    wikiEmbeds[k].link = site_data.filename_uuid[wikiEmbeds[k].link] 
  }
  let raw_links = []
  for(var j = 0; j < wikiEmbeds.length; j++){
    console.log("wikiEmbeds")
    console.log(wikiEmbeds)
    let file_contents = "No File Found"
    try {
      file_contents = await fs.readFile(out_path + "/markdown_files/" + wikiEmbeds[j].link +".md")
    } catch (error) {
      console.log("Could not find file error")
      console.log(String(error))
    }
    raw_links.push(removeYamlFromMarkdown(String(file_contents)))
  }


  // Replace Embeds
  wikiLinkRegex = /\!\[\[.*?\]\]/g;
  const regex = new RegExp(wikiLinkRegex, 'g');
  const matches = content.match(regex);
  const count = matches ? matches.length : 0;
  const singleWikiLinkRegex = /\!\[\[.*?\]\]/;
  for(var i = 0; i < raw_links.length; i++){
    content = content.replace(singleWikiLinkRegex, raw_links[i]);
  }
  console.log(count)
  return content;
}

// Function to update wikilinks with markdown links, with help from #ChatGPT
function replaceWikiLinks(content, replacements) {
  const wikiLinkRegex = /\[\[.*?\]\]/g;
  const regex = new RegExp(wikiLinkRegex, 'g');
  const matches = content.match(regex);
  const count = matches ? matches.length : 0;
  const singleWikiLinkRegex = /\[\[.*?\]\]/;
  for(var i = 0; i < replacements.length; i++){
    content = content.replace(singleWikiLinkRegex, replacements[i]);
  }
  console.log(count)

  return content;
}

function createRecursiveObject(obj, keys, uuid) {
  if (keys.length === 0) {
    obj.uuid = uuid
    return obj; // Return the final object
  }
  const currentKey = keys[0];
  if (!obj.hasOwnProperty(currentKey) || typeof obj[currentKey] !== 'object') {
    obj[currentKey] = {}; // Create the property if it doesn't exist or is not an object
  }

  return createRecursiveObject(obj[currentKey], keys.slice(1), uuid);
}

// https://sharegpt.com/c/fsZTWHu
function extractImagesFromMarkdown(markdownString) {
  const imageUrls = [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  let match;

  while ((match = imageRegex.exec(markdownString)) !== null) {
    imageUrls.push(match[1]);
  }

  return imageUrls;
}



// Real stuff starts here



// Get all markdown files
const filepaths = glob.sync(pattern);

let site_data = {
  uuid_list : [],
  filename_uuid : {},
  filepath_uuid : {},
  site_hierarchy : {}
}


for (var i = 0; i < filepaths.length; i++) {
  // for(var i = 0; i < 100; i++) { // For Testing on large PKM

  // Read markdown file and turn it into syntax tree
  let doc = await fs.readFile(filepaths[i])
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
  if (Object.keys(parsed_yaml).includes("share")) {
    if (parsed_yaml["share"] == true) {
      // If there is already a UUID in the markdown file YAML
      if (!Object.keys(parsed_yaml).includes("uuid")) {
        // If there is not a UUID in the original markdown file add one
        parsed_yaml.uuid = uuidv4();
        let yaml_string = yaml.stringify(parsed_yaml).slice(0, -1)
        let new_md_file = replaceYamlFrontMatter(doc.toString(), yaml_string)
        await fs.writeFile(filepaths[i], new_md_file)
      }
      // We get the note_title here because if share:false we do not need to do this processing
      let note_title = filepaths[i].split('/')
      note_title = note_title[note_title.length - 1]
      note_title = note_title.split('.')[0]
      parsed_yaml.title = note_title
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
  doc = await addInEmbeddedNotes(doc.toString())

  // Changing WikiLinks to connect to UUID filename
  console.log(`Performing replaceWikiLinks on ${out_path}/${mkfiles_directory_name}/${site_data.uuid_list[i]}.md`)
  let wikilinks = extractWikiLinksFromMarkdown(doc.toString())
  for(var k = 0; k < wikilinks.length; k++){
    wikilinks[k].link = site_data.filename_uuid[wikilinks[k].link] 
  }
  let raw_links = []
  for(var j = 0; j < wikilinks.length; j++){
    raw_links.push(`[${wikilinks[j].text}](/${wikilinks[j].link})`)
  }
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



await fs.writeFile(`${out_path}/site_data.json`, JSON.stringify(site_data));
console.log("Added site_data.json")
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
// console.log(JSON.stringify(fileStructure));

/// END CHAT GPT

notes_with_metadata.forEach(note => {
  addFilePath(note.note_path, note.uuid);
})

const yamlData = yaml.stringify(fileStructure);
let mkdocs_yml = await fs.readFile('./mkdocs-bak.yml')
await fs.writeFile(`${out_path}/mkdocs.json`, JSON.stringify(fileStructure)); // This is technically not used, but a nice to have
await fs.writeFile(`${out_path}/mkdocs.yaml`, mkdocs_yml + "\n" + yamlData);
console.log("Built mkdocs.yaml")
console.log("Built Markdown Completed Successfully")

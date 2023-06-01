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

// Manual Settings
// const pattern = 'index.md';
const pattern = 'pkm/**/*.md';
const offset_index = 2;
// const out_path = "./out/docs"
const out_path = './site/docs'
// Thank you #ChatGPT https://sharegpt.com/c/oOmLLUc
await fs.mkdir(out_path, { recursive: true });



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
    let file_contents = "No File Found"
    try {
      file_contents = await fs.readFile(out_path + wikiEmbeds[j].link +".md")
    } catch (error) {
      console.log("Could not find file")
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
  if (Object.keys(parsed_yaml).includes("share")) {
    if (parsed_yaml["share"] == true) {
      // If there is already a UUID in the markdown file YAML
      if (!Object.keys(parsed_yaml).includes("uuid")) {
        // If there is not a UUID in the original markdown file add one
        parsed_yaml.uuid = uuidv4();
        let yaml_string = yaml.stringify(parsed_yaml).slice(0, -1)
        let new_md_file = replaceYamlFrontMatter(doc.toString(), yaml_string)
        await fs.writeFile(filepaths[i], new_md_file)
        doc = await fs.readFile(filepaths[i])
      }
      await fs.writeFile(`${out_path}/${parsed_yaml.uuid}.md`, doc)
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

for(var i = 0; i < site_data.uuid_list.length; i++){
  // Embedding Notes
  console.log(`Performing addInEmbeddedNotes on ${out_path}/${site_data.uuid_list[i]}.md`)
  let doc = await fs.readFile(`${out_path}/${site_data.uuid_list[i]}.md`)
  doc = await addInEmbeddedNotes(doc.toString())

  // Changing WikiLinks to connect to UUID filename
  console.log(`Performing replaceWikiLinks on ${out_path}/${site_data.uuid_list[i]}.md`)
  let wikilinks = extractWikiLinksFromMarkdown(doc.toString())
  for(var k = 0; k < wikilinks.length; k++){
    wikilinks[k].link = site_data.filename_uuid[wikilinks[k].link] 
  }
  let raw_links = []
  for(var j = 0; j < wikilinks.length; j++){
    raw_links.push(`[${wikilinks[j].text}](../pages/${wikilinks[j].link})`)
  }
  let result = replaceWikiLinks(doc.toString(), raw_links)
  await fs.writeFile(`${out_path}/${site_data.uuid_list[i]}.md`, result)
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
await fs.copyFile(`${out_path}/docs/${site_data.filename_uuid["index"]}.md`, "${out_path}/docs/index.md")
await fs.copyFile(`${out_path}/docs/${site_data.filename_uuid["index"]}.md`, "${out_path}/index.md")
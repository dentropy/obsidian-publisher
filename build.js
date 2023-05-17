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

// Thank you #ChatGPT https://sharegpt.com/c/oOmLLUc
await fs.mkdir("./out/docs", { recursive: true });

// Thank you #ChatGPT
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


// Get all markdown files
const pattern = 'pkm/**/*.md';
// const pattern = 'index.md';
const filepaths = glob.sync(pattern);

console.log("filepaths")
console.log(filepaths)
console.log("Done filepaths\n")

let site_data = {
  uuid_list : [],
  filename_uuid : {},
  filepath_uuid : {},
  site_hierarchy : {}
}

for(var i = 0; i < filepaths.length; i++) {
// for(var i = 0; i < 100; i++) {
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
    if ( Object.keys(parsed_yaml).includes("share") )  {
      if (parsed_yaml["share"] == true){
        if (Object.keys(parsed_yaml).includes("uuid")){
          // site_data.markdown_syntax_tree[parsed_yaml.uuid] = tree
          // site_data.raw_markdown[parsed_yaml.uuid] = doc
          await fs.writeFile(`./out/docs/${parsed_yaml.uuid}.md`, doc)
          site_data.uuid_list.push(parsed_yaml.uuid)
          site_data.filepath_uuid[filepaths[i]] = parsed_yaml.uuid
          site_data.filename_uuid[filepaths[i].split('/').pop().split('.')[0]] = parsed_yaml.uuid
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
          // site_data.markdown_syntax_tree[parsed_yaml.uuid] = tree
          // site_data.raw_markdown[parsed_yaml.uuid] = doc
          await fs.writeFile(`./out/docs/${parsed_yaml.uuid}.md`, doc)
          site_data.uuid_list.push(parsed_yaml.uuid)
          site_data.filepath_uuid[filepaths[i]] = parsed_yaml.uuid
          site_data.filename_uuid[filepaths[i].split('/').pop().split('.')[0]] = parsed_yaml.uuid
        }
      }
      console.log(`Parsed ${filepaths[i]}`)
    }
}

let test_obj = {
  "Dentropy's Blog Posts and Videos" : "TEST1",
  "Dentropy's Projects" : "TEST2",
  "Dentropy Deamon Intro" : "TEST3",
  "Dentropy's Favorite Apps" : "TEST4"
}

console.log(site_data.uuid_list)

for(var i = 0; i < site_data.uuid_list.length; i++){
  let doc = await fs.readFile(`./out/docs/${site_data.uuid_list[i]}.md`)
  let wikilinks = extractWikiLinksFromMarkdown(doc.toString())
  console.log(wikilinks)
  for(var k = 0; k < wikilinks.length; k++){
    wikilinks[k].link = site_data.filename_uuid[wikilinks[k].link] 
  }
  let raw_links = []
  for(var j = 0; j < wikilinks.length; j++){
    raw_links.push(`[${wikilinks[j].text}](../${wikilinks[j].link})`)
  }
  console.log("replaceWikiLinks")
  let result = replaceWikiLinks(doc.toString(), raw_links)
  await fs.writeFile(`./out/docs/${site_data.uuid_list[i]}.md`, result)
};

await fs.writeFile('./out/site_data.json', JSON.stringify(site_data));
await fs.copyFile(`./out/docs/${site_data.filename_uuid["index"]}.md`, "./out/docs/index.md")
await fs.copyFile(`./out/docs/${site_data.filename_uuid["index"]}.md`, "./out/index.md")
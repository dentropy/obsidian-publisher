import fs from 'node:fs/promises'

import { removeYamlFromMarkdown } from "./removeYamlFromMarkdown.js";

// Function to update wikilinks with markdown links, with help from #ChatGPT
export async function addInEmbeddedNotes(site_data, content) {
  // Find Embeds
  // Regular expression to match wiki links
  let wikiLinkRegex = /\!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
  // Array to store extracted wiki links
  let wikiEmbeds = [];
  // Iterate over each match and extract the link and text
  let match;
  while ((match = wikiLinkRegex.exec(content))) {
    console.log(`match ${match[0]}`)
    console.log(`match ${match[1]}`)
    console.log(`match ${match[2]}`)
    let link = match[1];
    let text = match[2] || link; // If no text is provided, use the link itself
    let heading = ''
    if ( text.includes('#') ){
      text = match[1].split('#')[0];
      link = text;
      heading = match[1].split('#')[1];
    }
    wikiEmbeds.push({ link, text, heading });
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
      // This is where we process the heading
      // We need the Syntax Tree
      // We need to search syntax tree for the heading
      // Then we need to reassemble the markdown file from the syntax tree
      file_contents = await fs.readFile(out_path + "/markdown_files/" + wikiEmbeds[j].link +".md")

      if(wikiEmbeds.heading != ''){
        let mk_tree = fromMarkdown(file_contents, {
          extensions: [frontmatter(['yaml', 'toml']), syntax()],
          mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
        })
        let sub_mk_doc = {
          type: 'root',
          children: []
        }
        for(var item_index = 0; item_index < mk_tree.children.length; item_index++){
          if(mk_tree.children[item_index].type == 'heading'){
            if (mk_tree.children[item_index].children[0].value.includes(wikiEmbeds[j].heading)){
              sub_mk_doc.children.push(mk_tree.children[item_index])
              while(mk_tree.children[item_index + 1].type != 'heading' && item_index < mk_tree.children.length){
                sub_mk_doc.children.push(mk_tree.children[item_index + 1])
                item_index += 1
              }
            }
          }
        }
        file_contents = toMarkdown(sub_mk_doc)
      }
    
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

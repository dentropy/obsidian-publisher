import fs from 'fs'

// Markdown Stuff
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import { removeYamlFromMarkdown } from "./removeYamlFromMarkdown.js";

export async function addInEmbeddedNotes(out_path, wikiEmbeds, content) {
  let raw_links = []
  for(var j = 0; j < wikiEmbeds.length; j++){
    let file_contents = "No Meme File Found"
    try {
      // This is where we process the heading
      // We need the Syntax Tree
      // We need to search syntax tree for the heading
      // Then we need to reassemble the markdown file from the syntax tree
      file_contents = await fs.readFileSync(out_path + "/markdown_files/" + wikiEmbeds[j].link +".md")
      if(wikiEmbeds[j].heading != ''){
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
  let wikiLinkRegex = /\!\[\[.*?\]\]/g;
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

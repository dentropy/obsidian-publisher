// Markdown Stuff
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import { removeYamlFromMarkdown } from "./removeYamlFromMarkdown.js";


/*
We need to both loop through the list as well as the dictionary.
*/
function recursive_when_children_exists(mk_tree, heading_to_check){
    // console.log("RECURSION_START")
    // console.log(mk_tree.length)
    for(var i = 0; i < mk_tree.length; i++){
        // console.log("TYPE CHECK")
        // console.log(mk_tree[i].type)
        if( mk_tree[i].type == "heading" ){
            console.log("MAH HEADING")
            console.log(mk_tree[i].children[0].value.toLowerCase())
            // console.log(mk_tree[i])
            if( mk_tree[i].children[0].value.toLowerCase().includes(heading_to_check.toLowerCase()) ){
                return {
                    type: 'root',
                    children: mk_tree.slice(i, i + 2)//mk_tree.length - 1)
                }
            }
        }
        if(Object.keys(mk_tree[i]).includes("children")){
            recursive_when_children_exists(mk_tree[i].children, heading_to_check)
        }
    }
}

export async function getEmbeddedMarkdown(content, heading_to_check){
    if (heading_to_check == ""){
        return removeYamlFromMarkdown(content)
    }
    let my_mk_tree = fromMarkdown(content, {
        extensions: [frontmatter(['yaml', 'toml']), syntax()],
        mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
      })
    let get_sub_markdown = recursive_when_children_exists(my_mk_tree.children, heading_to_check)
    if(get_sub_markdown != undefined){
        let rendered_markdown = await toMarkdown(get_sub_markdown)
        return rendered_markdown
    }
    return "CAN'T FIND NODE TO EMBED"
}
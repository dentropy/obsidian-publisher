/* 

* Get CLI Arguments
* Setup SQLite Database
* Glob all the files
* Loop through all the globbed files
  * if the groups match and is public
    * Save node to database
* Loop through nodes in database
    * Find Links
      * If Embed
        * Insert edge table
        * Update Node table
      * If Image
        * Inser Images table
        * Move image over on file system
      * If internal Link
        * Insert edge table
        * Update Node Table
* Loop through edges in database
    * Add Backlinks to files
* Loop through nodes in database
    * Write the markdown files to database

*/

import create_schema_queries from './scripts/create_schema_queries.js';
import fs from 'fs'
import { glob } from 'glob';
import Database from 'better-sqlite3';

// Import Custom Modules
import { addInEmbeddedNotes } from './lib/addInEmbeddedNotes.js';
import { extractWikiLinksFromMarkdown } from './lib/extractWikiLinksFromMarkdown.js';
import { replaceWikiLinks } from './lib/replaceWikiLinks.js';
import { generateBasicSiteData } from './lib/generateBasicSiteData.js';
import { removeYamlFromMarkdown } from './lib/removeYamlFromMarkdown.js';
import { extractYamlFromMarkdown } from './lib/extractYamlFromMarkdown.js';
import { extractEmbeddedLinksFromMarkdown } from './lib/extractEmbeddedLinksFromMarkdown.js';


// Verification Functions
import { shared_verification_function } from './verification_functions/shared_verification_function.js';
import { all_files_verification_function } from './verification_functions/all_files_verification_function.js';
import { groups_verification_function } from './verification_functions/groups_verification_function.js';
import { groups_verification_function_not_shared } from './verification_functions/groups_verification_function_not_shared.js';


// Markdown Stuff
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'


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
let db_file_path = in_path + 'pkm.sqlite'
if (  (Object.keys(options).includes("dbfilepath"))  ){
  db_file_path = options.dbfilepath
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
let groups_to_publish = []
if (  (Object.keys(options).includes("groupstopublish"))  ){
  groups_to_publish = options.groupstopublish.split(' ')
}

async function build() {
    console.log(`pattern: ${pattern}`)
    console.log(`out_path: ${out_path}`)
    console.log(`offset_index: ${offset_index}`)
    console.log(`mkfiles_directory_name: ${mkfiles_directory_name}`)
    console.log(`db_file_path: ${db_file_path}`)

    // * Setup SQLite Database
    const db = await new Database(db_file_path);
    await create_schema_queries.forEach(async (query) => {
        // console.log(query)
        const tmp_stmt = await db.prepare(query);
        const info = await tmp_stmt.run();
    })


    //* Glob all the files
    let note_files = await glob.sync(in_path + '**/*.md')
    // console.log(JSON.stringify(note_files, null, 2))

    // Select verification function
    console.log("Setting check_rbac function")
    let check_rbac = function() {return false}
    if (build_full_site == true){
        console.log("all_files_verification_function")
      // site_data = await generateBasicSiteData(pattern, all_files_verification_function, offset_index)
      check_rbac = all_files_verification_function
    } 
    else {
      if (groups_to_publish.length != 0){
        if(options.not_public){
          console.log("groups_verification_function_not_shared")
          //site_data = await generateBasicSiteData(pattern, groups_verification_function_not_shared, offset_index, groups_to_publish)
          check_rbac = groups_verification_function_not_shared
        }
        else {
            console.log("groups_verification_function")
          // site_data = await generateBasicSiteData(pattern, groups_verification_function, offset_index, groups_to_publish)
          check_rbac = groups_verification_function
        }
      }
      else {
        console.log("shared_verification_function")
        // site_data = await generateBasicSiteData(pattern, shared_verification_function, offset_index)
        check_rbac = shared_verification_function
      }
    }

    // * Loop through all the globbed files
    // * if the groups match and is public
    //   * Save node to database
    for(var i = 0; i < note_files.length; i++){
        // Read YAML to JSON
        let raw_markdown = await fs.readFileSync(note_files[i])
        let parsed_yaml =  extractYamlFromMarkdown(raw_markdown.toString())
        // if Check file with check_rbac
        if( check_rbac(parsed_yaml, groups_to_publish)  ){
            // Save to database
            let insert_node_statement = db.prepare(`
                INSERT INTO markdown_nodes (
                id,
                raw_markdown,
                full_file_path,
                title,
                yaml_json
                ) VALUES (?, ?, ?, ?, json(?));`)
            await  insert_node_statement.run(
                parsed_yaml.uuid, 
                raw_markdown.toString(),
                note_files[i],
                note_files[i],
                JSON.stringify(parsed_yaml));
            }
        }


    // Select all nodes in database
    const select_all_nodes = db.prepare('SELECT * FROM markdown_nodes;');
    const all_nodes_list = select_all_nodes.all();
    // console.log("all_nodes_list")
    // console.log(all_nodes_list)
    let all_nodes = {}
    for(var i = 0; i < all_nodes_list.length; i++){
        all_nodes[  all_nodes_list[i].id  ] = all_nodes_list[i]
    }
    // console.log(JSON.stringify(all_nodes, null, 2))


    // console.log("all_nodes")
    // console.log(all_nodes)


    // * Loop through nodes in database
    let site_data = await generateBasicSiteData(pattern, check_rbac, offset_index, groups_to_publish)

    // console.log("Raw site_data")
    // console.log(site_data)

    for(var i = 0; i < Object.keys(all_nodes).length; i++){
        // console.log("My Node")
        // console.log(all_nodes[ Object.keys(all_nodes)[i] ])

        // * Find Embedded Links
      
        let wikiLinkRegex = /\!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
        // Array to store extracted wiki links
        let wikiEmbeds = [];
        // Iterate over each match and extract the link and text
        let match;
        // console.log(all_nodes[  Object.keys(all_nodes)[i]  ])
        while ((match = wikiLinkRegex.exec(  all_nodes[  Object.keys(all_nodes)[i]  ].raw_markdown  ))) {
          // console.log(`embedded match ${match[0]}`)
          // console.log(`embedded match ${match[1]}`)
          // console.log(`embedded match ${match[2]}`)
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


        console.log("wikiEmbeds")
        console.log(wikiEmbeds)

        
        if( wikiEmbeds.length == 0){
            console.log("NO EMBED IN THIS DOCUMENT")
        }
        else {
            console.log("Found Embed")
            // Check if IF of embedded note exists

            for(var j = 0; j < wikiEmbeds.length; j++){
              let file_contents = all_nodes[  Object.keys(all_nodes)[i]  ].raw_markdown;
              console.log("file_contents pre processing")
              console.log(file_contents)
              if(wikiEmbeds[j].heading != ''){
                let mk_tree = fromMarkdown(file_contents, {
                  extensions: [frontmatter(['yaml', 'toml']), syntax()],
                  mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
                })
                console.log("\n\nmk_tree")
                console.log(  JSON.stringify( mk_tree, null, 2 )  )

                let sub_mk_doc = {
                  type: 'root',
                  children: []
                }


                // We need to get all the values for everything in the syntax tree
                // We should use natural recursion, then have an if statement
                let list_of_indexes = []
                let mk_index_count = 0
                function find_embedded_link( tmp_mk_doc ){
                  /*
                    if ![[ are included
                      // Update the object
                    else:
                      check for chilren
                      contiunoue down the root dict
                  */
                 console.log("Object.keys(tmp_mk_doc)")
                 console.log(Object.keys(tmp_mk_doc))
                 if(  Object.keys(tmp_mk_doc).includes("children")  ){
                  console.log("FOUND CHILDREN")
                  for(var i = 0; i < tmp_mk_doc.children.length; i++) {
                    if(  Object.keys(tmp_mk_doc).includes("value")  ) {
                      if( tmp_mk_doc.value.includes("![[" )){
                        console.log("FOUND ONE 1")
                        find_embedded_link ( tmp_mk_doc.children[i] )
                      }
                    }
                  }
                 }
                 else {
                  if(  Object.keys(tmp_mk_doc).includes("children")  ) {
                    if( tmp_mk_doc.value.includes("![[" )){
                        console.log("FOUND ONE 2")
                    }
                  }
                  }
                }
                find_embedded_link(mk_tree)


                for(var item_index = 0; item_index < mk_tree.children.length; item_index++){
                  console.log("For loop mk_tree")
                  console.log(mk_tree.children[item_index].type)
                  console.log(mk_tree.children[item_index])
                  if(mk_tree.children[item_index].type == 'heading' || mk_tree.children[item_index].type == 'text'){
                    console.log("mk_tree heading")
                    console.log(mk_tree.children[item_index])
                    if (mk_tree.children[item_index].children[0].value.includes(wikiEmbeds[j].heading)){
                      sub_mk_doc.children.push(mk_tree.children[item_index])
                      while(mk_tree.children[item_index + 1].type != 'heading' && item_index < mk_tree.children.length){
                        sub_mk_doc.children.push(mk_tree.children[item_index + 1])
                        item_index += 1
                      }
                    }
                  }
                }
                console.log("sub_mk_doc")
                console.log(sub_mk_doc)
                file_contents = toMarkdown(sub_mk_doc)
                console.log("file_contents processed")
                console.log(file_contents)
              }
            }
            // if (site_data.embedded_note_links[site_data.uuid_list[i]] != []){
            //     site_data.embedded_note_links[site_data.uuid_list[i]] = wikiEmbeds
            // }
            // else {
            //     site_data.embedded_note_links[site_data.uuid_list[i]].concat(wikiEmbeds)
            // }
            // doc = await addInEmbeddedNotes(out_path, wikiEmbeds, doc.toString())
        }

        //   * If Image
        //     * Insert Images table
        //     * Move image over on file system
        //   * If Embed
        //     * Insert edge table
        //     * Update Node table
        //   * If internal Link
        //     * Insert edge table
        //     * Update Node Table
    }
    

    await fs.mkdirSync(out_path, { recursive: true });
    await fs.mkdirSync(`${out_path}/${mkfiles_directory_name}`, { recursive: true });


}

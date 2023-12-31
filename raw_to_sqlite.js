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
        * Update Content for Node table
      * If internal Link
        * Insert edge table
        * Update Node Table
      * If Image
        * Insert Images table
        * Move image over on file system
        * Copy binary image into SQLite
* Loop through nodes in database
    * Write the markdown files to filesystem

*/

import create_schema_queries from './scripts/create_schema_queries.js';
import fs from 'fs'
import { glob } from 'glob';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import yaml from 'yaml';

// Import Custom Modules
import { extractYamlFromMarkdown } from './lib/extractYamlFromMarkdown.js';
import { createRecursiveObject } from './lib/createRecursiveObject.js';
import { removeYamlFromMarkdown } from './lib/removeYamlFromMarkdown.js'


// Verification Functions
import { shared_verification_function } from './verification_functions/shared_verification_function.js';
import { all_files_verification_function } from './verification_functions/all_files_verification_function.js';
import { groups_verification_function } from './verification_functions/groups_verification_function.js';
import { groups_verification_function_not_shared } from './verification_functions/groups_verification_function_not_shared.js';


// New Markdown Stuff
import { embeddedLinksFind } from "./lib/embeddedLinksFind.js"
import { embeddedLinksReplace } from "./lib/embeddedLinksReplace.js"
import { getEmbeddedMarkdown } from "./lib/getEmbeddedMarkdown.js" 
import { internalLinksFind } from "./lib/internalLinksFind.js"
import { internalLinksReplace } from "./lib/internalLinksReplace.js"

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
    await fs.mkdirSync(out_path, { recursive: true });
    // await fs.mkdirSync(`${out_path}/docs/assets/images`, { recursive: true });
    await fs.mkdirSync(`${out_path}/${mkfiles_directory_name}/assets`, { recursive: true });
    
    
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

        // Add uuid's to files missing them
        if(!Object.keys(parsed_yaml).includes("uuid")){
          parsed_yaml.uuid = uuidv4();
          parsed_yaml.share = false
          let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' +  removeYamlFromMarkdown( raw_markdown.toString())
          await fs.writeFileSync(note_files[i], new_md_file)
        }


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
            let title_split = note_files[i].split("/")
            let title_split2 = title_split[title_split.length - 1].split(".")
            title_split2.pop()
            let title = title_split2.join(".")
            await  insert_node_statement.run(
                parsed_yaml.uuid, // id
                raw_markdown.toString(), // raw_markdown
                note_files[i], // full_file_path
                title, // title
                JSON.stringify(parsed_yaml));
            }
        }

    // Select all nodes in database
    let select_all_nodes = db.prepare('SELECT * FROM markdown_nodes;');
    let all_nodes_list = select_all_nodes.all();
    // console.log("all_nodes_list")
    // console.log(all_nodes_list)
    let all_nodes = {}
    for(var i = 0; i < all_nodes_list.length; i++){
        all_nodes[  all_nodes_list[i].id  ] = all_nodes_list[i]
    }
    // console.log(JSON.stringify(all_nodes, null, 2))

/*

* Loop through nodes in database
    * Get list of all content_assets
    * Create update_embedded_list
    * Check Embeded Note or Embedded Image
      * Check nodes for matching node with title
          * Insert edge table
          * Add to update embedded list
      * Check content_assets for matching file_name
          * Insert edge table
          * Add to update embedded list
    * Get all internal markdown links
      * Check nodes for matching node
      * Add to update internal_links_list
    * Update Node

*/
    // * Get list of all content_assets
    let asset_file_paths = await glob.sync(in_path + 'assets/**/*')
    let content_assets = []
    for( var i = 0; i < asset_file_paths.length; i++){
      let title_split = asset_file_paths[i].split("/")
      let title_split2 = title_split[title_split.length - 1]
      content_assets.push({
        path : asset_file_paths[i],
        file_name : title_split2
      })
    }
    // console.log("content_assets")
    // console.log(content_assets)
    for(var i = 0; i < Object.keys(all_nodes).length; i++){
      let current_node = all_nodes[  Object.keys(all_nodes)[i]  ]
      let update_embedded_list = []
      let raw_markdown = current_node.raw_markdown
      let embed_links = embeddedLinksFind(raw_markdown)
      // * Loop through embeds
      if(embed_links.length > 0){

        // console.log("embed_links")
        // console.log(embed_links)

        for(var embedded_index = 0; embedded_index < embed_links.length; embedded_index++){

          // * Check for title in Nodes table
          const select_ids_query = `SELECT id, raw_markdown, yaml_json FROM markdown_nodes WHERE title COLLATE NOCASE = '${embed_links[embedded_index].link}';`
          const node_ids_exec = db.prepare(select_ids_query);
          let node_ids = node_ids_exec.all();

          // * Insert edge table
          let link_label = null;
          if(node_ids.length == 0 || node_ids == undefined){
            // * Check content_assets for matching file_name
            //   * Insert edge table
            //   * Add to update embedded list
            node_ids = [{
              id : null,
              yaml_json : null
            }]
            for(var k = 0; k < content_assets.length;k++){
              if(content_assets[k].file_name == embed_links[embedded_index].link){
                await fs.copyFileSync(content_assets[k].path, `${out_path}/${mkfiles_directory_name}/assets/${content_assets[k].file_name}`)
                node_ids = [{
                  id : embed_links[embedded_index].link,
                  yaml_json : JSON.stringify({
                    type : "image"
                  })
                }]
                update_embedded_list.push(`![${content_assets[k].file_name}](./assets/${content_assets[k].file_name})`)
                link_label = "IMAGE"
              }
            }
          }
          else {
            // Get specifc Markdown and append to list
            let embedded_markdown = await getEmbeddedMarkdown(node_ids[0].raw_markdown, embed_links[embedded_index].heading)
            
            // console.log("embed_links[embedded_index].heading")
            // console.log(embed_links[embedded_index].heading)
            // console.log(embedded_markdown)
            update_embedded_list.push(embedded_markdown)
            link_label = "EMBEDDED"
          }
          const insert_edge_statement = db.prepare(`
            INSERT INTO markdown_edges (
              link_id,
              label,
              from_node_id,
              from_node_metadata,
              link_mtadata,
              to_node_id,
              to_node_metadata
            ) VALUES (?, ?, ?, JSON(?), JSON(?), ?, JSON(?))`)
          await insert_edge_statement.run(
              await uuidv4(), // link_id
              link_label, // label
              current_node.id, // from_node_id
              current_node.yaml_json, // from_node_metadata
              JSON.stringify( embed_links[embedded_index] ), // link_mtadata
              node_ids[0].id, // title
              node_ids[0].yaml_json
          )
        }
      }
      let new_raw_markdown = await embeddedLinksReplace(current_node.raw_markdown, update_embedded_list)

      // console.log("\n\n\n")
      // console.log(new_raw_markdown)
      // console.log("current_node.id")
      // console.log(current_node.id)

      let internal_links = internalLinksFind(raw_markdown)
      let replacement_internal_links = []
      if(internal_links.length != 0){

        // console.log("internal_links")
        // console.log(internal_links)
        
        for(var p = 0; p < internal_links.length; p++){
        // * Check for title in Nodes table
          const select_ids_query = `SELECT id, raw_markdown, yaml_json FROM markdown_nodes WHERE title COLLATE NOCASE = '${internal_links[p].link}';`
          const node_ids_exec = db.prepare(select_ids_query);
          let node_ids = node_ids_exec.all();


          if(node_ids.length != 0){
            replacement_internal_links.push(`[${internal_links[p].text}](/${node_ids[0].id})`)
          }
          else {
            replacement_internal_links.push(`[${internal_links[p].text}](/${internal_links[p].link})`)
          }
        }
        new_raw_markdown = internalLinksReplace(new_raw_markdown, replacement_internal_links) 
        
        // console.log(new_raw_markdown)

      }


      // console.log(new_raw_markdown)
      const update_markdown_nodes_markdown = db.prepare(`
        UPDATE markdown_nodes
        SET
          rendered_markdown = ?
        WHERE
          id = ?;`)
      await update_markdown_nodes_markdown.run(
        new_raw_markdown,
        current_node.id
      )
    }

    // Select all nodes in database
    select_all_nodes = db.prepare('SELECT * FROM markdown_nodes;');
    all_nodes_list = select_all_nodes.all();
    // console.log("all_nodes_list")
    // console.log(all_nodes_list)
    all_nodes = {}
    for(var i = 0; i < all_nodes_list.length; i++){
        all_nodes[  all_nodes_list[i].id  ] = all_nodes_list[i]
    }

    for(var i = 0; i < Object.keys(all_nodes).length; i++){
      let current_node = all_nodes[  Object.keys(all_nodes)[i]  ]
      let write_path = `${out_path}/markdown_files/${current_node.id}.md`
      // console.log("write_path")
      // console.log(write_path)
      let parsed_yaml =  extractYamlFromMarkdown(  current_node.rendered_markdown  )

      // Add uuid's to files missing them
      if(!Object.keys(parsed_yaml).includes("title")){
        parsed_yaml.title = current_node.title;
        let new_md_file = '---\n' + yaml.stringify(parsed_yaml) + '---\n' +  removeYamlFromMarkdown(  current_node.rendered_markdown )
        await fs.writeFileSync(write_path, String(new_md_file)  )
      }
      else{ 
        await fs.writeFileSync(write_path, String(current_node.rendered_markdown)  )
      }



      if(current_node.title == "index"){
        await fs.writeFileSync(`${out_path}/markdown_files/index.md`, String(current_node.rendered_markdown)  )
      }
    }





    console.log("STARTING Building YAML Directory")
    let site_data = { site_hierarchy : {} }
    all_nodes_list.forEach(node => {
      const key = node.full_file_path
      const value = node.id
      
      // console.log(`site_hierarchy key:${key},  value:${value} added`);
      
      let key_from_pkm_path = key.replace(site_data.root_path, "");
      let split_filepath = key_from_pkm_path.split('/')
      
      let full_path_split = value.split("/")
      // full_path_split = full_path_split.slice(offset_index, full_path_split.length - 1)
      createRecursiveObject(site_data.site_hierarchy, split_filepath, full_path_split.join("/"));
    });

    // let note_filepaths = Object.keys(site_data.filepath_uuid)
    let note_filepaths = all_nodes_list.sort((a, b) => a.title - b.title);
    let notes_with_metadata = []
    note_filepaths.forEach(node => {

      console.log(node)
      
      notes_with_metadata.push({
        note_path: node.full_file_path.slice(0, -3),
        uuid:  node.id,
        parsed: String(node.full_file_path).split('/'),
        parsed_length: String(node.full_file_path).split('/').length
      })  
    })
    notes_with_metadata.sort((a, b) => a.parsed_length - b.parsed_length);
    notes_with_metadata.reverse()
    /// CHAT GPT Functions
  
    // Initialize the data structure
    let fileStructure = [];
    // Function to add a file path and its contents to the file structure
    function addFilePath(filePath, contents ) {
      let currentLevel = fileStructure;
  
      // Split the file path into individual directory names
      let directories = filePath.split('/');
      directories = directories.slice(offset_index,  directories.length)
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
  
    notes_with_metadata.forEach(note => {
      addFilePath(note.note_path, note.uuid);
    })
    console.log("DONE Building YAML Directory")
    const yamlData = yaml.stringify(fileStructure);
    let mkdocs_yml = await fs.readFileSync('./mkdocs-bak.yml')
    await fs.writeFileSync(`${out_path}/mkdocs.json`, JSON.stringify(fileStructure, null, 2)); // This is technically not used, but a nice to have
    await fs.writeFileSync(`${out_path}/mkdocs.yaml`, mkdocs_yml + "\n" + yamlData);
    console.log("Built mkdocs.yaml")

}

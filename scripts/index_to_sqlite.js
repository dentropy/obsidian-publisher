import Database from 'better-sqlite3';
import fs from 'fs';
import extractUrls  from "extract-urls"
import extractDomain from 'extract-domain';

// Markdown Stuff
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import { removeYamlFromMarkdown } from "../lib/removeYamlFromMarkdown.js";
import { extractYamlFromMarkdown } from '../lib/extractYamlFromMarkdown.js';

import { v4 as uuidv4 } from 'uuid';
// Thanks #ChatGPT 
// [Node.js SQLite Schema & Data - A ShareGPT conversation](https://sharegpt.com/c/12ezu5X)


import { Command } from 'commander';
const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath         <string>')
  .option('-dbf, --dbfilepath   <string>')
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

let create_table_markdown_nodes = `
CREATE TABLE IF NOT EXISTS markdown_nodes (
	id               UUID PRIMARY KEY,
	raw_markdown     TEXT,
	full_file_path   VARCHAR(1024),
	title            VARCHAR(1024),
	yaml_json        JSON,
	metadata         JSON
)`

let create_table_markdown_edges = `
CREATE TABLE IF NOT EXISTS markdown_edges (
	link_id       UUID PRIMARY_KEY,
	label         VARCHAR,
	from_node_id  UUID,
  from_node_metadata JSON,
	to_node_id    UUID,
  to_node_metadata JSON
)`

let create_table_markdown_key_values = `
CREATE TABLE IF NOT EXISTS markdown_key_values (
	id         UUID PRIMARY_KEY,
	note_id    UUID,
	tag        VARCHAR(1024),
	raw_value  TEXT,
	json_value JSON
)`

let create_table_markdown_syntax_trees = `
CREATE TABLE IF NOT EXISTS markdown_syntax_trees (
	id               UUID PRIMARY KEY,
	markdown_id      TEXT,
	syntax_tree      JSON,
	metadata         JSON
)`


let html_rendered_from_markdown = `
CREATE TABLE IF NOT EXISTS html_rendered_from_markdown (
	id               UUID PRIMARY KEY,
	markdown_id      UUID,
	html_content     TEXT,
	metadata         JSON
)`

let urls_extracted_from_markdown = `
CREATE TABLE IF NOT EXISTS urls_extracted_from_nodes (
	markdown_node_id UUID,
  url              TEXT,
  domain           TEXT
)`

function gen_url_list(uuid, tmp_markdown){
  let urls = extractUrls(tmp_markdown);
  let domains = []
  if(urls == undefined){
    return false
  }
  urls.forEach(element => {
    domains.push(extractDomain(element))
  });
  let insert_data = []
  for(var i = 0; i < urls.length; i++){
    insert_data.push([
      uuid,
      urls[i],
      domains[i]
    ])
  }
  return insert_data
}

async function main() {
  let site_data = await JSON.parse(fs.readFileSync(`${in_path}site_data.json`));
  // Create a new SQLite database connection
  console.log(`Connecting to ${db_file_path}`)
  // You can also specify a file path for a persistent database
  const db = await new Database(db_file_path);
  // Create the schema
  let create_schema_queries = [
    create_table_markdown_nodes,
    create_table_markdown_edges,
    create_table_markdown_key_values,
    create_table_markdown_syntax_trees,
    html_rendered_from_markdown,
    urls_extracted_from_markdown
  ]
  await create_schema_queries.forEach(async (query) => {
    // console.log(query)
    const tmp_stmt = await db.prepare(query);
    const info = await tmp_stmt.run();
  })
  console.log("site_data.uuid_list")
  console.log(JSON.stringify(site_data.uuid_list, null, 2))
  for(var i = 0; i < site_data.uuid_list.length; i++){
    let note_uuid = site_data.uuid_list[i]
    console.log("note_uuid")
    console.log(note_uuid)
    let markdown_file_path = `${in_path}/markdown_files/${note_uuid}.md`
    console.log("markdown_file_path")
    console.log(markdown_file_path)
    let raw_markdown = fs.readFileSync(markdown_file_path)
    raw_markdown = String(raw_markdown)
    let syntax_tree = null
    let full_file_path = site_data.uuid_filepath[note_uuid] 
    let title = site_data.uuid_filename[note_uuid]
    let yaml_json = JSON.stringify( extractYamlFromMarkdown(raw_markdown) )
    console.log(`Processing ${note_uuid} Titled: ${title}`)
    // CREATE TABLE IF NOT EXISTS pkm_nodes (
    // 	id               UUID PRIMARY KEY,
    // 	raw_markdown     text,
    // 	syntax_tree      JSON,
    // 	full_file_path   TEXT,
    // 	title            VARCHAR(1024),
    // 	yaml_json        JSON
    // )`

    // START SYNTAX STREE
    let tree = fromMarkdown(removeYamlFromMarkdown(raw_markdown), {
      extensions: [frontmatter(['yaml', 'toml']), syntax()],
      mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
    })
    console.log("Tree")
    console.log(JSON.stringify(tree, null, 2))
    let insertStmt = db.prepare(`
      INSERT INTO markdown_syntax_trees (
        id,
        syntax_tree,
        metadata
      ) VALUES (?, json(?), json(?));`)
    await  insertStmt.run(
      note_uuid, 
      JSON.stringify(tree),
      yaml_json);
    // END SYNTEX TREE

    insertStmt = db.prepare(`
      INSERT INTO markdown_nodes (
        id,
        raw_markdown,
        full_file_path,
        title,
        yaml_json
      ) VALUES (?, ?, ?, ?, json(?));`)
    await  insertStmt.run(
      note_uuid, 
      raw_markdown,
      full_file_path,
      full_file_path,
      yaml_json);
    console.log("insertStmt markdown_nodes")
    console.log(JSON.stringify(insertStmt, null, 2))
    // await insertStmt.run();
    console.log("First Finalize Run")
    let url_note_data = gen_url_list(note_uuid, raw_markdown)
    console.log("url_note_data Generates no problem")
    console.log(url_note_data)
    if (url_note_data != false){
      console.log("url_note_data")
      console.log(url_note_data)
      console.log(JSON.stringify(url_note_data, null, 2))
      url_note_data.forEach(async(url_list) => {
        console.log("url_list")
        console.log(JSON.stringify(url_list, null, 2))
        // The line below produces an error
        insertStmt = db.prepare(`
        INSERT INTO urls_extracted_from_nodes (
          markdown_node_id,
          url,
          domain
        ) VALUES (?, ?, ?)`)
        console.log("insertStmt url_list")
        console.log(JSON.stringify(insertStmt, null, 2))
        await insertStmt.run(
          url_list[0],
          url_list[1],
          url_list[2]
        )
        // await insertStmt.finalize();
      });
    }
  }
  let embedded_note_links = Object.keys(site_data.embedded_note_links)
  console.log("embedded_note_links")
  console.log(JSON.stringify(embedded_note_links, null, 2))
  for(var i = 0; i < embedded_note_links.length; i++){
    console.log(`METADATA TEST ${i} of ${embedded_note_links.length}`)
    let metadata = site_data.embedded_note_links[embedded_note_links[i]]
    if (metadata == undefined){
      continue
    }
    if (metadata.length == 0){
      continue
    }
    for(var j = 0; j < metadata.length; j++){
        const insertStmt2 = await db.prepare(`
          INSERT INTO markdown_edges (
            link_id,
            label,
            from_node_id,
            from_node_metadata,
            to_node_id
          ) VALUES (?, ?, ?, json(?), ?)`)
        await insertStmt2.run(
              uuidv4(), 
              "embedded",
              embedded_note_links[i],
              JSON.stringify(metadata[j]),
              metadata[j].link,);
        // await insertStmt2.finalize()
  }
}
  let note_links = Object.keys(site_data.note_links)
  console.log("note_links_me")
  console.log(JSON.stringify(note_links, null, 2))
  for(var i = 0; i < note_links.length; i++){
    console.log(`note_links TEST ${i} of ${note_links.length}`)
      let metadata = site_data.note_links[note_links[i]]
      console.log("metadata3")
      console.log(JSON.stringify(metadata, null, 2))
      if (metadata == undefined){
        console.log("Metadata = undefined Cont")
        continue
      }
      if (metadata.length == 0){
        console.log("Metadata.length = undefined Cont")
        continue
      }
      for(var j = 0; j < metadata.length; j++){
          console.log("Metadata 2")
          console.log(JSON.stringify(metadata))
          const insertStmt3 = await db.prepare(`
            INSERT INTO markdown_edges (
              link_id,
              label,
              from_node_id,
              from_node_metadata,
              to_node_id
            ) VALUES (?, ?, ?, json(?), ?)`)
          console.log("ERROR TEST 2")
          console.log(!Object.keys(metadata[j]).includes("link"))
          if (!Object.keys(metadata[j]).includes("link")){
            console.log("ERROR TEST 1")
            metadata[j].link = ""
          }
          let test_intput_error = [
            uuidv4(),
            "linked",
            note_links[i],
            JSON.stringify(metadata[j]),
            metadata[j].link
          ]
          console.log("TEST INPUT ERROR 1")
          console.log(JSON.stringify(test_intput_error, null, 2))
          await insertStmt3.run(
                uuidv4(),
                "linked",
                note_links[i],
                JSON.stringify(metadata[j]),
                metadata[j].link);
          // await insertStmt3.finalize()
    }
  }
  await db.close()
}
main()
// // Create the schema
// db.serialize(() => {
//   db.run(create_table_pkm_nodes);
//   db.run(create_table_pkm_tags);
//   db.run(create_table_pkm_edges);
// });

// // Insert data into the table
// db.serialize(async () => {
//   console.log(`${in_path}`)
//   let site_data = await JSON.parse(fs.readFileSync(`${in_path}site_data.json`));
//   console.log(site_data)
//   // Loop through UUID's
//     // Read raw file to string
//     // Generate Syntax Tree for Raw File
//   // const insertStmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
//   // insertStmt.run('John Doe', 'john@example.com');
//   // insertStmt.run('Jane Smith', 'jane@example.com');
//   // insertStmt.finalize();
// });

// Query the data
// db.serialize(() => {
//   db.all('SELECT * FROM users', (err, rows) => {
//     if (err) {
//       console.error(err);
//     } else {
//       rows.forEach(row => {
//         console.log(`User ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
//       });
//     }
//   });
// });

// Close the database connection
// db.close();
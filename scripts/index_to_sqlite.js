import sqlite3 from 'sqlite3'
import fs from 'fs';


import { extractYamlFromMarkdown } from '../lib/extractYamlFromMarkdown.js';

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

let create_table_pkm_nodes = `
CREATE TABLE IF NOT EXISTS pkm_nodes (
	id               UUID PRIMARY KEY,
	raw_markdown     text,
	syntax_tree      JSON,
	full_file_path   TEXT,
	title            VARCHAR(1024),
	yaml_json        JSON
)`

let create_table_pkm_tags = `
CREATE TABLE IF NOT EXISTS pkm_tags (
	id       UUID PRIMARY_KEY,
	note_id  UUID,
	tag      VARCHAR(1024)
)`

let create_table_pkm_edges = `
CREATE TABLE IF NOT EXISTS pkm_edges (
	link_id       UUID PRIMARY_KEY,
	label         VARCHAR,
	from_note_id  UUID,
	to_note_id    UUID
)`

async function main() {
  let site_data = await JSON.parse(fs.readFileSync(`${in_path}site_data.json`));
  // Create a new SQLite database connection
  console.log(`Connecting to ${db_file_path}`)
  // You can also specify a file path for a persistent database
  const db = await new sqlite3.Database(db_file_path);
  // Create the schema
  db.serialize(() => {
    db.run(create_table_pkm_nodes);
    db.run(create_table_pkm_tags);
    db.run(create_table_pkm_edges);
  });
  for(var i = 0; i < site_data.uuid_list.length; i++){
    let note_uuid = site_data.uuid_list[i]
    let markdown_file_path = `${in_path}/markdown_files/${note_uuid}.md`
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
    const insertStmt = db.prepare(`
      INSERT INTO pkm_nodes (
        id,
        raw_markdown,
        syntax_tree,
        full_file_path,
        title,
        yaml_json
      ) VALUES (?, ?, json(?), ?, ?, json(?));`)
    await  insertStmt.run(
      note_uuid, 
      raw_markdown,
      syntax_tree,
      full_file_path,
      full_file_path,
      yaml_json);
    // const insertStmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    // insertStmt.run('Jane Smith', 'jane@example.com');
    // insertStmt.run('Jane Smith', 'jane@example.com');
  }
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
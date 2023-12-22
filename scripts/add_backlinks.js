// Connect to sqlite database

// Select all unique documents that are backlinked too

// Check if any actual backlinks exist

// Loop through the unique documents

    // Select all the backlinks for specific document, make sure to get their names
        // We need the UUID to link to as well as its title from a join

    // Generate markdown to insert and Insert backlinks into each document


import Database from 'better-sqlite3';
import fs from 'fs';


import { Command } from 'commander';
const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath         <string>')
  .option('-dbf, --dbfilepath   <string>')
program.parse(process.argv)
const options = program.opts()
console.log(options)
// Set variables from argv
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


async function main(){
    // Connect to sqlite database
    console.log(`Connecting to ${db_file_path}`)
    const db = await new Database(db_file_path)

    // Select all unique documents that are backlinked too
    let to_node_ids = await db.prepare(`select distinct from_node_id, to_node_id from markdown_edges where to_node_id is not null and to_node_id != '';`).all()
    console.log("to_node_ids")
    console.log(to_node_ids) 


    // Loop through the unique documents
    let backlink_backlog = {}
    // await to_node_ids.forEach(async (node_id) => {
    for (var i = 0; i < Object.keys(to_node_ids).length; i++){
        // Get the links to this node
        let node_id = to_node_ids[Object.keys(to_node_ids)[i]]
        let get_links_to_this_node = await db.prepare(`
        select 
            from_node_id
        from 
            markdown_edges 
        where 
            to_node_id = '${node_id.to_node_id}';
        `).all()
        console.log("get_links_to_this_node")
        console.log(get_links_to_this_node)
        // Check if any actual backlinks exist
        console.log("get_links_to_this_node.length")
        console.log(get_links_to_this_node.length)
        if(get_links_to_this_node.length == 0){
            console.log(`No backlinks exist for ${JSON.stringify(get_links_to_this_node)}`)
        }
        else {
            let my_node_list = []
            await Object.keys(get_links_to_this_node).forEach( async (node) => {
                console.log("my node")
                console.log(get_links_to_this_node[node])
                my_node_list.push(get_links_to_this_node[node].from_node_id)
            })
            const placeholders = my_node_list.map(() => '?').join(', ');
            let query = `
                select 
                    id,
                    json_extract(markdown_nodes.yaml_json, '$.title') as title
                from 
                    markdown_nodes 
                where 
                    id in (${placeholders});
            `
            console.log(my_node_list)
            console.log("query")
            console.log(query)
            let get_from_node_title = await db.prepare(`
                select 
                    id,
                    json_extract(markdown_nodes.yaml_json, '$.title') as title
                from 
                    markdown_nodes 
                where 
                    id in (${placeholders});
            `).all(my_node_list)
            console.log("get_from_node_title")
            console.log(get_from_node_title)
            // node_id.titles = get_from_node_title[0].title
            console.log("!Object.keys(backlink_backlog).includes(node_id.from_node_id)")
            console.log(!Object.keys(backlink_backlog).includes(node_id.from_node_id))
            backlink_backlog[node_id.from_node_id] = get_from_node_title
            console.log("backlink_backlog")
            console.log(backlink_backlog)
        }
    }
    console.log("to_node_ids 2")
    console.log(to_node_ids)
    console.log("backlink_backlog")
    console.log(backlink_backlog)

    // Generate markdown to insert and inser it
    await Object.keys(backlink_backlog).forEach(async (node) => {
        let backlink_markdown = "\n\n## Backlinks\n\n"
        console.log("backlink_backlog_node")
        console.log(node)
        console.log(backlink_backlog[node].length)
        // Read the file from the file system
        for( var i = 0; i < backlink_backlog[node].length; i++){

            // backlink_backlog[node][i]
            backlink_markdown += `* [${backlink_backlog[node][i].title}](/${backlink_backlog[node][i].id})\n`
        }
        console.log("backlink_markdown_three")
        console.log(backlink_markdown)
        // await backlink_backlog[node].forEach(async (link) => {
        //     backlink_markdown += `* [${link.title}](/${link.id})\n`
        // })
        // Append at end of file
        // Read file
        let doc = await fs.readFileSync(`${in_path}markdown_files/${node}.md`)
        doc += backlink_markdown
        console.log(doc)
        // Write the file
        await fs.writeFileSync(`${in_path}markdown_files/${node}.md`, doc)
        console.log("WROTE_SOMETHING")
        backlink_markdown = "\n\n## Backlinks \n\n"

    })
    console.log("DONE")
}

main()
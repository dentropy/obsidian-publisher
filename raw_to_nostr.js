import fs from "fs";
import { glob } from "glob";
import { v4 as uuidv4 } from "uuid";
import yaml from "yaml";

// Import Custom Modules
import { extractYamlFromMarkdown } from "./lib/extractYamlFromMarkdown.js";
import { removeYamlFromMarkdown } from "./lib/removeYamlFromMarkdown.js";

// Verification Functions
import { shared_verification_function } from './verification_functions/shared_verification_function.js';
import { all_files_verification_function } from './verification_functions/all_files_verification_function.js';
import { groups_verification_function } from './verification_functions/groups_verification_function.js';
import { groups_verification_function_not_shared } from './verification_functions/groups_verification_function_not_shared.js';

// * Get CLI Arguments
import { Command } from "commander";
const program = new Command();
program
    .name("List All Markdown Files in Specified Path")
    .option("-i, --inpath  <string>")
    .option("-o, --outpath <string>")
    .option("-dbf, --dbfilepath   <string>")
    .option("-oi, --offsetindex <int>")
    .option("-mkdn, --mkfilesfoldername <string>")
    .option("-ev, --entire_vault")
    .option("-np, --not_public")
    .option("-g, --groupstopublish <string>")
    .option("-cp, --custom_path <string>")
    .option("-am, --add_md_extensions")
    .option("-it, --index_title <string>");
program.parse(process.argv);
const options = program.opts();
console.log(options);
let pattern = "";
let in_path = "";
if (!(Object.keys(options).includes("inpath"))) {
    console.log(
        "You failed to set input path '-i $FOLDER_PATH' for you markdown documents",
    );
    process.exit(1);
} else {
    pattern = options.inpath;
    in_path = options.inpath;
    if (pattern.charAt(pattern.length - 1) != "/") {
        pattern += "/";
        in_path += "/";
    }
    pattern += "**/*.md";
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
let groups_to_publish = [];
if ((Object.keys(options).includes("groupstopublish"))) {
    groups_to_publish = options.groupstopublish.split(" ");
}

console.log("Select verification function as check_rbac");
let check_rbac = function () {
    return false;
};
if (build_full_site == true) {
    console.log("all_files_verification_function");
    // site_data = await generateBasicSiteData(pattern, all_files_verification_function, offset_index)
    check_rbac = all_files_verification_function;
} else {
    if (groups_to_publish.length != 0) {
        if (options.not_public) {
            console.log("groups_verification_function_not_shared");
            //site_data = await generateBasicSiteData(pattern, groups_verification_function_not_shared, offset_index, groups_to_publish)
            check_rbac = groups_verification_function_not_shared;
        } else {
            console.log("groups_verification_function");
            // site_data = await generateBasicSiteData(pattern, groups_verification_function, offset_index, groups_to_publish)
            check_rbac = groups_verification_function;
        }
    } else {
        console.log("shared_verification_function");
        // site_data = await generateBasicSiteData(pattern, shared_verification_function, offset_index)
        check_rbac = shared_verification_function;
    }
}

let document_metadata = {
    "doc_by_uuid": {},
    "title_to_uuid": {},
    "uuid_to_filepath": {},
}


function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();
  
  arr.forEach(item => {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  });
  
  return [...duplicates];
}


async function build() {
    console.log("\nGlob all the files");
    let note_files = await glob.sync(in_path + "**/*.md");


    // First we fetch all the document metadata for adding in links
    for (const markdown_filepath of note_files) {
        // Read YAML to JSON
        let raw_markdown = await fs.readFileSync(markdown_filepath);
        let parsed_yaml = extractYamlFromMarkdown(raw_markdown.toString());

        if (parsed_yaml == undefined) {
            parsed_yaml = {};
        }
        // Add uuid's to files missing them
        if (!Object.keys(parsed_yaml).includes("uuid")) {
            parsed_yaml.uuid = uuidv4();
            parsed_yaml.share = false;
            let new_md_file = "---\n" + yaml.stringify(parsed_yaml) + "---\n" +
                removeYamlFromMarkdown(raw_markdown.toString());
            await fs.writeFileSync(markdown_filepath, new_md_file);
        }

        // if Check file with check_rbac
        if (check_rbac(parsed_yaml, groups_to_publish)) {
            // Calculate document title from markdown path
            console.log(markdown_filepath)
            let title_split = markdown_filepath.split("/")
            let title_split2 = title_split[title_split.length - 1].split(".")
            title_split2.pop()
            let title = title_split2.join(".")
            if( document_metadata.doc_by_uuid[parsed_yaml.uuid] != undefined) {
                throw new Error((JSON.stringify({
                    error: "",
                    description: "Duplicate UUID",
                    file_path: markdown_filepath,
                    title: title,
                    parsed_yaml: parsed_yaml,
                    other_document_parsed_yaml: document_metadata.doc_by_uuid[document_metadata.title_to_uuid[title]],
                    other_document_filepath: document_metadata.uuid_to_filepath[document_metadata.title_to_uuid[title]],
                }, null, 2)))
            }
            if(  document_metadata.title_to_uuid[title] != undefined ) {
                console.log(JSON.stringify({
                    error: "",
                    description: "Duplicate Title",
                    file_path: markdown_filepath,
                    title: title,
                    parsed_yaml: parsed_yaml,
                    other_document_parsed_yaml: document_metadata.doc_by_uuid[document_metadata.title_to_uuid[title]],
                    other_document_filepath: document_metadata.uuid_to_filepath[document_metadata.title_to_uuid[title]],
                }, null, 2))
            }
            document_metadata.doc_by_uuid[parsed_yaml.uuid] = parsed_yaml
            document_metadata.title_to_uuid[title] = parsed_yaml.uuid
            document_metadata.uuid_to_filepath[parsed_yaml.uuid] = markdown_filepath
        }
    }
}


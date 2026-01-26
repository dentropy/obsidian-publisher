import util from "util";
import yaml from "yaml";

// File System Stuff
import fs from "fs";
import { glob } from "glob";

// Import Custom Modules
import { extractYamlFromMarkdown } from "../lib/extractYamlFromMarkdown.js";
import { removeYamlFromMarkdown } from "../lib/removeYamlFromMarkdown.js";

import { Command } from "commander";
const program = new Command();
program
    .name("List All Markdown Files in Specified Path")
    .option("-i, --inpath  <string>")
    .option("-t, --tag     <string>")
    .option("-v, --value   <string>");
program.parse(process.argv);
const options = program.opts();
console.log(options);
let pattern = "";
if (!(Object.keys(options).includes("inpath"))) {
    console.log(
        "You failed to set input path '-i $FOLDER_PATH' for you markdown documents",
    );
    process.exit(1);
}

async function main(key, value) {
    let doc = await fs.readFileSync(options.inpath);
    let parsed_yaml = extractYamlFromMarkdown(doc.toString());
    if (parsed_yaml == null) {
        parsed_yaml = {};
    }
    if (value == "true" || value == "false") {
        if (value == "false") {
            parsed_yaml[key] = false;
        }
        if (value == "true") {
            parsed_yaml[key] = true;
        }
    } else {
        parsed_yaml[key] = value;
    }
    let new_md_file = "---\n" + yaml.stringify(parsed_yaml) + "---\n" +
        removeYamlFromMarkdown(doc.toString());
    await fs.writeFileSync(options.inpath, new_md_file);
}

main(options.tag, options.value);

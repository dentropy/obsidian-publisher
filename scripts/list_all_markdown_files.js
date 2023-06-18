import { glob } from 'glob';
import fs from 'fs';
import util from 'util'

import { Command } from 'commander';
const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath  <string>')
  .option('-o, --outpath <string>')
program.parse(process.argv)
const options = program.opts()

console.log(options)
let pattern = ''
if (  !(Object.keys(options).includes("inpath"))  ){
  console.log("You failed to set input path '-i $FOLDER_PATH' for you markdown documents")
  process.exit(1);
}
else {
  pattern = options.inpath;
  if (pattern.charAt(pattern.length - 1) != '/'){
    pattern += '/'
  }
  pattern += '**/*.md'
}

let out_path = 'test.json'
if (  !(Object.keys(options).includes("outpath"))  ){
  console.log("You failed to set output path '-o $FOLDER_PATH' for you markdown documents")
  process.exit(1);
}
else {
  out_path = options.outpath
}

const glob_options = {
  nodir: true, // Exclude directories
};
let filepaths = glob.sync(pattern, glob_options);
let sortedFilepaths = filepaths.sort((a, b) => a - b);
console.log(util.inspect(sortedFilepaths, {showHidden: false, depth: null, colors: true}))
fs.writeFileSync(out_path, JSON.stringify(sortedFilepaths, null, 2));

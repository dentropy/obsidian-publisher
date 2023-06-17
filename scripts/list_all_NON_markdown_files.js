import { Command } from 'commander';
import { glob } from 'glob';
import fs from 'fs';
import util from 'util'

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
  pattern += '**/*'
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
let returned_file_list = [] // NON Markdown Files
for(var i = 0; i < sortedFilepaths.length; i++){
  const splittedList = sortedFilepaths[i].split(".");
  const lastItem = splittedList[splittedList.length - 1];
  if (lastItem != 'md'){
    returned_file_list.push(sortedFilepaths[i])
  }
}
console.log(util.inspect(returned_file_list, {showHidden: false, depth: null, colors: true}))
fs.writeFileSync(out_path, JSON.stringify(returned_file_list,null, 2));

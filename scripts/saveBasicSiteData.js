import { generateBasicSiteData } from '../lib/generateBasicSiteData.js';
import { checkTwoListsMatchingItems } from '../lib/checkTwoListsMatchingItems.js';

import util from 'util'

import { Command } from 'commander';
const program = new Command();
program
  .name('List All Markdown Files in Specified Path')
  .option('-i, --inpath  <string>')
  .option('-o, --outpath <string>')
  .option('-oi, --offsetindex <int>')
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
let offset_index = 0
if (  (Object.keys(options).includes("offsetindex"))  ){
  offset_index = options.offsetindex
}



async function main(pattern, offset_index){

  let shared_verification_function = function(parsed_yaml){
    if( Object.keys(parsed_yaml).includes("share") ){
      if (parsed_yaml["share"] == true ){
        return true
      }
    }
    return false
  }

  let groups_verification_function = function(parsed_yaml, group_name_list){
    if( Object.keys(parsed_yaml).includes("groups") ){
      // Check type is lists
      if (typeof(parsed_yaml.groups) == typeof( [] ) ) {
        if ( checkTwoListsMatchingItems(parsed_yaml.groups, group_name_list) ){
          return true
        }
      }
    }
    return false
  }

  let all_files_verification_function = function(parsed_yaml){
    return true
  }

  let site_data = await generateBasicSiteData(pattern, shared_verification_function, offset_index)
  console.log(util.inspect(site_data, {showHidden: false, depth: null, colors: true}))
  console.log("Successfully ran saveBasicSiteData")


}

main(pattern, offset_index)
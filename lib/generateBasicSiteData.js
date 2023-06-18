/*

CLI Input and Output

Glob the files

Read the files and extract the yaml

Input verification function

If valid, add to exported data structure

What is the exported data structure?

We rebuild site_data, then we use this function in the actual code

Alright that works

So this is basically generateSiteData.js

Yes

*/

// File System Stuff
import fs from 'fs'
import { glob } from 'glob';


// For Markdown Processing
import { v4 as uuidv4 } from 'uuid';

// Import Custom Modules
import { extractYamlFromMarkdown } from './extractYamlFromMarkdown.js';
import { createRecursiveObject } from '../lib/createRecursiveObject.js';
import { extractImagesFromMarkdown } from './extractImagesFromMarkdown.js';

export async function generateBasicSiteData(pattern, verification_function, offset_index){
  let site_data = {
    uuid_list : [],
    filename_uuid : {},
    filepath_uuid : {},
    yaml_uuid: {},
    images : [],
    site_hierarchy : {}
  }

  // Get all markdown files
  const glob_options = {
      nodir: true, // Exclude directories
  };
  let filepaths = await glob.sync(pattern, glob_options);

  for (var i = 0; i < filepaths.length; i++) {
    let doc = await fs.readFileSync(filepaths[i])
    let parsed_yaml =  extractYamlFromMarkdown(doc.toString())
    console.log(parsed_yaml)
    console.log(verification_function(parsed_yaml))
    site_data.uuid_list.push(parsed_yaml.uuid)
    site_data.filepath_uuid[filepaths[i].split('/').slice(offset_index).join('/')] = parsed_yaml.uuid
    site_data.filename_uuid[filepaths[i].split('/').pop().split('.')[0]] = parsed_yaml.uuid
    site_data.yaml_uuid[parsed_yaml.uuid] = parsed_yaml
    let extracted_images = extractImagesFromMarkdown(doc)
    if ( extracted_images.length > 0) {
      site_data.images.push( { 
        note_uuid : parsed_yaml.uuid,
        image_links : extracted_images
      } )
    }
  }

  // Generate site_date.site_hierarchy, note this is not technically required
  Object.keys(site_data.filepath_uuid).forEach(key => {
    const value = site_data.filepath_uuid[key];
    console.log(`site_hierarchy key:${key},  value:${value} added`);
    let key_from_pkm_path = key.replace("/home/paul/Documents/", "");
    let split_filepath = key_from_pkm_path.split('/')
    createRecursiveObject(site_data.site_hierarchy, split_filepath, value);
  });

  return site_data

}
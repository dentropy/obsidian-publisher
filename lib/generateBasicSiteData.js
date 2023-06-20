// File System Stuff
import fs from 'fs'
import { glob } from 'glob';

// Import Custom Modules
import { extractYamlFromMarkdown } from './extractYamlFromMarkdown.js';
import { createRecursiveObject } from '../lib/createRecursiveObject.js';
import { extractImagesFromMarkdown } from './extractImagesFromMarkdown.js';


export async function generateBasicSiteData(pattern, verification_function, offset_index, additional_verification_data=null){
  let site_data = {
    uuid_list : [],
    uuid_filepath : {},
    uuid_filename : {},
    filepath_uuid : {},
    filename_uuid : {},
    yaml_uuid: {},
    images : [],
    site_hierarchy : {},
    root_path : {},
    files_with_no_uuid : []
  }
  site_data.root_path = pattern


  // Get all markdown files
  const glob_options = {
      nodir: true, // Exclude directories
  };
  let filepaths = await glob.sync(pattern + '**/*.md', glob_options);


  for (var i = 0; i < filepaths.length; i++) {
    let doc = await fs.readFileSync(filepaths[i])
    let parsed_yaml =  extractYamlFromMarkdown(doc.toString())
    if ( parsed_yaml == null || parsed_yaml == undefined){
      site_data.files_with_no_uuid.push(filepaths[i])
      continue
    }else {
      if ( !Object.keys(parsed_yaml).includes("uuid") ) {
        site_data.files_with_no_uuid.push(filepaths[i])
        continue
      }
    }
    if(!verification_function(parsed_yaml, additional_verification_data)){
      console.log(parsed_yaml)
      continue
    }
    console.log(parsed_yaml)
    console.log(filepaths[i])
    console.log(filepaths[i].split('/').slice(offset_index).join('/') )
    console.log(parsed_yaml.uuid)
    site_data.uuid_list.push(parsed_yaml.uuid)
    let tmp_filepath = filepaths[i].split('/').slice(offset_index).join('/')
    site_data.filepath_uuid[tmp_filepath] = parsed_yaml.uuid
    site_data.uuid_filepath[parsed_yaml.uuid] = tmp_filepath
    let tmp_filename = filepaths[i].split('/').pop().split('.')[0]
    site_data.filename_uuid[tmp_filename] = parsed_yaml.uuid
    site_data.uuid_filename[parsed_yaml.uuid] = tmp_filename
    if ( !Object.keys(parsed_yaml).includes("title") ) {
      let note_title = filepaths[i].split('/')
      note_title = note_title[note_title.length - 1]
      note_title = note_title.split('.')[0]
      parsed_yaml.title = note_title
    }
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
    let key_from_pkm_path = key.replace(site_data.root_path, "");
    let split_filepath = key_from_pkm_path.split('/')
    createRecursiveObject(site_data.site_hierarchy, split_filepath, value);
  });

  return site_data

}
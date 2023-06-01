import fs from 'fs';
import util from "util";

let rawdata = JSON.parse(fs.readFileSync('./out/site_data.json'));

function createRecursiveObject(obj, keys, uuid) {
  if (keys.length === 0) {
    obj.uuid = uuid
    return obj; // Return the final object
  }

  const currentKey = keys[0];

  if (!obj.hasOwnProperty(currentKey) || typeof obj[currentKey] !== 'object') {
    obj[currentKey] = {}; // Create the property if it doesn't exist or is not an object
  }

  return createRecursiveObject(obj[currentKey], keys.slice(1), uuid);
}

let myObject = {}
Object.keys(rawdata.filepath_uuid).forEach(key => {
  const value = rawdata.filepath_uuid[key];
  console.log(`${key}: ${value}`);
  let key_from_pkm_path = key.replace("/home/paul/Documents/", "");
  let split_filepath = key_from_pkm_path.split('/')
  console.log(split_filepath)
  createRecursiveObject(myObject, split_filepath, value);
});

rawdata.site_hierarchy = myObject
fs.writeFileSync('./out/site_data.json', JSON.stringify(rawdata));

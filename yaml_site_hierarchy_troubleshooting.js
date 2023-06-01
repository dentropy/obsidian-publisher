import fs from 'fs';
import util from "util";
import yaml from 'js-yaml'

let rawdata = JSON.parse(fs.readFileSync('./out/site_data.json'));
//console.log(util.inspect(Object.keys(myObject), {showHidden: false, depth: null, colors: true}))

console.log(Object.keys(rawdata))
let note_filepaths = Object.keys(rawdata.filepath_uuid)
note_filepaths = note_filepaths.sort()


// console.log(util.inspect(Object.keys(rawdata.filepath_uuid), {showHidden: false, depth: null, colors: true}))

// console.log( Array.isArray(note_filepaths) )


/*

What format do we need?

We need

Title :
  uuid
  Title: UUID

How do we loop through these to create this structure

We need to parse and sort by length

*/

let notes_with_metadata = []

note_filepaths.forEach(note_path => {
  notes_with_metadata.push({
    note_path: note_path,
    uuid:  rawdata.filepath_uuid[note_path],
    parsed: String(note_path).split('/'),
    parsed_length: String(note_path).split('/').length
  })  
})
notes_with_metadata.sort((a, b) => a.parsed_length - b.parsed_length);
notes_with_metadata.reverse()
console.log(notes_with_metadata[0])


/*

We seem to have a usable file hierarchy structure

So we start embedding the lists inside lists now?

Recursive Loop
  Check length is what we started with
  Check if same length otherwise reduce by one
  Check second last item in path and put them in a object
    {
      name: 
      parsed_length:
      notes: 
        {name : uuid}
    }

Where do we store these?
We need a meta object
*/

// let notes_to_insert = {}
// let final_notes_object = {}
// let final_notes_yaml = ""

// function recursive_yaml_generator(notes_with_metadata){
//   const list_item = notes_with_metadata.shift();
//   recursive_yaml_generator(notes_with_metadata)

// }



/*

I asked ChatGPT "Place items within a recursive list structure based on file path"

Let's test the result

*/

let new_filepath_objects = []
note_filepaths.forEach(note_filepath => {
  new_filepath_objects.push({
    path: note_filepath,
    contents: rawdata[note_filepath] 
  })
  
})


function transformToRecursiveList(files) {
  const root = {};

  // Iterate over each file
  for (const fileName in files) {
    const path = fileName.split('/');
    let currentDir = root;

    // Traverse the directory structure
    for (let i = 0; i < path.length - 1; i++) {
      const dirName = path[i];

      // Create subdirectory if it doesn't exist
      if (!currentDir[dirName]) {
        currentDir[dirName] = {};
      }

      currentDir = currentDir[dirName];
    }

    // Add the file contents to the current directory
    const fileContents = files[fileName];
    if (!currentDir[fileName]) {
      currentDir[fileName] = [];
    }
    currentDir[fileName].push(fileContents);
  }

  // Convert the recursive object structure to a list
  const recursiveList = convertToObjectList(root);
  return recursiveList;
}

function convertToObjectList(obj) {
  const list = [];

  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      list.push({ name: key, contents: obj[key] });
    } else {
      list.push({ name: key, children: convertToObjectList(obj[key]) });
    }
  }

  return list;
}

// Example usage
const files = {
  'folder1/file1.txt': 'File 1 contents',
  'folder1/file2.txt': 'File 2 contents',
  'folder1/subfolder1/file3.txt': 'File 3 contents',
  'folder2/file4.txt': 'File 4 contents',
};


const recursiveList = transformToRecursiveList(files);
console.log(recursiveList);

fs.writeFileSync('output.json', JSON.stringify(recursiveList));
// fs.writeFileSync('output.yaml', yamlData);

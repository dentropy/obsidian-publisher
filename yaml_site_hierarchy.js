import fs from 'fs';
import yaml from 'js-yaml'

let site_data = JSON.parse(fs.readFileSync('./out/site_data.json'));

let note_filepaths = Object.keys(site_data.filepath_uuid)
note_filepaths = note_filepaths.sort()


let notes_with_metadata = []
note_filepaths.forEach(note_path => {
  notes_with_metadata.push({
    note_path: note_path,
    uuid:  site_data.filepath_uuid[note_path],
    parsed: String(note_path).split('/'),
    parsed_length: String(note_path).split('/').length
  })  
})
notes_with_metadata.sort((a, b) => a.parsed_length - b.parsed_length);
notes_with_metadata.reverse()



let test_yaml = [{
  "Section": [
    "section/index", {
      Page1: "page1-uuid"
    }, {
      Page2: "page2-uuid"
    }
  ]
}]



/// CHAT GPT Functions

// Initialize the data structure
let fileStructure = [];

// Function to add a file path and its contents to the file structure
function addFilePath(filePath, contents) {
  let currentLevel = fileStructure;

  // Split the file path into individual directory names
  const directories = filePath.split('/');

  // Remove the filename from the directories array
  const fileName = directories.pop();

  // Loop through each directory in the file path
  for (const directory of directories) {
    // Check if the directory already exists at the current level
    const existingDirectory = currentLevel.find(item => item.hasOwnProperty(directory));

    // If the directory doesn't exist, create it
    if (!existingDirectory) {
      const newDirectory = {};
      newDirectory[directory] = [];
      currentLevel.push(newDirectory);
      currentLevel = newDirectory[directory];
    } else {
      // If the directory exists, move to the next level
      currentLevel = existingDirectory[directory];
    }
  }

  // Add the file to the final level
  const file = {};
  file[fileName] = contents;
  currentLevel.push(file);
}

// Usage example
// addFilePath('one/two/three/hello.txt', 'qwerty');
// addFilePath('one/two/four/example.txt', '12345');
// addFilePath('one/five/another.txt', 'abcdef');
// console.log(JSON.stringify(fileStructure));

/// END CHAT GPT

notes_with_metadata.forEach(note => {
  addFilePath(note.note_path, note.uuid);
})

const yamlData = yaml.dump(fileStructure, { indent: 2 });
let mkdocs_yml = fs.readFileSync('./mkdocs-bak.yml')
fs.writeFileSync('output.json', JSON.stringify(fileStructure));
fs.writeFileSync('output.yaml', mkdocs_yml + yamlData);

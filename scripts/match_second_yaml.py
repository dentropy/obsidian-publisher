import os
import re
import argparse

# Define the regular expression pattern
pattern = re.compile(r'---\n---\nid.[\s\S]*?---')

# Function to search for the pattern in a file and print the matching content
def search_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            matches = pattern.finditer(content)
            for match in matches:
                match_start, match_end = match.span()
                matched_content = content[match_start:match_end]
                print(f"Found pattern in file: {file_path}\nMatched content:\n{matched_content}\n")
                new_string = content.replace(matched_content, "---\n")
                print(new_string)
                with open(file_path, 'w', encoding='utf-8') as write_file:
                    write_file.write(new_string)
    except Exception as e:
        print(f"Error processing file: {file_path} - {e}")

def main():
    parser = argparse.ArgumentParser(description="Search for a pattern in Markdown files.")
    parser.add_argument("start_dir", help="The root directory to start the search.")
    args = parser.parse_args()

    start_dir = args.start_dir

    # Recursively search for markdown files in the directory
    for root, dirs, files in os.walk(start_dir):
        for file in files:
            if file.lower().endswith('.md'):
                file_path = os.path.join(root, file)
                search_in_file(file_path)

if __name__ == "__main__":
    main()
import os
import re
import argparse

# Define the regular expression pattern
pattern = re.compile(r'---\n---')

# Function to search for the pattern in a file
def search_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            if pattern.search(content):
                print(f"{file_path}")
                return True
    except Exception as e:
        print(f"Error processing file: {file_path} - {e}")
    return False

    

def main():
    parser = argparse.ArgumentParser(description="Search for a pattern in Markdown files.")
    parser.add_argument("start_dir", help="The root directory to start the search.")
    args = parser.parse_args()

    start_dir = args.start_dir

    # Recursively search for markdown files in the directory
    file_count = 0
    for root, dirs, files in os.walk(start_dir):
        for file in files:
            if file.lower().endswith('.md'):
                file_path = os.path.join(root, file)
                if( search_in_file(file_path) ):
                    file_count += 1
    # print(f"file_count = {file_count}")

if __name__ == "__main__":
    main()
from glob import glob
import os
from pprint import pprint
import os
current_path = os.getcwd()
files = glob(f"{current_path}/pkm/**/*", recursive=True)
not_markdown_files_full_path = []
not_markdown_filenames = []
for file_name in files:
  if file_name[-3:] != '.md' and "." in file_name.split('/')[-1]:
    not_markdown_files_full_path.append(file_name)
    not_markdown_filenames.append(file_name.split('/')[-1])
pprint(not_markdown_filenames)
pprint(len(not_markdown_filenames))
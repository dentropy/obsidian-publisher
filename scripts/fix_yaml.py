from glob import glob
import os
from pprint import pprint
import os
current_path = os.getcwd()
# files = glob(f"{current_path}/pkm/**/*.md", recursive=True)
files = glob("/home/paul/Documents/Root/**/*.md", recursive=True)
for file_path in files:
  file_contents = ''
  with open(file_path, "r") as file:
    file_contents = file.readlines()
  if len(file_contents) < 3:
    continue
  if file_contents[0] == '```\n' and file_contents[3] == '```\n':
    print(file_path)
    print(file_contents[0])
    print(file_contents[3])
    file_contents[0] = '---\n'
    file_contents[3] = '---\n'
    with open(file_path, "w") as file:
      file.writelines(''.join(file_contents))

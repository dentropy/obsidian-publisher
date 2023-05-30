import fs from 'fs'
import path from 'path';
import { glob } from 'glob';
import util from "util";
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import {toHast} from 'mdast-util-to-hast'
import {toHtml} from 'hast-util-to-html'

const pattern = 'out/docs/*.md';
const filepaths = glob.sync(pattern);
const out_path = 'pkm-site/public/pages/'

function removeYamlFromMarkdown(markdown) {
  const lines = markdown.trim().split('\n');

  if (lines[0].trim() === '---') {
    let index = lines.indexOf('---', 1);
    if (index !== -1) {
      lines.splice(0, index + 1);
    }
  }

  const updatedMarkdown = lines.join('\n').trim();
  return updatedMarkdown;
}

if (!fs.existsSync(out_path)) {
  fs.mkdirSync(out_path, { recursive: true });
  console.log('Directory created successfully.');
} else {
  console.log('Directory already exists.');
}

filepaths.forEach(note_path => {
  console.log(note_path)
  let note_contents = fs.readFileSync(note_path, 'utf8');
  note_contents     = removeYamlFromMarkdown(note_contents)
  let note_uuid     = note_path.split('/')[2].split('.')[0]
  let mdast = fromMarkdown(note_contents, {
    extensions: [frontmatter(['yaml', 'toml']), syntax()],
    mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
  })
  const hast = toHast(mdast)
  const html = toHtml(hast)
  fs.writeFileSync(out_path + note_uuid + '.html', html, 'utf8');
})

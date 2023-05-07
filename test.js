import fs from 'node:fs/promises'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import util from "util";
import { glob } from 'glob';

const pattern = 'pkm/**/*.md';
const files = glob.sync(pattern);


let test_path = '/home/paul/Projects/dentropys-obsidian-publisher/pkm/index.md'
const doc = await fs.readFile(test_path)
console.log(doc.toString())
const tree = fromMarkdown(doc, {
  extensions: [frontmatter(['yaml', 'toml']), syntax()],
  mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml']), wikiLink.fromMarkdown()]
})

// console.log(tree)
console.log(util.inspect(tree, {showHidden: false, depth: null, colors: true}))
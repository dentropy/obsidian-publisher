// Function to update wikilinks with markdown links, with help from #ChatGPT
export function replaceWikiLinks(content, replacements) {
  const wikiLinkRegex = /\[\[.*?\]\]/g;
  const regex = new RegExp(wikiLinkRegex, 'g');
  const matches = content.match(regex);
  const count = matches ? matches.length : 0;
  const singleWikiLinkRegex = /\[\[.*?\]\]/;
  for(var i = 0; i < replacements.length; i++){
    content = content.replace(singleWikiLinkRegex, replacements[i]);
  }
  console.log(count)

  return content;
}
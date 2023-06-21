// Thank you #ChatGPT https://sharegpt.com/c/oPDZdLS
export function extractEmbeddedLinksFromMarkdown(site_data, content) {
  // Find Embeds
  // Regular expression to match wiki links
  let wikiLinkRegex = /\!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
  // Array to store extracted wiki links
  let wikiEmbeds = [];
  // Iterate over each match and extract the link and text
  let match;
  while ((match = wikiLinkRegex.exec(content))) {
    console.log(`match ${match[0]}`)
    console.log(`match ${match[1]}`)
    console.log(`match ${match[2]}`)
    let link = match[1];
    let text = match[2] || link; // If no text is provided, use the link itself
    let heading = ''
    if ( text.includes('#') ){
      text = match[1].split('#')[0];
      link = text;
      heading = match[1].split('#')[1];
    }
    wikiEmbeds.push({ link, text, heading });
  }

  // Find note to embed
  for(var k = 0; k < wikiEmbeds.length; k++){
    wikiEmbeds[k].link = site_data.filename_uuid[wikiEmbeds[k].link] 
  }
  return wikiEmbeds
}
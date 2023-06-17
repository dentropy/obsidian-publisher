// Thank you #ChatGPT https://sharegpt.com/c/oPDZdLS
export function extractWikiLinksFromMarkdown(content) {
  // Regular expression to match wiki links
  const wikiLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

  // Array to store extracted wiki links
  const wikiLinks = [];

  // Iterate over each match and extract the link and text
  let match;
  while ((match = wikiLinkRegex.exec(content))) {
    const link = match[1];
    const text = match[2] || link; // If no text is provided, use the link itself
    wikiLinks.push({ link, text });
  }

  return wikiLinks;
}
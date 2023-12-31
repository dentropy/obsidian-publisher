export function embeddedLinksReplace( raw_markdown, raw_links ){
    // Replace Embeds
    let wikiLinkRegex = /\!\[\[.*?\]\]/g;
    const regex = new RegExp(wikiLinkRegex, 'g');
    const matches = raw_markdown.match(regex);
    const count = matches ? matches.length : 0;
    const singleWikiLinkRegex = /\!\[\[.*?\]\]/;
    for(var i = 0; i < raw_links.length; i++){
        raw_markdown = raw_markdown.replace(singleWikiLinkRegex, raw_links[i]);
    }
    // console.log(count)
    return raw_markdown;
}
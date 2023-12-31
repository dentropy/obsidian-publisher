export function embeddedLinksFind( raw_markdown ){
    let wikiLinkRegex = /\!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
    // Array to store extracted wiki links
    let wikiEmbeds = [];
    // Iterate over each match and extract the link and text
    let match;
    // console.log(all_nodes[  Object.keys(all_nodes)[i]  ])
    while ((match = wikiLinkRegex.exec(  raw_markdown  )))
    {
        // console.log(`embedded match ${match[0]}`)
        // console.log(`embedded match ${match[1]}`)
        // console.log(`embedded match ${match[2]}`)
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
    return wikiEmbeds
}
import fs from "fs";
import { glob } from "glob";
import { v4 as uuidv4 } from "uuid";
import yaml from "yaml";

// Import Custom Modules
import { extractYamlFromMarkdown } from "./lib/extractYamlFromMarkdown.js";
import { removeYamlFromMarkdown } from "./lib/removeYamlFromMarkdown.js";

// Verification Functions
import { shared_verification_function } from "./verification_functions/shared_verification_function.js";
import { all_files_verification_function } from "./verification_functions/all_files_verification_function.js";
import { groups_verification_function } from "./verification_functions/groups_verification_function.js";
import { groups_verification_function_not_shared } from "./verification_functions/groups_verification_function_not_shared.js";

// New Markdown Stuff
import { embeddedLinksFind } from "./lib/embeddedLinksFind.js";
import { embeddedLinksReplace } from "./lib/embeddedLinksReplace.js";
import { getEmbeddedMarkdown } from "./lib/getEmbeddedMarkdown.js";
import { internalLinksFind } from "./lib/internalLinksFind.js";
import { internalLinksReplace } from "./lib/internalLinksReplace.js";

import { BlossomUploader } from "@nostrify/nostrify/uploaders";
import { encodeHex } from "@jsr/std__encoding/hex";
import { NPool, NRelay1, NSecSigner } from "@nostrify/nostrify";
import { getPublicKey, nip19, verifyEvent } from "@nostr/tools";
import { NSchema as n } from "@nostrify/nostrify";
export const my_pool = new NPool({
    open: (url) => new NRelay1(url),
    reqRouter: async (filters) => new Map([]),
    eventRouter: async (
        event,
    ) => [],
});

// * Get CLI Arguments
import { Command } from "commander";
const program = new Command();
program
    .name("List All Markdown Files in Specified Path")
    .option("-i, --inpath  <string>")
    .option("-o, --outpath <string>")
    .option("-dbf, --dbfilepath   <string>")
    .option("-oi, --offsetindex <int>")
    .option("-mkdn, --mkfilesfoldername <string>")
    .option("-ev, --entire_vault")
    .option("-np, --not_public")
    .option("-g, --groupstopublish <string>")
    .option("-cp, --custom_path <string>")
    .option("-am, --add_md_extensions")
    .option("-it, --index_title <string>")
    .option("-nsec, --nsec <string>")
    .option("-burl, --blossomurl <string>")
    .option("-be, --blossomenable <boolean>")
    .option("-rl, --relaylist <string>")
    .option("-ds, --documentationspace <string>")
    .option("-dp, --defaultpage <string>");
program.parse(process.argv);
const options = program.opts();
console.log(options);

const signer = new NSecSigner(nip19.decode(options.nsec).data);
const uploader = new BlossomUploader({
    servers: [
        "https://blossom.mememaps.net",
    ],
    signer: signer,
});

let pattern = "";
let in_path = "";
if (!(Object.keys(options).includes("inpath"))) {
    console.log(
        "You failed to set input path '-i $FOLDER_PATH' for you markdown documents",
    );
    process.exit(1);
} else {
    pattern = options.inpath;
    in_path = options.inpath;
    if (pattern.charAt(pattern.length - 1) != "/") {
        pattern += "/";
        in_path += "/";
    }
    pattern += "**/*.md";
}
let build_full_site = false;
if ((Object.keys(options).includes("entire_vault"))) {
    const confirmed = await askForConfirmation(
        "Are you sure you want to build EVERYTHING?",
    );
    if (confirmed) {
        console.log("Alright let's build everything");
        build();
    } else {
        console.log("Aborted.");
        console.log("Ya gotta be careful");
        process.exit(1);
    }
    await askForConfirmation();
    console.log(`build_full_site: ${build_full_site}`);
    build();
} else {
    console.log(`build_full_site: ${build_full_site}`);
    build();
}
let groups_to_publish = [];
if ((Object.keys(options).includes("groupstopublish"))) {
    groups_to_publish = options.groupstopublish.split(" ");
}

console.log("Select verification function as check_rbac");
let check_rbac = function () {
    return false;
};
if (build_full_site == true) {
    console.log("all_files_verification_function");
    // site_data = await generateBasicSiteData(pattern, all_files_verification_function, offset_index)
    check_rbac = all_files_verification_function;
} else {
    if (groups_to_publish.length != 0) {
        if (options.not_public) {
            console.log("groups_verification_function_not_shared");
            //site_data = await generateBasicSiteData(pattern, groups_verification_function_not_shared, offset_index, groups_to_publish)
            check_rbac = groups_verification_function_not_shared;
        } else {
            console.log("groups_verification_function");
            // site_data = await generateBasicSiteData(pattern, groups_verification_function, offset_index, groups_to_publish)
            check_rbac = groups_verification_function;
        }
    } else {
        console.log("shared_verification_function");
        // site_data = await generateBasicSiteData(pattern, shared_verification_function, offset_index)
        check_rbac = shared_verification_function;
    }
}

let document_metadata = {
    "doc_by_uuid": {},
    "title_to_uuid": {},
    "uuid_to_filepath": {},
    "site_directoriy": {},
    "valid_filepaths": [],
};

function findDuplicates(arr) {
    const seen = new Set();
    const duplicates = new Set();

    arr.forEach((item) => {
        if (seen.has(item)) {
            duplicates.add(item);
        } else {
            seen.add(item);
        }
    });

    return [...duplicates];
}

let published_events = [];
async function build() {
    console.log("\nGlob all the files");
    let note_files = await glob.sync(in_path + "**/*.md");

    // First we fetch all the document metadata for adding in links
    for (const markdown_filepath of note_files) {
        // Read YAML to JSON
        let raw_markdown = await fs.readFileSync(markdown_filepath);
        let parsed_yaml = extractYamlFromMarkdown(raw_markdown.toString());

        if (parsed_yaml == undefined) {
            parsed_yaml = {};
        }
        // Add uuid's to files missing them
        if (!Object.keys(parsed_yaml).includes("uuid")) {
            parsed_yaml.uuid = uuidv4();
            parsed_yaml.share = false;
            let new_md_file = "---\n" + yaml.stringify(parsed_yaml) + "---\n" +
                removeYamlFromMarkdown(raw_markdown.toString());
            await fs.writeFileSync(markdown_filepath, new_md_file);
        }

        // if Check file with check_rbac
        if (check_rbac(parsed_yaml, groups_to_publish)) {
            // Calculate document title from markdown path
            let title_split = markdown_filepath.split("/");
            let title_split2 = title_split[title_split.length - 1].split(".");
            title_split2.pop();
            let title = title_split2.join(".");
            if (document_metadata.doc_by_uuid[parsed_yaml.uuid] != undefined) {
                throw new Error(JSON.stringify(
                    {
                        error: "",
                        description: "Duplicate UUID",
                        file_path: markdown_filepath,
                        title: title,
                        parsed_yaml: parsed_yaml,
                        other_document_parsed_yaml: document_metadata
                            .doc_by_uuid[
                                document_metadata.title_to_uuid[title]
                            ],
                        other_document_filepath: document_metadata
                            .uuid_to_filepath[
                                document_metadata.title_to_uuid[title]
                            ],
                    },
                    null,
                    2,
                ));
            }
            if (document_metadata.title_to_uuid[title] != undefined) {
                console.log(JSON.stringify(
                    {
                        error: "",
                        description: "Duplicate Title",
                        file_path: markdown_filepath,
                        title: title,
                        parsed_yaml: parsed_yaml,
                        other_document_parsed_yaml: document_metadata
                            .doc_by_uuid[
                                document_metadata.title_to_uuid[title]
                            ],
                        other_document_filepath: document_metadata
                            .uuid_to_filepath[
                                document_metadata.title_to_uuid[title]
                            ],
                    },
                    null,
                    2,
                ));
            }
            document_metadata.doc_by_uuid[parsed_yaml.uuid] = parsed_yaml;
            document_metadata.title_to_uuid[title] = parsed_yaml.uuid;
            document_metadata.uuid_to_filepath[parsed_yaml.uuid] =
                markdown_filepath;
            document_metadata.valid_filepaths.push(
                markdown_filepath.replace(in_path, ""),
            );
            document_metadata.site_directoriy = addToSiteDirectory(
                document_metadata.site_directoriy,
                options.inpath,
                markdown_filepath,
                title,
                parsed_yaml,
            );
        }
    }
    console.log(`Read through ${note_files.length} notes`);

    console.log("Get list of all content_assets");
    let asset_file_paths = await glob.sync(in_path + "assets/**/*", {
        nodir: true,
    });
    let content_assets = [];
    for (var i = 0; i < asset_file_paths.length; i++) {
        let title_split = asset_file_paths[i].split("/");
        let title_split2 = title_split[title_split.length - 1];
        content_assets.push({
            path: asset_file_paths[i],
            file_name: title_split2,
        });
    }

    for (let doc_uuid of Object.keys(document_metadata.uuid_to_filepath)) {
        let raw_markdown = await fs.readFileSync(
            document_metadata.uuid_to_filepath[doc_uuid],
        );
        let embed_links = embeddedLinksFind(raw_markdown);
        let assets_to_embed = [];
        for (let link of embed_links) {
            for (let asset of content_assets) {
                if (asset.file_name == link.link) {
                    if (!("uploaded" in asset)) {
                        asset.sha256 = await blossomUpload(asset);
                    }
                    console.log(asset);
                    assets_to_embed.push(
                        `![${asset.file_name}](${options.blossomurl}/${asset.sha256}.${
                            asset.file_name.split(".").pop()
                        })`,
                    );
                }
            }
        }
        raw_markdown = await embeddedLinksReplace(
            String(raw_markdown),
            assets_to_embed,
        );
        let internal_links = await embeddedLinksFind(raw_markdown);
        let markdown_links = [];
        for (const link of internal_links) {
            let naddr = "ERROR";
            if (link.link in Object.keys(document_metadata.title_to_uuid)) {
                naddr = nip19.naddrEncode({
                    identifier: `${document_metadata.title_to_uuid[link.link]}`,
                    pubkey: await signer.getPublicKey(),
                    relays: options.relaylist.split(","),
                    kind: 39561,
                });
                markdown_links.push(`nostr:${naddr}`);
            } else {
                naddr = nip19.naddrEncode({
                    identifier: "yea-can-t-find-that",
                    pubkey: await signer.getPublicKey(),
                    relays: options.relaylist.split(","),
                    kind: 39561,
                });
            }
            markdown_links.push(`[${link.text}](nostr:${naddr})`);
        }
        let nostr_markdown = embeddedLinksReplace(raw_markdown, markdown_links);
        let parsed_yaml = extractYamlFromMarkdown(raw_markdown.toString());
        nostr_markdown = removeYamlFromMarkdown(nostr_markdown);
        let internal_wiki_links = await internalLinksFind(nostr_markdown);
        console.log("internal_wiki_links");
        console.log(internal_wiki_links);
        let replacement_internal_links = [];
        if (internal_wiki_links.length != 0) {
            for (const wiki_link of internal_wiki_links) {
                if (
                    document_metadata.title_to_uuid[wiki_link.link] != undefined
                ) {
                    let naddr = nip19.naddrEncode({
                        identifier: `${options.documentationspace}:${
                            document_metadata.title_to_uuid[wiki_link.link]
                        }`,
                        pubkey: await signer.getPublicKey(),
                        relays: options.relaylist.split(","),
                        kind: 39561,
                    });
                    replacement_internal_links.push(
                        `[${wiki_link.text}](nostr:${naddr})`,
                    );
                } else {
                    replacement_internal_links.push(
                        `[${wiki_link.text}](./welost)`,
                    );
                }
            }
            // console.log("PAUL_WAS_HERE");
            // console.log(replacement_internal_links);
        }

        // TODO: Update The Yaml Frontmatter

        let title_split = document_metadata.uuid_to_filepath[doc_uuid].split(
            "/",
        );
        let title_split2 = title_split[title_split.length - 1].split(".");
        title_split2.pop();
        let title = title_split2.join(".");

        let homepage = document_metadata.title_to_uuid["index"];
        let tags = [
            ["d", doc_uuid],
            ["ds", options.documentationspace],
            ["title", title],
            ["format", "markdown"],
            ["default_format", "markdown"],
            ["visibility", "public"],
            ["homepage", homepage],
        ];
        // console.log("\n\n\nnostr_markdown");
        // console.log(doc_uuid);
        // console.log(nostr_markdown);
        // console.log(tags);
        let eventToPublish = await signer.signEvent({
            tags: tags,
            content: nostr_markdown,
            kind: 39561,
            created_at: Math.floor((new Date()).getTime() / 1000),
        });
        await my_pool.event(eventToPublish, {
            relays: options.relaylist.split(","),
        });
        if (eventToPublish != undefined) {
            // console.log(eventToPublish);
            published_events.push(nip19.naddrEncode({
                identifier: `${options.documentationspace}:${
                    doc_uuid
                }`,
                pubkey: await signer.getPublicKey(),
                relays: options.relaylist.split(","),
                kind: 39561,
            }));
        }
    }

    // console.log("\n\n\n");
    // console.log(document_metadata.site_directoriy);
    // console.log(document_metadata.valid_filepaths);
    // console.log(document_metadata.title_to_uuid);
    let my_pubkey = await signer.getPublicKey();
    let directory_json = JSON.stringify(
        filepathsToTree(document_metadata.valid_filepaths, my_pubkey),
        null,
        2,
    );
    let naddr = nip19.naddrEncode({
        identifier: `${options.documentationspace}:${
            document_metadata.title_to_uuid[options.defaultpage]
        }`,
        pubkey: await signer.getPublicKey(),
        relays: options.relaylist.split(","),
        kind: 39561,
    });
    let eventToPublish = await signer.signEvent({
        tags: [
            ["ds", options.documentationspace],
            ["dp", naddr],
        ],
        content: directory_json,
        kind: 39561,
        created_at: Math.floor((new Date()).getTime() / 1000),
    });
    // console.log("DIRECTORY_EVENT");
    // console.log(eventToPublish);
    await my_pool.event(eventToPublish, {
        relays: options.relaylist.split(","),
    });
    console.log(published_events);
}

function filepathsToTree(filepaths, my_pubkey) {
    const tree = { id: "root", label: "/", children: [] };

    // Helper function to find or create a node in the tree
    function findOrCreateNode(parent, pathParts, index, currentPath) {
        if (index >= pathParts.length) return;

        const part = pathParts[index];
        const nodeId = currentPath ? `${currentPath}/${part}` : part;
        let node = parent.children.find((child) => child.label === part);

        if (!node) {
            let tmp_part = part.split(".").shift();
            // console.log("tmp_part");
            let naddr = nip19.naddrEncode({
                identifier: `${options.documentationspace}:${
                    document_metadata.title_to_uuid[tmp_part]
                }`,
                pubkey: my_pubkey,
                relays: options.relaylist.split(","),
                kind: 39561,
            });
            node = {
                id: nodeId,
                label: tmp_part,
                naddr: naddr,
                children: [],
            };
            parent.children.push(node);
        }

        findOrCreateNode(node, pathParts, index + 1, nodeId);
    }

    // Process each filepath
    filepaths.forEach((filepath) => {
        // Remove leading slash and split into parts
        const parts = filepath.replace(/^\/+/, "").split("/").filter((part) =>
            part
        );
        findOrCreateNode(tree, parts, 0, "");
    });

    // Sort children alphabetically at each level
    function sortChildren(node) {
        node.children.sort((a, b) => a.label.localeCompare(b.label));
        node.children.forEach(sortChildren);
    }
    sortChildren(tree);

    return tree;
}

function addToSiteDirectory(
    site_directory,
    in_path,
    file_path,
    title,
    parsed_yaml,
) {
    // console.log("\n\n");
    // console.log("addToSiteDirectory");
    file_path = file_path.replace(in_path, "");
    let folders = file_path.split("/");
    folders.pop();
    if (folders[0] == "") {
        folders.shift();
    }
    // console.log("site_directory");
    // console.log(site_directory);
    let tmp_directory = site_directory;
    for (const folder of folders) {
        // console.log("folder");
        // console.log(folder);
        if (folder in tmp_directory) {
            tmp_directory = tmp_directory[folder];
            console.log("Tried to get the folder");
        } else {
            tmp_directory[folder] = {
                type: "folder",
            };
        }
    }
    console.log("site_directory");
    console.log(site_directory);
    console.log("tmp_directory[folder]");
    console.log(tmp_directory);
    tmp_directory[title] = {
        type: "document",
        uuid: parsed_yaml.uuid,
    };
    return site_directory;
}
async function blossomUpload(content_asset) {
    try {
        const buffer = await fs.readFileSync(content_asset.path);
        const blob = new Blob([buffer]);
        const sha256 = encodeHex(
            await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
        );
        // console.log(sha256);
        content_asset.sha256 = sha256;
        if (options.blossomenable == "true") {
            const tags = await uploader.upload(blob);
            content_asset.blossom = tags;
        }
        content_asset.uploaded = true;
        return sha256;
    } catch (error) {
        console.log({
            error: "",
            description: "Unable to upload asset to blossom",
            content_asset: content_asset,
            raw_error: JSON.stringify(error),
        });
    }
}

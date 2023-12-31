let create_table_markdown_nodes = `
CREATE TABLE IF NOT EXISTS markdown_nodes (
	id               UUID PRIMARY KEY,
	raw_markdown     TEXT,
	rendered_markdown TEXT,
	full_file_path   VARCHAR(1024),
	title            VARCHAR(1024),
	yaml_json        JSON,
	metadata         JSON
)`

let create_table_markdown_edges = `
CREATE TABLE IF NOT EXISTS markdown_edges (
	link_id       UUID PRIMARY_KEY,
	label         VARCHAR,
	from_node_id  UUID,
  	from_node_metadata JSON,
	link_mtadata JSON,
	to_node_id    UUID,
  	to_node_metadata JSON
)`

let create_table_markdown_key_values = `
CREATE TABLE IF NOT EXISTS markdown_key_values (
	id         UUID PRIMARY_KEY,
	note_id    UUID,
	tag        VARCHAR(1024),
	raw_value  TEXT,
	json_value JSON
)`

let create_table_markdown_syntax_trees = `
CREATE TABLE IF NOT EXISTS markdown_syntax_trees (
	id               UUID PRIMARY KEY,
	markdown_id      TEXT,
	syntax_tree      JSON,
	metadata         JSON
)`


let html_rendered_from_markdown = `
CREATE TABLE IF NOT EXISTS html_rendered_from_markdown (
	id               UUID PRIMARY KEY,
	markdown_id      UUID,
	html_content     TEXT,
	metadata         JSON
)`

let urls_extracted_from_markdown = `
CREATE TABLE IF NOT EXISTS urls_extracted_from_nodes (
	markdown_node_id UUID,
  url              TEXT,
  domain           TEXT
)`


const create_schema_queries = [
    create_table_markdown_nodes,
    create_table_markdown_edges,
    create_table_markdown_key_values,
    create_table_markdown_syntax_trees,
    html_rendered_from_markdown,
    urls_extracted_from_markdown
]

export default create_schema_queries;
``` sql

-- SQLite

-- select * from markdown_nodes;

-- SELECT title, full_file_path, id from markdown_nodes where title='index';


-- SELECT to_node_id from markdown_edges where title='index';

-- select * from markdown_nodes where title='index';

-- SELECT * from markdown_nodes where id in (SELECT to_node_id from markdown_edges where title='index') or title = 'index'; 

-- SELECT title, full_file_path, id  from markdown_nodes where id in (SELECT to_node_id from markdown_edges where title='index') or title = 'index'; 

SELECT *  from markdown_nodes where id in (SELECT to_node_id from markdown_edges where title='index') or title = 'index'; 

-- and id = '146656b4-573a-4e42-8f00-239ab29eac3b';

```
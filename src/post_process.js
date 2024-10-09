const fs = require('fs');
const sqlite = require('better-sqlite3');
const sha1 = require('sha1');

// all posts, stored as markdown entries
const postFilesDirectory = './posts';

function markdownFilesInDirectory(pathname) {
    const filename_re = /.*\.md$/;

    const result = fs.readdirSync(pathname, 'utf-8');
    return result
        .filter(filename => filename.match(filename_re) != null);
}

// files table should also handle caching and serving of markdown blobs!
class FilesTable {
    constructor(config) {
        this.db = sqlite(':memory:');
        this.cfg = config; // we're carrying the config, but why?

        config.sql_options.tables.forEach(table_info => {
            FilesTable.create_table(table_info, this.db);
        });

        this.push_directory(config.blog_post_path);

    }

    // We assume that the table_info provided here is
    // consistent with the structure in the config.json file
    static create_table(table_info, db) {
        let query_fields = [];
        table_info.table_schema.forEach(field => {
            query_fields.push(`${field.title} ${field.type}`);
        });

        // TODO: load this into json as well? 
        const query = `CREATE TABLE IF NOT EXISTS ${table_info.table_name} (${query_fields.join(',')});`;
        db.exec(query);
    }

    push_directory(pathname) {
        const file_list = markdownFilesInDirectory(pathname); // this await is probably screwing things for us!
        console.log(file_list);
        file_list.forEach(filename => this.push_file(filename));
        // concatenating paths like this is probably VERY unsafe! TODO
    }

    // TODO: ambiguous naming! this is only for metadata!
    push_file(filename) {
        const insert = this.db.prepare(
            this.cfg.sql_options.access_queries.metadata_insert
        );

        // the path here probably shouldn't be JUST blog_post_path! TODO(?)
        // Although, this method is specifically ONLY for markdown files, so... fine for now?
        const file_date = fs.statSync(
            this.cfg.blog_post_path + '/' + filename
        )
            .mtime
            .toISOString();

        const file_id = sha1(filename + file_date);
        console.log(file_id);

        insert.run({
            id: file_id,
            filename: filename,
            mod_date: file_date
        });
    }

    push_file_header(file_id) {
        const insert = this.db.prepare(
            "INSERT INTO post_preamble (post_hash, post_title, post_specified_date, post_category, post_tags_list) VALUES (@hash, @title, @specified_date, @category, @tags_list);"
        );

        // why the actual fuck am I doing this? SO BAD
        const info = this.get_file_info(file_id);
        const filename = + `${this.cfg.blog_post_path}/${info.filename}`;
    }

    retrieve_all_metadata() {
        return this.db
            .prepare(
                this.cfg.sql_options.access_queries.metadata_retrieve
            )
            .all();
    }

    // TODO: this is ambiguous! It only retrieves file metadata info!
    get_file_info(file_id) {
        const fetch = this.db.prepare(
            this.cfg.sql_options.access_queries.retrieve_file_info
        );
        return fetch.get(file_id);
    }

    get_file_preamble(file_id) {

    }
}

module.exports = {
    FilesTable: FilesTable,
};
